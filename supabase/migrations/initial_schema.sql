-- ---------------------------------------------------------------------------
-- 1. Custom types
-- ---------------------------------------------------------------------------
CREATE TYPE public.user_role AS ENUM ('parent', 'child', 'admin');
CREATE TYPE public.book_status AS ENUM ('reading', 'completed', 'dropped');

-- ---------------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users (id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.profiles (id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'child',
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  pin_hash TEXT,
  xp INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  current_streak INT NOT NULL DEFAULT 0,
  last_read_date DATE,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  mock_days_offset INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profiles_parent_auth_chk CHECK (
    (role IN ('parent', 'admin') AND auth_id IS NOT NULL AND parent_id IS NULL)
    OR (role = 'child' AND auth_id IS NULL AND parent_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX profiles_auth_id_uidx ON public.profiles (auth_id)
  WHERE auth_id IS NOT NULL;
CREATE INDEX profiles_parent_id_idx ON public.profiles (parent_id);

CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  cover_url TEXT NOT NULL DEFAULT 'default-cover.png',
  total_pages INT NOT NULL CHECK (total_pages > 0),
  current_page INT NOT NULL DEFAULT 1 CHECK (current_page >= 1),
  status public.book_status NOT NULL DEFAULT 'reading',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT books_page_bounds_chk CHECK (current_page <= total_pages)
);

CREATE INDEX books_child_id_idx ON public.books (child_id);

CREATE TABLE public.reading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books (id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  duration_minutes INT NOT NULL CHECK (duration_minutes >= 0),
  start_page INT NOT NULL CHECK (start_page >= 1),
  end_page INT NOT NULL CHECK (end_page >= start_page),
  xp_earned INT NOT NULL DEFAULT 0,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX reading_sessions_child_date_idx
  ON public.reading_sessions (child_id, session_date);
CREATE INDEX reading_sessions_book_id_idx ON public.reading_sessions (book_id);

-- ---------------------------------------------------------------------------
-- 3. updated_at + parent profile on signup
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER books_set_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (auth_id, role, display_name)
  VALUES (
    NEW.id,
    'parent',
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'display_name', ''),
      NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
      'Parent'
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 4. RLS helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_parent_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.profiles
  WHERE auth_id = auth.uid()
    AND role IN ('parent', 'admin')
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_own_child(p_child_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles c
    WHERE c.id = p_child_id
      AND c.role = 'child'
      AND c.parent_id = public.current_parent_id()
  );
$$;

REVOKE ALL ON FUNCTION public.current_parent_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_own_child(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_parent_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_own_child(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. RPC: log_reading_session
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_reading_session(
  p_book_id UUID,
  p_child_id UUID,
  p_duration_minutes INT,
  p_end_page INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_book RECORD;
  v_child RECORD;
  v_start_page INT;
  v_pages_read INT;
  v_xp_earned INT := 0;
  v_level_up BOOLEAN := FALSE;
  v_effective_date DATE;
  v_new_level INT;
  v_new_xp INT;
  v_xp_needed INT;
  v_bonus_xp INT := 0;
BEGIN
  IF p_duration_minutes < 0 THEN
    RAISE EXCEPTION 'Duration cannot be negative.';
  END IF;

  IF auth.uid() IS NULL OR NOT public.is_own_child(p_child_id) THEN
    RAISE EXCEPTION 'Book not found or access denied.';
  END IF;

  SELECT * INTO v_book
  FROM public.books
  WHERE id = p_book_id AND child_id = p_child_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Book not found or access denied.';
  END IF;

  SELECT * INTO v_child
  FROM public.profiles
  WHERE id = p_child_id AND role = 'child';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Book not found or access denied.';
  END IF;

  v_start_page := v_book.current_page;

  IF p_end_page < v_start_page THEN
    RAISE EXCEPTION 'New page (%) cannot be less than current page (%).', p_end_page, v_start_page;
  END IF;

  IF p_end_page > v_book.total_pages THEN
    RAISE EXCEPTION 'New page (%) exceeds total book pages (%).', p_end_page, v_book.total_pages;
  END IF;

  v_pages_read := p_end_page - v_start_page;

  IF v_pages_read > 0 THEN
    v_xp_earned := (v_pages_read * 1) + (p_duration_minutes * 5);

    IF p_end_page = v_book.total_pages THEN
      v_bonus_xp := 100;
      v_xp_earned := v_xp_earned + v_bonus_xp;
    END IF;
  END IF;

  v_effective_date :=
    (NOW() AT TIME ZONE COALESCE(v_child.timezone, 'UTC'))::DATE
    + v_child.mock_days_offset;

  INSERT INTO public.reading_sessions (
    book_id, child_id, duration_minutes, start_page, end_page, xp_earned, session_date
  ) VALUES (
    p_book_id, p_child_id, p_duration_minutes, v_start_page, p_end_page, v_xp_earned, v_effective_date
  );

  UPDATE public.books
  SET
    current_page = p_end_page,
    status = CASE
      WHEN p_end_page = total_pages THEN 'completed'::public.book_status
      ELSE status
    END,
    updated_at = NOW()
  WHERE id = p_book_id;

  v_new_xp := v_child.xp + v_xp_earned;
  v_new_level := v_child.level;
  v_xp_needed := v_new_level * 100;

  WHILE v_new_xp >= v_xp_needed LOOP
    v_new_xp := v_new_xp - v_xp_needed;
    v_new_level := v_new_level + 1;
    v_level_up := TRUE;
    v_xp_needed := v_new_level * 100;
  END LOOP;

  IF v_child.last_read_date IS NULL OR v_child.last_read_date < (v_effective_date - 1) THEN
    v_child.current_streak := 1;
  ELSIF v_child.last_read_date = (v_effective_date - 1) THEN
    v_child.current_streak := v_child.current_streak + 1;
  END IF;

  UPDATE public.profiles
  SET
    xp = v_new_xp,
    level = v_new_level,
    current_streak = v_child.current_streak,
    last_read_date = v_effective_date,
    updated_at = NOW()
  WHERE id = p_child_id;

  RETURN jsonb_build_object(
    'success', true,
    'xp_earned', v_xp_earned,
    'pages_read', v_pages_read,
    'level_up', v_level_up,
    'new_level', v_new_level,
    'current_streak', v_child.current_streak,
    'book_completed', (p_end_page = v_book.total_pages)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.log_reading_session(UUID, UUID, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_reading_session(UUID, UUID, INT, INT) TO authenticated;

-- Verification (run as a parent JWT in SQL editor / tests):
-- 1) p_end_page < current_page → exception
-- 2) pages_read > 0, xp = pages + minutes*5; end_page = total_pages → +100 and status completed
-- 3) xp rollover: level N needs N*100; excess stays on the new level
-- 4) last_read_date = effective → streak unchanged; yesterday → +1; gap/NULL → 1

-- ---------------------------------------------------------------------------
-- 6. Aggregate views (RLS via underlying reading_sessions)
-- ---------------------------------------------------------------------------
CREATE VIEW public.reading_stats_daily
WITH (security_invoker = true) AS
SELECT
  child_id,
  session_date,
  SUM(duration_minutes)::INT AS total_minutes,
  SUM(end_page - start_page)::INT AS pages_read,
  SUM(xp_earned)::INT AS total_xp,
  COUNT(*)::INT AS session_count
FROM public.reading_sessions
GROUP BY child_id, session_date;

CREATE VIEW public.reading_stats_weekly
WITH (security_invoker = true) AS
SELECT
  child_id,
  date_trunc('week', session_date)::DATE AS week_start,
  SUM(duration_minutes)::INT AS total_minutes,
  SUM(end_page - start_page)::INT AS pages_read,
  SUM(xp_earned)::INT AS total_xp,
  COUNT(*)::INT AS session_count
FROM public.reading_sessions
GROUP BY child_id, date_trunc('week', session_date);

CREATE VIEW public.reading_stats_monthly
WITH (security_invoker = true) AS
SELECT
  child_id,
  date_trunc('month', session_date)::DATE AS month_start,
  SUM(duration_minutes)::INT AS total_minutes,
  SUM(end_page - start_page)::INT AS pages_read,
  SUM(xp_earned)::INT AS total_xp,
  COUNT(*)::INT AS session_count
FROM public.reading_sessions
GROUP BY child_id, date_trunc('month', session_date);

GRANT SELECT ON public.reading_stats_daily TO authenticated;
GRANT SELECT ON public.reading_stats_weekly TO authenticated;
GRANT SELECT ON public.reading_stats_monthly TO authenticated;

-- ---------------------------------------------------------------------------
-- 7. Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own_family
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    auth_id = auth.uid()
    OR parent_id = public.current_parent_id()
  );

CREATE POLICY profiles_insert_children
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    role = 'child'
    AND auth_id IS NULL
    AND parent_id = public.current_parent_id()
  );

CREATE POLICY profiles_update_own_family
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    id = public.current_parent_id()
    OR parent_id = public.current_parent_id()
  )
  WITH CHECK (
    (
      id = public.current_parent_id()
      AND auth_id = auth.uid()
      AND parent_id IS NULL
      AND role IN ('parent', 'admin')
    )
    OR (
      parent_id = public.current_parent_id()
      AND role = 'child'
      AND auth_id IS NULL
    )
  );

CREATE POLICY profiles_delete_children
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (
    role = 'child'
    AND parent_id = public.current_parent_id()
  );

CREATE POLICY books_select_own_children
  ON public.books
  FOR SELECT
  TO authenticated
  USING (public.is_own_child(child_id));

CREATE POLICY books_insert_own_children
  ON public.books
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_own_child(child_id));

CREATE POLICY books_update_own_children
  ON public.books
  FOR UPDATE
  TO authenticated
  USING (public.is_own_child(child_id))
  WITH CHECK (public.is_own_child(child_id));

CREATE POLICY books_delete_own_children
  ON public.books
  FOR DELETE
  TO authenticated
  USING (public.is_own_child(child_id));

CREATE POLICY reading_sessions_select_own_children
  ON public.reading_sessions
  FOR SELECT
  TO authenticated
  USING (public.is_own_child(child_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.books TO authenticated;
GRANT SELECT ON public.reading_sessions TO authenticated;

-- ---------------------------------------------------------------------------
-- 8. Storage: public book-covers bucket
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('book-covers', 'book-covers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY book_covers_public_read
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'book-covers');

CREATE POLICY book_covers_authenticated_insert
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'book-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY book_covers_authenticated_update
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'book-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'book-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY book_covers_authenticated_delete
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'book-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

Markdown
# Technical Specification & AI Agent Prompt: Supabase Backend

## 1. Context & Architecture Overview
- **Project**: Mobile Application for Tracking Children's Reading Habits.
- **Frontend Tech Stack**: React Native + Expo (TypeScript), Zustand, React Navigation.
- **Backend & Database**: Supabase (PostgreSQL, Row Level Security, RPC Functions, Storage).
- **Core User Model**: 
  - Single **Parent Account** (Auth via Email/Password or OAuth) owning multiple **Child Profiles**.
  - **Parental Zone**: PIN-protected section for analytics, managing child profiles, and settings.
  - **Child Interface**: Simplified profile view with books, active timer, reading logs, and gamification metrics.

---

## 2. Roles & Authorization Logic

### 2.1 Role Definitions
1. **`parent`**: Root account owner (`auth.users`). Can create/manage children, set PIN, and view all stats.
2. **`child`**: Profile owned by a Parent. Logs reading sessions, updates book progress, gains XP, and builds streaks.
3. **`admin`**: System administrator flag for debugging and testing time-dependent mechanics (streaks, analytics) using `mock_days_offset`.

### 2.2 Parent PIN Protection
- A 4-digit hashed PIN (`pin_hash`) is stored in the `profiles` table for the Parent.
- If forgotten, PIN reset requests are verified via OTP or reset links sent to the Parent's email.

---

## 3. PostgreSQL Database Schema

Execute the following DDL in Supabase SQL Editor or a migration file:

```sql
-- 1. Custom Types
CREATE TYPE user_role AS ENUM ('parent', 'child', 'admin');
CREATE TYPE book_status AS ENUM ('reading', 'completed', 'dropped');

-- 2. Profiles Table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NULL, -- NULL for child profiles
  parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NULL, -- Points to parent if role = 'child'
  role user_role NOT NULL DEFAULT 'child',
  display_name TEXT NOT NULL,
  avatar_url TEXT NULL,
  pin_hash TEXT NULL, -- Hashed PIN for parent zone access
  xp INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  current_streak INT NOT NULL DEFAULT 0,
  last_read_date DATE NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  mock_days_offset INT NOT NULL DEFAULT 0, -- Admin testing offset
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Books Table
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT NULL,
  cover_url TEXT NOT NULL DEFAULT 'https://<PROJECT-REF>.supabase.co/storage/v1/object/public/book-covers/default-cover.png',
  total_pages INT NOT NULL CHECK (total_pages > 0),
  current_page INT NOT NULL DEFAULT 1 CHECK (current_page >= 1),
  status book_status NOT NULL DEFAULT 'reading',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Reading Sessions Table
CREATE TABLE public.reading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  duration_minutes INT NOT NULL CHECK (duration_minutes >= 0),
  start_page INT NOT NULL CHECK (start_page >= 1),
  end_page INT NOT NULL CHECK (end_page >= start_page),
  xp_earned INT NOT NULL DEFAULT 0,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
4. Gamification Engine & Business Logic Rules
4.1 XP Calculation Formulas
Page Progress: 1 Page = 1 XP

Reading Duration: 1 Minute = 5 XP

Page Progression Rule: Reading progress of at least 1 page is mandatory (end_page > start_page). If end_page == start_page, xp_earned = 0.

Book Completion Bonus: Reaching end_page == total_pages awards an additional +100 XP bonus.

Dynamic Level-Up Formula:

XP Required for Next Level = Current Level * 100

Excess XP rolls over into the new level.

4.2 Streak Mechanics & Date Handling
Effective Date Calculation:
Effective Date = (NOW() AT TIME ZONE child_timezone)::DATE + mock_days_offset

Streak Calculation Matrix:

last_read_date == Effective Date: Streak unchanged.

last_read_date == Effective Date - 1: current_streak = current_streak + 1.

last_read_date < Effective Date - 1 or NULL: Reset current_streak = 1.

5. Atomic RPC Function: log_reading_session
Create this function to process reading logs safely in a single transaction:

SQL
CREATE OR REPLACE FUNCTION public.log_reading_session(
  p_book_id UUID,
  p_child_id UUID,
  p_duration_minutes INT,
  p_end_page INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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
  -- 1. Validate Book & Child Existance
  SELECT * INTO v_book FROM public.books WHERE id = p_book_id AND child_id = p_child_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Book not found or access denied.';
  END IF;

  SELECT * INTO v_child FROM public.profiles WHERE id = p_child_id;
  
  -- 2. Page Number Validations
  v_start_page := v_book.current_page;
  IF p_end_page < v_start_page THEN
    RAISE EXCEPTION 'New page (%) cannot be less than current page (%).', p_end_page, v_start_page;
  END IF;

  IF p_end_page > v_book.total_pages THEN
    RAISE EXCEPTION 'New page (%) exceeds total book pages (%).', p_end_page, v_book.total_pages;
  END IF;

  v_pages_read := p_end_page - v_start_page;

  -- 3. Calculate XP (Only if pages were read)
  IF v_pages_read > 0 THEN
    v_xp_earned := (v_pages_read * 1) + (p_duration_minutes * 5);
    
    -- Completion Bonus
    IF p_end_page = v_book.total_pages THEN
      v_bonus_xp := 100;
      v_xp_earned := v_xp_earned + v_bonus_xp;
    END IF;
  END IF;

  -- 4. Determine Effective Date with Admin Mock Offset
  v_effective_date := (NOW() AT TIME ZONE COALESCE(v_child.timezone, 'UTC'))::DATE + v_child.mock_days_offset;

  -- 5. Insert Reading Session Record
  INSERT INTO public.reading_sessions (
    book_id, child_id, duration_minutes, start_page, end_page, xp_earned, session_date
  ) VALUES (
    p_book_id, p_child_id, p_duration_minutes, v_start_page, p_end_page, v_xp_earned, v_effective_date
  );

  -- 6. Update Book Progress
  UPDATE public.books
  SET 
    current_page = p_end_page,
    status = CASE WHEN p_end_page = total_pages THEN 'completed'::book_status ELSE status END,
    updated_at = NOW()
  WHERE id = p_book_id;

  -- 7. Level & XP Progression
  v_new_xp := v_child.xp + v_xp_earned;
  v_new_level := v_child.level;
  v_xp_needed := v_new_level * 100;

  WHILE v_new_xp >= v_xp_needed LOOP
    v_new_xp := v_new_xp - v_xp_needed;
    v_new_level := v_new_level + 1;
    v_level_up := TRUE;
    v_xp_needed := v_new_level * 100;
  END LOOP;

  -- 8. Streak Recalculation
  IF v_child.last_read_date IS NULL OR v_child.last_read_date < (v_effective_date - 1) THEN
    v_child.current_streak := 1;
  ELSIF v_child.last_read_date = (v_effective_date - 1) THEN
    v_child.current_streak := v_child.current_streak + 1;
  END IF;

  -- 9. Update Child Profile Data
  UPDATE public.profiles
  SET 
    xp = v_new_xp,
    level = v_new_level,
    current_streak = v_child.current_streak,
    last_read_date = v_effective_date,
    updated_at = NOW()
  WHERE id = p_child_id;

  -- 10. Return Response for Frontend Animations
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
6. Row Level Security (RLS) & Storage Config
6.1 Row Level Security Policies
Enable RLS on profiles, books, and reading_sessions.

Profiles: Parents can read/write their profile and child profiles where parent_id = parent_profile.id. Admins bypass RLS.

Books & Sessions: Access granted if child_id belongs to a profile owned by auth.uid().

6.2 Supabase Storage Bucket
Bucket Name: book-covers (Public access enabled).

Default Asset: Store a default-cover.png placeholder image in the root bucket.

7. AI Agent Execution Plan
Instructions for AI Agent: Follow this exact sequence when implementing the backend:

Step 1: Database Setup

Execute the SQL Schema in supabase/migrations/001_initial_schema.sql.

Apply table structures, foreign keys, and indexes.

Step 2: RPC & Function Implementation

Add log_reading_session to migrations.

Create SQL views for aggregated reading statistics (daily, weekly, monthly totals).

Step 3: Security & Storage

Apply RLS policies for parent and child row isolation.

Configure the public book-covers storage bucket and file upload permissions.

Step 4: Type Generation & Verification

Run supabase gen types typescript --local to build types (database.types.ts).

Run verification tests for edge cases: level-up handling, streak resets, and invalid page entries.
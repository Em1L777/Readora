import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { useBooksStore } from '../../store/useBooksStore';
import { ChildProfile } from '../../types/models';
import { COLORS, SHADOWS } from '../../constants/theme';

export const ChildSelectionScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { children, selectChild, signOut } = useAuthStore();
  const [loadingChildId, setLoadingChildId] = React.useState<string | null>(null);

  const handleSelectChild = async (childId: string) => {
    try {
      setLoadingChildId(childId);
      await selectChild(childId);
      useBooksStore.getState().fetchBooks(childId);
    } catch (err) {
      console.error('Error selecting child profile:', err);
    } finally {
      setLoadingChildId(null);
    }
  };

  const handleAddChild = () => {
    navigation.navigate('CreateChild', { isFirstChild: children.length === 0 });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={[
          styles.content,
          { paddingTop: Platform.OS === 'android' ? insets.top + 16 : 16 },
        ]}
      >
        {/* Header Branding */}
        <View style={styles.headerRow}>
          <View style={styles.brandContainer}>
            <Image
              source={require('../../../assets/images/mascot/fox.png')}
              style={styles.logoMascot}
            />
            <Text style={styles.brandTitle}>Readora</Text>
          </View>

          <TouchableOpacity onPress={() => signOut()} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Who's reading today?</Text>
          <Text style={styles.subtitle}>
            Select your profile to start tracking your reading adventure!
          </Text>
        </View>

        {/* Children Grid / List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollList}
        >
          <View style={styles.grid}>
            {children.map((child: ChildProfile) => (
              <TouchableOpacity
                key={child.id}
                style={styles.childCard}
                onPress={() => handleSelectChild(child.id)}
                activeOpacity={0.8}
              >
                <View style={styles.avatarWrapper}>
                  {child.avatar_url ? (
                    <Image source={{ uri: child.avatar_url }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitial}>
                        {child.display_name ? child.display_name[0].toUpperCase() : '🧒'}
                      </Text>
                    </View>
                  )}
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelBadgeText}>Lvl {child.level || 1}</Text>
                  </View>
                </View>

                <Text style={styles.childName} numberOfLines={1}>
                  {child.display_name}
                </Text>

                <View style={styles.streakRow}>
                  <Text style={styles.streakText}>
                    🔥 {child.current_streak || 0} day streak
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Add Child Card */}
            <TouchableOpacity
              style={styles.addChildCard}
              onPress={handleAddChild}
              activeOpacity={0.8}
            >
              <View style={styles.addAvatarPlaceholder}>
                <Text style={styles.addIcon}>＋</Text>
              </View>
              <Text style={styles.addChildText}>Add Child</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoMascot: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
    marginRight: 8,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  signOutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.gray200,
  },
  signOutText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  titleContainer: {
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  scrollList: {
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  childCard: {
    width: '47%',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.small,
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    backgroundColor: COLORS.primaryYellow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    backgroundColor: COLORS.badgeBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'center',
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.white,
  },
  childName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 4,
    textAlign: 'center',
  },
  streakRow: {
    backgroundColor: COLORS.streakBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.streakText,
  },
  addChildCard: {
    width: '47%',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.inputBorder,
    borderStyle: 'dashed',
    minHeight: 170,
  },
  addAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.progressCardBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  addIcon: {
    fontSize: 28,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  addChildText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textLight,
  },
});

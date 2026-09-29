import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types/navigation';
import { HomeScreen } from '../screens/home/HomeScreen';
import { LibraryScreen } from '../screens/library/LibraryScreen';
import { ParentScreen } from '../screens/parent/ParentScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { COLORS } from '../constants/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primaryYellow,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ color }) => {
          let iconSource;
          if (route.name === 'Home') {
            iconSource = require('../../assets/images/icons/home.png');
          } else if (route.name === 'Library') {
            iconSource = require('../../assets/images/icons/library.png');
          } else if (route.name === 'Parent') {
            iconSource = require('../../assets/images/icons/parent.png');
          } else if (route.name === 'Profile') {
            iconSource = require('../../assets/images/icons/profile.png');
          }

          return (
            <Image
              source={iconSource}
              style={[styles.icon, { tintColor: color }]}
              resizeMode="contain"
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{ tabBarLabel: 'Library' }}
      />
      <Tab.Screen
        name="Parent"
        component={ParentScreen}
        options={{ tabBarLabel: 'Parent' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    height: 85,
    paddingBottom: 25,
    paddingTop: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  icon: {
    width: 26,
    height: 26,
  },
});
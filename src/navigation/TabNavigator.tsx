import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';

// Импорт экранов
import { HomeScreen } from '../screens/home/HomeScreen';
import { LibraryScreen } from '../screens/library/LibraryScreen';
import { ParentScreen } from '../screens/parent/ParentScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

// Импорт темы
import { COLORS } from '../constants/theme';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false, // Отключаем верхний системный хедер
          tabBarActiveTintColor: COLORS.primaryYellow || '#E06D53', // Coral цвет для активной вкладки
          tabBarInactiveTintColor: COLORS.textLight || '#9BA4B5',     // Серый для неактивной
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarIcon: ({ focused, color }) => {
            // ПЛЕЙСХОЛДЕРЫ: Пока у тебя нет картинок, используем эмодзи.
            // КАК ЗАГРУЗИТЬ СВОИ ФОТО:
            // 1. Удали блок `switch` с эмодзи ниже.
            // 2. Раскомментируй блок кода с `<Image />`.
            // 3. Замени пути в `require()` на свои картинки.

           

            
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
                style={[styles.icon, { tintColor: color }]} // tintColor перекрашивает иконку в активный/неактивный цвет
                resizeMode="contain"
              />
            );
            
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Library" component={LibraryScreen} />
        <Tab.Screen name="Parent" component={ParentScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    height: 85, // Делаем панель чуть выше для комфортного нажатия (Bento style)
    paddingBottom: 25, // Отступ снизу для безопасной зоны на iPhone
    paddingTop: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 28,
    height: 28,
  }
});
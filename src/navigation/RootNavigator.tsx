import React, { useEffect } from 'react';
import { View, ActivityIndicator, Image, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { AuthNavigator } from './AuthNavigator';
import { TabNavigator } from './TabNavigator';
import { CreateChildScreen } from '../screens/parent/CreateChildScreen';
import { ChildSelectionScreen } from '../screens/auth/ChildSelectionScreen';
import { ReadingTimerScreen } from '../screens/timer/ReadingTimerScreen';
import { useAuthStore } from '../store/useAuthStore';
import { COLORS } from '../constants/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { session, children, isChildSelected, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Image
          source={require('../../assets/images/mascot/fox.png')}
          style={styles.loadingLogo}
        />
        <Text style={styles.loadingTitle}>Readora</Text>
        <ActivityIndicator size="large" color={COLORS.primaryYellow} style={styles.spinner} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : children.length === 0 ? (
          <Stack.Screen
            name="CreateChild"
            component={CreateChildScreen}
            initialParams={{ isFirstChild: true }}
          />
        ) : !isChildSelected ? (
          <>
            <Stack.Screen name="SelectChild" component={ChildSelectionScreen} />
            <Stack.Screen
              name="CreateChild"
              component={CreateChildScreen}
              options={{ presentation: 'modal' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen
              name="CreateChild"
              component={CreateChildScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="ReadingTimer"
              component={ReadingTimerScreen}
              options={{
                presentation: 'fullScreenModal',
                animation: 'slide_from_bottom',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLogo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 24,
  },
  spinner: {
    marginTop: 8,
  },
});

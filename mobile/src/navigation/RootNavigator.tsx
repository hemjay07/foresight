import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../providers/AuthProvider';
import AuthScreen from '../screens/AuthScreen';
import ContestDetailScreen from '../screens/ContestDetailScreen';
import DraftScreen from '../screens/DraftScreen';
import SKRScreen from '../screens/SKRScreen';
import { MainTabNavigator } from './MainTabNavigator';
import { colors } from '../constants/colors';

export type RootStackParamList = {
  Main: undefined;
  Auth: undefined;
  ContestDetail: { contestId: string; justEntered?: boolean };
  Draft: { contestId: string };
  SKR: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const DarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.brand,
    background: colors.background,
    card: colors.card,
    text: colors.text,
    border: colors.cardBorder,
    notification: colors.brand,
  },
};

export function RootNavigator() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={DarkTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="ContestDetail"
          component={ContestDetailScreen}
          options={{
            headerShown: true,
            title: 'Contest',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '700', fontSize: 17 },
          }}
        />
        <Stack.Screen
          name="Draft"
          component={DraftScreen}
          options={{
            headerShown: true,
            title: 'Draft Your Team',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '700', fontSize: 17 },
          }}
        />
        <Stack.Screen
          name="SKR"
          component={SKRScreen}
          options={{
            headerShown: true,
            title: 'SKR Token',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '700', fontSize: 17 },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

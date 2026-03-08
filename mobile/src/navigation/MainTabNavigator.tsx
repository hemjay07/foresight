import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../constants/colors';
import { haptics } from '../utils/haptics';
import { useActiveContests } from '../hooks/useContests';
import HomeScreen from '../screens/HomeScreen';
import CompeteScreen from '../screens/CompeteScreen';
import FeedScreen from '../screens/FeedScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type MainTabParamList = {
  Home: undefined;
  Compete: undefined;
  Feed: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 8);
  const { data: contests } = useActiveContests();
  const liveCount = contests?.filter((c) => c.status === 'active' || c.status === 'live').length ?? 0;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.cardBorder,
          borderTopWidth: 1,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          height: 56 + bottomPadding,
        },
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
        listeners={{ tabPress: () => haptics.selection() }}
      />
      <Tab.Screen
        name="Compete"
        component={CompeteScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="trophy" size={size} color={color} />
          ),
          tabBarBadge: liveCount > 0 ? liveCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.success, fontSize: 10, minWidth: 16, height: 16, lineHeight: 14 },
        }}
        listeners={{ tabPress: () => haptics.selection() }}
      />
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="newspaper-variant" size={size} color={color} />
          ),
        }}
        listeners={{ tabPress: () => haptics.selection() }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
        listeners={{ tabPress: () => haptics.selection() }}
      />
    </Tab.Navigator>
  );
}

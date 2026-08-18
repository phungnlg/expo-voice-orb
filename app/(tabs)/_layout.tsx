import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { color, font } from '../../src/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: color.surface,
          borderTopColor: color.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: color.accentDark,
        tabBarInactiveTintColor: color.text2,
        tabBarLabelStyle: { fontFamily: font.bodyMedium, fontSize: 11 },
        sceneStyle: { backgroundColor: color.bg },
      }}
    >
      <Tabs.Screen
        name="orb"
        options={{
          title: 'Orb',
          tabBarIcon: ({ color: c, size }) => (
            <MaterialCommunityIcons name="radiobox-marked" size={size} color={c} />
          ),
        }}
      />
      <Tabs.Screen
        name="lab"
        options={{
          title: 'Lab',
          tabBarIcon: ({ color: c, size }) => (
            <MaterialCommunityIcons name="tune-variant" size={size} color={c} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color: c, size }) => (
            <MaterialCommunityIcons name="cog-outline" size={size} color={c} />
          ),
        }}
      />
    </Tabs>
  );
}

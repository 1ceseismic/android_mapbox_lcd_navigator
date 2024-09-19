import React from "react";
import { View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { Colors } from "@/constants/Colors";
import useColorScheme from "@/hooks/useColorScheme";
import { TabBarIcon, IconLibrary } from "@/components/navigation/TabBarIcon";

import HomeScreen from "./index";
import DirectionsScreen from "./directions";
import { Stack } from "expo-router";

const Tab = createBottomTabNavigator();

function SwipeableDirectionsScreen({ navigation }) {
  const panGesture = Gesture.Pan().onEnd(
    (event: { velocityX: number; translationX: number }) => {
      if (event.velocityX > 500 || event.translationX > 100) {
        navigation.navigate("Home");
      }
    }
  );

  return (
    <GestureDetector gesture={panGesture}>
      <View style={{ flex: 1 }}>
        <DirectionsScreen />
      </View>
    </GestureDetector>
  );
}

function TabLayout() {
  const { colorScheme } = useColorScheme();
  const currentColors = Colors[colorScheme];

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: currentColors.tint,
          tabBarInactiveTintColor: currentColors.tabIconDefault,
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Directions" component={SwipeableDirectionsScreen} />
      </Tab.Navigator>
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <TabLayout />
    </GestureHandlerRootView>
  );
}

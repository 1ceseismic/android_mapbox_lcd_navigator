import React, { useEffect, useState } from "react";
import { Stack, Slot } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import useColorScheme from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";

const RootLayout = () => {
  const { colorScheme } = useColorScheme();
  const currentColors = Colors[colorScheme];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{
            headerTransparent: true,
            headerShown: false,
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
};
export default RootLayout;

import React from "react";
import { View, type ViewProps } from "react-native";
import { useColorScheme } from "react-native";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ThemedViewProps) {
  const colorScheme = useColorScheme(); // Directly use useColorScheme here
  const backgroundColor = colorScheme === "dark" ? darkColor : lightColor;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}

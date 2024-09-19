import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

import { type IconProps } from "@expo/vector-icons/build/createIconSet";

// Define a type for possible icon libraries
export type IconLibrary =
  | "Ionicons"
  | "MaterialCommunityIcons"
  | "MaterialIcons"
  | "FontAwesome6";

type IoniconsIconName = keyof typeof Ionicons;
type MaterialCommunityIconsIconName = keyof typeof MaterialCommunityIcons;
type mat_icons_iconName = keyof typeof MaterialIcons;

interface TabBarIconProps {
  iconLibrary?: IconLibrary;
  name: string;
  size?: number;
  color?: string;
  style?: object;
}

const iconLibraries = {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  FontAwesome6,
};

export function TabBarIcon({
  iconLibrary = "Ionicons",
  name,
  size = 28,
  color,
  style,
  ...rest
}: TabBarIconProps) {
  const IconComponent = iconLibraries[iconLibrary];

  if (!IconComponent) {
    console.warn(`Icon library ${iconLibrary} not found`);
    return null;
  }

  // Determine the correct name type based on the library
  const isValidName = (
    name: string
  ): name is
    | IoniconsIconName
    | MaterialCommunityIconsIconName
    | mat_icons_iconName => {
    return name in IconComponent.glyphMap;
  };

  if (!isValidName(name)) {
    console.warn(`Icon name ${name} is not valid for ${iconLibrary}`);
    return null;
  }

  return (
    <IconComponent
      size={size}
      color={color}
      style={[{ marginBottom: -3 }, style]}
      name={name as any}
      {...rest}
    />
  );
}

import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { BlurView } from "expo-blur";
import Ionicons from "react-native-vector-icons/Ionicons";
import useColorScheme from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";

const Blur = () => {
  const { colorScheme } = useColorScheme();
  const currentColors = Colors[colorScheme];

  return (
    <BlurView
      style={styles.container}
      intensity={0}
      tint="dark"
      experimentalBlurMethod="dimezisBlurView"
    >
      <View style={styles.bottomContainer}>
        <Image
          source={require("../assets/images/logo.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
  },
  container: {
    paddingLeft: 0,
    width: "15%",
    marginHorizontal: 5,
  },
  bottomContainer: {
    width: "90%",
    alignItems: "flex-end",
    marginLeft: 100,
  },
  logoImage: {
    height: 40,
    // Adjust this value based on your image's aspect ratio
  },
});

export default Blur;

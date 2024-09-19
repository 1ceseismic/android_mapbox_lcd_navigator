import { View, StyleSheet } from "react-native";
import { Button, IconButton, Menu, Provider } from "react-native-paper";
import { Icon } from "react-native-elements";

import { useNavigation } from "@react-navigation/native";
import Directions from "@/app/(tabs)/directions";

interface Props {
  isDark: boolean;
  hasDirections: boolean;
}
const directionBtn: React.FC<Props> = ({ isDark, hasDirections }) => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.buttonWrapper}>
        <IconButton
          style={styles.button}
          icon={({ size }) => (
            <Icon
              name={
                isDark ? "comment-arrow-right-outline" : "comment-arrow-right"
              }
              size={size}
              color={isDark ? "white" : "black"}
              type={"material-community"}
            />
          )}
          mode="contained-tonal"
          iconColor={isDark ? "#000000" : "#fff"}
          containerColor={isDark ? "#151718" : "#fff1e0"}
          size={24}
          animated={true}
          onPress={() => navigation.navigate("Directions" as never)}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingRight: 0,
    marginRight: 10,
  },
  buttonWrapper: {
    alignSelf: "flex-end",
    width: "200%",
  },
  button: {
    paddingHorizontal: 10,
    width: "100%",
  },
});

export default directionBtn;

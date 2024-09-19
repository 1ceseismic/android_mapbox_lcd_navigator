import { View, StyleSheet} from "react-native";
import { Button, IconButton, Menu, Provider } from "react-native-paper";

import useColorScheme from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { Icon } from "react-native-elements";


interface Props{
    isDark: boolean;
    toggleColorScheme: any;
    currentColors: any;
}
const themeButton: React.FC<Props> = ({ isDark, toggleColorScheme, currentColors }) => {

    return (
        <View style={styles.container}>
          <View style={styles.buttonWrapper}>
            <IconButton style={styles.button}
              icon={({ size, color }) => (
                        <Icon
                            name={isDark ? 'lightbulb-spot': 'lightbulb-spot-off'} size={size} color={color}
                            type={"material-community"}
                        />
              )}
              mode="contained-tonal"
              onPress={toggleColorScheme}
              iconColor={currentColors.opposite}
              containerColor={isDark ?currentColors.background : currentColors.tint}
              size={24}
              animated={true}
              
            />
          </View>
        </View>
      );
    };
    
    
    const styles = StyleSheet.create({
      container: {
        flex: 1,
      },
        buttonWrapper: {
        
      },
        button: {
        width: '50%'
      },
    });


export default themeButton;


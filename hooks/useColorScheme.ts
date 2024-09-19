import { useColorScheme as _useColorScheme } from "react-native";
import { useState, useEffect } from "react";

const useColorScheme = () => {
  const systemColorScheme = _useColorScheme();
  const [colorScheme, setColorScheme] = useState<"light" | "dark">(
    systemColorScheme === "light" || systemColorScheme === "dark"
      ? systemColorScheme
      : "light" // Default value if systemColorScheme is undefined
  );

  useEffect(() => {
    setColorScheme(
      systemColorScheme === "light" || systemColorScheme === "dark"
        ? systemColorScheme
        : "light"
    ); // Ensure we only set 'light' or 'dark'
  }, [systemColorScheme]);

  const toggleColorScheme = () => {
    setColorScheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return { colorScheme, toggleColorScheme };
}
export default useColorScheme;


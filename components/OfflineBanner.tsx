import { Animated, StyleSheet, Text, useEffect, useRef } from "react-native";
import { useNetworkStatus } from "../utils/useNetworkStatus";

export default function OfflineBanner() {
  const isOnline = useNetworkStatus();
  const slideAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOnline ? -50 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOnline]);

  return (
    <Animated.View
      style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}
    >
      <Text style={styles.text}>⚠️ You're offline — changes will sync when reconnected</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#92400e",
    paddingVertical: 10,
    paddingHorizontal: 16,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  text: {
    color: "#fef3c7",
    fontWeight: "700",
    fontSize: 13,
    textAlign: "center",
  },
});
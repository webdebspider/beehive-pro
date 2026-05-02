/**
 * OfflineBanner.tsx
 *
 * Floating amber banner that slides in from the top when offline.
 * Position is absolute so it overlays without pushing layout down.
 * Uses Animated for smooth slide in/out.
 */

import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { T } from "../utils/theme";
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
      <Text style={styles.text}>
        ⚠️ You're offline — changes will sync when reconnected
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: T.warningBg,
    paddingVertical: 10,
    paddingHorizontal: T.spaceMD,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    borderBottomWidth: 1,
    borderBottomColor: T.warning,
  },
  text: {
    color: T.honeyLight,
    fontWeight: "700",
    fontSize: T.fontXS,
    textAlign: "center",
  },
});
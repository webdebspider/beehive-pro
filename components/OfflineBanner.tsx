/**
 * OfflineBanner.tsx
 *
 * A floating banner that slides down from the top of the screen when the
 * device loses internet connectivity, and slides back up when it reconnects.
 *
 * Uses an Animated.Value for smooth slide in/out transitions.
 * Position is absolute so it overlays content without pushing layout down.
 *
 * Usage: Drop <OfflineBanner /> just inside any <SafeAreaView> on screens
 * where offline status matters (hive list, hive detail, inspection screens).
 *
 * Depends on:
 *  - utils/useNetworkStatus.ts (for live connectivity state)
 */

import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { useNetworkStatus } from "../utils/useNetworkStatus";

export default function OfflineBanner() {
  const isOnline = useNetworkStatus();

  // Start offscreen above the top (-50px) so it's hidden when online
  const slideAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    // Slide down to 0 when offline, slide back up to -50 when online
    Animated.timing(slideAnim, {
      toValue: isOnline ? -50 : 0,
      duration: 300,
      useNativeDriver: true, // Uses GPU for smoother animation
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
    backgroundColor: "#92400e", // Amber/warning brown
    paddingVertical: 10,
    paddingHorizontal: 16,
    position: "absolute", // Overlays content, doesn't push layout
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999, // Always on top of other content
  },
  text: {
    color: "#fef3c7",
    fontWeight: "700",
    fontSize: 13,
    textAlign: "center",
  },
});
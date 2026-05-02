/**
 * components/OfflineBanner.tsx
 *
 * Floating amber banner that slides in from the top when offline.
 * Responds to global theme settings.
 */

import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { useAppTheme } from "../hooks/useAppTheme";
import { useNetworkStatus } from "../utils/useNetworkStatus";

export default function OfflineBanner() {
  const isOnline = useNetworkStatus();
  const theme = useAppTheme();
  const slideAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOnline ? -50 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOnline]);

  return (
    <Animated.View style={[
      StyleSheet.create({ banner: {
        backgroundColor: theme.warningBg,
        paddingVertical: 10,
        paddingHorizontal: theme.spaceMD,
        position: "absolute",
        top: 0, left: 0, right: 0,
        zIndex: 999,
        borderBottomWidth: 1,
        borderBottomColor: theme.warning,
      }}).banner,
      { transform: [{ translateY: slideAnim }] }
    ]}>
      <Text style={{
        color: theme.honeyLight,
        fontWeight: "700",
        fontSize: theme.fontXS,
        textAlign: "center",
      }}>
        ⚠️ You're offline — changes will sync when reconnected
      </Text>
    </Animated.View>
  );
}
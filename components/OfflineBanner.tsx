/**
 * components/OfflineBanner.tsx
 *
 * Floating status banner that slides in from the top.
 * Shows different states depending on sync status:
 *
 *  📵 Offline          — no connection, N photos pending
 *  🔄 Syncing...       — back online, uploading queued photos
 *  ✅ Synced           — all uploads complete (fades after 4s)
 *  ⚠️ Sync error       — some uploads failed, will retry
 *  (hidden)            — online with nothing pending
 *
 * Responds to global theme settings.
 */

import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../hooks/useAppTheme";
import { useSyncQueue } from "../utils/useSyncQueue";

export default function OfflineBanner() {
  const theme = useAppTheme();
  const { isOnline, status, pendingCount, syncedCount, triggerSync } = useSyncQueue();
  const slideAnim = useRef(new Animated.Value(-56)).current;

  const shouldShow =
    !isOnline ||
    status === "syncing" ||
    status === "done" ||
    status === "error" ||
    pendingCount > 0;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: shouldShow ? 0 : -56,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [shouldShow]);

  const getBannerContent = () => {
    if (status === "syncing") {
      return {
        bg: theme.bgCardAlt,
        border: theme.honey,
        text: `🔄 Syncing photos${pendingCount > 0 ? ` — ${pendingCount} remaining` : "..."}`,
        color: theme.honey,
        showRetry: false,
      };
    }
    if (status === "done") {
      return {
        bg: theme.bgCardAlt,
        border: theme.green,
        text: `✅ ${syncedCount} photo${syncedCount === 1 ? "" : "s"} synced successfully`,
        color: theme.greenLight,
        showRetry: false,
      };
    }
    if (status === "error") {
      return {
        bg: theme.dangerBg,
        border: theme.danger,
        text: `⚠️ Some photos failed to sync`,
        color: "#fca5a5",
        showRetry: true,
      };
    }
    if (!isOnline) {
      return {
        bg: theme.warningBg,
        border: theme.warning,
        text: pendingCount > 0
          ? `📵 Offline — ${pendingCount} photo${pendingCount === 1 ? "" : "s"} waiting to sync`
          : "📵 You're offline — changes will sync when reconnected",
        color: theme.honeyLight,
        showRetry: false,
      };
    }
    if (pendingCount > 0) {
      return {
        bg: theme.warningBg,
        border: theme.warning,
        text: `⏳ ${pendingCount} photo${pendingCount === 1 ? "" : "s"} waiting to sync`,
        color: theme.honeyLight,
        showRetry: true,
      };
    }
    return null;
  };

  const content = getBannerContent();
  if (!content) return null;

  const S = makeStyles(theme);

  return (
    <Animated.View
      style={[
        S.banner,
        { backgroundColor: content.bg, borderBottomColor: content.border },
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={S.row}>
        <Text style={[S.text, { color: content.color }]}>{content.text}</Text>
        {content.showRetry && isOnline && (
          <Pressable onPress={triggerSync} style={S.retryButton}>
            <Text style={S.retryText}>Retry</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

function makeStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    banner: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 999,
      paddingVertical: 10,
      paddingHorizontal: theme.spaceMD,
      borderBottomWidth: 1,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    text: {
      flex: 1,
      fontWeight: "700",
      fontSize: theme.fontXS,
      textAlign: "center",
    },
    retryButton: {
      backgroundColor: theme.bgCard,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: theme.radiusSM,
      borderWidth: 1,
      borderColor: theme.border,
      marginLeft: 10,
    },
    retryText: {
      color: theme.textSecondary,
      fontSize: theme.fontXS,
      fontWeight: "800",
    },
  });
}

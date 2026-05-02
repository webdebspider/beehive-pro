/**
 * useNetworkStatus.ts
 *
 * Custom React hook that monitors the device's network connectivity.
 * Returns a boolean: true = online, false = offline.
 *
 * Used by:
 *  - OfflineBanner.tsx (to show/hide the offline warning banner)
 *  - Any screen that needs to conditionally block actions when offline
 *
 * Relies on @react-native-community/netinfo for cross-platform network detection.
 */

import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

export function useNetworkStatus() {
  // Default to true (online) until we hear otherwise from NetInfo
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Subscribe to network state changes
    // This fires immediately with current state, then on every change
    const unsubscribe = NetInfo.addEventListener((state) => {
      // Both isConnected AND isInternetReachable must be true to be considered online
      // isConnected alone can be true on wifi with no actual internet
      setIsOnline(!!state.isConnected && !!state.isInternetReachable);
    });

    // Cleanup: remove listener when component using this hook unmounts
    return () => unsubscribe();
  }, []);

  return isOnline;
}
/**
 * app/hive/forage-map.tsx
 *
 * Forage Map Screen — displays all logged forage entries as pins on a map.
 * Tap a pin to see a summary. Log new entry from the FAB button.
 *
 * Android note: requires a Google Maps API key in app.json:
 *   "android": { "config": { "googleMaps": { "apiKey": "YOUR_KEY_HERE" } } }
 * iOS works without a key.
 */

import { useRouter } from "expo-router";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Callout, Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import NavBar from "../../components/NavBar";
import { useAuthContext } from "../../context/AuthContext";
import { useAppTheme } from "../../hooks/useAppTheme";
import { db } from "../../utils/firebase";

type ForageEntry = {
  id: string;
  hiveId?: string;
  location?: { latitude: number; longitude: number };
  locationName?: string;
  plants: string[];
  customPlants?: string;
  weather: string;
  temperature?: string;
  notes?: string;
  date: string;
};

const WEATHER_LABELS: Record<string, string> = {
  sunny: "☀️ Sunny",
  partly_cloudy: "⛅ Partly Cloudy",
  overcast: "☁️ Overcast",
  rainy: "🌧️ Rainy",
  windy: "💨 Windy",
  stormy: "🌩️ Stormy",
};

export default function ForageMapScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { user } = useAuthContext();
  const [entries, setEntries] = useState<ForageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ForageEntry | null>(null);

  useEffect(() => { loadEntries(); }, [user]);

  const loadEntries = async () => {
    if (!user) return;
    try {
      const snap = await getDocs(
        query(
          collection(db, "forage"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        )
      );
      const list: ForageEntry[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ForageEntry, "id">),
      }));
      setEntries(list);
    } catch (e) {
      console.log("FORAGE LOAD ERROR:", e);
    } finally {
      setLoading(false);
    }
  };

  const mappableEntries = entries.filter((e) => e.location);

  const initialRegion = mappableEntries.length > 0
    ? {
        latitude: mappableEntries[0].location!.latitude,
        longitude: mappableEntries[0].location!.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : {
        latitude: 37.7749,
        longitude: -96.0,
        latitudeDelta: 30,
        longitudeDelta: 30,
      };

  const S = makeStyles(theme);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={theme.honey} size="large" />
        <Text style={{ color: theme.textSecondary, marginTop: 12 }}>Loading forage map...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={S.page}>
      <NavBar />

      <View style={S.mapContainer}>
        {Platform.OS !== "web" ? (
          <MapView
            style={S.map}
            initialRegion={initialRegion}
            onPress={() => setSelected(null)}
          >
            {mappableEntries.map((entry) => (
              <Marker
                key={entry.id}
                coordinate={entry.location!}
                onPress={() => setSelected(entry)}
                pinColor={theme.honey}
              >
                <View style={S.pin}>
                  <Text style={S.pinEmoji}>🌿</Text>
                </View>
                <Callout tooltip>
                  <View style={S.callout}>
                    <Text style={S.calloutTitle}>
                      {entry.locationName || "Forage Entry"}
                    </Text>
                    <Text style={S.calloutText}>
                      {entry.plants.slice(0, 2).join(", ")}
                      {entry.plants.length > 2 ? ` +${entry.plants.length - 2} more` : ""}
                    </Text>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>
        ) : (
          <View style={S.webFallback}>
            <Text style={S.webFallbackEmoji}>🗺️</Text>
            <Text style={S.webFallbackText}>Map view available on iOS and Android</Text>
          </View>
        )}

        {/* FAB — Log New */}
        <Pressable
          style={S.fab}
          onPress={() => router.push("/hive/forage-log")}
        >
          <Text style={S.fabText}>+ Log Forage</Text>
        </Pressable>
      </View>

      {/* Selected entry detail panel */}
      {selected && (
        <View style={S.detailPanel}>
          <View style={S.detailHeader}>
            <Text style={S.detailTitle}>{selected.locationName || "Forage Entry"}</Text>
            <Pressable onPress={() => setSelected(null)}>
              <Text style={S.detailClose}>✕</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.plantRow}>
            {selected.plants.map((p) => (
              <View key={p} style={S.plantBadge}>
                <Text style={S.plantBadgeText}>{p}</Text>
              </View>
            ))}
            {selected.customPlants ? (
              <View style={S.plantBadge}>
                <Text style={S.plantBadgeText}>🌱 {selected.customPlants}</Text>
              </View>
            ) : null}
          </ScrollView>
          <View style={S.detailMeta}>
            <Text style={S.detailMetaText}>
              {WEATHER_LABELS[selected.weather] || selected.weather}
              {selected.temperature ? `  •  🌡️ ${selected.temperature}` : ""}
            </Text>
            <Text style={S.detailMetaText}>
              {new Date(selected.date).toLocaleDateString()}
            </Text>
          </View>
          {selected.notes ? (
            <Text style={S.detailNotes}>{selected.notes}</Text>
          ) : null}
        </View>
      )}

      {/* List fallback — entries without location */}
      {entries.length === 0 ? (
        <View style={S.emptyBox}>
          <Text style={S.emptyEmoji}>🌿</Text>
          <Text style={S.emptyText}>No forage entries yet</Text>
          <Text style={S.emptyHint}>Tap "+ Log Forage" to record what's blooming</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function makeStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: theme.bg },
    mapContainer: { flex: 1, position: "relative" },
    map: { flex: 1 },
    webFallback: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.bgCard },
    webFallbackEmoji: { fontSize: 48, marginBottom: 12 },
    webFallbackText: { color: theme.textMuted, fontSize: theme.fontSM },
    pin: { backgroundColor: theme.bgCard, borderRadius: 20, padding: 6, borderWidth: 2, borderColor: theme.green },
    pinEmoji: { fontSize: 18 },
    callout: { backgroundColor: theme.bgCard, padding: 10, borderRadius: theme.radiusSM, maxWidth: 200, borderWidth: 1, borderColor: theme.border },
    calloutTitle: { color: theme.textPrimary, fontWeight: "900", fontSize: theme.fontXS, marginBottom: 2 },
    calloutText: { color: theme.textMuted, fontSize: theme.fontXS },
    fab: {
      position: "absolute",
      bottom: 24,
      right: 20,
      backgroundColor: theme.green,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 30,
      shadowColor: "#000",
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 8,
    },
    fabText: { color: "#fff", fontWeight: "900", fontSize: theme.fontSM },
    detailPanel: {
      backgroundColor: theme.bgCard,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      padding: theme.spaceMD,
      maxHeight: 200,
    },
    detailHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    detailTitle: { color: theme.textPrimary, fontWeight: "900", fontSize: theme.fontMD, flex: 1 },
    detailClose: { color: theme.textMuted, fontSize: 18, paddingLeft: 12 },
    plantRow: { marginBottom: 8 },
    plantBadge: { backgroundColor: theme.bgCardAlt, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1, borderColor: theme.border, marginRight: 6 },
    plantBadgeText: { color: theme.greenLight, fontSize: theme.fontXS, fontWeight: "700" },
    detailMeta: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
    detailMetaText: { color: theme.textMuted, fontSize: theme.fontXS },
    detailNotes: { color: theme.textSecondary, fontSize: theme.fontXS, lineHeight: 18 },
    emptyBox: { position: "absolute", top: "40%", left: 0, right: 0, alignItems: "center" },
    emptyEmoji: { fontSize: 40, marginBottom: 8 },
    emptyText: { color: theme.textPrimary, fontWeight: "800", fontSize: theme.fontMD },
    emptyHint: { color: theme.textMuted, fontSize: theme.fontSM, marginTop: 6 },
  });
}

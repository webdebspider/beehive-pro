/**
 * app/hive/forage-map.tsx
 *
 * Forage Map Screen — displays all logged forage entries as pins on a map.
 * Tap a pin to see a summary. Log new entry from the FAB button.
 *
 * Web: shows a list view fallback (react-native-maps is native only).
 * Android note: requires a Google Maps API key in app.json:
 *   "android": { "config": { "googleMaps": { "apiKey": "YOUR_KEY_HERE" } } }
 *
 * Firestore: queries by userId only, sorts in JS — avoids compound index requirement.
 */

import { useRouter } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
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
import { SafeAreaView } from "react-native-safe-area-context";
import NavBar from "../../components/NavBar";
import { useAuthContext } from "../../context/AuthContext";
import { useAppTheme } from "../../hooks/useAppTheme";
import { db } from "../../utils/firebase";
import { Callout, MapView, Marker } from "../../utils/mapsCompat";

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
  createdAt?: any;
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
      // Query by userId only — sort in JS to avoid compound index requirement
      const snap = await getDocs(
        query(collection(db, "forage"), where("userId", "==", user.uid))
      );
      const list: ForageEntry[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ForageEntry, "id">),
      }));
      // Sort newest first in JS
      list.sort((a, b) => {
        const ta = a.createdAt?.toDate?.()?.getTime?.() || new Date(a.date).getTime();
        const tb = b.createdAt?.toDate?.()?.getTime?.() || new Date(b.date).getTime();
        return tb - ta;
      });
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
    : { latitude: 37.7749, longitude: -96.0, latitudeDelta: 30, longitudeDelta: 30 };

  const S = makeStyles(theme);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={theme.honey} size="large" />
        <Text style={{ color: theme.textSecondary, marginTop: 12 }}>Loading forage map...</Text>
      </View>
    );
  }

  // ── Web fallback — list view ──────────────────────────────────────────────
  if (Platform.OS === "web") {
    return (
      <SafeAreaView style={S.page}>
        <NavBar />
        <ScrollView contentContainerStyle={S.content}>
          <View style={S.webHeader}>
            <Text style={S.title}>🌿 Forage Map</Text>
            <Pressable onPress={() => router.push("/hive/forage-log")} style={S.fabInline}>
              <Text style={S.fabInlineText}>+ Log Forage</Text>
            </Pressable>
          </View>
          <Text style={S.webMapNote}>🗺️ Map view available on iOS and Android</Text>

          {entries.length === 0 ? (
            <View style={S.emptyBox}>
              <Text style={S.emptyEmoji}>🌿</Text>
              <Text style={S.emptyText}>No forage entries yet</Text>
              <Text style={S.emptyHint}>Tap "+ Log Forage" to record what's blooming</Text>
            </View>
          ) : (
            entries.map((entry) => (
              <View key={entry.id} style={S.listCard}>
                <Text style={S.listCardTitle}>{entry.locationName || "Forage Entry"}</Text>
                <Text style={S.listCardDate}>{new Date(entry.date).toLocaleDateString()}</Text>
                <View style={S.plantRow}>
                  {entry.plants.slice(0, 4).map((p) => (
                    <View key={p} style={S.plantBadge}>
                      <Text style={S.plantBadgeText}>{p}</Text>
                    </View>
                  ))}
                  {entry.plants.length > 4 && (
                    <View style={S.plantBadge}>
                      <Text style={S.plantBadgeText}>+{entry.plants.length - 4} more</Text>
                    </View>
                  )}
                </View>
                <Text style={S.listCardMeta}>
                  {WEATHER_LABELS[entry.weather] || entry.weather}
                  {entry.temperature ? `  •  🌡️ ${entry.temperature}` : ""}
                </Text>
                {entry.notes ? <Text style={S.listCardNotes}>{entry.notes}</Text> : null}
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Native map view ───────────────────────────────────────────────────────
  return (
    <SafeAreaView style={S.page}>
      <NavBar />
      <View style={S.mapContainer}>
        {MapView && (
          <MapView
            style={S.map}
            initialRegion={initialRegion}
            onPress={() => setSelected(null)}
          >
            {mappableEntries.map((entry) => (
              Marker ? (
                <Marker
                  key={entry.id}
                  coordinate={entry.location!}
                  onPress={() => setSelected(entry)}
                >
                  <View style={S.pin}>
                    <Text style={S.pinEmoji}>🌿</Text>
                  </View>
                  {Callout && (
                    <Callout tooltip>
                      <View style={S.callout}>
                        <Text style={S.calloutTitle}>{entry.locationName || "Forage Entry"}</Text>
                        <Text style={S.calloutText}>
                          {entry.plants.slice(0, 2).join(", ")}
                          {entry.plants.length > 2 ? ` +${entry.plants.length - 2} more` : ""}
                        </Text>
                      </View>
                    </Callout>
                  )}
                </Marker>
              ) : null
            ))}
          </MapView>
        )}

        <Pressable style={S.fab} onPress={() => router.push("/hive/forage-log")}>
          <Text style={S.fabText}>+ Log Forage</Text>
        </Pressable>
      </View>

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
            <Text style={S.detailMetaText}>{new Date(selected.date).toLocaleDateString()}</Text>
          </View>
          {selected.notes ? <Text style={S.detailNotes}>{selected.notes}</Text> : null}
        </View>
      )}

      {entries.length === 0 && (
        <View style={S.emptyBox}>
          <Text style={S.emptyEmoji}>🌿</Text>
          <Text style={S.emptyText}>No forage entries yet</Text>
          <Text style={S.emptyHint}>Tap "+ Log Forage" to record what's blooming</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function makeStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: theme.bg },
    content: { padding: theme.spaceMD, paddingBottom: 50 },
    webHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spaceSM },
    title: { color: theme.textPrimary, fontSize: theme.fontLG, fontWeight: "900" },
    webMapNote: { color: theme.textMuted, fontSize: theme.fontXS, marginBottom: theme.spaceMD, fontStyle: "italic" },
    fabInline: { backgroundColor: theme.green, paddingVertical: 10, paddingHorizontal: 16, borderRadius: theme.radiusMD },
    fabInlineText: { color: "#fff", fontWeight: "900", fontSize: theme.fontSM },
    listCard: { backgroundColor: theme.bgCard, padding: theme.spaceMD, borderRadius: theme.radiusLG, marginBottom: 12, borderWidth: 1, borderColor: theme.border },
    listCardTitle: { color: theme.textPrimary, fontWeight: "900", fontSize: theme.fontMD, marginBottom: 2 },
    listCardDate: { color: theme.textMuted, fontSize: theme.fontXS, marginBottom: 8 },
    listCardMeta: { color: theme.textMuted, fontSize: theme.fontXS, marginTop: 6 },
    listCardNotes: { color: theme.textSecondary, fontSize: theme.fontXS, marginTop: 6, lineHeight: 18 },
    mapContainer: { flex: 1, position: "relative" },
    map: { flex: 1 },
    pin: { backgroundColor: theme.bgCard, borderRadius: 20, padding: 6, borderWidth: 2, borderColor: theme.green },
    pinEmoji: { fontSize: 18 },
    callout: { backgroundColor: theme.bgCard, padding: 10, borderRadius: theme.radiusSM, maxWidth: 200, borderWidth: 1, borderColor: theme.border },
    calloutTitle: { color: theme.textPrimary, fontWeight: "900", fontSize: theme.fontXS, marginBottom: 2 },
    calloutText: { color: theme.textMuted, fontSize: theme.fontXS },
    fab: {
      position: "absolute", bottom: 24, right: 20,
      backgroundColor: theme.green, paddingVertical: 14, paddingHorizontal: 20,
      borderRadius: 30, elevation: 8,
      shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    },
    fabText: { color: "#fff", fontWeight: "900", fontSize: theme.fontSM },
    detailPanel: { backgroundColor: theme.bgCard, borderTopWidth: 1, borderTopColor: theme.border, padding: theme.spaceMD, maxHeight: 200 },
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

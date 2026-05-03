/**
 * app/hive/forage-log.tsx
 *
 * Forage Log Screen — log blooming plants, weather, and notes for a location.
 * GPS auto-detects current location on load.
 * Can be hive-linked (receives id param) or standalone.
 *
 * Web: map preview hidden (react-native-maps is native only).
 * Saves to Firestore: forage/{entryId}
 */

import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NavBar from "../../components/NavBar";
import { useAuthContext } from "../../context/AuthContext";
import { useAppTheme } from "../../hooks/useAppTheme";
import { db } from "../../utils/firebase";
import { Marker, MapView } from "../../utils/mapsCompat";

const FORAGE_PLANTS = [
  "🍀 Clover", "🌼 Dandelion", "💜 Lavender", "🌻 Sunflower",
  "🌸 Apple Blossom", "🫐 Blackberry", "🌾 Goldenrod", "💐 Aster",
  "🌿 Borage", "🌱 Phacelia", "🌾 Buckwheat", "🌳 Linden",
  "🌲 Tulip Poplar", "🌿 Black Locust", "🌸 Sourwood", "🌺 Wildflowers",
];

const WEATHER_OPTIONS = [
  { label: "☀️ Sunny", value: "sunny" },
  { label: "⛅ Partly Cloudy", value: "partly_cloudy" },
  { label: "☁️ Overcast", value: "overcast" },
  { label: "🌧️ Rainy", value: "rainy" },
  { label: "💨 Windy", value: "windy" },
  { label: "🌩️ Stormy", value: "stormy" },
];

type Coords = { latitude: number; longitude: number };

export default function ForageLogScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { user } = useAuthContext();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const hiveId = id ? String(id) : "";

  const [coords, setCoords] = useState<Coords | null>(null);
  const [locationName, setLocationName] = useState("");
  const [locating, setLocating] = useState(true);
  const [selectedPlants, setSelectedPlants] = useState<Set<string>>(new Set());
  const [customPlants, setCustomPlants] = useState("");
  const [weather, setWeather] = useState("");
  const [temperature, setTemperature] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { detectLocation(); }, []);

  const detectLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { setLocating(false); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      setCoords({ latitude, longitude });
      const places = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (places.length > 0) {
        const p = places[0];
        const parts = [p.name, p.city, p.region].filter(Boolean);
        setLocationName(parts.join(", "));
      }
    } catch {
      // Location failed — user can still log without GPS
    } finally {
      setLocating(false);
    }
  };

  const togglePlant = (plant: string) => {
    setSelectedPlants((prev) => {
      const next = new Set(prev);
      if (next.has(plant)) next.delete(plant);
      else next.add(plant);
      return next;
    });
  };

  const handleSave = async () => {
    if (selectedPlants.size === 0 && !customPlants.trim()) {
      Alert.alert("Add Plants", "Select at least one plant or enter a custom plant.");
      return;
    }
    if (!weather) {
      Alert.alert("Add Weather", "Select the current weather condition.");
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, "forage"), {
        hiveId: hiveId || null,
        userId: user?.uid || null,
        location: coords ? { latitude: coords.latitude, longitude: coords.longitude } : null,
        locationName: locationName || null,
        plants: Array.from(selectedPlants),
        customPlants: customPlants.trim() || null,
        weather,
        temperature: temperature.trim() || null,
        notes: notes.trim() || null,
        createdAt: serverTimestamp(),
        date: new Date().toISOString(),
      });
      Alert.alert("Forage Logged! 🌿", "Your forage entry has been saved.", [
        {
          text: hiveId ? "Back to Hive" : "View Map",
          onPress: () => hiveId
            ? router.replace({ pathname: "/hive/[id]", params: { id: hiveId } })
            : router.replace("/hive/forage-map"),
        },
        { text: "Go Home", onPress: () => router.replace("/hive") },
      ]);
    } catch {
      Alert.alert("Save Failed", "Could not save forage entry. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const S = makeStyles(theme);

  return (
    <SafeAreaView style={S.page}>
      <NavBar />
      <ScrollView contentContainerStyle={S.content}>
        <Text style={S.title}>🌿 Log Forage</Text>
        <Text style={S.subtitle}>
          {hiveId ? "Record what's blooming near this hive" : "Record forage conditions at your current location"}
        </Text>

        {/* Location */}
        <Text style={S.label}>📍 Location</Text>
        {locating ? (
          <View style={S.locatingBox}>
            <ActivityIndicator color={theme.honey} size="small" />
            <Text style={S.locatingText}>Detecting location...</Text>
          </View>
        ) : coords ? (
          <View style={S.locationBox}>
            <Text style={S.locationName}>{locationName || "Location detected"}</Text>
            <Text style={S.locationCoords}>
              {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
            </Text>
            {/* Map preview — native only, MapView is null on web */}
            {Platform.OS !== "web" && MapView && (
              <MapView
                style={S.map}
                initialRegion={{
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                {Marker && <Marker coordinate={coords} title="Forage Location" />}
              </MapView>
            )}
            <Pressable onPress={detectLocation} style={S.retryLocation}>
              <Text style={S.retryLocationText}>🔄 Re-detect location</Text>
            </Pressable>
          </View>
        ) : (
          <View style={S.locationBox}>
            <Text style={S.locationMissed}>📵 Location not detected</Text>
            <Pressable onPress={detectLocation} style={S.retryLocation}>
              <Text style={S.retryLocationText}>Try again</Text>
            </Pressable>
          </View>
        )}

        {/* Plants */}
        <Text style={S.label}>🌸 Blooming Plants</Text>
        <Text style={S.hint}>Tap everything you see blooming nearby</Text>
        <View style={S.plantGrid}>
          {FORAGE_PLANTS.map((plant) => {
            const isSelected = selectedPlants.has(plant);
            return (
              <Pressable
                key={plant}
                onPress={() => togglePlant(plant)}
                style={[S.plantChip, isSelected && S.plantChipSelected]}
              >
                <Text style={[S.plantChipText, isSelected && S.plantChipTextSelected]}>
                  {plant}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <TextInput
          placeholder="Other plants (e.g. tulip poplar, lemon balm...)"
          placeholderTextColor={theme.textMuted}
          value={customPlants}
          onChangeText={setCustomPlants}
          style={S.input}
        />

        {/* Weather */}
        <Text style={S.label}>🌤️ Weather</Text>
        <View style={S.weatherRow}>
          {WEATHER_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setWeather(opt.value)}
              style={[S.weatherChip, weather === opt.value && S.weatherChipSelected]}
            >
              <Text style={[S.weatherChipText, weather === opt.value && S.weatherChipTextSelected]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Temperature */}
        <Text style={S.label}>🌡️ Temperature (optional)</Text>
        <TextInput
          placeholder="e.g. 72°F or 22°C"
          placeholderTextColor={theme.textMuted}
          value={temperature}
          onChangeText={setTemperature}
          style={S.input}
        />

        {/* Notes */}
        <Text style={S.label}>📝 Notes (optional)</Text>
        <TextInput
          placeholder="Bee activity level, observations, anything unusual..."
          placeholderTextColor={theme.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          style={[S.input, S.notesInput]}
        />

        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={[S.saveButton, saving && S.disabledButton]}
        >
          <Text style={S.saveText}>{saving ? "Saving..." : "Save Forage Entry 🌿"}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: theme.bg },
    content: { padding: theme.spaceMD, paddingBottom: 50 },
    title: { color: theme.textPrimary, fontSize: theme.fontLG, fontWeight: "900", marginBottom: 4 },
    subtitle: { color: theme.textMuted, fontSize: theme.fontSM, marginBottom: theme.spaceMD, lineHeight: 20 },
    label: { color: theme.textSecondary, fontSize: theme.fontSM, fontWeight: "700", marginTop: theme.spaceMD, marginBottom: 8 },
    hint: { color: theme.textMuted, fontSize: theme.fontXS, marginBottom: 10, marginTop: -4 },
    locatingBox: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: theme.bgCard, padding: theme.spaceMD, borderRadius: theme.radiusMD, borderWidth: 1, borderColor: theme.border },
    locatingText: { color: theme.textMuted, fontSize: theme.fontSM },
    locationBox: { backgroundColor: theme.bgCard, borderRadius: theme.radiusMD, borderWidth: 1, borderColor: theme.border, overflow: "hidden" },
    locationName: { color: theme.textPrimary, fontWeight: "800", fontSize: theme.fontSM, padding: theme.spaceMD, paddingBottom: 4 },
    locationCoords: { color: theme.textMuted, fontSize: theme.fontXS, paddingHorizontal: theme.spaceMD, paddingBottom: theme.spaceSM },
    locationMissed: { color: theme.textMuted, fontSize: theme.fontSM, padding: theme.spaceMD },
    map: { width: "100%", height: 160 },
    retryLocation: { padding: theme.spaceSM, alignItems: "center", borderTopWidth: 1, borderTopColor: theme.border },
    retryLocationText: { color: theme.honey, fontSize: theme.fontXS, fontWeight: "700" },
    plantGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: theme.spaceSM },
    plantChip: { backgroundColor: theme.bgCard, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: theme.border },
    plantChipSelected: { backgroundColor: theme.bgCardAlt, borderColor: theme.green },
    plantChipText: { color: theme.textSecondary, fontSize: theme.fontXS, fontWeight: "700" },
    plantChipTextSelected: { color: theme.greenLight },
    weatherRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    weatherChip: { backgroundColor: theme.bgCard, paddingVertical: 10, paddingHorizontal: 14, borderRadius: theme.radiusSM, borderWidth: 1, borderColor: theme.border },
    weatherChipSelected: { backgroundColor: theme.bgCardAlt, borderColor: theme.honey },
    weatherChipText: { color: theme.textSecondary, fontSize: theme.fontSM, fontWeight: "700" },
    weatherChipTextSelected: { color: theme.honey },
    input: { backgroundColor: theme.bgInput, color: theme.textPrimary, padding: 14, borderRadius: theme.radiusMD, fontSize: theme.fontSM, borderWidth: 1, borderColor: theme.border },
    notesInput: { minHeight: 90, textAlignVertical: "top" },
    saveButton: { backgroundColor: theme.green, padding: 16, borderRadius: theme.radiusMD, alignItems: "center", marginTop: theme.spaceLG },
    disabledButton: { backgroundColor: theme.textMuted },
    saveText: { color: "#fff", fontWeight: "900", fontSize: theme.fontMD },
  });
}

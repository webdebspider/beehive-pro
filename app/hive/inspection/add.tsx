/**
 * app/hive/inspection/add.tsx
 *
 * Add Inspection Screen — creates a new inspection for a hive.
 *
 * UX improvements:
 *  - Enter key moves between fields, submits on last field
 *  - After saving, user chooses to view hive or go home
 *
 * Offline handling:
 *  - Text data saves to Firestore always
 *  - Photos queue to AsyncStorage if offline, sync when back online
 */

import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, serverTimestamp, updateDoc } from "firebase/firestore";
import { useRef, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import NavBar from "../../../components/NavBar";
import { useAppTheme } from "../../../hooks/useAppTheme";
import { db } from "../../../utils/firebase";
import { addToQueue } from "../../../utils/offlineQueue";
import { uploadInspectionPhotos } from "../../../utils/uploadInspectionPhotos";
import { useNetworkStatus } from "../../../utils/useNetworkStatus";

export default function AddInspectionScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const isOnline = useNetworkStatus();

  const { id, queen: initialQueen, brood: initialBrood, notes: initialNotes } = useLocalSearchParams<{
    id?: string; queen?: string; brood?: string; notes?: string;
  }>();

  const hiveId = id ? String(id) : "";
  const [queen, setQueen] = useState(initialQueen ? String(initialQueen) : "");
  const [brood, setBrood] = useState(initialBrood ? String(initialBrood) : "");
  const [notes, setNotes] = useState(initialNotes ? String(initialNotes) : "");
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Refs for field focus management
  const broodRef = useRef<TextInput>(null);
  const notesRef = useRef<TextInput>(null);

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });
    if (!result.canceled) setPhotoUris((prev) => [...prev, result.assets[0].uri]);
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });
    if (!result.canceled) setPhotoUris((prev) => [...prev, result.assets[0].uri]);
  };

  const removePhoto = (uri: string) =>
    setPhotoUris((prev) => prev.filter((item) => item !== uri));

  /** Shows post-save navigation prompt */
  const showSavePrompt = () => {
    Alert.alert(
      "Inspection saved! 🐝",
      "Where would you like to go?",
      [
        {
          text: "View Hive",
          onPress: () => router.replace({ pathname: "/hive/[id]", params: { id: hiveId } }),
        },
        {
          text: "Go Home",
          onPress: () => router.replace("/hive"),
        },
      ]
    );
  };

  const handleSave = async () => {
    if (saving) return;
    if (!hiveId) { Alert.alert("Missing Hive", "No hive ID was provided."); return; }

    try {
      setSaving(true);

      const docRef = await addDoc(collection(db, "hives", hiveId, "inspections"), {
        hiveId, queen, brood,
        notes: notes.trim(),
        photoUris: [], photoUrls: [],
        createdAt: serverTimestamp(),
        date: new Date().toISOString(),
      });

      if (photoUris.length > 0) {
        if (isOnline) {
          try {
            const uploadedUrls = await uploadInspectionPhotos(hiveId, docRef.id, photoUris);
            await updateDoc(docRef, {
              photoUris: uploadedUrls,
              photoUrls: uploadedUrls,
              photosUploaded: true,
              updatedAt: new Date(),
            });
          } catch (uploadError) {
            await addToQueue({ hiveId, inspectionId: docRef.id, photoUris });
          }
        } else {
          await addToQueue({ hiveId, inspectionId: docRef.id, photoUris });
        }
      }

      showSavePrompt();
    } catch (e) {
      Alert.alert("Save failed", "The inspection could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const S = makeStyles(theme);

  return (
    <SafeAreaView style={S.page}>
      <NavBar />
      <ScrollView contentContainerStyle={S.content}>
        <Text style={S.title}>New Inspection</Text>
        <Text style={S.subtitle}>Record what you observe in the hive today</Text>

        {!isOnline && (
          <View style={S.offlineNotice}>
            <Text style={S.offlineNoticeText}>
              📵 You're offline — inspection will save, photos will sync later
            </Text>
          </View>
        )}

        {/* Queen — moves to Brood on Enter */}
        <Text style={S.label}>👑 Queen Status</Text>
        <TextInput
          placeholder="e.g. seen, eggs present, not found"
          placeholderTextColor={theme.textMuted}
          value={queen}
          onChangeText={setQueen}
          style={S.input}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => broodRef.current?.focus()}
        />

        {/* Brood — moves to Notes on Enter */}
        <Text style={S.label}>🐛 Brood Pattern</Text>
        <TextInput
          ref={broodRef}
          placeholder="e.g. strong, weak, spotty"
          placeholderTextColor={theme.textMuted}
          value={brood}
          onChangeText={setBrood}
          style={S.input}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => notesRef.current?.focus()}
        />

        {/* Notes — submits on Enter */}
        <Text style={S.label}>📝 Notes</Text>
        <TextInput
          ref={notesRef}
          placeholder="Observations, concerns, treatments..."
          placeholderTextColor={theme.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          style={[S.input, S.notesInput]}
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />

        {/* Photos */}
        <Text style={S.label}>📷 Photos</Text>
        {!isOnline && photoUris.length > 0 && (
          <View style={S.photoQueueNotice}>
            <Text style={S.photoQueueNoticeText}>
              ⏳ {photoUris.length} photo{photoUris.length === 1 ? "" : "s"} will upload when back online
            </Text>
          </View>
        )}
        <View style={S.photoButtons}>
          <Pressable onPress={takePhoto} style={S.photoButton}>
            <Text style={S.photoButtonText}>📷 Camera</Text>
          </Pressable>
          <Pressable onPress={pickPhoto} style={S.photoButton}>
            <Text style={S.photoButtonText}>🖼️ Gallery</Text>
          </Pressable>
        </View>

        {photoUris.length > 0 && (
          <View style={S.photoGrid}>
            {photoUris.map((uri) => (
              <Pressable key={uri} onPress={() => removePhoto(uri)}>
                <Image source={{ uri }} style={S.preview} />
                <Text style={S.removeText}>Tap to remove</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={[S.saveButton, saving && S.disabledButton]}
        >
          <Text style={S.saveText}>
            {saving ? "Saving..." : isOnline ? "Save Inspection" : "Save Offline 📵"}
          </Text>
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
    subtitle: { color: theme.textMuted, fontSize: theme.fontSM, marginBottom: theme.spaceLG },
    offlineNotice: { backgroundColor: theme.warningBg, borderWidth: 1, borderColor: theme.warning, padding: theme.spaceSM, borderRadius: theme.radiusMD, marginBottom: theme.spaceMD },
    offlineNoticeText: { color: theme.honeyLight, fontSize: theme.fontXS, fontWeight: "700", textAlign: "center" },
    photoQueueNotice: { backgroundColor: theme.bgCardAlt, borderWidth: 1, borderColor: theme.border, padding: theme.spaceSM, borderRadius: theme.radiusSM, marginBottom: theme.spaceSM },
    photoQueueNoticeText: { color: theme.textSecondary, fontSize: theme.fontXS, fontWeight: "700" },
    label: { color: theme.textSecondary, fontSize: theme.fontSM, fontWeight: "700", marginTop: theme.spaceMD, marginBottom: 8 },
    input: { backgroundColor: theme.bgInput, color: theme.textPrimary, padding: 14, borderRadius: theme.radiusMD, fontSize: theme.fontMD, borderWidth: 1, borderColor: theme.border },
    notesInput: { minHeight: 110, textAlignVertical: "top" },
    photoButtons: { flexDirection: "row", gap: 10 },
    photoButton: { flex: 1, backgroundColor: theme.bgCardAlt, padding: 14, borderRadius: theme.radiusMD, alignItems: "center", borderWidth: 1, borderColor: theme.border },
    photoButtonText: { color: theme.textPrimary, fontWeight: "800", fontSize: theme.fontSM },
    photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: theme.spaceMD },
    preview: { width: 100, height: 100, borderRadius: theme.radiusSM },
    removeText: { color: theme.danger, fontSize: theme.fontXS, marginTop: 4, textAlign: "center" },
    saveButton: { backgroundColor: theme.green, padding: 16, borderRadius: theme.radiusMD, alignItems: "center", marginTop: theme.spaceLG },
    disabledButton: { backgroundColor: theme.textMuted },
    saveText: { color: "#fff", fontWeight: "900", fontSize: theme.fontMD },
  });
}
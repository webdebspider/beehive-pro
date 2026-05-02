/**
 * app/hive/inspection/add.tsx
 *
 * Add Inspection Screen — creates a new inspection for a hive.
 * Firestore doc is created first, then photos are uploaded separately
 * so the inspection is never lost even if upload is interrupted.
 */

import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, serverTimestamp, updateDoc } from "firebase/firestore";
import { useState } from "react";
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
import { db } from "../../../utils/firebase";
import { T } from "../../../utils/theme";
import { uploadInspectionPhotos } from "../../../utils/uploadInspectionPhotos";

export default function AddInspectionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const hiveId = id ? String(id) : "";

  const [queen, setQueen] = useState("");
  const [brood, setBrood] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

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
        const uploadedUrls = await uploadInspectionPhotos(hiveId, docRef.id, photoUris);
        await updateDoc(docRef, {
          photoUris: uploadedUrls,
          photoUrls: uploadedUrls,
          photosUploaded: true,
          updatedAt: new Date(),
        });
      }
      router.replace({ pathname: "/hive/[id]", params: { id: hiveId } });
    } catch (e) {
      console.log("SAVE INSPECTION ERROR", e);
      Alert.alert("Save failed", "The inspection could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.page}>
      {/* Nav Bar */}
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} style={styles.navButton}>
          <Text style={styles.navButtonText}>← Back</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/hive")} style={styles.navButton}>
          <Text style={styles.navButtonText}>🏠 Home</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>New Inspection</Text>
        <Text style={styles.subtitle}>Record what you observe in the hive today</Text>

        {/* Queen */}
        <Text style={styles.label}>👑 Queen Status</Text>
        <TextInput
          placeholder="e.g. seen, eggs present, not found"
          placeholderTextColor={T.textMuted}
          value={queen}
          onChangeText={setQueen}
          style={styles.input}
        />

        {/* Brood */}
        <Text style={styles.label}>🐛 Brood Pattern</Text>
        <TextInput
          placeholder="e.g. strong, weak, spotty"
          placeholderTextColor={T.textMuted}
          value={brood}
          onChangeText={setBrood}
          style={styles.input}
        />

        {/* Notes */}
        <Text style={styles.label}>📝 Notes</Text>
        <TextInput
          placeholder="Observations, concerns, treatments..."
          placeholderTextColor={T.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          style={[styles.input, styles.notesInput]}
        />

        {/* Photos */}
        <Text style={styles.label}>📷 Photos</Text>
        <View style={styles.photoButtons}>
          <Pressable onPress={takePhoto} style={styles.photoButton}>
            <Text style={styles.photoButtonText}>📷 Camera</Text>
          </Pressable>
          <Pressable onPress={pickPhoto} style={styles.photoButton}>
            <Text style={styles.photoButtonText}>🖼️ Gallery</Text>
          </Pressable>
        </View>

        {photoUris.length > 0 && (
          <View style={styles.photoGrid}>
            {photoUris.map((uri) => (
              <Pressable key={uri} onPress={() => removePhoto(uri)}>
                <Image source={{ uri }} style={styles.preview} />
                <Text style={styles.removeText}>Tap to remove</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Save */}
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveButton, saving && styles.disabledButton]}
        >
          <Text style={styles.saveText}>
            {saving ? "Saving..." : "Save Inspection"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: T.bg },
  navBar: {
    flexDirection: "row",
    paddingHorizontal: T.spaceMD,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.bgNav,
  },
  navButton: {
    backgroundColor: T.bgCard,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: T.radiusSM,
    borderWidth: 1,
    borderColor: T.border,
  },
  navButtonText: { color: T.textSecondary, fontWeight: "700", fontSize: T.fontSM },
  content: { padding: T.spaceMD, paddingBottom: 50 },
  title: { color: T.textPrimary, fontSize: T.fontLG, fontWeight: "900", marginBottom: 4 },
  subtitle: { color: T.textMuted, fontSize: T.fontSM, marginBottom: T.spaceLG },
  label: { color: T.textSecondary, fontSize: T.fontSM, fontWeight: "700", marginTop: T.spaceMD, marginBottom: 8 },
  input: {
    backgroundColor: T.bgInput,
    color: T.textPrimary,
    padding: 14,
    borderRadius: T.radiusMD,
    fontSize: T.fontMD,
    borderWidth: 1,
    borderColor: T.border,
  },
  notesInput: { minHeight: 110, textAlignVertical: "top" },
  photoButtons: { flexDirection: "row", gap: 10 },
  photoButton: {
    flex: 1,
    backgroundColor: T.bgCardAlt,
    padding: 14,
    borderRadius: T.radiusMD,
    alignItems: "center",
    borderWidth: 1,
    borderColor: T.border,
  },
  photoButtonText: { color: T.textPrimary, fontWeight: "800", fontSize: T.fontSM },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: T.spaceMD },
  preview: { width: 100, height: 100, borderRadius: T.radiusSM },
  removeText: { color: T.danger, fontSize: T.fontXS, marginTop: 4, textAlign: "center" },
  saveButton: {
    backgroundColor: T.green,
    padding: 16,
    borderRadius: T.radiusMD,
    alignItems: "center",
    marginTop: T.spaceLG,
  },
  disabledButton: { backgroundColor: T.textMuted },
  saveText: { color: "#fff", fontWeight: "900", fontSize: T.fontMD },
});
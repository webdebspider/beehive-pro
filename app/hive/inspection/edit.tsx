/**
 * app/hive/inspection/edit.tsx
 *
 * Edit Inspection Screen — loads and edits an existing inspection record.
 *
 * Route params:
 *  - hiveId: the Firestore hive document ID
 *  - inspectionId: the Firestore inspection document ID
 *
 * Features:
 *  - Loads existing notes and photos from Firestore on mount
 *  - Allows editing notes and adding/removing photos
 *  - Save updates the Firestore document and returns to hive detail
 *  - Delete permanently removes the inspection (with confirmation alert)
 *  - Back/Home nav buttons for consistent navigation
 *
 * Note: Currently only saves notes and photoUris.
 * TODO: Add queen/brood fields to edit screen to match add screen.
 */

import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

export default function EditInspectionScreen() {
  const router = useRouter();

  // Note: param is "inspectionId" not "id" — must match what [id].tsx sends
  const { inspectionId, hiveId } = useLocalSearchParams<{
    inspectionId?: string;
    hiveId?: string;
  }>();

  const resolvedInspectionId = inspectionId ? String(inspectionId) : "";
  const resolvedHiveId = hiveId ? String(hiveId) : "";

  const [notes, setNotes] = useState("");
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadInspection();
  }, []);

  /** Fetches the existing inspection data from Firestore */
  const loadInspection = async () => {
    try {
      const ref = doc(db, "hives", resolvedHiveId, "inspections", resolvedInspectionId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setNotes(data.notes || "");
        setPhotoUris(data.photoUris || []);
      }
    } catch (e) {
      console.log("❌ LOAD ERROR:", e);
    } finally {
      setLoading(false);
    }
  };

  /** Opens photo library to add more photos to this inspection */
  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const selected = result.assets.map((a) => a.uri);
      setPhotoUris((prev) => [...prev, ...selected]);
    }
  };

  /** Opens camera to add a new photo to this inspection */
  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      setPhotoUris((prev) => [...prev, result.assets[0].uri]);
    }
  };

  /** Removes a photo from the local list (does not delete from Storage) */
  const removePhoto = (uri: string) => {
    setPhotoUris((prev) => prev.filter((p) => p !== uri));
  };

  /** Saves updated notes and photos back to Firestore */
  const handleSave = async () => {
    if (saving) return;
    try {
      setSaving(true);
      await updateDoc(
        doc(db, "hives", resolvedHiveId, "inspections", resolvedInspectionId),
        { notes, photoUris, updatedAt: new Date() }
      );
      router.replace({
        pathname: "/hive/[id]",
        params: { id: resolvedHiveId },
      });
    } catch (e) {
      console.log("❌ SAVE ERROR:", e);
      Alert.alert("Error saving");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Permanently deletes this inspection from Firestore.
   * Shows a confirmation alert before proceeding.
   */
  const handleDelete = async () => {
    Alert.alert("Delete?", "This cannot be undone", [
      { text: "Cancel" },
      {
        text: "Delete",
        onPress: async () => {
          await deleteDoc(
            doc(db, "hives", resolvedHiveId, "inspections", resolvedInspectionId)
          );
          router.replace({
            pathname: "/hive/[id]",
            params: { id: resolvedHiveId },
          });
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      {/* Nav Bar — consistent across all screens */}
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} style={styles.navButton}>
          <Text style={styles.navButtonText}>← Back</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/hive")} style={styles.navButton}>
          <Text style={styles.navButtonText}>🏠 Home</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Edit Inspection</Text>

        <Text style={styles.label}>Photos</Text>
        <View style={styles.row}>
          <Pressable style={styles.button} onPress={takePhoto}>
            <Text style={styles.buttonText}>📷 Camera</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={pickPhoto}>
            <Text style={styles.buttonText}>🖼️ Gallery</Text>
          </Pressable>
        </View>

        {/* Photo grid — tap any photo to remove it */}
        <View style={styles.photoGrid}>
          {photoUris.map((uri) => (
            <Pressable key={uri} onPress={() => removePhoto(uri)}>
              <Image source={{ uri }} style={styles.photo} />
              <Text style={styles.removeText}>Tap to remove</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="Inspection notes"
          placeholderTextColor="#888"
          style={styles.input}
        />

        <Pressable style={styles.save} onPress={handleSave}>
          <Text style={styles.saveText}>{saving ? "Saving..." : "Save"}</Text>
        </Pressable>

        {/* Red delete button — triggers confirmation alert */}
        <Pressable style={styles.delete} onPress={handleDelete}>
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0f172a" },
  navBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  navButton: {
    backgroundColor: "#1e293b",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  navButtonText: { color: "#94a3b8", fontWeight: "700", fontSize: 14 },
  content: { padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f172a" },
  title: { color: "#fff", fontSize: 26, fontWeight: "800", marginBottom: 8 },
  label: { color: "#9ca3af", marginTop: 12 },
  row: { flexDirection: "row", gap: 10, marginTop: 8 },
  button: { backgroundColor: "#334155", padding: 12, borderRadius: 10, flex: 1 },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "800" },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  photo: { width: 110, height: 110, borderRadius: 10 },
  removeText: { color: "#fca5a5", fontSize: 11, marginTop: 2, textAlign: "center" },
  input: {
    backgroundColor: "#1e293b",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
    minHeight: 100,
    textAlignVertical: "top",
    marginTop: 8,
  },
  save: { backgroundColor: "#22c55e", padding: 14, borderRadius: 10, marginTop: 20 },
  saveText: { textAlign: "center", fontWeight: "800", color: "#0f172a" },
  delete: { backgroundColor: "#ef4444", padding: 14, borderRadius: 10, marginTop: 10 },
  deleteText: { textAlign: "center", fontWeight: "800", color: "#fff" },
});
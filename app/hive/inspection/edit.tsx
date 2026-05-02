/**
 * app/hive/inspection/edit.tsx
 *
 * Edit Inspection Screen — loads and edits an existing inspection.
 * Param "inspectionId" must match exactly what [id].tsx sends.
 * Delete shows a confirmation alert before proceeding.
 *
 * TODO: Add queen/brood fields to match the add screen.
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
import { T } from "../../../utils/theme";

export default function EditInspectionScreen() {
  const router = useRouter();
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

  useEffect(() => { loadInspection(); }, []);

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

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert("Permission needed"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, quality: 0.8 });
    if (!result.canceled) setPhotoUris((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) { Alert.alert("Permission needed"); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) setPhotoUris((prev) => [...prev, result.assets[0].uri]);
  };

  const removePhoto = (uri: string) =>
    setPhotoUris((prev) => prev.filter((p) => p !== uri));

  const handleSave = async () => {
    if (saving) return;
    try {
      setSaving(true);
      await updateDoc(
        doc(db, "hives", resolvedHiveId, "inspections", resolvedInspectionId),
        { notes, photoUris, updatedAt: new Date() }
      );
      router.replace({ pathname: "/hive/[id]", params: { id: resolvedHiveId } });
    } catch (e) {
      console.log("❌ SAVE ERROR:", e);
      Alert.alert("Error saving");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert("Delete Inspection?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteDoc(doc(db, "hives", resolvedHiveId, "inspections", resolvedInspectionId));
          router.replace({ pathname: "/hive/[id]", params: { id: resolvedHiveId } });
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={T.honey} size="large" />
      </View>
    );
  }

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
        <Text style={styles.title}>Edit Inspection</Text>
        <Text style={styles.subtitle}>Update your notes or photos</Text>

        {/* Photos */}
        <Text style={styles.label}>📷 Photos</Text>
        <View style={styles.photoButtons}>
          <Pressable style={styles.photoButton} onPress={takePhoto}>
            <Text style={styles.photoButtonText}>📷 Camera</Text>
          </Pressable>
          <Pressable style={styles.photoButton} onPress={pickPhoto}>
            <Text style={styles.photoButtonText}>🖼️ Gallery</Text>
          </Pressable>
        </View>

        {photoUris.length > 0 && (
          <View style={styles.photoGrid}>
            {photoUris.map((uri) => (
              <Pressable key={uri} onPress={() => removePhoto(uri)}>
                <Image source={{ uri }} style={styles.photo} />
                <Text style={styles.removeText}>Tap to remove</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Notes */}
        <Text style={styles.label}>📝 Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="Inspection notes..."
          placeholderTextColor={T.textMuted}
          style={[styles.input, styles.notesInput]}
        />

        {/* Save */}
        <Pressable style={[styles.saveButton, saving && styles.disabledButton]} onPress={handleSave}>
          <Text style={styles.saveText}>{saving ? "Saving..." : "Save Changes"}</Text>
        </Pressable>

        {/* Delete */}
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteText}>🗑 Delete Inspection</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, backgroundColor: T.bg, justifyContent: "center", alignItems: "center" },
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
  subtitle: { color: T.textMuted, fontSize: T.fontSM, marginBottom: T.spaceMD },
  label: { color: T.textSecondary, fontSize: T.fontSM, fontWeight: "700", marginTop: T.spaceMD, marginBottom: 8 },
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
  photo: { width: 100, height: 100, borderRadius: T.radiusSM },
  removeText: { color: T.danger, fontSize: T.fontXS, marginTop: 4, textAlign: "center" },
  input: {
    backgroundColor: T.bgInput,
    color: T.textPrimary,
    padding: 14,
    borderRadius: T.radiusMD,
    fontSize: T.fontMD,
    borderWidth: 1,
    borderColor: T.border,
  },
  notesInput: { minHeight: 120, textAlignVertical: "top" },
  saveButton: {
    backgroundColor: T.green,
    padding: 16,
    borderRadius: T.radiusMD,
    alignItems: "center",
    marginTop: T.spaceLG,
  },
  disabledButton: { backgroundColor: T.textMuted },
  saveText: { color: "#fff", fontWeight: "900", fontSize: T.fontMD },
  deleteButton: {
    backgroundColor: T.dangerBg,
    padding: 16,
    borderRadius: T.radiusMD,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: T.danger,
  },
  deleteText: { color: "#fca5a5", fontWeight: "900", fontSize: T.fontMD },
});
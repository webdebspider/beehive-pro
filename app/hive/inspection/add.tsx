/**
 * app/hive/inspection/add.tsx
 *
 * Add Inspection Screen — creates a new inspection for a hive.
 */

import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, serverTimestamp, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { Alert, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import NavBar from "../../../components/NavBar";
import { useAppTheme } from "../../../hooks/useAppTheme";
import { db } from "../../../utils/firebase";
import { uploadInspectionPhotos } from "../../../utils/uploadInspectionPhotos";

export default function AddInspectionScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { id, queen: initialQueen, brood: initialBrood, notes: initialNotes } = useLocalSearchParams<{
    id?: string; queen?: string; brood?: string; notes?: string;
  }>();
  const hiveId = id ? String(id) : "";
  const [queen, setQueen] = useState(initialQueen ? String(initialQueen) : "");
  const [brood, setBrood] = useState(initialBrood ? String(initialBrood) : "");
  const [notes, setNotes] = useState(initialNotes ? String(initialNotes) : "");
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6 });
    if (!result.canceled) setPhotoUris((prev) => [...prev, result.assets[0].uri]);
  };
  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6 });
    if (!result.canceled) setPhotoUris((prev) => [...prev, result.assets[0].uri]);
  };
  const removePhoto = (uri: string) => setPhotoUris((prev) => prev.filter((item) => item !== uri));

  const handleSave = async () => {
    if (saving) return;
    if (!hiveId) { Alert.alert("Missing Hive", "No hive ID was provided."); return; }
    try {
      setSaving(true);
      const docRef = await addDoc(collection(db, "hives", hiveId, "inspections"), { hiveId, queen, brood, notes: notes.trim(), photoUris: [], photoUrls: [], createdAt: serverTimestamp(), date: new Date().toISOString() });
      if (photoUris.length > 0) {
        const uploadedUrls = await uploadInspectionPhotos(hiveId, docRef.id, photoUris);
        await updateDoc(docRef, { photoUris: uploadedUrls, photoUrls: uploadedUrls, photosUploaded: true, updatedAt: new Date() });
      }
      router.replace({ pathname: "/hive/[id]", params: { id: hiveId } });
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
        <Text style={S.label}>👑 Queen Status</Text>
        <TextInput placeholder="e.g. seen, eggs present, not found" placeholderTextColor={theme.textMuted} value={queen} onChangeText={setQueen} style={S.input} />
        <Text style={S.label}>🐛 Brood Pattern</Text>
        <TextInput placeholder="e.g. strong, weak, spotty" placeholderTextColor={theme.textMuted} value={brood} onChangeText={setBrood} style={S.input} />
        <Text style={S.label}>📝 Notes</Text>
        <TextInput placeholder="Observations, concerns, treatments..." placeholderTextColor={theme.textMuted} value={notes} onChangeText={setNotes} multiline style={[S.input, S.notesInput]} />
        <Text style={S.label}>📷 Photos</Text>
        <View style={S.photoButtons}>
          <Pressable onPress={takePhoto} style={S.photoButton}><Text style={S.photoButtonText}>📷 Camera</Text></Pressable>
          <Pressable onPress={pickPhoto} style={S.photoButton}><Text style={S.photoButtonText}>🖼️ Gallery</Text></Pressable>
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
        <Pressable onPress={handleSave} disabled={saving} style={[S.saveButton, saving && S.disabledButton]}>
          <Text style={S.saveText}>{saving ? "Saving..." : "Save Inspection"}</Text>
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
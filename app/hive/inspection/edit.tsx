/**
 * app/hive/inspection/edit.tsx
 *
 * Edit Inspection Screen — loads and edits an existing inspection.
 *
 * UX improvements:
 *  - Enter key moves between fields, submits on last field
 *  - After saving, user chooses to view hive or go home
 */

import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
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
import NavBar from "../../../components/NavBar";
import { useAppTheme } from "../../../hooks/useAppTheme";
import { db } from "../../../utils/firebase";

export default function EditInspectionScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { inspectionId, hiveId } = useLocalSearchParams<{
    inspectionId?: string; hiveId?: string;
  }>();

  const resolvedInspectionId = inspectionId ? String(inspectionId) : "";
  const resolvedHiveId = hiveId ? String(hiveId) : "";

  const [queen, setQueen] = useState("");
  const [brood, setBrood] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Refs for field focus management
  const broodRef = useRef<TextInput>(null);
  const notesRef = useRef<TextInput>(null);

  useEffect(() => { loadInspection(); }, []);

  const loadInspection = async () => {
    try {
      const ref = doc(db, "hives", resolvedHiveId, "inspections", resolvedInspectionId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setQueen(data.queen || "");
        setBrood(data.brood || "");
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

  /** Shows post-save navigation prompt */
  const showSavePrompt = () => {
    Alert.alert(
      "Inspection saved! 🐝",
      "Where would you like to go?",
      [
        {
          text: "View Hive",
          onPress: () => router.replace({ pathname: "/hive/[id]", params: { id: resolvedHiveId } }),
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
    try {
      setSaving(true);
      await updateDoc(
        doc(db, "hives", resolvedHiveId, "inspections", resolvedInspectionId),
        { queen, brood, notes, photoUris, updatedAt: new Date() }
      );
      showSavePrompt();
    } catch (e) {
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
          router.replace("/hive");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={theme.honey} size="large" />
      </View>
    );
  }

  const S = makeStyles(theme);

  return (
    <SafeAreaView style={S.page}>
      <NavBar />
      <ScrollView contentContainerStyle={S.content}>
        <Text style={S.title}>Edit Inspection</Text>
        <Text style={S.subtitle}>Update your inspection details</Text>

        {/* Queen — moves to Brood on Enter */}
        <Text style={S.label}>👑 Queen Status</Text>
        <TextInput
          value={queen}
          onChangeText={setQueen}
          placeholder="e.g. seen, eggs present, not found"
          placeholderTextColor={theme.textMuted}
          style={S.input}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => broodRef.current?.focus()}
        />

        {/* Brood — moves to Notes on Enter */}
        <Text style={S.label}>🐛 Brood Pattern</Text>
        <TextInput
          ref={broodRef}
          value={brood}
          onChangeText={setBrood}
          placeholder="e.g. strong, weak, spotty"
          placeholderTextColor={theme.textMuted}
          style={S.input}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => notesRef.current?.focus()}
        />

        {/* Notes — submits on Enter */}
        <Text style={S.label}>📝 Notes</Text>
        <TextInput
          ref={notesRef}
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="Inspection notes..."
          placeholderTextColor={theme.textMuted}
          style={[S.input, S.notesInput]}
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />

        {/* Photos */}
        <Text style={S.label}>📷 Photos</Text>
        <View style={S.photoButtons}>
          <Pressable style={S.photoButton} onPress={takePhoto}>
            <Text style={S.photoButtonText}>📷 Camera</Text>
          </Pressable>
          <Pressable style={S.photoButton} onPress={pickPhoto}>
            <Text style={S.photoButtonText}>🖼️ Gallery</Text>
          </Pressable>
        </View>

        {photoUris.length > 0 && (
          <View style={S.photoGrid}>
            {photoUris.map((uri) => (
              <Pressable key={uri} onPress={() => removePhoto(uri)}>
                <Image source={{ uri }} style={S.photo} />
                <Text style={S.removeText}>Tap to remove</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Pressable
          style={[S.saveButton, saving && S.disabledButton]}
          onPress={handleSave}
        >
          <Text style={S.saveText}>{saving ? "Saving..." : "Save Changes"}</Text>
        </Pressable>

        <Pressable style={S.deleteButton} onPress={handleDelete}>
          <Text style={S.deleteText}>🗑 Delete Inspection</Text>
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
    subtitle: { color: theme.textMuted, fontSize: theme.fontSM, marginBottom: theme.spaceMD },
    label: { color: theme.textSecondary, fontSize: theme.fontSM, fontWeight: "700", marginTop: theme.spaceMD, marginBottom: 8 },
    input: { backgroundColor: theme.bgInput, color: theme.textPrimary, padding: 14, borderRadius: theme.radiusMD, fontSize: theme.fontMD, borderWidth: 1, borderColor: theme.border },
    notesInput: { minHeight: 120, textAlignVertical: "top" },
    photoButtons: { flexDirection: "row", gap: 10 },
    photoButton: { flex: 1, backgroundColor: theme.bgCardAlt, padding: 14, borderRadius: theme.radiusMD, alignItems: "center", borderWidth: 1, borderColor: theme.border },
    photoButtonText: { color: theme.textPrimary, fontWeight: "800", fontSize: theme.fontSM },
    photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: theme.spaceMD },
    photo: { width: 100, height: 100, borderRadius: theme.radiusSM },
    removeText: { color: theme.danger, fontSize: theme.fontXS, marginTop: 4, textAlign: "center" },
    saveButton: { backgroundColor: theme.green, padding: 16, borderRadius: theme.radiusMD, alignItems: "center", marginTop: theme.spaceLG },
    disabledButton: { backgroundColor: theme.textMuted },
    saveText: { color: "#fff", fontWeight: "900", fontSize: theme.fontMD },
    deleteButton: { backgroundColor: theme.dangerBg, padding: 16, borderRadius: theme.radiusMD, alignItems: "center", marginTop: 10, borderWidth: 1, borderColor: theme.danger },
    deleteText: { color: "#fca5a5", fontWeight: "900", fontSize: theme.fontMD },
  });
}
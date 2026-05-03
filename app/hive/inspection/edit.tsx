/**
 * app/hive/inspection/edit.tsx
 *
 * Edit Inspection Screen — loads and edits an existing inspection.
 * Added: Flag for Mentor Review button — sets mentorReview: true in Firestore
 * and navigates to mentor-help screen with the specific inspectionId.
 */

import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NavBar from "../../../components/NavBar";
import { useAppTheme } from "../../../hooks/useAppTheme";
import { db } from "../../../utils/firebase";

export default function EditInspectionScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { inspectionId, hiveId } = useLocalSearchParams<{ inspectionId?: string; hiveId?: string }>();

  const resolvedInspectionId = inspectionId ? String(inspectionId) : "";
  const resolvedHiveId = hiveId ? String(hiveId) : "";

  const [queen, setQueen] = useState("");
  const [brood, setBrood] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [mentorReview, setMentorReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flagging, setFlagging] = useState(false);

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
        setMentorReview(data.mentorReview || false);
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

  const removePhoto = (uri: string) => setPhotoUris((prev) => prev.filter((p) => p !== uri));

  const showSavePrompt = () => {
    if (Platform.OS === "web") {
      const goHome = window.confirm("Inspection saved! 🐝\n\nClick OK to go Home, or Cancel to view the hive.");
      if (goHome) { router.replace("/hive"); }
      else { router.replace({ pathname: "/hive/[id]", params: { id: resolvedHiveId } }); }
    } else {
      Alert.alert("Inspection saved! 🐝", "Where would you like to go?", [
        { text: "View Hive", onPress: () => router.replace({ pathname: "/hive/[id]", params: { id: resolvedHiveId } }) },
        { text: "Go Home", onPress: () => router.replace("/hive") },
      ]);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    try {
      setSaving(true);
      await updateDoc(doc(db, "hives", resolvedHiveId, "inspections", resolvedInspectionId), {
        queen, brood, notes, photoUris, updatedAt: new Date(),
      });
      showSavePrompt();
    } catch {
      Alert.alert("Error saving");
    } finally {
      setSaving(false);
    }
  };

  const handleFlagForMentor = async () => {
    setFlagging(true);
    try {
      await updateDoc(doc(db, "hives", resolvedHiveId, "inspections", resolvedInspectionId), {
        mentorReview: true,
        mentorFlaggedAt: new Date(),
      });
      setMentorReview(true);
      router.push({
        pathname: "/hive/mentor-help",
        params: { id: resolvedHiveId, inspectionId: resolvedInspectionId },
      });
    } catch {
      Alert.alert("Error", "Could not flag inspection. Try again.");
    } finally {
      setFlagging(false);
    }
  };

  const handleClearMentorFlag = async () => {
    try {
      await updateDoc(doc(db, "hives", resolvedHiveId, "inspections", resolvedInspectionId), {
        mentorReview: false,
        mentorFlaggedAt: null,
      });
      setMentorReview(false);
    } catch {
      Alert.alert("Error", "Could not clear flag.");
    }
  };

  const handleDelete = async () => {
    if (Platform.OS === "web") {
      if (window.confirm("Delete this inspection? This cannot be undone.")) {
        await deleteDoc(doc(db, "hives", resolvedHiveId, "inspections", resolvedInspectionId));
        router.replace("/hive");
      }
      return;
    }
    Alert.alert("Delete Inspection?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
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

        {/* Mentor flag status banner */}
        {mentorReview && (
          <View style={S.mentorBanner}>
            <Text style={S.mentorBannerText}>⚠️ Flagged for mentor review</Text>
            <Pressable onPress={handleClearMentorFlag} style={S.clearFlagButton}>
              <Text style={S.clearFlagText}>Clear flag</Text>
            </Pressable>
          </View>
        )}

        <Text style={S.label}>👑 Queen Status</Text>
        <TextInput
          value={queen} onChangeText={setQueen}
          placeholder="e.g. seen, eggs present, not found"
          placeholderTextColor={theme.textMuted}
          style={S.input} returnKeyType="next" blurOnSubmit={false}
          onSubmitEditing={() => broodRef.current?.focus()}
        />

        <Text style={S.label}>🐛 Brood Pattern</Text>
        <TextInput
          ref={broodRef}
          value={brood} onChangeText={setBrood}
          placeholder="e.g. strong, weak, spotty"
          placeholderTextColor={theme.textMuted}
          style={S.input} returnKeyType="next" blurOnSubmit={false}
          onSubmitEditing={() => notesRef.current?.focus()}
        />

        <Text style={S.label}>📝 Notes</Text>
        <TextInput
          ref={notesRef}
          value={notes} onChangeText={setNotes}
          multiline placeholder="Inspection notes..."
          placeholderTextColor={theme.textMuted}
          style={[S.input, S.notesInput]}
          returnKeyType="done" onSubmitEditing={handleSave}
        />

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

        <Pressable style={[S.saveButton, saving && S.disabledButton]} onPress={handleSave}>
          <Text style={S.saveText}>{saving ? "Saving..." : "Save Changes"}</Text>
        </Pressable>

        {/* Mentor flag button */}
        {!mentorReview ? (
          <Pressable
            style={[S.mentorButton, flagging && S.disabledButton]}
            onPress={handleFlagForMentor}
            disabled={flagging}
          >
            <Text style={S.mentorButtonText}>
              {flagging ? "Flagging..." : "🧑‍🏫 Flag for Mentor Review"}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={S.mentorButtonActive}
            onPress={() => router.push({
              pathname: "/hive/mentor-help",
              params: { id: resolvedHiveId, inspectionId: resolvedInspectionId },
            })}
          >
            <Text style={S.mentorButtonActiveText}>🧑‍🏫 Share with Mentor →</Text>
          </Pressable>
        )}

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
    mentorBanner: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: theme.warningBg, borderWidth: 1, borderColor: theme.warning, padding: theme.spaceSM, borderRadius: theme.radiusMD, marginBottom: theme.spaceMD },
    mentorBannerText: { color: theme.honeyLight, fontWeight: "800", fontSize: theme.fontXS },
    clearFlagButton: { backgroundColor: theme.bgCard, paddingVertical: 4, paddingHorizontal: 10, borderRadius: theme.radiusSM, borderWidth: 1, borderColor: theme.border },
    clearFlagText: { color: theme.textMuted, fontSize: theme.fontXS, fontWeight: "700" },
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
    mentorButton: { backgroundColor: theme.bgCardAlt, padding: 16, borderRadius: theme.radiusMD, alignItems: "center", marginTop: 10, borderWidth: 1, borderColor: theme.warning },
    mentorButtonText: { color: theme.honeyLight, fontWeight: "900", fontSize: theme.fontMD },
    mentorButtonActive: { backgroundColor: theme.warningBg, padding: 16, borderRadius: theme.radiusMD, alignItems: "center", marginTop: 10, borderWidth: 1, borderColor: theme.warning },
    mentorButtonActiveText: { color: theme.honey, fontWeight: "900", fontSize: theme.fontMD },
    deleteButton: { backgroundColor: theme.dangerBg, padding: 16, borderRadius: theme.radiusMD, alignItems: "center", marginTop: 10, borderWidth: 1, borderColor: theme.danger },
    deleteText: { color: "#fca5a5", fontWeight: "900", fontSize: theme.fontMD },
  });
}

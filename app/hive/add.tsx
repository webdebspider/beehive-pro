/**
 * app/hive/add.tsx
 *
 * Add Hive Screen — creates a new hive document in Firestore.
 */

import { useRouter } from "expo-router";
import { addDoc, collection } from "firebase/firestore";
import { useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NavBar from "../../components/NavBar";
import { useAuthContext } from "../../context/AuthContext";
import { useAppTheme } from "../../hooks/useAppTheme";
import { db } from "../../utils/firebase";

export default function AddHiveScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { user } = useAuthContext();

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const locationRef = useRef<TextInput>(null);
  const notesRef = useRef<TextInput>(null);

  const showSavePrompt = (hiveId: string) => {
    if (Platform.OS === "web") {
      const goHome = window.confirm(
        "Hive saved! 🐝\n\nClick OK to go Home, or Cancel to view the hive."
      );
      if (goHome) {
        router.replace("/hive");
      } else {
        router.replace({ pathname: "/hive/[id]", params: { id: hiveId } });
      }
    } else {
      Alert.alert(
        "Hive saved! 🐝",
        "Where would you like to go?",
        [
          { text: "View Hive", onPress: () => router.replace({ pathname: "/hive/[id]", params: { id: hiveId } }) },
          { text: "Go Home", onPress: () => router.replace("/hive") },
        ]
      );
    }
  };

  const handleSave = async () => {
    if (saving) return;
    if (!name.trim()) { Alert.alert("Missing name", "Please enter a hive name."); return; }
    if (!user) { Alert.alert("Not signed in", "Please sign in to add a hive."); return; }
    try {
      setSaving(true);
      const docRef = await addDoc(collection(db, "hives"), {
        name: name.trim(),
        location: location.trim(),
        notes: notes.trim(),
        userId: user.uid,
        createdAt: new Date().toISOString(),
      });
      showSavePrompt(docRef.id);
    } catch (e) {
      Alert.alert("Error", "Could not save hive.");
    } finally {
      setSaving(false);
    }
  };

  const S = makeStyles(theme);

  return (
    <SafeAreaView style={S.page}>
      <NavBar />
      <ScrollView contentContainerStyle={S.content}>
        <Text style={S.title}>New Hive</Text>
        <Text style={S.subtitle}>Add a hive to your apiary</Text>

        <Text style={S.label}>🏠 Hive Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. North Yard Hive"
          placeholderTextColor={theme.textMuted}
          style={S.input}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => locationRef.current?.focus()}
        />

        <Text style={S.label}>📍 Location</Text>
        <TextInput
          ref={locationRef}
          value={location}
          onChangeText={setLocation}
          placeholder="e.g. Back field, near the oak tree"
          placeholderTextColor={theme.textMuted}
          style={S.input}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => notesRef.current?.focus()}
        />

        <Text style={S.label}>📝 Notes</Text>
        <TextInput
          ref={notesRef}
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional notes about this hive"
          placeholderTextColor={theme.textMuted}
          style={[S.input, S.notesInput]}
          multiline
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />

        <Pressable
          onPress={handleSave}
          style={[S.saveButton, saving && S.disabledButton]}
          disabled={saving}
        >
          <Text style={S.saveText}>{saving ? "Saving..." : "Save Hive"}</Text>
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
    saveButton: { backgroundColor: theme.green, padding: 16, borderRadius: theme.radiusMD, alignItems: "center", marginTop: theme.spaceLG },
    disabledButton: { backgroundColor: theme.textMuted },
    saveText: { color: "#fff", fontWeight: "900", fontSize: theme.fontMD },
  });
}
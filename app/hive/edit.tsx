/**
 * app/hive/edit.tsx
 *
 * Edit Hive Screen — loads and updates an existing hive document.
 *
 * UX improvements:
 *  - Enter key moves between fields, submits on last field
 *  - After saving, user chooses to view hive or go home
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import NavBar from "../../components/NavBar";
import { useAppTheme } from "../../hooks/useAppTheme";
import { db } from "../../utils/firebase";

export default function EditHiveScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const hiveId = id ? String(id) : "";

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Refs for field focus management
  const locationRef = useRef<TextInput>(null);
  const notesRef = useRef<TextInput>(null);

  useEffect(() => {
    const loadHive = async () => {
      if (!hiveId) { setLoading(false); return; }
      try {
        const snap = await getDoc(doc(db, "hives", hiveId));
        if (snap.exists()) {
          const data = snap.data();
          setName(String(data.name || ""));
          setLocation(String(data.location || ""));
          setNotes(String(data.notes || ""));
        }
      } catch (e) {
        console.log("❌ LOAD HIVE ERROR:", e);
      } finally {
        setLoading(false);
      }
    };
    loadHive();
  }, [hiveId]);

  /** Shows post-save navigation prompt */
  const showSavePrompt = () => {
    Alert.alert(
      "Hive saved! 🐝",
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
    if (saving || deleting) return;
    if (!name.trim()) { Alert.alert("Name required", "Please enter a hive name."); return; }
    try {
      setSaving(true);
      await updateDoc(doc(db, "hives", hiveId), {
        name: name.trim(),
        location: location.trim(),
        notes: notes.trim(),
        updatedAt: new Date(),
      });
      showSavePrompt();
    } catch (e) {
      Alert.alert("Error", "Could not save hive.");
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    try {
      setDeleting(true);
      const inspSnap = await getDocs(collection(db, "hives", hiveId, "inspections"));
      await Promise.all(inspSnap.docs.map((d) => deleteDoc(doc(db, "hives", hiveId, "inspections", d.id))));
      await deleteDoc(doc(db, "hives", hiveId));
      router.replace("/hive");
    } catch (e) {
      Alert.alert("Error", "Could not delete hive.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDelete = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Delete this hive and all its inspections?")) doDelete();
      return;
    }
    Alert.alert("Delete hive?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: doDelete },
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
        <Text style={S.title}>Edit Hive</Text>
        <Text style={S.subtitle}>Update hive details</Text>

        {/* Name — moves to Location on Enter */}
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

        {/* Location — moves to Notes on Enter */}
        <Text style={S.label}>📍 Location</Text>
        <TextInput
          ref={locationRef}
          value={location}
          onChangeText={setLocation}
          placeholder="e.g. Back field"
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
          placeholder="Hive notes..."
          placeholderTextColor={theme.textMuted}
          style={[S.input, S.notesInput]}
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />

        <Pressable
          onPress={handleSave}
          disabled={saving || deleting}
          style={[S.saveButton, (saving || deleting) && S.disabledButton]}
        >
          <Text style={S.saveText}>{saving ? "Saving..." : "Save Hive"}</Text>
        </Pressable>

        <Pressable
          onPress={handleDelete}
          disabled={saving || deleting}
          style={[S.deleteButton, (saving || deleting) && S.disabledButton]}
        >
          <Text style={S.deleteText}>{deleting ? "Deleting..." : "🗑 Delete Hive"}</Text>
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
    deleteButton: { backgroundColor: theme.dangerBg, padding: 16, borderRadius: theme.radiusMD, alignItems: "center", marginTop: 10, borderWidth: 1, borderColor: theme.danger },
    deleteText: { color: "#fca5a5", fontWeight: "900", fontSize: theme.fontMD },
  });
}
/**
 * app/hive/add.tsx
 *
 * Add Hive Screen — creates a new hive document in Firestore.
 * Navigates to the new hive's detail screen after saving.
 *
 * Fields: name (required), location, notes
 */

import { useRouter } from "expo-router";
import { addDoc, collection } from "firebase/firestore";
import { useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { db } from "../../utils/firebase";
import { T } from "../../utils/theme";

export default function AddHiveScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (saving) return;
    if (!name.trim()) {
      Alert.alert("Missing name", "Please enter a hive name.");
      return;
    }
    try {
      setSaving(true);
      const docRef = await addDoc(collection(db, "hives"), {
        name: name.trim(),
        location: location.trim(),
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
      });
      router.replace({ pathname: "/hive/[id]", params: { id: docRef.id } });
    } catch (e) {
      console.log("❌ SAVE HIVE ERROR:", e);
      Alert.alert("Error", "Could not save hive.");
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
        <Text style={styles.title}>New Hive</Text>
        <Text style={styles.subtitle}>Add a hive to your apiary</Text>

        <Text style={styles.label}>🏠 Hive Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. North Yard Hive"
          placeholderTextColor={T.textMuted}
          style={styles.input}
        />

        <Text style={styles.label}>📍 Location</Text>
        <TextInput
          value={location}
          onChangeText={setLocation}
          placeholder="e.g. Back field, near the oak tree"
          placeholderTextColor={T.textMuted}
          style={styles.input}
        />

        <Text style={styles.label}>📝 Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional notes about this hive"
          placeholderTextColor={T.textMuted}
          style={[styles.input, styles.notesInput]}
          multiline
        />

        <Pressable
          onPress={handleSave}
          style={[styles.saveButton, saving && styles.disabledButton]}
          disabled={saving}
        >
          <Text style={styles.saveText}>
            {saving ? "Saving..." : "Save Hive"}
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
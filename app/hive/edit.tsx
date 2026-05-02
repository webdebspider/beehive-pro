/**
 * app/hive/edit.tsx
 *
 * Edit Hive Screen — loads and updates an existing hive document.
 * Delete removes the hive AND all its inspections from Firestore.
 * Uses window.confirm on web, Alert on native for delete confirmation.
 *
 * Route params:
 *  - id: Firestore hive document ID
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
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
import { db } from "../../utils/firebase";
import { T } from "../../utils/theme";

export default function EditHiveScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const hiveId = id ? String(id) : "";

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
        } else {
          Alert.alert("Hive not found", "This hive could not be found.");
        }
      } catch (e) {
        console.log("❌ LOAD HIVE ERROR:", e);
        Alert.alert("Error", "Could not load hive.");
      } finally {
        setLoading(false);
      }
    };
    loadHive();
  }, [hiveId]);

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
      router.replace({ pathname: "/hive/[id]", params: { id: hiveId } });
    } catch (e) {
      console.log("❌ SAVE HIVE ERROR:", e);
      Alert.alert("Error", "Could not save hive.");
    } finally {
      setSaving(false);
    }
  };

  /** Deletes hive + all its inspections from Firestore */
  const doDelete = async () => {
    if (saving || deleting) return;
    try {
      setDeleting(true);
      const inspSnap = await getDocs(collection(db, "hives", hiveId, "inspections"));
      await Promise.all(inspSnap.docs.map((d) => deleteDoc(doc(db, "hives", hiveId, "inspections", d.id))));
      await deleteDoc(doc(db, "hives", hiveId));
      router.replace("/hive");
    } catch (e) {
      console.log("❌ DELETE HIVE ERROR:", e);
      Alert.alert("Error", "Could not delete hive.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDelete = () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Delete this hive and all its inspections? This cannot be undone.");
      if (confirmed) doDelete();
      return;
    }
    Alert.alert("Delete hive?", "This will delete the hive and all inspections. This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: doDelete },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={T.honey} size="large" />
        <Text style={styles.loadingText}>Loading hive...</Text>
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
        <Text style={styles.title}>Edit Hive</Text>
        <Text style={styles.subtitle}>Update hive details</Text>

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
          placeholder="e.g. Back field"
          placeholderTextColor={T.textMuted}
          style={styles.input}
        />

        <Text style={styles.label}>📝 Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="Hive notes..."
          placeholderTextColor={T.textMuted}
          style={[styles.input, styles.notesInput]}
        />

        <Pressable
          onPress={handleSave}
          disabled={saving || deleting}
          style={[styles.saveButton, (saving || deleting) && styles.disabledButton]}
        >
          <Text style={styles.saveText}>{saving ? "Saving..." : "Save Hive"}</Text>
        </Pressable>

        <Pressable
          onPress={handleDelete}
          disabled={saving || deleting}
          style={[styles.deleteButton, (saving || deleting) && styles.disabledButton]}
        >
          <Text style={styles.deleteText}>
            {deleting ? "Deleting..." : "🗑 Delete Hive"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, backgroundColor: T.bg, justifyContent: "center", alignItems: "center" },
  loadingText: { color: T.textSecondary, marginTop: 12 },
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
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { db } from "../../utils/firebase";

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
      if (!hiveId) {
        setLoading(false);
        return;
      }

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

    if (!hiveId) {
      Alert.alert("Missing Hive", "No hive ID was provided.");
      return;
    }

    if (!name.trim()) {
      Alert.alert("Name required", "Please enter a hive name.");
      return;
    }

    try {
      setSaving(true);

      await updateDoc(doc(db, "hives", hiveId), {
        name: name.trim(),
        location: location.trim(),
        notes: notes.trim(),
        updatedAt: new Date(),
      });

      router.replace({
        pathname: "/hive/[id]",
        params: { id: hiveId },
      });
    } catch (e) {
      console.log("❌ SAVE HIVE ERROR:", e);
      Alert.alert("Error", "Could not save hive.");
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (saving || deleting) return;

    if (!hiveId) {
      Alert.alert("Missing Hive", "No hive ID was provided.");
      return;
    }

    try {
      setDeleting(true);

      const inspectionsSnap = await getDocs(
        collection(db, "hives", hiveId, "inspections")
      );

      await Promise.all(
        inspectionsSnap.docs.map((inspectionDoc) =>
          deleteDoc(doc(db, "hives", hiveId, "inspections", inspectionDoc.id))
        )
      );

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
    console.log("🔥 DELETE HIVE PRESSED");

    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Delete this hive and all its inspections? This cannot be undone."
      );

      if (confirmed) doDelete();
      return;
    }

    Alert.alert(
      "Delete hive?",
      "This will delete the hive and all inspections. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: doDelete },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.meta}>Loading hive...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.content}>
        <Text style={styles.title}>Edit Hive</Text>
        <Text style={styles.meta}>Hive ID: {hiveId || "Missing"}</Text>

        <Text style={styles.label}>Hive Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Example: North Yard Hive 1"
          placeholderTextColor="#64748b"
          style={styles.input}
        />

        <Text style={styles.label}>Location</Text>
        <TextInput
          value={location}
          onChangeText={setLocation}
          placeholder="Example: Back field"
          placeholderTextColor="#64748b"
          style={styles.input}
        />

        <Text style={styles.label}>Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="Hive notes..."
          placeholderTextColor="#64748b"
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
            {deleting ? "Deleting..." : "Delete Hive"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            router.replace({
              pathname: "/hive/[id]",
              params: { id: hiveId },
            })
          }
          style={styles.backButton}
        >
          <Text style={styles.backText}>Back to Hive</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  content: {
    padding: 20,
  },
  center: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
  },
  meta: {
    color: "#9ca3af",
    marginTop: 6,
    marginBottom: 12,
  },
  label: {
    color: "#9ca3af",
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#1e293b",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
  },
  notesInput: {
    height: 110,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: "#22c55e",
    padding: 16,
    borderRadius: 10,
    marginTop: 20,
  },
  deleteButton: {
    backgroundColor: "#ef4444",
    padding: 16,
    borderRadius: 10,
    marginTop: 12,
  },
  disabledButton: {
    backgroundColor: "#64748b",
  },
  saveText: {
    color: "#0f172a",
    textAlign: "center",
    fontWeight: "800",
  },
  deleteText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
  },
  backButton: {
    backgroundColor: "#475569",
    padding: 14,
    borderRadius: 10,
    marginTop: 12,
  },
  backText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
  },
});
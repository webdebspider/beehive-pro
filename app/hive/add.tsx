import { useRouter } from "expo-router";
import { addDoc, collection } from "firebase/firestore";
import { useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from "react-native";
import { db } from "../../utils/firebase";

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
      console.log("🔥 SAVING HIVE");

      const docRef = await addDoc(collection(db, "hives"), {
        name: name.trim(),
        location: location.trim(),
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
      });

      console.log("✅ HIVE SAVED:", docRef.id);

      router.replace({
        pathname: "/hive/[id]",
        params: { id: docRef.id },
      });
    } catch (e) {
      console.log("❌ SAVE HIVE ERROR:", e);
      Alert.alert("Error", "Could not save hive.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ padding: 20 }}>
        <Text style={{ color: "#fff", fontSize: 28, fontWeight: "700" }}>
          Add Hive
        </Text>

        <Text style={{ color: "#9ca3af", marginTop: 18 }}>Hive Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Example: North Yard Hive"
          placeholderTextColor="#64748b"
          style={styles.input}
        />

        <Text style={{ color: "#9ca3af", marginTop: 15 }}>Location</Text>
        <TextInput
          value={location}
          onChangeText={setLocation}
          placeholder="Example: Back field"
          placeholderTextColor="#64748b"
          style={styles.input}
        />

        <Text style={{ color: "#9ca3af", marginTop: 15 }}>Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional notes"
          placeholderTextColor="#64748b"
          style={[styles.input, { height: 100 }]}
          multiline
        />

        <Pressable
          onPress={handleSave}
          style={[
            styles.button,
            { backgroundColor: saving ? "#64748b" : "#22c55e" },
          ]}
        >
          <Text style={{ textAlign: "center", fontWeight: "700" }}>
            {saving ? "Saving..." : "Save Hive"}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.push("/hive")} style={styles.back}>
          <Text style={{ color: "#fff", textAlign: "center", fontWeight: "700" }}>
            Back to Hive List
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = {
  input: {
    backgroundColor: "#1e293b",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
    marginTop: 6,
  },
  button: {
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
  },
  back: {
    backgroundColor: "#475569",
    padding: 14,
    borderRadius: 10,
    marginTop: 12,
  },
};
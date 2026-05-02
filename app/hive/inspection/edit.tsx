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

export default function EditInspectionScreen() {
  const router = useRouter();
  const { id, hiveId } = useLocalSearchParams<{ id?: string; hiveId?: string }>();

  const inspectionId = id ? String(id) : "";
  const parentHiveId = hiveId ? String(hiveId) : "";

  const [notes, setNotes] = useState("");
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadInspection();
  }, []);

  const loadInspection = async () => {
    try {
      const ref = doc(db, "hives", parentHiveId, "inspections", inspectionId);
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
    if (!permission.granted) {
      Alert.alert("Permission needed");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const selected = result.assets.map((a) => a.uri);
      setPhotoUris((prev) => [...prev, ...selected]);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });

    if (!result.canceled) {
      setPhotoUris((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removePhoto = (uri: string) => {
    setPhotoUris((prev) => prev.filter((p) => p !== uri));
  };

  const handleSave = async () => {
    if (saving) return;

    try {
      setSaving(true);

      await updateDoc(
        doc(db, "hives", parentHiveId, "inspections", inspectionId),
        {
          notes,
          photoUris,
          updatedAt: new Date(),
        }
      );

      router.replace({
        pathname: "/hive/[id]",
        params: { id: parentHiveId },
      });
    } catch (e) {
      console.log("❌ SAVE ERROR:", e);
      Alert.alert("Error saving");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert("Delete?", "This cannot be undone", [
      { text: "Cancel" },
      {
        text: "Delete",
        onPress: async () => {
          await deleteDoc(
            doc(db, "hives", parentHiveId, "inspections", inspectionId)
          );

          router.replace({
            pathname: "/hive/[id]",
            params: { id: parentHiveId },
          });
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Edit Inspection</Text>

        <Text style={styles.label}>Photos</Text>

        <View style={styles.row}>
          <Pressable style={styles.button} onPress={takePhoto}>
            <Text style={styles.buttonText}>📷 Camera</Text>
          </Pressable>

          <Pressable style={styles.button} onPress={pickPhoto}>
            <Text style={styles.buttonText}>🖼️ Gallery</Text>
          </Pressable>
        </View>

        <View style={styles.photoGrid}>
          {photoUris.map((uri) => (
            <Pressable key={uri} onPress={() => removePhoto(uri)}>
              <Image source={{ uri }} style={styles.photo} />
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          multiline
          style={styles.input}
        />

        <Pressable style={styles.save} onPress={handleSave}>
          <Text style={styles.saveText}>
            {saving ? "Saving..." : "Save"}
          </Text>
        </Pressable>

        <Pressable style={styles.delete} onPress={handleDelete}>
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0f172a" },
  content: { padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  title: { color: "#fff", fontSize: 26, fontWeight: "800" },
  label: { color: "#9ca3af", marginTop: 12 },

  row: { flexDirection: "row", gap: 10, marginTop: 8 },

  button: {
    backgroundColor: "#334155",
    padding: 12,
    borderRadius: 10,
    flex: 1,
  },

  buttonText: { color: "#fff", textAlign: "center", fontWeight: "800" },

  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },

  photo: {
    width: 110,
    height: 110,
    borderRadius: 10,
  },

  input: {
    backgroundColor: "#1e293b",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
    height: 100,
    marginTop: 8,
  },

  save: {
    backgroundColor: "#22c55e",
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
  },

  saveText: {
    textAlign: "center",
    fontWeight: "800",
    color: "#0f172a",
  },

  delete: {
    backgroundColor: "#ef4444",
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
  },

  deleteText: {
    textAlign: "center",
    fontWeight: "800",
    color: "#fff",
  },
});
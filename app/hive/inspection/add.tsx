import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, serverTimestamp, updateDoc } from "firebase/firestore";
import { useState } from "react";
import {
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
import { uploadInspectionPhotos } from "../../../utils/uploadInspectionPhotos";

export default function AddInspectionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const hiveId = id ? String(id) : "";

  const [queen, setQueen] = useState("");
  const [brood, setBrood] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });
    if (!result.canceled) {
      setPhotoUris((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });
    if (!result.canceled) {
      setPhotoUris((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removePhoto = (uri: string) => {
    setPhotoUris((prev) => prev.filter((item) => item !== uri));
  };

  const handleSave = async () => {
    if (saving) return;
    if (!hiveId) {
      Alert.alert("Missing Hive", "No hive ID was provided.");
      return;
    }
    try {
      setSaving(true);
      const docRef = await addDoc(collection(db, "hives", hiveId, "inspections"), {
        hiveId,
        queen,
        brood,
        notes: notes.trim(),
        photoUris: [],
        photoUrls: [],
        createdAt: serverTimestamp(),
        date: new Date().toISOString(),
      });
      if (photoUris.length > 0) {
        const uploadedUrls = await uploadInspectionPhotos(hiveId, docRef.id, photoUris);
        await updateDoc(docRef, {
          photoUris: uploadedUrls,
          photoUrls: uploadedUrls,
          photosUploaded: true,
          updatedAt: new Date(),
        });
      }
      router.replace({
        pathname: "/hive/[id]",
        params: { id: hiveId },
      });
    } catch (e) {
      console.log("SAVE INSPECTION ERROR", e);
      Alert.alert("Save failed", "The inspection could not be saved.");
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
        <Text style={styles.title}>Add Inspection</Text>

        <Text style={styles.label}>Queen</Text>
        <TextInput
          placeholder="Example: seen, eggs, not found"
          placeholderTextColor="#888"
          value={queen}
          onChangeText={setQueen}
          style={styles.input}
        />

        <Text style={styles.label}>Brood</Text>
        <TextInput
          placeholder="Example: strong, weak, spotty"
          placeholderTextColor="#888"
          value={brood}
          onChangeText={setBrood}
          style={styles.input}
        />

        <Text style={styles.label}>Notes</Text>
        <TextInput
          placeholder="Inspection notes"
          placeholderTextColor="#888"
          value={notes}
          onChangeText={setNotes}
          multiline
          style={[styles.input, styles.notesInput]}
        />

        <Text style={styles.label}>Photos</Text>
        <View style={styles.photoButtons}>
          <Pressable onPress={takePhoto} style={styles.button}>
            <Text style={styles.buttonText}>Take Photo</Text>
          </Pressable>
          <Pressable onPress={pickPhoto} style={styles.button}>
            <Text style={styles.buttonText}>Pick Photo</Text>
          </Pressable>
        </View>

        {photoUris.length > 0 && (
          <View style={styles.photoGrid}>
            {photoUris.map((uri) => (
              <Pressable key={uri} onPress={() => removePhoto(uri)}>
                <Image source={{ uri }} style={styles.preview} />
                <Text style={styles.removeText}>Tap to remove</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveButton, saving && styles.disabledButton]}
        >
          <Text style={styles.saveText}>
            {saving ? "Saving..." : "Save Inspection"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0f172a" },
  navBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  navButton: {
    backgroundColor: "#1e293b",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  navButtonText: {
    color: "#94a3b8",
    fontWeight: "700",
    fontSize: 14,
  },
  content: { padding: 20, paddingBottom: 50 },
  title: { color: "#fff", fontSize: 26, fontWeight: "800", marginBottom: 8 },
  label: { color: "#9ca3af", marginTop: 14, marginBottom: 6 },
  input: {
    backgroundColor: "#1e293b",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  photoButtons: {
    flexDirection: "row",
    marginTop: 6,
  },
  button: {
    flex: 1,
    backgroundColor: "#334155",
    padding: 12,
    borderRadius: 10,
    marginRight: 8,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
  },
  preview: {
    width: 110,
    height: 110,
    borderRadius: 10,
    marginRight: 10,
    marginBottom: 4,
  },
  removeText: {
    color: "#fca5a5",
    fontSize: 11,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: "#22c55e",
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: "#64748b",
  },
  saveText: {
    color: "#0f172a",
    textAlign: "center",
    fontWeight: "800",
  },
});
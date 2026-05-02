/**
 * app/hive/inspection/quick.tsx
 *
 * Quick Inspection Screen — large tap-target buttons for fast field inspections.
 * Designed for outdoor use with gloves on.
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection } from "firebase/firestore";
import { useState } from "react";
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import NavBar from "../../../components/NavBar";
import { db } from "../../../utils/firebase";
import { removePendingInspectionBackup, savePendingInspectionBackup } from "../../../utils/localBackup";
import { T } from "../../../utils/theme";

export default function QuickInspectionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const hiveId = id ? String(id) : "";
  const [queen, setQueen] = useState("");
  const [brood, setBrood] = useState("");
  const [mites, setMites] = useState("");
  const [hiveBeetles, setHiveBeetles] = useState("");
  const [temperament, setTemperament] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (saving) return;
    if (!hiveId) { Alert.alert("Missing Hive", "No hive ID provided."); return; }
    const backupId = `quick_inspection_${Date.now()}`;
    const now = new Date();
    const inspectionData = { id: backupId, hiveId, queen, brood, mites, hiveBeetles, temperament, notes: "Quick inspection entry.", combFindings: [], date: now.toISOString(), createdAt: now.toISOString(), synced: false, quickMode: true };
    try {
      setSaving(true);
      await savePendingInspectionBackup(inspectionData);
      await addDoc(collection(db, "hives", hiveId, "inspections"), { hiveId, queen, brood, mites, hiveBeetles, temperament, notes: "Quick inspection entry.", combFindings: [], date: now.toISOString(), createdAt: now, quickMode: true });
      await removePendingInspectionBackup(backupId);
      router.replace({ pathname: "/hive/[id]", params: { id: hiveId } });
    } catch (e) {
      Alert.alert("Saved locally", "Quick inspection saved on this device and will sync later.");
      router.replace({ pathname: "/hive/[id]", params: { id: hiveId } });
    } finally {
      setSaving(false);
    }
  };

  const Option = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
    <Pressable onPress={onPress} style={[styles.option, selected && styles.optionSelected]}>
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.page}>
      <NavBar />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>⚡ Quick Inspection</Text>
        <Text style={styles.subtitle}>Big buttons. Fast hive check.</Text>
        <Text style={styles.label}>👑 Queen</Text>
        <View style={styles.grid}>
          <Option label="Seen" selected={queen === "seen"} onPress={() => setQueen("seen")} />
          <Option label="Eggs" selected={queen === "eggs"} onPress={() => setQueen("eggs")} />
          <Option label="Not Found" selected={queen === "not_found"} onPress={() => setQueen("not_found")} />
          <Option label="Queen Cells" selected={queen === "cells"} onPress={() => setQueen("cells")} />
        </View>
        <Text style={styles.label}>🐛 Brood</Text>
        <View style={styles.grid}>
          <Option label="Strong" selected={brood === "strong"} onPress={() => setBrood("strong")} />
          <Option label="Medium" selected={brood === "medium"} onPress={() => setBrood("medium")} />
          <Option label="Weak" selected={brood === "weak"} onPress={() => setBrood("weak")} />
          <Option label="Spotty" selected={brood === "spotty"} onPress={() => setBrood("spotty")} />
        </View>
        <Text style={styles.label}>🔬 Mites</Text>
        <View style={styles.grid}>
          <Option label="0" selected={mites === "0"} onPress={() => setMites("0")} />
          <Option label="1-2" selected={mites === "2"} onPress={() => setMites("2")} />
          <Option label="3-5" selected={mites === "5"} onPress={() => setMites("5")} />
          <Option label="6-10" selected={mites === "6-10"} onPress={() => setMites("6-10")} />
          <Option label="10+" selected={mites === "10+"} onPress={() => setMites("10+")} />
        </View>
        <Text style={styles.label}>🪲 Hive Beetles</Text>
        <View style={styles.grid}>
          <Option label="None" selected={hiveBeetles === "none"} onPress={() => setHiveBeetles("none")} />
          <Option label="Few" selected={hiveBeetles === "few"} onPress={() => setHiveBeetles("few")} />
          <Option label="Moderate" selected={hiveBeetles === "moderate"} onPress={() => setHiveBeetles("moderate")} />
          <Option label="Heavy" selected={hiveBeetles === "heavy"} onPress={() => setHiveBeetles("heavy")} />
        </View>
        <Text style={styles.label}>😤 Temperament</Text>
        <View style={styles.grid}>
          <Option label="Calm" selected={temperament === "calm"} onPress={() => setTemperament("calm")} />
          <Option label="Active" selected={temperament === "active"} onPress={() => setTemperament("active")} />
          <Option label="Defensive" selected={temperament === "defensive"} onPress={() => setTemperament("defensive")} />
        </View>
        <Pressable onPress={handleSave} style={[styles.saveButton, saving && styles.disabledButton]} disabled={saving}>
          <Text style={styles.saveText}>{saving ? "Saving..." : "Save Quick Inspection"}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: T.bg },
  content: { padding: T.spaceMD, paddingBottom: 50 },
  title: { color: T.textPrimary, fontSize: T.fontLG, fontWeight: "900", marginBottom: 4 },
  subtitle: { color: T.textMuted, fontSize: T.fontSM, marginBottom: T.spaceMD },
  label: { color: T.textPrimary, fontSize: T.fontMD, fontWeight: "900", marginTop: T.spaceLG, marginBottom: T.spaceSM },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  option: { backgroundColor: T.bgCard, paddingVertical: 18, paddingHorizontal: 14, borderRadius: T.radiusMD, minWidth: "46%", alignItems: "center", borderWidth: 2, borderColor: T.border, flex: 1 },
  optionSelected: { backgroundColor: T.honey, borderColor: T.honeyLight },
  optionText: { color: T.textSecondary, fontSize: T.fontMD, fontWeight: "900" },
  optionTextSelected: { color: T.bg },
  saveButton: { backgroundColor: T.green, padding: 18, borderRadius: T.radiusMD, alignItems: "center", marginTop: T.spaceXL },
  disabledButton: { backgroundColor: T.textMuted },
  saveText: { color: "#fff", fontWeight: "900", fontSize: T.fontMD },
});
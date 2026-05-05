/**
 * app/hive/inspection/quick.tsx
 *
 * Quick Inspection Screen — large tap-target buttons for fast field inspections.
 *
 * Beginner mode: hints shown under each category, selected options show descriptions.
 * Queen is multi-select, all others single select.
 *
 * Voice fix: useEffect watches voice params and applies them after mount,
 * since useState initializers miss params that arrive after first render.
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NavBar from "../../../components/NavBar";
import { useSettingsContext } from "../../../context/SettingsContext";
import { useAppTheme } from "../../../hooks/useAppTheme";
import { db } from "../../../utils/firebase";
import { removePendingInspectionBackup, savePendingInspectionBackup } from "../../../utils/localBackup";

const QUEEN_OPTIONS = [
  { value: "seen",      label: "Seen",        hint: "You spotted the queen herself moving on the comb." },
  { value: "eggs",      label: "Eggs",        hint: "Tiny white grains standing upright in cells — queen was here within 3 days." },
  { value: "not_found", label: "Not Found",   hint: "Could not locate queen or fresh eggs. May need a recheck." },
  { value: "cells",     label: "Queen Cells", hint: "Large peanut-shaped cells — bees may be preparing to swarm or replace queen." },
];

const BROOD_OPTIONS = [
  { value: "strong", label: "Strong", hint: "Solid compact pattern, healthy C-shaped larvae, good coverage." },
  { value: "medium", label: "Medium", hint: "Some gaps but generally decent pattern and healthy appearance." },
  { value: "weak",   label: "Weak",   hint: "Sparse brood, few larvae, colony may be struggling." },
  { value: "spotty", label: "Spotty", hint: "Many random empty cells — possible disease or failing queen." },
];

const MITES_OPTIONS = [
  { value: "0",    label: "0",    hint: "No mites visible on bees or in cells." },
  { value: "2",    label: "1-2",  hint: "Very low mite count — monitor regularly." },
  { value: "5",    label: "3-5",  hint: "Moderate — consider treatment soon." },
  { value: "6-10", label: "6-10", hint: "High — treatment recommended." },
  { value: "10+",  label: "10+",  hint: "Critical — treat immediately." },
];

const BEETLE_OPTIONS = [
  { value: "none",     label: "None",     hint: "No small hive beetles spotted." },
  { value: "few",      label: "Few",      hint: "1-5 beetles — colony is managing them." },
  { value: "moderate", label: "Moderate", hint: "Several beetles visible — watch closely." },
  { value: "heavy",    label: "Heavy",    hint: "Many beetles overwhelming defenses — action needed." },
];

const TEMPERAMENT_OPTIONS = [
  { value: "calm",      label: "Calm",      hint: "Bees barely notice you — great sign." },
  { value: "active",    label: "Active",    hint: "Bees are buzzing around but not aggressive." },
  { value: "defensive", label: "Defensive", hint: "Bees are stinging, following, or fanning aggressively." },
];

const HEALTH_CONCERN_OPTIONS = [
  { value: "afb",           label: "AFB",           emoji: "🦠", color: "#ef4444" },
  { value: "efb",           label: "EFB",           emoji: "🦠", color: "#f97316" },
  { value: "chalkbrood",    label: "Chalkbrood",    emoji: "🍄", color: "#f59e0b" },
  { value: "sacbrood",      label: "Sacbrood",      emoji: "🦠", color: "#f59e0b" },
  { value: "nosema",        label: "Nosema",        emoji: "🦠", color: "#f97316" },
  { value: "dwv",           label: "Deformed Wings",emoji: "🦠", color: "#f97316" },
  { value: "wax_moths",     label: "Wax Moths",     emoji: "🦋", color: "#f59e0b" },
  { value: "tracheal_mites",label: "Tracheal Mites",emoji: "🔬", color: "#f59e0b" },
  { value: "bears",         label: "Bear Damage",   emoji: "🐻", color: "#ef4444" },
  { value: "pesticides",    label: "Pesticides",    emoji: "☠️", color: "#ef4444" },
  { value: "ants",          label: "Ants",          emoji: "🐜", color: "#22c55e" },
  { value: "wasps",         label: "Wasps/Hornets", emoji: "🐝", color: "#f59e0b" },
];

export default function QuickInspectionScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { settings } = useSettingsContext();
  const isBeginner = settings.appMode === "beginner";

  const {
    id,
    voiceQueen,
    voiceBrood,
    voiceMites,
    voiceBeetles,
    voiceTemperament,
  } = useLocalSearchParams<{
    id?: string;
    voiceQueen?: string;
    voiceBrood?: string;
    voiceMites?: string;
    voiceBeetles?: string;
    voiceTemperament?: string;
  }>();

  const hiveId = id ? String(id) : "";

  const [queenSelections, setQueenSelections] = useState<Set<string>>(new Set());
  const [brood, setBrood] = useState("");
  const [mites, setMites] = useState("");
  const [hiveBeetles, setHiveBeetles] = useState("");
  const [temperament, setTemperament] = useState("");
  const [saving, setSaving] = useState(false);
  const [healthConcerns, setHealthConcerns] = useState<Set<string>>(new Set());
  const [voiceFilled, setVoiceFilled] = useState(false);

  // Apply voice params via useEffect so they're picked up even when
  // params arrive after the component first mounts
  useEffect(() => {
    const hasVoice = voiceQueen || voiceBrood || voiceMites || voiceBeetles || voiceTemperament;
    if (!hasVoice) return;
    if (voiceQueen) {
      const vals = String(voiceQueen).split(",").map((s) => s.trim()).filter(Boolean);
      if (vals.length > 0) setQueenSelections(new Set(vals));
    }
    if (voiceBrood) setBrood(String(voiceBrood));
    if (voiceMites) setMites(String(voiceMites));
    if (voiceBeetles) setHiveBeetles(String(voiceBeetles));
    if (voiceTemperament) setTemperament(String(voiceTemperament));
    setVoiceFilled(true);
  }, [voiceQueen, voiceBrood, voiceMites, voiceBeetles, voiceTemperament]);

  const toggleHealthConcern = (value: string) => {
    setHealthConcerns((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const toggleQueen = (value: string) => {
    setQueenSelections((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const handleSave = async () => {
    if (saving) return;
    if (!hiveId) { Alert.alert("Missing Hive", "No hive ID provided."); return; }
    const queenValue = Array.from(queenSelections).join(", ");
    const backupId = `quick_inspection_${Date.now()}`;
    const now = new Date();
    const inspectionData = {
      id: backupId, hiveId,
      queen: queenValue, brood, mites, hiveBeetles, temperament,
      notes: "Quick inspection entry.",
      combFindings: [],
      date: now.toISOString(),
      createdAt: now.toISOString(),
      synced: false,
      quickMode: true,
    };
    try {
      setSaving(true);
      await savePendingInspectionBackup(inspectionData);
      await addDoc(collection(db, "hives", hiveId, "inspections"), {
        hiveId, queen: queenValue, brood, mites, hiveBeetles, temperament,
        healthConcerns: Array.from(healthConcerns),
        notes: healthConcerns.size > 0 ? `Quick inspection entry. Health concerns noted: ${Array.from(healthConcerns).join(", ")}.` : "Quick inspection entry.",
        combFindings: [],
        date: now.toISOString(),
        createdAt: now,
        quickMode: true,
      });
      await removePendingInspectionBackup(backupId);
      router.replace({ pathname: "/hive/[id]", params: { id: hiveId } });
    } catch {
      Alert.alert("Saved locally", "Quick inspection saved on this device and will sync later.");
      router.replace({ pathname: "/hive/[id]", params: { id: hiveId } });
    } finally {
      setSaving(false);
    }
  };

  const S = makeStyles(theme);

  const SingleOption = ({
    label, hint, selected, onPress,
  }: { label: string; hint: string; selected: boolean; onPress: () => void }) => (
    <Pressable onPress={onPress} style={[S.option, selected && S.optionSelected]}>
      <Text style={[S.optionText, selected && S.optionTextSelected]}>{label}</Text>
      {isBeginner && selected && <Text style={S.optionHint}>{hint}</Text>}
    </Pressable>
  );

  const MultiOption = ({ label, hint, value }: { label: string; hint: string; value: string }) => {
    const selected = queenSelections.has(value);
    return (
      <Pressable onPress={() => toggleQueen(value)} style={[S.option, selected && S.optionSelected]}>
        <View style={S.optionRow}>
          <Text style={[S.optionText, selected && S.optionTextSelected]}>{label}</Text>
          {selected && <Text style={S.checkMark}>✓</Text>}
        </View>
        {isBeginner && selected && <Text style={S.optionHint}>{hint}</Text>}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={S.page}>
      <NavBar />
      <ScrollView contentContainerStyle={S.content}>
        <View style={S.titleRow}>
          <View>
            <Text style={S.title}>⚡ Quick Inspection</Text>
            <Text style={S.subtitle}>
              {isBeginner
                ? "Tap all that apply. Selected options show hints to help you confirm."
                : "Big buttons. Fast hive check."}
            </Text>
          </View>
          <Pressable
            style={S.voiceButton}
            onPress={() => router.push({ pathname: "/hive/voice-log", params: { id: hiveId, source: "quick" } })}
          >
            <Text style={S.voiceButtonText}>🎙️ Voice</Text>
          </Pressable>
        </View>

        {voiceFilled && (
          <View style={S.voiceFillBanner}>
            <Text style={S.voiceFillText}>🎙️ Fields pre-filled from voice — review and adjust below</Text>
          </View>
        )}

        <View style={S.categoryHeader}>
          <Text style={S.label}>👑 Queen</Text>
          {isBeginner && <Text style={S.categoryHint}>Select all that you observe</Text>}
        </View>
        {isBeginner && queenSelections.size === 0 && (
          <View style={S.beginnerTip}>
            <Text style={S.beginnerTipText}>💡 Look for the queen herself, fresh eggs, or special cells. You can select more than one!</Text>
          </View>
        )}
        <View style={S.grid}>
          {QUEEN_OPTIONS.map((opt) => (
            <MultiOption key={opt.value} label={opt.label} hint={opt.hint} value={opt.value} />
          ))}
        </View>

        <View style={S.categoryHeader}>
          <Text style={S.label}>🐛 Brood</Text>
          {isBeginner && <Text style={S.categoryHint}>How does the brood pattern look?</Text>}
        </View>
        {isBeginner && !brood && (
          <View style={S.beginnerTip}>
            <Text style={S.beginnerTipText}>💡 Look at the center frames — is the capped brood solid or patchy?</Text>
          </View>
        )}
        <View style={S.grid}>
          {BROOD_OPTIONS.map((opt) => (
            <SingleOption key={opt.value} label={opt.label} hint={opt.hint} selected={brood === opt.value} onPress={() => setBrood(opt.value)} />
          ))}
        </View>

        <View style={S.categoryHeader}>
          <Text style={S.label}>🔬 Mites</Text>
          {isBeginner && <Text style={S.categoryHint}>Estimated mites per 100 bees</Text>}
        </View>
        {isBeginner && !mites && (
          <View style={S.beginnerTip}>
            <Text style={S.beginnerTipText}>💡 Check for reddish-brown dots on bee bodies, especially on the abdomen between segments.</Text>
          </View>
        )}
        <View style={S.grid}>
          {MITES_OPTIONS.map((opt) => (
            <SingleOption key={opt.value} label={opt.label} hint={opt.hint} selected={mites === opt.value} onPress={() => setMites(opt.value)} />
          ))}
        </View>

        <View style={S.categoryHeader}>
          <Text style={S.label}>🪲 Hive Beetles</Text>
          {isBeginner && <Text style={S.categoryHint}>Small dark beetles hiding in corners</Text>}
        </View>
        {isBeginner && !hiveBeetles && (
          <View style={S.beginnerTip}>
            <Text style={S.beginnerTipText}>💡 Small hive beetles are about 5mm long, dark brown/black, and run from light. Check frame corners and edges.</Text>
          </View>
        )}
        <View style={S.grid}>
          {BEETLE_OPTIONS.map((opt) => (
            <SingleOption key={opt.value} label={opt.label} hint={opt.hint} selected={hiveBeetles === opt.value} onPress={() => setHiveBeetles(opt.value)} />
          ))}
        </View>

        <View style={S.categoryHeader}>
          <Text style={S.label}>😤 Temperament</Text>
          {isBeginner && <Text style={S.categoryHint}>How are the bees behaving today?</Text>}
        </View>
        {isBeginner && !temperament && (
          <View style={S.beginnerTip}>
            <Text style={S.beginnerTipText}>💡 Calm bees walk slowly and ignore you. Defensive bees fly at your face, sting, or follow you when you step back.</Text>
          </View>
        )}
        <View style={S.grid}>
          {TEMPERAMENT_OPTIONS.map((opt) => (
            <SingleOption key={opt.value} label={opt.label} hint={opt.hint} selected={temperament === opt.value} onPress={() => setTemperament(opt.value)} />
          ))}
        </View>

        <View style={S.categoryHeader}>
          <Text style={S.label}>🏥 Health Concerns</Text>
          {isBeginner && <Text style={S.categoryHint}>Tap any issues you spot</Text>}
        </View>
        {isBeginner && healthConcerns.size === 0 && (
          <View style={S.beginnerTip}>
            <Text style={S.beginnerTipText}>💡 Tap any diseases, pests, or threats you observe. Use the Health Log screen for full details and treatment guidance.</Text>
          </View>
        )}
        <View style={S.healthGrid}>
          {HEALTH_CONCERN_OPTIONS.map((opt) => {
            const selected = healthConcerns.has(opt.value);
            return (
              <Pressable key={opt.value} onPress={() => toggleHealthConcern(opt.value)} style={[S.healthChip, { borderColor: selected ? opt.color : theme.border }, selected && { backgroundColor: opt.color + "20" }]}>
                <Text style={S.healthChipEmoji}>{opt.emoji}</Text>
                <Text style={[S.healthChipText, { color: selected ? opt.color : theme.textSecondary }]}>{opt.label}</Text>
                {selected && <Text style={[S.healthChipCheck, { color: opt.color }]}>✓</Text>}
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={handleSave} style={[S.saveButton, saving && S.disabledButton]} disabled={saving}>
          <Text style={S.saveText}>{saving ? "Saving..." : "Save Quick Inspection"}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: theme.bg },
    content: { padding: theme.spaceMD, paddingBottom: 50 },
    titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
    title: { color: theme.textPrimary, fontSize: theme.fontLG, fontWeight: "900", marginBottom: 2 },
    subtitle: { color: theme.textMuted, fontSize: theme.fontSM, maxWidth: "75%" },
    voiceButton: { backgroundColor: theme.bgCardAlt, paddingVertical: 10, paddingHorizontal: 14, borderRadius: theme.radiusMD, borderWidth: 1, borderColor: theme.honey, alignItems: "center" },
    voiceButtonText: { color: theme.honey, fontWeight: "900", fontSize: theme.fontSM },
    voiceFillBanner: { backgroundColor: theme.bgCardAlt, borderWidth: 1, borderColor: theme.honey, padding: theme.spaceSM, borderRadius: theme.radiusSM, marginBottom: theme.spaceSM },
    voiceFillText: { color: theme.honey, fontSize: theme.fontXS, fontWeight: "700" },
    categoryHeader: { flexDirection: "row", alignItems: "baseline", gap: 10, marginTop: theme.spaceLG, marginBottom: 4 },
    label: { color: theme.textPrimary, fontSize: theme.fontMD, fontWeight: "900" },
    categoryHint: { color: theme.textMuted, fontSize: theme.fontXS, fontStyle: "italic" },
    beginnerTip: { backgroundColor: theme.bgCardAlt, borderWidth: 1, borderColor: theme.border, borderRadius: theme.radiusSM, padding: theme.spaceSM, marginBottom: theme.spaceSM },
    beginnerTipText: { color: theme.textSecondary, fontSize: theme.fontXS, lineHeight: 18 },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    option: { backgroundColor: theme.bgCard, paddingVertical: 16, paddingHorizontal: 14, borderRadius: theme.radiusMD, minWidth: "46%", flex: 1, borderWidth: 2, borderColor: theme.border },
    optionSelected: { backgroundColor: theme.honey, borderColor: theme.honeyLight },
    optionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    optionText: { color: theme.textSecondary, fontSize: theme.fontMD, fontWeight: "900", textAlign: "center" },
    optionTextSelected: { color: theme.bg },
    optionHint: { color: theme.bg, fontSize: theme.fontXS, marginTop: 6, lineHeight: 16, opacity: 0.85 },
    checkMark: { color: theme.bg, fontWeight: "900", fontSize: theme.fontMD },
    healthGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: theme.spaceMD },
    healthChip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: theme.bgCard, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1.5 },
    healthChipEmoji: { fontSize: 14 },
    healthChipText: { fontSize: theme.fontXS, fontWeight: "800" },
    healthChipCheck: { fontSize: 10, fontWeight: "900" },
    saveButton: { backgroundColor: theme.green, padding: 18, borderRadius: theme.radiusMD, alignItems: "center", marginTop: theme.spaceXL },
    disabledButton: { backgroundColor: theme.textMuted },
    saveText: { color: "#fff", fontWeight: "900", fontSize: theme.fontMD },
  });
}

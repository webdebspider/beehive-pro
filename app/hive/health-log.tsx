/**
 * app/hive/health-log.tsx
 *
 * Hive Health & Disease Log — per-hive logging of diseases, pests, and threats.
 * Includes descriptions, treatment suggestions, and AFB mandatory reporting alert.
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NavBar from "../../components/NavBar";
import { useAppTheme } from "../../hooks/useAppTheme";
import { db } from "../../utils/firebase";

// ── Data ──────────────────────────────────────────────────────────────────────

type Severity = "critical" | "high" | "medium" | "low";

type HealthCondition = {
  id: string;
  category: "brood_disease" | "adult_disease" | "pest" | "predator";
  name: string;
  emoji: string;
  severity: Severity;
  description: string;
  signs: string;
  action: string;
  mustReport: boolean;
};

const CONDITIONS: HealthCondition[] = [
  // Brood Diseases
  {
    id: "afb",
    category: "brood_disease",
    name: "American Foulbrood (AFB)",
    emoji: "🦠",
    severity: "critical",
    description: "The most destructive bacterial disease of honey bees. Highly contagious and spreads easily between hives.",
    signs: "Brown, sunken, or punctured cappings. Larvae turn into a brown ropy liquid with a distinctive sour smell. Scales stick to cell walls.",
    action: "⚠️ MANDATORY REPORTING required in most states. Do NOT move equipment. Contact your state apiary inspector immediately. Affected hives may need to be destroyed.",
    mustReport: true,
  },
  {
    id: "efb",
    category: "brood_disease",
    name: "European Foulbrood (EFB)",
    emoji: "🦠",
    severity: "high",
    description: "A bacterial stress disease most common in spring. Less deadly than AFB but can devastate weak colonies.",
    signs: "Larvae turn yellow or brown and appear twisted or melted in their cells before capping. Sour or vinegary smell.",
    action: "Improve colony strength and nutrition. Requeen if severe. Oxytetracycline (Terramycin) may be used under veterinary guidance. Report to inspector if uncertain.",
    mustReport: false,
  },
  {
    id: "chalkbrood",
    category: "brood_disease",
    name: "Chalkbrood",
    emoji: "🍄",
    severity: "medium",
    description: "A fungal infection that mummifies bee larvae. Usually occurs in cool, damp conditions.",
    signs: "White or black chalky mummies in cells or on the bottom board. White fuzzy appearance on infected larvae.",
    action: "Improve hive ventilation. Requeen with hygienic stock. Remove and dispose of mummies. Usually resolves when colony strengthens and weather improves.",
    mustReport: false,
  },
  {
    id: "sacbrood",
    category: "brood_disease",
    name: "Sacbrood",
    emoji: "🦠",
    severity: "medium",
    description: "A viral disease where larvae fail to pupate and become fluid-filled sacs.",
    signs: "Dead larvae in cells with a fluid-filled sac appearance. Head turns dark. Cappings may be sunken or removed by bees.",
    action: "Usually self-resolves with strong colonies. Requeen if persistent. No chemical treatment available. Improve nutrition and colony strength.",
    mustReport: false,
  },

  // Adult Diseases
  {
    id: "nosema",
    category: "adult_disease",
    name: "Nosemosis (Nosema)",
    emoji: "🦠",
    severity: "high",
    description: "A microsporidian gut parasite that weakens adult bees and impairs their ability to digest food.",
    signs: "Dysentery (brown streaks) on hive entrance and frames. Crawling bees near entrance. Reduced foraging. Swollen abdomens.",
    action: "Fumagillin (where available) or Thymol-based treatments. Ensure good nutrition and ventilation. Replace old comb. Spring and fall are peak times.",
    mustReport: false,
  },
  {
    id: "dwv",
    category: "adult_disease",
    name: "Deformed Wing Virus (DWV)",
    emoji: "🦠",
    severity: "high",
    description: "A virus closely linked to Varroa mite infestations. One of the leading causes of colony collapse.",
    signs: "Bees hatch with crumpled, shriveled, or absent wings. Shortened abdomen. Cannot fly. Often found crawling near hive entrance.",
    action: "Control Varroa mite levels — DWV is primarily spread by Varroa. Treat for mites immediately. Monitor and test regularly.",
    mustReport: false,
  },
  {
    id: "paralysis",
    category: "adult_disease",
    name: "Paralysis Virus",
    emoji: "🦠",
    severity: "medium",
    description: "Viral disease causing trembling and inability to fly. Two forms: shaking/trembling or greasy/hairless bees.",
    signs: "Bees trembling near entrance. Hairless, greasy-looking black bees being expelled by workers. Crawling bees unable to fly.",
    action: "No specific treatment. Requeen with resistant stock. Reduce stress on colony. Usually resolves on its own in strong colonies.",
    mustReport: false,
  },

  // Pests
  {
    id: "varroa",
    category: "pest",
    name: "Varroa Mites",
    emoji: "🔴",
    severity: "critical",
    description: "The #1 global threat to honey bees. External parasites that feed on bee fat bodies and transmit deadly viruses.",
    signs: "Reddish-brown dots on adult bees (especially abdomen). Deformed wings in new bees. High alcohol wash or sugar roll counts.",
    action: "Treat immediately if count exceeds 2 mites per 100 bees. Approved treatments: Oxalic acid (vaporization/dribble), ApiVar, Formic Pro, HopGuard, Apiguard. Rotate treatments to prevent resistance.",
    mustReport: false,
  },
  {
    id: "shb",
    category: "pest",
    name: "Small Hive Beetles (SHB)",
    emoji: "🪲",
    severity: "medium",
    description: "Adult beetles and larvae eat honey, pollen, and brood — causing honey to ferment and combs to be destroyed.",
    signs: "Small dark beetles (5mm) scurrying from light. Slimy, fermenting honey. Larvae tunneling through comb. Sour smell.",
    action: "Beetle traps (Freeman or Hood). Maintain strong population to police beetles. Keep apiary dry and sunny. Freeze comb before storage. Reduce hive space in weak colonies.",
    mustReport: false,
  },
  {
    id: "wax_moths",
    category: "pest",
    name: "Wax Moths",
    emoji: "🦋",
    severity: "medium",
    description: "Larvae tunnel through beeswax combs destroying them and leaving behind silk webbing and frass.",
    signs: "Silk webbing and tunnels in comb. Gray or brown larvae (up to 28mm). Cocoons attached to wood surfaces. Destroyed frames.",
    action: "Strong colonies self-manage wax moths. Store comb with Para-Moth (paradichlorobenzene) or freeze for 48hrs at 20°F. Never leave weak colonies unattended.",
    mustReport: false,
  },
  {
    id: "tracheal_mites",
    category: "pest",
    name: "Tracheal Mites",
    emoji: "🔬",
    severity: "medium",
    description: "Microscopic mites living inside the bee's breathing tubes (tracheae), weakening the host over time.",
    signs: "K-wing (wings held at odd angle). Crawling bees in front of hive. Reduced winter survival. Lab dissection required to confirm.",
    action: "Menthol crystals or grease patties (Crisco + sugar) as treatment. Breed for resistant stock. Most common in older bee populations.",
    mustReport: false,
  },

  // Predators & Environmental
  {
    id: "bears",
    category: "predator",
    name: "Bears",
    emoji: "🐻",
    severity: "critical",
    description: "Bears can completely destroy hives in a single visit, smashing boxes to access honey and brood.",
    signs: "Hive boxes overturned or smashed. Frames scattered. Deep claw marks on wood. Occurred overnight.",
    action: "Electric fence is the most effective deterrent. Install before bears find the apiary — once a bear finds hives it returns repeatedly. Report to wildlife agency.",
    mustReport: false,
  },
  {
    id: "skunks",
    category: "predator",
    name: "Skunks",
    emoji: "🦨",
    severity: "low",
    description: "Skunks scratch at hive entrances at night to lure bees out, then eat them as they emerge.",
    signs: "Scratch marks on the landing board and front of hive. Bees agitated at night. Reduced bee population over time.",
    action: "Raise hive entrance off the ground (skunks dislike stretching). Tack carpet tack strips in front of entrance. Hardware cloth around base.",
    mustReport: false,
  },
  {
    id: "ants",
    category: "predator",
    name: "Ants",
    emoji: "🐜",
    severity: "low",
    description: "Ants invade hives to steal honey and can stress or drive out colonies if infestations are severe.",
    signs: "Ant trails leading to hive. Ants inside boxes or on frames. Bees clustering outside (beard) to escape.",
    action: "Apply food-grade diatomaceous earth or tanglefoot around hive legs. Stand legs in oil-filled cans. Keep grass cleared around hives.",
    mustReport: false,
  },
  {
    id: "wasps_hornets",
    category: "predator",
    name: "Wasps & Hornets",
    emoji: "🐝",
    severity: "medium",
    description: "Wasps and hornets hunt individual bees at the hive entrance and can overwhelm weak colonies.",
    signs: "Wasps or hornets hovering near entrance. Dead bees with heads removed. Reduced foraging activity.",
    action: "Reduce entrance to help bees defend. Wasp traps near (not at) the apiary. Keep colonies strong. Remove nearby wasp nests.",
    mustReport: false,
  },
  {
    id: "pesticides",
    category: "predator",
    name: "Pesticide Exposure",
    emoji: "☠️",
    severity: "high",
    description: "Pesticide exposure can cause sudden mass die-offs or impair bee navigation, memory, and reproduction.",
    signs: "Sudden large number of dead bees in front of hive. Trembling or disoriented foragers. Abnormal brood death. Occurred after nearby crop spraying.",
    action: "Collect dead bees in a sealed bag and freeze for potential testing. Contact your state apiary inspector. Register with local farmers for spray notifications.",
    mustReport: false,
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  brood_disease: "🧫 Brood Diseases",
  adult_disease: "🦠 Adult Bee Diseases",
  pest: "🪲 Pests & Parasites",
  predator: "⚠️ Predators & Environmental",
};

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#22c55e",
};

const SEVERITY_LABELS: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

type LogEntry = {
  id: string;
  conditionId: string;
  conditionName: string;
  severity: Severity;
  notes?: string;
  date: string;
  createdAt?: any;
};

// ── Screen ────────────────────────────────────────────────────────────────────

export default function HealthLogScreen() {
  const theme = useAppTheme();
  const { id, hiveName: hiveNameParam } = useLocalSearchParams<{ id?: string; hiveName?: string }>();
  const hiveId = id ? String(id) : "";
  const hiveName = hiveNameParam ? String(hiveNameParam) : "This Hive";

  const [activeTab, setActiveTab] = useState<"log" | "reference">("log");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedCondition, setSelectedCondition] = useState<HealthCondition | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logNotes, setLogNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadEntries(); }, [hiveId]);

  const loadEntries = async () => {
    if (!hiveId) return;
    try {
      const snap = await getDocs(
        query(collection(db, "hives", hiveId, "healthLog"), orderBy("createdAt", "desc"))
      );
      setEntries(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } catch (e) {
      console.log("Health log load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const openLogModal = (condition: HealthCondition) => {
    setSelectedCondition(condition);
    setLogNotes("");
    setShowLogModal(true);

    if (condition.mustReport) {
      Alert.alert(
        "⚠️ Mandatory Reporting Required",
        `${condition.name} is a legally reportable disease in most US states and many countries.\n\nYou must contact your state apiary inspector immediately. Do NOT move equipment between hives.\n\nTap OK to continue logging, then visit the Registration Helper for your state's reporting contact.`,
        [{ text: "I Understand", style: "destructive" }]
      );
    }
  };

  const saveEntry = async () => {
    if (!selectedCondition || !hiveId) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "hives", hiveId, "healthLog"), {
        hiveId,
        conditionId: selectedCondition.id,
        conditionName: selectedCondition.name,
        severity: selectedCondition.severity,
        notes: logNotes.trim(),
        date: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });
      setShowLogModal(false);
      loadEntries();
    } catch (e) {
      Alert.alert("Error", "Could not save entry.");
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = (entryId: string) => {
    Alert.alert("Delete Entry", "Remove this health log entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          await deleteDoc(doc(db, "hives", hiveId, "healthLog", entryId));
          loadEntries();
        },
      },
    ]);
  };

  const categories = ["all", "brood_disease", "adult_disease", "pest", "predator"];
  const filteredConditions = activeCategory === "all"
    ? CONDITIONS
    : CONDITIONS.filter((c) => c.category === activeCategory);

  const S = makeStyles(theme);

  return (
    <SafeAreaView style={S.page}>
      <NavBar />
      <View style={S.container}>
        <View style={S.header}>
          <Text style={S.title}>🏥 Health Log</Text>
          <Text style={S.subtitle}>{hiveName}</Text>
        </View>

        {/* Tabs */}
        <View style={S.tabs}>
          <Pressable style={[S.tab, activeTab === "log" && S.tabActive]} onPress={() => setActiveTab("log")}>
            <Text style={[S.tabText, activeTab === "log" && S.tabTextActive]}>📋 Log {entries.length > 0 ? `(${entries.length})` : ""}</Text>
          </Pressable>
          <Pressable style={[S.tab, activeTab === "reference" && S.tabActive]} onPress={() => setActiveTab("reference")}>
            <Text style={[S.tabText, activeTab === "reference" && S.tabTextActive]}>📖 Reference</Text>
          </Pressable>
        </View>

        {/* ── Log Tab ── */}
        {activeTab === "log" && (
          <ScrollView contentContainerStyle={S.tabContent}>
            {/* Quick log buttons */}
            <Text style={S.sectionLabel}>LOG A CONCERN</Text>
            <View style={S.quickGrid}>
              {CONDITIONS.filter((c) => c.severity === "critical" || c.severity === "high").map((c) => (
                <Pressable key={c.id} onPress={() => openLogModal(c)} style={[S.quickChip, { borderColor: SEVERITY_COLORS[c.severity] }]}>
                  <Text style={S.quickChipEmoji}>{c.emoji}</Text>
                  <Text style={[S.quickChipText, { color: SEVERITY_COLORS[c.severity] }]}>{c.name.split("(")[0].trim()}</Text>
                </Pressable>
              ))}
              <Pressable onPress={() => setActiveTab("reference")} style={[S.quickChip, { borderColor: theme.border }]}>
                <Text style={S.quickChipEmoji}>➕</Text>
                <Text style={[S.quickChipText, { color: theme.textMuted }]}>More...</Text>
              </Pressable>
            </View>

            {/* Log entries */}
            <Text style={S.sectionLabel}>HISTORY</Text>
            {loading ? null : entries.length === 0 ? (
              <View style={S.emptyBox}>
                <Text style={S.emptyEmoji}>✅</Text>
                <Text style={S.emptyText}>No concerns logged</Text>
                <Text style={S.emptyHint}>Tap a condition above or browse Reference to log an observation.</Text>
              </View>
            ) : (
              entries.map((entry) => {
                const color = SEVERITY_COLORS[entry.severity];
                return (
                  <View key={entry.id} style={[S.entryCard, { borderLeftColor: color }]}>
                    <View style={S.entryHeader}>
                      <Text style={[S.entryName, { color }]}>{entry.conditionName}</Text>
                      <Pressable onPress={() => deleteEntry(entry.id)}>
                        <Text style={S.deleteBtn}>🗑️</Text>
                      </Pressable>
                    </View>
                    <Text style={S.entryDate}>{new Date(entry.date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</Text>
                    {entry.notes ? <Text style={S.entryNotes}>{entry.notes}</Text> : null}
                    <View style={[S.severityTag, { backgroundColor: color + "20", borderColor: color }]}>
                      <Text style={[S.severityTagText, { color }]}>{SEVERITY_LABELS[entry.severity]}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        {/* ── Reference Tab ── */}
        {activeTab === "reference" && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.categoryScroll} contentContainerStyle={S.categoryRow}>
              {categories.map((cat) => (
                <Pressable key={cat} onPress={() => setActiveCategory(cat)} style={[S.catChip, activeCategory === cat && S.catChipActive]}>
                  <Text style={[S.catChipText, activeCategory === cat && S.catChipTextActive]}>
                    {cat === "all" ? "All" : CATEGORY_LABELS[cat]}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <ScrollView contentContainerStyle={S.tabContent}>
              {filteredConditions.map((condition) => {
                const color = SEVERITY_COLORS[condition.severity];
                return (
                  <View key={condition.id} style={[S.conditionCard, { borderLeftColor: color }]}>
                    {/* Header row — emoji + name + badges only */}
                    <View style={S.conditionHeader}>
                      <Text style={S.conditionEmoji}>{condition.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={S.conditionName}>{condition.name}</Text>
                        <View style={S.conditionMeta}>
                          <View style={[S.severityTag, { backgroundColor: color + "20", borderColor: color }]}>
                            <Text style={[S.severityTagText, { color }]}>{SEVERITY_LABELS[condition.severity]}</Text>
                          </View>
                          {condition.mustReport && (
                            <View style={S.reportTag}>
                              <Text style={S.reportTagText}>📋 Must Report</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                    <Text style={S.conditionDesc}>{condition.description}</Text>
                    <View style={S.conditionSection}>
                      <Text style={S.conditionSectionLabel}>🔍 Signs to look for:</Text>
                      <Text style={S.conditionSectionText}>{condition.signs}</Text>
                    </View>
                    <View style={[S.conditionSection, condition.mustReport && S.actionCritical]}>
                      <Text style={S.conditionSectionLabel}>✅ Recommended action:</Text>
                      <Text style={S.conditionSectionText}>{condition.action}</Text>
                    </View>
                    {/* Log button — full width at bottom */}
                    <Pressable onPress={() => openLogModal(condition)} style={S.logBtn}>
                      <Text style={S.logBtnText}>🏥 Log This Concern</Text>
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
          </>
        )}
      </View>

      {/* Log Modal */}
      <Modal visible={showLogModal} animationType="slide" transparent>
        <View style={S.modalOverlay}>
          <View style={S.modalCard}>
            {selectedCondition && (
              <>
                <Text style={S.modalTitle}>{selectedCondition.emoji} {selectedCondition.name}</Text>
                {selectedCondition.mustReport && (
                  <View style={S.afbWarning}>
                    <Text style={S.afbWarningText}>⚠️ This condition requires mandatory reporting to your state apiary inspector!</Text>
                    <Pressable onPress={() => { setShowLogModal(false); }} style={S.afbLink}>
                      <Text style={S.afbLinkText}>Go to Registration Helper →</Text>
                    </Pressable>
                  </View>
                )}
                <Text style={S.modalLabel}>NOTES (optional)</Text>
                <TextInput
                  style={[S.input, S.notesInput]}
                  placeholder="Describe what you observed..."
                  placeholderTextColor={theme.textMuted}
                  value={logNotes}
                  onChangeText={setLogNotes}
                  multiline
                />
                <View style={S.modalButtons}>
                  <Pressable onPress={() => setShowLogModal(false)} style={S.cancelButton}>
                    <Text style={S.cancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable onPress={saveEntry} disabled={saving} style={S.saveButton}>
                    <Text style={S.saveText}>{saving ? "Saving..." : "Log Concern"}</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: theme.bg },
    container: { flex: 1 },
    header: { paddingHorizontal: theme.spaceMD, paddingTop: theme.spaceSM, paddingBottom: 4 },
    title: { color: theme.textPrimary, fontSize: theme.fontLG, fontWeight: "900" },
    subtitle: { color: theme.honey, fontSize: theme.fontXS, marginTop: 2 },
    tabs: { flexDirection: "row", borderBottomWidth: 1, borderColor: theme.border, marginHorizontal: theme.spaceMD },
    tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
    tabActive: { borderBottomWidth: 2, borderBottomColor: theme.honey },
    tabText: { color: theme.textMuted, fontWeight: "700", fontSize: theme.fontSM },
    tabTextActive: { color: theme.honey },
    tabContent: { padding: theme.spaceMD, paddingBottom: 50 },
    sectionLabel: { color: theme.textMuted, fontSize: theme.fontXS, fontWeight: "800", letterSpacing: 1.5, marginBottom: 10, marginTop: 4 },
    quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: theme.spaceLG },
    quickChip: { backgroundColor: theme.bgCard, borderWidth: 1, borderRadius: theme.radiusMD, padding: 10, alignItems: "center", minWidth: "30%", flex: 1 },
    quickChipEmoji: { fontSize: 20, marginBottom: 4 },
    quickChipText: { fontSize: 10, fontWeight: "800", textAlign: "center" },
    emptyBox: { alignItems: "center", marginTop: 32 },
    emptyEmoji: { fontSize: 48, marginBottom: 12 },
    emptyText: { color: theme.textPrimary, fontWeight: "800", fontSize: theme.fontMD },
    emptyHint: { color: theme.textMuted, fontSize: theme.fontSM, marginTop: 6, textAlign: "center" },
    entryCard: { backgroundColor: theme.bgCard, borderRadius: theme.radiusMD, padding: theme.spaceMD, marginBottom: 10, borderWidth: 1, borderColor: theme.border, borderLeftWidth: 4 },
    entryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
    entryName: { fontWeight: "900", fontSize: theme.fontSM, flex: 1 },
    deleteBtn: { fontSize: 16 },
    entryDate: { color: theme.textMuted, fontSize: theme.fontXS, marginBottom: 4 },
    entryNotes: { color: theme.textSecondary, fontSize: theme.fontSM, marginBottom: 6, fontStyle: "italic" },
    severityTag: { alignSelf: "flex-start", paddingVertical: 2, paddingHorizontal: 8, borderRadius: 12, borderWidth: 1 },
    severityTagText: { fontSize: 10, fontWeight: "800" },
    reportTag: { backgroundColor: "#ef444420", paddingVertical: 2, paddingHorizontal: 8, borderRadius: 12, borderWidth: 1, borderColor: "#ef4444" },
    reportTagText: { color: "#ef4444", fontSize: 10, fontWeight: "800" },
    categoryScroll: { maxHeight: 48 },
    categoryRow: { paddingHorizontal: theme.spaceMD, gap: 8, alignItems: "center" },
    catChip: { backgroundColor: theme.bgCard, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: theme.border },
    catChipActive: { backgroundColor: theme.honey, borderColor: theme.honey },
    catChipText: { color: theme.textMuted, fontSize: theme.fontXS, fontWeight: "700" },
    catChipTextActive: { color: theme.bg },
    conditionCard: { backgroundColor: theme.bgCard, borderRadius: theme.radiusMD, padding: theme.spaceMD, marginBottom: 12, borderWidth: 1, borderColor: theme.border, borderLeftWidth: 4 },
    conditionHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
    conditionEmoji: { fontSize: 28, marginTop: 2 },
    conditionName: { color: theme.textPrimary, fontWeight: "900", fontSize: theme.fontSM, marginBottom: 6 },
    conditionMeta: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
    conditionDesc: { color: theme.textSecondary, fontSize: theme.fontSM, lineHeight: 20, marginBottom: 10 },
    conditionSection: { backgroundColor: theme.bgCardAlt, borderRadius: theme.radiusSM, padding: 10, marginBottom: 8 },
    actionCritical: { backgroundColor: "#ef444415", borderWidth: 1, borderColor: "#ef444440" },
    conditionSectionLabel: { color: theme.textPrimary, fontWeight: "800", fontSize: theme.fontXS, marginBottom: 4 },
    conditionSectionText: { color: theme.textSecondary, fontSize: theme.fontXS, lineHeight: 18 },
    logBtn: { backgroundColor: theme.honey, paddingVertical: 10, borderRadius: theme.radiusSM, alignItems: "center", marginTop: 8 },
    logBtnText: { color: theme.bg, fontWeight: "900", fontSize: theme.fontXS },
    modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" },
    modalCard: { backgroundColor: theme.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: theme.spaceLG, paddingBottom: 40 },
    modalTitle: { color: theme.textPrimary, fontSize: theme.fontLG, fontWeight: "900", marginBottom: theme.spaceMD },
    afbWarning: { backgroundColor: "#ef444415", borderWidth: 1, borderColor: "#ef4444", borderRadius: theme.radiusMD, padding: theme.spaceMD, marginBottom: theme.spaceMD },
    afbWarningText: { color: "#ef4444", fontWeight: "800", fontSize: theme.fontSM, marginBottom: 8 },
    afbLink: { backgroundColor: "#ef4444", padding: 10, borderRadius: theme.radiusSM, alignItems: "center" },
    afbLinkText: { color: "#fff", fontWeight: "900", fontSize: theme.fontXS },
    modalLabel: { color: theme.textMuted, fontSize: theme.fontXS, fontWeight: "800", letterSpacing: 1, marginBottom: 8 },
    input: { backgroundColor: theme.bgInput, color: theme.textPrimary, borderWidth: 1, borderColor: theme.border, borderRadius: theme.radiusMD, padding: 12, fontSize: theme.fontSM },
    notesInput: { height: 100, textAlignVertical: "top", marginBottom: 12 },
    modalButtons: { flexDirection: "row", gap: 12 },
    cancelButton: { flex: 1, backgroundColor: theme.bgCardAlt, padding: 14, borderRadius: theme.radiusMD, alignItems: "center", borderWidth: 1, borderColor: theme.border },
    cancelText: { color: theme.textSecondary, fontWeight: "800", fontSize: theme.fontSM },
    saveButton: { flex: 2, backgroundColor: theme.green, padding: 14, borderRadius: theme.radiusMD, alignItems: "center" },
    saveText: { color: "#fff", fontWeight: "900", fontSize: theme.fontSM },
  });
}

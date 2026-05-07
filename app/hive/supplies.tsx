/**
 * app/hive/supplies.tsx
 *
 * Equipment & Supplies screen.
 * Two tabs: Inventory (global) and Treatment Log (per-hive or all).
 *
 * Receives optional param:
 *  - hiveId: filters treatment log to that hive
 *  - hiveName: shown in header when filtering
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useAuthContext } from "../../context/AuthContext";
import { useAppTheme } from "../../hooks/useAppTheme";
import { db } from "../../utils/firebase";

// ── Types ─────────────────────────────────────────────────────────────────────

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  lowStockThreshold?: number;
};

type Treatment = {
  id: string;
  hiveId: string;
  hiveName: string;
  treatmentName: string;
  dateApplied: string;
  dateToRemove?: string;
  notes?: string;
};

const CATEGORIES = ["Equipment", "Feed", "Treatments", "Protective Gear", "Other"];

const EQUIPMENT_BY_CATEGORY: Record<string, string[]> = {
  Equipment: [
    "Hive body (deep)", "Hive body (medium)", "Hive body (shallow)",
    "Frames", "Foundation (wax)", "Foundation (plastic)",
    "Bottom board", "Inner cover", "Outer cover / telescoping cover",
    "Entrance reducer", "Queen excluder", "Feeder (entrance)", "Feeder (top)",
    "Hive tool", "Smoker", "Brush", "Frame grip", "Uncapping knife",
    "Extractor", "Uncapping tank", "Strainer / filter", "Honey bucket",
    "Marking tube / cage", "Queen cage", "Nuc box", "Swarm trap",
    "Mouse guard", "Varroa sticky board", "Alcohol wash jar", "Other",
  ],
  Feed: [
    "1-1 Sugar-water (granulated only)", "2-1 Sugar-water (granulated only)","Pollen substitute patty", "Dry pollen substitute", "Fondant",
    "Candy board", "ProSweet", "Other",
  ],
  Treatments: [
    "Oxalic acid (crystals)", "Oxalic acid (ready-to-use)",
    "ApiVar strips", "HopGuard strips", "Formic Pro pads",
    "Apiguard thymol gel", "ApiLife VAR", "Mite Away Quick Strips",
    "Other",
  ],
  "Protective Gear": [
    "Full suit", "Jacket / half suit", "Veil (round)", "Veil (square)",
    "Gloves (leather)", "Gloves (nitrile)", "Gloves (rubber)",
    "Boots / boot covers", "Other",
  ],
  Other: ["Other"],
};

const UNIT_OPTIONS = [
  "item", "pair", "box", "bag", "frame",
  "lb", "oz", "kg",
  "gal", "qt", "pt", "fl oz", "ml", "L",
  "roll", "sheet", "jar", "bottle", "strip", "pack",
];

const COMMON_TREATMENTS = [
  "Oxalic Acid (Vaporization)",
  "Oxalic Acid (Dribble)",
  "ApiVar (Amitraz)",
  "HopGuard",
  "Formic Pro",
  "Apiguard (Thymol)",
  "ApiLife VAR",
  "Mite Away Quick Strips",
  "Other",
];

// ── Screen ────────────────────────────────────────────────────────────────────

export default function SuppliesScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { user } = useAuthContext();
  const { hiveId, hiveName } = useLocalSearchParams<{ hiveId?: string; hiveName?: string }>();

  const [activeTab, setActiveTab] = useState<"inventory" | "treatments">(
    hiveId ? "treatments" : "inventory"
  );
  const [loading, setLoading] = useState(true);

  // Inventory state
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("1");
  const [newItemUnit, setNewItemUnit] = useState("item");
  const [newItemCategory, setNewItemCategory] = useState("Equipment");
  const [newItemThreshold, setNewItemThreshold] = useState("");

  // Treatment state
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [showAddTreatment, setShowAddTreatment] = useState(false);
  const [newTreatmentHiveId, setNewTreatmentHiveId] = useState(hiveId || "");
  const [newTreatmentHiveName, setNewTreatmentHiveName] = useState(hiveName ? String(hiveName) : "");
  const [newTreatmentName, setNewTreatmentName] = useState("");
  const [newTreatmentDate, setNewTreatmentDate] = useState(new Date().toISOString().split("T")[0]);
  const [newTreatmentRemoveDate, setNewTreatmentRemoveDate] = useState("");
  const [newTreatmentNotes, setNewTreatmentNotes] = useState("");
  const [hives, setHives] = useState<{ id: string; name: string }[]>([]);

  // Derived: equipment suggestions based on selected category
  const equipmentSuggestions = EQUIPMENT_BY_CATEGORY[newItemCategory] || EQUIPMENT_BY_CATEGORY["Other"];

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      // Load inventory
      const invSnap = await getDocs(
        query(collection(db, "inventory"), where("userId", "==", user.uid))
      );
      setInventory(invSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));

      // Load treatments
      let treatQuery = hiveId
        ? query(collection(db, "treatments"), where("userId", "==", user.uid), where("hiveId", "==", hiveId))
        : query(collection(db, "treatments"), where("userId", "==", user.uid));

      const treatSnap = await getDocs(treatQuery);
      const treatList: Treatment[] = treatSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      treatList.sort((a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime());
      setTreatments(treatList);

      // Load hive list for treatment form
      const hiveSnap = await getDocs(
        query(collection(db, "hives"), where("userId", "==", user.uid))
      );
      setHives(hiveSnap.docs.map((d) => ({ id: d.id, name: d.data().name || "Unnamed Hive" })));
    } catch (e) {
      console.log("Load supplies error:", e);
    } finally {
      setLoading(false);
    }
  };

  const addInventoryItem = async () => {
    if (!user || !newItemName.trim()) return;
    try {
      await addDoc(collection(db, "inventory"), {
        userId: user.uid,
        name: newItemName.trim(),
        quantity: parseInt(newItemQuantity) || 0,
        unit: newItemUnit,
        category: newItemCategory,
        lowStockThreshold: newItemThreshold ? parseInt(newItemThreshold) : null,
        createdAt: serverTimestamp(),
      });
      setShowAddItem(false);
      setNewItemName(""); setNewItemQuantity("1"); setNewItemUnit("item");
      setNewItemCategory("Equipment"); setNewItemThreshold("");
      loadData();
    } catch (e) {
      Alert.alert("Error", "Could not add item.");
    }
  };

  const deleteInventoryItem = (id: string) => {
    Alert.alert("Delete Item", "Remove this item from inventory?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          await deleteDoc(doc(db, "inventory", id));
          loadData();
        },
      },
    ]);
  };

  const addTreatment = async () => {
    if (!user || !newTreatmentName.trim() || !newTreatmentHiveId) {
      Alert.alert("Missing Info", "Please select a hive and treatment name.");
      return;
    }
    try {
      await addDoc(collection(db, "treatments"), {
        userId: user.uid,
        hiveId: newTreatmentHiveId,
        hiveName: newTreatmentHiveName,
        treatmentName: newTreatmentName.trim(),
        dateApplied: newTreatmentDate,
        dateToRemove: newTreatmentRemoveDate || null,
        notes: newTreatmentNotes || null,
        createdAt: serverTimestamp(),
      });
      setShowAddTreatment(false);
      setNewTreatmentName(""); setNewTreatmentRemoveDate(""); setNewTreatmentNotes("");
      if (!hiveId) { setNewTreatmentHiveId(""); setNewTreatmentHiveName(""); }
      loadData();
    } catch (e) {
      Alert.alert("Error", "Could not log treatment.");
    }
  };

  const deleteTreatment = (id: string) => {
    Alert.alert("Delete Treatment", "Remove this treatment log?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          await deleteDoc(doc(db, "treatments", id));
          loadData();
        },
      },
    ]);
  };

  const S = makeStyles(theme);

  // Group inventory by category
  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = inventory.filter((i) => i.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  const lowStockCount = inventory.filter(
    (i) => i.lowStockThreshold != null && i.quantity <= i.lowStockThreshold
  ).length;

  if (loading) {
    return (
      <SafeAreaView style={S.page}>
        <NavBar />
        <ActivityIndicator color={theme.honey} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={S.page}>
      <NavBar />
      <View style={S.container}>
        {/* Header */}
        <View style={S.header}>
          <Text style={S.title}>🧰 Supplies</Text>
          {hiveName && <Text style={S.hiveFilter}>Filtered: {hiveName}</Text>}
        </View>

        {/* Low stock alert */}
        {lowStockCount > 0 && (
          <View style={S.alertBanner}>
            <Text style={S.alertText}>⚠️ {lowStockCount} item{lowStockCount > 1 ? "s" : ""} running low!</Text>
          </View>
        )}

        {/* Tabs */}
        <View style={S.tabs}>
          <Pressable style={[S.tab, activeTab === "inventory" && S.tabActive]} onPress={() => setActiveTab("inventory")}>
            <Text style={[S.tabText, activeTab === "inventory" && S.tabTextActive]}>📦 Inventory</Text>
          </Pressable>
          <Pressable style={[S.tab, activeTab === "treatments" && S.tabActive]} onPress={() => setActiveTab("treatments")}>
            <Text style={[S.tabText, activeTab === "treatments" && S.tabTextActive]}>💉 Treatments</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={S.tabContent}>
          {/* ── Inventory Tab ── */}
          {activeTab === "inventory" && (
            <>
              <Pressable style={S.addButton} onPress={() => setShowAddItem(true)}>
                <Text style={S.addButtonText}>+ Add Item</Text>
              </Pressable>
              {Object.keys(grouped).length === 0 ? (
                <View style={S.emptyBox}>
                  <Text style={S.emptyEmoji}>📦</Text>
                  <Text style={S.emptyText}>No inventory yet</Text>
                  <Text style={S.emptyHint}>Add hive equipment, feed, and protective gear to track your supplies.</Text>
                </View>
              ) : (
                Object.entries(grouped).map(([cat, items]) => (
                  <View key={cat}>
                    <Text style={S.catLabel}>{cat.toUpperCase()}</Text>
                    {items.map((item) => {
                      const isLow = item.lowStockThreshold != null && item.quantity <= item.lowStockThreshold;
                      return (
                        <View key={item.id} style={[S.itemCard, isLow && S.itemCardLow]}>
                          <View style={{ flex: 1 }}>
                            <Text style={S.itemName}>{item.name}</Text>
                            {isLow && <Text style={S.lowStockTag}>⚠️ Low stock</Text>}
                          </View>
                          <Text style={[S.itemQty, isLow && S.itemQtyLow]}>
                            {item.quantity} {item.unit}
                          </Text>
                          <Pressable style={S.deleteBtn} onPress={() => deleteInventoryItem(item.id)}>
                            <Text style={S.deleteBtnText}>🗑️</Text>
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                ))
              )}
            </>
          )}

          {/* ── Treatments Tab ── */}
          {activeTab === "treatments" && (
            <>
              <Pressable style={S.addButton} onPress={() => setShowAddTreatment(true)}>
                <Text style={S.addButtonText}>+ Log Treatment</Text>
              </Pressable>
              {treatments.length === 0 ? (
                <View style={S.emptyBox}>
                  <Text style={S.emptyEmoji}>💉</Text>
                  <Text style={S.emptyText}>No treatments logged</Text>
                  <Text style={S.emptyHint}>Track Varroa treatments, medications, and other hive interventions.</Text>
                </View>
              ) : (
                treatments.map((t) => (
                  <View key={t.id} style={S.treatCard}>
                    <View style={S.treatHeader}>
                      <Text style={S.treatName}>{t.treatmentName}</Text>
                      <Pressable onPress={() => deleteTreatment(t.id)}>
                        <Text style={S.deleteBtnText}>🗑️</Text>
                      </Pressable>
                    </View>
                    <Text style={S.treatHive}>🏠 {t.hiveName}</Text>
                    <Text style={S.treatDate}>Applied: {t.dateApplied}</Text>
                    {t.dateToRemove && <Text style={S.treatDate}>Remove by: {t.dateToRemove}</Text>}
                    {t.notes && <Text style={S.treatNotes}>{t.notes}</Text>}
                  </View>
                ))
              )}
            </>
          )}
        </ScrollView>
      </View>

      {/* ── Add Inventory Item Modal ── */}
      <Modal visible={showAddItem} animationType="slide" transparent>
        <ScrollView contentContainerStyle={S.modalOverlay}>
          <View style={S.modalCard}>
            {/* Modal header with title + X close button */}
            <View style={S.modalHeader}>
              <Text style={S.modalTitle}>Add Item</Text>
              <Pressable
                onPress={() => setShowAddItem(false)}
                style={S.closeButton}
                hitSlop={10}
                accessibilityLabel="Close"
                accessibilityRole="button"
              >
                <Text style={S.closeButtonText}>✕</Text>
              </Pressable>
            </View>

            {/* Category first — drives equipment suggestions */}
            <Text style={S.pickerLabel}>CATEGORY</Text>
            <View style={S.chipRow}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => {
                    setNewItemCategory(cat);
                    setNewItemName(""); // reset name when category changes
                  }}
                  style={[S.chip, newItemCategory === cat && S.chipSelected]}
                >
                  <Text style={[S.chipText, newItemCategory === cat && S.chipTextSelected]}>{cat}</Text>
                </Pressable>
              ))}
            </View>

            {/* Equipment suggestions */}
            <Text style={S.pickerLabel}>ITEM NAME — tap to select or type below</Text>
            <View style={S.chipRow}>
              {equipmentSuggestions.map((eq) => (
                <Pressable
                  key={eq}
                  onPress={() => setNewItemName(eq === "Other" ? "" : eq)}
                  style={[S.chip, newItemName === eq && S.chipSelected]}
                >
                  <Text style={[S.chipText, newItemName === eq && S.chipTextSelected]}>{eq}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={S.input}
              placeholder="Or type custom item name..."
              placeholderTextColor={theme.textMuted}
              value={newItemName}
              onChangeText={setNewItemName}
            />

            {/* Quantity + Unit */}
            <Text style={S.pickerLabel}>QUANTITY</Text>
            <TextInput
              style={S.input}
              placeholder="Quantity"
              placeholderTextColor={theme.textMuted}
              value={newItemQuantity}
              onChangeText={setNewItemQuantity}
              keyboardType="numeric"
            />

            <Text style={S.pickerLabel}>UNIT</Text>
            <View style={S.chipRow}>
              {UNIT_OPTIONS.map((u) => (
                <Pressable
                  key={u}
                  onPress={() => setNewItemUnit(u)}
                  style={[S.chip, newItemUnit === u && S.chipSelected]}
                >
                  <Text style={[S.chipText, newItemUnit === u && S.chipTextSelected]}>{u}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={S.pickerLabel}>LOW STOCK ALERT (optional)</Text>
            <TextInput
              style={S.input}
              placeholder="Alert when quantity drops to..."
              placeholderTextColor={theme.textMuted}
              value={newItemThreshold}
              onChangeText={setNewItemThreshold}
              keyboardType="numeric"
            />

            <View style={S.modalButtons}>
              <Pressable onPress={() => setShowAddItem(false)} style={S.cancelButton}>
                <Text style={S.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={addInventoryItem} style={S.confirmButton}>
                <Text style={S.confirmText}>Add Item</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </Modal>

      {/* ── Add Treatment Modal ── */}
      <Modal visible={showAddTreatment} animationType="slide" transparent>
        <ScrollView contentContainerStyle={S.modalOverlay}>
          <View style={S.modalCard}>
            <Text style={S.modalTitle}>Log Treatment</Text>

            {!hiveId && (
              <>
                <Text style={S.pickerLabel}>SELECT HIVE</Text>
                <View style={S.chipRow}>
                  {hives.map((h) => (
                    <Pressable
                      key={h.id}
                      onPress={() => { setNewTreatmentHiveId(h.id); setNewTreatmentHiveName(h.name); }}
                      style={[S.chip, newTreatmentHiveId === h.id && S.chipSelected]}
                    >
                      <Text style={[S.chipText, newTreatmentHiveId === h.id && S.chipTextSelected]}>{h.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            <Text style={S.pickerLabel}>TREATMENT</Text>
            <View style={S.chipRow}>
              {COMMON_TREATMENTS.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setNewTreatmentName(t)}
                  style={[S.chip, newTreatmentName === t && S.chipSelected]}
                >
                  <Text style={[S.chipText, newTreatmentName === t && S.chipTextSelected]}>{t}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={S.pickerLabel}>DATE APPLIED</Text>
            <TextInput
              style={S.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textMuted}
              value={newTreatmentDate}
              onChangeText={setNewTreatmentDate}
            />
            <Text style={S.pickerLabel}>REMOVE BY (optional)</Text>
            <TextInput
              style={S.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textMuted}
              value={newTreatmentRemoveDate}
              onChangeText={setNewTreatmentRemoveDate}
            />
            <Text style={S.pickerLabel}>NOTES (optional)</Text>
            <TextInput
              style={[S.input, S.notesInput]}
              placeholder="Dosage, method, observations..."
              placeholderTextColor={theme.textMuted}
              value={newTreatmentNotes}
              onChangeText={setNewTreatmentNotes}
              multiline
            />

            <View style={S.modalButtons}>
              <Pressable onPress={() => setShowAddTreatment(false)} style={S.cancelButton}>
                <Text style={S.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={addTreatment} style={S.confirmButton}>
                <Text style={S.confirmText}>Log Treatment</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
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
    hiveFilter: { color: theme.honey, fontSize: theme.fontXS, marginTop: 2 },
    alertBanner: { backgroundColor: theme.warningBg, borderWidth: 1, borderColor: theme.warning, marginHorizontal: theme.spaceMD, padding: theme.spaceSM, borderRadius: theme.radiusSM, marginBottom: 8 },
    alertText: { color: theme.honeyLight, fontWeight: "800", fontSize: theme.fontXS },
    tabs: { flexDirection: "row", borderBottomWidth: 1, borderColor: theme.border, marginHorizontal: theme.spaceMD },
    tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
    tabActive: { borderBottomWidth: 2, borderBottomColor: theme.honey },
    tabText: { color: theme.textMuted, fontWeight: "700", fontSize: theme.fontSM },
    tabTextActive: { color: theme.honey },
    tabContent: { padding: theme.spaceMD, paddingBottom: 50 },
    addButton: { backgroundColor: theme.green, padding: 14, borderRadius: theme.radiusMD, alignItems: "center", marginBottom: theme.spaceMD },
    addButtonText: { color: "#fff", fontWeight: "900", fontSize: theme.fontSM },
    emptyBox: { alignItems: "center", marginTop: 40 },
    emptyEmoji: { fontSize: 48, marginBottom: 12 },
    emptyText: { color: theme.textPrimary, fontWeight: "800", fontSize: theme.fontMD },
    emptyHint: { color: theme.textMuted, fontSize: theme.fontSM, marginTop: 6, textAlign: "center" },
    catLabel: { color: theme.textMuted, fontSize: theme.fontXS, fontWeight: "800", letterSpacing: 1.5, marginBottom: 8, marginTop: theme.spaceMD },
    itemCard: { backgroundColor: theme.bgCard, borderRadius: theme.radiusMD, padding: theme.spaceMD, flexDirection: "row", alignItems: "center", marginBottom: 8, borderWidth: 1, borderColor: theme.border },
    itemCardLow: { borderColor: theme.warning },
    itemName: { color: theme.textPrimary, fontWeight: "700", fontSize: theme.fontSM },
    lowStockTag: { color: theme.warning, fontSize: 10, fontWeight: "800", marginTop: 2 },
    itemQty: { color: theme.honey, fontWeight: "900", fontSize: theme.fontMD, marginRight: 12 },
    itemQtyLow: { color: theme.warning },
    deleteBtn: { padding: 4 },
    deleteBtnText: { fontSize: 16 },
    treatCard: { backgroundColor: theme.bgCard, borderRadius: theme.radiusMD, padding: theme.spaceMD, marginBottom: 10, borderWidth: 1, borderColor: theme.border },
    treatHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
    treatName: { color: theme.honey, fontWeight: "900", fontSize: theme.fontMD, flex: 1 },
    treatHive: { color: theme.textSecondary, fontSize: theme.fontXS, marginBottom: 4 },
    treatDate: { color: theme.textMuted, fontSize: theme.fontXS, marginBottom: 2 },
    treatNotes: { color: theme.textSecondary, fontSize: theme.fontXS, marginTop: 6, fontStyle: "italic" },
    modalOverlay: { flexGrow: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" },
    modalCard: { backgroundColor: theme.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: theme.spaceLG, paddingBottom: 40 },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spaceMD },
    modalTitle: { color: theme.textPrimary, fontSize: theme.fontLG, fontWeight: "900", marginBottom: theme.spaceMD },
    closeButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.bgCardAlt, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center", marginBottom: theme.spaceMD },
    closeButtonText: { color: theme.textPrimary, fontSize: 18, fontWeight: "900", lineHeight: 20 },
    input: { backgroundColor: theme.bgInput, color: theme.textPrimary, borderWidth: 1, borderColor: theme.border, borderRadius: theme.radiusMD, padding: 12, marginBottom: 12, fontSize: theme.fontSM },
    notesInput: { height: 80, textAlignVertical: "top" },
    inputRow: { flexDirection: "row", gap: 10 },
    pickerLabel: { color: theme.textMuted, fontSize: theme.fontXS, fontWeight: "800", letterSpacing: 1, marginBottom: 8, marginTop: 4 },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
    chip: { backgroundColor: theme.bgCardAlt, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: theme.border },
    chipSelected: { backgroundColor: theme.honey, borderColor: theme.honey },
    chipText: { color: theme.textSecondary, fontSize: theme.fontXS, fontWeight: "700" },
    chipTextSelected: { color: theme.bg },
    modalButtons: { flexDirection: "row", gap: 12, marginTop: 8 },
    cancelButton: { flex: 1, backgroundColor: theme.bgCardAlt, padding: 14, borderRadius: theme.radiusMD, alignItems: "center", borderWidth: 1, borderColor: theme.border },
    cancelText: { color: theme.textSecondary, fontWeight: "800", fontSize: theme.fontSM },
    confirmButton: { flex: 2, backgroundColor: theme.green, padding: 14, borderRadius: theme.radiusMD, alignItems: "center" },
    confirmText: { color: "#fff", fontWeight: "900", fontSize: theme.fontSM },
  });
}

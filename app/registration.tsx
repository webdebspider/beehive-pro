/**
 * app/registration.tsx
 *
 * Hive Registration Helper
 * US tab: all 50 states + DC with search.
 * International tab: pick country first, then see regions/provinces.
 *
 * Data lives in utils/registrationLinks.ts so it can be updated without
 * touching this UI file.
 */

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
import { useEffect, useState } from "react";
import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import NavBar from "../components/NavBar";
import { useAuthContext } from "../context/AuthContext";
import { useAppTheme } from "../hooks/useAppTheme";
import { db } from "../utils/firebase";
import {
  US_STATES,
  COUNTRY_GROUPS,
  REQUIREMENT_COLORS,
  REQUIREMENT_LABELS,
  REQUIREMENT_EMOJIS,
  RegionData,
  CountryGroup,
} from "../utils/registrationLinks";

export default function RegistrationScreen() {
  const theme = useAppTheme();
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState<"us" | "international">("us");
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountryGroup | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<RegionData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [regNumber, setRegNumber] = useState("");
  const [regExpiry, setRegExpiry] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedData, setSavedData] = useState<Record<string, { number: string; expiry: string }>>({});

  useEffect(() => { loadSavedRegistrations(); }, [user]);

  const loadSavedRegistrations = async () => {
    if (!user) return;
    try {
      const snap = await getDocs(query(collection(db, "registrations"), where("userId", "==", user.uid)));
      const data: Record<string, { number: string; expiry: string }> = {};
      snap.docs.forEach((d) => { data[d.data().regionId] = { number: d.data().regNumber, expiry: d.data().regExpiry }; });
      setSavedData(data);
    } catch (e) { console.log("Load registrations error:", e); }
  };

  const openRegion = (region: RegionData) => {
    setSelectedRegion(region);
    const existing = savedData[region.id];
    setRegNumber(existing?.number || "");
    setRegExpiry(existing?.expiry || "");
    setShowModal(true);
  };

  const saveRegistration = async () => {
    if (!user || !selectedRegion) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "registrations", `${user.uid}_${selectedRegion.id}`), {
        userId: user.uid, regionId: selectedRegion.id, regionName: selectedRegion.name,
        country: selectedRegion.country, regNumber, regExpiry,
      });
      setSavedData((prev) => ({ ...prev, [selectedRegion.id]: { number: regNumber, expiry: regExpiry } }));
      setShowModal(false);
      Alert.alert("Saved! 🐝", `Registration info for ${selectedRegion.name} saved.`);
    } catch (e) { Alert.alert("Error", "Could not save. Try again."); }
    finally { setSaving(false); }
  };

  const filteredUS = US_STATES.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.abbr.toLowerCase().includes(search.toLowerCase())
  );

  const savedCount = Object.keys(savedData).length;
  const S = makeStyles(theme);

  const renderRegionCard = (region: RegionData) => {
    const saved = savedData[region.id];
    const color = REQUIREMENT_COLORS[region.required];
    return (
      <Pressable key={region.id} onPress={() => openRegion(region)} style={S.regionCard}>
        <View style={[S.regionAbbrBox, { backgroundColor: color + "20", borderColor: color }]}>
          <Text style={[S.regionAbbr, { color }]}>{region.abbr}</Text>
        </View>
        <View style={S.regionInfo}>
          <Text style={S.regionName}>{region.name}</Text>
          <Text style={[S.regionReq, { color }]}>
            {REQUIREMENT_EMOJIS[region.required]} {REQUIREMENT_LABELS[region.required]}
            {region.fee !== "N/A" ? `  ·  ${region.fee}` : ""}
            {region.deadline !== "N/A" ? `  ·  ${region.deadline}` : ""}
          </Text>
          {saved && <Text style={S.savedTag}>✅ Reg #{saved.number}{saved.expiry ? ` · Expires ${saved.expiry}` : ""}</Text>}
        </View>
        <Text style={S.chevron}>›</Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={S.page}>
      <NavBar />
      <View style={S.container}>
        <View style={S.header}>
          <Text style={S.title}>🏛️ Hive Registration</Text>
          <Text style={S.subtitle}>Know the registration requirements for your region</Text>
        </View>

        {savedCount > 0 && (
          <View style={S.savedBanner}>
            <Text style={S.savedBannerText}>✅ Registration info saved for {savedCount} region{savedCount > 1 ? "s" : ""}</Text>
          </View>
        )}

        <View style={S.infoBox}>
          <Text style={S.infoText}>💡 Even if your region doesn't require it, registering protects your hives — you'll get alerts about disease outbreaks and pesticide applications nearby.</Text>
        </View>

        <View style={S.tabs}>
          <Pressable style={[S.tab, activeTab === "us" && S.tabActive]} onPress={() => { setActiveTab("us"); setSelectedCountry(null); setSearch(""); }}>
            <Text style={[S.tabText, activeTab === "us" && S.tabTextActive]}>🇺🇸 United States</Text>
          </Pressable>
          <Pressable style={[S.tab, activeTab === "international" && S.tabActive]} onPress={() => { setActiveTab("international"); setSelectedCountry(null); }}>
            <Text style={[S.tabText, activeTab === "international" && S.tabTextActive]}>🌍 International</Text>
          </Pressable>
        </View>

        {activeTab === "us" && (
          <ScrollView contentContainerStyle={S.tabContent}>
            <TextInput style={S.searchInput} placeholder="Search state..." placeholderTextColor={theme.textMuted} value={search} onChangeText={setSearch} />
            {filteredUS.map(renderRegionCard)}
          </ScrollView>
        )}

        {activeTab === "international" && (
          !selectedCountry ? (
            <ScrollView contentContainerStyle={S.tabContent}>
              <Text style={S.sectionHint}>Select your country to see registration requirements</Text>
              {COUNTRY_GROUPS.map((group) => {
                const savedInGroup = group.regions.filter((r) => savedData[r.id]).length;
                return (
                  <Pressable key={group.id} onPress={() => setSelectedCountry(group)} style={S.countryCard}>
                    <Text style={S.countryFlag}>{group.flag}</Text>
                    <View style={S.countryInfo}>
                      <Text style={S.countryName}>{group.label}</Text>
                      <Text style={S.countryDesc}>{group.description}</Text>
                      {savedInGroup > 0 && <Text style={S.savedTag}>✅ {savedInGroup} region{savedInGroup > 1 ? "s" : ""} saved</Text>}
                    </View>
                    <Text style={S.chevron}>›</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <ScrollView contentContainerStyle={S.tabContent}>
              <Pressable onPress={() => setSelectedCountry(null)} style={S.backButton}>
                <Text style={S.backButtonText}>← Back to Countries</Text>
              </Pressable>
              <Text style={S.countryHeading}>{selectedCountry.flag} {selectedCountry.label}</Text>
              {selectedCountry.regions.map(renderRegionCard)}
            </ScrollView>
          )
        )}
      </View>

      <Modal visible={showModal} animationType="slide" transparent>
        <ScrollView contentContainerStyle={S.modalOverlay}>
          {selectedRegion && (
            <View style={S.modalCard}>
              <View style={S.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={S.modalTitle}>{selectedRegion.name}</Text>
                  <Text style={S.modalCountry}>{selectedRegion.country}</Text>
                  <View style={[S.modalBadge, { backgroundColor: REQUIREMENT_COLORS[selectedRegion.required] + "20", borderColor: REQUIREMENT_COLORS[selectedRegion.required] }]}>
                    <Text style={[S.modalBadgeText, { color: REQUIREMENT_COLORS[selectedRegion.required] }]}>
                      {REQUIREMENT_EMOJIS[selectedRegion.required]} {REQUIREMENT_LABELS[selectedRegion.required]}
                    </Text>
                  </View>
                </View>
                <Pressable onPress={() => setShowModal(false)} style={S.closeBtn}>
                  <Text style={S.closeBtnText}>✕</Text>
                </Pressable>
              </View>
              <View style={S.detailRow}><Text style={S.detailLabel}>💰 Fee</Text><Text style={S.detailValue}>{selectedRegion.fee}</Text></View>
              <View style={S.detailRow}><Text style={S.detailLabel}>📅 Deadline</Text><Text style={S.detailValue}>{selectedRegion.deadline}</Text></View>
              <View style={S.notesBox}><Text style={S.notesText}>{selectedRegion.notes}</Text></View>
              <Pressable onPress={() => Linking.openURL(selectedRegion.url)} style={S.registerButton}>
                <Text style={S.registerButtonText}>🔗 Go to Official Registration Page</Text>
              </Pressable>
              {selectedRegion.required !== "none" && (
                <>
                  <Text style={S.sectionDivider}>SAVE YOUR REGISTRATION INFO</Text>
                  <TextInput style={S.input} placeholder="Registration / Apiary ID number" placeholderTextColor={theme.textMuted} value={regNumber} onChangeText={setRegNumber} />
                  <TextInput style={S.input} placeholder="Expiry date (e.g. Dec 31, 2026)" placeholderTextColor={theme.textMuted} value={regExpiry} onChangeText={setRegExpiry} />
                  <Pressable onPress={saveRegistration} disabled={saving} style={S.saveButton}>
                    <Text style={S.saveButtonText}>{saving ? "Saving..." : "💾 Save Registration Info"}</Text>
                  </Pressable>
                </>
              )}
            </View>
          )}
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
    title: { color: theme.textPrimary, fontSize: theme.fontLG, fontWeight: "900", marginBottom: 2 },
    subtitle: { color: theme.textMuted, fontSize: theme.fontSM },
    savedBanner: { backgroundColor: theme.bgCardAlt, borderRadius: theme.radiusMD, padding: theme.spaceSM, marginHorizontal: theme.spaceMD, marginBottom: 6, borderWidth: 1, borderColor: theme.green },
    savedBannerText: { color: theme.green, fontWeight: "800", fontSize: theme.fontXS },
    infoBox: { backgroundColor: theme.bgCardAlt, borderRadius: theme.radiusMD, padding: theme.spaceSM, marginHorizontal: theme.spaceMD, marginBottom: 6, borderWidth: 1, borderColor: theme.border },
    infoText: { color: theme.textSecondary, fontSize: theme.fontXS, lineHeight: 18 },
    tabs: { flexDirection: "row", borderBottomWidth: 1, borderColor: theme.border, marginHorizontal: theme.spaceMD },
    tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
    tabActive: { borderBottomWidth: 2, borderBottomColor: theme.honey },
    tabText: { color: theme.textMuted, fontWeight: "700", fontSize: theme.fontSM },
    tabTextActive: { color: theme.honey },
    tabContent: { padding: theme.spaceMD, paddingBottom: 50 },
    sectionHint: { color: theme.textMuted, fontSize: theme.fontXS, fontStyle: "italic", marginBottom: theme.spaceMD },
    searchInput: { backgroundColor: theme.bgCard, color: theme.textPrimary, borderWidth: 1, borderColor: theme.border, borderRadius: theme.radiusMD, padding: 12, marginBottom: theme.spaceMD, fontSize: theme.fontSM },
    countryCard: { backgroundColor: theme.bgCard, borderRadius: theme.radiusMD, padding: theme.spaceMD, flexDirection: "row", alignItems: "center", marginBottom: 10, borderWidth: 1, borderColor: theme.border, gap: 12 },
    countryFlag: { fontSize: 36 },
    countryInfo: { flex: 1 },
    countryName: { color: theme.textPrimary, fontWeight: "900", fontSize: theme.fontMD, marginBottom: 2 },
    countryDesc: { color: theme.textMuted, fontSize: theme.fontXS },
    countryHeading: { color: theme.textPrimary, fontWeight: "900", fontSize: theme.fontLG, marginBottom: theme.spaceMD },
    backButton: { marginBottom: theme.spaceMD },
    backButtonText: { color: theme.honey, fontWeight: "800", fontSize: theme.fontSM },
    regionCard: { backgroundColor: theme.bgCard, borderRadius: theme.radiusMD, padding: theme.spaceMD, flexDirection: "row", alignItems: "center", marginBottom: 8, borderWidth: 1, borderColor: theme.border, gap: 12 },
    regionAbbrBox: { width: 52, height: 52, borderRadius: theme.radiusMD, borderWidth: 2, alignItems: "center", justifyContent: "center" },
    regionAbbr: { fontSize: 13, fontWeight: "900", textAlign: "center" },
    regionInfo: { flex: 1 },
    regionName: { color: theme.textPrimary, fontWeight: "800", fontSize: theme.fontSM, marginBottom: 2 },
    regionReq: { fontSize: theme.fontXS, fontWeight: "700" },
    savedTag: { color: theme.green, fontSize: 10, fontWeight: "700", marginTop: 3 },
    chevron: { color: theme.textMuted, fontSize: 24, fontWeight: "300" },
    modalOverlay: { flexGrow: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" },
    modalCard: { backgroundColor: theme.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: theme.spaceLG, paddingBottom: 40 },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: theme.spaceMD },
    modalTitle: { color: theme.textPrimary, fontSize: theme.fontLG, fontWeight: "900", marginBottom: 2 },
    modalCountry: { color: theme.textMuted, fontSize: theme.fontXS, marginBottom: 8 },
    modalBadge: { alignSelf: "flex-start", paddingVertical: 4, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1 },
    modalBadgeText: { fontSize: theme.fontXS, fontWeight: "800" },
    closeBtn: { backgroundColor: theme.bgCardAlt, borderRadius: 20, width: 36, height: 36, alignItems: "center", justifyContent: "center" },
    closeBtnText: { color: theme.textMuted, fontSize: 16, fontWeight: "700" },
    detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.border },
    detailLabel: { color: theme.textMuted, fontSize: theme.fontSM },
    detailValue: { color: theme.textPrimary, fontWeight: "700", fontSize: theme.fontSM },
    notesBox: { backgroundColor: theme.bgCardAlt, borderRadius: theme.radiusMD, padding: theme.spaceMD, marginVertical: theme.spaceMD, borderWidth: 1, borderColor: theme.border },
    notesText: { color: theme.textSecondary, fontSize: theme.fontSM, lineHeight: 20 },
    registerButton: { backgroundColor: theme.honey, padding: 14, borderRadius: theme.radiusMD, alignItems: "center", marginBottom: theme.spaceMD },
    registerButtonText: { color: theme.bg, fontWeight: "900", fontSize: theme.fontSM },
    sectionDivider: { color: theme.textMuted, fontSize: theme.fontXS, fontWeight: "800", letterSpacing: 1.5, marginBottom: 10, marginTop: 4 },
    input: { backgroundColor: theme.bgInput, color: theme.textPrimary, borderWidth: 1, borderColor: theme.border, borderRadius: theme.radiusMD, padding: 12, marginBottom: 10, fontSize: theme.fontSM },
    saveButton: { backgroundColor: theme.green, padding: 14, borderRadius: theme.radiusMD, alignItems: "center" },
    saveButtonText: { color: "#fff", fontWeight: "900", fontSize: theme.fontSM },
  });
}
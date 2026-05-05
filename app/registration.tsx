/**
 * app/registration.tsx
 *
 * Hive Registration Helper
 * Shows registration requirements for US (all 50 states + DC),
 * Canada, Australia, UK, and other international countries.
 * Lets user store their registration number + renewal date in Firestore.
 */

import { useRouter } from "expo-router";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
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
import NavBar from "../components/NavBar";
import { useAuthContext } from "../context/AuthContext";
import { useAppTheme } from "../hooks/useAppTheme";
import { db } from "../utils/firebase";

// ── Types ─────────────────────────────────────────────────────────────────────

type RequirementLevel = "required" | "voluntary" | "none" | "conditional";

type RegionData = {
  name: string;
  abbr: string;
  country: string;
  required: RequirementLevel;
  fee: string;
  deadline: string;
  notes: string;
  url: string;
};

// ── US States ─────────────────────────────────────────────────────────────────

const US_STATES: RegionData[] = [
  { name: "Alabama", abbr: "AL", country: "US", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Alabama Department of Agriculture and Industries.", url: "https://agi.alabama.gov/plant-industries/apiary-program/" },
  { name: "Alaska", abbr: "AK", country: "US", required: "voluntary", fee: "Free", deadline: "None", notes: "No state registration required. Voluntary registration encouraged.", url: "https://dec.alaska.gov/eh/vet/apiary/" },
  { name: "Arizona", abbr: "AZ", country: "US", required: "required", fee: "$10–$50", deadline: "Annual", notes: "Register with AZ Dept of Agriculture. Fee varies by hive count.", url: "https://agriculture.az.gov/pesticides-pest-management/apiary" },
  { name: "Arkansas", abbr: "AR", country: "US", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Arkansas Agriculture Department Plant Board.", url: "https://www.plantboard.org/apiary" },
  { name: "California", abbr: "CA", country: "US", required: "required", fee: "Varies", deadline: "Annual - Jan 1", notes: "Register via BeeWhere system with county Ag Commissioner.", url: "https://www.cdfa.ca.gov/plant/beewhere.html" },
  { name: "Colorado", abbr: "CO", country: "US", required: "none", fee: "N/A", deadline: "N/A", notes: "No state registration required. Check local county ordinances.", url: "https://ag.colorado.gov/plants/apiary" },
  { name: "Connecticut", abbr: "CT", country: "US", required: "required", fee: "Free", deadline: "Annual", notes: "Register with CT Dept of Agriculture.", url: "https://portal.ct.gov/DOAG/Regulatory-Division/Regulatory-Division/Apiculture" },
  { name: "Delaware", abbr: "DE", country: "US", required: "required", fee: "Free", deadline: "Annual", notes: "Register with DE Dept of Agriculture.", url: "https://agriculture.delaware.gov/plant-industries/apiary/" },
  { name: "Florida", abbr: "FL", country: "US", required: "required", fee: "$10–$50+", deadline: "Annual", notes: "Mandatory registration AND inspection. Every beekeeper, every hive. No exceptions.", url: "https://www.fdacs.gov/Agriculture-Industry/Plants-and-Plant-Products/Apiary-Inspection" },
  { name: "Georgia", abbr: "GA", country: "US", required: "conditional", fee: "Varies", deadline: "Annual", notes: "Only required if selling bees commercially. Hobbyists not required.", url: "https://agr.georgia.gov/apiary-section" },
  { name: "Hawaii", abbr: "HI", country: "US", required: "voluntary", fee: "Free", deadline: "None", notes: "Registration encouraged but not required.", url: "https://hdoa.hawaii.gov/pi/pq/apiary-section/" },
  { name: "Idaho", abbr: "ID", country: "US", required: "conditional", fee: "$10+", deadline: "July 1", notes: "Required for non-hobbyists. Hobbyists exempt.", url: "https://agri.idaho.gov/subpages/plants/plantDiseases/apiary.html" },
  { name: "Illinois", abbr: "IL", country: "US", required: "required", fee: "Free", deadline: "Annual", notes: "Free registration and inspection by mail.", url: "https://agr.illinois.gov/about/divisions/lab-services/apiary.html" },
  { name: "Indiana", abbr: "IN", country: "US", required: "required", fee: "Free", deadline: "Annual", notes: "Register with IN State Dept of Agriculture.", url: "https://www.in.gov/isda/divisions/natural-resources/apiary/" },
  { name: "Iowa", abbr: "IA", country: "US", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Iowa Dept of Agriculture and Land Stewardship.", url: "https://iowaagriculture.gov/apiary" },
  { name: "Kansas", abbr: "KS", country: "US", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Kansas Dept of Agriculture.", url: "https://www.agriculture.ks.gov/divisions-programs/plant-protection-weed-control/apiary" },
  { name: "Kentucky", abbr: "KY", country: "US", required: "required", fee: "Free", deadline: "Annual", notes: "Register with KY Dept of Agriculture.", url: "https://www.kyagr.com/consumer/apiary.html" },
  { name: "Louisiana", abbr: "LA", country: "US", required: "required", fee: "$10–$25", deadline: "Annual", notes: "Register with Louisiana Dept of Agriculture and Forestry.", url: "https://www.ldaf.state.la.us/plant/apiary/" },
  { name: "Maine", abbr: "ME", country: "US", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Maine Dept of Agriculture, Conservation and Forestry.", url: "https://www.maine.gov/dacf/php/apiary/index.shtml" },
  { name: "Maryland", abbr: "MD", country: "US", required: "required", fee: "Free", deadline: "Annual", notes: "Register with MD Dept of Agriculture.", url: "https://mda.maryland.gov/plants-pests/Pages/apiary_inspection.aspx" },
  { name: "Massachusetts", abbr: "MA", country: "US", required: "required", fee: "Free", deadline: "Annual", notes: "Register with MA Dept of Agricultural Resources.", url: "https://www.mass.gov/how-to/register-an-apiary" },
  { name: "Michigan", abbr: "MI", country: "US", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Michigan Dept of Agriculture and Rural Development.", url: "https://www.michigan.gov/mdard/0,4610,7-125-1568_2390_2392-7026--,00.html" },
  { name: "Minnesota", abbr: "MN", country: "US", required: "required", fee: "$25–$100+", deadline: "Annual - Apr 1", notes: "Register with MN Dept of Agriculture. Fee based on hive count.", url: "https://www.mda.state.mn.us/plants-insects/apiary-registration" },
  { name: "Mississippi", abbr: "MS", country: "US", required: "required", fee: "Free", deadline: "Annual", notes: "Register with MS Dept of Agriculture and Commerce.", url: "https://www.mdac.ms.gov/divisions/plant-industry/apiary/" },
  { name: "Missouri", abbr: "MO", country: "US", required: "required", fee: "Free", deadline: "Annual", notes: "Register with MO Dept of Agriculture.", url: "https://agriculture.mo.gov/plants/apiary/" },
  { name: "Montana", abbr: "MT", country: "US", required: "conditional", fee: "Free", deadline: "Annual", notes: "Commercial required. Hobbyists (under 5 hives) voluntary but encouraged.", url: "https://agr.mt.gov/Apiary" },
  { name: "Nebraska", abbr: "NE", country: "US", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Nebraska Dept of Agriculture.", url: "https://nda.nebraska.gov/plant/apiary/index.html" },
  { name: "Nevada", abbr: "NV", country: "US", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Nevada Dept of Agriculture.", url: "https://agri.nv.gov/Plant/Apiary/Apiary/" },
  { name: "New Hampshire", abbr: "NH", country: "US", required: "required", fee: "Free", deadline: "Annual", notes: "Register with NH Dept of Agriculture, Markets and Food.", url: "https://www.agriculture.nh.gov/divisions/plant-industry/apiary.htm" },
  { name: "New Jersey", abbr: "NJ", country: "US", required: "required", fee: "Free", deadline: "Annual", notes: "Register with NJ Dept of Agriculture.", url: "https://www.nj.gov/agriculture/divisions/pi/prog/apiary.html" },
  { name: "New Mexico", abbr: "NM", country: "US", required: "required", fee: "Free", deadline: "Annual", notes: "Register with NM Dept of Agriculture.", url: "https://www.nmda.nmsu.edu/apiary/" },
  { name: "New York", abbr: "NY", country: "US", required: "required", fee: "Free", deadline: "Annual", notes: "Register with NY Dept of Agriculture and Markets.", url: "https://www.agriculture.ny.gov/AP/apiary-registration.html" },
  { name: "North Carolina", abbr: "NC", country: "US", required: "required", fee: "Free", deadline: "Annual", notes: "Strong hobbyist protections. State prohibits banning fewer than 5 hives.", url: "https://www.ncagr.gov/plantindustry/plant/apiary/" },
  { name: "North Dakota", abbr: "ND", country: "US", required: "required", fee: "$10–$50", deadline: "Annual - Apr 1", notes: "Register with ND Dept of Agriculture.", url: "https://www.nd.gov/ndda/plant-sciences/apiary" },
  { name: "Ohio", abbr: "OH", country: "US", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Ohio Dept of Agriculture.", url: "https://agri.ohio.gov/wps/portal/gov/oda/divisions/plant-health/apiary" },
  { name: "Oklahoma", abbr: "OK", country: "US", required: "required", fee: "Free", deadline: "Annual", notes: "Register with OK Dept of Agriculture, Food and Forestry.", url: "https://www.oda.state.ok.us/divisions/plant/apiary.html" },
  { name: "Oregon", abbr: "OR", country: "US", required: "required", fee: "$10+", deadline: "Annual", notes: "Register with OR Dept of Agriculture. Additional fee per colony for 5+ hives.", url: "https://www.oregon.gov/ODA/programs/Insects/Apiary/Pages/Apiary.aspx" },
  { name: "Pennsylvania", abbr: "PA", country: "US", required: "required", fee: "$10 + $0.50/hive", deadline: "Annual", notes: "Register with PA Dept of Agriculture. Covers all apiaries and hives.", url: "https://www.agriculture.pa.gov/Plants_Land_Water/PlantIndustry/Entomology/bees_apiary/Pages/default.aspx" },
  { name: "Rhode Island", abbr: "RI", country: "US", required: "required", fee: "Free", deadline: "Annual", notes: "Register by mail with RI Dept of Environmental Management.", url: "https://dem.ri.gov/programs/agriculture/plant-sciences/apiary.php" },
  { name: "South Carolina", abbr: "SC", country: "US", required: "voluntary", fee: "Free", deadline: "None", notes: "No requirement but voluntary registry gives pesticide warnings.", url: "https://www.clemson.edu/extension/apiculture/" },
  { name: "South Dakota", abbr: "SD", country: "US", required: "required", fee: "$11/apiary + $1/hive", deadline: "Feb 1", notes: "Register with SD Dept of Agriculture and Natural Resources.", url: "https://danr.sd.gov/ag/plants/apiary/" },
  { name: "Tennessee", abbr: "TN", country: "US", required: "required", fee: "Free", deadline: "Annual", notes: "Free registration by mail or online with TN Dept of Agriculture.", url: "https://www.tn.gov/agriculture/farms/plant-industries/apiary.html" },
  { name: "Texas", abbr: "TX", country: "US", required: "none", fee: "N/A", deadline: "N/A", notes: "No state registration required for keeping bees. Commercial activity has other requirements.", url: "https://www.tda.texas.gov/apiculture" },
  { name: "Utah", abbr: "UT", country: "US", required: "required", fee: "$10–$25", deadline: "Annual", notes: "Register with Utah Dept of Agriculture and Food.", url: "https://ag.utah.gov/plants/apiary-inspection/" },
  { name: "Vermont", abbr: "VT", country: "US", required: "required", fee: "Free", deadline: "Annual", notes: "Register with VT Agency of Agriculture, Food and Markets.", url: "https://agriculture.vermont.gov/plant-industry/apiary-program" },
  { name: "Virginia", abbr: "VA", country: "US", required: "required", fee: "Free", deadline: "Annual", notes: "Register with VA Dept of Agriculture and Consumer Services.", url: "https://www.vdacs.virginia.gov/plant-industry-services-apiary.shtml" },
  { name: "Washington", abbr: "WA", country: "US", required: "required", fee: "$5–$300", deadline: "Apr 1", notes: "All beekeepers must register annually. Fee based on hive count. Late fees apply.", url: "https://agr.wa.gov/departments/insects-pests-and-weeds/insects/apiary-pollinators/apiary-reg-and-laws" },
  { name: "West Virginia", abbr: "WV", country: "US", required: "required", fee: "Free", deadline: "Annual", notes: "Register with WV Dept of Agriculture.", url: "https://agriculture.wv.gov/divisions/plant-industries/apiary/" },
  { name: "Wisconsin", abbr: "WI", country: "US", required: "required", fee: "Free", deadline: "Annual", notes: "Register with WI Dept of Agriculture, Trade and Consumer Protection.", url: "https://datcp.wi.gov/Pages/Programs_Services/ApiaryRegistration.aspx" },
  { name: "Wyoming", abbr: "WY", country: "US", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Wyoming Dept of Agriculture.", url: "https://agriculture.wy.gov/divisions/ae/apiary" },
  { name: "Washington D.C.", abbr: "DC", country: "US", required: "required", fee: "Free", deadline: "Annual", notes: "Register with DC Dept of Energy and Environment.", url: "https://doee.dc.gov/service/urban-beekeeping" },
];

// ── International ─────────────────────────────────────────────────────────────

const INTERNATIONAL: RegionData[] = [
  // Canada
  { name: "Alberta", abbr: "AB", country: "Canada", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Alberta Agriculture and Forestry. All beekeepers must register.", url: "https://www.alberta.ca/apiculture-registration.aspx" },
  { name: "British Columbia", abbr: "BC", country: "Canada", required: "required", fee: "Free", deadline: "Annual", notes: "Register with BC Ministry of Agriculture.", url: "https://www2.gov.bc.ca/gov/content/industry/agriculture-seafood/animals-and-crops/animal-health/bee-health" },
  { name: "Manitoba", abbr: "MB", country: "Canada", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Manitoba Agriculture.", url: "https://www.gov.mb.ca/agriculture/animals/apiculture/index.html" },
  { name: "Ontario", abbr: "ON", country: "Canada", required: "required", fee: "Free", deadline: "Annual", notes: "Register under the Bees Act with Ontario Ministry of Agriculture.", url: "https://www.ontario.ca/page/bees-act" },
  { name: "Quebec", abbr: "QC", country: "Canada", required: "required", fee: "Free", deadline: "Annual", notes: "Register with MAPAQ (Ministère de l'Agriculture).", url: "https://www.mapaq.gouv.qc.ca/fr/Productions/md/programmesliste/apiculture/Pages/apiculture.aspx" },
  { name: "Saskatchewan", abbr: "SK", country: "Canada", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Saskatchewan Agriculture.", url: "https://www.saskatchewan.ca/business/agriculture-natural-resources-and-industry/agribusiness-farmers-and-ranchers/animals-and-livestock/bees" },
  { name: "Nova Scotia", abbr: "NS", country: "Canada", required: "required", fee: "Free", deadline: "Annual", notes: "Register with NS Dept of Agriculture.", url: "https://novascotia.ca/agri/industry-development/bees/" },
  { name: "New Brunswick", abbr: "NB", country: "Canada", required: "required", fee: "Free", deadline: "Annual", notes: "Register with NB Dept of Agriculture.", url: "https://www2.gnb.ca/content/gnb/en/departments/10/agriculture.html" },

  // Australia
  { name: "New South Wales", abbr: "NSW", country: "Australia", required: "required", fee: "Free", deadline: "Annual", notes: "Mandatory registration with NSW DPI. All beekeepers must register.", url: "https://www.dpi.nsw.gov.au/animals-and-livestock/bees" },
  { name: "Victoria", abbr: "VIC", country: "Australia", required: "required", fee: "Free (under 5 hives)", deadline: "Annual", notes: "Free for fewer than 5 hives. Register with Agriculture Victoria.", url: "https://agriculture.vic.gov.au/livestock-and-animals/bees" },
  { name: "Queensland", abbr: "QLD", country: "Australia", required: "required", fee: "Free", deadline: "Annual", notes: "Mandatory registration with Biosecurity Queensland.", url: "https://www.business.qld.gov.au/industries/farms-fishing-forestry/agriculture/crop-production/bees" },
  { name: "South Australia", abbr: "SA", country: "Australia", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Primary Industries and Regions SA.", url: "https://pir.sa.gov.au/biosecurity/bees" },
  { name: "Western Australia", abbr: "WA", country: "Australia", required: "required", fee: "Free", deadline: "Annual", notes: "Register with WA Dept of Primary Industries and Regional Development.", url: "https://www.agric.wa.gov.au/bees-and-bee-products" },
  { name: "Tasmania", abbr: "TAS", country: "Australia", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Biosecurity Tasmania.", url: "https://dpipwe.tas.gov.au/biosecurity-tasmania/animal-biosecurity/bees" },
  { name: "Northern Territory", abbr: "NT", country: "Australia", required: "required", fee: "Free", deadline: "Annual", notes: "Register with NT Dept of Industry, Tourism and Trade.", url: "https://nt.gov.au/industry/agriculture/food-crops-plants-and-quarantine/bees" },
  { name: "ACT", abbr: "ACT", country: "Australia", required: "required", fee: "Free", deadline: "Annual", notes: "Register with ACT Environment, Planning and Sustainable Development.", url: "https://www.accesscanberra.act.gov.au" },

  // UK & Ireland
  { name: "England & Wales", abbr: "EW", country: "UK", required: "voluntary", fee: "Free", deadline: "None", notes: "Register on BeeBase (National Bee Unit). Free disease inspections and disease outbreak alerts. Strongly recommended.", url: "https://www.nationalbeeunit.com/register" },
  { name: "Scotland", abbr: "SCO", country: "UK", required: "voluntary", fee: "Free", deadline: "None", notes: "Register on BeeBase. Strongly encouraged for disease monitoring.", url: "https://www.nationalbeeunit.com/register" },
  { name: "Northern Ireland", abbr: "NIR", country: "UK", required: "voluntary", fee: "Free", deadline: "None", notes: "Register with DAERA Agri-Food and Biosciences Institute.", url: "https://www.daera-ni.gov.uk/topics/animal-and-plant-health/bees" },
  { name: "Ireland", abbr: "IRL", country: "Ireland", required: "voluntary", fee: "Free", deadline: "None", notes: "Register with Department of Agriculture. Voluntary but recommended for disease alerts.", url: "https://www.gov.ie/en/service/7c093-apiary-registration/" },

  // Europe
  { name: "France", abbr: "FR", country: "France", required: "required", fee: "Free", deadline: "Annual - Dec 31", notes: "Mandatory annual declaration of all apiaries. Must obtain NAPI beekeeper number. Register online via Télépac.", url: "https://www.telepac.agriculture.gouv.fr" },
  { name: "Germany", abbr: "DE", country: "Germany", required: "required", fee: "Free", deadline: "Annual", notes: "Registration required with local veterinary authority (Veterinäramt). Rules vary by state (Bundesland).", url: "https://www.bienen.de" },
  { name: "Spain", abbr: "ES", country: "Spain", required: "required", fee: "Free", deadline: "Annual", notes: "Register with regional agricultural authority. Rules vary by autonomous community.", url: "https://www.mapa.gob.es/es/ganaderia/temas/produccion-y-mercados-ganaderos/sectores-ganaderos/apicultura/" },
  { name: "Italy", abbr: "IT", country: "Italy", required: "required", fee: "Free", deadline: "Annual", notes: "Register with BDA (Banca Dati Apistica) national database.", url: "https://www.vetinfo.it" },
  { name: "Netherlands", abbr: "NL", country: "Netherlands", required: "voluntary", fee: "Free", deadline: "None", notes: "No legal requirement but registration strongly encouraged.", url: "https://www.bijenhouders.nl" },
  { name: "Belgium", abbr: "BE", country: "Belgium", required: "required", fee: "Free", deadline: "Annual", notes: "Register with SANITEL (Federal Agency for the Safety of the Food Chain).", url: "https://www.favv-afsca.be" },
  { name: "Switzerland", abbr: "CH", country: "Switzerland", required: "required", fee: "Free", deadline: "Annual", notes: "Register with cantonal veterinary office. Rules vary by canton.", url: "https://www.apiservice.ch" },

  // New Zealand
  { name: "New Zealand", abbr: "NZ", country: "New Zealand", required: "required", fee: "Free", deadline: "Annual - Jun 30", notes: "Mandatory registration with AsureQuality under the APINZ system. All beekeepers must register.", url: "https://www.apinz.org.nz" },

  // South Africa
  { name: "South Africa", abbr: "ZA", country: "South Africa", required: "voluntary", fee: "Free", deadline: "None", notes: "No national mandatory registration. Contact local Dept of Agriculture.", url: "https://www.dalrrd.gov.za" },

  // Other
  { name: "Other / Not Listed", abbr: "OTH", country: "Other", required: "conditional", fee: "Varies", deadline: "Varies", notes: "Regulations vary widely. Contact your local Department of Agriculture or beekeeping association to find out your requirements.", url: "https://www.apimondia.com" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const REQUIREMENT_COLORS: Record<RequirementLevel, string> = {
  required: "#ef4444",
  voluntary: "#f59e0b",
  none: "#22c55e",
  conditional: "#3b82f6",
};

const REQUIREMENT_LABELS: Record<RequirementLevel, string> = {
  required: "Required",
  voluntary: "Voluntary",
  none: "Not Required",
  conditional: "Conditional",
};

const REQUIREMENT_EMOJIS: Record<RequirementLevel, string> = {
  required: "📋",
  voluntary: "✅",
  none: "🟢",
  conditional: "⚠️",
};

const ALL_REGIONS = [...US_STATES, ...INTERNATIONAL];

const COUNTRY_GROUPS = [
  { label: "🇺🇸 United States", data: US_STATES },
  { label: "🇨🇦 Canada", data: INTERNATIONAL.filter((r) => r.country === "Canada") },
  { label: "🇦🇺 Australia", data: INTERNATIONAL.filter((r) => r.country === "Australia") },
  { label: "🇬🇧 United Kingdom & Ireland", data: INTERNATIONAL.filter((r) => r.country === "UK" || r.country === "Ireland") },
  { label: "🇪🇺 Europe", data: INTERNATIONAL.filter((r) => ["France","Germany","Spain","Italy","Netherlands","Belgium","Switzerland"].includes(r.country)) },
  { label: "🌏 Other Countries", data: INTERNATIONAL.filter((r) => ["New Zealand","South Africa","Other"].includes(r.country)) },
];

// ── Screen ────────────────────────────────────────────────────────────────────

export default function RegistrationScreen() {
  const theme = useAppTheme();
  const { user } = useAuthContext();

  const [search, setSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<RegionData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [regNumber, setRegNumber] = useState("");
  const [regExpiry, setRegExpiry] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedData, setSavedData] = useState<Record<string, { number: string; expiry: string }>>({});

  useEffect(() => {
    loadSavedRegistrations();
  }, [user]);

  const loadSavedRegistrations = async () => {
    if (!user) return;
    try {
      const snap = await getDocs(
        query(collection(db, "registrations"), where("userId", "==", user.uid))
      );
      const data: Record<string, { number: string; expiry: string }> = {};
      snap.docs.forEach((d) => {
        data[d.data().regionKey] = { number: d.data().regNumber, expiry: d.data().regExpiry };
      });
      setSavedData(data);
    } catch (e) {
      console.log("Load registrations error:", e);
    }
  };

  const openRegion = (region: RegionData) => {
    setSelectedRegion(region);
    const key = `${region.country}_${region.abbr}`;
    const existing = savedData[key];
    setRegNumber(existing?.number || "");
    setRegExpiry(existing?.expiry || "");
    setShowModal(true);
  };

  const saveRegistration = async () => {
    if (!user || !selectedRegion) return;
    setSaving(true);
    const key = `${selectedRegion.country}_${selectedRegion.abbr}`;
    try {
      await setDoc(doc(db, "registrations", `${user.uid}_${key}`), {
        userId: user.uid,
        regionKey: key,
        regionName: selectedRegion.name,
        country: selectedRegion.country,
        regNumber,
        regExpiry,
      });
      setSavedData((prev) => ({ ...prev, [key]: { number: regNumber, expiry: regExpiry } }));
      setShowModal(false);
      Alert.alert("Saved! 🐝", `Registration info for ${selectedRegion.name} saved.`);
    } catch (e) {
      Alert.alert("Error", "Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const isSearching = search.length > 0;
  const filteredAll = ALL_REGIONS.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.abbr.toLowerCase().includes(search.toLowerCase()) ||
      r.country.toLowerCase().includes(search.toLowerCase())
  );

  const savedCount = Object.keys(savedData).length;
  const S = makeStyles(theme);

  const renderRegionCard = (region: RegionData) => {
    const key = `${region.country}_${region.abbr}`;
    const saved = savedData[key];
    const color = REQUIREMENT_COLORS[region.required];
    return (
      <Pressable key={key} onPress={() => openRegion(region)} style={S.stateCard}>
        <View style={[S.stateAbbrBox, { backgroundColor: color + "20", borderColor: color }]}>
          <Text style={[S.stateAbbr, { color }]}>{region.abbr}</Text>
        </View>
        <View style={S.stateInfo}>
          <Text style={S.stateName}>{region.name}</Text>
          <Text style={[S.stateReq, { color }]}>
            {REQUIREMENT_EMOJIS[region.required]} {REQUIREMENT_LABELS[region.required]}
            {region.fee !== "N/A" ? `  ·  ${region.fee}` : ""}
          </Text>
          {saved && (
            <Text style={S.savedTag}>✅ Reg #{saved.number}{saved.expiry ? ` · Expires ${saved.expiry}` : ""}</Text>
          )}
        </View>
        <Text style={S.chevron}>›</Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={S.page}>
      <NavBar />
      <ScrollView contentContainerStyle={S.content}>
        <Text style={S.title}>🏛️ Hive Registration</Text>
        <Text style={S.subtitle}>Know the registration requirements for your region</Text>

        {savedCount > 0 && (
          <View style={S.savedBanner}>
            <Text style={S.savedBannerText}>✅ Registration info saved for {savedCount} region{savedCount > 1 ? "s" : ""}</Text>
          </View>
        )}

        <View style={S.infoBox}>
          <Text style={S.infoText}>💡 Even if your region doesn't require it, registering protects your hives — you'll get alerts about disease outbreaks and pesticide applications nearby.</Text>
        </View>

        <TextInput
          style={S.searchInput}
          placeholder="Search state, province, or country..."
          placeholderTextColor={theme.textMuted}
          value={search}
          onChangeText={setSearch}
        />

        {isSearching ? (
          <>
            <Text style={S.groupLabel}>SEARCH RESULTS</Text>
            {filteredAll.length === 0
              ? <Text style={S.emptyText}>No results found</Text>
              : filteredAll.map(renderRegionCard)}
          </>
        ) : (
          COUNTRY_GROUPS.map((group) => (
            <View key={group.label}>
              <Text style={S.groupLabel}>{group.label}</Text>
              {group.data.map(renderRegionCard)}
            </View>
          ))
        )}
      </ScrollView>

      {/* Detail Modal */}
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

              <View style={S.detailRow}>
                <Text style={S.detailLabel}>💰 Fee</Text>
                <Text style={S.detailValue}>{selectedRegion.fee}</Text>
              </View>
              <View style={S.detailRow}>
                <Text style={S.detailLabel}>📅 Deadline</Text>
                <Text style={S.detailValue}>{selectedRegion.deadline}</Text>
              </View>
              <View style={S.notesBox}>
                <Text style={S.notesText}>{selectedRegion.notes}</Text>
              </View>

              <Pressable
                onPress={() => Linking.openURL(selectedRegion.url)}
                style={S.registerButton}
              >
                <Text style={S.registerButtonText}>🔗 Go to Official Registration Page</Text>
              </Pressable>

              {selectedRegion.required !== "none" && (
                <>
                  <Text style={S.sectionDivider}>SAVE YOUR REGISTRATION INFO</Text>
                  <TextInput
                    style={S.input}
                    placeholder="Registration / Apiary ID number"
                    placeholderTextColor={theme.textMuted}
                    value={regNumber}
                    onChangeText={setRegNumber}
                  />
                  <TextInput
                    style={S.input}
                    placeholder="Expiry date (e.g. Dec 31, 2026)"
                    placeholderTextColor={theme.textMuted}
                    value={regExpiry}
                    onChangeText={setRegExpiry}
                  />
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
    content: { padding: theme.spaceMD, paddingBottom: 50 },
    title: { color: theme.textPrimary, fontSize: theme.fontLG, fontWeight: "900", marginBottom: 4 },
    subtitle: { color: theme.textMuted, fontSize: theme.fontSM, marginBottom: theme.spaceMD },
    savedBanner: { backgroundColor: theme.bgCardAlt, borderRadius: theme.radiusMD, padding: theme.spaceSM, marginBottom: theme.spaceSM, borderWidth: 1, borderColor: theme.green },
    savedBannerText: { color: theme.green, fontWeight: "800", fontSize: theme.fontXS },
    infoBox: { backgroundColor: theme.bgCardAlt, borderRadius: theme.radiusMD, padding: theme.spaceMD, marginBottom: theme.spaceMD, borderWidth: 1, borderColor: theme.border },
    infoText: { color: theme.textSecondary, fontSize: theme.fontXS, lineHeight: 18 },
    searchInput: { backgroundColor: theme.bgCard, color: theme.textPrimary, borderWidth: 1, borderColor: theme.border, borderRadius: theme.radiusMD, padding: 12, marginBottom: theme.spaceMD, fontSize: theme.fontSM },
    groupLabel: { color: theme.textMuted, fontSize: theme.fontXS, fontWeight: "800", letterSpacing: 1.5, marginBottom: 8, marginTop: theme.spaceMD },
    emptyText: { color: theme.textMuted, fontSize: theme.fontSM, textAlign: "center", marginTop: 20 },
    stateCard: { backgroundColor: theme.bgCard, borderRadius: theme.radiusMD, padding: theme.spaceMD, flexDirection: "row", alignItems: "center", marginBottom: 8, borderWidth: 1, borderColor: theme.border, gap: 12 },
    stateAbbrBox: { width: 52, height: 52, borderRadius: theme.radiusMD, borderWidth: 2, alignItems: "center", justifyContent: "center" },
    stateAbbr: { fontSize: 13, fontWeight: "900", textAlign: "center" },
    stateInfo: { flex: 1 },
    stateName: { color: theme.textPrimary, fontWeight: "800", fontSize: theme.fontSM, marginBottom: 2 },
    stateReq: { fontSize: theme.fontXS, fontWeight: "700" },
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

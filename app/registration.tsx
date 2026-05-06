/**
 * app/registration.tsx
 *
 * Hive Registration Helper
 * US tab: all 50 states + DC with search.
 * International tab: pick country first, then see regions/provinces.
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

type RequirementLevel = "required" | "voluntary" | "none" | "conditional";

type RegionData = {
  id: string; name: string; abbr: string; country: string;
  required: RequirementLevel; fee: string; deadline: string; notes: string; url: string;
};

type CountryGroup = {
  id: string; label: string; flag: string; description: string; regions: RegionData[];
};

const US_STATES: RegionData[] = [
  { id: "AL", name: "Alabama", abbr: "AL", country: "USA", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Alabama Department of Agriculture and Industries.", url: "https://agi.alabama.gov/plant-industries/apiary-program/" },
  { id: "AK", name: "Alaska", abbr: "AK", country: "USA", required: "voluntary", fee: "Free", deadline: "None", notes: "No state registration required. Voluntary registration encouraged.", url: "https://dec.alaska.gov/eh/vet/apiary/" },
  { id: "AZ", name: "Arizona", abbr: "AZ", country: "USA", required: "required", fee: "$10–$50", deadline: "Annual", notes: "Register with AZ Dept of Agriculture. Fee varies by hive count.", url: "https://agriculture.az.gov/pesticides-pest-management/apiary" },
  { id: "AR", name: "Arkansas", abbr: "AR", country: "USA", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Arkansas Agriculture Department Plant Board.", url: "https://www.plantboard.org/apiary" },
  { id: "CA", name: "California", abbr: "CA", country: "USA", required: "required", fee: "Varies", deadline: "Jan 1", notes: "Register via BeeWhere system with county Ag Commissioner.", url: "https://www.cdfa.ca.gov/plant/beewhere.html" },
  { id: "CO", name: "Colorado", abbr: "CO", country: "USA", required: "none", fee: "N/A", deadline: "N/A", notes: "No state registration required. Check local county ordinances.", url: "https://ag.colorado.gov/plants/apiary" },
  { id: "CT", name: "Connecticut", abbr: "CT", country: "USA", required: "required", fee: "Free", deadline: "Annual", notes: "Register with CT Dept of Agriculture.", url: "https://portal.ct.gov/DOAG/Regulatory-Division/Regulatory-Division/Apiculture" },
  { id: "DE", name: "Delaware", abbr: "DE", country: "USA", required: "required", fee: "Free", deadline: "Annual", notes: "Register with DE Dept of Agriculture.", url: "https://agriculture.delaware.gov/plant-industries/apiary/" },
  { id: "FL", name: "Florida", abbr: "FL", country: "USA", required: "required", fee: "$10–$50+", deadline: "Annual", notes: "Mandatory registration AND inspection. Every beekeeper, every hive. No exceptions.", url: "https://www.fdacs.gov/Agriculture-Industry/Plants-and-Plant-Products/Apiary-Inspection" },
  { id: "GA", name: "Georgia", abbr: "GA", country: "USA", required: "conditional", fee: "Varies", deadline: "Annual", notes: "Only required if selling bees commercially. Hobbyists not required.", url: "https://agr.georgia.gov/apiary-section" },
  { id: "HI", name: "Hawaii", abbr: "HI", country: "USA", required: "voluntary", fee: "Free", deadline: "None", notes: "Registration encouraged but not required.", url: "https://hdoa.hawaii.gov/pi/pq/apiary-section/" },
  { id: "ID", name: "Idaho", abbr: "ID", country: "USA", required: "conditional", fee: "$10+", deadline: "Jul 1", notes: "Required for non-hobbyists. Hobbyists exempt.", url: "https://agri.idaho.gov/subpages/plants/plantDiseases/apiary.html" },
  { id: "IL", name: "Illinois", abbr: "IL", country: "USA", required: "required", fee: "Free", deadline: "Annual", notes: "Free registration and inspection by mail.", url: "https://agr.illinois.gov/about/divisions/lab-services/apiary.html" },
  { id: "IN", name: "Indiana", abbr: "IN", country: "USA", required: "required", fee: "Free", deadline: "Annual", notes: "Register with IN State Dept of Agriculture.", url: "https://www.in.gov/isda/divisions/natural-resources/apiary/" },
  { id: "IA", name: "Iowa", abbr: "IA", country: "USA", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Iowa Dept of Agriculture and Land Stewardship.", url: "https://iowaagriculture.gov/apiary" },
  { id: "KS", name: "Kansas", abbr: "KS", country: "USA", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Kansas Dept of Agriculture.", url: "https://www.agriculture.ks.gov/divisions-programs/plant-protection-weed-control/apiary" },
  { id: "KY", name: "Kentucky", abbr: "KY", country: "USA", required: "required", fee: "Free", deadline: "Annual", notes: "Register with KY Dept of Agriculture.", url: "https://www.kyagr.com/consumer/apiary.html" },
  { id: "LA", name: "Louisiana", abbr: "LA", country: "USA", required: "required", fee: "$10–$25", deadline: "Annual", notes: "Register with Louisiana Dept of Agriculture and Forestry.", url: "https://www.ldaf.state.la.us/plant/apiary/" },
  { id: "ME", name: "Maine", abbr: "ME", country: "USA", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Maine Dept of Agriculture, Conservation and Forestry.", url: "https://www.maine.gov/dacf/php/apiary/index.shtml" },
  { id: "MD", name: "Maryland", abbr: "MD", country: "USA", required: "required", fee: "Free", deadline: "Annual", notes: "Register with MD Dept of Agriculture.", url: "https://mda.maryland.gov/plants-pests/Pages/apiary_inspection.aspx" },
  { id: "MA", name: "Massachusetts", abbr: "MA", country: "USA", required: "required", fee: "Free", deadline: "Annual", notes: "Register with MA Dept of Agricultural Resources.", url: "https://www.mass.gov/how-to/register-an-apiary" },
  { id: "MI", name: "Michigan", abbr: "MI", country: "USA", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Michigan Dept of Agriculture and Rural Development.", url: "https://www.michigan.gov/mdard" },
  { id: "MN", name: "Minnesota", abbr: "MN", country: "USA", required: "required", fee: "$25–$100+", deadline: "Apr 1", notes: "Register with MN Dept of Agriculture. Fee based on hive count.", url: "https://www.mda.state.mn.us/plants-insects/apiary-registration" },
  { id: "MS", name: "Mississippi", abbr: "MS", country: "USA", required: "required", fee: "Free", deadline: "Annual", notes: "Register with MS Dept of Agriculture and Commerce.", url: "https://www.mdac.ms.gov/divisions/plant-industry/apiary/" },
  { id: "MO", name: "Missouri", abbr: "MO", country: "USA", required: "required", fee: "Free", deadline: "Annual", notes: "Register with MO Dept of Agriculture.", url: "https://agriculture.mo.gov/plants/apiary/" },
  { id: "MT", name: "Montana", abbr: "MT", country: "USA", required: "conditional", fee: "Free", deadline: "Annual", notes: "Commercial required. Hobbyists (under 5 hives) voluntary but encouraged.", url: "https://agr.mt.gov/Apiary" },
  { id: "NE", name: "Nebraska", abbr: "NE", country: "USA", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Nebraska Dept of Agriculture.", url: "https://nda.nebraska.gov/plant/apiary/index.html" },
  { id: "NV", name: "Nevada", abbr: "NV", country: "USA", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Nevada Dept of Agriculture.", url: "https://agri.nv.gov/Plant/Apiary/Apiary/" },
  { id: "NH", name: "New Hampshire", abbr: "NH", country: "USA", required: "required", fee: "Free", deadline: "Annual", notes: "Register with NH Dept of Agriculture, Markets and Food.", url: "https://www.agriculture.nh.gov/divisions/plant-industry/apiary.htm" },
  { id: "NJ", name: "New Jersey", abbr: "NJ", country: "USA", required: "required", fee: "Free", deadline: "Annual", notes: "Register with NJ Dept of Agriculture.", url: "https://www.nj.gov/agriculture/divisions/pi/prog/apiary.html" },
  { id: "NM", name: "New Mexico", abbr: "NM", country: "USA", required: "required", fee: "Free", deadline: "Annual", notes: "Register with NM Dept of Agriculture.", url: "https://www.nmda.nmsu.edu/apiary/" },
  { id: "NY", name: "New York", abbr: "NY", country: "USA", required: "required", fee: "Free", deadline: "Annual", notes: "Register with NY Dept of Agriculture and Markets.", url: "https://www.agriculture.ny.gov/AP/apiary-registration.html" },
  { id: "NC", name: "North Carolina", abbr: "NC", country: "USA", required: "required", fee: "Free", deadline: "Annual", notes: "Strong hobbyist protections. State prohibits banning fewer than 5 hives.", url: "https://www.ncagr.gov/plantindustry/plant/apiary/" },
  { id: "ND", name: "North Dakota", abbr: "ND", country: "USA", required: "required", fee: "$10–$50", deadline: "Apr 1", notes: "Register with ND Dept of Agriculture.", url: "https://www.nd.gov/ndda/plant-sciences/apiary" },
  { id: "OH", name: "Ohio", abbr: "OH", country: "USA", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Ohio Dept of Agriculture.", url: "https://agri.ohio.gov/wps/portal/gov/oda/divisions/plant-health/apiary" },
  { id: "OK", name: "Oklahoma", abbr: "OK", country: "USA", required: "required", fee: "Free", deadline: "Annual", notes: "Register with OK Dept of Agriculture, Food and Forestry.", url: "https://www.oda.state.ok.us/divisions/plant/apiary.html" },
  { id: "OR", name: "Oregon", abbr: "OR", country: "USA", required: "required", fee: "$10+", deadline: "Annual", notes: "Register with OR Dept of Agriculture.", url: "https://www.oregon.gov/ODA/programs/Insects/Apiary/Pages/Apiary.aspx" },
  { id: "PA", name: "Pennsylvania", abbr: "PA", country: "USA", required: "required", fee: "$10 + $0.50/hive", deadline: "Annual", notes: "Covers all apiaries and hives owned by the beekeeper.", url: "https://www.agriculture.pa.gov/Plants_Land_Water/PlantIndustry/Entomology/bees_apiary/Pages/default.aspx" },
  { id: "RI", name: "Rhode Island", abbr: "RI", country: "USA", required: "required", fee: "Free", deadline: "Annual", notes: "Register by mail with RI Dept of Environmental Management.", url: "https://dem.ri.gov/programs/agriculture/plant-sciences/apiary.php" },
  { id: "SC", name: "South Carolina", abbr: "SC", country: "USA", required: "voluntary", fee: "Free", deadline: "None", notes: "No requirement but voluntary registry gives pesticide warnings.", url: "https://www.clemson.edu/extension/apiculture/" },
  { id: "SD", name: "South Dakota", abbr: "SD", country: "USA", required: "required", fee: "$11/apiary + $1/hive", deadline: "Feb 1", notes: "Register with SD Dept of Agriculture and Natural Resources.", url: "https://danr.sd.gov/ag/plants/apiary/" },
  { id: "TN", name: "Tennessee", abbr: "TN", country: "USA", required: "required", fee: "Free", deadline: "Annual", notes: "Free registration by mail or online with TN Dept of Agriculture.", url: "https://www.tn.gov/agriculture/farms/plant-industries/apiary.html" },
  { id: "TX", name: "Texas", abbr: "TX", country: "USA", required: "none", fee: "N/A", deadline: "N/A", notes: "No state registration required. Commercial activity has other requirements.", url: "https://www.tda.texas.gov/apiculture" },
  { id: "UT", name: "Utah", abbr: "UT", country: "USA", required: "required", fee: "$10–$25", deadline: "Annual", notes: "Register with Utah Dept of Agriculture and Food.", url: "https://ag.utah.gov/plants/apiary-inspection/" },
  { id: "VT", name: "Vermont", abbr: "VT", country: "USA", required: "required", fee: "Free", deadline: "Annual", notes: "Register with VT Agency of Agriculture, Food and Markets.", url: "https://agriculture.vermont.gov/plant-industry/apiary-program" },
  { id: "VA", name: "Virginia", abbr: "VA", country: "USA", required: "required", fee: "Free", deadline: "Annual", notes: "Register with VA Dept of Agriculture and Consumer Services.", url: "https://www.vdacs.virginia.gov/plant-industry-services-apiary.shtml" },
  { id: "WA", name: "Washington", abbr: "WA", country: "USA", required: "required", fee: "$5–$300", deadline: "Apr 1", notes: "All beekeepers must register annually. Fee based on hive count. Late fees apply.", url: "https://agr.wa.gov/departments/insects-pests-and-weeds/insects/apiary-pollinators/apiary-reg-and-laws" },
  { id: "WV", name: "West Virginia", abbr: "WV", country: "USA", required: "required", fee: "Free", deadline: "Annual", notes: "Register with WV Dept of Agriculture.", url: "https://agriculture.wv.gov/divisions/plant-industries/apiary/" },
  { id: "WI", name: "Wisconsin", abbr: "WI", country: "USA", required: "required", fee: "Free", deadline: "Annual", notes: "Register with WI Dept of Agriculture, Trade and Consumer Protection.", url: "https://datcp.wi.gov/Pages/Programs_Services/ApiaryRegistration.aspx" },
  { id: "WY", name: "Wyoming", abbr: "WY", country: "USA", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Wyoming Dept of Agriculture.", url: "https://agriculture.wy.gov/divisions/ae/apiary" },
  { id: "DC", name: "Washington D.C.", abbr: "DC", country: "USA", required: "required", fee: "Free", deadline: "Annual", notes: "Register with DC Dept of Energy and Environment.", url: "https://doee.dc.gov/service/urban-beekeeping" },
];

const COUNTRY_GROUPS: CountryGroup[] = [
  { id: "canada", label: "Canada", flag: "🇨🇦", description: "All provinces require registration", regions: [
    { id: "CA-AB", name: "Alberta", abbr: "AB", country: "Canada", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Alberta Agriculture and Forestry.", url: "https://www.alberta.ca/apiculture-registration.aspx" },
    { id: "CA-BC", name: "British Columbia", abbr: "BC", country: "Canada", required: "required", fee: "Free", deadline: "Annual", notes: "Register with BC Ministry of Agriculture.", url: "https://www2.gov.bc.ca/gov/content/industry/agriculture-seafood/animals-and-crops/animal-health/bee-health" },
    { id: "CA-MB", name: "Manitoba", abbr: "MB", country: "Canada", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Manitoba Agriculture.", url: "https://www.gov.mb.ca/agriculture/animals/apiculture/index.html" },
    { id: "CA-NB", name: "New Brunswick", abbr: "NB", country: "Canada", required: "required", fee: "Free", deadline: "Annual", notes: "Register with NB Dept of Agriculture.", url: "https://www2.gnb.ca/content/gnb/en/departments/10/agriculture.html" },
    { id: "CA-NS", name: "Nova Scotia", abbr: "NS", country: "Canada", required: "required", fee: "Free", deadline: "Annual", notes: "Register with NS Dept of Agriculture.", url: "https://novascotia.ca/agri/industry-development/bees/" },
    { id: "CA-ON", name: "Ontario", abbr: "ON", country: "Canada", required: "required", fee: "Free", deadline: "Annual", notes: "Register under the Bees Act with Ontario Ministry of Agriculture.", url: "https://www.ontario.ca/page/bees-act" },
    { id: "CA-QC", name: "Quebec", abbr: "QC", country: "Canada", required: "required", fee: "Free", deadline: "Annual", notes: "Register with MAPAQ (Ministère de l'Agriculture).", url: "https://www.mapaq.gouv.qc.ca" },
    { id: "CA-SK", name: "Saskatchewan", abbr: "SK", country: "Canada", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Saskatchewan Agriculture.", url: "https://www.saskatchewan.ca/business/agriculture-natural-resources-and-industry/agribusiness-farmers-and-ranchers/animals-and-livestock/bees" },
  ]},
  { id: "australia", label: "Australia", flag: "🇦🇺", description: "Mandatory in all states & territories", regions: [
    { id: "AU-ACT", name: "Australian Capital Territory", abbr: "ACT", country: "Australia", required: "required", fee: "Free", deadline: "Annual", notes: "Register with ACT Environment, Planning and Sustainable Development.", url: "https://www.accesscanberra.act.gov.au" },
    { id: "AU-NSW", name: "New South Wales", abbr: "NSW", country: "Australia", required: "required", fee: "Free", deadline: "Annual", notes: "Mandatory registration with NSW DPI. All beekeepers must register.", url: "https://www.dpi.nsw.gov.au/animals-and-livestock/bees" },
    { id: "AU-NT", name: "Northern Territory", abbr: "NT", country: "Australia", required: "required", fee: "Free", deadline: "Annual", notes: "Register with NT Dept of Industry, Tourism and Trade.", url: "https://nt.gov.au/industry/agriculture/food-crops-plants-and-quarantine/bees" },
    { id: "AU-QLD", name: "Queensland", abbr: "QLD", country: "Australia", required: "required", fee: "Free", deadline: "Annual", notes: "Mandatory registration with Biosecurity Queensland.", url: "https://www.business.qld.gov.au/industries/farms-fishing-forestry/agriculture/crop-production/bees" },
    { id: "AU-SA", name: "South Australia", abbr: "SA", country: "Australia", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Primary Industries and Regions SA.", url: "https://pir.sa.gov.au/biosecurity/bees" },
    { id: "AU-TAS", name: "Tasmania", abbr: "TAS", country: "Australia", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Biosecurity Tasmania.", url: "https://dpipwe.tas.gov.au/biosecurity-tasmania/animal-biosecurity/bees" },
    { id: "AU-VIC", name: "Victoria", abbr: "VIC", country: "Australia", required: "required", fee: "Free (<5 hives)", deadline: "Annual", notes: "Free for fewer than 5 hives. Register with Agriculture Victoria.", url: "https://agriculture.vic.gov.au/livestock-and-animals/bees" },
    { id: "AU-WA", name: "Western Australia", abbr: "WA", country: "Australia", required: "required", fee: "Free", deadline: "Annual", notes: "Register with WA Dept of Primary Industries and Regional Development.", url: "https://www.agric.wa.gov.au/bees-and-bee-products" },
  ]},
  { id: "uk", label: "United Kingdom", flag: "🇬🇧", description: "Voluntary but strongly recommended", regions: [
    { id: "UK-EW", name: "England & Wales", abbr: "EW", country: "UK", required: "voluntary", fee: "Free", deadline: "None", notes: "Register on BeeBase (National Bee Unit). Free disease inspections and outbreak alerts. Strongly recommended.", url: "https://www.nationalbeeunit.com/register" },
    { id: "UK-NIR", name: "Northern Ireland", abbr: "NIR", country: "UK", required: "voluntary", fee: "Free", deadline: "None", notes: "Register with DAERA Agri-Food and Biosciences Institute.", url: "https://www.daera-ni.gov.uk/topics/animal-and-plant-health/bees" },
    { id: "UK-SCO", name: "Scotland", abbr: "SCO", country: "UK", required: "voluntary", fee: "Free", deadline: "None", notes: "Register on BeeBase. Strongly encouraged for disease monitoring.", url: "https://www.nationalbeeunit.com/register" },
  ]},
  { id: "ireland", label: "Ireland", flag: "🇮🇪", description: "Voluntary registration", regions: [
    { id: "IRL", name: "Ireland (Republic)", abbr: "IRL", country: "Ireland", required: "voluntary", fee: "Free", deadline: "None", notes: "Register with Department of Agriculture. Voluntary but recommended for disease alerts.", url: "https://www.gov.ie/en/service/7c093-apiary-registration/" },
  ]},
  { id: "europe", label: "Europe", flag: "🇪🇺", description: "Most countries require registration", regions: [
    { id: "EU-BE", name: "Belgium", abbr: "BE", country: "Belgium", required: "required", fee: "Free", deadline: "Annual", notes: "Register with SANITEL (Federal Agency for the Safety of the Food Chain).", url: "https://www.favv-afsca.be" },
    { id: "EU-FR", name: "France", abbr: "FR", country: "France", required: "required", fee: "Free", deadline: "Dec 31", notes: "Mandatory annual declaration. Must obtain NAPI beekeeper number. Register online via Télépac.", url: "https://www.telepac.agriculture.gouv.fr" },
    { id: "EU-DE", name: "Germany", abbr: "DE", country: "Germany", required: "required", fee: "Free", deadline: "Annual", notes: "Registration required with local veterinary authority (Veterinäramt). Rules vary by state.", url: "https://www.bienen.de" },
    { id: "EU-IT", name: "Italy", abbr: "IT", country: "Italy", required: "required", fee: "Free", deadline: "Annual", notes: "Register with BDA (Banca Dati Apistica) national database.", url: "https://www.vetinfo.it" },
    { id: "EU-NL", name: "Netherlands", abbr: "NL", country: "Netherlands", required: "voluntary", fee: "Free", deadline: "None", notes: "No legal requirement but registration strongly encouraged.", url: "https://www.bijenhouders.nl" },
    { id: "EU-ES", name: "Spain", abbr: "ES", country: "Spain", required: "required", fee: "Free", deadline: "Annual", notes: "Register with regional agricultural authority. Rules vary by autonomous community.", url: "https://www.mapa.gob.es" },
    { id: "EU-CH", name: "Switzerland", abbr: "CH", country: "Switzerland", required: "required", fee: "Free", deadline: "Annual", notes: "Register with cantonal veterinary office. Rules vary by canton.", url: "https://www.apiservice.ch" },
  ]},
  { id: "nz", label: "New Zealand", flag: "🇳🇿", description: "Mandatory national registration", regions: [
    { id: "NZ", name: "New Zealand", abbr: "NZ", country: "New Zealand", required: "required", fee: "Free", deadline: "Jun 30", notes: "Mandatory registration with AsureQuality under the APINZ system. All beekeepers must register.", url: "https://www.apinz.org.nz" },
  ]},
  { id: "southafrica", label: "South Africa", flag: "🇿🇦", description: "Voluntary registration", regions: [
    { id: "ZA", name: "South Africa", abbr: "ZA", country: "South Africa", required: "voluntary", fee: "Free", deadline: "None", notes: "No national mandatory registration. Contact local Dept of Agriculture.", url: "https://www.dalrrd.gov.za" },
  ]},
  { id: "other", label: "Other / Not Listed", flag: "🌍", description: "Regulations vary by country", regions: [
    { id: "OTH", name: "Other / Not Listed", abbr: "OTH", country: "Other", required: "conditional", fee: "Varies", deadline: "Varies", notes: "Regulations vary widely. Contact your local Department of Agriculture or beekeeping association.", url: "https://www.apimondia.com" },
  ]},
];

const REQUIREMENT_COLORS: Record<RequirementLevel, string> = { required: "#ef4444", voluntary: "#f59e0b", none: "#22c55e", conditional: "#3b82f6" };
const REQUIREMENT_LABELS: Record<RequirementLevel, string> = { required: "Required", voluntary: "Voluntary", none: "Not Required", conditional: "Conditional" };
const REQUIREMENT_EMOJIS: Record<RequirementLevel, string> = { required: "📋", voluntary: "✅", none: "🟢", conditional: "⚠️" };

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

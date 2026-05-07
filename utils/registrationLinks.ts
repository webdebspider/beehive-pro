/**
 * utils/registrationLinks.ts
 *
 * Hive registration requirements and official registration URLs by region.
 *
 * Data is kept in this file so it can be updated without touching the
 * registration screen UI. Long-term, this could be moved to Firestore /
 * Remote Config for over-the-air updates.
 *
 * IMPORTANT: Existing region IDs (e.g. "AL", "CA-AB", "ZA", "OTH") are
 * preserved so Firebase records keyed on regionId stay valid for users
 * who already saved registration info.
 */

export type RequirementLevel = "required" | "voluntary" | "none" | "conditional";

export type RegionData = {
  id: string;
  name: string;
  abbr: string;
  country: string;
  required: RequirementLevel;
  fee: string;
  deadline: string;
  notes: string;
  url: string;
};

export type CountryGroup = {
  id: string;
  label: string;
  flag: string;
  description: string;
  regions: RegionData[];
};

// ── Visual mappings ──────────────────────────────────────────────────────────

export const REQUIREMENT_COLORS: Record<RequirementLevel, string> = {
  required: "#ef4444",
  voluntary: "#f59e0b",
  none: "#22c55e",
  conditional: "#3b82f6",
};

export const REQUIREMENT_LABELS: Record<RequirementLevel, string> = {
  required: "Required",
  voluntary: "Voluntary",
  none: "Not Required",
  conditional: "Conditional",
};

export const REQUIREMENT_EMOJIS: Record<RequirementLevel, string> = {
  required: "📋",
  voluntary: "✅",
  none: "🟢",
  conditional: "⚠️",
};

// ── United States ────────────────────────────────────────────────────────────

export const US_STATES: RegionData[] = [
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

// ── International ────────────────────────────────────────────────────────────

export const COUNTRY_GROUPS: CountryGroup[] = [
  { id: "canada", label: "Canada", flag: "🇨🇦", description: "All provinces require registration", regions: [
    { id: "CA-AB", name: "Alberta", abbr: "AB", country: "Canada", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Alberta Agriculture and Forestry.", url: "https://www.alberta.ca/apiculture-registration.aspx" },
    { id: "CA-BC", name: "British Columbia", abbr: "BC", country: "Canada", required: "required", fee: "Free", deadline: "Annual", notes: "Register with BC Ministry of Agriculture.", url: "https://www2.gov.bc.ca/gov/content/industry/agriculture-seafood/animals-and-crops/animal-health/bee-health" },
    { id: "CA-MB", name: "Manitoba", abbr: "MB", country: "Canada", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Manitoba Agriculture.", url: "https://www.gov.mb.ca/agriculture/animals/apiculture/index.html" },
    { id: "CA-NB", name: "New Brunswick", abbr: "NB", country: "Canada", required: "required", fee: "Free", deadline: "Annual", notes: "Register with NB Dept of Agriculture.", url: "https://www2.gnb.ca/content/gnb/en/departments/10/agriculture.html" },
    { id: "CA-NL", name: "Newfoundland and Labrador", abbr: "NL", country: "Canada", required: "required", fee: "Free", deadline: "Annual", notes: "Register with NL Dept of Fisheries, Forestry and Agriculture. Bee imports strictly controlled to protect mite-free status.", url: "https://www.gov.nl.ca/ffa/agriculture/animal-health/" },
    { id: "CA-NS", name: "Nova Scotia", abbr: "NS", country: "Canada", required: "required", fee: "Free", deadline: "Annual", notes: "Register with NS Dept of Agriculture.", url: "https://novascotia.ca/agri/industry-development/bees/" },
    { id: "CA-ON", name: "Ontario", abbr: "ON", country: "Canada", required: "required", fee: "Free", deadline: "Annual", notes: "Register under the Bees Act with Ontario Ministry of Agriculture.", url: "https://www.ontario.ca/page/bees-act" },
    { id: "CA-PE", name: "Prince Edward Island", abbr: "PE", country: "Canada", required: "required", fee: "Free", deadline: "Annual", notes: "Register with PEI Department of Agriculture and Land.", url: "https://www.princeedwardisland.ca/en/topic/agriculture" },
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
    { id: "EU-AT", name: "Austria", abbr: "AT", country: "Austria", required: "required", fee: "Free", deadline: "Apr 30", notes: "Mandatory annual hive count notification (Stockmeldung) by April 30 with AGES.", url: "https://www.ages.at" },
    { id: "EU-BE", name: "Belgium", abbr: "BE", country: "Belgium", required: "required", fee: "Free", deadline: "Annual", notes: "Register with SANITEL (Federal Agency for the Safety of the Food Chain).", url: "https://www.favv-afsca.be" },
    { id: "EU-CZ", name: "Czech Republic", abbr: "CZ", country: "Czech Republic", required: "required", fee: "Free", deadline: "Sep 1", notes: "Mandatory annual hive count notification with ČMSCH (Czech-Moravian Breeding Corp.).", url: "https://www.cmsch.cz" },
    { id: "EU-DK", name: "Denmark", abbr: "DK", country: "Denmark", required: "required", fee: "Free", deadline: "Annual", notes: "Register apiary location with the Danish Agricultural Agency (Landbrugsstyrelsen).", url: "https://lbst.dk/landbrug/biavl" },
    { id: "EU-FI", name: "Finland", abbr: "FI", country: "Finland", required: "required", fee: "Free", deadline: "Annual", notes: "Register with the Finnish Food Authority (Ruokavirasto).", url: "https://www.ruokavirasto.fi/en/" },
    { id: "EU-FR", name: "France", abbr: "FR", country: "France", required: "required", fee: "Free", deadline: "Dec 31", notes: "Mandatory annual declaration. Must obtain NAPI beekeeper number. Register online via Télépac.", url: "https://www.telepac.agriculture.gouv.fr" },
    { id: "EU-DE", name: "Germany", abbr: "DE", country: "Germany", required: "required", fee: "Free", deadline: "Annual", notes: "Registration required with local veterinary authority (Veterinäramt). Rules vary by state.", url: "https://www.bienen.de" },
    { id: "EU-GR", name: "Greece", abbr: "GR", country: "Greece", required: "required", fee: "Free", deadline: "Annual", notes: "Mandatory beekeeping book (Μελισσοκομικό Βιβλιάριο) with regional Directorate of Agriculture.", url: "https://www.minagric.gr" },
    { id: "EU-HU", name: "Hungary", abbr: "HU", country: "Hungary", required: "required", fee: "Free", deadline: "Annual", notes: "Register with NÉBIH (National Food Chain Safety Office).", url: "https://portal.nebih.gov.hu" },
    { id: "EU-IT", name: "Italy", abbr: "IT", country: "Italy", required: "required", fee: "Free", deadline: "Annual", notes: "Register with BDA (Banca Dati Apistica) national database.", url: "https://www.vetinfo.it" },
    { id: "EU-NL", name: "Netherlands", abbr: "NL", country: "Netherlands", required: "voluntary", fee: "Free", deadline: "None", notes: "No legal requirement but registration strongly encouraged.", url: "https://www.bijenhouders.nl" },
    { id: "EU-NO", name: "Norway", abbr: "NO", country: "Norway", required: "required", fee: "Free", deadline: "Annual", notes: "Mandatory registration with the Norwegian Food Safety Authority (Mattilsynet).", url: "https://www.mattilsynet.no" },
    { id: "EU-PL", name: "Poland", abbr: "PL", country: "Poland", required: "required", fee: "Free", deadline: "Annual", notes: "Register with ARiMR (Agency for Restructuring and Modernisation of Agriculture).", url: "https://www.gov.pl/web/arimr" },
    { id: "EU-PT", name: "Portugal", abbr: "PT", country: "Portugal", required: "required", fee: "Free", deadline: "Annual", notes: "Register with DGAV (Directorate-General for Food and Veterinary).", url: "https://www.dgav.pt" },
    { id: "EU-RO", name: "Romania", abbr: "RO", country: "Romania", required: "required", fee: "Free", deadline: "Annual", notes: "Mandatory registration with ANSVSA (National Sanitary Veterinary Authority).", url: "https://www.ansvsa.ro" },
    { id: "EU-SK", name: "Slovakia", abbr: "SK", country: "Slovakia", required: "required", fee: "Free", deadline: "Sep 1", notes: "Annual hive count notification with ŠVPS (State Veterinary and Food Administration) by September 1.", url: "https://www.svps.sk" },
    { id: "EU-SI", name: "Slovenia", abbr: "SI", country: "Slovenia", required: "required", fee: "Free", deadline: "Annual", notes: "Register with the Administration for Food Safety, Veterinary and Plant Protection (UVHVVR).", url: "https://www.gov.si/en/state-authorities/" },
    { id: "EU-ES", name: "Spain", abbr: "ES", country: "Spain", required: "required", fee: "Free", deadline: "Annual", notes: "Register with regional agricultural authority. Rules vary by autonomous community.", url: "https://www.mapa.gob.es" },
    { id: "EU-SE", name: "Sweden", abbr: "SE", country: "Sweden", required: "required", fee: "Free", deadline: "Annual", notes: "Mandatory registration of apiary location with the Swedish Board of Agriculture (Jordbruksverket).", url: "https://jordbruksverket.se" },
    { id: "EU-CH", name: "Switzerland", abbr: "CH", country: "Switzerland", required: "required", fee: "Free", deadline: "Annual", notes: "Register with cantonal veterinary office. Rules vary by canton.", url: "https://www.apiservice.ch" },
  ]},
  { id: "easteuro", label: "Eastern Europe / Eurasia", flag: "🌐", description: "Major regional beekeeping countries", regions: [
    { id: "RU", name: "Russia", abbr: "RU", country: "Russia", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Federal Service for Veterinary and Phytosanitary Surveillance (Rosselkhoznadzor). Rules vary by region.", url: "https://fsvps.gov.ru" },
    { id: "UA", name: "Ukraine", abbr: "UA", country: "Ukraine", required: "required", fee: "Free", deadline: "Annual", notes: "Register with State Service of Ukraine on Food Safety and Consumer Protection.", url: "https://www.kmu.gov.ua/en" },
  ]},
  { id: "latam", label: "Latin America", flag: "🌎", description: "Major regional beekeeping countries", regions: [
    { id: "AR", name: "Argentina", abbr: "AR", country: "Argentina", required: "required", fee: "Free", deadline: "Annual", notes: "Mandatory RENAPA (National Registry of Beekeeping Producers) with SENASA.", url: "https://www.argentina.gob.ar/senasa/programas-sanitarios/sanidad-apicola" },
    { id: "BR", name: "Brazil", abbr: "BR", country: "Brazil", required: "required", fee: "Varies", deadline: "Annual", notes: "Register with MAPA and state agricultural authorities. Rules vary by state.", url: "https://www.gov.br/agricultura/pt-br" },
    { id: "CL", name: "Chile", abbr: "CL", country: "Chile", required: "required", fee: "Free", deadline: "Annual", notes: "Register apiaries with Servicio Agrícola y Ganadero (SAG).", url: "https://www.sag.gob.cl" },
    { id: "MX", name: "Mexico", abbr: "MX", country: "Mexico", required: "required", fee: "Free", deadline: "Annual", notes: "Register with SENASICA Padrón Ganadero Nacional.", url: "https://www.gob.mx/senasica" },
    { id: "UY", name: "Uruguay", abbr: "UY", country: "Uruguay", required: "required", fee: "Free", deadline: "Annual", notes: "Mandatory registration with DGSG (Ministry of Livestock, Agriculture and Fisheries).", url: "https://www.gub.uy/ministerio-ganaderia-agricultura-pesca" },
  ]},
  { id: "asia", label: "Asia", flag: "🌏", description: "Major regional beekeeping countries", regions: [
    { id: "CN", name: "China", abbr: "CN", country: "China", required: "required", fee: "Varies", deadline: "Annual", notes: "Register with provincial agricultural authorities. Rules vary by province.", url: "http://english.moa.gov.cn" },
    { id: "IN", name: "India", abbr: "IN", country: "India", required: "voluntary", fee: "Free", deadline: "None", notes: "Voluntary registration with NBB (National Bee Board) under NBHM. Encouraged for subsidies and training.", url: "https://nbb.gov.in" },
    { id: "JP", name: "Japan", abbr: "JP", country: "Japan", required: "required", fee: "Free", deadline: "Jan 31", notes: "Mandatory annual registration with prefectural government under the Beekeeping Promotion Act.", url: "https://www.maff.go.jp/e/" },
    { id: "KR", name: "South Korea", abbr: "KR", country: "South Korea", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Ministry of Agriculture, Food and Rural Affairs (MAFRA).", url: "https://www.mafra.go.kr/english/index.do" },
    { id: "TR", name: "Turkey", abbr: "TR", country: "Turkey", required: "required", fee: "Free", deadline: "Annual", notes: "Mandatory registration with Ministry of Agriculture and Forestry. Beekeepers receive a national ID number.", url: "https://www.tarimorman.gov.tr" },
  ]},
  { id: "middleeast", label: "Middle East", flag: "🕌", description: "Regional registration requirements", regions: [
    { id: "EG", name: "Egypt", abbr: "EG", country: "Egypt", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Ministry of Agriculture and Land Reclamation.", url: "https://www.agr-egypt.gov.eg" },
    { id: "IL", name: "Israel", abbr: "IL", country: "Israel", required: "required", fee: "Free", deadline: "Annual", notes: "Register with Ministry of Agriculture. Required for all beekeepers.", url: "https://www.gov.il/en/departments/ministry_of_agriculture" },
  ]},
  { id: "africa", label: "Africa", flag: "🌍", description: "Regional registration varies", regions: [
    { id: "ET", name: "Ethiopia", abbr: "ET", country: "Ethiopia", required: "conditional", fee: "Free", deadline: "Annual", notes: "Required for commercial operations. Contact Ministry of Agriculture for hobbyist guidance.", url: "https://www.moa.gov.et" },
    { id: "KE", name: "Kenya", abbr: "KE", country: "Kenya", required: "voluntary", fee: "Free", deadline: "None", notes: "Voluntary registration with Ministry of Agriculture, Livestock, Fisheries and Cooperatives.", url: "https://www.kilimo.go.ke" },
    { id: "ZA", name: "South Africa", abbr: "ZA", country: "South Africa", required: "voluntary", fee: "Free", deadline: "None", notes: "No national mandatory registration. Contact local Dept of Agriculture or beekeeping association.", url: "https://www.dalrrd.gov.za" },
    { id: "TZ", name: "Tanzania", abbr: "TZ", country: "Tanzania", required: "voluntary", fee: "Free", deadline: "None", notes: "Voluntary registration with Tanzania Forest Services Agency, which oversees beekeeping.", url: "https://www.tfs.go.tz" },
  ]},
  { id: "nz", label: "New Zealand", flag: "🇳🇿", description: "Mandatory national registration", regions: [
    { id: "NZ", name: "New Zealand", abbr: "NZ", country: "New Zealand", required: "required", fee: "Free", deadline: "Jun 30", notes: "Mandatory registration with AsureQuality under the APINZ system. All beekeepers must register.", url: "https://www.apinz.org.nz" },
  ]},
  { id: "other", label: "Other / Not Listed", flag: "🌍", description: "Regulations vary by country", regions: [
    { id: "OTH", name: "Other / Not Listed", abbr: "OTH", country: "Other", required: "conditional", fee: "Varies", deadline: "Varies", notes: "Regulations vary widely. Contact your local Department of Agriculture or beekeeping association. Apimondia (the international beekeeping federation) maintains links to national associations worldwide.", url: "https://www.apimondia.com" },
  ]},
];

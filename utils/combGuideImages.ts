/**
 * utils/combGuideImages.ts
 *
 * Reference image data for the Comb Guide screen (app/hive/comb-guide.tsx).
 *
 * ============================================================================
 * WHY THIS FILE EXISTS (separate from the screen component):
 * ============================================================================
 * Originally, image URLs and captions lived inline inside the FINDINGS array
 * in comb-guide.tsx. As we plan to swap in real beekeeper photos from
 * contributors (Stuckey, U of A apiculture, husband, other community
 * beekeepers), keeping image data separate means:
 *
 *   1. Swap images without touching screen logic (less risk of bugs)
 *   2. Each image can carry its own credit (Wikimedia / contributor / diagram)
 *   3. Multiple images per finding supported (beginners learn better from 2-3)
 *   4. The Photo Credits screen we'll build later can read directly from here
 *      as the single source of truth.
 *
 * Same pattern we used for utils/registrationLinks.ts. Worked well there.
 *
 * ============================================================================
 * CURRENT STATE (2026-05-09, third revision):
 * ============================================================================
 * Six findings (eggs, larvae, honey, pollen, brood, spotty) now display
 * BUNDLED LOCAL PNG DIAGRAMS — clean educational illustrations of each
 * finding's visual signature. These are clearly marked as "Reference
 * Diagram" so users distinguish them from photographs. They will be
 * replaced with real beekeeper photos as contributors come through.
 *
 * Queen cells preserved on its working Wikimedia URL — real photograph,
 * confirmed correct by Mitch. Don't break what's working.
 *
 * ============================================================================
 * IMAGE LOADING NOTES:
 * ============================================================================
 *
 * For LOCAL bundled images (the 6 diagrams below):
 *   src: require("../assets/images/combGuide/<finding>.png")
 *
 * Metro Bundler resolves require() at build time. The path is relative to
 * THIS file (utils/combGuideImages.ts). expo-image renders local image
 * assets natively — no network dependency, no 404 risk, instant load.
 *
 * For REMOTE images (currently only queen cells):
 *   src: "https://commons.wikimedia.org/wiki/Special:FilePath/<filename>?width=400"
 *
 * The `Special:FilePath/` route returns a 302 redirect to the actual image
 * server. Native React Native <Image> chokes on these redirects on Android,
 * but `expo-image` handles them correctly. Screen component uses expo-image.
 *
 * ============================================================================
 * SETUP REQUIRED FOR THIS FILE TO WORK:
 * ============================================================================
 * The 6 PNG diagrams must be placed at these paths (relative to project root):
 *   assets/images/combGuide/eggs.png
 *   assets/images/combGuide/larvae.png
 *   assets/images/combGuide/honey.png
 *   assets/images/combGuide/pollen.png
 *   assets/images/combGuide/brood.png
 *   assets/images/combGuide/spotty.png
 *
 * If `assets/images/combGuide/` doesn't exist yet, create it. Then drop the
 * 6 PNG files in there. Metro will pick them up on next bundle.
 *
 * ============================================================================
 * FUTURE: REAL BEEKEEPER PHOTOS
 * ============================================================================
 * When real photos arrive from contributors:
 *
 *   1. Save photo files to: assets/images/combGuide/<finding>_<contributor>.jpg
 *      Example: assets/images/combGuide/honey_stuckey.jpg
 *
 *   2. Replace the require() path AND update the credit field:
 *      Change:   src: require("../assets/images/combGuide/honey.png")
 *                credit: "Beehive Pro+ Reference Diagram"
 *      To:       src: require("../assets/images/combGuide/honey_stuckey.jpg")
 *                credit: "Photo: Stuckey (Arkansas Beekeepers)"
 *
 *   3. The screen component will display the new image automatically.
 *      No screen-component changes needed.
 *
 * The Photo Credits screen (planned for About/Settings) will iterate through
 * this file to display all unique contributors and what they provided.
 *
 * ============================================================================
 * ATTRIBUTION FOR DIAGRAMS:
 * ============================================================================
 * The 6 PNG diagrams in this file are original illustrations created for
 * Beehive Pro+. They are NOT photographs and NOT third-party content.
 * Free to use, modify, or replace.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * A single reference image with its metadata.
 *
 * NOTE: `src` accepts either a string URL (for remote images) or a number
 * (the require() return value for bundled local images). React Native's
 * Image and expo-image both handle either type transparently.
 */
export type CombGuideImage = {
  src: string | number;             // URL or require() statement for local assets
  caption: string;                  // Educational caption shown under the image
  credit: string;                   // Photo credit (Wikimedia / contributor name / diagram)
  expectedContent?: string;         // FOR DEVS: what this image SHOULD show — verification aid
};

/**
 * Image data for one finding (cell type) in the Comb Guide.
 * Currently we have one image per finding, but the array supports multiple
 * images for future expansion (showing multiple examples per concept).
 */
export type CombGuideImageSet = {
  images: CombGuideImage[];         // Currently 1 image; will grow to 2-3 per finding eventually
};

// ============================================================================
// IMAGE DATA — KEYED BY FINDING ID (matches IDs in comb-guide.tsx FINDINGS array)
// ============================================================================
//
// Each key below corresponds exactly to the `id` field in FINDINGS[].
// IDs are intentionally short and stable so we never have to refactor downstream.
//
// Data is in a Record<string, CombGuideImageSet> for O(1) lookup by ID.

export const COMB_GUIDE_IMAGES: Record<string, CombGuideImageSet> = {

  // --------------------------------------------------------------------------
  // EGGS — tiny white grains standing upright in cells
  // --------------------------------------------------------------------------
  // CURRENT: bundled diagram showing eggs as upright ovals at cell bottoms.
  // FUTURE: replace with real macro photo from Stuckey/contributor.
  eggs: {
    images: [
      {
        // require() path is RELATIVE TO THIS FILE (utils/combGuideImages.ts).
        // From utils/, ../assets navigates up to project root then into assets.
        src: require("../assets/images/combGuide/eggs.png"),
        caption:
          "Honey bee eggs — tiny white rice-grain shapes standing upright at the bottom of cells. " +
          "About 1.5mm long. Easier to spot when you tilt the frame so sunlight angles into the cells.",
        credit: "Beehive Pro+ Reference Diagram",
        expectedContent:
          "Hex-grid diagram with small upright ovals representing eggs at the bottom of each cell.",
      },
    ],
  },

  // --------------------------------------------------------------------------
  // LARVAE — white curled C-shapes floating in royal jelly
  // --------------------------------------------------------------------------
  // CURRENT: bundled diagram showing pearly larva shapes with royal jelly pool.
  // FUTURE: replace with real photo showing different larval growth stages.
  larvae: {
    images: [
      {
        src: require("../assets/images/combGuide/larvae.png"),
        caption:
          "Honey bee larvae — pearly-white C-shaped grubs curled in cell bottoms. " +
          "Healthy larvae glisten with royal jelly. Older/larger larvae fill the cell more.",
        credit: "Beehive Pro+ Reference Diagram",
        expectedContent:
          "Hex-grid diagram showing white larva shapes resting in royal jelly pools at cell bottoms.",
      },
    ],
  },

  // --------------------------------------------------------------------------
  // CAPPED HONEY — smooth flat wax caps over honey storage cells
  // --------------------------------------------------------------------------
  // CURRENT: bundled diagram showing uniform light flat caps.
  // FUTURE: replace with real photo of capped honey frame.
  honey: {
    images: [
      {
        src: require("../assets/images/combGuide/honey.png"),
        caption:
          "Capped honey — smooth, flat, light-colored wax caps sealing honey cells. " +
          "Notice the caps are NOT domed (which would indicate brood, not honey).",
        credit: "Beehive Pro+ Reference Diagram",
        expectedContent:
          "Hex-grid diagram with uniformly light, flat-topped capped cells across the comb.",
      },
    ],
  },

  // --------------------------------------------------------------------------
  // POLLEN — colorful packed cells (yellow, orange, red, etc.)
  // --------------------------------------------------------------------------
  // CURRENT: bundled diagram with multi-colored packed cells.
  // FUTURE: real photo with visible pollen color variety would be even better
  // for teaching — different colors come from different forage plants.
  pollen: {
    images: [
      {
        src: require("../assets/images/combGuide/pollen.png"),
        caption:
          "Stored pollen — colorful packed cells in shades of yellow, orange, red, even green or purple. " +
          "Different colors come from different plants. Cells look full and dense — not empty.",
        credit: "Beehive Pro+ Reference Diagram",
        expectedContent:
          "Hex-grid diagram with cells filled in various pollen colors (yellow/orange/red/brown variety).",
      },
    ],
  },

  // --------------------------------------------------------------------------
  // CAPPED BROOD — slightly domed tan/brown wax caps in solid pattern
  // --------------------------------------------------------------------------
  // CURRENT: bundled diagram showing solid healthy brood pattern.
  // FUTURE: real photo of healthy compact brood frame.
  brood: {
    images: [
      {
        src: require("../assets/images/combGuide/brood.png"),
        caption:
          "Capped (sealed) brood — slightly domed tan or brown wax caps in a solid pattern. " +
          "Healthy pattern: very few skipped cells. Compare with capped honey (flatter, lighter).",
        credit: "Beehive Pro+ Reference Diagram",
        expectedContent:
          "Hex-grid diagram with solid pattern of domed brown caps and very few empty cells.",
      },
    ],
  },

  // --------------------------------------------------------------------------
  // SPOTTY BROOD — patchy/swiss-cheese brood pattern
  // --------------------------------------------------------------------------
  // CURRENT: bundled diagram showing irregular pattern with mix of capped,
  // empty, and dark/sunken cells (the dark cells suggest possible disease).
  // FUTURE: real photo would be ideal for teaching, but spotty brood is rarely
  // photographed except in disease documentation contexts. Consider asking
  // Stuckey or U of A apiculture for a clean teaching example.
  spotty: {
    images: [
      {
        src: require("../assets/images/combGuide/spotty.png"),
        caption:
          "Spotty brood — many random empty cells scattered through what should be solid brood. " +
          "Like swiss cheese. Can indicate queen issues, disease, or chilled brood.",
        credit: "Beehive Pro+ Reference Diagram",
        expectedContent:
          "Hex-grid diagram with patchy/irregular pattern — mix of capped, empty, and darkened cells.",
      },
    ],
  },

  // --------------------------------------------------------------------------
  // QUEEN CELLS — large peanut-shaped cells (REAL PHOTO, CONFIRMED BY MITCH ✅)
  // --------------------------------------------------------------------------
  // ✅ Real photograph from Wikimedia Commons. Mitch confirmed accuracy in
  // beta testing. Don't break what's working — keeping this URL untouched.
  queencells: {
    images: [
      {
        src: "https://commons.wikimedia.org/wiki/Special:FilePath/Capped_emergency_supercedure_queen_cells_of_the_honey_bee.JPG?width=400",
        caption:
          "Capped queen cells — large peanut-shaped cells, much bigger than regular worker cells. " +
          "Hang vertically. May indicate swarming, supersedure, or emergency queen replacement.",
        credit: "Wikimedia Commons (CC BY-SA 3.0)",
        expectedContent:
          "Comb showing one or more large peanut/acorn-shaped capped queen cells.",
      },
    ],
  },

  // --------------------------------------------------------------------------
  // MENTOR — no image needed (this is a "I'm not sure" flag, not a cell type)
  // --------------------------------------------------------------------------
  // The 'mentor' finding represents the user marking their inspection for review
  // by an experienced beekeeper. There's nothing visual to teach here.
  // We define an empty image array so the screen component code path is uniform.
  mentor: {
    images: [],
  },
};

// ============================================================================
// HELPER FUNCTIONS — used by the screen component
// ============================================================================

/**
 * Get the primary (first) image for a finding ID.
 * Returns null if no images defined (e.g., 'mentor' finding).
 *
 * Most use cases want just one image. When we expand to multiple images
 * per finding, the screen component will iterate over images[] directly.
 */
export function getPrimaryImage(findingId: string): CombGuideImage | null {
  const set = COMB_GUIDE_IMAGES[findingId];
  if (!set || set.images.length === 0) return null;
  return set.images[0];
}

/**
 * Get all images for a finding (for future use when we have multiple per finding).
 * Returns empty array if findingId not recognized.
 */
export function getAllImages(findingId: string): CombGuideImage[] {
  return COMB_GUIDE_IMAGES[findingId]?.images ?? [];
}

/**
 * Get a list of unique photo contributors across all findings.
 * Useful for the Photo Credits screen we plan to build later.
 *
 * Returns sorted, deduplicated list of credit strings.
 */
export function getUniqueContributors(): string[] {
  const credits = new Set<string>();
  Object.values(COMB_GUIDE_IMAGES).forEach((set) => {
    set.images.forEach((img) => credits.add(img.credit));
  });
  return Array.from(credits).sort();
}

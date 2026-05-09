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
 * contributors (Mitch, Nadine, Stuckey, etc.), keeping image data separate
 * means:
 *
 *   1. We can swap images without touching screen logic (less risk of bugs)
 *   2. Each image can carry its own credit (Wikimedia vs. real beekeeper)
 *   3. We can add MULTIPLE images per finding when we have them
 *      (beginners learn better from 2-3 examples per concept)
 *   4. The Photo Credits screen we'll build later can read directly from here
 *      as the single source of truth.
 *
 * Same pattern we used for utils/registrationLinks.ts. Worked well there.
 *
 * ============================================================================
 * CURRENT STATE (2026-05-08, post-build cbdda56):
 * ============================================================================
 * Mitch (beta tester) reported that 6 of 7 reference images don't match their
 * labels. Replacement Wikimedia URLs were attempted but ALL 6 returned 404
 * (confirmed via adb logcat: ExpoImage HttpException status 404, six times).
 *
 * Root cause: short generic filenames (`Bee_eggs.jpg`, `Honey_bee_larvae.jpg`,
 * etc.) almost never match real Commons uploads. Real Commons filenames are
 * long and descriptive — like the working queencells URL:
 *   `Capped_emergency_supercedure_queen_cells_of_the_honey_bee.JPG`
 *
 * INTERIM FIX (this file): the 6 broken-URL findings now use empty `images: []`
 * arrays, matching the pattern already used by the 'mentor' finding. The screen
 * component handles this case (since 'mentor' works), so nothing breaks.
 * Captions and expectedContent are preserved as comments below each empty
 * array — drop them back in once verified images are sourced.
 *
 * ============================================================================
 * PATH FORWARD (priority order):
 * ============================================================================
 * 1. PREFERRED: Real beekeeper photos from contributors. Per the migration
 *    notes below, save photos to assets/images/combGuide/<finding>_<contrib>.jpg
 *    and replace the empty array with a require() statement.
 *
 * 2. STOPGAP: Curated, verified Wikimedia/CC0 images sourced manually via
 *    browser (NOT by guessing filenames). Find file on commons.wikimedia.org,
 *    confirm it loads, copy the EXACT filename including capitalization and
 *    extension, paste into the URL template below.
 *
 * 3. AI-GENERATED placeholder reference images (last resort, requires
 *    transparent labeling so testers don't mistake them for real photographs).
 *
 * ============================================================================
 * IMAGE LOADING NOTE (Android compatibility) — KEEP FOR REFERENCE:
 * ============================================================================
 * URLs use the format:
 *   https://commons.wikimedia.org/wiki/Special:FilePath/<FILENAME>?width=400
 *
 * The `Special:FilePath/` route returns a 302 redirect to the actual image
 * server. Native React Native <Image> chokes on these redirects on Android,
 * but `expo-image` handles them correctly. Screen component uses expo-image.
 *
 * ============================================================================
 * FUTURE: REAL BEEKEEPER PHOTOS
 * ============================================================================
 * When real photos arrive from contributors (Mitch, Nadine, Stuckey, etc.):
 *
 *   1. Save photo files to: assets/images/combGuide/<finding>_<contributor>.jpg
 *      Example: assets/images/combGuide/cappedHoney_mitch.jpg
 *
 *   2. Replace the empty `images: []` with a populated array:
 *      images: [
 *        {
 *          src: require("../assets/images/combGuide/cappedHoney_mitch.jpg"),
 *          caption: "...",
 *          credit: "Photo: Mitch Allison",
 *          expectedContent: "...",
 *        },
 *      ]
 *
 *   3. The screen component will display the new image automatically.
 *      No screen-component changes needed.
 *
 * The Photo Credits screen (planned for About/Settings) will iterate through
 * this file to display all unique contributors and what they provided.
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
  credit: string;                   // Photo credit (Wikimedia / contributor name)
  expectedContent?: string;         // FOR DEVS: what this image SHOULD show — used for verification
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
  // What we want: extreme close-up of empty-looking cells with white rice-grain
  // shapes standing at the bottom. Hardest finding to photograph well because
  // eggs are only ~1.5mm long.
  //
  // STATUS (2026-05-08): no working image. Previous URL `Bee_eggs.jpg` 404s.
  // Empty array until real photo or verified URL is sourced.
  //
  // CAPTION READY TO WIRE BACK UP WHEN IMAGE ARRIVES:
  //   "Honey bee eggs — tiny white rice-grain shapes standing upright at the
  //   bottom of cells. About 1.5mm long. Easier to spot when you tilt the
  //   frame so sunlight angles into the cells."
  //
  // EXPECTED CONTENT FOR VERIFICATION:
  //   "Close-up of comb cells with visible white egg-like grains in the
  //   bottom of the cells."
  eggs: {
    images: [],
    // TODO: source verified image (real beekeeper photo preferred)
  },

  // --------------------------------------------------------------------------
  // LARVAE — white curled C-shapes floating in royal jelly
  // --------------------------------------------------------------------------
  // What we want: close-up showing pearly-white grub larvae curled in cell
  // bottoms, ideally with visible royal jelly. Different developmental stages
  // welcome.
  //
  // STATUS (2026-05-08): no working image. Previous URL `Honey_bee_larvae.jpg`
  // 404s. Empty array until real photo or verified URL is sourced.
  //
  // CAPTION READY TO WIRE BACK UP WHEN IMAGE ARRIVES:
  //   "Honey bee larvae — pearly-white C-shaped grubs curled in cell bottoms.
  //   Healthy larvae glisten with royal jelly. Older/larger larvae fill the
  //   cell more."
  //
  // EXPECTED CONTENT FOR VERIFICATION:
  //   "Close-up of cells containing white C-shaped larvae, ideally with
  //   visible royal jelly."
  larvae: {
    images: [],
    // TODO: source verified image (real beekeeper photo preferred)
  },

  // --------------------------------------------------------------------------
  // CAPPED HONEY — smooth flat wax caps over honey storage cells
  // --------------------------------------------------------------------------
  // What we want: close-up of capped honey area showing flat, light-colored
  // caps. Should look distinctly different from capped brood (which is
  // darker/domed).
  //
  // STATUS (2026-05-08): no working image. Previous URL `Capped_honey_cells.jpg`
  // 404s. Empty array until real photo or verified URL is sourced.
  //
  // CAPTION READY TO WIRE BACK UP WHEN IMAGE ARRIVES:
  //   "Capped honey — smooth, flat, light-colored wax caps sealing honey cells.
  //   Notice the caps are NOT domed (which would indicate brood, not honey)."
  //
  // EXPECTED CONTENT FOR VERIFICATION:
  //   "Comb section with smooth flat white/tan caps — no bees obscuring view,
  //   no brood pattern visible."
  honey: {
    images: [],
    // TODO: source verified image (real beekeeper photo preferred)
  },

  // --------------------------------------------------------------------------
  // POLLEN — colorful packed cells (yellow, orange, red, etc.)
  // --------------------------------------------------------------------------
  // What we want: close-up of comb cells PACKED with colorful pollen — visible
  // grains/texture, multiple colors typical when colony is foraging on diverse
  // plants.
  //
  // STATUS (2026-05-08): no working image. Previous URL `Pollen_in_honeycomb.jpg`
  // 404s. Empty array until real photo or verified URL is sourced.
  // (Mitch's earlier flag was particularly important here — the original URL
  // showed a bee on a flower, which is the OPPOSITE of what we want to teach.)
  //
  // CAPTION READY TO WIRE BACK UP WHEN IMAGE ARRIVES:
  //   "Stored pollen — colorful packed cells in shades of yellow, orange, red,
  //   even green or purple. Different colors come from different plants. Cells
  //   look full and dense — not empty."
  //
  // EXPECTED CONTENT FOR VERIFICATION:
  //   "Close-up of comb cells packed with multi-colored pollen powder.
  //   NOT a bee on a flower."
  pollen: {
    images: [],
    // TODO: source verified image (real beekeeper photo preferred)
  },

  // --------------------------------------------------------------------------
  // CAPPED BROOD — slightly domed tan/brown wax caps in solid pattern
  // --------------------------------------------------------------------------
  // What we want: close-up of healthy brood pattern — solid sheet of slightly
  // domed caps, mostly uniform color. Should look DIFFERENT from capped honey
  // (those are flatter and lighter).
  //
  // STATUS (2026-05-08): no working image. Previous URL `Sealed_brood.jpg` 404s.
  // Empty array until real photo or verified URL is sourced.
  //
  // CAPTION READY TO WIRE BACK UP WHEN IMAGE ARRIVES:
  //   "Capped (sealed) brood — slightly domed tan or brown wax caps in a solid
  //   pattern. Healthy pattern: very few skipped cells. Compare with capped
  //   honey (flatter, lighter)."
  //
  // EXPECTED CONTENT FOR VERIFICATION:
  //   "Close-up of a healthy brood pattern with mostly-filled, slightly-domed
  //   darker caps."
  brood: {
    images: [],
    // TODO: source verified image (real beekeeper photo preferred)
  },

  // --------------------------------------------------------------------------
  // SPOTTY BROOD — patchy/swiss-cheese brood pattern
  // --------------------------------------------------------------------------
  // What we want: brood pattern with many empty cells scattered throughout —
  // contrast with healthy compact pattern. Indicates queen issues, disease, or
  // other colony problems.
  //
  // STATUS (2026-05-08): no working image. Previous URL `Spotty_brood_pattern.jpg`
  // 404s. Empty array until real photo or verified URL is sourced.
  //
  // NOTE: this is the hardest one to find a perfect image for — most photos
  // online show HEALTHY brood. Spotty patterns are usually only photographed to
  // document disease (AFB, EFB, etc.), which adds confounding context. May be
  // best sourced from a real beekeeper (Stuckey could likely contribute one
  // from Arkansas Beekeepers archives if asked).
  //
  // CAPTION READY TO WIRE BACK UP WHEN IMAGE ARRIVES:
  //   "Spotty brood — many random empty cells scattered through what should be
  //   solid brood. Like swiss cheese. Can indicate queen issues, disease, or
  //   chilled brood."
  //
  // EXPECTED CONTENT FOR VERIFICATION:
  //   "Brood pattern with many gaps — clearly distinct from a healthy compact
  //   pattern."
  spotty: {
    images: [],
    // TODO: source verified image (real beekeeper photo strongly preferred — see note)
  },

  // --------------------------------------------------------------------------
  // QUEEN CELLS — large peanut-shaped cells (CONFIRMED CORRECT BY MITCH ✅)
  // --------------------------------------------------------------------------
  // ✅ This is the ONE image Mitch confirmed is correctly matched.
  // Keeping the existing URL untouched. Note the long, descriptive filename —
  // this is exactly the pattern of real Commons uploads, and exactly why
  // this URL works while the short-name guesses didn't.
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
 * Returns null if no images defined (e.g., 'mentor' finding, or any finding
 * whose images array is currently empty pending verification).
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

/**
 * Get a list of finding IDs that currently have NO image wired up.
 * Useful for a dev-only "what's pending" indicator, or for the Photo Credits
 * screen to show "X findings still need reference images."
 *
 * Filters out 'mentor' since it intentionally has no image (not pending).
 */
export function getFindingsAwaitingImages(): string[] {
  return Object.entries(COMB_GUIDE_IMAGES)
    .filter(([id, set]) => id !== "mentor" && set.images.length === 0)
    .map(([id]) => id);
}
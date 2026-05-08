/**
 * app/hive/comb-guide.tsx
 *
 * Comb Guide Screen — multi-select field guide with beginner learning sections.
 *
 * ============================================================================
 * REFACTOR NOTES (2026-05-08):
 * ============================================================================
 * Image data (referenceImage URLs and imageCaptions) was extracted to a
 * separate file: utils/combGuideImages.ts
 *
 * WHY: Mitch (beta tester) reported 6 of 7 reference images don't match their
 * labels. To fix this AND prepare for future real beekeeper photos, we
 * extracted image data so it can be swapped without touching screen logic.
 *
 * Same pattern as utils/registrationLinks.ts. Worked well there.
 *
 * Per-finding image data now lives in COMB_GUIDE_IMAGES keyed by finding id.
 * Each finding's id below MUST match a key in COMB_GUIDE_IMAGES exactly,
 * or the image won't load.
 *
 * ============================================================================
 * ROUTE FIX (2026-05-08, later in the day):
 * ============================================================================
 * Submit-back navigation was pointing at "/hive/inspection" — a path that
 * doesn't exist as a route file in the app. TypeScript's typed routes
 * surfaced this as an error after the image-data refactor triggered a
 * project re-analysis (the error was always there; just hidden until TS
 * re-checked the file). Fixed to "/hive/inspection/add", which is the
 * actual route file that handles both new inspections (no inspectionId)
 * and continued ones (with inspectionId param). See handleSubmit() below.
 *
 * Pre-fix runtime behavior: navigation likely silently failed or fell
 * through to a 404. Submit button effectively didn't work correctly.
 * This fix restores the intended flow.
 *
 * ============================================================================
 * BEGINNER MODE FEATURES:
 * ============================================================================
 *  - Cards pulse/glow with amber animation
 *  - Cards auto-expand as user scrolls to them
 *  - "Learning mode on" badge shown at top
 *  - Reference images shown in expanded learn section
 *
 * ============================================================================
 * PRO/MINIMAL MODE:
 * ============================================================================
 *  - No pulse, no auto-expand
 *  - Plain tap-to-expand behavior
 *
 * ============================================================================
 * ANDROID FIX:
 * ============================================================================
 * Uses expo-image instead of RN Image — handles 302 redirects from
 * commons.wikimedia.org/wiki/Special:FilePath/ correctly on Android.
 * (Native RN Image fails on these redirects.)
 */

import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NavBar from "../../components/NavBar";
import { useSettingsContext } from "../../context/SettingsContext";
import { useAppTheme } from "../../hooks/useAppTheme";

// NEW IMPORT: image data from extracted utility file
// All image URLs, captions, and credits now sourced from here.
import { getPrimaryImage } from "../../utils/combGuideImages";

// ============================================================================
// TYPES
// ============================================================================
//
// NOTE: The Finding type no longer carries image fields — those moved to
// combGuideImages.ts. The screen looks up images by finding.id at render time.
// This keeps the FINDINGS array focused on educational content only.

type Finding = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  combFinding: string;
  queen?: string;
  brood?: string;
  notes?: string;
  whatToLookFor: string;
  whereToLook: string;
  commonMistake?: string;
};

// ============================================================================
// FINDINGS DATA
// ============================================================================
//
// IMPORTANT: each finding's `id` must match a key in COMB_GUIDE_IMAGES.
// If you add a new finding here, also add a matching entry in
// utils/combGuideImages.ts — otherwise the photo won't display.

const FINDINGS: Finding[] = [
  {
    id: "eggs",
    emoji: "🥚",
    title: "Eggs",
    description:
      "Tiny white grains standing upright in cells. Means the queen has been laying recently.",
    combFinding: "Eggs seen",
    queen: "eggs",
    whatToLookFor:
      "Look for tiny white rice-grain shapes standing straight up in the bottom of empty-looking cells. They are about 1.5mm long — very small! Tilt the frame so sunlight shines across the cells at an angle. Fresh eggs (1 day old) stand perfectly upright. Older eggs (2-3 days) lean to the side.",
    whereToLook:
      "Look in the center of the brood area, in cells that appear empty at first glance. The egg is easier to see against a dark cell background. Young bees and freshly drawn comb make it harder to spot them.",
    commonMistake:
      "Many beginners mistake pollen or debris for eggs. Eggs are perfectly uniform white grains, always one per cell, always at the very bottom.",
  },
  {
    id: "larvae",
    emoji: "🐛",
    title: "Larvae",
    description:
      "White curled C-shapes at the bottom of cells. Larvae are young developing bees.",
    combFinding: "Larvae seen",
    brood: "strong",
    whatToLookFor:
      "Look for shiny, pearly-white grubs curled in a C-shape at the bottom of cells. They should be floating in a small pool of milky royal jelly. Healthy larvae are bright white and glistening — never brown or dried out.",
    whereToLook:
      "Larvae are found in the central brood area, usually surrounded by capped brood on the outside and eggs closer to the center.",
    commonMistake:
      "Discolored or twisted larvae are a warning sign. Healthy larvae should always look wet and white, never dry, brown, or melted-looking.",
  },
  {
    id: "honey",
    emoji: "🍯",
    title: "Capped Honey",
    description:
      "Smooth light wax caps over honey cells. Shows stored honey.",
    combFinding: "Capped honey seen",
    whatToLookFor:
      "Look for cells capped with a slightly raised, smooth white or tan wax cap. Hold the frame flat — ripe capped honey won't drip out.",
    whereToLook:
      "Honey is stored above and around the brood nest, especially in the top corners of the frame.",
    commonMistake:
      "Honey caps look similar to brood caps but are flatter and lighter colored. Brood caps are slightly domed and darker tan/brown.",
  },
  {
    id: "pollen",
    emoji: "🌼",
    title: "Pollen",
    description:
      "Colorful packed cells — yellow, orange, or red. Food for brood.",
    combFinding: "Pollen stores seen",
    whatToLookFor:
      "Look for cells packed with colorful powder — yellow, orange, red, green, or even purple. Pollen is packed tightly and has a rough, grainy texture.",
    whereToLook:
      "Pollen is stored in a ring around the brood area, between the brood and the honey.",
    commonMistake:
      "Don't confuse packed pollen with empty cells. Pollen cells look full and solid with color.",
  },
  {
    id: "brood",
    emoji: "🟫",
    title: "Capped Brood",
    description:
      "Darker capped cells in a solid pattern. Good pattern means healthy development.",
    combFinding: "Capped brood seen",
    brood: "strong",
    whatToLookFor:
      "Look for cells with slightly domed tan or brown wax caps. A healthy brood pattern is solid and compact — like a full sheet of caps with very few gaps.",
    whereToLook:
      "Capped brood fills the center of the frame in a roughly oval pattern.",
    commonMistake:
      "A few scattered empty cells in the brood pattern is normal. But if more than 1 in 10 cells are skipped, that may indicate a health issue.",
  },
  {
    id: "spotty",
    emoji: "⚠️",
    title: "Spotty Brood",
    description:
      "Patchy pattern with skipped cells. Watch queen health and colony condition.",
    combFinding: "Spotty brood seen",
    brood: "spotty",
    whatToLookFor:
      "Look for a brood pattern that has many random empty cells scattered throughout — like swiss cheese. Some caps may look sunken in or discolored.",
    whereToLook:
      "Compare the center of the brood frame to what you'd expect. A sparse or patchy pattern is the key sign.",
    commonMistake:
      "A brand new queen just starting to lay will have a spotty pattern that fills in — this is normal. Spotty brood in an established colony is more concerning.",
  },
  {
    id: "queencells",
    emoji: "👑",
    title: "Queen Cells",
    description:
      "Larger peanut-shaped cells. May indicate swarming, supersedure, or queen replacement.",
    combFinding: "Queen cells seen",
    queen: "cells",
    whatToLookFor:
      "Look for large peanut or acorn-shaped cells that hang vertically. They are much larger than regular cells — about 2-3cm long.",
    whereToLook:
      "Swarm cells are usually found on the bottom edges of frames. Supersedure cells are usually found in the middle of the frame face.",
    commonMistake:
      "Play cups (empty queen cups) are very common and do NOT mean the colony is about to swarm. Only cells containing an egg or larva are cause for action.",
  },
  {
    id: "mentor",
    emoji: "❓",
    title: "Unsure / Need Mentor",
    description:
      "Use this when you're not confident what you're seeing. Marks the report for review.",
    combFinding: "Marked for mentor review",
    notes: "Mentor review requested",
    whatToLookFor:
      "Anything you're unsure about! It's perfectly fine to mark observations for an experienced beekeeper to review. Take photos if you can.",
    whereToLook:
      "Mark this whenever you have any doubt about what you're seeing. There are no wrong observations — only ones we want a second opinion on.",
    commonMistake:
      "Beginners often hesitate to mark observations as 'unsure' for fear of looking inexperienced. Don't! Marking observations for review is exactly how you learn.",
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function CombGuideScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ hiveId?: string; inspectionId?: string }>();
  const theme = useAppTheme();
  const { settings } = useSettingsContext();
  const isBeginner = settings?.uiMode === "beginner";

  // Track which findings the user has selected (multi-select)
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Track which findings have their "What am I looking at?" section expanded
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Track which findings have their reference photo currently visible
  // Separate from `expanded` so user can keep guide open while hiding the photo
  const [showImage, setShowImage] = useState<Set<string>>(new Set());

  // Pulse animation refs (one per finding card) — used in beginner mode only
  const pulseRefs = useRef<Record<string, Animated.Value>>({});

  // Initialize pulse animation values for each finding once (avoids re-creating
  // them on every render, which would cause animation glitches)
  FINDINGS.forEach((f) => {
    if (!pulseRefs.current[f.id]) {
      pulseRefs.current[f.id] = new Animated.Value(1);
    }
  });

  // Track which finding card is currently "active" (in view as user scrolls)
  // Used to drive the auto-expand behavior in beginner mode
  const [activeId, setActiveId] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // PULSE ANIMATION (beginner mode)
  // --------------------------------------------------------------------------
  // When a card becomes active (user scrolls to it), gently pulse it.
  // This draws a beginner's attention to the next thing to look at.
  useEffect(() => {
    if (!isBeginner || !activeId) return;
    const anim = pulseRefs.current[activeId];
    if (!anim) return;

    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1.03, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    // Cleanup: stop animation when active card changes
    return () => {
      anim.stopAnimation();
      anim.setValue(1);
    };
  }, [activeId, isBeginner]);

  // --------------------------------------------------------------------------
  // SCROLL HANDLER (beginner mode auto-expand)
  // --------------------------------------------------------------------------
  // Detects which finding card is roughly in the center of the visible viewport
  // and marks it active. Active cards get auto-expanded in beginner mode.
  // NOTE: simplified offset-based heuristic — works because cards have similar
  // height. If card heights diverge significantly, swap to onLayout-based tracking.
  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (!isBeginner) return;
    const offsetY = e.nativeEvent.contentOffset.y;
    const cardApproxHeight = 220; // rough average; safe for current card content
    const idx = Math.floor(offsetY / cardApproxHeight);
    const finding = FINDINGS[idx];
    if (finding && finding.id !== activeId) {
      setActiveId(finding.id);
      // Auto-expand the active card in beginner mode (subject to existing expanded state)
      setExpanded((prev) => {
        const next = new Set(prev);
        next.add(finding.id);
        return next;
      });
    }
  }

  // --------------------------------------------------------------------------
  // STATE TOGGLE HELPERS
  // --------------------------------------------------------------------------

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleImage(id: string) {
    setShowImage((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelections() {
    setSelected(new Set());
  }

  // --------------------------------------------------------------------------
  // SUBMIT — pass selected findings back to inspection screen
  // --------------------------------------------------------------------------
  function handleSubmit() {
    if (selected.size === 0) return;

    // Build a payload with the selected findings' details (combFinding, queen, brood, notes)
    // The inspection screen will merge these into the current inspection record.
    const selectedFindings = FINDINGS.filter((f) => selected.has(f.id));
    const payload = {
      combFindings: selectedFindings.map((f) => f.combFinding),
      queenStates: selectedFindings.map((f) => f.queen).filter(Boolean),
      broodStates: selectedFindings.map((f) => f.brood).filter(Boolean),
      notes: selectedFindings.map((f) => f.notes).filter(Boolean),
    };

    // Navigate back to inspection screen with the payload.
    // hiveId and inspectionId pass through unchanged.
    //
    // ROUTE FIX (2026-05-08): destination is "/hive/inspection/add", not
    // "/hive/inspection". The /add screen handles both new inspections
    // (no inspectionId) and continued/edited ones (with inspectionId param).
    // TypeScript's typed routes flagged the previous "/hive/inspection" as
    // invalid — that path doesn't exist as a route file in the app.
    // See file header for full notes.
    router.replace({
      pathname: "/hive/inspection/add",
      params: {
        hiveId: params.hiveId,
        inspectionId: params.inspectionId,
        combFindingsJson: JSON.stringify(payload),
      },
    });
  }

  // --------------------------------------------------------------------------
  // STYLES
  // --------------------------------------------------------------------------
  const S = makeStyles(theme);

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------
  return (
    <SafeAreaView style={S.page}>
      <NavBar title="What am I seeing?" showBack showHome />

      <ScrollView
        contentContainerStyle={S.content}
        onScroll={handleScroll}
        scrollEventThrottle={100}
      >
        <Text style={S.title}>What am I seeing?</Text>
        <Text style={S.subtitle}>
          Tap any finding that matches what you see in your hive.
          You can select more than one. Tap "What am I looking at?" for help.
        </Text>

        {isBeginner && (
          <View style={S.learningBadge}>
            <Text style={S.learningBadgeText}>🎓 LEARNING MODE ON</Text>
          </View>
        )}

        {selected.size > 0 && (
          <View style={S.selectionBanner}>
            <Text style={S.selectionText}>
              {selected.size} finding{selected.size === 1 ? "" : "s"} selected
            </Text>
            <Pressable onPress={clearSelections} style={S.clearButton}>
              <Text style={S.clearText}>Clear</Text>
            </Pressable>
          </View>
        )}

        {FINDINGS.map((finding) => {
          const isSelected = selected.has(finding.id);
          const isExpanded = expanded.has(finding.id);
          const isImageShown = showImage.has(finding.id);
          const isActive = activeId === finding.id;

          // LOOK UP THE IMAGE for this finding from the extracted image data file.
          // Returns null for findings without images (e.g., 'mentor' finding).
          const image = getPrimaryImage(finding.id);

          // Animated scale for pulse effect (beginner mode only)
          const pulseScale = pulseRefs.current[finding.id] ?? new Animated.Value(1);

          return (
            <Animated.View
              key={finding.id}
              style={[
                S.cardWrapper,
                isBeginner && isActive && { transform: [{ scale: pulseScale }] },
              ]}
            >
              <View
                style={[
                  S.card,
                  isSelected && S.cardSelected,
                  isBeginner && isActive && S.cardActive,
                ]}
              >
                <Pressable
                  onPress={() => toggleSelected(finding.id)}
                  style={S.cardHeader}
                >
                  <Text style={S.cardEmoji}>{finding.emoji}</Text>
                  <Text
                    style={[
                      S.cardTitle,
                      isSelected && S.cardTitleSelected,
                    ]}
                  >
                    {finding.title}
                  </Text>
                  {isSelected && (
                    <View style={S.checkBadge}>
                      <Text style={S.checkText}>✓</Text>
                    </View>
                  )}
                </Pressable>

                <Text style={S.cardText}>{finding.description}</Text>
                {!isExpanded && <Text style={S.tapHint}>Tap below to learn more</Text>}

                <View style={S.divider} />

                <Pressable onPress={() => toggleExpanded(finding.id)} style={S.learnButton}>
                  <Text style={S.learnButtonText}>
                    {isExpanded ? "▼ Hide guide" : "👁 What am I looking at?"}
                  </Text>
                  {isBeginner && !isExpanded && (
                    <View style={S.learnHintBadge}>
                      <Text style={S.learnHintText}>Tap or scroll</Text>
                    </View>
                  )}
                </Pressable>

                {isExpanded && (
                  <View style={S.learnContent}>

                    {/* Image toggle button — only show if this finding has an image */}
                    {image && (
                      <Pressable
                        onPress={() => toggleImage(finding.id)}
                        style={S.imageToggleButton}
                      >
                        <Text style={S.imageToggleText}>
                          {isImageShown ? "🙈 Hide reference photo" : "📸 See example photo"}
                        </Text>
                      </Pressable>
                    )}

                    {/* Reference image + caption + credit */}
                    {/*
                      NOTE: image data now sourced from utils/combGuideImages.ts
                      via the getPrimaryImage() helper. To swap an image, edit that file —
                      no changes needed here.
                    */}
                    {isImageShown && image && (
                      <View style={S.imageContainer}>
                        <Image
                          source={image.src}
                          style={S.referenceImage}
                          contentFit="cover"
                          transition={300}
                        />
                        <Text style={S.imageCaption}>{image.caption}</Text>
                        <Text style={S.imageCredit}>📷 {image.credit}</Text>
                      </View>
                    )}

                    <View style={S.learnSection}>
                      <Text style={S.learnSectionTitle}>🔎 What to look for</Text>
                      <Text style={S.learnSectionText}>{finding.whatToLookFor}</Text>
                    </View>

                    <View style={S.learnSection}>
                      <Text style={S.learnSectionTitle}>📍 Where to look</Text>
                      <Text style={S.learnSectionText}>{finding.whereToLook}</Text>
                    </View>

                    {finding.commonMistake && (
                      <View style={[S.learnSection, S.mistakeSection]}>
                        <Text style={S.learnSectionTitle}>⚠️ Common mistake</Text>
                        <Text style={S.learnSectionText}>{finding.commonMistake}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </Animated.View>
          );
        })}

        <Pressable
          onPress={handleSubmit}
          disabled={selected.size === 0}
          style={[S.submitButton, selected.size === 0 && S.disabledButton]}
        >
          <Text style={[S.submitText, selected.size === 0 && S.disabledText]}>
            {selected.size === 0
              ? "Select findings above"
              : `Add ${selected.size} Finding${selected.size === 1 ? "" : "s"} to Inspection →`}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================
//
// Unchanged from previous version — all styling preserved exactly.

function makeStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: theme.bg },
    content: { padding: theme.spaceMD, paddingBottom: 50 },
    title: { color: theme.textPrimary, fontSize: theme.fontLG, fontWeight: "900", marginBottom: 4 },
    subtitle: { color: theme.textMuted, fontSize: theme.fontSM, marginBottom: theme.spaceMD, lineHeight: 20 },
    learningBadge: { backgroundColor: theme.bgCardAlt, borderWidth: 1, borderColor: theme.honey, padding: theme.spaceSM, borderRadius: theme.radiusMD, marginBottom: theme.spaceMD, alignItems: "center" },
    learningBadgeText: { color: theme.honey, fontWeight: "800", fontSize: theme.fontXS },
    selectionBanner: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: theme.bgCardAlt, borderWidth: 1, borderColor: theme.honey, padding: theme.spaceMD, borderRadius: theme.radiusMD, marginBottom: theme.spaceMD },
    selectionText: { color: theme.honey, fontWeight: "800", fontSize: theme.fontSM },
    clearButton: { backgroundColor: theme.bgCard, paddingVertical: 6, paddingHorizontal: 12, borderRadius: theme.radiusSM, borderWidth: 1, borderColor: theme.border },
    clearText: { color: theme.textSecondary, fontSize: theme.fontXS, fontWeight: "700" },
    cardWrapper: {
      marginBottom: 12,
      borderRadius: theme.radiusLG,
      ...(Platform.OS !== "web"
        ? { shadowColor: theme.honey, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 6 }
        : {}),
    },
    card: { backgroundColor: theme.bgCard, borderRadius: theme.radiusLG, borderWidth: 2, borderColor: theme.border, overflow: "hidden" },
    cardSelected: { borderColor: theme.honey, backgroundColor: theme.bgCardAlt },
    cardActive: { borderColor: theme.honeyLight, borderWidth: 2 },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: theme.spaceMD, paddingBottom: 8 },
    cardEmoji: { fontSize: 28 },
    cardTitle: { flex: 1, color: theme.honey, fontSize: theme.fontMD, fontWeight: "900" },
    cardTitleSelected: { color: theme.honeyLight },
    checkBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.honey, justifyContent: "center", alignItems: "center" },
    checkText: { color: theme.bg, fontWeight: "900", fontSize: theme.fontSM },
    cardText: { color: theme.textSecondary, fontSize: theme.fontSM, lineHeight: 20, paddingHorizontal: theme.spaceMD },
    tapHint: { color: theme.textMuted, fontSize: theme.fontXS, fontWeight: "700", paddingHorizontal: theme.spaceMD, paddingBottom: theme.spaceMD, marginTop: 8 },
    divider: { height: 1, backgroundColor: theme.border },
    learnButton: { padding: theme.spaceMD, flexDirection: "row", alignItems: "center", gap: 10 },
    learnButtonText: { color: theme.honeyLight, fontWeight: "800", fontSize: theme.fontSM },
    learnHintBadge: { backgroundColor: theme.honey, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 20 },
    learnHintText: { color: theme.bg, fontSize: theme.fontXS, fontWeight: "800" },
    learnContent: { backgroundColor: theme.bg, borderTopWidth: 1, borderTopColor: theme.border, padding: theme.spaceMD, gap: 14 },
    imageToggleButton: { backgroundColor: theme.bgCardAlt, borderWidth: 1, borderColor: theme.honeyLight, padding: theme.spaceSM, borderRadius: theme.radiusSM, alignItems: "center" },
    imageToggleText: { color: theme.honeyLight, fontWeight: "800", fontSize: theme.fontSM },
    imageContainer: { borderRadius: theme.radiusMD, overflow: "hidden", borderWidth: 1, borderColor: theme.border },
    referenceImage: { width: "100%", height: 300 },
    imageCaption: { color: theme.textSecondary, fontSize: theme.fontXS, padding: theme.spaceSM, lineHeight: 18, backgroundColor: theme.bgCard },
    imageCredit: { color: theme.textMuted, fontSize: 10, padding: theme.spaceSM, paddingTop: 2, backgroundColor: theme.bgCard, fontStyle: "italic" },
    learnSection: { gap: 6 },
    learnSectionTitle: { color: theme.textPrimary, fontWeight: "900", fontSize: theme.fontSM },
    learnSectionText: { color: theme.textSecondary, fontSize: theme.fontSM, lineHeight: 22 },
    mistakeSection: { backgroundColor: theme.warningBg, padding: theme.spaceMD, borderRadius: theme.radiusSM, borderWidth: 1, borderColor: theme.warning },
    submitButton: { backgroundColor: theme.honey, padding: 18, borderRadius: theme.radiusMD, alignItems: "center", marginTop: theme.spaceMD },
    disabledButton: { backgroundColor: theme.bgCardAlt, borderWidth: 1, borderColor: theme.border },
    submitText: { color: theme.bg, fontWeight: "900", fontSize: theme.fontMD },
    disabledText: { color: theme.textMuted },
  });
}

/**
 * app/hive/comb-guide.tsx
 *
 * Comb Guide Screen — multi-select field guide with beginner learning sections.
 *
 * Beginner mode features:
 *  - Cards pulse/glow with amber animation
 *  - Cards auto-expand as user scrolls to them
 *  - "Learning mode on" badge shown at top
 *  - Reference images shown in expanded learn section
 *
 * Pro/Minimal mode:
 *  - No pulse, no auto-expand
 *  - Plain tap-to-expand behavior
 *
 * Reference images sourced from Wikimedia Commons (CC BY-SA 3.0)
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
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

type Finding = {
  id: string; emoji: string; title: string; description: string;
  combFinding: string; queen?: string; brood?: string; notes?: string;
  whatToLookFor: string; whereToLook: string; commonMistake?: string;
  referenceImage?: string; imageCaption?: string;
};

const FINDINGS: Finding[] = [
  {
    id: "eggs", emoji: "🥚", title: "Eggs",
    description: "Tiny white grains standing upright in cells. Means the queen has been laying recently.",
    combFinding: "Eggs seen", queen: "eggs",
    whatToLookFor: "Look for tiny white rice-grain shapes standing straight up in the bottom of empty-looking cells. They are about 1.5mm long — very small! Tilt the frame so sunlight shines across the cells at an angle. Fresh eggs (1 day old) stand perfectly upright. Older eggs (2-3 days) lean to the side.",
    whereToLook: "Look in the center of the brood area, in cells that appear empty at first glance. The egg is easier to see against a dark cell background. Young bees and freshly drawn comb make it harder to spot them.",
    commonMistake: "Many beginners mistake pollen or debris for eggs. Eggs are perfectly uniform white grains, always one per cell, always at the very bottom.",
    referenceImage: "https://en.wikipedia.org/w/index.php?title=Special:Redirect/file/Italian_honeybee_eggs_and_larvae.jpg&width=400",
    imageCaption: "Italian honeybee eggs and young larvae — tiny white grains standing upright in cells.",
  },
  {
    id: "larvae", emoji: "🐛", title: "Larvae",
    description: "White curled C-shapes at the bottom of cells. Larvae are young developing bees.",
    combFinding: "Larvae seen", brood: "strong",
    whatToLookFor: "Look for shiny, pearly-white grubs curled in a C-shape at the bottom of cells. They should be floating in a small pool of milky royal jelly. Healthy larvae are bright white and glistening — never brown or dried out.",
    whereToLook: "Larvae are found in the central brood area, usually surrounded by capped brood on the outside and eggs closer to the center.",
    commonMistake: "Discolored or twisted larvae are a warning sign. Healthy larvae should always look wet and white, never dry, brown, or melted-looking.",
    referenceImage: "https://en.wikipedia.org/w/index.php?title=Special:Redirect/file/Italian_honeybee_brood_frame_from_Langstroth_hive.jpg&width=400",
    imageCaption: "A full brood frame showing larvae at various stages alongside capped brood.",
  },
  {
    id: "honey", emoji: "🍯", title: "Capped Honey",
    description: "Smooth light wax caps over honey cells. Shows stored honey.",
    combFinding: "Capped honey seen",
    whatToLookFor: "Look for cells capped with a slightly raised, smooth white or tan wax cap. Hold the frame flat — ripe capped honey won't drip out.",
    whereToLook: "Honey is stored above and around the brood nest, especially in the top corners of the frame.",
    commonMistake: "Honey caps look similar to brood caps but are flatter and lighter colored. Brood caps are slightly domed and darker tan/brown.",
    referenceImage: "https://en.wikipedia.org/w/index.php?title=Special:Redirect/file/Italian_honeybee_honey_frame_from_Langstroth_hive.jpg&width=400",
    imageCaption: "A honey frame full of capped honey — smooth, light wax caps covering stored honey.",
  },
  {
    id: "pollen", emoji: "🌼", title: "Pollen",
    description: "Colorful packed cells — yellow, orange, or red. Food for brood.",
    combFinding: "Pollen stores seen",
    whatToLookFor: "Look for cells packed with colorful powder — yellow, orange, red, green, or even purple. Pollen is packed tightly and has a rough, grainy texture.",
    whereToLook: "Pollen is stored in a ring around the brood area, between the brood and the honey.",
    commonMistake: "Don't confuse packed pollen with empty cells. Pollen cells look full and solid with color.",
    referenceImage: "https://en.wikipedia.org/w/index.php?title=Special:Redirect/file/Honeybee_landing_on_milkthistle02.jpg&width=400",
    imageCaption: "Honeybee with full pollen baskets — the same colorful pollen you'll see packed into comb cells.",
  },
  {
    id: "brood", emoji: "🟫", title: "Capped Brood",
    description: "Darker capped cells in a solid pattern. Good pattern means healthy development.",
    combFinding: "Capped brood seen", brood: "strong",
    whatToLookFor: "Look for cells with slightly domed tan or brown wax caps. A healthy brood pattern is solid and compact — like a full sheet of caps with very few gaps.",
    whereToLook: "Capped brood fills the center of the frame in a roughly oval pattern.",
    commonMistake: "A few scattered empty cells in the brood pattern is normal. But if more than 1 in 10 cells are skipped, that may indicate a health issue.",
    referenceImage: "https://en.wikipedia.org/w/index.php?title=Special:Redirect/file/Beekeeping_langstroth_hive_frame.jpg&width=400",
    imageCaption: "A healthy brood frame — solid capped brood in the center, honey around the edges.",
  },
  {
    id: "spotty", emoji: "⚠️", title: "Spotty Brood",
    description: "Patchy pattern with skipped cells. Watch queen health and colony condition.",
    combFinding: "Spotty brood seen", brood: "spotty",
    whatToLookFor: "Look for a brood pattern that has many random empty cells scattered throughout — like swiss cheese. Some caps may look sunken in or discolored.",
    whereToLook: "Compare the center of the brood frame to what you'd expect. A sparse or patchy pattern is the key sign.",
    commonMistake: "A brand new queen just starting to lay will have a spotty pattern that fills in — this is normal. Spotty brood in an established colony is more concerning.",
    referenceImage: "https://en.wikipedia.org/w/index.php?title=Special:Redirect/file/Maltese_honey_bee.JPG&width=400",
    imageCaption: "Compare carefully — spotty brood has many random gaps scattered between capped cells.",
  },
  {
    id: "queencells", emoji: "👑", title: "Queen Cells",
    description: "Larger peanut-shaped cells. May indicate swarming, supersedure, or queen replacement.",
    combFinding: "Queen cells seen", queen: "cells",
    whatToLookFor: "Look for large peanut or acorn-shaped cells that hang vertically. They are much larger than regular cells — about 2-3cm long.",
    whereToLook: "Swarm cells are usually found on the bottom edges of frames. Supersedure cells are usually found in the middle of the frame face.",
    commonMistake: "Play cups (empty queen cups) are very common and do NOT mean the colony is about to swarm. Only cells containing an egg or larva are cause for action.",
    referenceImage: "https://en.wikipedia.org/w/index.php?title=Special:Redirect/file/Capped_emergency_supercedure_queen_cells_of_the_honey_bee.JPG&width=400",
    imageCaption: "Capped queen cells — large peanut-shaped cells, much bigger than regular worker cells.",
  },
  {
    id: "mentor", emoji: "❓", title: "Unsure / Need Mentor",
    description: "Use this when you're not confident what you're seeing. Marks the report for review.",
    combFinding: "Needs mentor review", notes: "Comb finding needs mentor review.",
    whatToLookFor: "Sometimes what you see doesn't match any description — and that's completely normal for new beekeepers! Common confusing things include chalk-like white lumps, dark sunken caps, or unusual smells.",
    whereToLook: "When in doubt, note where on the frame you saw it, the color, texture, and smell if any.",
    commonMistake: "Never hesitate to mark something for mentor review. Catching a potential problem early is always better than waiting until you're sure.",
    referenceImage: "https://en.wikipedia.org/w/index.php?title=Special:Redirect/file/Western_Honey_Bees_and_Honeycomb.JPG&width=400",
    imageCaption: "A typical active frame — lots going on at once, which can be confusing for new beekeepers.",
  },
];

export default function CombGuideScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { settings } = useSettingsContext();
  const isBeginner = settings.appMode === "beginner";

  const { id } = useLocalSearchParams<{ id?: string }>();
  const hiveId = id ? String(id) : "";

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showImage, setShowImage] = useState<Set<string>>(new Set());

  const cardPositions = useRef<Record<string, { top: number; bottom: number }>>({});

  const pulseAnims = useRef<Record<string, Animated.Value>>(
    Object.fromEntries(FINDINGS.map((f) => [f.id, new Animated.Value(1)]))
  ).current;

  const startPulse = (id: string) => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnims[id], { toValue: 1.03, duration: 900, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(pulseAnims[id], { toValue: 1, duration: 900, useNativeDriver: Platform.OS !== "web" }),
      ])
    ).start();
  };

  const stopPulse = (id: string) => {
    pulseAnims[id].stopAnimation();
    pulseAnims[id].setValue(1);
  };

  const pulsesStarted = useRef(false);
  useEffect(() => {
    if (isBeginner && !pulsesStarted.current) {
      pulsesStarted.current = true;
      const timer = setTimeout(() => { FINDINGS.forEach((f) => startPulse(f.id)); }, 500);
      return () => clearTimeout(timer);
    }
  }, [isBeginner]);

  const toggleFinding = (findingId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(findingId)) next.delete(findingId);
      else next.add(findingId);
      return next;
    });
  };

  const toggleExpanded = (findingId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(findingId)) {
        next.delete(findingId);
        if (isBeginner) startPulse(findingId);
      } else {
        next.add(findingId);
        if (isBeginner) stopPulse(findingId);
      }
      return next;
    });
  };

  const toggleImage = (findingId: string) => {
    setShowImage((prev) => {
      const next = new Set(prev);
      if (next.has(findingId)) next.delete(findingId);
      else next.add(findingId);
      return next;
    });
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!isBeginner) return;
    const y = e.nativeEvent.contentOffset.y;
    const viewHeight = e.nativeEvent.layoutMeasurement.height;
    const viewCenter = y + viewHeight * 0.4;

    let activeId: string | null = null;
    for (const [id, pos] of Object.entries(cardPositions.current)) {
      if (viewCenter >= pos.top && viewCenter <= pos.bottom) { activeId = id; break; }
    }

    if (activeId) {
      setExpanded((prev) => {
        if (prev.has(activeId!)) return prev;
        const next = new Set<string>();
        next.add(activeId!);
        stopPulse(activeId!);
        prev.forEach((id) => { if (id !== activeId) startPulse(id); });
        return next;
      });
    }
  };

  const handleSubmit = () => {
    if (selected.size === 0) return;
    const selectedFindings = FINDINGS.filter((f) => selected.has(f.id));
    const findingsList = selectedFindings.map((f) => `• ${f.combFinding}`).join("\n");
    const extraNotes = selectedFindings.filter((f) => f.notes).map((f) => f.notes).join(" ");
    const combinedNotes = `Comb findings:\n${findingsList}${extraNotes ? "\n\n" + extraNotes : ""}`;
    const queenValues = selectedFindings.map((f) => f.queen).filter(Boolean) as string[];
    const queen = queenValues.join(", ");
    const broodValues = selectedFindings.map((f) => f.brood).filter(Boolean) as string[];
    const brood = broodValues.includes("spotty") ? "spotty" : broodValues[0] || "";
    router.replace({ pathname: "/hive/inspection/add", params: { id: hiveId, notes: combinedNotes, queen, brood } });
  };

  const S = makeStyles(theme);

  return (
    <SafeAreaView style={S.page}>
      <NavBar />
      <ScrollView contentContainerStyle={S.content} onScroll={handleScroll} scrollEventThrottle={16}>
        <Text style={S.title}>🔍 Comb Guide</Text>
        <Text style={S.subtitle}>Tap everything you see. Tap "What am I looking at?" to learn how to identify it.</Text>

        {isBeginner && (
          <View style={S.learningBadge}>
            <Text style={S.learningBadgeText}>🌱 Learning mode — scroll through to explore each finding</Text>
          </View>
        )}

        {selected.size > 0 && (
          <View style={S.selectionBanner}>
            <Text style={S.selectionText}>{selected.size} finding{selected.size === 1 ? "" : "s"} selected</Text>
            <Pressable onPress={() => setSelected(new Set())} style={S.clearButton}>
              <Text style={S.clearText}>Clear</Text>
            </Pressable>
          </View>
        )}

        {FINDINGS.map((finding) => {
          const isSelected = selected.has(finding.id);
          const isExpanded = expanded.has(finding.id);
          const isImageShown = showImage.has(finding.id);

          return (
            <Animated.View
              key={finding.id}
              style={[
                S.cardWrapper,
                isBeginner && !isExpanded && { transform: [{ scale: pulseAnims[finding.id] }] },
              ]}
              onLayout={(e) => {
                const { y, height } = e.nativeEvent.layout;
                cardPositions.current[finding.id] = { top: y, bottom: y + height };
              }}
            >
              <View style={[S.card, isSelected && S.cardSelected, isExpanded && isBeginner && S.cardActive]}>

                <Pressable onPress={() => toggleFinding(finding.id)}>
                  <View style={S.cardHeader}>
                    <Text style={S.cardEmoji}>{finding.emoji}</Text>
                    <Text style={[S.cardTitle, isSelected && S.cardTitleSelected]}>{finding.title}</Text>
                    {isSelected && <View style={S.checkBadge}><Text style={S.checkText}>✓</Text></View>}
                  </View>
                  <Text style={S.cardText}>{finding.description}</Text>
                  <Text style={S.tapHint}>{isSelected ? "✓ Selected — tap to deselect" : "Tap to select"}</Text>
                </Pressable>

                <View style={S.divider} />

                <Pressable onPress={() => toggleExpanded(finding.id)} style={S.learnButton}>
                  <Text style={S.learnButtonText}>{isExpanded ? "▼ Hide guide" : "👁 What am I looking at?"}</Text>
                  {isBeginner && !isExpanded && (
                    <View style={S.learnHintBadge}><Text style={S.learnHintText}>Tap or scroll</Text></View>
                  )}
                </Pressable>

                {isExpanded && (
                  <View style={S.learnContent}>

                    {finding.referenceImage && (
                      <Pressable onPress={() => toggleImage(finding.id)} style={S.imageToggleButton}>
                        <Text style={S.imageToggleText}>
                          {isImageShown ? "🙈 Hide reference photo" : "📸 See example photo"}
                        </Text>
                      </Pressable>
                    )}

                    {isImageShown && finding.referenceImage && (
                      <View style={S.imageContainer}>
                        <Image
                          source={{ uri: finding.referenceImage }}
                          style={S.referenceImage}
                          resizeMode="cover"
                        />
                        {finding.imageCaption && (
                          <Text style={S.imageCaption}>{finding.imageCaption}</Text>
                        )}
                        <Text style={S.imageCredit}>📷 Wikimedia Commons (CC BY-SA 3.0)</Text>
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
            {selected.size === 0 ? "Select findings above" : `Add ${selected.size} Finding${selected.size === 1 ? "" : "s"} to Inspection →`}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

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
      ...(Platform.OS !== "web" ? { shadowColor: theme.honey, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 6 } : {}),
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
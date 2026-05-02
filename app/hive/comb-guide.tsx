/**
 * app/hive/comb-guide.tsx
 *
 * Comb Guide Screen — field guide for identifying what's in the comb.
 *
 * Features:
 * - Multi-select: tap multiple findings, submit all at once
 * - "What am I looking at?" expandable section on each card
 *   with detailed visual descriptions for beginners
 * - Queen/brood values combined when multiple selected
 *
 * This is a unique feature — no other beekeeping app has an
 * in-field visual identification guide built in.
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import NavBar from "../../components/NavBar";
import { T } from "../../utils/theme";

type Finding = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  combFinding: string;
  queen?: string;
  brood?: string;
  notes?: string;
  // Detailed visual guide for beginners
  whatToLookFor: string;
  whereToLook: string;
  commonMistake?: string;
};

const FINDINGS: Finding[] = [
  {
    id: "eggs",
    emoji: "🥚",
    title: "Eggs",
    description: "Tiny white grains standing upright in cells. Means the queen has been laying recently.",
    combFinding: "Eggs seen",
    queen: "eggs",
    whatToLookFor: "Look for tiny white rice-grain shapes standing straight up in the bottom of empty-looking cells. They are about 1.5mm long — very small! Tilt the frame so sunlight shines across the cells at an angle. Fresh eggs (1 day old) stand perfectly upright. Older eggs (2-3 days) lean to the side.",
    whereToLook: "Look in the center of the brood area, in cells that appear empty at first glance. The egg is easier to see against a dark cell background. Young bees and freshly drawn comb make it harder to spot them.",
    commonMistake: "Many beginners mistake pollen or debris for eggs. Eggs are perfectly uniform white grains, always one per cell, always at the very bottom.",
  },
  {
    id: "larvae",
    emoji: "🐛",
    title: "Larvae",
    description: "White curled C-shapes at the bottom of cells. Larvae are young developing bees.",
    combFinding: "Larvae seen",
    brood: "strong",
    whatToLookFor: "Look for shiny, pearly-white grubs curled in a C-shape at the bottom of cells. They should be floating in a small pool of milky royal jelly. Healthy larvae are bright white and glistening — never brown or dried out. They grow from tiny (day 4) to filling the cell (day 8).",
    whereToLook: "Larvae are found in the central brood area, usually surrounded by capped brood on the outside and eggs closer to the center. A healthy frame shows eggs, open larvae, and capped brood in a rainbow pattern.",
    commonMistake: "Discolored or twisted larvae are a warning sign. Healthy larvae should always look wet and white, never dry, brown, or melted-looking.",
  },
  {
    id: "honey",
    emoji: "🍯",
    title: "Capped Honey",
    description: "Smooth light wax caps over honey cells. Shows stored honey.",
    combFinding: "Capped honey seen",
    whatToLookFor: "Look for cells capped with a slightly raised, smooth white or tan wax cap. Honey caps are usually in the upper corners of the frame. Hold the frame flat — ripe capped honey won't drip out. Uncapped honey may drip if the frame is tilted, meaning it's not fully cured yet.",
    whereToLook: "Honey is stored above and around the brood nest, especially in the top corners of the frame and on frames closest to the outer edges of the hive.",
    commonMistake: "Honey caps look similar to capped brood caps but are flatter and lighter colored. Brood caps are slightly domed and darker tan/brown.",
  },
  {
    id: "pollen",
    emoji: "🌼",
    title: "Pollen",
    description: "Colorful packed cells — yellow, orange, or red. Food for brood.",
    combFinding: "Pollen stores seen",
    whatToLookFor: "Look for cells packed with colorful powder — yellow, orange, red, green, or even purple depending on what flowers the bees visited. Pollen is packed tightly and has a rough, grainy texture. It often creates a beautiful rainbow pattern of colors.",
    whereToLook: "Pollen is stored in a ring around the brood area, between the brood and the honey. It's often called the 'pollen crown.' These cells are usually not capped.",
    commonMistake: "Don't confuse packed pollen with empty cells. Pollen cells look full and solid with color. Empty cells look hollow and dark inside.",
  },
  {
    id: "brood",
    emoji: "🟫",
    title: "Capped Brood",
    description: "Darker capped cells in a solid pattern. Good pattern means healthy development.",
    combFinding: "Capped brood seen",
    brood: "strong",
    whatToLookFor: "Look for cells with slightly domed tan or brown wax caps. A healthy brood pattern is solid and compact — like a full sheet of caps with very few gaps. The caps should all be a uniform color. Worker brood caps are slightly raised. Drone brood caps are more bullet-shaped and taller.",
    whereToLook: "Capped brood fills the center of the frame in a roughly oval pattern. The most recently capped cells are at the edges of the pattern, the oldest (closest to emerging) are at the center.",
    commonMistake: "A few scattered empty cells in the brood pattern is normal. But if more than 1 in 10 cells are skipped, that may indicate a health issue worth watching.",
  },
  {
    id: "spotty",
    emoji: "⚠️",
    title: "Spotty Brood",
    description: "Patchy pattern with skipped cells. Watch queen health and colony condition.",
    combFinding: "Spotty brood seen",
    brood: "spotty",
    whatToLookFor: "Look for a brood pattern that has many random empty cells scattered throughout — like swiss cheese. Some caps may look sunken in, discolored (dark brown or black), or perforated with small holes chewed through them. A healthy brood frame should look like a solid sheet of caps.",
    whereToLook: "Compare the center of the brood frame to what you'd expect. A sparse or patchy pattern where cells are randomly missing or uncapped early is the key sign.",
    commonMistake: "A brand new queen just starting to lay will have a spotty pattern that fills in over time — this is normal. Spotty brood in an established colony is more concerning.",
  },
  {
    id: "queencells",
    emoji: "👑",
    title: "Queen Cells",
    description: "Larger peanut-shaped cells. May indicate swarming, supersedure, or queen replacement.",
    combFinding: "Queen cells seen",
    queen: "cells",
    whatToLookFor: "Look for large peanut or acorn-shaped cells that hang vertically from the face or bottom edge of the frame. They are much larger than regular cells — about 2-3cm long. An open cup with no egg is just a 'play cup' — common and not a concern. A cup with an egg or larva inside means the bees are actively raising a queen.",
    whereToLook: "Swarm cells are usually found on the bottom edges of frames. Supersedure cells (replacing a failing queen) are usually found in the middle of the frame face.",
    commonMistake: "Play cups (empty queen cups) are very common and do NOT mean the colony is about to swarm. Only cells containing an egg or larva are cause for action.",
  },
  {
    id: "mentor",
    emoji: "❓",
    title: "Unsure / Need Mentor",
    description: "Use this when you're not confident what you're seeing. Marks the report for review.",
    combFinding: "Needs mentor review",
    notes: "Comb finding needs mentor review.",
    whatToLookFor: "Sometimes what you see doesn't match any description — and that's completely normal for new beekeepers! Common confusing things include: chalk-like white lumps (possible chalkbrood), dark sunken caps (possible disease), unusual smells, or just general uncertainty about colony health.",
    whereToLook: "When in doubt, note where on the frame you saw it (top, middle, bottom edge), the color, texture, and smell if any. The more detail you record, the easier it is for a mentor to help.",
    commonMistake: "Never hesitate to mark something for mentor review. Catching a potential problem early is always better than waiting until you're sure.",
  },
];

export default function CombGuideScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const hiveId = id ? String(id) : "";

  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Tracks which cards have their "What am I looking at?" section expanded
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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
      if (next.has(findingId)) next.delete(findingId);
      else next.add(findingId);
      return next;
    });
  };

  const handleSubmit = () => {
    if (selected.size === 0) return;

    const selectedFindings = FINDINGS.filter((f) => selected.has(f.id));

    // Combine all finding labels into a readable bullet list
    const findingsList = selectedFindings.map((f) => `• ${f.combFinding}`).join("\n");
    const extraNotes = selectedFindings.filter((f) => f.notes).map((f) => f.notes).join(" ");
    const combinedNotes = `Comb findings:\n${findingsList}${extraNotes ? "\n\n" + extraNotes : ""}`;

    // Combine ALL queen values (not just one winner)
    const queenValues = selectedFindings.map((f) => f.queen).filter(Boolean) as string[];
    const queen = queenValues.join(", ");

    // Brood priority: spotty overrides strong since it's a warning
    const broodValues = selectedFindings.map((f) => f.brood).filter(Boolean) as string[];
    const brood = broodValues.includes("spotty") ? "spotty" : broodValues[0] || "";

    router.replace({
      pathname: "/hive/inspection/add",
      params: { id: hiveId, notes: combinedNotes, queen, brood },
    });
  };

  return (
    <SafeAreaView style={styles.page}>
      <NavBar />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>🔍 Comb Guide</Text>
        <Text style={styles.subtitle}>
          Tap everything you see. Tap "What am I looking at?" to learn how to identify it.
        </Text>

        {/* Selection count banner */}
        {selected.size > 0 && (
          <View style={styles.selectionBanner}>
            <Text style={styles.selectionText}>
              {selected.size} finding{selected.size === 1 ? "" : "s"} selected
            </Text>
            <Pressable onPress={() => setSelected(new Set())} style={styles.clearButton}>
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          </View>
        )}

        {/* Finding cards */}
        {FINDINGS.map((finding) => {
          const isSelected = selected.has(finding.id);
          const isExpanded = expanded.has(finding.id);

          return (
            <View key={finding.id} style={[styles.card, isSelected && styles.cardSelected]}>

              {/* Main tap area — selects the finding */}
              <Pressable onPress={() => toggleFinding(finding.id)}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardEmoji}>{finding.emoji}</Text>
                  <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                    {finding.title}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <Text style={styles.checkText}>✓</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardText}>{finding.description}</Text>
                <Text style={styles.tapHint}>
                  {isSelected ? "✓ Selected — tap to deselect" : "Tap to select"}
                </Text>
              </Pressable>

              {/* Divider */}
              <View style={styles.divider} />

              {/* "What am I looking at?" toggle */}
              <Pressable
                onPress={() => toggleExpanded(finding.id)}
                style={styles.learnButton}
              >
                <Text style={styles.learnButtonText}>
                  {isExpanded ? "▼ Hide guide" : "👁 What am I looking at?"}
                </Text>
              </Pressable>

              {/* Expanded learning section */}
              {isExpanded && (
                <View style={styles.learnContent}>
                  <View style={styles.learnSection}>
                    <Text style={styles.learnSectionTitle}>🔎 What to look for</Text>
                    <Text style={styles.learnSectionText}>{finding.whatToLookFor}</Text>
                  </View>
                  <View style={styles.learnSection}>
                    <Text style={styles.learnSectionTitle}>📍 Where to look</Text>
                    <Text style={styles.learnSectionText}>{finding.whereToLook}</Text>
                  </View>
                  {finding.commonMistake && (
                    <View style={[styles.learnSection, styles.mistakeSection]}>
                      <Text style={styles.learnSectionTitle}>⚠️ Common mistake</Text>
                      <Text style={styles.learnSectionText}>{finding.commonMistake}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}

        {/* Submit button */}
        <Pressable
          onPress={handleSubmit}
          disabled={selected.size === 0}
          style={[styles.submitButton, selected.size === 0 && styles.disabledButton]}
        >
          <Text style={[styles.submitText, selected.size === 0 && styles.disabledText]}>
            {selected.size === 0
              ? "Select findings above"
              : `Add ${selected.size} Finding${selected.size === 1 ? "" : "s"} to Inspection →`}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: T.bg },
  content: { padding: T.spaceMD, paddingBottom: 50 },
  title: { color: T.textPrimary, fontSize: T.fontLG, fontWeight: "900", marginBottom: 4 },
  subtitle: { color: T.textMuted, fontSize: T.fontSM, marginBottom: T.spaceMD, lineHeight: 20 },

  // Selection banner
  selectionBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: T.bgCardAlt,
    borderWidth: 1,
    borderColor: T.honey,
    padding: T.spaceMD,
    borderRadius: T.radiusMD,
    marginBottom: T.spaceMD,
  },
  selectionText: { color: T.honey, fontWeight: "800", fontSize: T.fontSM },
  clearButton: {
    backgroundColor: T.bgCard,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: T.radiusSM,
    borderWidth: 1,
    borderColor: T.border,
  },
  clearText: { color: T.textSecondary, fontSize: T.fontXS, fontWeight: "700" },

  // Cards
  card: {
    backgroundColor: T.bgCard,
    borderRadius: T.radiusLG,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: T.border,
    overflow: "hidden",
  },
  cardSelected: { borderColor: T.honey, backgroundColor: T.bgCardAlt },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: T.spaceMD,
    paddingBottom: 8,
  },
  cardEmoji: { fontSize: 28 },
  cardTitle: { flex: 1, color: T.honey, fontSize: T.fontMD, fontWeight: "900" },
  cardTitleSelected: { color: T.honeyLight },
  checkBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: T.honey,
    justifyContent: "center", alignItems: "center",
  },
  checkText: { color: T.bg, fontWeight: "900", fontSize: T.fontSM },
  cardText: {
    color: T.textSecondary, fontSize: T.fontSM, lineHeight: 20,
    paddingHorizontal: T.spaceMD,
  },
  tapHint: {
    color: T.textMuted, fontSize: T.fontXS, fontWeight: "700",
    paddingHorizontal: T.spaceMD, paddingBottom: T.spaceMD, marginTop: 8,
  },

  // Divider between select area and learn button
  divider: { height: 1, backgroundColor: T.border },

  // Learn button
  learnButton: {
    padding: T.spaceMD,
    flexDirection: "row",
    alignItems: "center",
  },
  learnButtonText: {
    color: T.honeyLight,
    fontWeight: "800",
    fontSize: T.fontSM,
  },

  // Expanded learn content
  learnContent: {
    backgroundColor: T.bg,
    borderTopWidth: 1,
    borderTopColor: T.border,
    padding: T.spaceMD,
    gap: 14,
  },
  learnSection: {
    gap: 6,
  },
  learnSectionTitle: {
    color: T.textPrimary,
    fontWeight: "900",
    fontSize: T.fontSM,
  },
  learnSectionText: {
    color: T.textSecondary,
    fontSize: T.fontSM,
    lineHeight: 22,
  },
  mistakeSection: {
    backgroundColor: T.warningBg,
    padding: T.spaceMD,
    borderRadius: T.radiusSM,
    borderWidth: 1,
    borderColor: T.warning,
  },

  // Submit button
  submitButton: {
    backgroundColor: T.honey,
    padding: 18,
    borderRadius: T.radiusMD,
    alignItems: "center",
    marginTop: T.spaceMD,
  },
  disabledButton: {
    backgroundColor: T.bgCardAlt,
    borderWidth: 1,
    borderColor: T.border,
  },
  submitText: { color: T.bg, fontWeight: "900", fontSize: T.fontMD },
  disabledText: { color: T.textMuted },
});
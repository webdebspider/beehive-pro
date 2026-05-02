/**
 * app/hive/comb-guide.tsx
 *
 * Comb Guide Screen — multi-select field guide with beginner learning sections.
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import NavBar from "../../components/NavBar";
import { useAppTheme } from "../../hooks/useAppTheme";

type Finding = {
  id: string; emoji: string; title: string; description: string;
  combFinding: string; queen?: string; brood?: string; notes?: string;
  whatToLookFor: string; whereToLook: string; commonMistake?: string;
};

const FINDINGS: Finding[] = [
  { id: "eggs", emoji: "🥚", title: "Eggs", description: "Tiny white grains standing upright in cells. Means the queen has been laying recently.", combFinding: "Eggs seen", queen: "eggs", whatToLookFor: "Look for tiny white rice-grain shapes standing straight up in the bottom of empty-looking cells. They are about 1.5mm long — very small! Tilt the frame so sunlight shines across the cells at an angle. Fresh eggs (1 day old) stand perfectly upright. Older eggs (2-3 days) lean to the side.", whereToLook: "Look in the center of the brood area, in cells that appear empty at first glance. The egg is easier to see against a dark cell background. Young bees and freshly drawn comb make it harder to spot them.", commonMistake: "Many beginners mistake pollen or debris for eggs. Eggs are perfectly uniform white grains, always one per cell, always at the very bottom." },
  { id: "larvae", emoji: "🐛", title: "Larvae", description: "White curled C-shapes at the bottom of cells. Larvae are young developing bees.", combFinding: "Larvae seen", brood: "strong", whatToLookFor: "Look for shiny, pearly-white grubs curled in a C-shape at the bottom of cells. They should be floating in a small pool of milky royal jelly. Healthy larvae are bright white and glistening — never brown or dried out.", whereToLook: "Larvae are found in the central brood area, usually surrounded by capped brood on the outside and eggs closer to the center.", commonMistake: "Discolored or twisted larvae are a warning sign. Healthy larvae should always look wet and white, never dry, brown, or melted-looking." },
  { id: "honey", emoji: "🍯", title: "Capped Honey", description: "Smooth light wax caps over honey cells. Shows stored honey.", combFinding: "Capped honey seen", whatToLookFor: "Look for cells capped with a slightly raised, smooth white or tan wax cap. Hold the frame flat — ripe capped honey won't drip out.", whereToLook: "Honey is stored above and around the brood nest, especially in the top corners of the frame.", commonMistake: "Honey caps look similar to brood caps but are flatter and lighter colored. Brood caps are slightly domed and darker tan/brown." },
  { id: "pollen", emoji: "🌼", title: "Pollen", description: "Colorful packed cells — yellow, orange, or red. Food for brood.", combFinding: "Pollen stores seen", whatToLookFor: "Look for cells packed with colorful powder — yellow, orange, red, green, or even purple. Pollen is packed tightly and has a rough, grainy texture.", whereToLook: "Pollen is stored in a ring around the brood area, between the brood and the honey.", commonMistake: "Don't confuse packed pollen with empty cells. Pollen cells look full and solid with color." },
  { id: "brood", emoji: "🟫", title: "Capped Brood", description: "Darker capped cells in a solid pattern. Good pattern means healthy development.", combFinding: "Capped brood seen", brood: "strong", whatToLookFor: "Look for cells with slightly domed tan or brown wax caps. A healthy brood pattern is solid and compact — like a full sheet of caps with very few gaps.", whereToLook: "Capped brood fills the center of the frame in a roughly oval pattern.", commonMistake: "A few scattered empty cells in the brood pattern is normal. But if more than 1 in 10 cells are skipped, that may indicate a health issue." },
  { id: "spotty", emoji: "⚠️", title: "Spotty Brood", description: "Patchy pattern with skipped cells. Watch queen health and colony condition.", combFinding: "Spotty brood seen", brood: "spotty", whatToLookFor: "Look for a brood pattern that has many random empty cells scattered throughout — like swiss cheese. Some caps may look sunken in or discolored.", whereToLook: "Compare the center of the brood frame to what you'd expect. A sparse or patchy pattern is the key sign.", commonMistake: "A brand new queen just starting to lay will have a spotty pattern that fills in — this is normal. Spotty brood in an established colony is more concerning." },
  { id: "queencells", emoji: "👑", title: "Queen Cells", description: "Larger peanut-shaped cells. May indicate swarming, supersedure, or queen replacement.", combFinding: "Queen cells seen", queen: "cells", whatToLookFor: "Look for large peanut or acorn-shaped cells that hang vertically. They are much larger than regular cells — about 2-3cm long.", whereToLook: "Swarm cells are usually found on the bottom edges of frames. Supersedure cells are usually found in the middle of the frame face.", commonMistake: "Play cups (empty queen cups) are very common and do NOT mean the colony is about to swarm. Only cells containing an egg or larva are cause for action." },
  { id: "mentor", emoji: "❓", title: "Unsure / Need Mentor", description: "Use this when you're not confident what you're seeing. Marks the report for review.", combFinding: "Needs mentor review", notes: "Comb finding needs mentor review.", whatToLookFor: "Sometimes what you see doesn't match any description — and that's completely normal for new beekeepers! Common confusing things include chalk-like white lumps, dark sunken caps, unusual smells, or general uncertainty.", whereToLook: "When in doubt, note where on the frame you saw it, the color, texture, and smell if any.", commonMistake: "Never hesitate to mark something for mentor review. Catching a potential problem early is always better than waiting until you're sure." },
];

export default function CombGuideScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const hiveId = id ? String(id) : "";
  const [selected, setSelected] = useState<Set<string>>(new Set());
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
      <ScrollView contentContainerStyle={S.content}>
        <Text style={S.title}>🔍 Comb Guide</Text>
        <Text style={S.subtitle}>Tap everything you see. Tap "What am I looking at?" to learn how to identify it.</Text>

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
          return (
            <View key={finding.id} style={[S.card, isSelected && S.cardSelected]}>
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
              </Pressable>

              {isExpanded && (
                <View style={S.learnContent}>
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
          );
        })}

        <Pressable onPress={handleSubmit} disabled={selected.size === 0} style={[S.submitButton, selected.size === 0 && S.disabledButton]}>
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
    selectionBanner: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: theme.bgCardAlt, borderWidth: 1, borderColor: theme.honey, padding: theme.spaceMD, borderRadius: theme.radiusMD, marginBottom: theme.spaceMD },
    selectionText: { color: theme.honey, fontWeight: "800", fontSize: theme.fontSM },
    clearButton: { backgroundColor: theme.bgCard, paddingVertical: 6, paddingHorizontal: 12, borderRadius: theme.radiusSM, borderWidth: 1, borderColor: theme.border },
    clearText: { color: theme.textSecondary, fontSize: theme.fontXS, fontWeight: "700" },
    card: { backgroundColor: theme.bgCard, borderRadius: theme.radiusLG, marginBottom: 12, borderWidth: 2, borderColor: theme.border, overflow: "hidden" },
    cardSelected: { borderColor: theme.honey, backgroundColor: theme.bgCardAlt },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: theme.spaceMD, paddingBottom: 8 },
    cardEmoji: { fontSize: 28 },
    cardTitle: { flex: 1, color: theme.honey, fontSize: theme.fontMD, fontWeight: "900" },
    cardTitleSelected: { color: theme.honeyLight },
    checkBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.honey, justifyContent: "center", alignItems: "center" },
    checkText: { color: theme.bg, fontWeight: "900", fontSize: theme.fontSM },
    cardText: { color: theme.textSecondary, fontSize: theme.fontSM, lineHeight: 20, paddingHorizontal: theme.spaceMD },
    tapHint: { color: theme.textMuted, fontSize: theme.fontXS, fontWeight: "700", paddingHorizontal: theme.spaceMD, paddingBottom: theme.spaceMD, marginTop: 8 },
    divider: { height: 1, backgroundColor: theme.border },
    learnButton: { padding: theme.spaceMD },
    learnButtonText: { color: theme.honeyLight, fontWeight: "800", fontSize: theme.fontSM },
    learnContent: { backgroundColor: theme.bg, borderTopWidth: 1, borderTopColor: theme.border, padding: theme.spaceMD, gap: 14 },
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
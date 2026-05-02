/**
 * app/hive/comb-guide.tsx
 *
 * Comb Guide Screen — field guide for identifying what's in the comb.
 * Tap a card to pre-fill inspection fields.
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import NavBar from "../../components/NavBar";
import { T } from "../../utils/theme";

export default function CombGuideScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const hiveId = id ? String(id) : "";

  const choose = (params: Record<string, string>) => {
    router.replace({ pathname: "/hive/inspection/add", params: { id: hiveId, ...params } });
  };

  const Item = ({ emoji, title, description, combFinding, extraParams }: { emoji: string; title: string; description: string; combFinding: string; extraParams?: Record<string, string> }) => (
    <Pressable onPress={() => choose({ combFinding, ...(extraParams || {}) })} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardEmoji}>{emoji}</Text>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={styles.cardText}>{description}</Text>
      <Text style={styles.tapHint}>Tap to add to inspection →</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.page}>
      <NavBar />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>🔍 Comb Guide</Text>
        <Text style={styles.subtitle}>Tap what you see — it will be added to the inspection report</Text>
        <Item emoji="🥚" title="Eggs" description="Tiny white grains standing upright in cells. Means the queen has been laying recently." combFinding="Eggs seen" extraParams={{ queen: "eggs" }} />
        <Item emoji="🐛" title="Larvae" description="White curled C-shapes at the bottom of cells. Larvae are young developing bees." combFinding="Larvae seen" extraParams={{ brood: "strong" }} />
        <Item emoji="🍯" title="Capped Honey" description="Smooth light wax caps over honey cells. Shows stored honey." combFinding="Capped honey seen" />
        <Item emoji="🌼" title="Pollen" description="Colorful packed cells — yellow, orange, or red. Food for brood." combFinding="Pollen stores seen" />
        <Item emoji="🟫" title="Capped Brood" description="Darker capped cells in a solid pattern. Good pattern means healthy development." combFinding="Capped brood seen" extraParams={{ brood: "strong" }} />
        <Item emoji="⚠️" title="Spotty Brood" description="Patchy pattern with skipped cells. Watch queen health and colony condition." combFinding="Spotty brood seen" extraParams={{ brood: "spotty" }} />
        <Item emoji="👑" title="Queen Cells" description="Larger peanut-shaped cells. May indicate swarming, supersedure, or queen replacement." combFinding="Queen cells seen" extraParams={{ queen: "cells" }} />
        <Item emoji="❓" title="Unsure / Need Mentor" description="Use this when you're not confident what you're seeing. Marks the report for review." combFinding="Needs mentor review" extraParams={{ notes: "Comb finding needs mentor review." }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: T.bg },
  content: { padding: T.spaceMD, paddingBottom: 50 },
  title: { color: T.textPrimary, fontSize: T.fontLG, fontWeight: "900", marginBottom: 4 },
  subtitle: { color: T.textMuted, fontSize: T.fontSM, marginBottom: T.spaceMD, lineHeight: 20 },
  card: { backgroundColor: T.bgCard, padding: T.spaceMD, borderRadius: T.radiusLG, marginBottom: 12, borderWidth: 1, borderColor: T.border },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  cardEmoji: { fontSize: 28 },
  cardTitle: { color: T.honey, fontSize: T.fontMD, fontWeight: "900" },
  cardText: { color: T.textSecondary, fontSize: T.fontSM, lineHeight: 20 },
  tapHint: { color: T.textMuted, fontSize: T.fontXS, fontWeight: "700", marginTop: 10 },
});
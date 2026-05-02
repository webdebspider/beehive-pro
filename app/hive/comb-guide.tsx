import { useLocalSearchParams, useRouter } from "expo-router";
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text
} from "react-native";

export default function CombGuideScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const hiveId = id ? String(id) : "";

  const choose = (params: Record<string, string>) => {
    router.replace({
      pathname: "/hive/inspection/add",
      params: { id: hiveId, ...params },
    });
  };

  const Item = ({
    emoji,
    title,
    description,
    combFinding,
    extraParams,
  }: {
    emoji: string;
    title: string;
    description: string;
    combFinding: string;
    extraParams?: Record<string, string>;
  }) => (
    <Pressable
      onPress={() =>
        choose({
          combFinding,
          ...(extraParams || {}),
        })
      }
      style={styles.card}
    >
      <Text style={styles.cardTitle}>
        {emoji} {title}
      </Text>

      <Text style={styles.cardText}>{description}</Text>

      <Text style={styles.tapText}>Tap to add to inspection report →</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Comb Guide</Text>
        <Text style={styles.subtitle}>
          Tap what you see. It will be added to the inspection report.
        </Text>

        <Item
          emoji="🥚"
          title="Eggs"
          description="Tiny white grains standing upright in cells. This often means a queen has been laying recently."
          combFinding="Eggs seen"
          extraParams={{ queen: "eggs" }}
        />

        <Item
          emoji="🐛"
          title="Larvae"
          description="White curled C-shapes at the bottom of cells. Larvae are young developing bees."
          combFinding="Larvae seen"
          extraParams={{ brood: "strong" }}
        />

        <Item
          emoji="🍯"
          title="Capped Honey"
          description="Smooth light wax caps over honey cells. This shows stored honey."
          combFinding="Capped honey seen"
        />

        <Item
          emoji="🌼"
          title="Pollen"
          description="Colorful packed cells, often yellow, orange, or red. This is food for brood."
          combFinding="Pollen stores seen"
        />

        <Item
          emoji="🟫"
          title="Capped Brood"
          description="Darker capped cells in a solid brood pattern. A good pattern can mean the hive is developing well."
          combFinding="Capped brood seen"
          extraParams={{ brood: "strong" }}
        />

        <Item
          emoji="⚠️"
          title="Spotty Brood"
          description="Patchy brood pattern with skipped cells. This can be a reason to watch queen health or colony condition."
          combFinding="Spotty brood seen"
          extraParams={{ brood: "spotty" }}
        />

        <Item
          emoji="👑"
          title="Queen Cells"
          description="Larger peanut-shaped cells. These may indicate swarming, supersedure, or queen replacement."
          combFinding="Queen cells seen"
          extraParams={{ queen: "cells" }}
        />

        <Item
          emoji="❓"
          title="Unsure / Need Mentor"
          description="Use this when you are not confident what you are seeing. It marks the report for later review."
          combFinding="Needs mentor review"
          extraParams={{ notes: "Comb finding needs mentor review." }}
        />

        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: "#9ca3af",
    marginTop: 6,
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardTitle: {
    color: "#22c55e",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  cardText: {
    color: "#cbd5e1",
    fontSize: 14,
  },
  tapText: {
    color: "#93c5fd",
    fontWeight: "800",
    marginTop: 8,
    fontSize: 12,
  },
  backButton: {
    backgroundColor: "#475569",
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
  },
  backText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
  },
});
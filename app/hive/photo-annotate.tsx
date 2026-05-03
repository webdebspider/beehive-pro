/**
 * app/hive/photo-annotate.tsx
 *
 * Photo Annotation Screen — draw on comb photos before sharing with a mentor.
 *
 * Tools: Freehand pen, Circle, Arrow
 * Colors: Red, Orange, Yellow, Green, Blue, White
 * Actions: Undo, Clear, Save to Gallery, Share
 *
 * Uses:
 *  - react-native-svg for drawing overlays
 *  - react-native-view-shot to capture the annotated image
 *  - expo-media-library to save to device gallery
 *
 * Note: PanResponder closures don't see state updates, so tool/color/width
 * are tracked via refs AND state — refs for PanResponder, state for UI.
 */

import * as MediaLibrary from "expo-media-library";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Alert,
  PanResponder,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { captureRef } from "react-native-view-shot";
import Svg, { Circle, Path } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import NavBar from "../../components/NavBar";
import { useAppTheme } from "../../hooks/useAppTheme";

// ── Types ─────────────────────────────────────────────────────────────────────

type PenAnnotation = {
  type: "pen";
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
};

type CircleAnnotation = {
  type: "circle";
  cx: number; cy: number; r: number;
  color: string;
  strokeWidth: number;
};

type ArrowAnnotation = {
  type: "arrow";
  x1: number; y1: number; x2: number; y2: number;
  color: string;
  strokeWidth: number;
};

type Annotation = PenAnnotation | CircleAnnotation | ArrowAnnotation;
type Tool = "pen" | "circle" | "arrow";

// ── Constants ─────────────────────────────────────────────────────────────────

const COLORS = [
  { label: "Red",    value: "#ef4444" },
  { label: "Orange", value: "#f97316" },
  { label: "Yellow", value: "#facc15" },
  { label: "Green",  value: "#22c55e" },
  { label: "Blue",   value: "#3b82f6" },
  { label: "White",  value: "#ffffff" },
];

const WIDTHS = [2, 4, 8];

// ── Helpers ───────────────────────────────────────────────────────────────────

const pointsToPath = (points: { x: number; y: number }[]): string => {
  if (points.length < 1) return "";
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
};

const getArrowPath = (x1: number, y1: number, x2: number, y2: number): string => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 4) return `M ${x1} ${y1} L ${x2} ${y2}`;
  const angle = Math.atan2(dy, dx);
  const arrowLen = Math.min(24, len * 0.4);
  const a = Math.PI / 6;
  const ax1 = x2 - arrowLen * Math.cos(angle - a);
  const ay1 = y2 - arrowLen * Math.sin(angle - a);
  const ax2 = x2 - arrowLen * Math.cos(angle + a);
  const ay2 = y2 - arrowLen * Math.sin(angle + a);
  return `M ${x1} ${y1} L ${x2} ${y2} M ${x2} ${y2} L ${ax1} ${ay1} M ${x2} ${y2} L ${ax2} ${ay2}`;
};

const renderAnnotation = (ann: Annotation, key: string | number) => {
  if (ann.type === "pen") {
    return (
      <Path
        key={key}
        d={pointsToPath(ann.points)}
        stroke={ann.color}
        strokeWidth={ann.strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  }
  if (ann.type === "circle") {
    return (
      <Circle
        key={key}
        cx={ann.cx} cy={ann.cy} r={ann.r}
        stroke={ann.color}
        strokeWidth={ann.strokeWidth}
        fill="none"
      />
    );
  }
  if (ann.type === "arrow") {
    return (
      <Path
        key={key}
        d={getArrowPath(ann.x1, ann.y1, ann.x2, ann.y2)}
        stroke={ann.color}
        strokeWidth={ann.strokeWidth}
        fill="none"
        strokeLinecap="round"
      />
    );
  }
  return null;
};

// ── Screen ────────────────────────────────────────────────────────────────────

export default function PhotoAnnotateScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { uri, hiveId, inspectionId } = useLocalSearchParams<{
    uri?: string; hiveId?: string; inspectionId?: string;
  }>();
  const photoUri = uri ? String(uri) : "";

  // State for UI rendering
  const [tool, setToolState] = useState<Tool>("pen");
  const [color, setColorState] = useState(COLORS[0].value);
  const [strokeWidth, setStrokeWidthState] = useState(WIDTHS[1]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });
  const [saving, setSaving] = useState(false);

  // Refs for PanResponder (closures don't see state updates)
  const toolRef = useRef<Tool>("pen");
  const colorRef = useRef(COLORS[0].value);
  const strokeWidthRef = useRef(WIDTHS[1]);
  const canvasRef = useRef<View>(null);

  // Setters that update both ref and state
  const setTool = (t: Tool) => { toolRef.current = t; setToolState(t); };
  const setColor = (c: string) => { colorRef.current = c; setColorState(c); };
  const setStrokeWidth = (w: number) => { strokeWidthRef.current = w; setStrokeWidthState(w); };

  // PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (e) => {
        const { locationX: x, locationY: y } = e.nativeEvent;
        const t = toolRef.current;
        const c = colorRef.current;
        const w = strokeWidthRef.current;
        if (t === "pen") {
          setCurrentAnnotation({ type: "pen", points: [{ x, y }], color: c, strokeWidth: w });
        } else if (t === "circle") {
          setCurrentAnnotation({ type: "circle", cx: x, cy: y, r: 0, color: c, strokeWidth: w });
        } else if (t === "arrow") {
          setCurrentAnnotation({ type: "arrow", x1: x, y1: y, x2: x, y2: y, color: c, strokeWidth: w });
        }
      },

      onPanResponderMove: (e) => {
        const { locationX: x, locationY: y } = e.nativeEvent;
        setCurrentAnnotation((prev) => {
          if (!prev) return prev;
          if (prev.type === "pen") {
            return { ...prev, points: [...prev.points, { x, y }] };
          }
          if (prev.type === "circle") {
            const dx = x - prev.cx;
            const dy = y - prev.cy;
            return { ...prev, r: Math.sqrt(dx * dx + dy * dy) };
          }
          if (prev.type === "arrow") {
            return { ...prev, x2: x, y2: y };
          }
          return prev;
        });
      },

      onPanResponderRelease: () => {
        setCurrentAnnotation((prev) => {
          if (prev) setAnnotations((a) => [...a, prev]);
          return null;
        });
      },
    })
  ).current;

  const handleUndo = () => setAnnotations((prev) => prev.slice(0, -1));
  const handleClear = () => { setAnnotations([]); setCurrentAnnotation(null); };

  const handleSave = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Not available", "Save to gallery is not available on web.");
      return;
    }
    setSaving(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Allow photo library access to save annotated photos.");
        return;
      }
      const captured = await captureRef(canvasRef, { format: "jpg", quality: 0.9 });
      await MediaLibrary.saveToLibraryAsync(captured);
      Alert.alert("Saved ✓", "Annotated photo saved to your gallery.");
    } catch {
      Alert.alert("Error", "Could not save photo.");
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    try {
      let shareUri = photoUri;
      if (Platform.OS !== "web") {
        shareUri = await captureRef(canvasRef, { format: "jpg", quality: 0.9 });
      }
      await Share.share({
        message: "Hive comb photo for mentor review 🐝",
        url: shareUri,
        title: "Annotated Hive Photo",
      });
    } catch {
      Alert.alert("Error", "Could not share photo.");
    }
  };

  const S = makeStyles(theme);

  return (
    <SafeAreaView style={S.page}>
      <NavBar />

      {/* Canvas */}
      <View
        ref={canvasRef}
        style={S.canvas}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setCanvasSize({ width, height });
        }}
        {...panResponder.panHandlers}
      >
        <Image source={photoUri} style={S.photo} contentFit="contain" />
        <Svg
          style={StyleSheet.absoluteFill}
          width={canvasSize.width}
          height={canvasSize.height}
        >
          {annotations.map((ann, i) => renderAnnotation(ann, i))}
          {currentAnnotation && renderAnnotation(currentAnnotation, "current")}
        </Svg>
      </View>

      {/* Toolbar */}
      <View style={S.toolbar}>

        {/* Row 1: Tools + Actions */}
        <View style={S.toolRow}>
          <View style={S.toolGroup}>
            {(["pen", "circle", "arrow"] as Tool[]).map((t) => (
              <Pressable
                key={t}
                onPress={() => setTool(t)}
                style={[S.toolButton, tool === t && S.toolButtonActive]}
              >
                <Text style={S.toolButtonText}>
                  {t === "pen" ? "🖊️" : t === "circle" ? "⭕" : "➡️"}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={S.toolGroup}>
            <Pressable onPress={handleUndo} style={S.actionButton}>
              <Text style={S.actionButtonText}>↩️</Text>
            </Pressable>
            <Pressable onPress={handleClear} style={S.actionButton}>
              <Text style={S.actionButtonText}>🗑️</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={[S.actionButton, saving && S.disabledButton]}
            >
              <Text style={S.actionButtonText}>💾</Text>
            </Pressable>
            <Pressable onPress={handleShare} style={S.actionButton}>
              <Text style={S.actionButtonText}>📤</Text>
            </Pressable>
          </View>
        </View>

        {/* Row 2: Colors + Stroke widths */}
        <View style={S.toolRow}>
          <View style={S.colorGroup}>
            {COLORS.map((c) => (
              <Pressable
                key={c.value}
                onPress={() => setColor(c.value)}
                style={[
                  S.colorDot,
                  { backgroundColor: c.value },
                  color === c.value && S.colorDotSelected,
                ]}
              />
            ))}
          </View>

          <View style={S.widthGroup}>
            {WIDTHS.map((w) => (
              <Pressable
                key={w}
                onPress={() => setStrokeWidth(w)}
                style={[S.widthButton, strokeWidth === w && S.widthButtonActive]}
              >
                <View style={[S.widthLine, { height: w, backgroundColor: color }]} />
              </Pressable>
            ))}
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function makeStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: "#000" },
    canvas: { flex: 1, position: "relative" },
    photo: { width: "100%", height: "100%" },
    toolbar: {
      backgroundColor: theme.bgCard,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingVertical: 10,
      paddingHorizontal: theme.spaceMD,
      gap: 10,
    },
    toolRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    toolGroup: { flexDirection: "row", gap: 8 },
    toolButton: {
      width: 44, height: 44,
      borderRadius: theme.radiusSM,
      backgroundColor: theme.bgCardAlt,
      borderWidth: 1, borderColor: theme.border,
      justifyContent: "center", alignItems: "center",
    },
    toolButtonActive: {
      borderColor: theme.honey,
      backgroundColor: theme.bgCardAlt,
    },
    toolButtonText: { fontSize: 20 },
    actionButton: {
      width: 44, height: 44,
      borderRadius: theme.radiusSM,
      backgroundColor: theme.bgCardAlt,
      borderWidth: 1, borderColor: theme.border,
      justifyContent: "center", alignItems: "center",
    },
    disabledButton: { opacity: 0.5 },
    actionButtonText: { fontSize: 20 },
    colorGroup: { flexDirection: "row", gap: 8, alignItems: "center" },
    colorDot: {
      width: 28, height: 28,
      borderRadius: 14,
      borderWidth: 2, borderColor: "transparent",
    },
    colorDotSelected: { borderColor: theme.honey, transform: [{ scale: 1.2 }] },
    widthGroup: { flexDirection: "row", gap: 8, alignItems: "center" },
    widthButton: {
      width: 44, height: 36,
      borderRadius: theme.radiusSM,
      backgroundColor: theme.bgCardAlt,
      borderWidth: 1, borderColor: theme.border,
      justifyContent: "center", alignItems: "center",
      paddingHorizontal: 8,
    },
    widthButtonActive: { borderColor: theme.honey },
    widthLine: { width: "100%", borderRadius: 4 },
  });
}

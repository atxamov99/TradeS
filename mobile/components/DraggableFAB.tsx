import { useRef } from "react";
import { Animated, PanResponder, View, Dimensions, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width: W, height: H } = Dimensions.get("window");
const SIZE = 58;
const MARGIN = 20;
const DRAG_THRESHOLD = 6;

interface Props {
  onPress: () => void;
  color: string;
  bottomOffset?: number;
}

export function DraggableFAB({ onPress, color, bottomOffset = 100 }: Props) {
  const pan = useRef(new Animated.ValueXY({ x: W - SIZE - MARGIN, y: H - SIZE - bottomOffset })).current;
  const lastPos = useRef({ x: W - SIZE - MARGIN, y: H - SIZE - bottomOffset });
  const hasDragged = useRef(false);
  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > DRAG_THRESHOLD || Math.abs(g.dy) > DRAG_THRESHOLD,

      onPanResponderGrant: () => {
        hasDragged.current = false;
        pan.stopAnimation();
        pan.setOffset({ x: lastPos.current.x, y: lastPos.current.y });
        pan.setValue({ x: 0, y: 0 });
      },

      onPanResponderMove: (_, g) => {
        if (Math.abs(g.dx) > DRAG_THRESHOLD || Math.abs(g.dy) > DRAG_THRESHOLD) {
          hasDragged.current = true;
        }
        Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(_, g);
      },

      onPanResponderRelease: (_, g) => {
        pan.flattenOffset();

        if (!hasDragged.current) {
          onPressRef.current();
          return;
        }

        let x = lastPos.current.x + g.dx;
        let y = lastPos.current.y + g.dy;
        x = Math.max(MARGIN, Math.min(W - SIZE - MARGIN, x));
        y = Math.max(80, Math.min(H - SIZE - 80, y));
        const snapX = x < W / 2 ? MARGIN : W - SIZE - MARGIN;

        Animated.spring(pan, {
          toValue: { x: snapX, y },
          useNativeDriver: false,
          bounciness: 6,
        }).start();

        lastPos.current = { x: snapX, y };
      },

      onPanResponderTerminate: () => {
        hasDragged.current = false;
      },
    })
  ).current;

  return (
    <Animated.View
      style={[styles.fab, { backgroundColor: color, transform: pan.getTranslateTransform() }]}
      {...panResponder.panHandlers}
    >
      <View style={styles.inner}>
        <Ionicons name="add" size={30} color="#fff" />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    top: 0,
    left: 0,
  },
  inner: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
});

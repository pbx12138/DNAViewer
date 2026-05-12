// ============================================================
// 圆形质粒图谱组件
// ============================================================

import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle, Path, Line, Text as SvgText, G, Defs } from 'react-native-svg';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useSequenceStore } from '../../store/sequence-store';
import { FEATURE_COLORS, FEATURE_TYPE_LABELS, FeatureType } from '../../types';
import type { Feature, RestrictionSite } from '../../types';

/** 图谱尺寸 */
const MAP_SIZE = 300;
const CENTER = MAP_SIZE / 2;
const RADIUS = 110;
const FEATURE_RADIUS = 85;
const ENZYME_RADIUS = 120;
const TICK_RADIUS_OUTER = 130;
const TICK_RADIUS_INNER = 125;

/** 将角度转换为弧度 */
function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** 计算圆弧路径 */
function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

/** 极坐标转笛卡尔坐标 */
function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number
): { x: number; y: number } {
  const rad = degToRad(angleDeg - 90); // -90 使 0 度在顶部
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

/** 特征弧段组件 */
function FeatureArc({
  feature,
  seqLength,
  isSelected,
  onPress,
}: {
  feature: Feature;
  seqLength: number;
  isSelected: boolean;
  onPress: () => void;
}) {
  const startAngle = (feature.start / seqLength) * 360;
  const endAngle = (feature.end / seqLength) * 360;
  const color = feature.color || FEATURE_COLORS[feature.type] || '#607D8B';

  const midAngle = (startAngle + endAngle) / 2;
  const labelPos = polarToCartesian(CENTER, CENTER, FEATURE_RADIUS - 15, midAngle);

  const arcPath = describeArc(CENTER, CENTER, FEATURE_RADIUS, startAngle, endAngle);
  const strokeWidth = isSelected ? 14 : 10;

  return (
    <G onPress={onPress}>
      <Path
        d={arcPath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        opacity={isSelected ? 1 : 0.8}
        strokeLinecap="round"
      />
      {/* 特征名称标签 */}
      {endAngle - startAngle > 15 && (
        <SvgText
          x={labelPos.x}
          y={labelPos.y}
          fontSize={8}
          fill="#333"
          textAnchor="middle"
          rotation={midAngle > 90 && midAngle < 270 ? midAngle + 180 : midAngle}
        >
          {feature.name.length > 10 ? feature.name.substring(0, 10) + '..' : feature.name}
        </SvgText>
      )}
    </G>
  );
}

/** 酶切位点标记组件 */
function EnzymeMarker({
  site,
  seqLength,
  isSelected,
  onPress,
}: {
  site: RestrictionSite;
  seqLength: number;
  isSelected: boolean;
  onPress: () => void;
}) {
  const angle = (site.position / seqLength) * 360;
  const outerPos = polarToCartesian(CENTER, CENTER, ENZYME_RADIUS, angle);
  const innerPos = polarToCartesian(CENTER, CENTER, ENZYME_RADIUS - 8, angle);

  return (
    <G onPress={onPress}>
      <Line
        x1={innerPos.x}
        y1={innerPos.y}
        x2={outerPos.x}
        y2={outerPos.y}
        stroke={isSelected ? '#D32F2F' : '#F44336'}
        strokeWidth={isSelected ? 3 : 2}
      />
      <Circle
        cx={outerPos.x}
        cy={outerPos.y}
        r={isSelected ? 4 : 3}
        fill={isSelected ? '#D32F2F' : '#F44336'}
      />
    </G>
  );
}

/** 圆形质粒图谱主组件 */
const CircularMap: React.FC = () => {
  const currentSequence = useSequenceStore((s) => s.currentSequence);
  const viewState = useSequenceStore((s) => s.viewState);
  const analysisResult = useSequenceStore((s) => s.analysisResult);
  const selectFeature = useSequenceStore((s) => s.selectFeature);
  const selectEnzyme = useSequenceStore((s) => s.selectEnzyme);
  const setZoom = useSequenceStore((s) => s.setZoom);
  const setPan = useSequenceStore((s) => s.setPan);

  const scale = useSharedValue(1);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch().onUpdate((e) => {
    scale.value = e.scale;
  }).onEnd(() => {
    const newZoom = Math.max(0.3, Math.min(5, viewState.zoom * scale.value));
    scale.value = 1;
    setZoom(newZoom);
  });

  const panGesture = Gesture.Pan().onUpdate((e) => {
    offsetX.value = e.translationX;
    offsetY.value = e.translationY;
  }).onEnd(() => {
    setPan(viewState.panX + offsetX.value, viewState.panY + offsetY.value);
    offsetX.value = 0;
    offsetY.value = 0;
  });

  const composedGesture = Gesture.Race(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value },
      { translateY: offsetY.value },
      { scale: scale.value },
    ],
  }));

  // 刻度线
  const ticks = useMemo(() => {
    if (!currentSequence) return [];
    const seqLen = currentSequence.sequence.length;
    const tickCount = Math.min(36, seqLen);
    const tickInterval = seqLen / tickCount;
    return Array.from({ length: tickCount }, (_, i) => {
      const angle = (i * tickInterval / seqLen) * 360;
      const outer = polarToCartesian(CENTER, CENTER, TICK_RADIUS_OUTER, angle);
      const inner = polarToCartesian(CENTER, CENTER, TICK_RADIUS_INNER, angle);
      const isMajor = i % 9 === 0;
      return { outer, inner, angle, isMajor, position: Math.round(i * tickInterval) };
    });
  }, [currentSequence]);

  if (!currentSequence) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>暂无序列数据</Text>
      </View>
    );
  }

  const seqLength = currentSequence.sequence.length;

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.mapContainer, animatedStyle]}>
          <Svg width={MAP_SIZE} height={MAP_SIZE} viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}>
            <Defs>
              {/* 可在此添加渐变等定义 */}
            </Defs>

            {/* 背景圆 */}
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke="#E0E0E0"
              strokeWidth={2}
            />

            {/* 刻度线 */}
            {ticks.map((tick, i) => (
              <G key={`tick_${i}`}>
                <Line
                  x1={tick.inner.x}
                  y1={tick.inner.y}
                  x2={tick.outer.x}
                  y2={tick.outer.y}
                  stroke={tick.isMajor ? '#666' : '#BBB'}
                  strokeWidth={tick.isMajor ? 1.5 : 0.8}
                />
                {tick.isMajor && (
                  <SvgText
                    x={polarToCartesian(CENTER, CENTER, TICK_RADIUS_OUTER + 12, tick.angle).x}
                    y={polarToCartesian(CENTER, CENTER, TICK_RADIUS_OUTER + 12, tick.angle).y}
                    fontSize={7}
                    fill="#666"
                    textAnchor="middle"
                  >
                    {tick.position}bp
                  </SvgText>
                )}
              </G>
            ))}

            {/* 特征弧段 */}
            {viewState.showFeatures &&
              currentSequence.features.map((feature) => (
                <FeatureArc
                  key={feature.id}
                  feature={feature}
                  seqLength={seqLength}
                  isSelected={viewState.selectedFeatureId === feature.id}
                  onPress={() =>
                    selectFeature(
                      viewState.selectedFeatureId === feature.id ? null : feature.id
                    )
                  }
                />
              ))}

            {/* 酶切位点标记 */}
            {viewState.showEnzymes &&
              analysisResult?.restrictionSites
                ?.slice(0, 50)
                .map((site, i) => (
                  <EnzymeMarker
                    key={`enzyme_${i}`}
                    site={site}
                    seqLength={seqLength}
                    isSelected={viewState.selectedEnzymeName === site.enzyme.name}
                    onPress={() =>
                      selectEnzyme(
                        viewState.selectedEnzymeName === site.enzyme.name
                          ? null
                          : site.enzyme.name
                      )
                    }
                  />
                ))}

            {/* 中心信息 */}
            <SvgText
              x={CENTER}
              y={CENTER - 15}
              fontSize={12}
              fill="#333"
              textAnchor="middle"
              fontWeight="bold"
            >
              {currentSequence.name.length > 15
                ? currentSequence.name.substring(0, 15) + '..'
                : currentSequence.name}
            </SvgText>
            <SvgText
              x={CENTER}
              y={CENTER + 5}
              fontSize={10}
              fill="#666"
              textAnchor="middle"
            >
              {seqLength.toLocaleString()} bp
            </SvgText>
            <SvgText
              x={CENTER}
              y={CENTER + 20}
              fontSize={9}
              fill="#999"
              textAnchor="middle"
            >
              {currentSequence.isCircular ? '环形' : '线性'}
            </SvgText>
          </Svg>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  mapContainer: {
    width: MAP_SIZE,
    height: MAP_SIZE,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default CircularMap;

// ============================================================
// 线性序列视图组件
// ============================================================

import React, { useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSequenceStore } from '../../store/sequence-store';
import { getComplementSequence, translateDNA } from '../../core/sequence/dna-utils';
import { FEATURE_COLORS } from '../../types';
import type { Feature } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASES_PER_LINE = 60;
const BASE_WIDTH = 10;
const LINE_HEIGHT = 22;

/** 特征高亮颜色组件 */
function FeatureHighlight({
  feature,
  seqLength,
  lineStart,
  lineEnd,
}: {
  feature: Feature;
  seqLength: number;
  lineStart: number;
  lineEnd: number;
}) {
  // 计算特征在当前行的可见范围
  const visStart = Math.max(feature.start, lineStart);
  const visEnd = Math.min(feature.end, lineEnd);

  if (visStart >= visEnd) return null;

  const color = feature.color || FEATURE_COLORS[feature.type] || '#607D8B';
  const left = (visStart - lineStart) * BASE_WIDTH;
  const highlightWidth = (visEnd - visStart) * BASE_WIDTH;

  return (
    <View
      style={[
        styles.featureHighlight,
        {
          left,
          width: highlightWidth,
          backgroundColor: color,
        },
      ]}
    />
  );
}

/** 序列行组件 */
function SequenceLine({
  lineIndex,
  sequence,
  complement,
  translation,
  features,
  seqLength,
  showComplement,
  showTranslation,
  selectedFeatureId,
  onSelectFeature,
}: {
  lineIndex: number;
  sequence: string;
  complement: string;
  translation: string;
  features: Feature[];
  seqLength: number;
  showComplement: boolean;
  showTranslation: boolean;
  selectedFeatureId: string | null;
  onSelectFeature: (id: string | null) => void;
}) {
  const lineStart = lineIndex * BASES_PER_LINE;
  const lineEnd = Math.min(lineStart + BASES_PER_LINE, seqLength);
  const seqLine = sequence.substring(lineStart, lineEnd);
  const compLine = complement.substring(lineStart, lineEnd);
  const transLine = translation.substring(Math.floor(lineStart / 3), Math.floor(lineEnd / 3) + 1);

  // 当前行的特征
  const lineFeatures = features.filter(
    (f) => f.start < lineEnd && f.end > lineStart
  );

  return (
    <View style={styles.lineContainer}>
      {/* 特征高亮条 */}
      <View style={styles.highlightRow}>
        {lineFeatures.map((f) => (
          <FeatureHighlight
            key={f.id}
            feature={f}
            seqLength={seqLength}
            lineStart={lineStart}
            lineEnd={lineEnd}
          />
        ))}
      </View>

      {/* 翻译行 */}
      {showTranslation && (
        <View style={styles.translationRow}>
          <Text style={styles.lineNumber} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Text style={styles.translationText}>{transLine}</Text>
          </ScrollView>
        </View>
      )}

      {/* 正义链 */}
      <View style={styles.sequenceRow}>
        <Text style={styles.lineNumber}>{String(lineStart + 1).padStart(5, ' ')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Text style={styles.sequenceText}>{seqLine}</Text>
        </ScrollView>
      </View>

      {/* 互补链 */}
      {showComplement && (
        <View style={styles.sequenceRow}>
          <Text style={styles.lineNumber} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Text style={styles.complementText}>{compLine}</Text>
          </ScrollView>
        </View>
      )}

      {/* 特征标签 */}
      {lineFeatures.length > 0 && (
        <View style={styles.featureLabelRow}>
          {lineFeatures.map((f) => (
            <TouchableOpacity
              key={f.id}
              onPress={() =>
                onSelectFeature(selectedFeatureId === f.id ? null : f.id)
              }
              style={[
                styles.featureLabel,
                {
                  backgroundColor:
                    f.color || FEATURE_COLORS[f.type] || '#607D8B',
                },
              ]}
            >
              <Text style={styles.featureLabelText} numberOfLines={1}>
                {f.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.separator} />
    </View>
  );
}

/** 线性序列视图主组件 */
const LinearSequence: React.FC = () => {
  const currentSequence = useSequenceStore((s) => s.currentSequence);
  const viewState = useSequenceStore((s) => s.viewState);
  const selectFeature = useSequenceStore((s) => s.selectFeature);
  const scrollViewRef = useRef<ScrollView>(null);

  const { complement, translation, lineCount } = useMemo(() => {
    if (!currentSequence) {
      return { complement: '', translation: '', lineCount: 0 };
    }
    const seq = currentSequence.sequence;
    const comp = getComplementSequence(seq);
    const trans = translateDNA(seq);
    const lines = Math.ceil(seq.length / BASES_PER_LINE);
    return { complement: comp, translation: trans, lineCount: lines };
  }, [currentSequence]);

  if (!currentSequence) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>暂无序列数据</Text>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* 序列信息头 */}
      <View style={styles.header}>
        <Text style={styles.headerName}>{currentSequence.name}</Text>
        <Text style={styles.headerInfo}>
          {currentSequence.sequence.length.toLocaleString()} bp |{' '}
          {currentSequence.isCircular ? '环形' : '线性'} |{' '}
          {currentSequence.features.length} 个特征
        </Text>
      </View>

      {/* 序列行 */}
      {Array.from({ length: lineCount }, (_, i) => (
        <SequenceLine
          key={i}
          lineIndex={i}
          sequence={currentSequence.sequence}
          complement={complement}
          translation={translation}
          features={currentSequence.features}
          seqLength={currentSequence.sequence.length}
          showComplement={viewState.showComplement}
          showTranslation={viewState.showTranslation}
          selectedFeatureId={viewState.selectedFeatureId}
          onSelectFeature={selectFeature}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  contentContainer: {
    paddingHorizontal: 8,
    paddingBottom: 40,
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
  header: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 8,
  },
  headerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  headerInfo: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  lineContainer: {
    marginBottom: 4,
  },
  highlightRow: {
    height: 4,
    position: 'relative',
    marginLeft: 40,
  },
  featureHighlight: {
    position: 'absolute',
    height: 4,
    opacity: 0.6,
    borderRadius: 2,
  },
  sequenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  translationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lineNumber: {
    width: 40,
    fontSize: 9,
    color: '#999',
    fontFamily: 'monospace',
    textAlign: 'right',
    marginRight: 8,
  },
  sequenceText: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#1a237e',
    letterSpacing: 1,
  },
  complementText: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#b71c1c',
    letterSpacing: 1,
  },
  translationText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#2E7D32',
    letterSpacing: 1.5,
  },
  featureLabelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 40,
    marginTop: 2,
    gap: 4,
  },
  featureLabel: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
  },
  featureLabelText: {
    fontSize: 9,
    color: '#FFF',
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginTop: 4,
  },
});

export default LinearSequence;

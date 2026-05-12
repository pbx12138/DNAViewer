// ============================================================
// 分析页面 - 序列分析结果展示
// ============================================================

import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { AnalysisScreenProps } from '../types/navigation';
import { useSequenceStore } from '../store/sequence-store';
import { FEATURE_TYPE_LABELS } from '../types';

/** 信息卡片组件 */
function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.cardContent}>{children}</View>
    </View>
  );
}

/** 信息行组件 */
function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

/** GC 含量进度条 */
function GCBar({ gcContent }: { gcContent: number }) {
  return (
    <View style={styles.gcBarContainer}>
      <View style={styles.gcBarBackground}>
        <View
          style={[styles.gcBarFill, { width: `${Math.min(gcContent, 100)}%` }]}
        />
      </View>
      <Text style={styles.gcBarText}>{gcContent.toFixed(1)}%</Text>
    </View>
  );
}

/** 核苷酸组成饼图（简化为条形图） */
function NucleotideComposition({
  composition,
  total,
}: {
  composition: { a: number; t: number; g: number; c: number; other: number };
  total: number;
}) {
  const bases = [
    { label: 'A', count: composition.a, color: '#4CAF50' },
    { label: 'T', count: composition.t, color: '#F44336' },
    { label: 'G', count: composition.g, color: '#2196F3' },
    { label: 'C', count: composition.c, color: '#FF9800' },
  ];

  return (
    <View style={styles.compositionContainer}>
      {bases.map((base) => {
        const pct = total > 0 ? ((base.count / total) * 100).toFixed(1) : '0.0';
        return (
          <View key={base.label} style={styles.compositionRow}>
            <Text
              style={[styles.compositionLabel, { color: base.color }]}
            >
              {base.label}
            </Text>
            <View style={styles.compositionBarBackground}>
              <View
                style={[
                  styles.compositionBarFill,
                  {
                    width: `${Math.min(parseFloat(pct), 100)}%`,
                    backgroundColor: base.color,
                  },
                ]}
              />
            </View>
            <Text style={styles.compositionValue}>
              {base.count.toLocaleString()} ({pct}%)
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/** ORF 列表项 */
function ORFItem({ orf, index }: { orf: { id: string; start: number; end: number; frame: number; strand: string; length: number; protein: string; startCodon: string; endCodon: string }; index: number }) {
  return (
    <View style={styles.orfItem}>
      <View style={styles.orfHeader}>
        <Text style={styles.orfIndex}>ORF {index + 1}</Text>
        <Text style={styles.orfStrand}>
          {orf.strand === 'forward' ? '正链' : '反链'} Frame {Math.abs(orf.frame)}
        </Text>
      </View>
      <View style={styles.orfDetails}>
        <Text style={styles.orfPosition}>
          {orf.start + 1}..{orf.end}
        </Text>
        <Text style={styles.orfLength}>{orf.length} bp</Text>
        <Text style={styles.orfProtein} numberOfLines={1}>
          {orf.protein.substring(0, 50)}
          {orf.protein.length > 50 ? '...' : ''}
        </Text>
      </View>
    </View>
  );
}

/** 重复序列项 */
function RepeatItem({ repeat, index }: { repeat: { sequence: string; positions: number[]; length: number; type: string }; index: number }) {
  const typeLabel =
    repeat.type === 'direct'
      ? '正向重复'
      : repeat.type === 'inverted'
        ? '反向重复'
        : '串联重复';

  return (
    <View style={styles.repeatItem}>
      <View style={styles.repeatHeader}>
        <Text style={styles.repeatIndex}>重复 {index + 1}</Text>
        <Text style={styles.repeatType}>{typeLabel}</Text>
      </View>
      <Text style={styles.repeatSequence} numberOfLines={1}>
        {repeat.sequence}
      </Text>
      <Text style={styles.repeatPositions}>
        {repeat.positions.length} 次 | {repeat.length} bp
      </Text>
    </View>
  );
}

const AnalysisScreen: React.FC<AnalysisScreenProps> = () => {
  const navigation = useNavigation<AnalysisScreenProps['navigation']>();
  const currentSequence = useSequenceStore((s) => s.currentSequence);
  const analysisResult = useSequenceStore((s) => s.analysisResult);
  const runAnalysis = useSequenceStore((s) => s.runAnalysis);

  // 自动运行分析
  useEffect(() => {
    if (currentSequence && !analysisResult) {
      runAnalysis();
    }
  }, [currentSequence, analysisResult, runAnalysis]);

  if (!currentSequence) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无序列数据</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.backButtonText}>返回首页</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!analysisResult) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.loadingText}>正在分析序列...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 顶部栏 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBack}
        >
          <Text style={styles.headerBackText}>返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>序列分析</Text>
        <TouchableOpacity onPress={runAnalysis} style={styles.headerRefresh}>
          <Text style={styles.headerRefreshText}>刷新</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 基本信息 */}
        <InfoCard title="基本信息">
          <InfoRow label="序列名称" value={currentSequence.name} />
          <InfoRow label="序列长度" value={`${analysisResult.length.toLocaleString()} bp`} />
          <InfoRow label="序列类型" value={currentSequence.isCircular ? '环形' : '线性'} />
          <InfoRow label="特征数量" value={`${currentSequence.features.length} 个`} />
        </InfoCard>

        {/* GC 含量 */}
        <InfoCard title="GC 含量">
          <GCBar gcContent={analysisResult.gcContent} />
          <View style={styles.gcInfo}>
            <InfoRow label="AT 含量" value={`${(100 - analysisResult.gcContent).toFixed(1)}%`} />
            <InfoRow label="GC/AT 比值" value={
              (100 - analysisResult.gcContent) > 0
                ? (analysisResult.gcContent / (100 - analysisResult.gcContent)).toFixed(2)
                : 'N/A'
            } />
          </View>
        </InfoCard>

        {/* 分子特性 */}
        <InfoCard title="分子特性">
          <InfoRow
            label="分子量"
            value={`${analysisResult.molecularWeight.toLocaleString()} Da`}
          />
          <InfoRow label="Tm 值 (NN法)" value={`${analysisResult.tm} °C`} />
        </InfoCard>

        {/* 核苷酸组成 */}
        <InfoCard title="核苷酸组成">
          <NucleotideComposition
            composition={analysisResult.nucleotideComposition}
            total={analysisResult.length}
          />
        </InfoCard>

        {/* ORF 列表 */}
        <InfoCard title={`开放阅读框 (${analysisResult.orfs.length} 个)`}>
          {analysisResult.orfs.length === 0 ? (
            <Text style={styles.noDataText}>未找到符合条件的 ORF</Text>
          ) : (
            analysisResult.orfs.slice(0, 20).map((orf, i) => (
              <ORFItem key={orf.id} orf={orf} index={i} />
            ))
          )}
          {analysisResult.orfs.length > 20 && (
            <Text style={styles.moreText}>
              还有 {analysisResult.orfs.length - 20} 个 ORF 未显示
            </Text>
          )}
        </InfoCard>

        {/* 重复序列 */}
        <InfoCard title={`重复序列 (${analysisResult.repeats.length} 个)`}>
          {analysisResult.repeats.length === 0 ? (
            <Text style={styles.noDataText}>未找到重复序列</Text>
          ) : (
            analysisResult.repeats.slice(0, 15).map((repeat, i) => (
              <RepeatItem key={`repeat_${i}`} repeat={repeat} index={i} />
            ))
          )}
          {analysisResult.repeats.length > 15 && (
            <Text style={styles.moreText}>
              还有 {analysisResult.repeats.length - 15} 个重复序列未显示
            </Text>
          )}
        </InfoCard>

        {/* 发夹结构 */}
        <InfoCard title={`发夹结构 (${analysisResult.hairpins.length} 个)`}>
          {analysisResult.hairpins.length === 0 ? (
            <Text style={styles.noDataText}>未预测到发夹结构</Text>
          ) : (
            analysisResult.hairpins.slice(0, 10).map((hp, i) => (
              <View key={`hp_${i}`} style={styles.hairpinItem}>
                <Text style={styles.hairpinPosition}>
                  位置 {hp.start + 1}..{hp.end}
                </Text>
                <Text style={styles.hairpinDetails}>
                  茎长 {hp.stemLength} bp | 环长 {hp.loopLength} bp | 稳定性{' '}
                  {hp.stability}
                </Text>
              </View>
            ))
          )}
        </InfoCard>

        {/* 限制酶切位点统计 */}
        <InfoCard title="限制酶切位点统计">
          <InfoRow
            label="检测到的酶"
            value={`${new Set(analysisResult.restrictionSites.map((s) => s.enzyme.name)).size} 种`}
          />
          <InfoRow
            label="总切点数"
            value={`${analysisResult.restrictionSites.length} 个`}
          />
          <InfoRow
            label="唯一切点酶"
            value={`${new Set(analysisResult.restrictionSites.filter((s) => {
              const count = analysisResult.restrictionSites.filter(
                (ss) => ss.enzyme.name === s.enzyme.name
              ).length;
              return count === 1;
            }).map((s) => s.enzyme.name)).size} 种`}
          />
        </InfoCard>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#1a237e',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#888',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  headerBack: {
    paddingVertical: 4,
  },
  headerBackText: {
    fontSize: 14,
    color: '#1a237e',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRefresh: {
    paddingVertical: 4,
  },
  headerRefreshText: {
    fontSize: 14,
    color: '#1a237e',
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cardContent: {
    padding: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
  },
  infoValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  gcBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  gcBarBackground: {
    flex: 1,
    height: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    marginRight: 12,
    overflow: 'hidden',
  },
  gcBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  gcBarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    minWidth: 50,
    textAlign: 'right',
  },
  gcInfo: {
    marginTop: 4,
  },
  compositionContainer: {
    gap: 8,
  },
  compositionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compositionLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    width: 16,
  },
  compositionBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  compositionBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  compositionValue: {
    fontSize: 11,
    color: '#888',
    minWidth: 90,
    textAlign: 'right',
  },
  orfItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  orfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orfIndex: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  orfStrand: {
    fontSize: 11,
    color: '#1a237e',
    backgroundColor: '#E8EAF6',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  orfDetails: {
    marginTop: 4,
  },
  orfPosition: {
    fontSize: 11,
    color: '#888',
    fontFamily: 'monospace',
  },
  orfLength: {
    fontSize: 11,
    color: '#888',
  },
  orfProtein: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  repeatItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  repeatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  repeatIndex: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  repeatType: {
    fontSize: 11,
    color: '#FF9800',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  repeatSequence: {
    fontSize: 12,
    color: '#1a237e',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  repeatPositions: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  hairpinItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  hairpinPosition: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
  },
  hairpinDetails: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  noDataText: {
    fontSize: 13,
    color: '#BBB',
    textAlign: 'center',
    paddingVertical: 12,
  },
  moreText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 8,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default AnalysisScreen;

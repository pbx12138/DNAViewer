// ============================================================
// 酶切位点列表组件
// ============================================================

import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { useSequenceStore } from '../../store/sequence-store';
import { COMMON_ENZYMES } from '../../core/enzymes/restriction-enzymes';
import { findRestrictionSites, simulateDigest } from '../../core/enzymes/restriction-enzymes';
import type { RestrictionSite, RestrictionEnzyme } from '../../types';

/** 频率标签颜色 */
function getFrequencyColor(count: number): string {
  if (count === 0) return '#E0E0E0';
  if (count === 1) return '#4CAF50';
  if (count <= 3) return '#2196F3';
  if (count <= 6) return '#FF9800';
  return '#F44336';
}

/** 频率标签文字 */
function getFrequencyLabel(count: number): string {
  if (count === 0) return '无';
  if (count === 1) return '唯一切点';
  if (count <= 3) return '稀有';
  if (count <= 6) return '中等';
  return '频繁';
}

/** 酶切位点项组件 */
function EnzymeItem({
  enzymeName,
  sites,
  isSelected,
  onPress,
}: {
  enzymeName: string;
  sites: RestrictionSite[];
  isSelected: boolean;
  onPress: () => void;
}) {
  const enzyme = sites[0]?.enzyme;
  if (!enzyme) return null;

  const freqColor = getFrequencyColor(sites.length);
  const freqLabel = getFrequencyLabel(sites.length);

  return (
    <TouchableOpacity
      style={[styles.itemContainer, isSelected && styles.itemSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.enzymeName}>{enzymeName}</Text>
          <View
            style={[styles.frequencyBadge, { backgroundColor: freqColor }]}
          >
            <Text style={styles.frequencyText}>{freqLabel}</Text>
          </View>
        </View>
        <View style={styles.itemDetails}>
          <Text style={styles.recognitionSite} numberOfLines={1}>
            {enzyme.recognitionSite}
          </Text>
          <Text style={styles.cutCount}>{sites.length} 个切点</Text>
        </View>
        {/* 切点位置列表 */}
        {isSelected && (
          <View style={styles.positionsContainer}>
            {sites.map((site, i) => (
              <Text key={i} style={styles.positionText}>
                位置 {site.position + 1} : {site.sequence}
              </Text>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

/** 酶切模拟结果组件 */
function DigestResult({
  fragments,
  visible,
  onClose,
}: {
  fragments: { start: number; end: number; length: number; sequence: string }[];
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>酶切模拟结果</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>关闭</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <Text style={styles.fragmentCount}>
              产生 {fragments.length} 个片段：
            </Text>
            {fragments
              .sort((a, b) => b.length - a.length)
              .map((frag, i) => (
                <View key={i} style={styles.fragmentItem}>
                  <Text style={styles.fragmentIndex}>片段 {i + 1}</Text>
                  <Text style={styles.fragmentSize}>
                    {frag.length.toLocaleString()} bp
                  </Text>
                  <Text style={styles.fragmentPosition}>
                    {frag.start + 1} - {frag.end}
                  </Text>
                </View>
              ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/** 酶切位点列表主组件 */
const EnzymeList: React.FC = () => {
  const currentSequence = useSequenceStore((s) => s.currentSequence);
  const viewState = useSequenceStore((s) => s.viewState);
  const analysisResult = useSequenceStore((s) => s.analysisResult);
  const selectEnzyme = useSequenceStore((s) => s.selectEnzyme);
  const [searchText, setSearchText] = useState('');
  const [digestModalVisible, setDigestModalVisible] = useState(false);
  const [digestFragments, setDigestFragments] = useState<
    { start: number; end: number; length: number; sequence: string }[]
  >([]);

  // 按酶分组切点
  const enzymeSitesMap = useMemo(() => {
    if (!currentSequence || !analysisResult?.restrictionSites) {
      return new Map<string, RestrictionSite[]>();
    }

    const map = new Map<string, RestrictionSite[]>();
    const sites = analysisResult.restrictionSites;

    for (const site of sites) {
      const name = site.enzyme.name;
      const existing = map.get(name) || [];
      existing.push(site);
      map.set(name, existing);
    }

    return map;
  }, [currentSequence, analysisResult]);

  // 过滤后的酶列表
  const filteredEnzymes = useMemo(() => {
    let enzymeNames = Array.from(enzymeSitesMap.keys());

    if (searchText.trim()) {
      const query = searchText.toLowerCase();
      enzymeNames = enzymeNames.filter((name) =>
        name.toLowerCase().includes(query)
      );
    }

    return enzymeNames.sort();
  }, [enzymeSitesMap, searchText]);

  // 模拟酶切
  const handleSimulateDigest = useCallback(() => {
    if (!currentSequence) return;
    const result = simulateDigest(
      currentSequence.sequence,
      COMMON_ENZYMES.slice(0, 10), // 使用前 10 个酶模拟
      currentSequence.isCircular
    );
    setDigestFragments(result.fragments);
    setDigestModalVisible(true);
  }, [currentSequence]);

  if (!currentSequence) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>暂无序列数据</Text>
      </View>
    );
  }

  if (!analysisResult?.restrictionSites) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>请先运行分析以获取酶切位点信息</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索酶名称..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
          clearButtonMode="while-editing"
          autoCapitalize="characters"
        />
      </View>

      {/* 统计和操作栏 */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          共 {filteredEnzymes.length} 种酶，
          {analysisResult.restrictionSites.length} 个切点
        </Text>
        <TouchableOpacity
          style={styles.digestButton}
          onPress={handleSimulateDigest}
        >
          <Text style={styles.digestButtonText}>酶切模拟</Text>
        </TouchableOpacity>
      </View>

      {/* 酶列表 */}
      <FlatList
        data={filteredEnzymes}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <EnzymeItem
            enzymeName={item}
            sites={enzymeSitesMap.get(item) || []}
            isSelected={viewState.selectedEnzymeName === item}
            onPress={() =>
              selectEnzyme(
                viewState.selectedEnzymeName === item ? null : item
              )
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.listEmpty}>
            <Text style={styles.listEmptyText}>
              {searchText ? '未找到匹配的酶' : '未检测到酶切位点'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* 酶切模拟结果弹窗 */}
      <DigestResult
        fragments={digestFragments}
        visible={digestModalVisible}
        onClose={() => setDigestModalVisible(false)}
      />
    </View>
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
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  statsText: {
    fontSize: 12,
    color: '#888',
    flex: 1,
  },
  digestButton: {
    backgroundColor: '#1a237e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  digestButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
  itemContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: 12,
    marginBottom: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  itemSelected: {
    borderColor: '#F44336',
    borderWidth: 2,
  },
  itemContent: {
    padding: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  enzymeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  frequencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  frequencyText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '500',
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 12,
  },
  recognitionSite: {
    fontSize: 12,
    color: '#1a237e',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  cutCount: {
    fontSize: 11,
    color: '#888',
  },
  positionsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  positionText: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  listEmpty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  listEmptyText: {
    fontSize: 14,
    color: '#BBB',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 14,
    color: '#1a237e',
    fontWeight: '600',
  },
  modalBody: {
    padding: 16,
  },
  fragmentCount: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    fontWeight: '500',
  },
  fragmentItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  fragmentIndex: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  fragmentSize: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    marginTop: 2,
  },
  fragmentPosition: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
    fontFamily: 'monospace',
  },
});

export default EnzymeList;

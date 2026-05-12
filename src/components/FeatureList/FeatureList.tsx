// ============================================================
// 特征列表组件
// ============================================================

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSequenceStore } from '../../store/sequence-store';
import { FEATURE_COLORS, FEATURE_TYPE_LABELS, FeatureType } from '../../types';
import type { Feature } from '../../types';

/** 特征项组件 */
function FeatureItem({
  feature,
  isSelected,
  onPress,
  onDelete,
}: {
  feature: Feature;
  isSelected: boolean;
  onPress: () => void;
  onDelete: () => void;
}) {
  const color = feature.color || FEATURE_COLORS[feature.type] || '#607D8B';
  const typeLabel = FEATURE_TYPE_LABELS[feature.type] || '其他';
  const strandLabel =
    feature.strand === 'forward' ? '(+)' : feature.strand === 'reverse' ? '(-)' : '(+/-)';
  const length = feature.end - feature.start;

  return (
    <TouchableOpacity
      style={[styles.itemContainer, isSelected && styles.itemSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.colorBar, { backgroundColor: color }]} />
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName} numberOfLines={1}>
            {feature.name}
          </Text>
          <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>删除</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.itemDetails}>
          <Text style={styles.itemType}>{typeLabel}</Text>
          <Text style={styles.itemPosition}>
            {feature.start + 1}..{feature.end} {strandLabel}
          </Text>
          <Text style={styles.itemLength}>{length} bp</Text>
        </View>
        {feature.notes ? (
          <Text style={styles.itemNotes} numberOfLines={2}>
            {feature.notes}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

/** 特征列表主组件 */
const FeatureList: React.FC = () => {
  const currentSequence = useSequenceStore((s) => s.currentSequence);
  const viewState = useSequenceStore((s) => s.viewState);
  const selectFeature = useSequenceStore((s) => s.selectFeature);
  const removeFeature = useSequenceStore((s) => s.removeFeature);
  const [searchText, setSearchText] = useState('');

  const filteredFeatures = useMemo(() => {
    if (!currentSequence) return [];
    let features = [...currentSequence.features];

    if (searchText.trim()) {
      const query = searchText.toLowerCase();
      features = features.filter(
        (f) =>
          f.name.toLowerCase().includes(query) ||
          f.type.toLowerCase().includes(query) ||
          (f.notes && f.notes.toLowerCase().includes(query))
      );
    }

    return features.sort((a, b) => a.start - b.start);
  }, [currentSequence, searchText]);

  if (!currentSequence) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>暂无序列数据</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索特征名称或类型..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
          clearButtonMode="while-editing"
        />
      </View>

      {/* 统计信息 */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          共 {currentSequence.features.length} 个特征
          {searchText ? `，筛选出 ${filteredFeatures.length} 个` : ''}
        </Text>
      </View>

      {/* 特征列表 */}
      <FlatList
        data={filteredFeatures}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FeatureItem
            feature={item}
            isSelected={viewState.selectedFeatureId === item.id}
            onPress={() =>
              selectFeature(
                viewState.selectedFeatureId === item.id ? null : item.id
              )
            }
            onDelete={() => removeFeature(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.listEmpty}>
            <Text style={styles.listEmptyText}>
              {searchText ? '未找到匹配的特征' : '暂无特征注释'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
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
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
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
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  statsText: {
    fontSize: 12,
    color: '#888',
  },
  listContent: {
    paddingBottom: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  itemSelected: {
    borderColor: '#1a237e',
    borderWidth: 2,
  },
  colorBar: {
    width: 4,
    height: '100%',
  },
  itemContent: {
    flex: 1,
    padding: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  deleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#FFEBEE',
  },
  deleteButtonText: {
    fontSize: 11,
    color: '#F44336',
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  itemType: {
    fontSize: 11,
    color: '#666',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  itemPosition: {
    fontSize: 11,
    color: '#888',
    fontFamily: 'monospace',
  },
  itemLength: {
    fontSize: 11,
    color: '#888',
  },
  itemNotes: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  listEmpty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  listEmptyText: {
    fontSize: 14,
    color: '#BBB',
  },
});

export default FeatureList;

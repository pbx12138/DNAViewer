// ============================================================
// 查看器页面 - TabView 四标签：图谱/序列/特征/酶切
// ============================================================

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { useNavigation } from '@react-navigation/native';
import type { ViewerScreenProps } from '../types/navigation';
import { useSequenceStore } from '../store/sequence-store';
import CircularMap from '../components/PlasmidMap/CircularMap';
import LinearSequence from '../components/SequenceView/LinearSequence';
import FeatureList from '../components/FeatureList/FeatureList';
import EnzymeList from '../components/EnzymeList/EnzymeList';

/** 标签页路由 */
const renderScene = SceneMap({
  map: CircularMap,
  sequence: LinearSequence,
  features: FeatureList,
  enzymes: EnzymeList,
});

/** 标签页配置 */
const TAB_ROUTES = [
  { key: 'map', title: '图谱' },
  { key: 'sequence', title: '序列' },
  { key: 'features', title: '特征' },
  { key: 'enzymes', title: '酶切' },
];

const ViewerScreen: React.FC<ViewerScreenProps> = () => {
  const navigation = useNavigation<ViewerScreenProps['navigation']>();
  const currentSequence = useSequenceStore((s) => s.currentSequence);
  const viewState = useSequenceStore((s) => s.viewState);
  const analysisResult = useSequenceStore((s) => s.analysisResult);
  const setActiveTab = useSequenceStore((s) => s.setActiveTab);
  const runAnalysis = useSequenceStore((s) => s.runAnalysis);
  const toggleFeatures = useSequenceStore((s) => s.toggleFeatures);
  const toggleEnzymes = useSequenceStore((s) => s.toggleEnzymes);
  const toggleComplement = useSequenceStore((s) => s.toggleComplement);
  const toggleTranslation = useSequenceStore((s) => s.toggleTranslation);
  const resetView = useSequenceStore((s) => s.resetView);

  // 首次加载时运行分析
  useEffect(() => {
    if (currentSequence && !analysisResult) {
      runAnalysis();
    }
  }, [currentSequence, analysisResult, runAnalysis]);

  // TabView 索引
  const [index, setIndex] = React.useState(viewState.activeTab);

  // 同步 tab 状态
  const handleIndexChange = useCallback(
    (newIndex: number) => {
      setIndex(newIndex);
      setActiveTab(newIndex);
    },
    [setActiveTab]
  );

  // 如果没有序列，返回首页
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 顶部菜单栏 */}
      <View style={styles.menuBar}>
        <TouchableOpacity
          style={styles.menuBackButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.menuBackText}>返回</Text>
        </TouchableOpacity>
        <Text style={styles.menuTitle} numberOfLines={1}>
          {currentSequence.name}
        </Text>
        <TouchableOpacity style={styles.menuButton} onPress={resetView}>
          <Text style={styles.menuButtonText}>重置</Text>
        </TouchableOpacity>
      </View>

      {/* 显示选项栏 */}
      <View style={styles.optionsBar}>
        <TouchableOpacity
          style={[
            styles.optionChip,
            viewState.showFeatures && styles.optionChipActive,
          ]}
          onPress={toggleFeatures}
        >
          <Text
            style={[
              styles.optionChipText,
              viewState.showFeatures && styles.optionChipTextActive,
            ]}
          >
            特征
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.optionChip,
            viewState.showEnzymes && styles.optionChipActive,
          ]}
          onPress={toggleEnzymes}
        >
          <Text
            style={[
              styles.optionChipText,
              viewState.showEnzymes && styles.optionChipTextActive,
            ]}
          >
            酶切
          </Text>
        </TouchableOpacity>
        {index === 1 && (
          <>
            <TouchableOpacity
              style={[
                styles.optionChip,
                viewState.showComplement && styles.optionChipActive,
              ]}
              onPress={toggleComplement}
            >
              <Text
                style={[
                  styles.optionChipText,
                  viewState.showComplement && styles.optionChipTextActive,
                ]}
              >
                互补链
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionChip,
                viewState.showTranslation && styles.optionChipActive,
              ]}
              onPress={toggleTranslation}
            >
              <Text
                style={[
                  styles.optionChipText,
                  viewState.showTranslation && styles.optionChipTextActive,
                ]}
              >
                翻译
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* TabView */}
      <TabView
        navigationState={{ index, routes: TAB_ROUTES }}
        renderScene={renderScene}
        onIndexChange={handleIndexChange}
        initialLayout={{ width: 100 }}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            style={styles.tabBar}
            labelStyle={styles.tabLabel}
            indicatorStyle={styles.tabIndicator}
            activeColor="#1a237e"
            inactiveColor="#999"
          />
        )}
        style={styles.tabView}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
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
  menuBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  menuBackButton: {
    paddingVertical: 4,
  },
  menuBackText: {
    fontSize: 14,
    color: '#1a237e',
    fontWeight: '600',
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  menuButton: {
    paddingVertical: 4,
  },
  menuButtonText: {
    fontSize: 13,
    color: '#1a237e',
  },
  optionsBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  optionChipActive: {
    backgroundColor: '#E8EAF6',
    borderColor: '#1a237e',
  },
  optionChipText: {
    fontSize: 11,
    color: '#888',
  },
  optionChipTextActive: {
    color: '#1a237e',
    fontWeight: '600',
  },
  tabView: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: '#FFF',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabIndicator: {
    backgroundColor: '#1a237e',
    height: 3,
  },
});

export default ViewerScreen;

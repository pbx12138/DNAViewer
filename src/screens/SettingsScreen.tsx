// ============================================================
// 设置页面 - 显示设置、数据管理、关于
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { SettingsScreenProps } from '../types/navigation';
import { useSequenceStore } from '../store/sequence-store';

/** 设置项组件 */
function SettingItem({
  title,
  subtitle,
  onPress,
  rightElement,
}: {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingItemLeft}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle ? (
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
      <View style={styles.settingItemRight}>
        {rightElement || <Text style={styles.settingArrow}>›</Text>}
      </View>
    </TouchableOpacity>
  );
}

/** 设置分组组件 */
function SettingSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

const SettingsScreen: React.FC<SettingsScreenProps> = () => {
  const navigation = useNavigation<SettingsScreenProps['navigation']>();
  const currentSequence = useSequenceStore((s) => s.currentSequence);
  const sequenceHistory = useSequenceStore((s) => s.sequenceHistory);
  const clearAll = useSequenceStore((s) => s.clearAll);
  const undo = useSequenceStore((s) => s.undo);

  const [showComplement, setShowComplement] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showFeatures, setShowFeatures] = useState(true);
  const [showEnzymes, setShowEnzymes] = useState(true);

  /** 清除所有数据 */
  const handleClearData = () => {
    Alert.alert('确认清除', '确定要清除所有序列数据吗？此操作不可撤销。', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定清除',
        style: 'destructive',
        onPress: () => {
          clearAll();
          navigation.navigate('Home');
        },
      },
    ]);
  };

  /** 导出序列 */
  const handleExportSequence = () => {
    if (!currentSequence) {
      Alert.alert('提示', '暂无序列数据可导出');
      return;
    }
    // 在实际应用中，这里会调用 expo-sharing 或 expo-file-system 写入文件
    Alert.alert(
      '导出序列',
      `序列名称：${currentSequence.name}\n长度：${currentSequence.sequence.length} bp\n\n（导出功能需要文件系统权限）`
    );
  };

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
        <Text style={styles.headerTitle}>设置</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 显示设置 */}
        <SettingSection title="显示设置">
          <SettingItem
            title="显示互补链"
            subtitle="在线性序列视图中显示互补链"
            rightElement={
              <Switch
                value={showComplement}
                onValueChange={setShowComplement}
                trackColor={{ false: '#E0E0E0', true: '#1a237e' }}
              />
            }
          />
          <SettingItem
            title="显示蛋白质翻译"
            subtitle="显示三字母氨基酸翻译"
            rightElement={
              <Switch
                value={showTranslation}
                onValueChange={setShowTranslation}
                trackColor={{ false: '#E0E0E0', true: '#1a237e' }}
              />
            }
          />
          <SettingItem
            title="显示特征注释"
            subtitle="在图谱和序列视图中显示特征"
            rightElement={
              <Switch
                value={showFeatures}
                onValueChange={setShowFeatures}
                trackColor={{ false: '#E0E0E0', true: '#1a237e' }}
              />
            }
          />
          <SettingItem
            title="显示酶切位点"
            subtitle="在图谱中显示限制酶切位点"
            rightElement={
              <Switch
                value={showEnzymes}
                onValueChange={setShowEnzymes}
                trackColor={{ false: '#E0E0E0', true: '#1a237e' }}
              />
            }
          />
        </SettingSection>

        {/* 数据管理 */}
        <SettingSection title="数据管理">
          <SettingItem
            title="当前序列"
            subtitle={
              currentSequence
                ? `${currentSequence.name} (${currentSequence.sequence.length} bp)`
                : '无'
            }
            onPress={() => navigation.navigate('Viewer')}
          />
          <SettingItem
            title="历史记录"
            subtitle={`${sequenceHistory.length} 条记录`}
            onPress={() => {
              Alert.alert(
                '历史记录',
                `共有 ${sequenceHistory.length} 条编辑历史记录。\n历史记录按时间倒序排列，最多保留 50 条。`
              );
            }}
          />
          <SettingItem
            title="撤销上一步"
            subtitle="恢复到上一个序列状态"
            onPress={() => {
              if (sequenceHistory.length === 0) {
                Alert.alert('提示', '没有可撤销的操作');
              } else {
                undo();
                Alert.alert('已撤销', '已恢复到上一个状态');
              }
            }}
          />
          <SettingItem
            title="导出序列"
            subtitle="导出当前序列为 FASTA 格式"
            onPress={handleExportSequence}
          />
          <SettingItem
            title="清除所有数据"
            subtitle="删除所有序列和历史记录"
            onPress={handleClearData}
          />
        </SettingSection>

        {/* 分析设置 */}
        <SettingSection title="分析设置">
          <SettingItem
            title="ORF 最小长度"
            subtitle="75 bp（约 25 个氨基酸）"
          />
          <SettingItem
            title="重复序列最小长度"
            subtitle="6 bp"
          />
          <SettingItem
            title="发夹结构最小茎长"
            subtitle="4 bp"
          />
        </SettingSection>

        {/* 关于 */}
        <SettingSection title="关于">
          <SettingItem
            title="应用版本"
            subtitle="DNA 序列查看器 v1.0.0"
          />
          <SettingItem
            title="支持的文件格式"
            subtitle="FASTA、GenBank、纯文本 DNA 序列"
          />
          <SettingItem
            title="限制酶数据库"
            subtitle={`内置 ${40}+ 种常用限制酶`}
          />
          <SettingItem
            title="技术栈"
            subtitle="React Native + Expo + TypeScript"
          />
        </SettingSection>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            DNA 序列查看器 - 专业的 DNA 序列可视化和分析工具
          </Text>
          <Text style={styles.footerSubtext}>
            本应用仅供学习和研究使用
          </Text>
        </View>

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
  headerPlaceholder: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
  },
  sectionContent: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  settingItemLeft: {
    flex: 1,
    marginRight: 12,
  },
  settingItemRight: {
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: 14,
    color: '#333',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  settingArrow: {
    fontSize: 20,
    color: '#CCC',
    fontWeight: '300',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 10,
  },
  footerText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },
  footerSubtext: {
    fontSize: 11,
    color: '#BBB',
    marginTop: 4,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default SettingsScreen;

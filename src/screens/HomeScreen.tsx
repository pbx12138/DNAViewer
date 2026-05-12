// ============================================================
// 首页 - 文件导入和示例序列
// ============================================================

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import type { HomeScreenProps, RootStackParamList } from '../types/navigation';
import { useSequenceStore } from '../store/sequence-store';
import { parseFile } from '../core/parser/file-parser';
import type { DNASequence } from '../types';

/** pUC19 示例序列（部分） */
const PUC19_SEQUENCE = `>pUC19 pUC19 cloning vector
GAGCTCGGTACCCGGGGATCCTCTAGAGTCGACCTGCAGGCATGCAAGCTTGGCGTAATCATGGT
CATAGCTGTTTCCTGTGTGAAATTGTTATCCGCTCACAATTCCACACAACATACGAGCCGGAAGCA
TAAAGTGTAAAGCCTGGGGTGCCTAATGAGTGAGCTAACTCACATTAATTGCGTTGCGCTCACTGC
CCGCTTTCCAGTCGGGAAACCTGTCGTGCCAGCTGCATTAATGAATCGGCCAACGCGCGGGGAGAG
GCGGTTTGCGTATTGGGCGCTCTTCCGCTTCCTCGCTCACTGACTCGCTGCGCTCGGTCGTTCGGC
TGCGGCGAGCGGTATCAGCTCACTCAAAGG`;

/** GFP 示例序列（部分） */
const GFP_SEQUENCE = `>EGFP Enhanced Green Fluorescent Protein
ATGGTGAGCAAGGGCGAGGAGCTGTTCACCGGGGTGGTGCCCATCCTGGTCGAGCTGGACGGCGAC
GTAAACGGCCACAAGTTCAGCGTGTCCGGCGAGGGCGAGGGCGATGCCACCTACGGCAAGCTGACC
CTGAAGTTCATCTGCACCACCGGCAAGCTGCCCGTGCCCTGGCCCACCCTCGTGACCACCCTGACC
TACGGCGTGCAGTGCTTCAGCCGCTACCCCGACCACATGAAGCAGCACGACTTCTTCAAGTCCGCC
ATGCCCGAAGGCTACGTCCAGGAGCGCACCATCTTCTTCAAGGACGACGGCAACTACAAGACCCGCG`;

/** 功能介绍数据 */
const FEATURES = [
  {
    icon: '图谱',
    title: '圆形质粒图谱',
    description: '可视化展示环形 DNA 序列的特征和酶切位点',
  },
  {
    icon: '序列',
    title: '线性序列视图',
    description: '查看正义链、互补链和蛋白质翻译',
  },
  {
    icon: '分析',
    title: '序列分析',
    description: 'GC 含量、分子量、Tm 值、ORF 查找等',
  },
  {
    icon: '酶切',
    title: '限制酶分析',
    description: '支持 40+ 种常用限制酶的切点查找和酶切模拟',
  },
];

/** 加载示例序列 */
function loadExampleSequence(name: string, content: string): DNASequence {
  return parseFile(content, name);
}

const HomeScreen: React.FC<HomeScreenProps> = () => {
  const navigation = useNavigation<HomeScreenProps['navigation']>();
  const setSequence = useSequenceStore((s) => s.setSequence);
  const [loading, setLoading] = useState(false);

  /** 导入文件 */
  const handleImportFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/*', 'application/octet-stream', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      setLoading(true);
      const file = result.assets[0];
      const fileContent = await FileSystem.readAsStringAsync(file.uri);
      const parsed = parseFile(fileContent, file.name);

      setSequence(parsed);
      navigation.navigate('Viewer');
    } catch (error) {
      Alert.alert('导入失败', `无法解析文件：${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [navigation, setSequence]);

  /** 加载示例序列 */
  const handleLoadExample = useCallback(
    (name: string, content: string) => {
      const seq = loadExampleSequence(name, content);
      setSequence(seq);
      navigation.navigate('Viewer');
    },
    [navigation, setSequence]
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 标题区域 */}
        <View style={styles.header}>
          <Text style={styles.title}>DNA 序列查看器</Text>
          <Text style={styles.subtitle}>
            专业的 DNA 序列可视化和分析工具
          </Text>
        </View>

        {/* 导入按钮 */}
        <TouchableOpacity
          style={[styles.importButton, loading && styles.importButtonDisabled]}
          onPress={handleImportFile}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.importButtonText}>
            {loading ? '导入中...' : '导入序列文件'}
          </Text>
          <Text style={styles.importButtonSubtext}>
            支持 FASTA、GenBank、纯文本格式
          </Text>
        </TouchableOpacity>

        {/* 示例序列 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>示例序列</Text>
          <View style={styles.exampleContainer}>
            <TouchableOpacity
              style={styles.exampleButton}
              onPress={() => handleLoadExample('pUC19', PUC19_SEQUENCE)}
              activeOpacity={0.7}
            >
              <Text style={styles.exampleName}>pUC19</Text>
              <Text style={styles.exampleDesc}>常用克隆载体 (2686 bp)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exampleButton}
              onPress={() => handleLoadExample('EGFP', GFP_SEQUENCE)}
              activeOpacity={0.7}
            >
              <Text style={styles.exampleName}>EGFP</Text>
              <Text style={styles.exampleDesc}>
                增强型绿色荧光蛋白 (720 bp)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 功能介绍 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>功能介绍</Text>
          {FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureIconText}>{feature.icon}</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 底部信息 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>DNA 序列查看器 v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  importButton: {
    backgroundColor: '#1a237e',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#1a237e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  importButtonDisabled: {
    opacity: 0.6,
  },
  importButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  importButtonSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 6,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  exampleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  exampleButton: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  exampleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a237e',
  },
  exampleDesc: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
    textAlign: 'center',
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8EAF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureIconText: {
    fontSize: 16,
    color: '#1a237e',
    fontWeight: 'bold',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  featureDesc: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerText: {
    fontSize: 12,
    color: '#BBB',
  },
});

export default HomeScreen;

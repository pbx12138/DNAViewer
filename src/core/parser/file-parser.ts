// ============================================================
// 文件解析器 - 支持 FASTA / GenBank / SnapGene / 纯文本
// ============================================================

import { DNASequence, Feature, FeatureType, FileTypeEnum } from '../../types';
import { normalizeSequence } from '../sequence/dna-utils';

/** GenBank 特征类型到内部类型的映射 */
const GENBANK_FEATURE_MAP: Record<string, FeatureType> = {
  gene: FeatureType.Gene,
  CDS: FeatureType.CDS,
  promoter: FeatureType.Promoter,
  terminator: FeatureType.Terminator,
  RBS: FeatureType.RBS,
  "5'UTR": FeatureType.UTR5,
  "3'UTR": FeatureType.UTR3,
  operator: FeatureType.Operator,
  ori: FeatureType.Origin,
  origin: FeatureType.Origin,
  rep_origin: FeatureType.Origin,
  marker: FeatureType.Marker,
  misc_feature: FeatureType.Misc,
  misc_RNA: FeatureType.Misc,
  regulatory: FeatureType.Misc,
  primer_bind: FeatureType.Misc,
};

/** 特征颜色映射 */
const FEATURE_COLOR_MAP: Record<string, string> = {
  gene: '#4CAF50',
  CDS: '#4CAF50',
  promoter: '#FF9800',
  terminator: '#F44336',
  RBS: '#2196F3',
  "5'UTR": '#9C27B0',
  "3'UTR": '#9C27B0',
  operator: '#FF5722',
  ori: '#00BCD4',
  origin: '#00BCD4',
  rep_origin: '#00BCD4',
  marker: '#FFEB3B',
  misc_feature: '#607D8B',
  misc_RNA: '#607D8B',
  regulatory: '#607D8B',
  primer_bind: '#795548',
};

/** 检测文件类型 */
export function detectFileType(content: string): FileTypeEnum {
  const trimmed = content.trim();

  // FASTA 格式：以 > 开头
  if (trimmed.startsWith('>')) {
    return 'fasta';
  }

  // GenBank 格式：以 LOCUS 开头
  if (trimmed.toUpperCase().startsWith('LOCUS')) {
    return 'genbank';
  }

  // SnapGene 格式：包含 SnapGene 标识
  if (trimmed.includes('SNAPGENE') || trimmed.includes('SnapGene')) {
    return 'snapgene';
  }

  // 尝试检测纯 DNA 序列
  const cleaned = trimmed.replace(/[\s\n\r0-9]/g, '');
  const dnaMatch = cleaned.match(/^[ATGCURYSWKMBDHVNatgcuyswkmbdhvn]+$/);
  if (dnaMatch && dnaMatch[0].length >= 10) {
    return 'text';
  }

  return 'unknown';
}

/** 解析 FASTA 格式 */
export function parseFASTA(content: string): DNASequence {
  const lines = content.trim().split('\n');
  let name = '未命名序列';
  let description = '';
  const seqParts: string[] = [];
  let isHeader = true;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('>')) {
      isHeader = false;
      const header = trimmed.substring(1).trim();
      const spaceIdx = header.indexOf(' ');
      if (spaceIdx !== -1) {
        name = header.substring(0, spaceIdx);
        description = header.substring(spaceIdx + 1).trim();
      } else {
        name = header;
      }
    } else if (trimmed.length > 0 && !isHeader) {
      seqParts.push(trimmed);
    }
  }

  const sequence = normalizeSequence(seqParts.join(''));

  return {
    id: generateId(),
    name,
    description,
    sequence,
    isCircular: false,
    features: [],
    dateCreated: new Date().toISOString(),
    dateModified: new Date().toISOString(),
    fileType: 'fasta',
  };
}

/** 解析 GenBank 格式 */
export function parseGenBank(content: string): DNASequence {
  const lines = content.trim().split('\n');
  let name = '未命名序列';
  let description = '';
  let sequence = '';
  const features: Feature[] = [];
  let isCircular = false;
  let inSequence = false;
  let inFeatures = false;
  let currentFeature: Partial<Feature> | null = null;
  let currentQualifierKey = '';
  let currentQualifierValue = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // LOCUS 行
    if (trimmed.toUpperCase().startsWith('LOCUS')) {
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2) {
        name = parts[1];
      }
      if (trimmed.toLowerCase().includes('circular')) {
        isCircular = true;
      }
    }

    // DESCRIPTION 行
    if (trimmed.toUpperCase().startsWith('DESCRIPTION')) {
      description = trimmed.substring(11).trim();
    }

    // FEATURES 标记
    if (trimmed.toUpperCase().startsWith('FEATURES')) {
      inFeatures = true;
      inSequence = false;
      continue;
    }

    // ORIGIN 标记
    if (trimmed.toUpperCase().startsWith('ORIGIN')) {
      inFeatures = false;
      inSequence = true;
      continue;
    }

    // // 行表示节结束
    if (trimmed === '//') {
      inSequence = false;
      inFeatures = false;
      continue;
    }

    // 解析特征
    if (inFeatures && trimmed.length > 0) {
      // 检查是否为新特征行（以 5 个空格 + 特征类型开头）
      if (/^ {5}\S/.test(line)) {
        // 保存前一个特征
        if (currentFeature && currentFeature.id) {
          features.push(currentFeature as Feature);
        }

        const featureMatch = trimmed.match(/^(\S+)\s+(.+)$/);
        if (featureMatch) {
          const featureType = featureMatch[1];
          const locationStr = featureMatch[2];

          const location = parseGenBankLocation(locationStr);
          currentFeature = {
            id: generateId(),
            name: featureType,
            type: GENBANK_FEATURE_MAP[featureType] || FeatureType.Misc,
            start: location.start,
            end: location.end,
            strand: location.strand,
            color: FEATURE_COLOR_MAP[featureType] || '#607D8B',
            qualifiers: {},
          };
          currentQualifierKey = '';
          currentQualifierValue = '';
        }
      } else if (currentFeature && trimmed.startsWith('/')) {
        // 保存前一个 qualifier
        if (currentQualifierKey && currentQualifierValue) {
          if (currentFeature.qualifiers) {
            currentFeature.qualifiers[currentQualifierKey] = currentQualifierValue;
          }
        }

        // 解析 qualifier
        const qualifierMatch = trimmed.match(/^\/(\w+)=(.*)$/);
        if (qualifierMatch) {
          currentQualifierKey = qualifierMatch[1];
          currentQualifierValue = qualifierMatch[2].replace(/^"/, '').replace(/"$/, '');
        } else {
          const labelMatch = trimmed.match(/^\/(\w+)$/);
          if (labelMatch) {
            currentQualifierKey = labelMatch[1];
            currentQualifierValue = 'true';
          }
        }
      } else if (currentFeature && currentQualifierKey) {
        // qualifier 值续行
        currentQualifierValue += ' ' + trimmed.replace(/"$/, '');
      }
    }

    // 解析序列
    if (inSequence && trimmed.length > 0) {
      const seqOnly = trimmed.replace(/[\s0-9]/g, '');
      sequence += seqOnly;
    }
  }

  // 保存最后一个特征
  if (currentFeature && currentFeature.id) {
    features.push(currentFeature as Feature);
  }

  // 使用 qualifier 中的 label 作为特征名称
  for (const feature of features) {
    if (feature.qualifiers) {
      if (feature.qualifiers.label) {
        feature.name = feature.qualifiers.label;
      } else if (feature.qualifiers.gene) {
        feature.name = feature.qualifiers.gene;
      } else if (feature.qualifiers.product) {
        feature.name = feature.qualifiers.product;
      } else if (feature.qualifiers.note) {
        feature.name = feature.qualifiers.note;
      }
      feature.notes = feature.qualifiers.note || feature.qualifiers.product || '';
    }
  }

  return {
    id: generateId(),
    name,
    description,
    sequence: normalizeSequence(sequence),
    isCircular,
    features,
    dateCreated: new Date().toISOString(),
    dateModified: new Date().toISOString(),
    fileType: 'genbank',
  };
}

/** 解析 GenBank 位置字符串 */
function parseGenBankLocation(location: string): { start: number; end: number; strand: 'forward' | 'reverse' | 'both' } {
  let strand: 'forward' | 'reverse' | 'both' = 'forward';
  let start = 0;
  let end = 0;

  const cleanLoc = location.trim();

  // 检查互补链
  if (cleanLoc.startsWith('complement(')) {
    strand = 'reverse';
    const inner = cleanLoc.replace('complement(', '').replace(')', '');
    const nums = inner.match(/(\d+)/g);
    if (nums && nums.length >= 2) {
      start = parseInt(nums[0], 10) - 1; // 转换为 0-based
      end = parseInt(nums[1], 10);
    }
  } else if (cleanLoc.startsWith('join(')) {
    strand = 'both';
    const inner = cleanLoc.replace('join(', '').replace(')', '');
    const nums = inner.match(/(\d+)/g);
    if (nums && nums.length >= 2) {
      start = parseInt(nums[0], 10) - 1;
      end = parseInt(nums[nums.length - 1], 10);
    }
  } else {
    const nums = cleanLoc.match(/(\d+)/g);
    if (nums && nums.length >= 2) {
      start = parseInt(nums[0], 10) - 1;
      end = parseInt(nums[1], 10);
    } else if (nums && nums.length === 1) {
      start = parseInt(nums[0], 10) - 1;
      end = start + 1;
    }
  }

  return { start, end, strand };
}

/** 解析 SnapGene 格式（简化版，提取 DNA 序列和基本信息） */
export function parseSnapGene(content: string): DNASequence {
  // SnapGene 文件是二进制格式，这里提供简化的文本提取
  // 实际应用中可能需要专门的解析库
  const name = 'SnapGene 序列';
  const sequence = normalizeSequence(content.replace(/[^ATGCURYSWKMBDHVNatgcuyswkmbdhvn]/g, ''));

  return {
    id: generateId(),
    name,
    sequence,
    isCircular: true,
    features: [],
    dateCreated: new Date().toISOString(),
    dateModified: new Date().toISOString(),
    fileType: 'snapgene',
  };
}

/** 解析纯文本序列 */
export function parseTextSequence(content: string): DNASequence {
  const sequence = normalizeSequence(content);

  return {
    id: generateId(),
    name: '文本序列',
    description: `${sequence.length} bp`,
    sequence,
    isCircular: false,
    features: [],
    dateCreated: new Date().toISOString(),
    dateModified: new Date().toISOString(),
    fileType: 'text',
  };
}

/** 通用文件解析入口 */
export function parseFile(content: string, fileName?: string): DNASequence {
  const fileType = detectFileType(content);
  let result: DNASequence;

  switch (fileType) {
    case 'fasta':
      result = parseFASTA(content);
      break;
    case 'genbank':
      result = parseGenBank(content);
      break;
    case 'snapgene':
      result = parseSnapGene(content);
      break;
    case 'text':
      result = parseTextSequence(content);
      break;
    default:
      throw new Error('无法识别的文件格式。支持的格式：FASTA、GenBank、纯文本 DNA 序列。');
  }

  // 使用文件名覆盖序列名
  if (fileName) {
    const baseName = fileName.replace(/\.[^.]+$/, '');
    if (result.name === '未命名序列' || result.name === '文本序列' || result.name === 'SnapGene 序列') {
      result.name = baseName;
    }
  }

  return result;
}

/** 生成唯一 ID */
function generateId(): string {
  return `seq_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

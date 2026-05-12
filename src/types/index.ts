// ============================================================
// 核心类型定义 - DNA 序列查看器
// ============================================================

/** 特征类型枚举 */
export enum FeatureType {
  Gene = 'gene',
  Promoter = 'promoter',
  Terminator = 'terminator',
  RBS = 'rbs',
  CDS = 'cds',
  UTR5 = '5utr',
  UTR3 = '3utr',
  Operator = 'operator',
  Origin = 'origin',
  Marker = 'marker',
  Misc = 'misc',
}

/** 特征颜色映射 */
export const FEATURE_COLORS: Record<FeatureType, string> = {
  [FeatureType.Gene]: '#4CAF50',
  [FeatureType.Promoter]: '#FF9800',
  [FeatureType.Terminator]: '#F44336',
  [FeatureType.RBS]: '#2196F3',
  [FeatureType.CDS]: '#4CAF50',
  [FeatureType.UTR5]: '#9C27B0',
  [FeatureType.UTR3]: '#9C27B0',
  [FeatureType.Operator]: '#FF5722',
  [FeatureType.Origin]: '#00BCD4',
  [FeatureType.Marker]: '#FFEB3B',
  [FeatureType.Misc]: '#607D8B',
};

/** 特征中文名称映射 */
export const FEATURE_TYPE_LABELS: Record<FeatureType, string> = {
  [FeatureType.Gene]: '基因',
  [FeatureType.Promoter]: '启动子',
  [FeatureType.Terminator]: '终止子',
  [FeatureType.RBS]: '核糖体结合位点',
  [FeatureType.CDS]: '编码区',
  [FeatureType.UTR5]: "5'非翻译区",
  [FeatureType.UTR3]: "3'非翻译区",
  [FeatureType.Operator]: '操纵基因',
  [FeatureType.Origin]: '复制起点',
  [FeatureType.Marker]: '标记基因',
  [FeatureType.Misc]: '其他',
};

/** 序列特征 */
export interface Feature {
  id: string;
  name: string;
  type: FeatureType;
  start: number;
  end: number;
  strand: 'forward' | 'reverse' | 'both';
  color?: string;
  notes?: string;
  qualifiers?: Record<string, string>;
}

/** 限制酶 */
export interface RestrictionEnzyme {
  name: string;
  recognitionSite: string;
  cutPosition: number;
  cutPosition2?: number;
  isPalindrome: boolean;
  notes?: string;
}

/** 限制酶切位点 */
export interface RestrictionSite {
  enzyme: RestrictionEnzyme;
  position: number;
  sequence: string;
}

/** 引物 */
export interface Primer {
  id: string;
  name: string;
  sequence: string;
  tm: number;
  gcContent: number;
  length: number;
  position?: number;
  strand: 'forward' | 'reverse';
}

/** 开放阅读框 */
export interface ORF {
  id: string;
  start: number;
  end: number;
  frame: number;
  strand: 'forward' | 'reverse';
  length: number;
  protein: string;
  startCodon: string;
  endCodon: string;
}

/** 重复序列 */
export interface Repeat {
  sequence: string;
  positions: number[];
  length: number;
  type: 'direct' | 'inverted' | 'tandem';
}

/** 发夹结构 */
export interface Hairpin {
  start: number;
  end: number;
  stemLength: number;
  loopLength: number;
  loopSequence: string;
  stability: number;
}

/** 分析结果 */
export interface AnalysisResult {
  gcContent: number;
  molecularWeight: number;
  tm: number;
  length: number;
  orfs: ORF[];
  repeats: Repeat[];
  hairpins: Hairpin[];
  restrictionSites: RestrictionSite[];
  nucleotideComposition: {
    a: number;
    t: number;
    g: number;
    c: number;
    other: number;
  };
}

/** 视图状态 */
export interface ViewState {
  zoom: number;
  panX: number;
  panY: number;
  showFeatures: boolean;
  showEnzymes: boolean;
  showORFs: boolean;
  showComplement: boolean;
  showTranslation: boolean;
  selectedFeatureId: string | null;
  selectedEnzymeName: string | null;
  activeTab: number;
}

/** DNA 序列 */
export interface DNASequence {
  id: string;
  name: string;
  sequence: string;
  description?: string;
  isCircular: boolean;
  features: Feature[];
  dateCreated: string;
  dateModified: string;
  source?: string;
  fileType?: string;
}

/** 文件类型 */
export type FileTypeEnum = 'fasta' | 'genbank' | 'snapgene' | 'text' | 'unknown';

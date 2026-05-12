// ============================================================
// Zustand 状态管理
// ============================================================

import { create } from 'zustand';
import type { DNASequence, Feature, AnalysisResult, ViewState } from '../types';
import {
  calculateGCContent,
  calculateMolecularWeight,
  calculateTmNN,
  findORFs,
  findRepeats,
  predictHairpins,
  normalizeSequence,
} from '../core/sequence/dna-utils';
import { findAllCommonSites } from '../core/enzymes/restriction-enzymes';

/** 历史记录项 */
interface HistoryEntry {
  sequence: DNASequence;
  timestamp: string;
}

/** Store 状态接口 */
interface SequenceStore {
  // ---- 数据 ----
  currentSequence: DNASequence | null;
  sequenceHistory: HistoryEntry[];
  viewState: ViewState;
  analysisResult: AnalysisResult | null;

  // ---- 序列操作 ----
  setSequence: (sequence: DNASequence) => void;
  updateSequence: (sequence: string) => void;
  addFeature: (feature: Feature) => void;
  removeFeature: (featureId: string) => void;
  undo: () => void;
  redo: () => void;

  // ---- 视图操作 ----
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  resetView: () => void;
  selectFeature: (featureId: string | null) => void;
  selectEnzyme: (enzymeName: string | null) => void;
  setActiveTab: (tab: number) => void;
  toggleFeatures: () => void;
  toggleEnzymes: () => void;
  toggleORFs: () => void;
  toggleComplement: () => void;
  toggleTranslation: () => void;

  // ---- 分析 ----
  runAnalysis: () => void;

  // ---- 清理 ----
  clearAll: () => void;
}

/** 默认视图状态 */
const defaultViewState: ViewState = {
  zoom: 1,
  panX: 0,
  panY: 0,
  showFeatures: true,
  showEnzymes: true,
  showORFs: false,
  showComplement: true,
  showTranslation: true,
  selectedFeatureId: null,
  selectedEnzymeName: null,
  activeTab: 0,
};

/** 生成唯一 ID */
function generateId(): string {
  return `feat_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export const useSequenceStore = create<SequenceStore>((set, get) => ({
  // ---- 初始状态 ----
  currentSequence: null,
  sequenceHistory: [],
  viewState: { ...defaultViewState },
  analysisResult: null,

  // ---- 序列操作 ----
  setSequence: (sequence) => {
    const state = get();
    // 保存当前序列到历史
    if (state.currentSequence) {
      const newHistory: HistoryEntry[] = [
        ...state.sequenceHistory,
        {
          sequence: { ...state.currentSequence },
          timestamp: new Date().toISOString(),
        },
      ].slice(-50); // 最多保留 50 条历史
      set({ currentSequence: sequence, sequenceHistory: newHistory, analysisResult: null });
    } else {
      set({ currentSequence: sequence, analysisResult: null });
    }
  },

  updateSequence: (sequence) => {
    const state = get();
    if (!state.currentSequence) return;

    const updated: DNASequence = {
      ...state.currentSequence,
      sequence: normalizeSequence(sequence),
      dateModified: new Date().toISOString(),
    };

    // 保存到历史
    const newHistory: HistoryEntry[] = [
      ...state.sequenceHistory,
      {
        sequence: { ...state.currentSequence },
        timestamp: new Date().toISOString(),
      },
    ].slice(-50);

    set({ currentSequence: updated, sequenceHistory: newHistory, analysisResult: null });
  },

  addFeature: (feature) => {
    const state = get();
    if (!state.currentSequence) return;

    const updated: DNASequence = {
      ...state.currentSequence,
      features: [...state.currentSequence.features, { ...feature, id: feature.id || generateId() }],
      dateModified: new Date().toISOString(),
    };

    set({ currentSequence: updated });
  },

  removeFeature: (featureId) => {
    const state = get();
    if (!state.currentSequence) return;

    const updated: DNASequence = {
      ...state.currentSequence,
      features: state.currentSequence.features.filter((f) => f.id !== featureId),
      dateModified: new Date().toISOString(),
    };

    set({ currentSequence: updated });
  },

  undo: () => {
    const state = get();
    if (state.sequenceHistory.length === 0) return;

    const lastEntry = state.sequenceHistory[state.sequenceHistory.length - 1];
    const newHistory = state.sequenceHistory.slice(0, -1);

    set({
      currentSequence: lastEntry.sequence,
      sequenceHistory: newHistory,
      analysisResult: null,
    });
  },

  redo: () => {
    // 简化实现：redo 需要额外的 redo 栈，这里暂不实现完整 redo
    // 实际应用中应维护 redoHistory
  },

  // ---- 视图操作 ----
  setZoom: (zoom) => {
    set((state) => ({
      viewState: { ...state.viewState, zoom: Math.max(0.1, Math.min(10, zoom)) },
    }));
  },

  setPan: (x, y) => {
    set((state) => ({
      viewState: { ...state.viewState, panX: x, panY: y },
    }));
  },

  resetView: () => {
    set((state) => ({
      viewState: { ...state.viewState, ...defaultViewState },
    }));
  },

  selectFeature: (featureId) => {
    set((state) => ({
      viewState: { ...state.viewState, selectedFeatureId: featureId },
    }));
  },

  selectEnzyme: (enzymeName) => {
    set((state) => ({
      viewState: { ...state.viewState, selectedEnzymeName: enzymeName },
    }));
  },

  setActiveTab: (tab) => {
    set((state) => ({
      viewState: { ...state.viewState, activeTab: tab },
    }));
  },

  toggleFeatures: () => {
    set((state) => ({
      viewState: { ...state.viewState, showFeatures: !state.viewState.showFeatures },
    }));
  },

  toggleEnzymes: () => {
    set((state) => ({
      viewState: { ...state.viewState, showEnzymes: !state.viewState.showEnzymes },
    }));
  },

  toggleORFs: () => {
    set((state) => ({
      viewState: { ...state.viewState, showORFs: !state.viewState.showORFs },
    }));
  },

  toggleComplement: () => {
    set((state) => ({
      viewState: { ...state.viewState, showComplement: !state.viewState.showComplement },
    }));
  },

  toggleTranslation: () => {
    set((state) => ({
      viewState: { ...state.viewState, showTranslation: !state.viewState.showTranslation },
    }));
  },

  // ---- 分析 ----
  runAnalysis: () => {
    const state = get();
    const seq = state.currentSequence;
    if (!seq) return;

    const clean = normalizeSequence(seq.sequence);
    const gcContent = calculateGCContent(clean);
    const molecularWeight = calculateMolecularWeight(clean);
    const tm = calculateTmNN(clean);

    // 核苷酸组成
    const nucleotideComposition = {
      a: (clean.match(/A/g) || []).length,
      t: (clean.match(/T/g) || []).length,
      g: (clean.match(/G/g) || []).length,
      c: (clean.match(/C/g) || []).length,
      other: clean.length - ((clean.match(/[ATGC]/g) || []).length),
    };

    // 查找 ORF
    const orfs = findORFs(clean, 75, seq.isCircular);

    // 查找重复序列
    const repeats = findRepeats(clean, 6, 2);

    // 预测发夹结构
    const hairpins = predictHairpins(clean, 4, 10);

    // 查找限制酶切位点
    const restrictionSites = findAllCommonSites(clean, seq.isCircular);

    const result: AnalysisResult = {
      gcContent: Math.round(gcContent * 100) / 100,
      molecularWeight: Math.round(molecularWeight * 100) / 100,
      tm,
      length: clean.length,
      orfs,
      repeats,
      hairpins,
      restrictionSites,
      nucleotideComposition,
    };

    set({ analysisResult: result });
  },

  // ---- 清理 ----
  clearAll: () => {
    set({
      currentSequence: null,
      sequenceHistory: [],
      viewState: { ...defaultViewState },
      analysisResult: null,
    });
  },
}));

// ============================================================
// DNA 工具函数
// ============================================================

import type { ORF, Repeat, Hairpin } from '../../types';

/** 碱基互补配对 */
const COMPLEMENT_MAP: Record<string, string> = {
  A: 'T',
  T: 'A',
  G: 'C',
  C: 'G',
  U: 'A',
  a: 't',
  t: 'a',
  g: 'c',
  c: 'g',
  u: 'a',
  N: 'N',
  n: 'n',
  R: 'Y',
  Y: 'R',
  S: 'S',
  W: 'W',
  K: 'M',
  M: 'K',
  B: 'V',
  D: 'H',
  H: 'D',
  V: 'B',
};

/** 密码子表 */
const CODON_TABLE: Record<string, string> = {
  TTG: 'L', CTT: 'L', CTC: 'L', CTA: 'L', CTG: 'L', TTA: 'L',
  ATT: 'I', ATC: 'I', ATA: 'I', ATG: 'M',
  GTT: 'V', GTC: 'V', GTA: 'V', GTG: 'V',
  TCT: 'S', TCC: 'S', TCA: 'S', TCG: 'S', AGT: 'S', AGC: 'S',
  CCT: 'P', CCC: 'P', CCA: 'P', CCG: 'P',
  ACT: 'T', ACC: 'T', ACA: 'T', ACG: 'T',
  GCT: 'A', GCC: 'A', GCA: 'A', GCG: 'A',
  TAT: 'Y', TAC: 'Y', TAA: '*', TAG: '*',
  CAT: 'H', CAC: 'H', CAA: 'Q', CAG: 'Q',
  AAT: 'N', AAC: 'N', AAA: 'K', AAG: 'K',
  GAT: 'D', GAC: 'D', GAA: 'E', GAG: 'E',
  TGT: 'C', TGC: 'C', TGA: '*', TGG: 'W',
  CGT: 'R', CGC: 'R', CGA: 'R', CGG: 'R', AGA: 'R', AGG: 'R',
  GGT: 'G', GGC: 'G', GGA: 'G', GGG: 'G',
};

/** 最近邻热力学参数 (kcal/mol) */
const NN_PARAMS: Record<string, { dH: number; dS: number }> = {
  AA: { dH: -7.9, dS: -22.2 },
  AT: { dH: -7.2, dS: -20.4 },
  TA: { dH: -7.2, dS: -21.3 },
  CA: { dH: -8.5, dS: -22.7 },
  GT: { dH: -8.4, dS: -22.4 },
  CT: { dH: -7.8, dS: -21.0 },
  GA: { dH: -8.2, dS: -22.2 },
  CG: { dH: -10.6, dS: -27.2 },
  GC: { dH: -9.8, dS: -24.4 },
  GG: { dH: -8.0, dS: -19.9 },
  AC: { dH: -7.8, dS: -21.0 },
  AG: { dH: -7.8, dS: -21.0 },
  TC: { dH: -8.2, dS: -22.2 },
  TG: { dH: -8.5, dS: -22.7 },
  TT: { dH: -7.9, dS: -22.2 },
  CC: { dH: -8.0, dS: -19.9 },
};

/** 获取互补序列 */
export function getComplementSequence(sequence: string): string {
  return sequence
    .split('')
    .map((base) => COMPLEMENT_MAP[base] || 'N')
    .join('');
}

/** 获取反向互补序列 */
export function getReverseComplement(sequence: string): string {
  return getComplementSequence(sequence).split('').reverse().join('');
}

/** 计算 GC 含量 */
export function calculateGCContent(sequence: string): number {
  const clean = normalizeSequence(sequence);
  if (clean.length === 0) return 0;
  const gcCount = clean.split('').filter((b) => b === 'G' || b === 'C').length;
  return (gcCount / clean.length) * 100;
}

/** 计算分子量 (Da) */
export function calculateMolecularWeight(sequence: string): number {
  const clean = normalizeSequence(sequence);
  if (clean.length === 0) return 0;
  const weights: Record<string, number> = {
    A: 313.21, T: 304.19, G: 329.21, C: 289.18,
  };
  let total = 0;
  for (const base of clean) {
    total += weights[base] || 0;
  }
  // 减去 (n-1) 个水分子的重量
  total -= (clean.length - 1) * 61.96;
  return total;
}

/** 计算 Tm 值 (Wallace 规则) - 适用于短寡核苷酸 (< 14 nt) */
export function calculateTmWallace(sequence: string): number {
  const clean = normalizeSequence(sequence);
  if (clean.length === 0) return 0;
  const atCount = clean.split('').filter((b) => b === 'A' || b === 'T').length;
  const gcCount = clean.split('').filter((b) => b === 'G' || b === 'C').length;
  return 2 * atCount + 4 * gcCount;
}

/** 计算 Tm 值 (最近邻法) - 适用于较长序列 */
export function calculateTmNN(sequence: string): number {
  const clean = normalizeSequence(sequence);
  if (clean.length < 2) return 0;

  let totalH = 0;
  let totalS = 0;

  for (let i = 0; i < clean.length - 1; i++) {
    const dinuc = clean.substring(i, i + 2);
    const params = NN_PARAMS[dinuc];
    if (params) {
      totalH += params.dH;
      totalS += params.dS;
    }
  }

  // 起始参数
  totalH += 0.2;
  totalS += -5.7;

  // 盐修正
  const saltConc = 0.05; // 50 mM Na+
  totalS += 0.368 * (clean.length - 1) * Math.log(saltConc);

  // 浓度修正
  const oligoConc = 0.00000025; // 250 nM
  const R = 1.987; // cal/(mol*K)

  const tm = (totalH * 1000) / (totalS + R * Math.log(oligoConc / 4)) - 273.15;
  return Math.round(tm * 10) / 10;
}

/** 密码子表翻译 */
export function translateDNA(sequence: string): string {
  const clean = normalizeSequence(sequence);
  let protein = '';
  for (let i = 0; i + 2 < clean.length; i += 3) {
    const codon = clean.substring(i, i + 3);
    protein += CODON_TABLE[codon] || 'X';
  }
  return protein;
}

/** 查找开放阅读框 */
export function findORFs(
  sequence: string,
  minLength: number = 75,
  isCircular: boolean = false
): ORF[] {
  const clean = normalizeSequence(sequence);
  const orfs: ORF[] = [];
  let orfId = 0;

  // 正链 3 个 frame
  for (let frame = 0; frame < 3; frame++) {
    let inORF = false;
    let orfStart = 0;

    for (let i = frame; i + 2 < clean.length; i += 3) {
      const codon = clean.substring(i, i + 3);
      if (codon === 'ATG' && !inORF) {
        inORF = true;
        orfStart = i;
      } else if ((codon === 'TAA' || codon === 'TAG' || codon === 'TGA') && inORF) {
        const orfEnd = i + 3;
        const orfLength = orfEnd - orfStart;
        if (orfLength >= minLength) {
          orfs.push({
            id: `orf_${++orfId}`,
            start: orfStart,
            end: orfEnd,
            frame: frame + 1,
            strand: 'forward',
            length: orfLength,
            protein: translateDNA(clean.substring(orfStart, orfEnd)),
            startCodon: 'ATG',
            endCodon: codon,
          });
        }
        inORF = false;
      }
    }

    // 处理环形序列：ORF 可能跨过序列末端
    if (isCircular && inORF) {
      const remaining = clean.length - orfStart;
      const extendedSeq = clean + clean.substring(0, Math.max(0, minLength - remaining));
      let foundEnd = false;
      for (let i = clean.length; i + 2 < extendedSeq.length; i += 3) {
        const codon = extendedSeq.substring(i, i + 3);
        if (codon === 'TAA' || codon === 'TAG' || codon === 'TGA') {
          const orfEnd = i + 3;
          const orfLength = orfEnd - orfStart;
          if (orfLength >= minLength && orfEnd <= clean.length + frame) {
            orfs.push({
              id: `orf_${++orfId}`,
              start: orfStart,
              end: orfEnd > clean.length ? orfEnd - clean.length : orfEnd,
              frame: frame + 1,
              strand: 'forward',
              length: orfLength,
              protein: translateDNA(extendedSeq.substring(orfStart, orfEnd)),
              startCodon: 'ATG',
              endCodon: codon,
            });
          }
          foundEnd = true;
          break;
        }
      }
    }
  }

  // 反链 3 个 frame
  const revComp = getReverseComplement(clean);
  for (let frame = 0; frame < 3; frame++) {
    let inORF = false;
    let orfStart = 0;

    for (let i = frame; i + 2 < revComp.length; i += 3) {
      const codon = revComp.substring(i, i + 3);
      if (codon === 'ATG' && !inORF) {
        inORF = true;
        orfStart = i;
      } else if ((codon === 'TAA' || codon === 'TAG' || codon === 'TGA') && inORF) {
        const orfEnd = i + 3;
        const orfLength = orfEnd - orfStart;
        if (orfLength >= minLength) {
          // 反链坐标转换到正链
          const mappedStart = clean.length - orfEnd;
          const mappedEnd = clean.length - orfStart;
          orfs.push({
            id: `orf_${++orfId}`,
            start: mappedStart,
            end: mappedEnd,
            frame: -(frame + 1),
            strand: 'reverse',
            length: orfLength,
            protein: translateDNA(revComp.substring(orfStart, orfEnd)),
            startCodon: 'ATG',
            endCodon: codon,
          });
        }
        inORF = false;
      }
    }

    if (isCircular && inORF) {
      const remaining = revComp.length - orfStart;
      const extendedSeq = revComp + revComp.substring(0, Math.max(0, minLength - remaining));
      for (let i = revComp.length; i + 2 < extendedSeq.length; i += 3) {
        const codon = extendedSeq.substring(i, i + 3);
        if (codon === 'TAA' || codon === 'TAG' || codon === 'TGA') {
          const orfEnd = i + 3;
          const orfLength = orfEnd - orfStart;
          if (orfLength >= minLength && orfEnd <= revComp.length + frame) {
            const mappedStart = clean.length - (orfEnd > revComp.length ? orfEnd - revComp.length : orfEnd);
            const mappedEnd = clean.length - orfStart;
            orfs.push({
              id: `orf_${++orfId}`,
              start: mappedStart >= 0 ? mappedStart : 0,
              end: mappedEnd,
              frame: -(frame + 1),
              strand: 'reverse',
              length: orfLength,
              protein: translateDNA(extendedSeq.substring(orfStart, orfEnd)),
              startCodon: 'ATG',
              endCodon: codon,
            });
          }
          break;
        }
      }
    }
  }

  return orfs;
}

/** 查找重复序列 */
export function findRepeats(
  sequence: string,
  minRepeatLength: number = 6,
  minOccurrences: number = 2
): Repeat[] {
  const clean = normalizeSequence(sequence);
  const repeats: Repeat[] = [];
  const repeatMap = new Map<string, number[]>();

  // 滑动窗口查找
  for (let len = minRepeatLength; len <= Math.min(20, Math.floor(clean.length / minOccurrences)); len++) {
    for (let i = 0; i <= clean.length - len; i++) {
      const subseq = clean.substring(i, i + len);
      if (subseq.includes('N')) continue;

      const positions = repeatMap.get(subseq) || [];
      positions.push(i);
      repeatMap.set(subseq, positions);
    }
  }

  // 过滤并去重
  const seen = new Set<string>();
  for (const [seq, positions] of repeatMap) {
    if (positions.length >= minOccurrences && !seen.has(seq)) {
      seen.add(seq);
      // 检查是否为已知重复的子序列
      let isSubRepeat = false;
      for (const existing of seen) {
        if (existing !== seq && existing.includes(seq)) {
          isSubRepeat = true;
          break;
        }
      }
      if (!isSubRepeat) {
        repeats.push({
          sequence: seq,
          positions,
          length: seq.length,
          type: positions.some((p, i) => i > 0 && positions[i - 1] + seq.length === p)
            ? 'tandem'
            : 'direct',
        });
      }
    }
  }

  // 查找反向重复（回文序列）
  for (let len = minRepeatLength; len <= Math.min(20, Math.floor(clean.length / 2)); len++) {
    for (let i = 0; i <= clean.length - 2 * len; i++) {
      const subseq = clean.substring(i, i + len);
      const revComp = getReverseComplement(subseq);
      const searchRegion = clean.substring(i + len, Math.min(i + 2 * len + len, clean.length));
      const idx = searchRegion.indexOf(revComp);
      if (idx !== -1) {
        const positions = [i, i + len + idx];
        if (!seen.has(subseq + '_inv')) {
          seen.add(subseq + '_inv');
          repeats.push({
            sequence: subseq,
            positions,
            length: len,
            type: 'inverted',
          });
        }
      }
    }
  }

  return repeats.sort((a, b) => b.length - a.length);
}

/** 预测发夹结构 */
export function predictHairpins(
  sequence: string,
  minStemLength: number = 4,
  maxLoopLength: number = 10
): Hairpin[] {
  const clean = normalizeSequence(sequence);
  const hairpins: Hairpin[] = [];

  for (let i = 0; i < clean.length - 2 * minStemLength - 1; i++) {
    for (let stemLen = minStemLength; stemLen <= Math.min(15, (clean.length - i) / 2); stemLen++) {
      const stem1 = clean.substring(i, i + stemLen);
      const revCompStem1 = getReverseComplement(stem1);

      for (let loopLen = 1; loopLen <= maxLoopLength; loopLen++) {
        const loopStart = i + stemLen;
        const loopEnd = loopStart + loopLen;
        if (loopEnd + stemLen > clean.length) break;

        const stem2 = clean.substring(loopEnd, loopEnd + stemLen);
        if (stem2 === revCompStem1) {
          // 计算稳定性 (简化的热力学估算)
          const gcInStem = stem1.split('').filter((b) => b === 'G' || b === 'C').length;
          const stability = (gcInStem * 2 + (stemLen - gcInStem)) * stemLen;

          hairpins.push({
            start: i,
            end: loopEnd + stemLen,
            stemLength: stemLen,
            loopLength: loopLen,
            loopSequence: clean.substring(loopStart, loopEnd),
            stability,
          });
          break; // 找到最长的匹配茎后跳出循环
        }
      }
    }
  }

  // 去重并排序
  const unique = new Map<string, Hairpin>();
  for (const hp of hairpins) {
    const key = `${hp.start}-${hp.end}`;
    const existing = unique.get(key);
    if (!existing || hp.stemLength > existing.stemLength) {
      unique.set(key, hp);
    }
  }

  return Array.from(unique.values()).sort((a, b) => b.stability - a.stability);
}

/** 规范化序列：去除空格、数字等非碱基字符，转大写 */
export function normalizeSequence(sequence: string): string {
  return sequence
    .replace(/[^ATGCURYSWKMBDHVNatgcuyswkmbdhvn]/g, '')
    .toUpperCase();
}

/** 格式化序列显示（每行指定个碱基，带行号） */
export function formatSequence(
  sequence: string,
  basesPerLine: number = 60,
  blockSize: number = 10
): string {
  const clean = normalizeSequence(sequence);
  const lines: string[] = [];

  for (let i = 0; i < clean.length; i += basesPerLine) {
    const chunk = clean.substring(i, i + basesPerLine);
    const parts: string[] = [];
    for (let j = 0; j < chunk.length; j += blockSize) {
      parts.push(chunk.substring(j, j + blockSize));
    }
    const pos = String(i + 1).padStart(6, ' ');
    lines.push(`${pos}  ${parts.join(' ')}`);
  }

  return lines.join('\n');
}

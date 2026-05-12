// ============================================================
// 限制酶数据库
// ============================================================

import type { RestrictionEnzyme, RestrictionSite } from '../../types';

/** 简并碱基匹配表 */
const DEGENERATE_BASES: Record<string, string> = {
  A: 'A',
  T: 'T',
  G: 'G',
  C: 'C',
  R: '[AG]',
  Y: '[CT]',
  S: '[GC]',
  W: '[AT]',
  K: '[GT]',
  M: '[AC]',
  B: '[CGT]',
  D: '[AGT]',
  H: '[ACT]',
  V: '[ACG]',
  N: '[ACGT]',
};

/** 常用限制酶数据库 (40+ 种) */
export const COMMON_ENZYMES: RestrictionEnzyme[] = [
  { name: 'EcoRI', recognitionSite: 'GAATTC', cutPosition: 1, isPalindrome: true },
  { name: 'BamHI', recognitionSite: 'GGATCC', cutPosition: 1, isPalindrome: true },
  { name: 'HindIII', recognitionSite: 'AAGCTT', cutPosition: 1, isPalindrome: true },
  { name: 'XhoI', recognitionSite: 'CTCGAG', cutPosition: 1, isPalindrome: true },
  { name: 'XbaI', recognitionSite: 'TCTAGA', cutPosition: 1, isPalindrome: true },
  { name: 'KpnI', recognitionSite: 'GGTACC', cutPosition: 5, isPalindrome: true },
  { name: 'SacI', recognitionSite: 'GAGCTC', cutPosition: 5, isPalindrome: true },
  { name: 'PstI', recognitionSite: 'CTGCAG', cutPosition: 5, isPalindrome: true },
  { name: 'SmaI', recognitionSite: 'CCCGGG', cutPosition: 3, isPalindrome: true },
  { name: 'EcoRV', recognitionSite: 'GATATC', cutPosition: 3, isPalindrome: true },
  { name: 'NdeI', recognitionSite: 'CATATG', cutPosition: 2, isPalindrome: true },
  { name: 'NcoI', recognitionSite: 'CCATGG', cutPosition: 1, isPalindrome: true },
  { name: 'NotI', recognitionSite: 'GCGGCCGC', cutPosition: 2, isPalindrome: true },
  { name: 'SalI', recognitionSite: 'GTCGAC', cutPosition: 1, isPalindrome: true },
  { name: 'BsaI', recognitionSite: 'GGTCTC', cutPosition: 1, cutPosition2: 5, isPalindrome: false },
  { name: 'BpiI', recognitionSite: 'GAAGAC', cutPosition: 2, cutPosition2: 6, isPalindrome: false },
  { name: 'BsmBI', recognitionSite: 'CGTCTC', cutPosition: 1, cutPosition2: 5, isPalindrome: false },
  { name: 'ApaI', recognitionSite: 'GGGCCC', cutPosition: 5, isPalindrome: true },
  { name: 'ApaLI', recognitionSite: 'GTGCAC', cutPosition: 5, isPalindrome: true },
  { name: 'AseI', recognitionSite: 'ATTAAT', cutPosition: 2, isPalindrome: true },
  { name: 'AvrII', recognitionSite: 'CCTAGG', cutPosition: 1, isPalindrome: true },
  { name: 'BclI', recognitionSite: 'TGATCA', cutPosition: 1, isPalindrome: true },
  { name: 'BglII', recognitionSite: 'AGATCT', cutPosition: 1, isPalindrome: true },
  { name: 'ClaI', recognitionSite: 'ATCGAT', cutPosition: 2, isPalindrome: true },
  { name: 'DraI', recognitionSite: 'TTTAAA', cutPosition: 3, isPalindrome: true },
  { name: 'HaeIII', recognitionSite: 'GGCC', cutPosition: 2, isPalindrome: true },
  { name: 'HincII', recognitionSite: 'GTYRAC', cutPosition: 3, isPalindrome: true },
  { name: 'HpaI', recognitionSite: 'GTTAAC', cutPosition: 3, isPalindrome: true },
  { name: 'KasI', recognitionSite: 'GGCGCC', cutPosition: 1, isPalindrome: true },
  { name: 'MluI', recognitionSite: 'ACGCGT', cutPosition: 2, isPalindrome: true },
  { name: 'NarI', recognitionSite: 'GGCGCC', cutPosition: 2, isPalindrome: true },
  { name: 'NheI', recognitionSite: 'GCTAGC', cutPosition: 1, isPalindrome: true },
  { name: 'NruI', recognitionSite: 'TCGCGA', cutPosition: 2, isPalindrome: true },
  { name: 'PvuI', recognitionSite: 'CGATCG', cutPosition: 3, isPalindrome: true },
  { name: 'PvuII', recognitionSite: 'CAGCTG', cutPosition: 3, isPalindrome: true },
  { name: 'ScaI', recognitionSite: 'AGTACT', cutPosition: 3, isPalindrome: true },
  { name: 'SphI', recognitionSite: 'GCATGC', cutPosition: 5, isPalindrome: true },
  { name: 'SspI', recognitionSite: 'AATATT', cutPosition: 2, isPalindrome: true },
  { name: 'StuI', recognitionSite: 'AGGCCT', cutPosition: 3, isPalindrome: true },
  { name: 'StyI', recognitionSite: 'CCWWGG', cutPosition: 1, isPalindrome: true },
  { name: 'XcmI', recognitionSite: 'CCANNNNNTGG', cutPosition: 9, cutPosition2: 10, isPalindrome: false },
  { name: 'AluI', recognitionSite: 'AGCT', cutPosition: 2, isPalindrome: true },
  { name: 'TaqI', recognitionSite: 'TCGA', cutPosition: 1, isPalindrome: true },
  { name: 'MspI', recognitionSite: 'CCGG', cutPosition: 1, isPalindrome: true },
  { name: 'HinfI', recognitionSite: 'GANTC', cutPosition: 2, isPalindrome: true },
];

/** 将含简并碱基的识别序列转换为正则表达式 */
function siteToRegex(site: string): RegExp {
  const pattern = site
    .split('')
    .map((base) => DEGENERATE_BASES[base.toUpperCase()] || base)
    .join('');
  return new RegExp(pattern, 'gi');
}

/** 在序列中查找指定酶的切点（支持简并碱基和环形序列） */
export function findRestrictionSites(
  sequence: string,
  enzyme: RestrictionEnzyme,
  isCircular: boolean = false
): RestrictionSite[] {
  const sites: RestrictionSite[] = [];
  const regex = siteToRegex(enzyme.recognitionSite);
  const searchSeq = isCircular
    ? sequence + sequence.substring(0, enzyme.recognitionSite.length - 1)
    : sequence;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(searchSeq)) !== null) {
    const position = match.index;
    if (position < sequence.length) {
      sites.push({
        enzyme,
        position,
        sequence: match[0],
      });
    }
    // 防止零宽度匹配导致无限循环
    if (match[0].length === 0) {
      regex.lastIndex++;
    }
  }

  return sites;
}

/** 查找所有常用酶的切点 */
export function findAllCommonSites(
  sequence: string,
  isCircular: boolean = false
): RestrictionSite[] {
  const allSites: RestrictionSite[] = [];
  for (const enzyme of COMMON_ENZYMES) {
    const sites = findRestrictionSites(sequence, enzyme, isCircular);
    allSites.push(...sites);
  }
  return allSites.sort((a, b) => a.position - b.position);
}

/** 模拟酶切（单酶或双酶切） */
export function simulateDigest(
  sequence: string,
  enzymes: RestrictionEnzyme[],
  isCircular: boolean = false
): { fragments: { start: number; end: number; length: number; sequence: string }[]; sites: RestrictionSite[] } {
  const allSites: RestrictionSite[] = [];
  for (const enzyme of enzymes) {
    const sites = findRestrictionSites(sequence, enzyme, isCircular);
    allSites.push(...sites);
  }

  allSites.sort((a, b) => a.position - b.position);

  if (allSites.length === 0) {
    return {
      fragments: [{ start: 0, end: sequence.length, length: sequence.length, sequence }],
      sites: [],
    };
  }

  const cutPositions = [...new Set(allSites.map((s) => s.position))].sort((a, b) => a - b);
  const fragments: { start: number; end: number; length: number; sequence: string }[] = [];

  if (isCircular) {
    for (let i = 0; i < cutPositions.length; i++) {
      const start = cutPositions[i];
      const end = i + 1 < cutPositions.length ? cutPositions[i + 1] : cutPositions[0] + sequence.length;
      let fragSeq: string;
      if (end > sequence.length) {
        fragSeq = sequence.substring(start) + sequence.substring(0, end - sequence.length);
      } else {
        fragSeq = sequence.substring(start, end);
      }
      fragments.push({
        start,
        end: end > sequence.length ? end - sequence.length : end,
        length: end - start,
        sequence: fragSeq,
      });
    }
  } else {
    let prev = 0;
    for (const pos of cutPositions) {
      if (pos > prev) {
        fragments.push({
          start: prev,
          end: pos,
          length: pos - prev,
          sequence: sequence.substring(prev, pos),
        });
      }
      prev = pos;
    }
    if (prev < sequence.length) {
      fragments.push({
        start: prev,
        end: sequence.length,
        length: sequence.length - prev,
        sequence: sequence.substring(prev),
      });
    }
  }

  return { fragments, sites: allSites };
}

/** 按切点频率过滤酶 */
export function filterEnzymesByFrequency(
  sequence: string,
  isCircular: boolean = false,
  minCuts: number = 1,
  maxCuts: number = 5
): RestrictionEnzyme[] {
  return COMMON_ENZYMES.filter((enzyme) => {
    const sites = findRestrictionSites(sequence, enzyme, isCircular);
    return sites.length >= minCuts && sites.length <= maxCuts;
  });
}

/** 查找唯一切点酶（仅切割一次的酶） */
export function findUniqueCutters(
  sequence: string,
  isCircular: boolean = false
): RestrictionEnzyme[] {
  return filterEnzymesByFrequency(sequence, isCircular, 1, 1);
}

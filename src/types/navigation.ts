import type { StackScreenProps } from '@react-navigation/stack';

/** 根栈导航参数列表 */
export type RootStackParamList = {
  Home: undefined;
  Viewer: undefined;
  Analysis: undefined;
  Settings: undefined;
};

/** 首页 Props */
export type HomeScreenProps = StackScreenProps<RootStackParamList, 'Home'>;
/** 查看器 Props */
export type ViewerScreenProps = StackScreenProps<RootStackParamList, 'Viewer'>;
/** 分析页 Props */
export type AnalysisScreenProps = StackScreenProps<RootStackParamList, 'Analysis'>;
/** 设置页 Props */
export type SettingsScreenProps = StackScreenProps<RootStackParamList, 'Settings'>;

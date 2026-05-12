// ============================================================
// DNA 序列查看器 - 应用入口
// ============================================================

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, DefaultTheme } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// 屏幕导入
import HomeScreen from './src/screens/HomeScreen';
import ViewerScreen from './src/screens/ViewerScreen';
import AnalysisScreen from './src/screens/AnalysisScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// 类型导入
import type { RootStackParamList } from './src/types/navigation';

/** 自定义主题 */
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1a237e',
    accent: '#3949ab',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    text: '#333333',
    placeholder: '#999999',
  },
};

/** 创建导航栈 */
const Stack = createStackNavigator<RootStackParamList>();

/** 应用入口组件 */
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <NavigationContainer
            theme={{
              dark: false,
              colors: {
                primary: '#1a237e',
                background: '#FAFAFA',
                card: '#FFFFFF',
                text: '#333333',
                border: '#E0E0E0',
                notification: '#F44336',
              },
            } as any}
          >
            <Stack.Navigator
              initialRouteName="Home"
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#FAFAFA' },
              } as any}
            >
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Viewer" component={ViewerScreen} />
              <Stack.Screen name="Analysis" component={AnalysisScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
            </Stack.Navigator>
            <StatusBar style="dark" backgroundColor="#FFFFFF" />
          </NavigationContainer>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

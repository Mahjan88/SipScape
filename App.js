import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';
import HomeScreen from './src/screens/HomeScreen';
import PassportScreen from './src/screens/PassportScreen';
import BingoScreen from './src/screens/BingoScreen';
import RouletteScreen from './src/screens/RouletteScreen';
import QuizScreen from './src/screens/QuizScreen';
import { colors } from './src/theme/colors';
import { fonts } from './src/theme/typography';

const TABS = [
  { key: 'Home', icon: '🏠', label: 'Home' },
  { key: 'Passport', icon: '🛂', label: 'Passport' },
  { key: 'Bingo', icon: '🎯', label: 'Bingo' },
  { key: 'Roulette', icon: '🎰', label: 'Roulette' },
  { key: 'Quiz', icon: '💜', label: 'Match' },
];

function Header() {
  const insets = useSafeAreaInsets();
  const { xp } = useApp();

  return (
    <View style={[headerStyles.container, { paddingTop: insets.top + 12 }]}>
      <View style={headerStyles.left}>
        <View style={headerStyles.logoIcon}>
          <Text style={{ fontSize: 20 }}>☕</Text>
        </View>
        <Text style={headerStyles.logoText}>Sipscape</Text>
      </View>
      <View style={headerStyles.right}>
        <View style={headerStyles.xpBadge}>
          <Text style={headerStyles.xpText}>⚡ {xp} XP</Text>
        </View>
        <View style={headerStyles.avatar}>
          <Text style={headerStyles.avatarText}>M</Text>
        </View>
      </View>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: colors.warmBeige,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 165, 116, 0.3)',
  },
  left: { flexDirection: 'row', alignItems: 'center' },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.latte,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    marginLeft: 10,
    fontFamily: fonts.serif,
    fontSize: 22,
    fontWeight: '700',
    color: colors.espresso,
  },
  right: { flexDirection: 'row', alignItems: 'center' },
  xpBadge: {
    marginRight: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: colors.caramel,
  },
  xpText: { color: colors.white, fontSize: 11, fontWeight: '600' },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sage,
  },
  avatarText: { color: colors.white, fontSize: 14, fontWeight: '600' },
});

function BottomTabs({ activeTab, onTabPress }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[tabStyles.container, { paddingBottom: Math.max(8, insets.bottom) }]}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[tabStyles.tab, isActive && tabStyles.tabActive]}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[tabStyles.tabIcon, !isActive && { opacity: 0.5 }]}>{tab.icon}</Text>
            <Text style={[tabStyles.tabLabel, !isActive && { opacity: 0.5 }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.foam,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 165, 116, 0.3)',
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  tabActive: {
    backgroundColor: 'rgba(212, 165, 116, 0.12)',
  },
  tabIcon: { fontSize: 22 },
  tabLabel: { fontSize: 10, fontWeight: '600', color: colors.mocha, marginTop: 2 },
});

function AppContent() {
  const [activeTab, setActiveTab] = useState('Home');

  const navigate = (tab) => setActiveTab(tab);

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.screenContainer}>
        {activeTab === 'Home' && <HomeScreen navigation={{ navigate }} />}
        {activeTab === 'Passport' && <PassportScreen />}
        {activeTab === 'Bingo' && <BingoScreen />}
        {activeTab === 'Roulette' && <RouletteScreen />}
        {activeTab === 'Quiz' && <QuizScreen />}
      </View>
      <BottomTabs activeTab={activeTab} onTabPress={setActiveTab} />
      <StatusBar style="dark" />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.warmCream,
  },
  screenContainer: {
    flex: 1,
  },
});

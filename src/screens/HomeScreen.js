import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

const featureCards = [
  { key: 'Passport', icon: '🛂', title: 'Coffee Passport', desc: 'Collect stamps from every café you visit. Earn badges!', bg: '#E8D5B7' },
  { key: 'Bingo', icon: '🎯', title: 'Café Bingo', desc: 'Complete fun challenges on your bingo card this week.', bg: '#B5D5B0' },
  { key: 'Roulette', icon: '🎰', title: 'Brew Roulette', desc: "Spin for today's surprise café + drink combo!", bg: '#D4C0A0' },
  { key: 'Quiz', icon: '💜', title: 'Café Matchmaker', desc: 'Take a fun quiz to find your perfect café match.', bg: '#D5B8B8' },
];

export default function HomeScreen({ navigation }) {
  const { stampCount, streak } = useApp();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.greeting}>
        <Text style={styles.greetingTitle}>Good morning, Mahsa ☀️</Text>
        <Text style={styles.greetingSubtitle}>Ready to discover your next favorite spot?</Text>
      </View>

      <View style={styles.statsRow}>
        {[
          { icon: '📍', num: stampCount, label: 'Cafés Visited' },
          { icon: '⭐', num: stampCount, label: 'Stamps' },
          { icon: '🔥', num: streak, label: 'Day Streak' },
        ].map((s, i) => (
          <View key={i} style={styles.statCard}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={styles.statNum}>{s.num}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>✨ Explore Features</Text>
      {featureCards.map((card) => (
        <TouchableOpacity
          key={card.key}
          style={styles.featureCard}
          activeOpacity={0.8}
          onPress={() => navigation.navigate(card.key)}
        >
          <View style={[styles.featureIcon, { backgroundColor: card.bg }]}>
            <Text style={styles.featureEmoji}>{card.icon}</Text>
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>{card.title}</Text>
            <Text style={styles.featureDesc}>{card.desc}</Text>
          </View>
        </TouchableOpacity>
      ))}

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>🌧️ Today's Challenge</Text>
      <View style={styles.challengeCard}>
        <Text style={styles.challengeEmoji}>🌧️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.challengeTitle}>Rainy Day Explorer</Text>
          <Text style={styles.challengeDesc}>Visit a new café while it's raining. Double XP today!</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.warmCream },
  content: { padding: 20, paddingBottom: 30 },
  greeting: { marginBottom: 24 },
  greetingTitle: {
    fontFamily: fonts.serif,
    fontSize: 26,
    fontWeight: '700',
    color: colors.espresso,
    marginBottom: 4,
  },
  greetingSubtitle: { fontSize: 14, color: colors.mocha, fontWeight: '300' },
  statsRow: { flexDirection: 'row', marginBottom: 24 },
  statCard: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: colors.foam,
    borderRadius: 16,
    padding: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.15)',
  },
  statIcon: { fontSize: 24, marginBottom: 6 },
  statNum: {
    fontFamily: fonts.serif,
    fontSize: 24,
    fontWeight: '700',
    color: colors.espresso,
  },
  statLabel: { fontSize: 10, color: colors.mocha, fontWeight: '500', marginTop: 2 },
  sectionTitle: {
    fontFamily: fonts.serif,
    fontSize: 18,
    fontWeight: '600',
    color: colors.espresso,
    marginBottom: 14,
  },
  featureCard: {
    backgroundColor: colors.foam,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.15)',
  },
  featureIcon: {
    marginRight: 14,
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureEmoji: { fontSize: 24 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '600', color: colors.espresso, marginBottom: 3 },
  featureDesc: { fontSize: 12, color: colors.mocha, lineHeight: 17 },
  challengeCard: {
    backgroundColor: colors.foam,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.15)',
  },
  challengeEmoji: { fontSize: 32, marginRight: 12 },
  challengeTitle: { fontSize: 14, fontWeight: '600', color: colors.espresso },
  challengeDesc: { fontSize: 12, color: colors.mocha, marginTop: 2 },
});

import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { useApp } from '../context/AppContext';
import { cafes } from '../data/cafes';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import CelebrationModal from '../components/CelebrationModal';
import Toast from '../components/Toast';

const SCREEN_WIDTH = Dimensions.get('window').width;
const STAMP_SIZE = (Math.min(SCREEN_WIDTH, 430) - 40 - 24) / 3;

function StampCard({ cafe, collected, onCollect, index }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (collected) return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.15, duration: 150, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    onCollect(index);
  };

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handlePress}>
      <Animated.View
        style={[
          styles.stampCard,
          collected ? styles.stampCollected : styles.stampLocked,
          { transform: [{ scale }] },
        ]}
      >
        <Text style={styles.stampEmoji}>{cafe.emoji}</Text>
        <Text style={styles.stampName}>{cafe.name}</Text>
        <Text style={styles.stampDrink}>{collected ? cafe.drink : '???'}</Text>
        {collected && (
          <View style={styles.stampCheck}>
            <Text style={styles.stampCheckText}>✓</Text>
          </View>
        )}
        {!collected && <Text style={styles.stampLockIcon}>🔒</Text>}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function PassportScreen() {
  const { stamps, stampCount, collectStamp, getTierInfo } = useApp();
  const tier = getTierInfo();
  const [celebration, setCelebration] = useState(null);
  const [toast, setToast] = useState(null);

  const handleCollect = (index) => {
    if (stamps[index]) return;
    collectStamp(index);
    const newCount = stampCount + 1;

    if (newCount === 3) {
      setTimeout(() => setCelebration({ emoji: '🌟', title: 'Caffeine Explorer!', text: "You've visited 3 cafés and earned the Explorer badge! Keep going!" }), 300);
    } else if (newCount === 6) {
      setTimeout(() => setCelebration({ emoji: '☕', title: 'Neighborhood Barista!', text: "Amazing! 6 cafés explored. You know this neighborhood's coffee scene!" }), 300);
    } else if (newCount === 9) {
      setTimeout(() => setCelebration({ emoji: '👑', title: 'Coffee Legend!', text: "You've visited every café! You are the ultimate coffee explorer!" }), 300);
    } else {
      setToast(`+30 XP — ${cafes[index].name} stamp collected!`);
    }
  };

  const progressWidth = `${(stampCount / 9) * 100}%`;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>☕ Coffee Passport</Text>
          <Text style={styles.subtitle}>Collect stamps from cafés across the neighborhood</Text>
          <View style={styles.tierBadge}>
            <Text style={styles.tierText}>{tier.emoji} {tier.name}</Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>
              {tier.next ? `Next: ${tier.next}` : 'MAX LEVEL!'}
            </Text>
            <Text style={styles.progressCount}>{stampCount} / {tier.needed} stamps</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <View style={styles.tierLabels}>
            <Text style={styles.tierLabelText}>Beginner (1)</Text>
            <Text style={styles.tierLabelText}>Explorer (3)</Text>
            <Text style={styles.tierLabelText}>Barista (6)</Text>
            <Text style={styles.tierLabelText}>Legend (9)</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>🗺️ Your Stamps</Text>
        <View style={styles.stampsGrid}>
          {cafes.map((cafe, i) => (
            <StampCard
              key={cafe.id}
              cafe={cafe}
              collected={stamps[i]}
              onCollect={handleCollect}
              index={i}
            />
          ))}
        </View>
      </ScrollView>

      <CelebrationModal
        visible={!!celebration}
        emoji={celebration?.emoji}
        title={celebration?.title}
        text={celebration?.text}
        onClose={() => setCelebration(null)}
      />
      <Toast message={toast} visible={!!toast} onHide={() => setToast(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.warmCream },
  content: { padding: 20, paddingBottom: 30 },
  header: { alignItems: 'center', marginBottom: 24 },
  title: { fontFamily: fonts.serif, fontSize: 24, fontWeight: '700', color: colors.espresso, marginBottom: 4 },
  subtitle: { fontSize: 13, color: colors.mocha },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
    backgroundColor: colors.caramel,
    elevation: 3,
  },
  tierText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  progressCard: {
    backgroundColor: colors.foam,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.15)',
  },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 13, fontWeight: '500', color: colors.espresso },
  progressCount: { fontSize: 12, color: colors.mocha },
  progressBar: { height: 8, backgroundColor: colors.warmBeige, borderRadius: 10, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: 8, borderRadius: 10, backgroundColor: colors.caramel },
  tierLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  tierLabelText: { fontSize: 9, color: colors.mocha },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 18, fontWeight: '600', color: colors.espresso, marginBottom: 14 },
  stampsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  stampCard: {
    width: STAMP_SIZE,
    marginBottom: 12,
    backgroundColor: colors.foam,
    borderRadius: 16,
    padding: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.15)',
  },
  stampCollected: { borderColor: colors.sage, backgroundColor: '#F5FAF4' },
  stampLocked: { opacity: 0.55 },
  stampEmoji: { fontSize: 32, marginBottom: 6 },
  stampName: { fontSize: 11, fontWeight: '600', color: colors.espresso, textAlign: 'center', lineHeight: 14 },
  stampDrink: { fontSize: 9, color: colors.mocha, marginTop: 3, fontStyle: 'italic', textAlign: 'center' },
  stampCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampCheckText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  stampLockIcon: { position: 'absolute', top: 8, right: 8, fontSize: 14, opacity: 0.4 },
});

import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { useApp } from '../context/AppContext';
import { bingoItems } from '../data/cafes';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import CelebrationModal from '../components/CelebrationModal';
import Toast from '../components/Toast';

const GRID_PADDING = 20;
const GAP = 8;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_SIZE = (Math.min(SCREEN_WIDTH, 430) - GRID_PADDING * 2 - GAP * 3) / 4;

function BingoCell({ item, completed, onPress, index }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (completed) return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.1, duration: 120, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onPress(index);
  };

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={handlePress}>
      <Animated.View style={[
        styles.cell,
        completed && styles.cellCompleted,
        { transform: [{ scale }] },
      ]}>
        <Text style={styles.cellIcon}>{completed ? '✅' : item.icon}</Text>
        <Text style={[styles.cellText, completed && styles.cellTextCompleted]}>{item.text}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function BingoScreen() {
  const { bingo, completeBingo, checkBingoLine, bingoCompletedCount, bingoRowCount, addXP } = useApp();
  const [celebration, setCelebration] = useState(null);
  const [toast, setToast] = useState(null);

  const handleComplete = (index) => {
    if (bingo[index]) return;
    const hadBingo = checkBingoLine();
    completeBingo(index);

    setTimeout(() => {
      const newBingo = [...bingo];
      newBingo[index] = true;
      let hasBingo = false;
      for (let r = 0; r < 4; r++) {
        if (newBingo[r * 4] && newBingo[r * 4 + 1] && newBingo[r * 4 + 2] && newBingo[r * 4 + 3]) hasBingo = true;
      }
      for (let c = 0; c < 4; c++) {
        if (newBingo[c] && newBingo[c + 4] && newBingo[c + 8] && newBingo[c + 12]) hasBingo = true;
      }

      if (hasBingo && !hadBingo) {
        addXP(50);
        setCelebration({ emoji: '🎯', title: 'BINGO!', text: 'You completed a line! +50 bonus XP and a mystery badge!' });
      } else {
        setToast(`+15 XP — "${bingoItems[index].text}" complete!`);
      }
    }, 100);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>🎯 Café Bingo</Text>
          <Text style={styles.subtitle}>Complete challenges to fill your card this week</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{bingoCompletedCount}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{bingoRowCount}</Text>
              <Text style={styles.statLabel}>Rows Done</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>🔥</Text>
              <Text style={styles.statLabel}>On Fire!</Text>
            </View>
          </View>
        </View>

        <View style={styles.grid}>
          {bingoItems.map((item, i) => (
            <BingoCell key={i} item={item} completed={bingo[i]} onPress={handleComplete} index={i} />
          ))}
        </View>

        <View style={styles.rewardCard}>
          <Text style={styles.rewardTitle}>🎁 Row Reward</Text>
          <Text style={styles.rewardText}>Complete any row or column to earn 50 bonus XP + a surprise badge!</Text>
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
  header: { alignItems: 'center', marginBottom: 20 },
  title: { fontFamily: fonts.serif, fontSize: 24, fontWeight: '700', color: colors.espresso, marginBottom: 4 },
  subtitle: { fontSize: 13, color: colors.mocha },
  statsRow: { flexDirection: 'row', marginTop: 12 },
  stat: { alignItems: 'center', marginHorizontal: 12 },
  statNum: { fontFamily: fonts.serif, fontSize: 22, fontWeight: '700', color: colors.caramel },
  statLabel: { fontSize: 10, color: colors.mocha },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    marginBottom: GAP,
    backgroundColor: colors.foam,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    elevation: 2,
    borderWidth: 2,
    borderColor: colors.foam,
  },
  cellCompleted: { borderColor: colors.caramel, backgroundColor: '#E8D5B7' },
  cellIcon: { fontSize: 22, marginBottom: 4 },
  cellText: { fontSize: 9, fontWeight: '500', color: colors.mocha, textAlign: 'center', lineHeight: 12 },
  cellTextCompleted: { color: colors.espresso, fontWeight: '600' },
  rewardCard: {
    backgroundColor: colors.foam,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.15)',
  },
  rewardTitle: { fontSize: 14, fontWeight: '600', color: colors.espresso, marginBottom: 6 },
  rewardText: { fontSize: 12, color: colors.mocha, textAlign: 'center' },
});

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useApp } from '../context/AppContext';
import { cafes, rouletteReasons } from '../data/cafes';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import Toast from '../components/Toast';

const SPIN_EMOJIS = ['☕', '🧁', '🫖', '🎂', '🍵', '🥐', '🍩', '🌿', '🔥', '☁️'];

export default function RouletteScreen() {
  const { addSpin, spinHistory } = useApp();
  const [phase, setPhase] = useState('idle');
  const [currentEmoji, setCurrentEmoji] = useState('🎲');
  const [result, setResult] = useState(null);
  const [isBonus, setIsBonus] = useState(false);
  const [toast, setToast] = useState(null);
  const floatAnim = useRef(new Animated.Value(0)).current;
  const resultScale = useRef(new Animated.Value(0.5)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 1500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleSpin = () => {
    if (phase === 'spinning') return;
    setPhase('spinning');

    let count = 0;
    const interval = setInterval(() => {
      setCurrentEmoji(SPIN_EMOJIS[count % SPIN_EMOJIS.length]);
      count++;
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      const cafe = cafes[Math.floor(Math.random() * cafes.length)];
      const reason = rouletteReasons[Math.floor(Math.random() * rouletteReasons.length)];
      const bonus = Math.random() > 0.5;

      setResult({ cafe, reason });
      setIsBonus(bonus);
      setPhase('result');

      resultScale.setValue(0.5);
      resultOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(resultScale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
        Animated.timing(resultOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      addSpin({ cafe, reason });
      setToast('+10 XP — Great spin!');
    }, 1800);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>🎰 Brew Roulette</Text>
          <Text style={styles.subtitle}>Let fate choose your next coffee adventure</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTopBorder} />

          {phase === 'idle' && (
            <View style={styles.idleContent}>
              <Animated.Text style={[styles.idleIcon, { transform: [{ translateY: floatAnim }] }]}>
                🎲
              </Animated.Text>
              <Text style={styles.idleTitle}>Feeling Lucky?</Text>
              <Text style={styles.idleText}>
                Spin the wheel and we'll pick the perfect café and drink for your mood today.
              </Text>
            </View>
          )}

          {phase === 'spinning' && (
            <View style={styles.spinningContent}>
              <Text style={styles.spinEmoji}>{currentEmoji}</Text>
              <Text style={styles.spinText}>Finding your match...</Text>
            </View>
          )}

          {phase === 'result' && result && (
            <Animated.View style={[styles.resultContent, { opacity: resultOpacity, transform: [{ scale: resultScale }] }]}>
              <Text style={styles.resultEmoji}>{result.cafe.emoji}</Text>
              <Text style={styles.resultCafe}>{result.cafe.name}</Text>
              <Text style={styles.resultDrink}>Try: {result.cafe.drink}</Text>
              <Text style={styles.resultReason}>"{result.reason}"</Text>
              {isBonus && (
                <View style={styles.bonusBadge}>
                  <Text style={styles.bonusText}>🔥 2x XP if you go today!</Text>
                </View>
              )}
            </Animated.View>
          )}
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSpin}
          disabled={phase === 'spinning'}
          style={[
            styles.spinBtn,
            phase === 'result' && styles.spinBtnAgain,
            phase === 'spinning' && { opacity: 0.6 },
          ]}
        >
          <Text style={styles.spinBtnText}>
            {phase === 'result' ? '🔄 Spin Again' : '☕ Spin the Wheel'}
          </Text>
        </TouchableOpacity>

        {spinHistory.length > 0 && (
          <View style={styles.history}>
            <Text style={styles.historyTitle}>Recent Spins</Text>
            {spinHistory.slice(0, 3).map((item, i) => (
              <View key={i} style={styles.historyItem}>
                <Text style={styles.historyEmoji}>{item.cafe.emoji}</Text>
                <View style={styles.historyText}>
                  <Text style={styles.historyName}>{item.cafe.name}</Text>
                  <Text style={styles.historyDrink}>{item.cafe.drink}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

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
  card: {
    backgroundColor: colors.foam,
    borderRadius: 24,
    padding: 30,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 280,
    marginBottom: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.2)',
    overflow: 'hidden',
  },
  cardTopBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.caramel,
  },
  idleContent: { alignItems: 'center' },
  idleIcon: { fontSize: 60, marginBottom: 16 },
  idleTitle: { fontFamily: fonts.serif, fontSize: 20, fontWeight: '700', color: colors.espresso, marginBottom: 8 },
  idleText: { fontSize: 13, color: colors.mocha, lineHeight: 20, textAlign: 'center' },
  spinningContent: { alignItems: 'center' },
  spinEmoji: { fontSize: 48, marginBottom: 16 },
  spinText: { fontSize: 14, color: colors.mocha },
  resultContent: { alignItems: 'center' },
  resultEmoji: { fontSize: 56, marginBottom: 12 },
  resultCafe: { fontFamily: fonts.serif, fontSize: 22, fontWeight: '700', color: colors.espresso, marginBottom: 6, textAlign: 'center' },
  resultDrink: { fontSize: 15, color: colors.caramel, fontWeight: '600', marginBottom: 10 },
  resultReason: { fontSize: 16, color: colors.mocha, fontStyle: 'italic', textAlign: 'center', lineHeight: 22 },
  bonusBadge: { marginTop: 14, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.caramel },
  bonusText: { color: colors.white, fontSize: 11, fontWeight: '600' },
  spinBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: colors.caramel,
    elevation: 5,
  },
  spinBtnAgain: { backgroundColor: colors.sage },
  spinBtnText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  history: { marginTop: 24 },
  historyTitle: { fontFamily: fonts.serif, fontSize: 16, fontWeight: '600', color: colors.espresso, marginBottom: 12 },
  historyItem: {
    backgroundColor: colors.foam,
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 1,
  },
  historyEmoji: { fontSize: 28, marginRight: 12 },
  historyText: { flex: 1 },
  historyName: { fontSize: 13, fontWeight: '600', color: colors.espresso },
  historyDrink: { fontSize: 11, color: colors.mocha },
});

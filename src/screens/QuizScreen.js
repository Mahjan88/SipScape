import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { useApp } from '../context/AppContext';
import { cafes, quizQuestions } from '../data/cafes';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

const SCREEN_WIDTH = Dimensions.get('window').width;

function QuizProgress({ step, total }) {
  return (
    <View style={styles.progressRow}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.progressDot,
            i < step && styles.progressFilled,
            i === step && styles.progressCurrent,
          ]}
        />
      ))}
    </View>
  );
}

function QuizOption({ option, selected, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handlePress}>
      <Animated.View style={[styles.option, selected && styles.optionSelected, { transform: [{ scale }] }]}>
        <Text style={styles.optionEmoji}>{option.emoji}</Text>
        <Text style={styles.optionText}>{option.text}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function MatchCard({ cafe, score, isTop }) {
  return (
    <View style={[styles.matchCard, isTop && styles.matchCardTop]}>
      <Text style={styles.matchEmoji}>{cafe.emoji}</Text>
      <View style={styles.matchInfo}>
        <Text style={styles.matchName}>{isTop ? '💛 ' : ''}{cafe.name}</Text>
        <Text style={styles.matchDesc}>{cafe.desc}</Text>
        <View style={styles.matchTags}>
          {cafe.tags.map((tag) => (
            <View key={tag} style={styles.matchTag}>
              <Text style={styles.matchTagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
      <Text style={styles.matchScore}>{score}%</Text>
    </View>
  );
}

export default function QuizScreen() {
  const { addXP } = useApp();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleSelect = (value, optionIndex) => {
    if (selectedOption !== null) return;
    setSelectedOption(optionIndex);

    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    setTimeout(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
        setSelectedOption(null);

        if (step + 1 >= quizQuestions.length) {
          calculateResults(newAnswers);
        } else {
          setStep(step + 1);
        }

        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    }, 350);
  };

  const calculateResults = (quizAnswers) => {
    const vibeCount = {};
    quizAnswers.forEach((v) => { vibeCount[v] = (vibeCount[v] || 0) + 1; });

    const scored = cafes.map((cafe) => {
      let score = 0;
      if (vibeCount[cafe.vibe]) score += vibeCount[cafe.vibe] * 25;
      cafe.tags.forEach((tag) => {
        Object.keys(vibeCount).forEach((v) => {
          if (tag.includes(v) || v.includes(tag)) score += vibeCount[v] * 10;
        });
      });
      score = Math.min(99, Math.max(60, score + Math.floor(Math.random() * 15)));
      return { ...cafe, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const top3 = scored.slice(0, 3);
    top3[0].score = Math.max(top3[0].score, 92);

    setResults(top3);
    setShowResults(true);
    addXP(25);
  };

  const resetQuiz = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setStep(0);
      setAnswers([]);
      setShowResults(false);
      setResults([]);
      setSelectedOption(null);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>💜 Café Matchmaker</Text>
          <Text style={styles.subtitle}>
            {showResults ? 'Based on your vibe, here are your top spots' : 'Answer 5 questions to find your perfect café'}
          </Text>
        </View>

        {!showResults && <QuizProgress step={step} total={quizQuestions.length} />}

        <Animated.View style={{ opacity: fadeAnim }}>
          {!showResults && step < quizQuestions.length && (
            <View>
              <Text style={styles.questionText}>{quizQuestions[step].question}</Text>
              <View style={styles.optionsGrid}>
                {quizQuestions[step].options.map((opt, i) => (
                  <QuizOption
                    key={i}
                    option={opt}
                    selected={selectedOption === i}
                    onPress={() => handleSelect(opt.value, i)}
                  />
                ))}
              </View>
            </View>
          )}

          {showResults && (
            <View>
              <Text style={styles.resultsTitle}>Your Perfect Matches! 🎉</Text>
              {results.map((cafe, i) => (
                <MatchCard key={cafe.id} cafe={cafe} score={cafe.score} isTop={i === 0} />
              ))}
              <TouchableOpacity style={styles.retakeBtn} activeOpacity={0.8} onPress={resetQuiz}>
                <Text style={styles.retakeBtnText}>🔄 Retake Quiz</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.warmCream },
  content: { padding: 20, paddingBottom: 30 },
  header: { alignItems: 'center', marginBottom: 20 },
  title: { fontFamily: fonts.serif, fontSize: 24, fontWeight: '700', color: colors.espresso, marginBottom: 4 },
  subtitle: { fontSize: 13, color: colors.mocha, textAlign: 'center' },
  progressRow: { flexDirection: 'row', marginBottom: 24 },
  progressDot: { flex: 1, height: 4, borderRadius: 4, marginHorizontal: 2, backgroundColor: colors.warmBeige },
  progressFilled: { backgroundColor: colors.caramel },
  progressCurrent: { backgroundColor: colors.latte },
  questionText: {
    fontFamily: fonts.serif,
    fontSize: 19,
    fontWeight: '600',
    color: colors.espresso,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 27,
  },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  option: {
    width: (Math.min(SCREEN_WIDTH, 430) - 50) / 2,
    marginBottom: 10,
    backgroundColor: colors.foam,
    borderWidth: 2,
    borderColor: 'rgba(212, 165, 116, 0.2)',
    borderRadius: 16,
    padding: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    elevation: 2,
  },
  optionSelected: { borderColor: colors.caramel, backgroundColor: '#FDF6EC' },
  optionEmoji: { fontSize: 32, marginBottom: 8 },
  optionText: { fontSize: 12, fontWeight: '600', color: colors.espresso, textAlign: 'center', lineHeight: 16 },
  resultsTitle: {
    fontFamily: fonts.serif,
    fontSize: 22,
    fontWeight: '700',
    color: colors.espresso,
    textAlign: 'center',
    marginBottom: 20,
  },
  matchCard: {
    backgroundColor: colors.foam,
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.15)',
  },
  matchCardTop: { borderWidth: 2, borderColor: colors.caramel, backgroundColor: '#FFFBF5' },
  matchEmoji: { fontSize: 40, marginRight: 14 },
  matchInfo: { flex: 1, paddingRight: 36 },
  matchName: { fontSize: 15, fontWeight: '600', color: colors.espresso, marginBottom: 3 },
  matchDesc: { fontSize: 11, color: colors.mocha, lineHeight: 16 },
  matchTags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  matchTag: {
    backgroundColor: 'rgba(212, 165, 116, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 4,
  },
  matchTagText: { fontSize: 10, fontWeight: '500', color: colors.mocha },
  matchScore: {
    position: 'absolute',
    top: 12,
    right: 14,
    fontFamily: fonts.serif,
    fontSize: 18,
    fontWeight: '700',
    color: colors.caramel,
  },
  retakeBtn: {
    borderWidth: 2,
    borderColor: colors.caramel,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  retakeBtnText: { fontSize: 14, fontWeight: '600', color: colors.caramel },
});

import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, ScrollView, Dimensions, Platform, KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COFFEE_PREFS = [
  { emoji: '☕', label: 'Espresso', key: 'espresso' },
  { emoji: '🥛', label: 'Latte', key: 'latte' },
  { emoji: '🧊', label: 'Iced Coffee', key: 'iced' },
  { emoji: '🍵', label: 'Matcha', key: 'matcha' },
  { emoji: '🫖', label: 'Pour-over', key: 'pourover' },
  { emoji: '🍫', label: 'Mocha', key: 'mocha' },
  { emoji: '☁️', label: 'Cold Brew', key: 'coldbrew' },
  { emoji: '🌿', label: 'Tea', key: 'tea' },
];

const MILK_PREFS = [
  { emoji: '🥛', label: 'Whole Milk', key: 'whole' },
  { emoji: '🌾', label: 'Oat Milk', key: 'oat' },
  { emoji: '🥥', label: 'Coconut', key: 'coconut' },
  { emoji: '🌱', label: 'Almond', key: 'almond' },
  { emoji: '⬛', label: 'Black (no milk)', key: 'black' },
];

const PROFILE_PICS = ['😊', '😎', '🤠', '🧑‍🎨', '🧑‍💻', '🌸', '☕', '🐱', '🦊', '🌈', '🔥', '✨'];

function ProgressBar({ step, total }) {
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((step + 1) / total) * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>Step {step + 1} of {total}</Text>
    </View>
  );
}

function ChipSelect({ options, selected, onToggle, multi = false }) {
  return (
    <View style={styles.chipGrid}>
      {options.map((opt) => {
        const isSelected = multi ? selected.includes(opt.key) : selected === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            style={[styles.chip, isSelected && styles.chipSelected]}
            activeOpacity={0.7}
            onPress={() => onToggle(opt.key)}
          >
            <Text style={styles.chipEmoji}>{opt.emoji}</Text>
            <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Step 1: Name + Username
function NameStep({ data, onUpdate }) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepEmoji}>👋</Text>
      <Text style={styles.stepTitle}>Let's meet you!</Text>
      <Text style={styles.stepSubtitle}>What should we call you?</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>First Name</Text>
        <TextInput
          style={styles.textInput}
          value={data.firstName}
          onChangeText={(t) => onUpdate({ firstName: t })}
          placeholder="Your first name"
          placeholderTextColor="rgba(109, 76, 65, 0.3)"
          autoFocus
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Username</Text>
        <View style={styles.usernameRow}>
          <Text style={styles.atSign}>@</Text>
          <TextInput
            style={[styles.textInput, styles.usernameInput]}
            value={data.username}
            onChangeText={(t) => onUpdate({ username: t.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
            placeholder="your_username"
            placeholderTextColor="rgba(109, 76, 65, 0.3)"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>
    </View>
  );
}

// Step 2: Birthday + Location
function DetailsStep({ data, onUpdate }) {
  const formatBirthday = (text) => {
    const digits = text.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  };

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepEmoji}>📍</Text>
      <Text style={styles.stepTitle}>A bit more about you</Text>
      <Text style={styles.stepSubtitle}>This helps us personalize your experience</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Birthday</Text>
        <TextInput
          style={styles.textInput}
          value={data.birthday}
          onChangeText={(t) => onUpdate({ birthday: formatBirthday(t) })}
          placeholder="MM/DD/YYYY"
          placeholderTextColor="rgba(109, 76, 65, 0.3)"
          keyboardType="number-pad"
          maxLength={10}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Your Neighborhood</Text>
        <TextInput
          style={styles.textInput}
          value={data.location}
          onChangeText={(t) => onUpdate({ location: t })}
          placeholder="e.g., Ballard, Capitol Hill"
          placeholderTextColor="rgba(109, 76, 65, 0.3)"
        />
      </View>
    </View>
  );
}

// Step 3: Profile Picture
function PhotoStep({ data, onUpdate }) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepEmoji}>📸</Text>
      <Text style={styles.stepTitle}>Pick your avatar</Text>
      <Text style={styles.stepSubtitle}>Choose an emoji that represents you</Text>

      <View style={styles.avatarPreview}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarEmoji}>{data.avatar || '😊'}</Text>
        </View>
        <Text style={styles.avatarName}>{data.firstName || 'You'}</Text>
        {data.username ? <Text style={styles.avatarHandle}>@{data.username}</Text> : null}
      </View>

      <View style={styles.avatarGrid}>
        {PROFILE_PICS.map((emoji) => (
          <TouchableOpacity
            key={emoji}
            style={[styles.avatarOption, data.avatar === emoji && styles.avatarOptionSelected]}
            activeOpacity={0.7}
            onPress={() => onUpdate({ avatar: emoji })}
          >
            <Text style={styles.avatarOptionEmoji}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// Step 4: Coffee Preferences
function CoffeeStep({ data, onUpdate }) {
  const toggleDrink = (key) => {
    const current = data.drinks || [];
    const next = current.includes(key)
      ? current.filter((k) => k !== key)
      : [...current, key];
    onUpdate({ drinks: next });
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepEmoji}>☕</Text>
      <Text style={styles.stepTitle}>Your coffee style</Text>
      <Text style={styles.stepSubtitle}>Pick your favorites (select as many as you like!)</Text>

      <Text style={styles.sectionLabel}>Favorite Drinks</Text>
      <ChipSelect
        options={COFFEE_PREFS}
        selected={data.drinks || []}
        onToggle={toggleDrink}
        multi
      />

      <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Milk Preference</Text>
      <ChipSelect
        options={MILK_PREFS}
        selected={data.milk || ''}
        onToggle={(key) => onUpdate({ milk: key })}
      />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

export default function OnboardingScreen({ onComplete }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    firstName: '',
    username: '',
    birthday: '',
    location: '',
    avatar: '😊',
    drinks: [],
    milk: '',
  });
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const TOTAL_STEPS = 4;

  const updateData = (updates) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const transition = (callback) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      callback();
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
  };

  const nextStep = () => {
    if (step === TOTAL_STEPS - 1) {
      onComplete(data);
    } else {
      transition(() => setStep(step + 1));
    }
  };

  const prevStep = () => {
    if (step > 0) transition(() => setStep(step - 1));
  };

  const canProceed = () => {
    switch (step) {
      case 0: return data.firstName.trim().length >= 1;
      case 1: return data.location.trim().length >= 1;
      case 2: return true; // avatar always has default
      case 3: return data.drinks.length >= 1;
      default: return true;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0: return <NameStep data={data} onUpdate={updateData} />;
      case 1: return <DetailsStep data={data} onUpdate={updateData} />;
      case 2: return <PhotoStep data={data} onUpdate={updateData} />;
      case 3: return <CoffeeStep data={data} onUpdate={updateData} />;
      default: return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + 10 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ProgressBar step={step} total={TOTAL_STEPS} />

      <Animated.View style={[styles.stepWrapper, { opacity: fadeAnim }]}>
        {renderStep()}
      </Animated.View>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(20, insets.bottom + 10) }]}>
        {step > 0 ? (
          <TouchableOpacity onPress={prevStep} style={styles.backStepBtn}>
            <Text style={styles.backStepText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backStepBtn} />
        )}

        <TouchableOpacity
          style={[styles.continueBtn, !canProceed() && styles.continueBtnDisabled]}
          activeOpacity={0.8}
          onPress={nextStep}
          disabled={!canProceed()}
        >
          <Text style={styles.continueBtnText}>
            {step === TOTAL_STEPS - 1 ? "Let's Go! ☕" : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.warmCream },
  progressContainer: { paddingHorizontal: 24, marginBottom: 8 },
  progressTrack: {
    height: 6,
    backgroundColor: colors.warmBeige,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: { height: 6, backgroundColor: colors.caramel, borderRadius: 6 },
  progressText: { fontSize: 12, color: colors.mocha, textAlign: 'center' },
  stepWrapper: { flex: 1 },
  stepContent: {
    paddingHorizontal: 28,
    paddingTop: 20,
    alignItems: 'center',
  },
  stepEmoji: { fontSize: 44, marginBottom: 12 },
  stepTitle: {
    fontFamily: fonts.serif,
    fontSize: 24,
    fontWeight: '700',
    color: colors.espresso,
    marginBottom: 6,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 14,
    color: colors.mocha,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  inputGroup: { width: '100%', marginBottom: 18 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: colors.espresso, marginBottom: 8 },
  textInput: {
    backgroundColor: colors.foam,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.espresso,
    borderWidth: 2,
    borderColor: 'rgba(212, 165, 116, 0.2)',
  },
  usernameRow: { flexDirection: 'row', alignItems: 'center' },
  atSign: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.mocha,
    marginRight: 4,
  },
  usernameInput: { flex: 1 },
  // Avatar styles
  avatarPreview: { alignItems: 'center', marginBottom: 28 },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.warmBeige,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.caramel,
    marginBottom: 10,
  },
  avatarEmoji: { fontSize: 44 },
  avatarName: { fontFamily: fonts.serif, fontSize: 20, fontWeight: '700', color: colors.espresso },
  avatarHandle: { fontSize: 13, color: colors.mocha, marginTop: 2 },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  avatarOption: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.foam,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 6,
    borderWidth: 2,
    borderColor: colors.foam,
  },
  avatarOptionSelected: {
    borderColor: colors.caramel,
    backgroundColor: '#FDF6EC',
  },
  avatarOptionEmoji: { fontSize: 28 },
  // Chip styles
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.espresso,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.foam,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    margin: 5,
    borderWidth: 2,
    borderColor: colors.foam,
  },
  chipSelected: {
    borderColor: colors.caramel,
    backgroundColor: '#FDF6EC',
  },
  chipEmoji: { fontSize: 18, marginRight: 6 },
  chipLabel: { fontSize: 13, fontWeight: '500', color: colors.mocha },
  chipLabelSelected: { color: colors.espresso, fontWeight: '600' },
  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 165, 116, 0.15)',
  },
  backStepBtn: { width: 60 },
  backStepText: { fontSize: 15, color: colors.caramel, fontWeight: '500' },
  continueBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: colors.caramel,
    alignItems: 'center',
    elevation: 3,
  },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});

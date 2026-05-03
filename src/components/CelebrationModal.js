import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Dimensions } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONFETTI_COLORS = [colors.latte, colors.sage, colors.dustyRose, colors.softGold, colors.caramel, '#E8D5B7'];
const NUM_CONFETTI = 40;

function ConfettiPiece({ color, size, startX, delay, duration }) {
  const fall = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fall, {
        toValue: 1,
        duration: duration,
        delay: delay,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: duration * 0.3, delay, useNativeDriver: true }),
        Animated.timing(sway, { toValue: -1, duration: duration * 0.3, useNativeDriver: true }),
        Animated.timing(sway, { toValue: 0.5, duration: duration * 0.4, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: startX,
        top: -10,
        width: size,
        height: size,
        borderRadius: size > 8 ? 2 : size / 2,
        backgroundColor: color,
        opacity: fall.interpolate({
          inputRange: [0, 0.7, 1],
          outputRange: [1, 1, 0],
        }),
        transform: [
          {
            translateY: fall.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 700],
            }),
          },
          {
            translateX: sway.interpolate({
              inputRange: [-1, 0, 1],
              outputRange: [-40, 0, 40],
            }),
          },
          {
            rotate: fall.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '720deg'],
            }),
          },
        ],
      }}
    />
  );
}

export default function CelebrationModal({ visible, emoji, title, text, onClose }) {
  const scale = useRef(new Animated.Value(0.7)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Pre-generate confetti configs so they're stable across renders
  const confettiConfigs = useMemo(() => {
    return Array.from({ length: NUM_CONFETTI }, () => ({
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 5 + Math.random() * 7,
      startX: Math.random() * SCREEN_WIDTH,
      delay: Math.random() * 600,
      duration: 2000 + Math.random() * 1200,
    }));
  }, [visible]);

  useEffect(() => {
    if (visible) {
      scale.setValue(0.7);
      overlayOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        {/* Confetti layer */}
        <View style={styles.confettiLayer} pointerEvents="none">
          {confettiConfigs.map((cfg, i) => (
            <ConfettiPiece key={i} {...cfg} />
          ))}
        </View>

        {/* Card */}
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.text}>{text}</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.8} style={styles.btn}>
            <Text style={styles.btnText}>Awesome!</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confettiLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    backgroundColor: colors.foam,
    borderRadius: 24,
    padding: 32,
    paddingHorizontal: 28,
    alignItems: 'center',
    maxWidth: 320,
    width: '85%',
    elevation: 10,
    zIndex: 10,
  },
  emoji: { fontSize: 56, marginBottom: 12 },
  title: {
    fontFamily: fonts.serif,
    fontSize: 22,
    fontWeight: '700',
    color: colors.espresso,
    marginBottom: 6,
    textAlign: 'center',
  },
  text: {
    fontSize: 14,
    color: colors.mocha,
    marginBottom: 20,
    lineHeight: 21,
    textAlign: 'center',
  },
  btn: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.caramel,
    elevation: 5,
  },
  btnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

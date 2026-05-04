import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function WelcomeScreen({ onGetStarted }) {
  const insets = useSafeAreaInsets();
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(30)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const btnY = useRef(new Animated.Value(40)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance animation
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(titleY, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.timing(subtitleOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(btnY, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(btnOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
    ]).start();

    // Floating coffee cup animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Decorative dots */}
      <View style={styles.decorDots}>
        {['#E8D5B7', '#B5D5B0', '#D5B8B8', '#D4C0A0', '#C9A0A0'].map((c, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: c,
                width: 8 + Math.random() * 20,
                height: 8 + Math.random() * 20,
                top: 40 + Math.random() * (SCREEN_HEIGHT * 0.3),
                left: Math.random() * 100 + '%',
                opacity: 0.3 + Math.random() * 0.3,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.content}>
        {/* Logo */}
        <Animated.View style={[styles.logoContainer, { opacity: logoOpacity, transform: [{ scale: logoScale }, { translateY: floatAnim }] }]}>
          <Text style={styles.logoEmoji}>☕</Text>
        </Animated.View>

        {/* Title */}
        <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleY }] }}>
          <Text style={styles.title}>Sipscape</Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View style={{ opacity: subtitleOpacity }}>
          <Text style={styles.subtitle}>Discover cafés. Collect stamps.{'\n'}Find your perfect brew.</Text>
        </Animated.View>

        {/* Feature highlights */}
        <Animated.View style={[styles.features, { opacity: subtitleOpacity }]}>
          {[
            { icon: '🛂', text: 'Earn stamps at every café' },
            { icon: '🎯', text: 'Complete fun challenges' },
            { icon: '💜', text: 'Find your perfect match' },
          ].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* Bottom CTA */}
      <Animated.View style={[styles.bottomSection, { opacity: btnOpacity, transform: [{ translateY: btnY }], paddingBottom: Math.max(30, insets.bottom + 10) }]}>
        <TouchableOpacity style={styles.getStartedBtn} activeOpacity={0.8} onPress={onGetStarted}>
          <Text style={styles.getStartedText}>Get Started</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7} onPress={onGetStarted}>
          <Text style={styles.loginLink}>Already have an account? <Text style={styles.loginLinkBold}>Log in</Text></Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.warmCream,
  },
  decorDots: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dot: {
    position: 'absolute',
    borderRadius: 50,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: colors.latte,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    elevation: 5,
  },
  logoEmoji: { fontSize: 50 },
  title: {
    fontFamily: fonts.serif,
    fontSize: 40,
    fontWeight: '700',
    color: colors.espresso,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.mocha,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  features: {
    alignSelf: 'stretch',
    marginHorizontal: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  featureIcon: { fontSize: 22, marginRight: 12 },
  featureText: { fontSize: 14, color: colors.espresso, fontWeight: '500' },
  bottomSection: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  getStartedBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: colors.caramel,
    alignItems: 'center',
    elevation: 4,
    marginBottom: 16,
  },
  getStartedText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  loginLink: {
    fontSize: 14,
    color: colors.mocha,
  },
  loginLinkBold: {
    color: colors.caramel,
    fontWeight: '600',
  },
});

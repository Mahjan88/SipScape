/**
 * HuntScreen — GPS-based coffee cup collection with cosmetic AR.
 *
 * ARCHITECTURE NOTE — upgrading to full native AR later:
 * -------------------------------------------------------
 * The AR experience is currently isolated in the <ARCollectView> component
 * at the bottom of this file. It uses expo-camera as a camera background
 * and renders an animated emoji cup on top — purely cosmetic, no spatial anchoring.
 *
 * When you're ready for real ARKit / ARCore:
 *   1. Eject from Expo managed workflow → `npx expo prebuild`
 *   2. Install ViroReact (best cross-platform AR for RN) or @react-three/xr
 *   3. Replace <ARCollectView> with your native AR component
 *   4. The rest of HuntScreen (GPS, proximity logic, state) stays exactly the same.
 *
 * The interface contract is simple:
 *   <ARCollectView
 *     cafe={selectedCafe}          ← cafe object with name, emoji, etc.
 *     onCollect={() => void}       ← called when user successfully taps the cup
 *     onClose={() => void}         ← called when user dismisses without collecting
 *   />
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useApp } from '../context/AppContext';
import { cafes } from '../data/cafes';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Proximity config ──────────────────────────────────────────────────────────
const COLLECT_RADIUS_METERS = 100; // how close the user needs to be

// DEV MODE: set to true to unlock all cafes regardless of distance (for testing)
const DEV_MODE = true;

// ─── Haversine distance (meters) ───────────────────────────────────────────────
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius in meters
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)}m away`;
  return `${(meters / 1000).toFixed(1)}km away`;
}

// ─── Main HuntScreen ───────────────────────────────────────────────────────────
export default function HuntScreen() {
  const { collectedCups, collectCup } = useApp();

  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [selectedCafe, setSelectedCafe] = useState(null); // triggers AR view
  const [justCollected, setJustCollected] = useState(null); // cafe ID of last collection

  // Request location on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission is needed to find nearby cafés.');
        return;
      }
      // Watch position for live updates
      const sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 10 },
        (loc) => setUserLocation(loc.coords)
      );
      return () => sub.remove();
    })();
  }, []);

  // Enrich cafes with distance + in-range status
  const enrichedCafes = cafes.map((cafe) => {
    const distance = userLocation
      ? getDistance(userLocation.latitude, userLocation.longitude, cafe.lat, cafe.lng)
      : null;
    const inRange = DEV_MODE || (distance !== null && distance <= COLLECT_RADIUS_METERS);
    const collected = collectedCups.has(cafe.id);
    return { ...cafe, distance, inRange, collected };
  });

  // Sort: in-range first, then by distance
  const sorted = [...enrichedCafes].sort((a, b) => {
    if (a.inRange && !b.inRange) return -1;
    if (!a.inRange && b.inRange) return 1;
    if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
    return 0;
  });

  const handleCollect = useCallback((cafe) => {
    collectCup(cafe.id, cafe.points);
    setJustCollected(cafe.id);
    setSelectedCafe(null);
    // Clear the "just collected" highlight after 3s
    setTimeout(() => setJustCollected(null), 3000);
  }, [collectCup]);

  const inRangeCount = sorted.filter((c) => c.inRange && !c.collected).length;
  const totalCollected = collectedCups.size;

  // ── Render AR overlay if a cafe is selected ──
  if (selectedCafe) {
    return (
      <ARCollectView
        cafe={selectedCafe}
        onCollect={() => handleCollect(selectedCafe)}
        onClose={() => setSelectedCafe(null)}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{totalCollected}</Text>
          <Text style={styles.statLabel}>Collected</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{cafes.length - totalCollected}</Text>
          <Text style={styles.statLabel}>Remaining</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{inRangeCount}</Text>
          <Text style={styles.statLabel}>Nearby</Text>
        </View>
      </View>

      {/* Location error */}
      {locationError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>📍 {locationError}</Text>
        </View>
      )}

      {/* DEV mode notice */}
      {DEV_MODE && (
        <View style={styles.devBanner}>
          <Text style={styles.devText}>🛠 Dev mode: all cafés unlocked for testing</Text>
        </View>
      )}

      {/* Cafe list */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>☕ Nearby Cups to Collect</Text>

        {sorted.map((cafe) => (
          <CafeHuntCard
            key={cafe.id}
            cafe={cafe}
            justCollected={justCollected === cafe.id}
            onPress={() => {
              if (cafe.collected) return; // already done
              if (!cafe.inRange) {
                Alert.alert(
                  'Too far away',
                  `You need to be within ${COLLECT_RADIUS_METERS}m of ${cafe.name} to collect this cup.\n\n${formatDistance(cafe.distance)}`,
                  [{ text: 'OK' }]
                );
                return;
              }
              setSelectedCafe(cafe);
            }}
          />
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

// ─── Individual cafe card ──────────────────────────────────────────────────────
function CafeHuntCard({ cafe, justCollected, onPress }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse the collect button when in range and not yet collected
  useEffect(() => {
    if (!cafe.inRange || cafe.collected) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [cafe.inRange, cafe.collected]);

  const isLocked = !cafe.inRange && !cafe.collected;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        cafe.collected && styles.cardCollected,
        cafe.inRange && !cafe.collected && styles.cardInRange,
        justCollected && styles.cardJustCollected,
      ]}
      onPress={onPress}
      activeOpacity={cafe.collected ? 1 : 0.8}
    >
      {/* Cafe emoji + name */}
      <View style={styles.cardLeft}>
        <View style={[styles.cardEmoji, cafe.collected && styles.cardEmojiCollected]}>
          <Text style={styles.cardEmojiText}>{cafe.collected ? '✅' : cafe.emoji}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, cafe.collected && { color: colors.mocha }]}>
            {cafe.name}
          </Text>
          <Text style={styles.cardAddress}>{cafe.address}</Text>
          {cafe.distance !== null && (
            <Text style={[styles.cardDistance, cafe.inRange && { color: '#4CAF50', fontWeight: '600' }]}>
              {cafe.inRange && !cafe.collected ? '📍 You\'re here!' : formatDistance(cafe.distance)}
            </Text>
          )}
        </View>
      </View>

      {/* Right side: status / button */}
      <View style={styles.cardRight}>
        {cafe.collected ? (
          <View style={styles.collectedBadge}>
            <Text style={styles.collectedBadgeText}>+{cafe.points} XP</Text>
          </View>
        ) : cafe.inRange ? (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <View style={styles.collectBtn}>
              <Text style={styles.collectBtnText}>Collect ☕</Text>
            </View>
          </Animated.View>
        ) : (
          <View style={styles.lockedBadge}>
            <Text style={styles.lockedText}>🔒</Text>
            <Text style={styles.lockedPoints}>{cafe.points} XP</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── AR Collect View ───────────────────────────────────────────────────────────
// This is the component to replace when upgrading to full native AR.
// Interface: <ARCollectView cafe={} onCollect={fn} onClose={fn} />
function ARCollectView({ cafe, onCollect, onClose }) {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [phase, setPhase] = useState('idle'); // idle | collecting | done

  // Floating cup animation
  const floatAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Burst particles
  const particles = useRef(
    Array.from({ length: 8 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  // Start idle float + rotate loop
  useEffect(() => {
    if (phase !== 'idle') return;
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -18, duration: 1200, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    );
    const rotate = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: -1, duration: 2000, useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    float.start();
    rotate.start();
    return () => { float.stop(); rotate.stop(); };
  }, [phase]);

  const handleTapCup = () => {
    if (phase !== 'idle') return;
    setPhase('collecting');

    floatAnim.stopAnimation();
    rotateAnim.stopAnimation();

    // Scale up → fly toward user → fade out
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.4, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: -80, duration: 500, useNativeDriver: true }),
      ]),
    ]).start(() => {
      setPhase('done');
      onCollect();
    });

    // Burst particles outward
    const angles = [0, 45, 90, 135, 180, 225, 270, 315];
    particles.forEach((p, i) => {
      const angle = (angles[i] * Math.PI) / 180;
      const dist = 80 + Math.random() * 40;
      Animated.parallel([
        Animated.timing(p.opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(p.x, { toValue: Math.cos(angle) * dist, duration: 600, useNativeDriver: true }),
        Animated.timing(p.y, { toValue: Math.sin(angle) * dist, duration: 600, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(300),
          Animated.timing(p.opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      ]).start();
    });
  };

  const spin = rotateAnim.interpolate({ inputRange: [-1, 1], outputRange: ['-12deg', '12deg'] });

  // Camera not yet determined
  if (!cameraPermission) return <View style={arStyles.container} />;

  // Camera permission denied — show fallback gradient background
  const showCamera = cameraPermission.granted;

  return (
    <View style={arStyles.container}>
      {/* Camera background (or fallback) */}
      {showCamera ? (
        <CameraView style={StyleSheet.absoluteFill} facing="back" />
      ) : (
        <View style={[StyleSheet.absoluteFill, arStyles.fallbackBg]} />
      )}

      {/* Dark overlay to make cup pop */}
      <View style={arStyles.overlay} />

      {/* Close button */}
      <TouchableOpacity style={arStyles.closeBtn} onPress={onClose}>
        <Text style={arStyles.closeBtnText}>✕</Text>
      </TouchableOpacity>

      {/* Cafe name label */}
      <View style={arStyles.cafeLabel}>
        <Text style={arStyles.cafeLabelEmoji}>{cafe.emoji}</Text>
        <Text style={arStyles.cafeLabelName}>{cafe.name}</Text>
        <Text style={arStyles.cafeLabelDrink}>{cafe.drink}</Text>
      </View>

      {/* Floating coffee cup — tap to collect */}
      <View style={arStyles.cupContainer} pointerEvents="box-none">
        {/* Burst particles */}
        {particles.map((p, i) => (
          <Animated.Text
            key={i}
            style={[
              arStyles.particle,
              {
                opacity: p.opacity,
                transform: [{ translateX: p.x }, { translateY: p.y }],
              },
            ]}
          >
            ✨
          </Animated.Text>
        ))}

        {/* The cup */}
        <TouchableOpacity onPress={handleTapCup} activeOpacity={0.9}>
          <Animated.Text
            style={[
              arStyles.cup,
              {
                transform: [
                  { translateY: floatAnim },
                  { rotate: spin },
                  { scale: scaleAnim },
                ],
                opacity: opacityAnim,
              },
            ]}
          >
            ☕
          </Animated.Text>
        </TouchableOpacity>
      </View>

      {/* Instruction */}
      {phase === 'idle' && (
        <View style={arStyles.hint}>
          <Text style={arStyles.hintText}>Tap the cup to collect!</Text>
          <Text style={arStyles.hintPoints}>+{cafe.points} XP</Text>
        </View>
      )}

      {/* Camera permission prompt */}
      {!cameraPermission.granted && (
        <TouchableOpacity style={arStyles.cameraPrompt} onPress={requestCameraPermission}>
          <Text style={arStyles.cameraPromptText}>📷 Enable camera for the full AR experience</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.warmCream },

  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.espresso,
    paddingVertical: 14,
    paddingHorizontal: 30,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '700', color: colors.foam, fontFamily: fonts.serif },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.15)' },

  errorBanner: {
    backgroundColor: '#FFECEC',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFCDD2',
  },
  errorText: { color: '#C62828', fontSize: 13, textAlign: 'center' },

  devBanner: {
    backgroundColor: '#FFF9C4',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9A825',
  },
  devText: { color: '#F57F17', fontSize: 11, textAlign: 'center', fontWeight: '500' },

  list: { flex: 1 },
  listContent: { padding: 16 },

  sectionTitle: {
    fontFamily: fonts.serif,
    fontSize: 17,
    fontWeight: '600',
    color: colors.espresso,
    marginBottom: 14,
    marginTop: 4,
  },

  // Card
  card: {
    backgroundColor: colors.foam,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.15)',
    elevation: 2,
  },
  cardCollected: {
    opacity: 0.65,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  cardInRange: {
    borderColor: '#4CAF50',
    borderWidth: 2,
    elevation: 5,
  },
  cardJustCollected: {
    borderColor: colors.caramel,
    backgroundColor: '#FFF8E7',
  },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  cardEmoji: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.warmBeige,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardEmojiCollected: { backgroundColor: '#F0F0F0' },
  cardEmojiText: { fontSize: 24 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '600', color: colors.espresso, marginBottom: 2 },
  cardAddress: { fontSize: 11, color: colors.mocha, marginBottom: 2 },
  cardDistance: { fontSize: 11, color: colors.mocha },

  cardRight: { marginLeft: 10, alignItems: 'center' },
  collectBtn: {
    backgroundColor: colors.caramel,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  collectBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  collectedBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  collectedBadgeText: { color: '#2E7D32', fontSize: 11, fontWeight: '600' },
  lockedBadge: { alignItems: 'center' },
  lockedText: { fontSize: 20 },
  lockedPoints: { fontSize: 10, color: colors.mocha, marginTop: 2 },
});

const arStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  fallbackBg: {
    backgroundColor: '#1a0a00',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  closeBtn: {
    position: 'absolute',
    top: 54,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },

  cafeLabel: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  cafeLabelEmoji: { fontSize: 28, marginBottom: 6 },
  cafeLabelName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    fontFamily: fonts.serif,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cafeLabelDrink: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  cupContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cup: {
    fontSize: 110,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  particle: {
    position: 'absolute',
    fontSize: 22,
  },

  hint: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  hintText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  hintPoints: {
    color: colors.caramel,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  cameraPrompt: {
    position: 'absolute',
    bottom: 60,
    left: 30,
    right: 30,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    zIndex: 10,
  },
  cameraPromptText: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
  },
});

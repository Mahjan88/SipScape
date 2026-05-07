import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useApp } from '../context/AppContext';
import { cafes } from '../data/cafes';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

const COLLECT_RADIUS_METERS = 100;
const DEV_MODE = true;

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
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

// ─── Home Screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { stampCount, streak, profile, collectedCups, collectCup } = useApp();
  const name = profile?.firstName || 'there';

  const [userLocation, setUserLocation] = useState(null);
  const [selectedCafe, setSelectedCafe] = useState(null);
  const [arTarget, setArTarget] = useState(null);
  const [justCollected, setJustCollected] = useState(null);

  // Animate the cafe detail card in/out below the map
  const detailAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 10 },
        (loc) => setUserLocation(loc.coords)
      );
      return () => sub.remove();
    })();
  }, []);

  useEffect(() => {
    Animated.spring(detailAnim, {
      toValue: selectedCafe ? 1 : 0,
      useNativeDriver: true,
      tension: 70,
      friction: 12,
    }).start();
  }, [selectedCafe]);

  const enrichedCafes = cafes.map((cafe) => {
    const distance = userLocation
      ? getDistance(userLocation.latitude, userLocation.longitude, cafe.lat, cafe.lng)
      : null;
    const inRange = DEV_MODE || (distance !== null && distance <= COLLECT_RADIUS_METERS);
    return { ...cafe, distance, inRange, collected: collectedCups.has(cafe.id) };
  });

  const handleCollect = useCallback((cafe) => {
    collectCup(cafe.id, cafe.points);
    setJustCollected(cafe.id);
    setArTarget(null);
    setSelectedCafe(null);
    setTimeout(() => setJustCollected(null), 3000);
  }, [collectCup]);

  const totalCollected = collectedCups.size;
  const progressPct = Math.round((totalCollected / cafes.length) * 100);

  const defaultRegion = userLocation
    ? { latitude: userLocation.latitude, longitude: userLocation.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : { latitude: 37.7749, longitude: -122.4194, latitudeDelta: 0.025, longitudeDelta: 0.025 };

  const detailTranslateY = detailAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] });
  const detailOpacity = detailAnim;

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingTitle}>Good morning, {name} ☀️</Text>
          <Text style={styles.greetingSub}>Ready to discover your next favorite spot?</Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { icon: '📍', num: stampCount, label: 'Cafés Visited' },
            { icon: '☕', num: totalCollected, label: 'Cups Collected' },
            { icon: '🔥', num: streak, label: 'Day Streak' },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={styles.statNum}>{s.num}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Cup Hunt header */}
        <View style={styles.huntHeader}>
          <Text style={styles.sectionTitle}>☕ Cup Hunt</Text>
          <Text style={styles.huntProgress}>{totalCollected}/{cafes.length} collected</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>

        {DEV_MODE && (
          <Text style={styles.devNote}>🛠 Dev mode — all cafés unlocked for testing</Text>
        )}

        {/* Map card */}
        <View style={styles.mapCard}>
          <MapView
            style={styles.map}
            initialRegion={defaultRegion}
            showsUserLocation
            showsMyLocationButton={false}
            onPress={() => setSelectedCafe(null)}
          >
            {DEV_MODE && userLocation && (
              <Circle
                center={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
                radius={COLLECT_RADIUS_METERS}
                fillColor="rgba(76,175,80,0.08)"
                strokeColor="rgba(76,175,80,0.3)"
                strokeWidth={1}
              />
            )}
            {enrichedCafes.map((cafe) => (
              <CafeMarker
                key={cafe.id}
                cafe={cafe}
                isSelected={selectedCafe?.id === cafe.id}
                onPress={() => {
                  if (cafe.collected) return;
                  if (!cafe.inRange) {
                    Alert.alert(
                      'Too far away',
                      `You need to be within ${COLLECT_RADIUS_METERS}m of ${cafe.name}.\n${cafe.distance ? formatDistance(cafe.distance) : ''}`,
                      [{ text: 'Got it' }]
                    );
                    return;
                  }
                  setArTarget(cafe);
                }}
              />
            ))}
          </MapView>
        </View>

        {/* Today's Challenge */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>🌧️ Today's Challenge</Text>
        <View style={styles.challengeCard}>
          <Text style={styles.challengeEmoji}>🌧️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.challengeTitle}>Rainy Day Explorer</Text>
            <Text style={styles.challengeDesc}>Visit a new café while it's raining. Double XP today!</Text>
          </View>
        </View>

        {/* Cafe detail card — slides in below map when a marker is tapped */}
        {selectedCafe && (
          <Animated.View style={{ opacity: detailOpacity, transform: [{ translateY: detailTranslateY }] }}>
            <CafeDetail
              cafe={selectedCafe}
              justCollected={justCollected === selectedCafe.id}
              onCollect={() => {
                if (!selectedCafe.inRange) {
                  Alert.alert(
                    'Too far away',
                    `You need to be within ${COLLECT_RADIUS_METERS}m of ${selectedCafe.name}.\n${selectedCafe.distance ? formatDistance(selectedCafe.distance) : ''}`,
                    [{ text: 'Got it' }]
                  );
                  return;
                }
                setArTarget(selectedCafe);
              }}
              onDismiss={() => setSelectedCafe(null)}
            />
          </Animated.View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* AR collect modal */}
      <Modal visible={!!arTarget} animationType="slide" onRequestClose={() => setArTarget(null)}>
        {arTarget && (
          <ARCollectView
            cafe={arTarget}
            onCollect={() => handleCollect(arTarget)}
            onClose={() => setArTarget(null)}
          />
        )}
      </Modal>
    </>
  );
}

// ─── Cafe marker ───────────────────────────────────────────────────────────────
function CafeMarker({ cafe, isSelected, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!cafe.inRange || cafe.collected) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [cafe.inRange, cafe.collected]);

  const bg = cafe.collected ? '#E0E0E0' : cafe.inRange ? '#4CAF50' : colors.caramel;

  return (
    <Marker coordinate={{ latitude: cafe.lat, longitude: cafe.lng }} onPress={onPress} tracksViewChanges={false}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
        <View style={[styles.markerPin, { backgroundColor: bg, borderColor: isSelected ? colors.espresso : '#fff', borderWidth: isSelected ? 3 : 2 }]}>
          <Text style={styles.markerEmoji}>{cafe.collected ? '✅' : cafe.emoji}</Text>
        </View>
        <View style={[styles.markerTail, { borderTopColor: bg }]} />
      </Animated.View>
    </Marker>
  );
}

// ─── Cafe detail card ──────────────────────────────────────────────────────────
function CafeDetail({ cafe, justCollected, onCollect, onDismiss }) {
  return (
    <View style={styles.detailCard}>
      <TouchableOpacity style={styles.detailDismiss} onPress={onDismiss}>
        <Text style={styles.detailDismissText}>✕</Text>
      </TouchableOpacity>

      <View style={styles.detailRow}>
        <View style={[styles.detailEmoji, { backgroundColor: cafe.collected ? '#F0F0F0' : colors.warmBeige }]}>
          <Text style={{ fontSize: 28 }}>{cafe.collected ? '✅' : cafe.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.detailName}>{cafe.name}</Text>
          <Text style={styles.detailDrink}>{cafe.drink}</Text>
          <Text style={styles.detailAddress}>{cafe.address}</Text>
          {cafe.distance !== null && (
            <Text style={[styles.detailDist, cafe.inRange && !cafe.collected && { color: '#4CAF50', fontWeight: '600' }]}>
              {cafe.inRange && !cafe.collected ? "📍 You're here!" : `📍 ${formatDistance(cafe.distance)}`}
            </Text>
          )}
        </View>

        <View style={{ marginLeft: 12 }}>
          {cafe.collected ? (
            <View style={styles.doneBadge}>
              <Text style={styles.doneCheck}>✓</Text>
              <Text style={styles.donePts}>+{cafe.points}XP</Text>
            </View>
          ) : cafe.inRange ? (
            <TouchableOpacity style={styles.collectBtn} onPress={onCollect} activeOpacity={0.85}>
              <Text style={styles.collectBtnText}>Collect</Text>
              <Text style={styles.collectBtnSub}>+{cafe.points} XP ☕</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.lockedBadge}>
              <Text style={{ fontSize: 22 }}>🔒</Text>
              <Text style={styles.lockedPts}>{cafe.points} XP</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── AR Collect View ───────────────────────────────────────────────────────────
function ARCollectView({ cafe, onCollect, onClose }) {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [phase, setPhase] = useState('idle');

  const floatAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const particles = useRef(
    Array.from({ length: 8 }, () => ({ x: new Animated.Value(0), y: new Animated.Value(0), opacity: new Animated.Value(0) }))
  ).current;

  useEffect(() => {
    if (phase !== 'idle') return;
    const float = Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: -18, duration: 1200, useNativeDriver: true }),
      Animated.timing(floatAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
    ]));
    const rotate = Animated.loop(Animated.sequence([
      Animated.timing(rotateAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      Animated.timing(rotateAnim, { toValue: -1, duration: 2000, useNativeDriver: true }),
      Animated.timing(rotateAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
    ]));
    float.start(); rotate.start();
    return () => { float.stop(); rotate.stop(); };
  }, [phase]);

  const handleTapCup = () => {
    if (phase !== 'idle') return;
    setPhase('collecting');
    floatAnim.stopAnimation(); rotateAnim.stopAnimation();
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.4, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: -80, duration: 500, useNativeDriver: true }),
      ]),
    ]).start(() => { setPhase('done'); onCollect(); });

    const angles = [0, 45, 90, 135, 180, 225, 270, 315];
    particles.forEach((p, i) => {
      const angle = (angles[i] * Math.PI) / 180;
      const dist = 80 + Math.random() * 40;
      Animated.parallel([
        Animated.timing(p.opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(p.x, { toValue: Math.cos(angle) * dist, duration: 600, useNativeDriver: true }),
        Animated.timing(p.y, { toValue: Math.sin(angle) * dist, duration: 600, useNativeDriver: true }),
        Animated.sequence([Animated.delay(300), Animated.timing(p.opacity, { toValue: 0, duration: 300, useNativeDriver: true })]),
      ]).start();
    });
  };

  const spin = rotateAnim.interpolate({ inputRange: [-1, 1], outputRange: ['-12deg', '12deg'] });

  return (
    <View style={ar.container}>
      {cameraPermission?.granted
        ? <CameraView style={StyleSheet.absoluteFill} facing="back" />
        : <View style={[StyleSheet.absoluteFill, ar.fallback]} />}
      <View style={ar.overlay} />
      <TouchableOpacity style={ar.closeBtn} onPress={onClose}>
        <Text style={ar.closeBtnText}>✕</Text>
      </TouchableOpacity>
      <View style={ar.cafeLabel}>
        <Text style={{ fontSize: 28, marginBottom: 6 }}>{cafe.emoji}</Text>
        <Text style={ar.cafeName}>{cafe.name}</Text>
        <Text style={ar.cafeDrink}>{cafe.drink}</Text>
      </View>
      <View style={ar.cupArea} pointerEvents="box-none">
        {particles.map((p, i) => (
          <Animated.Text key={i} style={[ar.particle, { opacity: p.opacity, transform: [{ translateX: p.x }, { translateY: p.y }] }]}>✨</Animated.Text>
        ))}
        <TouchableOpacity onPress={handleTapCup} activeOpacity={0.9}>
          <Animated.Text style={[ar.cup, { transform: [{ translateY: floatAnim }, { rotate: spin }, { scale: scaleAnim }], opacity: opacityAnim }]}>☕</Animated.Text>
        </TouchableOpacity>
      </View>
      {phase === 'idle' && (
        <View style={ar.hint}>
          <Text style={ar.hintText}>Tap the cup to collect!</Text>
          <Text style={ar.hintPts}>+{cafe.points} XP</Text>
        </View>
      )}
      {!cameraPermission?.granted && (
        <TouchableOpacity style={ar.cameraPrompt} onPress={requestCameraPermission}>
          <Text style={ar.cameraPromptText}>📷 Enable camera for the full AR experience</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.warmCream },
  content: { padding: 20, paddingBottom: 30 },

  greeting: { marginBottom: 20 },
  greetingTitle: { fontFamily: fonts.serif, fontSize: 26, fontWeight: '700', color: colors.espresso, marginBottom: 4 },
  greetingSub: { fontSize: 14, color: colors.mocha, fontWeight: '300' },

  statsRow: { flexDirection: 'row', marginBottom: 22 },
  statCard: { flex: 1, marginHorizontal: 4, backgroundColor: colors.foam, borderRadius: 16, padding: 14, alignItems: 'center', elevation: 3, borderWidth: 1, borderColor: 'rgba(212, 165, 116, 0.15)' },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statNum: { fontFamily: fonts.serif, fontSize: 22, fontWeight: '700', color: colors.espresso },
  statLabel: { fontSize: 9, color: colors.mocha, fontWeight: '500', marginTop: 2, textAlign: 'center' },

  huntHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 18, fontWeight: '600', color: colors.espresso },
  huntProgress: { fontSize: 12, color: colors.mocha, fontWeight: '500' },

  progressTrack: { height: 6, backgroundColor: 'rgba(212,165,116,0.2)', borderRadius: 3, marginBottom: 8 },
  progressFill: { height: 6, backgroundColor: colors.caramel, borderRadius: 3 },

  devNote: { fontSize: 10, color: '#F57F17', backgroundColor: '#FFF9C4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 10, overflow: 'hidden', alignSelf: 'flex-start' },

  // Map as a fixed-height card — users scroll past it normally
  mapCard: { borderRadius: 20, overflow: 'hidden', height: 300, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(212,165,116,0.2)', elevation: 4 },
  map: { flex: 1 },

  // Marker
  markerPin: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 4 },
  markerEmoji: { fontSize: 20 },
  markerTail: { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 9, borderLeftColor: 'transparent', borderRightColor: 'transparent', marginTop: -1 },

  // Cafe detail card below map
  detailCard: { backgroundColor: colors.foam, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(212,165,116,0.2)', elevation: 4 },
  detailDismiss: { position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.07)', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  detailDismissText: { fontSize: 13, color: colors.mocha, fontWeight: '600' },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  detailEmoji: { width: 52, height: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  detailName: { fontSize: 15, fontWeight: '700', color: colors.espresso, fontFamily: fonts.serif },
  detailDrink: { fontSize: 12, color: colors.mocha, marginTop: 2 },
  detailAddress: { fontSize: 11, color: colors.mocha, marginTop: 1 },
  detailDist: { fontSize: 11, color: colors.mocha, marginTop: 3 },

  collectBtn: { backgroundColor: colors.caramel, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 18, alignItems: 'center' },
  collectBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  collectBtnSub: { color: 'rgba(255,255,255,0.85)', fontSize: 10, marginTop: 2 },
  doneBadge: { alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14 },
  doneCheck: { fontSize: 20, color: '#2E7D32' },
  donePts: { fontSize: 10, color: '#2E7D32', fontWeight: '600', marginTop: 2 },
  lockedBadge: { alignItems: 'center' },
  lockedPts: { fontSize: 10, color: colors.mocha, marginTop: 2 },

  challengeCard: { backgroundColor: colors.foam, borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', elevation: 3, borderWidth: 1, borderColor: 'rgba(212, 165, 116, 0.15)' },
  challengeEmoji: { fontSize: 32, marginRight: 12 },
  challengeTitle: { fontSize: 14, fontWeight: '600', color: colors.espresso },
  challengeDesc: { fontSize: 12, color: colors.mocha, marginTop: 2 },
});

const ar = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  fallback: { backgroundColor: '#1a0a00' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  closeBtn: { position: 'absolute', top: 54, right: 20, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  cafeLabel: { position: 'absolute', top: 100, left: 0, right: 0, alignItems: 'center', zIndex: 5 },
  cafeName: { color: '#fff', fontSize: 22, fontWeight: '700', fontFamily: fonts.serif, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  cafeDrink: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  cupArea: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  cup: { fontSize: 110, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 12 },
  particle: { position: 'absolute', fontSize: 22 },
  hint: { position: 'absolute', bottom: 120, left: 0, right: 0, alignItems: 'center', zIndex: 5 },
  hintText: { color: '#fff', fontSize: 18, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  hintPts: { color: colors.caramel, fontSize: 14, fontWeight: '700', marginTop: 6, textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  cameraPrompt: { position: 'absolute', bottom: 60, left: 30, right: 30, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 14, alignItems: 'center', zIndex: 10 },
  cameraPromptText: { color: '#fff', fontSize: 13, textAlign: 'center' },
});

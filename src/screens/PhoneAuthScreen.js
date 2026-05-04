import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

function PhoneStep({ onNext, onBack }) {
  const [phone, setPhone] = useState('');
  const inputRef = useRef(null);

  const formatPhone = (text) => {
    const digits = text.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handleChange = (text) => {
    const digits = text.replace(/\D/g, '');
    if (digits.length <= 10) {
      setPhone(formatPhone(text));
    }
  };

  const isValid = phone.replace(/\D/g, '').length === 10;

  return (
    <View style={styles.stepContainer}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.stepEmoji}>📱</Text>
      <Text style={styles.stepTitle}>What's your number?</Text>
      <Text style={styles.stepSubtitle}>We'll send you a verification code</Text>

      <View style={styles.phoneInputContainer}>
        <View style={styles.countryCode}>
          <Text style={styles.countryFlag}>🇺🇸</Text>
          <Text style={styles.countryText}>+1</Text>
        </View>
        <TextInput
          ref={inputRef}
          style={styles.phoneInput}
          value={phone}
          onChangeText={handleChange}
          placeholder="(555) 123-4567"
          placeholderTextColor="rgba(109, 76, 65, 0.3)"
          keyboardType="phone-pad"
          autoFocus
        />
      </View>

      <TouchableOpacity
        style={[styles.nextBtn, !isValid && styles.nextBtnDisabled]}
        activeOpacity={0.8}
        onPress={() => isValid && onNext(phone)}
        disabled={!isValid}
      >
        <Text style={styles.nextBtnText}>Send Code</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        By continuing, you agree to our Terms of Service and Privacy Policy
      </Text>
    </View>
  );
}

function OTPStep({ phone, onVerify, onBack, onResend }) {
  const [otp, setOTP] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);
  const timerRef = useRef(null);

  React.useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleDigit = (text, index) => {
    const digit = text.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOTP(newOtp);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits entered
    if (newOtp.every((d) => d !== '')) {
      setTimeout(() => onVerify(newOtp.join('')), 300);
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOTP(newOtp);
    }
  };

  const handleResend = () => {
    setTimer(30);
    setCanResend(false);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    onResend?.();
  };

  return (
    <View style={styles.stepContainer}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.stepEmoji}>✉️</Text>
      <Text style={styles.stepTitle}>Enter the code</Text>
      <Text style={styles.stepSubtitle}>
        We sent a 6-digit code to{'\n'}
        <Text style={{ fontWeight: '600', color: colors.espresso }}>{phone}</Text>
      </Text>

      <View style={styles.otpRow}>
        {otp.map((digit, i) => (
          <TextInput
            key={i}
            ref={(ref) => (inputRefs.current[i] = ref)}
            style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
            value={digit}
            onChangeText={(text) => handleDigit(text, i)}
            onKeyPress={(e) => handleKeyPress(e, i)}
            keyboardType="number-pad"
            maxLength={1}
            autoFocus={i === 0}
            selectTextOnFocus
          />
        ))}
      </View>

      <View style={styles.resendRow}>
        {canResend ? (
          <TouchableOpacity onPress={handleResend}>
            <Text style={styles.resendActive}>Resend code</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.resendTimer}>Resend in {timer}s</Text>
        )}
      </View>

      <Text style={styles.demoHint}>
        💡 Demo mode: enter any 6 digits
      </Text>
    </View>
  );
}

export default function PhoneAuthScreen({ onComplete, onBack }) {
  const [step, setStep] = useState('phone'); // phone | otp
  const [phone, setPhone] = useState('');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const transition = (callback) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      callback();
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const handlePhoneNext = (phoneNum) => {
    setPhone(phoneNum);
    transition(() => setStep('otp'));
  };

  const handleVerify = (code) => {
    onComplete(phone);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
        {step === 'phone' && (
          <PhoneStep onNext={handlePhoneNext} onBack={onBack} />
        )}
        {step === 'otp' && (
          <OTPStep
            phone={phone}
            onVerify={handleVerify}
            onBack={() => transition(() => setStep('phone'))}
          />
        )}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.warmCream },
  inner: { flex: 1 },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 60,
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 16,
    left: 20,
    padding: 8,
  },
  backText: { fontSize: 16, color: colors.caramel, fontWeight: '500' },
  stepEmoji: { fontSize: 48, marginBottom: 16 },
  stepTitle: {
    fontFamily: fonts.serif,
    fontSize: 26,
    fontWeight: '700',
    color: colors.espresso,
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 15,
    color: colors.mocha,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.foam,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'rgba(212, 165, 116, 0.2)',
  },
  countryFlag: { fontSize: 18, marginRight: 6 },
  countryText: { fontSize: 16, fontWeight: '600', color: colors.espresso },
  phoneInput: {
    flex: 1,
    backgroundColor: colors.foam,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    fontWeight: '500',
    color: colors.espresso,
    borderWidth: 2,
    borderColor: 'rgba(212, 165, 116, 0.2)',
    letterSpacing: 0.5,
  },
  nextBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: colors.caramel,
    alignItems: 'center',
    elevation: 4,
    marginBottom: 16,
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  disclaimer: {
    fontSize: 11,
    color: colors.mocha,
    textAlign: 'center',
    lineHeight: 16,
    opacity: 0.7,
    paddingHorizontal: 20,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  otpInput: {
    width: 46,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.foam,
    borderWidth: 2,
    borderColor: 'rgba(212, 165, 116, 0.2)',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: colors.espresso,
    marginHorizontal: 4,
  },
  otpInputFilled: {
    borderColor: colors.caramel,
    backgroundColor: '#FDF6EC',
  },
  resendRow: { marginBottom: 20 },
  resendTimer: { fontSize: 14, color: colors.mocha },
  resendActive: { fontSize: 14, color: colors.caramel, fontWeight: '600' },
  demoHint: {
    fontSize: 12,
    color: colors.sage,
    fontWeight: '500',
    marginTop: 8,
  },
});

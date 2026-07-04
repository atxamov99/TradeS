import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Linking,
  TouchableOpacity,
  TextInput,
  Pressable,
  ActivityIndicator,
  AppState,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../store/ThemeContext';
import { SIZES, FONTS } from '../constants/theme';
import apiClient from '../services/api';
import { setToken, setUser } from '../store/authStore';
import { formatPhone } from '../utils/phoneFormatter';
import Input from '../components/ui/Input';

const BOT_URL = 'https://t.me/trades_uz_bot?start=register';
const TG_BLUE = '#229ED9';
const OTP_LEN = 6;

/* ── Segmented OTP input (6 boxes, single hidden field) ─────────── */
function OtpBoxes({ value, onChange, colors, isDark }) {
  const ref = useRef(null);
  const digits = value.split('');

  // blur→focus reliably (re)opens the iOS keyboard even when RN still thinks the
  // field is focused (e.g. after coming back from Telegram to copy the code).
  const focusInput = () => {
    ref.current?.blur();
    requestAnimationFrame(() => ref.current?.focus());
  };

  // Re-open the keyboard automatically when the app returns to the foreground.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setTimeout(() => ref.current?.focus(), 350);
    });
    return () => sub.remove();
  }, []);

  return (
    <Pressable style={styles.otpRow} onPress={focusInput}>
      {/* visual boxes (behind, not touchable) */}
      <View style={styles.otpBoxesRow} pointerEvents="none">
        {Array.from({ length: OTP_LEN }).map((_, i) => {
          const filled = i < digits.length;
          const active = i === digits.length;
          return (
            <View
              key={i}
              style={[
                styles.otpBox,
                {
                  backgroundColor: colors.card,
                  borderColor: active ? colors.primary : filled ? colors.primary + '66' : colors.border,
                },
                active && { borderWidth: 2 },
              ]}
            >
              <Text style={[styles.otpDigit, { color: colors.text }]}>{digits[i] || ''}</Text>
            </View>
          );
        })}
      </View>
      {/* real input on top; Pressable handles taps and (re)focuses it */}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(v) => onChange(v.replace(/\D/g, '').slice(0, OTP_LEN))}
        keyboardType="number-pad"
        maxLength={OTP_LEN}
        autoFocus
        caretHidden
        pointerEvents="none"
        style={styles.otpOverlayInput}
      />
    </Pressable>
  );
}

/* ── Primary gradient-ish button ────────────────────────────────── */
function BigButton({ title, onPress, loading, disabled, color, textColor = '#fff', icon }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[styles.bigBtn, { backgroundColor: color }, (disabled || loading) && { opacity: 0.55 }]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={textColor} style={{ marginRight: 8 }} />}
          <Text style={[styles.bigBtnText, { color: textColor }]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export default function RegisterScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isDark = colors.text === '#FFFFFF';

  const [step, setStep] = useState('form'); // 'form' | 'connect' | 'otp'
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const phoneDigits = phone.replace(/\D/g, '');
  const stepNum = step === 'form' ? 1 : 2;

  const sendCode = async () => {
    setLoading(true);
    try {
      await apiClient.post('/auth/request-otp', { phone });
      setCode('');
      setStep('otp');
    } catch (error) {
      if (error.response?.status === 428) setStep('connect');
      else Alert.alert(t('common.error'), error.response?.data?.message || t('auth.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    if (!name.trim() || phoneDigits.length < 12 || !password.trim()) {
      Alert.alert(t('common.error'), t('auth.fillAllFields'));
      return;
    }
    sendCode();
  };

  const handleVerify = async () => {
    if (code.length !== OTP_LEN) return;
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/verify-otp', {
        phone,
        code,
        name: name.trim(),
        password: password.trim(),
      });
      const { user, accessToken, refreshToken } = res.data.data;
      await setToken(accessToken, refreshToken);
      await setUser(user);
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (error) {
      Alert.alert(t('common.error'), error.response?.data?.message || t('auth.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => (step === 'form' ? navigation.navigate('Login') : setStep('form'));

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Top bar: back + step pills */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={goBack} activeOpacity={0.7} style={[styles.backBtn, { borderColor: colors.border }]}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.stepPills}>
            <View style={[styles.pill, { backgroundColor: colors.primary }]} />
            <View style={[styles.pill, { backgroundColor: stepNum >= 2 ? colors.primary : colors.border }]} />
          </View>
        </View>

        {/* Brand header */}
        <View style={styles.header}>
          <View style={[styles.logoTile, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
            <Ionicons name="cart" size={34} color="#fff" />
          </View>
          <Text style={[styles.brand, { color: colors.text }]}>TradeS</Text>
        </View>

        {/* ── STEP 1: FORM ─────────────────────────── */}
        {step === 'form' && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{t('auth.signUp')}</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {t('auth.otpSubtitle') || "Telefon raqamingiz orqali ro'yxatdan o'ting"}
            </Text>

            <Input
              label={t('auth.name')}
              placeholder={t('auth.namePlaceholder')}
              value={name}
              onChangeText={setName}
              isDark={isDark}
              icon={<Ionicons name="person-outline" size={20} color={colors.textMuted} />}
            />
            <Input
              label={t('auth.phone')}
              placeholder="+998 90 123 45 67"
              value={phone}
              onChangeText={(txt) => setPhone(formatPhone(txt))}
              keyboardType="phone-pad"
              isDark={isDark}
              icon={<Ionicons name="call-outline" size={20} color={colors.textMuted} />}
            />
            <View style={styles.formHint}>
              <Ionicons name="paper-plane-outline" size={13} color={colors.textMuted} />
              <Text style={[styles.formHintText, { color: colors.textMuted }]}>
                {t('auth.formTgHint') || 'Tasdiqlash kodi bepul — Telegram bot orqali keladi'}
              </Text>
            </View>
            <Input
              label={t('auth.password')}
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              isDark={isDark}
              icon={<Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />}
              rightIcon={<Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />}
              onRightIconPress={() => setShowPassword(!showPassword)}
              containerStyle={{ marginBottom: 20 }}
            />

            <BigButton
              title={t('auth.getCode') || 'Kod olish'}
              onPress={handleStart}
              loading={loading}
              color={colors.primary}
              icon="arrow-forward"
            />

            <View style={styles.footerRow}>
              <Text style={{ color: colors.textMuted, fontSize: SIZES.md }}>
                {t('auth.haveAccount') || 'Hisobingiz bormi?'}{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={{ color: colors.primary, fontSize: SIZES.md, ...FONTS.bold }}>{t('auth.signIn')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── STEP 2a: CONNECT TELEGRAM ────────────── */}
        {step === 'connect' && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.bigIcon, { backgroundColor: TG_BLUE + '1F' }]}>
              <Ionicons name="paper-plane" size={38} color={TG_BLUE} />
            </View>
            <Text style={[styles.title, { color: colors.text, textAlign: 'center' }]}>
              {t('auth.connectTitle') || "Telegram'ni ulang"}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted, textAlign: 'center' }]}>
              {t('auth.connectShort') || 'Kod bepul — Telegram orqali keladi'}
            </Text>

            {/* icon-based steps — each shows at a glance what to do */}
            {[
              { icon: 'paper-plane-outline', text: t('auth.cStep1') || "«Telegram botni ochish» tugmasini bosing" },
              { icon: 'call-outline', text: t('auth.cStep2') || "Botda «📱 Raqamni ulashish» ni bosing" },
              { icon: 'key-outline', text: t('auth.cStep3') || "6 xonali kod shu botga keladi — o'sha yerdan olasiz" },
            ].map((s, i) => (
              <View key={i} style={styles.stepLine}>
                <View style={[styles.stepNum, { backgroundColor: colors.primary + '22' }]}>
                  <Ionicons name={s.icon} size={17} color={colors.primary} />
                </View>
                <Text style={[styles.stepText, { color: colors.text }]}>{s.text}</Text>
              </View>
            ))}

            <View style={{ height: 8 }} />
            <BigButton
              title={t('auth.openBot') || 'Telegram botni ochish'}
              onPress={() => Linking.openURL(BOT_URL)}
              color={TG_BLUE}
              icon="paper-plane"
            />
            <View style={{ height: 12 }} />
            <BigButton
              title={t('auth.connectDone') || 'Uladim — kod yuborish'}
              onPress={sendCode}
              loading={loading}
              color={colors.primary}
              icon="checkmark"
            />
          </View>
        )}

        {/* ── STEP 2b: OTP ─────────────────────────── */}
        {step === 'otp' && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.bigIcon, { backgroundColor: colors.primary + '1F' }]}>
              <Ionicons name="shield-checkmark" size={38} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text, textAlign: 'center' }]}>
              {t('auth.otpTitle') || 'Tasdiqlash kodi'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted, textAlign: 'center', marginBottom: 6 }]}>
              {t('auth.otpDesc') || "Telegram'ga yuborilgan 6 xonali kod"}
            </Text>
            <Text style={[styles.phoneChip, { color: colors.primary }]}>{phone}</Text>

            <View style={[styles.tgHint, { backgroundColor: TG_BLUE + '14' }]}>
              <Ionicons name="paper-plane" size={14} color={TG_BLUE} />
              <Text style={[styles.tgHintText, { color: colors.textMuted }]}>
                {t('auth.otpHint') || 'Kod @trades_uz_bot botiga yuborildi'}
              </Text>
            </View>

            <OtpBoxes value={code} onChange={setCode} colors={colors} isDark={isDark} />

            <View style={{ height: 24 }} />
            <BigButton
              title={t('auth.verify') || 'Tasdiqlash'}
              onPress={handleVerify}
              loading={loading}
              disabled={code.length !== OTP_LEN}
              color={colors.primary}
              icon="checkmark-circle"
            />

            <TouchableOpacity onPress={sendCode} disabled={loading} style={styles.resendBtn}>
              <Ionicons name="refresh" size={15} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, fontSize: SIZES.md, marginLeft: 6 }}>
                {t('auth.resend') || 'Kodni qayta yuborish'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 36 },

  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backBtn: {
    width: 42, height: 42, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  stepPills: { flexDirection: 'row', gap: 6, marginLeft: 14, flex: 1 },
  pill: { height: 5, borderRadius: 3, flex: 1 },

  header: { alignItems: 'center', marginBottom: 24 },
  logoTile: {
    width: 68, height: 68, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  brand: { fontSize: 26, ...FONTS.bold, letterSpacing: 0.5 },

  card: {
    width: '100%', borderRadius: 24, borderWidth: 1, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 4,
  },
  title: { fontSize: 23, ...FONTS.bold, marginBottom: 6 },
  subtitle: { fontSize: SIZES.md, marginBottom: 22, lineHeight: 20 },

  bigBtn: {
    height: 54, borderRadius: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
  },
  bigBtnText: { fontSize: SIZES.base, ...FONTS.bold },

  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },

  formHint: { flexDirection: 'row', alignItems: 'center', marginTop: -6, marginBottom: 18, paddingHorizontal: 2 },
  formHintText: { fontSize: SIZES.sm, marginLeft: 6, flex: 1 },

  bigIcon: {
    width: 80, height: 80, borderRadius: 26, alignSelf: 'center',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  stepLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  stepNum: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  stepNumText: { fontSize: SIZES.md, ...FONTS.bold },
  stepText: { flex: 1, fontSize: SIZES.md, lineHeight: 19 },

  note: {
    borderRadius: 14, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 14, marginTop: 4,
  },
  noteText: { fontSize: SIZES.md, lineHeight: 19, ...FONTS.medium },

  phoneChip: { fontSize: SIZES.base, ...FONTS.bold, textAlign: 'center', marginBottom: 12 },
  tgHint: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, marginBottom: 22,
  },
  tgHintText: { fontSize: SIZES.sm, marginLeft: 6 },

  otpRow: { position: 'relative', height: 56, justifyContent: 'center' },
  otpBoxesRow: { flexDirection: 'row', justifyContent: 'space-between' },
  otpBox: {
    width: 46, height: 56, borderRadius: 14, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  otpDigit: { fontSize: 24, ...FONTS.bold },
  otpOverlayInput: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0, color: 'transparent',
  },

  resendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 18 },
});

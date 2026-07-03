import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../store/ThemeContext';
import { SIZES, FONTS } from '../constants/theme';
import apiClient from '../services/api';
import { setToken, setUser } from '../store/authStore';
import { formatPhone } from '../utils/phoneFormatter';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

const BOT_URL = 'https://t.me/trades_uz_bot';

export default function RegisterScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [step, setStep] = useState('form'); // 'form' | 'connect' | 'otp'
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const phoneDigits = phone.replace(/\D/g, '');

  // Send (or resend) the OTP. On 428 the phone isn't linked to Telegram yet.
  const sendCode = async () => {
    setLoading(true);
    try {
      await apiClient.post('/auth/request-otp', { phone });
      setStep('otp');
    } catch (error) {
      if (error.response?.status === 428) {
        setStep('connect');
      } else {
        Alert.alert(t('common.error'), error.response?.data?.message || t('auth.registerFailed'));
      }
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
    if (code.replace(/\D/g, '').length !== 6) {
      Alert.alert(t('common.error'), t('auth.fillAllFields'));
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/verify-otp', {
        phone,
        code: code.replace(/\D/g, ''),
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

  const handlePhoneChange = (text) => setPhone(formatPhone(text));

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style={colors.background === '#0F172A' ? 'light' : 'dark'} backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.headerSection}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
            <Ionicons name="cart" size={40} color="#fff" />
          </View>
          <Text style={[styles.appName, { color: colors.primary }]}>TradeS</Text>
          <Text style={[styles.appSubtitle, { color: colors.textMuted }]}>{t('app.subtitle') || 'Boshqaruv tizimi'}</Text>
        </View>

        {/* ── STEP: FORM ─────────────────────────────── */}
        {step === 'form' && (
          <Card style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('auth.signUp')}</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
              {t('auth.otpSubtitle') || 'Telefon raqamingiz orqali ro\'yxatdan o\'ting'}
            </Text>

            <Input
              label={t('auth.name')}
              placeholder={t('auth.namePlaceholder')}
              value={name}
              onChangeText={setName}
              icon={<Ionicons name="person-outline" size={20} color={colors.textMuted} />}
            />

            <Input
              label={t('auth.phone')}
              placeholder="+998 90 123 45 67"
              value={phone}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              icon={<Ionicons name="call-outline" size={20} color={colors.textMuted} />}
            />

            <Input
              label={t('auth.password')}
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              icon={<Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />}
              rightIcon={<Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />}
              onRightIconPress={() => setShowPassword(!showPassword)}
              containerStyle={{ marginBottom: 24 }}
            />

            <Button
              title={t('auth.getCode') || 'Kod olish'}
              onPress={handleStart}
              loading={loading}
              variant="primary"
              style={{ height: 52 }}
            />

            <Button
              title={t('auth.signIn')}
              onPress={() => navigation.navigate('Login')}
              variant="outline"
              style={{ marginTop: 12, borderHeight: 0, borderColor: 'transparent' }}
              textStyle={{ color: colors.primary }}
            />
          </Card>
        )}

        {/* ── STEP: CONNECT TELEGRAM ─────────────────── */}
        {step === 'connect' && (
          <Card style={styles.card}>
            <View style={styles.centerIcon}>
              <View style={[styles.iconCircle, { backgroundColor: '#229ED922' }]}>
                <Ionicons name="paper-plane" size={36} color="#229ED9" />
              </View>
            </View>
            <Text style={[styles.cardTitle, { color: colors.text, textAlign: 'center' }]}>
              {t('auth.connectTitle') || 'Telegram\'ni ulang'}
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.textMuted, textAlign: 'center' }]}>
              {t('auth.connectDesc') ||
                'Tasdiqlash kodi Telegram orqali yuboriladi (bepul). Botni oching, «Start» bosing va «📱 Raqamni ulashish» tugmasi bilan raqamingizni yuboring.'}
            </Text>

            <Button
              title={t('auth.openBot') || 'Telegram botni ochish'}
              onPress={() => Linking.openURL(BOT_URL)}
              variant="primary"
              style={{ height: 52, backgroundColor: '#229ED9', marginBottom: 12 }}
            />
            <Button
              title={t('auth.connectDone') || 'Uladim — kod yuborish'}
              onPress={sendCode}
              loading={loading}
              variant="primary"
              style={{ height: 52 }}
            />
            <Button
              title={t('common.back') || 'Orqaga'}
              onPress={() => setStep('form')}
              variant="outline"
              style={{ marginTop: 12, borderColor: 'transparent' }}
              textStyle={{ color: colors.textMuted }}
            />
          </Card>
        )}

        {/* ── STEP: OTP ──────────────────────────────── */}
        {step === 'otp' && (
          <Card style={styles.card}>
            <View style={styles.centerIcon}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + '22' }]}>
                <Ionicons name="key" size={36} color={colors.primary} />
              </View>
            </View>
            <Text style={[styles.cardTitle, { color: colors.text, textAlign: 'center' }]}>
              {t('auth.otpTitle') || 'Tasdiqlash kodi'}
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.textMuted, textAlign: 'center' }]}>
              {(t('auth.otpDesc') || 'Telegram\'ga yuborilgan 6 xonali kodni kiriting')}
            </Text>
            <Text style={[styles.phoneLabel, { color: colors.primary }]}>{phone}</Text>

            <Input
              label={t('auth.code') || 'Kod'}
              placeholder="••••••"
              value={code}
              onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              icon={<Ionicons name="keypad-outline" size={20} color={colors.textMuted} />}
              containerStyle={{ marginBottom: 24 }}
            />

            <Button
              title={t('auth.verify') || 'Tasdiqlash'}
              onPress={handleVerify}
              loading={loading}
              variant="primary"
              style={{ height: 52 }}
            />
            <Button
              title={t('auth.resend') || 'Kodni qayta yuborish'}
              onPress={sendCode}
              variant="outline"
              style={{ marginTop: 12, borderColor: 'transparent' }}
              textStyle={{ color: colors.primary }}
            />
            <Button
              title={t('common.back') || 'Orqaga'}
              onPress={() => setStep('form')}
              variant="outline"
              style={{ marginTop: 4, borderColor: 'transparent' }}
              textStyle={{ color: colors.textMuted }}
            />
          </Card>
        )}

        <Text style={[styles.footer, { color: colors.textMuted }]}>{t('app.version')}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  headerSection: { alignItems: 'center', marginBottom: 40 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  appName: { fontSize: 28, ...FONTS.bold, letterSpacing: 1 },
  appSubtitle: { fontSize: SIZES.md, marginTop: 4 },
  card: { width: '100%', padding: 24 },
  cardTitle: { fontSize: 24, ...FONTS.bold, marginBottom: 8 },
  cardSubtitle: { fontSize: SIZES.base, marginBottom: 24, lineHeight: 20 },
  centerIcon: { alignItems: 'center', marginBottom: 16 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneLabel: { fontSize: SIZES.md, ...FONTS.bold, textAlign: 'center', marginBottom: 20 },
  footer: { marginTop: 40, fontSize: SIZES.xs },
});

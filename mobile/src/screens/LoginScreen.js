import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../store/ThemeContext';
import { SIZES, FONTS } from '../constants/theme';
import apiClient from '../services/api';
import { setToken, setUser } from '../store/authStore';
import { formatPhone, cleanIdentifier } from '../utils/phoneFormatter';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isDark = colors.text === '#FFFFFF';
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      Alert.alert(t('common.error'), t('auth.fillFields'));
      return;
    }

    setLoading(true);
    try {
      const cleanedId = cleanIdentifier(phone);
      const payload = { password: password.trim() };

      if (cleanedId.includes('@')) {
        payload.email = cleanedId;
      } else {
        payload.phone = cleanedId;
      }

      const response = await apiClient.post('/auth/login', payload);

      const { user, accessToken, refreshToken } = response.data.data;
      await setToken(accessToken, refreshToken);
      await setUser(user);

      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (error) {
      const message =
        error.response?.data?.message || t('auth.loginFailed');
      Alert.alert(t('common.error'), message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (text) => {
    setPhone(formatPhone(text));
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style={colors.background === '#0F172A' ? 'light' : 'dark'} backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerSection}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
            <Ionicons name="cart" size={40} color="#fff" />
          </View>
          <Text style={[styles.appName, { color: colors.primary }]}>TradeS</Text>
          <Text style={[styles.appSubtitle, { color: colors.textMuted }]}>{t('app.subtitle') || 'Boshqaruv tizimi'}</Text>
        </View>

        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('auth.welcome')}</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>{t('auth.signInSubtitle')}</Text>

          <Input
            label={t('auth.phone')}
            placeholder="+998 90 123 45 67"
            value={phone}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
            isDark={isDark}
            icon={<Ionicons name="call-outline" size={20} color={colors.textMuted} />}
          />

          <Input
            label={t('auth.password')}
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            isDark={isDark}
            icon={<Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />}
            rightIcon={
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textMuted}
              />
            }
            onRightIconPress={() => setShowPassword(!showPassword)}
            containerStyle={{ marginBottom: 24 }}
          />

          <Button
            title={t('auth.signIn')}
            onPress={handleLogin}
            loading={loading}
            variant="primary"
            style={{ height: 52 }}
          />

          <Button
            title={t('auth.signUp')}
            onPress={() => navigation.navigate('Register')}
            variant="outline"
            style={{ marginTop: 12, borderHeight: 0, borderColor: 'transparent' }}
            textStyle={{ color: colors.primary }}
          />
        </Card>

        <Text style={[styles.footer, { color: colors.textMuted }]}>{t('app.version')}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  appName: {
    fontSize: 28,
    ...FONTS.bold,
    letterSpacing: 1,
  },
  appSubtitle: {
    fontSize: SIZES.md,
    marginTop: 4,
  },
  card: {
    width: '100%',
    padding: 24,
  },
  cardTitle: {
    fontSize: 24,
    ...FONTS.bold,
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: SIZES.base,
    marginBottom: 24,
  },
  footer: {
    marginTop: 40,
    fontSize: SIZES.xs,
  },
});

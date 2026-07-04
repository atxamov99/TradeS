import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Switch,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../store/ThemeContext';
import { changeLanguage } from '../i18n/i18n';
import { clearToken, clearUser, getUser, getToken, setUser } from '../store/authStore';
import { ADMIN_URL } from '../constants/api';
import api from '../services/api';
import {
  getSettings,
  setCurrency,
  setTaxEnabled,
  setTaxRate,
  setReceiptTitle,
  setReceiptHeader,
  setReceiptFooter,
  clearAllSettings,
} from '../store/settingsStore';
import { SIZES } from '../constants/theme';

const LANGUAGES = [
  { code: 'uz', label: 'settings.uzbek' },
  { code: 'ru', label: 'settings.russian' },
  { code: 'en', label: 'settings.english' },
];

const CURRENCIES = [
  { value: 'UZS', label: 'settings.uzs' },
  { value: 'USD', label: 'settings.usd' },
  { value: 'RUB', label: 'settings.rub' },
];

export default function SettingsScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const { colors, themeList, themeId, setTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const currentLang = i18n.language;
  const [user, setUserState] = useState(null);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', telegram: '', instagram: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const [showHelpModal, setShowHelpModal] = useState(false);

  const [localSettings, setLocalSettings] = useState({
    currency: 'UZS',
    taxEnabled: false,
    taxRate: 0,
    receiptTitle: '',
    receiptHeader: '',
    receiptFooter: '',
  });

  useEffect(() => {
    const load = async () => {
      const u = await getUser();
      setUserState(u);
      const s = await getSettings();
      setLocalSettings(s);
    };
    load();
  }, []);

  const handleLangChange = async (langCode) => {
    await changeLanguage(langCode);
  };

  const handleOpenAdminPanel = async () => {
    const token = await getToken();
    if (!token) return;
    const url = `${ADMIN_URL}/sso?accessToken=${encodeURIComponent(token)}`;
    Linking.openURL(url).catch(() =>
      Alert.alert(t('common.error'), t('settings.adminPanelOpenFailed'))
    );
  };

  const handlePasswordChange = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('common.error'), t('common.fillFields'));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('settings.passwordMismatch'));
      return;
    }
    try {
      await api.patch('/users/change-password', {
        currentPassword,
        newPassword,
      });
      Alert.alert(t('common.success'), t('settings.passwordChanged'));
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) {
      Alert.alert(t('common.error'), e.response?.data?.message || t('common.error'));
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.patch('/users/profile', {
        name: editForm.name.trim(),
        email: editForm.email.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        telegram: editForm.telegram.trim() || undefined,
        instagram: editForm.instagram.trim() || undefined,
      });

      if (passwordForm.newPassword) {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
          Alert.alert(t('common.error'), t('settings.passwordMismatch'));
          setSaving(false);
          return;
        }
        await api.patch('/users/change-password', {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        });
      }

      const updatedUser = { ...user, ...editForm };
      await setUser(updatedUser);
      setUserState(updatedUser);
      setShowEditProfile(false);
      Alert.alert(t('common.success'), t('settings.profileUpdated'));
    } catch (e) {
      Alert.alert(t('common.error'), e.response?.data?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      t('settings.clearData'),
      t('settings.clearDataConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await clearAllSettings();
            Alert.alert(t('common.success'), t('settings.clearDataDone'));
          },
        },
      ]
    );
  };

  const performLogout = async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.clear();
    const parent = navigation.getParent();
    if (parent) {
      parent.reset({ index: 0, routes: [{ name: 'Login' }] });
    } else {
      navigation.replace ? navigation.replace('Login') : navigation.navigate('Login');
    }
  };

  const handleLogout = () => {
    const { Platform } = require('react-native');
    if (Platform.OS === 'web') {
      if (window.confirm(t('settings.logoutConfirm'))) {
        performLogout();
      }
    } else {
      Alert.alert(
        'Logout',
        t('settings.logoutConfirm'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('settings.logout'),
            style: 'destructive',
            onPress: performLogout,
          },
        ]
      );
    }
  };

  const updateSetting = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const persistSetting = async (key, value) => {
    switch (key) {
      case 'currency': await setCurrency(value); break;
      case 'taxEnabled': await setTaxEnabled(value); break;
      case 'taxRate': await setTaxRate(value); break;
      case 'receiptTitle': await setReceiptTitle(value); break;
      case 'receiptHeader': await setReceiptHeader(value); break;
      case 'receiptFooter': await setReceiptFooter(value); break;
    }
  };

  const renderProfileCard = () => {
    if (!user) return null;
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 24 }]}>
        <TouchableOpacity
          style={styles.profileRow}
          activeOpacity={0.7}
          onPress={() => {
            setEditForm({
              name: user?.name || '',
              email: user?.email || '',
              phone: user?.phone || '',
              telegram: user?.telegram || '',
              instagram: user?.instagram || '',
            });
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setShowEditProfile(true);
          }}
        >
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            <Text style={styles.avatarText}>
              {(user.name || user.phone || 'U')[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.name || 'User'}</Text>
            <Text style={styles.profileSub}>
              {user.phone ? `+${user.phone}` : ''}{user.email ? `  •  ${user.email}` : ''}
            </Text>
            <Text style={styles.profileRole}>{user.role || ''}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderSettingCard = (titleKey, children) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t(titleKey)}</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );

  const renderRow = (icon, label, onPress, rightElement, hideBorder) => (
    <TouchableOpacity
      style={[styles.settingRow, !hideBorder && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        {icon}
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      {rightElement}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {renderProfileCard()}

      {['ADMIN', 'SUPER_ADMIN'].includes(user?.role?.toUpperCase()) && renderSettingCard('settings.adminPanel', (
        <>
          {renderRow(
            <Ionicons name="people-outline" size={20} color={colors.accent} />,
            'Foydalanuvchilar',
            () => navigation.navigate('AdminUsers'),
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          )}
          {renderRow(
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.accent} />,
            t('settings.openAdminPanel'),
            handleOpenAdminPanel,
            <Ionicons name="open-outline" size={20} color={colors.textMuted} />,
            true
          )}
        </>
      ))}

      {renderSettingCard('settings.language', (
        LANGUAGES.map((lang, idx) =>
          <View key={lang.code}>
            {renderRow(
              <Ionicons name="language-outline" size={20} color={currentLang === lang.code ? colors.accent : colors.textMuted} />,
              t(lang.label),
              () => handleLangChange(lang.code),
              currentLang === lang.code
                ? <Ionicons name="checkmark" size={20} color={colors.accent} />
                : null,
              idx === LANGUAGES.length - 1
            )}
          </View>
        )
      ))}

      {renderSettingCard('settings.theme', (
        themeList.map((theme, idx) =>
          <View key={theme.id}>
            {renderRow(
              <View style={[styles.themeDot, { backgroundColor: theme.colors.accent }]} />,
              theme.name,
              () => setTheme(theme.id),
              themeId === theme.id
                ? <Ionicons name="checkmark" size={20} color={colors.accent} />
                : null,
              idx === themeList.length - 1
            )}
          </View>
        )
      ))}

      {renderSettingCard('settings.currency', (
        CURRENCIES.map((cur, idx) =>
          <View key={cur.value}>
            {renderRow(
              <Ionicons name="cash-outline" size={20} color={localSettings.currency === cur.value ? colors.accent : colors.textMuted} />,
              t(cur.label),
              async () => {
                updateSetting('currency', cur.value);
                await persistSetting('currency', cur.value);
              },
              localSettings.currency === cur.value
                ? <Ionicons name="checkmark" size={20} color={colors.accent} />
                : null,
              idx === CURRENCIES.length - 1
            )}
          </View>
        )
      ))}

      {renderSettingCard('settings.tax', (
        <>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="calculator-outline" size={20} color={colors.accent} />
              <Text style={styles.settingLabel}>{t('settings.taxEnabled')}</Text>
            </View>
            <Switch
              value={localSettings.taxEnabled}
              onValueChange={async (val) => {
                updateSetting('taxEnabled', val);
                await persistSetting('taxEnabled', val);
              }}
              trackColor={{ false: colors.border, true: colors.accent + '60' }}
              thumbColor={localSettings.taxEnabled ? colors.accent : colors.textMuted}
            />
          </View>
          {localSettings.taxEnabled && (
            <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
              <View style={styles.settingLeft}>
                <Ionicons name="percent-outline" size={20} color={colors.accent} />
                <Text style={styles.settingLabel}>{t('settings.taxRate')}</Text>
              </View>
              <TextInput
                style={[styles.taxInput, { color: colors.text, borderColor: colors.border }]}
                keyboardType="decimal-pad"
                value={String(localSettings.taxRate)}
                onChangeText={(val) => {
                  const num = parseFloat(val) || 0;
                  updateSetting('taxRate', num);
                }}
                onBlur={() => persistSetting('taxRate', localSettings.taxRate)}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          )}
        </>
      ))}

      {renderSettingCard('settings.receipt', (
        <>
          {renderRow(
            <Ionicons name="document-text-outline" size={20} color={colors.accent} />,
            t('settings.receiptTitle'),
            null,
            <TextInput
              style={[styles.receiptInput, { color: colors.text, borderColor: colors.border }]}
              value={localSettings.receiptTitle}
              onChangeText={(val) => updateSetting('receiptTitle', val)}
              onBlur={() => persistSetting('receiptTitle', localSettings.receiptTitle)}
              placeholder={t('settings.receiptTitlePlaceholder')}
              placeholderTextColor={colors.textMuted}
            />,
            false
          )}
          {renderRow(
            <Ionicons name="text-outline" size={20} color={colors.accent} />,
            t('settings.receiptHeader'),
            null,
            <TextInput
              style={[styles.receiptInput, { color: colors.text, borderColor: colors.border }]}
              value={localSettings.receiptHeader}
              onChangeText={(val) => updateSetting('receiptHeader', val)}
              onBlur={() => persistSetting('receiptHeader', localSettings.receiptHeader)}
              placeholder={t('settings.receiptHeaderPlaceholder')}
              placeholderTextColor={colors.textMuted}
            />,
            false
          )}
          {renderRow(
            <Ionicons name="text-outline" size={20} color={colors.accent} />,
            t('settings.receiptFooter'),
            null,
            <TextInput
              style={[styles.receiptInput, { color: colors.text, borderColor: colors.border }]}
              value={localSettings.receiptFooter}
              onChangeText={(val) => updateSetting('receiptFooter', val)}
              onBlur={() => persistSetting('receiptFooter', localSettings.receiptFooter)}
              placeholder={t('settings.receiptFooterPlaceholder')}
              placeholderTextColor={colors.textMuted}
            />,
            true
          )}
        </>
      ))}

      {renderSettingCard('', (
        <>
          {renderRow(
            <Ionicons name="help-circle-outline" size={20} color={colors.accent} />,
            t('settings.help'),
            () => setShowHelpModal(true)
          )}
          {renderRow(
            <Ionicons name="trash-outline" size={20} color={colors.danger} />,
            t('settings.clearData'),
            handleClearData
          )}
          {renderRow(
            <Ionicons name="information-circle-outline" size={20} color={colors.accent} />,
            t('settings.about'),
            null,
            <Text style={styles.settingValue}>{t('app.version')}</Text>,
            true
          )}
        </>
      ))}

      <TouchableOpacity
        style={[styles.logoutBtn, { backgroundColor: colors.card, borderColor: colors.danger }]}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={[styles.logoutText, { color: colors.danger }]}>{t('settings.logout')}</Text>
      </TouchableOpacity>

      <Modal visible={showEditProfile} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
            <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('settings.editProfileTitle')}</Text>

              <Text style={[styles.modalLabel, { color: colors.textMuted }]}>{t('settings.name')}</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder={t('settings.namePlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={editForm.name}
                onChangeText={(val) => setEditForm(f => ({ ...f, name: val }))}
              />

              <Text style={[styles.modalLabel, { color: colors.textMuted }]}>{t('settings.email')}</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder={t('settings.emailPlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={editForm.email}
                onChangeText={(val) => setEditForm(f => ({ ...f, email: val }))}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={[styles.modalLabel, { color: colors.textMuted }]}>{t('settings.phoneLabel')}</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder={t('settings.phonePlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={editForm.phone}
                onChangeText={(val) => setEditForm(f => ({ ...f, phone: val }))}
                keyboardType="phone-pad"
              />

              <Text style={[styles.modalLabel, { color: colors.textMuted }]}>{t('settings.telegram')}</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder={t('settings.telegramPlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={editForm.telegram}
                onChangeText={(val) => setEditForm(f => ({ ...f, telegram: val }))}
                autoCapitalize="none"
              />

              <Text style={[styles.modalLabel, { color: colors.textMuted }]}>{t('settings.instagram')}</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder={t('settings.instagramPlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={editForm.instagram}
                onChangeText={(val) => setEditForm(f => ({ ...f, instagram: val }))}
                autoCapitalize="none"
              />

              <View style={styles.passwordSection}>
                <Text style={[styles.sectionTitle, { color: colors.textMuted, marginBottom: 12 }]}>{t('settings.changePasswordSection')}</Text>

                <Text style={[styles.modalLabel, { color: colors.textMuted }]}>{t('settings.currentPassword')}</Text>
                <TextInput
                  style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  placeholder={t('settings.currentPassword')}
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  value={passwordForm.currentPassword}
                  onChangeText={(val) => setPasswordForm(p => ({ ...p, currentPassword: val }))}
                />

                <Text style={[styles.modalLabel, { color: colors.textMuted }]}>{t('settings.newPassword')}</Text>
                <TextInput
                  style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  placeholder={t('settings.newPassword')}
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  value={passwordForm.newPassword}
                  onChangeText={(val) => setPasswordForm(p => ({ ...p, newPassword: val }))}
                />

                <Text style={[styles.modalLabel, { color: colors.textMuted }]}>{t('settings.confirmPassword')}</Text>
                <TextInput
                  style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  placeholder={t('settings.confirmPassword')}
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  value={passwordForm.confirmPassword}
                  onChangeText={(val) => setPasswordForm(p => ({ ...p, confirmPassword: val }))}
                />
              </View>

              <View style={styles.modalBtns}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: colors.background }]}
                  onPress={() => {
                    setShowEditProfile(false);
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  disabled={saving}
                >
                  <Text style={[styles.modalBtnText, { color: colors.text }]}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: colors.accent }, saving && { opacity: 0.6 }]}
                  onPress={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={[styles.modalBtnText, { color: '#fff' }]}>{t('settings.saveProfile')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showHelpModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('settings.helpTitle')}</Text>
            <Text style={[styles.helpText, { color: colors.textMuted }]}>{t('settings.helpText')}</Text>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.accent, alignSelf: 'center', marginTop: 16 }]}
              onPress={() => setShowHelpModal(false)}
            >
              <Text style={[styles.modalBtnText, { color: '#fff' }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: SIZES.xxl,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: colors.text,
    fontSize: SIZES.lg,
    fontWeight: '700',
  },
  profileSub: {
    color: colors.textMuted,
    fontSize: SIZES.sm,
    marginTop: 2,
  },
  profileRole: {
    color: colors.textMuted,
    fontSize: SIZES.sm,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: SIZES.sm,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 50,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingLabel: {
    color: colors.text,
    fontSize: SIZES.base,
    fontWeight: '500',
  },
  settingValue: {
    color: colors.textMuted,
    fontSize: SIZES.sm,
    maxWidth: 140,
    textAlign: 'right',
  },
  themeDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  taxInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: SIZES.base,
    width: 80,
    textAlign: 'center',
  },
  receiptInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: SIZES.sm,
    maxWidth: 160,
    textAlign: 'right',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: SIZES.base,
    fontWeight: '600',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 24,
    justifyContent: 'center',
  },
  modalLabel: {
    fontSize: SIZES.sm,
    fontWeight: '500',
    marginBottom: 6,
  },
  passwordSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: SIZES.lg,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: SIZES.base,
    marginBottom: 12,
  },
  modalBtns: {
    flexDirection: 'column-reverse',
    gap: 12,
    marginTop: 16,
  },
  modalBtn: {
    width: '100%',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    fontSize: SIZES.base,
    fontWeight: '600',
  },
  helpText: {
    fontSize: SIZES.base,
    lineHeight: 22,
    textAlign: 'center',
  },
});

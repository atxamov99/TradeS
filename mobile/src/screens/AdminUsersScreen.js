import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../store/ThemeContext';
import { SIZES, FONTS } from '../constants/theme';
import apiClient from '../services/api';
import { getUser } from '../store/authStore';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { formatPhone } from '../utils/phoneFormatter';

const ROLES = ['USER', 'ADMIN', 'SUPER_ADMIN'];
const ROLE_LABEL = { USER: 'Foydalanuvchi', ADMIN: 'Admin', SUPER_ADMIN: 'Super Admin' };
const ROLE_COLOR = { USER: '#64748b', ADMIN: '#2563eb', SUPER_ADMIN: '#D66853' };

export default function AdminUsersScreen({ navigation }) {
  const { colors } = useTheme();
  const isDark = colors.text === '#FFFFFF';

  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', password: '', role: 'USER' });
  const [saving, setSaving] = useState(false);

  const isSuper = me?.role?.toUpperCase() === 'SUPER_ADMIN';

  const load = useCallback(async (q = '') => {
    try {
      const res = await apiClient.get('/admin/users', { params: { limit: 100, search: q || undefined } });
      setUsers(res.data.data.users || []);
    } catch (e) {
      Alert.alert('Xatolik', e.response?.data?.message || 'Foydalanuvchilarni yuklab bo\'lmadi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    (async () => setMe(await getUser()))();
    load();
  }, [load]);

  // debounce search
  useEffect(() => {
    const id = setTimeout(() => load(search.trim()), 400);
    return () => clearTimeout(id);
  }, [search, load]);

  const onRefresh = () => { setRefreshing(true); load(search.trim()); };

  const changeRole = (user) => {
    if (!isSuper) { Alert.alert('Ruxsat yo\'q', 'Faqat Super Admin rol o\'zgartira oladi'); return; }
    const buttons = ROLES.filter((r) => r !== user.role).map((r) => ({
      text: ROLE_LABEL[r],
      onPress: async () => {
        try {
          await apiClient.patch(`/admin/users/${user.id}`, { role: r });
          load(search.trim());
        } catch (e) {
          Alert.alert('Xatolik', e.response?.data?.message || 'Rolni o\'zgartirib bo\'lmadi');
        }
      },
    }));
    Alert.alert(user.name || 'Foydalanuvchi', 'Yangi rolni tanlang', [...buttons, { text: 'Bekor', style: 'cancel' }]);
  };

  const toggleBlock = async (user) => {
    try {
      await apiClient.patch(`/admin/users/${user.id}/${user.isBlocked ? 'unblock' : 'block'}`);
      load(search.trim());
    } catch (e) {
      Alert.alert('Xatolik', e.response?.data?.message || 'Amalni bajarib bo\'lmadi');
    }
  };

  const removeUser = (user) => {
    if (!isSuper) { Alert.alert('Ruxsat yo\'q', 'Faqat Super Admin o\'chira oladi'); return; }
    Alert.alert('O\'chirish', `${user.name || 'Foydalanuvchi'}ni o\'chirasizmi?`, [
      { text: 'Bekor', style: 'cancel' },
      {
        text: 'O\'chirish', style: 'destructive',
        onPress: async () => {
          try { await apiClient.delete(`/admin/users/${user.id}`); load(search.trim()); }
          catch (e) { Alert.alert('Xatolik', e.response?.data?.message || 'O\'chirib bo\'lmadi'); }
        },
      },
    ]);
  };

  const openActions = (user) => {
    Alert.alert(
      user.name || 'Foydalanuvchi',
      `${user.phone || user.email || ''}\nRol: ${ROLE_LABEL[user.role] || user.role}`,
      [
        { text: 'Rolni o\'zgartirish', onPress: () => changeRole(user) },
        { text: user.isBlocked ? 'Blokdan chiqarish' : 'Bloklash', onPress: () => toggleBlock(user) },
        ...(isSuper ? [{ text: 'O\'chirish', style: 'destructive', onPress: () => removeUser(user) }] : []),
        { text: 'Yopish', style: 'cancel' },
      ]
    );
  };

  const createUser = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.password.trim()) {
      Alert.alert('Xatolik', 'Ism, telefon va parolni to\'ldiring');
      return;
    }
    if (form.role !== 'USER' && !isSuper) {
      Alert.alert('Ruxsat yo\'q', 'Admin rolni faqat Super Admin bera oladi');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/admin/users', {
        name: form.name.trim(),
        phone: form.phone.replace(/\s/g, ''),
        password: form.password.trim(),
        role: form.role,
      });
      setShowAdd(false);
      setForm({ name: '', phone: '', password: '', role: 'USER' });
      load(search.trim());
    } catch (e) {
      Alert.alert('Xatolik', e.response?.data?.message || 'Qo\'shib bo\'lmadi');
    } finally {
      setSaving(false);
    }
  };

  const renderUser = ({ item }) => {
    const initial = (item.name || item.phone || '?').charAt(0).toUpperCase();
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => openActions(item)}
        style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={[styles.avatar, { backgroundColor: (ROLE_COLOR[item.role] || colors.primary) + '22' }]}>
          <Text style={[styles.avatarText, { color: ROLE_COLOR[item.role] || colors.primary }]}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {item.name || 'Ismsiz'}{item.isBlocked ? '  🚫' : ''}
          </Text>
          <Text style={[styles.sub, { color: colors.textMuted }]} numberOfLines={1}>
            {item.phone || item.email || '—'}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: (ROLE_COLOR[item.role] || colors.primary) + '1A' }]}>
          <Text style={[styles.badgeText, { color: ROLE_COLOR[item.role] || colors.primary }]}>
            {ROLE_LABEL[item.role] || item.role}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.hBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.hTitle, { color: colors.text }]}>Foydalanuvchilar</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.hBtn}>
          <Ionicons name="person-add" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* search */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <Input
          placeholder="Ism yoki telefon bo'yicha qidirish"
          value={search}
          onChangeText={setSearch}
          isDark={isDark}
          icon={<Ionicons name="search-outline" size={18} color={colors.textMuted} />}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} size="large" />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => u.id}
          renderItem={renderUser}
          contentContainerStyle={{ padding: 16, paddingTop: 4 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 40 }}>Foydalanuvchi topilmadi</Text>
          }
        />
      )}

      {/* Add user modal */}
      <Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalWrap}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={styles.modalHead}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Yangi foydalanuvchi</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Input label="Ism" placeholder="To'liq ism" value={form.name} isDark={isDark}
                onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
                icon={<Ionicons name="person-outline" size={18} color={colors.textMuted} />} />
              <Input label="Telefon" placeholder="+998 90 123 45 67" value={form.phone} isDark={isDark}
                keyboardType="phone-pad"
                onChangeText={(v) => setForm((p) => ({ ...p, phone: formatPhone(v) }))}
                icon={<Ionicons name="call-outline" size={18} color={colors.textMuted} />} />
              <Input label="Parol" placeholder="Kamida 6 belgi" value={form.password} isDark={isDark}
                secureTextEntry
                onChangeText={(v) => setForm((p) => ({ ...p, password: v }))}
                icon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />} />

              <Text style={[styles.roleLabel, { color: colors.textMuted }]}>Rol</Text>
              <View style={styles.roleRow}>
                {ROLES.map((r) => {
                  const active = form.role === r;
                  const disabled = r !== 'USER' && !isSuper;
                  return (
                    <TouchableOpacity
                      key={r}
                      disabled={disabled}
                      onPress={() => setForm((p) => ({ ...p, role: r }))}
                      style={[
                        styles.roleChip,
                        { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary + '1A' : 'transparent' },
                        disabled && { opacity: 0.4 },
                      ]}
                    >
                      <Text style={{ color: active ? colors.primary : colors.textMuted, fontSize: SIZES.sm, ...FONTS.semibold }}>
                        {ROLE_LABEL[r]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Button title="Qo'shish" onPress={createUser} loading={saving} variant="primary"
                style={{ height: 50, backgroundColor: colors.primary, marginTop: 20 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingTop: 56, paddingBottom: 12, borderBottomWidth: 1,
  },
  hBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  hTitle: { fontSize: SIZES.lg, ...FONTS.bold },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, borderWidth: 1, padding: 12, marginBottom: 10,
  },
  avatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: SIZES.lg, ...FONTS.bold },
  name: { fontSize: SIZES.base, ...FONTS.semibold },
  sub: { fontSize: SIZES.sm, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  badgeText: { fontSize: SIZES.xs, ...FONTS.bold },

  modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000066' },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: SIZES.xl, ...FONTS.bold },
  roleLabel: { fontSize: SIZES.sm, ...FONTS.medium, marginBottom: 8, marginTop: 4 },
  roleRow: { flexDirection: 'row', gap: 8 },
  roleChip: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
});

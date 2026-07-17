import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Modal,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { adminApi } from '../../api';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  studentId: string;
  faculty: string;
  year: number;
  role: string;
  isActive: boolean;
  avatar?: string;
}

const ROLES = ['student', 'organizer', 'admin'];

export default function UserManagementScreen() {
  const { colors } = useTheme();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const loadUsers = async () => {
    try {
      const data = await adminApi.getAdminUsers();
      setUsers(data);
    } catch (e) {
      console.error('Failed to load users:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleActive = async (userId: string, userName: string, currentActive: boolean) => {
    Alert.alert(
      currentActive ? 'Deactivate User' : 'Activate User',
      `${currentActive ? 'Deactivate' : 'Activate'} ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await adminApi.toggleUserActive(userId);
              setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
              Alert.alert('Done', `User ${currentActive ? 'deactivated' : 'activated'}.`);
            } catch (e) {
              Alert.alert('Error', 'Failed to update user status.');
            }
          },
        },
      ]
    );
  };

  const openRoleModal = (userId: string, currentRole: string) => {
    setSelectedUserId(userId);
    setSelectedRole(currentRole);
    setRoleModalVisible(true);
  };

  const handleRoleChange = async () => {
    try {
      await adminApi.updateUserRole(selectedUserId, selectedRole);
      setUsers(prev => prev.map(u => u.id === selectedUserId ? { ...u, role: selectedRole } : u));
      setRoleModalVisible(false);
      Alert.alert('Done', 'User role updated.');
    } catch (e) {
      Alert.alert('Error', 'Failed to update role.');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    Alert.alert('Delete User', `Permanently delete ${userName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminApi.deleteUser(userId);
            setUsers(prev => prev.filter(u => u.id !== userId));
            Alert.alert('Done', 'User deleted.');
          } catch (e) {
            Alert.alert('Error', 'Failed to delete user.');
          }
        },
      },
    ]);
  };

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#8b5cf6';
      case 'organizer': return '#f59e0b';
      default: return '#3b82f6';
    }
  };

  const renderUser = ({ item }: { item: UserRecord }) => (
    <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: item.isActive ? colors.border : '#fecaca' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{item.name}</Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>{item.email}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ backgroundColor: getRoleColor(item.role) + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: getRoleColor(item.role), textTransform: 'uppercase' }}>{item.role}</Text>
          </View>
          {!item.isActive && (
            <View style={{ backgroundColor: '#fef2f2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#ef4444' }}>INACTIVE</Text>
            </View>
          )}
        </View>
      </View>

      {item.studentId ? <Text style={{ fontSize: 12, color: colors.textMuted }}>ID: {item.studentId}</Text> : null}
      {item.faculty ? <Text style={{ fontSize: 12, color: colors.textMuted }}>Faculty: {item.faculty}</Text> : null}

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        <TouchableOpacity
          onPress={() => openRoleModal(item.id, item.role)}
          style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: colors.primaryLight || colors.primary + '15', borderWidth: 1, borderColor: colors.primary + '30' }}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>Role</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleToggleActive(item.id, item.name, item.isActive)}
          style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: item.isActive ? '#fef3c7' : '#dcfce7', borderWidth: 1, borderColor: item.isActive ? '#fbbf24' : '#22c55e' }}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: item.isActive ? '#d97706' : '#16a34a' }}>{item.isActive ? 'Deactivate' : 'Activate'}</Text>
        </TouchableOpacity>
        {item.role !== 'admin' && (
          <TouchableOpacity
            onPress={() => handleDeleteUser(item.id, item.name)}
            style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#dc2626' }}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>User Management</Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
          {users.length} users · {users.filter(u => u.isActive).length} active
        </Text>
        <TextInput
          style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, backgroundColor: colors.background, color: colors.text, marginTop: 10 }}
          placeholder="Search users..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadUsers(); }} tintColor={colors.primary} />}
        />
      )}

      <Modal visible={roleModalVisible} transparent animationType="fade" onRequestClose={() => setRoleModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 }}>Change Role</Text>
            {ROLES.map(role => (
              <TouchableOpacity
                key={role}
                onPress={() => setSelectedRole(role)}
                style={{ paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, marginBottom: 8, backgroundColor: selectedRole === role ? colors.primary + '15' : colors.background, borderWidth: 1.5, borderColor: selectedRole === role ? colors.primary : colors.border }}
              >
                <Text style={{ fontSize: 15, fontWeight: selectedRole === role ? '700' : '400', color: selectedRole === role ? colors.primary : colors.text, textTransform: 'capitalize' }}>{role}</Text>
              </TouchableOpacity>
            ))}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity onPress={() => setRoleModalVisible(false)} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRoleChange} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

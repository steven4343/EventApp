import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Image,
  StyleSheet, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { userApi } from '../../api';
import { Club } from '../../types';
import { normalizeImage } from '../../utils/image';

type RouteParams = { ClubAdmin: { clubId: string; clubName: string } };

export function ClubAdminScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'ClubAdmin'>>();
  const { clubId, clubName } = route.params;
  const [verified, setVerified] = useState(false);
  const [password, setPassword] = useState('');
  const [checking, setChecking] = useState(false);

  const [club, setClub] = useState<Club | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [editName, setEditName] = useState('');
  const [editSlogan, setEditSlogan] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showAddMember, setShowAddMember] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [adding, setAdding] = useState(false);

  const presidentId = userApi.getCurrentUser()?.id;

  const handleVerify = async () => {
    if (!password.trim()) return;
    setChecking(true);
    const ok = await userApi.verifyClubAdmin(clubId, password);
    setChecking(false);
    if (ok) {
      setVerified(true);
    } else {
      Alert.alert('Access Denied', 'Invalid admin password');
    }
  };

  const loadData = async () => {
    setLoading(true);
    const [data, mems] = await Promise.all([
      userApi.getClubForScreenById(clubId),
      userApi.getClubMembers(clubId),
    ]);
    setClub(data);
    setMembers(mems);
    if (data) {
      setEditName(data.name);
      setEditSlogan(data.shortDescription);
      setEditDescription(data.description);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (verified) loadData();
  }, [verified]);

  const handleSave = async () => {
    if (!editName.trim()) { Alert.alert('Error', 'Name is required'); return; }
    setSaving(true);
    try {
      const updated = await userApi.updateClub(clubId, {
        name: editName.trim(),
        shortDescription: editSlogan.trim(),
        description: editDescription.trim(),
      }, presidentId);
      setClub(prev => prev ? { ...prev, name: updated.name, shortDescription: updated.shortDescription, description: updated.description } : prev);
      setShowEdit(false);
      Alert.alert('Saved', 'Club details updated');
    } catch (e) {
      Alert.alert('Error', 'Failed to update club');
    }
    setSaving(false);
  };

  const handleAddMember = async () => {
    if (!addEmail.trim()) return;
    setAdding(true);
    try {
      const user = await userApi.searchUser(addEmail.trim());
      if (!user) { Alert.alert('Error', 'User not found'); setAdding(false); return; }
      await userApi.addClubMember(clubId, user.id, 'Member', presidentId);
      setAddEmail('');
      setShowAddMember(false);
      loadData();
      Alert.alert('Success', `${user.name} added as member`);
    } catch (e) {
      Alert.alert('Error', 'Failed to add member');
    }
    setAdding(false);
  };

  const handleRemoveMember = (userId: string, userName: string) => {
    Alert.alert('Remove Member', `Remove ${userName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          await userApi.removeClubMember(clubId, userId, presidentId);
          loadData();
        } catch (e) {
          Alert.alert('Error', 'Failed to remove member');
        }
      }},
    ]);
  };

  if (!verified) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={{ fontSize: 24, color: '#fff' }}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Club Admin</Text>
        </View>
        <View style={styles.passwordGate}>
          <Text style={styles.gateTitle}>{clubName}</Text>
          <Text style={styles.gateSubtitle}>Enter admin password to manage this club</Text>
          <TextInput
            style={styles.passwordInput}
            value={password}
            onChangeText={setPassword}
            placeholder="Admin password"
            secureTextEntry
            autoFocus
          />
          <TouchableOpacity style={styles.verifyButton} onPress={handleVerify} disabled={checking}>
            {checking ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.verifyButtonText}>Access Club Admin</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={{ fontSize: 24, color: '#fff' }}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{club?.name || 'Club Admin'}</Text>
      </View>
      <ScrollView style={styles.content}>
        <TouchableOpacity style={styles.card} onPress={() => setShowEdit(true)}>
          <Text style={styles.cardTitle}>Edit Club Details</Text>
          <Text style={styles.cardSub}>Name, slogan, description</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => setShowAddMember(true)}>
          <Text style={styles.cardTitle}>Add Member</Text>
          <Text style={styles.cardSub}>Add a user by email</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Members ({members.length})</Text>
        {members.map((m: any) => (
          <View key={m.id} style={styles.memberItem}>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{m.name}</Text>
              <Text style={styles.memberEmail}>{m.email}</Text>
              <Text style={styles.memberRole}>{m.role}</Text>
            </View>
            {m.role !== 'President' && (
              <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveMember(m.user_id, m.name)}>
                <Text style={styles.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        <View style={{ height: 60 }} />
      </ScrollView>

      <Modal visible={showEdit} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Club Details</Text>
            <Text style={styles.label}>Club Name</Text>
            <TextInput style={styles.input} value={editName} onChangeText={setEditName} />
            <Text style={styles.label}>Slogan</Text>
            <TextInput style={styles.input} value={editSlogan} onChangeText={setEditSlogan} />
            <Text style={styles.label}>Description</Text>
            <TextInput style={[styles.input, { height: 100 }]} value={editDescription} onChangeText={setEditDescription} multiline />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEdit(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showAddMember} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Member</Text>
            <Text style={styles.label}>User Email</Text>
            <TextInput
              style={styles.input}
              value={addEmail}
              onChangeText={setAddEmail}
              placeholder="user@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowAddMember(false); setAddEmail(''); }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddMember} disabled={adding}>
                {adding ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Add</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#2563eb', paddingTop: 50, paddingBottom: 16,
    paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center',
  },
  backButton: { marginRight: 12, padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  passwordGate: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  gateTitle: { fontSize: 24, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  gateSubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24 },
  passwordInput: {
    width: '100%', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12,
    padding: 14, fontSize: 16, backgroundColor: '#fff', marginBottom: 16,
  },
  verifyButton: {
    backgroundColor: '#2563eb', borderRadius: 20, paddingVertical: 14,
    paddingHorizontal: 32, alignItems: 'center', width: '100%',
  },
  verifyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  content: { padding: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  cardSub: { fontSize: 13, color: '#64748b', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginTop: 16, marginBottom: 12 },
  memberItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0',
  },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  memberEmail: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  memberRole: { fontSize: 12, color: '#2563eb', marginTop: 2, fontWeight: '500' },
  removeBtn: { backgroundColor: '#fee2e2', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  removeBtnText: { color: '#dc2626', fontSize: 13, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12,
    fontSize: 15, backgroundColor: '#f8fafc',
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 12 },
  cancelBtnText: { fontSize: 15, color: '#64748b', fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#2563eb', borderRadius: 20, paddingHorizontal: 24,
    paddingVertical: 12, alignItems: 'center', minWidth: 80,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput, ActivityIndicator, Linking } from 'react-native';

import { AdminLoginScreen } from './components/screens/AdminLoginScreen';
import { adminApi } from './api';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Text style={styles.tabIconText}>{icon}</Text>
    </View>
  );
}

function DashboardScreen() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to load stats:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Manage events and clubs</Text>
      </View>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.users ?? 0}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.events?.published ?? 0}</Text>
          <Text style={styles.statLabel}>Published Events</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.events?.draft ?? 0}</Text>
          <Text style={styles.statLabel}>Draft Events</Text>
        </View>
      </View>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.clubs?.active ?? 0}</Text>
          <Text style={styles.statLabel}>Active Clubs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.clubs?.pending ?? 0}</Text>
          <Text style={styles.statLabel}>Pending Clubs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.tickets ?? 0}</Text>
          <Text style={styles.statLabel}>Tickets Sold</Text>
        </View>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function CreateEventModal({ visible, onClose, onCreated }: { visible: boolean; onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!title || !date || !location) {
      Alert.alert('Error', 'Title, date, and location are required');
      return;
    }
    setSubmitting(true);
    try {
      await adminApi.createEvent({
        title,
        date,
        time: time || 'TBD',
        location,
        category: category || 'General',
        description: description || '',
        image: imageUrl || 'https://picsum.photos/seed/event/400',
        price: parseFloat(price) || 0,
        attendees: 0,
        maxCapacity: parseInt(maxCapacity) || 0,
        rating: 0,
        reviews: 0,
        status: 'Draft',
      });
      Alert.alert('Success', 'Event created');
      onCreated();
      onClose();
      setTitle(''); setDate(''); setTime(''); setLocation('');
      setCategory(''); setDescription(''); setPrice(''); setMaxCapacity(''); setImageUrl('');
    } catch (e) {
      Alert.alert('Error', 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalTitle}>Create Event</Text>
          <TextInput style={styles.input} placeholder="Title *" value={title} onChangeText={setTitle} />
          <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD) *" value={date} onChangeText={setDate} />
          <TextInput style={styles.input} placeholder="Time (e.g. 7:00 PM)" value={time} onChangeText={setTime} />
          <TextInput style={styles.input} placeholder="Location *" value={location} onChangeText={setLocation} />
          <TextInput style={styles.input} placeholder="Category" value={category} onChangeText={setCategory} />
          <TextInput style={styles.input} placeholder="Price (0 for free)" value={price} onChangeText={setPrice} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Max Capacity" value={maxCapacity} onChangeText={setMaxCapacity} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Image URL" value={imageUrl} onChangeText={setImageUrl} />
          <TextInput style={[styles.input, styles.textArea]} placeholder="Description" value={description} onChangeText={setDescription} multiline />
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleCreate} disabled={submitting}><Text style={styles.submitText}>{submitting ? 'Creating...' : 'Create Event'}</Text></TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function EventsManagementScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const categories = ['', 'Academic', 'Cultural', 'Hackathon', 'Social', 'Sports'];

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApi.getEvents(undefined, categoryFilter || undefined);
      setEvents(data);
    } catch (e) {
      console.error('Failed to load events:', e);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handlePublish = async (id: string) => {
    try {
      await adminApi.publishEvent(id);
      loadEvents();
    } catch (e) {
      Alert.alert('Error', 'Failed to publish event');
    }
  };

  const handleUnpublish = async (id: string) => {
    try {
      await adminApi.unpublishEvent(id);
      loadEvents();
    } catch (e) {
      Alert.alert('Error', 'Failed to unpublish event');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Event', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await adminApi.deleteEvent(id);
          loadEvents();
        } catch (e) {
          Alert.alert('Error', 'Failed to delete event');
        }
      }},
    ]);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Published': return styles.statusPublished;
      case 'Draft': return styles.statusDraft;
      case 'Cancelled': return styles.statusCancelled;
      default: return styles.statusDraft;
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Events</Text>
            <Text style={styles.headerSubtitle}>Create and manage events</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowCreate(true)}>
            <Text style={styles.addButtonText}>+ New</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, categoryFilter === cat && styles.filterChipActive]}
              onPress={() => setCategoryFilter(cat)}
            >
              <Text style={[styles.filterText, categoryFilter === cat && styles.filterTextActive]}>
                {cat || 'All'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <ScrollView style={styles.listContainer} contentContainerStyle={{ flexGrow: 1 }}>
        {events.length === 0 ? (
          <Text style={styles.emptyText}>No events found</Text>
        ) : (
          events.map(event => (
            <View key={event.id} style={styles.listItem}>
              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{event.title}</Text>
                  <Text style={styles.itemDate}>{event.category} | {event.date} | {event.location}</Text>
                </View>
                <Text style={[styles.itemStatus, getStatusStyle(event.status)]}>{event.status}</Text>
              </View>
              <View style={styles.itemActions}>
                {event.status !== 'Published' && (
                  <TouchableOpacity style={styles.actionPublish} onPress={() => handlePublish(event.id)}>
                    <Text style={styles.actionText}>Publish</Text>
                  </TouchableOpacity>
                )}
                {event.status === 'Published' && (
                  <TouchableOpacity style={styles.actionDraft} onPress={() => handleUnpublish(event.id)}>
                    <Text style={styles.actionTextDraft}>Unpublish</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.actionDelete} onPress={() => handleDelete(event.id)}>
                  <Text style={styles.actionTextDelete}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
      <CreateEventModal visible={showCreate} onClose={() => setShowCreate(false)} onCreated={loadEvents} />
    </View>
  );
}

function CreateClubModal({ visible, onClose, onCreated }: { visible: boolean; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingLocation, setMeetingLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name) {
      Alert.alert('Error', 'Club name is required');
      return;
    }
    setSubmitting(true);
    try {
      await adminApi.createClub({
        name,
        category: category || 'General',
        shortDescription: shortDescription || '',
        description: description || '',
        image: imageUrl || 'https://picsum.photos/seed/club/400',
        members: 0,
        meetingTime: meetingTime || '',
        meetingLocation: meetingLocation || '',
        leaders: [],
        status: 'Pending',
        rating: 0,
        reviews: 0,
      });
      Alert.alert('Success', 'Club created');
      onCreated();
      onClose();
      setName(''); setCategory(''); setShortDescription('');
      setDescription(''); setMeetingTime(''); setMeetingLocation(''); setImageUrl('');
    } catch (e) {
      Alert.alert('Error', 'Failed to create club');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalTitle}>Create Club</Text>
          <TextInput style={styles.input} placeholder="Club Name *" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Category" value={category} onChangeText={setCategory} />
          <TextInput style={styles.input} placeholder="Short Description" value={shortDescription} onChangeText={setShortDescription} />
          <TextInput style={[styles.input, styles.textArea]} placeholder="Full Description" value={description} onChangeText={setDescription} multiline />
          <TextInput style={styles.input} placeholder="Meeting Time" value={meetingTime} onChangeText={setMeetingTime} />
          <TextInput style={styles.input} placeholder="Meeting Location" value={meetingLocation} onChangeText={setMeetingLocation} />
          <TextInput style={styles.input} placeholder="Image URL" value={imageUrl} onChangeText={setImageUrl} />
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleCreate} disabled={submitting}><Text style={styles.submitText}>{submitting ? 'Creating...' : 'Create Club'}</Text></TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function ClubsManagementScreen() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const loadClubs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApi.getClubs();
      setClubs(data);
    } catch (e) {
      console.error('Failed to load clubs:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClubs();
  }, [loadClubs]);

  const handleApprove = async (id: string) => {
    try {
      await adminApi.approveClub(id);
      loadClubs();
    } catch (e) {
      Alert.alert('Error', 'Failed to approve club');
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await adminApi.deactivateClub(id);
      loadClubs();
    } catch (e) {
      Alert.alert('Error', 'Failed to deactivate club');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Club', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await adminApi.deleteClub(id);
          loadClubs();
        } catch (e) {
          Alert.alert('Error', 'Failed to delete club');
        }
      }},
    ]);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Active': return styles.statusPublished;
      case 'Pending': return styles.statusDraft;
      case 'Inactive': return styles.statusCancelled;
      default: return styles.statusDraft;
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Clubs</Text>
            <Text style={styles.headerSubtitle}>Manage clubs</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowCreate(true)}>
            <Text style={styles.addButtonText}>+ New</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView style={styles.listContainer}>
        {clubs.length === 0 ? (
          <Text style={styles.emptyText}>No clubs found</Text>
        ) : (
          clubs.map(club => (
            <View key={club.id} style={styles.listItem}>
              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{club.name}</Text>
                  <Text style={styles.itemDate}>{club.category} | {club.members} members</Text>
                </View>
                <Text style={[styles.itemStatus, getStatusStyle(club.status)]}>{club.status}</Text>
              </View>
              <View style={styles.itemActions}>
                {club.status === 'Pending' && (
                  <TouchableOpacity style={styles.actionPublish} onPress={() => handleApprove(club.id)}>
                    <Text style={styles.actionText}>Approve</Text>
                  </TouchableOpacity>
                )}
                {club.status === 'Active' && (
                  <TouchableOpacity style={styles.actionDraft} onPress={() => handleDeactivate(club.id)}>
                    <Text style={styles.actionTextDraft}>Deactivate</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.actionDelete} onPress={() => handleDelete(club.id)}>
                  <Text style={styles.actionTextDelete}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
      <CreateClubModal visible={showCreate} onClose={() => setShowCreate(false)} onCreated={loadClubs} />
    </View>
  );
}

function SettingsScreen({ admin, onLogout }: { admin: any; onLogout: () => void }) {
  const [showAbout, setShowAbout] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState(admin?.name || '');
  const [editEmail, setEditEmail] = useState(admin?.email || '');

  const handleSaveProfile = async () => {
    if (!editName.trim() || !editEmail.trim()) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }
    try {
      await adminApi.updateUser(admin.id, { name: editName.trim(), email: editEmail.trim() });
      admin.name = editName.trim();
      admin.email = editEmail.trim();
      Alert.alert('Success', 'Profile updated');
      setShowEditProfile(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Admin configuration</Text>
      </View>
      <ScrollView style={styles.listContainer}>
        {admin && (
          <View style={styles.profileCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{admin.name?.charAt(0)?.toUpperCase() || 'A'}</Text>
            </View>
            <Text style={styles.profileName}>{admin.name}</Text>
            <Text style={styles.profileEmail}>{admin.email}</Text>
            <Text style={styles.profileRole}>Administrator</Text>
          </View>
        )}

        <View style={styles.settingsGroup}>
          <Text style={styles.settingsGroupTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsItem} onPress={() => { setEditName(admin?.name || ''); setEditEmail(admin?.email || ''); setShowEditProfile(true); }}>
            <Text style={styles.settingsItemIcon}>✏️</Text>
            <View style={styles.settingsItemText}>
              <Text style={styles.settingsItemLabel}>Edit Profile</Text>
              <Text style={styles.settingsItemSubtext}>Update name and email</Text>
            </View>
            <Text style={styles.settingsArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingsGroup}>
          <Text style={styles.settingsGroupTitle}>App</Text>
          <TouchableOpacity style={styles.settingsItem} onPress={() => setShowAbout(true)}>
            <Text style={styles.settingsItemIcon}>ℹ️</Text>
            <View style={styles.settingsItemText}>
              <Text style={styles.settingsItemLabel}>About App</Text>
              <Text style={styles.settingsItemSubtext}>CUZ Events Admin v1.0.0</Text>
            </View>
            <Text style={styles.settingsArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem} onPress={() => Linking.openURL('https://cuzevents.com/privacy')}>
            <Text style={styles.settingsItemIcon}>📄</Text>
            <View style={styles.settingsItemText}>
              <Text style={styles.settingsItemLabel}>Privacy Policy</Text>
              <Text style={styles.settingsItemSubtext}>Read our privacy policy</Text>
            </View>
            <Text style={styles.settingsArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem} onPress={() => Linking.openURL('https://cuzevents.com/terms')}>
            <Text style={styles.settingsItemIcon}>📋</Text>
            <View style={styles.settingsItemText}>
              <Text style={styles.settingsItemLabel}>Terms of Service</Text>
              <Text style={styles.settingsItemSubtext}>Read our terms</Text>
            </View>
            <Text style={styles.settingsArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingsGroup}>
          <Text style={styles.settingsGroupTitle}>Account</Text>
          <TouchableOpacity style={styles.settingsItem} onPress={onLogout}>
            <Text style={styles.settingsItemIcon}>🚪</Text>
            <View style={styles.settingsItemText}>
              <Text style={[styles.settingsItemLabel, { color: '#ef4444' }]}>Log Out</Text>
              <Text style={styles.settingsItemSubtext}>Sign out of admin account</Text>
            </View>
            <Text style={styles.settingsArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showAbout} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>About CUZ Events Admin</Text>
            <View style={{ paddingVertical: 8 }}>
              <Text style={{ fontSize: 15, color: '#475569', lineHeight: 22, marginTop: 8 }}>Version 1.0.0</Text>
              <Text style={{ fontSize: 15, color: '#475569', lineHeight: 22, marginTop: 12 }}>
                Admin management app for CUZ Events. Manage events, clubs, payments, and users.
              </Text>
              <Text style={{ fontSize: 15, color: '#475569', lineHeight: 22, marginTop: 12 }}>
                Developed by the CUZ IT Department.
              </Text>
              <Text style={{ fontSize: 13, color: '#94a3b8', lineHeight: 22, marginTop: 12 }}>
                {'\u00A9'} 2026 Cavendish University Zambia. All rights reserved.
              </Text>
            </View>
            <TouchableOpacity style={[styles.cancelButton, { marginTop: 16 }]} onPress={() => setShowAbout(false)}>
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showEditProfile} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TextInput style={styles.input} placeholder="Name" value={editName} onChangeText={setEditName} />
            <TextInput style={styles.input} placeholder="Email" value={editEmail} onChangeText={setEditEmail} keyboardType="email-address" />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowEditProfile(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleSaveProfile}>
                <Text style={styles.submitText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function PaymentsManagementScreen() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApi.getPayments(filter || undefined);
      setPayments(data);
    } catch (e) {
      console.error('Failed to load payments:', e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleVerify = async (ticketId: string) => {
    try {
      const admin = adminApi.getCurrentAdmin();
      await adminApi.verifyPayment(ticketId, admin?.id || 'admin_001');
      Alert.alert('Success', 'Payment verified. Ticket confirmed.');
      loadPayments();
    } catch (e) {
      Alert.alert('Error', 'Failed to verify payment');
    }
  };

  const handleReject = async (ticketId: string) => {
    Alert.alert('Reject Payment', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: async () => {
        try {
          const admin = adminApi.getCurrentAdmin();
          await adminApi.rejectPayment(ticketId, admin?.id || 'admin_001');
          Alert.alert('Rejected', 'Payment has been rejected.');
          loadPayments();
        } catch (e) {
          Alert.alert('Error', 'Failed to reject payment');
        }
      }},
    ]);
  };

  const filters = ['', 'pending', 'verified', 'rejected'];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payments</Text>
        <Text style={styles.headerSubtitle}>Verify ticket payments</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f || 'All'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <ScrollView style={styles.listContainer}>
        {payments.length === 0 ? (
          <Text style={styles.emptyText}>No payments found</Text>
        ) : (
          payments.map((payment) => (
            <View key={payment.id} style={styles.listItem}>
              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{payment.user_name}</Text>
                  <Text style={styles.itemDate}>{payment.user_email}</Text>
                  <Text style={styles.itemDate}>Ref: {payment.reference}</Text>
                  <Text style={styles.itemDate}>
                    {payment.method.toUpperCase()} • ${parseFloat(payment.amount).toFixed(2)} • {payment.ticket_id?.replace('ticket_', '').slice(0, 8).toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.itemStatus, getPaymentStatusStyle(payment.status)]}>
                  {payment.status}
                </Text>
              </View>
              {payment.status === 'pending' && (
                <View style={styles.itemActions}>
                  <TouchableOpacity style={styles.actionPublish} onPress={() => handleVerify(payment.ticket_id)}>
                    <Text style={styles.actionText}>Verify</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionDelete} onPress={() => handleReject(payment.ticket_id)}>
                    <Text style={styles.actionTextDelete}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function getPaymentStatusStyle(status: string) {
  switch (status) {
    case 'verified': return { backgroundColor: '#dcfce7', color: '#166534' };
    case 'pending': return { backgroundColor: '#fef9c3', color: '#854d0e' };
    case 'rejected': return { backgroundColor: '#fee2e2', color: '#dc2626' };
    default: return { backgroundColor: '#f1f5f9', color: '#64748b' };
  }
}

function EventsStack() {
  return (
    <Stack.Navigator id="EventsStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EventsList" component={EventsManagementScreen} />
    </Stack.Navigator>
  );
}

function ClubsStack() {
  return (
    <Stack.Navigator id="ClubsStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ClubsList" component={ClubsManagementScreen} />
    </Stack.Navigator>
  );
}

function AdminTabs({ admin, onLogout }: { admin: any; onLogout: () => void }) {
  return (
    <Tab.Navigator
      id="AdminTabs"
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="📊" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="EventsTab"
        component={EventsStack}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="📅" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ClubsTab"
        component={ClubsStack}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentsManagementScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="💳" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        children={() => <SettingsScreen admin={admin} onLogout={onLogout} />}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [admin, setAdmin] = useState<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await adminApi.init();
      const currentAdmin = adminApi.getCurrentAdmin();
      if (currentAdmin) {
        setAdmin(currentAdmin);
      }
      setReady(true);
    })();
  }, []);

  const handleLogin = (loggedInAdmin: any) => {
    setAdmin(loggedInAdmin);
  };

  const handleLogout = () => {
    adminApi.logout();
    setAdmin(null);
  };

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        {admin ? (
          <AdminTabs admin={admin} onLogout={handleLogout} />
        ) : (
          <AdminLoginScreen onLogin={handleLogin} />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2563eb',
  },
  settingsGroup: {
    marginBottom: 16,
  },
  settingsGroupTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingsItemIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  settingsItemText: {
    flex: 1,
  },
  settingsItemLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
  },
  settingsItemSubtext: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  settingsArrow: {
    fontSize: 20,
    color: '#cbd5e1',
    marginLeft: 8,
  },
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
    paddingBottom: 24,
    height: 80,
  },
  tabIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tabIconActive: {
    backgroundColor: '#dbeafe',
  },
  tabIconText: {
    fontSize: 20,
  },
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#2563eb',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#bfdbfe',
    marginTop: 2,
  },
  filterBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  addButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2563eb',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  listItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 13,
    color: '#64748b',
  },
  itemStatus: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusPublished: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  statusDraft: {
    backgroundColor: '#fef9c3',
    color: '#854d0e',
  },
  statusCancelled: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  actionPublish: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  actionDraft: {
    backgroundColor: '#fef9c3',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionTextDraft: {
    fontSize: 13,
    fontWeight: '600',
    color: '#854d0e',
  },
  actionDelete: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionTextDelete: {
    fontSize: 13,
    fontWeight: '600',
    color: '#dc2626',
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 40,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  filterTextActive: {
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#f8fafc',
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  submitButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#2563eb',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
});

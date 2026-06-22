import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput, ActivityIndicator, Linking, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { AdminLoginScreen } from './components/screens/AdminLoginScreen';
import NotificationDropdown from './components/NotificationDropdown';
import { adminApi } from './api';
import { connectSocket, disconnectSocket } from './services/socket';
import { addNotification } from './utils/notificationStore';

const SESSION_TIMEOUT_MS = 60 * 60 * 1000;
const WARNING_BEFORE = 60 * 1000;

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

const CATEGORIES = ['All', 'Social', 'Cultural', 'Sports', 'Academic', 'Entertainment', 'Partnership'];
const LOCATIONS = [
  'UNZA Great Hall, Lusaka',
  'Mulungushi International Conference Centre, Lusaka',
  'Cavendish University Grounds, Lusaka',
  'Bible Gospel Church in Africa, Ndola',
];
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00',
];

function CreateEventModal({ visible, onClose, onCreated }: { visible: boolean; onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth() + 1);
  const [pickerDay, setPickerDay] = useState(new Date().getDate());
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [category, setCategory] = useState('');
  const [clubId, setClubId] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageData, setImageData] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [clubs, setClubs] = useState<any[]>([]);
  const [showClubPicker, setShowClubPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCustomLocation, setShowCustomLocation] = useState(false);

  useEffect(() => {
    if (visible) {
      adminApi.getClubs().then(setClubs).catch(() => {});
    }
  }, [visible]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.7,
      aspect: [16, 9],
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        setImageData(`data:${asset.mimeType};base64,${asset.base64}`);
      } else if (asset.uri) {
        setImageUrl(asset.uri);
      }
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Camera permission is required');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.7,
      aspect: [16, 9],
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        setImageData(`data:${asset.mimeType};base64,${asset.base64}`);
      } else if (asset.uri) {
        setImageUrl(asset.uri);
      }
    }
  };

  const finalImage = imageData || imageUrl || 'https://picsum.photos/seed/event/400';

  const handleCreate = async () => {
    if (!title || !date || !(location || customLocation)) {
      Alert.alert('Error', 'Title, date, and location are required');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert('Error', 'Date must be in YYYY-MM-DD format');
      return;
    }
    setSubmitting(true);
    try {
      await adminApi.createEvent({
        title, date, time: time || 'TBD',
        location: location || customLocation,
        category: category || 'General',
        clubId: clubId || undefined,
        description: description || '',
        image: finalImage,
        price: parseFloat(price) || 0,
        attendees: 0, maxCapacity: parseInt(maxCapacity) || 0,
        rating: 0, reviews: 0, status: 'Draft',
      });
      Alert.alert('Success', 'Event created');
      onCreated();
      onClose();
      setTitle(''); setDate(''); setTime(''); setLocation(''); setCustomLocation('');
      setCategory(''); setClubId(''); setDescription(''); setPrice(''); setMaxCapacity(''); setImageUrl(''); setImageData('');
      setShowCustomLocation(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  const renderPickerModal = (
    titleText: string,
    options: { label: string; value: string }[],
    currentValue: string,
    onSelect: (value: string) => void,
    visibleState: boolean,
    setVisible: (v: boolean) => void,
  ) => (
    <Modal visible={visibleState} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{titleText}</Text>
          <ScrollView>
            {options.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: currentValue === opt.value ? '#dbeafe' : 'transparent' }}
                onPress={() => { onSelect(opt.value); setVisible(false); }}
              >
                <Text style={{ fontSize: 16, color: '#1e293b' }}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={[styles.cancelButton, { marginTop: 12 }]} onPress={() => setVisible(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const finalLocation = location || customLocation || '';

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalTitle}>Create Event</Text>

          <TextInput style={styles.input} placeholder="Title *" value={title} onChangeText={setTitle} />
          <TouchableOpacity style={styles.input} onPress={() => { const d = date ? new Date(date) : new Date(); setPickerYear(d.getFullYear()); setPickerMonth(d.getMonth() + 1); setPickerDay(d.getDate()); setShowDatePicker(true); }}>
            <Text style={{ color: date ? '#1e293b' : '#94a3b8', fontSize: 16 }}>
              {date || 'Select Date *'}
            </Text>
          </TouchableOpacity>
          <Modal visible={showDatePicker} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Date</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16 }}>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 8 }}>Year</Text>
                    <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                      {Array.from({ length: 11 }, (_, i) => 2020 + i).map(y => (
                        <TouchableOpacity key={y} style={{ paddingVertical: 10, paddingHorizontal: 16, backgroundColor: pickerYear === y ? '#dbeafe' : 'transparent', borderRadius: 8 }} onPress={() => setPickerYear(y)}>
                          <Text style={{ fontSize: 18, fontWeight: pickerYear === y ? '700' : '400', color: pickerYear === y ? '#2563eb' : '#1e293b', textAlign: 'center' }}>{y}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 8 }}>Month</Text>
                    <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <TouchableOpacity key={m} style={{ paddingVertical: 10, paddingHorizontal: 16, backgroundColor: pickerMonth === m ? '#dbeafe' : 'transparent', borderRadius: 8 }} onPress={() => setPickerMonth(m)}>
                          <Text style={{ fontSize: 18, fontWeight: pickerMonth === m ? '700' : '400', color: pickerMonth === m ? '#2563eb' : '#1e293b', textAlign: 'center' }}>{String(m).padStart(2, '0')}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 8 }}>Day</Text>
                    <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                        <TouchableOpacity key={d} style={{ paddingVertical: 10, paddingHorizontal: 16, backgroundColor: pickerDay === d ? '#dbeafe' : 'transparent', borderRadius: 8 }} onPress={() => setPickerDay(d)}>
                          <Text style={{ fontSize: 18, fontWeight: pickerDay === d ? '700' : '400', color: pickerDay === d ? '#2563eb' : '#1e293b', textAlign: 'center' }}>{String(d).padStart(2, '0')}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.submitButton} onPress={() => { setDate(`${pickerYear}-${String(pickerMonth).padStart(2, '0')}-${String(pickerDay).padStart(2, '0')}`); setShowDatePicker(false); }}>
                    <Text style={styles.submitText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <TouchableOpacity style={styles.input} onPress={() => setShowTimePicker(true)}>
            <Text style={{ color: time ? '#1e293b' : '#94a3b8', fontSize: 16 }}>
              {time || 'Select Time *'}
            </Text>
          </TouchableOpacity>
          {renderPickerModal('Select Time', TIME_SLOTS.map(t => ({ label: t, value: t })), time, setTime, showTimePicker, setShowTimePicker)}

          <TouchableOpacity style={styles.input} onPress={() => setShowLocationPicker(true)}>
            <Text style={{ color: finalLocation ? '#1e293b' : '#94a3b8', fontSize: 16 }}>
              {finalLocation || 'Select Location *'}
            </Text>
          </TouchableOpacity>
          <Modal visible={showLocationPicker} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Location</Text>
                <ScrollView>
                  {LOCATIONS.map(loc => (
                    <TouchableOpacity
                      key={loc}
                      style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: location === loc ? '#dbeafe' : 'transparent' }}
                      onPress={() => { setLocation(loc); setCustomLocation(''); setShowCustomLocation(false); setShowLocationPicker(false); }}
                    >
                      <Text style={{ fontSize: 16, color: '#1e293b' }}>{loc}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: showCustomLocation ? '#dbeafe' : 'transparent' }}
                    onPress={() => { setShowCustomLocation(true); setLocation(''); setShowLocationPicker(false); }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#2563eb' }}>+ Custom Location</Text>
                  </TouchableOpacity>
                </ScrollView>
                <TouchableOpacity style={[styles.cancelButton, { marginTop: 12 }]} onPress={() => setShowLocationPicker(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          {showCustomLocation && (
            <TextInput style={styles.input} placeholder="Enter custom location *" value={customLocation} onChangeText={setCustomLocation} />
          )}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 12 }}>
            <TouchableOpacity
              style={[styles.filterChip, !category && styles.filterChipActive]}
              onPress={() => setCategory('')}
            >
              <Text style={[styles.filterText, !category && styles.filterTextActive]}>Any</Text>
            </TouchableOpacity>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.filterChip, category === c && styles.filterChipActive]}
                onPress={() => setCategory(category === c ? '' : c)}
              >
                <Text style={[styles.filterText, category === c && styles.filterTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TextInput style={styles.input} placeholder="Price (0 for free)" value={price} onChangeText={setPrice} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Max Capacity" value={maxCapacity} onChangeText={setMaxCapacity} keyboardType="numeric" />

          <TouchableOpacity style={styles.input} onPress={() => setShowClubPicker(true)}>
            <Text style={{ color: clubId ? '#1e293b' : '#94a3b8', fontSize: 16 }}>
              {clubId ? (clubs.find(c => c.id === clubId)?.name || 'Selected Club') : 'Select Club (optional)'}
            </Text>
          </TouchableOpacity>
          <Modal visible={showClubPicker} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Club</Text>
                <ScrollView>
                  <TouchableOpacity style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }} onPress={() => { setClubId(''); setShowClubPicker(false); }}>
                    <Text style={{ fontSize: 16, color: '#64748b' }}>None</Text>
                  </TouchableOpacity>
                  {clubs.map(club => (
                    <TouchableOpacity key={club.id} style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: clubId === club.id ? '#dbeafe' : 'transparent' }} onPress={() => { setClubId(club.id); setShowClubPicker(false); }}>
                      <Text style={{ fontSize: 16, fontWeight: '500', color: '#1e293b' }}>{club.name}</Text>
                      <Text style={{ fontSize: 13, color: '#64748b' }}>{club.category}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity style={[styles.cancelButton, { marginTop: 12 }]} onPress={() => setShowClubPicker(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Text style={styles.imageLabel}>Event Photo</Text>
          <View style={styles.imagePickerRow}>
            <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
              <Text style={styles.imagePickerText}>📁 Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imagePickerButton} onPress={takePhoto}>
              <Text style={styles.imagePickerText}>📷 Camera</Text>
            </TouchableOpacity>
            <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="Or paste URL" value={imageUrl} onChangeText={setImageUrl} />
          </View>
          {(imageData || imageUrl) ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageData || imageUrl }} style={styles.imagePreview} />
            </View>
          ) : null}
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
  const [feedbackEvent, setFeedbackEvent] = useState<any>(null);
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const categories = ['', 'Music Concert', 'Conference', 'Sports', 'Church Event', 'Community', 'Workshop'];

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

  const handleViewFeedback = async (event: any) => {
    setFeedbackEvent(event);
    try {
      const data = await adminApi.getEventReviews(event.id);
      setFeedbackData(data);
    } catch {
      setFeedbackData(null);
    }
  };

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
                  <Text style={styles.itemMeta}>
                    {event.attendees != null ? `${event.attendees}/${event.maxCapacity || '∞'} tickets` : ''}
                    {event.publishedAt ? ` | Published: ${new Date(event.publishedAt).toLocaleDateString()}` : ''}
                    {event.updatedAt && event.updatedAt !== event.createdAt ? ` | Updated: ${new Date(event.updatedAt).toLocaleDateString()}` : ''}
                  </Text>
                  <Text style={styles.itemRating}>★ {event.rating || 0} ({event.reviews || 0} reviews)</Text>
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
                <TouchableOpacity style={styles.actionFeedback} onPress={() => handleViewFeedback(event)}>
                  <Text style={styles.actionTextFeedback}>Feedback</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
      <CreateEventModal visible={showCreate} onClose={() => setShowCreate(false)} onCreated={loadEvents} />
      <Modal visible={!!feedbackEvent} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>Feedback — {feedbackEvent?.title || ''}</Text>
            {feedbackData ? (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Text style={{ fontSize: 28, fontWeight: '700', color: '#f59e0b' }}>★ {feedbackData.stats.averageRating}</Text>
                  <Text style={{ fontSize: 14, color: '#64748b' }}>({feedbackData.stats.totalReviews} reviews)</Text>
                </View>
                {feedbackData.stats.ratingDistribution.filter((d: any) => d.count > 0).map((d: any) => (
                  <View key={d.stars} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Text style={{ fontSize: 14, color: '#64748b', width: 30 }}>{d.stars}★</Text>
                    <View style={{ flex: 1, height: 8, backgroundColor: '#f1f5f9', borderRadius: 4 }}>
                      <View style={{ width: `${(d.count / feedbackData.stats.totalReviews) * 100}%`, height: 8, backgroundColor: '#f59e0b', borderRadius: 4 }} />
                    </View>
                    <Text style={{ fontSize: 13, color: '#94a3b8' }}>{d.count}</Text>
                  </View>
                ))}
                <View style={{ height: 16 }} />
                {feedbackData.reviews.map((r: any) => (
                  <View key={r.id} style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#1e293b' }}>{r.userName || 'Anonymous'}</Text>
                      <Text style={{ fontSize: 14, color: '#f59e0b' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</Text>
                    </View>
                    {r.comment ? <Text style={{ fontSize: 14, color: '#475569' }}>{r.comment}</Text> : null}
                    <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{new Date(r.createdAt).toLocaleDateString()}</Text>
                  </View>
                ))}
              </>
            ) : (
              <Text style={{ color: '#94a3b8', textAlign: 'center', paddingVertical: 20 }}>No feedback yet</Text>
            )}
            <TouchableOpacity style={[styles.cancelButton, { marginTop: 12 }]} onPress={() => { setFeedbackEvent(null); setFeedbackData(null); }}>
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
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
  const [imageData, setImageData] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.7,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        setImageData(`data:${asset.mimeType};base64,${asset.base64}`);
      } else if (asset.uri) {
        setImageUrl(asset.uri);
      }
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Camera permission is required');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.7,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        setImageData(`data:${asset.mimeType};base64,${asset.base64}`);
      } else if (asset.uri) {
        setImageUrl(asset.uri);
      }
    }
  };

  const finalImage = imageData || imageUrl || 'https://picsum.photos/seed/club/400';

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
        image: finalImage,
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
      setDescription(''); setMeetingTime(''); setMeetingLocation(''); setImageUrl(''); setImageData('');
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
          <Text style={styles.imageLabel}>Club Photo</Text>
          <View style={styles.imagePickerRow}>
            <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
              <Text style={styles.imagePickerText}>ðŸ“ Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imagePickerButton} onPress={takePhoto}>
              <Text style={styles.imagePickerText}>ðŸ“· Camera</Text>
            </TouchableOpacity>
            <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="Or paste URL" value={imageUrl} onChangeText={setImageUrl} />
          </View>
          {(imageData || imageUrl) ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageData || imageUrl }} style={styles.imagePreview} />
            </View>
          ) : null}
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
      const admin = adminApi.getCurrentAdmin();
      if (!admin) return;
      const data = await adminApi.getPresidentClubs(admin.id);
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

  const handleReactivate = async (id: string) => {
    try {
      await adminApi.reactivateClub(id);
      loadClubs();
    } catch (e) {
      Alert.alert('Error', 'Failed to reactivate club');
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
            <Text style={styles.headerTitle}>My Clubs</Text>
            <Text style={styles.headerSubtitle}>Clubs you manage</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowCreate(true)}>
            <Text style={styles.addButtonText}>+ New</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView style={styles.listContainer}>
        {clubs.length === 0 ? (
          <Text style={styles.emptyText}>No clubs found. Create one!</Text>
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
                {club.status === 'Inactive' && (
                  <TouchableOpacity style={styles.actionPublish} onPress={() => handleReactivate(club.id)}>
                    <Text style={styles.actionText}>Reactivate</Text>
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
  const [editAvatar, setEditAvatar] = useState('');

  const handleSaveProfile = async () => {
    if (!editName.trim() || !editEmail.trim()) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }
    try {
      const updates: any = { name: editName.trim(), email: editEmail.trim() };
      if (editAvatar) updates.avatar = editAvatar;
      const updated = await adminApi.updateUser(admin.id, updates);
      if (updated) {
        admin.name = updated.name;
        admin.email = updated.email;
        admin.avatar = updated.avatar;
      }
      await adminApi.persistCurrentAdmin();
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
            {admin.avatar ? (
              <Image source={{ uri: admin.avatar }} style={styles.avatarCircleImage} />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{admin.name?.charAt(0)?.toUpperCase() || 'A'}</Text>
              </View>
            )}
            <Text style={styles.profileName}>{admin.name}</Text>
            <Text style={styles.profileEmail}>{admin.email}</Text>
            <Text style={styles.profileRole}>Administrator</Text>
          </View>
        )}

        <View style={styles.settingsGroup}>
          <Text style={styles.settingsGroupTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsItem} onPress={() => { setEditName(admin?.name || ''); setEditEmail(admin?.email || ''); setEditAvatar(''); setShowEditProfile(true); }}>
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
            <View style={styles.settingsItemText}>
              <Text style={styles.settingsItemLabel}>About App</Text>
              <Text style={styles.settingsItemSubtext}>CUZ Events Admin v1.0.0</Text>
            </View>
            <Text style={styles.settingsArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem} onPress={() => Linking.openURL('https://cuzevents.com/privacy')}>
            <View style={styles.settingsItemText}>
              <Text style={styles.settingsItemLabel}>Privacy Policy</Text>
              <Text style={styles.settingsItemSubtext}>Read our privacy policy</Text>
            </View>
            <Text style={styles.settingsArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem} onPress={() => Linking.openURL('https://cuzevents.com/terms')}>
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
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <View style={styles.avatarSection}>
              <Image
                source={{ uri: editAvatar || admin?.avatar || 'https://picsum.photos/seed/admin/200' }}
                style={styles.editAvatar}
              />
              <View style={styles.editAvatarRow}>
                <TouchableOpacity style={styles.imagePickerButton} onPress={async () => {
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    base64: true,
                    quality: 0.8,
                    aspect: [1, 1],
                  });
                  if (!result.canceled && result.assets[0]) {
                    const asset = result.assets[0];
                    if (asset.base64) {
                      setEditAvatar(`data:${asset.mimeType};base64,${asset.base64}`);
                    }
                  }
                }}>
                  <Text style={styles.imagePickerText}>Choose Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.imagePickerButton} onPress={async () => {
                  const permission = await ImagePicker.requestCameraPermissionsAsync();
                  if (!permission.granted) {
                    Alert.alert('Permission needed', 'Camera permission is required');
                    return;
                  }
                  const result = await ImagePicker.launchCameraAsync({
                    base64: true,
                    quality: 0.8,
                    aspect: [1, 1],
                  });
                  if (!result.canceled && result.assets[0]) {
                    const asset = result.assets[0];
                    if (asset.base64) {
                      setEditAvatar(`data:${asset.mimeType};base64,${asset.base64}`);
                    }
                  }
                }}>
                  <Text style={styles.imagePickerText}>Take Photo</Text>
                </TouchableOpacity>
              </View>
            </View>
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
          </ScrollView>
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
                    {payment.method.toUpperCase()} â€¢ ${parseFloat(payment.amount).toFixed(2)} â€¢ {payment.ticket_id?.replace('ticket_', '').slice(0, 8).toUpperCase()}
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
        tabBarShowLabel: true,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon icon="📊" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="EventsTab"
        component={EventsStack}
        options={{
          tabBarLabel: 'Events',
          tabBarIcon: ({ focused }) => <TabIcon icon="📅" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ClubsTab"
        component={ClubsStack}
        options={{
          tabBarLabel: 'Clubs',
          tabBarIcon: ({ focused }) => <TabIcon icon="👥" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentsManagementScreen}
        options={{
          tabBarLabel: 'Payments',
          tabBarIcon: ({ focused }) => <TabIcon icon="💳" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        children={() => <SettingsScreen admin={admin} onLogout={onLogout} />}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [admin, setAdmin] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivity = useRef<number>(Date.now());

  const clearTimers = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
  };

  const doLogout = useCallback(() => {
    clearTimers();
    adminApi.logout();
    setAdmin(null);
    disconnectSocket();
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (!admin) return;
    lastActivity.current = Date.now();
    clearTimers();
    warningTimer.current = setTimeout(() => {
      Alert.alert(
        'Session Expiring',
        'Your session will expire in 1 minute due to inactivity.',
        [{ text: 'OK' }]
      );
    }, SESSION_TIMEOUT_MS - WARNING_BEFORE);
    inactivityTimer.current = setTimeout(() => {
      doLogout();
      Alert.alert('Session Expired', 'Please login again.');
    }, SESSION_TIMEOUT_MS);
  }, [admin, doLogout]);

  useEffect(() => {
    (async () => {
      await adminApi.init();
      adminApi.onUnauthorized = doLogout;
      const currentAdmin = adminApi.getCurrentAdmin();
      if (currentAdmin) {
        setAdmin(currentAdmin);
        if (currentAdmin.id) connectSocket(currentAdmin.id);
      }
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (admin) resetInactivityTimer();
  }, [admin, resetInactivityTimer]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && admin) {
        const elapsed = Date.now() - lastActivity.current;
        if (elapsed >= SESSION_TIMEOUT_MS) {
          doLogout();
          Alert.alert('Session Expired', 'Your session has expired due to inactivity.');
        } else {
          resetInactivityTimer();
        }
      }
    });
    return () => subscription.remove();
  }, [admin, resetInactivityTimer, doLogout]);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifiedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!admin) return;
    const checkNewEvents = async () => {
      try {
        const events = await adminApi.getEvents('Published');
        for (const event of events) {
          if (notifiedIds.current.has(event.id)) continue;
          notifiedIds.current.add(event.id);
          await addNotification({
            id: `notif_${event.id}_${Date.now()}`,
            title: 'New Event Posted',
            body: event.title,
            timestamp: new Date().toISOString(),
            read: false,
            eventId: event.id,
          });
        }
      } catch {}
    };
    checkNewEvents();
    pollingRef.current = setInterval(checkNewEvents, 60000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [admin]);

  const handleLogin = (loggedInAdmin: any) => {
    setAdmin(loggedInAdmin);
    if (loggedInAdmin?.id) {
      connectSocket(loggedInAdmin.id);
    }
    resetInactivityTimer();
  };

  const handleLogout = () => {
    clearTimers();
    adminApi.logout();
    setAdmin(null);
    disconnectSocket();
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
          <View style={{ flex: 1 }}>
            <AdminTabs admin={admin} onLogout={handleLogout} />
            <View style={styles.notifFloating}>
              <NotificationDropdown />
            </View>
          </View>
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
    borderRadius: 20,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    borderRadius: 20,
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
    borderRadius: 20,
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
  itemMeta: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
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
  itemRating: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
    marginTop: 4,
  },
  actionFeedback: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionTextFeedback: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
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
    borderRadius: 20,
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
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: '#2563eb',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    marginTop: 4,
  },
  imagePickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  imagePickerButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  imagePickerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  imagePreviewContainer: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  pendingSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    marginTop: -8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pendingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  noPending: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 12,
  },
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 12,
    marginBottom: 8,
  },
  pendingInfo: {
    flex: 1,
  },
  pendingName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  pendingEmail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveBtn: {
    backgroundColor: '#dcfce7',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtnText: {
    fontSize: 18,
    color: '#166534',
    fontWeight: '700',
  },
  rejectBtn: {
    backgroundColor: '#fee2e2',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtnText: {
    fontSize: 18,
    color: '#dc2626',
    fontWeight: '700',
  },
  avatarCircleImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  editAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  editAvatarRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarHint: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
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
  notifFloating: {
    position: 'absolute',
    top: 50,
    right: 8,
    zIndex: 100,
  },
});


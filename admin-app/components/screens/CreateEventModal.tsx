import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Dimensions,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';
import { adminApi } from '../../api';

const CATEGORIES = [
  'Music Concert',
  'Conference',
  'Sports',
  'Church Event',
  'Community',
  'Workshop',
];

const LOCATIONS = [
  'Lusaka National Museum',
  'Mulungushi International Conference Centre',
  'Levi Mwanawasa Stadium',
  'Freedom Statue Park',
  'Kennedy Market Grounds',
  'Carnival Mall',
  'East Park Mall',
  'Manda Hill Mall',
  'Lilayi Lodge',
  'Chaminuka Lodge',
  'Custom Location',
];

const TIME_SLOTS = [
  '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
  '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM',
];

const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i - 2);
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

interface Club {
  id: string;
  name: string;
}

interface CreateEventModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateEventModal({ visible, onClose, onCreated }: CreateEventModalProps) {
  const { colors } = useTheme();

  const [title, setTitle] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [selectedTime, setSelectedTime] = useState('09:00 AM');
  const [location, setLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [price, setPrice] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [selectedClubId, setSelectedClubId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [description, setDescription] = useState('');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showClubPicker, setShowClubPicker] = useState(false);

  const yearScrollRef = useRef<ScrollView>(null);
  const monthScrollRef = useRef<ScrollView>(null);
  const dayScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      fetchClubs();
      resetForm();
    }
  }, [visible]);

  const fetchClubs = async () => {
    try {
      const data = await adminApi.getClubs();
      setClubs(data);
    } catch (error) {
      console.error('Failed to fetch clubs:', error);
    }
  };

  const resetForm = () => {
    setTitle('');
    setSelectedYear(new Date().getFullYear());
    setSelectedMonth(new Date().getMonth());
    setSelectedDay(new Date().getDate());
    setSelectedTime('09:00 AM');
    setLocation('');
    setCustomLocation('');
    setSelectedCategory('');
    setPrice('');
    setMaxCapacity('');
    setSelectedClubId('');
    setImageUrl('');
    setImageUri('');
    setDescription('');
  };

  const pickImage = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Image URL', 'On web, please enter an image URL below.');
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please grant camera roll access to pick an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please grant camera access to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const formatDateDisplay = () => {
    return `${MONTHS[selectedMonth]} ${selectedDay}, ${selectedYear}`;
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const maxDay = getDaysInMonth(selectedMonth, selectedYear);
  const validDays = Array.from({ length: maxDay }, (_, i) => i + 1);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a title.');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Required', 'Please select a category.');
      return;
    }

    const finalLocation = location === 'Custom Location' ? customLocation : location;
    if (!finalLocation.trim()) {
      Alert.alert('Required', 'Please enter a location.');
      return;
    }

    setSubmitting(true);
    try {
      const eventData = {
        title: title.trim(),
        date: `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`,
        time: selectedTime,
        location: finalLocation.trim(),
        category: selectedCategory,
        price: price ? parseFloat(price) : 0,
        maxCapacity: maxCapacity ? parseInt(maxCapacity, 10) : 0,
        clubId: selectedClubId || undefined,
        imageUrl: imageUrl.trim() || imageUri || undefined,
        description: description.trim(),
      };

      await adminApi.createEvent(eventData);
      onCreated();
    } catch (error) {
      Alert.alert('Error', 'Failed to create event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderScrollColumn = (
    ref: React.RefObject<ScrollView | null>,
    items: (string | number)[],
    selected: number | string,
    onSelect: (val: any) => void,
    width: number,
    height: number = 160
  ) => {
    return (
      <ScrollView
        ref={ref}
        style={{ width, height }}
        showsVerticalScrollIndicator={false}
        snapToInterval={40}
        decelerationRate="fast"
      >
        {items.map((item, idx) => {
          const isSelected = item === selected;
          return (
            <TouchableOpacity
              key={idx}
              onPress={() => onSelect(item)}
              style={{
                height: 40,
                justifyContent: 'center',
                alignItems: 'center',
                opacity: isSelected ? 1 : 0.35,
              }}
            >
              <Text
                style={{
                  fontSize: isSelected ? 18 : 15,
                  fontWeight: isSelected ? '700' : '400',
                  color: isSelected ? (colors.primary || '#6366f1') : (colors.text || '#111827'),
                }}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderDatePicker = () => (
    <View style={[styles.datePickerContainer, { backgroundColor: colors.card || '#ffffff' }]}>
      <View style={styles.datePickerHeader}>
        <Text style={[styles.pickerTitle, { color: colors.text || '#111827' }]}>Select Date</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(false)}>
          <Text style={[styles.pickerDone, { color: colors.primary || '#6366f1' }]}>Done</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.dateColumns}>
        {renderScrollColumn(yearScrollRef, YEARS, selectedYear, (v: number) => {
          setSelectedYear(v);
          const maxD = getDaysInMonth(selectedMonth, v);
          if (selectedDay > maxD) setSelectedDay(maxD);
        }, 100)}
        {renderScrollColumn(monthScrollRef, MONTHS, selectedMonth, (v: number) => {
          setSelectedMonth(v);
          const maxD = getDaysInMonth(v, selectedYear);
          if (selectedDay > maxD) setSelectedDay(maxD);
        }, 140)}
        {renderScrollColumn(dayScrollRef, validDays, selectedDay, setSelectedDay, 80)}
      </View>
    </View>
  );

  const renderTimePicker = () => (
    <View style={[styles.datePickerContainer, { backgroundColor: colors.card || '#ffffff' }]}>
      <View style={styles.datePickerHeader}>
        <Text style={[styles.pickerTitle, { color: colors.text || '#111827' }]}>Select Time</Text>
        <TouchableOpacity onPress={() => setShowTimePicker(false)}>
          <Text style={[styles.pickerDone, { color: colors.primary || '#6366f1' }]}>Done</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
        {TIME_SLOTS.map((slot) => (
          <TouchableOpacity
            key={slot}
            style={[
              styles.timeOption,
              {
                backgroundColor: selectedTime === slot ? `${colors.primary || '#6366f1'}15` : 'transparent',
              },
            ]}
            onPress={() => {
              setSelectedTime(slot);
              setShowTimePicker(false);
            }}
          >
            <Text
              style={{
                fontSize: 15,
                color: selectedTime === slot ? (colors.primary || '#6366f1') : (colors.text || '#111827'),
                fontWeight: selectedTime === slot ? '600' : '400',
              }}
            >
              {slot}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderLocationPicker = () => (
    <View style={[styles.datePickerContainer, { backgroundColor: colors.card || '#ffffff' }]}>
      <View style={styles.datePickerHeader}>
        <Text style={[styles.pickerTitle, { color: colors.text || '#111827' }]}>Select Location</Text>
        <TouchableOpacity onPress={() => setShowLocationPicker(false)}>
          <Text style={[styles.pickerDone, { color: colors.primary || '#6366f1' }]}>Done</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
        {LOCATIONS.map((loc) => (
          <TouchableOpacity
            key={loc}
            style={[
              styles.timeOption,
              {
                backgroundColor: location === loc ? `${colors.primary || '#6366f1'}15` : 'transparent',
              },
            ]}
            onPress={() => {
              setLocation(loc);
              if (loc !== 'Custom Location') setShowLocationPicker(false);
            }}
          >
            <Text
              style={{
                fontSize: 15,
                color: location === loc ? (colors.primary || '#6366f1') : (colors.text || '#111827'),
                fontWeight: location === loc ? '600' : '400',
              }}
            >
              {loc}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {location === 'Custom Location' && (
        <View style={styles.customLocationWrap}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background || '#f9fafb',
                color: colors.text || '#111827',
                borderColor: colors.border || '#e5e7eb',
              },
            ]}
            placeholder="Enter custom location"
            placeholderTextColor={colors.textSecondary || '#9ca3af'}
            value={customLocation}
            onChangeText={setCustomLocation}
          />
          <TouchableOpacity
            style={[styles.pickerDoneBtn, { backgroundColor: colors.primary || '#6366f1' }]}
            onPress={() => setShowLocationPicker(false)}
          >
            <Text style={styles.pickerDoneBtnText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderClubPicker = () => (
    <View style={[styles.datePickerContainer, { backgroundColor: colors.card || '#ffffff' }]}>
      <View style={styles.datePickerHeader}>
        <Text style={[styles.pickerTitle, { color: colors.text || '#111827' }]}>Select Club</Text>
        <TouchableOpacity onPress={() => setShowClubPicker(false)}>
          <Text style={[styles.pickerDone, { color: colors.primary || '#6366f1' }]}>Done</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={[
            styles.timeOption,
            { backgroundColor: !selectedClubId ? `${colors.primary || '#6366f1'}15` : 'transparent' },
          ]}
          onPress={() => {
            setSelectedClubId('');
            setShowClubPicker(false);
          }}
        >
          <Text style={{ fontSize: 15, color: colors.textSecondary || '#6b7280' }}>No Club</Text>
        </TouchableOpacity>
        {clubs.map((club) => (
          <TouchableOpacity
            key={club.id}
            style={[
              styles.timeOption,
              {
                backgroundColor: selectedClubId === club.id ? `${colors.primary || '#6366f1'}15` : 'transparent',
              },
            ]}
            onPress={() => {
              setSelectedClubId(club.id);
              setShowClubPicker(false);
            }}
          >
            <Text
              style={{
                fontSize: 15,
                color: selectedClubId === club.id ? (colors.primary || '#6366f1') : (colors.text || '#111827'),
                fontWeight: selectedClubId === club.id ? '600' : '400',
              }}
            >
              {club.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.backdrop} />
        <View style={[styles.modal, { backgroundColor: colors.card || '#ffffff' }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text || '#111827' }]}>Create Event</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeArea}>
              <Text style={[styles.closeIcon, { color: colors.textSecondary || '#6b7280' }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.form}
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.label, { color: colors.text || '#111827' }]}>Title *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background || '#f9fafb',
                  color: colors.text || '#111827',
                  borderColor: colors.border || '#e5e7eb',
                },
              ]}
              placeholder="Event title"
              placeholderTextColor={colors.textSecondary || '#9ca3af'}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={[styles.label, { color: colors.text || '#111827' }]}>Date *</Text>
            <TouchableOpacity
              style={[
                styles.input,
                styles.pickerTrigger,
                {
                  backgroundColor: colors.background || '#f9fafb',
                  borderColor: colors.border || '#e5e7eb',
                },
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: colors.text || '#111827', fontSize: 15 }}>
                {formatDateDisplay()}
              </Text>
              <Text style={{ color: colors.textSecondary || '#9ca3af' }}>▾</Text>
            </TouchableOpacity>

            <Text style={[styles.label, { color: colors.text || '#111827' }]}>Time</Text>
            <TouchableOpacity
              style={[
                styles.input,
                styles.pickerTrigger,
                {
                  backgroundColor: colors.background || '#f9fafb',
                  borderColor: colors.border || '#e5e7eb',
                },
              ]}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={{ color: colors.text || '#111827', fontSize: 15 }}>
                {selectedTime}
              </Text>
              <Text style={{ color: colors.textSecondary || '#9ca3af' }}>▾</Text>
            </TouchableOpacity>

            <Text style={[styles.label, { color: colors.text || '#111827' }]}>Location *</Text>
            <TouchableOpacity
              style={[
                styles.input,
                styles.pickerTrigger,
                {
                  backgroundColor: colors.background || '#f9fafb',
                  borderColor: colors.border || '#e5e7eb',
                },
              ]}
              onPress={() => setShowLocationPicker(true)}
            >
              <Text
                style={{
                  color: location ? (colors.text || '#111827') : (colors.textSecondary || '#9ca3af'),
                  fontSize: 15,
                }}
                numberOfLines={1}
              >
                {location || 'Select location'}
              </Text>
              <Text style={{ color: colors.textSecondary || '#9ca3af' }}>▾</Text>
            </TouchableOpacity>

            <Text style={[styles.label, { color: colors.text || '#111827' }]}>Category *</Text>
            <View style={styles.chipContainer}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        selectedCategory === cat
                          ? (colors.primary || '#6366f1')
                          : (colors.background || '#f9fafb'),
                      borderColor:
                        selectedCategory === cat
                          ? (colors.primary || '#6366f1')
                          : (colors.border || '#e5e7eb'),
                    },
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text
                    style={{
                      color:
                        selectedCategory === cat
                          ? '#ffffff'
                          : (colors.textSecondary || '#6b7280'),
                      fontSize: 13,
                      fontWeight: '500',
                    }}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={[styles.label, { color: colors.text || '#111827' }]}>Price (ZMW)</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background || '#f9fafb',
                      color: colors.text || '#111827',
                      borderColor: colors.border || '#e5e7eb',
                    },
                  ]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary || '#9ca3af'}
                  keyboardType="decimal-pad"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
              <View style={styles.halfField}>
                <Text style={[styles.label, { color: colors.text || '#111827' }]}>Max Capacity</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background || '#f9fafb',
                      color: colors.text || '#111827',
                      borderColor: colors.border || '#e5e7eb',
                    },
                  ]}
                  placeholder="Unlimited"
                  placeholderTextColor={colors.textSecondary || '#9ca3af'}
                  keyboardType="number-pad"
                  value={maxCapacity}
                  onChangeText={setMaxCapacity}
                />
              </View>
            </View>

            <Text style={[styles.label, { color: colors.text || '#111827' }]}>Club (Optional)</Text>
            <TouchableOpacity
              style={[
                styles.input,
                styles.pickerTrigger,
                {
                  backgroundColor: colors.background || '#f9fafb',
                  borderColor: colors.border || '#e5e7eb',
                },
              ]}
              onPress={() => setShowClubPicker(true)}
            >
              <Text
                style={{
                  color: selectedClubId ? (colors.text || '#111827') : (colors.textSecondary || '#9ca3af'),
                  fontSize: 15,
                }}
              >
                {clubs.find((c) => c.id === selectedClubId)?.name || 'No club selected'}
              </Text>
              <Text style={{ color: colors.textSecondary || '#9ca3af' }}>▾</Text>
            </TouchableOpacity>

            <Text style={[styles.label, { color: colors.text || '#111827' }]}>Image</Text>
            <View style={styles.imageSection}>
              <View style={styles.imageButtons}>
                <TouchableOpacity
                  style={[styles.imageBtn, { backgroundColor: colors.background || '#f9fafb', borderColor: colors.border || '#e5e7eb' }]}
                  onPress={pickImage}
                >
                  <Text style={[styles.imageBtnText, { color: colors.text || '#111827' }]}>🖼️ Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.imageBtn, { backgroundColor: colors.background || '#f9fafb', borderColor: colors.border || '#e5e7eb' }]}
                  onPress={takePhoto}
                >
                  <Text style={[styles.imageBtnText, { color: colors.text || '#111827' }]}>📷 Camera</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background || '#f9fafb',
                    color: colors.text || '#111827',
                    borderColor: colors.border || '#e5e7eb',
                  },
                ]}
                placeholder="Or paste image URL"
                placeholderTextColor={colors.textSecondary || '#9ca3af'}
                value={imageUrl}
                onChangeText={setImageUrl}
                keyboardType="url"
                autoCapitalize="none"
              />
              {(imageUri || imageUrl) ? (
                <View style={styles.imagePreview}>
                  <Image
                    source={{ uri: imageUri || imageUrl }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => {
                      setImageUri('');
                      setImageUrl('');
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 12 }}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            <Text style={[styles.label, { color: colors.text || '#111827' }]}>Description</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.background || '#f9fafb',
                  color: colors.text || '#111827',
                  borderColor: colors.border || '#e5e7eb',
                },
              ]}
              placeholder="Event description..."
              placeholderTextColor={colors.textSecondary || '#9ca3af'}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />

            <TouchableOpacity
              style={[
                styles.submitBtn,
                {
                  backgroundColor: submitting ? (colors.border || '#e5e7eb') : (colors.primary || '#6366f1'),
                },
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitBtnText}>
                {submitting ? 'Creating...' : 'Create Event'}
              </Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>

          {showDatePicker && renderDatePicker()}
          {showTimePicker && renderTimePicker()}
          {showLocationPicker && renderLocationPicker()}
          {showClubPicker && renderClubPicker()}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '92%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d1d5db',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  closeArea: {
    padding: 8,
  },
  closeIcon: {
    fontSize: 22,
    fontWeight: '300',
  },
  form: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  pickerTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  imageSection: {
    gap: 10,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  imageBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  imageBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  imagePreview: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    height: 160,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  submitBtn: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  datePickerContainer: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingBottom: 32,
    zIndex: 100,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  pickerDone: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateColumns: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 20,
    gap: 0,
  },
  timeOption: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f3f4f6',
  },
  customLocationWrap: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  pickerDoneBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  pickerDoneBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});

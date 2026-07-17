import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useResponsive } from '../../theme/responsive';
import { typography, spacing, radius, shadow } from '../../theme/tokens';
import { userApi } from '../../api';

const CATEGORIES = ['Social', 'Cultural', 'Sports', 'Academic', 'Entertainment', 'Partnership'];

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

interface OrganizerCreateEventScreenProps {
  navigation: any;
  route: any;
}

export function OrganizerCreateEventScreen({ navigation, route }: OrganizerCreateEventScreenProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const r = useResponsive();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('09:00 AM');
  const [location, setLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [price, setPrice] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [selectedClubId, setSelectedClubId] = useState('');
  const [description, setDescription] = useState('');
  const [clubs, setClubs] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showClubPicker, setShowClubPicker] = useState(false);

  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    try {
      const clubData = await userApi.getClubs();
      setClubs(clubData);
    } catch {}
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a title.');
      return;
    }
    if (!date.trim()) {
      Alert.alert('Required', 'Please enter a date (YYYY-MM-DD).');
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
      await userApi.createEvent({
        title: title.trim(),
        date,
        time: selectedTime,
        location: finalLocation.trim(),
        category: selectedCategory,
        price: price ? parseFloat(price) : 0,
        maxCapacity: maxCapacity ? parseInt(maxCapacity, 10) : 0,
        clubId: selectedClubId || undefined,
        description: description.trim(),
      });
      Alert.alert('Submitted', 'Your event has been submitted for admin approval.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    backgroundColor: colors.inputBg,
    color: colors.text,
  };

  const pickerRowStyle = {
    ...inputStyle,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: spacing.md, padding: spacing.xs }}>
          <Text style={{ fontSize: 24, color: colors.text }}>←</Text>
        </TouchableOpacity>
        <Text style={[typography.h3, { color: colors.text, flex: 1 }]}>Create Event</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxxl }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[shadow.md, { backgroundColor: colors.card, borderRadius: radius.xxl, padding: spacing.xl }]}>
          <Text style={[typography.bodySmall, { color: colors.primary, marginBottom: spacing.md, textAlign: 'center' }]}>
            Your event will be submitted for admin approval before publishing.
          </Text>

          <Text style={[typography.label, { color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md }]}>Title *</Text>
          <TextInput style={inputStyle} placeholder="Event title" placeholderTextColor={colors.textMuted} value={title} onChangeText={setTitle} />

          <Text style={[typography.label, { color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md }]}>Date * (YYYY-MM-DD)</Text>
          <TextInput style={inputStyle} placeholder={today} placeholderTextColor={colors.textMuted} value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" />

          <Text style={[typography.label, { color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md }]}>Time</Text>
          <TouchableOpacity style={pickerRowStyle} onPress={() => setShowTimePicker(!showTimePicker)}>
            <Text style={{ color: colors.text, fontSize: 16 }}>{selectedTime}</Text>
            <Text style={{ color: colors.textMuted }}>▾</Text>
          </TouchableOpacity>
          {showTimePicker && (
            <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, marginTop: spacing.xs, padding: spacing.sm, maxHeight: 200 }}>
              <ScrollView nestedScrollEnabled>
                {TIME_SLOTS.map((slot) => (
                  <TouchableOpacity
                    key={slot}
                    onPress={() => { setSelectedTime(slot); setShowTimePicker(false); }}
                    style={{ paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: selectedTime === slot ? colors.primary + '15' : 'transparent' }}
                  >
                    <Text style={{ color: selectedTime === slot ? colors.primary : colors.text, fontWeight: selectedTime === slot ? '600' : '400' }}>{slot}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={[typography.label, { color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md }]}>Location *</Text>
          <TouchableOpacity style={pickerRowStyle} onPress={() => setShowLocationPicker(!showLocationPicker)}>
            <Text style={{ color: location ? colors.text : colors.textMuted, fontSize: 16 }} numberOfLines={1}>{location || 'Select location'}</Text>
            <Text style={{ color: colors.textMuted }}>▾</Text>
          </TouchableOpacity>
          {showLocationPicker && (
            <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, marginTop: spacing.xs, padding: spacing.sm, maxHeight: 300 }}>
              <ScrollView nestedScrollEnabled>
                {LOCATIONS.map((loc) => (
                  <TouchableOpacity
                    key={loc}
                    onPress={() => { setLocation(loc); if (loc !== 'Custom Location') setShowLocationPicker(false); }}
                    style={{ paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: location === loc ? colors.primary + '15' : 'transparent' }}
                  >
                    <Text style={{ color: location === loc ? colors.primary : colors.text, fontWeight: location === loc ? '600' : '400' }}>{loc}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          {location === 'Custom Location' && (
            <TextInput style={[inputStyle, { marginTop: spacing.sm }]} placeholder="Enter custom location" placeholderTextColor={colors.textMuted} value={customLocation} onChangeText={setCustomLocation} />
          )}

          <Text style={[typography.label, { color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md }]}>Category *</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1.5, backgroundColor: selectedCategory === cat ? colors.primary : colors.inputBg, borderColor: selectedCategory === cat ? colors.primary : colors.border }}
              >
                <Text style={{ color: selectedCategory === cat ? '#fff' : colors.textSecondary, fontSize: 13, fontWeight: '500' }}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.label, { color: colors.text, marginBottom: spacing.xs }]}>Price (ZMW)</Text>
              <TextInput style={inputStyle} placeholder="0.00" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" value={price} onChangeText={setPrice} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.label, { color: colors.text, marginBottom: spacing.xs }]}>Max Capacity</Text>
              <TextInput style={inputStyle} placeholder="Unlimited" placeholderTextColor={colors.textMuted} keyboardType="number-pad" value={maxCapacity} onChangeText={setMaxCapacity} />
            </View>
          </View>

          <Text style={[typography.label, { color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md }]}>Club (Optional)</Text>
          <TouchableOpacity style={pickerRowStyle} onPress={() => setShowClubPicker(!showClubPicker)}>
            <Text style={{ color: selectedClubId ? colors.text : colors.textMuted, fontSize: 16 }}>
              {clubs.find((c) => c.id === selectedClubId)?.name || 'No club selected'}
            </Text>
            <Text style={{ color: colors.textMuted }}>▾</Text>
          </TouchableOpacity>
          {showClubPicker && (
            <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, marginTop: spacing.xs, padding: spacing.sm, maxHeight: 200 }}>
              <ScrollView nestedScrollEnabled>
                <TouchableOpacity
                  onPress={() => { setSelectedClubId(''); setShowClubPicker(false); }}
                  style={{ paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: !selectedClubId ? colors.primary + '15' : 'transparent' }}
                >
                  <Text style={{ color: colors.textSecondary }}>No club</Text>
                </TouchableOpacity>
                {clubs.map((club) => (
                  <TouchableOpacity
                    key={club.id}
                    onPress={() => { setSelectedClubId(club.id); setShowClubPicker(false); }}
                    style={{ paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: selectedClubId === club.id ? colors.primary + '15' : 'transparent' }}
                  >
                    <Text style={{ color: selectedClubId === club.id ? colors.primary : colors.text, fontWeight: selectedClubId === club.id ? '600' : '400' }}>{club.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={[typography.label, { color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md }]}>Description</Text>
          <TextInput
            style={[inputStyle, { minHeight: 100, paddingTop: spacing.md }]}
            placeholder="Describe your event..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            style={{ marginTop: spacing.xl, paddingVertical: spacing.lg, borderRadius: radius.lg, backgroundColor: submitting ? colors.border : colors.primary, alignItems: 'center' }}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Submit for Approval</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useResponsive } from '../../theme/responsive';
import { typography, spacing, radius, shadow } from '../../theme/tokens';
import { userApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = ['Social', 'Cultural', 'Sports', 'Academic', 'Entertainment', 'Partnership', 'Workshop', 'Conference'];

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
  'Cavendish University Campus',
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
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('09:00 AM');
  const [selectedEndTime, setSelectedEndTime] = useState('05:00 PM');
  const [location, setLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [price, setPrice] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [selectedClubId, setSelectedClubId] = useState('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState('');
  const [eventWebsite, setEventWebsite] = useState('');
  const [organizerName, setOrganizerName] = useState(user?.name || '');
  const [clubs, setClubs] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
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
      Alert.alert('Required', 'Please enter a start date (YYYY-MM-DD).');
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
        time: `${selectedTime} - ${selectedEndTime}`,
        location: finalLocation.trim(),
        category: selectedCategory,
        price: price ? parseFloat(price) : 0,
        maxCapacity: maxCapacity ? parseInt(maxCapacity, 10) : 0,
        clubId: selectedClubId || undefined,
        description: description.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        eventWebsite: eventWebsite.trim(),
        organizerName: organizerName.trim(),
        endDate: endDate.trim() || undefined,
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
          <Text style={{ fontSize: 24, color: colors.text }}>&#8592;</Text>
        </TouchableOpacity>
        <Text style={[typography.h3, { color: colors.text, flex: 1 }]}>Submit New Event</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxxl }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[shadow.md, { backgroundColor: colors.card, borderRadius: radius.xxl, padding: spacing.xl }]}>
          <View style={{ backgroundColor: colors.primary + '10', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg }}>
            <Text style={[typography.bodySmall, { color: colors.primary, textAlign: 'center' }]}>
              Your event will be reviewed by the admin team before publishing. You will be notified once a decision is made.
            </Text>
          </View>

          <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>Event Details</Text>

          <Text style={[typography.label, { color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md }]}>Event Title *</Text>
          <TextInput style={inputStyle} placeholder="Enter event title" placeholderTextColor={colors.textMuted} value={title} onChangeText={setTitle} />

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

          <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md, marginTop: spacing.xl }]}>Schedule</Text>

          <Text style={[typography.label, { color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md }]}>Start Date * (YYYY-MM-DD)</Text>
          <TextInput style={inputStyle} placeholder={today} placeholderTextColor={colors.textMuted} value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" />

          <Text style={[typography.label, { color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md }]}>End Date (YYYY-MM-DD)</Text>
          <TextInput style={inputStyle} placeholder="Optional" placeholderTextColor={colors.textMuted} value={endDate} onChangeText={setEndDate} keyboardType="numbers-and-punctuation" />

          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.label, { color: colors.text, marginBottom: spacing.xs }]}>Start Time</Text>
              <TouchableOpacity style={pickerRowStyle} onPress={() => setShowTimePicker(!showTimePicker)}>
                <Text style={{ color: colors.text, fontSize: 14 }}>{selectedTime}</Text>
                <Text style={{ color: colors.textMuted }}>&#9662;</Text>
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
                        <Text style={{ color: selectedTime === slot ? colors.primary : colors.text, fontWeight: selectedTime === slot ? '600' : '400', fontSize: 14 }}>{slot}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.label, { color: colors.text, marginBottom: spacing.xs }]}>End Time</Text>
              <TouchableOpacity style={pickerRowStyle} onPress={() => setShowEndTimePicker(!showEndTimePicker)}>
                <Text style={{ color: colors.text, fontSize: 14 }}>{selectedEndTime}</Text>
                <Text style={{ color: colors.textMuted }}>&#9662;</Text>
              </TouchableOpacity>
              {showEndTimePicker && (
                <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, marginTop: spacing.xs, padding: spacing.sm, maxHeight: 200 }}>
                  <ScrollView nestedScrollEnabled>
                    {TIME_SLOTS.map((slot) => (
                      <TouchableOpacity
                        key={slot}
                        onPress={() => { setSelectedEndTime(slot); setShowEndTimePicker(false); }}
                        style={{ paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: selectedEndTime === slot ? colors.primary + '15' : 'transparent' }}
                      >
                        <Text style={{ color: selectedEndTime === slot ? colors.primary : colors.text, fontWeight: selectedEndTime === slot ? '600' : '400', fontSize: 14 }}>{slot}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md, marginTop: spacing.xl }]}>Venue</Text>

          <Text style={[typography.label, { color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md }]}>Location *</Text>
          <TouchableOpacity style={pickerRowStyle} onPress={() => setShowLocationPicker(!showLocationPicker)}>
            <Text style={{ color: location ? colors.text : colors.textMuted, fontSize: 16 }} numberOfLines={1}>{location || 'Select venue'}</Text>
            <Text style={{ color: colors.textMuted }}>&#9662;</Text>
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
            <TextInput style={[inputStyle, { marginTop: spacing.sm }]} placeholder="Enter venue address" placeholderTextColor={colors.textMuted} value={customLocation} onChangeText={setCustomLocation} />
          )}

          <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md, marginTop: spacing.xl }]}>Capacity & Pricing</Text>

          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.label, { color: colors.text, marginBottom: spacing.xs }]}>Ticket Price (ZMW)</Text>
              <TextInput style={inputStyle} placeholder="0.00" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" value={price} onChangeText={setPrice} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.label, { color: colors.text, marginBottom: spacing.xs }]}>Max Attendees</Text>
              <TextInput style={inputStyle} placeholder="Unlimited" placeholderTextColor={colors.textMuted} keyboardType="number-pad" value={maxCapacity} onChangeText={setMaxCapacity} />
            </View>
          </View>

          <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md, marginTop: spacing.xl }]}>Organization</Text>

          <Text style={[typography.label, { color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md }]}>Organizer / Club Affiliation</Text>
          <TouchableOpacity style={pickerRowStyle} onPress={() => setShowClubPicker(!showClubPicker)}>
            <Text style={{ color: selectedClubId ? colors.text : colors.textMuted, fontSize: 16 }}>
              {clubs.find((c) => c.id === selectedClubId)?.name || 'No club selected'}
            </Text>
            <Text style={{ color: colors.textMuted }}>&#9662;</Text>
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

          <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md, marginTop: spacing.xl }]}>Contact Information</Text>

          <Text style={[typography.label, { color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md }]}>Contact Person</Text>
          <TextInput style={inputStyle} placeholder="Your name" placeholderTextColor={colors.textMuted} value={organizerName} onChangeText={setOrganizerName} autoCapitalize="words" />

          <Text style={[typography.label, { color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md }]}>Contact Email</Text>
          <TextInput style={inputStyle} placeholder="organizer@example.com" placeholderTextColor={colors.textMuted} value={contactEmail} onChangeText={setContactEmail} keyboardType="email-address" autoCapitalize="none" />

          <Text style={[typography.label, { color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md }]}>Contact Phone</Text>
          <TextInput style={inputStyle} placeholder="+260 97X XXX XXX" placeholderTextColor={colors.textMuted} value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />

          <Text style={[typography.label, { color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md }]}>Event Website (Optional)</Text>
          <TextInput style={inputStyle} placeholder="https://" placeholderTextColor={colors.textMuted} value={eventWebsite} onChangeText={setEventWebsite} keyboardType="url" autoCapitalize="none" />

          <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md, marginTop: spacing.xl }]}>Description</Text>

          <TextInput
            style={[inputStyle, { minHeight: 120, paddingTop: spacing.md }]}
            placeholder="Describe your event in detail — objectives, agenda, target audience, what attendees can expect..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={5}
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

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, FlatList, Image, ActivityIndicator, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Club } from '../../types';
import { userApi } from '../../api';
import { normalizeImage } from '../../utils/image';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const categoryColors: { [key: string]: string } = {
  'Health & Wellness': '#10b981',
  'Arts': '#8b5cf6',
  'Academic': '#3b82f6',
  'Technology': '#06b6d4',
  'Cultural': '#f59e0b',
  'Games': '#ec4899',
  'Religious': '#6366f1',
  'Service': '#14b8a6',
};

export function ClubsScreen() {
  const navigation = useNavigation<any>();
  const { isDark, colors } = useTheme();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<View>(null);

  useEffect(() => {
    userApi.getClubsForScreen().then(data => {
      setClubs(data);
      setLoading(false);
    });
  }, []);

  const allCategories = ['All', ...Array.from(new Set(clubs.map(c => c.category)))];

  const filteredClubs = clubs.filter(club => {
    const matchesSearch = club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          club.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || club.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleClubPress = (clubId: string) => {
    navigation.navigate('ClubDetails', { clubId });
  };

  const renderClubCard = ({ item }: { item: Club }) => {
    const categoryColor = categoryColors[item.category] || '#6b7280';
    
    return (
      <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]} onPress={() => handleClubPress(item.id)} activeOpacity={0.7}>
        <View style={styles.cardContent}>
          <Image source={normalizeImage(item.image)} style={styles.clubImage} resizeMode="contain" />
          <View style={styles.clubInfo}>
            <Text style={[styles.clubName, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>{item.shortDescription}</Text>
            <Text style={[styles.membersText, { color: colors.textSecondary }]}>👥 {item.members} {t('clubs.members')}</Text>
          </View>
        </View>
        <View style={[styles.meetingInfo, { backgroundColor: colors.background }]}>
          <Text style={[styles.meetingLabel, { color: colors.textSecondary }]}>📅 {item.meetingTime}</Text>
          <Text style={[styles.meetingLabel, { color: colors.textSecondary }]}>📍 {item.meetingLocation}</Text>
        </View>
        <View style={[styles.leadersSection, { borderTopColor: colors.border }]}>
          <Text style={[styles.leadersTitle, { color: colors.text }]}>{t('clubs.clubLeaders')}:</Text>
          {item.leaders.map((leader, index) => (
            <Text key={index} style={[styles.leaderText, { color: colors.textSecondary }]}>
              • {leader.name} ({leader.role})
            </Text>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerContent}>
            <Image source={require('../../assets/cuz-logo.png')} style={styles.logo} resizeMode="contain" />
            <View style={styles.headerTextWrap}>
              <Text style={[styles.headerTitle, { color: colors.headerText }]}>Cavendish University Zambia</Text>
              <Text style={styles.headerSubtitle}>{t('clubs.title')}</Text>
              <Text style={styles.headerTagline}>{t('clubs.subtitle')}</Text>
            </View>
          </View>
          <Pressable style={styles.menuButton} onPress={() => setShowMenu(!showMenu)}>
            <Text style={[styles.menuDots, { color: colors.headerText }]}>⋮</Text>
          </Pressable>
        </View>
        {showMenu && (
          <>
            <Pressable style={styles.menuOverlay} onPress={() => setShowMenu(false)} />
            <View style={[styles.dropdown, { backgroundColor: colors.card }]} ref={menuRef}>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowMenu(false); navigation.navigate('EventsTab' as never); }}>
                <Text style={styles.dropdownIcon}>📅</Text>
                <Text style={[styles.dropdownText, { color: colors.text }]}>{t('tabs.events')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowMenu(false); navigation.navigate('ClubsTab' as never); }}>
                <Text style={styles.dropdownIcon}>🏛️</Text>
                <Text style={[styles.dropdownText, { color: colors.text }]}>{t('tabs.clubs')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowMenu(false); navigation.navigate('Profile'); }}>
                <Text style={styles.dropdownIcon}>👤</Text>
                <Text style={[styles.dropdownText, { color: colors.text }]}>{t('tabs.profile')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowMenu(false); navigation.navigate('MyTickets'); }}>
                <Text style={styles.dropdownIcon}>🎫</Text>
                <Text style={[styles.dropdownText, { color: colors.text }]}>{t('profile.myTickets')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowMenu(false); navigation.navigate('SavedEvents'); }}>
                <Text style={styles.dropdownIcon}>❤️</Text>
                <Text style={[styles.dropdownText, { color: colors.text }]}>{t('profile.savedEvents')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowMenu(false); navigation.navigate('Settings'); }}>
                <Text style={styles.dropdownIcon}>⚙️</Text>
                <Text style={[styles.dropdownText, { color: colors.text }]}>{t('settings.title')}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <FlatList
        data={filteredClubs}
        keyExtractor={(item) => item.id}
        renderItem={renderClubCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.searchContainer}>
              <TextInput
                style={[styles.searchInput, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                placeholder={t('clubs.search')}
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesContainer}
              contentContainerStyle={styles.categoriesContent}
            >
              {allCategories.map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: colors.border },
                    selectedCategory === category && [styles.categoryChipActive, { backgroundColor: colors.primary }],
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[
                    styles.categoryChipText,
                    { color: colors.textSecondary },
                    selectedCategory === category && [styles.categoryChipTextActive, { color: colors.headerText }],
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('clubs.noClubs')}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerTextWrap: {
    flex: 1,
  },
  logo: {
    width: 60,
    height: 50,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#bfdbfe',
    marginTop: 2,
  },
  headerTagline: {
    fontSize: 11,
    fontWeight: '500',
    color: '#93c5fd',
    marginTop: 1,
    letterSpacing: 0.5,
    fontStyle: 'italic',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuDots: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: -1000,
    zIndex: 20,
  },
  dropdown: {
    position: 'absolute',
    top: 88,
    right: 16,
    borderRadius: 16,
    paddingVertical: 6,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 30,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  dropdownIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  dropdownText: {
    fontSize: 15,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchInput: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
  },
  categoriesContainer: {
    maxHeight: 44,
    marginTop: 8,
    marginBottom: 12,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: {
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryChipTextActive: {
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  clubImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 12,
  },
  clubInfo: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  clubName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  membersText: {
    fontSize: 13,
    fontWeight: '500',
  },
  meetingInfo: {
    padding: 12,
    borderRadius: 20,
    marginBottom: 8,
  },
  meetingLabel: {
    fontSize: 13,
    marginBottom: 2,
  },
  leadersSection: {
    borderTopWidth: 1,
    paddingTop: 8,
  },
  leadersTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  leaderText: {
    fontSize: 12,
    marginLeft: 4,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

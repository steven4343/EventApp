import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, FlatList, Image, ActivityIndicator, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Club } from '../../types';
import { userApi } from '../../api';

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
      <TouchableOpacity style={styles.card} onPress={() => handleClubPress(item.id)} activeOpacity={0.7}>
        <View style={styles.cardContent}>
          <Image source={item.image} style={styles.clubImage} resizeMode="contain" />
          <View style={styles.clubInfo}>
            <Text style={styles.clubName}>{item.name}</Text>
            <Text style={styles.description} numberOfLines={2}>{item.shortDescription}</Text>
            <Text style={styles.membersText}>👥 {item.members} members</Text>
          </View>
        </View>
        <View style={styles.meetingInfo}>
          <Text style={styles.meetingLabel}>📅 {item.meetingTime}</Text>
          <Text style={styles.meetingLabel}>📍 {item.meetingLocation}</Text>
        </View>
        <View style={styles.leadersSection}>
          <Text style={styles.leadersTitle}>Club Leaders:</Text>
          {item.leaders.map((leader, index) => (
            <Text key={index} style={styles.leaderText}>
              • {leader.name} ({leader.role})
            </Text>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerContent}>
            <Image source={require('../../assets/cuz-logo.png')} style={styles.logo} resizeMode="contain" />
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>Cavendish University Zambia</Text>
              <Text style={styles.headerSubtitle}>Clubs</Text>
              <Text style={styles.headerTagline}>Find Your People. Make Your Mark.</Text>
            </View>
          </View>
          <Pressable style={styles.menuButton} onPress={() => setShowMenu(!showMenu)}>
            <Text style={styles.menuDots}>⋮</Text>
          </Pressable>
        </View>
        {showMenu && (
          <>
            <Pressable style={styles.menuOverlay} onPress={() => setShowMenu(false)} />
            <View style={styles.dropdown} ref={menuRef}>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowMenu(false); navigation.navigate('EventsTab' as never); }}>
                <Text style={styles.dropdownIcon}>📅</Text>
                <Text style={styles.dropdownText}>Events</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowMenu(false); navigation.navigate('ClubsTab' as never); }}>
                <Text style={styles.dropdownIcon}>🏛️</Text>
                <Text style={styles.dropdownText}>Clubs</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowMenu(false); navigation.navigate('Profile'); }}>
                <Text style={styles.dropdownIcon}>👤</Text>
                <Text style={styles.dropdownText}>Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowMenu(false); navigation.navigate('MyTickets'); }}>
                <Text style={styles.dropdownIcon}>🎫</Text>
                <Text style={styles.dropdownText}>My Tickets</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowMenu(false); navigation.navigate('SavedEvents'); }}>
                <Text style={styles.dropdownIcon}>❤️</Text>
                <Text style={styles.dropdownText}>Saved Events</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowMenu(false); navigation.navigate('Settings'); }}>
                <Text style={styles.dropdownIcon}>⚙️</Text>
                <Text style={styles.dropdownText}>Settings</Text>
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
                style={styles.searchInput}
                placeholder="Search clubs..."
                placeholderTextColor="#9ca3af"
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
                    selectedCategory === category && styles.categoryChipActive,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[
                    styles.categoryChipText,
                    selectedCategory === category && styles.categoryChipTextActive,
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
            <Text style={styles.emptyText}>No clubs found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#2563eb',
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
    color: '#fff',
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
    color: '#fff',
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
    backgroundColor: '#fff',
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
    color: '#1e293b',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#2563eb',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
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
    color: '#1e293b',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 6,
  },
  membersText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  meetingInfo: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 20,
    marginBottom: 8,
  },
  meetingLabel: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 2,
  },
  leadersSection: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
  },
  leadersTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  leaderText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
});

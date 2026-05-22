import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, FlatList, Image, ActivityIndicator } from 'react-native';
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
        <View style={styles.headerContent}>
          <Image source={require('../../assets/cuz-logo.png')} style={styles.logo} resizeMode="contain" />
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Cavendish University Zambia</Text>
            <Text style={styles.headerSubtitle}>Clubs</Text>
          </View>
        </View>
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
    height: 80,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    borderRadius: 12,
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
    borderRadius: 8,
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

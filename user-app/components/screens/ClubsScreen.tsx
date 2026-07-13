import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, ActivityIndicator, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Club } from '../../types';
import { userApi } from '../../api';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useResponsive, horizontalPadding } from '../../theme/responsive';
import { typography, spacing, radius, shadow } from '../../theme/tokens';
import { SearchBar, CategoryChips } from '../ui/SearchBar';
import { EmptyState } from '../ui/EmptyState';
import { ClubCard } from './ClubCard';

export function ClubsScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const r = useResponsive();
  const ph = horizontalPadding(r);
  const isDesktop = r.width >= 900;
  const gridCols = isDesktop ? (r.width >= 1280 ? 4 : r.width >= 1024 ? 3 : 2) : r.width >= 600 ? 2 : 1;

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

  const allCategories: string[] = ['All', ...Array.from(new Set(clubs.map(c => c.category || '')))];

  const filteredClubs = clubs.filter(club => {
    const matchesSearch = club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          club.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || club.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleClubPress = (clubId: string) => {
    navigation.navigate('ClubDetails', { clubId });
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <View style={{ padding: ph }}>
          <View style={{ height: 44, backgroundColor: colors.skeleton, borderRadius: radius.full, marginBottom: spacing.md }} />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {[1, 2, 3].map(i => (
              <View key={i} style={{ height: 36, width: 80, backgroundColor: colors.skeleton, borderRadius: radius.full }} />
            ))}
          </View>
        </View>
        <View style={{ flex: 1, padding: ph }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <View key={i} style={{ flex: 1, minWidth: 280, height: 140, backgroundColor: colors.skeleton, borderRadius: radius.xl }} />
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <FlatList
        data={filteredClubs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ flex: 1, maxWidth: `${100 / gridCols}%`, padding: spacing.sm }}>
            <ClubCard club={item} onPress={() => handleClubPress(item.id)} />
          </View>
        )}
        numColumns={gridCols}
        contentContainerStyle={{ paddingHorizontal: ph, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg, paddingTop: spacing.md }}>
              <Image
                source={require('../../assets/cuz-logo.png')}
                style={{ width: isDesktop ? 48 : 40, height: isDesktop ? 48 : 40, borderRadius: radius.md }}
                resizeMode="contain"
              />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={[typography.h2, { color: colors.text }]}>Clubs</Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>{t('clubs.subtitle')}</Text>
              </View>
            </View>

            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('clubs.search')}
            />

            <View style={{ marginTop: spacing.md, marginBottom: spacing.lg }}>
              <CategoryChips
                categories={allCategories}
                selected={selectedCategory}
                onSelect={setSelectedCategory}
              />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
              <Text style={[typography.label, { color: colors.textSecondary }]}>
                {filteredClubs.length} club{filteredClubs.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            emoji="👥"
            title={t('clubs.noClubs')}
            description="Try adjusting your search or filters"
          />
        }
      />
    </SafeAreaView>
  );
}

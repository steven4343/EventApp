import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radius, typography, spacing } from '../../theme/tokens';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function SearchBar({ value, onChangeText, placeholder = 'Search events...', onFocus, onBlur }: SearchBarProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.inputBg,
        borderRadius: radius.xl,
        borderWidth: 1.5,
        borderColor: focused ? colors.primary : colors.border,
        paddingHorizontal: spacing.lg,
        height: 48,
        gap: spacing.sm,
      }}
    >
      <Text style={{ fontSize: 18 }}>🔍</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        onFocus={() => { setFocused(true); onFocus?.(); }}
        onBlur={() => { setFocused(false); onBlur?.(); }}
        style={{
          flex: 1,
          ...typography.body,
          color: colors.text,
          padding: 0,
          ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
        }}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={{ fontSize: 16, color: colors.textMuted }}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

interface CategoryChipsProps {
  categories: string[];
  selected: string;
  onSelect: (cat: string) => void;
}

export function CategoryChips({ categories, selected, onSelect }: CategoryChipsProps) {
  const { colors } = useTheme();

  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
      {categories.map(cat => {
        const isActive = cat === selected;
        return (
          <TouchableOpacity
            key={cat}
            onPress={() => onSelect(cat)}
            activeOpacity={0.7}
            style={{
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.lg,
              borderRadius: radius.full,
              backgroundColor: isActive ? colors.primary : colors.surface,
              borderWidth: isActive ? 0 : 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={[
                typography.label,
                { color: isActive ? '#ffffff' : colors.textSecondary },
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

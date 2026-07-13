import React from 'react';
import { Modal as RNModal, View, Text, TouchableOpacity, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { radius, typography, spacing, shadow } from '../../theme/tokens';

interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export function AppModal({ visible, onClose, title, children, size = 'md' }: AppModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const maxWidth = {
    sm: 340,
    md: 440,
    lg: 560,
    full: '100%' as const,
  };

  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardAvoid}
          >
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View
                style={[
                  styles.content,
                  shadow.xl,
                  {
                    backgroundColor: colors.card,
                    maxWidth: maxWidth[size],
                    borderRadius: radius.xl,
                    marginTop: 'auto',
                    marginBottom: size === 'full' ? 0 : insets.bottom + spacing.lg,
                    maxHeight: size === 'full' ? '95%' : '80%',
                  },
                ]}
              >
                {title && (
                  <View style={styles.header}>
                    <Text style={[typography.h4, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                      {title}
                    </Text>
                    <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Text style={{ fontSize: 20, color: colors.textMuted }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <View style={styles.body}>{children}</View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  body: {
    padding: spacing.xl,
  },
});

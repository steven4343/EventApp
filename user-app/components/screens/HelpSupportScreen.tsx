import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const FAQS = [
  {
    question: 'How do I register for an event?',
    answer: 'Browse events from the Events tab, tap on an event, and follow the registration steps on the event details page.',
  },
  {
    question: 'Can I get a refund for my ticket?',
    answer: 'Ticket refund policies vary by event. Check the event details for specific refund information, or contact the event organizer.',
  },
  {
    question: 'How do I join a club?',
    answer: 'Navigate to the Clubs tab, select a club you are interested in, and tap the "Join Club" button on the club details page.',
  },
  {
    question: 'Is my payment information secure?',
    answer: 'Yes, all payment transactions are encrypted and processed through secure payment gateways.',
  },
  {
    question: 'How do I reset my password?',
    answer: 'Go to Profile > Settings > Change Password. If you forgot your password, contact support for assistance.',
  },
];

export function HelpSupportScreen() {
  const navigation = useNavigation();
  const { isDark, colors } = useTheme();
  const { t } = useLanguage();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportText, setReportText] = useState('');

  const handleContactEmail = () => {
    Linking.openURL('mailto:support@cuzevents.com?subject=Support Request');
  };

  const handleSubmitReport = () => {
    if (!reportText.trim()) {
      Alert.alert(t('login.error'), 'Please describe the issue');
      return;
    }
    Alert.alert('Report Submitted', 'We will review your report and get back to you.');
    setReportText('');
    setShowReportForm(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backText, { color: colors.headerText }]}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.headerText }]}>{t('helpSupport.title')}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('helpSupport.faq')}</Text>
          {FAQS.map((faq, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.faqItem, { borderBottomColor: colors.border }]}
              onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
            >
              <View style={styles.faqHeader}>
                <Text style={[styles.faqQuestion, { color: colors.text }]}>{faq.question}</Text>
                <Text style={[styles.faqChevron, { color: colors.textMuted }]}>{expandedFaq === index ? '▾' : '▸'}</Text>
              </View>
              {expandedFaq === index && (
                <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('helpSupport.contactSupport')}</Text>
          <TouchableOpacity style={styles.contactButton} onPress={handleContactEmail}>
            <Text style={styles.contactIcon}>📧</Text>
            <Text style={[styles.contactText, { color: colors.primary }]}>Email Support</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('helpSupport.reportIssue')}</Text>
          <TouchableOpacity
            style={[styles.reportButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowReportForm(true)}
          >
            <Text style={[styles.reportButtonText, { color: colors.headerText }]}>{t('helpSupport.reportIssue')}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showReportForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('helpSupport.reportIssue')}</Text>
            <TextInput
              style={[styles.reportInput, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
              value={reportText}
              onChangeText={setReportText}
              placeholder="Describe the issue you're experiencing..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.border }]}
                onPress={() => setShowReportForm(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={handleSubmitReport}
              >
                <Text style={[styles.submitButtonText, { color: colors.headerText }]}>{t('common.confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  backText: {
    fontSize: 24,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  faqItem: {
    borderBottomWidth: 1,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    marginRight: 8,
  },
  faqChevron: {
    fontSize: 18,
  },
  faqAnswer: {
    fontSize: 14,
    paddingHorizontal: 16,
    paddingBottom: 16,
    lineHeight: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  contactIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  contactText: {
    fontSize: 16,
    fontWeight: '500',
  },
  reportButton: {
    margin: 16,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
  },
  reportButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  reportInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    minHeight: 120,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 20,
    alignItems: 'center',
  },
  cancelButton: {
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

import React, { useState } from 'react';
import { View, Text, TextInput, Modal, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Button } from './Button';
import { userApi } from '../../api';

interface RegistrationModalProps {
  visible: boolean;
  onClose: () => void;
  eventTitle: string;
  eventId: string;
  eventPrice: number;
}

export function RegistrationModal({ visible, onClose, eventTitle, eventId, eventPrice }: RegistrationModalProps) {
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!fullName || !studentId || !email) return;
    
    setIsSubmitting(true);
    try {
      await userApi.purchaseTicket(eventId, `Seat ${Math.floor(Math.random() * 1000)}`, eventPrice);
      setIsSuccess(true);
    } catch (e: any) {
      Alert.alert('Registration Failed', e.message || 'Could not register for event');
    }
    setIsSubmitting(false);
  };

  const handleClose = () => {
    setFullName('');
    setStudentId('');
    setEmail('');
    setPhone('');
    setIsSuccess(false);
    onClose();
  };

  if (isSuccess) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successTitle}>Registration Complete!</Text>
            <Text style={styles.successMessage}>
              You have successfully registered for {eventTitle}. Check your email for confirmation.
            </Text>
            <Button onPress={handleClose} style={styles.successButton}>
              Done
            </Button>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Event Registration</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.eventName}>{eventTitle}</Text>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#9ca3af"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Student ID *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 2024-CS-001"
                  placeholderTextColor="#9ca3af"
                  value={studentId}
                  onChangeText={setStudentId}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="your.email@student.cavendish.co.zm"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+260 XX XXX XXXX"
                  placeholderTextColor="#9ca3af"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <Button
                variant="secondary"
                onPress={handleClose}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={!fullName || !studentId || !email}
                style={styles.submitButton}
              >
                Register
              </Button>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 16,
    color: '#64748b',
  },
  eventName: {
    fontSize: 14,
    color: '#64748b',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  form: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1e293b',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
  successContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 40,
    marginVertical: 'auto',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dcfce7',
    fontSize: 32,
    color: '#16a34a',
    textAlign: 'center',
    lineHeight: 64,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  successButton: {
    width: '100%',
  },
});

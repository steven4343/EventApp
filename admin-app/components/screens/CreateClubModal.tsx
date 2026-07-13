import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  Alert,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../../context/ThemeContext";
import { adminApi } from "../../api";
import { Club } from "../../types";

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: (club: Club) => void;
}

const CATEGORIES = [
  "Academic",
  "Sports",
  "Arts",
  "Technology",
  "Social",
  "Volunteer",
  "Professional",
  "Other",
];

export default function CreateClubModal({ visible, onClose, onCreated }: Props) {
  const { colors } = useTheme();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [imageMode, setImageMode] = useState<"gallery" | "url">("gallery");

  const resetForm = () => {
    setName("");
    setCategory("");
    setShortDescription("");
    setDescription("");
    setMeetingTime("");
    setMeetingLocation("");
    setImageUri(null);
    setImageUrl("");
    setShowCategoryPicker(false);
    setImageMode("gallery");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Camera roll access is required to select an image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Camera access is required to take a photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Missing field", "Club name is required.");
      return;
    }
    if (!category) {
      Alert.alert("Missing field", "Please select a category.");
      return;
    }

    setSubmitting(true);
    try {
      const finalImage = imageMode === "url" ? imageUrl.trim() : imageUri || "";
      const clubData = {
        name: name.trim(),
        category,
        shortDescription: shortDescription.trim(),
        description: description.trim(),
        meetingTime: meetingTime.trim(),
        meetingLocation: meetingLocation.trim(),
        image: finalImage,
        members: 0,
        leaders: [],
        status: "Pending" as const,
        rating: 0,
        reviews: 0,
      };
      const newClub = await adminApi.createClub(clubData);
      if (finalImage) {
        try {
          await adminApi.uploadImage('club', newClub.id, finalImage);
        } catch (imgErr) {
          console.warn('Image upload failed, club created without image:', imgErr);
        }
      }
      onCreated(newClub);
      resetForm();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to create club");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>Create New Club</Text>
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              <Text style={[styles.closeBtnText, { color: colors.textSecondary }]}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.label, { color: colors.text }]}>
              Club Name <Text style={{ color: colors.danger }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. Robotics Club"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.label, { color: colors.text }]}>
              Category <Text style={{ color: colors.danger }}>*</Text>
            </Text>
            <Pressable
              style={[styles.input, styles.selectInput, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Text style={{ color: category ? colors.text : colors.textMuted, fontSize: 15 }}>
                {category || "Select a category"}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                {showCategoryPicker ? "▲" : "▼"}
              </Text>
            </Pressable>
            {showCategoryPicker && (
              <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadow }]}>
                {CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    style={[
                      styles.dropdownItem,
                      { borderBottomColor: colors.border },
                      category === cat && { backgroundColor: colors.primaryLight },
                    ]}
                    onPress={() => {
                      setCategory(cat);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownText,
                        { color: category === cat ? colors.primary : colors.text },
                      ]}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            <Text style={[styles.label, { color: colors.text }]}>Short Description</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              placeholder="One-liner about the club"
              placeholderTextColor={colors.textMuted}
              value={shortDescription}
              onChangeText={setShortDescription}
              maxLength={100}
            />

            <Text style={[styles.label, { color: colors.text }]}>Full Description</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              placeholder="Detailed description of the club..."
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={[styles.label, { color: colors.text }]}>Meeting Time</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. Fridays at 3pm"
              placeholderTextColor={colors.textMuted}
              value={meetingTime}
              onChangeText={setMeetingTime}
            />

            <Text style={[styles.label, { color: colors.text }]}>Meeting Location</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. Room 204, Main Building"
              placeholderTextColor={colors.textMuted}
              value={meetingLocation}
              onChangeText={setMeetingLocation}
            />

            <Text style={[styles.label, { color: colors.text }]}>Club Image</Text>
            <View style={styles.imageModeRow}>
              <Pressable
                style={[
                  styles.imageModeBtn,
                  {
                    backgroundColor: imageMode === "gallery" ? colors.primary : colors.inputBg,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setImageMode("gallery")}
              >
                <Text
                  style={{
                    color: imageMode === "gallery" ? "#fff" : colors.textSecondary,
                    fontWeight: "600",
                    fontSize: 13,
                  }}
                >
                  Gallery / Camera
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.imageModeBtn,
                  {
                    backgroundColor: imageMode === "url" ? colors.primary : colors.inputBg,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setImageMode("url")}
              >
                <Text
                  style={{
                    color: imageMode === "url" ? "#fff" : colors.textSecondary,
                    fontWeight: "600",
                    fontSize: 13,
                  }}
                >
                  Image URL
                </Text>
              </Pressable>
            </View>

            {imageMode === "gallery" ? (
              <View style={styles.imagePickerRow}>
                <Pressable
                  style={[styles.imageActionBtn, { backgroundColor: colors.primaryLight }]}
                  onPress={pickImage}
                >
                  <Text style={[styles.imageActionText, { color: colors.primary }]}>🖼️ Gallery</Text>
                </Pressable>
                <Pressable
                  style={[styles.imageActionBtn, { backgroundColor: colors.primaryLight }]}
                  onPress={takePhoto}
                >
                  <Text style={[styles.imageActionText, { color: colors.primary }]}>📷 Camera</Text>
                </Pressable>
              </View>
            ) : (
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                placeholder="https://example.com/club-image.jpg"
                placeholderTextColor={colors.textMuted}
                value={imageUrl}
                onChangeText={setImageUrl}
                keyboardType="url"
                autoCapitalize="none"
              />
            )}

            {(imageUri || (imageMode === "url" && imageUrl.trim())) && (
              <View style={styles.previewContainer}>
                <Image
                  source={{ uri: imageMode === "url" ? imageUrl.trim() : imageUri! }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
                <Pressable
                  style={[styles.removeImageBtn, { backgroundColor: colors.danger }]}
                  onPress={() => {
                    setImageUri(null);
                    setImageUrl("");
                  }}
                >
                  <Text style={styles.removeImageText}>Remove</Text>
                </Pressable>
              </View>
            )}

            <Pressable
              style={[
                styles.submitBtn,
                { backgroundColor: colors.primary },
                submitting && { opacity: 0.6 },
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitBtnText}>
                {submitting ? "Creating..." : "Create Club"}
              </Text>
            </Pressable>

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: "600",
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  selectInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 6,
    overflow: "hidden",
    ...(Platform.OS === "web"
      ? { boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }
      : { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }),
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dropdownText: {
    fontSize: 15,
    fontWeight: "500",
  },
  imageModeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  imageModeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  imagePickerRow: {
    flexDirection: "row",
    gap: 10,
  },
  imageActionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  imageActionText: {
    fontSize: 15,
    fontWeight: "600",
  },
  previewContainer: {
    marginTop: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
  },
  removeImageBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  removeImageText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  submitBtn: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});

import { ImageSourcePropType } from 'react-native';

export function normalizeImage(image: any): ImageSourcePropType {
  if (!image) {
    return { uri: 'https://picsum.photos/seed/event/400' };
  }
  if (typeof image === 'string') {
    if (image.startsWith('http') || image.startsWith('data:')) {
      return { uri: image };
    }
    return { uri: `https://picsum.photos/seed/${image}/400` };
  }
  return image;
}

export function normalizeClubImage(image: any): ImageSourcePropType {
  if (!image) {
    return { uri: 'https://picsum.photos/seed/club/400' };
  }
  if (typeof image === 'string') {
    if (image.startsWith('http') || image.startsWith('data:')) {
      return { uri: image };
    }
    return { uri: `https://picsum.photos/seed/${image}/400` };
  }
  return image;
}

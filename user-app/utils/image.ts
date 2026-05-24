import { ImageRequireSource, ImageSourcePropType } from 'react-native';

export function normalizeImage(image: any): ImageSourcePropType {
  if (typeof image === 'string') {
    return { uri: image };
  }
  return image;
}

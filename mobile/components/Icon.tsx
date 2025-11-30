import React from 'react';
import { View, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';

export type IconName =
  | 'heart'
  | 'play'
  | 'share'
  | 'trash'
  | 'user'
  | 'home'
  | 'upload'
  | 'bell'
  | 'search'
  | 'settings'
  | 'edit'
  | 'close'
  | 'check'
  | 'chevron-right'
  | 'chevron-left'
  | 'clock'
  | 'eye'
  | 'eye-off'
  | 'lock'
  | 'message'
  | 'more'
  | 'music';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  filled?: boolean;
}

const iconMap: { [key in IconName]: { library: typeof Feather | typeof Ionicons; name: string } } = {
  heart: { library: Feather, name: 'heart' },
  play: { library: Feather, name: 'play' },
  share: { library: Feather, name: 'share-2' },
  trash: { library: Feather, name: 'trash-2' },
  user: { library: Feather, name: 'user' },
  home: { library: Feather, name: 'home' },
  upload: { library: Feather, name: 'upload' },
  bell: { library: Feather, name: 'bell' },
  search: { library: Feather, name: 'search' },
  settings: { library: Feather, name: 'settings' },
  edit: { library: Feather, name: 'edit-2' },
  close: { library: Feather, name: 'x' },
  check: { library: Feather, name: 'check' },
  'chevron-right': { library: Feather, name: 'chevron-right' },
  'chevron-left': { library: Feather, name: 'chevron-left' },
  clock: { library: Feather, name: 'clock' },
  eye: { library: Feather, name: 'eye' },
  'eye-off': { library: Feather, name: 'eye-off' },
  lock: { library: Feather, name: 'lock' },
  message: { library: Feather, name: 'message-circle' },
  more: { library: Feather, name: 'more-vertical' },
  music: { library: Feather, name: 'music' },
};

export default function Icon({ name, size = 24, color = '#000', filled = false }: IconProps) {
  const iconConfig = iconMap[name];

  if (!iconConfig) {
    return null;
  }

  const IconComponent = iconConfig.library;

  return (
    <IconComponent
      name={iconConfig.name}
      size={size}
      color={color}
    />
  );
}

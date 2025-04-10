import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MapPin } from 'lucide-react-native';

type BadgeProps = {
  children: React.ReactNode;
  className?: any;
  icon?: boolean;
};

export function SectionBadge({
  children,
  className,
  icon = true,
}: BadgeProps) {
  return (
    <View
      style={[
        styles.badgeContainer,
        className,
      ]}
    >
      {icon && <MapPin style={styles.icon} />}
      <Text style={styles.badgeText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    backgroundColor: '#FF9E0D1A', // #FF9E0D with 10% opacity (alpha = 0.1)
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 999, // To make it fully rounded
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  badgeText: {
    color: '#FF9E0D',
    fontWeight: '500', // Medium font weight
    fontSize: 12, // xs font size (you might need to adjust this)
  },
  icon: {
    width: 3,
    height: 3,
    color: '#FF9E0D'
  },
});
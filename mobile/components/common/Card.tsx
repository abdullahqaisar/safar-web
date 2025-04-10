import React from 'react';
import { View, StyleSheet } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'bordered';
  allowOverflow?: boolean;
  className?: any;
}

export function Card({
  children,
  className,
  variant = 'default',
  allowOverflow = false,
}: CardProps) {
  const variants = StyleSheet.create({
    default: {
      backgroundColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
    },
    elevated: {
      backgroundColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,
      elevation: 5,
    },
    bordered: {      
      backgroundColor: '#FFFFFF',
      borderWidth: 0,      
    },
  });

  return (
    <View
      style={[
        styles.card,
        variants[variant],
        !allowOverflow && styles.overflowHidden,
        className,
        className == undefined && styles.defaultPadding
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
  },
  overflowHidden: {
    overflow: 'hidden',
  },
  defaultPadding: {    
    padding: 16,
  },
});
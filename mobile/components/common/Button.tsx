import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Loader2, LucideIcon } from 'lucide-react-native';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onPress?: () => void;
  type?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  disabled,
  onPress,
  type,
}: ButtonProps) {
  const variants = StyleSheet.create({
    primary: {
      backgroundColor: '#00a745',
    },
    secondary: {
      backgroundColor: '#00562a',
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: '#00a745',
    },    
    ghost: {
      backgroundColor: 'transparent',
    },
  });

  const textVariants = StyleSheet.create({
    primary: {
      color: 'white',
    },
    secondary: {
      color: 'white',
    },
    outline: {
      color: '#00a745',
    },
    ghost: {
      color: '#333333',
    },
  });

  const sizes = StyleSheet.create({
    sm: {
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    md: {
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    lg: {
      paddingVertical: 16,
      paddingHorizontal: 24,
    },
  });

  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        variants[variant],
        sizes[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
      ]}
    >
      <View style={styles.innerContainer}>
        {isLoading ? (
          <Loader2 size={16} style={styles.loader} />
        ) : (
          <>
            {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
            <Text style={[styles.text, textVariants[variant]]}>
              {isLoading && typeof children === 'string' ? `Loading...` : children}
            </Text>
            {rightIcon && <View style={styles.iconContainer}>{rightIcon}</View>}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {    
    fontWeight: 'bold',
    fontSize: 16,
    color: "#333333"
  },
  fullWidth: {
    width: '100%',
    
  },
  disabled: {
    opacity: 0.7,
  },
  loader: {
    width: 16,
    height: 16,
    
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center"
  },
  outlineBorder: {
    borderWidth: 1,
  }
});
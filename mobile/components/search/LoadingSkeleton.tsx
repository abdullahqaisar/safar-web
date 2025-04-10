import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const LoadingSkeleton: React.FC = () => {
  const shimmerValue = useRef(new Animated.Value(-1)).current;

  const shimmerAnimation = Animated.loop(
    Animated.timing(shimmerValue, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    })
  );

  useEffect(() => {
    shimmerAnimation.start();
    return () => {
      shimmerAnimation.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Animated.View
          style={[
            styles.labelSkeleton,
            {
              transform: [
                {
                  translateX: shimmerValue.interpolate({
                    inputRange: [-1, 1],
                    outputRange: ['-100%', '100%'],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['#ddd', '#eee', '#ddd']}
            style={styles.shimmerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.inputSkeleton,
            {
              transform: [
                {
                  translateX: shimmerValue.interpolate({
                    inputRange: [-1, 1],
                    outputRange: ['-100%', '100%'],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['#ddd', '#eee', '#ddd']}
            style={styles.shimmerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </Animated.View>
      </View>
      <View style={styles.inputContainer}>
        <Animated.View style={styles.labelSkeleton} />
        <Animated.View style={styles.inputSkeleton} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 3,
    padding: 10,
  },
  inputContainer: {
    gap: 1,
  },
  labelSkeleton: {
    width: 48, //12 * 4
    height: 16, //4 * 4
    borderRadius: 4,
    backgroundColor: '#ddd',
    overflow: 'hidden',
  },
  inputSkeleton: {
    width: '100%',
    height: 40, //10 * 4
    borderRadius: 4,
    backgroundColor: '#ddd',
    overflow: 'hidden',
  },
  shimmerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: '200%',
  },
});

export default LoadingSkeleton;
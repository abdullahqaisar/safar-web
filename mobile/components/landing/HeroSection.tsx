import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import HeroSearchForm from './HeroSearchForm';
import { Route as RouteIcon } from 'lucide-react-native';

const HeroSection: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        <RouteIcon size={24} style={styles.titleIcon} /> Search Your Route
      </Text>
      <HeroSearchForm/>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  titleIcon: {
    marginRight: 8,
    color: '#FF9E0D',
  },
});

export default HeroSection;
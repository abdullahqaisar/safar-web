import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import HeroSection from "../components/landing/HeroSection";
import { JourneyProvider } from "../context/JourneyContext";

const Home: React.FC = () => {
  return (
    <JourneyProvider>
      <ScrollView contentContainerStyle={styles.container}>
        <HeroSection />
      </ScrollView>
    </JourneyProvider>
  );
};

const styles = StyleSheet.create({
  container: { padding: 10, gap: 10 },
});

export default Home;
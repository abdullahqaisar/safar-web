import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Route as RouteIcon,
  AlertCircle,
  MapPin,
  Navigation,
  Search,
} from 'lucide-react-native';
import { useJourneySearch } from '../../hooks/useJourneySearch';
import { useJourney } from '../../hooks/useJourney';
import { Card } from '../common/Card';
import JourneySearchForm from '../search/JourneySearchForm';
import { Button } from '../common/Button';

const HeroSearchForm: React.FC = () => {
  const {
    fromValue,
    toValue,
    setFromValue,
    setToValue,
    formError,
    isNavigating,
    hasBothLocations,
    submitSearch,
  } = useJourneySearch('/route');
  const { isFormValid } = useJourney();

  return (
    <Card variant="elevated">
      <View style={styles.journeySearchContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>
            <RouteIcon size={24} style={styles.icon} />
            Search Your Route
          </Text>
          <JourneySearchForm
            onFromValueChange={setFromValue}
            onToValueChange={setToValue}
          />
          {formError && (
            <View style={styles.errorContainer}>
              <AlertCircle size={18} style={styles.errorIcon} />
              <Text style={styles.errorText}>{formError}</Text>
            </View>
          )}
          <Button
            onPress={submitSearch}
            disabled={!isFormValid || isNavigating}
            isLoading={isNavigating}
            variant="primary"
            size="lg"
            fullWidth
            leftIcon={
              !hasBothLocations ? (
                <MapPin size={20} color={isNavigating ? "white" : "white"} />
              ) : isNavigating ? (
                <Navigation size={20} color="white" />
              ) : (
                <Search size={20} color="white" />
              )
            }
          >
            {!isNavigating && !hasBothLocations
              ? 'Find Routes'
              : isNavigating
              ? 'Finding your routes...'
              : 'Select Both Locations'}
          </Button>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  title: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
    color: '#FF9E0D',
  },
  errorContainer: {
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    padding: 10,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#b91c1c',
    flex: 1,
  },
  errorIcon: {
    marginRight: 8,
    color: '#b91c1c',
    fontSize: 18,
  },
  journeySearchContainer: {
    paddingHorizontal: 16,
  },
});

export default HeroSearchForm;
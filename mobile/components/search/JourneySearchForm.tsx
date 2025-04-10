import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SearchInput from './SearchInput';
import { LocateIcon, MapPin } from 'lucide-react-native';

interface JourneySearchFormProps {
  onFromValueChange: (value: string) => void;
  onToValueChange: (value: string) => void;
}

const JourneySearchForm: React.FC<JourneySearchFormProps> = ({
  onFromValueChange,
  onToValueChange,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>From</Text>
        <SearchInput
          id="from-location"
          placeholder="Enter starting point"
          onValueChange={onFromValueChange}
          icon={LocateIcon}
          aria-label="Origin location"
          value=""
        />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>To</Text>
        <SearchInput
          id="to-location"
          placeholder="Enter destination"
          onValueChange={onToValueChange}
          icon={MapPin}
          aria-label="Destination location"
          value=""
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 4,
  },
  inputContainer: {
    marginBottom: 10,
  },
  label: {
    marginBottom: 5,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default JourneySearchForm;
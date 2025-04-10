import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

interface SearchInputProps {
  id: string;
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  icon?: LucideIcon;
  'aria-label': string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  id,
  placeholder,
  value,
  onValueChange,
  icon: Icon,
  'aria-label': ariaLabel,
}) => {
  return (
    <View style={styles.container}>
      {Icon && <Icon size={16} style={styles.icon} />}
      <TextInput
       id={id}
        placeholder={placeholder}
        value={value}
        onChangeText={onValueChange}
        style={styles.input}
        aria-label={ariaLabel}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',    
    padding: 10,
    borderRadius: 8,    
  },
  input: {
    flex: 1,
    color: '#333333'
  },
  icon: {
    marginRight: 10,
  },
});

export default SearchInput;
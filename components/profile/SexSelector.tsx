import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type SexOption = 'male' | 'female' | 'other';

interface SexSelectorProps {
  value: SexOption;
  onValueChange: (sex: SexOption) => void;
  error?: string;
  label?: string;
  testID?: string;
}

export const SexSelector: React.FC<SexSelectorProps> = ({
  value,
  onValueChange,
  error,
  label = 'Sex',
  testID = 'sex-selector',
}) => {
  const options: { value: SexOption; label: string }[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ];

  const handleOptionPress = (selectedValue: SexOption) => {
    onValueChange(selectedValue);
  };

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.label}>{label}</Text>
      
      <View 
        style={styles.optionsContainer}
        accessibilityRole="radiogroup"
        accessibilityLabel={`${label} selection`}
      >
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              value === option.value ? styles.optionButtonSelected : null,
              error ? styles.optionButtonError : null,
            ]}
            onPress={() => handleOptionPress(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ 
              checked: value === option.value,
              selected: value === option.value 
            }}
            accessibilityLabel={option.label}
            accessibilityHint={`Select ${option.label} as your sex`}
            testID={`${testID}-${option.value}`}
          >
            <View style={[
              styles.radioCircle,
              value === option.value ? styles.radioCircleSelected : null,
            ]}>
              {value === option.value && (
                <View style={styles.radioInner} />
              )}
            </View>
            <Text style={[
              styles.optionText,
              value === option.value ? styles.optionTextSelected : null,
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Error message */}
      {error && (
        <Text 
          style={styles.errorText}
          accessibilityLiveRegion="polite"
          testID={`${testID}-error`}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  optionButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  optionButtonError: {
    borderColor: '#ff4444',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#007AFF',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  optionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: '#ff4444',
    marginTop: 4,
  },
});
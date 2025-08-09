import React, { useEffect, useState } from 'react';
import {
  Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { validateAge } from '../../utils/calorieCalculator';

interface AgeInputProps {
  value: number;
  onValueChange: (age: number) => void;
  error?: string;
  label?: string;
  placeholder?: string;
  testID?: string;
}

export const AgeInput: React.FC<AgeInputProps> = ({
  value,
  onValueChange,
  error,
  label = 'Age',
  placeholder = 'Enter your age',
  testID = 'age-input',
}) => {
  const [inputValue, setInputValue] = useState(value.toString());
  const [validationError, setValidationError] = useState<string>('');

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleInputChange = (text: string) => {
    // Only allow numeric input
    const numericText = text.replace(/[^0-9]/g, '');
    setInputValue(numericText);
    
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError('');
    }

    const numericValue = parseInt(numericText);
    if (!isNaN(numericValue) && numericValue > 0) {
      onValueChange(numericValue);
    }
  };

  const handleInputBlur = () => {
    const numericValue = parseInt(inputValue);
    
    if (isNaN(numericValue) || inputValue === '') {
      setValidationError('Please enter a valid age');
      return;
    }

    // Validate the age
    const validation = validateAge(numericValue);
    if (!validation.isValid) {
      setValidationError(validation.errors[0]);
    } else {
      setValidationError('');
    }
  };

  const displayError = error || validationError;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container} testID={testID}>
      <Text style={styles.label}>{label}</Text>
      
      <TextInput
        style={[
          styles.textInput,
          displayError ? styles.textInputError : null,
        ]}
        value={inputValue}
        onChangeText={handleInputChange}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        keyboardType="numeric"
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
        maxLength={3} // Maximum 3 digits for age
        accessibilityLabel={`${label} input`}
        accessibilityHint="Enter your age in years, between 13 and 120"
        testID={`${testID}-field`}
      />

      {/* Error message */}
      {displayError && (
        <Text 
          style={styles.errorText}
          accessibilityLiveRegion="polite"
          testID={`${testID}-error`}
        >
          {displayError}
        </Text>
      )}
      </View>
    </TouchableWithoutFeedback>
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
  textInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textInputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    fontSize: 12,
    color: '#ff4444',
    marginTop: 4,
  },
});
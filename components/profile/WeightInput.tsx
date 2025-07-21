import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { kgToLbs, lbsToKg, validateWeight } from '../../utils/calorieCalculator';

interface WeightInputProps {
  value: number;
  unit: 'kg' | 'lbs';
  onValueChange: (weight: number) => void;
  onUnitChange: (unit: 'kg' | 'lbs') => void;
  error?: string;
  label?: string;
  placeholder?: string;
  testID?: string;
}

export const WeightInput: React.FC<WeightInputProps> = ({
  value,
  unit,
  onValueChange,
  onUnitChange,
  error,
  label = 'Weight',
  placeholder = 'Enter your weight',
  testID = 'weight-input',
}) => {
  const [inputValue, setInputValue] = useState(value.toString());
  const [validationError, setValidationError] = useState<string>('');

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleInputChange = (text: string) => {
    setInputValue(text);
    
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError('');
    }

    const numericValue = parseFloat(text);
    if (!isNaN(numericValue) && numericValue > 0) {
      onValueChange(numericValue);
    }
  };

  const handleInputBlur = () => {
    const numericValue = parseFloat(inputValue);
    
    if (isNaN(numericValue)) {
      setValidationError('Please enter a valid weight');
      return;
    }

    // Validate the weight
    const validation = validateWeight(numericValue, unit);
    if (!validation.isValid) {
      setValidationError(validation.errors[0]);
    } else {
      setValidationError('');
    }
  };

  const handleUnitToggle = () => {
    const newUnit = unit === 'kg' ? 'lbs' : 'kg';
    const currentWeight = parseFloat(inputValue);
    
    if (!isNaN(currentWeight)) {
      // Convert the weight to the new unit
      const convertedWeight = newUnit === 'kg' 
        ? lbsToKg(currentWeight)
        : kgToLbs(currentWeight);
      
      const roundedWeight = Math.round(convertedWeight * 10) / 10;
      setInputValue(roundedWeight.toString());
      onValueChange(roundedWeight);
    }
    
    onUnitChange(newUnit);
  };

  const getConvertedWeightDisplay = () => {
    const numericValue = parseFloat(inputValue);
    if (isNaN(numericValue)) return '';
    
    const convertedValue = unit === 'kg' 
      ? kgToLbs(numericValue)
      : lbsToKg(numericValue);
    
    const convertedUnit = unit === 'kg' ? 'lbs' : 'kg';
    return `≈ ${Math.round(convertedValue * 10) / 10} ${convertedUnit}`;
  };

  const displayError = error || validationError;

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.label}>{label}</Text>
      
      <View style={styles.inputContainer}>
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
          accessibilityLabel={`${label} input`}
          accessibilityHint={`Enter your weight in ${unit}`}
          testID={`${testID}-field`}
        />
        
        <TouchableOpacity
          style={[
            styles.unitButton,
            unit === 'kg' ? styles.unitButtonActive : null,
          ]}
          onPress={handleUnitToggle}
          accessibilityLabel={`Unit selector, currently ${unit}`}
          accessibilityHint="Tap to switch between kilograms and pounds"
          accessibilityRole="button"
          testID={`${testID}-unit-toggle`}
        >
          <Text style={[
            styles.unitButtonText,
            unit === 'kg' ? styles.unitButtonTextActive : null,
          ]}>
            {unit}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Real-time conversion display */}
      {inputValue && !isNaN(parseFloat(inputValue)) && (
        <Text style={styles.conversionText} testID={`${testID}-conversion`}>
          {getConvertedWeightDisplay()}
        </Text>
      )}

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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
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
  unitButton: {
    marginLeft: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    minWidth: 50,
    alignItems: 'center',
  },
  unitButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
  },
  unitButtonTextActive: {
    color: '#fff',
  },
  conversionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 12,
    color: '#ff4444',
    marginTop: 4,
  },
});
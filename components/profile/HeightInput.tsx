import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { cmToFeetInches, feetInchesToCm, validateHeight } from '../../utils/calorieCalculator';

interface HeightInputProps {
  value: number; // Always in cm
  unit: 'cm' | 'ft_in';
  onValueChange: (height: number) => void; // Always returns cm
  onUnitChange: (unit: 'cm' | 'ft_in') => void;
  error?: string;
  label?: string;
  placeholder?: string;
  testID?: string;
}

export const HeightInput: React.FC<HeightInputProps> = ({
  value,
  unit,
  onValueChange,
  onUnitChange,
  error,
  label = 'Height',
  placeholder = 'Enter your height',
  testID = 'height-input',
}) => {
  const [cmValue, setCmValue] = useState(value.toString());
  const [feetValue, setFeetValue] = useState('');
  const [inchesValue, setInchesValue] = useState('');
  const [validationError, setValidationError] = useState<string>('');

  // Initialize feet/inches values from cm value
  useEffect(() => {
    if (unit === 'ft_in') {
      const { feet, inches } = cmToFeetInches(value);
      setFeetValue(feet.toString());
      setInchesValue(inches.toString());
    } else {
      setCmValue(value.toString());
    }
  }, [value, unit]);

  const handleCmInputChange = (text: string) => {
    setCmValue(text);
    
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError('');
    }

    const numericValue = parseFloat(text);
    if (!isNaN(numericValue) && numericValue > 0) {
      onValueChange(numericValue);
    }
  };

  const handleFeetInputChange = (text: string) => {
    setFeetValue(text);
    
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError('');
    }

    const feet = parseInt(text) || 0;
    const inches = parseInt(inchesValue) || 0;
    
    if (feet >= 0) {
      const heightInCm = feetInchesToCm(feet, inches);
      onValueChange(heightInCm);
    }
  };

  const handleInchesInputChange = (text: string) => {
    setInchesValue(text);
    
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError('');
    }

    const feet = parseInt(feetValue) || 0;
    const inches = parseInt(text) || 0;
    
    if (inches >= 0 && inches < 12) {
      const heightInCm = feetInchesToCm(feet, inches);
      onValueChange(heightInCm);
    }
  };

  const handleCmInputBlur = () => {
    const numericValue = parseFloat(cmValue);
    
    if (isNaN(numericValue)) {
      setValidationError('Please enter a valid height');
      return;
    }

    // Validate the height
    const validation = validateHeight(numericValue, 'cm');
    if (!validation.isValid) {
      setValidationError(validation.errors[0]);
    } else {
      setValidationError('');
    }
  };

  const handleFeetInchesBlur = () => {
    const feet = parseInt(feetValue) || 0;
    const inches = parseInt(inchesValue) || 0;
    
    if (feet < 0) {
      setValidationError('Please enter valid feet');
      return;
    }

    if (inches < 0 || inches >= 12) {
      setValidationError('Inches must be between 0 and 11');
      return;
    }

    // Validate the height
    const validation = validateHeight(feet, 'ft_in', inches);
    if (!validation.isValid) {
      setValidationError(validation.errors[0]);
    } else {
      setValidationError('');
    }
  };

  const handleUnitToggle = () => {
    const newUnit = unit === 'cm' ? 'ft_in' : 'cm';
    
    if (newUnit === 'ft_in') {
      // Convert current cm value to feet/inches
      const currentCm = parseFloat(cmValue);
      if (!isNaN(currentCm)) {
        const { feet, inches } = cmToFeetInches(currentCm);
        setFeetValue(feet.toString());
        setInchesValue(inches.toString());
      }
    } else {
      // Convert current feet/inches to cm
      const feet = parseInt(feetValue) || 0;
      const inches = parseInt(inchesValue) || 0;
      const heightInCm = feetInchesToCm(feet, inches);
      setCmValue(Math.round(heightInCm).toString());
    }
    
    onUnitChange(newUnit);
  };

  const getConvertedHeightDisplay = () => {
    if (unit === 'cm') {
      const numericValue = parseFloat(cmValue);
      if (isNaN(numericValue)) return '';
      
      const { feet, inches } = cmToFeetInches(numericValue);
      return `≈ ${feet}' ${inches}"`;
    } else {
      const feet = parseInt(feetValue) || 0;
      const inches = parseInt(inchesValue) || 0;
      
      if (feet === 0 && inches === 0) return '';
      
      const heightInCm = feetInchesToCm(feet, inches);
      return `≈ ${Math.round(heightInCm)} cm`;
    }
  };

  const displayError = error || validationError;

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.label}>{label}</Text>
      
      <View style={styles.inputContainer}>
        {unit === 'cm' ? (
          <TextInput
            style={[
              styles.textInput,
              displayError ? styles.textInputError : null,
            ]}
            value={cmValue}
            onChangeText={handleCmInputChange}
            onBlur={handleCmInputBlur}
            placeholder={placeholder}
            keyboardType="numeric"
            returnKeyType="done"
            accessibilityLabel={`${label} input in centimeters`}
            accessibilityHint="Enter your height in centimeters"
            testID={`${testID}-cm-field`}
          />
        ) : (
          <View style={styles.feetInchesContainer}>
            <View style={styles.feetInputContainer}>
              <TextInput
                style={[
                  styles.textInput,
                  styles.feetInput,
                  displayError ? styles.textInputError : null,
                ]}
                value={feetValue}
                onChangeText={handleFeetInputChange}
                onBlur={handleFeetInchesBlur}
                placeholder="0"
                keyboardType="numeric"
                returnKeyType="next"
                accessibilityLabel="Height feet input"
                accessibilityHint="Enter feet portion of your height"
                testID={`${testID}-feet-field`}
              />
              <Text style={styles.unitLabel}>ft</Text>
            </View>
            
            <View style={styles.inchesInputContainer}>
              <TextInput
                style={[
                  styles.textInput,
                  styles.inchesInput,
                  displayError ? styles.textInputError : null,
                ]}
                value={inchesValue}
                onChangeText={handleInchesInputChange}
                onBlur={handleFeetInchesBlur}
                placeholder="0"
                keyboardType="numeric"
                returnKeyType="done"
                accessibilityLabel="Height inches input"
                accessibilityHint="Enter inches portion of your height, 0 to 11"
                testID={`${testID}-inches-field`}
              />
              <Text style={styles.unitLabel}>in</Text>
            </View>
          </View>
        )}
        
        <TouchableOpacity
          style={[
            styles.unitButton,
            unit === 'cm' ? styles.unitButtonActive : null,
          ]}
          onPress={handleUnitToggle}
          accessibilityLabel={`Unit selector, currently ${unit === 'cm' ? 'centimeters' : 'feet and inches'}`}
          accessibilityHint="Tap to switch between centimeters and feet/inches"
          accessibilityRole="button"
          testID={`${testID}-unit-toggle`}
        >
          <Text style={[
            styles.unitButtonText,
            unit === 'cm' ? styles.unitButtonTextActive : null,
          ]}>
            {unit === 'cm' ? 'CM' : 'FT'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Real-time conversion display */}
      {getConvertedHeightDisplay() && (
        <Text style={styles.conversionText} testID={`${testID}-conversion`}>
          {getConvertedHeightDisplay()}
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
  feetInchesContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  feetInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inchesInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  feetInput: {
    flex: 1,
    marginRight: 4,
  },
  inchesInput: {
    flex: 1,
    marginRight: 4,
  },
  unitLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    minWidth: 20,
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
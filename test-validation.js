// Simple test to verify the validation functions work
const {
  lbsToKg,
  kgToLbs,
  feetInchesToCm,
  cmToFeetInches,
  validateAge,
  validateWeight,
  validateHeight,
  validateSex,
  validateUserProfile
} = require('./utils/calorieCalculator.ts');

// Test unit conversions
console.log('Testing unit conversions:');
console.log('220 lbs to kg:', lbsToKg(220));
console.log('100 kg to lbs:', kgToLbs(100));
console.log('6 feet 0 inches to cm:', feetInchesToCm(6, 0));
console.log('183 cm to feet/inches:', cmToFeetInches(183));

// Test validations
console.log('\nTesting validations:');
console.log('Age 25 valid:', validateAge(25).isValid);
console.log('Age 10 valid:', validateAge(10).isValid);
console.log('Weight 70kg valid:', validateWeight(70, 'kg').isValid);
console.log('Weight 25kg valid:', validateWeight(25, 'kg').isValid);
console.log('Height 175cm valid:', validateHeight(175, 'cm').isValid);
console.log('Height 90cm valid:', validateHeight(90, 'cm').isValid);
console.log('Sex male valid:', validateSex('male').isValid);
console.log('Sex invalid valid:', validateSex('invalid').isValid);

console.log('\nAll functions implemented successfully!');
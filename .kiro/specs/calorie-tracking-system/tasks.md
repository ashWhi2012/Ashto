# Implementation Plan

- [x] 1. Enhance UserProfile interface and validation

  - Update UserProfile interface in calorieCalculator.ts to include weightUnit, heightUnit, createdAt, updatedAt fields
  - Add validation functions for age (13-120), weight (30-300kg), height (100-250cm) ranges
  - Create unit conversion utilities (lbs to kg, ft/in to cm)
  - Write unit tests for validation functions and conversions
  - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [x] 2. Extend UserProfileContext with enhanced functionality

  - Add profile completeness calculation method to UserProfileContext
  - Implement profile validation state management
  - Add methods for checking if profile data is sufficient for accurate calculations
  - Create default profile generation with fallback values
  - _Requirements: 1.7, 2.5_

- [x] 3. Create personal information form components

  - [x] 3.1 Build WeightInput component with unit selection

    - Create controlled input component with kg/lbs toggle
    - Implement real-time unit conversion display

    - Add input validation with error messaging
    - Write component tests for validation and conversion
    - _Requirements: 1.2_

  - [x] 3.2 Build HeightInput component with unit selection

    - Create controlled input component with cm/ft-in toggle
    - Implement dual input fields for feet and inches when in imperial mode
    - Add input validation with error messaging
    - Write component tests for validation and conversion
    - _Requirements: 1.3_

- - [x] 3.3 Build AgeInput and SexSelector components

    - Create numeric input component for age with validation
    - Create radio button group component for sex selection (Male, Female, Other)
    - Add proper accessibility labels and keyboard navigation
    - Write component tests for validation and selection
    - _Requirements: 1.4, 1.5_

- [x] 4. Integrate personal information section into Settings tab

  - Add collapsible "Personal Information" section to Settings tab
  - Implement profile completeness progress indicator
  - Add form submission handling with validation feedback
  - Create success/error messaging for profile save operations
  - Integrate with existing theme system for consistent styling
  - Write integration tests for Settings tab profile functionality
  - _Requirements: 1.1, 1.6, 1.7_

- [x] 5. Enhance calorie calculation engine with personalization

  - [x] 5.1 Implement sex-based metabolic adjustments

    - Add 5-10% adjustment factor for female users in calorie calculations
    - Update calculateWorkoutCalories function to apply sex-based modifiers
    - _Requirements: 4.2_

  - [x] 5.2 Add BMI-based calorie adjustments

    - Implement BMI calculation from height and weight
    - Add ±10% calorie adjustment based on BMI ranges
    - Update calorie calculation to include BMI factors
    - Write unit tests for BMI calculations and adjustments
    - _Requirements: 4.5_

  - [x] 5.3 Implement intensity-based MET multipliers

    - Add high intensity multipliers (1.2-1.5x base MET) for vigorous exercises
    - Add low intensity multipliers (0.8-0.9x base MET) for light exercises
    - Update MET value selection logic to apply intensity modifiers
    - Write unit tests for intensity-based MET calculations

    - _Requirements: 4.3, 4.4_

- [x] 6. Create WorkoutSummaryModal component

  - [x] 6.1 Build modal component structure and layout

    - Create modal component with animated calorie counter display
    - Implement workout duration and exercise type summary display
    - Add close/dismiss functionality with proper modal behavior
    - Style modal to match existing app theme system
    - _Requirements: 3.1, 3.3_

  - [x] 6.2 Implement calorie breakdown display

    - Create exercise-by-exercise calorie breakdown list
    - Display total calories with rounded whole numbers
    - Show calculation method indicator (complete profile vs defaults)
    - Add profile completion encouragement messaging when using defaults
    - Write component tests for calorie display formatting
    - _Requirements: 3.2, 3.4, 2.5_

- [x] 7. Integrate calorie calculation into workout completion flow

  - Modify workout completion logic to trigger calorie calculation

  - Pass workout data and user profile to calculation engine
  - Display WorkoutSummaryModal with calculation results
  - Handle cases where user profile is incomplete with appropriate messaging

  - _Requirements: 2.1, 2.2, 2.6_

- [x] 8. Enhance workout history with calorie data persistence

  - [x] 8.1 Update WorkoutRecord interface to include calorie data

    - Extend workout record structure to include calorie information
    - Add calculation method and profile snapshot to workout records
    - Update workout saving logic to persist calorie data
    - _Requirements: 5.1_

  - [x] 8.2 Update workout history display with calorie information

    - Modify workout history components to show calorie data
    - Display total calories burned per workout in history list
    - Ensure calorie data displays correctly for last 4 weeks of workouts
    - Maintain original calorie calculations from when workouts were completed
    - _Requirements: 5.2, 5.3, 5.5_

- [x] 9. Implement comprehensive error handling and validation

  - Add error boundaries for calorie calculation failures
  - Implement graceful degradation when profile data is missing
  - Add retry mechanisms for AsyncStorage operations
  - Create user-friendly error messages for validation failures
  - _Requirements: 2.5, 3.5_

- [ ] 10. Add unit tests for calorie calculation accuracy

  - Create test cases comparing results with known MET values
  - Test calculation accuracy against established fitness calculators
  - Verify personalization factors produce expected adjustments
  - Test edge cases with extreme user profile values

- Validate calculation performance with large workout datasets
- _Requirements: 4.1, 4.6_

- [ ] 11. Create integration tests for complete user flow

  - Test end-to-end flow from profile creation to calorie calculation
  - Verify Settings tab profile completion integrates with workout calculations
  - Test workout summary modal displays correct calorie information

  - Validate calorie data persistence in workout history
  - Test profile updates only affect future workout calculations
  - _Requirements: 5.4_

# Requirements Document

## Introduction

The Calorie Tracking System feature will provide users with personalized calorie burn estimates based on their workout activities. This system will calculate calories burned during workouts using scientifically-backed formulas that account for individual user characteristics including body weight, sex, age, and exercise intensity. Users will be able to input their personal information through the Settings tab and receive accurate calorie burn estimates upon workout completion.

## Requirements

### Requirement 1

**User Story:** As a fitness app user, I want to enter my personal information (weight, height, age, sex) in the Settings tab, so that I can receive personalized calorie burn calculations.

#### Acceptance Criteria

1. WHEN the user navigates to the Settings tab THEN the system SHALL display input fields for weight, height, age, and sex
2. WHEN the user enters their weight THEN the system SHALL accept values in both pounds and kilograms with unit selection
3. WHEN the user enters their height THEN the system SHALL accept values in both feet/inches and centimeters with unit selection
4. WHEN the user enters their age THEN the system SHALL accept numeric values between 13 and 120 years
5. WHEN the user selects their sex THEN the system SHALL provide options for Male, Female, and Other
6. WHEN the user saves their profile information THEN the system SHALL persist the data locally using AsyncStorage
7. WHEN the user returns to the Settings tab THEN the system SHALL display their previously saved information

### Requirement 2

**User Story:** As a fitness app user, I want the app to calculate calories burned during my workout based on exercise type and intensity, so that I can track my energy expenditure accurately.

#### Acceptance Criteria

1. WHEN the user completes a workout THEN the system SHALL calculate total calories burned using MET (Metabolic Equivalent of Task) values
2. WHEN calculating calories THEN the system SHALL use the formula: Calories = MET × weight(kg) × duration(hours)
3. WHEN the exercise type is strength training THEN the system SHALL apply MET values between 3.0-6.0 based on intensity
4. WHEN the exercise type is cardio THEN the system SHALL apply MET values between 4.0-12.0 based on intensity
5. WHEN the user's profile information is incomplete THEN the system SHALL use default values (70kg weight, age 30, male) with a notification
6. WHEN multiple exercises are performed in one workout THEN the system SHALL calculate calories for each exercise and sum the total

### Requirement 3

**User Story:** As a fitness app user, I want to see my estimated calorie burn immediately after completing a workout, so that I can understand the energy impact of my exercise session.

#### Acceptance Criteria

1. WHEN the user completes a workout THEN the system SHALL display a workout summary modal with calorie burn estimate
2. WHEN displaying calorie information THEN the system SHALL show total calories burned rounded to the nearest whole number
3. WHEN displaying the summary THEN the system SHALL include workout duration and primary exercise types
4. WHEN the user views the summary THEN the system SHALL provide an option to save or dismiss the information
5. WHEN the calorie calculation uses default values THEN the system SHALL display a message encouraging profile completion

### Requirement 4

**User Story:** As a fitness app user, I want the calorie calculations to be based on scientific research and account for different body types and exercise intensities, so that I can trust the accuracy of my fitness tracking.

#### Acceptance Criteria

1. WHEN calculating calories THEN the system SHALL use research-backed MET values from the Compendium of Physical Activities
2. WHEN the user is female THEN the system SHALL apply a 5-10% adjustment to account for metabolic differences
3. WHEN the exercise intensity is high THEN the system SHALL apply higher MET multipliers (1.2-1.5x base MET)
4. WHEN the exercise intensity is low THEN the system SHALL apply lower MET multipliers (0.8-0.9x base MET)
5. WHEN the user's BMI is calculated THEN the system SHALL use it to adjust calorie burn estimates by ±10%
6. WHEN exercises involve both strength and cardio components THEN the system SHALL use hybrid MET values

### Requirement 5

**User Story:** As a fitness app user, I want my calorie tracking data to integrate seamlessly with my existing workout history, so that I can view comprehensive fitness progress over time.

#### Acceptance Criteria

1. WHEN a workout is saved THEN the system SHALL include calorie burn data in the workout record
2. WHEN viewing workout history THEN the system SHALL display calorie information alongside exercise details
3. WHEN viewing the last 4 weeks of workouts THEN the system SHALL show total calories burned per workout
4. WHEN the user updates their profile information THEN the system SHALL recalculate calories for future workouts only
5. WHEN displaying historical data THEN the system SHALL maintain original calorie calculations from when workouts were completed

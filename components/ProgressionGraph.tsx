import React from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { MaxRecord } from '../types/workout';

interface ProgressionGraphProps {
  exerciseName: string;
  maxRecords: MaxRecord[];
  weightUnit: 'kg' | 'lbs';
}

export const ProgressionGraph: React.FC<ProgressionGraphProps> = ({
  exerciseName,
  maxRecords,
  weightUnit,
}) => {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const graphWidth = screenWidth - 80; // Account for padding
  const graphHeight = 200;
  
  // Create styles early so they're available for early returns
  const styles = createStyles(theme);

  if (maxRecords.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        <Text style={[styles.title, { color: theme.text }]}>
          {exerciseName} - Max Weight Progression
        </Text>
        <View style={styles.noDataContainer}>
          <Text style={[styles.noDataText, { color: theme.textSecondary }]}>
            No max workout data available for this exercise.
          </Text>
          <Text style={[styles.noDataSubtext, { color: theme.textSecondary }]}>
            Mark workouts as "Max" to track progression!
          </Text>
        </View>
      </View>
    );
  }

  // Sort records by date and filter out invalid records
  const sortedRecords = [...maxRecords]
    .filter(record => record && record.weight != null && record.date && !isNaN(record.weight))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Double-check after filtering
  if (sortedRecords.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        <Text style={[styles.title, { color: theme.text }]}>
          {exerciseName} - Max Weight Progression
        </Text>
        <View style={styles.noDataContainer}>
          <Text style={[styles.noDataText, { color: theme.textSecondary }]}>
            No valid max workout data available for this exercise.
          </Text>
          <Text style={[styles.noDataSubtext, { color: theme.textSecondary }]}>
            Mark workouts as "Max" to track progression!
          </Text>
        </View>
      </View>
    );
  }

  // Find min and max values for scaling
  const weights = sortedRecords.map(record => record.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const weightRange = maxWeight - minWeight || 1; // Avoid division by zero

  // Calculate positions for data points - closer to y-axis on left, proper padding on right
  const dataPoints = sortedRecords.map((record, index) => {
    // Handle single data point case
    const xPosition = sortedRecords.length === 1 
      ? graphWidth / 2 
      : (index / (sortedRecords.length - 1)) * (graphWidth - 80) + 20; // Reduced left padding: 80px total, 20px left offset, 60px right
    
    const y = graphHeight - 60 - ((record.weight - minWeight) / weightRange) * (graphHeight - 100);
    return { x: xPosition, y, record };
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        <Text style={[styles.title, { color: theme.text }]}>
          {exerciseName} - Max Weight Progression
        </Text>
        
        <View style={[styles.graphContainer, { width: Math.max(graphWidth, 300) }]}>
          {/* Y-axis labels */}
          <View style={styles.yAxisContainer}>
            <Text style={[styles.axisLabel, { color: theme.textSecondary }]}>
              {Math.round(maxWeight)}{weightUnit}
            </Text>
            <Text style={[styles.axisLabel, { color: theme.textSecondary }]}>
              {Math.round((maxWeight + minWeight) / 2)}{weightUnit}
            </Text>
            <Text style={[styles.axisLabel, { color: theme.textSecondary }]}>
              {Math.round(minWeight)}{weightUnit}
            </Text>
          </View>

          {/* Graph area */}
          <View style={[styles.graphArea, { height: graphHeight }]}>
            {/* Grid lines */}
            <View style={styles.gridContainer}>
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
                <View
                  key={index}
                  style={[
                    styles.gridLine,
                    {
                      top: ratio * (graphHeight - 100) + 20,
                      borderColor: theme.textSecondary + '20',
                    },
                  ]}
                />
              ))}
            </View>

            {/* Data line */}
            {dataPoints.length > 1 && (
              <View style={styles.lineContainer}>
                {dataPoints.slice(0, -1).map((point, index) => {
                  const nextPoint = dataPoints[index + 1];
                  const lineLength = Math.sqrt(
                    Math.pow(nextPoint.x - point.x, 2) + Math.pow(nextPoint.y - point.y, 2)
                  );
                  const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x);
                  
                  return (
                    <View
                      key={index}
                      style={[
                        styles.line,
                        {
                          left: point.x,
                          top: point.y,
                          width: lineLength,
                          backgroundColor: theme.primary,
                          transform: [{ rotate: `${angle}rad` }],
                        },
                      ]}
                    />
                  );
                })}
              </View>
            )}

            {/* Data points */}
            {dataPoints.map((point, index) => (
              <View key={index}>
                <View
                  style={[
                    styles.dataPoint,
                    {
                      left: point.x - 4,
                      top: point.y - 4,
                      backgroundColor: theme.primary,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.dataLabel,
                    {
                      left: point.x - 15,
                      top: point.y - 25,
                      color: theme.text,
                    },
                  ]}
                >
                  {point.record.weight}{weightUnit}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* X-axis with tick marks and labels - positioned below graph */}
        <View style={[styles.xAxisContainer, { width: Math.max(graphWidth, 300) }]}>
          {/* Tick marks */}
          {dataPoints.map((point, index) => (
            <View
              key={`tick-${index}`}
              style={[
                styles.tickMark,
                {
                  left: point.x + 50, // Offset by y-axis width
                  backgroundColor: theme.success,
                },
              ]}
            />
          ))}
          {/* Date labels */}
          {dataPoints.map((point, index) => (
            <Text
              key={`label-${index}`}
              style={[
                styles.xAxisLabel,
                {
                  left: point.x + 30, // Offset by y-axis width, centered under tick
                  color: theme.textSecondary,
                },
              ]}
            >
              {formatDate(point.record.date)}
            </Text>
          ))}
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Current Max
            </Text>
            <Text style={[styles.statValue, { color: theme.primary }]}>
              {sortedRecords.length > 0 ? sortedRecords[sortedRecords.length - 1].weight : 0}{weightUnit}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Starting Max
            </Text>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {sortedRecords.length > 0 ? sortedRecords[0].weight : 0}{weightUnit}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Improvement
            </Text>
            <Text style={[styles.statValue, { color: theme.success }]}>
              {sortedRecords.length > 1 
                ? `+${(sortedRecords[sortedRecords.length - 1].weight - sortedRecords[0].weight).toFixed(1)}${weightUnit}`
                : `0.0${weightUnit}`
              }
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      padding: 20,
      borderRadius: 15,
      margin: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 20,
    },
    noDataContainer: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    noDataText: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 10,
    },
    noDataSubtext: {
      fontSize: 14,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    graphContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    yAxisContainer: {
      width: 50,
      height: 200,
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      paddingRight: 10,
      paddingTop: 20,
      paddingBottom: 60,
    },
    axisLabel: {
      fontSize: 12,
      fontWeight: '600',
    },
    graphArea: {
      flex: 1,
      position: 'relative',
    },
    gridContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    gridLine: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 1,
      borderTopWidth: 1,
    },
    lineContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    line: {
      position: 'absolute',
      height: 2,
      transformOrigin: '0 50%',
    },
    dataPoint: {
      position: 'absolute',
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    dataLabel: {
      position: 'absolute',
      fontSize: 10,
      fontWeight: 'bold',
      width: 30,
      textAlign: 'center',
    },
    xAxisContainer: {
      position: 'relative',
      height: 40,
      marginTop: 10,
    },
    xAxisLabel: {
      position: 'absolute',
      fontSize: 10,
      width: 40,
      textAlign: 'center',
      top: 12, // Position labels below tick marks
    },
    tickMark: {
      position: 'absolute',
      width: 2,
      height: 8,
      top: 0,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 20,
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: theme.textSecondary + '20',
    },
    statItem: {
      alignItems: 'center',
    },
    statLabel: {
      fontSize: 12,
      marginBottom: 5,
    },
    statValue: {
      fontSize: 16,
      fontWeight: 'bold',
    },
  });
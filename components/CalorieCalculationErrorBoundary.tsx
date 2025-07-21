import React, { Component, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  maxRetries?: number;
  retryDelay?: number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
}

/**
 * Error boundary component specifically for calorie calculation failures
 * Provides graceful degradation when calorie calculations fail
 */
export class CalorieCalculationErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error("CalorieCalculationErrorBoundary caught an error:", error);
    console.error("Error info:", errorInfo);
    console.error("Component stack:", errorInfo.componentStack);

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  handleRetry = () => {
    const { maxRetries = 3, retryDelay = 1000 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      console.warn(
        "Maximum retry attempts reached for CalorieCalculationErrorBoundary"
      );
      return;
    }

    this.setState({
      isRetrying: true,
      retryCount: retryCount + 1,
    });

    // Add delay before retry to prevent rapid successive failures
    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRetrying: false,
      });
    }, retryDelay);
  };

  getErrorMessage = (
    error: Error | null
  ): { title: string; message: string; suggestion: string } => {
    if (!error) {
      return {
        title: "Calorie Calculation Error",
        message: "An unexpected error occurred during calorie calculation.",
        suggestion: "Please try again or check your profile settings.",
      };
    }

    const errorMessage = error.message.toLowerCase();

    if (
      errorMessage.includes("profile") ||
      errorMessage.includes("weight") ||
      errorMessage.includes("age")
    ) {
      return {
        title: "Profile Data Issue",
        message: "There seems to be an issue with your profile information.",
        suggestion:
          "Please check your profile settings and ensure all required fields are filled correctly.",
      };
    }

    if (errorMessage.includes("workout") || errorMessage.includes("exercise")) {
      return {
        title: "Workout Data Issue",
        message: "There was a problem processing your workout data.",
        suggestion:
          "Your workout has been saved. You can try calculating calories again later.",
      };
    }

    if (errorMessage.includes("storage") || errorMessage.includes("async")) {
      return {
        title: "Storage Error",
        message: "Unable to access stored data for calorie calculation.",
        suggestion: "Please check your device storage and try again.",
      };
    }

    if (
      errorMessage.includes("calculation") ||
      errorMessage.includes("overflow")
    ) {
      return {
        title: "Calculation Error",
        message: "The calorie calculation encountered a mathematical error.",
        suggestion:
          "This might be due to extreme values. Please verify your workout and profile data.",
      };
    }

    return {
      title: "Calorie Calculation Error",
      message: "Unable to calculate calories for this workout.",
      suggestion:
        "Your workout data has been saved. You can try again or check your profile settings.",
    };
  };

  render() {
    const { maxRetries = 3 } = this.props;
    const { hasError, error, retryCount, isRetrying } = this.state;

    if (hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { title, message, suggestion } = this.getErrorMessage(error);
      const canRetry = retryCount < maxRetries;

      // Default fallback UI
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>{title}</Text>
          <Text style={styles.errorMessage}>{message}</Text>
          <Text style={styles.errorSubtext}>{suggestion}</Text>

          {retryCount > 0 && (
            <Text style={styles.retryInfo}>
              Attempt {retryCount} of {maxRetries}
            </Text>
          )}

          {canRetry && (
            <Pressable
              style={[
                styles.retryButton,
                isRetrying && styles.retryButtonDisabled,
              ]}
              onPress={this.handleRetry}
              disabled={isRetrying}
            >
              <Text style={styles.retryButtonText}>
                {isRetrying ? "Retrying..." : "Try Again"}
              </Text>
            </Pressable>
          )}

          {!canRetry && (
            <View style={styles.maxRetriesContainer}>
              <Text style={styles.maxRetriesText}>
                Maximum retry attempts reached. Please restart the app or
                contact support if the problem persists.
              </Text>
            </View>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#fff3cd",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffeaa7",
    margin: 16,
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#856404",
    marginBottom: 8,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 14,
    color: "#856404",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 20,
  },
  errorSubtext: {
    fontSize: 12,
    color: "#6c757d",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  retryButtonDisabled: {
    backgroundColor: "#6c757d",
    opacity: 0.6,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  retryInfo: {
    fontSize: 12,
    color: "#6c757d",
    marginBottom: 12,
    fontStyle: "italic",
  },
  maxRetriesContainer: {
    backgroundColor: "#f8d7da",
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#f5c6cb",
    marginTop: 8,
  },
  maxRetriesText: {
    fontSize: 12,
    color: "#721c24",
    textAlign: "center",
    lineHeight: 16,
  },
});

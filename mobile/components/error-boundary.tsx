import { AlertTriangle, RefreshCcw } from '@tamagui/lucide-icons';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button, H2, Text, YStack } from 'tamagui';
import { FloatingElement, GlassCard, Sparkle } from './animations';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <YStack f={1} jc="center" ai="center" p="$4" bg="transparent">
          <GlassCard elevation={10} p="$6" maxWidth={400} ai="center" gap="$4">
            <FloatingElement>
              <AlertTriangle size={64} color="$primary" />
            </FloatingElement>

            <H2 textAlign="center" color="$color">
              The ritual failed
            </H2>

            <Text color="$gray11" textAlign="center">
              {this.state.error?.message ||
                'A glitch in the cosmic flow occurred'}
            </Text>

            <Button
              backgroundColor="$primary"
              size="$4"
              onPress={this.handleRetry}
            >
              <YStack ai="center" gap="$2">
                <RefreshCcw size={18} color="white" />
                <Text color="white" fontWeight="600">
                  Re-invoke
                </Text>
              </YStack>
            </Button>
          </GlassCard>
        </YStack>
      );
    }

    return this.props.children;
  }
}

export function ErrorCard({
  title = 'Anomaly Detected',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <GlassCard
      elevation={5}
      p="$6"
      backgroundColor="rgba(255, 45, 85, 0.05)"
      borderColor="$primary"
    >
      <YStack gap="$3" ai="center">
        <Sparkle size={24} color="$primary" />
        <AlertTriangle size={48} color="$primary" />
        <H2 textAlign="center" color="$color" fontSize="$6">
          {title}
        </H2>
        <Text color="$gray11" textAlign="center">
          {message}
        </Text>
        {onRetry && (
          <Button mt="$2" onPress={onRetry} backgroundColor="$primary">
            <Text color="white" fontWeight="600">
              Retry
            </Text>
          </Button>
        )}
      </YStack>
    </GlassCard>
  );
}

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { YStack, Text, Button, Card, H2 } from 'tamagui';
import { AlertTriangle, RefreshCcw } from '@tamagui/lucide-icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <YStack f={1} jc="center" ai="center" p="$4" bg="$background">
          <Card elevate bordered p="$6" maxWidth={400}>
            <YStack space="$4" ai="center">
              <AlertTriangle size={64} color="#EF4444" />
              
              <H2 textAlign="center" color="$color">
                Something went wrong
              </H2>
              
              <Text color="$gray10" textAlign="center">
                {this.state.error?.message || 'An unexpected error occurred'}
              </Text>
              
              <Button
                theme="purple"
                size="$4"
                icon={<RefreshCcw size={18} />}
                onPress={this.handleRetry}
              >
                Try Again
              </Button>
            </YStack>
          </Card>
        </YStack>
      );
    }

    return this.props.children;
  }
}

export function ErrorCard({ 
  title = 'Error', 
  message, 
  onRetry 
}: { 
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Card elevate bordered p="$6" bg="rgba(239, 68, 68, 0.05)">
      <YStack space="$3" ai="center">
        <AlertTriangle size={48} color="#EF4444" />
        <H2 textAlign="center" color="$color" fontSize="$6">
          {title}
        </H2>
        <Text color="$gray10" textAlign="center">
          {message}
        </Text>
        {onRetry && (
          <Button mt="$2" onPress={onRetry}>
            Retry
          </Button>
        )}
      </YStack>
    </Card>
  );
}

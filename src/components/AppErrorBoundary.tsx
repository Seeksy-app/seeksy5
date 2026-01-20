import { Component, ErrorInfo, ReactNode } from 'react';
import { attemptBootRecovery, isAuthError, shouldAttemptRecovery } from '@/utils/bootRecovery';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isRecovering: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, isRecovering: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Don't treat localStorage quota errors as fatal - they're recoverable
    if (error.message?.includes('QuotaExceeded') || error.message?.includes('exceeded the quota')) {
      console.warn('[AppErrorBoundary] LocalStorage quota exceeded - attempting cleanup');
      try {
        // Try to free space by clearing expendable items
        ['seeksy-poster-images-v1', 'seeksy_recents'].forEach(key => {
          localStorage.removeItem(key);
        });
      } catch (e) {
        // Ignore cleanup errors
      }
      // Return null to not set error state - let the app continue
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Skip logging for localStorage errors
    if (error.message?.includes('QuotaExceeded') || error.message?.includes('exceeded the quota')) {
      console.warn('[AppErrorBoundary] LocalStorage error (non-fatal):', error.message);
      return;
    }
    
    console.error('[AppErrorBoundary] React error caught:', error);
    console.error('[AppErrorBoundary] Component stack:', errorInfo.componentStack);
    
    // If it's an auth-related error, attempt auto-recovery
    if (isAuthError(error) && shouldAttemptRecovery()) {
      this.setState({ isRecovering: true });
      attemptBootRecovery();
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, isRecovering: false });
    window.location.reload();
  };

  handleClearAndRetry = async () => {
    this.setState({ isRecovering: true });
    await attemptBootRecovery();
  };

  render() {
    if (this.state.isRecovering) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Recovering session...</p>
        </div>
      );
    }

    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
            <p className="text-muted-foreground">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Try Again
              </button>
              <button
                onClick={this.handleClearAndRetry}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
              >
                Clear Cache & Retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

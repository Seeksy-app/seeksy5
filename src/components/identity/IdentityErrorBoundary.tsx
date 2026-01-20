import React, { Component, ReactNode } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class IdentityErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('[IdentityErrorBoundary] Caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[IdentityErrorBoundary] Error details:', {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="container max-w-6xl py-8">
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-destructive">
                    Identity Page Error
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Something went wrong while loading your identity data.
                  </p>
                  {this.state.error && (
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      {this.state.error.message}
                    </p>
                  )}
                </div>
                <div className="flex gap-3 justify-center">
                  <Button onClick={this.handleReset}>
                    <Shield className="h-4 w-4 mr-2" />
                    Reload Page
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/dashboard'}
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

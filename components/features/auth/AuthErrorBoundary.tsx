'use client';

/**
 * AuthErrorBoundary
 * Catches unexpected render errors in auth components.
 * Shows a friendly fallback rather than crashing the entire page.
 */
import { Component, type ReactNode } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('[AuthErrorBoundary]', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="auth-card text-center space-y-4">
          <Alert
            type="error"
            message="Something went wrong loading this page. Please refresh and try again."
          />
          <Button
            variant="secondary"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

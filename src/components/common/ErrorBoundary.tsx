import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from '@/components/common/ErrorState';

interface Props {
  children: ReactNode;
  /** changing this clears a caught error, e.g. on navigation */
  resetKey?: string;
}

interface State {
  error: Error | null;
}

/** Keeps a render failure in one route from taking the whole app down. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[gate] render error', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorState
          title="Something went wrong on this page"
          message={this.state.error.message}
          onRetry={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

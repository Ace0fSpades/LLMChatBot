import { Component, ReactNode, ErrorInfo } from 'react';

/**
 * Error boundary props
 */
interface Props {
  children: ReactNode;
}

/**
 * Error boundary state
 */
interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary component for catching React errors
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * Update state when error occurs
   */
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  /**
   * Log error information
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  /**
   * Render error UI or children
   */
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Что-то пошло не так</h2>
          <p>{this.state.error?.message || 'Произошла ошибка'}</p>
          <button onClick={() => window.location.reload()}>
            Перезагрузить страницу
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}


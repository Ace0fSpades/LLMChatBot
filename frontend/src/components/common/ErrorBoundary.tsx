import { Component, ReactNode, ErrorInfo } from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import styles from './ErrorBoundary.module.scss';

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
class ErrorBoundaryBase extends Component<Props & WithTranslation, State> {
  constructor(props: Props & WithTranslation) {
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
      const { t } = this.props;
      return (
        <div className={styles['error-boundary']}>
          <h2>{t('errors.somethingWentWrong')}</h2>
          <p>{this.state.error?.message || t('errors.somethingWentWrong')}</p>
          <button onClick={() => window.location.reload()}>
            {t('errors.reloadPage')}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ErrorBoundary = withTranslation()(ErrorBoundaryBase);


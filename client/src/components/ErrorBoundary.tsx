import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('ErrorBoundary caught error:', error);

    // Only catch truly critical errors that prevent the app from working
    const criticalErrorMessages = [
      'ChunkLoadError',
      'Loading chunk',
      'Failed to fetch dynamically imported module',
      'Network Error'
    ];

    const isCritical = criticalErrorMessages.some(msg => 
      error.message && error.message.includes(msg)
    );

    // For language/translation errors, try to recover
    if (error.message && (
      error.message.includes('currentLanguage') ||
      error.message.includes('useLanguage') ||
      error.message.includes('translation')
    )) {
      console.warn('Language context error - attempting recovery');
      return { hasError: false };
    }

    return { hasError: isCritical, error: isCritical ? error : undefined };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);

    // For language-related errors, don't show error boundary
    if (error.message && (
      error.message.includes('currentLanguage') ||
      error.message.includes('useLanguage') ||
      error.message.includes('translation')
    )) {
      this.setState({ hasError: false });
      return;
    }

    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">WORLD BANK</h1>
            <p className="text-gray-600 mb-4">Reloading your banking session...</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Refresh Application
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left text-sm text-red-600 mt-4 p-4 bg-red-50 rounded">
                <summary className="cursor-pointer font-medium">Developer Info</summary>
                <pre className="mt-2 whitespace-pre-wrap">{this.state.error.toString()}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
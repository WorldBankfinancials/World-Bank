
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
    // Only catch actual critical errors that prevent the app from working
    const nonCriticalErrors = [
      'ChunkLoadError',
      'Loading chunk',
      'Failed to fetch dynamically imported module',
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'Script error',
      'Network request failed'
    ];

    const isCritical = !nonCriticalErrors.some(pattern => 
      error.message.includes(pattern) || error.name.includes(pattern)
    );

    if (!isCritical) {
      console.warn('Non-critical error ignored by boundary:', error.message);
      return { hasError: false };
    }

    console.error('Critical error caught by boundary:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const nonCriticalErrors = [
      'ChunkLoadError',
      'Loading chunk', 
      'Failed to fetch dynamically imported module',
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'Script error',
      'Network request failed'
    ];

    const isCritical = !nonCriticalErrors.some(pattern => 
      error.message.includes(pattern) || error.name.includes(pattern)
    );

    if (!isCritical) {
      console.warn('Non-critical error, continuing normal operation');
      this.setState({ hasError: false });
      return;
    }

    console.error('Critical error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8 max-w-md">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Critical Application Error</h1>
            <p className="text-gray-600 mb-4">A critical error occurred that prevents the application from running.</p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left text-sm text-red-600 mb-4 p-4 bg-red-50 rounded">
                <summary className="cursor-pointer font-medium">Error Details</summary>
                <pre className="mt-2 whitespace-pre-wrap">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <div className="space-y-2">
              <button 
                onClick={() => {
                  this.setState({ hasError: false, error: undefined, errorInfo: undefined });
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-2"
              >
                Try Again
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

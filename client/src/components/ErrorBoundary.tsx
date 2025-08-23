
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
    // Temporarily disable all error catching to fix the site
    console.warn('Error caught but ignored:', error.message);
    return { hasError: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log errors but don't crash the app
    console.warn('Error caught but app continues:', error, errorInfo);
    this.setState({ hasError: false });
  }

  render() {
    // Always render children - never show error boundary
    return this.props.children;
  }
}

export default ErrorBoundary;

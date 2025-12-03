import { Component, ReactNode } from 'react';
import { Warning } from '@phosphor-icons/react';
import { logCriticalError } from '../utils/errorLogger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Log the error to backend
    logCriticalError(
      error.message || 'Application error',
      errorInfo.componentStack?.split('\n')[1]?.trim() || 'Unknown component',
      {
        error_name: error.name,
        component_stack: errorInfo.componentStack,
        error_boundary: true,
      }
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full card p-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-xl mb-6">
                <Warning size={40} weight="bold" className="text-red-400" />
              </div>
              <h1 className="text-3xl font-semibold text-white mb-4">
                Something went wrong
              </h1>
              <p className="text-lg text-gray-400 mb-8">
                Your data is safe. Try refreshing the page or contact support if the problem persists.
              </p>

              {this.state.error && (
                <details className="text-left mb-8 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <summary className="cursor-pointer text-gray-400 font-mono text-sm mb-2">
                    Error Details
                  </summary>
                  <pre className="text-xs text-red-300 overflow-auto">
                    {this.state.error.toString()}
                    {'\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="btn-primary px-6 py-3"
                >
                  Refresh Page
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="btn-secondary px-6 py-3"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

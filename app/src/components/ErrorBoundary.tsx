import { Component, type ReactNode } from 'react';

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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen w-screen bg-[#F2F2F2] dark:bg-[#1a1a1a] p-6">
          <h1 className="text-xl font-semibold text-[#DC2626] mb-2">Something went wrong</h1>
          <p className="text-sm text-[#6B6B6B] dark:text-[#999] mb-4 text-center max-w-md">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="px-4 py-2 bg-[#E06B4D] text-white rounded-lg text-sm"
          >
            Reset App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

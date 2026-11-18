import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
        <div className="card max-w-md p-8 text-center">
          <h1 className="text-lg font-semibold text-ink-primary">Something went wrong</h1>
          <p className="mt-2 text-sm text-ink-secondary">The page hit an unexpected error. Reloading usually fixes it.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 inline-flex h-10 items-center rounded-lg bg-brand-primary px-4 text-sm font-semibold text-on-brand hover:bg-brand-hover"
          >
            Reload CampusWatt
          </button>
        </div>
      </div>
    );
  }
}

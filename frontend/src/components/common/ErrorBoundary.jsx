import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled Application Error:', error, errorInfo);
  }

  handleReload = () => {
    sessionStorage.removeItem('veggie_chunk_reload_attempts');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#04120e] text-white p-6">
          <div className="max-w-md w-full glass-card p-8 rounded-2xl border border-emerald-500/30 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 text-2xl font-bold">
              ⚡
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">New Update Available</h2>
              <p className="text-emerald-200/70 text-sm">
                A new version of Veggie Affiliate Network has been deployed. Please reload to access the latest features.
              </p>
            </div>
            <button
              onClick={this.handleReload}
              className="btn-primary w-full py-3 px-6 rounded-xl font-bold text-white shadow-lg bg-gradient-to-r from-emerald-600 to-lime-600 hover:from-emerald-500 hover:to-lime-500 transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

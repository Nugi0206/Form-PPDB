import React from 'react';
import { parseReadableFirestoreError } from '../lib/utils';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: parseReadableFirestoreError(error),
    };
  }

  componentDidCatch(error: Error): void {
    console.error('Terjadi kesalahan antarmuka:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-xl p-8 text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Terjadi Gangguan Sistem
            </h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              {this.state.message ||
                'Mohon maaf, sistem mengalami kendala saat memproses permintaan Anda.'}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors"
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

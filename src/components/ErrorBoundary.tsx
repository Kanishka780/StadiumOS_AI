import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error inside boundary:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none font-sans">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
            <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertOctagon className="w-6 h-6" />
            </div>
            
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">System Fault Encountered</h2>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              StadiumOS AI encountered an unexpected runtime exception. All critical operations logs and credentials remain secure.
            </p>

            {this.state.error && (
              <pre className="mt-4 p-3 bg-slate-950 border border-slate-850 rounded-lg text-[10px] text-rose-400 font-mono overflow-x-auto text-left max-h-[120px] leading-relaxed">
                {this.state.error.name}: {this.state.error.message}
              </pre>
            )}

            <button
              onClick={this.handleReload}
              className="mt-6 w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;

"use client";

import { Component, ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-[rgb(var(--bg))] flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={28} className="text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-[rgb(var(--fg))] mb-2">Something went wrong</h1>
            <p className="text-sm text-[rgb(var(--muted))] mb-6 leading-relaxed">
              An unexpected error occurred. This has been logged automatically.
              {this.state.error?.message && (
                <span className="block mt-2 text-xs font-mono text-red-400/70">
                  {this.state.error.message.slice(0, 100)}
                </span>
              )}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
              >
                <RefreshCw size={14} /> Try again
              </button>
              <Link href="/dashboard"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[rgb(var(--border))] text-[rgb(var(--fg))] text-sm font-medium hover:bg-[rgb(var(--card))] transition-colors">
                <Home size={14} /> Go home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Simple inline error display for API failures
export function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
      <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-red-400">{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] mt-1.5 flex items-center gap-1 transition-colors">
            <RefreshCw size={11} /> Try again
          </button>
        )}
      </div>
    </div>
  );
}

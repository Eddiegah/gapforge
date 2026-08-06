"use client";

import { Component, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("[ErrorBoundary]", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg))] px-4">
          <div className="card p-8 max-w-md w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto">
              <AlertCircle size={24} className="text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-[rgb(var(--fg))]">Something went wrong</h2>
            <p className="text-sm text-[rgb(var(--muted))]">
              {this.state.error?.message ?? "An unexpected error occurred."}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="btn-primary flex items-center gap-2 mx-auto"
            >
              <RefreshCw size={14} /> Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

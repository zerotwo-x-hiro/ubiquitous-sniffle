import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";

type Props = { children: ReactNode; fallbackLabel?: string };
type State = { hasError: boolean; message?: string };

/**
 * Root and per-route error boundary. If a component throws during render we
 * show a retry card instead of blanking the whole site.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", this.props.fallbackLabel ?? "App", error, info.componentStack);
  }

  retry = () => this.setState({ hasError: false, message: undefined });

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] grid place-items-center px-4">
          <div className="glass-strong rounded-2xl p-8 max-w-md text-center">
            <div className="text-5xl mb-3">🌸</div>
            <h2 className="section-title text-2xl mb-2">Something went wrong</h2>
            <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
              {this.props.fallbackLabel ?? "This section"} didn't render. You can retry, or head back home.
            </p>
            <div className="flex gap-2 justify-center">
              <button onClick={this.retry} className="btn-primary h-10 px-5 rounded-xl font-semibold">
                Retry
              </button>
              <a href="/" className="btn-ghost h-10 px-5 rounded-xl inline-flex items-center font-semibold">
                Home
              </a>
            </div>
            {this.state.message && (
              <pre className="mt-4 text-[10px] whitespace-pre-wrap break-words" style={{ color: "var(--text-dim)" }}>
                {this.state.message}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

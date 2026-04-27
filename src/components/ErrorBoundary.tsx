import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Avoid logging sensitive payloads — only message + component stack
    console.error("[ErrorBoundary]", error.message, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <h1 className="font-display text-2xl font-light mb-2">Something went wrong</h1>
          <p className="text-sm text-muted-foreground mb-2">
            An unexpected error occurred. Please try again.
          </p>
          {this.state.error?.message && (
            <p className="text-xs text-muted-foreground/70 font-mono mb-6 line-clamp-3">
              {this.state.error.message}
            </p>
          )}
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={this.reset} className="rounded-full">
              <RefreshCw className="w-4 h-4 mr-1.5" /> Try again
            </Button>
            <Button onClick={() => (window.location.href = "/")} className="rounded-full">
              <Home className="w-4 h-4 mr-1.5" /> Go home
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;

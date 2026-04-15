import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "linear-gradient(135deg, hsl(250,80%,15%) 0%, hsl(230,25%,7%) 50%, hsl(200,80%,10%) 100%)" }}>
          <div className="glass-card p-8 max-w-md text-center">
            <h2 className="text-xl font-bold text-destructive mb-4">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = "/"; }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

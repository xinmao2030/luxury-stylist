"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="max-w-md mx-auto mt-20 card-luxury p-8 text-center">
          <p className="text-xl font-semibold text-[var(--noir)] mb-2">
            页面遇到了问题
          </p>
          <p className="text-sm text-gray-500 mb-6">
            请尝试刷新页面，如果问题持续请联系支持团队。
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-gold text-sm !py-2 !px-6"
          >
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

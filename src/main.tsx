import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Last-resort crash guard: without this, one throw anywhere (a corrupt
 * localStorage payload, a bad Mermaid diagram, a parser edge case) blanks
 * the whole page and all unsaved work is lost with no recovery path.
 * The fallback offers to download the current draft from localStorage
 * before reloading, so a crash never silently destroys a document.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('OmniMark crashed:', error, info.componentStack);
  }

  private handleDownloadDraft = (): void => {
    try {
      const raw = localStorage.getItem('omnimark_documents_v1') ?? '[]';
      const docs = JSON.parse(raw) as { id?: string; title?: string; content?: string }[];
      const activeId = localStorage.getItem('omnimark_active_doc_id');
      const doc = docs.find((d) => d.id === activeId) ?? docs[0];
      const content = doc?.content ?? '';
      const title = (doc?.title ?? 'omnimark-draft').replace(/[^\w\s-]/gi, '_');
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'omnimark-draft'}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // If even the draft rescue fails, reloading is still the best option.
    }
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-neutral-950 p-6 text-neutral-100">
        <div className="max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-center">
          <h1 className="text-lg font-bold">Something went wrong</h1>
          <p className="mt-2 text-sm text-neutral-400">
            OmniMark hit an unexpected error. Your documents are stored locally —
            download a backup copy of the current draft before reloading.
          </p>
          {this.state.error && (
            <pre className="mt-4 max-h-32 overflow-auto rounded-lg bg-neutral-950 p-3 text-left text-xs text-rose-300">
              {this.state.error.message}
            </pre>
          )}
          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              onClick={this.handleDownloadDraft}
              className="rounded-xl bg-neutral-800 px-4 py-2 text-sm font-semibold hover:bg-neutral-700"
            >
              Download draft backup
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500"
            >
              Reload app
            </button>
          </div>
        </div>
      </div>
    );
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

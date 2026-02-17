'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-4">
          <motion.div
            className="bg-surface border border-border rounded-lg p-8 max-w-md w-full text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              className="w-16 h-16 mx-auto mb-6 text-red-500"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <AlertTriangle className="w-full h-full" />
            </motion.div>

            <h2 className="font-pixel text-lg text-text mb-4">
              Something Went Wrong
            </h2>
            
            <p className="text-text2 mb-6 leading-relaxed">
              The fight encountered an unexpected error. Don&apos;t worry, this doesn&apos;t affect your fighters or credits.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-xs text-text2 cursor-pointer mb-2">
                  Error Details (Development)
                </summary>
                <pre className="text-xs bg-surface2 p-3 rounded border overflow-auto max-h-32">
                  {this.state.error.message}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <motion.button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 w-full py-3 bg-accent text-white font-pixel text-sm tracking-wider hover:bg-accent/90 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RefreshCw className="w-4 h-4" />
              RESTART APPLICATION
            </motion.button>

            <motion.button
              onClick={() => this.setState({ hasError: false })}
              className="mt-3 text-text2 text-sm hover:text-text1 transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              Try Again Without Restart
            </motion.button>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}

// Functional component wrapper for easier usage
export default function ErrorBoundaryWrapper({ children, fallback }: Props) {
  return (
    <ErrorBoundary fallback={fallback}>
      {children}
    </ErrorBoundary>
  )
}
/**
 * Error Logger Utility
 * Centralized error logging to backend
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const APP_VERSION = '1.0.0'; // Can be pulled from package.json or env
const ENVIRONMENT = import.meta.env.MODE || 'production';

interface ErrorLogData {
  error_type: 'frontend' | 'backend' | 'api';
  severity?: 'error' | 'warning' | 'critical';
  message: string;
  stack_trace?: string;
  component?: string;
  user_action?: string;
  metadata?: Record<string, any>;
  url?: string;
  method?: string;
  status_code?: number;
}

/**
 * Log an error to the backend
 */
export async function logError(data: ErrorLogData): Promise<void> {
  try {
    // Don't log errors in development if explicitly disabled
    if (ENVIRONMENT === 'development' && import.meta.env.VITE_DISABLE_ERROR_LOGGING === 'true') {
      console.warn('[Error Logger] Skipping error log in development:', data);
      return;
    }

    // Get additional context
    const metadata = {
      ...data.metadata,
      browser: getBrowserInfo(),
      screen: getScreenInfo(),
      timestamp: new Date().toISOString(),
    };

    // Get auth token if available
    const token = localStorage.getItem('authToken');

    // Send to backend
    await fetch(`${API_URL}/api/errors/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        ...data,
        metadata,
        environment: ENVIRONMENT,
        app_version: APP_VERSION,
        url: data.url || window.location.href,
        session_id: getSessionId(),
      }),
    });

    // Log to console in development
    if (ENVIRONMENT === 'development') {
      console.error('[Error Logger]', data);
    }
  } catch (error) {
    // Fail silently to avoid infinite error loops
    console.error('[Error Logger] Failed to log error:', error);
  }
}

/**
 * Log a JavaScript error with stack trace
 */
export function logJavaScriptError(
  error: Error,
  component?: string,
  userAction?: string
): void {
  logError({
    error_type: 'frontend',
    severity: 'error',
    message: error.message || 'Unknown error',
    stack_trace: error.stack,
    component,
    user_action: userAction,
    metadata: {
      error_name: error.name,
    },
  });
}

/**
 * Log an API error
 */
export function logApiError(
  error: any,
  url: string,
  method: string = 'GET',
  userAction?: string
): void {
  const statusCode = error.response?.status;
  const message = error.response?.data?.error || error.response?.data?.message || error.message || 'API Error';

  logError({
    error_type: 'api',
    severity: statusCode >= 500 ? 'critical' : 'error',
    message,
    url,
    method,
    status_code: statusCode,
    user_action: userAction,
    metadata: {
      response_data: error.response?.data,
      request_data: error.config?.data,
    },
  });
}

/**
 * Log a critical error (e.g., app crash, payment failure)
 */
export function logCriticalError(
  message: string,
  component?: string,
  metadata?: Record<string, any>
): void {
  logError({
    error_type: 'frontend',
    severity: 'critical',
    message,
    component,
    metadata,
  });
}

/**
 * Log a warning (non-breaking issues)
 */
export function logWarning(
  message: string,
  component?: string,
  metadata?: Record<string, any>
): void {
  logError({
    error_type: 'frontend',
    severity: 'warning',
    message,
    component,
    metadata,
  });
}

/**
 * Get browser information
 */
function getBrowserInfo() {
  return {
    user_agent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    online: navigator.onLine,
  };
}

/**
 * Get screen information
 */
function getScreenInfo() {
  return {
    width: window.screen.width,
    height: window.screen.height,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    pixel_ratio: window.devicePixelRatio,
  };
}

/**
 * Get or create a session ID
 */
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('session_id');

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem('session_id', sessionId);
  }

  return sessionId;
}

/**
 * Setup global error handlers
 */
export function setupGlobalErrorHandlers(): void {
  // Handle unhandled errors
  window.addEventListener('error', (event) => {
    logJavaScriptError(
      event.error || new Error(event.message),
      'Global',
      'Unhandled error'
    );
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logError({
      error_type: 'frontend',
      severity: 'error',
      message: event.reason?.message || 'Unhandled promise rejection',
      stack_trace: event.reason?.stack,
      component: 'Global',
      user_action: 'Unhandled promise rejection',
    });
  });

  console.log('[Error Logger] Global error handlers initialized');
}

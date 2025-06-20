/**
 * Browser-safe logger implementation
 * 
 * Provides console logging functionality that works in browser environments
 * where winston is not available.
 */

interface Logger {
  info: (message: string, meta?: unknown) => void;
  error: (message: string, meta?: unknown) => void;
  warn: (message: string, meta?: unknown) => void;
  debug: (message: string, meta?: unknown) => void;
}

const createBrowserLogger = (): Logger => ({
  info: (message: string, meta?: unknown) => {
    console.log(`[INFO] ${message}`, meta || '');
  },
  error: (message: string, meta?: unknown) => {
    console.error(`[ERROR] ${message}`, meta || '');
  },
  warn: (message: string, meta?: unknown) => {
    console.warn(`[WARN] ${message}`, meta || '');
  },
  debug: (message: string, meta?: unknown) => {
    console.debug(`[DEBUG] ${message}`, meta || '');
  }
});

export const logger = createBrowserLogger();
export default logger; 
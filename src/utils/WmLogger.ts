/**
 * Log level types supported by WmLogger.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Callback function type for custom logging implementations.
 */
export type LogCallback = (level: LogLevel, message: string, data?: any) => void;

/**
 * Optional logging utility for WebMoney operations.
 * By default, logging is disabled. Users can enable logging by setting a custom callback.
 */
export class WmLogger {
    private static callback?: LogCallback;

    /**
     * Sets a custom logging callback to enable logging.
     * @param callback - Function to handle log messages
     * @example
     * ```typescript
     * WmLogger.setLogger((level, message, data) => {
     *   console.log(`[${level.toUpperCase()}] ${message}`, data);
     * });
     * ```
     */
    static setLogger(callback: LogCallback): void {
        this.callback = callback;
    }

    /**
     * Clears the logging callback, disabling logging.
     */
    static clearLogger(): void {
        this.callback = undefined;
    }

    /**
     * Logs a debug message.
     * @param message - The message to log
     * @param data - Optional additional data
     */
    static debug(message: string, data?: any): void {
        this.callback?.('debug', message, data);
    }

    /**
     * Logs an info message.
     * @param message - The message to log
     * @param data - Optional additional data
     */
    static info(message: string, data?: any): void {
        this.callback?.('info', message, data);
    }

    /**
     * Logs a warning message.
     * @param message - The message to log
     * @param data - Optional additional data
     */
    static warn(message: string, data?: any): void {
        this.callback?.('warn', message, data);
    }

    /**
     * Logs an error message.
     * @param message - The message to log
     * @param data - Optional additional data
     */
    static error(message: string, data?: any): void {
        this.callback?.('error', message, data);
    }
}

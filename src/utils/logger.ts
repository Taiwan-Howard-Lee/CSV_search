/**
 * Simple logging utility for SBC Gina Search Engine
 */

import * as fs from 'fs';
import * as path from 'path';

// Log levels
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

// Logger configuration
export interface LoggerConfig {
  level: LogLevel;
  saveToFile: boolean;
  logDirectory: string;
  logFileName?: string;
}

// Default configuration
const DEFAULT_CONFIG: LoggerConfig = {
  level: LogLevel.INFO,
  saveToFile: true,
  logDirectory: 'logs',
  logFileName: 'app.log'
};

/**
 * Logger class for SBC Gina Search Engine
 */
export class Logger {
  private config: LoggerConfig;
  private logFilePath: string;

  /**
   * Create a new logger instance
   * @param config Logger configuration
   */
  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Set up log file path
    if (this.config.saveToFile) {
      const logFileName = this.config.logFileName || `app-${new Date().toISOString().slice(0, 10)}.log`;
      this.logFilePath = path.join(this.config.logDirectory, logFileName);
      
      // Create log directory if it doesn't exist
      if (!fs.existsSync(this.config.logDirectory)) {
        fs.mkdirSync(this.config.logDirectory, { recursive: true });
      }
    }
  }

  /**
   * Log an error message
   * @param message Message to log
   * @param error Optional error object
   */
  error(message: string, error?: Error): void {
    if (this.config.level >= LogLevel.ERROR) {
      this.log('ERROR', message, error);
    }
  }

  /**
   * Log a warning message
   * @param message Message to log
   */
  warn(message: string): void {
    if (this.config.level >= LogLevel.WARN) {
      this.log('WARN', message);
    }
  }

  /**
   * Log an info message
   * @param message Message to log
   */
  info(message: string): void {
    if (this.config.level >= LogLevel.INFO) {
      this.log('INFO', message);
    }
  }

  /**
   * Log a debug message
   * @param message Message to log
   */
  debug(message: string): void {
    if (this.config.level >= LogLevel.DEBUG) {
      this.log('DEBUG', message);
    }
  }

  /**
   * Log a message with the specified level
   * @param level Log level
   * @param message Message to log
   * @param error Optional error object
   */
  private log(level: string, message: string, error?: Error): void {
    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] [${level}] ${message}`;
    
    if (error) {
      logMessage += `\n${error.stack || error.message}`;
    }
    
    // Log to console
    switch (level) {
      case 'ERROR':
        console.error(logMessage);
        break;
      case 'WARN':
        console.warn(logMessage);
        break;
      case 'INFO':
        console.info(logMessage);
        break;
      case 'DEBUG':
        console.debug(logMessage);
        break;
      default:
        console.log(logMessage);
    }
    
    // Log to file
    if (this.config.saveToFile) {
      fs.appendFileSync(this.logFilePath, logMessage + '\n');
    }
  }
}

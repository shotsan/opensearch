const debugConfig = require('../debug-config');

class Logger {
  constructor() {
    this.logLevels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4
    };
    
    this.currentLevel = this.logLevels[debugConfig.logLevel] || this.logLevels.info;
  }

  shouldLog(level) {
    return this.logLevels[level] <= this.currentLevel;
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      environment: process.env.NODE_ENV || 'development',
      service: 'opensearch-backend'
    };

    if (data) {
      logEntry.data = data;
    }

    if (debugConfig.isProduction) {
      return JSON.stringify(logEntry);
    } else {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}${data ? ' | ' + JSON.stringify(data, null, 2) : ''}`;
    }
  }

  error(message, data = null, error = null) {
    if (!this.shouldLog('error')) return;
    
    const logData = { ...data };
    if (error) {
      logData.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      };
    }
    
    console.error(this.formatMessage('error', message, logData));
    
    // Report to error tracking service if enabled
    if (debugConfig.errorReporting.enabled) {
      this.reportError(message, logData, error);
    }
  }

  warn(message, data = null) {
    if (!this.shouldLog('warn')) return;
    console.warn(this.formatMessage('warn', message, data));
  }

  info(message, data = null) {
    if (!this.shouldLog('info')) return;
    console.log(this.formatMessage('info', message, data));
  }

  debug(message, data = null) {
    if (!this.shouldLog('debug')) return;
    console.log(this.formatMessage('debug', message, data));
  }

  trace(message, data = null) {
    if (!this.shouldLog('trace')) return;
    console.log(this.formatMessage('trace', message, data));
  }

  // Request/Response logging
  logRequest(req, res, next) {
    if (!debugConfig.enableRequestLogging) {
      return next();
    }

    const startTime = Date.now();
    const requestId = this.generateRequestId();

    req.requestId = requestId;
    req.startTime = startTime;

    this.info('Incoming request', {
      requestId,
      method: req.method,
      url: req.url,
      headers: this.sanitizeHeaders(req.headers),
      body: req.method !== 'GET' ? this.sanitizeBody(req.body) : undefined,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Log response
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const logData = {
        requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        contentLength: res.get('Content-Length')
      };

      if (debugConfig.enableResponseLogging) {
        this.info('Response sent', logData);
      }

      // Log slow requests
      if (duration > debugConfig.performance.slowQueryThreshold) {
        this.warn('Slow request detected', logData);
      }
    });

    next();
  }

  // Performance monitoring
  logPerformance(operation, duration, data = {}) {
    if (!debugConfig.performance.enabled) return;

    const logData = {
      operation,
      duration: `${duration}ms`,
      ...data
    };

    if (duration > debugConfig.performance.slowQueryThreshold) {
      this.warn('Slow operation detected', logData);
    } else {
      this.debug('Operation completed', logData);
    }
  }

  // Error tracking
  reportError(message, data, error) {
    // In production, this would send to Sentry, LogRocket, etc.
    if (debugConfig.errorReporting.service === 'console') {
      this.error(`[ERROR REPORTING] ${message}`, data, error);
    }
    // Add other error reporting services here
  }

  // Utility methods
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  sanitizeBody(body) {
    if (!body) return body;
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  // Memory monitoring
  logMemoryUsage() {
    if (!debugConfig.performance.enabled) return;

    const usage = process.memoryUsage();
    const memoryUsagePercent = (usage.heapUsed / usage.heapTotal) * 100;

    this.debug('Memory usage', {
      rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(usage.external / 1024 / 1024)}MB`,
      percentage: `${Math.round(memoryUsagePercent)}%`
    });

    if (memoryUsagePercent > debugConfig.performance.memoryThreshold) {
      this.warn('High memory usage detected', { percentage: memoryUsagePercent });
    }
  }
}

module.exports = new Logger(); 
const logger = require('./logger');
const debugConfig = require('../debug-config');

class ErrorHandler {
  constructor() {
    this.errorCounts = new Map();
    this.circuitBreakers = new Map();
    this.retryStrategies = new Map();
  }

  // Retry logic with exponential backoff
  async withRetry(operation, options = {}) {
    const {
      maxRetries = debugConfig.maxRetries,
      retryDelay = debugConfig.retryDelay,
      operationName = 'unknown',
      shouldRetry = this.defaultShouldRetry
    } = options;

    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        const result = await operation();
        const duration = Date.now() - startTime;
        
        logger.logPerformance(operationName, duration, { attempt: attempt + 1 });
        
        if (attempt > 0) {
          logger.info(`Operation succeeded after ${attempt + 1} attempts`, { operationName });
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        logger.warn(`Operation failed (attempt ${attempt + 1}/${maxRetries + 1})`, {
          operationName,
          error: error.message,
          code: error.code
        });

        if (attempt === maxRetries || !shouldRetry(error)) {
          break;
        }

        const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
        logger.debug(`Retrying in ${delay}ms`, { operationName, attempt: attempt + 1 });
        
        await this.sleep(delay);
      }
    }

    logger.error(`Operation failed after ${maxRetries + 1} attempts`, {
      operationName,
      error: lastError.message,
      code: lastError.code
    }, lastError);

    throw lastError;
  }

  // Circuit breaker pattern
  async withCircuitBreaker(operation, options = {}) {
    const {
      operationName = 'unknown',
      failureThreshold = 5,
      recoveryTimeout = 60000, // 1 minute
      timeout = 30000
    } = options;

    const circuitKey = operationName;
    let circuit = this.circuitBreakers.get(circuitKey);

    if (!circuit) {
      circuit = {
        state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
        failureCount: 0,
        lastFailureTime: null,
        successCount: 0
      };
      this.circuitBreakers.set(circuitKey, circuit);
    }

    // Check if circuit is open
    if (circuit.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - circuit.lastFailureTime;
      if (timeSinceLastFailure < recoveryTimeout) {
        throw new Error(`Circuit breaker is OPEN for ${operationName}. Try again later.`);
      }
      circuit.state = 'HALF_OPEN';
      logger.info(`Circuit breaker moved to HALF_OPEN for ${operationName}`);
    }

    try {
      const result = await Promise.race([
        operation(),
        this.timeout(timeout, `Operation ${operationName} timed out`)
      ]);

      // Success - reset circuit
      circuit.failureCount = 0;
      circuit.successCount++;
      circuit.state = 'CLOSED';
      
      logger.debug(`Circuit breaker reset for ${operationName}`, {
        successCount: circuit.successCount
      });

      return result;
    } catch (error) {
      // Failure - update circuit
      circuit.failureCount++;
      circuit.lastFailureTime = Date.now();
      
      logger.warn(`Circuit breaker failure for ${operationName}`, {
        failureCount: circuit.failureCount,
        threshold: failureThreshold
      });

      if (circuit.failureCount >= failureThreshold) {
        circuit.state = 'OPEN';
        logger.error(`Circuit breaker opened for ${operationName}`, {
          failureCount: circuit.failureCount,
          threshold: failureThreshold
        });
      }

      throw error;
    }
  }

  // Graceful degradation
  async withFallback(primaryOperation, fallbackOperation, options = {}) {
    const {
      operationName = 'unknown',
      enableRetry = true,
      retryOptions = {}
    } = options;

    try {
      if (enableRetry) {
        return await this.withRetry(primaryOperation, {
          operationName: `${operationName}_primary`,
          ...retryOptions
        });
      } else {
        return await primaryOperation();
      }
    } catch (error) {
      logger.warn(`Primary operation failed, trying fallback`, {
        operationName,
        error: error.message
      });

      try {
        if (enableRetry) {
          return await this.withRetry(fallbackOperation, {
            operationName: `${operationName}_fallback`,
            ...retryOptions
          });
        } else {
          return await fallbackOperation();
        }
      } catch (fallbackError) {
        logger.error(`Both primary and fallback operations failed`, {
          operationName,
          primaryError: error.message,
          fallbackError: fallbackError.message
        }, fallbackError);
        
        throw fallbackError;
      }
    }
  }

  // Request timeout
  timeout(ms, message = 'Operation timed out') {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  }

  // Sleep utility
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Default retry condition
  defaultShouldRetry(error) {
    // Retry on network errors, timeouts, and 5xx errors
    const retryableErrors = [
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNABORTED'
    ];

    return retryableErrors.includes(error.code) || 
           (error.response && error.response.status >= 500);
  }

  // Error classification
  classifyError(error) {
    if (error.code) {
      switch (error.code) {
        case 'ECONNRESET':
        case 'ECONNREFUSED':
        case 'ETIMEDOUT':
          return 'NETWORK_ERROR';
        case 'ENOTFOUND':
          return 'DNS_ERROR';
        case 'ECONNABORTED':
          return 'TIMEOUT_ERROR';
        default:
          return 'UNKNOWN_ERROR';
      }
    }

    if (error.response) {
      const status = error.response.status;
      if (status >= 500) return 'SERVER_ERROR';
      if (status >= 400) return 'CLIENT_ERROR';
      return 'HTTP_ERROR';
    }

    return 'UNKNOWN_ERROR';
  }

  // Error recovery strategies
  getRecoveryStrategy(errorType) {
    const strategies = {
      NETWORK_ERROR: {
        retry: true,
        maxRetries: 3,
        retryDelay: 2000
      },
      DNS_ERROR: {
        retry: true,
        maxRetries: 2,
        retryDelay: 5000
      },
      TIMEOUT_ERROR: {
        retry: true,
        maxRetries: 2,
        retryDelay: 3000
      },
      SERVER_ERROR: {
        retry: true,
        maxRetries: 2,
        retryDelay: 1000
      },
      CLIENT_ERROR: {
        retry: false
      },
      UNKNOWN_ERROR: {
        retry: true,
        maxRetries: 1,
        retryDelay: 1000
      }
    };

    return strategies[errorType] || strategies.UNKNOWN_ERROR;
  }

  // Health check
  getHealthStatus() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      circuitBreakers: {},
      errorRates: {}
    };

    // Check circuit breakers
    for (const [name, circuit] of this.circuitBreakers) {
      health.circuitBreakers[name] = {
        state: circuit.state,
        failureCount: circuit.failureCount,
        successCount: circuit.successCount
      };

      if (circuit.state === 'OPEN') {
        health.status = 'degraded';
      }
    }

    // Check error rates
    for (const [operation, count] of this.errorCounts) {
      health.errorRates[operation] = count;
    }

    return health;
  }

  // Reset error counters
  resetErrorCounts() {
    this.errorCounts.clear();
    logger.info('Error counters reset');
  }

  // Get error statistics
  getErrorStats() {
    const stats = {
      totalErrors: 0,
      errorTypes: {},
      topErrors: []
    };

    for (const [operation, count] of this.errorCounts) {
      stats.totalErrors += count;
      stats.errorTypes[operation] = count;
    }

    stats.topErrors = Object.entries(stats.errorTypes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([operation, count]) => ({ operation, count }));

    return stats;
  }
}

module.exports = new ErrorHandler(); 
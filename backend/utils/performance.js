const logger = require('./logger');

/**
 * Middleware to log slow requests
 */
exports.slowRequestLogger = (threshold = 1000) => {
  return (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (duration > threshold) {
        logger.warn(`Slow request detected: ${req.method} ${req.path} took ${duration}ms`);
      }
    });
    
    next();
  };
};

/**
 * Get memory usage
 */
exports.getMemoryUsage = () => {
  const usage = process.memoryUsage();
  return {
    rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(usage.external / 1024 / 1024)}MB`,
  };
};

/**
 * Log system stats
 */
exports.logSystemStats = () => {
  const stats = {
    uptime: `${Math.round(process.uptime())}s`,
    memory: exports.getMemoryUsage(),
    nodeVersion: process.version,
  };
  logger.info('System Stats:', stats);
};

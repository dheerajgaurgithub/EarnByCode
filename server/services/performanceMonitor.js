// Performance monitoring and analytics service
import { cacheService } from './cache.js';

export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.startTimes = new Map();
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new PerformanceMonitor();
    }
    return this.instance;
  }

  // Start timing an operation
  startTimer(name) {
    this.startTimes.set(name, process.hrtime.bigint());
  }

  // End timing and record the metric
  endTimer(name) {
    const endTime = process.hrtime.bigint();
    const startTime = this.startTimes.get(name);

    if (!startTime) {
      console.warn(`Timer ${name} was not started`);
      return 0;
    }

    const duration = Number(endTime - startTime) / 1e6; // Convert to milliseconds
    this.recordMetric(`${name}:duration`, duration);

    this.startTimes.delete(name);
    return duration;
  }

  // Record a custom metric
  recordMetric(name, value) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const values = this.metrics.get(name);
    values.push(value);

    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  // Get metric statistics
  getMetricStats(name) {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / count;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const p95Index = Math.floor(count * 0.95);
    const p95 = sorted[Math.min(p95Index, count - 1)];

    return { count, avg, min, max, p95 };
  }

  // Get all metrics
  getAllMetrics() {
    const allMetrics = {};

    for (const [name] of this.metrics) {
      allMetrics[name] = this.getMetricStats(name);
    }

    return allMetrics;
  }

  // Monitor database query performance
  async monitorQuery(name, queryFn) {
    this.startTimer(`db:${name}`);

    try {
      const result = await queryFn();
      this.endTimer(`db:${name}`);
      return result;
    } catch (error) {
      this.endTimer(`db:${name}:error`);
      throw error;
    }
  }

  // Monitor API endpoint performance
  async monitorEndpoint(name, endpointFn) {
    this.startTimer(`api:${name}`);

    try {
      const result = await endpointFn();
      this.endTimer(`api:${name}`);
      return result;
    } catch (error) {
      this.endTimer(`api:${name}:error`);
      throw error;
    }
  }

  // Monitor cache performance
  async monitorCache(operation, cacheFn) {
    this.startTimer(`cache:${operation}`);

    try {
      const result = await cacheFn();
      this.endTimer(`cache:${operation}`);
      return result;
    } catch (error) {
      this.endTimer(`cache:${operation}:error`);
      throw error;
    }
  }

  // Get system metrics
  getSystemMetrics() {
    return {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      cpuUsage: process.cpuUsage(),
      loadAverage: require('os').loadavg()
    };
  }

  // Cache performance metrics
  async cacheMetrics() {
    try {
      const metrics = {
        performance: this.getAllMetrics(),
        system: this.getSystemMetrics(),
        cache: await cacheService.getStats(),
        timestamp: new Date().toISOString()
      };

      // Cache for 1 hour
      await cacheService.set('performance_metrics', metrics, 3600);
    } catch (error) {
      console.warn('Failed to cache performance metrics:', error);
    }
  }

  // Get cached performance metrics
  async getCachedMetrics() {
    try {
      return await cacheService.get('performance_metrics');
    } catch (error) {
      console.warn('Failed to get cached performance metrics:', error);
      return null;
    }
  }

  // Reset all metrics
  resetMetrics() {
    this.metrics.clear();
    this.startTimes.clear();
  }

  // Export metrics for external monitoring
  exportMetrics() {
    const metrics = this.getAllMetrics();
    const system = this.getSystemMetrics();

    let output = '# Performance Metrics\n\n';

    // System metrics
    output += '## System Metrics\n';
    output += `Memory Usage: ${(system.memory.heapUsed / 1024 / 1024).toFixed(2)} MB\n`;
    output += `Uptime: ${system.uptime.toFixed(2)} seconds\n`;
    output += `CPU Usage: ${JSON.stringify(system.cpuUsage)}\n`;
    output += `Load Average: ${system.loadAverage.join(', ')}\n\n`;

    // Performance metrics
    output += '## Performance Metrics\n';
    for (const [name, stats] of Object.entries(metrics)) {
      if (stats) {
        output += `${name}:\n`;
        output += `  Count: ${stats.count}\n`;
        output += `  Average: ${stats.avg.toFixed(2)}ms\n`;
        output += `  Min: ${stats.min.toFixed(2)}ms\n`;
        output += `  Max: ${stats.max.toFixed(2)}ms\n`;
        output += `  P95: ${stats.p95.toFixed(2)}ms\n\n`;
      }
    }

    return output;
  }
}

// Create singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Middleware to monitor API performance
export const performanceMonitoringMiddleware = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  const method = req.method;
  const path = req.path;

  // Monitor response time
  const originalEnd = res.end;
  res.end = function(...args) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1e6; // Convert to milliseconds

    performanceMonitor.recordMetric(`api:${method}:${path}`, duration);

    // Log slow requests
    if (duration > 1000) { // 1 second threshold
      console.warn(`Slow API request: ${method} ${path} took ${duration.toFixed(2)}ms`);
    }

    originalEnd.apply(this, args);
  };

  next();
};

// Health check endpoint with performance metrics
export const healthCheckWithMetrics = async (req, res) => {
  try {
    const cachedMetrics = await performanceMonitor.getCachedMetrics();
    const currentMetrics = performanceMonitor.getSystemMetrics();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: currentMetrics.uptime,
      memory: {
        used: Math.round(currentMetrics.memory.heapUsed / 1024 / 1024),
        total: Math.round(currentMetrics.memory.heapTotal / 1024 / 1024),
        usage: Math.round((currentMetrics.memory.heapUsed / currentMetrics.memory.heapTotal) * 100)
      },
      performance: cachedMetrics?.performance || {},
      cache: cachedMetrics?.cache || {}
    };

    res.status(200).json(health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Performance dashboard endpoint
export const performanceDashboard = async (req, res) => {
  try {
    const metrics = performanceMonitor.exportMetrics();
    const systemMetrics = performanceMonitor.getSystemMetrics();

    res.setHeader('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    console.error('Performance dashboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Performance dashboard failed'
    });
  }
};

export default performanceMonitor;

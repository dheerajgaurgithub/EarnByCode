// MongoDB-based caching service for backend performance optimization
import mongoose from 'mongoose';

// Cache schema for MongoDB storage
const cacheSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  ttl: {
    type: Number,
    required: true,
    default: 300 // 5 minutes in seconds
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 0 // TTL index for automatic deletion
  }
}, {
  timestamps: true,
  collection: 'cache'
});

// Create TTL index for automatic cleanup
cacheSchema.index({ createdAt: 1 }, { expireAfterSeconds: 0 });

const Cache = mongoose.model('Cache', cacheSchema);

export class MongoCacheService {
  constructor() {
    this.instance = null;
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new MongoCacheService();
    }
    return this.instance;
  }

  // Set cache value with TTL
  async set(key, value, ttlSeconds = 300) {
    try {
      const expiresAt = new Date(Date.now() + (ttlSeconds * 1000));

      await Cache.findOneAndUpdate(
        { key },
        {
          value: JSON.stringify(value),
          ttl: ttlSeconds,
          createdAt: expiresAt
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );
    } catch (error) {
      console.warn('MongoDB cache set failed:', error);
      throw error;
    }
  }

  // Get cache value
  async get(key) {
    try {
      const cached = await Cache.findOne({ key });

      if (!cached) {
        return null;
      }

      // Check if expired (TTL index should handle this, but double-check)
      if (cached.createdAt && new Date() > cached.createdAt) {
        await this.delete(key);
        return null;
      }

      return JSON.parse(cached.value);
    } catch (error) {
      console.warn('MongoDB cache get failed:', error);
      return null;
    }
  }

  // Delete cache entry
  async delete(key) {
    try {
      await Cache.deleteOne({ key });
    } catch (error) {
      console.warn('MongoDB cache delete failed:', error);
    }
  }

  // Clear all cache
  async clear() {
    try {
      await Cache.deleteMany({});
    } catch (error) {
      console.warn('MongoDB cache clear failed:', error);
    }
  }

  // Get cache statistics
  async getStats() {
    try {
      const totalEntries = await Cache.countDocuments();

      return {
        totalEntries,
        memoryUsage: undefined, // MongoDB doesn't provide easy memory stats
        hitRate: undefined // Would need additional tracking
      };
    } catch (error) {
      console.warn('MongoDB cache stats failed:', error);
      return { totalEntries: 0 };
    }
  }

  // Cleanup expired entries (should be automatic with TTL index)
  async cleanup() {
    try {
      // TTL index handles automatic cleanup, but we can force cleanup if needed
      const expired = await Cache.find({
        createdAt: { $lt: new Date() }
      });

      if (expired.length > 0) {
        await Cache.deleteMany({
          createdAt: { $lt: new Date() }
        });
        console.log(`Cleaned up ${expired.length} expired cache entries`);
      }
    } catch (error) {
      console.warn('MongoDB cache cleanup failed:', error);
    }
  }

  // Cache middleware for Express routes
  middleware(ttlSeconds = 300) {
    return async (req, res, next) => {
      // Skip caching for non-GET requests
      if (req.method !== 'GET') {
        return next();
      }

      const key = `route:${req.originalUrl}`;

      try {
        const cached = await this.get(key);
        if (cached) {
          res.setHeader('X-Cache', 'HIT');
          return res.json(cached);
        }

        // Store original json method
        const originalJson = res.json;
        res.json = function(data) {
          // Cache the response
          this.set(key, data, ttlSeconds).catch(console.error);
          res.setHeader('X-Cache', 'MISS');
          return originalJson.call(this, data);
        };

        next();
      } catch (error) {
        console.warn('Cache middleware error:', error);
        next();
      }
    };
  }
}

// Create singleton instance
export const mongoCacheService = MongoCacheService.getInstance();

// Cache decorator for functions
export function mongoCache(ttlSeconds = 300) {
  return function (target, propertyName, descriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args) {
      const cacheKey = `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;

      const cached = await mongoCacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const result = await method.apply(this, args);
      await mongoCacheService.set(cacheKey, result, ttlSeconds);

      return result;
    };
  };
}

// Cache key generators for common use cases
export const getUserCacheKey = (userId) => {
  return `user:${userId}`;
};

export const getProblemCacheKey = (problemId) => {
  return `problem:${problemId}`;
};

export const getProblemsCacheKey = (filters = {}) => {
  return `problems:${JSON.stringify(filters)}`;
};

export const getContestCacheKey = (contestId) => {
  return `contest:${contestId}`;
};

export const getContestsCacheKey = (filters = {}) => {
  return `contests:${JSON.stringify(filters)}`;
};

export const getLeaderboardCacheKey = (params = {}) => {
  return `leaderboard:${JSON.stringify(params)}`;
};

export const getSubmissionCacheKey = (submissionId) => {
  return `submission:${submissionId}`;
};

// Batch operations for better performance
export class MongoCacheBatch {
  constructor() {
    this.operations = [];
  }

  set(key, value, ttl = 300) {
    this.operations.push({ key, value, ttl, operation: 'set' });
    return this;
  }

  delete(key) {
    this.operations.push({ key, value: null, ttl: 0, operation: 'delete' });
    return this;
  }

  async execute() {
    if (this.operations.length === 0) return;

    const bulkOps = this.operations.map(op => ({
      updateOne: {
        filter: { key: op.key },
        update: op.operation === 'set'
          ? {
              $set: {
                value: JSON.stringify(op.value),
                ttl: op.ttl,
                createdAt: new Date(Date.now() + (op.ttl * 1000))
              }
            }
          : { $unset: { value: 1, ttl: 1, createdAt: 1 } },
        upsert: op.operation === 'set'
      }
    }));

    try {
      await Cache.bulkWrite(bulkOps);
      this.operations = [];
    } catch (error) {
      console.warn('MongoDB cache batch operation failed:', error);
      throw error;
    }
  }
}

// Create batch instance
export const cacheBatch = new MongoCacheBatch();

export default mongoCacheService;

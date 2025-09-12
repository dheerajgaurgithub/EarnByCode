/**
 * Environment Configuration
 * 
 * This file provides environment-specific configuration for the application.
 * It automatically detects the current environment and provides the appropriate settings.
 */

type Environment = 'development' | 'production' | 'test';

interface Config {
  api: {
    baseUrl: string;
    timeout: number;
  };
  app: {
    name: string;
    version: string;
    environment: Environment;
  };
  features: {
    enableAnalytics: boolean;
    enableDebug: boolean;
  };
}

// Get the current environment
export const getEnv = (): Environment => {
  const env = import.meta.env.VITE_APP_ENV || 'development';
  return (env === 'development' || env === 'production' || env === 'test') 
    ? env 
    : 'development';
};

// Development configuration
const devConfig: Config = {
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    timeout: 30000, // 30 seconds
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || 'AlgoBucks (Dev)',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: 'development',
  },
  features: {
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    enableDebug: true,
  },
};

// Production configuration
const prodConfig: Config = {
  api: {
    baseUrl: 'https://algobucks.vercel.app',
    timeout: 30000, // 30 seconds
  },
  app: {
    name: 'AlgoBucks',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: 'production',
  },
  features: {
    enableAnalytics: true,
    enableDebug: false,
  },
};

// Test configuration
const testConfig: Config = {
  ...devConfig,
  app: {
    ...devConfig.app,
    environment: 'test',
  },
  features: {
    ...devConfig.features,
    enableDebug: false,
  },
};

// Select the appropriate config based on environment
const config: Record<Environment, Config> = {
  development: devConfig,
  production: prodConfig,
  test: testConfig,
};

// Export the configuration for the current environment
export default config[getEnv()];

// Helper functions
export const isProd = (): boolean => getEnv() === 'production';
export const isDev = (): boolean => getEnv() === 'development';
export const isTest = (): boolean => getEnv() === 'test';

// Log the current environment in development
if (import.meta.env.DEV) {
  console.log(`Running in ${getEnv()} mode`);
  console.log('API Base URL:', config[getEnv()].api.baseUrl);
}

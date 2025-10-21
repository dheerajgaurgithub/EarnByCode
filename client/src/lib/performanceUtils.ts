// Image optimization utilities for better performance

// Image optimization service
export class ImageOptimizer {
  private static instance: ImageOptimizer;

  static getInstance(): ImageOptimizer {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer();
    }
    return ImageOptimizer.instance;
  }

  // Optimize image URL with parameters
  optimizeImageUrl(src: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpg' | 'png';
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  } = {}): string {
    if (!src) return src;

    // If it's already an optimized image or external URL, return as is
    if (src.includes('?') || src.startsWith('http') && !src.includes('localhost')) {
      return src;
    }

    const params = new URLSearchParams();

    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.quality !== undefined) params.set('q', options.quality.toString());
    if (options.format) params.set('f', options.format);
    if (options.fit) params.set('fit', options.fit);

    return `${src}?${params.toString()}`;
  }

  // Get responsive image sizes
  getResponsiveSizes(baseWidth: number = 800): string {
    const breakpoints = [320, 480, 768, 1024, 1280, 1920];
    const sizes = breakpoints.map(bp => `(max-width: ${bp}px) ${Math.min(bp, baseWidth)}px`);
    sizes.push(`${baseWidth}px`);
    return sizes.join(', ');
  }

  // Generate srcSet for responsive images
  generateSrcSet(src: string, widths: number[] = [320, 480, 768, 1024, 1280, 1920]): string {
    return widths
      .map(width => `${this.optimizeImageUrl(src, { width })} ${width}w`)
      .join(', ');
  }

  // Lazy load image with intersection observer
  lazyLoadImage(img: HTMLImageElement, src: string): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            img.src = src;
            img.classList.remove('loading');
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    observer.observe(img);
  }

  // Preload critical images
  preloadCriticalImages(images: string[]): void {
    images.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  }

  // Get optimized image for different screen sizes
  getOptimizedImage(src: string, screenSize: 'mobile' | 'tablet' | 'desktop' = 'desktop'): string {
    const optimizations = {
      mobile: { width: 480, quality: 75 },
      tablet: { width: 768, quality: 80 },
      desktop: { width: 1200, quality: 85 }
    };

    return this.optimizeImageUrl(src, optimizations[screenSize]);
  }

  // Cache image dimensions to avoid reflow
  async cacheImageDimensions(src: string): Promise<{ width: number; height: number } | null> {
    // Simple in-memory cache for image dimensions
    const cacheKey = `img-dim-${src}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        localStorage.removeItem(cacheKey);
      }
    }

    try {
      const img = new Image();
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = reject;
        img.src = src;
      });

      localStorage.setItem(cacheKey, JSON.stringify(dimensions));
      return dimensions;
    } catch {
      return null;
    }
  }
}

// Create singleton instance
export const imageOptimizer = ImageOptimizer.getInstance();

// React hook for optimized images
export const useOptimizedImage = (src: string, options?: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png';
}) => {
  return imageOptimizer.optimizeImageUrl(src, options);
};

// Asset optimization utilities
export class AssetOptimizer {
  private static instance: AssetOptimizer;

  static getInstance(): AssetOptimizer {
    if (!AssetOptimizer.instance) {
      AssetOptimizer.instance = new AssetOptimizer();
    }
    return AssetOptimizer.instance;
  }

  // Optimize CSS for production
  optimizeCSS(css: string): string {
    return css
      // Remove comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Remove trailing semicolons before closing braces
      .replace(/;}/g, '}')
      // Remove empty rules
      .replace(/[^{}]+{\s*}/g, '');
  }

  // Minify JavaScript (basic)
  minifyJS(js: string): string {
    return js
      // Remove comments
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Remove unnecessary semicolons
      .replace(/;+/g, ';')
      .replace(/;}/g, '}')
      // Remove trailing commas
      .replace(/,}/g, '}');
  }

  // Generate cache-busting hash for assets
  generateCacheBust(src: string): string {
    const hash = btoa(src).slice(0, 8);
    return src.includes('?') ? `${src}&v=${hash}` : `${src}?v=${hash}`;
  }

  // Optimize font loading
  optimizeFontLoading(fontUrls: string[]): void {
    // Use font-display: swap for better performance
    fontUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.href = url;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }

  // Critical CSS inlining
  inlineCriticalCSS(css: string): string {
    return `<style>${css}</style>`;
  }

  // Resource hints for performance
  addResourceHints(hints: Array<{ rel: string; href: string; as?: string }>): void {
    hints.forEach(hint => {
      const link = document.createElement('link');
      link.rel = hint.rel;
      if (hint.as) link.as = hint.as;
      link.href = hint.href;
      document.head.appendChild(link);
    });
  }

  // Service worker registration for caching
  registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if ('serviceWorker' in navigator) {
      return navigator.serviceWorker.register('/sw.js');
    }
    return Promise.resolve(null);
  }
}

// Create singleton instance
export const assetOptimizer = AssetOptimizer.getInstance();

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Measure and record performance metrics
  measure(name: string, fn: () => Promise<any> | any): Promise<any> {
    const start = performance.now();

    const result = typeof fn === 'function' ? fn() : fn;

    if (result && typeof result.then === 'function') {
      return result
        .then((value: any) => {
          const end = performance.now();
          this.recordMetric(name, end - start);
          return value;
        })
        .catch((error: any) => {
          const end = performance.now();
          this.recordMetric(`${name}:error`, end - start);
          throw error;
        });
    } else {
      const end = performance.now();
      this.recordMetric(name, end - start);
      return result;
    }
  }

  private recordMetric(name: string, duration: number): void {
    this.metrics.set(name, duration);

    // Log slow operations (> 100ms)
    if (duration > 100) {
      console.warn(`Slow operation: ${name} took ${duration.toFixed(2)}ms`);
    }
  }

  // Get performance metrics
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  // Reset metrics
  resetMetrics(): void {
    this.metrics.clear();
  }

  // Get average metric value
  getAverageMetric(name: string): number | null {
    // This would need to track multiple measurements
    return this.metrics.get(name) || null;
  }
}

// Create singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Bundle analyzer helper
export const analyzeBundle = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Bundle analysis would be available in development mode');
  }
};

export default {
  imageOptimizer,
  assetOptimizer,
  performanceMonitor
};

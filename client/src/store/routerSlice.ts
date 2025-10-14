import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface RouterState {
  // Current route information
  currentPath: string;
  currentSearch: string;
  currentHash: string;

  // Previous route for back navigation
  previousPath: string | null;
  previousSearch: string | null;
  previousHash: string | null;

  // Route history for breadcrumbs/back button
  history: Array<{
    path: string;
    search: string;
    hash: string;
    timestamp: string;
  }>;

  // Navigation state
  isNavigating: boolean;
  navigationError: string | null;

  // Route persistence
  shouldRestoreRoute: boolean;
  savedRoute: string | null;

  // Query parameters (parsed)
  queryParams: Record<string, string>;

  // Route metadata
  routeTitle: string | null;
  routeMeta: Record<string, any>;
}

const initialState: RouterState = {
  currentPath: '/',
  currentSearch: '',
  currentHash: '',
  previousPath: null,
  previousSearch: null,
  previousHash: null,
  history: [],
  isNavigating: false,
  navigationError: null,
  shouldRestoreRoute: true,
  savedRoute: null,
  queryParams: {},
  routeTitle: null,
  routeMeta: {},
};

export const routerSlice = createSlice({
  name: 'router',
  initialState,
  reducers: {
    // Set current route information
    setCurrentRoute: (state, action: PayloadAction<{
      path: string;
      search?: string;
      hash?: string;
      title?: string;
      meta?: Record<string, any>;
    }>) => {
      const { path, search = '', hash = '', title, meta } = action.payload;

      // Save previous route
      if (state.currentPath !== path || state.currentSearch !== search || state.currentHash !== hash) {
        state.previousPath = state.currentPath;
        state.previousSearch = state.currentSearch;
        state.previousHash = state.currentHash;
      }

      // Update current route
      state.currentPath = path;
      state.currentSearch = search;
      state.currentHash = hash;

      if (title) {
        state.routeTitle = title;
      }

      if (meta) {
        state.routeMeta = meta;
      }

      // Parse query parameters
      const urlParams = new URLSearchParams(search);
      state.queryParams = {};
      for (const [key, value] of urlParams) {
        state.queryParams[key] = value;
      }

      // Add to history (limit to last 50 entries)
      state.history.push({
        path,
        search,
        hash,
        timestamp: new Date().toISOString(),
      });

      if (state.history.length > 50) {
        state.history = state.history.slice(-50);
      }

      // Save route for persistence
      if (state.shouldRestoreRoute) {
        const fullRoute = `${path}${search}${hash}`;
        state.savedRoute = fullRoute;
        try {
          localStorage.setItem('algobucks_saved_route', fullRoute);
        } catch (error) {
          console.warn('Failed to save route to localStorage:', error);
        }
      }
    },

    // Set navigation state
    setNavigating: (state, action: PayloadAction<boolean>) => {
      state.isNavigating = action.payload;
    },

    setNavigationError: (state, action: PayloadAction<string | null>) => {
      state.navigationError = action.payload;
      state.isNavigating = false;
    },

    // Route persistence settings
    setShouldRestoreRoute: (state, action: PayloadAction<boolean>) => {
      state.shouldRestoreRoute = action.payload;
    },

    // Restore saved route
    restoreSavedRoute: (state, action: PayloadAction<string>) => {
      state.savedRoute = action.payload;
      state.shouldRestoreRoute = true;
    },

    // Clear saved route
    clearSavedRoute: (state) => {
      state.savedRoute = null;
      state.shouldRestoreRoute = false;
      try {
        localStorage.removeItem('algobucks_saved_route');
      } catch (error) {
        console.warn('Failed to clear saved route from localStorage:', error);
      }
    },

    // Initialize route state from localStorage
    initializeRouteState: (state) => {
      try {
        const savedRoute = localStorage.getItem('algobucks_saved_route');
        if (savedRoute) {
          state.savedRoute = savedRoute;
        }
      } catch (error) {
        console.warn('Failed to load saved route from localStorage:', error);
      }
    },

    // Update route title
    setRouteTitle: (state, action: PayloadAction<string>) => {
      state.routeTitle = action.payload;
    },

    // Update route metadata
    setRouteMeta: (state, action: PayloadAction<Record<string, any>>) => {
      state.routeMeta = action.payload;
    },

    // Update query parameters
    setQueryParams: (state, action: PayloadAction<Record<string, string>>) => {
      state.queryParams = action.payload;
    },

    // Add/update single query parameter
    setQueryParam: (state, action: PayloadAction<{ key: string; value: string }>) => {
      state.queryParams[action.payload.key] = action.payload.value;
    },

    // Remove query parameter
    removeQueryParam: (state, action: PayloadAction<string>) => {
      delete state.queryParams[action.payload];
    },

    // Clear query parameters
    clearQueryParams: (state) => {
      state.queryParams = {};
    },

    // Go back in history
    goBack: (state) => {
      if (state.history.length > 1) {
        // Remove current entry
        state.history.pop();

        // Get previous entry
        const previous = state.history[state.history.length - 1];
        if (previous) {
          state.currentPath = previous.path;
          state.currentSearch = previous.search;
          state.currentHash = previous.hash;

          // Update query params
          const urlParams = new URLSearchParams(previous.search);
          state.queryParams = {};
          for (const [key, value] of urlParams) {
            state.queryParams[key] = value;
          }
        }
      }
    },

    // Clear history
    clearHistory: (state) => {
      state.history = [{
        path: state.currentPath,
        search: state.currentSearch,
        hash: state.currentHash,
        timestamp: new Date().toISOString(),
      }];
      state.previousPath = null;
      state.previousSearch = null;
      state.previousHash = null;
    },

    // Reset router state
    resetRouterState: (state) => {
      return {
        ...initialState,
        savedRoute: state.savedRoute, // Keep saved route for persistence
      };
    },
  },
});

export const {
  setCurrentRoute,
  setNavigating,
  setNavigationError,
  setShouldRestoreRoute,
  restoreSavedRoute,
  clearSavedRoute,
  initializeRouteState,
  setRouteTitle,
  setRouteMeta,
  setQueryParams,
  setQueryParam,
  removeQueryParam,
  clearQueryParams,
  goBack,
  clearHistory,
  resetRouterState,
} = routerSlice.actions;

export const routerReducer = routerSlice.reducer;

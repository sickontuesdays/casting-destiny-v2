const CACHE_NAME = 'destiny-manifest-cache';
const CACHE_VERSION = 'v1.0';
const MANIFEST_KEY = 'destiny-manifest-metadata';

class ManifestCacheManager {
  constructor() {
    this.cache = null;
    this.manifestVersion = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Open IndexedDB for manifest storage
      this.db = await this.openDatabase();
      
      // Check current manifest version
      await this.checkManifestVersion();
      
      this.isInitialized = true;
      console.log('Manifest cache manager initialized');
    } catch (error) {
      console.error('Failed to initialize manifest cache:', error);
      throw error;
    }
  }

  async openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('DestinyManifestDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores for different manifest components
        if (!db.objectStoreNames.contains('manifestData')) {
          const manifestStore = db.createObjectStore('manifestData', { keyPath: 'component' });
          manifestStore.createIndex('version', 'version', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  async checkManifestVersion() {
    try {
      // Get current manifest version from Bungie
      const response = await fetch('https://www.bungie.net/Platform/Destiny2/Manifest/', {
        headers: {
          'X-API-Key': process.env.NEXT_PUBLIC_BUNGIE_API_KEY
        }
      });
      
      if (!response.ok) {
        throw new Error(`Manifest check failed: ${response.status}`);
      }
      
      const manifestData = await response.json();
      const currentVersion = manifestData.Response.version;
      
      // Get stored version
      const storedMetadata = await this.getStoredMetadata();
      const storedVersion = storedMetadata?.version;
      
      console.log('Manifest versions:', { current: currentVersion, stored: storedVersion });
      
      // Check if we need to update
      if (!storedVersion || storedVersion !== currentVersion) {
        console.log('Manifest update required');
        await this.downloadAndCacheManifest(manifestData.Response);
        await this.setStoredMetadata({
          version: currentVersion,
          lastUpdated: Date.now(),
          components: ['DestinyInventoryItemDefinition'] // Add more as needed
        });
      } else {
        console.log('Manifest is up to date');
      }
      
      this.manifestVersion = currentVersion;
      
    } catch (error) {
      console.error('Error checking manifest version:', error);
      // Try to use cached data if available
      const cachedData = await this.getStoredMetadata();
      if (cachedData) {
        console.log('Using cached manifest data');
        this.manifestVersion = cachedData.version;
      } else {
        throw error;
      }
    }
  }

  async downloadAndCacheManifest(manifestInfo) {
    console.log('Downloading and caching manifest...');
    
    const components = ['DestinyInventoryItemDefinition'];
    const language = 'en';
    
    for (const component of components) {
      try {
        console.log(`Downloading ${component}...`);
        
        // Get component path
        const componentPath = manifestInfo.jsonWorldComponentContentPaths[language][component];
        if (!componentPath) {
          throw new Error(`Component ${component} not found in manifest`);
        }
        
        // Download component data
        const componentUrl = `https://www.bungie.net${componentPath}`;
        const response = await fetch(componentUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to download ${component}: ${response.status}`);
        }
        
        const componentData = await response.json();
        
        // Store in IndexedDB
        await this.storeComponentData(component, {
          component,
          version: manifestInfo.version,
          data: componentData,
          lastUpdated: Date.now()
        });
        
        console.log(`${component} cached successfully`);
        
      } catch (error) {
        console.error(`Error downloading ${component}:`, error);
        throw error;
      }
    }
    
    console.log('Manifest caching complete');
  }

  async storeComponentData(component, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['manifestData'], 'readwrite');
      const store = transaction.objectStore('manifestData');
      
      const request = store.put(data);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getComponentData(component) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['manifestData'], 'readonly');
      const store = transaction.objectStore('manifestData');
      
      const request = store.get(component);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve(result.data);
        } else {
          reject(new Error(`Component ${component} not found in cache`));
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async setStoredMetadata(metadata) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['metadata'], 'readwrite');
      const store = transaction.objectStore('metadata');
      
      const request = store.put({ key: MANIFEST_KEY, ...metadata });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getStoredMetadata() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['metadata'], 'readonly');
      const store = transaction.objectStore('metadata');
      
      const request = store.get(MANIFEST_KEY);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async getCacheSize() {
    try {
      const metadata = await this.getStoredMetadata();
      if (!metadata) return 0;
      
      // Estimate cache size (this is approximate)
      const transaction = this.db.transaction(['manifestData'], 'readonly');
      const store = transaction.objectStore('manifestData');
      
      return new Promise((resolve) => {
        let totalSize = 0;
        const request = store.openCursor();
        
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            // Rough size estimation
            totalSize += JSON.stringify(cursor.value).length;
            cursor.continue();
          } else {
            resolve(Math.round(totalSize / 1024 / 1024 * 100) / 100); // MB
          }
        };
      });
    } catch (error) {
      console.error('Error calculating cache size:', error);
      return 0;
    }
  }

  async clearCache() {
    try {
      const transaction = this.db.transaction(['manifestData', 'metadata'], 'readwrite');
      
      await Promise.all([
        new Promise(resolve => {
          const request = transaction.objectStore('manifestData').clear();
          request.onsuccess = () => resolve();
        }),
        new Promise(resolve => {
          const request = transaction.objectStore('metadata').clear();
          request.onsuccess = () => resolve();
        })
      ]);
      
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }

  async getManifestStats() {
    try {
      const metadata = await this.getStoredMetadata();
      const size = await this.getCacheSize();
      
      return {
        version: metadata?.version || 'Unknown',
        lastUpdated: metadata?.lastUpdated || null,
        size: `${size} MB`,
        components: metadata?.components || [],
        isAvailable: !!metadata
      };
    } catch (error) {
      console.error('Error getting manifest stats:', error);
      return {
        version: 'Error',
        lastUpdated: null,
        size: '0 MB',
        components: [],
        isAvailable: false
      };
    }
  }
}

// Singleton instance
const manifestCache = new ManifestCacheManager();

export default manifestCache;
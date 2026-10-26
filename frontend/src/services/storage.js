/**
 * Spandan AI - High-Capacity Client Storage Service
 * 
 * Solves the browser's 5MB sessionStorage/localStorage quota limit
 * (QuotaExceededError) when dealing with multi-megabyte ECG scans,
 * reconstructed 300 DPI PNGs, and comprehensive diagnostic payloads.
 * 
 * Architecture:
 * 1. Synchronous In-Memory Cache: Instantaneous zero-latency retrieval during SPA navigation.
 * 2. Persistent IndexedDB: High-capacity storage (gigabytes limit) preserving session on refresh.
 * 3. Safe SessionStorage Fallback: Gracefully attempts metadata backup without throwing QuotaExceededError.
 */

const DB_NAME = 'SpandanStorage'
const DB_VERSION = 1
const STORE_NAME = 'analysis'

// In-Memory cache attached to window to survive HMR and navigation
if (typeof window !== 'undefined' && !window.__SPANDAN_CACHE__) {
  window.__SPANDAN_CACHE__ = {
    results: null,
    image: null,
    module: null,
    patientContext: null
  }
}

function getMemoryCache() {
  if (typeof window !== 'undefined') {
    return window.__SPANDAN_CACHE__ || {}
  }
  return {}
}

let dbPromise = null

function getDB() {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null)
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION)
        request.onupgradeneeded = (e) => {
          const db = e.target.result
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME)
          }
        }
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => {
          console.warn('IndexedDB open error:', request.error)
          resolve(null)
        }
      } catch (err) {
        console.warn('IndexedDB initialization failed:', err)
        resolve(null)
      }
    })
  }
  return dbPromise
}

async function idbSet(key, value) {
  try {
    const db = await getDB()
    if (!db) return
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        store.put(value, key)
        tx.oncomplete = () => resolve()
        tx.onerror = () => {
          console.warn(`IndexedDB put error for key ${key}:`, tx.error)
          resolve()
        }
      } catch (err) {
        console.warn(`IndexedDB transaction error for key ${key}:`, err)
        resolve()
      }
    })
  } catch (err) {
    console.warn(`IndexedDB write failed for key ${key}:`, err)
  }
}

async function idbGet(key) {
  try {
    const db = await getDB()
    if (!db) return null
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const request = store.get(key)
        request.onsuccess = () => resolve(request.result ?? null)
        request.onerror = () => resolve(null)
      } catch (err) {
        console.warn(`IndexedDB transaction error on get ${key}:`, err)
        resolve(null)
      }
    })
  } catch (err) {
    console.warn(`IndexedDB read failed for key ${key}:`, err)
    return null
  }
}

async function idbClear() {
  try {
    const db = await getDB()
    if (!db) return
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        tx.objectStore(STORE_NAME).clear()
        tx.oncomplete = () => resolve()
        tx.onerror = () => resolve()
      } catch (err) {
        resolve()
      }
    })
  } catch (err) {
    console.warn('IndexedDB clear error:', err)
  }
}

/**
 * Save analysis session data safely into Memory, IndexedDB, and sessionStorage.
 * Never throws QuotaExceededError.
 */
export async function saveAnalysisSession({ results, image, module, patientContext }) {
  // 1. Instant in-memory cache update
  if (typeof window !== 'undefined' && window.__SPANDAN_CACHE__) {
    if (results !== undefined) window.__SPANDAN_CACHE__.results = results
    if (image !== undefined) window.__SPANDAN_CACHE__.image = image
    if (module !== undefined) window.__SPANDAN_CACHE__.module = module
    if (patientContext !== undefined) window.__SPANDAN_CACHE__.patientContext = patientContext
  }

  // 2. Persist high-capacity data to IndexedDB
  const idbOperations = []
  if (results !== undefined) idbOperations.push(idbSet('analysisResults', results))
  if (image !== undefined) idbOperations.push(idbSet('analysisImage', image))
  if (module !== undefined) idbOperations.push(idbSet('analysisModule', module))
  if (patientContext !== undefined) idbOperations.push(idbSet('patientContext', patientContext))

  // 3. Best-effort sessionStorage backup (safely catch and ignore QuotaExceededError)
  if (typeof window !== 'undefined') {
    try {
      if (module !== undefined) {
        sessionStorage.setItem('analysisModule', module)
      }
    } catch (_) {}

    try {
      if (patientContext !== undefined) {
        sessionStorage.setItem('patientContext', JSON.stringify(patientContext))
      }
    } catch (_) {}

    // For results: if it fits, great; if not, IndexedDB and memory already have it
    try {
      if (results !== undefined) {
        sessionStorage.setItem('analysisResults', JSON.stringify(results))
      }
    } catch (e) {
      // QuotaExceededError caught gracefully
      console.info('sessionStorage quota exceeded for analysisResults; full results safely preserved in IndexedDB/Memory')
    }

    // For image: if it fits, save; if not, ignore safely
    try {
      if (image !== undefined) {
        if (image) {
          sessionStorage.setItem('analysisImage', image)
        } else {
          sessionStorage.removeItem('analysisImage')
        }
      }
    } catch (e) {
      console.info('sessionStorage quota exceeded for analysisImage; full image safely preserved in IndexedDB/Memory')
    }
  }

  await Promise.all(idbOperations)
}

/**
 * Synchronous immediate getter for fast SPA page transitions without visual flicker.
 */
export function getSynchronousAnalysisSession() {
  const mem = getMemoryCache()
  let results = mem.results || null
  let image = mem.image || null
  let module = mem.module || null
  let patientContext = mem.patientContext || null

  // If in-memory is not populated (e.g. initial load or reload), check sessionStorage
  if (typeof window !== 'undefined') {
    if (!results) {
      try {
        const stored = sessionStorage.getItem('analysisResults')
        if (stored) results = JSON.parse(stored)
      } catch (_) {}
    }
    if (!image) {
      try {
        image = sessionStorage.getItem('analysisImage')
      } catch (_) {}
    }
    if (!module) {
      try {
        module = sessionStorage.getItem('analysisModule')
      } catch (_) {}
    }
    if (!patientContext) {
      try {
        const stored = sessionStorage.getItem('patientContext')
        if (stored) patientContext = JSON.parse(stored)
      } catch (_) {}
    }
  }

  return { results, image, module, patientContext }
}

/**
 * Asynchronous loader that falls back to IndexedDB if memory cache and sessionStorage are empty (e.g. after hard browser refresh).
 */
export async function loadAnalysisSessionAsync() {
  // Check synchronous cache first
  const sync = getSynchronousAnalysisSession()
  if (sync.results) {
    return sync
  }

  // Restore from IndexedDB
  try {
    const [results, image, module, patientContext] = await Promise.all([
      idbGet('analysisResults'),
      idbGet('analysisImage'),
      idbGet('analysisModule'),
      idbGet('patientContext')
    ])

    if (results && typeof window !== 'undefined' && window.__SPANDAN_CACHE__) {
      window.__SPANDAN_CACHE__.results = results
      window.__SPANDAN_CACHE__.image = image
      window.__SPANDAN_CACHE__.module = module
      window.__SPANDAN_CACHE__.patientContext = patientContext
    }

    return {
      results: results || sync.results,
      image: image || sync.image,
      module: module || sync.module,
      patientContext: patientContext || sync.patientContext
    }
  } catch (err) {
    console.warn('Error reading from IndexedDB:', err)
    return sync
  }
}

/**
 * Clear all analysis caches.
 */
export async function clearAnalysisSession() {
  if (typeof window !== 'undefined' && window.__SPANDAN_CACHE__) {
    window.__SPANDAN_CACHE__.results = null
    window.__SPANDAN_CACHE__.image = null
    window.__SPANDAN_CACHE__.module = null
    window.__SPANDAN_CACHE__.patientContext = null

    try {
      sessionStorage.removeItem('analysisResults')
      sessionStorage.removeItem('analysisImage')
      sessionStorage.removeItem('analysisModule')
      sessionStorage.removeItem('patientContext')
    } catch (_) {}
  }

  await idbClear()
}

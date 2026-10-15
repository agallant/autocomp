import { assertValidChart, chartFromJson, chartToJson, type Chart, type ChartJson } from '../music'
import { cloneChart } from './clone'
import type { ChartRepository, SavedChartMeta, SavedChartRecord } from './types'

const DB_NAME = 'autocomp'
const DB_VERSION = 1
const STORE = 'charts'

type StoredRow = {
  id: string
  title: string
  updatedAt: string
  chart: ChartJson
}

export function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'))
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
  })
}

function reqToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'))
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'))
  })
}

/** Await request + transaction together so neither rejection is left unhandled. */
async function withTxRequest<T>(tx: IDBTransaction, request: IDBRequest<T>): Promise<T> {
  const complete = txDone(tx)
  const result = reqToPromise(request)
  const settled = await Promise.allSettled([result, complete])
  if (settled[0].status === 'fulfilled' && settled[1].status === 'fulfilled') {
    return settled[0].value
  }
  if (settled[0].status === 'rejected') throw settled[0].reason
  if (settled[1].status === 'rejected') throw settled[1].reason
  throw new Error('IndexedDB operation failed')
}

/** IndexedDB-backed chart repository for the browser. */
export function createIdbChartRepository(): ChartRepository {
  return {
    async list(): Promise<SavedChartMeta[]> {
      const db = await openDb()
      try {
        const tx = db.transaction(STORE, 'readonly')
        const rows = (await withTxRequest(tx, tx.objectStore(STORE).getAll())) as StoredRow[]
        return rows
          .map(({ id, title, updatedAt }) => ({ id, title, updatedAt }))
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      } finally {
        db.close()
      }
    },

    async get(id: string): Promise<Chart | null> {
      const db = await openDb()
      try {
        const tx = db.transaction(STORE, 'readonly')
        const row = (await withTxRequest(tx, tx.objectStore(STORE).get(id))) as StoredRow | undefined
        if (!row) return null
        return chartFromJson(row.chart)
      } finally {
        db.close()
      }
    },

    async put(chart: Chart): Promise<SavedChartRecord> {
      assertValidChart(chart)
      const record: SavedChartRecord = {
        id: chart.id,
        title: chart.title,
        updatedAt: new Date().toISOString(),
        chart: cloneChart(chart),
      }
      const row: StoredRow = {
        id: record.id,
        title: record.title,
        updatedAt: record.updatedAt,
        chart: chartToJson(record.chart),
      }
      const db = await openDb()
      try {
        const tx = db.transaction(STORE, 'readwrite')
        await withTxRequest(tx, tx.objectStore(STORE).put(row))
      } finally {
        db.close()
      }
      return record
    },

    async delete(id: string): Promise<void> {
      const db = await openDb()
      try {
        const tx = db.transaction(STORE, 'readwrite')
        await withTxRequest(tx, tx.objectStore(STORE).delete(id))
      } finally {
        db.close()
      }
    },
  }
}

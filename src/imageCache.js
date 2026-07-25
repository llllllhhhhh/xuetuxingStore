const CACHE_NAME = 'xuetuxing-merchant-support-images-v1'
const INDEX_KEY = 'xuetuxing-merchant-support-image-cache-index'
const CACHE_LIMIT = 120
const inFlight = new Set()

const readIndex = () => {
  try {
    return JSON.parse(localStorage.getItem(INDEX_KEY) || '{}')
  } catch {
    return {}
  }
}

const writeIndex = index => localStorage.setItem(INDEX_KEY, JSON.stringify(index))

const touch = url => {
  const index = readIndex()
  index[url] = Date.now()
  writeIndex(index)
}

const prune = async cache => {
  const index = readIndex()
  const entries = Object.entries(index).sort((a, b) => b[1] - a[1])
  const removed = entries.slice(CACHE_LIMIT)
  if (!removed.length) return
  await Promise.allSettled(removed.map(([url]) => cache.delete(url)))
  removed.forEach(([url]) => delete index[url])
  writeIndex(index)
}

const responseToObjectUrl = async response => URL.createObjectURL(await response.blob())

export const getCachedSupportImage = async url => {
  if (!url || !('caches' in window)) return ''
  try {
    const cache = await caches.open(CACHE_NAME)
    const matched = await cache.match(url)
    if (!matched) return ''
    touch(url)
    return responseToObjectUrl(matched)
  } catch {
    return ''
  }
}

export const cacheSupportImage = async (url, onReady) => {
  if (!url || !('caches' in window)) return ''
  let lockedBySelf = false
  try {
    const cache = await caches.open(CACHE_NAME)
    const matched = await cache.match(url)
    if (matched) {
      touch(url)
      const localUrl = await responseToObjectUrl(matched)
      onReady?.(localUrl)
      return localUrl
    }
    if (inFlight.has(url)) return ''
    inFlight.add(url)
    lockedBySelf = true
    const response = await fetch(url, { cache: 'force-cache' })
    if (!response.ok) return ''
    await cache.put(url, response.clone())
    await prune(cache)
    touch(url)
    const localUrl = await responseToObjectUrl(response)
    onReady?.(localUrl)
    return localUrl
  } catch {
    return ''
  } finally {
    if (lockedBySelf) inFlight.delete(url)
  }
}

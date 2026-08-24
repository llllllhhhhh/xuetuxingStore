import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getMerchantWebSocketBaseUrl,
  merchantApi,
  resolveMerchantAssetThumbUrl,
  setToken,
} from '../src/api'

const response = (body, { ok = true, status = 200 } = {}) => ({
  ok,
  status,
  json: vi.fn().mockResolvedValue(body),
})

describe('merchant api', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()))

  it('adds auth to protected calls but skips it for login', async () => {
    setToken('merchant-token')
    fetch.mockResolvedValue(response([]))
    await merchantApi.getStudyProducts()
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer merchant-token')

    fetch.mockResolvedValue(response({ token: 'new-token' }))
    await merchantApi.login({ account: 'demo', password: 'secret', slider_ticket: 'ticket' })
    expect(fetch.mock.calls[1][1].headers.Authorization).toBeUndefined()
  })

  it('surfaces backend errors and supports 204', async () => {
    fetch.mockResolvedValueOnce(response({ detail: '学校已下架' }, { ok: false, status: 403 }))
    await expect(merchantApi.me()).rejects.toThrow('学校已下架')

    fetch.mockResolvedValueOnce(response(null, { status: 204 }))
    await expect(merchantApi.logout()).resolves.toBeNull()
  })

  it('builds websocket and thumbnail URLs', () => {
    expect(getMerchantWebSocketBaseUrl()).toBe(`${window.location.origin.replace(/^http:/, 'ws:')}/api/v1`)
    expect(resolveMerchantAssetThumbUrl('/api/v1/public/assets/8/file')).toContain('/api/v1/public/assets/8/thumb')
  })
})

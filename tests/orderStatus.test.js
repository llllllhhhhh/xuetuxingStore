import { describe, expect, it } from 'vitest'
import { paymentStatusName, reviewStatusName } from '../src/utils/orderStatus'

describe('merchant order status helpers', () => {
  it('maps known states and preserves unknown backend values', () => {
    expect(paymentStatusName('paid')).toBe('已支付')
    expect(paymentStatusName('canceled')).toBe('已取消')
    expect(reviewStatusName('approved')).toBe('审核通过')
    expect(reviewStatusName('future_state')).toBe('future_state')
  })
})

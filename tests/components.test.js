import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiMock = vi.hoisted(() => ({
  getSliderCaptcha: vi.fn(),
  verifySliderCaptcha: vi.fn(),
}))

vi.mock('../src/api', () => ({ merchantApi: apiMock }))

import ProductEditorPage from '../src/components/ProductEditorPage.vue'
import SliderCaptcha from '../src/components/SliderCaptcha.vue'

const product = () => ({
  id: null,
  name: '',
  product_type: 'community',
  subtitle: '',
  description: '',
  cover: '',
  price: 9.9,
  original_price: 19.9,
  billing_cycle: 'month',
  stock: -1,
  trial_minutes: 5,
  featured: false,
  installment_enabled: false,
  installment_count: 1,
  benefits: [],
  contents: [],
})

describe('merchant component smoke tests', () => {
  beforeEach(() => vi.clearAllMocks())

  it('mounts the product editor and emits its primary actions', async () => {
    const wrapper = mount(ProductEditorPage, { props: { product: product(), saving: false } })
    expect(wrapper.text()).toContain('新增学习产品')
    await wrapper.find('.back-button').trigger('click')
    await wrapper.find('.save-button').trigger('click')
    expect(wrapper.emitted('back')).toHaveLength(1)
    expect(wrapper.emitted('save')).toHaveLength(1)
  })

  it('reports a slider challenge loading failure without rejecting', async () => {
    apiMock.getSliderCaptcha.mockRejectedValue(new Error('验证服务不可用'))
    const wrapper = mount(SliderCaptcha)
    await flushPromises()
    expect(wrapper.emitted('toast')[0]).toEqual(['验证服务不可用'])
  })
})

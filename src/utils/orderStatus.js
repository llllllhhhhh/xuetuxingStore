export const REVIEW_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
})

export const commercePaymentStatusText = Object.freeze({
  pending: '待支付',
  paid: '已支付',
  canceled: '已取消',
  cancelled: '已取消',
  refunded: '已退款',
})

export const reviewStatusText = Object.freeze({
  pending: '待平台审核',
  approved: '审核通过',
  rejected: '已驳回',
})

export const statusText = (map, value, fallback = '待处理') => map[value] || fallback
export const paymentStatusName = value => statusText(commercePaymentStatusText, value, value || '待支付')
export const reviewStatusName = value => statusText(reviewStatusText, value, value || '待平台审核')

<template>
  <main class="merchant-app">
    <section :class="['hero', { compact: school }]">
      <div class="brand">
        <div class="logo">行</div>
        <div>
          <b>学徒行商户端</b>
          <span>学校入驻 · 学习产品提交 · 订单同步 · 客服会话</span>
        </div>
      </div>
      <button v-if="school" class="ghost" @click="logout">退出登录</button>
    </section>

    <ProductEditorPage
      v-if="school && tab === 'productEdit'"
      v-model:product="productForm"
      :saving="saving"
      @back="closeProductEditor"
      @save="saveProduct"
    />

    <section v-else-if="school" class="dashboard merchant-workbench">
      <aside class="merchant-sidebar">
      <div class="school-card">
        <div class="school-logo">
          <img v-if="school.logo && !logoBroken" :src="school.logo" alt="" @error="logoBroken = true">
          <span v-else>{{ firstChar(school) }}</span>
        </div>
        <div>
          <p>当前学校</p>
          <h1>{{ school.name }}</h1>
          <div class="tags">
            <span>{{ school.city || '未设置城市' }}</span>
            <span>{{ school.district || '未设置区域' }}</span>
            <span class="ok">已审核入驻</span>
          </div>
        </div>
      </div>

      <div class="stats">
        <div><b>{{ products.length }}</b><span>学习产品</span></div>
        <div><b>{{ travelRoutes.length }}</b><span>旅游项目</span></div>
        <div><b>{{ products.filter(x => x.review_status === REVIEW_STATUS.PENDING).length + travelRoutes.filter(x => x.review_status === REVIEW_STATUS.PENDING).length }}</b><span>待审核项目</span></div>
        <div><b>{{ orders.length }}</b><span>同步订单</span></div>
      </div>

      <div class="merchant-tabs">
        <button :class="{ active: tab === 'overview' }" @click="switchTab('overview')"><i>台</i><span>工作台</span></button>
        <button :class="{ active: tab === 'products' || tab === 'productEdit' }" @click="switchTab('products')"><i>学</i><span>学习产品</span></button>
        <button :class="{ active: tab === 'travelRoutes' || tab === 'travelRouteEdit' }" @click="switchTab('travelRoutes')"><i>旅</i><span>旅游项目</span></button>
        <button :class="{ active: tab === 'orders' }" @click="switchTab('orders')"><i>单</i><span>订单信息</span></button>
        <button :class="{ active: tab === 'support' }" @click="openSupportTab"><i>客</i><span>客服会话</span></button>
      </div>
      </aside>

      <section v-if="tab === 'overview'" ref="workspacePanelRef" class="panel workspace-panel overview-panel">
        <div class="panel-head">
          <div>
            <h2>商户工作台</h2>
            <p>集中查看待审核、已上架、订单和客服状态，常用操作从这里进入。</p>
          </div>
          <button class="ghost dark" @click="loadMerchantData">刷新数据</button>
        </div>
        <div class="overview-grid">
          <button type="button" @click="switchTab('products')">
            <span>学习产品</span><b>{{ products.length }}</b><small>{{ products.filter(x => x.status).length }} 个已上架</small>
          </button>
          <button type="button" @click="switchTab('travelRoutes')">
            <span>旅游项目</span><b>{{ travelRoutes.length }}</b><small>{{ travelRoutes.filter(x => x.status).length }} 个已上架</small>
          </button>
          <button type="button" @click="switchTab('products')">
            <span>待审核</span><b>{{ products.filter(x => x.review_status === REVIEW_STATUS.PENDING).length + travelRoutes.filter(x => x.review_status === REVIEW_STATUS.PENDING).length }}</b><small>平台处理后可上架</small>
          </button>
          <button type="button" @click="openSupportTab">
            <span>客服会话</span><b>{{ supportConversations.length }}</b><small>{{ supportConversations.reduce((n, item) => n + Number(item.unread_merchant || 0), 0) }} 条未读</small>
          </button>
        </div>
      </section>

      <section v-else-if="tab === 'products'" ref="workspacePanelRef" class="panel workspace-panel catalog-panel">
        <div class="panel-head">
          <div>
            <h2>学习产品</h2>
            <p>管理付费社群、资料包和长期学习服务。编辑后会重新进入平台审核。</p>
          </div>
          <button class="primary" @click="openProductEditor()">新增学习产品</button>
        </div>
        <div class="catalog-filter">
          <label class="filter-search"><span>搜索产品</span><input v-model.trim="productFilters.keyword" placeholder="产品名称 / 卖点"></label>
          <div class="filter-selects">
          <label><span>产品类型</span>
            <select v-model="productFilters.type">
              <option value="all">全部类型</option>
              <option value="community">付费社群</option>
              <option value="package">长期套餐</option>
              <option value="material">资料包</option>
            </select>
          </label>
          <label><span>审核状态</span>
            <select v-model="productFilters.review">
              <option value="all">全部审核</option>
              <option :value="REVIEW_STATUS.PENDING">待审核</option>
              <option :value="REVIEW_STATUS.APPROVED">审核通过</option>
              <option :value="REVIEW_STATUS.REJECTED">已驳回</option>
            </select>
          </label>
          <label><span>上架状态</span>
            <select v-model="productFilters.status">
              <option value="all">全部状态</option>
              <option value="online">已上架</option>
              <option value="offline">未上架</option>
            </select>
          </label>
          <button class="ghost dark" @click="resetProductFilters">重置筛选</button>
          </div>
        </div>
        <div class="product-table-list">
          <div class="product-table-row product-table-head">
            <span>产品信息</span>
            <span>类型</span>
            <span>审核 / 上架</span>
            <span>价格</span>
            <span>操作</span>
          </div>
          <article v-for="item in filteredProducts" :key="item.id" class="product-table-row">
            <div class="product-main">
              <div class="product-thumb">
                <img v-if="item.cover && !item.cover_load_failed" :src="item.cover" alt="" @error="item.cover_load_failed = true">
                <i v-else>{{ (item.name || '产').slice(0, 1) }}</i>
              </div>
              <div class="product-copy">
                <b>{{ item.name }}</b>
                <small>{{ item.subtitle || item.description || '暂无说明' }}</small>
                <em v-if="item.reject_reason">驳回原因：{{ item.reject_reason }}</em>
              </div>
            </div>
            <span class="product-type-cell">{{ typeName(item.product_type) }}</span>
            <span class="status-stack">
              <i :class="['review', item.review_status]">{{ reviewName(item.review_status) }}</i>
              <i :class="['shelf', item.status ? 'online' : 'offline']">{{ item.status ? '已上架' : '未上架' }}</i>
            </span>
            <strong class="product-price">¥{{ item.price }}</strong>
            <span class="table-actions">
              <button @click="editProduct(item)">编辑</button>
              <button :class="['status-action', item.status ? 'offline' : 'online']" :disabled="!canToggleProduct(item)" @click="toggleProductStatus(item)">{{ item.status ? '下架' : '上架' }}</button>
            </span>
          </article>
          <p v-if="products.length && !filteredProducts.length" class="empty">没有符合筛选条件的产品。</p>
          <p v-if="!products.length" class="empty">还没有产品，先提交一个学习服务给平台审核吧。</p>
        </div>
      </section>

      <section v-else-if="tab === 'travelRoutes'" ref="workspacePanelRef" class="panel workspace-panel catalog-panel">
        <div class="panel-head">
          <div>
            <h2>旅游项目</h2>
            <p>管理商户提交的积分兑换旅游项目。审核通过并上架后，会展示到用户端。</p>
          </div>
          <button class="primary" @click="openTravelRouteEditor()">新增旅游项目</button>
        </div>
        <div class="list catalog-list">
          <article v-for="item in travelRoutes" :key="item.id" class="product-card">
            <div>
              <h3>{{ item.name }}</h3>
              <p>{{ item.description || '暂无说明' }}</p>
              <div class="tags">
                <span>{{ item.category || '未分类' }}</span>
                <span>{{ item.days || '未设置天数' }}</span>
                <span :class="['review', item.review_status]">{{ reviewName(item.review_status) }}</span>
                <span>{{ item.status ? '已上架' : '未上架' }}</span>
                <span>评价 {{ routeReviewSummary(item.id).count }} · {{ routeReviewSummary(item.id).average }} 分</span>
              </div>
              <small v-if="item.reject_reason">驳回原因：{{ item.reject_reason }}</small>
            </div>
            <div class="card-side">
              <b>{{ item.price }} 积分</b>
              <div class="card-actions">
                <button @click="editTravelRoute(item)">编辑</button>
                <button :class="['status-action', item.status ? 'offline' : 'online']" :disabled="!canToggleTravelRoute(item)" @click="toggleTravelRouteStatus(item)">{{ item.status ? '下架' : '上架' }}</button>
              </div>
              <small v-if="!canToggleTravelRoute(item)" class="action-tip">审核通过后可上架</small>
            </div>
          </article>
          <p v-if="!travelRoutes.length" class="empty">还没有旅游项目，先提交一个项目给平台审核。</p>
        </div>
      </section>

      <section v-else-if="tab === 'travelRouteEdit'" ref="workspacePanelRef" class="panel workspace-panel editor-panel form-page">
        <div class="panel-head">
          <div>
            <h2>{{ travelRouteForm.id ? '编辑旅游项目' : '新增旅游项目' }}</h2>
            <p>商户提交后进入平台审核，审核通过并上架后，会展示到用户端积分兑换旅游项目中。</p>
          </div>
          <div class="page-actions"><button class="ghost dark" @click="switchTab('travelRoutes')">返回列表</button><button class="primary" @click="saveTravelRoute" :disabled="savingTravelRoute">{{ savingTravelRoute ? '提交中...' : (travelRouteForm.id ? '保存并送审' : '提交审核') }}</button></div>
        </div>

        <div class="product-form">
          <label>项目名称<input v-model.trim="travelRouteForm.name" placeholder="例如：川西雪山轻徒步"></label>
          <label>项目分类
            <select v-model="travelRouteForm.category">
              <option>户外</option>
              <option>研学</option>
              <option>团建</option>
              <option>人文</option>
              <option>亲子</option>
            </select>
          </label>
          <label>行程天数<input v-model.trim="travelRouteForm.days" placeholder="例如：3天2夜"></label>
          <label>所需积分<input v-model.number="travelRouteForm.price" type="number" min="0"></label>
          <label>库存<input v-model.number="travelRouteForm.stock" type="number" min="0"></label>
          <label>展示权重<input v-model.number="travelRouteForm.display_weight" type="number"></label>
          <label class="wide">封面 URL<input v-model.trim="travelRouteForm.image" placeholder="https://..."></label>
          <label class="wide">项目说明<textarea v-model.trim="travelRouteForm.description" rows="4" placeholder="请填写路线亮点、适合人群、服务内容等"></textarea></label>
        </div>
      </section>

      <section v-else-if="tab === 'orders'" ref="workspacePanelRef" class="panel workspace-panel orders-panel">
        <div class="panel-head">
          <div>
            <h2>订单同步</h2>
            <p>用户购买本校创建的学习服务后，会同步显示在这里。</p>
          </div>
          <button class="ghost dark" @click="loadMerchantData">刷新</button>
        </div>
        <div class="orders">
          <div class="row head"><span>产品</span><span>用户</span><span>金额</span><span>状态</span><span>时间</span><span>操作</span></div>
          <button v-for="order in orders" :key="order.id" class="row order-row" type="button" @click="openStudyOrderDetail(order)">
            <span><b>{{ order.product_name }}</b><small>{{ order.order_no }}</small></span>
            <span>#{{ order.user_id }}</span>
            <span>¥{{ order.amount }}</span>
            <span>{{ payName(order.payment_status) }}</span>
            <span>{{ formatTime(order.created_at) }}</span>
            <span><i>详情</i></span>
          </button>
          <p v-if="!orders.length" class="empty">暂无订单。</p>
        </div>
      </section>

      <section v-else ref="workspacePanelRef" class="panel workspace-panel support-panel">
        <div class="panel-head">
          <div>
            <h2>订单客服会话</h2>
            <p>用户从已支付订单联系商户，平台客服也能进入同一会话协助处理。</p>
          </div>
          <button class="ghost dark" @click="loadSupportConversations">刷新</button>
        </div>
        <div class="support-summary">
          <article><b>{{ supportConversations.length }}</b><span>全部会话</span></article>
          <article><b>{{ supportConversations.reduce((n, item) => n + Number(item.unread_merchant || 0), 0) }}</b><span>未读消息</span></article>
          <article><b>{{ supportConversations.filter(item => item.user_online).length }}</b><span>在线用户</span></article>
        </div>
        <div class="support-layout">
          <aside class="support-list">
            <button
              v-for="item in supportConversations"
              :key="item.id"
              :class="{ active: selectedConversation?.id === item.id }"
              @click="selectConversation(item)"
            >
              <b>{{ item.user_name || '用户' }}</b>
              <span>{{ item.product_name || item.order_no }}</span>
              <small>{{ item.user_online ? '用户在线' : '用户离线' }}</small>
              <em v-if="item.unread_merchant">{{ item.unread_merchant }}</em>
            </button>
            <p v-if="!supportConversations.length" class="empty">暂无客服会话。</p>
          </aside>
          <div class="support-chat">
            <div v-if="selectedConversation" class="chat-head">
              <div>
                <b>{{ selectedConversation.product_name }}</b>
                <span>{{ selectedConversation.order_no }} · {{ selectedConversation.user_name }}</span>
              </div>
              <small>{{ supportConnected ? '已连接' : '未连接' }}</small>
            </div>
            <div v-if="selectedConversation" ref="chatBodyRef" class="chat-body">
              <div v-for="msg in supportMessages" :key="msg.id" :class="['chat-msg', msg.sender_role]">
                <small><em>{{ supportRoleName(msg.sender_role) }}</em>{{ msg.sender_name }} · {{ formatTime(msg.created_at) }}</small>
                <div v-if="msg.message_type === 'order_card'" class="support-order-message" @click="openSupportOrderCard(msg)">
                  <img v-if="parseSupportOrderCard(msg).image" :src="parseSupportOrderCard(msg).image" alt="">
                  <i v-else>{{ parseSupportOrderCard(msg).badge }}</i>
                  <span>
                    <b>{{ parseSupportOrderCard(msg).title }}</b>
                    <small>{{ parseSupportOrderCard(msg).orderNo }}</small>
                    <em>{{ parseSupportOrderCard(msg).statusText }}</em>
                  </span>
                </div>
                <p v-else-if="msg.message_type !== 'image'">{{ msg.content }}</p>
                <div v-else-if="!msg.image_load_failed" class="chat-image-wrap">
                  <img
                    :class="{ loading: msg.uploading }"
                    :src="getMerchantImageUrl(msg)"
                    alt=""
                    @click="previewMerchantImage(msg)"
                    @error="handleMerchantImageError(msg)"
                  >
                  <div v-if="msg.uploading" class="chat-image-mask"><i></i></div>
                </div>
                <div v-else class="chat-image-failed">图片加载失败</div>
              </div>
            </div>
            <div v-if="selectedConversation" class="chat-composer">
              <label class="chat-upload">
                图片
                <input type="file" accept="image/*" @change="uploadSupportImage">
              </label>
              <input v-model.trim="supportContent" placeholder="回复用户，平台客服可同步看到">
              <button class="primary" @click="sendSupportMessage">发送</button>
            </div>
            <p v-else class="empty">请选择左侧会话。</p>
          </div>
        </div>
      </section>
    </section>

    <section v-else class="auth-card">
      <div class="tabs">
        <button :class="{ active: mode === 'login' }" @click="mode = 'login'">商户登录</button>
        <button :class="{ active: mode === 'apply' }" @click="mode = 'apply'">申请入驻</button>
      </div>

      <form v-if="mode === 'login'" @submit.prevent="login">
        <h2>学校商户登录</h2>
        <p>只有后台审核通过并上架的学校账号，才能登录商户端。</p>
        <label>账号<input v-model.trim="loginForm.account" placeholder="商户账号 / 手机号" required></label>
        <label>密码<input v-model.trim="loginForm.password" type="password" placeholder="请输入密码" required></label>
        <button class="primary" :disabled="loading">{{ loading ? '登录中...' : '登录商户端' }}</button>
      </form>

      <form v-else @submit.prevent="apply">
        <h2>学校入驻申请</h2>
        <p>提交后进入平台审核，审核通过后该学校会展示在用户端站点页。</p>
        <div class="two">
          <label>学校名称<input v-model.trim="applyForm.name" required></label>
          <label>简称<input v-model.trim="applyForm.short_name" placeholder="如：水院"></label>
        </div>
        <div class="two">
          <label>城市<input v-model.trim="applyForm.city" placeholder="广州市"></label>
          <label>区域<input v-model.trim="applyForm.district" placeholder="从化区"></label>
        </div>
        <label>校徽 URL<input v-model.trim="applyForm.logo" placeholder="可选，https://..."></label>
        <div class="two">
          <label>联系人<input v-model.trim="applyForm.contact_name"></label>
          <label>商户账号<input v-model.trim="applyForm.merchant_account" required></label>
        </div>
        <label>商户密码<input v-model.trim="applyForm.merchant_password" type="password" minlength="6" required></label>
        <label>申请说明<textarea v-model.trim="applyForm.description" placeholder="可以填写学校合作负责人、校区说明等"></textarea></label>
        <button class="primary" :disabled="loading">{{ loading ? '提交中...' : '提交入驻申请' }}</button>
      </form>
    </section>

    <div v-if="showSlider" class="slider-modal-mask" @click.self="closeSlider">
      <div class="slider-modal">
        <div class="slider-modal-head">
          <div>
            <h2>登录安全验证</h2>
            <p>完成滑块后将自动登录商户端。</p>
          </div>
          <button type="button" @click="closeSlider">×</button>
        </div>
        <SliderCaptcha ref="sliderRef" @verified="handleSliderVerified" @reset="sliderTicket = ''" @toast="toast" />
      </div>
    </div>

    <div v-if="message" class="toast">{{ message }}</div>
    <div v-if="previewImageUrl" class="image-lightbox" @click="previewImageUrl = ''">
      <button @click.stop="previewImageUrl = ''">×</button>
      <img :src="previewImageUrl" alt="图片预览" @click.stop>
    </div>
    <div v-if="supportOrderDetail" class="order-detail-mask" @click="supportOrderDetail = null">
      <div class="order-detail-modal" @click.stop>
        <button @click="supportOrderDetail = null">×</button>
        <div class="order-detail-head">
          <img v-if="supportOrderDetail.image" :src="supportOrderDetail.image" alt="">
          <i v-else>{{ supportOrderDetail.badge }}</i>
          <div>
            <small>{{ supportOrderDetail.type === 'travel' ? '旅行订单' : '学习订单' }}</small>
            <h3>{{ supportOrderDetail.title }}</h3>
            <p>{{ supportOrderDetail.orderNo }}</p>
          </div>
        </div>
        <div class="order-detail-grid">
          <div><span>订单状态</span><b>{{ supportOrderDetail.statusText }}</b></div>
          <div><span>订单编号</span><b>{{ supportOrderDetail.orderNo }}</b></div>
          <div><span>{{ supportOrderDetail.metaLabelA || '订单类型' }}</span><b>{{ supportOrderDetail.metaValueA || (supportOrderDetail.type === 'travel' ? '旅行服务' : '学习服务') }}</b></div>
          <div><span>{{ supportOrderDetail.metaLabelB || '内部 ID' }}</span><b>{{ supportOrderDetail.metaValueB || supportOrderDetail.rawId || '-' }}</b></div>
        </div>
        <p class="order-detail-tip">当前在客服会话中查看订单卡片；商户订单处理请回到“订单信息”列表。</p>
      </div>
    </div>
    <div v-if="studyOrderDetail" class="order-detail-mask" @click="studyOrderDetail = null">
      <div class="order-detail-modal study-order-modal" @click.stop>
        <button @click="studyOrderDetail = null">×</button>
        <div class="order-detail-head">
          <i>{{ (studyOrderDetail.product_name || '订').slice(0, 1) }}</i>
          <div>
            <small>学习服务订单</small>
            <h3>{{ studyOrderDetail.product_name }}</h3>
            <p>{{ studyOrderDetail.order_no }}</p>
          </div>
        </div>
        <div class="order-detail-grid">
          <div><span>支付状态</span><b>{{ payName(studyOrderDetail.payment_status) }}</b></div>
          <div><span>订单金额</span><b>¥{{ studyOrderDetail.amount }}</b></div>
          <div><span>用户 ID</span><b>#{{ studyOrderDetail.user_id }}</b></div>
          <div><span>商品 ID</span><b>#{{ studyOrderDetail.product_id }}</b></div>
          <div><span>商品类型</span><b>{{ typeName(studyOrderDetail.product_type) }}</b></div>
          <div><span>支付方式</span><b>{{ paymentMethodName(studyOrderDetail.payment_method) }}</b></div>
          <div><span>分期信息</span><b>第 {{ studyOrderDetail.installment_no || 1 }} / {{ studyOrderDetail.installment_count || 1 }} 期</b></div>
          <div><span>商户学校 ID</span><b>#{{ studyOrderDetail.school_id }}</b></div>
          <div><span>交易流水号</span><b>{{ studyOrderDetail.transaction_id || '暂无' }}</b></div>
          <div><span>支付时间</span><b>{{ formatTime(studyOrderDetail.paid_at) }}</b></div>
          <div><span>创建时间</span><b>{{ formatTime(studyOrderDetail.created_at) }}</b></div>
        </div>
        <p class="order-detail-tip">当前展示订单接口已返回的完整学习订单字段；需要用户手机号、昵称等隐私信息时，需要后端再扩展商户订单详情接口。</p>
      </div>
    </div>
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { clearToken, getMerchantWebSocketBaseUrl, getToken, merchantApi, resolveMerchantAssetThumbUrl, resolveMerchantAssetUrl, setToken } from './api'
import { cacheSupportImage, getCachedSupportImage } from './imageCache'
import ProductEditorPage from './components/ProductEditorPage.vue'
import SliderCaptcha from './components/SliderCaptcha.vue'
import { REVIEW_STATUS, paymentStatusName, reviewStatusName } from './utils/orderStatus'

const mode = ref('login')
const tab = ref('overview')
const loading = ref(false)
const saving = ref(false)
const savingTravelRoute = ref(false)
const message = ref('')
const school = ref(null)
const logoBroken = ref(false)
const products = ref([])
const productFilters = ref({
  keyword: '',
  type: 'all',
  review: 'all',
  status: 'all',
})
const travelRoutes = ref([])
const travelRouteReviews = ref([])
const orders = ref([])
const supportConversations = ref([])
const selectedConversation = ref(null)
const supportMessages = ref([])
const supportContent = ref('')
const supportConnected = ref(false)
const previewImageUrl = ref('')
const supportOrderDetail = ref(null)
const studyOrderDetail = ref(null)
const chatBodyRef = ref(null)
const workspacePanelRef = ref(null)
let supportSocket = null
let supportReconnectTimer = null
let supportSocketGeneration = 0
let supportMessagesRequestId = 0
let toastTimer = null

const loginForm = ref({ account: '', password: '' })
const sliderTicket = ref('')
const sliderRef = ref(null)
const showSlider = ref(false)
const applyForm = ref({
  name: '',
  short_name: '',
  city: '',
  district: '',
  logo: '',
  contact_name: '',
  merchant_account: '',
  merchant_password: '',
  description: '',
})
const emptyProduct = () => ({
  id: null,
  name: '',
  product_type: 'community',
  subtitle: '',
  description: '',
  price: 9.9,
  original_price: 19.9,
  billing_cycle: 'month',
  cover: '',
  benefits: ['每日督学打卡', '学长在线答疑', '每周线上模考', '精选资料共享'],
  trial_minutes: 5,
  stock: -1,
  featured: false,
  installment_enabled: false,
  installment_count: 1,
  status: false,
  contents: [{ title: '5分钟免费试看', content_type: 'lesson', summary: '了解服务内容', resource_url: '', duration_minutes: 5, preview: true, sort_order: 1, status: true }],
})
const productForm = ref(emptyProduct())
const emptyTravelRoute = () => ({
  id: null,
  name: '',
  category: '户外',
  days: '3天2夜',
  price: 1999,
  stock: 30,
  agency: '',
  image: '',
  description: '',
  display_weight: 0,
  status: false,
})
const travelRouteForm = ref(emptyTravelRoute())

const firstChar = item => (item.short_name || item.name || '校').slice(0, 1)
const typeName = value => ({ community: '付费社群', package: '长期套餐', material: '资料包' }[value] || value)
const reviewName = value => reviewStatusName(value)
const payName = value => paymentStatusName(value)
const paymentMethodName = value => ({ wechat: '微信支付', balance: '余额支付', points: '积分支付', mock: '模拟支付' }[value] || value || '-')
const supportRoleName = value => ({ user: '用户', merchant: '商户客服', admin: '平台客服' }[value] || value)
const formatTime = value => {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString()
}
const openStudyOrderDetail = order => { studyOrderDetail.value = order }
const routeReviewSummary = routeId => {
  const items = travelRouteReviews.value.filter(item => Number(item.route_id) === Number(routeId))
  const count = items.length
  const average = count ? (items.reduce((sum, item) => sum + Number(item.rating || 0), 0) / count).toFixed(1) : '暂无'
  return { count, average }
}
const filteredProducts = computed(() => {
  const keyword = productFilters.value.keyword.toLowerCase()
  return products.value.filter(item => {
    const text = `${item.name || ''} ${item.subtitle || ''} ${item.description || ''}`.toLowerCase()
    const matchKeyword = !keyword || text.includes(keyword)
    const matchType = productFilters.value.type === 'all' || item.product_type === productFilters.value.type
    const matchReview = productFilters.value.review === 'all' || item.review_status === productFilters.value.review
    const matchStatus = productFilters.value.status === 'all'
      || (productFilters.value.status === 'online' ? item.status : !item.status)
    return matchKeyword && matchType && matchReview && matchStatus
  })
})
const resetProductFilters = () => {
  productFilters.value = {
    keyword: '',
    type: 'all',
    review: 'all',
    status: 'all',
  }
}
const parseSupportOrderCard = message => {
  try {
    const data = message?.extra && Object.keys(message.extra).length
      ? message.extra
      : (typeof message?.content === 'string' ? JSON.parse(message.content) : (message?.content || {}))
    return {
      type: data.type || 'study',
      badge: data.badge || (data.type === 'travel' ? '旅' : '学'),
      title: data.title || '订单',
      orderNo: data.orderNo || data.order_no || '-',
      statusText: data.statusText || '待处理',
      image: data.image || '',
      rawId: data.rawId || data.id || '',
      metaLabelA: data.metaLabelA || '',
      metaValueA: data.metaValueA || '',
      metaLabelB: data.metaLabelB || '',
      metaValueB: data.metaValueB || '',
    }
  } catch {
    return { type: 'study', badge: '单', title: '订单信息', orderNo: '-', statusText: '待处理', image: '', rawId: '', metaLabelA: '', metaValueA: '', metaLabelB: '', metaValueB: '' }
  }
}
const openSupportOrderCard = message => { supportOrderDetail.value = parseSupportOrderCard(message) }
const getMerchantImageUrl = message => {
  if (!message) return ''
  return message.local_preview || message.cached_image_src || message.resolved_image_url || resolveMerchantAssetUrl(message.image_url)
}
const getMerchantFullImageUrl = message => message?.local_preview || resolveMerchantAssetUrl(message?.image_url || message?.resolved_image_url || message?.image_thumb_url)
const previewMerchantImage = message => {
  const url = getMerchantFullImageUrl(message)
  if (url) previewImageUrl.value = url
}
const handleMerchantImageError = message => {
  if (!message || message.local_preview) return
  message.cached_image_src = ''
  if (!message.thumb_failed) {
    message.thumb_failed = true
    message.resolved_image_url = resolveMerchantAssetUrl(message.image_url)
    return
  }
  message.image_load_failed = true
}
const hydrateMerchantImage = message => {
  if (!message || message.message_type !== 'image' || message.local_preview) return message
  const remoteUrl = message.image_thumb_url
    ? resolveMerchantAssetUrl(message.image_thumb_url)
    : resolveMerchantAssetThumbUrl(message.image_url)
  const fullUrl = resolveMerchantAssetUrl(message.image_url)
  message.resolved_image_url = remoteUrl || fullUrl
  getCachedSupportImage(message.resolved_image_url).then(src => {
    setCachedSupportImage(message, src)
  })
  setTimeout(() => {
    cacheSupportImage(message.resolved_image_url, src => {
      setCachedSupportImage(message, src)
    })
  }, 200)
  return message
}
const hydrateMerchantImages = list => list.map(item => hydrateMerchantImage(item))
const toast = text => {
  message.value = text
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    message.value = ''
    toastTimer = null
  }, 2200)
}

const revokeObjectUrl = url => {
  if (typeof url === 'string' && url.startsWith('blob:')) URL.revokeObjectURL(url)
}

const releaseSupportMessageUrls = list => {
  list.forEach(item => {
    if (item.pending_timer) clearTimeout(item.pending_timer)
    revokeObjectUrl(item.local_preview)
    revokeObjectUrl(item.cached_image_src)
  })
}

const setCachedSupportImage = (messageItem, src) => {
  if (!src) return
  if (!supportMessages.value.includes(messageItem)) {
    revokeObjectUrl(src)
    return
  }
  revokeObjectUrl(messageItem.cached_image_src)
  messageItem.cached_image_src = src
}

const scrollSupportToBottom = async () => {
  await nextTick()
  if (chatBodyRef.value) {
    chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
  }
}

const scrollToWorkbenchTop = () => {
  requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
}

const scrollToWorkspacePanel = async () => {
  await nextTick()
  workspacePanelRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const switchTab = async nextTab => {
  tab.value = nextTab
  await scrollToWorkspacePanel()
}

const openProductEditor = () => {
  productForm.value = emptyProduct()
  tab.value = 'productEdit'
  scrollToWorkbenchTop()
}

const closeProductEditor = async () => {
  tab.value = 'products'
  await scrollToWorkspacePanel()
}

const openTravelRouteEditor = () => {
  travelRouteForm.value = emptyTravelRoute()
  tab.value = 'travelRouteEdit'
  scrollToWorkspacePanel()
}

const closeSupportSocket = () => {
  supportSocketGeneration += 1
  if (supportReconnectTimer) clearTimeout(supportReconnectTimer)
  supportReconnectTimer = null
  if (supportSocket) supportSocket.close()
  supportSocket = null
  supportConnected.value = false
}

const connectSupportSocket = (conversation, attempt = 0) => {
  closeSupportSocket()
  if (!conversation?.id || !getToken()) return
  const generation = supportSocketGeneration
  const url = `${getMerchantWebSocketBaseUrl()}/support/ws/${conversation.id}?role=merchant`
  // Token goes in a Sec-WebSocket-Protocol subprotocol so it never leaks
  // into URLs, logs or browser history.
  const socket = new WebSocket(url, [`bearer.${getToken()}`])
  supportSocket = socket
  socket.onopen = () => { supportConnected.value = true }
  socket.onclose = () => {
    supportConnected.value = false
    if (supportSocket !== socket || generation !== supportSocketGeneration || selectedConversation.value?.id !== conversation.id) return
    const delay = Math.min(1000 * (2 ** attempt), 15000)
    supportReconnectTimer = setTimeout(() => {
      if (selectedConversation.value?.id === conversation.id) connectSupportSocket(conversation, attempt + 1)
    }, delay)
  }
  socket.onerror = () => { supportConnected.value = false }
  socket.onmessage = event => {
    let data = null
    try { data = JSON.parse(event.data) } catch { return }
    if (data.type === 'message' && data.message && !supportMessages.value.some(item => item.id === data.message.id)) {
      const incoming = hydrateMerchantImage(data.message)
      if (incoming.message_type === 'image' && incoming.sender_role === 'merchant') {
        const pending = supportMessages.value.find(item => item.local_pending && item.sender_role === 'merchant')
        if (pending) {
          if (pending.pending_timer) clearTimeout(pending.pending_timer)
          revokeObjectUrl(pending.local_preview)
          Object.assign(pending, incoming, {
            local_pending: false,
            local_preview: '',
            uploading: false,
          })
          scrollSupportToBottom()
          loadSupportConversations()
          return
        }
      }
      supportMessages.value.push(incoming)
      scrollSupportToBottom()
      loadSupportConversations()
    }
  }
}

const loadSupportConversations = async () => {
  try {
    supportConversations.value = await merchantApi.getSupportConversations()
  } catch (error) {
    toast(error.message || '客服会话加载失败')
  }
}

const selectConversation = async item => {
  const requestId = ++supportMessagesRequestId
  closeSupportSocket()
  selectedConversation.value = item
  try {
    const rows = await merchantApi.getSupportMessages(item.id)
    if (requestId !== supportMessagesRequestId || selectedConversation.value?.id !== item.id) return
    releaseSupportMessageUrls(supportMessages.value)
    supportMessages.value = hydrateMerchantImages(rows)
    connectSupportSocket(item)
    scrollSupportToBottom()
    await loadSupportConversations()
  } catch (error) {
    if (requestId !== supportMessagesRequestId) return
    toast(error.message || '消息加载失败')
  }
}

const openSupportTab = async () => {
  tab.value = 'support'
  await scrollToWorkspacePanel()
  await loadSupportConversations()
  if (!selectedConversation.value && supportConversations.value.length) {
    await selectConversation(supportConversations.value[0])
  }
}

const sendSupportMessage = () => {
  const text = supportContent.value.trim()
  if (!text || !supportSocket || supportSocket.readyState !== WebSocket.OPEN) return
  supportSocket.send(JSON.stringify({ type: 'message', content: text }))
  supportContent.value = ''
}

const uploadSupportImage = async event => {
  const file = event.target.files?.[0]
  if (!file || !selectedConversation.value) return
  if (!supportSocket || supportSocket.readyState !== WebSocket.OPEN) {
    toast('客服连接中，请稍后再发图')
    event.target.value = ''
    return
  }
  const conversationId = selectedConversation.value.id
  const previewUrl = URL.createObjectURL(file)
  const pendingMessage = {
      id: `local-merchant-${Date.now()}`,
      sender_role: 'merchant',
      sender_name: '商户客服',
      message_type: 'image',
      image_url: previewUrl,
      local_preview: previewUrl,
      local_pending: true,
      uploading: true,
      content: '',
      created_at: new Date().toISOString(),
  }
  let uploadTimer = null
  try {
    supportMessages.value.push(pendingMessage)
    scrollSupportToBottom()
    const result = await Promise.race([
      merchantApi.uploadSupportImage(conversationId, file),
      new Promise((_, reject) => {
        uploadTimer = setTimeout(() => reject(new Error('图片上传超时，请重试')), 30000)
      }),
    ])
    if (selectedConversation.value?.id !== conversationId || !supportSocket || supportSocket.readyState !== WebSocket.OPEN) {
      throw new Error('客服连接已断开，请重试')
    }
    Object.assign(pendingMessage, {
      image_url: result.url,
      image_thumb_url: result.thumb_url || result.url,
      resolved_image_url: result.thumb_url ? resolveMerchantAssetUrl(result.thumb_url) : resolveMerchantAssetThumbUrl(result.url),
    })
    supportSocket.send(JSON.stringify({
      type: 'message',
      message_type: 'image',
      image_url: result.url,
      image_thumb_url: result.thumb_url || result.url,
      content: '',
    }))
    pendingMessage.pending_timer = setTimeout(() => {
      if (!pendingMessage.local_pending) return
      const index = supportMessages.value.indexOf(pendingMessage)
      if (index >= 0) supportMessages.value.splice(index, 1)
      revokeObjectUrl(pendingMessage.local_preview)
      toast('图片发送超时，请重试')
    }, 30000)
  } catch (error) {
    if (pendingMessage.pending_timer) clearTimeout(pendingMessage.pending_timer)
    const index = supportMessages.value.indexOf(pendingMessage)
    if (index >= 0) supportMessages.value.splice(index, 1)
    revokeObjectUrl(previewUrl)
    toast(error.message || '图片上传失败')
  } finally {
    if (uploadTimer) clearTimeout(uploadTimer)
    event.target.value = ''
  }
}

watch(() => supportMessages.value.length, () => {
  scrollSupportToBottom()
})

const loadMerchantData = async () => {
  try {
    const [productRows, travelRouteRows, reviewRows, orderRows, supportRows] = await Promise.all([
      merchantApi.getStudyProducts(),
      merchantApi.getTravelRoutes(),
      merchantApi.getTravelRouteReviews().catch(() => []),
      merchantApi.getStudyOrders(),
      merchantApi.getSupportConversations(),
    ])
    products.value = productRows
    travelRoutes.value = travelRouteRows
    travelRouteReviews.value = reviewRows
    orders.value = orderRows
    supportConversations.value = supportRows
  } catch (error) {
    toast(error.message || '加载失败')
  }
}

const loadMe = async () => {
  try {
    school.value = await merchantApi.me()
    logoBroken.value = false
    await loadMerchantData()
  } catch {
    clearToken()
    school.value = null
  }
}

const login = async () => {
  if (!sliderTicket.value) {
    showSlider.value = true
    return
  }
  loading.value = true
  try {
    if (!sliderTicket.value) {
      toast('请先完成滑块验证')
      return
    }
    const result = await merchantApi.login({ ...loginForm.value, slider_ticket: sliderTicket.value })
    setToken(result.token)
    school.value = result.school
    logoBroken.value = false
    await loadMerchantData()
    toast('登录成功')
  } catch (error) {
    sliderTicket.value = ''
    showSlider.value = false
    toast(error.message || '登录失败')
  } finally {
    loading.value = false
  }
}

const closeSlider = () => {
  showSlider.value = false
  sliderTicket.value = ''
}

const handleSliderVerified = ticket => {
  sliderTicket.value = ticket
  showSlider.value = false
  login()
}

const apply = async () => {
  loading.value = true
  try {
    const result = await merchantApi.apply(applyForm.value)
    toast(result.message || '申请已提交')
    mode.value = 'login'
  } catch (error) {
    toast(error.message || '提交失败')
  } finally {
    loading.value = false
  }
}

const saveProduct = async () => {
  if (!productForm.value.name) {
    toast('请先填写产品名称')
    return
  }
  saving.value = true
  try {
    const productId = productForm.value.id
    const payload = {
      name: String(productForm.value.name || '').trim(),
      product_type: productForm.value.product_type || 'community',
      subtitle: String(productForm.value.subtitle || '').trim(),
      description: String(productForm.value.description || '').trim(),
      price: Number(productForm.value.price || 0),
      original_price: Number(productForm.value.original_price || 0),
      billing_cycle: productForm.value.billing_cycle || 'once',
      cover: String(productForm.value.cover || '').trim(),
      stock: Number(productForm.value.stock ?? -1),
      trial_minutes: Number(productForm.value.trial_minutes || 0),
      featured: Boolean(productForm.value.featured),
      installment_enabled: Boolean(productForm.value.installment_enabled),
      installment_count: productForm.value.installment_enabled
        ? Number(productForm.value.installment_count || 1)
        : 1,
      benefits: (productForm.value.benefits || []).map(item => String(item || '').trim()).filter(Boolean),
      contents: (productForm.value.contents || [])
        .map((item, index) => ({
          title: String(item.title || '').trim(),
          content_type: item.content_type || 'lesson',
          summary: String(item.summary || '').trim(),
          resource_url: String(item.resource_url || '').trim(),
          duration_minutes: Number(item.duration_minutes || 0),
          preview: Boolean(item.preview),
          sort_order: index + 1,
          status: item.status !== false,
        }))
        .filter(item => item.title),
    }
    if (productId) await merchantApi.updateStudyProduct(productId, payload)
    else await merchantApi.createStudyProduct(payload)
    productForm.value = emptyProduct()
    await loadMerchantData()
    tab.value = 'products'
    await scrollToWorkspacePanel()
    toast('已提交平台审核')
  } catch (error) {
    toast(error.message || '提交失败')
  } finally {
    saving.value = false
  }
}

const editProduct = item => {
  const draft = JSON.parse(JSON.stringify(item))
  productForm.value = {
    ...emptyProduct(),
    ...draft,
    benefits: Array.isArray(draft.benefits) ? draft.benefits : [],
    contents: Array.isArray(draft.contents) ? draft.contents : [],
  }
  tab.value = 'productEdit'
  scrollToWorkbenchTop()
}

const canToggleProduct = item => item.review_status === REVIEW_STATUS.APPROVED

const toggleProductStatus = async item => {
  if (!canToggleProduct(item)) {
    toast('产品需要平台审核通过后才能上架')
    return
  }
  try {
    const saved = await merchantApi.setStudyProductStatus(item.id, !item.status)
    const index = products.value.findIndex(product => product.id === item.id)
    if (index >= 0) products.value.splice(index, 1, saved)
    toast(saved.status ? '商品已上架' : '商品已下架')
  } catch (error) {
    toast(error.message || '状态更新失败')
  }
}

const canToggleTravelRoute = item => item.review_status === REVIEW_STATUS.APPROVED

const saveTravelRoute = async () => {
  if (!travelRouteForm.value.name) {
    toast('请先填写旅游项目名称')
    return
  }
  savingTravelRoute.value = true
  try {
    const payload = {
      ...travelRouteForm.value,
      price: Number(travelRouteForm.value.price || 0),
      stock: Number(travelRouteForm.value.stock || 0),
      display_weight: Number(travelRouteForm.value.display_weight || 0),
    }
    if (payload.id) await merchantApi.updateTravelRoute(payload)
    else await merchantApi.createTravelRoute(payload)
    travelRouteForm.value = emptyTravelRoute()
    await loadMerchantData()
    tab.value = 'travelRoutes'
    toast('旅游项目已提交平台审核')
  } catch (error) {
    toast(error.message || '旅游项目提交失败')
  } finally {
    savingTravelRoute.value = false
  }
}

const editTravelRoute = item => {
  travelRouteForm.value = JSON.parse(JSON.stringify(item))
  tab.value = 'travelRouteEdit'
  scrollToWorkspacePanel()
}

const toggleTravelRouteStatus = async item => {
  if (!canToggleTravelRoute(item)) {
    toast('旅游项目需要平台审核通过后才能上架')
    return
  }
  try {
    const saved = await merchantApi.setTravelRouteStatus(item.id, !item.status)
    const index = travelRoutes.value.findIndex(route => route.id === item.id)
    if (index >= 0) travelRoutes.value.splice(index, 1, saved)
    toast(saved.status ? '旅游项目已上架' : '旅游项目已下架')
  } catch (error) {
    toast(error.message || '状态更新失败')
  }
}

const logout = async () => {
  try { await merchantApi.logout() } catch {}
  closeSupportSocket()
  clearToken()
  school.value = null
  logoBroken.value = false
  products.value = []
  travelRoutes.value = []
  orders.value = []
  supportConversations.value = []
  selectedConversation.value = null
  releaseSupportMessageUrls(supportMessages.value)
  supportMessages.value = []
}

onMounted(loadMe)
onBeforeUnmount(() => {
  closeSupportSocket()
  releaseSupportMessageUrls(supportMessages.value)
  if (toastTimer) clearTimeout(toastTimer)
})
</script>

<style scoped>
.merchant-app{min-height:100vh;background:linear-gradient(180deg,#f8f5ed,#eef7f3);color:#132c28;padding:22px;box-sizing:border-box}.hero{max-width:1180px;margin:0 auto 18px;display:flex;justify-content:space-between;align-items:center}.brand{display:flex;align-items:center;gap:12px}.logo{width:44px;height:44px;border-radius:14px;background:#f49a5d;color:#fff;display:grid;place-items:center;font-size:24px;font-weight:800}.brand b{display:block;font-size:21px}.brand span{display:block;color:#72827f;font-size:13px;margin-top:3px}.ghost,.primary{border:0;border-radius:14px;padding:12px 18px;font-weight:800;cursor:pointer}.ghost{background:#fff;color:#224941;box-shadow:0 8px 20px rgba(17,61,55,.08)}.ghost.dark{border:1px solid #dce8e4}.primary{background:linear-gradient(135deg,#ff7938,#ffb06b);color:#fff;box-shadow:0 10px 24px rgba(239,113,48,.22)}.dashboard,.auth-card{max-width:1180px;margin:0 auto}.school-card,.auth-card,.panel{background:rgba(255,255,255,.92);border:1px solid #e2ece8;border-radius:28px;box-shadow:0 14px 36px rgba(17,61,55,.08)}.school-card{display:flex;gap:18px;align-items:center;padding:24px}.school-logo{width:74px;height:74px;border-radius:22px;background:#eef5f2;display:grid;place-items:center;overflow:hidden;font-size:28px;font-weight:900;color:#1d5047}.school-logo img{width:100%;height:100%;object-fit:cover}.school-card p{margin:0 0 6px;color:#7d8c88}.school-card h1{margin:0;font-size:28px}.tags{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.tags span{background:#f4f7f6;border:1px solid #e0e8e5;border-radius:9px;padding:5px 9px;font-size:12px;color:#516762}.tags .ok,.review.approved{background:#dff7ee;color:#087e6e}.review.pending{background:#fff4d9;color:#a66a00}.review.rejected{background:#ffe6e6;color:#bb3333}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:16px 0}.stats div{background:#fff;border:1px solid #e3ebe8;border-radius:20px;padding:18px;text-align:center}.stats b{display:block;font-size:26px}.stats span{font-size:12px;color:#74857f}.merchant-tabs{display:flex;gap:10px;background:#fff;border:1px solid #e0ebe7;border-radius:18px;padding:8px;margin-bottom:16px}.merchant-tabs button{flex:1;border:0;border-radius:13px;background:transparent;padding:13px;font-weight:800;color:#60736d}.merchant-tabs .active{background:#1f4a42;color:#fff}.panel{padding:22px;margin-bottom:24px}.panel-head{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:18px}.panel-head h2{margin:0;font-size:20px}.panel-head p{margin:6px 0 0;color:#788984;font-size:13px}.product-form{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.product-form label,.auth-card label{font-size:12px;color:#516762;font-weight:800}.product-form input,.product-form select,.product-form textarea,.auth-card input,.auth-card textarea{width:100%;box-sizing:border-box;margin-top:7px;border:1px solid #dce8e4;border-radius:13px;background:#f8fbfa;padding:12px;outline:none}.wide{grid-column:span 4}.list{display:grid;gap:12px;margin-top:20px}.product-card{display:flex;justify-content:space-between;gap:18px;background:#f9fbfa;border:1px solid #e4ece9;border-radius:18px;padding:16px}.product-card h3{margin:0}.product-card p{color:#70817c;margin:8px 0}.product-card small{display:block;color:#bb3333;margin-top:8px}.card-side{text-align:right;display:flex;flex-direction:column;gap:12px;align-items:flex-end}.card-side b{font-size:22px;color:#ef7130}.card-side button{border:1px solid #dce8e4;background:#fff;border-radius:10px;padding:9px 14px}.card-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.card-actions button{min-width:64px;cursor:pointer}.card-actions .offline{border-color:#ffd8cf;background:#fff3f0;color:#c84c2f}.card-actions .online{border-color:#bfe8dc;background:#e5f8f1;color:#07816f}.card-actions button:disabled{opacity:.48;cursor:not-allowed}.card-side .action-tip{color:#8a9b96;margin-top:0;text-align:right}.orders{overflow:auto}.row{display:grid;grid-template-columns:2fr .8fr .8fr .8fr 1.4fr;gap:12px;padding:13px;border-bottom:1px solid #edf2f0;align-items:center;font-size:13px}.row.head{font-weight:900;background:#f3f8f6;border-radius:12px}.row small{display:block;color:#85928f;margin-top:4px}.empty{text-align:center;color:#83918d;padding:22px}.auth-card{max-width:720px;padding:28px}.tabs{display:flex;background:#f1f6f4;border-radius:16px;padding:6px;margin-bottom:20px}.tabs button{flex:1;border:0;background:transparent;border-radius:12px;padding:12px;font-weight:800;color:#657771}.tabs .active{background:#fff;color:#183d36;box-shadow:0 8px 18px rgba(17,61,55,.08)}.auth-card form{display:grid;gap:14px}.auth-card h2{margin:0}.auth-card p{margin:0;color:#71837e}.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}.toast{position:fixed;z-index:9999;left:50%;top:24px;transform:translateX(-50%);display:inline-flex;align-items:center;justify-content:center;max-width:calc(100vw - 48px);white-space:nowrap;line-height:1.4;background:#1d413a;color:#fff;border-radius:999px;padding:12px 20px;box-shadow:0 12px 28px rgba(17,61,55,.22);pointer-events:none}.support-layout{display:grid;grid-template-columns:310px 1fr;gap:16px}.support-list{display:grid;gap:10px;align-content:start;max-height:620px;overflow:auto}.support-list button{position:relative;text-align:left;border:1px solid #e1ebe7;background:#f8fbfa;border-radius:18px;padding:14px 40px 14px 14px;cursor:pointer}.support-list button.active{background:#e7f5f1;border-color:#9fd7cb}.support-list b,.support-list span,.support-list small{display:block}.support-list b{font-size:15px}.support-list span{margin-top:5px;color:#61736e;font-size:13px}.support-list small{margin-top:7px;color:#0b8a79}.support-list em{position:absolute;right:12px;top:12px;min-width:20px;height:20px;border-radius:999px;background:#ff7a35;color:#fff;font-size:12px;text-align:center;line-height:20px;font-style:normal}.support-chat{min-height:620px;border:1px solid #e1ebe7;background:#f8fbfa;border-radius:22px;display:flex;flex-direction:column;overflow:hidden}.chat-head{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:16px 18px;border-bottom:1px solid #e1ebe7;background:#fff}.chat-head b,.chat-head span{display:block}.chat-head span{margin-top:4px;color:#768782;font-size:13px}.chat-head small{color:#0b8a79}.chat-body{flex:1;padding:18px;overflow:auto;display:flex;flex-direction:column;gap:12px}.chat-msg{max-width:72%;background:#fff;border:1px solid #e5ece9;border-radius:16px;padding:10px 12px;box-shadow:0 8px 18px rgba(17,61,55,.05)}.chat-msg.merchant{align-self:flex-end;background:#ff8a4c;color:#fff}.chat-msg.admin{align-self:center;background:#e9f4f1}.chat-msg small{display:block;opacity:.7;margin-bottom:6px}.chat-msg p{margin:0;white-space:pre-wrap;line-height:1.6}.chat-msg img{max-width:260px;border-radius:12px;display:block}.chat-composer{display:flex;gap:10px;padding:14px;border-top:1px solid #e1ebe7;background:#fff}.chat-composer input{flex:1;border:1px solid #dce8e4;border-radius:14px;background:#f8fbfa;padding:12px;outline:none}
.chat-msg.user{align-self:flex-start;background:#fff}.chat-msg.merchant{align-self:flex-end;background:#ff8a4c;color:#fff}.chat-msg.admin{align-self:center;background:#e9f4f1;color:#244941;border-color:#cde3dc}.chat-msg small{display:flex;gap:6px;align-items:center}.chat-msg small em{font-style:normal;border-radius:999px;padding:2px 7px;background:#eef3f1;color:#5d706b;font-size:11px}.chat-msg.user small em{background:#e1f4ee;color:#08816f}.chat-msg.merchant small em{background:rgba(255,255,255,.22);color:#fff}.chat-msg.admin small em{background:#d9eee8;color:#0a7d70}.chat-msg img.loading{opacity:.88;filter:saturate(.9)}.chat-image-wrap{position:relative;display:inline-block;max-width:260px;border-radius:12px;overflow:hidden;vertical-align:top}.chat-image-mask{position:absolute;inset:0;background:rgba(8,34,30,.38);display:grid;place-items:center;backdrop-filter:blur(2px)}.chat-image-mask i{width:32px;height:32px;border-radius:50%;border:3px solid rgba(255,255,255,.38);border-top-color:#fff;animation:chatSpin .76s linear infinite}.chat-image-failed{width:190px;height:132px;border-radius:12px;background:#f3f6f5;color:#8a9b96;display:grid;place-items:center;font-size:12px}.chat-upload{display:inline-flex;align-items:center;justify-content:center;border:1px solid #dce8e4;border-radius:14px;background:#f8fbfa;color:#1f4a42;padding:0 14px;font-weight:800;cursor:pointer}.chat-upload input{display:none}@keyframes chatSpin{to{transform:rotate(360deg)}}
@media(max-width:760px){.merchant-app{padding:14px}.hero{align-items:flex-start}.school-card,.panel-head,.product-card{flex-direction:column;align-items:flex-start}.stats{grid-template-columns:1fr 1fr}.product-form{grid-template-columns:1fr}.wide{grid-column:span 1}.row{grid-template-columns:1.5fr .7fr .7fr .8fr 1fr}.two{grid-template-columns:1fr}.support-layout{grid-template-columns:1fr}.support-chat{min-height:520px}}
.support-panel{display:flex;flex-direction:column;min-height:0;overflow:hidden}.support-panel>.panel-head{flex:0 0 auto}.support-layout{height:clamp(520px,calc(100vh - 310px),680px);min-height:0;overflow:hidden;align-items:stretch}.support-list{height:100%;max-height:none;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding-right:4px}.support-chat{height:100%;min-height:0;overflow:hidden}.chat-head{flex:0 0 auto}.chat-body{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain}.chat-composer{flex:0 0 auto}.support-list::-webkit-scrollbar,.chat-body::-webkit-scrollbar{width:6px}.support-list::-webkit-scrollbar-thumb,.chat-body::-webkit-scrollbar-thumb{background:#c8d9d3;border-radius:999px}@media(max-width:760px){.support-panel{overflow:visible}.support-layout{height:auto;overflow:visible}.support-list{height:auto;max-height:260px}.support-chat{height:68vh;min-height:460px}}
.chat-msg.admin{align-self:flex-start;background:#eef8fb;color:#214a55;border-color:#b9dfe7;border-radius:16px 16px 16px 6px}.chat-msg.admin small{color:#5f7d86}.chat-msg.admin small em{background:#d9f0f5;color:#147486}.chat-msg.admin .chat-image-wrap{box-shadow:0 8px 18px rgba(19,103,121,.08)}.chat-msg.admin img{border:1px solid rgba(20,116,134,.16)}.chat-image-wrap img{cursor:zoom-in}.image-lightbox{position:fixed;inset:0;z-index:99999;background:rgba(8,22,20,.78);display:flex;align-items:center;justify-content:center;padding:32px}.image-lightbox img{max-width:92vw;max-height:88vh;object-fit:contain;border-radius:16px;box-shadow:0 22px 70px rgba(0,0,0,.35)}.image-lightbox button{position:absolute;right:30px;top:24px;width:42px;height:42px;border:0;border-radius:50%;background:rgba(255,255,255,.95);font-size:28px;line-height:38px;color:#173f38;cursor:pointer}.support-order-message{width:280px;display:flex;gap:12px;align-items:center;padding:12px;border:1px solid #dfe9e5;border-radius:16px;background:#fbfdfc;cursor:pointer;box-shadow:0 8px 18px rgba(17,61,55,.05);color:#173f38}.support-order-message img,.support-order-message i{width:58px;height:58px;border-radius:14px;flex:0 0 58px}.support-order-message img{object-fit:cover}.support-order-message i{display:grid;place-items:center;font-style:normal;background:linear-gradient(135deg,#ff8a4c,#ffc18f);color:#fff;font-weight:900;font-size:20px}.support-order-message span{min-width:0;flex:1;text-align:left}.support-order-message b,.support-order-message small,.support-order-message em{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.support-order-message b{font-size:14px;color:#173f38}.support-order-message small{margin-top:4px;color:#7f908b}.support-order-message em{margin-top:7px;font-style:normal;color:#0a8d7c;font-weight:800;font-size:12px}.order-detail-mask{position:fixed;inset:0;z-index:99998;background:rgba(8,22,20,.44);display:grid;place-items:center;padding:24px}.order-detail-modal{position:relative;width:min(520px,92vw);background:#fff;border-radius:24px;padding:24px;box-shadow:0 28px 90px rgba(0,0,0,.22)}.order-detail-modal>button{position:absolute;right:18px;top:18px;width:36px;height:36px;border:0;border-radius:12px;background:#f1f5f3;color:#31534d;font-size:24px;cursor:pointer}.order-detail-head{display:flex;gap:16px;align-items:center;padding-right:42px}.order-detail-head img,.order-detail-head i{width:82px;height:82px;border-radius:20px;flex:0 0 82px}.order-detail-head img{object-fit:cover}.order-detail-head i{display:grid;place-items:center;background:linear-gradient(135deg,#13a38f,#ff8a4c);color:#fff;font-style:normal;font-size:28px;font-weight:900}.order-detail-head small,.order-detail-head h3,.order-detail-head p{display:block;margin:0}.order-detail-head small{color:#0a8d7c;font-weight:800}.order-detail-head h3{margin-top:6px;font-size:20px}.order-detail-head p{margin-top:5px;color:#7d8d89;word-break:break-all}.order-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:22px}.order-detail-grid div{padding:14px;border-radius:14px;background:#f5f8f7}.order-detail-grid span,.order-detail-grid b{display:block}.order-detail-grid span{color:#80908c;font-size:12px}.order-detail-grid b{margin-top:6px;word-break:break-all}.order-detail-tip{margin:18px 0 0;color:#7d8d89;font-size:12px;line-height:1.7}
.merchant-app{background:#f4f7f5;padding:18px 22px 28px}.hero{max-width:1320px}.hero.compact{margin-bottom:14px}.hero.compact .brand span{color:#667772}.merchant-workbench{max-width:1320px;display:grid;grid-template-columns:300px minmax(0,1fr);gap:18px;align-items:start}.merchant-sidebar{position:sticky;top:18px;display:grid;gap:14px;max-height:calc(100vh - 36px);overflow:auto;padding-right:2px}.merchant-sidebar::-webkit-scrollbar,.workspace-panel .list::-webkit-scrollbar{width:6px}.merchant-sidebar::-webkit-scrollbar-thumb,.workspace-panel .list::-webkit-scrollbar-thumb{background:#c7d8d2;border-radius:999px}.merchant-sidebar .school-card{display:block;padding:18px;border-radius:18px}.merchant-sidebar .school-logo{width:62px;height:62px;border-radius:18px;margin-bottom:14px}.merchant-sidebar .school-card h1{font-size:21px;line-height:1.3}.merchant-sidebar .school-card p{font-size:12px}.merchant-sidebar .tags{gap:6px}.merchant-sidebar .tags span{font-size:11px}.merchant-sidebar .stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0}.merchant-sidebar .stats div{padding:14px 12px;border-radius:16px;text-align:left}.merchant-sidebar .stats b{font-size:24px}.merchant-sidebar .merchant-tabs{display:grid;gap:8px;margin:0;padding:8px;border-radius:18px}.merchant-sidebar .merchant-tabs button{display:flex;align-items:center;justify-content:flex-start;min-height:46px;padding:0 14px;text-align:left}.workspace-panel{min-width:0;margin:0;border-radius:20px;box-shadow:0 16px 42px rgba(17,61,55,.07)}.workspace-panel>.panel-head{padding-bottom:16px;border-bottom:1px solid #e6efeb}.workspace-panel>.panel-head h2{font-size:22px}.editor-panel{display:grid;grid-template-columns:minmax(320px,390px) minmax(0,1fr);gap:20px;align-items:start}.editor-panel>.panel-head{grid-column:1/-1}.editor-panel>.product-form{position:sticky;top:18px;grid-template-columns:1fr 1fr;gap:12px;margin:0;padding-right:18px;border-right:1px solid #e6efeb}.editor-panel>.product-form .wide{grid-column:1/-1}.editor-panel>.list{margin:0;max-height:calc(100vh - 190px);overflow:auto;padding-right:6px}.editor-panel .product-card{border-radius:14px;background:#fff;padding:16px;box-shadow:none}.editor-panel .product-card:hover{border-color:#bcd9d1;background:#fbfdfc}.editor-panel .product-card h3{font-size:17px}.editor-panel .product-card p{font-size:13px;line-height:1.55}.orders-panel{min-height:560px}.orders-panel .orders{border:1px solid #e5eeea;border-radius:16px;max-height:calc(100vh - 230px);overflow:auto}.orders-panel .row{grid-template-columns:2fr .8fr .8fr .8fr 1.2fr;padding:14px 16px}.support-panel{min-height:calc(100vh - 120px)}.support-panel .support-layout{height:calc(100vh - 230px);min-height:560px}.card-side{min-width:126px}.card-actions button{font-weight:800}.review.pending{border-color:#ffe1a8}.review.approved{border-color:#bdebdc}.review.rejected{border-color:#ffc8c8}@media(max-width:980px){.merchant-workbench{grid-template-columns:1fr}.merchant-sidebar{position:static;max-height:none;overflow:visible}.merchant-sidebar .school-card{display:flex}.merchant-sidebar .stats{grid-template-columns:repeat(4,1fr)}.merchant-sidebar .merchant-tabs{display:flex;overflow:auto}.merchant-sidebar .merchant-tabs button{justify-content:center;white-space:nowrap}.editor-panel{grid-template-columns:1fr}.editor-panel>.product-form{position:static;border-right:0;border-bottom:1px solid #e6efeb;padding:0 0 18px}.editor-panel>.list{max-height:none;overflow:visible}.support-panel .support-layout{height:auto}}@media(max-width:760px){.merchant-app{padding:12px}.hero.compact{gap:12px}.merchant-sidebar .school-card{display:block}.merchant-sidebar .stats{grid-template-columns:1fr 1fr}.workspace-panel{padding:16px;border-radius:18px}.editor-panel>.product-form{grid-template-columns:1fr}.support-panel{min-height:0}.support-panel .support-layout{min-height:0}.orders-panel .row{grid-template-columns:1.4fr .6fr .7fr .7fr;gap:8px}.orders-panel .row span:last-child{display:none}}
.merchant-sidebar .merchant-tabs button{gap:10px}
.merchant-sidebar .merchant-tabs button:before{width:28px;height:28px;border-radius:10px;display:grid;place-items:center;background:#edf5f2;color:#1f4a42;font-weight:900;flex:0 0 28px}
.merchant-sidebar .merchant-tabs button:nth-child(1):before{content:"学"}
.merchant-sidebar .merchant-tabs button:nth-child(2):before{content:"旅"}
.merchant-sidebar .merchant-tabs button:nth-child(3):before{content:"单"}
.merchant-sidebar .merchant-tabs button:nth-child(4):before{content:"客"}
.merchant-sidebar .merchant-tabs .active:before{background:rgba(255,255,255,.18);color:#fff}
.merchant-sidebar .stats div:nth-child(1){border-left:4px solid #12a594}
.merchant-sidebar .stats div:nth-child(2){border-left:4px solid #ff8a4c}
.merchant-sidebar .stats div:nth-child(3){border-left:4px solid #e0a51a}
.merchant-sidebar .stats div:nth-child(4){border-left:4px solid #5d7fd8}

.merchant-app{
  min-height:100vh;
  background:#f5f7fb;
  color:#17212b;
  padding:18px 24px 28px;
}
.hero{
  max-width:1440px;
  height:64px;
  margin:0 auto 16px;
  padding:0 18px;
  border:1px solid #e8edf3;
  border-radius:18px;
  background:#fff;
  box-shadow:0 8px 28px rgba(15,23,42,.05);
  box-sizing:border-box;
}
.brand .logo{
  border-radius:12px;
  background:#1677ff;
  box-shadow:0 10px 18px rgba(22,119,255,.22);
}
.brand b{font-size:19px;color:#121826}
.brand span{color:#697586}
.ghost,.primary{border-radius:10px;min-height:40px;display:inline-flex;align-items:center;justify-content:center}
.ghost{box-shadow:none;border:1px solid #d9e2ec;background:#fff;color:#344054}
.ghost:hover{border-color:#1677ff;color:#1677ff}
.primary{background:#1677ff;box-shadow:0 10px 20px rgba(22,119,255,.22)}
.primary:hover{background:#0f66df}
.merchant-workbench{
  max-width:1440px;
  grid-template-columns:284px minmax(0,1fr);
  gap:18px;
}
.merchant-sidebar{
  top:18px;
  gap:12px;
  padding:0;
}
.merchant-sidebar .school-card,
.merchant-sidebar .stats,
.merchant-sidebar .merchant-tabs,
.workspace-panel{
  border:1px solid #e8edf3;
  background:#fff;
  box-shadow:0 10px 30px rgba(15,23,42,.04);
}
.merchant-sidebar .school-card{border-radius:18px;padding:18px}
.merchant-sidebar .school-logo{
  width:54px;
  height:54px;
  border-radius:14px;
  background:#eef5ff;
  color:#1677ff;
}
.merchant-sidebar .school-card h1{font-size:18px;color:#101828}
.merchant-sidebar .tags span{
  border-radius:7px;
  border-color:#e8edf3;
  background:#f8fafc;
  color:#667085;
}
.merchant-sidebar .tags .ok{background:#ecfdf3;color:#067647;border-color:#abefc6}
.merchant-sidebar .stats{
  border-radius:18px;
  padding:10px;
}
.merchant-sidebar .stats div{
  border:0;
  border-radius:14px;
  background:#f8fafc;
  padding:13px 12px;
}
.merchant-sidebar .stats div:nth-child(1),
.merchant-sidebar .stats div:nth-child(2),
.merchant-sidebar .stats div:nth-child(3),
.merchant-sidebar .stats div:nth-child(4){border-left:0}
.merchant-sidebar .stats b{font-size:23px;color:#101828}
.merchant-sidebar .stats span{color:#667085}
.merchant-sidebar .merchant-tabs{
  border-radius:18px;
  padding:10px;
}
.merchant-sidebar .merchant-tabs button{
  gap:10px;
  min-height:46px;
  border-radius:12px;
  color:#475467;
  font-size:14px;
}
.merchant-sidebar .merchant-tabs button:before{display:none}
.merchant-tabs button i{
  width:28px;
  height:28px;
  border-radius:9px;
  display:grid;
  place-items:center;
  background:#f0f5ff;
  color:#1677ff;
  font-style:normal;
  font-weight:900;
  flex:0 0 28px;
}
.merchant-tabs button span{line-height:1}
.merchant-sidebar .merchant-tabs .active{
  background:#1677ff;
  color:#fff;
  box-shadow:0 10px 18px rgba(22,119,255,.2);
}
.merchant-sidebar .merchant-tabs .active i{
  background:rgba(255,255,255,.2);
  color:#fff;
}
.workspace-panel{
  min-height:calc(100vh - 126px);
  border-radius:18px;
  padding:22px;
}
.workspace-panel>.panel-head{
  min-height:54px;
  padding-bottom:18px;
  border-bottom:1px solid #eef2f6;
}
.workspace-panel>.panel-head h2{
  color:#101828;
  font-size:22px;
  line-height:1.2;
}
.workspace-panel>.panel-head p{color:#667085}
.overview-grid{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:14px;
  margin-top:4px;
}
.overview-grid button{
  width:100%;
  text-align:left;
  border:1.5px solid #cbdaf0;
  border-radius:16px;
  background:linear-gradient(180deg,#ffffff,#f7faff);
  padding:18px;
  box-shadow:0 10px 24px rgba(22,119,255,.07);
  transition:border-color .18s ease, box-shadow .18s ease, transform .18s ease;
  cursor:pointer;
}
.overview-grid button:hover{
  border-color:#1677ff;
  box-shadow:0 16px 34px rgba(22,119,255,.14);
  transform:translateY(-1px);
}
.overview-grid button:focus-visible{
  outline:3px solid rgba(22,119,255,.22);
  outline-offset:2px;
}
.overview-grid span,
.overview-grid small{display:block;color:#667085}
.overview-grid b{
  display:block;
  margin:10px 0 5px;
  color:#101828;
  font-size:30px;
  line-height:1;
}
.catalog-list{
  grid-template-columns:repeat(auto-fill,minmax(320px,1fr));
  align-items:stretch;
}
.catalog-list .product-card{
  min-height:170px;
  flex-direction:column;
  background:#fff;
  border-color:#e8edf3;
  border-radius:16px;
  box-shadow:0 8px 24px rgba(15,23,42,.035);
}
.catalog-list .product-card:hover{
  border-color:#b8d7ff;
  box-shadow:0 14px 34px rgba(15,23,42,.08);
  transform:translateY(-1px);
}
.catalog-list .card-side{
  width:100%;
  flex-direction:row;
  align-items:center;
  justify-content:space-between;
  text-align:left;
}
.catalog-list .card-side b{font-size:20px;color:#1677ff}
.catalog-filter{
  display:flex;
  gap:10px;
  align-items:center;
  margin-bottom:16px;
  padding:10px;
  border:1.5px solid #d8e4f2;
  border-radius:14px;
  background:#f8fafc;
}
.catalog-filter label{
  min-width:0;
  color:#344054;
  font-size:12px;
  font-weight:800;
}
.catalog-filter label>span{
  position:absolute;
  width:1px;
  height:1px;
  padding:0;
  margin:-1px;
  overflow:hidden;
  clip:rect(0,0,0,0);
  white-space:nowrap;
  border:0;
}
.catalog-filter .filter-search{
  flex:1 1 240px;
}
.filter-selects{
  display:flex;
  align-items:center;
  gap:8px;
  min-width:0;
}
.filter-selects label{
  flex:0 0 auto;
}
.catalog-filter input,
.catalog-filter select{
  width:100%;
  height:38px;
  margin-top:0;
  box-sizing:border-box;
  border:1px solid #d9e2ec;
  border-radius:999px;
  background:#fff;
  padding:0 14px;
  color:#101828;
  outline:none;
}
.catalog-filter select{
  width:auto;
  min-width:112px;
  padding-right:30px;
}
.catalog-filter input:focus,
.catalog-filter select:focus{
  border-color:#1677ff;
  box-shadow:0 0 0 3px rgba(22,119,255,.1);
}
.catalog-filter button{
  height:38px;
  padding:0 14px;
  border-radius:999px;
  white-space:nowrap;
}
.product-table-list{
  border:1.5px solid #d8e4f2;
  border-radius:16px;
  overflow:hidden;
  background:#fff;
}
.product-table-row{
  display:grid;
  grid-template-columns:minmax(220px,1.6fr) minmax(100px,.72fr) minmax(150px,.9fr) minmax(90px,.55fr) minmax(150px,.82fr);
  gap:12px;
  align-items:center;
  padding:12px 14px;
  border-bottom:1px solid #edf2f7;
}
.product-table-row:not(.product-table-head){
  transition:background .18s ease, box-shadow .18s ease, transform .18s ease;
}
.product-table-row:not(.product-table-head):hover{
  background:#fbfdff;
  box-shadow:inset 3px 0 0 #1677ff;
}
.product-table-row:last-of-type{border-bottom:0}
.product-table-head{
  position:sticky;
  top:0;
  z-index:2;
  background:#f8fafc;
  color:#667085;
  font-size:12px;
  font-weight:900;
}
.product-main{
  min-width:0;
  display:flex;
  align-items:center;
  gap:10px;
}
.product-thumb{
  width:40px;
  height:40px;
  border-radius:11px;
  flex:0 0 40px;
  overflow:hidden;
  background:linear-gradient(135deg,#e8f1ff,#fff6ed);
  border:1px solid #d9e6f8;
}
.product-thumb img{
  width:100%;
  height:100%;
  display:block;
  object-fit:cover;
}
.product-thumb i{
  width:100%;
  height:100%;
  display:grid;
  place-items:center;
  color:#1677ff;
  font-style:normal;
  font-size:18px;
  font-weight:900;
}
.product-copy{
  min-width:0;
}
.product-copy b,
.product-copy small,
.product-copy em{
  display:block;
}
.product-copy b{
  color:#101828;
  font-size:15px;
  line-height:1.35;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.product-copy small{
  margin-top:3px;
  color:#667085;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.product-copy em{
  margin-top:4px;
  color:#b42318;
  font-size:12px;
  font-style:normal;
}
.product-table-row>span{
  color:#475467;
}
.product-type-cell{
  display:inline-flex;
  width:max-content;
  min-height:24px;
  align-items:center;
  padding:0 9px;
  border:1px solid #d9e6f8;
  border-radius:999px;
  background:#f7faff;
  color:#344054;
  font-size:12px;
  font-weight:800;
}
.product-table-row .product-price{
  color:#1677ff;
  font-size:17px;
  line-height:1;
}
.status-stack{
  display:flex;
  gap:7px;
  flex-wrap:wrap;
}
.status-stack i{
  display:inline-flex;
  align-items:center;
  min-height:24px;
  padding:0 8px;
  border:1px solid #d9e2ec;
  border-radius:8px;
  font-size:12px;
  font-style:normal;
}
.shelf.online{background:#eef5ff;color:#175cd3;border-color:#b2ccff}
.shelf.offline{background:#f8fafc;color:#667085;border-color:#d9e2ec}
.table-actions{
  display:flex;
  justify-content:flex-end;
  gap:8px;
  flex-wrap:wrap;
}
.table-actions button{
  min-width:52px;
  height:32px;
  border:1px solid #d9e2ec;
  border-radius:999px;
  background:#fff;
  color:#101828;
  font-weight:800;
  cursor:pointer;
}
.table-actions button:first-child{
  background:#f8fafc;
}
.table-actions .offline{
  border-color:#fecdca;
  background:#fef3f2;
  color:#b42318;
}
.table-actions .online{
  border-color:#abefc6;
  background:#ecfdf3;
  color:#067647;
}
.table-actions button:disabled{
  cursor:not-allowed;
  opacity:.5;
}
.tags span{
  border-radius:7px;
  background:#f8fafc;
  border-color:#e8edf3;
}
.review.pending{background:#fffaeb;color:#b54708;border-color:#fedf89}
.review.approved{background:#ecfdf3;color:#067647;border-color:#abefc6}
.review.rejected{background:#fef3f2;color:#b42318;border-color:#fecdca}
.form-page{
  display:block;
  min-height:auto;
}
.form-page .panel-head{
  position:sticky;
  top:0;
  z-index:4;
  margin:-22px -22px 22px;
  padding:20px 22px 18px;
  background:#fff;
  border-radius:18px 18px 0 0;
}
.page-actions{
  display:flex;
  gap:10px;
  flex-wrap:wrap;
  justify-content:flex-end;
}
.form-page .product-form{
  max-width:920px;
  margin:0 auto;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:16px;
}
.form-page .product-form .wide{grid-column:1/-1}
.product-form label,.auth-card label{color:#344054}
.product-form input,.product-form select,.product-form textarea,.auth-card input,.auth-card textarea{
  min-height:42px;
  border-radius:10px;
  border-color:#d9e2ec;
  background:#fff;
}
.product-form textarea{resize:vertical}
.product-form input:focus,.product-form select:focus,.product-form textarea:focus,.auth-card input:focus,.auth-card textarea:focus{
  border-color:#1677ff;
  box-shadow:0 0 0 3px rgba(22,119,255,.1);
}
.orders-panel .orders{
  max-height:calc(100vh - 230px);
  border-radius:14px;
  border-color:#e8edf3;
}
.orders-panel .row.head{
  position:sticky;
  top:0;
  z-index:2;
  background:#f8fafc;
  border-radius:0;
}
.support-panel .support-layout{
  height:calc(100vh - 244px);
  min-height:560px;
}
.support-summary{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:12px;
  margin-bottom:16px;
}
.support-summary article{
  border:1.5px solid #d2e2f6;
  border-radius:14px;
  background:#f8fbff;
  padding:14px 16px;
}
.support-summary b,
.support-summary span{
  display:block;
}
.support-summary b{
  color:#101828;
  font-size:26px;
  line-height:1;
}
.support-summary span{
  margin-top:8px;
  color:#667085;
  font-size:13px;
}
.support-panel .support-layout{
  grid-template-columns:340px minmax(0,1fr);
  gap:18px;
}
.support-panel .support-list{
  border:1.5px solid #d8e4f2;
  border-radius:18px;
  background:#f8fafc;
  padding:12px;
}
.support-panel .support-list button{
  border:1px solid #e1e8f0;
  border-radius:14px;
  background:#fff;
  box-shadow:0 6px 16px rgba(15,23,42,.035);
}
.support-panel .support-list button.active{
  border-color:#1677ff;
  background:#eef5ff;
  box-shadow:0 10px 24px rgba(22,119,255,.12);
}
.support-panel .support-chat{
  border:1.5px solid #d2e2f6;
  border-radius:18px;
  background:#fff;
  box-shadow:0 10px 28px rgba(15,23,42,.05);
}
.support-panel .chat-head{
  background:linear-gradient(180deg,#fff,#f8fbff);
}
.support-panel .chat-body{
  background:#f6f8fb;
}
.support-panel .chat-composer{
  gap:12px;
}
.support-panel .chat-composer input{
  background:#fff;
  border-color:#d9e2ec;
}
.support-panel .chat-upload{
  min-width:64px;
  border-radius:12px;
  background:#eef5ff;
  color:#1677ff;
  border-color:#c9dcff;
}
@media(max-width:1080px){
  .overview-grid,.quick-actions{grid-template-columns:repeat(2,minmax(0,1fr))}
  .catalog-list{grid-template-columns:1fr}
  .catalog-filter{
    align-items:stretch;
    flex-direction:column;
  }
  .catalog-filter .filter-search{
    flex:auto;
  }
  .filter-selects{
    overflow-x:auto;
    padding-bottom:2px;
    scrollbar-width:none;
  }
  .filter-selects::-webkit-scrollbar{display:none}
  .filter-selects select{
    min-width:108px;
  }
  .filter-selects button{
    flex:0 0 auto;
  }
  .product-table-list{
    border:0;
    background:transparent;
    display:grid;
    gap:12px;
    overflow:visible;
  }
  .product-table-head{
    display:none;
  }
  .product-table-row{
    grid-template-columns:minmax(0,1fr) auto;
    gap:10px 12px;
    border:1.5px solid #d8e4f2;
    border-radius:14px;
    background:#fff;
    padding:12px;
    box-shadow:0 8px 22px rgba(15,23,42,.04);
  }
  .product-table-row:not(.product-table-head):hover{
    box-shadow:0 12px 26px rgba(22,119,255,.1);
  }
  .product-main{
    align-items:flex-start;
    grid-column:1/-1;
  }
  .product-thumb{
    width:42px;
    height:42px;
    flex-basis:42px;
    border-radius:12px;
  }
  .product-copy b{
    font-size:16px;
  }
  .product-copy small{
    white-space:normal;
    line-height:1.45;
    display:-webkit-box;
    -webkit-box-orient:vertical;
    -webkit-line-clamp:2;
  }
  .product-type-cell{
    width:max-content;
    grid-column:1;
  }
  .status-stack{
    grid-column:1/-1;
    margin-top:0;
  }
  .product-table-row .product-price{
    grid-column:1;
    padding-top:0;
    border-top:0;
    font-size:20px;
  }
  .table-actions{
    grid-column:2;
    grid-row:4;
    justify-content:flex-end;
    gap:8px;
  }
  .table-actions button{
    flex:0 0 auto;
    height:32px;
    min-width:52px;
  }
  .support-panel .support-layout{
    grid-template-columns:1fr;
    height:auto;
    min-height:0;
  }
  .support-panel .support-list{
    max-height:280px;
  }
  .support-panel .support-chat{
    min-height:620px;
  }
}
@media(max-width:760px){
  .merchant-app{padding:12px}
  .hero{height:auto;padding:14px;align-items:flex-start}
  .merchant-workbench{gap:12px}
  .workspace-panel{min-height:0;padding:16px}
  .workspace-panel>.panel-head,
  .form-page .panel-head{
    position:static;
    margin:0 0 16px;
    padding:0 0 16px;
    border-radius:0;
  }
  .overview-grid,.quick-actions,.form-page .product-form{grid-template-columns:1fr}
  .catalog-list .card-side{align-items:flex-start;flex-direction:column}
  .page-actions{width:100%;justify-content:flex-start}
  .page-actions button{flex:1}
  .support-summary{
    grid-template-columns:1fr;
  }
  .support-panel .support-list{
    max-height:240px;
  }
  .support-panel .support-chat{
    min-height:560px;
  }
  .support-panel .chat-composer{
    align-items:stretch;
  }
}

@media(max-width:1280px){
  .merchant-workbench{
    grid-template-columns:1fr;
    max-width:960px;
  }
  .merchant-sidebar{
    position:static;
    max-height:none;
    overflow:visible;
    display:grid;
    grid-template-columns:1fr;
  }
  .merchant-sidebar .school-card{
    display:flex;
    align-items:center;
    gap:16px;
  }
  .merchant-sidebar .school-logo{
    margin:0;
    flex:0 0 54px;
  }
  .merchant-sidebar .stats{
    grid-template-columns:repeat(4,minmax(0,1fr));
  }
  .merchant-sidebar .merchant-tabs{
    display:grid;
    grid-template-columns:repeat(5,minmax(0,1fr));
    gap:8px;
    overflow:visible;
  }
  .merchant-sidebar .merchant-tabs button{
    justify-content:center;
    min-width:0;
    padding:0 10px;
    white-space:normal;
  }
  .workspace-panel{
    min-height:auto;
  }
}

@media(max-width:760px){
  .merchant-app{
    padding:10px;
  }
  .hero{
    gap:12px;
    flex-wrap:wrap;
  }
  .hero .brand{
    min-width:0;
  }
  .hero .brand span{
    line-height:1.45;
  }
  .hero .ghost{
    width:100%;
  }
  .merchant-sidebar .school-card{
    display:block;
    padding:16px;
  }
  .merchant-sidebar .school-logo{
    margin-bottom:12px;
  }
  .merchant-sidebar .stats{
    grid-template-columns:repeat(2,minmax(0,1fr));
  }
  .merchant-sidebar .merchant-tabs{
    grid-template-columns:repeat(2,minmax(0,1fr));
  }
  .merchant-sidebar .merchant-tabs button{
    justify-content:flex-start;
    min-height:44px;
  }
  .workspace-panel>.panel-head{
    align-items:flex-start;
  }
}

@media(min-width:761px) and (max-width:1280px){
  .product-table-list{
    border:1.5px solid #d8e4f2;
    border-radius:16px;
    background:#fff;
    display:block;
    overflow:hidden;
  }
  .product-table-head{
    display:grid;
  }
  .product-table-row{
    grid-template-columns:minmax(220px,1.55fr) minmax(92px,.55fr) minmax(142px,.82fr) minmax(76px,.45fr) minmax(126px,.72fr);
    gap:10px;
    border:0;
    border-bottom:1px solid #edf2f7;
    border-radius:0;
    box-shadow:none;
    padding:12px 14px;
  }
  .product-table-row:last-of-type{
    border-bottom:0;
  }
  .product-main,
  .product-type-cell,
  .status-stack,
  .product-table-row .product-price,
  .table-actions{
    grid-column:auto;
    grid-row:auto;
  }
  .product-main{
    align-items:center;
  }
  .table-actions{
    justify-content:flex-end;
  }
}

@media(max-width:420px){
  .merchant-sidebar .merchant-tabs{
    grid-template-columns:1fr;
  }
  .overview-grid,
  .quick-actions{
    grid-template-columns:1fr;
  }
}

.hero,
.merchant-sidebar .school-card,
.merchant-sidebar .stats,
.merchant-sidebar .merchant-tabs,
.workspace-panel{
  background:#fff;
  border-color:#dde7f4;
  box-shadow:
    0 18px 44px rgba(15,23,42,.1),
    0 3px 10px rgba(15,23,42,.05);
}
.merchant-sidebar .school-card,
.merchant-sidebar .stats,
.merchant-sidebar .merchant-tabs{
  box-shadow:
    0 14px 34px rgba(15,23,42,.085),
    0 2px 8px rgba(15,23,42,.04);
}
.workspace-panel{
  box-shadow:
    0 22px 56px rgba(15,23,42,.12),
    0 4px 12px rgba(15,23,42,.05);
}
.merchant-sidebar .stats div{
  background:#f6f9ff;
  border:1px solid #e2ebf7;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.78);
}
.merchant-sidebar .merchant-tabs button:not(.active){
  background:#f8fbff;
}
.overview-grid button,
.catalog-filter,
.product-table-list,
.product-table-row,
.support-summary article,
.support-panel .support-list,
.support-panel .support-chat{
  box-shadow:
    0 14px 34px rgba(15,23,42,.08),
    0 2px 8px rgba(15,23,42,.04);
}
.product-table-row{
  border-color:#d7e4f4;
}
.product-table-row:not(.product-table-head){
  background:#fff;
}
.product-table-row:not(.product-table-head):hover{
  box-shadow:
    inset 3px 0 0 #1677ff,
    0 16px 38px rgba(22,119,255,.12);
}
.form-page .product-form{
  padding:18px;
  border:1.5px solid #dce8f6;
  border-radius:18px;
  background:#fbfdff;
  box-shadow:
    0 16px 38px rgba(15,23,42,.075),
    inset 0 1px 0 rgba(255,255,255,.85);
}
.product-form input,
.product-form select,
.product-form textarea,
.auth-card input,
.auth-card textarea{
  border-color:#cddbef;
  background:#fff;
  box-shadow:0 1px 2px rgba(15,23,42,.035);
}
.primary{
  box-shadow:0 14px 28px rgba(22,119,255,.26);
}
.ghost{
  box-shadow:0 8px 18px rgba(15,23,42,.06);
}

.support-panel{
  display:flex;
  flex-direction:column;
  height:calc(100vh - 126px);
  min-height:640px;
  overflow:hidden;
}
.support-panel>.panel-head{
  flex:0 0 auto;
  min-height:auto;
  margin-bottom:12px;
  padding-bottom:12px;
}
.support-panel>.panel-head h2{
  font-size:22px;
}
.support-summary{
  flex:0 0 auto;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:10px;
  margin-bottom:12px;
}
.support-summary article{
  padding:10px 12px;
  border-radius:12px;
}
.support-summary b{
  font-size:22px;
}
.support-summary span{
  margin-top:5px;
  font-size:12px;
}
.support-panel .support-layout{
  flex:1 1 auto;
  min-height:0;
  height:auto;
  display:grid;
  grid-template-columns:280px minmax(0,1fr);
  gap:14px;
  overflow:hidden;
}
.support-panel .support-list{
  height:100%;
  min-height:0;
  max-height:none;
  overflow-y:auto;
  padding:10px;
  align-content:start;
}
.support-panel .support-list button{
  padding:12px 36px 12px 12px;
  border-radius:12px;
}
.support-panel .support-list b{
  font-size:14px;
}
.support-panel .support-list span,
.support-panel .support-list small{
  font-size:12px;
}
.support-panel .support-chat{
  height:100%;
  min-height:0;
  display:flex;
  flex-direction:column;
  overflow:hidden;
}
.support-panel .chat-head{
  flex:0 0 auto;
  padding:14px 16px;
}
.support-panel .chat-body{
  flex:1 1 auto;
  min-height:0;
  overflow-y:auto;
  padding:16px;
}
.support-panel .chat-composer{
  flex:0 0 auto;
  position:relative;
  bottom:auto;
  padding:12px;
  border-top:1px solid #d8e4f2;
  background:#fff;
}
.support-panel .chat-composer input{
  min-height:40px;
}
.support-panel .chat-composer .primary{
  min-width:72px;
}

@media(min-width:761px) and (max-width:1280px){
  .support-panel{
    height:calc(100vh - 118px);
    min-height:600px;
  }
  .support-panel .support-layout{
    grid-template-columns:260px minmax(0,1fr);
    height:auto;
    min-height:0;
  }
  .support-panel .support-list{
    max-height:none;
  }
  .support-panel .support-chat{
    min-height:0;
  }
}

@media(max-width:760px){
  .support-panel{
    height:auto;
    min-height:0;
    overflow:visible;
  }
  .support-panel .support-layout{
    grid-template-columns:1fr;
    height:auto;
    overflow:visible;
  }
  .support-summary{
    grid-template-columns:repeat(3,minmax(0,1fr));
  }
  .support-panel .support-list{
    height:auto;
    max-height:180px;
  }
  .support-panel .support-chat{
    height:68vh;
    min-height:460px;
  }
  .support-panel .chat-composer{
    display:grid;
    grid-template-columns:auto minmax(0,1fr) auto;
  }
}

@media(max-width:520px){
  .support-summary{
    grid-template-columns:1fr;
  }
  .support-panel .chat-composer{
    grid-template-columns:1fr;
  }
}

.orders-panel .orders{
  overflow:hidden;
}
.orders-panel .row{
  grid-template-columns:minmax(180px,2fr) .65fr .65fr .75fr 1.1fr .55fr;
}
.orders-panel .order-row{
  width:100%;
  border:0;
  border-bottom:1px solid #edf2f7;
  background:#fff;
  color:#101828;
  text-align:left;
  cursor:pointer;
  transition:background .16s ease, box-shadow .16s ease;
}
.orders-panel .order-row:hover{
  background:#f8fbff;
  box-shadow:inset 3px 0 0 #1677ff;
}
.orders-panel .order-row i{
  display:inline-flex;
  min-height:28px;
  align-items:center;
  padding:0 10px;
  border:1px solid #c9dcff;
  border-radius:999px;
  background:#eef5ff;
  color:#1677ff;
  font-style:normal;
  font-size:12px;
  font-weight:900;
}
.study-order-modal{
  width:min(720px,92vw);
}
.study-order-modal .order-detail-grid{
  grid-template-columns:repeat(3,minmax(0,1fr));
}
.study-order-modal .order-detail-grid div:nth-child(9),
.study-order-modal .order-detail-grid div:nth-child(10),
.study-order-modal .order-detail-grid div:nth-child(11){
  grid-column:span 3;
}
.slider-modal-mask{
  position:fixed;
  inset:0;
  z-index:90;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:24px;
  background:rgba(15,23,42,.42);
  backdrop-filter:blur(8px);
}
.slider-modal{
  width:min(420px,100%);
  padding:18px;
  border-radius:18px;
  background:#fff;
  box-shadow:0 28px 80px rgba(15,23,42,.28);
}
.slider-modal-head{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:16px;
  margin-bottom:14px;
}
.slider-modal-head h2{
  margin:0;
  color:#172033;
  font-size:19px;
}
.slider-modal-head p{
  margin:4px 0 0;
  color:#788397;
  font-size:13px;
}
.slider-modal-head button{
  width:34px;
  height:34px;
  border:0;
  border-radius:50%;
  background:#f1f5f9;
  color:#475569;
  font-size:22px;
  font-weight:800;
  line-height:1;
}

@media(max-width:760px){
  .orders-panel .row{
    grid-template-columns:1.6fr .55fr .65fr .72fr auto;
    gap:8px;
  }
  .orders-panel .row span:nth-child(5){
    display:none;
  }
  .study-order-modal .order-detail-grid{
    grid-template-columns:1fr;
  }
  .study-order-modal .order-detail-grid div:nth-child(9),
  .study-order-modal .order-detail-grid div:nth-child(10),
  .study-order-modal .order-detail-grid div:nth-child(11){
    grid-column:auto;
  }
}
</style>

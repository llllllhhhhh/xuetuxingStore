<template>
  <section class="product-editor-page">
    <header class="editor-topbar">
      <button class="back-button" type="button" @click="emit('back')">
        <span aria-hidden="true">←</span>
        返回学习产品
      </button>
      <div class="editor-title">
        <small>{{ product.id ? 'EDIT PRODUCT' : 'NEW PRODUCT' }}</small>
        <h1>{{ product.id ? '编辑学习产品' : '新增学习产品' }}</h1>
        <p>完善权益与学习内容，提交后由平台审核上架。</p>
      </div>
      <div class="editor-actions">
        <span>{{ product.id ? '修改后重新审核' : '新建草稿' }}</span>
        <button class="save-button" type="button" :disabled="saving" @click="emit('save')">
          {{ saving ? '提交中...' : (product.id ? '保存并送审' : '提交审核') }}
        </button>
      </div>
    </header>

    <div class="builder-layout">
      <div class="builder-form">
        <section class="builder-section">
          <div class="section-heading">
            <span>01</span>
            <div><h2>产品定位</h2><p>先确定产品类型与用户看到的核心卖点。</p></div>
          </div>

          <div class="type-options">
            <button
              v-for="item in productTypes"
              :key="item.value"
              type="button"
              :class="['type-option', { active: product.product_type === item.value }]"
              @click="product.product_type = item.value"
            >
              <i>{{ item.icon }}</i>
              <span><b>{{ item.label }}</b><small>{{ item.description }}</small></span>
              <em>{{ product.product_type === item.value ? '已选择' : '选择' }}</em>
            </button>
          </div>

          <div class="form-grid two-columns">
            <label class="field wide-field">
              <span>产品名称 <b>*</b></span>
              <input v-model.trim="product.name" maxlength="160" placeholder="例如：上岸督学社群（月卡）">
              <small>名称会展示在列表、详情与订单中。</small>
            </label>
            <label class="field wide-field">
              <span>一句话卖点</span>
              <input v-model.trim="product.subtitle" maxlength="255" placeholder="例如：每日打卡、资料分享、学长答疑">
              <small>用一句话说明适合谁、解决什么问题。</small>
            </label>
          </div>
        </section>

        <section class="builder-section">
          <div class="section-heading">
            <span>02</span>
            <div><h2>封面与服务介绍</h2><p>用户会先看到封面，再决定是否继续了解服务。</p></div>
          </div>

          <div class="cover-editor">
            <div class="cover-preview">
              <img :src="coverBroken ? fallbackCover : previewCover" alt="产品封面预览" @error="coverBroken = true">
              <span>{{ typeName(product.product_type) }}</span>
            </div>
            <div class="cover-fields">
              <label class="field">
                <span>封面图片 URL</span>
                <input v-model.trim="product.cover" placeholder="https://...">
                <small>建议使用横版图片，推荐比例 16:9。</small>
              </label>
              <label class="field">
                <span>服务介绍</span>
                <textarea v-model.trim="product.description" rows="6" placeholder="介绍适合人群、服务方式、交付周期和学习目标"></textarea>
              </label>
            </div>
          </div>
        </section>

        <section class="builder-section">
          <div class="section-heading">
            <span>03</span>
            <div><h2>价格与销售设置</h2><p>配置用户购买时看到的价格、周期和库存。</p></div>
          </div>

          <div class="form-grid sales-grid">
            <label class="field price-field">
              <span>售卖价格 <b>*</b></span>
              <div class="input-prefix"><i>¥</i><input v-model.number="product.price" type="number" min="0" step="0.01"></div>
            </label>
            <label class="field price-field">
              <span>划线价格</span>
              <div class="input-prefix"><i>¥</i><input v-model.number="product.original_price" type="number" min="0" step="0.01"></div>
            </label>
            <label class="field">
              <span>计费周期</span>
              <select v-model="product.billing_cycle">
                <option value="once">一次性购买</option>
                <option value="month">按月</option>
                <option value="year">按年</option>
              </select>
            </label>
            <label class="field">
              <span>库存</span>
              <input v-model.number="product.stock" type="number" min="-1">
              <small>填写 -1 表示不限量。</small>
            </label>
            <label class="field">
              <span>免费试看分钟</span>
              <input v-model.number="product.trial_minutes" type="number" min="0">
            </label>
            <label class="field" :class="{ disabled: !product.installment_enabled }">
              <span>最多分期期数</span>
              <select v-model.number="product.installment_count" :disabled="!product.installment_enabled">
                <option :value="1">1 期</option>
                <option :value="3">3 期</option>
                <option :value="6">6 期</option>
                <option :value="12">12 期</option>
                <option :value="24">24 期</option>
              </select>
            </label>
          </div>

          <div class="setting-list">
            <label class="switch-setting">
              <input v-model="product.featured" type="checkbox">
              <span class="switch-ui"></span>
              <span><b>推荐产品</b><small>审核上架后优先参与用户端推荐展示。</small></span>
            </label>
            <label class="switch-setting">
              <input v-model="product.installment_enabled" type="checkbox">
              <span class="switch-ui"></span>
              <span><b>支持分期</b><small>适合客单价较高的长期学习服务。</small></span>
            </label>
          </div>
        </section>

        <section class="builder-section">
          <div class="section-heading section-heading-action">
            <span>04</span>
            <div><h2>购买权益</h2><p>像用户端详情页一样逐条展示，不再填写整段文本。</p></div>
            <button type="button" @click="addBenefit">＋ 添加权益</button>
          </div>

          <div v-if="product.benefits.length" class="benefit-editor-list">
            <div v-for="(benefit, index) in product.benefits" :key="index" class="benefit-editor-row">
              <span>{{ String(index + 1).padStart(2, '0') }}</span>
              <input v-model.trim="product.benefits[index]" maxlength="120" placeholder="例如：每日督学打卡">
              <button type="button" title="删除权益" aria-label="删除权益" @click="removeBenefit(index)">×</button>
            </div>
          </div>
          <button v-else class="empty-add-button" type="button" @click="addBenefit">添加第一条购买权益</button>
        </section>

        <section class="builder-section content-builder-section">
          <div class="section-heading section-heading-action">
            <span>05</span>
            <div><h2>课程与资料</h2><p>添加用户购买后获得的课程、资料、测评或直播服务。</p></div>
            <button type="button" @click="addContent">＋ 添加内容</button>
          </div>

          <div v-if="product.contents.length" class="content-editor-list">
            <article v-for="(content, index) in product.contents" :key="content.id || index" class="content-editor-item">
              <header>
                <div><span>{{ String(index + 1).padStart(2, '0') }}</span><b>{{ content.title || '未命名内容' }}</b></div>
                <div class="content-item-actions">
                  <button type="button" title="上移" aria-label="上移" :disabled="index === 0" @click="moveContent(index, -1)">↑</button>
                  <button type="button" title="下移" aria-label="下移" :disabled="index === product.contents.length - 1" @click="moveContent(index, 1)">↓</button>
                  <button type="button" title="删除内容" aria-label="删除内容" @click="removeContent(index)">×</button>
                </div>
              </header>
              <div class="form-grid content-grid">
                <label class="field">
                  <span>内容名称</span>
                  <input v-model.trim="content.title" maxlength="160" placeholder="例如：入学规划与目标拆解">
                </label>
                <label class="field">
                  <span>内容类型</span>
                  <select v-model="content.content_type">
                    <option value="lesson">课程</option>
                    <option value="material">资料</option>
                    <option value="test">测评</option>
                    <option value="live">直播</option>
                    <option value="service">服务</option>
                  </select>
                </label>
                <label class="field wide-field">
                  <span>内容摘要</span>
                  <input v-model.trim="content.summary" maxlength="255" placeholder="说明这一项内容能帮助用户完成什么">
                </label>
                <label class="field wide-field">
                  <span>资源 URL</span>
                  <input v-model.trim="content.resource_url" placeholder="课程、资料或直播地址，可在审核前补充">
                </label>
                <label class="field">
                  <span>时长（分钟）</span>
                  <input v-model.number="content.duration_minutes" type="number" min="0">
                </label>
                <div class="content-switches">
                  <label class="compact-check"><input v-model="content.preview" type="checkbox"><span>允许试看</span></label>
                  <label class="compact-check"><input v-model="content.status" type="checkbox"><span>启用内容</span></label>
                </div>
              </div>
            </article>
          </div>
          <button v-else class="empty-add-button" type="button" @click="addContent">添加第一项课程或资料</button>
        </section>
      </div>

      <aside class="preview-pane">
        <div class="preview-pane-head">
          <div><b>用户端实时预览</b><span>输入内容后会同步更新</span></div>
          <em>H5</em>
        </div>

        <div class="detail-preview">
          <div class="detail-cover">
            <img :src="coverBroken ? fallbackCover : previewCover" alt="">
            <div class="cover-shade"></div>
            <span>{{ typeName(product.product_type) }}</span>
          </div>
          <div class="detail-body">
            <section class="preview-summary">
              <div class="preview-summary-top"><i>{{ cycleName(product.billing_cycle) }}</i><span>0 人已加入</span></div>
              <h2>{{ product.name || '请输入产品名称' }}</h2>
              <p>{{ product.subtitle || '一句清晰的产品卖点会显示在这里' }}</p>
              <div class="preview-price">
                <strong><small>¥</small>{{ displayPrice }}<em>{{ cycleShort(product.billing_cycle) }}</em></strong>
                <del v-if="Number(product.original_price)">原价 ¥{{ product.original_price }}</del>
              </div>
            </section>

            <section class="preview-section">
              <header><i class="orange">礼</i><span><b>你将获得</b><small>购买后立即解锁以下权益</small></span></header>
              <div class="preview-benefits">
                <div v-for="(benefit, index) in previewBenefits" :key="`${benefit}-${index}`">
                  <span>{{ String(index + 1).padStart(2, '0') }}</span><b>{{ benefit }}</b>
                </div>
              </div>
            </section>

            <section class="preview-section">
              <header><i class="green">介</i><span><b>服务介绍</b><small>适合人群与服务方式</small></span></header>
              <p class="preview-description">{{ product.description || '服务介绍将在这里展示。' }}</p>
            </section>

            <section class="preview-section">
              <header><i class="blue">学</i><span><b>课程与资料</b><small>带“试看”的内容可免费体验</small></span></header>
              <div class="preview-content-list">
                <div v-for="(content, index) in previewContents" :key="content.id || index">
                  <i>{{ index + 1 }}</i>
                  <span><b>{{ content.title }}</b><small>{{ content.summary || contentTypeName(content.content_type) }}</small></span>
                  <em>{{ content.preview ? `${Number(content.duration_minutes || 0)}分钟` : '待解锁' }}</em>
                </div>
              </div>
            </section>
          </div>
          <div class="preview-purchase-bar"><span>本次应付 <b>¥{{ displayPrice }}</b></span><button type="button">去收银台</button></div>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const product = defineModel('product', { required: true })
defineProps({ saving: { type: Boolean, default: false } })
const emit = defineEmits(['back', 'save'])

const fallbackCover = 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1000'
const coverBroken = ref(false)
const productTypes = [
  { value: 'community', icon: '群', label: '付费社群', description: '督学、答疑与社群陪伴' },
  { value: 'package', icon: '课', label: '长期套餐', description: '课程、规划与阶段服务' },
  { value: 'material', icon: '资', label: '资料包', description: '电子资料与备考工具' },
]

const previewCover = computed(() => product.value.cover || fallbackCover)
const previewBenefits = computed(() => {
  const rows = (product.value.benefits || []).map(item => String(item || '').trim()).filter(Boolean)
  return rows.length ? rows : ['权益内容将在这里展示']
})
const previewContents = computed(() => {
  const rows = (product.value.contents || []).filter(item => item.status !== false && String(item.title || '').trim())
  return rows.length ? rows : [{ title: '课程与资料将在这里展示', summary: '添加内容后可查看用户端效果', content_type: 'lesson', duration_minutes: 0, preview: false }]
})
const displayPrice = computed(() => Number(product.value.price || 0).toFixed(2))

const typeName = value => ({ community: '督学社群', package: '长期备考套餐', material: '付费资料包' }[value] || '学习服务')
const cycleName = value => ({ month: '月度会员', year: '年度会员', once: '一次性购买' }[value] || '一次性购买')
const cycleShort = value => ({ month: '/月', year: '/年', once: '起' }[value] || '')
const contentTypeName = value => ({ lesson: '课程', material: '资料', test: '测评', live: '直播', service: '服务' }[value] || '学习内容')

const ensureCollections = () => {
  if (!Array.isArray(product.value.benefits)) product.value.benefits = []
  if (!Array.isArray(product.value.contents)) product.value.contents = []
}

const addBenefit = () => {
  ensureCollections()
  product.value.benefits.push('')
}

const removeBenefit = index => {
  product.value.benefits.splice(index, 1)
}

const addContent = () => {
  ensureCollections()
  product.value.contents.push({
    title: '',
    content_type: 'lesson',
    summary: '',
    resource_url: '',
    duration_minutes: 0,
    preview: false,
    sort_order: product.value.contents.length + 1,
    status: true,
  })
}

const removeContent = index => {
  product.value.contents.splice(index, 1)
}

const moveContent = (index, direction) => {
  const target = index + direction
  if (target < 0 || target >= product.value.contents.length) return
  const [item] = product.value.contents.splice(index, 1)
  product.value.contents.splice(target, 0, item)
}

watch(() => product.value.cover, () => { coverBroken.value = false })
ensureCollections()
</script>

<style scoped>
.product-editor-page{max-width:1440px;margin:0 auto;color:#17212b}
.editor-topbar{position:sticky;top:0;z-index:20;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:20px;margin-bottom:18px;padding:18px 20px;border:1px solid #dce6f2;border-radius:8px;background:rgba(255,255,255,.97);box-shadow:0 14px 34px rgba(15,23,42,.08);backdrop-filter:blur(12px)}
.back-button{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 14px;border:1px solid #d7e1ec;border-radius:7px;background:#fff;color:#344054;font-weight:800;cursor:pointer}.back-button span{font-size:20px}.back-button:hover{border-color:#1677ff;color:#1677ff}
.editor-title small,.editor-title h1,.editor-title p{display:block;margin:0}.editor-title small{color:#1677ff;font-size:11px;font-weight:900}.editor-title h1{margin-top:3px;font-size:23px}.editor-title p{margin-top:4px;color:#667085;font-size:13px}
.editor-actions{display:flex;align-items:center;gap:12px}.editor-actions>span{color:#667085;font-size:12px}.save-button{min-width:128px;height:42px;border:0;border-radius:7px;background:#1677ff;color:#fff;font-weight:900;cursor:pointer;box-shadow:0 10px 22px rgba(22,119,255,.22)}.save-button:hover{background:#0f66df}.save-button:disabled{cursor:not-allowed;opacity:.55}
.builder-layout{display:grid;grid-template-columns:minmax(0,1fr) 410px;gap:20px;align-items:start}.builder-form{overflow:hidden;border:1px solid #dce6f2;border-radius:8px;background:#fff;box-shadow:0 18px 42px rgba(15,23,42,.07)}
.builder-section{padding:28px;border-bottom:1px solid #e8eef5}.builder-section:last-child{border-bottom:0}.section-heading{display:grid;grid-template-columns:44px minmax(0,1fr);align-items:start;gap:14px;margin-bottom:22px}.section-heading>span{display:grid;width:40px;height:40px;place-items:center;border-radius:7px;background:#eef5ff;color:#1677ff;font-size:13px;font-weight:900}.section-heading h2,.section-heading p{margin:0}.section-heading h2{font-size:19px}.section-heading p{margin-top:5px;color:#667085;font-size:13px;line-height:1.55}.section-heading-action{grid-template-columns:44px minmax(0,1fr) auto}.section-heading-action>button,.empty-add-button{min-height:38px;padding:0 14px;border:1px solid #b9d1f6;border-radius:7px;background:#f4f8ff;color:#175cd3;font-weight:800;cursor:pointer}
.type-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.type-option{display:grid;grid-template-columns:42px minmax(0,1fr) auto;align-items:center;gap:11px;min-height:76px;padding:13px;border:1.5px solid #dce6f2;border-radius:8px;background:#fff;text-align:left;color:#344054;cursor:pointer}.type-option i{display:grid;width:40px;height:40px;place-items:center;border-radius:7px;background:#f2f4f7;color:#475467;font-style:normal;font-weight:900}.type-option b,.type-option small{display:block}.type-option b{font-size:14px}.type-option small{margin-top:4px;color:#667085;font-size:11px;line-height:1.4}.type-option em{color:#98a2b3;font-size:11px;font-style:normal}.type-option.active{border-color:#1677ff;background:#f4f8ff;box-shadow:0 8px 20px rgba(22,119,255,.1)}.type-option.active i{background:#1677ff;color:#fff}.type-option.active em{color:#175cd3;font-weight:800}
.form-grid{display:grid;gap:16px;margin-top:20px}.two-columns{grid-template-columns:repeat(2,minmax(0,1fr))}.sales-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.content-grid{grid-template-columns:repeat(2,minmax(0,1fr));margin-top:0}.wide-field{grid-column:1/-1}.field>span,.field>small{display:block}.field>span{margin-bottom:7px;color:#344054;font-size:12px;font-weight:800}.field>span b{color:#d92d20}.field>small{margin-top:6px;color:#98a2b3;font-size:11px;line-height:1.45}.field input,.field select,.field textarea{width:100%;box-sizing:border-box;border:1px solid #cdd9e8;border-radius:6px;background:#fff;color:#101828;font:inherit;outline:none}.field input,.field select{height:43px;padding:0 12px}.field textarea{padding:11px 12px;line-height:1.6;resize:vertical}.field input:focus,.field select:focus,.field textarea:focus{border-color:#1677ff;box-shadow:0 0 0 3px rgba(22,119,255,.1)}.field.disabled{opacity:.5}.input-prefix{display:flex;height:43px;overflow:hidden;border:1px solid #cdd9e8;border-radius:6px;background:#fff}.input-prefix:focus-within{border-color:#1677ff;box-shadow:0 0 0 3px rgba(22,119,255,.1)}.input-prefix i{display:grid;width:42px;place-items:center;border-right:1px solid #e4eaf1;color:#f06f32;font-style:normal;font-weight:900}.input-prefix input{height:100%;border:0;border-radius:0;box-shadow:none!important}
.cover-editor{display:grid;grid-template-columns:minmax(220px,.75fr) minmax(0,1.25fr);gap:20px;align-items:start}.cover-preview{position:relative;aspect-ratio:16/9;overflow:hidden;border:1px solid #dce6f2;border-radius:8px;background:#eef2f6}.cover-preview img{display:block;width:100%;height:100%;object-fit:cover}.cover-preview:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,23,42,.02),rgba(15,23,42,.4))}.cover-preview span{position:absolute;left:14px;bottom:13px;z-index:1;padding:5px 9px;border:1px solid rgba(255,255,255,.52);border-radius:999px;background:rgba(15,23,42,.28);color:#fff;font-size:11px;font-weight:800}.cover-fields{display:grid;gap:16px}
.setting-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px}.switch-setting{display:grid;grid-template-columns:42px minmax(0,1fr);align-items:center;gap:12px;padding:14px;border:1px solid #dce6f2;border-radius:8px;background:#f9fbfd;cursor:pointer}.switch-setting input{position:absolute;opacity:0;pointer-events:none}.switch-ui{position:relative;width:40px;height:22px;border-radius:999px;background:#cfd7e2;transition:.2s}.switch-ui:after{content:"";position:absolute;left:3px;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 2px 5px rgba(15,23,42,.22);transition:.2s}.switch-setting input:checked+.switch-ui{background:#1677ff}.switch-setting input:checked+.switch-ui:after{transform:translateX(18px)}.switch-setting b,.switch-setting small{display:block}.switch-setting b{font-size:13px}.switch-setting small{margin-top:3px;color:#667085;font-size:11px;line-height:1.4}
.benefit-editor-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.benefit-editor-row{display:grid;grid-template-columns:34px minmax(0,1fr) 34px;align-items:center;gap:9px;padding:10px;border:1px solid #dce6f2;border-radius:8px;background:#f9fbfd}.benefit-editor-row>span{color:#12a594;font-size:12px;font-weight:900}.benefit-editor-row input{width:100%;height:36px;box-sizing:border-box;border:0;background:transparent;color:#101828;font-weight:700;outline:none}.benefit-editor-row button,.content-item-actions button{display:grid;width:32px;height:32px;place-items:center;border:1px solid #dce4ec;border-radius:6px;background:#fff;color:#667085;cursor:pointer}.benefit-editor-row button:hover,.content-item-actions button:last-child:hover{border-color:#fda29b;background:#fef3f2;color:#b42318}.empty-add-button{width:100%;min-height:72px;border-style:dashed}
.content-editor-list{display:grid;gap:14px}.content-editor-item{overflow:hidden;border:1.5px solid #dce6f2;border-radius:8px;background:#fbfdff}.content-editor-item>header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-bottom:1px solid #e5ecf4;background:#f4f8fc}.content-editor-item>header>div:first-child{display:flex;align-items:center;gap:10px}.content-editor-item>header span{color:#1677ff;font-size:12px;font-weight:900}.content-editor-item>header b{font-size:13px}.content-item-actions{display:flex;gap:6px}.content-item-actions button:disabled{opacity:.35;cursor:not-allowed}.content-grid{padding:16px}.content-switches{display:flex;align-items:flex-end;gap:16px;padding-bottom:8px}.compact-check{display:flex;align-items:center;gap:7px;color:#475467;font-size:12px;font-weight:800}.compact-check input{width:17px;height:17px;accent-color:#1677ff}
.preview-pane{position:sticky;top:98px;max-height:calc(100vh - 116px);overflow:auto;padding-right:3px}.preview-pane-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding:0 2px}.preview-pane-head b,.preview-pane-head span{display:block}.preview-pane-head b{font-size:14px}.preview-pane-head span{margin-top:3px;color:#667085;font-size:11px}.preview-pane-head em{padding:4px 8px;border-radius:5px;background:#e8f1ff;color:#175cd3;font-size:10px;font-style:normal;font-weight:900}.detail-preview{position:relative;overflow:hidden;border:1px solid #d7e1ec;border-radius:8px;background:#f3f6f4;box-shadow:0 20px 48px rgba(15,23,42,.12)}.detail-cover{position:relative;height:188px;overflow:hidden;background:#dfe8e4}.detail-cover img{display:block;width:100%;height:100%;object-fit:cover}.cover-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(13,42,37,.04),rgba(13,42,37,.58))}.detail-cover>span{position:absolute;left:16px;bottom:18px;padding:6px 10px;border:1px solid rgba(255,255,255,.48);border-radius:999px;background:rgba(255,255,255,.16);color:#fff;font-size:11px;backdrop-filter:blur(6px)}.detail-body{position:relative;margin-top:-14px;padding:0 12px 76px}.preview-summary,.preview-section{position:relative;border:1px solid #e0e8e4;background:#fff}.preview-summary{padding:18px;border-radius:8px}.preview-summary-top{display:flex;align-items:center;justify-content:space-between}.preview-summary-top i{padding:5px 8px;border-radius:999px;background:#e4f6f1;color:#087d6e;font-size:10px;font-style:normal;font-weight:800}.preview-summary-top span{color:#899793;font-size:10px}.preview-summary h2{margin:13px 0 5px;color:#17332e;font-size:22px;line-height:1.35}.preview-summary p{margin:0;color:#70817d;font-size:12px;line-height:1.55}.preview-price{display:flex;align-items:flex-end;justify-content:space-between;margin-top:15px;padding-top:13px;border-top:1px solid #edf1ef}.preview-price strong{color:#f17535;font-size:25px}.preview-price strong small{font-size:13px}.preview-price strong em{margin-left:4px;color:#61736f;font-size:11px;font-style:normal;font-weight:500}.preview-price del{color:#9ba7a4;font-size:10px}.preview-section{margin-top:10px;padding:16px;border-radius:8px}.preview-section>header{display:flex;align-items:center;gap:10px;margin-bottom:13px}.preview-section>header>i{display:grid;width:30px;height:30px;place-items:center;border-radius:7px;font-size:11px;font-style:normal;font-weight:900}.preview-section>header>i.orange{background:#fff0e5;color:#e57031}.preview-section>header>i.green{background:#e5f6f1;color:#087f70}.preview-section>header>i.blue{background:#eaf0fb;color:#4d71ad}.preview-section>header b,.preview-section>header small{display:block}.preview-section>header b{font-size:14px}.preview-section>header small{margin-top:2px;color:#8b9895;font-size:9px}.preview-benefits{display:grid;grid-template-columns:1fr 1fr;gap:7px}.preview-benefits>div{display:flex;align-items:flex-start;gap:6px;min-height:42px;padding:9px;border-radius:6px;background:#f5f8f7}.preview-benefits span{color:#12a594;font-size:9px;font-weight:900}.preview-benefits b{font-size:11px;line-height:1.45}.preview-description{margin:0;color:#5f716d;font-size:11px;line-height:1.75;white-space:pre-wrap}.preview-content-list>div{display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid #edf1ef}.preview-content-list>div:last-child{border-bottom:0}.preview-content-list>div>i{display:grid;width:27px;height:27px;flex:0 0 27px;place-items:center;border-radius:6px;background:#f0f5f3;color:#5e7771;font-size:10px;font-style:normal;font-weight:800}.preview-content-list>div>span{flex:1;min-width:0}.preview-content-list b,.preview-content-list small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.preview-content-list b{font-size:11px}.preview-content-list small{margin-top:3px;color:#889692;font-size:9px}.preview-content-list em{padding:4px 6px;border-radius:999px;background:#edf5f2;color:#55716a;font-size:9px;font-style:normal}.preview-purchase-bar{position:absolute;left:12px;right:12px;bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border:1px solid #e2e9e6;border-radius:7px;background:rgba(255,255,255,.97);box-shadow:0 -6px 18px rgba(14,44,39,.07)}.preview-purchase-bar span{color:#7c8d89;font-size:10px}.preview-purchase-bar span b{display:block;margin-top:2px;color:#f17434;font-size:18px}.preview-purchase-bar button{width:134px;height:42px;border:0;border-radius:7px;background:#ff7a35;color:#fff;font-weight:900}
@media(max-width:980px){.builder-layout{grid-template-columns:minmax(0,1fr) 340px}.type-options{grid-template-columns:1fr}.sales-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.cover-editor{grid-template-columns:1fr}.benefit-editor-list{grid-template-columns:1fr}}
@media(max-width:760px){.product-editor-page{margin:0 -2px}.editor-topbar{position:static;grid-template-columns:1fr;gap:12px;padding:16px}.back-button{width:max-content}.editor-actions{justify-content:space-between}.editor-actions>span{display:none}.save-button{flex:1}.builder-layout{grid-template-columns:1fr}.builder-section{padding:20px 16px}.preview-pane{position:static;order:2;max-height:none;overflow:visible;padding-right:0}.two-columns,.sales-grid,.content-grid,.setting-list{grid-template-columns:1fr}.type-options{grid-template-columns:1fr}.section-heading-action{grid-template-columns:40px minmax(0,1fr)}.section-heading-action>button{grid-column:1/-1}.content-switches{align-items:center;padding:0}.detail-preview{max-width:520px;margin:0 auto}}
@media(max-width:420px){.editor-title h1{font-size:20px}.editor-actions{display:block}.save-button{width:100%}.benefit-editor-row{grid-template-columns:28px minmax(0,1fr) 32px}.preview-benefits{grid-template-columns:1fr}}
</style>

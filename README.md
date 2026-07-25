# 学徒行商户端（学校端）

商户端用于学校 / 站点入驻后的运营管理。学校商户可以登录后提交学习产品、查看订单、处理订单客服。管理后台负责审核学校和学习产品。

## 本地启动

```bash
cd outputs/xuetuxingMerchant
npm install
npm run dev
```

访问：

```text
http://localhost:5180
```

## 连接线上后端

```bash
npm run dev:remote
```

## 生产构建

```bash
npm run build
```

构建结果在：

```text
dist
```

可部署到独立域名，例如：

```text
merchant.goxuetuxing.com
```

也可以放到 Nginx 子路径，但要注意 Vite base 路径配置。

## 入驻流程

1. 学校在商户端提交入驻申请。
2. 管理端进入「入驻学校」审核。
3. 审核通过并设置商户账号密码。
4. 学校使用商户账号登录商户端。
5. 入驻学校在用户端「站点」页面展示。

## 商户端功能

### 学校资料

登录后展示当前学校：

- 学校名称
- 简称
- 城市 / 区域
- Logo
- 入驻审核状态

### 学习产品提交

商户可以提交：

- 付费督学社群
- 长期备考套餐
- 资料包

提交后进入平台审核。审核通过并上架后，用户端学习服务商城展示。

### 订单同步

用户购买学习产品后：

- 用户端可看到自己的订单。
- 商户端可看到本校产品订单。
- 管理端可看到全部订单。

### 商户客服

用户购买对应学习产品后，可在订单页面联系商户客服。

客服机制：

- 用户和商户围绕订单形成会话。
- 平台客服可以参与订单会话。
- 支持文字消息、图片消息、历史记录。
- 图片加载策略与管理端、用户端保持一致：优先本地缓存，远程图片用缩略图。

## 主要接口

| 接口 | 说明 |
|---|---|
| `POST /api/v1/merchant/apply` | 提交学校入驻申请 |
| `POST /api/v1/merchant/login` | 商户登录 |
| `GET /api/v1/merchant/me` | 当前学校资料 |
| `POST /api/v1/merchant/logout` | 退出登录 |
| `GET /api/v1/merchant/study/products` | 本校学习产品 |
| `POST /api/v1/merchant/study/products` | 提交学习产品 |
| `PUT /api/v1/merchant/study/products/{id}` | 修改学习产品 |
| `GET /api/v1/merchant/study/orders` | 本校学习订单 |
| `GET /api/v1/support/merchant/conversations` | 商户客服会话 |

## 常见问题

### 1. 商户无法登录

检查：

- 学校是否已通过管理端审核。
- 管理端是否设置了商户账号和密码。
- 后端是否是最新版本。

### 2. 新增产品用户端看不到

商户提交后需要管理端审核并上架，用户端只展示已审核且已上架的产品。

### 3. 客服图片不显示

检查：

- 后端图片代理接口是否正常。
- OBS 配置是否正确。
- 浏览器 Network 中图片请求是否 200。

## 构建检查

```bash
npm run build
```

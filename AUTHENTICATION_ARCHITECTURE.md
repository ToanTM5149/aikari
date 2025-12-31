# Tài Liệu Kiến Trúc Authentication: CORS, Proxy, JWT, Cookies và Token Management

## Mục Lục

1. [Phần 1: Khái Niệm Cơ Bản](#phần-1-khái-niệm-cơ-bản)
2. [Phần 2: CORS và Proxy](#phần-2-cors-và-proxy)
3. [Phần 3: JWT (JSON Web Token)](#phần-3-jwt-json-web-token)
4. [Phần 4: Access Token và Refresh Token](#phần-4-access-token-và-refresh-token)
5. [Phần 5: HTTP Cookies](#phần-5-http-cookies)
6. [Phần 6: Security Best Practices](#phần-6-security-best-practices)
7. [Phần 7: Implementation trong Codebase](#phần-7-implementation-trong-codebase)
8. [Phần 8: Authentication Flow Chi Tiết](#phần-8-authentication-flow-chi-tiết)

---

## Phần 1: Khái Niệm Cơ Bản

### 1.1. HTTP và HTTPS

**HTTP (HyperText Transfer Protocol)** là giao thức truyền tải dữ liệu giữa client và server.

**HTTPS (HTTP Secure)** là HTTP được mã hóa bằng SSL/TLS, đảm bảo:
- **Confidentiality**: Dữ liệu được mã hóa, không ai đọc được
- **Integrity**: Dữ liệu không bị thay đổi trong quá trình truyền
- **Authentication**: Xác thực server là đúng

### 1.2. Origin và Same-Origin Policy

**Origin** được định nghĩa bởi 3 thành phần:
- **Protocol** (scheme): `http://` hoặc `https://`
- **Domain** (host): `example.com` hoặc `localhost`
- **Port**: `80`, `443`, `5173`, `8000`, etc.

**Ví dụ:**
```
http://localhost:5173  → Origin 1
http://localhost:8000  → Origin 2 (KHÁC Origin 1 vì port khác)
https://example.com   → Origin 3 (KHÁC vì protocol và domain)
http://127.0.0.1:5173  → Origin 4 (KHÁC Origin 1 vì domain khác)
```

**Same-Origin Policy (SOP)** là chính sách bảo mật của browser:
- Chỉ cho phép JavaScript truy cập resources từ **cùng origin**
- Ngăn chặn các website độc hại đọc dữ liệu từ website khác
- **Vấn đề**: Frontend (`localhost:5173`) và Backend (`localhost:8000`) là **khác origin** → không thể gọi API trực tiếp

### 1.3. Cookie

**Cookie** là một đoạn dữ liệu nhỏ được server gửi cho browser, browser tự động gửi lại trong các request tiếp theo.

**Cấu trúc Cookie:**
```
Set-Cookie: name=value; Domain=example.com; Path=/; Max-Age=3600; Secure; HttpOnly; SameSite=Lax
```

**Các thuộc tính quan trọng:**
- `Domain`: Domain nào có thể đọc cookie
- `Path`: Path nào có thể đọc cookie
- `Max-Age` / `Expires`: Thời gian sống của cookie
- `Secure`: Chỉ gửi qua HTTPS
- `HttpOnly`: JavaScript không thể đọc được (chống XSS)
- `SameSite`: Chống CSRF attacks

### 1.4. JWT (JSON Web Token) - Sẽ chi tiết ở phần 3

JWT là một chuẩn mở (RFC 7519) để truyền thông tin an toàn giữa các parties dưới dạng JSON object.

---

## Phần 2: CORS và Proxy

### 2.1. CORS (Cross-Origin Resource Sharing) là gì?

**CORS** là một cơ chế cho phép server chỉ định các origin nào được phép truy cập resources của nó.

**Tại sao cần CORS?**
- Browser chặn cross-origin requests theo Same-Origin Policy
- CORS cho phép server **chủ động** cho phép một số origins truy cập
- Không có CORS → Frontend không thể gọi API từ Backend khác origin

### 2.2. CORS hoạt động như thế nào?

#### Preflight Request (OPTIONS)

Khi browser gửi một **non-simple request** (POST với JSON, có custom headers, etc.), nó sẽ gửi một **preflight request** trước:

```
OPTIONS /api/v1/users HTTP/1.1
Host: localhost:8000
Origin: http://localhost:5173
Access-Control-Request-Method: POST
Access-Control-Request-Headers: authorization,content-type
```

Server phải trả về:
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: authorization, content-type
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 3600
```

#### Actual Request

Sau khi preflight thành công, browser mới gửi request thực sự:

```
POST /api/v1/users HTTP/1.1
Host: localhost:8000
Origin: http://localhost:5173
Authorization: Bearer <token>
Content-Type: application/json
```

Server trả về với CORS headers:
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
```

### 2.3. CORS Headers

| Header | Mô tả |
|--------|-------|
| `Access-Control-Allow-Origin` | Origin nào được phép truy cập (hoặc `*` cho tất cả) |
| `Access-Control-Allow-Methods` | Methods nào được phép (GET, POST, etc.) |
| `Access-Control-Allow-Headers` | Headers nào được phép gửi |
| `Access-Control-Allow-Credentials` | Có cho phép gửi cookies/credentials không |
| `Access-Control-Max-Age` | Cache preflight response trong bao lâu (giây) |

**⚠️ Lưu ý quan trọng:**
- Nếu `Access-Control-Allow-Credentials: true` → **KHÔNG** được dùng `Access-Control-Allow-Origin: *`
- Phải chỉ định rõ origin cụ thể: `Access-Control-Allow-Origin: http://localhost:5173`

### 2.4. Proxy là gì?

**Proxy** là một server trung gian, nhận request từ client và chuyển tiếp đến server thực sự.

**Ví dụ với Vite Proxy:**
```
Client (Browser)          Vite Proxy              Backend Server
    |                        |                        |
    |  GET /api/v1/users     |                        |
    |----------------------->|                        |
    |                        |  GET /api/v1/users     |
    |                        |----------------------->|
    |                        |                        |
    |                        |  Response              |
    |                        |<-----------------------|
    |  Response              |                        |
    |<-----------------------|                        |
```

**Lợi ích của Proxy trong Development:**
1. **Cùng Origin**: Frontend và Backend trông như cùng origin → không cần CORS
2. **Cookie hoạt động đúng**: Cookie được set với domain của frontend
3. **Đơn giản hóa config**: Không cần config CORS phức tạp

### 2.5. CORS vs Proxy: Khi nào dùng gì?

| Tình huống | Giải pháp | Lý do |
|------------|-----------|-------|
| **Development** | Proxy (Vite) | Đơn giản, không cần config CORS |
| **Production** | CORS | Frontend và Backend thường ở domain khác nhau |
| **Same Domain** | Không cần cả hai | Cùng origin → không cần CORS, không cần proxy |

---

## Phần 3: JWT (JSON Web Token)

### 3.1. JWT là gì?

**JWT** là một chuẩn mở (RFC 7519) để truyền thông tin an toàn giữa các parties dưới dạng JSON object.

**Đặc điểm:**
- **Stateless**: Server không cần lưu session → scalable
- **Self-contained**: Token chứa tất cả thông tin cần thiết
- **Signed**: Được ký bằng secret key → đảm bảo tính toàn vẹn

### 3.2. Cấu trúc JWT

JWT gồm 3 phần, ngăn cách bởi dấu chấm (`.`):

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**Format:** `HEADER.PAYLOAD.SIGNATURE`

#### 3.2.1. Header

Chứa metadata về token:
```json
{
  "alg": "HS256",  // Algorithm dùng để sign
  "typ": "JWT"     // Type của token
}
```

Sau đó được **Base64Url** encode.

#### 3.2.2. Payload

Chứa **claims** (thông tin):
```json
{
  "sub": "user_id_123",           // Subject (user ID)
  "exp": 1516239022,              // Expiration time (Unix timestamp)
  "iat": 1516239022,              // Issued at
  "type": "access",               // Token type
  "jti": "unique_token_id"        // JWT ID (để revoke)
}
```

**Các loại Claims:**
- **Registered Claims**: Chuẩn JWT (`sub`, `exp`, `iat`, `jti`, etc.)
- **Public Claims**: Có thể định nghĩa tùy ý
- **Private Claims**: Claims riêng của ứng dụng

#### 3.2.3. Signature

Được tạo bằng cách:
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret_key
)
```

**Mục đích:**
- Đảm bảo token không bị thay đổi
- Xác thực token được tạo bởi server có secret key

### 3.3. JWT Flow

```
1. User Login
   ↓
2. Server tạo JWT với secret key
   ↓
3. Server trả về JWT cho client
   ↓
4. Client lưu JWT (memory/localStorage/cookie)
   ↓
5. Client gửi JWT trong Authorization header
   ↓
6. Server verify JWT signature
   ↓
7. Server extract thông tin từ payload
   ↓
8. Server xử lý request
```

### 3.4. JWT Security

**⚠️ JWT KHÔNG được mã hóa, chỉ được ký!**

- Payload có thể đọc được (chỉ Base64Url encode)
- **KHÔNG** lưu thông tin nhạy cảm trong JWT
- **KHÔNG** lưu password, credit card, etc.

**Best Practices:**
- Dùng HTTPS để bảo vệ token trong quá trình truyền
- Set expiration time ngắn cho access token
- Dùng refresh token để renew access token
- Implement token blacklist để revoke tokens

---

## Phần 4: Access Token và Refresh Token

### 4.1. Tại sao cần 2 loại token?

**Vấn đề với chỉ dùng Access Token:**
- Nếu token sống lâu → Rủi ro bảo mật cao (nếu bị đánh cắp)
- Nếu token sống ngắn → User phải login lại thường xuyên → UX kém

**Giải pháp: Dual Token System**
- **Access Token**: Sống ngắn (5-15 phút), dùng để authenticate mọi request
- **Refresh Token**: Sống dài (7-30 ngày), dùng để lấy access token mới

### 4.2. Access Token

**Đặc điểm:**
- **Thời gian sống ngắn**: 5-15 phút
- **Lưu ở đâu**: Memory (Redux state) - **KHÔNG** localStorage
- **Mục đích**: Authenticate mọi API request
- **Gửi như thế nào**: `Authorization: Bearer <token>` header

**Lý do lưu trong memory:**
- Giảm rủi ro XSS attack (JavaScript không thể đọc được nếu bị hack)
- Tự động mất khi reload page → buộc phải refresh token

### 4.3. Refresh Token

**Đặc điểm:**
- **Thời gian sống dài**: 7-30 ngày
- **Lưu ở đâu**: HTTP-only cookie (server-side)
- **Mục đích**: Lấy access token mới khi access token hết hạn
- **Gửi như thế nào**: Tự động gửi trong cookie (không cần code)

**Lý do lưu trong HTTP-only cookie:**
- JavaScript **KHÔNG THỂ** đọc được → chống XSS
- Tự động gửi với mọi request → không cần code
- Browser quản lý → an toàn hơn

### 4.4. Token Refresh Flow

```
1. User login → Nhận access token + refresh token (trong cookie)
   ↓
2. Access token hết hạn (15 phút)
   ↓
3. Client gửi request với access token cũ → Server trả về 401
   ↓
4. Client tự động gọi /refresh-token endpoint
   ↓
5. Server đọc refresh token từ cookie
   ↓
6. Server verify refresh token
   ↓
7. Server tạo access token mới
   ↓
8. Server trả về access token mới
   ↓
9. Client update access token trong memory
   ↓
10. Client retry request ban đầu với access token mới
```

### 4.5. Token Revocation

**Khi nào cần revoke token?**
- User logout
- User đổi password
- User nghi ngờ tài khoản bị xâm nhập
- Admin revoke token

**Cách implement:**
1. Lưu JTI (JWT ID) trong database
2. Khi revoke → thêm JTI vào blacklist
3. Khi verify token → kiểm tra JTI có trong blacklist không

---

## Phần 5: HTTP Cookies

### 5.1. Cookie là gì?

**Cookie** là một đoạn dữ liệu nhỏ được server gửi cho browser, browser tự động gửi lại trong các request tiếp theo đến cùng domain.

### 5.2. Cookie Attributes

#### 5.2.1. Domain

```
Set-Cookie: name=value; Domain=example.com
```

- Cookie chỉ được gửi đến domain này và subdomains
- Nếu không set → chỉ domain hiện tại
- **Lưu ý**: `localhost` và `127.0.0.1` là **khác domain**

#### 5.2.2. Path

```
Set-Cookie: name=value; Path=/api
```

- Cookie chỉ được gửi khi request đến path này
- Mặc định: `/` (tất cả paths)

#### 5.2.3. Max-Age / Expires

```
Set-Cookie: name=value; Max-Age=3600  // 1 giờ
Set-Cookie: name=value; Expires=Wed, 21 Oct 2025 07:28:00 GMT
```

- Thời gian sống của cookie
- `Max-Age`: tính bằng giây
- `Expires`: thời điểm cụ thể

#### 5.2.4. Secure

```
Set-Cookie: name=value; Secure
```

- Cookie **CHỈ** được gửi qua HTTPS
- **Bắt buộc** trong production
- **Không dùng** trong development (localhost thường dùng HTTP)

#### 5.2.5. HttpOnly

```
Set-Cookie: name=value; HttpOnly
```

- JavaScript **KHÔNG THỂ** đọc được cookie này
- **Bắt buộc** cho refresh token (chống XSS)
- Chỉ server có thể đọc qua `request.cookies`

#### 5.2.6. SameSite

```
Set-Cookie: name=value; SameSite=Lax
```

**Các giá trị:**
- `Strict`: Cookie chỉ được gửi trong same-site requests
- `Lax`: Cookie được gửi trong same-site requests + top-level navigation
- `None`: Cookie được gửi trong mọi requests (cần `Secure`)

**Ví dụ với `Lax`:**
```
✅ GET request từ link click → Cookie được gửi
✅ Same-site request → Cookie được gửi
❌ Cross-site POST request → Cookie KHÔNG được gửi
```

### 5.3. Cookie vs LocalStorage vs SessionStorage

| Feature | Cookie | LocalStorage | SessionStorage |
|---------|--------|--------------|----------------|
| **Tự động gửi** | ✅ Có | ❌ Không | ❌ Không |
| **JavaScript đọc được** | ✅ Có (trừ HttpOnly) | ✅ Có | ✅ Có |
| **Size limit** | 4KB | 5-10MB | 5-10MB |
| **Expires** | Có thể set | Không | Khi tab đóng |
| **Gửi với mọi request** | ✅ Có | ❌ Không | ❌ Không |
| **HttpOnly** | ✅ Có | ❌ Không | ❌ Không |

**Kết luận:**
- **Refresh Token**: Dùng Cookie (HttpOnly) → An toàn nhất
- **Access Token**: Dùng Memory/Redux → Tự động mất khi reload
- **User Info**: Có thể dùng LocalStorage → UX tốt hơn

---

## Phần 6: Security Best Practices

### 6.1. XSS (Cross-Site Scripting) Protection

**XSS** là khi attacker inject JavaScript code vào website.

**Cách bảo vệ:**
1. **HttpOnly Cookies**: JavaScript không thể đọc refresh token
2. **Content Security Policy (CSP)**: Chặn inline scripts
3. **Input Validation**: Sanitize user input
4. **Access Token trong Memory**: Không lưu trong localStorage

### 6.2. CSRF (Cross-Site Request Forgery) Protection

**CSRF** là khi attacker lừa user thực hiện action không mong muốn.

**Cách bảo vệ:**
1. **SameSite Cookie**: `SameSite=Lax` hoặc `Strict`
2. **CSRF Tokens**: Server generate token, client gửi lại
3. **Origin Check**: Kiểm tra `Origin` header

### 6.3. Token Security

**Best Practices:**
1. **Short-lived Access Token**: 5-15 phút
2. **Long-lived Refresh Token**: 7-30 ngày
3. **Token Blacklist**: Revoke tokens khi logout
4. **JTI Tracking**: Track mỗi token để revoke
5. **HTTPS Only**: Trong production
6. **Secret Key Rotation**: Đổi secret key định kỳ

### 6.4. Cookie Security

**Best Practices:**
1. **HttpOnly**: Cho refresh token
2. **Secure**: Trong production (HTTPS only)
3. **SameSite**: `Lax` hoặc `Strict`
4. **Domain**: Chỉ set nếu cần cross-subdomain
5. **Path**: `/` hoặc `/api` tùy use case

---

## Phần 7: Implementation trong Codebase

### 7.1. Backend Configuration

#### 7.1.1. CORS Configuration (`backend/app/main.py`)

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.all_cors_origins,  # List các origins được phép
    allow_credentials=True,  # Cho phép gửi cookies
    allow_methods=["*"],     # Tất cả HTTP methods
    allow_headers=["*"],    # Tất cả headers
)
```

**Settings (`backend/app/core/config.py`):**
```python
FRONTEND_HOST: str = "http://localhost:5173"
BACKEND_CORS_ORIGINS: list[str] = []

@computed_field
@property
def all_cors_origins(self) -> list[str]:
    return [str(origin).rstrip("/") for origin in self.BACKEND_CORS_ORIGINS] + [
        self.FRONTEND_HOST
    ]
```

#### 7.1.2. Cookie Configuration

```python
# Cookie settings for refresh token
COOKIE_SECURE: bool = False  # Set to True in production (HTTPS only)
COOKIE_SAMESITE: Literal["lax", "strict", "none"] = "lax"
COOKIE_DOMAIN: str | None = None  # Set domain for production if needed
```

**Set Cookie trong Login (`backend/app/api/routes/login.py`):**
```python
cookie_params = {
    "key": "refresh_token",
    "value": refresh_token,
    "httponly": True,
    "secure": settings.COOKIE_SECURE,
    "samesite": settings.COOKIE_SAMESITE,
    "max_age": settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    "path": "/",
}

if settings.COOKIE_DOMAIN:
    cookie_params["domain"] = settings.COOKIE_DOMAIN

response.set_cookie(**cookie_params)
```

#### 7.1.3. JWT Token Creation (`backend/app/core/security.py`)

**Access Token:**
```python
def create_access_token(subject: str | Any, expires_delta: timedelta) -> str:
    expire = datetime.now(timezone.utc) + expires_delta
    jti = str(uuid.uuid4())  # Unique token ID
    to_encode = {
        "exp": expire,
        "sub": str(subject),  # User ID
        "type": "access",
        "jti": jti
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
```

**Refresh Token:**
```python
def create_refresh_token(subject: str | Any) -> tuple[str, str, datetime]:
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    jti = str(uuid.uuid4())
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "refresh",
        "jti": jti
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt, jti, expire
```

#### 7.1.4. Token Verification (`backend/app/api/deps.py`)

```python
def get_current_user(session: SessionDep, token: TokenDep) -> User:
    # Decode JWT
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
    token_data = TokenPayload(**payload)
    
    # Check blacklist
    jti = payload.get("jti")
    if jti and security.is_token_blacklisted(session, jti):
        raise HTTPException(status_code=401, detail="Token has been revoked")
    
    # Get user
    user_id = uuid.UUID(token_data.sub)
    user = get_user_by_id(session=session, user_id=user_id)
    return user
```

#### 7.1.5. Token Blacklist

**Model (`backend/app/models/token_blacklist.py`):**
```python
class TokenBlacklist(SQLModel, table=True):
    jti: str = Field(unique=True, index=True)  # JWT ID
    token_type: str = Field(index=True)  # "access" or "refresh"
    user_id: uuid.UUID = Field(index=True)
    revoked_at: datetime
    expires_at: datetime
    reason: str | None = None
```

**Check Blacklist:**
```python
def is_token_blacklisted(session: Session, jti: str) -> bool:
    statement = select(TokenBlacklist).where(TokenBlacklist.jti == jti)
    result = session.exec(statement).first()
    return result is not None
```

### 7.2. Frontend Configuration

#### 7.2.1. Vite Proxy (`frontend/vite.config.ts`)

```typescript
export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
        // KHÔNG rewrite path - giữ nguyên /api/v1
      },
    },
  },
});
```

**Lợi ích:**
- Frontend và Backend trông như cùng origin
- Cookie hoạt động đúng
- Không cần config CORS phức tạp trong dev

#### 7.2.2. RTK Query Base API (`frontend/app/redux/store/api/baseApi.ts`)

**Base Query với Proxy:**
```typescript
const baseQuery = fetchBaseQuery({
  // Dev: dùng Vite proxy → cùng origin
  // Prod: dùng absolute URL từ env
  baseUrl: import.meta.env.DEV 
    ? '/api/v1'
    : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1`,
  
  // CRITICAL: Enable sending cookies
  credentials: 'include',
  
  // Tự động thêm Authorization header
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.accessToken;
    
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  },
});
```

**Auto Refresh Token:**
```typescript
const baseQueryWithReauth: BaseQueryFn = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  // Nếu 401 → token expired
  if (result.error && result.error.status === 401) {
    // Gọi refresh endpoint (cookie tự động được gửi)
    const refreshResult = await baseQuery(
      { url: '/login/refresh-token', method: 'POST' },
      api,
      extraOptions
    );
    
    if (refreshResult.data) {
      // Update access token trong Redux state
      const newToken = (refreshResult.data as any).access_token;
      api.dispatch({
        type: 'auth/setCredentials',
        payload: { accessToken: newToken, user: state.auth.user },
      });
      
      // Retry request ban đầu
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Refresh failed → logout
      api.dispatch({ type: 'auth/logout' });
    }
  }
  
  return result;
};
```

#### 7.2.3. Auth State Management (`frontend/app/redux/features/auth/slice.ts`)

**Lưu Access Token trong Memory:**
```typescript
setCredentials: (state, action: PayloadAction<SetCredentialsPayload>) => {
  state.accessToken = action.payload.accessToken;
  state.user = action.payload.user;
  state.isAuthenticated = true;
  
  // ⚠️ KHÔNG lưu access token vào localStorage
  // Chỉ lưu user info để UX tốt hơn
  localStorage.setItem('user', JSON.stringify(action.payload.user));
},
```

**Lý do:**
- Access token tự động mất khi reload → buộc phải refresh
- Giảm rủi ro XSS (không lưu trong localStorage)

---

## Phần 8: Authentication Flow Chi Tiết

### 8.1. Login Flow

```
┌─────────┐         ┌──────────┐         ┌─────────┐
│ Browser │         │  Vite    │         │ Backend │
│         │         │  Proxy   │         │         │
└────┬────┘         └────┬─────┘         └────┬────┘
     │                   │                     │
     │ 1. POST /api/v1/  │                     │
     │    login/access-  │                     │
     │    token          │                     │
     │──────────────────>│                     │
     │                   │ 2. Forward request  │
     │                   │────────────────────>│
     │                   │                     │
     │                   │ 3. Verify credentials│
     │                   │    Create tokens     │
     │                   │    Set cookie       │
     │                   │                     │
     │                   │ 4. Response:        │
     │                   │    - access_token   │
     │                   │    - user           │
     │                   │    - Set-Cookie:    │
     │                   │      refresh_token   │
     │                   │<────────────────────│
     │ 5. Response        │                     │
     │<──────────────────│                     │
     │                   │                     │
     │ 6. Store access    │                     │
     │    token in Redux │                     │
     │    (memory)       │                     │
     │                   │                     │
```

**Chi tiết:**

1. **Client gửi login request:**
   ```typescript
   POST /api/v1/login/access-token
   Content-Type: application/x-www-form-urlencoded
   Body: username=user@example.com&password=password123
   ```

2. **Backend xử lý:**
   - Verify credentials
   - Tạo access token (15 phút)
   - Tạo refresh token (7 ngày)
   - Lưu refresh token vào database
   - Set refresh token vào HTTP-only cookie
   - Trả về access token và user info

3. **Client nhận response:**
   - Access token → Lưu vào Redux state (memory)
   - Refresh token → Tự động lưu trong cookie (browser)
   - User info → Lưu vào Redux state + localStorage (UX)

### 8.2. API Request Flow

```
┌─────────┐         ┌──────────┐         ┌─────────┐
│ Browser │         │  Vite    │         │ Backend │
│         │         │  Proxy   │         │         │
└────┬────┘         └────┬─────┘         └────┬────┘
     │                   │                     │
     │ 1. GET /api/v1/   │                     │
     │    users/me        │                     │
     │    Authorization:  │                     │
     │    Bearer <token>  │                     │
     │──────────────────>│                     │
     │                   │ 2. Forward request  │
     │                   │────────────────────>│
     │                   │                     │
     │                   │ 3. Verify token     │
     │                   │    Get user         │
     │                   │                     │
     │                   │ 4. Response: user    │
     │                   │<────────────────────│
     │ 5. Response        │                     │
     │<──────────────────│                     │
     │                   │                     │
```

**Chi tiết:**

1. **Client gửi request:**
   - Tự động thêm `Authorization: Bearer <access_token>` header
   - Cookie (refresh_token) tự động được gửi

2. **Backend verify:**
   - Decode JWT
   - Check blacklist
   - Get user từ database
   - Trả về data

### 8.3. Token Refresh Flow

```
┌─────────┐         ┌──────────┐         ┌─────────┐
│ Browser │         │  Vite    │         │ Backend │
│         │         │  Proxy   │         │         │
└────┬────┘         └────┬─────┘         └────┬────┘
     │                   │                     │
     │ 1. GET /api/v1/   │                     │
     │    users/me        │                     │
     │    (token expired) │                     │
     │──────────────────>│                     │
     │                   │────────────────────>│
     │                   │                     │
     │                   │ 2. 401 Unauthorized │
     │                   │<────────────────────│
     │ 3. 401             │                     │
     │<──────────────────│                     │
     │                   │                     │
     │ 4. Auto refresh:   │                     │
     │    POST /api/v1/   │                     │
     │    login/refresh-  │                     │
     │    token           │                     │
     │    (cookie auto)   │                     │
     │──────────────────>│                     │
     │                   │────────────────────>│
     │                   │                     │
     │                   │ 5. Verify refresh   │
     │                   │    Create new       │
     │                   │    access token     │
     │                   │                     │
     │                   │ 6. Response:        │
     │                   │    access_token     │
     │                   │<────────────────────│
     │ 7. Response        │                     │
     │<──────────────────│                     │
     │                   │                     │
     │ 8. Update token    │                     │
     │    in Redux        │                     │
     │                   │                     │
     │ 9. Retry original  │                     │
     │    request         │                     │
     │──────────────────>│                     │
     │                   │────────────────────>│
     │                   │                     │
     │                   │ 10. Response: user  │
     │                   │<────────────────────│
     │ 11. Response       │                     │
     │<──────────────────│                     │
     │                   │                     │
```

**Chi tiết:**

1. **Request với token hết hạn:**
   - Client gửi request với access token cũ
   - Backend trả về 401

2. **Auto refresh:**
   - RTK Query tự động gọi `/login/refresh-token`
   - Cookie (refresh_token) tự động được gửi
   - Backend verify refresh token
   - Backend tạo access token mới
   - Trả về access token mới

3. **Update và retry:**
   - Client update access token trong Redux
   - Client retry request ban đầu với token mới
   - Backend trả về data

### 8.4. Logout Flow

```
┌─────────┐         ┌──────────┐         ┌─────────┐
│ Browser │         │  Vite    │         │ Backend │
│         │         │  Proxy   │         │         │
└────┬────┘         └────┬─────┘         └────┬────┘
     │                   │                     │
     │ 1. POST /api/v1/  │                     │
     │    login/logout   │                     │
     │──────────────────>│                     │
     │                   │────────────────────>│
     │                   │                     │
     │                   │ 2. Read refresh     │
     │                   │    token from cookie│
     │                   │    Revoke token     │
     │                   │    Add to blacklist │
     │                   │    Clear cookie     │
     │                   │                     │
     │                   │ 3. Response: OK     │
     │                   │<────────────────────│
     │ 4. Response        │                     │
     │<──────────────────│                     │
     │                   │                     │
     │ 5. Clear Redux     │                     │
     │    state           │                     │
     │                   │                     │
```

**Chi tiết:**

1. **Client gọi logout:**
   - POST `/api/v1/login/logout`
   - Cookie tự động được gửi

2. **Backend xử lý:**
   - Đọc refresh token từ cookie
   - Revoke refresh token trong database
   - Thêm vào blacklist
   - Clear cookie (Set-Cookie với Max-Age=0)

3. **Client xử lý:**
   - Clear Redux state (access token, user)
   - Clear localStorage (user info)

---

## Tóm Tắt và Best Practices

### Checklist cho Development

- [ ] Vite proxy config đúng (`/api` → backend)
- [ ] Base API dùng relative path trong dev (`/api/v1`)
- [ ] `credentials: 'include'` trong fetchBaseQuery
- [ ] Access token lưu trong memory (Redux), không localStorage
- [ ] Refresh token trong HTTP-only cookie
- [ ] Auto refresh token khi 401

### Checklist cho Production

- [ ] CORS config đúng (chỉ allow frontend domain)
- [ ] `COOKIE_SECURE=True` (HTTPS only)
- [ ] `COOKIE_SAMESITE=Lax` hoặc `Strict`
- [ ] Token expiration times hợp lý
- [ ] Token blacklist implemented
- [ ] HTTPS enabled

### Security Checklist

- [ ] HttpOnly cookies cho refresh token
- [ ] Access token không lưu trong localStorage
- [ ] JTI tracking để revoke tokens
- [ ] Token blacklist khi logout
- [ ] HTTPS trong production
- [ ] Secret key rotation plan

---

## Tài Liệu Tham Khảo

- [JWT RFC 7519](https://tools.ietf.org/html/rfc7519)
- [CORS MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Cookie MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**Tài liệu này được tạo dựa trên codebase AIKARI và các best practices hiện đại về authentication và security.**


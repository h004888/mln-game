# Hướng dẫn Triển khai `mln-game` lên Dokploy qua Docker Compose

Tài liệu này hướng dẫn chi tiết quy trình đưa dự án **Buzzer Board Game (MLN-Game)** lên hệ thống máy chủ **Dokploy** (Self-hosted PaaS sử dụng Traefik Reverse Proxy và Docker Compose).

---

## 1. Yêu cầu chuẩn bị
- Một máy chủ (VPS / Server) đã cài đặt **Dokploy** (phiên bản v0.8+).
- Hai (02) tên miền / subdomain trỏ IP (DNS A Record) về máy chủ Dokploy của bạn:
  - **Domain Frontend** (VD: `game.yourdomain.com`): Cho người chơi, màn hình MC và máy chiếu.
  - **Domain Backend API & WebSocket** (VD: `api-game.yourdomain.com`): Cho Socket.IO realtime server và REST API.
- Mã nguồn đã được push lên GitHub: `https://github.com/h004888/mln-game.git` (nhánh `main`).

---

## 2. Quy trình cấu hình trên Dokploy Dashboard

### Bước 1: Tạo mới một Service dạng Compose
1. Đăng nhập vào giao diện quản trị Dokploy.
2. Chọn **Project** của bạn (hoặc tạo Project mới, ví dụ: `MLN-Game`).
3. Nhấp vào nút **Create Service** -> Chọn loại **Compose**.
4. Đặt tên Service (VD: `mln-game-stack`).

---

### Bước 2: Kết nối GitHub Repository
Trong tab **General / Source** của Service vừa tạo:
1. **Source Type**: Chọn `GitHub`.
2. **Repository**: Chọn `h004888/mln-game`.
3. **Branch**: `main`.
4. **Compose Path**: `docker-compose.prod.yml`.
5. Bật tính năng **Auto Deploy** (tự động triển khai khi có commit mới push lên nhánh `main`).

---

### Bước 3: Cấu hình Biến Môi Trường (Environment Variables)
Chuyển sang tab **Environment** trong Dokploy, nhập các biến sau:

```env
# Mã PIN xác thực quyền MC điều khiển phòng đấu
HOST_PIN=8888

# Domain Backend công khai (BẮT BUỘC có https:// để Next.js build-time nhúng đúng WebSocket URL)
NEXT_PUBLIC_BACKEND_URL=https://api-game.yourdomain.com

# Port nội bộ
PORT=3001
BACKEND_PORT=3001
FRONTEND_PORT=3000
```

> ⚠️ **LƯU Ý QUAN TRỌNG:** Biến `NEXT_PUBLIC_BACKEND_URL` được sử dụng trong quá trình `next build` của Frontend container. Nếu thay đổi domain này, bạn cần kích hoạt **Rebuild & Redeploy** để Next.js cập nhật bundle client.

---

### Bước 4: Thiết lập Traefik Routing & Domain SSL

Chuyển sang tab **Domains / Routing** trên Dokploy để thêm 2 domain:

#### 1. Domain cho Frontend:
- **Host**: `game.yourdomain.com`
- **Service Name**: `frontend` (chọn từ danh sách service của docker-compose)
- **Container Port**: `3000`
- **HTTPS / SSL**: Bật (Enable Let's Encrypt SSL)
- **Path**: `/`

#### 2. Domain cho Backend (API & Socket.IO):
- **Host**: `api-game.yourdomain.com`
- **Service Name**: `backend`
- **Container Port**: `3001`
- **HTTPS / SSL**: Bật (Enable Let's Encrypt SSL)
- **Path**: `/`

> 💡 Traefik của Dokploy tự động hỗ trợ Header Upgrade `Connection: Upgrade` cho WebSocket của Socket.IO mà không cần thêm cấu hình reverse proxy bổ sung.

---

### Bước 5: Tiến hành Triển khai (Deploy)
1. Nhấp nút **Deploy** (hoặc **Redeploy**).
2. Theo dõi log build trong tab **Deployments / Logs**:
   - Dokploy sẽ kéo mã nguồn về.
   - Build container `backend` (TypeScript NestJS compile sang `dist/main.js`).
   - Build container `frontend` (Next.js production bundle với biến `NEXT_PUBLIC_BACKEND_URL`).
   - Khởi chạy cả 2 container và gắn Traefik router.

---

## 3. Kiểm tra hoạt động sau khi Triển khai (Post-deployment Verification)

| Màn hình / Endpoint | URL kiểm tra | Kết quả mong đợi |
| :--- | :--- | :--- |
| **Backend Health / REST** | `https://api-game.yourdomain.com/questions` | Trả về JSON danh sách câu hỏi mặc định |
| **Socket.IO Handshake** | `https://api-game.yourdomain.com/socket.io/?EIO=4&transport=polling` | Trả về chuỗi handshake bắt đầu bằng `0{"sid":...}` |
| **Giao diện Người chơi** | `https://game.yourdomain.com/` | Hiển thị form nhập tên người chơi |
| **Giao diện Máy chiếu** | `https://game.yourdomain.com/screen` | Hiển thị bảng 12 ô lật và mã QR kết nối |
| **Giao diện Quản trị MC** | `https://game.yourdomain.com/host` | Hiển thị modal nhập PIN (mặc định `8888`), sau đó mở Bảng Điều Khiển MC & Game Studio |

---

## 4. Khắc phục sự cố thường gặp (Troubleshooting)

1. **Lỗi `Socket connection error / reconnecting...` trên trình duyệt:**
   - Kiểm tra xem `NEXT_PUBLIC_BACKEND_URL` đã trỏ đúng `https://api-game.yourdomain.com` (có `https://`) chưa.
   - Nhấn F12 kiểm tra tab Console / Network: Nếu báo lỗi Mixed Content (http trên trang https), hãy đảm bảo backend domain dùng SSL `https://`.
   - Nếu vừa sửa biến môi trường, hãy bấm **Rebuild** (chọn *Clear build cache* nếu cần) để Next.js build lại.

2. **Lỗi Docker Build Out of Memory:**
   - Đảm bảo VPS có tối thiểu 2GB RAM + Swap 2GB để quá trình compile Next.js diễn ra mượt mà.

3. **Cập nhật lại câu hỏi hoặc PIN Host:**
   - Có thể đổi `HOST_PIN` trong tab Environment của Dokploy và bấm **Restart** container `backend` mà không cần rebuild lại frontend.

# 🎮 Buzzer-Driven Board Game (MLN-Game)

> Trò chơi Bấm Chuông Giành Quyền Mở Ô & Truy Tìm Ảnh Bí Ẩn dành cho **30 người chơi trực tiếp (Realtime WebSockets)**.

---

## 🌟 Tính năng nổi bật

1. **Kiến trúc 3 Màn hình Độc lập:**
   - 📱 **Người chơi (`/`):** Nút chuông khổng lồ hỗ trợ Rung & Đổi màu theo nhịp độ game, bàn phím chọn ô 5s, 4 nút chọn A-B-C-D ngón cái và nút "🔥 Đoán Từ Khóa Ảnh Gốc".
   - 💻 **MC / Host (`/host`):** Phím tắt `Space` mở chuông cực nhanh, bảng reset chuông, duyệt Đúng/Sai khi có người đoán ảnh, quản lý danh sách 30 người chơi và hệ thống âm thanh hiệu ứng (Web Audio API).
   - 📺 **Máy chiếu / TV Khán phòng (`/screen`):** Tỉ lệ 16:9 sắc nét, lưới 16 mảnh ghép 4x4 lộ ảnh theo từng góc toạ độ, thanh đếm ngược thời gian, Top 5 bảng xếp hạng realtime và Pháo hoa mừng MVP.

2. **Cơ chế Chống Race Condition mili-giây:**
   - Server-side Atomic FIFO Lock đảm bảo khi 30 người bấm trong cùng 1 giây, chỉ duy nhất người chạm gói tin đầu tiên giành quyền.
   - Cơ chế Cooldown 1 lượt cho người vừa ăn điểm và Đóng băng 2 lượt nếu đoán sai ảnh bí ẩn để chống độc tài.

3. **Luật 1 (Instant Win):**
   - Đoán đúng từ khóa ảnh bí ẩn $\rightarrow$ Thắng cuộc ngay lập tức và vinh danh MVP.

---

## 🚀 Hướng dẫn Cài đặt & Chạy Game

### 1. Cài đặt Dependencies
```bash
# Cài đặt backend
cd backend
npm install

# Cài đặt frontend
cd ../frontend
npm install
```

### 2. Khởi động Ứng dụng
```bash
# Chạy đồng thời Backend (Port 3001) và Frontend (Port 3000) từ thư mục gốc
npm run dev

# Hoặc chạy riêng:
npm run dev:backend   # NestJS chạy tại http://localhost:3001
npm run dev:frontend  # NextJS chạy tại http://localhost:3000
```

### 3. Trải nghiệm 3 Giao diện:
- **Người chơi (Điện thoại):** `http://localhost:3000`
- **Máy chiếu (TV Khán phòng):** `http://localhost:3000/screen`
- **Bảng điều khiển MC (Laptop):** `http://localhost:3000/host`

---

## 🧪 Kiểm thử Tự động (TDD & E2E Tests)

```bash
# Chạy toàn bộ Unit Tests của Backend và Frontend
npm test

# Chạy kiểm thử tích hợp E2E giả lập 30 socket clients tranh chấp chuông
npm run test:e2e
```

---

## 🐳 Triển khai Docker Production & Dokploy

### 1. Chạy nhanh bằng Docker Compose cục bộ:
```bash
# Copy file môi trường mẫu
cp .env.example .env

# Khởi chạy toàn bộ stack production
docker compose -f docker-compose.prod.yml up -d --build
```

### 2. Triển khai lên Dokploy (Self-Hosted PaaS):
Dự án đã sẵn sàng triển khai trên **Dokploy** với cơ chế Compose Stack và Traefik SSL:
- Tham khảo hướng dẫn chi tiết từng bước tại: [docs/DOKPLOY_DEPLOYMENT_GUIDE.md](file:///c:/Users/ADMIN/Downloads/mln-game/docs/DOKPLOY_DEPLOYMENT_GUIDE.md)


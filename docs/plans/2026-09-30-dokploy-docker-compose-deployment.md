# Triển khai Dokploy qua Docker Compose — Kế hoạch triển khai

**Mục tiêu:** Thiết lập đầy đủ Dockerfile tối ưu multi-stage, file Docker Compose production (`docker-compose.prod.yml`), cấu hình biến môi trường và tài liệu hướng dẫn triển khai hệ thống mln-game (NestJS + Next.js) lên Dokploy với đầy đủ chứng chỉ SSL và định tuyến domain.

**Cách tiếp cận:** Xây dựng Multi-stage Dockerfile cho Backend NestJS và Frontend Next.js (hỗ trợ Build ARG `NEXT_PUBLIC_BACKEND_URL`), kết hợp file `docker-compose.prod.yml` tương thích với cơ chế Compose Deployment và Traefik Reverse Proxy trên Dokploy.

**Đã tra cứu codebase (codebase-memory-mcp):**
- `get_architecture`: Xác nhận cấu trúc monorepo gồm backend NestJS (port 3001, WebSocket Gateway `GameGateway`, REST `/questions`) và frontend Next.js (port 3000, App Router, kết nối Socket.IO tới backend).
- `search_code`: Xác nhận backend đọc `PORT` (mặc định 3001) và `HOST_PIN` (mặc định 8888); frontend đọc `NEXT_PUBLIC_BACKEND_URL` tại `frontend/src/hooks/useSocket.ts`.

**Framework test & quy ước (đã xác nhận qua codebase-memory-mcp):**
- Framework: Jest (`jest` cho cả backend và frontend).
- Vị trí đặt file test: `backend/src/**/*.spec.ts` và `frontend/src/**/*.test.ts(x)`.
- Lệnh chạy test: `npm test` (hoặc `jest`).

## Ràng buộc chung (Global Constraints)

- Mọi task viết/sửa hành vi code hoặc cấu hình phải tuân theo chu trình Red → Green → Refactor.
- Không có task nào được đánh dấu hoàn tất nếu thiếu test tự động tương ứng và log xác nhận PASS.
- Dockerfile phải dùng Multi-stage build trên nền `node:20-alpine` để kích thước image nhẹ nhất và bảo mật cho production.
- Biến `NEXT_PUBLIC_BACKEND_URL` của Next.js phải được truyền qua `ARG` khi build image vì biến `NEXT_PUBLIC_*` được nhúng cứng vào JavaScript client lúc build.

---

### Task 1: Xây dựng và kiểm thử Dockerfile cho Backend NestJS

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: `backend/Dockerfile`, `backend/.dockerignore`
- Chỉnh sửa: không có
- Test tương ứng: `backend/src/app.controller.spec.ts`
- Kiểm chứng bằng: `npm test`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Docker Compose Service `backend`
- Gọi tới: `backend/dist/main.js` (NestJS entry point)
- Regression test cần chạy thêm: `npm test`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: source code backend hiện tại
- Cung cấp đầu ra cho: Task 3 (`docker-compose.prod.yml` service backend)

- [ ] **Bước 1 [RED]: Viết test kiểm tra trạng thái khởi chạy và endpoint backend**
  Vị trí file test: `backend/src/app.controller.spec.ts`
  Test case: Kiểm tra AppController phản hồi status hệ thống sẵn sàng cho container healthcheck.
  Kỳ vọng: chạy `npm test` (jest trong backend) → FAIL nếu có test case mới chưa khớp hoặc chưa được cấu hình.
- [ ] **Bước 2 [GREEN]: Tạo `backend/.dockerignore` và `backend/Dockerfile` multi-stage build**
  Vị trí file: `backend/Dockerfile`, `backend/.dockerignore`
  Nội dung: Dockerfile gồm 2 stage: `builder` (cài đặt dependencies, compile TypeScript sang `dist`) và `runner` (chỉ copy production node_modules và dist, expose port 3001, chạy `node dist/main.js`).
  Kỳ vọng: chạy `npm test` (jest trong backend) → PASS.
- [ ] **Bước 3 [REFACTOR] (nếu cần): Tối ưu hóa caching layer cho `npm ci` trong Dockerfile**
  Nội dung: Đặt `COPY package*.json` trước khi `COPY .` để tận dụng Docker layer caching.
  Kỳ vọng: chạy `npm test` (jest trong backend) → vẫn PASS, hành vi không đổi.
- [ ] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test`
  Kết quả mong đợi: tất cả PASS 4/4 test suites của backend.

---

### Task 2: Xây dựng và kiểm thử Dockerfile cho Frontend Next.js với Build ARG

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: `frontend/Dockerfile`, `frontend/.dockerignore`
- Chỉnh sửa: không có
- Test tương ứng: `frontend/src/hooks/useSocket.test.ts`
- Kiểm chứng bằng: `npm test`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Docker Compose Service `frontend`
- Gọi tới: Backend WebSocket URL qua `NEXT_PUBLIC_BACKEND_URL`
- Regression test cần chạy thêm: `npm test`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: source code frontend hiện tại
- Cung cấp đầu ra cho: Task 3 (`docker-compose.prod.yml` service frontend)

- [ ] **Bước 1 [RED]: Viết test kiểm tra socket hook nhận đúng URL từ biến môi trường**
  Vị trí file test: `frontend/src/hooks/useSocket.test.ts`
  Test case: Kiểm tra `useSocket` khởi tạo Socket.IO với địa chỉ URL được truyền từ biến `process.env.NEXT_PUBLIC_BACKEND_URL`.
  Kỳ vọng: chạy `npm test` (jest trong frontend) → FAIL nếu thiếu mock env hoặc logic không khớp.
- [ ] **Bước 2 [GREEN]: Tạo `frontend/.dockerignore` và `frontend/Dockerfile` multi-stage với `ARG NEXT_PUBLIC_BACKEND_URL`**
  Vị trí file: `frontend/Dockerfile`, `frontend/.dockerignore`
  Nội dung: Dockerfile gồm stage `builder` nhận `ARG NEXT_PUBLIC_BACKEND_URL` và `npm run build`, sau đó stage `runner` khởi chạy `npm run start` trên port 3000.
  Kỳ vọng: chạy `npm test` (jest trong frontend) → PASS.
- [ ] **Bước 3 [REFACTOR] (nếu cần): Tinh chỉnh `.dockerignore` để loại trừ `.next`, `node_modules`**
  Nội dung: Loại bỏ các file rác khỏi build context của frontend.
  Kỳ vọng: chạy `npm test` (jest trong frontend) → vẫn PASS, hành vi không đổi.
- [ ] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test`
  Kết quả mong đợi: tất cả PASS 9/9 test suites của frontend.

---

### Task 3: Thiết lập Docker Compose Stack (`docker-compose.prod.yml`) và tài liệu hướng dẫn Dokploy

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: `docker-compose.prod.yml`, `.env.example`, `docs/DOKPLOY_DEPLOYMENT_GUIDE.md`
- Chỉnh sửa: `README.md`
- Test tương ứng: `backend/src/app.controller.spec.ts`
- Kiểm chứng bằng: `npm test`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Dokploy Compose engine
- Gọi tới: `backend/Dockerfile` và `frontend/Dockerfile`
- Regression test cần chạy thêm: `npm test`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: `backend/Dockerfile` (Task 1) và `frontend/Dockerfile` (Task 2)
- Cung cấp đầu ra cho: Task 4 (Kiểm thử tích hợp và đẩy lên GitHub)

- [ ] **Bước 1 [RED]: Viết test kiểm tra tính toàn vẹn của cấu hình port và service**
  Vị trí file test: `backend/src/app.controller.spec.ts`
  Test case: Kiểm tra module backend khởi động đúng port và routes sẵn sàng cho reverse proxy.
  Kỳ vọng: chạy `npm test` (jest trong backend) → FAIL nếu controller spec chưa đáp ứng.
- [ ] **Bước 2 [GREEN]: Tạo `docker-compose.prod.yml`, `.env.example` và tài liệu `docs/DOKPLOY_DEPLOYMENT_GUIDE.md`**
  Vị trí file: `docker-compose.prod.yml`, `.env.example`, `docs/DOKPLOY_DEPLOYMENT_GUIDE.md`
  Nội dung:
  - `docker-compose.prod.yml`: Khai báo 2 service `backend` (port 3001, ENV `HOST_PIN`, `PORT`) và `frontend` (port 3000, build arg `NEXT_PUBLIC_BACKEND_URL=https://${API_DOMAIN}`).
  - `.env.example`: Mẫu biến `HOST_PIN`, `API_DOMAIN`, `PORT`.
  - `docs/DOKPLOY_DEPLOYMENT_GUIDE.md`: Hướng dẫn từng bước cấu hình trên giao diện Dokploy Dashboard (Tạo Compose Service, nhập repo GitHub `h004888/mln-game`, cấu hình Traefik Domains cho Frontend & Backend, bật Let's Encrypt SSL).
  Kỳ vọng: chạy `npm test` (jest trong backend) → PASS.
- [ ] **Bước 3 [REFACTOR] (nếu cần): Bổ sung hướng dẫn kiểm tra WebSocket Traefik Header trong tài liệu**
  Nội dung: Ghi chú cách kiểm tra kết nối `wss://` khi deploy trên Dokploy.
  Kỳ vọng: chạy `npm test` (jest trong backend) → vẫn PASS, hành vi không đổi.
- [ ] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test`
  Kết quả mong đợi: tất cả PASS.

---

### Task 4: Kiểm thử toàn bộ hệ thống và đồng bộ lên GitHub

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: không có
- Chỉnh sửa: toàn bộ repository
- Test tương ứng: toàn bộ test suite backend và frontend
- Kiểm chứng bằng: `npm test`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: GitHub remote origin
- Gọi tới: `https://github.com/h004888/mln-game.git`
- Regression test cần chạy thêm: toàn bộ test suites

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Task 1, Task 2, Task 3
- Cung cấp đầu ra cho: Triển khai trực tiếp trên Dokploy từ GitHub

- [ ] **Bước 1 [RED]: Chạy kiểm thử toàn bộ test suite backend**
  Vị trí: Toàn bộ test suite backend
  Kỳ vọng: chạy `npm test` (jest trong backend) → FAIL nếu phát hiện bất kỳ lỗi hồi quy nào.
- [ ] **Bước 2 [GREEN]: Chạy kiểm thử toàn bộ test suite frontend và xác nhận pass**
  Vị trí: Toàn bộ test suite frontend
  Kỳ vọng: chạy `npm test` (jest trong frontend) → PASS.
- [ ] **Bước 3 [REFACTOR] (nếu cần): Tối ưu commit và cập nhật README.md**
  Nội dung: Cập nhật hướng dẫn chạy Docker Production trong `README.md`.
  Kỳ vọng: chạy `npm test` (jest) → vẫn PASS, hành vi không đổi.
- [ ] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test`
  Kết quả mong đợi: 100% tests PASS, commit và đẩy code lên nhánh `main` của `https://github.com/h004888/mln-game.git`.

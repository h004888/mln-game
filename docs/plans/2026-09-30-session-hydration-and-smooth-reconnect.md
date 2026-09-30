# Triệt Tiêu Hiện Tượng Chớp Nháy & Tự Động Khôi Phục Phiên Mượt Mà (Session Hydration Gate) — Kế hoạch triển khai

**Mục tiêu:** Xử lý tận gốc hiện tượng chớp nháy (flash) màn hình nhập tên khi người chơi F5 (reload) trang, xây dựng cổng chặn trạng thái khôi phục phiên (Session Hydration Gate) và hiệu ứng chuyển cảnh mượt mà giữa các trạng thái phòng đấu.

**Cách tiếp cận:** Áp dụng phương pháp TDD (Test-Driven Development). Bổ sung cờ trạng thái `isRestoringSession` trong hook `useSocket` để quản lý vòng đời phục hồi phiên Socket.IO; xây dựng màn hình chờ đồng bộ tinh tế (Loading Screen) trên `PlayerPage` nhằm loại bỏ hoàn toàn việc render form nhập tên khi phiên chơi cũ đang được xác thực với server.

**Đã tra cứu codebase (codebase-memory-mcp):**
- Đã xác nhận qua `search_graph`: `useSocket` (`C-Users-ADMIN-Downloads-mln-game.frontend.src.hooks.useSocket.useSocket`) khởi tạo `me = null`, đọc `localStorage.getItem('mln_player_session')` bất đồng bộ trong `useEffect`.
- Đã xác nhận qua `get_code_snippet`: `PlayerPage` (`frontend/src/app/page.tsx`) kiểm tra điều kiện `!isRegistered` (tức `!me`) tại render đầu tiên, dẫn đến việc render ngay Form nhập tên trong 200–400ms trước khi `player:reconnected` được kích hoạt.
- Đã xác nhận qua `search_graph`: `reconnectPlayer` (`backend/src/game/game.service.ts`) xử lý việc gán lại socket ID mới cho `Player` và phát `player:reconnected` cùng `room:updated`.

**Framework test & quy ước (đã xác nhận qua codebase-memory-mcp):**
- Framework: Jest (`jest-environment-jsdom` + `@testing-library/react` tại frontend).
- Vị trí đặt file test: Cùng thư mục với file mã nguồn (`frontend/src/hooks/useSocket.test.ts`, `frontend/src/app/page.test.tsx`).
- Lệnh chạy test: `npm test` (trong thư mục `frontend`).

## Ràng buộc chung (Global Constraints)

- Mọi task viết/sửa hành vi code phải theo chu trình Red → Green → Refactor.
- Không có task nào được đánh dấu hoàn tất nếu thiếu test tự động tương ứng và log xác nhận PASS.
- Không sử dụng workaround hoặc patch timeout tùy tiện; giải quyết triệt để từ tầng quản trị trạng thái React.
- Đảm bảo 100% test suites frontend và backend đều PASS không hồi quy.

---

### Task 1: Hook Session Hydration State Management (useSocket.ts)

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: Không có
- Chỉnh sửa: `frontend/src/hooks/useSocket.ts` (`C-Users-ADMIN-Downloads-mln-game.frontend.src.hooks.useSocket.useSocket`)
- Test tương ứng: `frontend/src/hooks/useSocket.test.ts`
- Kiểm chứng bằng: `npm test -- src/hooks/useSocket.test.ts`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: `PlayerPage` (`frontend/src/app/page.tsx`), `HostPage` (`frontend/src/app/host/page.tsx`), `ProjectorScreenPage` (`frontend/src/app/screen/page.tsx`)
- Gọi tới: `socket.io-client`, `localStorage`
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/app/page.test.tsx`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Dữ liệu `mln_player_session` trong `localStorage` và các socket events (`player:reconnected`, `session:invalid`, `player:joined`).
- Cung cấp đầu ra cho: `PlayerPage` sử dụng cờ `isRestoringSession` để quyết định hiển thị màn hình chờ hay form đăng ký.

- [ ] **Bước 1 [RED]: Viết test cho `useSocket` kiểm tra cờ `isRestoringSession` bắt đầu bằng true khi có session và chuyển false khi khôi phục xong hoặc thất bại**
  Vị trí file test: `frontend/src/hooks/useSocket.test.ts`
  Test case:
  - Khi `localStorage` có `mln_player_session` và role là `PLAYER`: `result.current.isRestoringSession` ban đầu phải là `true`.
  - Khi nhận `player:reconnected`: `result.current.isRestoringSession` đổi thành `false` và `result.current.me` được thiết lập.
  - Khi nhận `session:invalid`: `result.current.isRestoringSession` đổi thành `false` và `result.current.me` là `null`.
  - Khi `localStorage` không có session: `result.current.isRestoringSession` ngay từ đầu là `false`.
  Kỳ vọng: chạy lệnh `npm test -- src/hooks/useSocket.test.ts` (trong thư mục frontend) → FAIL vì thuộc tính `isRestoringSession` chưa tồn tại trong hook.
- [ ] **Bước 2 [GREEN]: Viết code tối thiểu tại frontend/src/hooks/useSocket.ts để test ở Bước 1 PASS**
  Khai báo `const [isRestoringSession, setIsRestoringSession] = useState(...)`, khởi tạo dựa trên sự tồn tại của `mln_player_session`, và cập nhật thành `false` khi hoàn tất kết nối hoặc lỗi.
  Kỳ vọng: chạy lệnh `npm test -- src/hooks/useSocket.test.ts` (trong thư mục frontend) → PASS.
- [ ] **Bước 3 [REFACTOR] (nếu cần): Tinh chỉnh xử lý timeout an toàn nếu kết nối Socket gặp trục trặc mạng**
  Kỳ vọng: chạy lệnh `npm test -- src/hooks/useSocket.test.ts` (trong thư mục frontend) → vẫn PASS, hành vi không đổi.
- [ ] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test -- src/hooks/useSocket.test.ts` (trong thư mục frontend)
  Kết quả mong đợi: tất cả PASS.

---

### Task 2: Seamless Loading Transition on Player Page (page.tsx)

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: Không có
- Chỉnh sửa: `frontend/src/app/page.tsx` (`C-Users-ADMIN-Downloads-mln-game.frontend.src.app.page.PlayerPage`)
- Test tương ứng: `frontend/src/app/page.test.tsx`
- Kiểm chứng bằng: `npm test -- src/app/page.test.tsx`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Next.js Router
- Gọi tới: `useSocket`, `BuzzerButton`, `soundEffects`
- Regression test cần chạy thêm do có inbound calls: `npm test`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: `isRestoringSession` và `me` từ `useSocket`.
- Cung cấp đầu ra cho: Giao diện người chơi mượt mà, không chớp nháy.

- [ ] **Bước 1 [RED]: Viết test cho PlayerPage hiển thị trạng thái Loading khi `isRestoringSession` đang true và chỉ hiển thị form đăng ký khi session không tồn tại hoặc đã xong**
  Vị trí file test: `frontend/src/app/page.test.tsx`
  Test case:
  - Khi `isRestoringSession === true` và `me === null`: Component render màn hình chờ "Đang kết nối lại phòng đấu...", không render "BUZZER ARENA".
  - Khi `isRestoringSession === false` và `me === null`: Component render Form nhập tên "BUZZER ARENA".
  - Khi `me !== null`: Component render giao diện Đấu trường (Buzzer & Score).
  Kỳ vọng: chạy lệnh `npm test -- src/app/page.test.tsx` (trong thư mục frontend) → FAIL vì `PlayerPage` chưa xử lý trạng thái `isRestoringSession`.
- [ ] **Bước 2 [GREEN]: Cập nhật frontend/src/app/page.tsx để test ở Bước 1 PASS**
  Bổ sung nhánh render Loading Screen theo phong cách Neon Cyberpunk khi `isRestoringSession && !me`.
  Kỳ vọng: chạy lệnh `npm test -- src/app/page.test.tsx` (trong thư mục frontend) → PASS.
- [ ] **Bước 3 [REFACTOR] (nếu cần): Tinh chỉnh hiệu ứng chuyển động fadeIn cho màn hình Loading và Đấu trường**
  Kỳ vọng: chạy lệnh `npm test -- src/app/page.test.tsx` (trong thư mục frontend) → vẫn PASS, hành vi không đổi.
- [ ] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test` (trong thư mục frontend)
  Kết quả mong đợi: tất cả các test suites frontend PASS 100%.

# Hoàn thiện Luồng Người Chơi & Role Guard Gameplay — Kế hoạch triển khai

**Mục tiêu:** Khắc phục triệt để lỗi người chơi không tự động vào phòng, đồng bộ phiên chơi chính xác qua xác nhận từ Server, ngăn chặn hoàn toàn việc Máy Chiếu/MC bị nhận nhầm thành người chơi bấm chuông, và hỗ trợ Dynamic Hostname cho kết nối WebSocket trên thiết bị di động.

**Cách tiếp cận:** Áp dụng phương án Full-Stack Architecture Refinement: Thiết lập Role Guard ở backend GameService, bổ sung Dynamic Backend URL Resolver và cơ chế Server-Ack registration ở frontend, hỗ trợ auto-fill tên từ URL query/localStorage và mở khóa Web Audio API trên mobile.

**Đã tra cứu codebase (codebase-memory-mcp):**
- `search_graph` & `trace_path`: Xác nhận `GameService.claimBuzz`, `claimStealBuzz`, `selectCard`, `submitAnswer`, `submitUltimateGuess` hiện tại chưa kiểm tra `player.role === PlayerRole.PLAYER`.
- `get_code_snippet`: Xác nhận `frontend/src/app/page.tsx` dùng cờ `hasJoined` cục bộ thay vì đợi `player:joined`/`player:reconnected` từ server, và chưa đọc `window.location.search`.
- `search_code`: Xác nhận `useSocket.ts` dùng `BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'` chưa có fallback dynamic hostname khi client truy cập từ mobile IP/domain.

**Framework test & quy ước (đã xác nhận qua codebase-memory-mcp):**
- Framework: Jest (`ts-jest` cho backend, `jest` + `@testing-library/react` cho frontend).
- Vị trí đặt file test: `backend/src/game/game.service.spec.ts`, `frontend/src/hooks/useSocket.test.ts`, `frontend/src/app/page.test.tsx`.
- Lệnh chạy test: `npm test` (hoặc `jest`).

## Ràng buộc chung (Global Constraints)

- Mọi task thay đổi code phải tuân thủ nghiêm ngặt chu trình Red → Green → Refactor.
- Không có task nào được coi là hoàn tất nếu chưa có test tự động và log xác nhận PASS.
- Backend Role Guard phải từ chối dứt khoát mọi role khác `PlayerRole.PLAYER` khi thực hiện các hành vi gameplay.
- Frontend phải giữ khả năng tương thích ngược và không làm ảnh hưởng đến luồng điều khiển của MC `/host` và màn hình máy chiếu `/screen`.

---

### Task 1: Thiết lập Role Guard cho toàn bộ gameplay actions trong Backend GameService

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: không có
- Chỉnh sửa: `backend/src/game/game.service.ts`
- Test tương ứng: `backend/src/game/game.service.spec.ts`
- Kiểm chứng bằng: `npm test`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: `GameGateway` (`handleBuzz`, `handleStealBuzz`, `handleSelectCard`, `handleSubmitAnswer`, `handleUltimateGuess`)
- Gọi tới: `GameStateMachine.transition`
- Regression test cần chạy thêm: `npm test`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: socket client events
- Cung cấp đầu ra cho: Task 2 và Task 3 (trạng thái phòng và người chơi chính xác)

- [ ] **Bước 1 [RED]: Viết test kiểm tra Role Guard từ chối Screen và Host bấm chuông hoặc chọn ô**
  Vị trí file test: `backend/src/game/game.service.spec.ts`
  Test case: Gọi `joinRoom` với `PlayerRole.SCREEN` và `PlayerRole.HOST`, sau đó gọi `claimBuzz`, `claimStealBuzz`, `selectCard`, `submitAnswer` -> kỳ vọng bị từ chối với lý do role không hợp lệ.
  Kỳ vọng: chạy `npm test` (jest trong backend) → FAIL vì hiện tại chưa có kiểm tra role trong các hàm này.
- [ ] **Bước 2 [GREEN]: Bổ sung kiểm tra `player.role === PlayerRole.PLAYER` trong `game.service.ts`**
  Vị trí file: `backend/src/game/game.service.ts`
  Nội dung: Thêm điều kiện chặn trong `claimBuzz`, `claimStealBuzz`, `selectCard`, `submitAnswer`, `submitUltimateGuess` nếu `player.role !== PlayerRole.PLAYER`.
  Kỳ vọng: chạy `npm test` (jest trong backend) → PASS.
- [ ] **Bước 3 [REFACTOR] (nếu cần): Tinh chỉnh error messages trả về cho Role Guard**
  Nội dung: Chuẩn hóa thông báo lỗi thân thiện cho client.
  Kỳ vọng: chạy `npm test` (jest trong backend) → vẫn PASS, hành vi không đổi.
- [ ] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test`
  Kết quả mong đợi: 100% test suites backend PASS.

---

### Task 2: Xây dựng Dynamic Backend URL Resolver và đồng bộ Session trong `useSocket.ts`

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: không có
- Chỉnh sửa: `frontend/src/hooks/useSocket.ts`
- Test tương ứng: `frontend/src/hooks/useSocket.test.ts`
- Kiểm chứng bằng: `npm test`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: `PlayerPage`, `HostPage`, `ProjectorScreenPage`
- Gọi tới: Socket.IO client instance
- Regression test cần chạy thêm: `npm test`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: môi trường trình duyệt `window.location`
- Cung cấp đầu ra cho: Task 3 (`PlayerPage` kết nối WebSocket ổn định)

- [ ] **Bước 1 [RED]: Viết test kiểm tra hàm resolve backend URL động theo client hostname**
  Vị trí file test: `frontend/src/hooks/useSocket.test.ts`
  Test case: Kiểm tra trường hợp client mở qua IP non-localhost (ví dụ `103.149.87.43`), socket client kết nối đúng `http://103.149.87.43:3001`.
  Kỳ vọng: chạy `npm test` (jest trong frontend) → FAIL nếu logic URL resolver mới chưa được tích hợp.
- [ ] **Bước 2 [GREEN]: Tích hợp `getBackendUrl()` và hoàn thiện xử lý `leaveRoom` trong `useSocket.ts`**
  Vị trí file: `frontend/src/hooks/useSocket.ts`
  Nội dung: Tạo hàm `getBackendUrl()` tự động fallback thông minh sang hostname trình duyệt; thêm hàm `leaveGame()` để xóa session và reset `me`.
  Kỳ vọng: chạy `npm test` (jest trong frontend) → PASS.
- [ ] **Bước 3 [REFACTOR] (nếu cần): Tinh chỉnh cleanup listener khi socket disconnect**
  Nội dung: Đảm bảo không rò rỉ socket event listener khi re-render.
  Kỳ vọng: chạy `npm test` (jest trong frontend) → vẫn PASS, hành vi không đổi.
- [ ] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test`
  Kết quả mong đợi: 100% test suites frontend PASS.

---

### Task 3: Nâng cấp `PlayerPage` với Server-Ack Registration, Auto-fill URL/Storage và Audio Unlock

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: không có
- Chỉnh sửa: `frontend/src/app/page.tsx`
- Test tương ứng: `frontend/src/app/page.test.tsx`
- Kiểm chứng bằng: `npm test`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Người dùng truy cập route `/`
- Gọi tới: `useSocket`, `SoundEffectsManager`
- Regression test cần chạy thêm: `npm test`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Task 1, Task 2
- Cung cấp đầu ra cho: Trải nghiệm người chơi hoàn chỉnh trên mobile và máy tính

- [ ] **Bước 1 [RED]: Viết test kiểm tra PlayerPage chỉ chuyển trạng thái khi `me` tồn tại và hỗ trợ auto-fill**
  Vị trí file test: `frontend/src/app/page.test.tsx`
  Test case: Kiểm tra render form nhập tên khi `me === null`, tự động điền tên từ URL query `?name=An`, và chuyển sang giao diện chơi khi `me` hợp lệ.
  Kỳ vọng: chạy `npm test` (jest trong frontend) → FAIL nếu logic render mới chưa được đáp ứng.
- [ ] **Bước 2 [GREEN]: Cập nhật `PlayerPage` với Server-Ack, Auto-fill, W3C accessibility và nút Rời phòng**
  Vị trí file: `frontend/src/app/page.tsx`
  Nội dung: Đọc URL param `name`, lưu `localStorage('mln_saved_name')`, chỉ hiển thị bàn cờ khi `me` hợp lệ, thêm thuộc tính `id`/`name` cho input, và gọi `unlockAudioContext` khi bấm Vào Trận.
  Kỳ vọng: chạy `npm test` (jest trong frontend) → PASS.
- [ ] **Bước 3 [REFACTOR] (nếu cần): Tối ưu giao diện nút "Đổi tên / Rời phòng" trên Header**
  Nội dung: Thiết kế nút rời phòng nhỏ gọn, tinh tế và dễ thao tác trên mobile.
  Kỳ vọng: chạy `npm test` (jest trong frontend) → vẫn PASS, hành vi không đổi.
- [ ] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test`
  Kết quả mong đợi: 100% test suites frontend PASS.

---

### Task 4: Bổ sung Favicon, chạy kiểm thử toàn diện và đồng bộ lên GitHub

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: `frontend/public/favicon.ico`
- Chỉnh sửa: toàn bộ repository
- Test tương ứng: toàn bộ 13 test suites của backend và frontend
- Kiểm chứng bằng: `npm test`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: GitHub remote origin
- Gọi tới: Dokploy Auto-Deploy
- Regression test cần chạy thêm: toàn bộ test suites

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Task 1, Task 2, Task 3
- Cung cấp đầu ra cho: Bản deploy production hoàn hảo trên Dokploy

- [ ] **Bước 1 [RED]: Chạy kiểm thử toàn bộ backend suite để phát hiện hồi quy**
  Vị trí: Backend test suites
  Kỳ vọng: chạy `npm test` (jest trong backend) → FAIL nếu có bất kỳ lỗi không tương thích nào.
- [ ] **Bước 2 [GREEN]: Tạo `frontend/public/favicon.ico` và xác nhận toàn bộ test suite PASS**
  Vị trí: `frontend/public/favicon.ico`, toàn bộ test suites
  Nội dung: Tạo file favicon tĩnh và chạy toàn bộ bộ test frontend.
  Kỳ vọng: chạy `npm test` (jest trong frontend) → PASS.
- [ ] **Bước 3 [REFACTOR] (nếu cần): Tối ưu commit message và tài liệu cập nhật**
  Nội dung: Cập nhật nhật ký thay đổi và hướng dẫn sử dụng query param `?name=...`.
  Kỳ vọng: chạy `npm test` (jest) → vẫn PASS, hành vi không đổi.
- [ ] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test`
  Kết quả mong đợi: 100% tests PASS, commit và push lên nhánh `main` của `https://github.com/h004888/mln-game.git`.

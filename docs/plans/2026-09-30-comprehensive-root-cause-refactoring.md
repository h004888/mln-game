# Tái Cấu Trúc Toàn Diện & Xử Lý Triệt Để 221 Nhận Xét Code Review — Kế hoạch triển khai

**Mục tiêu:** Xử lý tận gốc toàn bộ 221 nhận xét code review (bao gồm tất cả các lỗi Critical, High, Medium, Low) nhằm bảo mật tuyệt đối dữ liệu trò chơi, vá các race condition trong Game Engine, chuẩn hóa tầng giao diện Tailwind CSS và nâng cao tính tin cậy khi triển khai Production.

**Cách tiếp cận:** Áp dụng phương pháp phân lớp chuẩn hóa và quy trình TDD (Test-Driven Development). Xây dựng cơ chế lọc dữ liệu theo vai trò (Role-based DTO Sanitization) để ngăn lộ đáp án và `sessionId`, cô lập trạng thái Singleton trong `QuestionsService`, bảo vệ ScoringEngine khỏi bypass chuỗi rỗng, chuẩn hóa CSS `@layer components` và dọn dẹp các memory leak trong React Lifecycle.

**Đã tra cứu codebase (codebase-memory-mcp):**
- Đã xác nhận qua `get_architecture`: Dự án gồm 2 package chính `backend` (NestJS 10 + Socket.IO + TypeScript) và `frontend` (Next.js 14 App Router + TailwindCSS + Lucide Icons).
- Đã xác nhận qua `search_graph` & `trace_path`: `broadcastRoomState` (`C-Users-ADMIN-Downloads-mln-game.backend.src.game.game.gateway.GameGateway.broadcastRoomState`) gọi `getRoom()` và phát tán toàn bộ object `GameRoom` cho 14 socket handlers, làm lộ `correctIndex`, `secretImageKeyword` và `Player.sessionId` cho mọi client.
- Đã xác nhận qua `get_code_snippet`: `ScoringEngine.checkUltimateGuess` (`backend/src/game/scoring-engine.ts`) thiếu kiểm tra độ dài chuỗi sau chuẩn hóa, khiến `String.includes('')` trả về `true` cho bất kỳ chuỗi rỗng hoặc ký tự đơn lẻ.
- Đã xác nhận qua `get_code_snippet`: `QuestionsService.setCustomGame` (`backend/src/questions/questions.service.ts`) ghi đè trực tiếp lên mảng `defaultQuestions` của Singleton instance.
- Đã xác nhận qua `get_code_snippet`: `WinnerCelebration.tsx` không lưu `rafId` và không hủy `requestAnimationFrame` khi unmount.
- Đã xác nhận qua `get_code_snippet`: `globals.css` định nghĩa `.glass-panel`, `.glass-card`, `.neon-glow-*` sau `@tailwind utilities` mà không có `@layer components`.

**Framework test & quy ước (đã xác nhận qua codebase-memory-mcp):**
- Framework: Jest (Backend sử dụng `ts-jest`, Frontend sử dụng `jest-environment-jsdom` + `@testing-library/react`).
- Vị trí đặt file test: Cùng thư mục với file mã nguồn (`*.spec.ts` tại backend, `*.test.tsx` / `*.test.ts` tại frontend).
- Lệnh chạy test: `npm test` (Backend: `npm test -- ...`, Frontend: `npm test -- ...`).

## Ràng buộc chung (Global Constraints)

- Mọi task viết/sửa hành vi code phải theo chu trình Red → Green → Refactor.
- Không có task nào được đánh dấu hoàn tất nếu thiếu test tự động tương ứng và log xác nhận PASS.
- Không sử dụng workaround hoặc patch tạm thời; xử lý triệt để nguyên nhân gốc rễ.
- Đảm bảo toàn bộ 13 test suites hiện hữu và các test suites mới đều PASS 100% không hồi quy.

---

### Task 1: ScoringEngine & Fuzzy Matching Guard (Ngăn Chặn Đoán Chuỗi Rỗng & Substring Bypass)

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: Không có
- Chỉnh sửa: `backend/src/game/scoring-engine.ts` (`C-Users-ADMIN-Downloads-mln-game.backend.src.game.scoring-engine.ScoringEngine`)
- Test tương ứng: `backend/src/game/scoring-engine.spec.ts`
- Kiểm chứng bằng: `npm test -- src/game/scoring-engine.spec.ts`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: `GameService.submitUltimateGuess` (`backend/src/game/game.service.ts`)
- Gọi tới: Không có
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/game/game.service.spec.ts`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Dữ liệu đoán từ Socket client gửi lên qua `GameGateway.handleUltimateGuess`.
- Cung cấp đầu ra cho: `GameService` để quyết định `autoMatch: true/false` và cộng điểm/đóng băng.

- [ ] **Bước 1 [RED]: Viết test cho ScoringEngine kiểm tra bảo vệ chuỗi rỗng, khoảng trắng, ký tự đặc biệt và độ khớp từ khóa**
  Vị trí file test: `backend/src/game/scoring-engine.spec.ts`
  Test case:
  - `checkUltimateGuess('', 'Vịnh Hạ Long')` -> `false`
  - `checkUltimateGuess('   ', 'Vịnh Hạ Long')` -> `false`
  - `checkUltimateGuess('!@#$', 'Vịnh Hạ Long')` -> `false`
  - `checkUltimateGuess('a', 'Vịnh Hạ Long')` -> `false` (chuỗi đoán ngắn hơn 2 ký tự hoặc chỉ là 1 chữ cái không được khớp substring)
  - `checkUltimateGuess('vinh ha long', 'Vịnh Hạ Long')` -> `true`
  - `checkUltimateGuess('Vịnh Hạ Long tuyệt đẹp', 'Vịnh Hạ Long')` -> `true`
  Kỳ vọng: chạy lệnh `npm test -- src/game/scoring-engine.spec.ts` (trong thư mục backend) → FAIL vì hiện tại chuỗi rỗng và ký tự đơn lẻ đang trả về `true`.
- [ ] **Bước 2 [GREEN]: Viết code tối thiểu tại backend/src/game/scoring-engine.ts để test ở Bước 1 PASS**
  Bổ sung guard `normGuess.length < 2 || normSecret.length < 2` và yêu cầu so khớp chính xác hoặc chuỗi đoán bao hàm toàn bộ từ khóa bí mật.
  Kỳ vọng: chạy lệnh `npm test -- src/game/scoring-engine.spec.ts` (trong thư mục backend) → PASS.
- [ ] **Bước 3 [REFACTOR] (nếu cần): Tối ưu biểu thức normalizeText và các hằng số điểm**
  Kỳ vọng: chạy lệnh `npm test -- src/game/scoring-engine.spec.ts` (trong thư mục backend) → vẫn PASS, hành vi không đổi.
- [ ] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test -- src/game/scoring-engine.spec.ts src/game/game.service.spec.ts` (trong thư mục backend)
  Kết quả mong đợi: tất cả PASS.

---

### Task 2: QuestionsService Immutable Defaults & Custom Game Isolation (Khắc Phục Ghi Đè Singleton)

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: Không có
- Chỉnh sửa: `backend/src/questions/questions.service.ts` (`C-Users-ADMIN-Downloads-mln-game.backend.src.questions.questions.service.QuestionsService`)
- Test tương ứng: `backend/src/questions/questions.service.spec.ts`
- Kiểm chứng bằng: `npm test -- src/questions/questions.service.spec.ts`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: `QuestionsController` (`backend/src/questions/questions.controller.ts`), `GameService.constructor` / `GameService.resetRoom` (`backend/src/game/game.service.ts`)
- Gọi tới: Không có
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/questions/questions.service.spec.ts src/game/game.service.spec.ts`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Dữ liệu cấu hình game từ Host qua API `POST /questions/custom-game` hoặc Socket `host:create_custom_game`.
- Cung cấp đầu ra cho: `GameService` khởi tạo phòng đấu mà không làm biến đổi cấu hình gốc.

- [ ] **Bước 1 [RED]: Viết test chứng minh `getDefaultQuestions()` trả về Deep Copy và `validateCustomGameConfig` từ chối dữ liệu rỗng**
  Vị trí file test: `backend/src/questions/questions.service.spec.ts`
  Test case:
  - Gọi `getDefaultQuestions()`, sửa đổi thuộc tính phần tử trong mảng kết quả → gọi lại `getDefaultQuestions()` xác nhận mảng gốc trong service không bị thay đổi.
  - `validateCustomGameConfig({ secretMedia: { keyword: '   ', imageUrl: 'url' }, questions: [...] })` -> `false`.
  - `validateQuestion({ text: '  ', options: ['A','B','C','D'], correctIndex: 0 })` -> `false`.
  Kỳ vọng: chạy lệnh `npm test -- src/questions/questions.service.spec.ts` (trong thư mục backend) → FAIL vì hiện tại `getDefaultQuestions()` chỉ shallow copy mảng ngoài và validation cho phép khoảng trắng rỗng.
- [ ] **Bước 2 [GREEN]: Viết code tối thiểu tại backend/src/questions/questions.service.ts để test ở Bước 1 PASS**
  Sử dụng `structuredClone` hoặc deep copy map cho `getDefaultQuestions()`, và siết chặt kiểm tra `.trim().length > 0` cho `keyword`, `imageUrl`, `q.text`, `options`.
  Kỳ vọng: chạy lệnh `npm test -- src/questions/questions.service.spec.ts` (trong thư mục backend) → PASS.
- [ ] **Bước 3 [REFACTOR] (nếu cần): Tinh chỉnh cấu trúc hằng số mặc định thành `readonly` freeze array**
  Kỳ vọng: chạy lệnh `npm test -- src/questions/questions.service.spec.ts` (trong thư mục backend) → vẫn PASS, hành vi không đổi.
- [ ] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test -- src/questions/questions.service.spec.ts` (trong thư mục backend)
  Kết quả mong đợi: tất cả PASS.

---

### Task 3: Role-Based DTO Sanitizer & Session Security (Chặn Lộ Đáp Án & Lộ SessionId)

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: `backend/src/game/game-sanitizer.ts`, `backend/src/game/game-sanitizer.spec.ts`
- Chỉnh sửa: `backend/src/game/game.types.ts`, `backend/src/game/game.service.ts`, `frontend/src/types/game.ts`
- Test tương ứng: `backend/src/game/game-sanitizer.spec.ts`, `backend/src/game/game.service.spec.ts`
- Kiểm chứng bằng: `npm test -- src/game/game-sanitizer.spec.ts`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: `GameGateway.broadcastRoomState` (`backend/src/game/game.gateway.ts`)
- Gọi tới: `GameRoom`, `Player`, `Card`
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/game/game.gateway.spec.ts`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: `GameRoom` nội bộ từ `GameService`.
- Cung cấp đầu ra cho: `GameGateway` gửi dữ liệu an toàn tới Client (Host nhận bản đầy đủ, Player và Screen nhận bản đã giấu `correctIndex` của ô chưa mở, giấu `sessionId` của người chơi khác, giấu `secretImageKeyword`/`secretImageUrl`).

- [ ] **Bước 1 [RED]: Viết test cho bộ lọc DTO `sanitizeRoomForPlayer`, `sanitizeRoomForScreen`, `sanitizeRoomForHost`**
  Vị trí file test: `backend/src/game/game-sanitizer.spec.ts`
  Test case:
  - `sanitizeRoomForPlayer(room, 'player-1')`:
    - Ô cờ chưa mở (`isOpened: false`) phải có `question.correctIndex = -1`.
    - Ô cờ đã mở (`isOpened: true`) giữ nguyên `question.correctIndex`.
    - `secretImageKeyword` = `""`, `secretImageUrl` = `""` (nếu trạng thái chưa `GAME_OVER`).
    - `players['player-2'].sessionId` = `undefined` (không lộ token của đối thủ), chỉ giữ `players['player-1'].sessionId` cho chính chủ.
  - `sanitizeRoomForHost(room)`:
    - Giữ đầy đủ `correctIndex`, `secretImageKeyword`, `secretImageUrl`.
  Kỳ vọng: chạy lệnh `npm test -- src/game/game-sanitizer.spec.ts` (trong thư mục backend) → FAIL vì file và hàm chưa tồn tại.
- [ ] **Bước 2 [GREEN]: Tạo mới backend/src/game/game-sanitizer.ts và triển khai các hàm lọc DTO để test ở Bước 1 PASS**
  Kỳ vọng: chạy lệnh `npm test -- src/game/game-sanitizer.spec.ts` (trong thư mục backend) → PASS.
- [ ] **Bước 3 [REFACTOR] (nếu cần): Tối ưu hóa hiệu năng sao chép và cập nhật interface trong frontend/src/types/game.ts**
  Kỳ vọng: chạy lệnh `npm test -- src/game/game-sanitizer.spec.ts` (trong thư mục backend) → vẫn PASS, hành vi không đổi.
- [ ] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test -- src/game/game-sanitizer.spec.ts src/game/game.service.spec.ts` (trong thư mục backend)
  Kết quả mong đợi: tất cả PASS.

---

### Task 4: Gateway Concurrency & Safe Timer Lifecycle (Bảo Vệ Timer & Callback An Toàn)

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: Không có
- Chỉnh sửa: `backend/src/game/game.gateway.ts` (`C-Users-ADMIN-Downloads-mln-game.backend.src.game.game.gateway.GameGateway`), `backend/src/game/timer-manager.ts`
- Test tương ứng: `backend/src/game/game.gateway.spec.ts`
- Kiểm chứng bằng: `npm test -- src/game/game.gateway.spec.ts`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Socket.IO Server nhận message từ clients
- Gọi tới: `TimerManager`, `GameService`, `game-sanitizer`
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/game/game.gateway.spec.ts`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Các socket events (`player:select_card`, `player:submit_answer`, `host:open_buzzer`, etc.).
- Cung cấp đầu ra cho: Phát sóng cập nhật trạng thái phân quyền qua `sanitizeRoomFor*`.

- [ ] **Bước 1 [RED]: Viết test kiểm tra Gateway không clear timer khi client không hợp lệ gọi và bọc try/catch an toàn trong timeout callback**
  Vị trí file test: `backend/src/game/game.gateway.spec.ts`
  Test case:
  - Gửi `player:select_card` từ socket không phải activePlayer → timer đang chạy không bị xóa mất (`timerManager.clear()` không được gọi trước khi validation pass).
  - Khi timer hết giờ, callback xử lý `submitAnswer` trong khối `try/catch`, phát sự kiện thông báo kết quả và không làm sập process nếu xảy ra lỗi.
  - Broadcast gửi DTO tương ứng với role của từng socket kết nối.
  Kỳ vọng: chạy lệnh `npm test -- src/game/game.gateway.spec.ts` (trong thư mục backend) → FAIL với các trường hợp chưa validate trước khi clear timer.
- [ ] **Bước 2 [GREEN]: Cập nhật backend/src/game/game.gateway.ts để test ở Bước 1 PASS**
  Chuyển `timerManager.clear()` vào sau khối kiểm tra quyền của `activePlayerId`, bọc `try/catch` trong expire callback của TimerManager, và tích hợp bộ lọc `game-sanitizer` khi phát `room:updated` / `room:state`.
  Kỳ vọng: chạy lệnh `npm test -- src/game/game.gateway.spec.ts` (trong thư mục backend) → PASS.
- [ ] **Bước 3 [REFACTOR] (nếu cần): Tinh chỉnh hàm `broadcastRoomState` phân nhóm socket theo role**
  Kỳ vọng: chạy lệnh `npm test -- src/game/game.gateway.spec.ts` (trong thư mục backend) → vẫn PASS, hành vi không đổi.
- [ ] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test` (trong thư mục backend)
  Kết quả mong đợi: toàn bộ test suite backend PASS.

---

### Task 5: Frontend CSS Layering & Next.js Layout Viewport Cleanup (Chuẩn Hóa CSS Layer & Metadata)

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: `frontend/src/app/layout.test.tsx`
- Chỉnh sửa: `frontend/src/app/globals.css`, `frontend/src/app/layout.tsx` (`C-Users-ADMIN-Downloads-mln-game.frontend.src.app.layout.RootLayout`), `frontend/tailwind.config.js`
- Test tương ứng: `frontend/src/app/layout.test.tsx`
- Kiểm chứng bằng: `npm test -- src/app/layout.test.tsx`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Next.js Compiler & App Router Pages (`page.tsx`, `host/page.tsx`, `screen/page.tsx`)
- Gọi tới: Tailwind base, components, utilities
- Regression test cần chạy thêm do có inbound calls: `npm test`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Cấu hình CSS và tokens.
- Cung cấp đầu ra cho: Tất cả các UI components để utility classes ghi đè đúng độ ưu tiên.

- [ ] **Bước 1 [RED]: Viết test kiểm tra RootLayout tuân thủ Next.js Metadata API và không render thủ công thẻ meta viewport trong JSX**
  Vị trí file test: `frontend/src/app/layout.test.tsx`
  Test case:
  - Kiểm tra `layout.tsx` export đối tượng `viewport` với `{ width: 'device-width', initialScale: 1 }`.
  - Khẳng định không có thẻ `<meta name="viewport">` viết tay bên trong thẻ `<head>`.
  Kỳ vọng: chạy lệnh `npm test -- src/app/layout.test.tsx` (trong thư mục frontend) → FAIL vì test file chưa có và `layout.tsx` đang chứa thẻ `<meta>` thủ công.
- [ ] **Bước 2 [GREEN]: Cập nhật frontend/src/app/globals.css, frontend/src/app/layout.tsx và frontend/tailwind.config.js để test ở Bước 1 PASS**
  - Đưa `.glass-panel`, `.glass-card`, `.neon-glow-*` vào `@layer components { ... }` trong `globals.css`.
  - Bổ sung `-webkit-backdrop-filter` cho `.glass-card`.
  - Xuất `export const viewport: Viewport` và loại bỏ `<head>` thủ công khỏi `layout.tsx`.
  - Khai báo keyframes `fadeIn` trong `tailwind.config.js`.
  Kỳ vọng: chạy lệnh `npm test -- src/app/layout.test.tsx` (trong thư mục frontend) → PASS.
- [ ] **Bước 3 [REFACTOR] (nếu cần): Dọn dẹp các biến CSS và quy tắc thừa trong globals.css**
  Kỳ vọng: chạy lệnh `npm test -- src/app/layout.test.tsx` (trong thư mục frontend) → vẫn PASS, hành vi không đổi.
- [ ] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test` (trong thư mục frontend)
  Kết quả mong đợi: toàn bộ test suite frontend PASS.

---

### Task 6: Frontend React Lifecycle, Animation Cleanups & Input Validation (Dọn Dẹp Lifecycle & Validator)

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: `frontend/src/components/screen/WinnerCelebration.test.tsx`
- Chỉnh sửa:
  - `frontend/src/components/screen/WinnerCelebration.tsx` (`C-Users-ADMIN-Downloads-mln-game.frontend.src.components.screen.WinnerCelebration.WinnerCelebration`)
  - `frontend/src/components/host/HostActionToolbar.tsx` (`C-Users-ADMIN-Downloads-mln-game.frontend.src.components.host.HostActionToolbar.HostActionToolbar`)
  - `frontend/src/components/host/HostLoginModal.tsx` (`C-Users-ADMIN-Downloads-mln-game.frontend.src.components.host.HostLoginModal.HostLoginModal`)
  - `frontend/src/components/host/GameStudioModal.tsx` (`C-Users-ADMIN-Downloads-mln-game.frontend.src.components.host.GameStudioModal.GameStudioModal`)
  - `frontend/src/app/screen/page.tsx` (`C-Users-ADMIN-Downloads-mln-game.frontend.src.app.screen.page.ProjectorScreenPage`)
- Test tương ứng:
  - `frontend/src/components/host/HostActionToolbar.test.tsx`
  - `frontend/src/components/host/GameStudioModal.test.tsx`
  - `frontend/src/components/host/HostLoginModal.test.tsx`
  - `frontend/src/components/screen/WinnerCelebration.test.tsx`
- Kiểm chứng bằng: `npm test -- src/components/screen/WinnerCelebration.test.tsx src/components/host/HostActionToolbar.test.tsx src/components/host/GameStudioModal.test.tsx`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: `HostPage`, `ProjectorScreenPage`
- Gọi tới: `confetti`, Lucide icons, `useSocket`
- Regression test cần chạy thêm do có inbound calls: `npm test`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Tương tác người dùng (phím bấm, import JSON, modal toggle).
- Cung cấp đầu ra cho: UI ổn định, không rò rỉ bộ nhớ, không chặn phím gõ trong input text.

- [ ] **Bước 1 [RED]: Viết test kiểm tra hủy animation loop trong WinnerCelebration, chặn phím Space lặp/trong input trong HostActionToolbar, và kiểm chuẩn JSON trong GameStudioModal**
  Vị trí file test:
  - `frontend/src/components/screen/WinnerCelebration.test.tsx`
  - `frontend/src/components/host/HostActionToolbar.test.tsx`
  - `frontend/src/components/host/GameStudioModal.test.tsx`
  Test case:
  - `WinnerCelebration`: Khi unmount, gọi `cancelAnimationFrame` và `confetti.reset()`.
  - `HostActionToolbar`: Phím Space khi `e.repeat === true` hoặc khi target là `INPUT`, `TEXTAREA`, `SELECT`, `contenteditable` không gọi `onOpenBuzzer()`.
  - `GameStudioModal`: Khi import JSON có phần tử thiếu `options` hoặc `options.length !== 4`, hiển thị thông báo lỗi chi tiết và không lưu vào state.
  - `HostLoginModal`: Placeholder không chứa chuỗi mã PIN mặc định `8888`.
  - `screen/page.tsx`: Câu hỏi hiển thị khi trạng thái là `QUESTION_ACTIVE` hoặc `STEAL_OPEN`.
  Kỳ vọng: chạy lệnh `npm test -- src/components/screen/WinnerCelebration.test.tsx src/components/host/HostActionToolbar.test.tsx src/components/host/GameStudioModal.test.tsx` (trong thư mục frontend) → FAIL do các điều kiện chặn chưa được bổ sung đầy đủ.
- [ ] **Bước 2 [GREEN]: Cập nhật WinnerCelebration, HostActionToolbar, HostLoginModal, GameStudioModal, screen/page.tsx để test ở Bước 1 PASS**
  - Thêm `cancelAnimationFrame(rafId)` & `confetti.reset()` vào effect cleanup.
  - Bổ sung `isEditable` & `e.repeat` guard cho phím Spacebar.
  - Sửa placeholder `HostLoginModal` thành "Nhập mã PIN MC...".
  - Thêm type guard `isValidQuestion` kiểm tra toàn diện mảng câu hỏi import trong `GameStudioModal`.
  - Cập nhật `isQuestionActive` tại `screen/page.tsx` bao gồm cả `STEAL_OPEN`.
  Kỳ vọng: chạy lệnh `npm test -- src/components/screen/WinnerCelebration.test.tsx src/components/host/HostActionToolbar.test.tsx src/components/host/GameStudioModal.test.tsx` (trong thư mục frontend) → PASS.
- [ ] **Bước 3 [REFACTOR] (nếu cần): Tinh chỉnh xử lý lỗi thân thiện trong GameStudioModal**
  Kỳ vọng: chạy lệnh `npm test` (trong thư mục frontend) → vẫn PASS, hành vi không đổi.
- [ ] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test` (trong thư mục frontend)
  Kết quả mong đợi: tất cả các test suites frontend PASS 100%.

---

### Task 7: Docker, Security Headers & Environment Hardening (Chạy Non-Root & Cấu Hình Môi Trường)

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: `backend/src/main.spec.ts`
- Chỉnh sửa:
  - `backend/src/main.ts` (`C-Users-ADMIN-Downloads-mln-game.backend.src.main`)
  - `backend/Dockerfile`
  - `frontend/Dockerfile`
  - `docker-compose.yml`
  - `docker-compose.prod.yml`
  - `.gitignore`
- Test tương ứng: `backend/src/main.spec.ts`
- Kiểm chứng bằng: `npm test -- src/main.spec.ts`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Node process runner, Docker Compose, Git
- Gọi tới: NestJS bootstrap, Alpine Linux OS user
- Regression test cần chạy thêm do có inbound calls: `npm test` (ở backend và frontend)

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Cấu hình biến môi trường (`CORS_ORIGIN`, `PORT`, `NODE_ENV`).
- Cung cấp đầu ra cho: Hệ thống build Docker an toàn, quyền hạn tối thiểu (least privilege).

- [ ] **Bước 1 [RED]: Viết test kiểm tra bootstrap backend xử lý lỗi khởi động và CORS origin không phản chiếu nguy hiểm khi credentials bật**
  Vị trí file test: `backend/src/main.spec.ts`
  Test case:
  - Kiểm tra hàm cấu hình CORS nhận diện đúng whitelist từ biến môi trường hoặc chế độ an toàn.
  - Kiểm tra bắt lỗi `bootstrap().catch(...)` không để unhandled rejection thoát ra ngoài.
  Kỳ vọng: chạy lệnh `npm test -- src/main.spec.ts` (trong thư mục backend) → FAIL vì test file chưa tồn tại.
- [ ] **Bước 2 [GREEN]: Cập nhật backend/src/main.ts, backend/Dockerfile, frontend/Dockerfile, .gitignore để test ở Bước 1 PASS**
  - Trong `backend/src/main.ts`: Thêm `bootstrap().catch(...)` và cấu hình CORS chặt chẽ dựa theo `process.env.CORS_ORIGIN || true`.
  - Trong `backend/Dockerfile`: Chuyển sang `USER node` trong stage runner.
  - Trong `.gitignore`: Bổ sung `.env`, `.env.*`, `!.env.example`, `!.env.sample`.
  - Trong `docker-compose.yml`: Bỏ hardcode cố định backend localhost.
  Kỳ vọng: chạy lệnh `npm test -- src/main.spec.ts` (trong thư mục backend) → PASS.
- [ ] **Bước 3 [REFACTOR] (nếu cần): Tối ưu hóa file Dockerfile multi-stage để giảm dung lượng image**
  Kỳ vọng: chạy lệnh `npm test` (trong thư mục backend) → vẫn PASS, hành vi không đổi.
- [ ] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test` (tại backend) và `npm test` (tại frontend)
  Kết quả mong đợi: tất cả test suites ở cả 2 package PASS 100%.

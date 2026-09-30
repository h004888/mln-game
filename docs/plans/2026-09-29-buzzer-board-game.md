# Buzzer-driven Board Game (NestJS + Next.js) — Kế hoạch triển khai

**Mục tiêu:** Xây dựng hoàn chỉnh trò chơi "Bấm chuông giành quyền chọn ô" (Buzzer-driven Board Game) cho 30 người chơi realtime với kiến trúc NestJS (Backend) + Next.js (Frontend) gồm 3 giao diện (Projector, Host, Player Mobile), luật Thắng ngay khi đoán ảnh gốc (Instant Win) và câu hỏi trắc nghiệm A/B/C/D.

**Cách tiếp cận:** Tiếp cận TDD-first (Red -> Green -> Refactor), phát triển lõi Game Engine & State Machine độc lập có kiểm thử unit chặt chẽ trước, tiếp đến WebSocket Gateway xử lý tranh chấp mili-giây, sau đó tích hợp các giao diện người dùng Next.js với Socket.IO client và cuối cùng là kiểm thử tích hợp E2E đa người chơi.

**Đã tra cứu codebase (codebase-memory-mcp):**
- Đã kiểm tra workspace `c:\Users\ADMIN\Downloads\mln-game`: thư mục dự án mới hoàn toàn, khởi tạo cấu trúc Monorepo tiêu chuẩn gồm `backend/` (NestJS) và `frontend/` (Next.js).

**Framework test & quy ước (đã xác nhận qua codebase-memory-mcp):**
- Framework: Jest (cho cả NestJS Backend và Next.js Frontend).
- Vị trí đặt file test: Backend tại `backend/src/**/*.spec.ts` và `backend/test/*.e2e-spec.ts`; Frontend tại `frontend/src/**/*.test.tsx`.
- Lệnh chạy test:
  - Backend Unit Tests: `npm run test --prefix backend`
  - Backend E2E Tests: `npm run test:e2e --prefix backend`
  - Frontend Component Tests: `npm run test --prefix frontend`
  - All Tests: `npm test`

## Ràng buộc chung (Global Constraints)

- Mọi task viết/sửa hành vi code phải theo chu trình Red → Green → Refactor.
- Không có task nào được đánh dấu hoàn tất nếu thiếu test tự động tương ứng và log xác nhận PASS.
- Cơ chế Bấm chuông (Buzzer) phải đảm bảo Atomic Lock ở tầng server để xử lý Race Condition khi 30 người bấm trong cùng mili-giây.
- Hỗ trợ đầy đủ 3 giao diện độc lập: Player Mobile (`/`), Host MC Controller (`/host`), Big Screen Projector (`/screen`).
- Tuân thủ Luật 1: Đoán trúng ảnh gốc là Thắng cuộc ngay lập tức (Instant Win), kết thúc game và vinh danh MVP.

---

### Task 1: Khởi tạo Cấu trúc Dự án Monorepo và Môi trường Test

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới:
  - `package.json` (Root scripts điều phối chạy đồng thời backend + frontend)
  - `backend/package.json`, `backend/tsconfig.json`, `backend/src/main.ts`, `backend/src/app.module.ts`
  - `frontend/package.json`, `frontend/tsconfig.json`, `frontend/next.config.js`, `frontend/src/app/layout.tsx`
- Chỉnh sửa: Không có
- Test tương ứng: `backend/src/app.controller.spec.ts`, `frontend/src/app/page.test.tsx`
- Kiểm chứng bằng: `npm test`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Không có (Root setup ban đầu)
- Gọi tới: Cung cấp môi trường chạy cho toàn bộ các Task tiếp theo
- Regression test cần chạy thêm do có inbound calls: không cần

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Thiết kế kiến trúc NestJS + Next.js
- Cung cấp đầu ra cho: Toàn bộ Task 2 đến Task 8

- [x] **Bước 1 [RED]: Viết test kiểm tra khởi động App Module Backend và Render cơ bản Frontend**
  Vị trí file test: `backend/src/app.controller.spec.ts` và `frontend/src/app/page.test.tsx`
  Test case: Backend controller phản hồi status "OK", Frontend render layout ban đầu
  Kỳ vọng: chạy `npm run test --prefix backend` → FAIL do module và controller chưa được triển khai.
- [x] **Bước 2 [GREEN]: Thiết lập project NestJS, Next.js và cấu hình Jest để test ở Bước 1 PASS**
  Kỳ vọng: chạy `npm test` → PASS.
- [x] **Bước 3 [REFACTOR]: Chuẩn hóa scripts root package.json (dev, build, test)**
  Kỳ vọng: chạy `npm test` → vẫn PASS, cấu trúc monorepo sẵn sàng.
- [x] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test`
  Kết quả mong đợi: tất cả PASS.

---

### Task 2: Xây dựng Module Game State & State Machine Core trên NestJS Backend

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới:
  - `backend/src/game/game.types.ts` (State enum, Player, Question, Card, GameRoom interfaces)
  - `backend/src/game/game-state-machine.ts` (Xử lý chuyển đổi trạng thái FSM)
  - `backend/src/game/scoring-engine.ts` (Tính điểm đúng +100, cướp +150, sai -50, đóng băng 2 lượt, MVP)
  - `backend/src/game/game.service.ts` (Quản lý toàn bộ State in-memory của phòng chơi)
- Chỉnh sửa: `backend/src/app.module.ts`
- Test tương ứng: `backend/src/game/game.service.spec.ts`
- Kiểm chứng bằng: `npm run test --prefix backend`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Game Gateway (Task 3)
- Gọi tới: Scoring Engine, Game State Machine
- Regression test cần chạy thêm do có inbound calls: không cần

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Task 1 (Môi trường Backend)
- Cung cấp đầu ra cho: Task 3 (WebSocket Gateway) và Task 4 (Questions Manager)

- [x] **Bước 1 [RED]: Viết test cho Game State Transitions & Scoring Engine**
  Vị trí file test: `backend/src/game/game.service.spec.ts`
  Test case:
  - Chuyển trạng thái: LOBBY -> BUZZER_OPEN -> CARD_SELECTION -> QUESTION_ACTIVE -> INTERMISSION -> GAME_OVER
  - Tính điểm: đúng +100đ và gán cooldown 1 lượt; sai -50đ và chuyển lượt cướp (STEAL_OPEN); cướp đúng +150đ
  - Đoán ảnh gốc đúng: chuyển ngay GAME_OVER với winner là người đoán (Instant Win)
  - Đoán ảnh gốc sai: gán trạng thái isFrozen = 2 lượt cho người chơi
  Kỳ vọng: chạy `npm run test --prefix backend` → FAIL do GameService và FSM chưa tồn tại.
- [x] **Bước 2 [GREEN]: Viết code triển khai GameStateMachine, ScoringEngine và GameService để test ở Bước 1 PASS**
  Kỳ vọng: chạy `npm run test --prefix backend` → PASS.
- [x] **Bước 3 [REFACTOR]: Tối ưu cấu trúc dữ liệu Map cho 30 players và rút gọn code tính điểm**
  Kỳ vọng: chạy `npm run test --prefix backend` → vẫn PASS, logic chặt chẽ.
- [x] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm run test --prefix backend`
  Kết quả mong đợi: tất cả PASS.

---

### Task 3: Xử lý Concurrency & Millisecond Buzzer Lock tại WebSocket Gateway

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới:
  - `backend/src/game/game.gateway.ts` (Socket.IO Gateway với `@SubscribeMessage`)
  - `backend/src/game/timer-manager.ts` (Quản lý đếm ngược 5s chọn ô, 15s trả lời, tự động fallback khi timeout)
- Chỉnh sửa: `backend/src/game/game.module.ts`
- Test tương ứng: `backend/src/game/game.gateway.spec.ts`
- Kiểm chứng bằng: `npm run test --prefix backend`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Client Socket.IO connections (Next.js)
- Gọi tới: `GameService`, `TimerManager`
- Regression test cần chạy thêm do có inbound calls: `backend/src/game/game.service.spec.ts`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Task 2 (`GameService`)
- Cung cấp đầu ra cho: Frontend Clients kết nối WebSocket (Task 5, 6, 7)

- [x] **Bước 1 [RED]: Viết test cho Atomic Buzzer Lock và Race Condition Handling**
  Vị trí file test: `backend/src/game/game.gateway.spec.ts`
  Test case:
  - Giả lập 30 socket clients gửi event `player:buzz` trong cùng mili-giây: chỉ duy nhất 1 socket nhận được phản hồi `buzzer:claimed`, 29 socket khác nhận trạng thái `buzzer:locked`.
  - Người chơi đang bị Cooldown hoặc Freeze gửi `player:buzz` -> bị từ chối.
  - Sau khi giành quyền, nếu không chọn ô trong 5 giây -> TimerManager tự hủy quyền, phạt -50đ và broadcast chuyển trạng thái.
  Kỳ vọng: chạy `npm run test --prefix backend` → FAIL do GameGateway chưa xử lý logic Socket.IO.
- [x] **Bước 2 [GREEN]: Viết code triển khai GameGateway và TimerManager với cờ Atomic Lock để test ở Bước 1 PASS**
  Kỳ vọng: chạy `npm run test --prefix backend` → PASS.
- [x] **Bước 3 [REFACTOR]: Tinh chỉnh cơ chế broadcast event socket để payload gọn nhẹ tối đa**
  Kỳ vọng: chạy `npm run test --prefix backend` → vẫn PASS, không có memory leak timer.
- [x] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm run test --prefix backend`
  Kết quả mong đợi: tất cả PASS.

---

### Task 4: Xây dựng Module Quản lý Ngân hàng Câu hỏi & Mảnh ghép Bức ảnh

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới:
  - `backend/src/questions/questions.types.ts`
  - `backend/src/questions/questions.service.ts` (CRUD câu hỏi, chia lưới ảnh 4x4 / 3x3)
  - `backend/src/questions/questions.controller.ts` (REST API cho Host upload ảnh và danh sách câu hỏi)
  - `backend/src/questions/data/default-questions.json` (Bộ 16 câu hỏi mẫu trắc nghiệm + hình ảnh mặc định)
- Chỉnh sửa: `backend/src/app.module.ts`
- Test tương ứng: `backend/src/questions/questions.service.spec.ts`
- Kiểm chứng bằng: `npm run test --prefix backend`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: `GameService`, `QuestionsController`
- Gọi tới: Không có
- Regression test cần chạy thêm do có inbound calls: `backend/src/game/game.service.spec.ts`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Task 1 (Backend structure)
- Cung cấp đầu ra cho: Task 2 & Task 3 (Dữ liệu câu hỏi cho từng ô thẻ)

- [x] **Bước 1 [RED]: Viết test cho QuestionsService & Image Grid Slicer**
  Vị trí file test: `backend/src/questions/questions.service.spec.ts`
  Test case:
  - Tải bộ câu hỏi mặc định 16 ô tương ứng lưới 4x4.
  - Xác thực câu hỏi trắc nghiệm hợp lệ (đủ 4 lựa chọn A/B/C/D, index đáp án đúng từ 0-3).
  - So khớp từ khóa đoán ảnh gốc (Fuzzy String Matcher: chuẩn hóa tiếng Việt, bỏ dấu, không phân biệt hoa thường).
  Kỳ vọng: chạy `npm run test --prefix backend` → FAIL do QuestionsService chưa được viết.
- [x] **Bước 2 [GREEN]: Viết code triển khai QuestionsService và fuzzy matcher để test ở Bước 1 PASS**
  Kỳ vọng: chạy `npm run test --prefix backend` → PASS.
- [x] **Bước 3 [REFACTOR]: Thêm validation DTO và xử lý edge case chuỗi rỗng**
  Kỳ vọng: chạy `npm run test --prefix backend` → vẫn PASS.
- [x] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm run test --prefix backend`
  Kết quả mong đợi: tất cả PASS.

---

### Task 5: Xây dựng Giao diện Điện thoại Người chơi (Player Mobile View `/`)

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới:
  - `frontend/src/hooks/useSocket.ts` (Quản lý kết nối Socket.IO client, tự động reconnect)
  - `frontend/src/components/player/BuzzerButton.tsx` (Nút bấm chuông khổng lồ, hiệu ứng rung, glow khi mở chuông, trạng thái disable khi cooldown/freeze)
  - `frontend/src/components/player/CardPickerModal.tsx` (Bảng chọn số ô thẻ 1-16 khi giành được quyền)
  - `frontend/src/components/player/AnswerButtons.tsx` (4 nút chọn A, B, C, D to rõ cho ngón tay cái)
  - `frontend/src/components/player/UltimateGuessModal.tsx` (Popup nhập từ khóa đoán ảnh gốc để thắng tức thì)
  - `frontend/src/app/page.tsx` (Trang chính của người chơi)
- Chỉnh sửa: `frontend/src/app/globals.css`
- Test tương ứng: `frontend/src/components/player/BuzzerButton.test.tsx`, `frontend/src/components/player/AnswerButtons.test.tsx`
- Kiểm chứng bằng: `npm run test --prefix frontend`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Người dùng truy cập trên Mobile Browser
- Gọi tới: Backend WebSocket Gateway (Task 3)
- Regression test cần chạy thêm do có inbound calls: không cần

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Backend Socket.IO Events
- Cung cấp đầu ra cho: Người chơi tham gia bấm chuông và trả lời

- [x] **Bước 1 [RED]: Viết test cho BuzzerButton và AnswerButtons Component**
  Vị trí file test: `frontend/src/components/player/BuzzerButton.test.tsx`
  Test case:
  - Nút BuzzerButton hiển thị trạng thái Active khi `gameState === 'BUZZER_OPEN'`.
  - Nút BuzzerButton bị Disabled khi `isFrozen === true` hoặc `hasCooldown === true`.
  - Khi bấm nút Buzzer, callback `emit('player:buzz')` được kích hoạt ngay lập tức.
  - Component AnswerButtons hiển thị 4 lựa chọn A-B-C-D và gửi event khi click.
  Kỳ vọng: chạy `npm run test --prefix frontend` → FAIL do các Component chưa được tạo.
- [x] **Bước 2 [GREEN]: Viết code triển khai BuzzerButton, AnswerButtons, useSocket hook và Page `/` để test ở Bước 1 PASS**
  Kỳ vọng: chạy `npm run test --prefix frontend` → PASS.
- [x] **Bước 3 [REFACTOR]: Tối ưu CSS Touch Event (`active:scale-95`), chống double-tap zoom trên mobile**
  Kỳ vọng: chạy `npm run test --prefix frontend` → vẫn PASS.
- [x] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm run test --prefix frontend`
  Kết quả mong đợi: tất cả PASS.

---

### Task 6: Xây dựng Giao diện Màn hình Lớn Máy chiếu / TV (Projector View `/screen`)

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới:
  - `frontend/src/components/screen/BoardGrid.tsx` (Lưới 16 ô ảnh 3D lật mở mượt mà khi trả lời đúng)
  - `frontend/src/components/screen/QuestionOverlay.tsx` (Khu vực phóng to câu hỏi trắc nghiệm & 4 đáp án A-B-C-D)
  - `frontend/src/components/screen/LiveLeaderboard.tsx` (Top 5 người cao điểm nhất realtime)
  - `frontend/src/components/screen/BigTimerBar.tsx` (Thanh đếm ngược thời gian với hiệu ứng chuyển màu)
  - `frontend/src/components/screen/WinnerCelebration.tsx` (Hiệu ứng pháo hoa Canvas-confetti vinh danh MVP Instant Win)
  - `frontend/src/app/screen/page.tsx` (Trang chuyên dụng 16:9 cho Máy chiếu/TV)
- Chỉnh sửa: `frontend/src/app/globals.css`
- Test tương ứng: `frontend/src/components/screen/BoardGrid.test.tsx`, `frontend/src/components/screen/LiveLeaderboard.test.tsx`
- Kiểm chứng bằng: `npm run test --prefix frontend`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Máy chiếu / TV trung tâm phòng họp
- Gọi tới: Backend WebSocket Gateway (Task 3)
- Regression test cần chạy thêm do có inbound calls: không cần

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Backend Socket.IO Events
- Cung cấp đầu ra cho: Toàn bộ khán phòng theo dõi diễn biến trận đấu

- [x] **Bước 1 [RED]: Viết test cho BoardGrid và LiveLeaderboard Component**
  Vị trí file test: `frontend/src/components/screen/BoardGrid.test.tsx`
  Test case:
  - BoardGrid render đủ 16 mảnh ghép, các ô có trạng thái `isOpened === true` sẽ hiển thị ảnh, ô chưa mở hiển thị số thứ tự.
  - LiveLeaderboard sắp xếp danh sách người chơi theo điểm giảm dần và hiển thị huy chương Top 1, 2, 3.
  - WinnerCelebration xuất hiện khi `gameState === 'GAME_OVER'` kèm thông tin MVP.
  Kỳ vọng: chạy `npm run test --prefix frontend` → FAIL do các Component chưa được viết.
- [x] **Bước 2 [GREEN]: Viết code triển khai BoardGrid, LiveLeaderboard, QuestionOverlay và Page `/screen` để test ở Bước 1 PASS**
  Kỳ vọng: chạy `npm run test --prefix frontend` → PASS.
- [x] **Bước 3 [REFACTOR]: Tinh chỉnh hiệu ứng CSS 3D flip card mượt mà 60 FPS**
  Kỳ vọng: chạy `npm run test --prefix frontend` → vẫn PASS.
- [x] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm run test --prefix frontend`
  Kết quả mong đợi: tất cả PASS.

---

### Task 7: Xây dựng Giao diện Bảng Điều Khiển Host / MC (Host Controller `/host`)

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới:
  - `frontend/src/components/host/HostActionToolbar.tsx` (Nút Mở chuông lượt mới, Reset chuông, Lật toàn bộ ảnh, Force End Game)
  - `frontend/src/components/host/UltimateGuessReviewModal.tsx` (Popup duyệt Đúng/Sai khi người chơi gửi đáp án đoán ảnh gốc)
  - `frontend/src/components/host/PlayerListManagement.tsx` (Danh sách 30 người chơi kèm nút Bỏ đóng băng, Điều chỉnh điểm, Kick)
  - `frontend/src/utils/soundEffects.ts` (Bộ phát âm thanh Web Audio: chuông bấm, chúc mừng đúng, buzzer sai, pháo hoa)
  - `frontend/src/app/host/page.tsx` (Trang bảng điều khiển MC)
- Chỉnh sửa: Không có
- Test tương ứng: `frontend/src/components/host/HostActionToolbar.test.tsx`
- Kiểm chứng bằng: `npm run test --prefix frontend`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Người điều phối trận đấu (MC/Host)
- Gọi tới: Backend WebSocket Gateway (Task 3)
- Regression test cần chạy thêm do có inbound calls: không cần

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Backend Socket.IO Events
- Cung cấp đầu ra cho: Điều khiển luồng chơi toàn hệ thống

- [x] **Bước 1 [RED]: Viết test cho HostActionToolbar và UltimateGuessReviewModal**
  Vị trí file test: `frontend/src/components/host/HostActionToolbar.test.tsx`
  Test case:
  - Nút "Mở chuông mới" gửi event `host:open_buzzer`.
  - Nút "Reset chuông" gửi event `host:reset_buzzer`.
  - Khi có người gửi đoán ảnh gốc, UltimateGuessReviewModal hiển thị từ khóa người chơi nhập cùng 2 nút Duyệt [Đúng - Thắng Ngay] / [Sai - Đóng Băng].
  Kỳ vọng: chạy `npm run test --prefix frontend` → FAIL do component Host chưa được tạo.
- [x] **Bước 2 [GREEN]: Viết code triển khai HostActionToolbar, UltimateGuessReviewModal, soundEffects và Page `/host` để test ở Bước 1 PASS**
  Kỳ vọng: chạy `npm run test --prefix frontend` → PASS.
- [x] **Bước 3 [REFACTOR]: Thêm phím tắt (Spacebar để mở chuông nhanh) cho MC**
  Kỳ vọng: chạy `npm run test --prefix frontend` → vẫn PASS.
- [x] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm run test --prefix frontend`
  Kết quả mong đợi: tất cả PASS.

---

### Task 8: Kiểm thử Tích hợp Toàn diện (E2E Integration & 30-Player Concurrency Test)

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: `backend/test/game-e2e.spec.ts` (Kiểm thử luồng End-to-End WebSocket đa người chơi)
- Chỉnh sửa: Không có
- Test tương ứng: `backend/test/game-e2e.spec.ts`
- Kiểm chứng bằng: `npm run test:e2e --prefix backend`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: CI/CD hoặc lệnh kiểm thử toàn diện
- Gọi tới: Toàn bộ Backend NestJS Gateway và Service
- Regression test cần chạy thêm do có inbound calls: Toàn bộ Unit test của Task 2, 3, 4, 5, 6, 7

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Kết quả hoàn thiện của toàn bộ Task 1 đến Task 7
- Cung cấp đầu ra cho: Bản nghiệm thu phần mềm hoàn chỉnh

- [x] **Bước 1 [RED]: Viết kịch bản E2E mô phỏng 30 socket clients tranh chấp chuông và luồng chiến thắng tức thì**
  Vị trí file test: `backend/test/game-e2e.spec.ts`
  Test case:
  - 30 socket clients kết nối vào phòng game và nhận danh sách player đồng bộ.
  - Host mở chuông -> 30 clients đồng loạt bấm chuông trong 20ms -> chỉ 1 client giành quyền, 29 client khác bị khóa.
  - Client giành quyền chọn ô số 1 -> Trả lời đúng trắc nghiệm -> Lật mảnh ghép ảnh + cộng 100đ + nhận cooldown.
  - Lượt kế tiếp: Client gửi đoán ảnh gốc đúng -> Game chuyển sang `GAME_OVER`, broadcast MVP chiến thắng cho cả 30 clients và Host.
  Kỳ vọng: chạy `npm run test:e2e --prefix backend` → FAIL trước khi kiểm tra toàn diện.
- [x] **Bước 2 [GREEN]: Tinh chỉnh cấu hình tích hợp, CORS và chạy kịch bản E2E để test ở Bước 1 PASS**
  Kỳ vọng: chạy `npm run test:e2e --prefix backend` → PASS.
- [x] **Bước 3 [REFACTOR]: Tối ưu hóa việc dọn dẹp bộ nhớ và đóng socket sau khi trận đấu kết thúc**
  Kỳ vọng: chạy `npm run test:e2e --prefix backend` → vẫn PASS.
- [x] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test`
  Kết quả mong đợi: tất cả Unit test và E2E test đều PASS.

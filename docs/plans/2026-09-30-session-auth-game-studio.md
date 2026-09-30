# Khôi Phục Phiên Chơi (Reconnection), Bảo Mật Host & Game Studio Tùy Biến — Kế hoạch triển khai

**Mục tiêu:** Xây dựng cơ chế khôi phục phiên chơi tự động (Session Reconnection) khi F5/rớt mạng, bảo mật đa lớp bảng điều khiển Host bằng Host PIN Guard, và hệ thống Game Studio cho phép tùy biến đề thi 16 câu và ảnh bí ẩn.

**Cách tiếp cận:** Tách biệt định danh Player khỏi `socket.id` bằng Session UUID bền vững (LocalStorage), bổ sung xác thực Host PIN tại WebSocket Gateway cho mọi sự kiện `host:*`, và mở rộng Game Engine hỗ trợ nạp cấu hình tùy biến (`GameConfigPayload`) từ giao diện Studio hoặc file JSON. Triển khai 100% theo phương pháp TDD (Red → Green → Refactor).

**Đã tra cứu codebase (codebase-memory-mcp):**
- Đã xác nhận cấu trúc qua `search_graph` & `get_architecture`:
  - `backend/src/game/game.service.ts` (`GameService`): Quản lý state phòng chơi, điểm số, thẻ cờ và người chơi theo map `players: Record<string, Player>`.
  - `backend/src/game/game.gateway.ts` (`GameGateway`): Xử lý sự kiện WebSocket `player:join`, `player:buzz`, và các sự kiện `host:*`.
  - `backend/src/questions/questions.service.ts` (`QuestionsService`): Cung cấp 16 câu hỏi mặc định và media bí ẩn.
  - `frontend/src/hooks/useSocket.ts` (`useSocket`): Hook quản lý kết nối socket phía client.
  - `frontend/src/app/page.tsx` (`PlayerPage`): Giao diện người chơi trên điện thoại.
  - `frontend/src/app/host/page.tsx` (`HostPage`): Bảng điều khiển MC.

**Framework test & quy ước (đã xác nhận qua codebase-memory-mcp):**
- Framework Backend: `Jest` (`ts-jest`)
- Vị trí test Backend: Cùng thư mục file nguồn (`backend/src/**/*.spec.ts`)
- Lệnh chạy test Backend: `npm test --prefix backend --`
- Framework Frontend: `Jest` (`@testing-library/react`, `jest-environment-jsdom`)
- Vị trí test Frontend: Cùng thư mục file nguồn (`frontend/src/**/*.test.tsx` / `*.test.ts`)
- Lệnh chạy test Frontend: `npm test --prefix frontend --`

## Ràng buộc chung (Global Constraints)

- Mọi task viết/sửa hành vi code phải theo chu trình Red → Green → Refactor.
- Không có task nào được đánh dấu hoàn tất nếu thiếu test tự động tương ứng và log xác nhận PASS.
- Không sử dụng giải pháp tạm thời (workarounds); đảm bảo 100% giải quyết tận gốc vấn đề kiến trúc.
- Duy trì tính tương thích ngược để toàn bộ 27 test cases hiện có tiếp tục PASS.

---

### Task 1: Module Session Token & Cơ Chế Khôi Phục Kết Nối (Backend)

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: Không có
- Chỉnh sửa: `backend/src/game/game.types.ts`, `backend/src/game/game.service.ts`, `backend/src/game/game.gateway.ts`
- Test tương ứng: `backend/src/game/game.service.spec.ts`, `backend/src/game/game.gateway.spec.ts`
- Kiểm chứng bằng: `npm test --prefix backend -- game.service.spec.ts game.gateway.spec.ts`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: `frontend/src/hooks/useSocket.ts` qua socket events `player:join` và `player:reconnect`.
- Gọi tới: `this.room.players`, `socketToSessionMap`.
- Regression test cần chạy thêm do có inbound calls: `npm test --prefix backend`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Dữ liệu join/reconnect từ socket client (`sessionId`, `role`, `name`).
- Cung cấp đầu ra cho: Trạng thái người chơi được khôi phục đầy đủ (score, isFrozen, status) cho Task 4.

- [ ] **Bước 1 [RED]: Viết test cho hành vi cấp Session Token mới và khôi phục Session cũ khi reconnect**
  Vị trí file test: `backend/src/game/game.service.spec.ts`
  Test case:
  - Khi người chơi mới join room, `joinRoom` tạo ra `sessionId` UUID duy nhất và lưu vào `player.sessionId`.
  - Khi socket ngắt kết nối (`disconnectPlayer`), `player.isOnline` chuyển thành `false` nhưng `player.score` và trạng thái giữ nguyên.
  - Khi socket mới kết nối lại với `reconnectPlayer(newSocketId, sessionId)`, hệ thống cập nhật `socketId` mới, đánh dấu `isOnline = true`, trả về đúng thực thể người chơi cũ.
  - Nếu `sessionId` không tồn tại, `reconnectPlayer` ném lỗi hoặc trả về `null`.
  Kỳ vọng: chạy `npm test --prefix backend -- game.service.spec.ts` → FAIL với lý do `reconnectPlayer` chưa được định nghĩa, không fail vì lỗi cú pháp.
- [ ] **Bước 2 [GREEN]: Viết code tối thiểu tại backend/src/game/game.service.ts và backend/src/game/game.types.ts để test ở Bước 1 PASS**
  Bổ sung `sessionId` vào interface `Player`, bổ sung map ánh xạ `socketToSessionMap` và phương thức `reconnectPlayer(socketId: string, sessionId: string): Player | null`.
  Kỳ vọng: chạy `npm test --prefix backend -- game.service.spec.ts` → PASS.
- [ ] **Bước 3 [RED]: Viết test cho sự kiện Gateway player:reconnect**
  Vị trí file test: `backend/src/game/game.gateway.spec.ts`
  Test case:
  - Client gửi event `player:reconnect` với `sessionId` hợp lệ → Server phát lại event `player:reconnected` kèm dữ liệu player và broadcast `room:updated`.
  - Client gửi `player:reconnect` với `sessionId` không hợp lệ → Server phát event `session:invalid`.
  Kỳ vọng: chạy `npm test --prefix backend -- game.gateway.spec.ts` → FAIL với lý do handler `@SubscribeMessage('player:reconnect')` chưa tồn tại, không fail vì lỗi cú pháp.
- [ ] **Bước 4 [GREEN]: Viết code tối thiểu tại backend/src/game/game.gateway.ts để test ở Bước 3 PASS**
  Thêm handler `@SubscribeMessage('player:reconnect')` gọi `gameService.reconnectPlayer` và phản hồi kết quả tương ứng.
  Kỳ vọng: chạy `npm test --prefix backend -- game.gateway.spec.ts` → PASS.
- [ ] **Bước 5 [REFACTOR] (nếu cần): Tối ưu hóa việc dọn dẹp ánh xạ socketToSession khi người chơi đổi kết nối**
  Đảm bảo khi socket mới gắn vào `sessionId`, socket ID cũ trong `socketToSessionMap` được giải phóng sạch sẽ.
  Kỳ vọng: chạy `npm test --prefix backend -- game.service.spec.ts game.gateway.spec.ts` → vẫn PASS, hành vi không đổi.
- [ ] **Bước 6: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test liên quan tới task (`npm test --prefix backend -- game.service.spec.ts game.gateway.spec.ts`)
  Kết quả mong đợi: tất cả PASS.

---

### Task 2: Host Authentication Guard & Phân Quyền RBAC cho Sự Kiện WebSocket (Backend)

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: Không có
- Chỉnh sửa: `backend/src/game/game.service.ts`, `backend/src/game/game.gateway.ts`
- Test tương ứng: `backend/src/game/game.service.spec.ts`, `backend/src/game/game.gateway.spec.ts`
- Kiểm chứng bằng: `npm test --prefix backend -- game.gateway.spec.ts`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Các client gửi event `host:*`.
- Gọi tới: `gameService.verifyHostPin`, `gameService.isHostAuthenticated`.
- Regression test cần chạy thêm do có inbound calls: `npm test --prefix backend`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Event `host:authenticate` kèm mã PIN từ MC.
- Cung cấp đầu ra cho: Xác thực an toàn cho bảng điều khiển Host ở Task 5.

- [ ] **Bước 1 [RED]: Viết test cho logic xác thực Host PIN và kiểm tra quyền Host**
  Vị trí file test: `backend/src/game/game.service.spec.ts`
  Test case:
  - `authenticateHost(socketId, pin)` trả về `true` và cấp quyền khi PIN khớp với `HOST_PIN` (mặc định `'8888'`).
  - `authenticateHost(socketId, pin)` trả về `false` khi PIN sai.
  - `isHostAuthenticated(socketId)` trả về `true` chỉ khi socket đó đã xác thực PIN thành công.
  Kỳ vọng: chạy `npm test --prefix backend -- game.service.spec.ts` → FAIL với lý do phương thức `authenticateHost` và `isHostAuthenticated` chưa được định nghĩa, không fail vì lỗi cú pháp.
- [ ] **Bước 2 [GREEN]: Viết code tối thiểu tại backend/src/game/game.service.ts để test ở Bước 1 PASS**
  Bổ sung `authenticatedHostSockets: Set<string>` và các hàm xác thực PIN (đọc từ `process.env.HOST_PIN || '8888'`).
  Kỳ vọng: chạy `npm test --prefix backend -- game.service.spec.ts` → PASS.
- [ ] **Bước 3 [RED]: Viết test từ chối các event host:* khi chưa xác thực Host PIN**
  Vị trí file test: `backend/src/game/game.gateway.spec.ts`
  Test case:
  - Socket chưa authenticate gửi `host:open_buzzer` hoặc `host:reset_game` → Server từ chối, gửi event `error` với message `'Unauthorized: Host authentication required'`.
  - Socket đã gửi `host:authenticate` với PIN `'8888'` → Server chấp thuận và cho phép thực thi `host:open_buzzer`.
  Kỳ vọng: chạy `npm test --prefix backend -- game.gateway.spec.ts` → FAIL với lý do Gateway hiện tại cho phép mọi socket gọi `host:*` không cần guard, không fail vì lỗi cú pháp.
- [ ] **Bước 4 [GREEN]: Viết code tối thiểu tại backend/src/game/game.gateway.ts để test ở Bước 3 PASS**
  Thêm handler `@SubscribeMessage('host:authenticate')` và bổ sung kiểm tra quyền `isHostAuthenticated(client.id)` trước khi xử lý các lệnh `host:open_buzzer`, `host:reset_buzzer`, `host:review_ultimate_guess`, `host:force_end`, `host:reset_game`.
  Kỳ vọng: chạy `npm test --prefix backend -- game.gateway.spec.ts` → PASS.
- [ ] **Bước 5 [REFACTOR] (nếu cần): Tạo hàm trợ giúp checkHostAuth(client) trong Gateway để loại bỏ code trùng lặp**
  Kỳ vọng: chạy `npm test --prefix backend -- game.gateway.spec.ts` → vẫn PASS, hành vi không đổi.
- [ ] **Bước 6: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test liên quan tới task (`npm test --prefix backend -- game.gateway.spec.ts`)
  Kết quả mong đợi: tất cả PASS.

---

### Task 3: Game Studio & Custom Game Config Engine (Backend)

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: Không có
- Chỉnh sửa: `backend/src/questions/questions.service.ts`, `backend/src/questions/questions.controller.ts`, `backend/src/game/game.service.ts`, `backend/src/game/game.gateway.ts`
- Test tương ứng: `backend/src/questions/questions.service.spec.ts`, `backend/src/game/game.service.spec.ts`
- Kiểm chứng bằng: `npm test --prefix backend -- questions.service.spec.ts game.service.spec.ts`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Host UI thông qua REST API hoặc WebSocket `host:create_custom_game`.
- Gọi tới: `questionsService.setCustomGame`, `gameService.resetRoomWithConfig`.
- Regression test cần chạy thêm do có inbound calls: `npm test --prefix backend`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Payload bộ 16 câu hỏi và Secret Media tùy biến.
- Cung cấp đầu ra cho: Bàn cờ và câu hỏi được cập nhật chính xác cho toàn bộ người chơi và màn hình trình chiếu ở Task 5.

- [ ] **Bước 1 [RED]: Viết test cho tính năng nạp và kiểm tra tính hợp lệ của bộ câu hỏi tùy biến (16 câu)**
  Vị trí file test: `backend/src/questions/questions.service.spec.ts`
  Test case:
  - `validateCustomGameConfig(config)` kiểm tra cấu trúc: phải đủ 16 câu hỏi, mỗi câu đủ 4 đáp án và `correctIndex` từ 0 đến 3, ảnh bí ẩn và từ khóa không được để trống.
  - `setCustomGame(config)` lưu trữ bộ câu hỏi và thông tin ảnh bí ẩn mới.
  Kỳ vọng: chạy `npm test --prefix backend -- questions.service.spec.ts` → FAIL với lý do các phương thức `validateCustomGameConfig` và `setCustomGame` chưa được định nghĩa, không fail vì lỗi cú pháp.
- [ ] **Bước 2 [GREEN]: Viết code tối thiểu tại backend/src/questions/questions.service.ts để test ở Bước 1 PASS**
  Triển khai các phương thức `validateCustomGameConfig` và `setCustomGame`.
  Kỳ vọng: chạy `npm test --prefix backend -- questions.service.spec.ts` → PASS.
- [ ] **Bước 3 [RED]: Viết test cho GameService.resetRoomWithConfig**
  Vị trí file test: `backend/src/game/game.service.spec.ts`
  Test case:
  - `resetRoomWithConfig(config)` khởi tạo lại 16 thẻ bài với đúng danh sách câu hỏi và hình ảnh mới, đưa trạng thái phòng về `LOBBY`.
  Kỳ vọng: chạy `npm test --prefix backend -- game.service.spec.ts` → FAIL với lý do hàm `resetRoomWithConfig` chưa tồn tại, không fail vì lỗi cú pháp.
- [ ] **Bước 4 [GREEN]: Viết code tối thiểu tại backend/src/game/game.service.ts và backend/src/game/game.gateway.ts để test ở Bước 3 PASS**
  Triển khai `resetRoomWithConfig` trong `GameService` và handler `@SubscribeMessage('host:create_custom_game')` có bọc kiểm tra quyền Host.
  Kỳ vọng: chạy `npm test --prefix backend -- game.service.spec.ts` → PASS.
- [ ] **Bước 5 [REFACTOR] (nếu cần): Tối ưu hóa cấu trúc dữ liệu GameConfigPayload trong backend/src/questions/questions.types.ts**
  Kỳ vọng: chạy `npm test --prefix backend -- questions.service.spec.ts game.service.spec.ts` → vẫn PASS, hành vi không đổi.
- [ ] **Bước 6: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test liên quan tới task (`npm test --prefix backend -- questions.service.spec.ts game.service.spec.ts`)
  Kết quả mong đợi: tất cả PASS.

---

### Task 4: Client Session Persistence & Khôi Phục Trạng Thái Người Chơi (Frontend)

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: `frontend/src/hooks/useSocket.test.ts`
- Chỉnh sửa: `frontend/src/types/game.ts`, `frontend/src/hooks/useSocket.ts`, `frontend/src/app/page.tsx`
- Test tương ứng: `frontend/src/hooks/useSocket.test.ts`
- Kiểm chứng bằng: `npm test --prefix frontend -- useSocket.test.ts`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: `frontend/src/app/page.tsx`.
- Gọi tới: `localStorage.getItem('mln_player_session')`, `socket.emit('player:reconnect')`.
- Regression test cần chạy thêm do có inbound calls: `npm test --prefix frontend`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Backend Task 1 (sự kiện `player:reconnected`, `session:invalid`).
- Cung cấp đầu ra cho: Trải nghiệm người chơi liền mạch, tự động giữ tên và điểm số khi tải lại trang.

- [ ] **Bước 1 [RED]: Viết test cho hook useSocket xử lý lưu Session Token và tự động Reconnect**
  Vị trí file test: `frontend/src/hooks/useSocket.test.ts`
  Test case:
  - Khi `player:joined` nhận được từ server, hook lưu `sessionId` vào `localStorage`.
  - Khi hook khởi tạo lại và thấy có `sessionId` trong `localStorage`, nó tự động emit `player:reconnect` thay vì bắt người dùng nhập lại tên.
  - Khi nhận `session:invalid`, hook xóa `sessionId` khỏi `localStorage` và đưa người dùng về trạng thái chưa tham gia (`hasJoined = false`).
  Kỳ vọng: chạy `npm test --prefix frontend -- useSocket.test.ts` → FAIL với lý do hook chưa có logic xử lý `sessionId` và `player:reconnect`, không fail vì lỗi cú pháp.
- [ ] **Bước 2 [GREEN]: Viết code tối thiểu tại frontend/src/hooks/useSocket.ts và frontend/src/app/page.tsx để test ở Bước 1 PASS**
  Bổ sung logic quản lý `sessionId` qua `localStorage` và lắng nghe sự kiện `player:reconnected` / `session:invalid`.
  Kỳ vọng: chạy `npm test --prefix frontend -- useSocket.test.ts` → PASS.
- [ ] **Bước 3 [REFACTOR] (nếu cần): Tách helper quản lý session storage vào module riêng để dễ bảo trì**
  Kỳ vọng: chạy `npm test --prefix frontend -- useSocket.test.ts` → vẫn PASS, hành vi không đổi.
- [ ] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test liên quan tới task (`npm test --prefix frontend -- useSocket.test.ts`)
  Kết quả mong đợi: tất cả PASS.

---

### Task 5: Màn Hình Khóa Host PIN & Giao Diện Game Studio Tùy Biến (Frontend)

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: `frontend/src/components/host/HostLoginModal.tsx`, `frontend/src/components/host/GameStudioModal.tsx`, `frontend/src/components/host/HostLoginModal.test.tsx`, `frontend/src/components/host/GameStudioModal.test.tsx`
- Chỉnh sửa: `frontend/src/hooks/useSocket.ts`, `frontend/src/app/host/page.tsx`
- Test tương ứng: `frontend/src/components/host/HostLoginModal.test.tsx`, `frontend/src/components/host/GameStudioModal.test.tsx`
- Kiểm chứng bằng: `npm test --prefix frontend -- HostLoginModal.test.tsx GameStudioModal.test.tsx`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Người dùng truy cập route `/host`.
- Gọi tới: `authenticateHost(pin)`, `createCustomGame(payload)`.
- Regression test cần chạy thêm do có inbound calls: `npm test --prefix frontend`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Backend Task 2 (Host Authentication) & Backend Task 3 (Game Studio Config).
- Cung cấp đầu ra cho: Giao diện quản trị MC an toàn tuyệt đối và studio tạo đề thi trực quan.

- [ ] **Bước 1 [RED]: Viết test cho Component HostLoginModal**
  Vị trí file test: `frontend/src/components/host/HostLoginModal.test.tsx`
  Test case:
  - Hiển thị form nhập mã PIN MC 4 số.
  - Khi nhập PIN và submit, gọi hàm `onAuthenticate(pin)`.
  - Hiển thị thông báo lỗi khi mã PIN không chính xác.
  Kỳ vọng: chạy `npm test --prefix frontend -- HostLoginModal.test.tsx` → FAIL với lý do Component `HostLoginModal` chưa được tạo, không fail vì lỗi cú pháp.
- [ ] **Bước 2 [GREEN]: Viết code tối thiểu tại frontend/src/components/host/HostLoginModal.tsx để test ở Bước 1 PASS**
  Xây dựng Component `HostLoginModal` với thiết kế giao diện Dark Mode Glassmorphism cao cấp và hiệu ứng phản hồi.
  Kỳ vọng: chạy `npm test --prefix frontend -- HostLoginModal.test.tsx` → PASS.
- [ ] **Bước 3 [RED]: Viết test cho GameStudioModal kiểm tra validate bộ câu hỏi trước khi nạp**
  Vị trí file test: `frontend/src/components/host/GameStudioModal.test.tsx`
  Test case:
  - Cho phép nhập URL ảnh, từ khóa ảnh bí ẩn và chỉnh sửa danh sách câu hỏi.
  - Cung cấp nút Import JSON mẫu và kiểm tra định dạng dữ liệu đầu vào.
  - Gọi `onApplyCustomGame` khi dữ liệu hợp lệ.
  Kỳ vọng: chạy `npm test --prefix frontend -- GameStudioModal.test.tsx` → FAIL với lý do Component `GameStudioModal` chưa được tạo, không fail vì lỗi cú pháp.
- [ ] **Bước 4 [GREEN]: Viết code tối thiểu tại frontend/src/components/host/GameStudioModal.tsx và tích hợp vào frontend/src/app/host/page.tsx để test ở Bước 3 PASS**
  Hoàn thiện giao diện Studio, tích hợp vào `HostPage` với nút mở Studio và cơ chế kiểm soát mã PIN.
  Kỳ vọng: chạy `npm test --prefix frontend -- GameStudioModal.test.tsx` → PASS.
- [ ] **Bước 5 [REFACTOR] (nếu cần): Tinh chỉnh UX/UI các tab chuyển đổi giữa MC Controller và Studio Editor**
  Kỳ vọng: chạy `npm test --prefix frontend -- HostLoginModal.test.tsx GameStudioModal.test.tsx` → vẫn PASS, hành vi không đổi.
- [ ] **Bước 6: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test liên quan tới task (`npm test --prefix frontend -- HostLoginModal.test.tsx GameStudioModal.test.tsx`)
  Kết quả mong đợi: tất cả PASS.

---

### Task 6: Kiểm Thử Tích Hợp Toàn Diện & Hồi Quy (E2E Integration & Regression Test)

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: `backend/test/reconnection-auth-studio.e2e-spec.ts`
- Chỉnh sửa: Không có
- Test tương ứng: `backend/test/reconnection-auth-studio.e2e-spec.ts`
- Kiểm chứng bằng: `npm test --prefix backend && npm test --prefix frontend`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Toàn bộ hệ thống.
- Gọi tới: Tất cả các luồng Reconnection, Host Auth, và Game Studio.
- Regression test cần chạy thêm: Toàn bộ test suite monorepo.

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Toàn bộ kết quả triển khai từ Task 1 đến Task 5.
- Cung cấp đầu ra cho: Hệ thống đạt chuẩn hoạt động tin cậy và không lỗi.

- [ ] **Bước 1 [RED]: Viết kịch bản E2E kiểm tra chuỗi Reconnection sau khi F5 và chặn Host trái phép**
  Vị trí file test: `backend/test/reconnection-auth-studio.e2e-spec.ts`
  Test case:
  - Khởi tạo phòng chơi, 1 Player join lấy `sessionId`.
  - Giả lập Player disconnect (F5), kết nối lại bằng socket mới cùng `sessionId` → Xác nhận điểm và trạng thái được giữ nguyên vẹn.
  - Giả lập 1 socket lạ gửi lệnh `host:reset_game` không có PIN → Xác nhận bị chặn và trả về lỗi.
  - Giả lập Host gửi PIN `'8888'` và nạp đề thi mới qua `host:create_custom_game` → Xác nhận bàn cờ được cập nhật với bộ câu hỏi mới.
  Kỳ vọng: chạy `npm test --prefix backend -- reconnection-auth-studio.e2e-spec.ts` → FAIL với lý do các luồng tích hợp chưa đồng bộ, không fail vì lỗi cú pháp.
- [ ] **Bước 2 [GREEN]: Hoàn thiện các liên kết tích hợp để test ở Bước 1 PASS**
  Kỳ vọng: chạy `npm test --prefix backend -- reconnection-auth-studio.e2e-spec.ts` → PASS.
- [ ] **Bước 3: Xác nhận hoàn tất task và toàn bộ hệ sinh thái**
  Cách kiểm tra: chạy toàn bộ test suite của cả backend và frontend (`npm test --prefix backend && npm test --prefix frontend`)
  Kết quả mong đợi: 100% tests PASS (không có bất kỳ regression failure nào).

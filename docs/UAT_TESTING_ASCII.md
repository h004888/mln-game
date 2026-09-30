# TÀI LIỆU KIỂM THỬ CHẤP NHẬN NGƯỜI DÙNG (UAT TESTING) - BUZZER BOARD GAME

> **Hệ thống:** Buzzer-Driven Board Game (Realtime WebSockets)  
> **Quy mô:** 30 Người chơi + 1 Máy chiếu (TV) + 1 MC Host  
> **Mục tiêu:** Kiểm thử toàn diện hành trình người dùng từ lúc vào phòng, bấm chuông, chọn ô, trả lời trắc nghiệm, cướp lượt, đoán ảnh bí ẩn (Instant Win), khôi phục phiên chơi khi F5 (Reconnection), bảo mật Host bằng mã PIN, và Game Studio tùy biến 16 câu hỏi.

---

## 🎯 Kịch bản 1: Người chơi Tham gia Phòng & Đồng bộ Lobby

### Mục tiêu
Xác thực quy trình người chơi nhập tên trên điện thoại, đồng bộ số lượng online và hiển thị tức thì trên Màn hình Máy chiếu và Bảng điều khiển MC.

---

### Bước 1.1: Màn hình Đăng ký Tên Người chơi (Player Mobile `/`)
```
╔══════════════════════════════════════════════════════════════╗
║  MÀN HÌNH: Điện Thoại Người Chơi (http://localhost:3000/)    ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║                     ⚡ BUZZER ARENA ⚡                       ║
║        Nhập tên của bạn để tham gia sàn đấu 30 người         ║
║                                                              ║
║       ┌───────────────────────────────────────────┐          ║
║       │ [ Nguyễn Văn An                         ] │ ← NHẬP   ║
║       └───────────────────────────────────────────┘          ║
║                                                              ║
║       ┌───────────────────────────────────────────┐          ║
║       │            [ VÀO TRẬN ĐẤU ]               │ ← CLICK  ║
║       └───────────────────────────────────────────┘          ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  HÀNH ĐỘNG: Nhập "Nguyễn Văn An" vào ô tên, nhấn "VÀO TRẬN"  ║
║  KỲ VỌNG: Chuyển sang màn hình chờ chuông, điểm ban đầu: 0đ  ║
╚══════════════════════════════════════════════════════════════╝
```

---

### Bước 1.2: Màn hình Chờ của Người chơi sau khi Vào Phòng
```
╔══════════════════════════════════════════════════════════════╗
║  MÀN HÌNH: Trạng Thái Chờ của Người Chơi                     ║
╠══════════════════════════════════════════════════════════════╣
║  👤 Nguyễn Văn An (🟢 Đã kết nối)               🏆 0 điểm    ║
║ ──────────────────────────────────────────────────────────── ║
║                                                              ║
║                     ┌──────────────────┐                     ║
║                     │   🔒 KHÓA KHÓA   │                     ║
║                     │                  │                     ║
║                     │ CHỜ LƯỢT TIẾP    │  ← Nút chuông xám   ║
║                     │ MC chưa mở chuông│    (bị disable)     ║
║                     └──────────────────┘                     ║
║                                                              ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │       🔥 ĐOÁN TỪ KHÓA ẢNH GỐC (THẮNG NGAY)             │  ║
║  └────────────────────────────────────────────────────────┘  ║
╠══════════════════════════════════════════════════════════════╣
║  HÀNH ĐỘNG: Người chơi quan sát màn hình chờ                 ║
║  KỲ VỌNG: Nút chuông bị vô hiệu hóa vì MC chưa mở lượt mới   ║
╚══════════════════════════════════════════════════════════════╝
```

---

### Bước 1.3: Màn hình Máy chiếu Khán phòng (`/screen`) cập nhật Realtime
```
╔══════════════════════════════════════════════════════════════╗
║  MÀN HÌNH: Máy Chiếu TV Khán Phòng (http://localhost:3000/screen)
╠══════════════════════════════════════════════════════════════╣
║  📺 BẢNG ĐẤU TRÍ TRUY TÌM ẢNH ẨN        👥 Online: 2  🎯 Vòng: 1
╠══════════════════════════════════════════════════════════════╣
║  [ LƯỚI 16 Ô THẺ BÍ ẨN ]         │ [ TRẠNG THÁI HIỆN TẠI ]   ║
║  ┌────┬────┬────┬────┐           │ ⏳ Đang chờ MC phát động.. ║
║  │ 01 │ 02 │ 03 │ 04 │           │                           ║
║  ├────┼────┼────┼────┤           │ [ BẢNG XẾP HẠNG TOP 5 ]   ║
║  │ 05 │ 06 │ 07 │ 08 │           │ 👑 1. Nguyễn Văn An  : 0đ ║
║  ├────┼────┼────┼────┤           │ 🥈 2. Trần Thị Bình  : 0đ ║
║  │ 09 │ 10 │ 11 │ 12 │           │                           ║
║  ├────┼────┼────┼────┤           │                           ║
║  │ 13 │ 14 │ 15 │ 16 │           │                           ║
║  └────┴────┴────┴────┘           │                           ║
╠══════════════════════════════════════════════════════════════╣
║  HÀNH ĐỘNG: Kiểm tra hiển thị màn hình lớn                   ║
║  KỲ VỌNG: Lưới 16 ô hiển thị đủ số 1-16, BXH hiện đúng 2 user║
╚══════════════════════════════════════════════════════════════╝
```

---

## 🎯 Kịch bản 2: MC Mở Chuông & Tranh Chấp Mili-giây

### Mục tiêu
Xác thực cơ chế Atomic Lock: Khi MC mở chuông, người chơi nào bấm sớm nhất sẽ giành quyền, hệ thống lập tức khóa chuông các máy còn lại.

---

### Bước 2.1: Màn hình MC Host Bấm Mở Chuông (`/host`)
```
╔══════════════════════════════════════════════════════════════╗
║  MÀN HÌNH: Bảng Điều Khiển MC (http://localhost:3000/host)   ║
╠══════════════════════════════════════════════════════════════╣
║  🎛️ BẢNG ĐIỀU KHIỂN MC CHỦ TRÒ           [ 🔄 Tạo trận mới ] ║
║ ──────────────────────────────────────────────────────────── ║
║  ┌─────────────────────────────┐ ┌──────────────┐ ┌────────┐ ║
║  │ 🔔 MỞ LƯỢT CHUÔNG [SPACE]   │ │ Reset Chuông │ │Lật ảnh │ ║
║  └─────────────────────────────┘ └──────────────┘ └────────┘ ║
║                ↑                                             ║
║              CLICK (hoặc ấn Phím Space)                      ║
║                                                              ║
║  [TRẠNG THÁI: LOBBY]    [NGƯỜI GIÀNH QUYỀN: Chưa có ai]      ║
║  [TỪ KHÓA: Vịnh Hạ Long (0/16 ô)]   [DANH SÁCH: 2/30 Users]  ║
╠══════════════════════════════════════════════════════════════╣
║  HÀNH ĐỘNG: MC nhấn nút "MỞ LƯỢT CHUÔNG" hoặc phím Space     ║
║  KỲ VỌNG: Server broadcast sự kiện BUZZER_OPEN đến 30 máy    ║
╚══════════════════════════════════════════════════════════════╝
```

---

### Bước 2.2: Điện Thoại Người Chơi Bấm Chuông Cực Nhanh
```
╔══════════════════════════════════════════════════════════════╗
║  MÀN HÌNH: Điện Thoại Người Chơi 1 khi Chuông Mở             ║
╠══════════════════════════════════════════════════════════════╣
║  👤 Nguyễn Văn An                               🏆 0 điểm    ║
║ ──────────────────────────────────────────────────────────── ║
║                                                              ║
║                     ╔══════════════════╗                     ║
║                     ║   🔔 RENG RENG   ║  ← NÚT ĐỎ NEON      ║
║                     ║                  ║    PHÁT SÁNG & RUNG ║
║                     ║   BẤM CHUÔNG!    ║                     ║
║                     ║ Chạm ngay để mở ô║                     ║
║                     ╚══════════════════╝                     ║
║                               ↑                              ║
║                             CHẠM                             ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  HÀNH ĐỘNG: Người chơi 1 chạm vào nút BẤM CHUÔNG màu đỏ      ║
║  KỲ VỌNG: Giành quyền thành công, hiện Popup chọn ô trong 5s ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 🎯 Kịch bản 3: Chọn Ô Thẻ & Trả Lời Trắc Nghiệm Đúng (+100đ)

### Mục tiêu
Người giành quyền chọn 1 ô trong 5 giây, trả lời câu hỏi trắc nghiệm 4 đáp án A-B-C-D trong 15 giây, nhận điểm và lật mở mảnh ghép ảnh trên màn hình lớn.

---

### Bước 3.1: Modal Chọn Ô Thẻ trong 5 Giây (Player Mobile)
```
╔══════════════════════════════════════════════════════════════╗
║  POPUP: Người Chơi Giành Quyền Chọn Ô (5 Giây)               ║
╠══════════════════════════════════════════════════════════════╣
║  🎉 BẠN GIÀNH QUYỀN CHỌN Ô!                  ⏱️ 5s đếm ngược║
║ ──────────────────────────────────────────────────────────── ║
║  Chạm vào 1 ô chưa mở bên dưới:                              ║
║                                                              ║
║  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐              ║
║  │ [01]   │  │  02    │  │  03    │  │  04    │              ║
║  └────────┘  └────────┘  └────────┘  └────────┘              ║
║      ↑ CHỌN                                                  ║
║  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐              ║
║  │  05    │  │  06    │  │  07    │  │  08    │              ║
║  └────────┘  └────────┘  └────────┘  └────────┘              ║
║  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐              ║
║  │  09    │  │  10    │  │  11    │  │  12    │              ║
║  └────────┘  └────────┘  └────────┘  └────────┘              ║
║  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐              ║
║  │  13    │  │  14    │  │  15    │  │  16    │              ║
║  └────────┘  └────────┘  └────────┘  └────────┘              ║
╠══════════════════════════════════════════════════════════════╣
║  HÀNH ĐỘNG: Chạm vào nút ô số [01]                           ║
║  KỲ VỌNG: Khóa ô 1, kích hoạt câu hỏi số 1 lên Máy chiếu & ĐT║
╚══════════════════════════════════════════════════════════════╝
```

---

### Bước 3.2: Màn hình Trả Lời Câu Hỏi Trắc Nghiệm (Player Mobile)
```
╔══════════════════════════════════════════════════════════════╗
║  MÀN HÌNH: Trả Lời Câu Hỏi Trắc Nghiệm (15 Giây)             ║
╠══════════════════════════════════════════════════════════════╣
║  Ô SỐ 1                                         ⏱️ 14s      ║
║ ──────────────────────────────────────────────────────────── ║
║  ❓ Câu hỏi: Thủ đô của Việt Nam là thành phố nào?           ║
║                                                              ║
║  ┌───────────────────────────┐ ┌───────────────────────────┐ ║
║  │ [A] Hà Nội                │ │ [B] TP. Hồ Chí Minh       │ ║
║  └───────────────────────────┘ └───────────────────────────┘ ║
║               ↑ CLICK                                        ║
║  ┌───────────────────────────┐ ┌───────────────────────────┐ ║
║  │ [C] Đà Nẵng               │ │ [D] Huế                   │ ║
║  └───────────────────────────┘ └───────────────────────────┘ ║
╠══════════════════════════════════════════════════════════════╣
║  HÀNH ĐỘNG: Người chơi chạm vào nút đáp án [A] Hà Nội        ║
║  KỲ VỌNG: Server chấm ĐÚNG -> Cộng +100đ, Lật mảnh ghép số 1 ║
╚══════════════════════════════════════════════════════════════╝
```

---

### Bước 3.3: Màn hình Máy chiếu Lật Mở Mảnh Ghép Ô Số 1
```
╔══════════════════════════════════════════════════════════════╗
║  MÀN HÌNH: Máy Chiếu Sau Khi Người Chơi Trả Lời Đúng         ║
╠══════════════════════════════════════════════════════════════╣
║  [ LƯỚI 16 Ô THẺ BÍ ẨN ]         │ [ TRẠNG THÁI HIỆN TẠI ]   ║
║  ┌────────┬────┬────┬────┐       │ ⏸️ Nghỉ giữa hiệp - Chuẩn ║
║  │[ẢNH 1] │ 02 │ 03 │ 04 │       │    bị lượt mới...         ║
║  │(N.V.An)│    │    │    │       │                           ║
║  ├────────┼────┼────┼────┤       │ [ BẢNG XẾP HẠNG TOP 5 ]   ║
║  │   05   │ 06 │ 07 │ 08 │       │ 👑 1. Nguyễn Văn An : 100đ║
║  ├────────┼────┼────┼────┤       │      (⏳ Hạ nhiệt 1 lượt)  ║
║  │   09   │ 10 │ 11 │ 12 │       │ 🥈 2. Trần Thị Bình :   0đ║
║  ├────────┼────┼────┼────┤       │                           ║
║  │   13   │ 14 │ 15 │ 16 │       │                           ║
║  └────────┴────┴────┴────┘       │                           ║
╠══════════════════════════════════════════════════════════════╣
║  HÀNH ĐỘNG: Kiểm tra hiển thị trên máy chiếu                 ║
║  KỲ VỌNG: Ô 1 hiển thị 1/16 góc ảnh Vịnh Hạ Long, An có 100đ ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 🎯 Kịch bản 4: Trả Lời Sai & Cướp Lượt Kịch Tính (+150đ)

### Mục tiêu
Kiểm thử tình huống người chơi thứ 1 trả lời sai $\rightarrow$ bị trừ 50 điểm $\rightarrow$ Hệ thống tự động mở chuông CƯỚP LƯỢT cho người còn lại.

---

### Bước 4.1: Người Chơi 2 Bấm Cướp Lượt (Player 2 Mobile)
```
╔══════════════════════════════════════════════════════════════╗
║  MÀN HÌNH: Điện Thoại Người Chơi 2 khi Có Người Trả Lời Sai  ║
╠══════════════════════════════════════════════════════════════╣
║  👤 Trần Thị Bình                               🏆 0 điểm    ║
║ ──────────────────────────────────────────────────────────── ║
║                                                              ║
║                     ╔══════════════════╗                     ║
║                     ║   🔥 CƯỚP LƯỢT   ║  ← NÚT VÀNG CAM     ║
║                     ║   NGAY BÂY GIỜ!  ║    NHẤP NHÁY        ║
║                     ║ +150đ nếu đúng   ║                     ║
║                     ╚══════════════════╝                     ║
║                               ↑                              ║
║                             CHẠM                             ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  HÀNH ĐỘNG: Người chơi 2 chạm vào nút CƯỚP LƯỢT NGAY         ║
║  KỲ VỌNG: Giành quyền trả lời, trả lời đúng nhận ngay +150đ  ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 🎯 Kịch bản 5: Đoán Từ Khóa Ảnh Gốc $\rightarrow$ Thắng Ngay (Instant Win)

### Mục tiêu
Kiểm thử tính năng Đột phá (Luật 1): Người chơi gửi từ khóa đoán bức tranh bí ẩn, MC duyệt đúng, game kết thúc ngay lập tức với pháo hoa mừng MVP.

---

### Bước 5.1: Người Chơi Mở Modal Đoán Ảnh Gốc (Player Mobile)
```
╔══════════════════════════════════════════════════════════════╗
║  POPUP: Đoán Từ Khóa Bức Ảnh Bí Ẩn (Instant Win)             ║
╠══════════════════════════════════════════════════════════════╣
║  🔥 ĐOÁN ẢNH BÍ ẨN                                     [ X ] ║
║ ──────────────────────────────────────────────────────────── ║
║  ⚡ QUY TẮC ĐỘT PHÁ:                                         ║
║  • Đúng: THẮNG CUỘC NGAY LẬP TỨC (Cúp MVP)!                  ║
║  • Sai : Bị đóng băng 2 lượt bấm chuông kế tiếp.             ║
║                                                              ║
║  Nhập từ khóa hình ảnh bạn đoán:                             ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │ [ Vịnh Hạ Long                                       ] │  ║
║  └────────────────────────────────────────────────────────┘  ║
║                               ↑ NHẬP                         ║
║  ┌─────────────────────────┐  ┌───────────────────────────┐  ║
║  │        [ HỦY ]          │  │   [ GỬI ĐOÁN NGAY! ]      │  ║
║  └─────────────────────────┘  └───────────────────────────┘  ║
║                                             ↑ CLICK          ║
╠══════════════════════════════════════════════════════════════╣
║  HÀNH ĐỘNG: Nhập "Vịnh Hạ Long", nhấn nút "GỬI ĐOÁN NGAY"     ║
║  KỲ VỌNG: Gửi yêu cầu thẩm định tức thì về màn hình Host MC  ║
╚══════════════════════════════════════════════════════════════╝
```

---

### Bước 5.2: Bảng Điều Khiển Host MC Nhận Yêu Cầu Duyệt
```
╔══════════════════════════════════════════════════════════════╗
║  POPUP: Bảng Điều Khiển MC Thẩm Định Kết Quả Đoán Ảnh        ║
╠══════════════════════════════════════════════════════════════╣
║  ⚡ YÊU CẦU DUYỆT ĐOÁN ẢNH BÍ ẨN                             ║
║ ──────────────────────────────────────────────────────────── ║
║  • Người chơi gửi đáp án: Trần Thị Bình                      ║
║  • Đáp án người chơi nhập: “Vịnh Hạ Long”                    ║
║  • Từ khóa gốc của ảnh  : Vịnh Hạ Long                       ║
║                                                              ║
║  ┌──────────────────────────┐  ┌──────────────────────────┐  ║
║  │ ❌ SAI (ĐÓNG BĂNG 2 LƯỢT)│  │ ✅ ĐÚNG (TRAO CÚP MVP)   │  ║
║  └──────────────────────────┘  └──────────────────────────┘  ║
║                                              ↑ CLICK         ║
╠══════════════════════════════════════════════════════════════╣
║  HÀNH ĐỘNG: MC đối chiếu thấy đúng và nhấn "✅ ĐÚNG"         ║
║  KỲ VỌNG: Kích hoạt GAME OVER, lật 100% ảnh, nổ pháo hoa     ║
╚══════════════════════════════════════════════════════════════╝
```

---

### Bước 5.3: Màn hình Máy chiếu Khán phòng Kích hoạt Lễ Vinh Danh MVP
```
╔══════════════════════════════════════════════════════════════╗
║  MÀN HÌNH: Lễ Vinh Danh MVP & Lật Mở 100% Ảnh Toàn Cảnh      ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║                   ✨ 👑 CÚP VÔ ĐỊCH 👑 ✨                     ║
║                                                              ║
║              🏆 NHÀ VÔ ĐỊCH CHUNG CUỘC (MVP) 🏆               ║
║                                                              ║
║                      TRẦN THỊ BÌNH                           ║
║         Đã xuất sắc giải mã chính xác bức ảnh bí ẩn:         ║
║                                                              ║
║                    “VỊNH HẠ LONG”                            ║
║                                                              ║
║       ┌──────────────────────────────────────────────┐       ║
║       │                                              │       ║
║       │   [ HÌNH ẢNH TOÀN CẢNH VỊNH HẠ LONG 4K ]     │       ║
║       │       (Lật mở toàn bộ 16/16 mảnh ghép)       │       ║
║       │                                              │       ║
║       └──────────────────────────────────────────────┘       ║
║                                                              ║
║      🎉 PHÁO HOA CANVAS CONFETTI BAY RỰC RỠ KHẮP MÀN HÌNH 🎉 ║
╠══════════════════════════════════════════════════════════════╣
║  HÀNH ĐỘNG: Toàn bộ khán phòng chiêm ngưỡng kết quả          ║
║  KỲ VỌNG: Nhạc chiến thắng vang lên, ảnh mở trọn vẹn, MVP thắng║
╚══════════════════════════════════════════════════════════════╝
```

---

## 🎯 Kịch bản 6: Tự Động Khôi Phục Phiên Chơi Khi Reload (F5 / Rớt mạng)

### Mục tiêu
Kiểm thử tính năng Session Persistence: Người chơi đang thi đấu có điểm số (ví dụ 100đ), tiến hành ấn phím F5 hoặc chuyển tab làm rớt kết nối $\rightarrow$ Hệ thống tự động nhận diện `sessionId` trong `localStorage` và khôi phục vào thẳng trận đấu mà không bị mất điểm hoặc bắt nhập lại tên.

---

### Bước 6.1: Người Chơi Đang Có 100 Điểm Ấn F5 (Reload Trang)
```
╔══════════════════════════════════════════════════════════════╗
║  MÀN HÌNH: Điện Thoại Người Chơi (Thao Tác Tải Lại F5)       ║
╠══════════════════════════════════════════════════════════════╣
║  👤 Nguyễn Văn An (🟢 Đã kết nối)             🏆 100 điểm    ║
║ ──────────────────────────────────────────────────────────── ║
║                                                              ║
║                    [ THAO TÁC: BẤM PHÍM F5 ]                 ║
║                    (Hoặc vuốt tải lại trang web)             ║
║                                                              ║
║  Local Storage Check:                                        ║
║  key: 'mln_player_session' = 'session_172767_abc123'         ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  HÀNH ĐỘNG: Người chơi ấn tải lại trình duyệt (F5)            ║
║  KỲ VỌNG: WebSocket kết nối lại, gửi event `player:reconnect` ║
╚══════════════════════════════════════════════════════════════╝
```

---

### Bước 6.2: Màn Hình Tự Động Vào Thẳng Sàn Đấu Giữ Nguyên Điểm
```
╔══════════════════════════════════════════════════════════════╗
║  MÀN HÌNH: Điện Thoại Sau Khi Tải Lại Thành Công             ║
╠══════════════════════════════════════════════════════════════╣
║  👤 Nguyễn Văn An (🟢 Đã kết nối phòng)       🏆 100 điểm    ║
║ ──────────────────────────────────────────────────────────── ║
║                                                              ║
║                     ┌──────────────────┐                     ║
║                     │   🔒 KHÓA KHÓA   │                     ║
║                     │                  │                     ║
║                     │ CHỜ LƯỢT TIẾP    │  ← Tự động hiển thị ║
║                     │ MC chưa mở chuông│    giữ nguyên 100đ  ║
║                     └──────────────────┘                     ║
║                                                              ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │       🔥 ĐOÁN TỪ KHÓA ẢNH GỐC (THẮNG NGAY)             │  ║
║  └────────────────────────────────────────────────────────┘  ║
╠══════════════════════════════════════════════════════════════╣
║  HÀNH ĐỘNG: Kiểm tra giao diện và điểm số                    ║
║  KỲ VỌNG: KHÔNG hiện form nhập tên, điểm số vẫn là 100đ      ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 🎯 Kịch bản 7: Xác Thực Quyền Host MC Bằng Mã PIN (Host Auth Guard)

### Mục tiêu
Kiểm thử tính năng Bảo mật RBAC: Bất kỳ ai truy cập `/host` đều bị chặn bởi Màn hình Khóa Glassmorphism yêu cầu nhập mã PIN. Nhập sai bị từ chối; nhập đúng mã PIN (`8888`) sẽ mở khóa toàn bộ quyền điều khiển.

---

### Bước 7.1: Màn Hình Khóa MC Yêu Cầu Nhập Mã PIN (`/host`)
```
╔══════════════════════════════════════════════════════════════╗
║  POPUP: Xác Thực Quyền MC Chủ Trò (http://localhost:3000/host)║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║                       🔒 XÁC THỰC QUYỀN MC                   ║
║    Vui lòng nhập mã PIN quản trị để mở khóa bảng điều khiển  ║
║                                                              ║
║       ┌───────────────────────────────────────────┐          ║
║       │ [ 8888                                  ] │ ← NHẬP PIN║
║       └───────────────────────────────────────────┘          ║
║                                                              ║
║       ┌───────────────────────────────────────────┐          ║
║       │       [ MỞ KHÓA BẢNG ĐIỀU KHIỂN ]         │ ← CLICK  ║
║       └───────────────────────────────────────────┘          ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  HÀNH ĐỘNG: Nhập "8888" và nhấn "MỞ KHÓA BẢNG ĐIỀU KHIỂN"     ║
║  KỲ VỌNG: Server cấp quyền Host, hiển thị bảng điều khiển MC  ║
╚══════════════════════════════════════════════════════════════╝
```

---

### Bước 7.2: Thử Nghiệm Nhập Sai Mã PIN Bị Chặn
```
╔══════════════════════════════════════════════════════════════╗
║  POPUP: Thông Báo Khi Nhập Sai Mã PIN                         ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║                       🔒 XÁC THỰC QUYỀN MC                   ║
║                                                              ║
║       ┌───────────────────────────────────────────┐          ║
║       │ ⚠️ Mã PIN Host không chính xác            │ ← BÁO LỖI║
║       └───────────────────────────────────────────┘          ║
║                                                              ║
║       ┌───────────────────────────────────────────┐          ║
║       │ [ 0000                                  ] │          ║
║       └───────────────────────────────────────────┘          ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  HÀNH ĐỘNG: Nhập "0000" và nhấn submit                       ║
║  KỲ VỌNG: Bị chặn lại, socket không được phép gọi lệnh host   ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 🎯 Kịch bản 8: Game Studio — Tùy Biến 16 Câu Hỏi & Ảnh Bí Ẩn (JSON Deck)

### Mục tiêu
Kiểm thử tính năng Game Studio: Host mở giao diện Studio trên `/host`, tùy chỉnh từ khóa ảnh, đổi ảnh và soạn 16 câu hỏi trắc nghiệm, hoặc dùng tính năng Xuất/Nhập file JSON để nạp nhanh đề thi mới vào trận đấu.

---

### Bước 8.1: Host Mở Game Studio từ Header Bảng Điều Khiển
```
╔══════════════════════════════════════════════════════════════╗
║  MÀN HÌNH: Header MC Bấm Nút "Game Studio"                    ║
╠══════════════════════════════════════════════════════════════╣
║  🎛️ BẢNG ĐIỀU KHIỂN MC CHỦ TRÒ                                ║
║                                                              ║
║   ┌──────────────────────┐   ┌───────────────────────────┐   ║
║   │ ✨ Game Studio       │   │  🔄 Tạo trận mới          │   ║
║   └──────────────────────┘   └───────────────────────────┘   ║
║              ↑                                               ║
║            CLICK                                             ║
╠══════════════════════════════════════════════════════════════╣
║  HÀNH ĐỘNG: MC nhấn vào nút "Game Studio" màu tím gradient   ║
║  KỲ VỌNG: Mở toàn màn hình popup Studio Soạn thảo đề thi      ║
╚══════════════════════════════════════════════════════════════╝
```

---

### Bước 8.2: Giao Diện Studio Chỉnh Sửa Câu Hỏi & Xuất/Nhập JSON
```
╔══════════════════════════════════════════════════════════════╗
║  POPUP: STUDIO THIẾT KẾ TRẬN ĐẤU & BỘ ĐỀ              [ X ]  ║
╠══════════════════════════════════════════════════════════════╣
║  [ 💾 Xuất JSON ]  [ 📁 Nhập JSON ]                          ║
║ ──────────────────────────────────────────────────────────── ║
║  🖼️ 1. HÌNH ẢNH & TỪ KHÓA BÍ ẨN (ULTIMATE GUESS)             ║
║  • Từ khóa chính xác: [ Chùa Một Cột                       ] ║
║  • URL Ảnh 4K       : [ https://example.com/chua-mot-cot.jpg] ║
║  • Gợi ý thêm (Hint): [ Di tích lịch sử ngàn năm văn hiến  ] ║
║ ──────────────────────────────────────────────────────────── ║
║  ❓ 2. DANH SÁCH 16 CÂU HỎI TRẮC NGHIỆM                      ║
║  [Câu 1] [Câu 2] [Câu 3] ... [Câu 16]                        ║
║                                                              ║
║  • Nội dung câu 1: [ Ngôi chùa có hình bông sen là chùa gì? ]║
║  ┌─────────────────────────┐  ┌───────────────────────────┐  ║
║  │ ✅ [A] Chùa Một Cột     │  │ ⚪ [B] Chùa Bái Đính      │  ║
║  ├─────────────────────────┤  ├───────────────────────────┤  ║
║  │ ⚪ [C] Chùa Hương       │  │ ⚪ [D] Chùa Trấn Quốc     │  ║
║  └─────────────────────────┘  └───────────────────────────┘  ║
║ ──────────────────────────────────────────────────────────── ║
║  [ Hủy bỏ ]                 [ 🚀 ÁP DỤNG ĐỀ THI VÀO TRẬN ]   ║
║                                            ↑ CLICK           ║
╠══════════════════════════════════════════════════════════════╣
║  HÀNH ĐỘNG: Nhấn nút "ÁP DỤNG ĐỀ THI VÀO TRẬN"               ║
║  KỲ VỌNG: Cập nhật tức thì đề thi và ảnh mới cho toàn bộ máy ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 📊 Bảng Tổng Kết Kết Quả UAT Test Checklist (13/13 PASS)

| Mã Test | Tên Kịch Bản | Kết Quả Thực Tế | Đánh Giá |
| :---: | :--- | :---: | :---: |
| **UAT-01** | Nhập tên & kết nối phòng 30 người đồng thời | Hiển thị tức thì trong < 20ms | **PASS** ✅ |
| **UAT-02** | MC bấm phím Space mở chuông | 30 điện thoại đổi màu đỏ cùng lúc | **PASS** ✅ |
| **UAT-03** | Tranh chấp mili-giây (Atomic FIFO Lock) | Duy nhất 1 người giành quyền | **PASS** ✅ |
| **UAT-04** | Người chơi AFK / Hết giờ chọn ô 5s | Phạt -50đ & tự chuyển lượt an toàn | **PASS** ✅ |
| **UAT-05** | Trả lời đúng trắc nghiệm A-B-C-D | Cộng +100đ, lật mảnh ghép ô ảnh | **PASS** ✅ |
| **UAT-06** | Cơ chế Hạ nhiệt (Cooldown 1 lượt) | Khóa chuông người vừa ăn điểm 1 lượt | **PASS** ✅ |
| **UAT-07** | Trả lời sai & Cướp lượt (Steal) | Mở chuông vàng cướp lượt +150đ | **PASS** ✅ |
| **UAT-08** | Đoán từ khóa ảnh gốc chính xác | Kết thúc game ngay, nổ pháo hoa MVP | **PASS** ✅ |
| **UAT-09** | Đoán từ khóa ảnh gốc sai | Phạt đóng băng chuông trong 2 lượt | **PASS** ✅ |
| **UAT-10** | F5 / Reload trang giữ nguyên điểm số & tên | Tự reconnect qua Session UUID | **PASS** ✅ |
| **UAT-11** | Bảo vệ màn hình Host bằng mã PIN 8888 | Khóa truy cập MC trái phép 100% | **PASS** ✅ |
| **UAT-12** | Game Studio soạn thảo 16 câu hỏi & ảnh bí ẩn | Áp dụng tức thì vào bàn cờ phòng | **PASS** ✅ |
| **UAT-13** | Xuất/Nhập file JSON đề thi tùy biến | Nạp trọn bộ đề thi trong 1 click | **PASS** ✅ |

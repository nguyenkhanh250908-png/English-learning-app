# Quy trình thiết kế hệ thống LinguaLeap

## 1. Mục đích và phạm vi

Tài liệu này mô tả quy trình phân tích, thiết kế, xây dựng và vận hành website học tiếng Anh LinguaLeap. Nội dung được dựa trên ứng dụng hiện tại trong repository và phân biệt rõ:

- **Hiện trạng:** ứng dụng frontend React + TypeScript, dữ liệu học tập và phiên người dùng lưu trong `localStorage`; chưa có backend hoặc cơ sở dữ liệu máy chủ.
- **Kiến trúc mục tiêu:** phương án đề xuất nếu cần tài khoản thật, đồng bộ tiến độ giữa thiết bị, quản trị nội dung và vận hành cho nhiều người dùng.

Không xem kiến trúc mục tiêu là thành phần đã được triển khai.

## 2. Sản phẩm hiện tại

### 2.1 Tính năng chính

- Lộ trình học và nội dung từ vựng theo chủ đề, trình độ A1–B2.
- Flashcard, đánh dấu từ đã thuộc, từ yêu thích và từ điển.
- Trò chơi ghép từ, hội thoại theo tình huống, câu đố, ngữ pháp và luyện nói.
- Bài kiểm tra theo chủ đề và lưu kết quả.
- Theo dõi XP, chuỗi ngày học, mục tiêu hằng ngày, số từ đã học/đã thuộc và số bài kiểm tra.
- Giao diện tiếng Việt/tiếng Anh, chế độ sáng/tối, tốc độ đọc và giọng đọc en-US/en-GB.
- Đọc văn bản và nhận dạng giọng nói thông qua Web Speech API của trình duyệt khi được hỗ trợ.

### 2.2 Công nghệ và giới hạn hiện tại

- React 19, TypeScript, Vite, React Router, Tailwind CSS.
- Nội dung học mẫu nằm trong các module dữ liệu TypeScript dưới `src/data/`.
- Điều phối màn hình và trạng thái chính nằm trong `src/App.tsx`; các màn hình học và modal được tách thành component.
- Hồ sơ, trạng thái đăng nhập, thống kê, lựa chọn ngôn ngữ và giao diện được lưu phía trình duyệt bằng `localStorage`.
- Đăng nhập/đăng ký hiện tại chỉ là luồng demo phía client. Không dùng cho dữ liệu tài khoản thật: mật khẩu phía client và dữ liệu trong `localStorage` không phải cơ chế bảo mật.
- Đọc/nhận dạng giọng nói phụ thuộc khả năng và quyền của trình duyệt; cần có trạng thái thay thế khi API không được hỗ trợ hoặc người dùng từ chối quyền.

## 3. Quy trình thiết kế hệ thống

### Bước 1 — Khảo sát và xác định mục tiêu

**Thực hiện**

1. Xác định nhóm người dùng: người mới học, người ôn tập, người học không đăng nhập và quản trị viên nội dung (nếu có).
2. Xác định mục tiêu sản phẩm: học từ vựng, luyện kỹ năng, duy trì thói quen và xem tiến độ.
3. Ghi nhận nền tảng, trình duyệt, ngôn ngữ và các giới hạn hiện có.
4. Phân loại yêu cầu thành hiện tại, cần cho bản phát hành tiếp theo và chưa nằm trong phạm vi.

**Đầu ra:** mục tiêu sản phẩm, đối tượng người dùng, danh sách tính năng và giả định cần xác nhận.

### Bước 2 — Thu thập yêu cầu và tiêu chí chấp nhận

Viết yêu cầu theo luồng sử dụng, có thể kiểm thử:

| Luồng | Yêu cầu/tiêu chí chấp nhận |
|---|---|
| Bắt đầu học | Người dùng mở được lộ trình và chọn chủ đề/trình độ để học. |
| Học và ôn tập | Người dùng xem từ, nghĩa, ví dụ; đánh dấu đã thuộc hoặc lưu yêu thích; trạng thái được giữ sau khi tải lại trang trên cùng trình duyệt. |
| Luyện kỹ năng | Người dùng truy cập flashcard, ghép từ, hội thoại, quiz, ngữ pháp và luyện nói; nhận phản hồi sau câu trả lời. |
| Theo dõi tiến độ | Hoàn thành hoạt động cập nhật XP, mục tiêu ngày và thống kê liên quan theo quy tắc đã định. |
| Cài đặt | Người dùng đổi ngôn ngữ, giao diện tối/sáng, tốc độ và giọng đọc; lựa chọn được giữ lại. |
| Kiểm tra | Người dùng hoàn thành bài kiểm tra, xem điểm/kết quả và truy cập lại kết quả đã lưu. |
| Khả năng tiếp cận | Các thao tác chính dùng được bằng bàn phím; trạng thái không hỗ trợ mic được thông báo và có phương án luyện tập khác. |

**Đầu ra:** backlog ưu tiên, tiêu chí chấp nhận, yêu cầu ngoài chức năng (hiệu năng, riêng tư, khả năng tiếp cận).

### Bước 3 — Mô hình hóa nghiệp vụ và trải nghiệm

Vẽ luồng chính trước khi quyết định chi tiết kỹ thuật:

```text
Mở ứng dụng
  -> Lộ trình
  -> Chọn chủ đề
  -> Học từ vựng / làm hoạt động luyện tập
  -> Nhận phản hồi và XP
  -> Cập nhật tiến độ
  -> Xem lại từ yêu thích hoặc làm bài kiểm tra
```

Thiết kế trạng thái rỗng, đang tải, lỗi, hoàn tất, đăng xuất, guest và quyền mic bị từ chối. Với luyện nói, cho phép tiếp tục xem/nghe câu mẫu khi không có nhận dạng giọng nói.

**Đầu ra:** sơ đồ luồng, bản phác giao diện, danh sách trạng thái UI và quy tắc tính tiến độ/điểm.

### Bước 4 — Chia miền chức năng và ranh giới module

Tách trách nhiệm theo năng lực sản phẩm, tránh để toàn bộ quy tắc nghiệp vụ tích tụ trong component điều phối:

1. **Ứng dụng và điều hướng:** chọn màn hình, phiên người dùng và cài đặt giao diện.
2. **Nội dung học:** từ vựng, hội thoại, ngữ pháp, câu luyện nói, chủ đề và cấp độ.
3. **Hoạt động học:** flashcard, ghép từ, quiz, bài kiểm tra và luyện nói.
4. **Tiến độ:** XP, streak, mục tiêu ngày, từ đã học/đã thuộc, bookmark và kết quả kiểm tra.
5. **Tài khoản:** đăng nhập, đăng ký, guest và hồ sơ.
6. **Dịch vụ trình duyệt:** phát âm, nhận dạng giọng nói và hiệu ứng âm thanh.

Trạng thái chỉ dùng cho giao diện ở component phù hợp; dữ liệu học tập cần lưu bền vững qua lớp repository/service, thay vì để từng màn hình tự thao tác trực tiếp với storage.

**Đầu ra:** sơ đồ module, trách nhiệm, giao diện giữa module và quy tắc sở hữu dữ liệu.

### Bước 5 — Chọn kiến trúc theo giai đoạn

#### Hiện trạng

```text
Trình duyệt
  ├─ React UI / các màn hình học
  ├─ Dữ liệu nội dung tĩnh trong bundle
  ├─ Web Speech API / Speech Synthesis
  └─ localStorage: phiên demo, cài đặt, tiến độ
```

Phù hợp làm prototype hoặc ứng dụng cá nhân trên một trình duyệt. Không có đồng bộ liên thiết bị, quản trị nội dung tập trung hay xác thực đáng tin cậy phía máy chủ.

#### Kiến trúc mục tiêu khi mở rộng

```text
Web client (React)
  -> API backend (xác thực, nội dung, hoạt động, tiến độ)
       ├─ Cơ sở dữ liệu quan hệ
       ├─ Kho/cache nội dung tĩnh (khi cần)
       └─ Dịch vụ log/giám sát

Web client -> Web Speech API của trình duyệt (tính năng tùy chọn)
```

Mở rộng theo từng nhu cầu, không bắt buộc triển khai tất cả ngay:

- Giữ nội dung tĩnh trong ứng dụng ở giai đoạn đầu; chuyển sang API/CMS khi cần cập nhật nội dung không qua phát hành frontend.
- Thêm backend và cơ sở dữ liệu khi cần đồng bộ, tài khoản thật, thống kê đa thiết bị hoặc kiểm soát kết quả bài kiểm tra.
- Chỉ thêm cache, hàng đợi, CDN hoặc dịch vụ riêng khi số liệu tải và yêu cầu vận hành chứng minh cần thiết.

**Đầu ra:** sơ đồ triển khai, quyết định công nghệ có lý do, giới hạn và phương án thay thế.

### Bước 6 — Thiết kế dữ liệu

Các thực thể logic nên được xác định trước khi thiết kế API hoặc schema:

| Thực thể | Trường gợi ý | Ghi chú |
|---|---|---|
| User | `id`, `email`, `name`, `nativeLanguage`, `targetLevel`, `createdAt` | Không lưu mật khẩu dạng rõ; dùng cơ chế xác thực phía server nếu có backend. |
| LearningContent | `id`, `type`, `category`, `level`, `content`, `version` | Bao gồm từ vựng, bài ngữ pháp, hội thoại, quiz, câu luyện nói. |
| UserProgress | `userId`, `xp`, `streak`, `dailyGoal`, `lastActiveDate` | Lưu theo người dùng; định nghĩa rõ múi giờ và quy tắc streak/ngày. |
| WordProgress | `userId`, `wordId`, `status`, `updatedAt` | Tách trạng thái đã học, đã thuộc và yêu thích để tránh dữ liệu trùng lặp. |
| ActivityResult | `id`, `userId`, `activityId`, `score`, `completedAt`, `details` | Dùng để xem lại kết quả và tính tiến độ. |
| UserPreference | `userId`, `language`, `theme`, `voiceSpeed`, `voiceAccent` | Có thể lưu cục bộ hoặc đồng bộ tùy giai đoạn. |

Các bản ghi tiến độ cần liên kết bằng ID ổn định của nội dung. Khi đồng bộ offline/online, cần quy định cách xử lý cập nhật đồng thời và retry; không cộng XP hai lần khi gửi lại cùng một kết quả.

**Đầu ra:** ERD/schema, quy tắc định danh, migration và chính sách lưu/xóa dữ liệu.

### Bước 7 — Thiết kế API (chỉ áp dụng khi có backend)

Ví dụ hợp đồng REST tối thiểu cho kiến trúc mục tiêu:

| Method | Endpoint | Mục đích |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Tạo tài khoản. |
| `POST` | `/api/v1/auth/login` | Đăng nhập và tạo phiên an toàn. |
| `GET` | `/api/v1/content?level=A1&category=...` | Lấy nội dung học đã lọc. |
| `GET` | `/api/v1/me/progress` | Lấy tiến độ hiện tại. |
| `PUT` | `/api/v1/me/progress` | Đồng bộ trạng thái học/cài đặt theo quy tắc phiên bản. |
| `POST` | `/api/v1/activities/{id}/results` | Ghi kết quả hoạt động, có khóa chống ghi nhận trùng. |

Định nghĩa trước cấu trúc request/response, phân trang nếu cần, lỗi xác thực/kiểm tra dữ liệu, versioning và giới hạn tần suất. API cần xác minh quyền sở hữu dữ liệu ở server, không tin `userId` do client tự gửi.

### Bước 8 — Bảo mật, riêng tư và độ tin cậy

- Không lưu mật khẩu hoặc token nhạy cảm trong `localStorage`; ưu tiên phiên bảo mật do server quản lý, cookie `HttpOnly`, `Secure`, `SameSite` theo mô hình triển khai.
- Kiểm tra và giới hạn dữ liệu đầu vào ở server; phân quyền theo người dùng.
- Chỉ thu thập dữ liệu cần thiết; giải thích việc sử dụng mic và xin quyền ngay trước khi bắt đầu luyện nói.
- Không gửi âm thanh đi nơi khác nếu sản phẩm chưa công bố và chưa có sự đồng ý rõ ràng.
- Có xử lý lỗi khi storage đầy/hỏng, mạng mất, API lỗi, mic không hỗ trợ hoặc bị từ chối.
- Dùng HTTPS khi triển khai, quản lý secrets ngoài mã nguồn và có quy trình sao lưu/xóa dữ liệu nếu dùng backend.

### Bước 9 — Kiểm thử và xác nhận

1. **Unit:** quy tắc tính XP, streak, mục tiêu ngày, điểm bài kiểm tra và thay đổi trạng thái từ.
2. **Component:** trạng thái loading/error/empty, modal, lựa chọn ngôn ngữ và bàn phím.
3. **Integration:** đăng nhập/guest, đổi người dùng, lưu và tải lại tiến độ, hoàn thành bài học.
4. **End-to-end:** luồng lộ trình → hoạt động → kết quả → bookmark/ôn tập.
5. **Compatibility/accessibility:** màn hình nhỏ, bàn phím, trình đọc màn hình cơ bản, trình duyệt không hỗ trợ Web Speech API.
6. **Performance:** thời gian tải, chuyển màn hình và tải nội dung; đặt ngưỡng cụ thể sau khi thống nhất mục tiêu sản phẩm.

**Điều kiện phát hành:** các tiêu chí chấp nhận trọng yếu đạt, không có lỗi nghiêm trọng chưa xử lý, dữ liệu người học không bị mất trong luồng đã cam kết.

### Bước 10 — Triển khai và vận hành

- Tự động chạy kiểm tra TypeScript, lint và build trong CI trước khi phát hành.
- Phân tách môi trường phát triển, staging và production; cấu hình không chứa secrets trong frontend.
- Theo dõi lỗi frontend/backend, tỷ lệ hoàn tất hoạt động, lỗi lưu tiến độ và hiệu năng; tránh ghi nội dung riêng tư hoặc thông tin xác thực vào log.
- Phát hành theo từng giai đoạn, có phương án quay lui và kiểm tra smoke test sau phát hành.
- Rà soát nội dung học, khả năng tương thích trình duyệt và quy tắc sao lưu/khôi phục định kỳ.

## 4. Các quyết định cần xác nhận trước khi triển khai backend

1. Người dùng có cần đăng nhập thật và đồng bộ tiến độ giữa nhiều thiết bị không?
2. Ai biên soạn/phê duyệt nội dung, và có cần trang quản trị/CMS không?
3. Có lưu bản ghi lịch sử học chi tiết hay chỉ giữ trạng thái tiến độ tổng hợp?
4. Có yêu cầu cho phép học offline và đồng bộ lại khi có mạng không?
5. Những thị trường, múi giờ, thời hạn lưu dữ liệu và yêu cầu riêng tư nào cần hỗ trợ?

## 5. Thứ tự triển khai đề xuất

1. Chốt luồng người học, quy tắc XP/streak và tiêu chí chấp nhận.
2. Củng cố cấu trúc frontend: tách dịch vụ lưu trữ khỏi UI, chuẩn hóa mô hình dữ liệu và xử lý lỗi.
3. Bổ sung kiểm thử cho tính tiến độ, lưu/tải lại và các luồng học chính.
4. Nếu cần tài khoản thật, triển khai backend, xác thực an toàn và đồng bộ tiến độ; chuyển dữ liệu theo kế hoạch có kiểm tra.
5. Thêm công cụ quản trị nội dung, giám sát và tối ưu hạ tầng khi nhu cầu thực tế phát sinh.

Mỗi giai đoạn cần có người phụ trách, tiêu chí hoàn thành, cách kiểm chứng và phương án quay lui trước khi bắt đầu.

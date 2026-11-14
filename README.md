# 🪄 MagicTool AI V1.0 — Nền Tảng Sáng Tạo Ảnh & Video AI

> **MagicTool AI** là website studio chuyên biệt dành cho người sáng tạo nội dung, tập trung vào hai năng lực cốt lõi: **Image Studio** (Tạo hình ảnh) và **Video Studio** (Tạo video).

---

## 🌟 Tổng Quan Phiên Bản V1.0 (Demo Ready)

* **Giao diện:** Dark Mode cao cấp độc lập (`#0B0D17`, `#141827`, `#8B5CF6`), có hỗ trợ chuyển đổi Light Mode, thuần tiếng Việt 100%.
* **Kiến trúc Offline-First:** Dữ liệu dự án, bộ sưu tập và lịch sử tác vụ được lưu trữ an toàn ngay trên trình duyệt máy bạn thông qua **IndexedDB (Dexie.js)** và **localStorage**. Không gửi dữ liệu người dùng lên máy chủ ngoài.
* **Mock Generation Engine:** V1.0 hoạt động ở chế độ mô phỏng trung thực, mọi sản phẩm tạo ra đều có nhãn **“DEMO / Minh họa”**, không tạo các nút tải xuống MP4 giả mạo khi chưa có file thực tế.
* **AI Integration Ready:** Kiến trúc tách biệt qua interface `GenerationProvider`, sẵn sàng kết nối các API AI thật trong tương lai mà không cần viết lại giao diện.

---

## 🚀 Cách Cài Đặt & Chạy Ứng Dụng

### 1. Khởi động môi trường phát triển (Development)
```bash
cd magictool-ai
npm install
npm run dev
```
Trình duyệt sẽ mở tại: **[http://localhost:3000](http://localhost:3000)**

### 2. Kiểm tra lỗi & Build Production
```bash
# Kiểm tra TypeScript
npx tsc --noEmit

# Biên dịch sản phẩm
npm run build

# Chạy bản production
npm run start
```

---

## 🗺️ Cấu Trúc Các Trang (Sitemap)

| Tuyến đường (Route) | Chức năng |
| :--- | :--- |
| `/` | **Landing Page:** Giới thiệu sản phẩm, tuyên ngôn và 2 nút CTA vào app. |
| `/app` | **Dashboard:** Tổng quan thống kê, sản phẩm gần đây, trạng thái tác vụ. |
| `/app/image` | **Image Studio:** Tạo ảnh từ prompt, tỉ lệ (1:1, 16:9, 9:16...), style presets, nút chuyển sang Video Studio. |
| `/app/video` | **Video Studio:** Chế độ `Văn bản ➔ Video` và `Hình ảnh ➔ Video`, quỹ đạo camera (Dolly, Pan, Drone). |
| `/app/creations` | **Bộ Sưu Tập:** Thư viện toàn bộ ảnh/video, tìm kiếm theo prompt, bộ lọc theo loại & dự án. |
| `/app/projects` | **Quản Lý Dự Án:** Tạo mới, chỉnh sửa, xóa dự án (tự động unlink media an toàn). |
| `/app/projects/[id]` | **Chi Tiết Dự Án:** Xem toàn bộ media thuộc dự án và tạo nhanh ảnh/video mới cho dự án. |
| `/app/settings` | **Cài Đặt:** Đổi tên hiển thị, chuyển đổi Dark/Light mode, bật/tắt Reduced Motion, reset dữ liệu demo. |

---

## 🔌 Hướng Dẫn Tích Hợp AI Thật (Future AI Integration)

Trong tương lai khi bạn muốn kết nối với API tạo ảnh (Gemini Imagen, Flux, Midjourney) hoặc video (Veo, Kling, Runway, Luma):

1. Mở thư mục `features/generation/`.
2. Tạo file `real-provider.ts` triển khai interface `GenerationProvider` từ `types/index.ts`:
   ```typescript
   import { GenerationProvider, GenerationRequest, GenerationJob } from '@/types';

   export class RealAIProvider implements GenerationProvider {
     async createImageJob(request: GenerationRequest): Promise<GenerationJob> {
       // Gọi endpoint API của bạn (ví dụ Google Gemini API, Replicate hoặc backend server)
     }
     async createVideoJob(request: GenerationRequest): Promise<GenerationJob> {
       // Gọi endpoint Video API
     }
     // ...
   }
   ```
3. Trong các trang Studio, chỉ cần thay instance `mockGenerationProvider` bằng `realAIProvider`. Toàn bộ giao diện, form validate và bộ sưu tập sẽ hoạt động tự động mà không cần sửa đổi!

---

## ☁️ Triển Khai Lên Vercel

Dự án hoàn toàn tương thích với **Vercel** chỉ với 1 cú click:
1. Đẩy mã nguồn lên kho lưu trữ **GitHub**.
2. Đăng nhập vào [Vercel](https://vercel.com) và chọn **Add New Project**.
3. Chọn repo `magictool-ai`, giữ nguyên cấu hình mặc định (Next.js) và nhấn **Deploy**.

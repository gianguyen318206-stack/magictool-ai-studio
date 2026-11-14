# MagicTool AI V1.0 — Nhật Ký Quyết Định Kỹ Thuật (DECISIONS.md)

Tài liệu này ghi lại các quyết định thiết kế và kỹ thuật trong quá trình xây dựng MagicTool AI V1.0 theo bộ hồ sơ đặc tả `MagicTool_AI_V1_Antigravity_Plan`.

---

## 1. Kiến Trúc & Công Nghệ Cốt Lõi
* **Framework:** Next.js (App Router), React, TypeScript (strict).
* **Styling & Design System:** Tailwind CSS v4 kết hợp CSS Variables (`--bg-main`, `--bg-surface`, `--border-color`, v.v.) hỗ trợ linh hoạt chuyển đổi giữa Dark Mode (`#0B0D17`) và Light Mode (`#F8F9FC`).
* **Icons:** `lucide-react` nét mảnh chuẩn hiện đại.

---

## 2. Lưu Trữ Dữ Liệu Cục Bộ (Local Persistence)
* **IndexedDB qua Dexie.js:**
  * Bảng `projects`: Quản lý danh sách dự án (tạo, sửa tên, xóa với logic hủy liên kết creations thay vì xóa nhầm media).
  * Bảng `creations`: Quản lý danh sách hình ảnh và video đã tạo (kèm metadata, tỉ lệ, phong cách, nhãn `isDemo`).
  * Bảng `jobs`: Theo dõi tiến trình tác vụ (`queued`, `processing`, `completed_demo`, `canceled`, `failed`).
  * Bảng `blobs`: Lưu trữ blob ảnh người dùng tải lên để giữ qua các lần tải lại trang.
* **localStorage:** Dành cho cấu hình nhanh của người dùng (`theme`, `reducedMotion`, `displayName`).

---

## 3. Mock Generation Engine & Hợp Đồng Provider
* **Abstraction:** Khởi tạo interface `GenerationProvider` tại `features/generation/provider.ts` và triển khai `MockGenerationProvider` tại `features/generation/mock-provider.ts`.
* **Trạng thái trung thực:** 
  * Không kết nối bất kỳ API AI thực tế nào trong V1.0.
  * Tác vụ được mô phỏng có thanh tiến trình và thông báo giai đoạn rõ ràng.
  * Mọi asset minh họa đều mang nhãn **“DEMO / Minh họa”**.
  * Video Studio hiển thị placeholder mô phỏng và thông báo minh bạch, **tuyệt đối không hiển thị nút tải xuống file MP4 giả**.

---

## 4. Tương Thích & Mở Rộng Trong Tương Lai
* Khi dự án sẵn sàng kết nối API AI thật (Gemini/Veo/Flux/Kling/Runway):
  * Chỉ cần tạo file `features/generation/real-provider.ts` kế thừa `GenerationProvider`.
  * Thay thế instance provider trong application mà không cần phải viết lại bất kỳ giao diện người dùng (UI) nào.

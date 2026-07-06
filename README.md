# Dora Admin 2.0

Hệ thống quản trị nội bộ Doraemon Fanclub.

## Cài đặt

1. Clone repo
2. Cấu hình Firebase trong `js/firebase.js`
3. Mở `index.html`

## Phân quyền

| Chức vụ | Thêm TK | Xóa TK | Đổi MK | Cài đặt | Thông báo |
|---------|---------|--------|--------|---------|-----------|
| Ban Quản Trị | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin | ❌ | ❌ | ❌ | ❌ | ✅ (xem) |

## Tài khoản mặc định

- `BQT001` / `123` → Ban Quản Trị
- `BQT002` / `123` → Admin

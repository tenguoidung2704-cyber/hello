# Rạp Party: hướng dẫn đưa lên mạng

Cấu trúc repo:

```
index.html          giao diện (GitHub Pages)
server/server.js    server đồng bộ (Render)
server/package.json
```

## Bước 1: đẩy code lên GitHub
1. Tạo repo mới trên github.com (ví dụ `rap-party`), để public.
2. Upload cả 3 file giữ đúng cấu trúc thư mục ở trên (nút Add file > Upload files).

## Bước 2: deploy server (miễn phí) trên Render
1. Vào render.com, đăng nhập bằng GitHub.
2. New > Web Service > chọn repo `rap-party`.
3. Điền: Root Directory = `server`, Build Command = `npm install`, Start Command = `npm start`, Instance Type = Free.
4. Mục Environment, thêm biến `ORIGIN` = `https://TEN-GITHUB.github.io` (chỉ cho web của ê kết nối, không bắt buộc).
5. Deploy xong ê sẽ có địa chỉ dạng `https://rap-party-xxxx.onrender.com`.

## Bước 3: nối giao diện với server
Trong `index.html`, tìm dòng bắt đầu bằng `const WS_URL` và đổi `wss://TEN-APP.onrender.com` thành địa chỉ Render của ê, đổi `https` thành `wss`. Ví dụ `wss://rap-party-xxxx.onrender.com`. Lưu lại (commit).

## Bước 4: bật GitHub Pages
Repo > Settings > Pages > Source: Deploy from a branch > `main` / `(root)` > Save. Chờ khoảng 1 phút, link sẽ là `https://TEN-GITHUB.github.io/rap-party/`.

## Cách dùng
- Mỗi nhóm xem một phòng riêng bằng cách thêm mã phòng vào link: `.../rap-party/?room=giai-lol`. Ai mở cùng link đó sẽ ở chung phòng, tối đa 40 người.
- Bấm 📺 Màn hình để đặt tên trận và link livestream cho cả phòng. Người vào sau vẫn thấy.

## Lưu ý
- Render gói free tự ngủ khi 15 phút không ai dùng, lần đầu mở lại phải chờ 30 đến 60 giây. Mở link trước giờ xem một chút là được.
- Muốn thử trên máy: vào thư mục `server`, chạy `npm install` rồi `npm start`, sau đó mở `index.html` qua một web server cục bộ (ví dụ `npx serve`), nó sẽ tự nối `ws://localhost:8080`.

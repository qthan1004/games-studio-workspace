---
title: "{{PROJECT_NAME}} — Bản Đồ Trung Tâm Các Phòng Ban (MOC)"
owner: "producer"
status: "draft"
updated: "{{DATE}}"
---

# {{PROJECT_NAME}} — Bản Đồ Tri Thức Trung Tâm (`MOC`)

 Trung tâm điều hướng kết nối toàn bộ đặc tả sống của 6 phòng ban chuyên môn. Mọi lịch trình Sprint, GitHub Issues, biên bản QA và tiến độ đều quản lý trực tiếp trên **GitHub Repository & GitHub Project v2** của dự án này.

## Neo Dự Án (`Project Anchors`)

- [Định danh Dự án & Cấu hình Engine](../PROJECT.md)
- [Mỏ neo Phong cách & Golden Samples](../STYLE_ANCHOR.md)
- [Sổ cái Thực thể & Hằng số Liên Phòng Ban](registry.yaml)

## Đặc Tả Sống Của 6 Phòng Ban (`Living Specifications`)

| Phòng ban | Thư mục | Tài liệu chính thức | Trạng thái |
|---|---|---|---|
| **01 Biên Kịch (`Narrative`)** | `01_narrative/` | *(Điền thế giới quan, nhân vật & thoại khi dự án có yếu tố dẫn chuyện)* | `pending` |
| **02 Thiết Kế (`Game Design`)** | `02_game_design/` | [Tóm tắt Game Brief](02_game_design/game-brief.md) | `draft` |
| **03 Cân Bằng (`Balance & Economy`)** | `03_balance_economy/` | *(Điền công thức, thông số tốc độ/kinh tế & kịch bản mô phỏng)* | `pending` |
| **04 Màn Chơi (`Level & World`)** | `04_level_world/` | *(Điền bố cục không gian, phân khu, nhịp độ & chống kẹt đường)* | `pending` |
| **05 Mỹ Thuật & Âm Thanh (`Art & Audio`)** | `05_art_vfx_audio/` | *(Điền Art Bible, quy chuẩn asset, hiệu ứng Juice & Audio Bus)* | `pending` |
| **06 Kiến Trúc (`Architecture & Tech`)** | `06_architecture_tech/` | *(Điền sơ đồ module, schema dữ liệu/save & ngân sách 60 FPS)* | `pending` |

## Ma Trận Đồng Bộ Hệ Thống (`Sync Matrix`)

| Mã hệ thống (`System ID`) | Tài liệu gốc | Đường dẫn `data/` | Đường dẫn Code | Trạng thái | Đồng bộ |
|---|---|---|---|---|---|
| `core-loop` | [game-brief.md](02_game_design/game-brief.md) | `data/` | `{{CODE_ROOT}}` | `draft` | `[OK]` |

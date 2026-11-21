---
name: update-wiki
description: Standardized workflow to update, enrich, or retire technical documentation in .agent-wiki/
triggers: ["update wiki", "wiki update", "cap nhat wiki", "them wiki", "ghi wiki"]
---

# Workflow: Update & Maintain Agent Wiki (update-wiki)

> **Mục tiêu:** Đảm bảo mọi thay đổi về mã nguồn (`src/`), phân tích lỗi (root cause), quyết định nghiệp vụ (PO/BA) hoặc tài liệu mới (`docs/`, `documents/payment/`) đều được chuẩn hoá đồng bộ vào `.agent-wiki/` một cách nhất quán, không thất lạc tri thức và không làm phình token.

---

## Pipeline Thực Hiện (5 Bước Chuẩn Hoá)

```text
[BƯỚC 1: ĐỊNH VỊ] -> [BƯỚC 2: PHÂN TÍCH INVARIANTS] -> [BƯỚC 3: CẬP NHẬT/TẠO MỚI] -> [BƯỚC 4: VALIDATE FRONTMATTER] -> [BƯỚC 5: GIT HYGIENE COMMIT]
```

---

### Bước 1: Định vị Tài liệu Đích (Target Discovery)

Agent sử dụng **Obsidian MCP** hoặc **MOC.md** để tra cứu tài liệu liên quan thay vì quét toàn bộ repository:

1. **Tra cứu qua Obsidian MCP (Ưu tiên số 1)**:
   - Gọi tool: `simple_search(query: "<tên method / mã ticket / keyword>")`.
   - Hoặc gọi tool: `get_file_contents(file_path: "paymenthub-checkout-web/MOC.md")`.
2. **Xác định phân vùng tài liệu**:
   - `architecture/`: Kiến trúc runtime, Zustand store, routing layout, polling, captured settlement.
   - `domains/order-and-session/`: Thẩm quyền tiền tệ (actualRemain), draft recovery UX-2, order state machine.
   - `domains/bill-split-and-mix/`: Ma trận mixableWith 2 chiều, split lifecycle, cancel & expiry 3 cấp.
   - `domains/voucher-and-promotions/`: FVAC-2560, gộp mã 1590, schema data contract.
   - `domains/payment-methods/`: Chi tiết 7 nhóm PTTT (Cash, QR, Card POS, CKPD S3, Soft Dynamic PH-2468, SMS).
   - `domains/integration-and-clients/`: Phân loại merchant (Rule 1697), RSA E-com, Customer BF Pipeline.
3. **Quyết định: Cập nhật file có sẵn hay tạo file mới**:
   - Nếu là tính năng/bug fix thuộc PTTT hoặc luồng đã có -> **Cập nhật trực tiếp vào file hiện hữu**.
   - Nếu là PTTT hoặc phân hệ hoàn toàn mới chưa từng có -> **Tạo file mới theo đúng chuẩn template**.

---

### Bước 2: Bảo Toàn Ba Nguyên Tắc Bất Biến (Core Invariants)

Khi chỉnh sửa bất kỳ tài liệu nào, Agent bắt buộc phải đối chiếu và không được vi phạm 3 quy tắc vàng:

1. **SSOT Money Authority**:
   - `actualRemain` (tính từ API Bill Check) là chân lý thẩm quyền duy nhất để tính `paymentCapacity = max(0, actualRemain)`.
   - `displayRemain` chỉ dùng hiển thị UI (có thể âm trong Tiền mặt overpay).
2. **Receipt Settlement Invariants**:
   - Không một PTTT nào được tự động điều hướng sang Receipt.
   - Bắt buộc thỏa mãn đồng thời: Parent Transaction `Captured` VÀ Authoritative Captured Amount `>= totalAmount`.
3. **Customer Isolation**:
   - Luồng Back-Forward browser history và Smart confirmation pipeline chỉ áp dụng cho `isCustomerMerchant === true`. Tuyệt đối không ảnh hưởng quầy POS / thu ngân nội bộ.

---

### Bước 3: Quy Chuẩn Soạn Thảo (Editing & Formatting Standards)

#### 1. Cấu trúc YAML Frontmatter Bắt Buộc
Mỗi file markdown trong `.agent-wiki/` bắt buộc phải có khối frontmatter chuẩn:

```yaml
---
title: "Tên tài liệu định danh rõ ràng"
description: "Mô tả súc tích giải pháp, invariants và phạm vi kỹ thuật phục vụ Agent semantic search"
version: "1.0.0"       # Tăng minor (1.1.0) khi có tính năng mới, patch (1.0.1) khi fix bug
released: "2026-10-06"  # Ngày cập nhật chuẩn hoá định dạng YYYY-MM-DD
app_release: "main@..." # Commit git hoặc release tag tương ứng của codebase
type: "domain-spec"    # architecture-spec | domain-spec | integration-spec | hub-index
domain: "..."          # architecture | order-and-session | bill-split-and-mix | voucher-and-promotions | payment-methods | integration-and-clients
module: "src/..."      # Đường dẫn thư mục code thực tế tại src/
tags:
  - checkout/...
  - payment/...
aliases:
  - "Tên thường gọi"
related:
  - "[[lien-ket-obsidian]]"
source_files:
  - "docs/file_cu.md"
  - "documents/payment/ticket.md"
---
```

#### 2. Quy Tắc Tiết Kiệm Quota (Token Hygiene)
- **Tuyệt đối không dùng Icon/Emoji trang trí** (`🏛️`, `📦`, `⚖️`, `🎟️`, `💳`, `🟢`, `🏠`...).
- **Chỉ dùng ký tự thuần ASCII**:
  - Dùng `->` thay cho `➔`.
  - Dùng `[OK]` hoặc `[PASS]` thay cho `✅`.
  - Dùng `[FAIL]` hoặc `[ANTI-PATTERN]` thay cho `❌`.

#### 3. Bổ Sung Trace Anchors & Code References
Mỗi tài liệu kỹ thuật phải có:
- **Code Anchors Table**: Đường dẫn file, tên symbol/function, dòng code chính xác trong `src/`.
- **State Machine / Mermaid Flowchart**: Sơ đồ chuyển đổi trạng thái rõ ràng.
- **Runbook gỡ lỗi (Debugging Checklist)**: Hướng dẫn tester và dev các bước kiểm tra khi xảy ra lỗi.
- **Test Matrix Table**: Danh sách unit test suites bảo vệ tính năng.

---

### Bước 4: Đồng Bộ MOC & Bảng Đối Chiếu Nguồn Gốc

Sau khi cập nhật hoặc thêm file mới:

1. **Cập nhật MOC.md**:
   - Nếu thêm file mới: Bổ sung liên kết `[[ten-file|Tiêu đề hiển thị]]` vào đúng Domain Cluster trong [MOC.md](file:///c:/Users/thanhdq13/Desktop/workspaces/paymenthub-checkout-web-wt/chore-build-agent-wiki/.agent-wiki/MOC.md) và sơ đồ Mermaid Graph.
2. **Cập nhật INDEX.md**:
   - Bổ sung bullet point tóm tắt vào đúng phân tầng trong [INDEX.md](file:///c:/Users/thanhdq13/Desktop/workspaces/paymenthub-checkout-web-wt/chore-build-agent-wiki/.agent-wiki/INDEX.md).
3. **Cập nhật raw-docs-index.md**:
   - Nếu chuẩn hoá từ một file trong `docs/` hoặc `documents/payment/`, bổ sung hàng ánh xạ vào bảng Traceability Matrix trong [raw-docs-index.md](file:///c:/Users/thanhdq13/Desktop/workspaces/paymenthub-checkout-web-wt/chore-build-agent-wiki/.agent-wiki/raw-docs-index.md).

---

### Bước 5: Kiểm Định & Git Hygiene Commit

1. **Chạy Validator kiểm tra Frontmatter & Emoji**:
   - Chạy lệnh kiểm tra tính toàn vẹn:
     ```powershell
     node -e "
     const fs = require('fs');
     const p = '.../.agent-wiki/<file-vua-sua>.md';
     const c = fs.readFileSync(p, 'utf8');
     if (!c.startsWith('---')) throw new Error('Missing frontmatter');
     if (/[\u{1F300}-\u{1F9FF}]/u.test(c)) throw new Error('Found emoji');
     console.log('Validation OK');
     "
     ```
2. **Kiểm tra trạng thái Git**:
   - Chạy `git status` để đảm bảo **chỉ có thư mục `.agent-wiki/` bị thay đổi**, không vô tình chỉnh sửa code trong `src/` hay thư mục `docs/` legacy.
3. **Commit theo chuẩn Conventional Commits**:
   - Lệnh commit:
     ```bash
     git add .agent-wiki
     git commit -m "docs(wiki): update <tên-module> with <nội dung tóm tắt>"
     ```
4. **Push lên nhánh tương ứng**:
   ```bash
   git push origin <current-branch>
   ```

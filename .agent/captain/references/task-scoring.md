# Chấm điểm task để chọn model và effort

Áp dụng cho từng assignment (worker, scout hoặc reviewer), sau khi đọc scope, contract, callers và cách kiểm chứng. Đây là quy tắc phân công của user, không phải benchmark model hay điểm tự tin. Điểm cuối chỉ từ **1 đến 5**; thay thế cách cộng điểm 0–10 trước đây. Tiêu chí chấm dùng chung; mapping model hiện chỉ chốt cho Codex. User sẽ cung cấp mapping AG/các model khác sau.

## Thang điểm và model Codex

| Point | Model / effort ưu tiên | Định nghĩa |
|---|---|---|
| 1 | Luna; medium là mặc định đã thống nhất nếu runtime hỗ trợ | Việc cơ học, yêu cầu rõ, ảnh hưởng local, kiểm chứng trực tiếp |
| 2 | Terra / medium | Implementation nhỏ cần suy luận local; contract và flow đã rõ |
| 3 | Terra / high | Nhiều nhánh hoặc callers cần trace kỹ, nhưng invariant và hướng giải quyết đã xác định |
| 4 | Sol / high | Logic lõi/shared contract, nhiều flow tương tác hoặc tradeoff kỹ thuật cần phân tích sâu; **trần thông thường** |
| 5 | Sol / max **hoặc** Astra / high | Bài toán suy luận đặc biệt khó, đạt điều kiện mức 5 bên dưới; không dùng mặc định |

## Cách đánh point

Đánh riêng bốn tiêu chí dưới đây ở mức 1–4, ghi bằng chứng cho từng tiêu chí. **Point cơ sở = mức cao nhất trong bốn tiêu chí**, không cộng hoặc lấy trung bình: một rủi ro khó không được pha loãng bởi các phần dễ. Nếu nằm giữa hai mức, chọn mức cao hơn và ghi điều kiện phân biệt còn lại.

| Tiêu chí | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| C — Suy luận kỹ thuật | Sửa lặp lại/cơ học, cách sửa đã rõ | Cần chọn cách sửa trong một vùng local | Trace nhiều nhánh/callers, kết hợp nhiều constraint đã rõ | Root cause/thiết kế lõi hoặc tradeoff tương thích cần đối chiếu nhiều giả thuyết kỹ thuật |
| I — Phạm vi và contract | Local; không đổi hành vi/contract dùng chung | Một component/module, callers đã xác minh | Nhiều module/adapters nhưng tuân thủ contract đã chốt | Thay đổi schema/invariant/shared core ảnh hưởng nhiều PTTT hoặc tính tương thích |
| F — State và flow | Stateless hoặc thay đổi không đụng state | Một flow tuần tự đã xác định | Một flow có async/retry/cancel với transition rõ | Race, stale state, recovery hoặc nhiều flow tương tác cần bảo toàn invariant |
| V — Độ khó chứng minh đúng | Check sẵn có chứng minh trực tiếp | Thêm focused unit/behavior test | Test nhiều transition/adapter hoặc integration có oracle rõ | Phải thiết kế oracle và kiểm chứng invariant xuyên flow, ordering/compatibility khó |

Số file, số dòng, tên task, thời gian chờ browser/API và số lượng testcase không tự tăng point. Test browser theo checklist rõ có thể chỉ ở mức 2–3; sửa một field shared phá contract có thể là mức 4. Các callers đã được chứng minh không bị ảnh hưởng không tính thành phạm vi thay đổi.

Thiếu bằng chứng → ghi `unknown` và phân công scout thu thập facts; chưa chốt point cho phần implementation bị phụ thuộc. Không xem unknown là mức 1 hoặc tự nâng lên mức 5. Quyết định nghiệp vụ chưa rõ vẫn đi qua chat chính và `interview-me`.

## Điều kiện dùng mức 5

Mặc định dừng ở mức 4. Chỉ nâng lên 5 khi **đủ cả ba điều kiện**:

1. `C = 4` và ít nhất một tiêu chí khác cũng ở mức 4.
2. Sau khi tách các phần độc lập, vẫn còn một bài toán suy luận không thể tách an toàn: ví dụ bảo toàn nhiều invariant tương tác trong ordering/race hoặc giải tradeoff tương thích không có phương án rõ từ contract hiện hữu. Ghi cụ thể invariant, giả thuyết và lý do mức 4 có thể chưa đủ.
3. Có bằng chứng trực tiếp về độ khó còn lại: counterexample/test failure đã phân tích, các phương án có xung đột invariant, hoặc trace/contract chứng minh các ràng buộc tương tác. Không dùng cảm giác “task to”, quota còn nhiều, hoặc thất bại do môi trường/thiếu thông tin làm bằng chứng.

Không bắt buộc chạy Sol/high thất bại trước nếu bằng chứng đã đủ; cũng không tự tăng point sau mỗi lần fail. Vẫn giữ số vòng sửa/review hữu hạn và giới hạn đã được user chốt.

Chọn **Sol/max** khi cần đào sâu tiếp bài toán đã được trace trong hướng giải hiện tại. Chọn **Astra/high** khi cần đánh giá lại nhiều giả thuyết/tradeoff kỹ thuật đã có bằng chứng. Đây là tiêu chí phân công, không khẳng định model nào luôn tốt hơn. Ghi lý do chọn một trong hai, không chạy cả hai cùng lúc mặc định.

## Ánh xạ theo runtime

- **Codex:** resolve tên Luna/Terra/Sol/Astra thành ID thực tế runtime đang expose và kiểm tra effort được hỗ trợ. Không tự biến Terra thành alias của model khác. Nếu Terra không có, fallback ưu tiên cho point 2 là Sol/medium, point 3 là Sol/high; giữ nguyên point, ghi model yêu cầu, model chạy và lý do fallback. Đây là fallback được policy cho phép, không phải tuyên bố hai model tương đương. Explicit pin hoặc budget khác của user luôn ưu tiên; không có lựa chọn phù hợp thì báo chat chính.
- **AG và các model/runtime khác:** `mappingStatus: pending-user-input`. Có thể chấm point nhưng chưa tự chọn hay ánh xạ model; user sẽ cung cấp sau. Giữ preference AG ưu tiên chất lượng làm context, không coi đó là mapping đã chốt. Không suy diễn Gemini tương đương Sol/Terra hay áp effort Codex. Quota không tự biến task thành point 5 hoặc cho phép thêm concurrency. Chỉ khi execution thực tế cần mapping còn thiếu thì chat chính hỏi quyết định đó theo `interview-me`; không hỏi trước trong giai đoạn cập nhật skill này.
- Nếu runtime không cho chọn effort/model, ghi control không khả dụng và setting inherited/configured khi xác minh được; yêu cầu reasoning trong prompt không phải effort đã được runtime áp dụng. Không claim model cụ thể đã chạy chỉ từ role name.

## Ví dụ phân mức

| Task và bằng chứng | C/I/F/V | Point |
|---|---|---|
| Đổi constant theo giá trị đã chốt; callers không đổi flow, có check trực tiếp | 1/1/1/1 | 1 |
| Thêm field optional local, không đổi payload/default, callers đã kiểm tra; thêm focused test | 2/2/1/2 | 2 |
| Implement adapter theo frozen contract, có polling/cancel tuần tự và transition rõ | 3/3/3/3 | 3 |
| Sửa identity/resolver shared làm đổi cách chọn flow của nhiều PTTT; cần chứng minh tương thích | 4/4/3/4 | 4 |
| Race giữa cancel/retry/polling; sau khi chia việc vẫn có hai invariant xung đột và counterexample cụ thể | 4/4/4/4 + đủ ba điều kiện mức 5 | 5 |

Reviewer chấm theo phần cần chứng minh và rủi ro thực tế của diff, không mặc định toàn bộ review là point 4/5. Model nhẹ vẫn phải đạt cùng acceptance/test/DoD.

## Record và đánh giá lại

Trong brief/checkpoint ghi: `taskId`, role, runtime, `C/I/F/V` kèm evidence, `point`, điều kiện mức 5 nếu có, model/effort ưu tiên, setting yêu cầu và setting đã xác nhận, fallback, lý do phân công, trigger đánh giá lại, agent identity.

Rescore khi scope/contract hoặc evidence thay đổi. Trước khi nâng mức do failure, phân biệt lỗi brief, quyết định chưa rõ, lỗi môi trường và bài toán suy luận. Không giảm tiêu chí nghiệm thu để giữ model nhẹ. Khi thay worker/model, tiếp tục cùng worktree/checkpoint sau khi worker cũ đã dừng ghi; không redo việc đã nghiệm thu hay tạo hai writer.

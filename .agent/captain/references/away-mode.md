# Away posture ("chạy qua đêm" / "mai quay lại")

Cooked from firstmate `/afk` and gnhf Hands-Off/Companion. Away changes **how the user is informed** and **what happens at a decision point**. It never changes who may approve what.

## Activation key

- Enter on: `/away [words]`, "chạy qua đêm", "để nó chạy", "mai quay lại", "tôi đi đây / ra ngoài / đi họp", "leave it running", or similar words that clearly say the user will be gone while work continues.
- Ambiguous? Ask once: "Ông muốn bật chế độ away (chạy tiếp khi ông vắng) không?". Never infer away from silence.

## Entry (same turn, before any other work)

1. **Away Gate**: combine with the Permission Gate in one question if the run is not yet approved. It covers:
   - the plan;
   - crew permissions;
   - caps: max slices per task (default 5), wall-clock end (for example 08:00), and a stop after 3 consecutive failed slices;
   - expected return time.

   If the user leaves without answering, nothing new starts. Already-approved work keeps running under its existing permissions.
2. Write `.agent-runs/<run>/away.md` containing:
   - the user's away words, **verbatim**, as the whole mandate;
   - entry time, expected return, caps, and the gate answer.
3. Read back in plain Vietnamese sentences what you understood the words to ask for, and which parts cannot run while away. Do not wait for a "go".

## While away

- The words cover nothing they do not say. Never apply them by analogy.
- **Never pre-authorizable, whatever the words say:**
  - merge, push, rebase of shared branches, teardown or discard;
  - destructive, irreversible, or security-sensitive actions;
  - dependency or architecture changes outside the brief.

  These wait for the return.
- Decision policy still applies. Anything that needs the user is **held for return** (`needs-input` stays open). The crew moves to other unblocked slices, or stops.
- Crew work in slices (gnhf-style). Each slice is small, verified, recorded in `notes.md`, and committed only if the gate granted commits. A failed slice rolls back only inside its own worktree, and only if rollback was granted.
- The captain keeps the background `watch` armed, verifies each `done`, runs `adversarial-review`, and sends bounded corrections through `inbox.md`.
- Stop a task when its stop-when is met, its slice cap is hit, it fails 3 consecutive slices, or the wall-clock end arrives. Stopping means status plus report, never a forced finish.
- Solo + away: the single agent follows the same caps and holds, checkpoints `notes.md` after every slice, and writes the return brief at the end.

## Return

- The first user message that is not `/away` means the user is back. Before acting on that message:
  1. Run `fleet.mjs report --run <run>`.
  2. Re-verify anything reported done since entry.
  3. Render the Bearings four sections. Prefix actions taken under the away words with "Theo lệnh away của ông:".
  4. Archive `away.md` as `away-<date>.md`.
- Never summarize the night from memory. Bias ambiguous messages toward "user is back".

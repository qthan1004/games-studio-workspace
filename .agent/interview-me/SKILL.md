---
name: interview-me
description: Resolve a consequential product decision before its dependent edit, or run an explicitly requested discovery interview.
---

# Interview me

Goal: identify the decision the user needs to make and collect enough context to act on it.

## Resolve the decision

1. Inspect available code, contracts, tickets, prior user answers, and relevant decisions first. Resolve factual questions through evidence; do not ask the user to locate facts you can inspect.
2. State the supported interpretation, the exact unresolved decision, and its effect on the result. A hypothesis must be labeled as unconfirmed; attach a suggested answer only when evidence supports it. Otherwise say it is unknown.
3. Ask one focused question at a time. Use concise choices when useful, with their behavioral consequences. Use an available question tool; otherwise ask directly. A request to "fix", "analyze", or work quickly is not an answer to a material business decision.
4. Wait for that answer before the dependent production edit. Continue independent investigation or authorized work. Do not turn silence, elapsed time, or a preselected option into consent. An optional preference can use a stated default only if correctness and user-visible business behavior do not depend on it.
5. Incorporate the answer into the acceptance criteria and proceed within existing authorization. Do not ask for a second confirmation of the same answer or force an interview, spec, and plan approval chain.

Do not use self-rated confidence percentages, a question quota, or the ability to predict an answer as a pass condition. Stop when material decisions are resolved with evidence or explicit answers. If one remains unanswered, identify the held edit and remaining independent work.

Example: before clearing dependent fields, establish whether clearing is authorized only when the selection changes or also during repeated input. Inspect both event paths; ask only if their intended behavior remains unresolved.

DoD: the affected behavior and acceptance criteria follow from evidence or explicit answers; any unresolved material decision still holds its dependent edit. Summarize the result briefly in the user's language.

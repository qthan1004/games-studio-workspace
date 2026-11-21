# Workflow: Jira ticket create

Use [jira-ticket-create](../jira-ticket-create/SKILL.md) for an explicit request to create a
ticket, or the missing-ticket step of an authorized RAI coding/fix task. The skill owns field
validation, description composition, approval, creation, and verification; read and execute it
rather than maintaining another copy of those steps here.

If this coding/fix task already has a ticket, reuse it; do not create an additional one merely
to start RAI. If an existing key is missing or cannot be read, resolve that issue first.

After creating and verifying a ticket:

- For the enclosing coding/fix task that already selected RAI, send the ticket key/URL and
  return to [jira-rai-build](jira-rai-build.md) with the new key and existing delivery scope.
  Continue in the same task; do not repeat the mode question or ask the user to start another flow.
- For a standalone create request, report the key/URL and finish. Ticket creation alone does
  not start a coding/build flow, create branches/MRs, or change statuses.

Do not recreate a ticket after an uncertain write outcome. Check for the created issue first;
an unresolved outcome holds a duplicate create, not independent work on the task.

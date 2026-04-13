# Oklahoma K-12 Connect — Custom Nostr Protocol Extensions

This document describes the custom Nostr event kinds used by Oklahoma K-12 Connect
in addition to the standard NIPs already in use (NIP-52 kind:31922 for assignments,
NIP-1 kind:1 for media, NIP-17 for encrypted DMs).

---

## kind:31103 — Student Grade Report

An **addressable event** (30000–39999) published by a **teacher** to record
a student's current grade in a specific course.  Because it is addressable,
each subsequent grade update simply replaces the previous event on the relay;
guardians always see the latest grade for each course automatically.

### Who publishes it

Teachers/admins sign and publish these events using their own Nostr keypair.
Guardians query by the teacher's pubkey (`authors` filter) to prevent spoofing.

### Event structure

```json
{
  "kind": 31103,
  "pubkey": "<teacher-pubkey-hex>",
  "created_at": <unix-timestamp>,
  "content": "<optional teacher note / narrative comment>",
  "tags": [
    ["d", "<student-pubkey-hex>:<course-code>"],
    ["t", "oklahoma-k12-grade"],
    ["ok-student-pubkey", "<student-pubkey-hex>"],
    ["ok-student-name",   "<display-name>"],
    ["ok-course",         "<course-code>"],
    ["ok-course-name",    "<human-readable course name>"],
    ["ok-grade",          "<letter-grade>"],
    ["ok-score",          "<numeric-score>"],
    ["ok-max-score",      "<max-possible-score>"],
    ["ok-attendance",     "<percentage string, e.g. 97>"],
    ["ok-term",           "<term identifier, e.g. 2025-2026-Q3>"],
    ["ok-teacher-name",   "<teacher display name>"],
    ["alt", "Student grade report: <course-name> — <grade>"]
  ]
}
```

### Required tags

| Tag                  | Description                                              |
| -------------------- | -------------------------------------------------------- |
| `d`                  | Stable address: `<student-pubkey>:<course-code>`         |
| `t`                  | Must be `oklahoma-k12-grade` for relay-level filtering   |
| `ok-student-pubkey`  | Hex pubkey of the student this grade belongs to          |
| `ok-course`          | Machine-readable course code (e.g. `MATH-201`)           |
| `ok-grade`           | Letter grade (A, A-, B+, B, B-, C+, C, D, F, N/A)       |

### Optional tags

| Tag                | Description                                          |
| ------------------ | ---------------------------------------------------- |
| `ok-student-name`  | Display name of the student                          |
| `ok-course-name`   | Human-readable course name (e.g. `Algebra II`)       |
| `ok-score`         | Current numeric score (e.g. `87`)                    |
| `ok-max-score`     | Maximum possible score (e.g. `100`)                  |
| `ok-attendance`    | Attendance percentage as a string (e.g. `97`)        |
| `ok-term`          | Academic term identifier                             |
| `ok-teacher-name`  | Display name of the publishing teacher               |
| `alt`              | NIP-31 human-readable description (recommended)      |

### Querying

Guardians fetch grade reports for their child's teacher:

```typescript
// Query all grade reports from a specific teacher
const events = await nostr.relay('wss://beginningend.com').query([{
  kinds: [31103],
  authors: [teacherPubkey],
  '#t': ['oklahoma-k12-grade'],
  limit: 100,
}]);

// Query grade reports for a specific student
const events = await nostr.relay('wss://beginningend.com').query([{
  kinds: [31103],
  authors: [teacherPubkey],
  '#t': ['oklahoma-k12-grade'],
  '#ok-student-pubkey': [studentPubkey],
  limit: 50,
}]);
```

### d-tag deduplication

Because the `d` tag is `<student-pubkey>:<course-code>`, each course for each
student has exactly one live grade report on the relay at any time. When a
teacher updates a grade, they publish a new event with the same `d` tag —
the relay replaces the old one automatically.

---

## kind:31922 — Assignment Calendar Event (NIP-52 extension)

Oklahoma K-12 uses NIP-52 kind:31922 (Date-Based Calendar Event) with these
additional custom tags:

| Tag              | Description                                           |
| ---------------- | ----------------------------------------------------- |
| `ok-class`       | Class / course name                                   |
| `ok-type`        | Assignment type: homework/quiz/test/project/lab/…     |
| `ok-points`      | Maximum point value                                   |
| `ok-rfc`         | Reason-For-Change code (reschedules only)             |
| `ok-rfc-note`    | Optional free-text RFC elaboration                    |
| `ok-prev-event`  | Event ID being replaced (creates audit chain)         |
| `ok-version`     | Monotonically increasing reschedule counter           |
| `ok-standards`   | Aligned Oklahoma/Common Core standard codes           |
| `t`              | `oklahoma-k12-assignment` (community filter tag)      |

---

## Relay

All Oklahoma K-12 events are published to and read from:

```
wss://beginningend.com
```

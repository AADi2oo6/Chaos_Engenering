## **HabitOS — Evidence-Driven Habit Tracker**

Our central idea:

> **Don't just track the habit. Track the evidence, context and recovery.**

The PS remains the foundation, but our product becomes:
```text
             USER
               │
       ┌───────┴────────┐
       │                │
    WEBSITE          TELEGRAM
       │                │
       └───────┬────────┘
               ↓
        HABIT ENGINE
               │
       ┌───────┼─────────┐
       ↓       ↓         ↓
    Manual    AI       IoT*
    Entry   Evidence   Evidence
       │       │         │
       └───────┼─────────┘
               ↓
        VERIFICATION
               ↓
     Completion / Score
               ↓
      Streak + Recovery
               ↓
          Analytics
```

`*` IoT comes last.

---

# 1. Final Tech Stack

I would **not use FastAPI + React + separate Telegram server + another worker**. That's too many moving parts for a short hackathon.

## Frontend + Backend

### **Next.js + TypeScript**

Use Next.js App Router.

Why:

* frontend and backend API routes in one repository
* easy deployment
* easy Telegram webhook endpoint
* easy OpenAI server-side calls
* no separate FastAPI deployment
* TypeScript everywhere

Next.js is explicitly designed as a full-stack React framework, which is useful for this time-constrained build. ([Next.js][2])

### UI

```text
Next.js
TypeScript
Tailwind CSS
shadcn/ui
Lucide Icons
Recharts
```

Keep animations limited. We need a polished interface, not an animation project.

---

# 2. Database

### **Supabase PostgreSQL**

Use:

```text
Supabase
 ├── PostgreSQL
 ├── Auth
 ├── Storage
 └── Realtime
```

Supabase gives us the underlying PostgreSQL database plus Auth, Storage, Realtime and Edge Functions, so we don't need to assemble these independently. ([Supabase][3])

For our hackathon:

### Use

* PostgreSQL → all structured data
* Auth → website users
* Storage → evidence photos/files
* Realtime → live dashboard updates
* Edge Functions → only where useful later

We do **not** need to build a complicated separate database server.

---

# 3. AI

### **OpenAI Responses API**

Use the official OpenAI JavaScript SDK.

```text
openai
```

OpenAI's current API supports multimodal inputs, including images/files, and structured JSON responses, which is exactly what we need for natural-language habit logging and evidence processing. ([OpenAI Platform][1])

AI jobs:

### AI #1 — Natural-language logging

User:

> "I read 14 pages today"

AI:

```json
{
  "intent": "log_habit",
  "habit": "reading",
  "value": 14,
  "unit": "pages",
  "date": "today"
}
```

---

### AI #2 — Intent understanding

User:

> "I'm too tired to walk today"

Bot understands the intent rather than treating this as invalid input.

---

### AI #3 — Evidence analysis

User sends:

```text
📷 image
```

AI can inspect it and return structured evidence information.

OpenAI documents image inputs through the Responses API. ([OpenAI Platform][1])

---

### AI #4 — Weekly coach

At week's end:

```text
You completed:
Reading 6/7
Walking 5/7
Study 4/7
```

AI generates:

> Your strongest habit was walking.
> Your missed reading days occurred mostly after 10 PM.
> Consider moving reading to your morning routine.

---

# 4. Telegram

## Use **grammY**

```text
grammy
```

It's lightweight and TypeScript-friendly.

Telegram supports inline/callback buttons and HTTPS webhooks, so the bot can behave like an actual interactive habit assistant rather than a command-only bot. ([Telegram][4])

---

# 5. Telegram architecture

```text
Telegram User
     │
     ↓
Telegram Bot
     │
     ↓
Next.js webhook
     │
     ├── Natural language
     │       ↓
     │     OpenAI
     │       ↓
     │    structured action
     │
     ├── Button click
     │       ↓
     │    Habit Engine
     │
     └── Photo
             ↓
           OpenAI
             ↓
          Evidence
```

No separate Telegram backend.

---

# 6. Telegram commands

Initial commands:

```text
/start
/help
/habits
/today
/streak
/score
/skip
/stats
/settings
```

But the important interaction should be **natural language**, not commands.

User:

> I walked 6200 steps

Bot:

> 🚶 Walking
> Target: 5,000
> Recorded: 6,200
>
> ✅ Completed
> 🔥 8-day streak
> +10 points

---

# 7. Telegram reminder

At habit time:

> 🔔 **Habit Reminder**
>
> 📖 Read 10 pages
>
> Target: 10 pages
>
> **[✅ Done] [🛟 Recovery] [⏰ Later]**

This is where Telegram becomes genuinely useful.

---

# 8. The most important database design

Don't create an overcomplicated schema.

Use these core tables:

```text
profiles
   │
   ├── habits
   │      │
   │      └── habit_logs
   │
   ├── streaks / derived statistics
   │
   ├── recovery_tokens
   │
   ├── evidence
   │
   ├── ai_interactions
   │
   └── notifications
```

More concretely:

### `profiles`

```text
id
name
email
telegram_chat_id
created_at
```

### `habits`

```text
id
user_id
name
description
category
target_value
target_unit
frequency
reminder_time
is_active
created_at
```

Examples:

```text
Reading → 10 pages
Walking → 5000 steps
Water → 2 litres
Study → 60 minutes
```

---

### `habit_logs`

```text
id
habit_id
user_id
date
actual_value
status
source
confidence
created_at
```

`source`:

```text
manual
telegram
ai
iot
reader
```

`status`:

```text
completed
partial
missed
skipped
pending
```

---

### `evidence`

```text
id
habit_log_id
type
source
file_url
confidence
metadata
created_at
```

Example:

```text
type = image
source = AI
confidence = 0.87
```

---

### `recovery_tokens`

```text
id
user_id
week_start
available
used_at
```

This directly implements:

> **1 skip per week**

---

# 9. Evidence system

This is one of our signature features.

Every completion can display:

```text
✅ Completed
Evidence: Self-reported
```

or:

```text
✅ Completed
Evidence: AI
Confidence: 89%
```

or later:

```text
✅ Completed
Evidence: IoT
```

So your dashboard can show:

```text
TODAY

📖 Reading       ✅ AI verified
🚶 Walking       ✅ IoT verified
💧 Water         ✅ Self reported
📚 Study         ✅ Reader verified
```

This is much more interesting than a simple checkbox.

---

# 10. Reading feature

This should become our **hero AI feature**.

## Mode A — Built-in reader

User uploads:

```text
PDF / book
```

Then:

```text
Open book
     ↓
Read
     ↓
Pages tracked
     ↓
Reading session recorded
     ↓
Habit automatically updated
```

So the user doesn't have to manually write:

> "I read 10 pages."

The application knows:

```text
Session:
Pages 41 → 53
Duration: 27 min
```

Then:

### AI Recall

Ask one lightweight question:

> What was the main idea from what you just read?

AI checks whether the answer is meaningfully related to the section.

Then:

```text
📖 Reading
12 pages
27 minutes
Recall ✓

Habit completed
```

Important: the recall check should be **supporting evidence**, not claimed as proof that someone read every word.

---

# 11. Habit Score

PS asks for a score out of 100.

We'll make it explainable.

Example:

```text
CONSISTENCY SCORE

Completion         40%
Weekly consistency 25%
Streak stability   20%
Recovery handling  15%
```

Display:

```text
                 87
          CONSISTENCY SCORE

███████████████████░░
```

Don't make the score a black box.

---

# 12. Recovery system

This is important because the PS specifically says:

> “Be kind.”

When user misses:

```text
⚠️ Reading missed

Your streak doesn't need to collapse.

🛟 Recovery token available

[Use Recovery]
[Do 5 pages now]
[Skip]
```

This creates a meaningful recovery mechanism.

---

# 13. Intelligent streak

Don't simply store:

```text
streak = 8
```

Calculate it from logs.

Concept:

```text
completed → continue
recovery  → continue
missed    → reset
```

Weekly recovery token:

```text
1 available
```

This avoids streak inconsistencies.

---

# 14. 7-day dashboard

This directly satisfies the PS.

Example:

```text
                 LAST 7 DAYS

Reading     ✅ ✅ ✅ 🛟 ✅ ✅ ✅
Walking     ✅ ✅ ❌ ✅ ✅ ✅ ✅
Study       ✅ ❌ ✅ ✅ ❌ ✅ ✅
Water       ✅ ✅ ✅ ✅ ✅ ✅ ❌
```

And below:

```text
Current streak: 7
Best streak: 19
Consistency: 91
```

---

# 15. Habit dashboard

Home screen:

```text
Good morning, Aditya 👋

Consistency
      91
      ↑ 4%

TODAY

📖 Reading
10 / 10 pages       ✅

🚶 Walking
4,321 / 5,000       86%

📚 Study
58 / 60 min         97%

💧 Water
1.8 / 2 L           90%
```

Then:

```text
🔥 Current streak: 9 days
🛟 Recovery token: 1
```

---

# 16. AI Coach

Add a floating:

### `✨ AI Coach`

Questions:

> Why am I missing reading?

> Which habit is weakest?

> What should I change?

> Show me my week.

> Why did my score drop?

AI receives the user's actual data and responds from that data.

Not a generic ChatGPT wrapper.

---

# 17. Habit Pattern Engine

This is where we can make the project feel intelligent.

Example:

```text
Reading
Morning: 88%
Afternoon: 72%
Night:   41%
```

Then:

> Your reading completion is significantly higher in the morning.

Another:

```text
Walking completed
→ 82% of days
where
Sleep ≥ 7h
```

We can begin with **simple statistical correlations**, not machine learning.

That is faster and easier to explain.

---

# 18. Habit chains

Add an optional concept:

```text
Wake Up
    ↓
Water
    ↓
Walk
    ↓
Read
    ↓
Study
```

Call it:

## **Routine**

A Routine is simply a collection of habits.

Example:

### Morning Routine

```text
☑ Wake up
☑ Drink water
☑ Walk 20 min
☑ Read 10 pages
```

Routine completion gets a visual summary.

---

# 19. Notifications

Reminder engine should support:

```text
Scheduled reminder
     ↓
Telegram
     ↓
Buttons
```

User can choose:

```text
✅ Done
⏰ Later
🛟 Recover
```

Store reminder state to avoid duplicate notifications.

---

# 20. IoT — LAST PHASE ONLY

This is exactly where I agree with you.

Do **NOT** design the whole application around IoT.

Your available hardware:

### 16×2 LCD with I2C

### Buzzer

### Button

That's actually enough for a very nice physical companion.

---

# 21. LCD concept

The LCD doesn't need to measure anything.

It becomes:

# **Physical Habit Status Display**

Example:

```text
+----------------+
| TODAY: 3 PEND  |
| READ   10 PG   |
+----------------+
```

Another:

```text
+----------------+
| !! REMINDER !! |
| WALK  5000     |
+----------------+
```

After completion:

```text
+----------------+
| WALK COMPLETE! |
| STREAK: 8 🔥   |
+----------------+
```

This is much simpler than trying to invent a sensor-based habit system.

---

# 22. Button

One button can cycle:

```text
[Next Habit]
```

Or:

```text
short press → next task
long press  → acknowledge alert
```

Later we can add a second button if you have one.

---

# 23. Buzzer

Use it only for:

```text
Habit due
Missed reminder
Completion
Recovery warning
```

Example:

```text
08:00
    ↓
Telegram reminder
    +
LCD
    +
Buzzer
```

Now the physical device is a tiny **ambient habit companion**.

---

# 24. ESP32 architecture

When we get there:

```text
             SUPABASE
                 │
              HTTPS
                 │
              ESP32
                 │
       ┌─────────┼─────────┐
       ↓         ↓         ↓
      LCD      Buzzer     Button
```

ESP32 only needs:

```text
GET pending tasks
GET next reminder
POST acknowledge/completion
```

That's it.

No complicated sensor processing.

---

# 25. One clever IoT feature

Make the LCD display **the weakest habit**.

Example:

```text
+----------------+
| FOCUS HABIT    |
| READING        |
| 2 DAYS MISSED  |
+----------------+
```

At another time:

```text
+----------------+
| NEXT: WALK     |
| 5,000 STEPS    |
| 8:00 AM        |
+----------------+
```

The device becomes an **ambient reminder**, not another dashboard.

---

# 26. Final feature set

## 🔴 MUST BUILD

These are non-negotiable:

```text
✅ Create habit
✅ Edit habit
✅ Delete habit
✅ Daily target
✅ Daily logging
✅ Target completion
✅ Streak
✅ 1 skip/week
✅ Last 7 days
✅ Score /100
✅ Dashboard
✅ Supabase persistence
```

## 🟠 HIGH-VALUE

```text
✅ Telegram bot
✅ Telegram reminders
✅ Telegram buttons
✅ Natural language logging
✅ AI habit interpretation
✅ AI weekly coach
✅ Recovery system
✅ Explainable score
```

## 🟡 HERO FEATURES

```text
✅ Evidence system
✅ Reading mode
✅ Automatic reading progress
✅ AI recall
✅ Habit patterns
✅ Routine chains
```

## 🟢 FINAL POLISH

```text
✅ 16×2 LCD
✅ ESP32
✅ Buzzer
✅ Button
✅ Ambient pending-task display
```

## 🔵 OPTIONAL ONLY IF TIME REMAINS

```text
Advanced authentication
Multiple IoT devices
More sensors
Social sharing
Achievements
Leaderboards
Voice assistant
Wearable integration
Complex ML
```

Do **not** touch these until everything above is stable.

---

# 27. Development order

This is the part I would give Antigravity.

```text
PHASE 0
Project initialization
        ↓
PHASE 1
Supabase connection
        ↓
PHASE 2
Database schema
        ↓
PHASE 3
Basic Next.js dashboard
        ↓
PHASE 4
Habit CRUD
        ↓
PHASE 5
Daily logging + streak engine
        ↓
PHASE 6
7-day UI + score
        ↓
PHASE 7
Telegram bot
        ↓
PHASE 8
Telegram reminders/buttons
        ↓
PHASE 9
OpenAI natural-language logging
        ↓
PHASE 10
AI coach
        ↓
PHASE 11
Evidence engine
        ↓
PHASE 12
Reading mode
        ↓
PHASE 13
Habit analytics/patterns
        ↓
PHASE 14
Routines
        ↓
PHASE 15
ESP32 + LCD
        ↓
PHASE 16
Buzzer + button
        ↓
PHASE 17
Failure testing / Chaos Lab
        ↓
PHASE 18
Final UI + demo
```

---

# 28. Very important: build a vertical slice early

Don't spend 3 hours creating beautiful UI before testing the backend.

We need this working as early as possible:

```text
Create habit
     ↓
Save to Supabase
     ↓
Log completion
     ↓
Calculate streak
     ↓
Display dashboard
```

Then immediately test:

```text
Telegram
     ↓
"I walked 6000 steps"
     ↓
OpenAI
     ↓
Structured action
     ↓
Supabase
     ↓
Dashboard updates
```

That gives us a working product very early.

---

# 29. The architecture I would freeze

```text
                      ┌───────────────┐
                      │   TELEGRAM    │
                      │ Bot + Buttons │
                      └───────┬───────┘
                              │
                              │ Webhook
                              ↓
┌─────────────────────────────────────────────────────┐
│                    NEXT.JS                          │
│                                                     │
│  Dashboard     API Routes     Telegram Webhook      │
│     │              │                 │              │
│     └──────────────┼─────────────────┘              │
│                    │                                │
│             Habit Service                           │
│                    │                                │
│       ┌────────────┴─────────────┐                  │
│       ↓                          ↓                  │
│  OpenAI Service            Supabase Service         │
└────────────┬───────────────────────┬────────────────┘
             │                       │
             ↓                       ↓
      ┌──────────────┐       ┌────────────────┐
      │  OpenAI API  │       │    SUPABASE    │
      │ Text + Vision│       │ Postgres/Auth  │
      └──────────────┘       │ Storage        │
                             │ Realtime       │
                             └───────┬────────┘
                                     │
                                     ↓
                               ┌───────────┐
                               │   ESP32   │
                               │ LCD/Buzzer│
                               │  Button   │
                               └───────────┘
```

This is the architecture I recommend **freezing unless we encounter a concrete technical reason to change it**.

---

# 30. `.env` design

Antigravity should create:

```env
DATABASE_URL=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...

SUPABASE_SERVICE_ROLE_KEY=...

OPENAI_API_KEY=...

TELEGRAM_BOT_TOKEN=...
TELEGRAM_WEBHOOK_SECRET=...

APP_URL=http://localhost:3000
```

The important distinction:

### Safe for browser

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

### Server-only

```text
DATABASE_URL
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_WEBHOOK_SECRET
```

Never expose the server-side secrets through `NEXT_PUBLIC_*`.

Supabase's current documentation explicitly recommends server-side handling of privileged credentials and environment-based secrets. ([Supabase][5])

---

# 31. Chaos Engineering angle

Because this is a **Chaos Engineering** hackathon, I don't want us to forget the hackathon theme.

After the product works, add:

# **Chaos Lab**

A small developer/admin panel:

```text
SYSTEM RESILIENCE

[ Kill OpenAI ]
[ Delay Telegram ]
[ Block IoT ]
[ Simulate DB failure ]
[ Duplicate webhook ]
```

Then demonstrate:

### OpenAI dies

```text
AI unavailable
      ↓
Manual logging still works
```

### Telegram dies

```text
Telegram unavailable
      ↓
Website still works
```

### IoT dies

```text
ESP32 offline
      ↓
Dashboard still works
      ↓
Device syncs later
```

### Duplicate Telegram webhook

Use an idempotency key so:

```text
same event
   ↓
processed once
```

This is where the **Chaos Engineering** theme becomes a real technical feature instead of just the hackathon title.

Telegram webhooks can include a secret token, and Telegram retries webhook delivery after unsuccessful responses, so our webhook should be designed to validate the secret and safely handle duplicate delivery. ([Telegram][4])

Supabase also supports Realtime and server-side Edge Functions, giving us options for live updates and small server-side integrations later. ([Supabase][6])

---

# 32. What the final demo should look like

This is the story I'd rehearse:

### Step 1

Create:

> 📖 Reading — 10 pages

### Step 2

Open Telegram.

> “I read 12 pages today.”

Bot:

> ✅ Reading complete
> 12/10 pages
> 🔥 Streak: 4 days

### Step 3

Open dashboard.

You see:

```text
Reading       ✅
Walking       ⏳
Study         ✅

Consistency: 89
```

### Step 4

User misses walking.

Bot:

> You missed Walking.
>
> 🛟 One recovery token is available.

### Step 5

Read a book inside the application.

System automatically records:

```text
12 pages
27 minutes
```

Then AI asks a quick recall question.

### Step 6

AI Coach:

> “Why is my score decreasing?”

AI explains from actual logs.

### Step 7

Finally:

**ESP32 LCD**

```text
NEXT HABIT
WALKING

5000 STEPS
8:00 PM
```

Buzzer sounds.

Button pressed.

LCD:

```text
TASK ACKNOWLEDGED
```

### Step 8 — Chaos demo

Kill OpenAI.

Try:

> “I walked 5,500 steps.”

AI fails.

System gracefully falls back to:

> Enter value manually.

**That last part is especially useful for the Chaos Engineering theme.**

---

# 33. The single most important rule for Antigravity

Tell it:

> **Do not build every feature at once. Maintain a working application after every phase.**

And after every phase:

```text
Implement
   ↓
Run tests
   ↓
Run build
   ↓
Verify database
   ↓
Verify UI
   ↓
Commit
   ↓
Next phase
```

That will save you from ending up with 70% of 15 features and nothing reliably demoable.

---

## My final recommendation

The stack is now:

**Next.js + TypeScript + Tailwind + shadcn/ui + Supabase + OpenAI + grammY + Recharts + ESP32/LCD/Buzzer/Button**

No FastAPI.

No separate backend.

No Redis initially.

No vector database initially.

No LangChain initially.

No complex ML initially.

No microservices initially.

For a hackathon, this keeps the number of moving pieces low while still giving us enough room for AI, Telegram, realtime data and the final physical device. Supabase's current platform also gives us a path to Edge Functions and scheduled/server-side integrations later without introducing another backend platform. ([Supabase][7])

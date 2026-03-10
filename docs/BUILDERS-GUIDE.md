# TaskFlow Builder's Guide

A permanent reference for continuing to build TaskFlow. Written for a non-developer on Windows using Claude Code at [claude.ai/code](https://claude.ai/code).

---

## Table of Contents

1. [The Process](#1-the-process)
2. [The Review Loop](#2-the-review-loop)
3. [Recipe Book — Claude Prompts for Common Tasks](#3-recipe-book--claude-prompts-for-common-tasks)
4. [Security Checklist](#4-security-checklist)
5. [Troubleshooting](#5-troubleshooting)
6. [Glossary](#6-glossary)

---

## 1. The Process

Every new feature follows these ten steps, in order. Do not skip steps. Do not reorder them.

### Step-by-Step

#### a. Update APPLICATION-PLAN.md

Open Claude Code and tell it:

> "I want to add [feature name]. Update APPLICATION-PLAN.md with a new section describing this feature — include what pages are involved, what data is stored, and how the user interacts with it."

This is the single source of truth for what the app does. Every feature starts here.

#### b. Review the plan

Ask Claude:

> "Review APPLICATION-PLAN.md. What's missing or inconsistent? Check that every page, data field, and user flow is accounted for. Fix everything you find."

Do not move on until Claude says the plan is clean.

#### c. Update QA-CHECKLIST.md

Tell Claude:

> "Add test cases to QA-CHECKLIST.md for the [feature name] feature. Include happy-path tests, edge cases, error states, and accessibility checks."

This is your testing script. You will run through it later to confirm the feature works.

#### d. Update IMPLEMENTATION-PLAN.md

Tell Claude:

> "Add build steps to IMPLEMENTATION-PLAN.md for the [feature name] feature. Break it into numbered steps — database changes first, then API routes, then UI. Include which files to create or edit."

This is the build recipe Claude will follow.

#### e. Review the implementation plan

Ask Claude:

> "Audit IMPLEMENTATION-PLAN.md against APPLICATION-PLAN.md. Confirm every requirement has a build step. Confirm the order makes sense. Flag anything that could break existing features."

#### f. Build the feature

Tell Claude:

> "Build the [feature name] feature following IMPLEMENTATION-PLAN.md. Work through each step in order. Commit after each logical chunk of work."

Claude will write the code, create files, and commit to Git.

#### g. Review what was built

Ask Claude:

> "Compare the [feature name] implementation against APPLICATION-PLAN.md and IMPLEMENTATION-PLAN.md. Find anything missing, wrong, or incomplete. Fix everything."

#### h. Run the QA checklist

Tell Claude:

> "Run through every test case in QA-CHECKLIST.md for the [feature name] feature. Report pass or fail for each item. Fix any failures."

You should also open the app yourself and click through the feature manually.

#### i. Security review

Ask Claude:

> "Do a security review of the [feature name] feature. Check against SECURITY-AUDIT.md and the security checklist in this guide. Fix any issues."

#### j. Create PR and merge

Tell Claude:

> "Create a pull request for this feature with a clear title and description."

Then review the PR yourself before merging.

---

## 2. The Review Loop

**This is the most important habit in the entire process.**

After every single step above — not just at the end — ask Claude to review:

> "Compare what we just did against the plan. Find errors, missing pieces, things that could break. Fix everything."

Then ask again:

> "Review again. Anything else?"

**Repeat until Claude says it's clean.** This loop catches mistakes early when they are cheap to fix, instead of late when they are expensive.

### Why this matters

- A bug caught during planning costs nothing to fix.
- A bug caught during coding costs minutes.
- A bug caught after the PR is merged costs hours.
- A bug caught by a user costs trust.

### Rules for the review loop

1. Never skip a review because you're in a hurry.
2. Never accept a review that says "looks good" without specifics. Ask: "What specifically did you check?"
3. If Claude finds problems, fix them and then review again from scratch.
4. Keep going until you get a clean pass with zero issues.

---

## 3. Recipe Book — Claude Prompts for Common Tasks

Copy-paste these prompts into Claude Code. Replace the bracketed parts with your actual values.

### Add a New Page

```
Add a new page at /[page-path]. It should:
- [describe what the page shows]
- [describe what actions the user can take]
Follow the existing patterns in src/app/(authenticated)/ for layout,
loading states, and error handling. Use our existing UI components
from src/components/ui/.
```

### Add a New API Route

```
Create an API route at /api/[route-path]. It should:
- Accept [GET/POST/PUT/DELETE] requests
- [describe what it does]
- Validate input with Zod
- Require authentication (check session)
- Scope all database queries to the logged-in user's ID
- Return proper HTTP status codes
- Handle errors gracefully
Follow the patterns in our existing API routes.
```

### Add a New Database Field

```
I need to add a [field-name] field to the [Model] table in Prisma.
- Type: [String/Int/Boolean/DateTime/etc.]
- Required or optional: [required/optional]
- Default value: [value or none]
Update schema.prisma, create a migration, and update any API routes
and UI components that read or write this model.
```

**Important:** The CLAUDE.md rules say never modify schema.prisma without your explicit permission — Claude will ask you to confirm before touching it.

### Add a Form

```
Create a form for [purpose]. Fields:
- [field 1]: [type, required/optional, validation rules]
- [field 2]: [type, required/optional, validation rules]
Use Zod for validation. Show inline error messages. Disable the submit
button while submitting. Show a success toast on completion.
Follow our existing form patterns.
```

### Fix a Bug

```
There's a bug: [describe what happens].
Expected behavior: [describe what should happen].
Steps to reproduce: [describe how to trigger the bug].
Find the root cause, fix it, and make sure the fix doesn't break
anything else.
```

### Add Drag-and-Drop

```
Add drag-and-drop to [component/page] using @dnd-kit (already
installed). Items should be [sortable within a list / draggable
between columns]. Persist the new order to the database. Follow
the Kanban board pattern in the existing task board.
```

### Run the Full QA Checklist

```
Open QA-CHECKLIST.md and run through every test case for [section].
For each item, report PASS or FAIL. For any FAIL, explain what's
wrong and fix it. Then re-run the failed tests to confirm the fix.
```

### Check Build Health

```
Run the TypeScript compiler and ESLint. Report any errors or
warnings. Fix all of them.
```

### Create a Pull Request

```
Create a pull request for the current branch. Title should describe
the feature. Include a summary of changes, what was tested, and any
known limitations.
```

---

## 4. Security Checklist

Run through this checklist for **every** new feature before creating a PR.

### Authentication & Sessions

- [ ] Does the feature require the user to be logged in? If yes, does every API route check for a valid session?
- [ ] Are sessions validated on every request (not just on page load)?
- [ ] Can a logged-out user access any part of this feature? They shouldn't be able to.

### Authorization & Data Isolation

- [ ] Is every database query scoped to the current user's ID?
- [ ] Can User A see or modify User B's data through this feature? Test this.
- [ ] If the feature uses URL parameters (like `/projects/123`), does it verify the logged-in user owns that record?

### Input Validation

- [ ] Is every user input validated on the server side with Zod?
- [ ] Are string inputs trimmed and length-limited?
- [ ] Are numeric inputs checked for reasonable ranges?
- [ ] Can a user submit unexpected values (negative numbers, extremely long strings, special characters)?

### Injection Prevention

- [ ] Does the feature use Prisma for all database queries (no raw SQL)?
- [ ] Are user inputs ever rendered as raw HTML? They should always be escaped (React does this by default — but check for `dangerouslySetInnerHTML`).
- [ ] Are file names or paths ever constructed from user input? They should be sanitized.

### Rate Limiting

- [ ] Could this feature be abused by rapid repeated requests (signup, login, password reset, email sends)?
- [ ] If yes, is rate limiting in place?

### Sensitive Data

- [ ] Does the feature handle passwords, tokens, or secrets? Are they hashed or encrypted — never stored in plain text?
- [ ] Are API responses free of sensitive data that the client doesn't need?
- [ ] Are error messages generic enough to avoid leaking internal details?

### Prompt for Claude

After going through the checklist yourself, ask Claude:

> "Run a security review on the [feature name] feature. Check for: missing auth checks, data isolation violations, input validation gaps, injection risks, rate limiting needs, and sensitive data exposure. Reference SECURITY-AUDIT.md for our standards."

---

## 5. Troubleshooting

### "The build is failing"

**What to do:**

> "Run `npm run build` and show me the errors. Fix all of them."

Common causes:
- **TypeScript errors** — a variable is the wrong type, or a required property is missing. Claude can usually fix these automatically.
- **Import errors** — a file is importing something that doesn't exist or was renamed. Check that the file path and export name are correct.
- **Missing environment variables** — the app needs a `.env` file with database URLs and API keys. Check `.env.example` if one exists.

### "The database migration failed"

**What to do:**

> "Run `npx prisma migrate dev` and show me the output. If it fails, explain why and fix it."

Common causes:
- **Schema conflict** — the migration is trying to create something that already exists. You may need to reset the database with `npx prisma migrate reset` (this deletes all data — only do this in development).
- **Missing required field** — you added a required field to a table that already has rows. Either make the field optional or provide a default value.

### "The page shows a blank screen or an error"

**What to do:**

> "Check the browser console and the server terminal for error messages. Show me what you find and fix it."

Common causes:
- **Unhandled null values** — the code tries to read a property of something that's `undefined`. Add null checks.
- **Missing API route** — the page is calling an API endpoint that doesn't exist yet. Create it.
- **Database connection** — the app can't reach the database. Check that `DATABASE_URL` in `.env` is correct and the database is running.

### "Git says there are merge conflicts"

**What to do:**

> "Show me the merge conflicts. Resolve them by keeping the correct version of each conflicting section. Explain what you chose and why."

A merge conflict happens when two people (or two branches) changed the same lines of code. Claude can resolve most conflicts, but review its choices to make sure the right code was kept.

### "The feature works locally but not on Netlify"

**What to do:**

> "Check the Netlify build logs. Compare our local environment to the Netlify environment. What's different?"

Common causes:
- **Environment variables** — you set them locally in `.env` but didn't add them to Netlify's environment settings.
- **Database access** — the Netlify deployment might not be able to reach the database if the IP isn't allowed.
- **Build-time vs. runtime** — some code runs at build time on Netlify. If it needs the database at build time, the connection must be available during the Netlify build.

### "Claude seems stuck or confused"

**What to do:**

Start a new conversation with a clear, specific prompt. Give context:

> "I'm working on TaskFlow, a Next.js project management app. The codebase uses App Router, Prisma with PostgreSQL, and Tailwind CSS. I need help with [specific problem]. Here's the relevant file: [paste file contents or path]."

If Claude produces incorrect code, don't keep asking it to fix the fix. Go back to the plan:

> "Read IMPLEMENTATION-PLAN.md and APPLICATION-PLAN.md. Based on those specs, rebuild [specific piece] from scratch."

### "I don't know what to work on next"

**What to do:**

> "Read IMPLEMENTATION-PLAN.md and tell me: what's the next unfinished item? What are its dependencies? What should I build first?"

---

## 6. Glossary

Every technical term used in this project, explained in plain language.

| Term | What It Means |
|------|---------------|
| **API** | Application Programming Interface. The behind-the-scenes communication layer between the website (what you see) and the server (where data lives). When you click "Save," the page sends a message to an API route, which saves your data to the database. |
| **API Route** | A specific URL on the server that handles one type of request. For example, `/api/projects` handles creating and listing projects. |
| **App Router** | The way Next.js organizes pages. Each folder inside `src/app/` becomes a URL path. The folder `src/app/(authenticated)/projects/` becomes the `/projects` page. |
| **Authentication (Auth)** | Verifying who a user is. When you log in with your email and password, that's authentication. |
| **Authorization** | Verifying what a user is allowed to do. Even after logging in, you should only see your own data — not other users' data. |
| **bcrypt** | A tool for securely scrambling passwords before storing them. Nobody — not even the database admin — can read the original password. |
| **Branch (Git)** | A separate copy of the code where you make changes without affecting the main version. Like drafting an email before sending it. |
| **Build** | The process of converting the source code into the final version that runs on the server. Like compiling a manuscript into a printed book. |
| **Client (in the app)** | A customer or company you do freelance work for. TaskFlow lets you track projects and invoices per client. |
| **Commit (Git)** | A saved snapshot of your changes, with a description of what you changed. Like hitting "Save" with a note. |
| **Component** | A reusable piece of the user interface. A button, a form, a sidebar — each is a component. |
| **CRUD** | Create, Read, Update, Delete — the four basic operations you can do with data. |
| **CSS** | Cascading Style Sheets. The code that controls how things look — colors, fonts, spacing, layout. |
| **Database** | Where all the app's data is permanently stored. Think of it as a collection of spreadsheets, where each table is a sheet and each row is a record. |
| **Deployment** | Putting the app on the internet so people can use it. TaskFlow deploys to Netlify. |
| **Edge Case** | An unusual situation that's easy to overlook. Like: what happens if someone enters a project name that's 10,000 characters long? |
| **Endpoint** | Another word for API Route — a specific URL the app talks to. |
| **Environment Variable** | A secret setting stored outside the code, like the database password. Kept in a file called `.env` that is never uploaded to GitHub. |
| **ESLint** | A tool that automatically checks your code for common mistakes and style violations. Like spell-check for code. |
| **Git** | A system that tracks every change made to the code, who made it, and when. Lets you undo mistakes and collaborate safely. |
| **GitHub** | A website that hosts Git repositories (code projects). Where TaskFlow's code lives online. |
| **HTTP Status Code** | A number the server sends back to indicate what happened. 200 = success, 400 = you sent bad data, 401 = not logged in, 404 = not found, 500 = something broke on the server. |
| **IDOR** | Insecure Direct Object Reference. A security bug where changing a number in the URL (like `/invoices/5` to `/invoices/6`) lets you see someone else's data. |
| **Kanban** | A visual system for tracking work. Tasks are shown as cards in columns like "To Do," "In Progress," and "Done." You drag cards between columns. |
| **Merge** | Combining changes from one branch back into the main code. Like incorporating your draft edits into the final document. |
| **Middleware** | Code that runs before a page loads. TaskFlow uses middleware to check if you're logged in and redirect you if you're not. |
| **Migration** | A script that changes the database structure (adds a table, renames a column, etc.). Like remodeling a room in a house. |
| **Model** | A definition of a data type. The `Project` model defines what fields a project has (name, status, budget, etc.). |
| **MVP** | Minimum Viable Product. The smallest version of the app that's useful. Build this first, add extras later. |
| **Netlify** | The hosting service that runs TaskFlow on the internet. |
| **Next.js** | The web framework TaskFlow is built with. It handles routing, page rendering, and server-side logic. |
| **ORM** | Object-Relational Mapping. A tool (Prisma, in our case) that lets you talk to the database using code instead of writing raw database queries. |
| **PostgreSQL** | The type of database TaskFlow uses. A powerful, reliable database system. |
| **PR (Pull Request)** | A request to merge your branch into the main code. Other people review the changes before they go live. |
| **Prisma** | The ORM (database tool) TaskFlow uses. You define your data models in `schema.prisma`, and Prisma generates the code to read and write that data. |
| **Rate Limiting** | Restricting how many requests a user can make in a time period. Prevents abuse — like someone trying thousands of passwords per minute. |
| **React** | The library that powers the user interface. It lets you build pages out of reusable components. |
| **Repository (Repo)** | The folder that contains all of a project's code, tracked by Git. |
| **Schema** | The blueprint for the database. Defines what tables exist, what columns each table has, and how tables relate to each other. |
| **Server-Side Rendering (SSR)** | The server builds the full HTML page before sending it to your browser. Makes pages load faster and work better with search engines. |
| **Session** | A record that you're currently logged in. When you log in, the server creates a session and gives your browser a cookie. Every time you visit a page, the browser sends that cookie so the server knows it's you. |
| **Tailwind CSS** | A system for styling the app. Instead of writing CSS files, you add style classes directly to HTML elements: `className="text-blue-500 font-bold"`. |
| **Toast** | A small notification that pops up briefly — like "Project saved successfully" — then disappears. |
| **Token** | A unique, hard-to-guess string used for one-time actions like password resets or email verification. |
| **TypeScript** | A version of JavaScript that requires you to declare what type of data each variable holds (string, number, etc.). Catches bugs before they reach users. |
| **UI** | User Interface. Everything the user sees and interacts with — buttons, forms, pages, menus. |
| **Validation** | Checking that data is correct before accepting it. "Is this email address actually formatted like an email?" |
| **Zod** | The validation library TaskFlow uses. You define rules for what data should look like, and Zod rejects anything that doesn't match. |

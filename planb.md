Create **`AeroInsight/textbook.md`**.

You already have access to the complete **AeroInsight project folder**. Before writing anything, inspect the **entire repository thoroughly**.

This document will be my **single primary study textbook for preparing for technical interviews based on the AeroInsight project**.

## 🚨 MOST IMPORTANT REQUIREMENT

**EVERYTHING in this textbook must be explained with direct reference to the actual AeroInsight project.**

Do **NOT** write generic technology documentation.

Do **NOT** explain technologies as standalone subjects and then loosely mention AeroInsight afterward.

Instead, use this rule throughout the entire textbook:

> **PROJECT FIRST → CONCEPT SECOND → CODE THIRD → FLOW FOURTH → INTERVIEW FIFTH**

Whenever you explain a concept, immediately connect it to **where and how that concept exists in AeroInsight**.

For example, do NOT write:

> "React is a JavaScript library used for building user interfaces."

Instead write something like:

> "AeroInsight uses React for its frontend. Before understanding the React code in `src/...`, you need to understand what a frontend component is. A component is simply a reusable piece of UI. In AeroInsight, the `X` component is responsible for `Y`. When the user does `Z`, this component calls `A`, which eventually triggers `B`..."

The **actual repository must drive the explanation**.

---

# 1. Repository Investigation Comes First

Before creating `textbook.md`:

1. Inspect every folder.
2. Inspect every meaningful source file.
3. Inspect configuration files.
4. Inspect `package.json` and dependency files.
5. Inspect database/schema/migration files.
6. Inspect frontend code.
7. Inspect backend code.
8. Inspect API routes.
9. Inspect services/utilities.
10. Inspect authentication/security implementation.
11. Inspect AI/ML/agent implementation.
12. Inspect external API integrations.
13. Inspect deployment configuration.
14. Inspect CI/CD configuration.
15. Inspect documentation already present.
16. Trace important application flows through the actual code.

Build a mental map of the entire project before writing.

**Never assume how something works when the source code can tell you.**

---

# 2. Absolute Rule for Every Explanation

For **every single technical concept**, answer these questions:

### A. What does this mean?

Explain it from absolute zero.

### B. Why does this concept matter to AeroInsight?

Explain the specific problem it solves in this project.

### C. Where does it exist in AeroInsight?

Give the exact:

* File path
* Folder
* Function
* Class
* Component
* Route
* Schema
* Configuration
* Dependency

where relevant.

### D. What happens in AeroInsight?

Trace the actual execution.

### E. Why was it implemented this way?

Explain the design decision if it can be determined from the project.

### F. What would happen without it?

Explain the consequence.

### G. What happens if it breaks?

Explain how the application would behave.

### H. What should I know for the interview?

Give the project-specific interview angle.

---

# 3. Zero Generic Theory

This is extremely important.

**Do not create standalone generic chapters like:**

> "What is React?"

> "What is Node.js?"

> "What is SQL?"

unless the explanation is immediately tied to AeroInsight.

Instead structure it as:

> **AeroInsight uses React here → to understand this code, you need this React concept → here's the concept → here's the exact AeroInsight implementation → here's what happens at runtime.**

The theory exists **only because AeroInsight requires me to understand it**.

If a technology is used in only one small part of the project, explain only the concepts necessary to understand that implementation.

If a technology is not actually used, **do not teach it just because it is commonly associated with the stack.**

---

# 4. Start the Textbook With the Project

## Chapter 0: What Exactly Is AeroInsight?

Explain AeroInsight as if I have never seen the project.

Start with:

* What problem does it solve?
* What does the user do?
* What does the system do?
* What happens behind the scenes?
* What technologies participate?
* What data moves through the system?
* What are the major components?

Then build an architecture diagram based **only on the actual repository**.

Example structure:

```text
User
 ↓
Actual AeroInsight UI
 ↓
Actual frontend logic
 ↓
Actual API/request
 ↓
Actual backend route
 ↓
Actual business logic
 ↓
Actual database / AI / external API
 ↓
Actual response
 ↓
Actual UI update
```

Every box must correspond to something that actually exists in the project.

---

# 5. Build a Complete Project Map

Create a chapter called:

# AeroInsight Project Map

Create a table like:

| Layer | Actual Technology | Actual Files | Responsibility | How It Connects |
| ----- | ----------------- | ------------ | -------------- | --------------- |

Populate this using the repository.

For example:

```text
Frontend
 ├── Technology: [actual technology]
 ├── Entry point: [actual file]
 ├── Pages: [actual files]
 ├── Components: [actual files]
 └── API communication: [actual files]

Backend
 ├── Technology: [actual technology]
 ├── Entry point: [actual file]
 ├── Routes: [actual files]
 ├── Controllers: [actual files]
 └── Services: [actual files]

Database
 ├── Technology: [actual database]
 ├── Schema: [actual file]
 └── Access layer: [actual files]

AI
 ├── Model/provider: [actual technology]
 ├── Agent: [actual files]
 ├── Tools: [actual files]
 └── Prompt/configuration: [actual files]
```

Do not use placeholders in the final document. Replace everything with actual project information.

---

# 6. Every Technology Must Be Taught Through AeroInsight

Create sections for every important technology actually used.

For each one:

## [Technology Name]

### 1. Why AeroInsight uses it

Explain the exact reason.

### 2. What problem does it solve in AeroInsight?

Not the generic problem. **The AeroInsight problem.**

### 3. What would happen if AeroInsight didn't use it?

Explain concretely.

### 4. Minimum theory required to understand the implementation

Teach only the fundamentals needed.

### 5. Exact implementation in AeroInsight

List the relevant files.

### 6. File-by-file explanation

Explain how the technology appears in those files.

### 7. Runtime flow

Show:

```text
User action
↓
File A
↓
Function B
↓
File C
↓
API / database / service
↓
Response
↓
File D
↓
UI
```

### 8. Important code

Show only the important code snippets from the actual project.

For every snippet:

* Explain what it does.
* Explain why it exists.
* Explain important lines.
* Explain what calls it.
* Explain what it calls.

### 9. Common mistakes

Explain mistakes that could happen **in this implementation**.

### 10. Interview questions

Ask questions specifically about how AeroInsight uses this technology.

---

# 7. Explain Every File

Create a major chapter:

# Complete AeroInsight File-by-File Explanation

This chapter must explain **every meaningful file in the repository**.

For every file use:

## `actual/path/to/file`

### What is this file?

Explain from zero.

### Why does AeroInsight need it?

Specific project context.

### What is inside it?

Explain the important contents.

### Important functions/classes/components

For each:

* What it does
* Why it exists
* Who calls it
* What it calls

### Dependencies

Which other AeroInsight files does it depend on?

### Used by

Which other files use it?

### Execution flow

Where does this file fit into the larger system?

### Interview relevance

What could an interviewer ask about this file?

### If I deleted this file...

Explain what would break.

---

## Important distinction

Do NOT waste hundreds of lines explaining generated dependency files line-by-line.

Instead classify files as:

### 🔴 Must Understand

Files containing important application logic.

### 🟡 Should Understand

Configuration/supporting files.

### 🟢 Generated / Dependency

Files I generally don't need to study line-by-line.

Even for 🟢 files, explain **what they are and why they exist in the project**.

---

# 8. Explain the Actual Codebase Like a Story

I need to understand **how the project executes**, not just what files exist.

Create:

# How AeroInsight Actually Runs

Start from application startup.

Explain:

```text
Application starts
↓
Actual entry file
↓
Initialization
↓
Configuration
↓
Database connection
↓
Server / frontend initialization
↓
Routes/components loaded
↓
User interacts
↓
Actual function executes
↓
Actual API/database/AI operation
↓
Response
↓
UI update
```

Use actual filenames and functions at every stage.

---

# 9. Explain Every Major User Flow

Identify the important user actions from the actual application.

For each one create:

# Flow: [Actual Feature]

Explain:

### Step 1: User does X

Which UI component handles it?

### Step 2: Frontend processes it

Which file/function?

### Step 3: Request is created

What endpoint?

What HTTP method?

What payload?

### Step 4: Backend receives it

Which route?

Which middleware?

Which controller/service?

### Step 5: Business logic

Explain the actual logic.

### Step 6: Database / AI / external service

Explain exactly what happens.

### Step 7: Response

What is returned?

### Step 8: Frontend

What happens with the response?

### Step 9: User sees result

Explain the final UI behavior.

Then provide:

```text
FULL FLOW

User
 ↓
actual Component
 ↓
actual Function
 ↓
actual API
 ↓
actual Route
 ↓
actual Service
 ↓
actual Database/AI
 ↓
actual Response
 ↓
actual Component
 ↓
User
```

This is one of the **highest-priority sections for interview preparation**.

---

# 10. AI / Agent Explanation

If AeroInsight contains AI, agents, LLMs, RAG, embeddings, tool calling, etc., this section must be **entirely project-specific**.

Start from zero only as much as necessary.

For example:

> "AeroInsight makes an LLM call in `X`. Before understanding this function, you need to know what an LLM API call means..."

Then explain:

```text
Actual AeroInsight user input
↓
Actual preprocessing
↓
Actual prompt
↓
Actual model/provider
↓
Actual tools
↓
Actual retrieval/database operation
↓
Actual model response
↓
Actual post-processing
↓
Actual UI
```

Explain every actual prompt, agent, tool, schema, model call, retrieval mechanism, etc.

If there are multiple agents:

* Explain each agent.
* Explain its purpose.
* Explain its tools.
* Explain how it is invoked.
* Explain what data it receives.
* Explain what it returns.
* Explain how it interacts with other agents.

Do not teach unrelated AI concepts.

---

# 11. Database Must Be Project-Specific

Explain the database by first examining the actual schema.

For every actual table/model:

| Model/Table | Why AeroInsight needs it | Important fields | Relationships | Where used |
| ----------- | ------------------------ | ---------------- | ------------- | ---------- |

Then explain every important field.

Show actual relationships:

```text
Actual Model A
     │
     ├── relationship
     ↓
Actual Model B
```

Then trace actual queries from source code:

```text
User action
↓
Actual API
↓
Actual service
↓
Actual database query
↓
Actual table/model
↓
Actual result
↓
Response
```

Explain the query itself.

---

# 12. Frontend Must Be Explained Through Actual Components

Do not teach frontend development independently.

Instead:

> "AeroInsight has this page/component. To understand it, you need to understand this concept."

Then explain:

* Actual entry point
* Actual routes
* Actual pages
* Actual components
* Actual state
* Actual props
* Actual API calls
* Actual forms
* Actual event handlers
* Actual loading states
* Actual error states
* Actual data rendering

For every important component:

```text
Component
↓
Why it exists
↓
Who renders it
↓
What data it receives
↓
What state it owns
↓
What events it handles
↓
What API/function it calls
↓
What changes afterward
```

---

# 13. Backend Must Be Explained Through Actual Requests

For each important endpoint:

| Method | Actual Endpoint | Actual File | Purpose | Request | Response |
| ------ | --------------- | ----------- | ------- | ------- | -------- |

Then deeply explain the most important endpoints.

For each:

```text
Request
↓
Route
↓
Middleware
↓
Controller
↓
Service
↓
Database / AI / external API
↓
Response
```

Use actual filenames and function names.

---

# 14. Authentication and Security

Only explain security mechanisms that actually exist in AeroInsight.

For each:

* What is being protected?
* Where is authentication implemented?
* What happens during login?
* Where is identity stored?
* How is it checked?
* Which middleware/function performs the check?
* What happens when authentication fails?

Then identify:

### Current security weaknesses

Be brutally honest.

Explain:

* What is potentially weak?
* Why?
* How could it be improved?
* What should I say if an interviewer points it out?

---

# 15. Deployment Must Reference Actual Configuration

Explain the actual AeroInsight deployment.

Start from:

```text
Developer changes code
↓
Git commit
↓
GitHub
↓
Actual CI/CD process
↓
Actual build
↓
Actual deployment platform
↓
Actual frontend/backend
↓
Actual database/external services
```

Reference actual configuration files.

Explain every important deployment setting.

---

# 16. Build AeroInsight From Zero

Create a major chapter:

# Building AeroInsight Yourself: Step 0 → Step 15

This must be **project reconstruction**, not a generic tutorial.

I want approximately 15 steps.

Every step must answer:

### Goal

What are we building?

### Why does AeroInsight need it?

### What concept do I need first?

Teach it from zero.

### What exactly would I do?

Commands/actions/code structure.

### Which existing AeroInsight files correspond to this step?

Reference actual files.

### What should I have after completing this step?

### What could go wrong?

### How do I verify it works?

The final sequence should take me from:

```text
Step 0
Understand AeroInsight requirements
↓
Step 1
Set up development environment
↓
Step 2
Initialize project
↓
Step 3
Create actual project architecture
↓
Step 4
Build actual frontend foundation
↓
Step 5
Build actual backend foundation
↓
Step 6
Set up actual database
↓
Step 7
Implement actual data models
↓
Step 8
Implement actual APIs
↓
Step 9
Connect frontend ↔ backend
↓
Step 10
Implement authentication
↓
Step 11
Implement core AeroInsight features
↓
Step 12
Implement actual AI/agent functionality
↓
Step 13
Testing + error handling
↓
Step 14
Deployment
↓
Step 15
Production improvements + scalability
```

**Modify this sequence according to the actual AeroInsight architecture.**

The goal is not:

> "Here is how to build a React application."

The goal is:

> **"Here is how YOU would rebuild THIS exact AeroInsight project from an empty folder."**

---

# 17. Scalability Must Be Project-Specific

Analyze the actual architecture.

Answer:

> **Is AeroInsight scalable?**

Do not give a generic scalability lecture.

Analyze:

* Frontend
* Backend
* Database
* API design
* AI calls
* External services
* Concurrency
* Rate limits
* Caching
* Storage
* Deployment

For each:

```text
Current implementation
↓
Current limitation
↓
What happens at 10× users?
↓
What happens at 100× users?
↓
How would I improve it?
```

---

# 18. Interview Preparation Must Be Based on the Repository

Create project-specific questions.

## Basic

Questions proving I understand my own project.

## Implementation

Questions about actual code.

## Architecture

Questions about actual design decisions.

## Debugging

Questions based on actual flows.

## AI

Questions based on actual AI implementation.

## Database

Questions based on actual schema/queries.

## Scalability

Questions based on actual architecture.

## "Why did you choose X?"

Questions about actual technologies.

For every question provide:

### Question

### What the interviewer is testing

### Strong answer

### Why that answer is correct

### Follow-up question

### Follow-up answer

Do not give answers that sound like memorized ChatGPT garbage. Keep them technically accurate and explainable by a student who actually built/studied the project.

---

# 19. Final Mental Model

End the textbook with:

# AeroInsight in My Head

Give me the simplest possible mental model of the entire project.

Explain:

```text
What enters the system?
        ↓
What processes it?
        ↓
Where is data stored?
        ↓
Where does AI participate?
        ↓
What leaves the system?
```

Then give:

### 30-second explanation

### 2-minute explanation

### 5-minute technical explanation

### Deep technical walkthrough

All must be based on the **actual implementation**.

---

# 20. Learning Checkpoints

At the end of every major section:

## Can I Explain This?

* [ ] I can explain what this concept means.
* [ ] I can explain why AeroInsight needs it.
* [ ] I know the exact file where it is implemented.
* [ ] I know what calls it.
* [ ] I know what it calls.
* [ ] I can trace the execution.
* [ ] I can explain what happens if it fails.
* [ ] I can explain the design decision.
* [ ] I can answer an interview question about it.

Also include:

### 🧠 Stop and Think

Questions that force me to reason about the actual project.

Example:

> If this API suddenly returned 500, which files would you inspect first and why?

Then explain the answer after the question.

---

# 21. Final Verification Before Saving

After writing the textbook, **go back through the repository again**.

Verify that:

* Every major technology has been identified.
* Every major feature has been traced.
* Every important user flow has been explained.
* Every important API has been explained.
* Every major database model has been explained.
* Every major AI/agent component has been explained.
* Every important frontend component has been explained.
* Every important backend component has been explained.
* Deployment is explained from the actual configuration.
* Every meaningful project file has been covered.
* The 0→15 reconstruction guide is present.
* Scalability is analyzed using the actual architecture.
* Interview questions reference the actual project.
* No generic filler has been added.
* No technology has been explained merely because it is common in modern development.
* No implementation details have been invented.

## 🔴 Final rule

**If a paragraph cannot be connected to something that actually exists in AeroInsight, either:**

1. Explain why that basic concept is necessary to understand a specific AeroInsight implementation, **or**
2. Remove the paragraph.

The textbook should make me feel like:

> **"I understand AeroInsight because I understand every concept behind the actual code."**

Not:

> "I read a generic explanation of React, Node.js, databases and AI."

The entire document must ultimately answer one question:

> **"Can I open the AeroInsight repository in an interview, point to any important part of it, and explain what it does, why it exists, how it works, how it connects to everything else, and what tradeoffs are involved?"**

Write the completed textbook directly to:

`AeroInsight/textbook.md`

Do not merely describe what you intend to write. **Actually inspect the repository and create the file.**

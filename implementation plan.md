# Token Usage Optimization for the AI Booking Assistant (Revised)

Redesign the AI booking assistant architecture to dramatically reduce LLM token consumption while preserving conversational quality, booking reliability, and scalability. This optimization shifts persistent conversation state, stage-based workflow management, and knowledge retrieval from the LLM to the backend, and uses Supabase for session persistence to remain fully serverless-compatible.

## User Review Required

> [!IMPORTANT]
> - **Supabase Chat Sessions Table**: We will add a new database table `chat_sessions` to store persistent state, conversation stage, and summary server-side.
> - **SQL Execution**: The user will need to execute the SQL in [chat-sessions.sql](file:///d:/repos/kamp-lambingan/chat-sessions.sql) inside the Supabase SQL editor to create the table.
> - **Stage-Aware Intent Routing**: We will split the knowledge base and dynamically route modules based on both the user's latest query and the current booking stage (e.g. `email_verification`).
> - **Conversation Summary + Truncation**: We will only send the last 4–6 messages along with a backend-generated session state summary to the Groq LLM, drastically cutting token size.
> - **Automatic State Transitions**: We will remove the `updateBookingState` tool. State and stage changes will be handled automatically by the backend upon successful execution of existing tools (`checkAvailability`, `startBookingVerification`, `verifyBookingCode`, `completeBooking`).
> - **Interactive GCash Rendering**: The AI will no longer format structured JSON for payment instructions. Instead, the frontend will render the payment and receipt card directly from the `completeBooking` tool output.
> - **Precise Token Monitoring**: We will use the pure JS `js-tiktoken` tokenizer to log exact input/output tokens in the server logs.

## Open Questions

> [!NOTE]
> None. The proposed architecture integrates cleanly with the existing Supabase, Resend, and Groq configuration.

## Proposed Changes

### Database Layer

#### [NEW] [chat-sessions.sql](file:///d:/repos/kamp-lambingan/chat-sessions.sql)
Creates the `chat_sessions` table in public Supabase database with columns:
- `id` (UUID PRIMARY KEY)
- `session_id` (TEXT UNIQUE)
- `state` (JSONB)
- `conversation_summary` (TEXT)
- `current_stage` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
- `expires_at` (TIMESTAMPTZ)

---

### Backend API & Actions

#### [MODIFY] [route.ts](file:///d:/repos/kamp-lambingan/src/app/api/chat/route.ts)
- **Session Management**: Load or initialize the chat session from Supabase `chat_sessions` using the client's `chatSessionId`.
- **Automatic State Updates & Stage Transitions**:
  - `checkAvailability` (success): updates `check_in`, `check_out`, `pax` in state, transitions stage to `booking_information`.
  - `startBookingVerification` (success): saves full guest details and generated `sessionId`, transitions stage to `email_verification`.
  - `verifyBookingCode` (success): updates state to verified, transitions stage to `booking_confirmation`.
  - `completeBooking` (success): saves the reference and amount due, transitions stage to `completed`.
- **Stage-Aware Intent Classification**:
  - Classify the user's intent based on a combination of the current stage and keywords/intent on the latest message.
  - Dynamically load modules (General, Packages, Policies, FAQs, Payment, Contact).
- **Conversation Compression**:
  - Replace the old sliding window with a combination of the current booking state/summary + the last 4–6 messages.
- **Precise Token Monitoring**:
  - Import `getEncoding` from `js-tiktoken`.
  - Calculate and log exact token usage metrics (Prompt, Knowledge, Summary, History, User, Tools, Total Input, Output).

#### [MODIFY] [knowledge-base.ts](file:///d:/repos/kamp-lambingan/src/lib/knowledge-base.ts)
- Split the monolithic knowledge base system prompt into modular functions:
  - `getGeneralInfo()`
  - `getPackagesInfo(packageName?: string)` (supports retrieving only the requested package description)
  - `getPoliciesInfo(topic?: string)`
  - `getFAQsInfo()`
  - `getPaymentInfo()`
  - `getContactInfo()`
- Provide a `buildOptimizedPrompt(content, state, activeModules)` to output a compact prompt containing:
  - Core assistant role (no workflow descriptions).
  - The current backend booking state block.
  - Dynamically loaded active knowledge modules.

---

### Frontend Components

#### [MODIFY] [ChatWidget.tsx](file:///d:/repos/kamp-lambingan/src/components/site/ChatWidget.tsx)
- Generate a unique `chatSessionId` via `crypto.randomUUID()` and store in `sessionStorage`.
- Include `chatSessionId` in the body payload of every `/api/chat` request.
- Remove client-side JSON message parsing.
- Render the `PaymentInstructionCard` automatically when the `completeBooking` tool output matches `success: true`.

---

### Operations

- Periodic cleanup script or database trigger to delete chat sessions older than 30 minutes of inactivity.

## Verification Plan

### Automated Tests
- Run production compilation check: `npm run build`

### Manual Verification
- Verify database read/write actions on `chat_sessions`.
- Audit backend logs to verify that only relevant modules are loaded based on stages and intents.
- Check that browser reload preserves conversation state.
- Measure and print token statistics in the backend server output.

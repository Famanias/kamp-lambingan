Security Remediation Plan (Revised & Hardened)

This implementation plan addresses the identified security issues across Server Actions, Supabase RLS, storage access, authentication, file handling, email rendering, and database integrity. It applies defense-in-depth principles with database-enforced security, role-based access control, and explicit server-side authorization.

Key Architectural Changes (Applies to Entire System)
1. Replace Email-Based Authorization With Role-Based Access Control

DO NOT use: auth.jwt() ->> 'email' = 'admin@email.com'
Replace with: Create an admins table or JWT custom claim:

Recommended: DB-backed admin table
create table admins (
  user_id uuid primary key references auth.users(id)
);

RLS rule:
auth.uid() in (select user_id from admins)

2. Middleware is NOT a security boundary
Middleware is only for:

routing protection
UX redirects
Important rule: ALL Server Actions must enforce their own authorization independently.

3. Service Role Key Usage Policy (STRICT)
Allowed: Admin-only Server Actions, Backend-only privileged operations
NOT allowed: Public reads, user-facing queries, any route exposed without explicit admin check

4. Add System-Wide Rate Limiting (NEW – CRITICAL)
Apply rate limiting to: booking creation, booking lookup, uploads, email-based queries
Use: Upstash Redis / Vercel Rate Limit / Supabase Edge middleware

Database & Infrastructure Security
1. Enable RLS (Corrected)
bookings table: Enable RLS, Enforce admin-only mutation access: auth.uid() in (select user_id from admins)
Ensure: NOT based on email, NOT based only on "authenticated"

2. Storage Security Hardening
[MODIFY] receipts bucket
Set:
public = false
Add access rule:
Only admin can generate signed URLs
3. Add Double Booking Protection (Correct)
CREATE EXTENSION IF NOT EXISTS btree_gist;

Then:

ALTER TABLE bookings
ADD CONSTRAINT no_overlap
EXCLUDE USING gist (
  tstzrange(start_date, end_date) WITH &&
);

Next.js Security Layer
1. Replace proxy middleware system
[CREATE] src/middleware.ts
Only handles:
route protection
redirect to login
NOT business logic security
2. Add Centralized Admin Guard (NEW BEST PRACTICE)
[NEW] withAdminAction.ts
export async function withAdminAction(fn: Function) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const isAdmin = await checkAdmin(user.id);
  if (!isAdmin) {
    throw new Error("Forbidden");
  }

  return fn(user);
}


Server Actions Security Fixes
1. Require explicit authorization in ALL actions

All privileged actions MUST:

archiveBooking
deleteBooking
updateBookingStatus
saveContent
uploadImage
Must include:
await requireAdmin();
2. Remove unsafe email enumeration endpoint
DELETE:

getBookingsByEmail
3. Fix booking reference generation
Replace:
Math.random()
With:
crypto.randomUUID()

or:

crypto.randomBytes(16).toString("hex")
4. Fix unsafe reference lookup

Avoid:

.ilike("reference", value)
Replace:
.eq("reference", value)
5. File upload security hardening
Required validations:
MIME whitelist
magic byte validation
size limits
filename sanitization
Enforce:
path.basename(file.name)

Reject:

../
double extensions
unsafe characters
6. amount_due validation (correct)
Server-authoritative pricing:
NEVER trust client input
fetch package price from DB
7. HTML email safety
Required:
escape ALL user inputs
use helper:
escapeHtml(input)
Optional upgrade:
add plain-text email fallback
📡 API & Storage Layer
1. Secure receipt access (corrected design)
[CREATE] /api/admin/receipt/[filename]

Must:

validate session
verify admin role
whitelist path prefix:
if (!filename.startsWith("receipts/")) deny();
generate signed URL only after auth check
🔄 Content Security
1. uploadImage & saveContent

Must:

require admin
validate MIME type
enforce size limits
sanitize file names
Email Security Fix
1. Prevent HTML injection
escape all variables
enforce templated rendering
Risk reduced:
phishing injection
malicious markup injection
Race Condition Fix
1. Booking conflict prevention
Keep:
DB-level exclusion constraint (correct solution)
Remove reliance on:
application-level pre-checks
Logging & Error Handling
1. Remove sensitive logs
file metadata
PII
URLs
2. Sanitize error responses
log full error server-side only
return generic messages to client
Rate Limiting Strategy (NEW CRITICAL LAYER)

Apply per-IP limits:

Action	Limit
create booking	strict
lookup booking	moderate
upload receipt	strict
admin actions	session-only

Verification Plan (Updated) (DO NOT DO THE AUTOMATED TESTS AND MANUAL TEST!)
Automated
npm run build
type checking
RLS policy migration tests
Manual
Try Server Actions without session → must fail
Try admin routes without role → must fail
Attempt booking spam → rate limit triggers
Attempt SQL-style booking overlap → DB blocks it
Try accessing receipt URL directly → denied unless signed

Final Security Posture

After applying this plan, system achieves:

✔ Proper RBAC (not email-based auth)
✔ DB-enforced security (RLS + constraints)
✔ No reliance on middleware for security
✔ No public service-role exposure
✔ Rate-limited public endpoints
✔ Secure file handling pipeline
✔ Safe email rendering
✔ No enumeration endpoints
✔ Atomic booking integrity
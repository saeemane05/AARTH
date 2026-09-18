You are continuing development of my existing project AARTH.

IMPORTANT:
The uploaded/current AARTH ZIP is the ONLY source of truth for the current implementation.

DO NOT use older versions of the project.
DO NOT recreate the project.
DO NOT rewrite the architecture.
DO NOT delete working functionality.

AARTH is the final project name.

Do NOT use SEVA anywhere in new UI, routes, components, database labels, comments, or user-facing text.

This project is being developed for Smart India Hackathon 2026 for:

Problem Statement:
"Strengthening market linkages and price discovery for farmers"

Organization:
Government of Maharashtra

Department:
Maharashtra State Innovation Society, Department of Skills, Employment, Entrepreneurship and Innovation

Theme:
Agriculture, FoodTech & Rural Development


============================================================
CURRENT PROJECT STATE
============================================================

The current FPO foundation is already partially implemented and the FPO dashboard is currently loading successfully.

DO NOT BREAK IT.

Existing authentication is working.

Existing Farmer authentication is working.

Existing Farmer Dashboard is working.

Existing Farmer Profile is working.

Existing role detection and role-based redirect logic is working.

Existing Supabase integration is working.

Existing public.fpos table is working.

Existing FPO dashboard is working.

The FPO dashboard currently loads organisation information, farmer counts, membership information, verification information and FPO actions.

The previous routing/404 issue has already been resolved.

DO NOT reintroduce the previous FastAPI routing problem.

DO NOT replace the working FPO router mounting architecture.

DO NOT replace FastAPI.

DO NOT replace React.

DO NOT replace Supabase.

DO NOT create a second authentication system.

DO NOT create duplicate farmer accounts.

DO NOT create duplicate farmer profiles.


============================================================
VERY IMPORTANT DATABASE RULE
============================================================

Continue using ONE combined FPO table.

The existing:

public.fpos

must remain the central FPO organisation record.

DO NOT create:

fpo_master
fpo_sources
fpo_organisations
fpo_staff
fpo_memberships
fpo_claims
fpo_verifications
fpo_invites

as separate tables.

Use the existing:

public.profiles
public.farmers
public.fpos

and the existing AARTH authentication system.

Use JSON/JSONB inside public.fpos where appropriate.

Do not duplicate farmer information.

The farmer remains the owner of their own Farmer Profile.

The FPO owns the membership relationship.


============================================================
FIRST TASK — INSPECT BEFORE CODING
============================================================

Before modifying anything, inspect the CURRENT uploaded repository.

Specifically inspect:

1. frontend/src/App.jsx
2. frontend/src/pages/FpoDashboard.jsx
3. frontend/src/pages/FpoFoundation.jsx
4. frontend/src/pages/FpoDashboard.css
5. frontend/src/pages/FpoFoundation.css
6. frontend/src/api/fpos.js
7. frontend/src/api/auth.js
8. backend/main.py
9. backend/fpo/router.py
10. backend/fpo/service.py
11. backend/fpo/schema.py
12. backend/auth/router.py
13. backend/auth/service.py
14. Supabase migrations
15. existing public.profiles structure
16. existing public.farmers structure
17. existing public.fpos structure
18. existing role handling
19. existing Farmer Dashboard
20. existing Farmer Profile

Then compare the current implementation with the requirements below.

Do NOT immediately rewrite files.

First understand the current code.


============================================================
PHASE 2 OBJECTIVE
============================================================

Now extend the existing FPO foundation into a complete working organisation/farmer-network module.

The new complete flow must be:

FPO
↓
Generate invitation
↓
QR / registration code / invite link
↓
Farmer scans or opens invitation
↓
System verifies invitation
↓
Farmer chooses:
    LOGIN
    OR
    REGISTER
↓
Existing AARTH account/profile is resolved
↓
System verifies that the farmer is an existing valid FARMER account
↓
Existing Farmer Profile is connected to the FPO membership
↓
Farmer sees:
"Join [FPO Name]"
↓
Farmer submits membership request
↓
FPO sees pending request
↓
FPO reviews farmer
↓
FPO approves
↓
Farmer becomes ACTIVE MEMBER
↓
Farmer continues using the SAME AARTH Farmer Dashboard
↓
FPO sees the SAME farmer in its farmer network

DO NOT create another farmer profile.

DO NOT create another farmer login.

DO NOT modify the core login/register architecture unnecessarily.


============================================================
1. FARMER AARTH ID / QR VERIFICATION
============================================================

Implement a proper farmer identity connection workflow.

The farmer already has an AARTH account.

The system must use the existing AARTH user/profile.

The farmer's AARTH identity must be resolved using the existing authenticated user/session.

Support the following:

A. Existing farmer logs in through invitation

Invitation
↓
AARTH login
↓
authenticated user
↓
public.profiles
↓
verify role = FARMER
↓
resolve existing farmer identity
↓
create membership request


B. Existing farmer can enter AARTH ID

Provide an optional field:

AARTH ID

Example:

FAR-MH-000124

The backend must verify:

- AARTH ID exists
- associated account exists
- associated profile exists
- role is FARMER
- account status is ACTIVE

Do not trust the frontend.

All identity verification must happen on the backend.


C. QR CODE

The QR code must NOT contain:

- password
- access token
- authentication secret
- private farmer information

The QR should contain only a safe invitation URL/token/code.

The backend must validate the invitation before creating membership.


============================================================
2. INVITATION MODEL
============================================================

Use the existing invite_data JSONB field inside public.fpos.

Do NOT create fpo_invites.

Each invite should have structured information such as:

id
code
created_at
created_by
status
expires_at
usage_count
max_usage
fpo_id

Use a secure random identifier.

Do not rely only on predictable FPO names.

The invitation must be associated with exactly one FPO.

Validate:

- invite exists
- invite belongs to FPO
- invite is active
- invite has not expired
- usage limit has not been exceeded


============================================================
3. FARMER JOIN PAGE
============================================================

Create a proper route such as:

/fpo/join/:inviteCode

or another route consistent with the existing architecture.

The invitation flow must show:

AARTH

Join FPO

FPO Name
District
Taluka
Crops if publicly available

Then:

"Already have an AARTH account?"
[ Login and continue ]

"New to AARTH?"
[ Create AARTH account ]

Do NOT create a separate FPO account for the farmer.

The farmer must continue using the existing AARTH account system.


============================================================
4. IMPORTANT LOGIN/REGISTER RULE
============================================================

DO NOT MODIFY THE INITIAL MAIN LOGIN/REGISTRATION LOGIC.

The existing login/register mechanism must remain the same.

Do not change:

- username/password handling
- Supabase Auth
- session handling
- existing role selection
- existing Farmer Dashboard redirect
- existing Farmer Profile creation

The invitation flow should integrate WITH the existing authentication system.

It must not replace it.


============================================================
5. AFTER FARMER AUTHENTICATION
============================================================

After login/register:

Backend resolves:

authenticated Supabase user
↓
public.profiles
↓
role
↓
farmer role identity
↓
existing Farmer Profile

If role != FARMER:

Reject the FPO membership operation.

Example:

"This FPO invitation is available for AARTH farmer accounts."

If farmer is valid:

show:

"Join [FPO Name]"

Display only relevant existing farmer information.

Do not copy the farmer profile into FPO data.

The membership record should contain a reference such as:

farmer_user_id

and not a copy of:

name
address
farm size
crops
etc.


============================================================
6. MEMBERSHIP DATA
============================================================

Continue using:

public.fpos.membership_data

as the membership relationship storage.

Each membership should have:

id
farmer_user_id
status
requested_at
approved_at
approved_by
rejected_at
rejected_by
source
invite_code if appropriate

Statuses:

PENDING
ACTIVE
REJECTED
LEFT
SUSPENDED

Prevent duplicate active/pending membership records for the same:

FPO + farmer_user_id


============================================================
7. BACKEND MEMBERSHIP APIs
============================================================

The current frontend already expects:

PATCH /api/fpo/members/{id}/approve

PATCH /api/fpo/members/{id}/reject

Make these backend endpoints actually exist.

Do not simply change the frontend to hide the problem.

Implement backend authorization.

Approve:

- only permitted FPO roles
- membership must belong to requesting FPO
- membership must currently be PENDING
- farmer user must still exist
- farmer must still have role FARMER
- update membership to ACTIVE
- record approved_at
- record approved_by

Reject:

- only permitted FPO roles
- membership must belong to requesting FPO
- membership must currently be PENDING
- update membership to REJECTED
- record rejected_at
- record rejected_by


============================================================
8. FARMER DETAIL BACKEND
============================================================

Create a proper protected backend operation for:

/fpo/farmers/:id

The FPO must not simply depend on a previously loaded list.

The backend should:

1. authenticate the requester
2. resolve their FPO
3. check organisation role
4. locate membership
5. verify membership belongs to this FPO
6. resolve farmer_user_id
7. load the existing Farmer Profile
8. return only permitted operational information

Possible fields:

AARTH ID
Full Name
District
Taluka
Village
Farm Size if already legitimately available
Crops
FPO Membership Status
Joined Date

Do not expose:

passwords
tokens
authentication secrets
private credentials
unnecessary private data


============================================================
9. FARMER NETWORK PAGE
============================================================

Completely implement:

/fpo/farmers

It should include:

Total Farmers
Active Farmers
Pending Requests
Inactive/Suspended

Search:

Farmer name
AARTH ID

Filters:

District
Taluka
Village
Crop
Membership status

Do not hard-code Maharashtra villages.

Use the existing location architecture where appropriate.

Provide:

[ View ]

[ Review ]

[ Approve ]

[ Reject ]

where permitted.

Buttons must perform real backend actions.

Do not create fake statistics.


============================================================
10. FPO ORGANISATION PAGE
============================================================

Completely implement:

/fpo/organisation

It must be a real organisation profile.

Display:

FPO Name
Organisation Type
Registration Number
State
District
Taluka
Village
Address
Associated Crops
Source
Source Record ID where appropriate
Source Last Updated
Verification Status
Activation Status
Primary Administrator

Clearly distinguish:

READ ONLY SOURCE DATA

from:

EDITABLE AARTH ORGANISATION DATA

Do not allow an FPO representative to overwrite authoritative government source information as if they were changing the government record.

If a field is sourced from public data, show its provenance.

Editable AARTH profile information can be updated through the existing PATCH endpoint.

Implement:

loading
saving
success
validation
error
empty states


============================================================
11. FPO PROFILE COMPLETENESS
============================================================

Calculate a meaningful organisation profile completion percentage.

Do not fake the number.

The percentage should be derived from actual available organisation fields.

Example:

organisation type
registration number
district
taluka
village
address
crops
contact information where legitimately available

Show which fields are missing.

Provide:

[ Complete profile ]


============================================================
12. STAFF MANAGEMENT
============================================================

Completely implement:

/fpo/staff

Roles:

FPO_ADMIN
OPERATIONS_MANAGER
FIELD_COORDINATOR
FINANCE

The existing staff_data JSONB field must remain inside public.fpos.

Do NOT create fpo_staff.

Implement:

View staff
Add staff
Assign role
Change role
Deactivate staff access where appropriate

Backend must enforce permissions.

FPO_ADMIN:
- organisation management
- staff management
- farmer membership approval
- farmer network

OPERATIONS_MANAGER:
- permitted farmer operational information
- permitted FPO operations

FIELD_COORDINATOR:
- farmer invitation/onboarding
- permitted farmer information

FINANCE:
- keep limited to currently implemented permitted functions
- no payment/settlement system yet


============================================================
13. VERIFICATION PAGE
============================================================

Completely implement:

/fpo/verification

Show separate verification states:

Government/public record matched
Organisation details verified
Representative verified
e-NAM registration
GST
AARTH verification
AARTH transaction activity

Do not merge these into one generic badge.

Do not claim:

"Government Certified"

unless an actual source supports that exact status.

Do not fabricate verification.

If verification is unavailable:

show:

Not provided
Not verified
Not available

as appropriate.


============================================================
14. SETTINGS
============================================================

Do not map:

/fpo/settings

silently to organisation.

Create a proper FPO settings page.

It should contain appropriate organisation-level settings such as:

Account information
Organisation preferences
Staff access overview
Session/security information
Notification preferences if supported

Do NOT create fake notification infrastructure if the backend does not support it.

Use "Coming Soon" for future settings.


============================================================
15. DASHBOARD REDESIGN
============================================================

The current FPO dashboard works functionally but visually does not look professional enough.

Redesign it.

IMPORTANT:

The dashboard must feel like a serious Indian agricultural organisation/business management platform.

It should visually resemble the professionalism and restrained information architecture commonly seen in Indian public-sector/agriculture digital services.

However:

DO NOT add:

Government of Maharashtra logo
MSIS logo
Government seal
Ashoka emblem
government department branding
fake government certification
fake official branding

The product remains:

AARTH

with:

Agriculture Market Linkage Platform

The visual language can be government/public-service inspired without falsely presenting AARTH as an official government website.


============================================================
16. LOGO
============================================================

Use the ACTUAL existing AARTH logo asset from the project.

Do NOT render:

"AARTH"

as a plain text circle/logo.

Inspect existing assets and reuse the actual AARTH logo.

Keep:

Agriculture Market Linkage Platform

under/next to the logo as already designed.

Do not create a new logo.


============================================================
17. FULL-WIDTH RESPONSIVE LAYOUT
============================================================

The current dashboard leaves excessive unused space.

Fix the layout.

The FPO application should use the available desktop viewport properly.

Use:

width: 100%
max-width appropriate to large desktop screens
responsive horizontal spacing
proper mobile breakpoints

Do not create a tiny centered dashboard floating in a huge empty webpage.

However, do not stretch cards so much that readability suffers.

Use a professional responsive grid.


============================================================
18. TYPOGRAPHY
============================================================

Increase typography where necessary.

The dashboard should be easily readable.

Use a clear hierarchy:

Page title
Section title
Card title
Metric
Supporting text
Metadata

Do not make everything huge.

Do not use excessive rounded cards.

Do not use excessive gradients.

Do not use flashy AI-generated visual effects.

Avoid:

glassmorphism
neon gradients
excessive shadows
random floating cards
over-animation


============================================================
19. VISUAL DESIGN DIRECTION
============================================================

Use a restrained professional visual system.

Preferred direction:

warm neutral / off-white background
dark brown / charcoal typography
subtle agricultural green accents
thin borders
moderate corner radius
minimal shadows
clean tables
clear section hierarchy
professional government-service-like density

Do not make it look like a generic AI SaaS dashboard.

Do not make it look like a Dribbble concept.

Make it look like something an actual FPO manager could use.


============================================================
20. NAVBAR
============================================================

Keep the horizontal navbar.

Use the actual AARTH logo asset.

Maintain:

Dashboard
Organisation
Farmers
Staff
Verification

Future modules may remain:

Aggregation
Market Opportunities
Transactions
Logistics
Reports

but must clearly say:

Coming Soon

and must not contain fake data.

Search, notification and profile controls should work where functionality exists.

Do not create fake notifications.


============================================================
21. DASHBOARD CONTENT
============================================================

Dashboard should communicate:

Organisation identity
Organisation status
Verification state
Farmer network
Membership requests
Staff
Organisation completeness
Future aggregation readiness

Do NOT fill the dashboard with fake transaction values.

Use real counts from backend.

If zero:

show:

0

and a meaningful empty state.

Example:

"No active aggregation lots yet."

This is preferable to fabricated numbers.


============================================================
22. FPO DASHBOARD INFORMATION ARCHITECTURE
============================================================

Use a layout similar to:

HEADER

Organisation identity

Quick actions


SUMMARY

Total Farmers
Active Members
Pending Requests
Crops Represented


FARMER NETWORK

Recent membership requests

Active farmer overview


ORGANISATION

Profile completeness

Location

Source

Verification


FUTURE WORKSPACE

Aggregation
Market opportunities
Transactions
Logistics

Clearly marked:

Coming Soon


============================================================
23. ROUTING SAFETY
============================================================

This is extremely important.

There must be NO blank pages.

Every route must render something.

Verify all:

/fpos
/fpos/:id

/fpo/claim/:id
/fpo/login

/fpo/dashboard
/fpo/organisation
/fpo/farmers
/fpo/farmers/:id
/fpo/staff
/fpo/verification
/fpo/settings

Also verify:

/fpo/lots/create

because it already exists in the current project.

Do NOT delete it.

If a route is intentionally future functionality, show a professional Coming Soon page rather than a blank page.


============================================================
24. ROUTING ARCHITECTURE
============================================================

DO NOT introduce another BrowserRouter.

DO NOT introduce another routing library.

Use the existing:

react-router-dom

architecture.

Preserve the existing:

ProtectedRole

role checking

navigation

session handling

Do not change the existing Farmer routes unnecessarily.


============================================================
25. FASTAPI ROUTING SAFETY
============================================================

The previous project experienced FPO 404 routing problems.

DO NOT reintroduce that.

The current working FPO router mounting architecture is now the source of truth.

Preserve it.

Do not:

- manually append routes to app.router.routes
- manually mutate router.routes
- create duplicate FPO routers
- create duplicate /api prefixes
- use another FastAPI application unnecessarily

Before changing backend routing, inspect the current working architecture.


============================================================
26. FRONTEND API CONSISTENCY
============================================================

Every frontend API call must have a corresponding backend endpoint.

Specifically check:

fpoApi.dashboard()
fpoApi.organisation()
fpoApi.updateOrganisation()
fpoApi.members()
fpoApi.invite()
fpoApi.requestMembership()
fpoApi.decideMembership()
fpoApi.staff()
fpoApi.addStaff()

Do not leave frontend calls without backend implementations.

Do not hide errors.

Show proper user-facing error messages.


============================================================
27. ERROR HANDLING
============================================================

No blank pages.

Every API page needs:

loading state
error state
empty state
success state where applicable

Backend should return meaningful HTTP status codes.

Frontend should display meaningful messages.

Do not expose raw Python tracebacks to users.


============================================================
28. AUTHORIZATION
============================================================

Backend authorization is mandatory.

Do NOT trust frontend role checks.

For every FPO protected endpoint:

authenticate user
↓
resolve profile
↓
resolve FPO organisation
↓
resolve organisation role
↓
check permission
↓
perform action

A user must not gain access simply by manually entering:

/fpo/dashboard
/fpo/farmers
/fpo/staff
etc.


============================================================
29. FARMER IDENTITY SECURITY
============================================================

When connecting a farmer:

DO NOT trust:

farmer name
mobile number
AARTH ID submitted by frontend alone

Use authenticated account identity wherever possible.

If AARTH ID is entered:

backend resolves it to the existing profile/farmer identity.

Verify:

role = FARMER
status = ACTIVE

Then use:

user_id

as the canonical identity reference.


============================================================
30. EXISTING FARMER DASHBOARD
============================================================

Do NOT redesign the Farmer Dashboard.

Do NOT change its main login flow.

Do NOT change Farmer Profile creation.

Only add the minimum integration needed so the farmer can see:

FPO membership status

and/or:

Join FPO

if appropriate.

The farmer must continue to own and use their own AARTH account.


============================================================
31. OPTIONAL FPO MEMBERSHIP
============================================================

Never force:

Farmer → FPO

The correct architecture remains:

Farmer → AARTH

and optionally:

Farmer → FPO

A farmer can continue using AARTH independently.

Do not make FPO membership mandatory for creating or using the Farmer account.


============================================================
32. NO DUPLICATION
============================================================

Do NOT duplicate:

farmer profiles
farmer accounts
authentication
FPO organisation records
FPO tables


============================================================
33. NO FAKE DATA
============================================================

Do NOT fabricate:

government FPOs
government verification
farmer members
transactions
buyer offers
market opportunities
payments
logistics
aggregation data

Use real database records.

If there is no data:

show a professional empty state.


============================================================
34. FUTURE MODULES
============================================================

Do NOT implement yet:

aggregated lot creation
buyer matching
buyer requirements
offers
negotiation
transactions
logistics booking
payment settlement
dispute management
reputation scoring
AI recommendation engine
complex FPO financial management

They can remain visible as:

Coming Soon

Do not create fake workflows.


============================================================
35. EXISTING LOT CREATION BRIDGE
============================================================

Do NOT delete:

/fpo/lots/create

or:

FpoLotCreationBridge.jsx

If the main lot engine is not yet connected:

keep the bridge working and show a proper explanation.

Do not create fake lot records.


============================================================
36. RESPONSIVE DESIGN
============================================================

The FPO application must work on:

desktop
laptop
tablet
mobile

The horizontal navbar should collapse appropriately on smaller screens.

Do not break the Farmer Dashboard responsive behaviour.


============================================================
37. IMPLEMENTATION SAFETY
============================================================

Before editing each file:

inspect it.

When modifying:

preserve existing code and logic.

Do not make files artificially smaller by deleting existing functionality.

Do not replace complete files with simplified versions unless absolutely necessary.

Prefer incremental modifications.

Do not remove comments or working functions without a technical reason.

Do not rename existing routes unnecessarily.

Do not rename existing API functions unnecessarily.


============================================================
38. DATABASE MIGRATIONS
============================================================

Before creating a migration:

inspect all existing migrations.

If a required column already exists:

do not recreate it.

If a JSONB structure already exists:

extend it safely.

Do not create unnecessary FPO tables.

Migration must be idempotent where practical.

Do not break existing Supabase data.


============================================================
39. REQUIRED FINAL VALIDATION
============================================================

After implementation, perform a complete static/code validation.

Check:

frontend build
backend import
route registration
frontend route coverage
frontend API/backend API matching
Python syntax
JS/JSX syntax
database migration consistency

Specifically ensure:

GET /api/fpo/dashboard
GET /api/fpo/members
PATCH /api/fpo/members/{id}/approve
PATCH /api/fpo/members/{id}/reject
GET /api/fpo/organisation
PATCH /api/fpo/organisation
GET /api/fpo/staff
POST /api/fpo/staff/invite

and the new farmer invitation/join endpoints all have matching frontend calls where needed.


============================================================
40. END-TO-END ACCEPTANCE TEST
============================================================

The final implementation must support this exact demonstration:

STEP 1

Existing AARTH Farmer already exists.

Example:

FAR-MH-000124


STEP 2

FPO opens:

/fpo/farmers


STEP 3

FPO clicks:

Invite Farmer


STEP 4

System generates:

registration code
invite URL
QR code


STEP 5

Farmer opens/scans QR.


STEP 6

Farmer sees:

Join [FPO Name]


STEP 7

Farmer chooses:

Login


STEP 8

Existing AARTH login works normally.


STEP 9

Backend verifies:

authenticated user
↓
profile
↓
role FARMER
↓
existing farmer identity


STEP 10

Farmer sees:

AARTH ID
Name
FPO name

and:

[ Request Membership ]


STEP 11

Farmer submits request.


STEP 12

FPO opens:

/fpo/farmers


STEP 13

FPO sees:

New membership request


STEP 14

FPO clicks:

View


STEP 15

FPO sees permitted farmer information.


STEP 16

FPO clicks:

Approve


STEP 17

Backend changes:

PENDING → ACTIVE


STEP 18

Farmer appears as:

ACTIVE MEMBER


STEP 19

Farmer continues using:

existing Farmer Dashboard


STEP 20

No second farmer profile is created.


STEP 21

No second farmer account is created.


============================================================
41. IMPORTANT FINAL REPORT
============================================================

After implementation, provide:

1. Files created
2. Files modified
3. Existing files preserved
4. Database migrations added
5. Exact public.fpos structure
6. JSONB structures used
7. New API endpoints
8. Existing API endpoints preserved
9. Authentication changes
10. Authorization changes
11. Farmer identity linking logic
12. QR/invite logic
13. Membership workflow
14. Staff workflow
15. Organisation profile workflow
16. Verification workflow
17. Frontend routes
18. Backend routes
19. Which routes were already implemented
20. Which routes were newly completed
21. Which modules remain future
22. Which functionality still requires real external government/API integration
23. Exact commands to run
24. Build validation result
25. End-to-end test result


============================================================
42. CRITICAL OUTPUT RULE
============================================================

Do not say:

"implemented"

for anything that is only mocked.

Clearly classify:

IMPLEMENTED
PARTIALLY IMPLEMENTED
MOCKED FOR DEVELOPMENT
REQUIRES REAL EXTERNAL DATA/API
FUTURE MODULE


============================================================
43. MOST IMPORTANT RULE
============================================================

DO NOT DELETE ANY EXISTING WORKING AARTH LOGIC.

DO NOT BREAK:

authentication
registration
login
Supabase Auth
session handling
role detection
role redirects
Farmer Dashboard
Farmer Profile
existing APIs
existing market intelligence
existing lot logic
existing backend modules
existing routing

Extend the existing system.

The current working AARTH project is more important than making the code look shorter.


============================================================
44. FINAL QUALITY STANDARD
============================================================

This is an SIH 2026 project.

The result should not look like a superficial CRUD application.

The FPO module should feel like a real organisation management layer that can later support:

FPO farmer network
↓
produce aggregation
↓
market linkage
↓
buyer matching
↓
offers
↓
logistics
↓
transaction

But DO NOT implement those future transaction modules now.

Build the correct foundation.

Prioritize:

correctness
security
maintainability
real farmer identity
real FPO membership
proper organisation authorization
clean UX
professional Indian public-service-style visual design
responsive layout
working routes
working APIs
no blank pages
no routing errors
no fake government claims
no fake transactions
no duplicated farmer profiles
ONE combined FPO table

Before making changes, inspect the current repository and preserve its working architecture.
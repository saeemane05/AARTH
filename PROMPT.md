Implement S1: Basic User Profiles + Role-Based Dashboards for AARTH.

IMPORTANT:
The project name is AARTH. Do NOT use the name SEVA anywhere in the UI, code comments, API responses, headings, or profile messages.

I will provide a reference image showing the exact UI/UX I want. Treat that image as the PRIMARY visual reference.

AUTHENTICATION:
- Keep the existing username + password authentication.
- Fix the current frontend/backend authentication integration that previously worked through FastAPI Swagger.
- Use ONE common authentication system for all roles.
- Do NOT create separate authentication systems for each role.
- Login should only require username + password.
- Do NOT ask the user to select a role during login.
- Resolve the user's role from the authenticated profile.
- Admin must NOT be selectable during public registration.

PUBLIC REGISTRATION ROLES:
1. FARMER
2. FPO
3. BUYER
4. LOGISTICS_PARTNER
5. STORAGE_PARTNER

After registration, generate a unique role-based AARTH ID:

FARMER → FRM-MH-xxxxx
FPO → FPO-MH-xxxxx
BUYER → BUY-MH-xxxxx
LOGISTICS_PARTNER → LOG-MH-xxxxx
STORAGE_PARTNER → STR-MH-xxxxx

The generated ID MUST actually be stored in Supabase public.profiles.seva_id (or rename it to a more appropriate aarth_id if the existing schema allows this cleanly). It must NOT be generated only on the frontend or merely returned in the response.

SUPABASE:
Every successful registration must create exactly one corresponding row in public.profiles.

Verify that:
- user_id matches Supabase Auth user
- username is stored
- role is stored
- generated AARTH ID is stored
- profile_data is stored
- status is stored
- AARTH ID is unique
- duplicate registrations do not create duplicate profiles
- failed registration does not leave unnecessary orphaned records where rollback is possible

PROFILE SCOPE:
We are ONLY creating the BASIC PROFILE at this stage.

DO NOT include:
- Payment preference
- Typical selling quantity
- Selling urgency

Those belong to later AARTH workflows.

Basic profile fields:

FARMER:
- Full name
- Phone number
- Location
- District
- Taluka
- Village
- Crops grown
- Land / production information

FPO:
- FPO name
- Registration number
- Date of registration
- Member count
- Location
- District
- Taluka
- Headquarters village
- Crops handled
- Aggregation capacity
- Storage facilities (if any)
- Annual turnover (optional)

BUYER:
- Business name
- Phone number
- Buyer type
- GSTIN (optional)
- Location
- District
- City
- Required commodities
- Typical procurement quantity
- Quality requirements
- Payment terms

LOGISTICS PARTNER:
- Business name
- Phone number
- Location
- District
- City
- Service area
- Vehicle details
- Capacity
- Availability
- Pricing
- Verification status

STORAGE PARTNER:
- Facility name
- Phone number
- Location
- District
- Taluka
- Village / Area
- Storage type
- Total capacity
- Available capacity
- Supported commodities
- Pricing
- Verification status

UI REQUIREMENT:
The attached reference image is the target design.

Build the profile onboarding screens to closely match it:
- AARTH branding/logo
- role-specific sidebar
- role-specific color theme
- welcome header
- "Complete your profile" section
- multi-step progress indicator
- profile readiness card
- role-specific form fields
- contextual information/benefit card
- agricultural/business imagery
- Save as Draft
- Save & Continue
- clean professional agricultural UI
- responsive layout

Create a separate dashboard experience for each role.

After successful login/registration, redirect automatically according to role:

FARMER → Farmer dashboard
FPO → FPO dashboard
BUYER → Buyer dashboard
LOGISTICS_PARTNER → Logistics dashboard
STORAGE_PARTNER → Storage dashboard
ADMIN → Admin dashboard

The dashboards should visually follow the attached reference image and have role-specific navigation.

FARMER sidebar should include the relevant Farmer sections shown in the reference.

FPO sidebar should include:
- Profile
- Member Management
- Aggregation
- Market Linkages
- Transactions
- Support

BUYER sidebar should include:
- Profile
- Search Produce
- My Requirements
- Orders
- Supplier Network
- Support

LOGISTICS sidebar should include:
- Profile
- Available Trips
- Transport Requests
- My Vehicles
- Earnings
- Support

STORAGE sidebar should include:
- Profile
- Capacity Management
- Bookings
- Pricing
- Transactions
- Support

Do not implement the future marketplace/lot/matching features yet. Only create the profile/dashboard foundation required for S1.

SUCCESS UI:
After successful registration, show a polished animated success modal/toast.

Example:

✓
Registered Successfully

Your Farmer ID is

FRM-MH-00421

[ Copy ID ]

[ Continue ]

The role name and ID must dynamically change according to the registered role.

Examples:
Your FPO ID is FPO-MH-00108
Your Buyer ID is BUY-MH-00124
Your Logistics Partner ID is LOG-MH-00031
Your Storage Partner ID is STR-MH-00017

Make the animation professional and subtle, not flashy.

LOGIN:
After login:
1. Authenticate
2. Fetch profile
3. Determine role
4. Redirect to the correct role dashboard
5. Display the correct role-specific UI.

Do NOT make users select a role during login.

IMPORTANT CODE REQUIREMENTS:
First inspect the existing AARTH project and reuse its architecture.

Check and fix the existing:
- frontend/src/api/auth.js
- frontend/src/pages/LoginPage.jsx
- frontend/src/pages/LoginPage.css
- backend/auth/schema.py
- backend/auth/service.py
- backend/auth/router.py
- backend/main.py
- existing Supabase migrations
- existing Farmer authentication/profile implementation

Do NOT create duplicate auth/profile systems.

Do NOT break the existing Swagger API functionality.

Do NOT fake registration success on the frontend.

The final source of truth must be Supabase.

TEST ALL FIVE PUBLIC ROLES:
- Farmer registration
- FPO registration
- Buyer registration
- Logistics Partner registration
- Storage Partner registration

For each one verify:
Auth user created
→ profiles row created
→ correct role
→ correct AARTH ID
→ correct profile data
→ success modal
→ correct dashboard redirect
→ logout
→ login again
→ correct role/dashboard restored.

Also test:
- duplicate username
- invalid credentials
- invalid role
- missing profile
- API failure
- Supabase failure
- Admin registration blocked

IMPORTANT:
Do not proceed into Lots, Matching, Offers, Logistics workflows, Market Intelligence, AI, etc.

This task is ONLY:
AUTHENTICATION FIX + BASIC PROFILE + ROLE-BASED DASHBOARD FOUNDATION.

Use the attached reference image as the visual target and make each role feel like the same AARTH product with its own role-specific identity.
IMPLEMENT THE LOGISTICS PARTNER PROFILE + GSTIN VERIFICATION FOR AARTH.

IMPORTANT:
You already know the existing AARTH project structure and architecture.

DO NOT start from Phase 0.
DO NOT rebuild the project.
DO NOT redesign the entire application.
DO NOT modify authentication, registration, login, role selection, Farmer Dashboard, Farmer Profile, Farmer Lot Creation, Lot Evidence, Buyer Profile, Buyer Requirements, Market Intelligence, S3/photo evidence, QR logic, or any other existing functionality.

This task is ONLY for:
1. Logistics Partner Profile
2. Logistics Partner GSTIN verification
3. Logistics Partner service/capability information
4. Logistics vehicle information structure/UI
5. Related backend/database/API integration required for the above

Before changing anything:
- Inspect the existing Logistics Dashboard/Profile implementation.
- Inspect the existing Farmer Profile implementation.
- Inspect the existing Buyer Profile implementation.
- Inspect the existing Farmer Lot Creation location implementation.
- Inspect the existing database schema/migrations for logistics_partners and related profile tables.
- Inspect existing API/router/service conventions.
- Inspect existing navbar/dashboard layout conventions.
- Reuse existing components, utilities, validation, location masters, auth/session handling and styling wherever possible.
- Do not create duplicate architecture if something already exists.

The latest existing code/schema is authoritative.

==================================================
1. LOGISTICS PROFILE GOAL
==================================================

The current Logistics Profile is too basic.

The current UI contains basic fields such as:
- Business name
- Phone
- District
- City/town
- Service area
- Vehicle details
- Typical capacity

Replace/extend this into a proper professional AARTH Logistics Partner Profile.

The profile should collect enough information for AARTH to understand:
- who the logistics partner is
- where they operate
- what transport capability they have
- what agricultural commodities/cargo they handle
- how they can support farm-to-market movement
- whether their business identity has been GST-verified
- what vehicles they operate

Do NOT overcollect unnecessary KYC or financial information.

==================================================
2. PROFILE STRUCTURE
==================================================

Use a multi-step profile flow similar in quality and interaction to the existing Farmer and Buyer profiles.

STEP 1 — BUSINESS IDENTITY

Required fields:

- Business / Operator Name *
- Logistics Partner Type *
- Contact Person Name *
- Primary Mobile Number *
- Email Address *
- Business Address *
- State *
- District *
- City / Town *
- PIN Code *

Logistics Partner Type options:

- Fleet Owner
- Transport Company
- Individual Truck Owner
- Transport Operator
- Broker / Transport Agent
- Cooperative / FPO Transport Unit
- Other

Do not invent additional unnecessary categories.

Use existing AARTH validation and form conventions wherever possible.

Phone number should use the existing authentication/profile phone where appropriate instead of forcing unnecessary duplicate entry.

If the logged-in user's existing phone/email/profile data is available, reuse/autofill it where appropriate.

Do not create duplicate profile records.

==================================================
3. STEP 2 — SERVICE NETWORK
==================================================

Collect:

- Primary Operating District *
- Service Coverage *
- Maharashtra Districts Served
- Common Transport Routes
- Operating Availability
- Typical Notice Period

Examples of availability:

- On demand
- Scheduled
- Weekdays
- Weekends
- 24/7

Typical notice period:

- Same day
- Within 24 hours
- 1–2 days
- 3+ days

Do not make every optional field mandatory.

IMPORTANT LOCATION REQUIREMENT:

DO NOT build a new location system.

Find the exact location/district/state/taluka/city/location code already used in the EXISTING FARMER LOT CREATION FLOW.

Reuse/adapt that existing location implementation.

Use the same:
- location masters
- district data
- state data
- selectors
- validation
- location utility functions
- API endpoints
- storage conventions

Do NOT create another duplicate Maharashtra district list.

If Farmer Lot Creation already has a reusable location component/helper/service, extract/reuse it rather than duplicating its logic.

The Logistics Profile should use the same location conventions as Farmer Lot Creation so that later matching between:
Farmer Lot → Logistics Partner
works consistently.

==================================================
4. STEP 3 — TRANSPORT CAPABILITY
==================================================

Collect:

- Vehicle Types *
- Typical Load Capacity *
- Agricultural Commodities Handled
- Cargo Types
- Special Handling
- Loading / Unloading Support

Vehicle types can include:

- Mini Truck
- Pickup
- LCV
- Medium Goods Vehicle
- Heavy Goods Vehicle
- Truck
- Trailer
- Refrigerated Vehicle
- Insulated Vehicle
- Other

Capacity:
- value
- unit

Reuse the existing AARTH quantity/unit conventions where possible.

Agricultural Commodities:
REUSE the SAME commodity master already used by Farmer Lot Creation and Buyer Requirements.

Do NOT create another commodity list.

Cargo types can include:

- Bagged
- Crated
- Bulk
- Loose Agricultural Produce
- Grains / Cereals
- Perishable Produce

Special handling:

- Covered
- Ventilated
- Insulated
- Refrigerated
- Temperature Sensitive
- Fragile
- None

Loading/unloading:

- Driver only
- Driver + Helper
- Loading assistance
- Unloading assistance
- Both loading and unloading assistance

Keep the UI practical and easy to understand.

Do not make this look like a highly technical fleet-management system.

==================================================
5. STEP 4 — GSTIN BUSINESS VERIFICATION
==================================================

This is an IMPORTANT part of this task.

I have already created the GSTIN API key and added it to the backend environment file.

DO NOT ask me to add another API key.

DO NOT put the API key anywhere in React/frontend code.

DO NOT expose the API key in browser requests.

The API key must remain server-side.

Environment variable:

GSTIN_API_KEY

The backend must read it using the existing environment configuration conventions.

==================================================
6. GSTIN API
==================================================

Use this provider:

https://www.gstinapi.in

Endpoint:

GET https://www.gstinapi.in/v1/gstin/{GSTIN}

Authentication header:

x-api-key: <GSTIN_API_KEY>

Use the following GSTIN verification service implementation as the basis.

DO NOT blindly duplicate existing code if an equivalent verification service already exists.
If no equivalent exists, create a clean reusable service following existing AARTH backend conventions.

CODE:

import os
import re
from typing import Any, Dict

import httpx


GSTIN_API_BASE_URL = "https://www.gstinapi.in"

GSTIN_PATTERN = re.compile(
    r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$"
)

CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"


def normalize_gstin(gstin: str) -> str:
    if not gstin:
        return ""

    return (
        gstin
        .strip()
        .replace(" ", "")
        .replace("-", "")
        .upper()
    )


def validate_gstin_checksum(gstin: str) -> bool:
    gstin = normalize_gstin(gstin)

    if len(gstin) != 15:
        return False

    total = 0

    for index, character in enumerate(gstin[:14]):
        try:
            value = CHARSET.index(character)
        except ValueError:
            return False

        factor = 1 if index % 2 == 0 else 2

        product = value * factor

        total += (product // 36) + (product % 36)

    expected_value = (36 - (total % 36)) % 36

    return CHARSET[expected_value] == gstin[14]


def validate_gstin_format(gstin: str) -> Dict[str, Any]:
    gstin = normalize_gstin(gstin)

    if len(gstin) != 15:
        return {
            "valid": False,
            "stage": "FORMAT",
            "message": "GSTIN must contain exactly 15 characters.",
        }

    if not GSTIN_PATTERN.fullmatch(gstin):
        return {
            "valid": False,
            "stage": "FORMAT",
            "message": "Invalid GSTIN format.",
        }

    if not validate_gstin_checksum(gstin):
        return {
            "valid": False,
            "stage": "CHECKSUM",
            "message": "GSTIN checksum is invalid.",
        }

    return {
        "valid": True,
        "stage": "FORMAT",
        "message": "GSTIN format and checksum are valid.",
        "gstin": gstin,
    }


async def verify_gstin(gstin: str) -> Dict[str, Any]:
    validation = validate_gstin_format(gstin)

    if not validation["valid"]:
        return {
            "success": False,
            "verification_status": "FORMAT_INVALID",
            "message": validation["message"],
        }

    gstin = validation["gstin"]

    api_key = os.getenv("GSTIN_API_KEY")

    if not api_key:
        return {
            "success": False,
            "verification_status": "API_NOT_CONFIGURED",
            "message": "GST verification service is not configured.",
        }

    url = f"{GSTIN_API_BASE_URL}/v1/gstin/{gstin}"

    headers = {
        "x-api-key": api_key,
        "Accept": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                url,
                headers=headers,
            )

    except httpx.TimeoutException:
        return {
            "success": False,
            "verification_status": "TIMEOUT",
            "message": "GST verification service timed out.",
        }

    except httpx.RequestError:
        return {
            "success": False,
            "verification_status": "PROVIDER_UNAVAILABLE",
            "message": "GST verification service is currently unavailable.",
        }

    if response.status_code == 401:
        return {
            "success": False,
            "verification_status": "API_AUTH_ERROR",
            "message": "GST verification API authentication failed.",
        }

    if response.status_code == 429:
        return {
            "success": False,
            "verification_status": "RATE_LIMITED",
            "message": "GST verification rate limit reached. Please try again later.",
        }

    if response.status_code == 402:
        return {
            "success": False,
            "verification_status": "CREDITS_EXHAUSTED",
            "message": "GST verification credits are exhausted.",
        }

    if response.status_code == 502:
        return {
            "success": False,
            "verification_status": "PROVIDER_UNAVAILABLE",
            "message": "GST provider is temporarily unavailable.",
        }

    try:
        payload = response.json()
    except ValueError:
        return {
            "success": False,
            "verification_status": "INVALID_PROVIDER_RESPONSE",
            "message": "Invalid response received from GST provider.",
        }

    if not payload.get("success"):
        return {
            "success": False,
            "verification_status": "NOT_VERIFIED",
            "message": payload.get(
                "error",
                "GSTIN could not be verified."
            ),
        }

    data = payload.get("data") or {}

    return {
        "success": True,
        "verification_status": "LIVE_VERIFIED",
        "gstin": data.get("gstin") or gstin,

        "legal_name": data.get("legal_name"),
        "trade_name": data.get("trade_name"),
        "registration_status": data.get("status"),
        "taxpayer_type": data.get("taxpayer_type"),
        "business_constitution": data.get("business_constitution"),

        "registration_date": data.get("registration_date"),
        "cancellation_date": data.get("cancellation_date"),

        "state_code": data.get("state_code"),
        "state_jurisdiction": data.get("state_jurisdiction"),

        "address": data.get("address"),
        "city": data.get("city"),
        "address_details": data.get("address_details"),

        "credits_remaining": payload.get("credits_remaining"),
        "response_ms": payload.get("response_ms"),
    }

==================================================
7. FASTAPI GSTIN ENDPOINT
==================================================

Create/reuse an appropriate backend verification router.

Do NOT create another FastAPI application.

Expected endpoint:

POST /api/verification/gstin

Request:

{
    "gstin": "27XXXXXXXXXXXXZ5"
}

The endpoint should:
1. Normalize GSTIN
2. Validate format
3. Validate checksum
4. Call gstinapi.in
5. Return normalized verification information
6. Never expose API key
7. Handle API errors cleanly

Use the existing AARTH backend authentication/authorization conventions.

A logged-in logistics partner should only be able to update/check their own profile context.

Do not allow arbitrary profile modification through the verification endpoint.

==================================================
8. GSTIN UI
==================================================

Add a dedicated Business Verification section.

UI:

GSTIN
[ Enter GSTIN                    ]

[ Verify GSTIN ]

Before verification:
- neutral input state

During verification:
- loading state
- "Verifying GSTIN..."

Successful:

✓ GSTIN Verified

Legal Business Name
ABC Logistics Pvt. Ltd.

Trade Name
ABC Logistics

Registration Status
Active

Taxpayer Type
Regular

Registered State
Maharashtra

Registration Date
01/07/2017

Do not display fake data.

The returned API values must be used.

The verified legal name may be offered as an autofill suggestion for Business / Operator Name.

DO NOT silently overwrite user-entered profile data.

Provide a clear way to use the verified business name.

If verification fails:
- show clear error
- retain entered GSTIN
- allow retry
- do not mark the partner verified

Possible backend statuses:

FORMAT_INVALID
CHECKSUM_INVALID
LIVE_VERIFIED
NOT_VERIFIED
API_NOT_CONFIGURED
API_AUTH_ERROR
PROVIDER_UNAVAILABLE
RATE_LIMITED
CREDITS_EXHAUSTED
TIMEOUT
INVALID_PROVIDER_RESPONSE

Do not collapse every failure into "Invalid GSTIN".

==================================================
9. GST VERIFICATION STORAGE
==================================================

Inspect the existing logistics schema first.

If suitable existing fields do not exist, add only the necessary fields.

Prefer explicit columns over a giant JSON object.

Store at minimum:

- gstin
- gstin_verification_status
- gstin_verified_at
- gstin_legal_name
- gstin_trade_name
- gstin_registration_status
- gstin_taxpayer_type
- gstin_registered_state
- gstin_registration_date
- gstin_verification_provider

Do not store the API key in the database.

Do not store unnecessary raw API responses unless the existing architecture requires it.

==================================================
10. STEP 5 — VEHICLES
==================================================

Vehicles MUST remain separate from the logistics partner profile.

One logistics partner can own/manage multiple vehicles.

Inspect the existing "My Vehicles" route/page before changing anything.

If a proper vehicle structure already exists:
- reuse it
- improve it only where required for this profile

If it does not exist sufficiently, implement the minimum required structure.

Each vehicle:

- Registration Number *
- Vehicle Type *
- Capacity *
- RC document
- Insurance document
- Fitness document
- PUC document
- Goods Carriage Permit document

Each document must have its own status.

Possible document statuses:

NOT_SUBMITTED
SUBMITTED
UNDER_REVIEW
VERIFIED
REJECTED
EXPIRED

IMPORTANT:
Document upload is NOT the same as document verification.

Do not claim a vehicle is verified merely because files were uploaded.

Do not implement automatic government vehicle verification unless an existing authorized API is already present in AARTH.

==================================================
11. DATABASE DESIGN
==================================================

Before changing the database:
- inspect existing migrations
- inspect logistics_partners
- inspect profile tables
- inspect My Vehicles tables
- inspect RLS policies
- inspect naming conventions
- inspect existing IDs and relationships

Do not blindly create duplicate tables.

Conceptually the architecture should be:

logistics_partners
    │
    ├── logistics profile
    │
    ├── service areas / capabilities
    │
    └── logistics_vehicles
            │
            └── vehicle documents

Use the existing AARTH conventions wherever possible.

Ensure:
- ownership checks
- RLS where applicable
- authenticated access
- no cross-user profile editing

==================================================
12. UI / DESIGN REQUIREMENTS
==================================================

THIS IS VERY IMPORTANT.

Use the existing Farmer and Buyer Dashboard/Profile UI as the visual and structural reference.

The screenshot attached to this task is the CURRENT Logistics Profile.

The current screenshot has a vertical left sidebar and a relatively narrow central form.

DO NOT keep the old narrow/empty layout.

The new Logistics Profile should follow the SAME overall dashboard standard already established for Farmer and Buyer:

- horizontal top navbar
- full-width dashboard content
- professional rectangular dashboard layout
- no large blank left/right spaces
- no narrow form floating in the middle
- profile content should use the full available dashboard width
- consistent spacing
- same general typography scale
- same professional form density
- same card treatment
- same responsiveness
- same visual polish
- same header/hero treatment quality

However:

DO NOT simply copy the Farmer or Buyer colors.

Give Logistics its own professional logistics/transport visual identity while still feeling like the same AARTH product.

Use:
- sophisticated logistics/transport visual language
- subtle neutral/slate/blue/orange accents where appropriate
- professional agricultural supply-chain feel
- restrained gradients
- clean cards
- subtle shadows
- clear section hierarchy

Do NOT use:
- neon colors
- excessive gradients
- oversized text
- childish truck graphics
- excessive animations
- AI-looking decorative graphics
- huge empty areas

==================================================
13. PAGE WIDTH / LAYOUT
==================================================

The profile must cover the full usable dashboard area like the existing Farmer and Buyer dashboards.

The hero/profile area must span the available content width.

Do not leave large blank white spaces on the left or right.

Use the same content-width/container strategy already used by Farmer and Buyer.

The main form and supporting profile-readiness/verification cards should be balanced across the page.

Example structure:

--------------------------------------------------
AARTH TOP NAVBAR
--------------------------------------------------

Welcome / Logistics Profile Hero
--------------------------------------------------

Profile progress / readiness

--------------------------------------------------
| Main Profile Form                    | Summary |
|                                     | /Status |
| Step 1                              |         |
| Step 2                              |         |
| Step 3                              |         |
| Step 4 GST Verification             |         |
--------------------------------------------------

My Vehicles / vehicle summary

--------------------------------------------------

Do not literally reproduce this ASCII layout.
Use the existing Farmer/Buyer layout system.

==================================================
14. NAVBAR
==================================================

Use the existing horizontal navbar pattern from Farmer and Buyer.

Do not retain the current vertical sidebar as the primary navigation if Farmer/Buyer already use the horizontal navbar pattern.

Existing Logistics navigation should remain logically equivalent.

Possible navigation:

Home
Profile
Transport Requests
My Vehicles
Active Trips
History
Support

Preserve existing routes and functionality.

Do NOT break existing navigation paths.

==================================================
15. PROFILE READINESS
==================================================

Replace the current simplistic "0 of 7 required fields" logic with readiness based on the actual required profile fields.

Required business profile completion should consider:

Business / Operator Name
Partner Type
Contact Person
Primary Mobile
Email
Business Address
State
District
City / Town
PIN
Primary Operating District
Service Coverage
Vehicle Types
Typical Capacity

GSTIN verification should NOT be treated as a normal required field unless the existing business rules explicitly require it.

Instead show it as a separate verification/readiness item:

Business Profile
✓ Complete

GSTIN Verification
✓ Verified
or
○ Not verified

Vehicle Verification
○ Not submitted
or
◐ Partially verified
or
✓ Complete

Do not use red for ordinary incomplete profile states.

Use neutral/amber for incomplete/action-needed states, consistent with Farmer/Buyer design.

==================================================
16. PROFILE SAVE / DRAFT / REVIEW
==================================================

Keep the existing AARTH profile workflow style:

- Save as Draft
- Save & Continue
- Review
- Publish / Complete Profile

Do not create duplicate save mechanisms.

On save:
- preserve the same profile ID
- update the existing profile
- do not create duplicate records

On reload:
- existing saved data must reappear.

On logout/login:
- profile data must persist.

==================================================
17. AUTOFILL
==================================================

Reuse existing authenticated user data where available.

Examples:

Phone:
- use existing authenticated profile phone if available

Email:
- use existing account/profile email if available

Location:
- use existing AARTH location architecture

GSTIN:
- after successful verification, allow verified legal/trade name to populate business identity

Do not ask the user to repeatedly enter information AARTH already has.

==================================================
18. DO NOT ADD THESE
==================================================

Do NOT add:

- Bank account
- UPI
- Payment preference
- Driver Aadhaar
- Full Aadhaar
- Financial information
- Fuel consumption
- Profitability
- GPS tracking
- Live vehicle tracking
- Blockchain
- IoT
- RFID
- E-way bill generation
- E-invoice generation
- GST return compliance scoring
- AI trust score
- AI risk score
- Freight rate prediction
- S5 matching
- Farmer matching
- Route optimization
- Transaction system
- Payment system

Those belong to later stages or are unnecessary for this profile.

==================================================
19. VERY IMPORTANT — DO NOT DISTURB EXISTING LOGIC
==================================================

Do not modify:

AUTHENTICATION
REGISTRATION
LOGIN
ROLE SELECTION
SUPABASE AUTH
FARMER PROFILE
FARMER LOT CREATION
LOT PHOTO EVIDENCE
GPS CAPTURE
S3/STORAGE
FARMER DIGITAL CARD
QR
BUYER PROFILE
BUYER REQUIREMENTS
MARKET INTELLIGENCE
EXISTING MATCHING PREPARATION
OTHER ROLE DASHBOARDS
EXISTING API CONTRACTS UNRELATED TO LOGISTICS
EXISTING ROUTES UNRELATED TO LOGISTICS

Only make changes required for:
- Logistics Profile
- Logistics GST verification
- Logistics Service/Capability data
- Logistics Vehicles
- Supporting database/API changes

If a shared component must be changed, first verify that the change will not alter existing Farmer/Buyer behaviour.

Prefer logistics-specific adaptation over changing shared components globally.

==================================================
20. ERROR HANDLING
==================================================

Handle properly:

- Invalid GSTIN format
- Invalid checksum
- GSTIN not found
- Inactive/cancelled GSTIN
- API key missing
- API authentication error
- API timeout
- Provider unavailable
- Rate limit
- Credits exhausted
- Network failure
- Backend validation failure
- Session expiration
- Unauthorized profile access

Never expose:
- API key
- stack traces
- internal backend errors
- provider credentials

to the frontend.

==================================================
21. TESTING
==================================================

After implementation:

1. Run frontend build.
2. Run backend.
3. Test Logistics Profile load.
4. Test creating/updating profile.
5. Test refresh persistence.
6. Test authenticated ownership.
7. Test GSTIN format validation.
8. Test checksum validation.
9. Test GSTIN API integration.
10. Test provider failure.
11. Test API key missing.
12. Test rate limit handling.
13. Test vehicle creation.
14. Test vehicle document status.
15. Test navigation.
16. Confirm Farmer functionality still works.
17. Confirm Buyer functionality still works.
18. Confirm login/registration still works.

Use the provider's documented test GSTIN if available:

00AAAAA0000A1ZT

Do not consume unnecessary API credits during testing.

==================================================
22. FINAL IMPLEMENTATION STANDARD
==================================================

The final Logistics Profile should feel like a real AARTH product module, not a generic CRUD form.

It should communicate:

WHO is the logistics partner?
WHERE do they operate?
WHAT can they transport?
HOW much can they transport?
WHAT agricultural cargo can they handle?
IS the business GSTIN verified?
WHAT vehicles are available?
WHAT vehicle documents have been submitted/verified?

The result must be:
- professional
- practical for Maharashtra logistics partners
- mobile responsive
- desktop responsive
- consistent with Farmer and Buyer dashboards
- full-width
- clean
- easy to understand
- ready for future logistics matching

MOST IMPORTANT:

INSPECT FIRST.
REUSE EXISTING AARTH LOGIC.
DO NOT BREAK ANYTHING OUTSIDE THIS TASK.
DO NOT REBUILD AUTH OR REGISTRATION.
DO NOT CREATE DUPLICATE LOCATION OR COMMODITY SYSTEMS.
DO NOT EXPOSE THE GST API KEY.
DO NOT IMPLEMENT S5 MATCHING.
DO NOT IMPLEMENT UNRELATED FEATURES.

After completing the implementation, provide a concise summary of:
1. files changed
2. database changes
3. API endpoints added/changed
4. GST verification flow
5. profile fields added
6. vehicle structure added/changed
7. tests/build results
8. any issue that still requires manual action
AARTH — S4 BUYER REQUIREMENT IMPLEMENTATION
FINAL IMPLEMENTATION PROMPT

IMPORTANT:
You are continuing work on the existing AARTH project.

The Buyer Profile has already been implemented.

Now implement S4 — BUYER REQUIREMENT.

Treat the CURRENT AARTH codebase as the source of truth.

DO NOT rebuild existing functionality.

DO NOT disturb existing logic.

============================================================
1. FIRST — INSPECT THE EXISTING PROJECT
============================================================

Before making any changes, inspect:

1. Current Buyer Dashboard
2. Current Buyer Profile
3. Current Buyer Profile data/model/API
4. Current horizontal Buyer navbar
5. Existing My Requirements navigation item
6. Existing BuyerRequirementPage.jsx
7. Existing buyer_demand backend folder
8. Existing buyer requirement model/schema/router
9. Existing Farmer Lot Creation
10. Existing Farmer Lot database model/schema
11. Existing Farmer location implementation
12. Existing commodity master/data
13. Existing quantity/unit conversion logic
14. Existing profile readiness/save/review/publish patterns
15. Existing Supabase/RLS/authentication
16. Existing API patterns

Understand the existing architecture before changing anything.

Do not assume that a file is empty just because its name suggests it is a placeholder.

============================================================
2. ABSOLUTE RULE — DO NOT DISTURB EXISTING LOGIC
============================================================

This is an incremental implementation.

DO NOT modify or break:

- Authentication
- Supabase Auth
- Login
- Signup
- Role selection
- Farmer Dashboard
- Farmer Profile
- Farmer Lot Creation
- Farmer Lot listing
- Farmer Lot editing
- Farmer photo evidence
- S3 evidence logic
- GPS/photo evidence logic
- Farmer Digital Card
- Farmer QR
- Farmer location implementation
- Market Intelligence
- Existing Buyer Profile
- Existing Buyer Profile save/review/publish flow
- Existing Buyer authentication
- Existing navigation logic except what is strictly required to make My Requirements functional
- Existing APIs unrelated to Buyer Requirement
- Existing database functionality unrelated to Buyer Requirement

DO NOT perform broad refactoring.

DO NOT rewrite working components.

DO NOT rename files unnecessarily.

DO NOT replace React/Vite.

DO NOT replace FastAPI.

DO NOT introduce React Native.

DO NOT introduce another frontend framework.

DO NOT introduce a second commodity system.

DO NOT introduce a second location system.

DO NOT modify Farmer Lot Creation just to implement Buyer Requirement.

If existing code can be reused safely, reuse it.

If new code is required, keep it isolated to the Buyer Requirement functionality.

============================================================
3. MY REQUIREMENTS MUST BE ACCESSIBLE FROM THE NAVBAR
============================================================

The Buyer Dashboard already uses a HORIZONTAL TOP NAVBAR.

KEEP THE NAVBAR HORIZONTAL.

DO NOT introduce a vertical sidebar.

The navigation should include:

Home
Profile
Search Produce
My Requirements
Orders
Supplier Network
Market Insights
Support

The exact existing navigation structure should be preserved.

The "My Requirements" item must become fully functional.

When the buyer clicks:

My Requirements

it should navigate to the Buyer Requirements page.

Use the existing routing architecture.

Do not create a second routing system.

============================================================
4. MY REQUIREMENTS PAGE
============================================================

Create a professional Buyer Requirements management page.

The page should clearly communicate:

MY REQUIREMENTS

Subtitle:

Manage your active sourcing requirements and create new requirements for agricultural produce.

Primary action:

[ + Create Requirement ]

The page should show the buyer's existing requirements.

Separate them logically into:

ACTIVE
DRAFT
PAUSED
FULFILLED
CANCELLED

Do not show empty sections unnecessarily.

If there are no requirements:

Show a professional empty state:

No active requirements yet.

Create a requirement to tell AARTH what produce you need.

[ + Create Requirement ]

============================================================
5. REQUIREMENT ID
============================================================

Every Buyer Requirement must have its own unique human-readable ID.

Use a format compatible with AARTH conventions.

Example:

BR-MH-000001

Do not hardcode this.

Generate/store it according to the existing AARTH ID generation conventions if such a mechanism exists.

A requirement ID is different from:

- AARTH ID
- Buyer ID
- Profile ID

A single buyer must be able to create MULTIPLE requirements.

============================================================
6. CREATE REQUIREMENT
============================================================

When the buyer clicks:

[ + Create Requirement ]

open the Buyer Requirement creation flow.

The form should be professional, clean, fast and easy to understand.

Do not make it unnecessarily complicated.

Use a multi-step structure if that matches the existing AARTH UX architecture.

Recommended steps:

1. Produce
2. Quantity & Quality
3. Delivery
4. Preferences
5. Review & Publish

The user should always understand where they are in the process.

============================================================
7. IMPORTANT — AUTOFILL FROM BUYER PROFILE
============================================================

This is VERY IMPORTANT.

Do NOT make the buyer enter information that AARTH already knows from their Buyer Profile.

Just like the Farmer workflow reuses existing farmer information, Buyer Requirement should intelligently reuse Buyer Profile information.

Before building this, inspect exactly how the Farmer Lot Creation autofills/reuses farmer profile information.

Use the SAME GENERAL APPROACH.

Do not duplicate profile data unnecessarily.

------------------------------------------------------------
AUTOFILL THESE WHERE AVAILABLE:
------------------------------------------------------------

A. BUYER / BUSINESS IDENTITY

The requirement should automatically know:

- authenticated buyer
- buyer_id
- business/organization name
- buyer type
- contact identity if required internally

Do NOT ask the buyer to manually type their business name again.

These should come from the authenticated buyer/profile.

------------------------------------------------------------
B. OPERATING / PROCUREMENT LOCATION
------------------------------------------------------------

If the Buyer Profile already contains:

Operating / Procurement Location

use it as the DEFAULT delivery/receiving location for a new requirement.

Example:

Buyer Profile:

Operating / Procurement Location:
Nashik, Maharashtra

New Requirement:

Delivery / Receiving Location:
[ Nashik, Maharashtra ✓ ]

Show a small option:

Using your procurement location from Buyer Profile.

[ Change Location ]

The buyer must still be able to change the requirement's delivery location.

IMPORTANT:

The profile location is a DEFAULT/PREFILL.

It is NOT permanently locked.

------------------------------------------------------------
C. USUAL COMMODITIES
------------------------------------------------------------

If the Buyer Profile contains:

"What produce do you usually source?"

use those commodities as suggested/preferred options in the requirement.

Example:

Buyer Profile sourcing preferences:

Onion
Potato
Tomato

New Requirement:

Commodity *

[ Onion ]
[ Potato ]
[ Tomato ]

Other commodities can still be searched/selected from the SAME AARTH commodity master.

Do not automatically create a requirement merely because a commodity exists in the profile.

The buyer must explicitly choose the commodity for this requirement.

------------------------------------------------------------
D. PREFERRED SOURCING REGION
------------------------------------------------------------

If Buyer Profile contains preferred sourcing regions, use them as contextual preferences where useful.

Do NOT automatically make them hard constraints.

Do NOT prevent the buyer from selecting other locations.

============================================================
8. REQUIREMENT SECTION 1 — PRODUCE
============================================================

FIELD:

Commodity *

Use the SAME commodity master used by Farmer Lot Creation.

This is critical.

Do NOT create:

buyer_commodities

or a separate crop list if an existing AARTH commodity master already exists.

The Buyer Requirement commodity identifier must be compatible with the Farmer Lot commodity identifier.

UI:

Commodity *

[ Search / Select commodity ]

Show profile-based suggestions first if available.

Example:

Suggested from your sourcing profile:

[ Onion ] [ Potato ] [ Tomato ]

Then:

Search all commodities

[ Search commodity... ]

------------------------------------------------------------

VARIETY

Variety should be OPTIONAL.

UI:

Variety

[ Any variety ▼ ]

Options should be based on existing AARTH commodity/lot data where available.

Do not force the buyer to know or select a variety.

============================================================
9. REQUIREMENT SECTION 2 — QUANTITY
============================================================

Required Quantity *

Example:

[ 20 ] [ Tonnes ▼ ]

Use the SAME unit system used by Farmer Lot Creation.

Support the units already supported by the Farmer Lot implementation.

Internally maintain normalized quantity if the Farmer Lot architecture already uses normalized kilograms.

For example:

quantity
quantity_unit
quantity_kg

Do not create a second quantity conversion system.

Validation:

- quantity must be greater than zero
- valid numeric value
- valid unit

============================================================
10. QUALITY REQUIREMENTS
============================================================

IMPORTANT:

DO NOT INCLUDE MOISTURE.

Do not add a moisture field.

Do not add:

max_moisture

Do not create a moisture input anywhere in this requirement flow.

Keep quality requirements practical and compatible with the existing Farmer Lot structure.

Include:

QUALITY GRADE

[ Any ▼ ]

Use the existing Farmer Lot grade values where possible.

------------------------------------------------------------

PREFERRED SIZE / CALIBRE

[ Optional ]

Use the existing Farmer Lot size/calibre concept where available.

------------------------------------------------------------

OTHER QUALITY REQUIREMENTS

[____________________________________________]
[____________________________________________]

Example placeholder:

Fresh, uniform size, no visible damage.

This should remain a free-text supplementary requirement.

Do NOT create a huge technical laboratory-quality form.

Do NOT make the buyer enter technical parameters they may not know.

============================================================
11. DELIVERY / RECEIVING LOCATION
============================================================

This is a CORE AARTH requirement.

The buyer needs to specify where the produce should be delivered/received.

Use the SAME LOCATION CODE/COMPONENT/LOGIC already used in:

FARMER LOT CREATION.

Do NOT build a new location picker.

Do NOT create a second location API.

Do NOT create a different latitude/longitude structure.

Reuse/adapt the Farmer Lot location implementation.

The Buyer Requirement delivery location should be structurally compatible with:

Farmer Lot pickup location.

Conceptually:

FARMER LOT
pickup_latitude
pickup_longitude

        ↓

S5 DISTANCE MATCHING

        ↑

BUYER REQUIREMENT
delivery_latitude
delivery_longitude

------------------------------------------------------------

If Buyer Profile has an Operating / Procurement Location:

AUTOFILL IT.

Example:

Delivery / Receiving Location

✓ Nashik, Maharashtra

Using your operating/procurement location

[ Change Location ]

The buyer can select another location.

Store appropriate location information according to the existing location architecture:

- delivery_location
- district
- taluka if supported
- city/town
- latitude
- longitude

Do not expose raw coordinates to the normal user unless the existing location UI does so.

============================================================
12. DELIVERY WINDOW
============================================================

Do NOT use only a single "required_by" field if the existing architecture can support a range.

Use:

Delivery From *

[ Date ]

Delivery By *

[ Date ]

Example:

25 Sep 2026 → 30 Sep 2026

This should eventually correspond with Farmer Lot availability:

Farmer Lot:
available_from
pickup_until

Buyer Requirement:
delivery_start_date
delivery_end_date

Validation:

- delivery_from cannot be after delivery_by
- dates must be valid
- do not allow invalid past dates according to the project's existing business rules

============================================================
13. PACKAGING REQUIREMENT
============================================================

Optional.

Packaging Requirement

[ No specific requirement ▼ ]

Possible options should remain simple and relevant.

For example:

- No specific requirement
- Bulk / Loose
- Bags
- Crates
- Other

Do not make packaging mandatory.

Do not invent a huge packaging specification system.

============================================================
14. TARGET BUYING PRICE
============================================================

Include an OPTIONAL target buying price.

Example:

Target Buying Price

₹ [________] per [ Quintal ▼ ]

Allow:

[ ] Open to market-based pricing

This field is optional.

The buyer must be able to publish a requirement without specifying a target price.

Do not add payment methods.

Do not add bank details.

Do not add payment preferences.

This is only a sourcing price preference.

============================================================
15. ADDITIONAL REQUIREMENTS
============================================================

Include:

Additional Requirements

[____________________________________________]
[____________________________________________]
[____________________________________________]

This allows the buyer to provide additional context.

Example placeholder:

"Prefer consistent quality suitable for retail distribution."

Do not use this field as a hard matching rule in S4.

S5 can later decide whether/how to use structured or textual requirements.

============================================================
16. REQUIREMENT REVIEW
============================================================

Before publishing, show a clean Review Requirement page/card.

Example:

REVIEW REQUIREMENT

Requirement ID
BR-MH-000124

Produce
Onion

Variety
Any variety

Required Quantity
20 Tonnes

Quality Grade
Grade A

Size / Calibre
55–70 mm

Delivery Location
Nashik, Maharashtra

Delivery Window
25 Sep – 30 Sep 2026

Packaging
Crates

Target Buying Price
₹2,800 / Quintal

Additional Requirements
Fresh, uniform size.

Then:

[ Edit ]

[ Save as Draft ]

[ Publish Requirement ]

Do not allow publishing if required information is incomplete.

============================================================
17. REQUIREMENT STATUS
============================================================

Use a simple requirement lifecycle.

Recommended:

DRAFT
ACTIVE
PAUSED
FULFILLED
CANCELLED

Conceptually:

DRAFT
↓
ACTIVE
↓
PAUSED
↓
ACTIVE

or:

ACTIVE
↓
FULFILLED

or:

ACTIVE
↓
CANCELLED

Do NOT add MATCHING as an S4 status unless the existing architecture already requires it.

Matching belongs to S5.

Do NOT implement S5 matching logic here.

============================================================
18. REQUIREMENT CARD
============================================================

The My Requirements page should show professional cards.

Example:

------------------------------------------------------------

BR-MH-000124
ONION

20 Tonnes
Grade A
Any variety

📍 Nashik, Maharashtra
📅 25 Sep – 30 Sep 2026

● ACTIVE

Created 19 Sep 2026

[ View Requirement ] [ Edit ]

------------------------------------------------------------

Use a clear status badge.

ACTIVE:
green

DRAFT:
neutral/grey

PAUSED:
yellow/amber

FULFILLED:
appropriate completed state

CANCELLED:
muted state

Do not use aggressive red for ordinary status states.

============================================================
19. HERO SECTION — VERY IMPORTANT UI REQUIREMENT
============================================================

The Buyer Requirement page must use the FULL AVAILABLE RECTANGULAR DASHBOARD SPACE.

DO NOT leave large blank areas on the left or right side of the hero/header section.

The hero section should stretch across the FULL MAIN CONTENT WIDTH beneath the horizontal navbar.

It should not look like a small centered card floating in a huge empty page.

Use a full-width rectangular hero/banner.

Conceptually:

------------------------------------------------------------
|                                                          |
|  MY REQUIREMENTS                     [ + Create ]        |
|                                                          |
|  Manage your sourcing requirements and connect with      |
|  relevant agricultural supply.                            |
|                                                          |
------------------------------------------------------------

The hero/background/image should occupy the full rectangular width of the main dashboard content.

If an agricultural image is used:

- let it extend across the full hero rectangle
- use an elegant gradient/overlay for readability
- do not leave unused white space on either side
- do not create a narrow image strip surrounded by blank space

The hero should feel intentional and balanced.

IMPORTANT:

This does NOT mean making the entire webpage edge-to-edge without margins.

It means:

WITHIN THE DASHBOARD CONTENT CONTAINER,

the hero should use the complete available width.

No awkward left/right empty columns.

============================================================
20. BUYER REQUIREMENT PAGE LAYOUT
============================================================

Recommended structure:

HORIZONTAL TOP NAVBAR
↓
FULL-WIDTH HERO SECTION
↓
REQUIREMENT SUMMARY / FILTER AREA
↓
ACTIVE REQUIREMENT CARDS
↓
DRAFT / PAST REQUIREMENTS

For Create Requirement:

HORIZONTAL TOP NAVBAR
↓
FULL-WIDTH PAGE HEADER
↓
MAIN REQUIREMENT FORM
↓
OPTIONAL RIGHT SUMMARY/HELP PANEL
↓
SAVE / REVIEW / PUBLISH ACTIONS

Do not make the form unnecessarily narrow.

Use the available dashboard width intelligently.

============================================================
21. UI THEME
============================================================

The Buyer Dashboard has its OWN visual identity.

Do NOT copy the Farmer Dashboard's exact colors.

Use a sophisticated light-blue professional theme.

Suggested visual direction:

- soft light blue
- muted blue
- white
- very light blue-grey
- deep navy typography
- subtle blue gradients
- restrained shadows
- clean borders

The UI should feel:

- professional
- trustworthy
- premium
- modern
- agricultural B2B
- business-oriented

Do NOT make it:

- neon blue
- overly saturated
- childish
- overly dark
- visually noisy

The Farmer Dashboard is only inspiration for overall usability and product quality.

Do NOT copy Farmer-specific visual elements.

============================================================
22. NAVBAR
============================================================

KEEP THE BUYER NAVBAR HORIZONTAL.

It must remain at the top.

No vertical sidebar.

The navbar should clearly show:

AARTH
Home
Profile
Search Produce
My Requirements
Orders
Supplier Network
Market Insights
Support

The active page should clearly highlight:

My Requirements

Use the existing Buyer navbar implementation where possible.

Do not modify the Farmer navbar.

============================================================
23. DATABASE
============================================================

Before creating/modifying database structures:

INSPECT THE CURRENT DATABASE.

Do not blindly create a new table.

Check:

- existing buyer_requirement.py
- buyer_demand schemas
- buyer_demand router
- database models
- migrations
- Supabase tables
- existing RLS
- existing Farmer Lot schema
- existing naming conventions

If a buyer_requirements table already exists, extend it safely rather than creating another duplicate table.

The requirement should conceptually contain:

buyer requirement identity:
- id
- requirement_id
- buyer_id

produce:
- commodity_key
- commodity_name
- variety

quantity:
- quantity
- quantity_unit
- quantity_kg

quality:
- quality_grade
- size_calibre
- quality_requirements

delivery:
- delivery_location
- delivery_district
- delivery_taluka if supported
- delivery_city
- delivery_latitude
- delivery_longitude

dates:
- delivery_start_date
- delivery_end_date

commercial preference:
- target_price
- target_price_unit

other:
- packaging_requirement
- additional_requirements

status:
- status

timestamps:
- created_at
- updated_at

DO NOT add:

- max_moisture
- payment_preference
- bank_details
- negotiation_fields
- transaction_fields
- matching_score

============================================================
24. PROFILE AUTOFILL DATA MUST NOT BE DUPLICATED CARELESSLY
============================================================

If profile information is used to initialize the requirement:

DO NOT create unnecessary duplicate profile records.

For example:

buyer_id should reference the authenticated buyer.

The requirement should store its own delivery location because the buyer may later create requirements for different receiving locations.

Similarly:

Buyer Profile:
usual commodities = Onion, Potato

Requirement:
commodity = Onion

The requirement must store the selected commodity explicitly.

Do not make the requirement dynamically depend on the current profile forever.

At creation time, use the profile to PREFILL the form.

Then store the requirement's actual values.

============================================================
25. SECURITY
============================================================

Buyer A must not be able to:

- view private Buyer B requirements
- edit Buyer B requirements
- delete Buyer B requirements
- publish Buyer B requirements

Use:

- Supabase Auth
- buyer ownership
- existing RLS
- FastAPI authentication
- backend authorization

Do not disable RLS.

Do not weaken existing policies.

Backend must verify:

authenticated user
+
buyer role
+
buyer ownership
+
requirement ownership

Do not trust only frontend state.

============================================================
26. API
============================================================

Inspect existing buyer_demand API architecture.

Reuse existing patterns.

Conceptually support:

GET / buyer requirements
GET / buyer requirement by ID
CREATE buyer requirement
UPDATE buyer requirement
SAVE draft
PUBLISH requirement
PAUSE requirement
CANCEL requirement

But if equivalent endpoints already exist, reuse them.

Do not create duplicate endpoints.

The API must validate:

- authenticated buyer
- commodity
- quantity
- unit
- quality values
- delivery location
- delivery dates
- ownership
- status transitions

============================================================
27. S4 MUST NOT IMPLEMENT S5
============================================================

This is extremely important.

S4 is:

WHAT DOES THE BUYER NEED?

S5 is:

WHICH FARMER/FPO LOTS MATCH THAT NEED?

Therefore DO NOT implement:

- matching score
- farmer recommendations
- matched lots
- distance ranking
- aggregation
- best supplier
- AI recommendation
- landed cost
- transport optimization

S4 only collects and stores the buyer's demand correctly.

Prepare the data cleanly for S5.

============================================================
28. S5 COMPATIBILITY
============================================================

Design the requirement data so S5 can later compare it against Farmer Lots.

Farmer Lot:

commodity
variety
quantity
grade
size/calibre
pickup location
available_from
pickup_until
expected_price
packaging
status

Buyer Requirement:

commodity
variety
required quantity
grade
size/calibre
delivery location
delivery_start_date
delivery_end_date
target_price
packaging
status

This is the data contract for future matching.

Do not implement the matching itself.

============================================================
29. AUTOFILL EXAMPLE
============================================================

If Buyer Profile contains:

Business:
ABC Foods

Buyer Type:
Processor / Manufacturer

Operating / Procurement Location:
Nashik, Maharashtra

Usual commodities:
Onion
Potato

Preferred sourcing region:
Maharashtra

Then when the buyer clicks:

+ Create Requirement

the form should open approximately as:

Business:
ABC Foods
        ↓
already known / not manually entered

Commodity:
[ Onion ] [ Potato ] suggested
        ↓
buyer explicitly chooses one

Quantity:
[ ______ ] [ Tonnes ]

Variety:
[ Any variety ]

Quality Grade:
[ Any ]

Size / Calibre:
[ Optional ]

Delivery Location:
[ Nashik, Maharashtra ✓ ]
        ↓
prefilled from Buyer Profile

Delivery From:
[ ______ ]

Delivery By:
[ ______ ]

Packaging:
[ No specific requirement ]

Target Price:
[ Optional ]

Additional Requirements:
[________________________]

This makes the process fast and avoids repetitive data entry.

============================================================
30. EMPTY / LOADING / ERROR STATES
============================================================

Implement proper states.

Loading:

Show professional skeleton/loading state.

Empty:

"No requirements yet."

Error:

"Unable to load your requirements. Please try again."

Save error:

"Unable to save this requirement. Please try again."

Publish error:

"Unable to publish this requirement. Please try again."

Do not expose raw backend/database errors to normal users.

============================================================
31. DRAFT BEHAVIOR
============================================================

The buyer should be able to save incomplete requirements as:

DRAFT

A draft does NOT need all required fields.

However:

PUBLISH

must require all mandatory fields.

Do not confuse Save Draft validation with Publish validation.

============================================================
32. EDIT BEHAVIOR
============================================================

Buyer can edit their own:

DRAFT
ACTIVE
PAUSED

requirements according to the project's status rules.

When editing an existing requirement:

- load existing data
- preserve requirement ID
- do not create a duplicate requirement
- save changes to the same record

Do not accidentally create a new requirement when the user clicks Save on Edit.

============================================================
33. REVIEW / PUBLISH
============================================================

Use the same general UX quality as the Farmer Profile's Review/Publish experience.

Before publish:

validate required fields.

Then show:

Requirement ready to publish.

[ Publish Requirement ]

After successful publish:

show:

✓ Requirement published successfully.

Then return to:

My Requirements

and show:

● ACTIVE

Do not fake successful publication if the backend request failed.

============================================================
34. RESPONSIVE DESIGN
============================================================

Desktop:

- horizontal navbar
- full-width hero
- wide content
- clean requirement cards
- spacious form
- no unnecessary empty areas

Tablet:

- adapt cards
- stack form sections where necessary

Mobile:

- responsive top navigation
- no horizontal overflow
- fields stack vertically
- buttons remain usable
- location picker remains usable
- requirement cards become full width

============================================================
35. FINAL VISUAL TARGET
============================================================

The Buyer Requirement page should conceptually feel like:

------------------------------------------------------------
AARTH NAVBAR
------------------------------------------------------------
AARTH | Home | Profile | Search Produce | My Requirements |
Orders | Supplier Network | Market Insights | Support
------------------------------------------------------------

FULL-WIDTH HERO

┌──────────────────────────────────────────────────────────┐
│                                                          │
│  My Requirements                       + Create Requirement│
│                                                          │
│  Manage your active sourcing requirements and discover   │
│  agricultural supply through AARTH.                     │
│                                                          │
└──────────────────────────────────────────────────────────┘

NO LARGE EMPTY LEFT SPACE.

NO LARGE EMPTY RIGHT SPACE.

The hero should occupy the complete available rectangular
dashboard content area.

------------------------------------------------------------

ACTIVE REQUIREMENTS

┌──────────────────────────────────────────────────────────┐
│ BR-MH-000124                              ● ACTIVE       │
│                                                          │
│ ONION                                                    │
│ 20 Tonnes | Grade A | Any variety                       │
│                                                          │
│ 📍 Nashik, Maharashtra                                  │
│ 📅 25 Sep – 30 Sep 2026                                 │
│                                                          │
│                         [ View ] [ Edit ]                │
└──────────────────────────────────────────────────────────┘

------------------------------------------------------------

DRAFTS / PAST REQUIREMENTS

etc.

============================================================
36. TESTING CHECKLIST
============================================================

After implementation:

1. Run frontend build.
2. Fix all compile/import errors.
3. Verify Buyer Dashboard loads.
4. Verify horizontal navbar works.
5. Verify My Requirements navigation works.
6. Verify Create Requirement works.
7. Verify Buyer Profile data is fetched correctly.
8. Verify profile-based autofill works.
9. Verify operating/procurement location autofills correctly.
10. Verify the buyer can change the delivery location.
11. Verify the location uses the same underlying Farmer Lot location implementation.
12. Verify commodity suggestions come from Buyer Profile.
13. Verify commodity itself uses the existing commodity master.
14. Verify quantity/unit conversion.
15. Verify variety.
16. Verify grade.
17. Verify size/calibre.
18. Verify NO moisture field exists anywhere.
19. Verify delivery dates.
20. Verify packaging.
21. Verify optional target price.
22. Verify additional requirements.
23. Verify Save as Draft.
24. Verify Review.
25. Verify Publish.
26. Verify requirement ID generation.
27. Verify requirement cards.
28. Verify Edit.
29. Verify Pause.
30. Verify Cancel.
31. Verify ownership/security.
32. Verify RLS.
33. Verify backend validation.
34. Verify Farmer Dashboard still works.
35. Verify Farmer Profile still works.
36. Verify Farmer Lot Creation still works.
37. Verify Farmer location logic still works.
38. Verify S3/photo evidence still works.
39. Verify QR/Digital Farmer Card still works.
40. Verify existing authentication still works.
41. Verify no unrelated routes were broken.

============================================================
37. ABSOLUTE FINAL RULE
============================================================

IMPLEMENT ONLY S4 BUYER REQUIREMENT.

DO NOT "IMPROVE" UNRELATED CODE.

DO NOT TOUCH FARMER LOGIC.

DO NOT TOUCH FARMER LOT LOGIC.

DO NOT TOUCH FARMER PHOTO EVIDENCE.

DO NOT TOUCH FARMER QR.

DO NOT TOUCH AUTHENTICATION.

DO NOT TOUCH MARKET INTELLIGENCE.

DO NOT CHANGE BUYER PROFILE LOGIC EXCEPT WHERE A SMALL, NECESSARY INTEGRATION IS REQUIRED FOR AUTOFILL.

DO NOT CREATE DUPLICATE LOCATION LOGIC.

DO NOT CREATE DUPLICATE COMMODITY LOGIC.

DO NOT ADD MOISTURE.

DO NOT ADD PAYMENT PREFERENCES.

DO NOT ADD BANK DETAILS.

DO NOT ADD TRANSACTIONS.

DO NOT ADD NEGOTIATION.

DO NOT ADD MATCHING.

DO NOT ADD AGGREGATION.

DO NOT ADD LANDED COST.

DO NOT ADD AI RECOMMENDATIONS.

DO NOT CREATE A VERTICAL SIDEBAR.

KEEP THE BUYER NAVBAR HORIZONTAL AT THE TOP.

MAKE THE HERO SECTION USE THE FULL AVAILABLE RECTANGULAR WIDTH OF THE DASHBOARD CONTENT AREA WITH NO AWKWARD BLANK LEFT/RIGHT SPACE.

USE BUYER-SPECIFIC LIGHT, SOPHISTICATED BLUE VISUAL DESIGN.

USE THE FARMER IMPLEMENTATION AS AN ARCHITECTURAL/UX REFERENCE ONLY.

REUSE EXISTING WORKING CODE WHERE SAFE.

INSPECT FIRST → IMPLEMENT S4 → TEST → PRESERVE EVERYTHING ELSE.
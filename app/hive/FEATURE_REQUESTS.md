# Feature Requests & Ideas

## Ideas Page

### Pending Ideas
- Request 1: iNaturalist integration
What iNaturalist is (in case it's not on your radar): It's a free citizen science app run by California Academy of Sciences + National Geographic. Users photograph plants/insects/wildlife, the app's AI identifies the species, and the observation gets logged to a public database that researchers actually use. Millions of users. Massive plant database.
Why this is a great fit for Beehive Pro+: You already have a forage/blooming plants section. Beekeepers care intensely about what's blooming when, because that drives nectar flow. iNaturalist already solved the "what plant is this?" problem. Reinventing that wheel would be wasteful — leveraging it would be smart.
Three levels of integration, easiest to hardest:

Deep link only (1–2 days of work): Add an "Identify with iNaturalist" button in your forage screen that opens the iNaturalist app on the user's phone (or their website if not installed) with the camera ready. Lightweight, no API needed, no account required.
Pull plant data via API (1 week): Use iNaturalist's public API to fetch species info, regional bloom timing, and reference photos when a user adds a plant to their forage list. Adds richness without much complexity.
Full sync — log observations to user's iNaturalist account from your app (2–4 weeks): Requires OAuth, account linking, error handling. Most powerful but a real undertaking. Important caveat: iNaturalist's terms restrict commercial app integration without explicit permission — you'd want to contact them first if you go this far.

### In Progress
- 

### Completed
- 

### On Hold
Request 2: Expense tracking + receipts + tax deductions
This one is significantly bigger. It's basically asking for QuickBooks-lite built into your beekeeping app. But here's the thing — it's a legitimate need. Beekeepers do file taxes. Honey sales count as income (Schedule C or Schedule F depending on scale). Equipment, feed, treatments, mileage to outyards — all deductible. Most beekeepers track this on paper or spreadsheets and lose receipts. There's a real gap here.
The good news: your supplies tracker is halfway there already. You're tracking equipment, feed, treatments, quantities, vendors. Adding a cost field to each inventory item, plus an Expenses screen and an Income screen, gets you 70% of what Michael's asking for.
What it would entail:

New "Finances" or "Business" tab/screen
Add Expense form (date, category, amount, vendor, notes, attach receipt photo — you already have photo upload to Firebase, so this part is solved)
Add Income form (date, source, amount, notes)
Year-end summary (filterable by date range, exportable as CSV or PDF for the user's accountant)
Optional: mileage tracker using your existing location infrastructure
Mandatory disclaimer: "Beehive Pro+ is not tax software. Consult a CPA for tax filing." You absolutely need this — tracking expenses ≠ giving tax advice, and you don't want liability.
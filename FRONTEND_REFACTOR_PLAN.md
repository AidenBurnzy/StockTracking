# Frontend Refactor Plan for Unlimited Partners

## Overview
Refactor App.jsx from hardcoded Nick/Joey system to dynamic unlimited partners architecture.

## State Management Changes

### OLD (Hardcoded):
```javascript
const [nickCapital, setNickCapital] = useState(600);
const [joeyCapital, setJoeyCapital] = useState(0);
const [capitalPerson, setCapitalPerson] = useState('nick');
```

### NEW (Dynamic):
```javascript
const [partners, setPartners] = useState([]); // Array of partner objects from API
const [partnerCapitals, setPartnerCapitals] = useState({}); // { partnerId: capitalAmount }
const [selectedPartnerId, setSelectedPartnerId] = useState(null); // For modals
```

## Data Structure Changes

### Partner Object (from API):
```javascript
{
  id: 1,
  name: "nick",
  display_name: "Nick",
  color: "#3b82f6",
  total_invested: 600,
  active: true,
  created_at: "...",
  updated_at: "..."
}
```

### Entry Object (from API - NEW FORMAT):
```javascript
{
  id: 1,
  entry_date: "2024-01-15",
  entry_type: "trade",
  portfolio_value: 5000,
  ticker: "SPY",
  trade_type: "call",
  contracts: 10,
  notes: "...",
  daily_pl: 200,
  capital_person: null,
  capital_amount: null,
  partners: [
    {
      partner_id: 1,
      partner_name: "nick",
      display_name: "Nick",
      color: "#3b82f6",
      capital: 600,
      ownership: 60,
      value: 3000,
      pl: 2400
    },
    {
      partner_id: 2,
      partner_name: "joey",
      display_name: "Joey",
      color: "#10b981",
      capital: 400,
      ownership: 40,
      value: 2000,
      pl: 1600
    }
  ]
}
```

## Function Changes

### loadData()
**Before:** Fetches capital and entries, manually sets nickCapital/joeyCapital
**After:** 
1. Fetch partners from `/get-partners` endpoint
2. Store in `partners` state
3. Build `partnerCapitals` object from partners array
4. Fetch entries (now includes partners array)

### calculateStats(portfolio)
**Before:** Returns object with nick/joey specific fields
**After:** Returns object with per-partner calculations
```javascript
{
  totalCapital: 1000,
  partners: [
    {
      id: 1,
      name: "nick",
      display_name: "Nick",
      capital: 600,
      ownership: 60,
      value: 3000,
      pl: 2400
    },
    // ... more partners
  ],
  totalPL: 4000
}
```

### addDailyEntry()
**Before:** Sends hardcoded nick_capital, joey_capital, nick_ownership, etc.
**After:** 
1. Calculate stats for all partners
2. Build partners array with data for each partner
3. Send to API: `{ ...entryData, partners: [...] }`

### handleCapitalChange()
**Before:** Updates person='nick' or person='joey'
**After:** Updates partner by partner_id
API call: `POST /update-capital` with `{ partner_id, amount }`

### handleWithdrawCapital()
**Before:** Similar to above
**After:** Same as handleCapitalChange but with negative amount

### saveEditedEntry()
**Before:** Updates entry with hardcoded partner columns
**After:** 
1. Delete old entry
2. Create new entry with updated partner snapshots
(Or implement an update-entry endpoint)

### openAdminPanel()
**Before:** Sets adminNickCapital, adminJoeyCapital, etc.
**After:** Populates admin state for all partners dynamically

### saveAdminPanel()
**Before:** Creates adjustment entry with hardcoded columns
**After:** Creates adjustment with dynamic partner snapshots

## UI Component Changes

### Dashboard - Partner Cards
**Before:**
```jsx
<div className="bg-blue-500">Nick: {nickCapital}</div>
<div className="bg-green-500">Joey: {joeyCapital}</div>
```

**After:**
```jsx
{partners.map(partner => (
  <div key={partner.id} style={{backgroundColor: partner.color}}>
    {partner.display_name}: ${partner.total_invested}
  </div>
))}
```

### Add Capital Modal
**Before:**
```jsx
<select value={capitalPerson} onChange={e => setCapitalPerson(e.target.value)}>
  <option value="nick">Nick</option>
  <option value="joey">Joey</option>
</select>
```

**After:**
```jsx
<select value={selectedPartnerId} onChange={e => setSelectedPartnerId(e.target.value)}>
  {partners.map(p => (
    <option key={p.id} value={p.id}>{p.display_name}</option>
  ))}
</select>
```

### Transactions History
**Before:**
```jsx
<td>${entry.nick_value}</td>
<td>${entry.joey_value}</td>
```

**After:**
```jsx
{entry.partners?.map(p => (
  <td key={p.partner_id}>${p.value}</td>
))}
```

### Admin Panel
**Before:** Fixed inputs for Nick and Joey
**After:** Dynamic inputs generated from partners array

### Settings Tab - NEW
Add Partner Management interface:
- List all partners (active and inactive)
- Add new partner button
- Edit partner (change display_name, color)
- Deactivate/reactivate partner

## Implementation Steps

### Phase 1: State & Data Loading
1. ✅ Update API endpoints (DONE)
2. Add partners state to App.jsx
3. Update loadData() to fetch partners
4. Build partnerCapitals object

### Phase 2: Core Functions
5. Refactor calculateStats() for dynamic partners
6. Update addDailyEntry() to build partners array
7. Update handleCapitalChange() for partner_id
8. Update handleWithdrawCapital()

### Phase 3: UI Updates
9. Refactor Dashboard cards to map over partners
10. Update all modals (Add Capital, Withdraw, etc.)
11. Update Transactions table headers and cells
12. Update Analytics section

### Phase 4: Admin & Settings
13. Refactor Admin Panel for dynamic partners
14. Create Partner Management UI in Settings
15. Implement add/edit/deactivate partner modals

### Phase 5: Testing
16. Run database migration
17. Test with 2 partners (backward compatibility)
18. Test adding 3rd partner
19. Test all CRUD operations
20. Deploy

## Notes
- Maintain backward compatibility during transition
- Test thoroughly before running migration on production DB
- Consider creating a rollback script
- Update documentation after completion

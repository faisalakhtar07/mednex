// Centralized location configuration (spec section 9) — the single source of
// truth for every India-wide state/UT dropdown in the app, instead of
// scattering state names across components. District/City/Area are collected
// as free text for now since a full govt.-level location hierarchy dataset is
// a separate data-integration task; PIN code remains the authoritative field
// customers actually search on.

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
]

export const INDIAN_UNION_TERRITORIES = [
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
]

export const INDIAN_STATES_AND_UTS = [...INDIAN_STATES, ...INDIAN_UNION_TERRITORIES].sort()

# MedNex — Multi-Medical-Store Marketplace (Frontend)

A React + Vite + Tailwind frontend for MedNex, a Pan-India marketplace where
independent medical stores register, get verified, and sell to nearby
customers. Talks to the `mednex-backend` API — see that project's README for
setup.

## Setup

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually http://localhost:5173). Make
sure `mednex-backend` is running on http://localhost:5000 first (or set
`VITE_API_URL` in a `.env` file — see `.env.example`).

To build for production:

```bash
npm run build
npm run preview
```

## What's included

- **Customer**: OTP login/signup (mobile or email, primary path) plus
  email/mobile + password as a fallback, Generate Password, Forgot Password,
  medicine browsing, cart, 3-step checkout, order tracking, prescription
  upload, lab tests, doctor consultations, wishlist, search.
- **Medical Store Owner**: store registration, store profile editing,
  subscription plan selection, order management, delivery staff creation,
  prescription review — all scoped to their own store by the backend.
- **Delivery Staff**: assigned-orders dashboard, OTP-verified delivery
  completion.
- **Super Admin**: platform-wide stats, store verification queue (see
  backend README for how to create the first admin account — it's CLI-only,
  not a signup form).
- Cart, Wishlist, Auth and Toast state via React Context (`src/context/`).
- Reusable components in `src/components/`.
- Tailwind design system tuned to a blue/teal medical palette (see `tailwind.config.js`).
- Framer Motion micro-animations, skeleton loaders, empty states, and a sticky mobile
  bottom nav for an app-like feel.

## Data flow

All API calls go through `src/utils/api.js`, which talks to the backend at
`VITE_API_URL` (defaults to `http://localhost:5000`). `src/data/*.js` still
holds a few genuinely static reference lists (e.g. `locations.js` — the
official state/UT list) but product/order/store data all comes from the API.

## Disclaimers baked into the UI

The app avoids giving medical advice or dosage guidance, shows prescription
requirements clearly, and includes disclaimers on the doctor-consultation and
footer sections noting that consultations require a real backend + licensed
professionals in production.

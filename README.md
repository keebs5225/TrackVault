# TrackVault

A full‑stack personal finance tracker built with React and TypeScript. TrackVault provides a clean, responsive interface to manage accounts, record transactions, set up recurring payments, create budgets and goals, and view your financial dashboard—all with light/dark mode support and user authentication.

---

## ~ Project Overview

TrackVault centralizes your financial data in one place. After signing up and logging in, you can:

* **Accounts**: Create and manage checking, savings, credit, and cash accounts.
* **Transactions**: Log deposits and withdrawals, edit or delete past entries.
* **Recurring**: Automate recurring deposits or withdrawals on daily, weekly, monthly, or yearly schedules.
* **Budgets**: Allocate monthly amounts to income, fixed, and variable expense categories.
* **Goals**: Set savings goals, deposit or withdraw to/from goals, and monitor progress.
* **Calculators**: Built‑in financial calculators (e.g., loan payments, savings interest).
* **Dashboard**: At‑a‑glance summary of your budgets, recent transactions, upcoming recurring payments, and savings goals.

---

## ~ Technologies Used

* **React** & **TypeScript** – Component‑based UI with strict typing
* **React Router DOM** – SPA routing
* **@tanstack/react-query** – Efficient data fetching & caching
* **Axios** – HTTP client with interceptor for auth tokens
* **CSS Modules & Custom CSS** – Scoped styles per page (`accounts.css`, `recurring.css`, `goals.css`, etc.)
* **React Icons** – Icons for UI controls (e.g. eye toggles)
* **LocalStorage** – Persist JWT access token
* **Node/Express** (backend assumed) – REST API endpoints for `/accounts`, `/transactions`, `/recurring`, `/budgets`, `/goals`, `/auth`, `/users/me`

---

## ~ Features Implemented

### ~ Core Features

* **Authentication**: Sign up, log in, protected routes, profile editing, password change, account deletion
* **Accounts Tab**: List, sort, create, edit, delete accounts with balances
* **Transactions Tab**: Paginated list, sort by date/account/amount/type, inline editing & deletion
* **Recurring Tab**: Set up and manage recurring transactions; dynamic next‐run date calculation
* **Budgets Tab**: Categorize budgets, visualize with progress bars, inline editing
* **Goals Tab**: Create savings goals, deposit/withdraw funds, priority bumpers, progress indicators
* **Calculators Tab**: Financial calculators with inputs, reset/copy actions
* **Dashboard**: Aggregate view with totals, budget breakdowns, recent transactions, upcoming recurrences, goals summary

### ~ Additional Enhancements

* Light/dark mode compatibility via CSS custom properties
* Responsive grid layouts for cards (auto‑fill/minmax)
* Inline-edit UI patterns with save/discard
* Centralized API service layer (`/services/*.ts`) with typed requests
* React Query mutations automatically invalidate relevant caches

---

## ~ Installation Instructions

1. **Clone the Repository**

   git clone https://github.com/your‑username/TrackVault.git
   cd TrackVault/frontend

2. **Install Dependencies**

   npm install

3. **Configure Environment**

   * Ensure your backend API is running at `http://localhost:8000` (or update `frontend/src/services/api.ts` `baseURL`).
   * No other environment variables are required for local development.

4. **Start the Development Server**

   npm start

   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ~ Usage Guidelines

* **Sign Up** to create a new account, then **Log In**.
* Navigate via the sidebar or top tabs—Accounts, Transactions, Budgets, Goals, Calculators, Dashboard, Profile.
* Click **+ New…** buttons to add items; use sort dropdowns to reorder lists.
* In-line **Edit** buttons enable form fields directly on cards.
* Toggle light/dark theme via your OS or browser default (CSS custom properties handle both modes).

---

## ~ Future Improvements

* **Date Range Filters** on transactions and budgets
* **Export/Import** data (CSV/JSON backup)
* **Charts** (e.g., time series, pie charts) for deeper insights
* **Mobile‑optimized menu** and gestures
* **Multi‑currency support** and live exchange rates
* **Push notifications** for upcoming recurring payments
* **Backend endpoints** for exporting summaries or integrating with third‑party APIs

---

## ~ Learning Outcomes

* Much Improvment for **React Query** for querying and mutating server data, with cache invalidation.
* Advanced **TypeScript** patterns for typed API responses and hook definitions.
* UI architecture using React **component composition**, **hooks**, and **context** for state management.
* Building **responsive**, **accessible** UIs with semantic HTML and ARIA roles.
* Designing **RESTful** service layers with unified error handling via axios interceptors.

---

## ~ Live Demo

Coming soon—stay tuned for a hosted version!

---
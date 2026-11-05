# Graco - Grocery Management System

A MERN grocery app with five modules:

1. **User Authentication & Profile** - sign up, log in, Google sign-in, password reset, edit profile
2. **Grocery List Management** - lists and items with categories, quantities and priorities
3. **Inventory, Budget & Expenses** - stock with expiry dates, monthly budget, expense tracking
4. **Sharing, Collaboration & Notifications** - share lists as editor or viewer, assign items, reminders
5. **AI Grocery Assistant** - recommendations, smart quantities, recipes, AI-generated lists, expiry and food-waste tips

**Tech stack:** React 19, Vite, Tailwind CSS, Node.js, Express 5, MongoDB with Mongoose, JWT, Google Gemini API.

## Team

A college team project built by five students, one module each:

| Module | Team member |
| --- | --- |
| 1. User Authentication & Profile | Shweta |
| 2. Grocery List Management | Samiksha |
| 3. Inventory, Budget & Expenses | Snehal |
| 4. Sharing, Collaboration & Notifications | Sanika |
| 5. AI Grocery Assistant & Smart Recommendations | Sufiya |

**My role (Sufiya):** project lead; built Module 5, the AI grocery assistant using the Google Gemini API with a rule-based fallback; and integrated all five modules into one working application.

## Requirements

- Node.js 20 or newer
- MongoDB running locally (or a MongoDB Atlas connection string)

## Setup

```bash
npm install
cd backend
npm install
```

Create the environment files from the examples:

- `backend/.env` from `backend/.env.example` - set `MONGO_URI` and a long random `JWT_SECRET`
- `.env` from `.env.example` - optional, for Google sign-in

Never commit the real `.env` files.

## Run

Start the backend (port 5000):

```bash
cd backend
npm run dev
```

Start the frontend (port 5173) in a second terminal:

```bash
npm run dev
```

Open http://localhost:5173 and create an account.

## Optional features

| Feature | Setting |
| --- | --- |
| Google sign-in | `VITE_GOOGLE_CLIENT_ID` in `.env` and `GOOGLE_CLIENT_ID` in `backend/.env` (same OAuth Web client ID, with `http://localhost:5173` as an authorized JavaScript origin). The Google button is hidden until it is set. |
| Password reset emails | `EMAIL_USER`, `EMAIL_PASS` and `SENDER_NAME` in `backend/.env` |
| Gemini AI suggestions | `GEMINI_API_KEY` in `backend/.env` (free key from https://aistudio.google.com/apikey; model set by `GEMINI_MODEL`, default `gemini-3.5-flash-lite`). Without a key, or when Gemini is unavailable, the AI assistant shows built-in smart-rules results and says so. |

## Project structure

```
backend/
  server.js            Express app and routes
  routes/              auth, lists, notifications, reminders, ai
  controllers/         list, share, notification, reminder logic
  models/              User, List, Notification, Reminder
  middleware/          JWT auth, list access roles
  services/            AI assistant (Gemini + rule-based fallback)
  jobs/                reminder scheduler
src/
  api/                 fetch helpers for each backend area
  components/          React screens for each module
  utils/               inventory, budget and expense storage
```

## Notes

- Inventory, budget and expenses are stored in the browser (localStorage). See `docs/module3-api-contract.md` for the planned API.
- `npm run lint` checks the frontend and `npm run build` creates a production build in `dist/`.
- To put the app online for free (MongoDB Atlas + Render + Vercel), see `docs/DEPLOYMENT.md`.

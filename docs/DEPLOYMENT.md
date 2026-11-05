# Deploying Graco (free)

| Part | Service | Free plan |
| --- | --- | --- |
| Database | MongoDB Atlas | M0 free cluster |
| Backend (Node + Express) | Render | Free web service |
| Frontend (React + Vite) | Vercel | Hobby |

Never put passwords, keys or connection strings in GitHub. They go only into the
settings pages of Render and Vercel.

## 1. Database: MongoDB Atlas

1. Sign up at https://www.mongodb.com/cloud/atlas/register and create a free **M0** cluster.
2. **Database Access**: add a database user with a password.
3. **Network Access**: add IP address `0.0.0.0/0` (Render's address changes, so allow all).
4. **Connect > Drivers**: copy the connection string and put the database name before `?`:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/grocery-management?retryWrites=true&w=majority`

## 2. Backend: Render

1. Sign in at https://render.com with GitHub and choose **New > Web Service**.
2. Pick the `Grocery-Management-System` repository and the branch to deploy.
3. Settings:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance type: Free
4. Environment variables:

   | Key | Value |
   | --- | --- |
   | `MONGO_URI` | Atlas connection string from step 1 |
   | `JWT_SECRET` | a long random text |
   | `FRONTEND_URL` | your Vercel address (add after step 3, then redeploy) |
   | `GOOGLE_CLIENT_ID` | same Google OAuth client ID as the frontend |
   | `GEMINI_API_KEY` | your Gemini key (optional) |
   | `GEMINI_MODEL` | `gemini-3.5-flash-lite` |
   | `EMAIL_USER`, `EMAIL_PASS`, `SENDER_NAME` | optional, for password reset emails |

5. Deploy. Opening the Render address should show `Grocery API running`.

The free instance sleeps after about 15 minutes without visits; the first request
afterwards takes 30-50 seconds, and reminders are delivered only while it is awake.

## 3. Frontend: Vercel

1. Sign in at https://vercel.com with GitHub and choose **Add New > Project**.
2. Import the repository; Vercel detects **Vite**. Keep the root directory as `./`.
3. Environment variables:

   | Key | Value |
   | --- | --- |
   | `VITE_BACKEND_URL` | your Render address, e.g. `https://graco-api.onrender.com` |
   | `VITE_GOOGLE_CLIENT_ID` | your Google OAuth client ID |

4. Deploy. Vercel gives an address like `https://graco.vercel.app`.

## 4. Connect them

1. Render > your service > Environment: set `FRONTEND_URL` to the Vercel address
   (no trailing `/`) and save. Render redeploys.
2. Google Cloud Console > APIs & Services > Credentials > your OAuth client:
   add the Vercel address under **Authorized JavaScript origins**.

Changing a `VITE_` variable on Vercel needs a redeploy (Deployments > Redeploy),
because these values are built into the website.

## 5. Check

- Open the Vercel address, register, create a list, add items.
- Share a list with a second account and check Notifications.
- AI Assistant: the label shows "Gemini AI" when `GEMINI_API_KEY` is set on Render.
- Inventory, budget and expenses are stored in each browser, so they do not sync between devices.

# CampusWatt production deployment

This repository is configured for:

- **MongoDB Atlas**: persistent MongoDB database
- **Render**: Express API (`backend/`)
- **Vercel**: React/Vite client (`frontend/`)

Deploy in this order: Atlas, seed data, GitHub, Render, then Vercel.

## 1. Create an Atlas database

1. Create an Atlas organization/project and a free M0 deployment.
2. In **Database Access**, create a database user with the `readWrite` role. Use a strong password.
3. In **Network Access**, add `0.0.0.0/0` for this deployment. This permits Render to reach Atlas; restrict it later if you move to Render static outbound IPs.
4. Select **Connect > Drivers > Node.js** and copy the SRV connection string. Replace `<password>` with the URL-encoded database-user password and set the database name to `campuswatt`.

Example only (do not commit it):

```text
mongodb+srv://<user>:<url-encoded-password>@<cluster-host>/campuswatt?retryWrites=true&w=majority
```

## 2. Seed Atlas before hosting the API

From the project root, create a local backend environment file and add the Atlas URI:

```powershell
Copy-Item backend/.env.example backend/.env
```

Set `MONGO_URI` in `backend/.env` to the Atlas connection string, then run:

```powershell
npm --prefix backend ci
npm --prefix backend run seed:reset
```

This project intentionally falls back to its bundled JSON data when MongoDB is empty or unavailable. Seeding before the first Render deploy ensures all edits from the live app save to Atlas immediately.

## 3. Publish to GitHub

Create an empty GitHub repository, then run these commands from the project root. Replace the placeholder with your repository URL.

```powershell
git init
git add .
git commit -m "Prepare CampusWatt for deployment"
git branch -M main
git remote add origin https://github.com/<your-account>/<your-repository>.git
git push -u origin main
```

Never commit `backend/.env`, an Atlas URI, passwords, or API keys. `.gitignore` already excludes environment files.

## 4. Deploy the API on Render

1. In Render, choose **New > Blueprint** and connect the GitHub repository.
2. Render detects `render.yaml`. Keep the service name or choose a unique one.
3. When Render requests secret values, enter:
   - `MONGO_URI`: the exact Atlas URI used for seeding.
   - `CORS_ORIGIN`: temporarily use `https://placeholder.invalid`.
4. Create the Blueprint and wait for the deploy to finish.
5. Open `https://<your-render-service>.onrender.com/api/health`. It should return JSON whose `dataSource` is `mongo`.

Do not add `PORT`: Render supplies it automatically.

## 5. Deploy the frontend on Vercel

1. In Vercel, choose **Add New > Project** and import the same GitHub repository.
2. Set **Root Directory** to `frontend`.
3. Keep the detected Vite build settings (`npm run build`, output `dist`).
4. Add this production environment variable and deploy:

```text
VITE_API_URL=https://<your-render-service>.onrender.com/api
```

5. Copy the resulting production URL, for example `https://campuswatt.vercel.app`.

## 6. Lock the API to Vercel and redeploy

In Render, open the API service's environment settings and change `CORS_ORIGIN` to the exact Vercel production URL, with no trailing slash:

```text
https://campuswatt.vercel.app
```

Save and redeploy the API. If you use Vercel preview deployments, either add their precise origins as a comma-separated list or use a separate preview API.

## Verification checklist

1. `GET /api/health` reports `dataSource: "mongo"`.
2. Open the Vercel URL and confirm the dashboard loads.
3. Create a harmless test building, refresh the page, and confirm it persists.
4. Confirm the browser network requests go to the Render `/api` URL and have no CORS errors.

## Updating the site

Push to `main`. Render automatically redeploys the API and Vercel automatically redeploys the frontend. When changing `VITE_API_URL`, redeploy Vercel because Vite embeds it at build time.

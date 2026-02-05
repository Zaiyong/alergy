# Vercel Deployment Guide

This guide will help you deploy YumSafe to Vercel.

## Prerequisites

- A Vercel account (sign up at [vercel.com](https://vercel.com))
- Your GitHub repository connected to Vercel
- A Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Deployment Steps

### 1. Connect Your Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository (`Zaiyong/alergy`)
4. Vercel will auto-detect the configuration from `vercel.json`

### 2. Configure Environment Variables

**IMPORTANT:** You must add your Gemini API key as an environment variable in Vercel:

1. In your Vercel project settings, go to **Settings** → **Environment Variables**
2. Add a new variable:
   - **Name:** `EXPO_PUBLIC_GEMINI_API_KEY`
   - **Value:** Your Gemini API key
   - **Environment:** Production, Preview, and Development (select all)
3. Click **Save**

### 3. Build Settings (Auto-configured via vercel.json)

The following settings are automatically configured via `vercel.json`:

- **Framework Preset:** Other
- **Build Command:** `npx expo export --platform web`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### 4. Deploy

1. Click **Deploy** in Vercel
2. Wait for the build to complete
3. Your app will be live at `https://your-project-name.vercel.app`

## Troubleshooting

### 404 NOT_FOUND Error

If you're getting a 404 error:

1. **Check Build Logs:** Go to your Vercel project → **Deployments** → Click on the latest deployment → Check the build logs
2. **Verify Output Directory:** Ensure the build completed and created a `dist` folder
3. **Check vercel.json:** Ensure `outputDirectory` is set to `dist`
4. **Verify Rewrites:** The `vercel.json` should have a rewrite rule for SPA routing

### Build Fails

If the build fails:

1. **Check Node Version:** Vercel should use Node.js 18+ (configured automatically)
2. **Check Dependencies:** Ensure all dependencies in `package.json` are valid
3. **Check Environment Variables:** Ensure `EXPO_PUBLIC_GEMINI_API_KEY` is set
4. **Local Test:** Run `npm run build:web` locally to test the build

### Environment Variables Not Working

- Ensure the variable name is exactly `EXPO_PUBLIC_GEMINI_API_KEY` (case-sensitive)
- Ensure it's set for all environments (Production, Preview, Development)
- Redeploy after adding/changing environment variables

## Testing Locally

Before deploying, test the build locally:

```bash
# Build for web
npm run build:web

# The output will be in the dist/ directory
# You can test it locally (requires a static file server)
npx serve dist
```

## Additional Notes

- The app uses client-side routing (React Navigation), so all routes are handled by the SPA rewrite rule in `vercel.json`
- Camera functionality may be limited on web browsers (use image upload instead)
- The `dist` folder is gitignored and will be generated during Vercel builds

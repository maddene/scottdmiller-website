# Netlify Deployment Guide

## Overview
The site now supports dual environments:
- **Local**: Uses Express server (`localhost:3001`)  
- **Netlify**: Uses Netlify Functions (`/.netlify/functions/eventbrite`)

The component automatically detects the environment and uses the correct proxy endpoint.

## Pre-Deployment Setup

### 1. Environment Variable
In your Netlify dashboard:
1. Go to **Site settings** → **Environment variables**
2. Add: `EVENTBRITE_API_TOKEN` = `your_private_token_here`

### 2. Files to Deploy
Make sure these files are committed:
- `netlify/functions/eventbrite.js` ✅ (Netlify Function)
- `components/eventbrite-events.js` ✅ (Web Component with auto-detection)
- `index.html` ✅ (Updated to use auto-detection)

### 3. Files to Exclude
Add to `.gitignore`:
```
# Local development server (don't deploy)
server/
```

## Deployment Steps

### Option 1: Git Integration (Recommended)
1. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Add Netlify Functions support with environment auto-detection"
   git push
   ```

2. **Connect to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - **New site from Git**
   - Connect your GitHub repo
   - Branch: `eventbrite-integration` (or merge to main first)

3. **Build Settings**:
   - Build command: (leave empty for static site)
   - Publish directory: `/` (root directory)
   - Functions directory: `netlify/functions` (auto-detected)

### Option 2: Manual Deploy
1. **Create deployment folder** (exclude server/):
   ```bash
   # Copy files except server/ directory
   ```
2. **Drag and drop** to Netlify dashboard

## Testing Deployment

### 1. Check Functions
Visit: `https://your-site.netlify.app/.netlify/functions/eventbrite?organizerId=298540255`
- Should return JSON with events
- Check function logs in Netlify dashboard

### 2. Check Website
Visit: `https://your-site.netlify.app`
- Events should load automatically
- Check browser console for environment detection

## Troubleshooting

### Events Not Loading
1. **Check Function Logs**: Netlify dashboard → Functions tab
2. **Check Environment Variable**: Make sure `EVENTBRITE_API_TOKEN` is set
3. **Check Console**: Browser should show `environment: 'netlify'`

### Function Errors
- **API Token Missing**: Set in Netlify environment variables
- **CORS Issues**: Function includes CORS headers
- **Eventbrite API Errors**: Check function logs for details

## Local vs Production Behavior

| Environment | Proxy URL | Backend |
|------------|-----------|---------|
| `localhost:5500` | `http://localhost:3001/api/eventbrite` | Express server |
| `your-site.netlify.app` | `/.netlify/functions/eventbrite` | Netlify Function |

## Security Benefits

✅ **API token hidden** from client-side in both environments  
✅ **CORS properly configured** for both setups  
✅ **Environment separation** - different backends for different environments  
✅ **No manual configuration** - component auto-detects environment
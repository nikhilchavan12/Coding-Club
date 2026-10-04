# Firebase Setup Instructions

This document explains how to set up Firebase Realtime Database for your Coding Club competition app.

## Why Firebase?

The original app used `localStorage`, which only stores data in the user's browser. This meant:
- Admin's leaderboard was isolated from participants' data
- No real-time sync between different users/devices
- Competition state wasn't shared across participants

Firebase Realtime Database solves this by providing:
- **Centralized cloud storage** - All users share the same database
- **Real-time sync** - Changes instantly reflect across all connected clients
- **No server needed** - Firebase handles the backend infrastructure

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter a project name (e.g., `coding-club-competition`)
4. You can disable Google Analytics for this project (not required)
5. Click **"Create project"**

## Step 2: Enable Realtime Database

1. In your Firebase project, click **"Build"** in the left sidebar
2. Click **"Realtime Database"**
3. Click **"Create Database"**
4. Select a location (choose the one closest to your users)
5. Choose **"Start in test mode"** (for development)
6. Click **"Enable"**

**Security Rules:** Initially, your database will be in test mode with public read/write access. For production, you should update the security rules. Here's a recommended rule set:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

For production, consider restricting access based on authentication.

## Step 3: Get Firebase Configuration

1. In Firebase Console, click the **gear icon** (Project Settings)
2. Scroll down to **"Your apps"** section
3. Click the **</>** icon (Web app)
4. Register the app (name it `coding-club`)
5. Copy the `firebaseConfig` object that appears

It should look like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project-id.firebaseapp.com",
  databaseURL: "https://your-project-id-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

## Step 4: Update Firebase Configuration in Your App

1. Open `src/firebaseConfig.js`
2. Replace the placeholder values with your actual Firebase credentials:

```javascript
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };
```

## Step 5: Test Locally

1. Run the development server:
   ```bash
   npm run dev
   ```

2. Open the app in multiple browser tabs/windows:
   - Register as a participant in one tab
   - Open Admin panel in another tab
   - Verify that participant names appear on the leaderboard

3. Test competition state:
   - Start competition from Admin
   - Verify participant page auto-navigates to `/game`

## Step 6: Deploy to Netlify

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy to Netlify (or use your existing Netlify deployment)

3. The app will now work across different devices/users because Firebase handles the shared data.

## Important Notes

### Environment Variables (Optional)
For better security, you can use environment variables instead of hardcoding Firebase config:

1. Create a `.env` file in your project root:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

2. Update `src/firebaseConfig.js`:
   ```javascript
   const firebaseConfig = {
     apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
     databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
     projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
     storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
     messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
     appId: import.meta.env.VITE_FIREBASE_APP_ID
   };
   ```

3. Add `.env` to your `.gitignore` file

4. Add the environment variables in Netlify:
   - Go to Netlify Dashboard → Site Settings → Environment Variables
   - Add each variable with `VITE_` prefix

### Firebase Free Tier Limits
Firebase's free tier (Spark Plan) includes:
- Realtime Database: 1GB stored, 10GB/month downloaded
- 100 simultaneous connections
- Sufficient for most small-to-medium competitions

If you exceed limits, you may need to upgrade to the Blaze plan.

### Default Admin Password
The default admin password is `admin123`. You can change this in the Admin panel.

## Troubleshooting

### "Permission denied" errors
- Check Firebase Console → Realtime Database → Rules
- Ensure rules allow read/write access (test mode: `.read: true, .write: true`)

### Data not syncing
- Verify `databaseURL` in firebaseConfig.js matches your Firebase project
- Check browser console for Firebase errors
- Ensure network connectivity

### Leaderboard empty after registration
- Check Firebase Console → Realtime Database → Data
- Verify participants are being saved under `participants/` path
- Check browser console for errors during registration

## Support

For Firebase-specific issues:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Realtime Database Guide](https://firebase.google.com/docs/database)

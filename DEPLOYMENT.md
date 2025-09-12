# AlgoBucks Deployment Guide

This guide provides step-by-step instructions for deploying both the frontend and backend of AlgoBucks.

## Backend Deployment (Render)

1. **Prerequisites**
   - Node.js (v16+)
   - MongoDB Atlas account
   - Render account

2. **Environment Variables**
   Create a `.env` file in the `server` directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=90d
   JWT_COOKIE_EXPIRES=90
   NODE_ENV=production
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   ```

3. **Deploy to Render**
   - Connect your GitHub repository to Render
   - Select the `server` directory as the root directory
   - Set the build command: `npm install`
   - Set the start command: `npm start`
   - Add the environment variables from step 2

## Frontend Deployment (Vercel)

1. **Prerequisites**
   - Node.js (v16+)
   - Vercel account

2. **Environment Variables**
   Create a `.env.production` file in the root directory with:
   ```
   VITE_API_URL=https://algobucks.onrender.com/api
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```

3. **Deploy to Vercel**
   - Import your GitHub repository to Vercel
   - Vercel will automatically detect the Vite/React project
   - Add the environment variables from step 2
   - Deploy!

## Development Setup

1. **Backend**
   ```bash
   cd server
   npm install
   npm run dev
   ```

2. **Frontend**
   ```bash
   npm install
   npm run dev
   ```

## Environment Variables

### Frontend (`.env` or `.env.development`)
```
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### Backend (`.env` in server directory)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES=90
```

## Deployment Notes

- Make sure CORS is properly configured in the backend
- Ensure all API endpoints in the frontend use the correct base URL
- Set up proper error handling for production
- Configure proper logging and monitoring
- Set up SSL certificates for production

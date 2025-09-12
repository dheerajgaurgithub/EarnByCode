# AlgoBucks Deployment Guide

This guide provides step-by-step instructions for deploying both the frontend and backend of AlgoBucks.

## Prerequisites

- Node.js (v16+)
- Git
- GitHub account
- Vercel account (for frontend)
- Render account (for backend)
- MongoDB Atlas account
- Cloudinary account (for image uploads)
- Stripe account (for payments)

## Backend Deployment (Render)

1. **Set up MongoDB Atlas**
   - Create a new cluster in MongoDB Atlas
   - Create a database user with read/write access
   - Add your current IP to the IP whitelist
   - Get the connection string (replace `<password>` with your actual password)

2. **Set up Cloudinary**
   - Create a Cloudinary account
   - Get your Cloud Name, API Key, and API Secret

3. **Set up Stripe**
   - Create a Stripe account
   - Get your Stripe Secret Key and Webhook Secret
   - Set up webhooks for payment events

4. **Deploy to Render**
   - Sign in to [Render](https://render.com)
   - Click "New" and select "Web Service"
   - Connect your GitHub repository
   - Configure the service:
     - Name: `algobucks-backend`
     - Region: Choose the one closest to your users
     - Branch: `main`
     - Root Directory: `server`
     - Build Command: `npm install`
     - Start Command: `npm start`
   - Add environment variables:
     ```
     MONGODB_URI=your_mongodb_connection_string
     JWT_SECRET=a_strong_random_string
     JWT_EXPIRES_IN=90d
     JWT_COOKIE_EXPIRES=90
     NODE_ENV=production
     CLOUDINARY_CLOUD_NAME=your_cloudinary_name
     CLOUDINARY_API_KEY=your_cloudinary_key
     CLOUDINARY_API_SECRET=your_cloudinary_secret
     STRIPE_SECRET_KEY=your_stripe_secret_key
     STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
     PORT=10000
     ```
   - Click "Create Web Service"

## Frontend Deployment (Vercel)

1. **Set up environment variables**
   Create a `.env.production` file in the root directory with:
   ```
   VITE_API_URL=https://your-render-app-name.onrender.com/api
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   VITE_APP_NAME=AlgoBucks
   VITE_APP_DESCRIPTION=Competitive Programming Platform
   ```

2. **Deploy to Vercel**
   - Push your code to GitHub
   - Sign in to [Vercel](https://vercel.com)
   - Click "Add New" > "Project"
   - Import your GitHub repository
   - Configure the project:
     - Framework Preset: Vite
     - Root Directory: (leave as default)
     - Build Command: `npm run build`
     - Output Directory: `dist`
     - Install Command: `npm install`
   - Add environment variables from your `.env.production` file
   - Click "Deploy"

3. **Configure Custom Domain (Optional)**
   - Go to your project settings in Vercel
   - Navigate to "Domains"
   - Add your custom domain and follow the verification steps

## Post-Deployment

1. **Verify Backend**
   - Test API endpoints using Postman or curl
   - Check logs in Render dashboard for any errors

2. **Verify Frontend**
   - Test all major features:
     - User authentication
     - Problem submission
     - Contest features
     - Payment integration
   - Check browser console for any errors

3. **Set up Monitoring**
   - Enable logging in Vercel and Render
   - Set up error tracking (e.g., Sentry)
   - Configure alerts for errors and performance issues
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

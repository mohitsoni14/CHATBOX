# Deployment Guide

## Prerequisites
- Node.js (v16 or later)
- npm or yarn
- Vercel CLI (optional)
- Google API Key (for Generative AI features)
- Firebase credentials (if using Firebase)

## Local Development

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd CHATBOX
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn
   ```

3. Set up environment variables
   - Copy `.env.example` to `.env.local`
   - Fill in the required values
   ```bash
   cp .env.example .env.local
   ```

4. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## Vercel Deployment

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Go to [Vercel](https://vercel.com) and import your project

3. Configure environment variables in Vercel:
   - Go to Project Settings > Environment Variables
   - Add all variables from your `.env.local` file
   - Make sure to mark them for both Development and Production

4. Important Vercel settings:
   - Framework Preset: Vite
   - Root Directory: (leave blank if root)
   - Build Command: `npm run build` or `yarn build`
   - Output Directory: `dist`
   - Install Command: `npm install` or `yarn`

5. Deploy!
   - Vercel will automatically detect your project settings
   - It will build and deploy your application

## Environment Variables

### Required
- `VITE_SIGNALING_SERVER`: WebSocket URL for signaling server (e.g., `wss://your-app.vercel.app`)
- `GOOGLE_API_KEY`: Your Google API key for Generative AI

### Optional
- Firebase configuration (if using Firebase)
- Any other API keys or configuration

## Troubleshooting

### Socket.io Connection Issues
- Ensure your signaling server is running and accessible
- Check CORS settings on the server
- Verify WebSocket URL is correct

### Build Failures
- Check Node.js version (use v16 or later)
- Verify all environment variables are set
- Check build logs in Vercel for specific errors

### API Endpoints Not Working
- Ensure API routes are properly set up in the `api` directory
- Check Vercel function logs for errors
- Verify CORS settings

## Development vs Production
- In development, the app uses localhost for API and WebSocket connections
- In production, it uses relative paths and environment variables
- Environment variables prefixed with `VITE_` are exposed to the client-side code

## Monitoring
- Check Vercel's deployment logs for build/deployment issues
- Use Vercel's function logs for API debugging
- Set up monitoring for WebSocket connections if needed

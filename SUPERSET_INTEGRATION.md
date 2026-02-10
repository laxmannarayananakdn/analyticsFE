# Superset Dashboard Integration Guide

This guide explains how to configure and use the Superset dashboard integration in the frontend application.

## Overview

The Superset integration allows you to embed and view Apache Superset dashboards directly in your frontend application. It supports two embedding modes:

1. **SDK Mode** (Recommended): Uses `@superset-ui/embedded-sdk` for secure, interactive embedding
2. **Iframe Mode**: Simple iframe embedding for quick setup

## Configuration

### Environment Variables

Create a `.env` file in the `frontend` directory with the following variables:

```env
# Superset Configuration
VITE_SUPERSET_URL=http://localhost:8088

# Option 1: API Key Authentication (Recommended for production)
VITE_SUPERSET_API_KEY=your_superset_api_key_here

# Option 2: Username/Password Authentication (For development)
VITE_SUPERSET_USERNAME=admin
VITE_SUPERSET_PASSWORD=admin
```

### Superset URL

- **Local Development**: `http://localhost:8088`
- **Production**: Your Superset URL (e.g., `https://superset.yourdomain.com`)

## Authentication Methods

### Method 1: API Key (Recommended)

1. Generate an API key in Superset:
   - Go to Settings → API Keys
   - Create a new API key
   - Copy the key to `VITE_SUPERSET_API_KEY`

### Method 2: Username/Password

For development, you can use username/password authentication:
- Set `VITE_SUPERSET_USERNAME` and `VITE_SUPERSET_PASSWORD`
- Note: This is less secure and not recommended for production

## Backend Integration (Optional but Recommended)

For production, it's recommended to create backend endpoints that:
1. Proxy Superset API calls
2. Generate guest tokens securely
3. Handle authentication server-side

### Required Backend Endpoints

If you implement backend endpoints, the service will automatically use them:

1. **GET `/api/superset/dashboards`**
   - Returns list of available dashboards
   - Response: `SupersetDashboard[]`

2. **POST `/api/superset/guest-token`**
   - Generates a guest token for dashboard embedding
   - Request body: `{ dashboard_id: number, resources?: Array<{ type: string, id: string }> }`
   - Response: `{ token: string, expires_in?: number }`

If these endpoints are not available, the service will fall back to direct Superset API calls.

## Usage

1. **Access the Dashboards Page**
   - Navigate to `/superset` in your application
   - Or click "Superset Dashboards" from the main dashboard

2. **Select a Dashboard**
   - Click on any dashboard from the sidebar
   - The dashboard will load in the main viewer

3. **Switch Embedding Modes**
   - Use the "SDK" / "Iframe" toggle in the header
   - SDK mode provides better security and interactivity
   - Iframe mode is simpler but may have CORS limitations

4. **Fullscreen View**
   - Click the maximize icon to view in fullscreen
   - Press ESC or click minimize to exit

5. **Open in New Tab**
   - Click the external link icon to open the dashboard in a new tab

## Features

- ✅ List all published Superset dashboards
- ✅ Embed dashboards using Superset Embedded SDK
- ✅ Fallback to iframe embedding
- ✅ Fullscreen support
- ✅ Responsive design
- ✅ Error handling and loading states
- ✅ Auto-refresh capability

## Troubleshooting

### Dashboard Not Loading

1. **Check Superset URL**: Ensure `VITE_SUPERSET_URL` is correct
2. **Check Authentication**: Verify API key or credentials
3. **Check CORS**: If using iframe mode, ensure Superset allows your domain
4. **Check Backend**: If using backend endpoints, ensure they're running

### Guest Token Errors

- If you see guest token errors, ensure:
  - Backend endpoint `/api/superset/guest-token` is implemented, OR
  - Superset authentication is working correctly
  - You have proper permissions in Superset

### CORS Issues

- If you encounter CORS errors:
  - Use SDK mode instead of iframe mode
  - Configure CORS in Superset settings
  - Use backend proxy endpoints

## Security Considerations

1. **Never commit `.env` files** with real credentials
2. **Use API keys** instead of passwords in production
3. **Store secrets** in Azure Key Vault or similar
4. **Use backend endpoints** for guest token generation in production
5. **Enable HTTPS** for both frontend and Superset in production

## Next Steps

1. Configure your Superset instance
2. Create dashboards in Superset
3. Set up environment variables
4. (Optional) Implement backend endpoints for better security
5. Test the integration locally
6. Deploy to production with proper security measures

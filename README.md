# Frontend Application

React + TypeScript frontend application for Data Analytics dashboard.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables (optional):**
   Create a `.env` file if you need to override the default API URL:
   ```env
   VITE_API_BASE_URL=http://localhost:3001
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

4. **Build for production:**
   ```bash
   npm run build
   ```

   The built files will be in the `dist` directory.

## Features

- Dashboard with key metrics
- Analytics page with charts and visualizations
- Real-time data from Azure SQL Database via backend API

## Development

The frontend uses:
- React 18
- TypeScript
- Vite
- Tailwind CSS
- ApexCharts
- React Router

## Production Deployment

For Azure Static Web Apps or similar:
1. Build the application: `npm run build`
2. Deploy the `dist` folder
3. Ensure the backend API URL is correctly configured


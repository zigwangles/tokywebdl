# TokyDL

A Next.js application.

## Deployment to Vercel

This project is configured for seamless deployment to Vercel directly from GitHub.

### Deploy with Vercel

1. Push your code to a GitHub repository
2. Visit [Vercel](https://vercel.com)
3. Sign in with GitHub
4. Click "Add New..." → "Project"
5. Select your repository
6. Vercel will automatically detect Next.js and use the optimal build settings
7. Click "Deploy"

### Environment Variables

If needed, add the following environment variables in the Vercel project settings:
- `NEXT_TYPESCRIPT_CHECK=false`
- `TYPESCRIPT_SKIP_ERRORS=true`

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
``` 
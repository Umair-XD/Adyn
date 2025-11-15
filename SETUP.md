# Adyn Platform - Quick Setup Guide

## Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- MongoDB running (local or MongoDB Atlas account)
- npm or yarn package manager

## Step-by-Step Setup

### 1. Install Dependencies

From the `adyn-platform` directory:

```bash
npm run setup
```

This command will:
- Install all Node.js dependencies
- Build both MCP servers (marketing and support agents)
- Generate Prisma client

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and update the following:

```env
# MongoDB Connection
DATABASE_URL="mongodb://localhost:27017/adyn"
# Or for MongoDB Atlas:
# DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/adyn?retryWrites=true&w=majority"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-secure-random-string-here"

# Optional: OpenAI API (for enhanced semantic analysis)
OPENAI_API_KEY=""
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Initialize Database

Push the Prisma schema to your MongoDB:

```bash
npm run prisma:push
```

### 4. Start the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## First Time Usage

### 1. Create an Account

1. Navigate to http://localhost:3000
2. You'll be redirected to the login page
3. Click "Sign up"
4. Enter your email, password, and name
5. Click "Sign Up"

### 2. Create Your First Project

1. After logging in, you'll see the dashboard
2. Click "Create New Project"
3. Enter a project name (e.g., "My First Campaign")
4. Add a description (optional)
5. Click "Create Project"

### 3. Analyze Your First URL

1. Open your project
2. Click "Analyze URL"
3. Enter a website URL (e.g., "https://www.apple.com/iphone")
4. Select a campaign objective (e.g., "Conversions")
5. Click "Analyze"
6. Wait 10-30 seconds for the analysis to complete

### 4. View Campaign Results

Once analysis is complete, you'll be redirected to the campaign detail page where you can:
- View product summary and insights
- See platform-specific ad creatives
- Review audience targeting recommendations
- Check campaign strategy and budget suggestions
- Export the complete campaign as JSON

### 5. Try the Support Chat

1. Click the blue chat icon in the bottom-right corner
2. Ask questions like:
   - "How do I create a project?"
   - "What platforms does Adyn support?"
   - "How do I export a campaign?"

## Troubleshooting

### MongoDB Connection Issues

**Error**: "MongoServerError: Authentication failed"

**Solution**:
- Verify your MongoDB connection string in `.env`
- For local MongoDB, ensure the service is running
- For MongoDB Atlas, check your username, password, and IP whitelist

### MCP Server Not Found

**Error**: "ENOENT: no such file or directory"

**Solution**:
```bash
cd mcp-servers/adyn-marketing
npm install
npm run build
cd ../adyn-support
npm install
npm run build
```

### Prisma Client Not Generated

**Error**: "Cannot find module '@prisma/client'"

**Solution**:
```bash
npm run prisma:generate
```

### Port Already in Use

**Error**: "Port 3000 is already in use"

**Solution**:
```bash
# Use a different port
PORT=3001 npm run dev
```

### NextAuth Configuration Error

**Error**: "NEXTAUTH_URL or NEXTAUTH_SECRET is not set"

**Solution**:
- Ensure `.env` file exists in the `adyn-platform` directory
- Verify `NEXTAUTH_URL` and `NEXTAUTH_SECRET` are set
- Restart the development server

## Development Tips

### Rebuilding MCP Servers

After making changes to MCP server code:

```bash
npm run build:mcp
```

### Resetting the Database

To clear all data and start fresh:

```bash
npm run prisma:push -- --force-reset
```

### Viewing Database

Use Prisma Studio to browse your database:

```bash
npx prisma studio
```

### Checking Logs

MCP server logs appear in the terminal where you ran `npm run dev`. Look for:
- "Adyn Marketing Agent MCP server running on stdio"
- "Adyn Support Agent MCP server running on stdio"

## Production Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import the project in Vercel
3. Set environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `NEXTAUTH_URL` (your production URL)
   - `NEXTAUTH_SECRET`
4. Deploy

### Environment Variables for Production

Ensure these are set in your production environment:
- `DATABASE_URL`: MongoDB Atlas connection string
- `NEXTAUTH_URL`: Your production domain (e.g., https://adyn.app)
- `NEXTAUTH_SECRET`: Secure random string (different from development)
- `NODE_ENV`: "production"

## Next Steps

- Explore the dashboard and create multiple projects
- Analyze different types of websites
- Compare campaign strategies across different URLs
- Export campaigns and integrate with your ad platforms
- Customize the MCP tools for your specific needs

## Getting Help

- Check the main README.md for detailed documentation
- Use the in-app support chat for platform questions
- Review the code in `mcp-servers/` to understand tool implementations
- Check API routes in `app/api/` for backend logic

## Success Indicators

You'll know everything is working when:
- ✅ You can register and log in
- ✅ You can create projects
- ✅ URL analysis completes successfully
- ✅ Campaign details display correctly
- ✅ Support chat responds to messages
- ✅ JSON export downloads properly

Enjoy using Adyn! 🚀

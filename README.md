# Adyn - Marketing Intelligence Platform

A comprehensive SaaS platform that leverages the Model Context Protocol (MCP) to provide autonomous marketing analysis and campaign generation across Facebook, Instagram, TikTok, and Google.

## Features

- **MCP-Based Marketing Agent**: Analyzes websites and generates comprehensive marketing campaigns
- **MCP-Based Support Agent**: Provides platform assistance and guidance
- **Full-Stack Web Application**: Built with Next.js 14+, TypeScript, and TailwindCSS
- **Project Management**: Organize campaigns by client or product
- **URL Analysis**: Automatically extract insights from any website
- **Multi-Platform Campaigns**: Generate ads for Facebook, Instagram, TikTok, and Google
- **Audience Targeting**: Detailed demographic and behavioral targeting
- **Campaign Strategy**: Budget suggestions, duration, and format recommendations
- **Support Chat Widget**: Integrated AI support assistant
- **JSON Export**: Export complete campaign data

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, NextAuth
- **Database**: MongoDB with Mongoose ODM
- **MCP Servers**: Node.js with @modelcontextprotocol/sdk
- **Authentication**: NextAuth with credentials provider

## Prerequisites

- Node.js 18+ and npm
- MongoDB (local or MongoDB Atlas)

## Installation

1. **Clone and navigate to the project**:
   ```bash
   cd adyn-platform
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Install MCP server dependencies**:
   ```bash
   cd mcp-servers/adyn-marketing
   npm install
   npm run build
   cd ../adyn-support
   npm install
   npm run build
   cd ../..
   ```

4. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and update:
   - `DATABASE_URL`: Your MongoDB connection string
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL`: Your app URL (http://localhost:3000 for development)

5. **Start the development server**:
   ```bash
   npm run dev
   ```
   
   MongoDB will connect automatically when the app starts.

## Running the Application

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

3. **Create an account**:
   - Click "Sign up" on the login page
   - Enter your email and password
   - Start creating projects and analyzing URLs!

## Project Structure

```
adyn-platform/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── adyn/                 # Marketing agent endpoints
│   │   ├── support/              # Support chat endpoints
│   │   ├── projects/             # Project CRUD endpoints
│   │   └── campaigns/            # Campaign endpoints
│   ├── dashboard/                # Dashboard pages
│   │   ├── projects/             # Project management
│   │   └── campaigns/            # Campaign details
│   ├── login/                    # Login page
│   └── register/                 # Registration page
├── components/                   # React components
│   └── support/                  # Support chat widget
├── lib/                          # Utilities
│   ├── mongoose.ts               # MongoDB connection
│   ├── auth.ts                   # NextAuth configuration
│   └── mcp-client.ts             # MCP client manager
├── mcp-servers/                  # MCP servers
│   ├── adyn-marketing/           # Marketing intelligence agent
│   │   └── src/
│   │       ├── tools/            # MCP tools
│   │       └── index.ts          # Server entry point
│   └── adyn-support/             # Support agent
│       └── src/
│           └── index.ts          # Server entry point
├── models/                       # Mongoose models
│   ├── User.ts
│   ├── Project.ts
│   ├── Source.ts
│   ├── Campaign.ts
│   └── GenerationLog.ts
├── types/                        # TypeScript types
│   ├── index.ts                  # MCP tool types
│   └── next-auth.d.ts            # NextAuth types
└── .env                          # Environment variables
```

## Usage

### Creating a Project

1. Navigate to the Dashboard
2. Click "Create New Project"
3. Enter project name and description
4. Click "Create Project"

### Analyzing a URL

1. Open a project
2. Click "Analyze URL"
3. Enter the website URL
4. Select campaign objective
5. Click "Analyze"
6. Wait for the analysis to complete (usually 10-30 seconds)

### Viewing Campaign Results

1. Click on a campaign from the project page
2. View tabs:
   - **Overview**: Product summary and keywords
   - **Ads**: Platform-specific ad creatives
   - **Audience**: Targeting demographics and behaviors
   - **Strategy**: Budget, duration, and formats

### Exporting Campaign Data

1. Open a campaign
2. Click "Export JSON"
3. Save the JSON file with complete campaign data

### Using Support Chat

1. Click the chat icon in the bottom-right corner
2. Ask questions about platform features
3. Get instant help and guidance

## MCP Tools

### Adyn Marketing Agent Tools

1. **fetch_url**: Fetches HTML content from a URL
2. **extract_content**: Extracts readable content, images, and metadata
3. **semantic_analyze**: Analyzes text for marketing insights
4. **generate_ads**: Creates platform-specific ad creatives
5. **audience_builder**: Builds detailed audience targeting
6. **campaign_builder**: Generates complete campaign strategy

### Adyn Support Agent

- No tools (conversational only)
- Provides platform guidance and troubleshooting
- Redirects marketing requests to main workspace

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth authentication
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get project details
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project
- `GET /api/campaigns/[id]` - Get campaign details
- `POST /api/adyn/generate` - Generate marketing campaign
- `POST /api/support/chat` - Support chat messages

## Development

### Building MCP Servers

```bash
cd mcp-servers/adyn-marketing
npm run build

cd ../adyn-support
npm run build
```

### MongoDB Connection

MongoDB connects automatically when the app starts. Make sure:
- MongoDB is running locally, OR
- You have a valid MongoDB Atlas connection string in `.env`

### Type Checking

```bash
npm run build
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

- `DATABASE_URL`: MongoDB Atlas connection string
- `NEXTAUTH_URL`: Your production URL
- `NEXTAUTH_SECRET`: Secure random string
- `OPENAI_API_KEY`: (Optional) For enhanced semantic analysis

## Troubleshooting

### MCP Server Connection Issues

- Ensure MCP servers are built: `npm run build` in each server directory
- Check server paths in `lib/mcp-client.ts`
- Verify Node.js version (18+)

### Database Connection Issues

- Verify MongoDB is running (local or Atlas)
- Check `DATABASE_URL` in `.env`
- Restart the development server

### Authentication Issues

- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your app URL
- Clear browser cookies and try again

## License

MIT

## Support

For issues and questions, use the in-app support chat or create an issue on GitHub.

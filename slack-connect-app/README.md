# Slack Connect App

This is a full-stack app built with React + Node.js that integrates with Slack to send and schedule messages.

## Features
- Connect to Slack via OAuth 2.0
- Send immediate messages to a Slack channel
- Schedule messages for future delivery
- View and cancel scheduled messages

## Tech Stack
- Frontend: React + TypeScript
- Backend: Node.js + Express + TypeScript
- Persistence: JSON files (tokens and messages)

## Setup Instructions

### Backend Setup
```bash
cd server
cp .env.example .env
# Fill in your Slack client credentials
npm install
npx ts-node src/index.ts
```

### Frontend Setup
```bash
cd client
npm install
npm start
```

## Slack Setup
- Go to https://api.slack.com/apps and create a new app
- Set OAuth scopes: `chat:write`, `channels:read`
- Add redirect URI: `http://localhost:3001/auth/slack/callback`
- Use these credentials in your `.env` file



## Author
Internship Assignment for COBALT.AI


# MyOS Setup Guide

## Prerequisites
- Node.js 18+
- PostgreSQL database (Railway recommended)

## 1. Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
DATABASE_URL="postgresql://user:password@host:5432/myos"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"
ANTHROPIC_API_KEY="sk-ant-..."
TWILIO_ACCOUNT_SID=""        # optional
TWILIO_AUTH_TOKEN=""         # optional
TWILIO_PHONE_NUMBER=""       # optional (e.g. +15551234567)
PLAID_CLIENT_ID=""           # optional
PLAID_SECRET=""              # optional
PLAID_ENV="sandbox"          # sandbox | development | production
```

## 2. Database Setup

```bash
# Push schema to database
npx prisma db push

# Seed with sample data
npx prisma db seed
```

Default login: `admin@myos.com` / `password123`

## 3. Development

```bash
npm run dev
```

## 4. Railway Deployment

1. Create a PostgreSQL database on Railway
2. Copy the `DATABASE_URL` from Railway to your env vars
3. Deploy the Next.js app to Railway (or Vercel)

## Twilio Webhook

Set your Twilio WhatsApp/SMS webhook to:
```
https://your-domain.com/api/webhook/twilio
```
HTTP Method: POST

## Plaid Integration

The bank page uses placeholder data by default. To connect real bank accounts:
1. Get Plaid credentials from dashboard.plaid.com
2. Use the `/api/plaid/link` → `/api/plaid/exchange` → `/api/plaid/sync` flow

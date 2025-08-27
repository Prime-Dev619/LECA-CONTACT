LECA – Student Marketplace (React Native + Node/Express + PostgreSQL)

This repo contains a minimal, production-ready scaffold for LECA: a secure marketplace exclusively for students.

Stack
- Backend: Node.js, Express, PostgreSQL, Socket.IO, Joi, JWT, Helmet, CORS, Morgan
- Frontend: React Native (Expo), React Navigation, Redux Toolkit, SecureStore, Socket.IO client

Features
- Authentication with email + university ID, .edu email verification
- Marketplace CRUD, search, and filters
- Secure transactions (mock payment, order records, notifications)
- Messaging between buyers and sellers (REST + websockets)
- Profiles, listings, purchases, and ratings

Quickstart

Backend
1. Copy env file:
```bash
cp /workspace/leca-backend/.env.example /workspace/leca-backend/.env
```
2. Edit `/workspace/leca-backend/.env` and set `DATABASE_URL` and `JWT_SECRET`.
3. Install and run migrations:
```bash
cd /workspace/leca-backend && npm i
psql "$DATABASE_URL" -f schema.sql
npm run dev
```
- Server runs on `http://localhost:4000`.

Frontend (Expo)
1. Install deps:
```bash
cd /workspace/leca-app && npm i
```
2. Create an `.env` (or use Expo env vars) with:
```
EXPO_PUBLIC_API_URL=http://localhost:4000/api
EXPO_PUBLIC_WS_URL=http://localhost:4000
```
3. Start Expo:
```bash
npm run start
```

Security Notes
- JWT stored in Expo SecureStore
- Validation on all inputs via Joi
- Helmet, CORS restrictions via `CLIENT_ORIGIN`
- SQL parameterization everywhere

Project Structure
- `/workspace/leca-backend`: Express API, routes, DB schema, sockets
- `/workspace/leca-app`: React Native app, Redux store, navigation, screens

Next steps
- Replace mock checkout with real PSP (Stripe) using Payment Intents
- Add media upload (S3 presigned URLs)
- Add admin moderation tools
- Expand search (filters, tags) and analytics
# LECA-CONTACT
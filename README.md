# Next.js + TypeScript + TailwindCSS + MongoDB + NextAuth + Zod

This project is bootstrapped with Next.js (App Router) and includes:
- **TypeScript** for type safety
- **TailwindCSS** for styling
- **MongoDB** (official driver) for database integration
- **NextAuth** (Google provider) for authentication
- **Zod** for schema validation

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Set up environment variables:**
   - Create a `.env.local` file in the root directory.
   - Add your MongoDB URI, NextAuth secret, and Google OAuth credentials:
     ```env
     MONGODB_URI=your_mongodb_connection_string
     NEXTAUTH_SECRET=your_nextauth_secret
     GOOGLE_CLIENT_ID=your_google_client_id
     GOOGLE_CLIENT_SECRET=your_google_client_secret
     ```
3. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the app.

## Features
- App Router structure (`/app` directory)
- Ready for authentication, validation, and database integration

## Customization
- Edit `app/page.tsx` to start building your app.
- Add API routes and authentication logic in `app/api/`.

## Learn More
- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [MongoDB Node.js Driver](https://www.npmjs.com/package/mongodb)
- [Zod Documentation](https://zod.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)

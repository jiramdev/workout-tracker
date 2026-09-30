// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sessionStillValid } from "@/lib/session-version";
import { LOGIN_ATTEMPT_LIMIT, LOGIN_WINDOW_MS, isRateLimited, recordAttempt } from "@/lib/rate-limit";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Vul een e-mail en wachtwoord in");
        }

        const email = credentials.email.toLowerCase();
        const limitKey = `login:${email}`;
        if (isRateLimited(limitKey, LOGIN_ATTEMPT_LIMIT, LOGIN_WINDOW_MS)) {
          throw new Error("Te veel pogingen. Probeer het later opnieuw.");
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) {
          recordAttempt(limitKey, LOGIN_WINDOW_MS);
          throw new Error("Geen account gevonden met dit e-mailadres");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValid) {
          recordAttempt(limitKey, LOGIN_WINDOW_MS);
          throw new Error("Ongeldig wachtwoord");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.sessionVersion = user.sessionVersion ?? 0;
        return token;
      }

      const userId = (typeof token.id === "string" && token.id) || token.sub;
      if (!userId) throw new Error("Session revoked");

      try {
        const row = await prisma.user.findUnique({
          where: { id: userId },
          select: { sessionVersion: true },
        });
        if (!row || !sessionStillValid(token.sessionVersion, row.sessionVersion)) {
          throw new Error("Session revoked");
        }
      } catch (error) {
        if (error instanceof Error && error.message === "Session revoked") throw error;
        return token;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || (token.sub as string);
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
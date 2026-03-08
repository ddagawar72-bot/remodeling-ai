import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { SessionUser } from "@/types";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/login" },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:     { label: "Email",     type: "email" },
        password:  { label: "Password",  type: "password" },
        autoLogin: { label: "AutoLogin", type: "text" },
        sig:       { label: "Sig",       type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const email = credentials.email.toLowerCase().trim();

        // jeon.shop 자동 로그인 (서명 검증)
        if (credentials.autoLogin === "true" && credentials.sig) {
          const secret = process.env.NEXTAUTH_SECRET ?? "jeon2024remodelingSecretKey123456789";
          const expected = Buffer.from(email + secret).toString("base64").slice(0, 20);
          if (credentials.sig !== expected) return null;

          const user = await db.user.findUnique({ where: { email } });
          if (!user) return null;
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            points: user.points,
          };
        }

        // 일반 이메일/비밀번호 로그인
        if (!credentials.password) return null;
        const user = await db.user.findUnique({ where: { email } });
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          points: user.points,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        const email = user.email.toLowerCase().trim();
        const existing = await db.user.findUnique({ where: { email } });
        if (!existing) {
          await db.user.create({
            data: {
              email,
              name: user.name ?? "구글 회원",
              passwordHash: "",
              role: "MEMBER",
              points: 100,
            },
          });
        }
      }
      return true;
    },

    async jwt({ token, user, account, trigger }) {
      if (account?.provider === "credentials" && user) {
        token.id     = user.id;
        token.role   = (user as SessionUser).role ?? "MEMBER";
        token.points = (user as SessionUser).points ?? 0;
        return token;
      }

      if (account?.provider === "google") {
        const email = user?.email ?? (token.email as string | undefined);
        if (email) {
          const dbUser = await db.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            select: { id: true, role: true, points: true, name: true },
          });
          if (dbUser) {
            token.id     = dbUser.id;
            token.role   = dbUser.role;
            token.points = dbUser.points;
            token.name   = dbUser.name ?? user?.name;
          }
        }
        if (!token.role) token.role = "MEMBER";
        return token;
      }

      if (token.id && !token.role) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, points: true },
        });
        if (dbUser) {
          token.role   = dbUser.role;
          token.points = dbUser.points;
        }
      }

      if (trigger === "update" && token.id) {
        const fresh = await db.user.findUnique({
          where: { id: token.id as string },
          select: { points: true, role: true },
        });
        if (fresh) {
          token.points = fresh.points;
          token.role   = fresh.role;
        }
      }

      if (!token.role) token.role = "MEMBER";
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as SessionUser).id     = token.id as string;
        (session.user as SessionUser).role   = (token.role as SessionUser["role"]) ?? "MEMBER";
        (session.user as SessionUser).points = (token.points as number) ?? 0;
        if (token.name) session.user.name = token.name as string;
      }
      return session;
    },
  },
};

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import KakaoProvider from "next-auth/providers/kakao";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { SessionUser } from "@/types";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/login" },

  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });
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
      if (account?.provider === "kakao") {
        if (!user.email) return false;
        const email = user.email.toLowerCase().trim();

        // 이미 있으면 그냥 통과, 없으면 자동 가입
        const existing = await db.user.findUnique({ where: { email } });
        if (!existing) {
          await db.user.create({
            data: {
              email,
              name: user.name ?? "카카오 회원",
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
      // 1) 일반 이메일 로그인
      if (account?.provider === "credentials" && user) {
        token.id    = user.id;
        token.role  = (user as SessionUser).role ?? "MEMBER";
        token.points = (user as SessionUser).points ?? 0;
        return token;
      }

      // 2) 카카오 로그인 - signIn 콜백 직후 DB에서 유저 조회
      if (account?.provider === "kakao") {
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
            token.name   = dbUser.name ?? token.name;
          }
        }
        // role이 없으면 기본값
        if (!token.role) token.role = "MEMBER";
        return token;
      }

      // 3) 이후 요청 - 포인트 최신화
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

      // role 항상 보장
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

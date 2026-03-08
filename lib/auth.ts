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
      // 카카오 로그인 시 자동 회원가입
      if (account?.provider === "kakao") {
        const email = user.email;
        if (!email) return false;

        const existing = await db.user.findUnique({ where: { email } });
        if (!existing) {
          await db.user.create({
            data: {
              email,
              name: user.name ?? "카카오 회원",
              passwordHash: "",
              role: "MEMBER",
              points: 100, // 가입 보너스
            },
          });
        }
      }
      return true;
    },

    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as SessionUser).role;
        token.points = (user as SessionUser).points;
      }

      // 카카오 로그인 시 DB에서 id/role/points 가져오기
      if (account?.provider === "kakao" && user?.email) {
        const dbUser = await db.user.findUnique({
          where: { email: user.email },
          select: { id: true, role: true, points: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.points = dbUser.points;
        }
      }

      // 포인트 최신화
      if (trigger === "update" || !token.points) {
        const fresh = await db.user.findUnique({
          where: { id: token.id as string },
          select: { points: true, role: true },
        });
        if (fresh) {
          token.points = fresh.points;
          token.role = fresh.role;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as SessionUser).id = token.id as string;
        (session.user as SessionUser).role = token.role as SessionUser["role"];
        (session.user as SessionUser).points = token.points as number;
      }
      return session;
    },
  },
};

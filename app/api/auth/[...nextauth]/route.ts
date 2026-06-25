import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import GoogleProvider from "next-auth/providers/google";

import { readQuery } from "@/lib/db";
import { validateEmail, validatePassword } from "@/lib/validation";
import { getUserByEmail, createUser } from "@/lib/db/repositories/public/user.public.repository";

type AuthUserRow = {
  id: string;
  email: string;
  phone?: string;
  password_hash?: string;
  password?: string;
  is_active?: boolean;
  profile?: {
    user_name?: string;
    avatarUrl?: string;
    first_name?: string;
    last_name?: string;
  };
  role?: {
    id?: string;
    name?: string;
  };
};

export const authOptions: NextAuthOptions = {
  providers: [
    // =========================================================
    // ADMIN LOGIN
    // =========================================================
    CredentialsProvider({
      id: "admin-login",
      name: "Admin Login",

      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const cleanEmail = validateEmail(credentials.email);
          const cleanPass = validatePassword(credentials.password);

          const [user] = await readQuery<AuthUserRow>(
            `
  SELECT
    u.id,
    u.email,
    u.password_hash,
    u.is_active,

    json_build_object(
      'user_name', up.user_name,
      'avatarUrl', up.avatar_url,
      'first_name', up.first_name,
      'last_name', up.last_name
    ) AS profile,

    json_build_object(
      'id', r.id,
      'name', r.name
    ) AS role

  FROM public.auth_users u
  JOIN public.user_profiles up
    ON up.user_id = u.id
  JOIN public.roles r
    ON r.id = up.role_id

  WHERE u.email = $1
  LIMIT 1
  `,
            [cleanEmail]
          );

          // timing-safe comparison: use a dummy hash if user not found
          // so bcrypt.compare always runs and never throws on undefined
          const DUMMY_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8.ho2ZMwNRTxpIZpK1bU.Nh4KfQd5K';
          const hash = user?.password_hash ?? DUMMY_HASH;

          const passwordValid = await bcrypt.compare(cleanPass, hash);

          if (!user || !passwordValid || user.is_active !== true) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,

            role: {
              id: user.role?.id ?? "",
              name: user.role?.name ?? "",
            },

            profile: {
              user_name: user.profile?.user_name ?? "",
              avatarUrl: user.profile?.avatarUrl ?? "",
              first_name: user.profile?.first_name ?? "",
              last_name: user.profile?.last_name ?? "",
            },
          } as any;
        } catch (err) {
          console.error("Admin login error:", err);
          return null;
        }
      },
    }),

    // =========================================================
    // CLIENT OTP LOGIN
    // =========================================================
    CredentialsProvider({
      id: "client-login",
      name: "Client OTP",

      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const cleanEmail = validateEmail(credentials.email);
          const cleanPass = validatePassword(credentials.password);

          const [user] = await readQuery<AuthUserRow>(
            `
  SELECT
    u.id,
    u.email,
    u.phone,
    u.password AS password_hash,
    TRUE AS is_active,

    json_build_object(
      'user_name', u."fullName",
      'avatarUrl', NULL,
      'first_name', u."fullName",
      'last_name', NULL
    ) AS profile,

    json_build_object(
      'id', 'user',
      'name', 'user'
    ) AS role

  FROM public."User" u
  WHERE LOWER(u.email) = LOWER($1)
  LIMIT 1
  `,
            [cleanEmail]
          );

          // timing-safe comparison: use a dummy hash if user not found
          const DUMMY_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8.ho2ZMwNRTxpIZpK1bU.Nh4KfQd5K';
          const hash = user?.password_hash ?? DUMMY_HASH;

          const passwordValid = await bcrypt.compare(cleanPass, hash);

          if (!user || !passwordValid || user.is_active !== true) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            phone: user.phone,

            role: {
              id: user.role?.id ?? "",
              name: user.role?.name ?? "",
            },

            profile: {
              user_name: user.profile?.user_name ?? "",
              avatarUrl: user.profile?.avatarUrl ?? "",
              first_name: user.profile?.first_name ?? "",
              last_name: user.profile?.last_name ?? "",
            },
          } as any;
        } catch (err) {
          console.error("OTP login error:", err);
          return null;
        }
      },
    }),
    // ---------------------------------------------------------
    // GOOGLE OAUTH (new)
    // ---------------------------------------------------------
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Force Google to always show the account chooser
      authorization: { params: { prompt: "select_account" } },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },

  callbacks: {
    // Sign‑in callback – optional email‑domain restriction
    async signIn({ user, account, profile }) {
      // Allow all for non‑Google providers
      if (account?.provider !== "google") return true;

      // If you set ALLOWED_GOOGLE_DOMAIN, only accept that domain
      const allowedDomain = process.env.ALLOWED_GOOGLE_DOMAIN;
      if (allowedDomain && profile?.email && !profile.email.endsWith(`@${allowedDomain}`)) {
        // Returning false redirects to the sign‑in page with an error
        return false;
      }
      return true;
    },

    async jwt({ token, user, account, trigger, session }) {
      // Populate token on initial sign‑in (including OAuth)
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.phone = user.phone;
        token.role = user.role;
        token.profile = user.profile;
        token.password = (user as any).password ?? "";
        token.requiresPasswordSetup = !(user as any).password || (user as any).password === "";
      }

      // Ensure email is set for Google OAuth if not already present
      if (account?.provider === "google" && !token.email && user?.email) {
        token.email = user.email;
      }

      // Auto‑create/fetch user record for Google sign‑in
      if (account?.provider === "google" && token.email) {
        const existing = await getUserByEmail(token.email);
        if (existing.length > 0) {
          token.id = existing[0].id;
        } else {
          const fullName = (token.profile as any)?.first_name || token.email.split("@")[0];
          const [first_name = "", ...lastParts] = fullName.split(" ");
          const last_name = lastParts.join(" ");
          const newUser = await createUser({
            first_name,
            last_name,
            email: token.email,
            password: "",
          });
          token.id = newUser.id;
        }
      }

      // Session updates
      if (trigger === "update" && session) {
        if (session.email) token.email = session.email;
        if (session.phone) token.phone = session.phone;
        if (session.profile) token.profile = { ...token.profile, ...session.profile };
        if (session.role) token.role = session.role;
      }

      return token;
    },

    async session({ session, token }) {
      session.user = {
        id: token.id as string,
        email: token.email as string,
        phone: token.phone as string,
        role: token.role,
        profile: token.profile,
        password: token.password,
        requiresPasswordSetup: token.requiresPasswordSetup,
      } as any;

      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
  },

  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",

      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure:
          process.env.NODE_ENV === "production",
      },
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { neon } from "@neondatabase/serverless";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;
      try {
        const sql = neon(process.env.DATABASE_URL!);
        // Upsert user
        await sql`
          INSERT INTO users (id, email, name, image)
          VALUES (gen_random_uuid()::text, ${user.email}, ${user.name ?? null}, ${user.image ?? null})
          ON CONFLICT (email) DO UPDATE
          SET name = EXCLUDED.name,
              image = EXCLUDED.image,
              updated_at = NOW()
        `;

        // Get the user id
        const [dbUser] = await sql`SELECT id FROM users WHERE email = ${user.email}`;
        if (dbUser && account) {
          user.id = dbUser.id as string;
          // Upsert account
          await sql`
            INSERT INTO accounts (user_id, type, provider, provider_account_id, refresh_token, access_token, expires_at, token_type, scope, id_token, session_state)
            VALUES (${dbUser.id}, ${account.type}, ${account.provider}, ${account.providerAccountId}, ${account.refresh_token ?? null}, ${account.access_token ?? null}, ${account.expires_at ?? null}, ${account.token_type ?? null}, ${account.scope ?? null}, ${account.id_token ?? null}, ${account.session_state ?? null})
            ON CONFLICT (provider, provider_account_id) DO UPDATE
            SET access_token = EXCLUDED.access_token,
                refresh_token = EXCLUDED.refresh_token,
                expires_at = EXCLUDED.expires_at
          `;
        }
        return true;
      } catch (error) {
        console.error("SignIn callback error:", error);
        return false;
      }
    },

    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },

    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      if (token.email && !token.sub) {
        const sql = neon(process.env.DATABASE_URL!);
        const [dbUser] = await sql`SELECT id FROM users WHERE email = ${token.email}`;
        if (dbUser) token.sub = dbUser.id as string;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
});

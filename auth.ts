import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

// NextAuth v5 requires AUTH_SECRET. NEXTAUTH_SECRET is the v4 alias — support both.
const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret,
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
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id ?? token.sub;
        token.picture = user.image;
        token.provider = account?.provider;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = (token.id ?? token.sub ?? "") as string;
      session.user.image = token.picture as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});

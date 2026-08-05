import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
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
    async jwt({ token, user, account }) {
      // On first sign-in, persist basic info into the token
      if (user) {
        token.id = user.id ?? token.sub;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
        token.provider = account?.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = (token.id as string) ?? (token.sub as string) ?? "";
        session.user.name = token.name;
        session.user.email = token.email as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});

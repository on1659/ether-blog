import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) {
        token.githubUsername = profile.login;
      }
      return token;
    },
    async session({ session, token }) {
      const adminId = process.env.ADMIN_GITHUB_ID;
      const isAdmin = token.githubUsername === adminId;
      return {
        ...session,
        user: {
          ...session.user,
          githubUsername: token.githubUsername as string,
          isAdmin,
        },
      };
    },
  },
});

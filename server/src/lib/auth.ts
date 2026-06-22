import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins";
import { prisma } from "./prisma.js";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {provider: "postgresql"}),
    emailAndPassword: { enabled: true },
    trustedOrigins: ["http://localhost:5173"],
    plugins: [
        organization(),
    ],
});
import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    baseURL: "http://localhost:4000",
    plugins: [organizationClient()],
});

// Frontend auth client — gives us all auth functions and hooks for the UI
// baseURL points to our Express server where BetterAuth is mounted
// organizationClient plugin adds workspace/org functions like create, useActiveOrganization
// Mirror of the backend auth.ts but for client side usage
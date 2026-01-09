import { ClerkProvider } from "@clerk/clerk-react";

// Clerk publishable key - should be in environment variables
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  console.warn(
    "VITE_CLERK_PUBLISHABLE_KEY is not set. Clerk authentication will not work."
  );
}

export { ClerkProvider, clerkPubKey };

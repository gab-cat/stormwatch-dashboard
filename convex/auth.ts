import { query } from "./_generated/server";

/**
 * Get the current authenticated user ID from Clerk
 * Returns null if not authenticated
 * 
 * NOTE: This requires Clerk to be configured in your Convex deployment.
 * Set up Clerk authentication in your Convex dashboard and configure
 * the CLERK_JWT_ISSUER environment variable.
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    // Clerk integration will be available via ctx.auth.getUserId() once configured
    // For now, return null until Clerk is set up
    try {
      // @ts-ignore - Clerk auth will be available after configuration
      const userId = ctx.auth?.getUserId?.();
      return userId || null;
    } catch {
      return null;
    }
  },
});

/**
 * Check if user is authenticated
 */
export const isAuthenticated = query({
  args: {},
  handler: async (ctx) => {
    try {
      // @ts-ignore - Clerk auth will be available after configuration
      const userId = ctx.auth?.getUserId?.();
      return userId !== null && userId !== undefined;
    } catch {
      return false;
    }
  },
});

/**
 * Get user role (admin, operator, viewer)
 * This can be extended to check Clerk user metadata
 */
export const getUserRole = query({
  args: {},
  handler: async (ctx) => {
    try {
      // @ts-ignore - Clerk auth will be available after configuration
      const userId = ctx.auth?.getUserId?.();
      if (!userId) return null;
      
      // In production, fetch user metadata from Clerk
      // For now, return a default role
      // You can extend this to check Clerk user publicMetadata.role
      return "viewer"; // or "admin", "operator"
    } catch {
      return null;
    }
  },
});

/**
 * useAuth hook - thin wrapper around AuthContext
 * 
 * For backward compatibility, this re-exports the useAuth hook from AuthContext.
 * New code should import directly from AuthContext.
 */

export { useAuth } from "@/contexts/AuthContext";

/**
 * Auth route group layout.
 * Provides the centered auth card layout for /signin, /signup,
 * /verify-email, /forgot-password, and /auth/callback.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-container">
      {children}
    </div>
  );
}

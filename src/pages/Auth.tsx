import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { validatePasswordStrength } from "@/lib/password-validation";
import { WelcomeBackToast } from "@/components/WelcomeBackToast";
import { AppLoading } from "@/components/ui/AppLoading";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const isInvited = searchParams.get("invited") === "true";
  const inviteRole = searchParams.get("role") || "";
  const inviteEmail = searchParams.get("email") || "";
  
  const [isLogin, setIsLogin] = useState(!isInvited && searchParams.get("mode") !== "signup");
  const [email, setEmail] = useState(inviteEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const mode = searchParams.get("mode");
    const invited = searchParams.get("invited") === "true";
    const emailParam = searchParams.get("email");
    
    if (invited) {
      // Invited users should be in signup mode with pre-filled email
      setIsLogin(false);
      if (emailParam) setEmail(emailParam);
    } else if (mode === "signup") {
      setIsLogin(false);
      
      // Check for advertiser signup data
      const advertiserData = localStorage.getItem("advertiserSignupData");
      if (advertiserData) {
        try {
          const data = JSON.parse(advertiserData);
          setFullName(data.contact_name || "");
          setEmail(data.contact_email || "");
        } catch (e) {
          console.error("Failed to parse advertiser data:", e);
        }
      }
    } else if (mode === "login") {
      setIsLogin(true);
    }

    // Check if this is a password reset link
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");
    if (type === "recovery") {
      setShowResetPassword(true);
    }
  }, [searchParams]);

  const validatePassword = (pwd: string): boolean => {
    return (
      pwd.length >= 10 &&
      /[A-Z]/.test(pwd) &&
      /[a-z]/.test(pwd) &&
      /\d/.test(pwd) &&
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pwd)
    );
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        // Get display name for personalized welcome
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', (await supabase.auth.getUser()).data.user?.id)
          .maybeSingle();
        
        const firstName = profile?.full_name?.split(' ')[0];
        
        toast.custom((t) => (
          <WelcomeBackToast 
            firstName={firstName} 
            onDismiss={() => toast.dismiss(t)} 
          />
        ), { duration: 4000 });
        
        // Show loading state during redirect
        setIsRedirecting(true);
        
        // Get user from session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setIsRedirecting(false);
          navigate("/dashboard");
          return;
        }
        
        // Check if onboarding is completed
        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('onboarding_completed, default_landing_route')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        // Redirect to onboarding if not completed (for existing users who haven't onboarded)
        if (prefs && !prefs.onboarding_completed) {
          navigate("/onboarding");
          return;
        }
        
        // Get user's preferred landing route
        const landingRoute = prefs?.default_landing_route || '/dashboard';
        
        // Check user role
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id);
        
        const isAdmin = roles?.some(r => r.role === 'admin' || r.role === 'super_admin') || false;
        const isBoardMember = roles?.some(r => r.role === 'board_member') || false;
        const isAdvertiser = roles?.some(r => r.role === 'advertiser') || false;
        
        // Check for signup intent and redirect
        const intent = localStorage.getItem("signupIntent");
        if (intent) {
          localStorage.removeItem("signupIntent");
          navigate(intent);
        } else if (isAdmin) {
          // Admin users always go to /admin - clear any workspace memory
          localStorage.removeItem('currentWorkspaceId');
          navigate("/admin");
        } else if (isBoardMember) {
          // Board members always go to /board
          localStorage.removeItem('currentWorkspaceId');
          navigate("/board");
        } else if (isAdvertiser) {
          // Check if advertiser has completed onboarding
          const { data: profile } = await supabase
            .from('profiles')
            .select('advertiser_onboarding_completed')
            .eq('id', session.user.id)
            .single();
          
          if (profile?.advertiser_onboarding_completed) {
            navigate("/advertiser");
          } else {
            navigate("/advertiser/signup");
          }
        } else {
          // Default creator flow - use user's preferred landing route
          navigate(landingRoute);
        }
      } else {
        // Validate password
        if (!validatePassword(password)) {
          throw new Error("Password does not meet all requirements");
        }

        // Check passwords match
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }

        // Password-based signup
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;
        
        // Send welcome email
        if (data.user) {
          try {
            await supabase.functions.invoke('send-welcome-email', {
              body: { 
                email,
                name: fullName,
              },
            });
          } catch (emailError) {
            // Don't block signup if email fails
            console.error('Welcome email failed:', emailError);
          }
          
          // Handle invited users - assign role and mark onboarding complete
          if (isInvited && inviteRole) {
            try {
              // Insert the role into user_roles
              const { error: roleError } = await supabase.from('user_roles').insert([{
                user_id: data.user.id,
                role: inviteRole as any,
              }]);
              
              if (roleError) console.error('Role insert error:', roleError);
              
              // Mark onboarding as complete for invited users
              await supabase.from('profiles').update({
                onboarding_completed: true,
              }).eq('id', data.user.id);
              
              // Get the invitation to find the inviter
              const { data: invitation } = await supabase
                .from('team_invitations')
                .select('inviter_id, invitee_name')
                .eq('invitee_email', email)
                .eq('status', 'pending')
                .single();
              
              // Update any pending invitations to accepted
              await supabase.from('team_invitations').update({
                status: 'accepted',
                accepted_at: new Date().toISOString(),
              }).eq('invitee_email', email).eq('status', 'pending');
              
              // Notify the inviter if this is a board member
              if (inviteRole === 'board_member' && invitation?.inviter_id) {
                try {
                  await supabase.functions.invoke('notify-board-invite-accepted', {
                    body: {
                      inviterUserId: invitation.inviter_id,
                      inviteeName: invitation.invitee_name || fullName,
                      inviteeEmail: email,
                    },
                  });
                  console.log('Board invite acceptance notification sent');
                } catch (notifyError) {
                  console.error('Failed to send board invite notification:', notifyError);
                }
              }
              
              console.log('Invited user setup complete:', inviteRole);
            } catch (inviteError) {
              console.error('Error setting up invited user:', inviteError);
            }
          }
        }

        toast.success("Account created! Check your email to confirm your account.");
        
        // Mark that user just signed up to show welcome modal on first login
        localStorage.setItem("justSignedUp", "true");
        
        // Check if this was an advertiser signup
        const advertiserData = localStorage.getItem("advertiserSignupData");
        if (advertiserData) {
          // Keep the advertiser data for the advertiser signup page to process
          // The advertiser signup page will complete the advertiser record creation
          navigate("/advertiser/signup");
        } else if (isInvited && inviteRole === 'board_member') {
          // Board members go directly to board portal
          navigate("/board");
        } else {
          // Redirect new users to onboarding
          navigate("/onboarding");
        }
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast.success("Password reset email sent! Check your email for the password reset link.");
      setShowForgotPassword(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate password
      if (!validatePassword(newPassword)) {
        throw new Error("Password does not meet all requirements");
      }

      // Check passwords match
      if (newPassword !== confirmNewPassword) {
        throw new Error("Passwords do not match");
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Password updated! Your password has been successfully reset.");
      
      setShowResetPassword(false);
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Show branded loading during redirect
  if (isRedirecting) {
    return <AppLoading message="Signing you in..." />;
  }

  const isAdvertiserSignup = !isLogin && localStorage.getItem("advertiserSignupData");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 shadow-soft">
        {/* Prominent banner for team invitation */}
        {isInvited && (
          <div className="mb-6 p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-2 border-primary rounded-lg">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 mb-2">
                <span className="text-2xl">🎉</span>
              </div>
              <h3 className="text-xl font-bold text-primary">You're Invited!</h3>
              <p className="text-sm font-medium">
                Create your password to join the team
                {inviteRole && <span className="block text-primary mt-1">Role: {inviteRole.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>}
              </p>
            </div>
          </div>
        )}

        {/* Prominent banner for advertiser signup final step */}
        {isAdvertiserSignup && !isInvited && (
          <div className="mb-6 p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-2 border-primary rounded-lg">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 mb-2">
                <span className="text-2xl">🎉</span>
              </div>
              <h3 className="text-xl font-bold text-primary">Last Step!</h3>
              <p className="text-sm font-medium">Create your password to complete your advertiser account</p>
            </div>
          </div>
        )}
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">
            Seeksy
          </h1>
          <p className="text-muted-foreground mt-2">
            {isInvited ? "Complete your account" : isLogin ? "Welcome back" : "Create your account"}
          </p>
        </div>

        {showResetPassword ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <PasswordInput
                id="newPassword"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="Enter your new password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <PasswordInput
                id="confirmNewPassword"
                value={confirmNewPassword}
                onChange={setConfirmNewPassword}
                placeholder="Confirm your new password"
              />
            </div>

            {newPassword && (
              <PasswordStrengthIndicator password={newPassword} />
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !validatePassword(newPassword) || newPassword !== confirmNewPassword}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Password
            </Button>
          </form>
        ) : showForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Reset Link
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setShowForgotPassword(false);
                setEmail("");
              }}
            >
              Back to login
            </Button>
          </form>
        ) : (
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                  placeholder="Your name"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                readOnly={isInvited && !!inviteEmail}
                className={isInvited && !!inviteEmail ? "bg-muted" : ""}
              />
              {isInvited && inviteEmail && (
                <p className="text-xs text-muted-foreground">Email pre-filled from your invitation</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
              />
            </div>

            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <PasswordInput
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Confirm your password"
                  />
                </div>

                {password && (
                  <PasswordStrengthIndicator password={password} />
                )}
              </>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || (!isLogin && (!validatePassword(password) || password !== confirmPassword))}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? "Sign In" : "Create Account"}
            </Button>

            {isLogin && (
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-primary hover:underline w-full text-center"
              >
                Forgot password?
              </button>
            )}

            {!showForgotPassword && !showResetPassword && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    const { error } = await supabase.auth.signInWithOAuth({
                      provider: 'google',
                      options: {
                        redirectTo: `${window.location.origin}/dashboard`,
                      },
                    });
                    if (error) {
                      toast.error(error.message);
                    }
                  }}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </>
            )}
          </form>
        )}

        {!showForgotPassword && !showResetPassword && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Auth;

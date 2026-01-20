import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, TrendingUp, FileText, BarChart3, Shield, Eye } from 'lucide-react';
import boardPortalHero from '@/assets/board-portal-hero.jpg';

const ROLE_CONFIG = {
  board_member: {
    title: 'Board Member',
    description: 'Join the Seeksy Board Portal to access company metrics, forecasts, and strategic documents.',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    features: ['Dashboard KPIs', 'Business Model', 'GTM Strategy', '3-Year Forecasts', 'Company Videos', 'Board Documents']
  },
  investor: {
    title: 'Investor',
    description: 'Access investor-specific views of Seeksy performance, financials, and growth trajectory.',
    icon: TrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    features: ['Investment Overview', 'Financial Projections', 'Market Analysis', 'Revenue Insights', 'Growth Metrics', 'Pitch Materials']
  },
  advisor: {
    title: 'Advisor',
    description: 'Join as a strategic advisor with access to company insights and planning documents.',
    icon: Eye,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    features: ['Strategic Overview', 'Market Intelligence', 'Competitive Analysis', 'Advisory Documents', 'Team Updates', 'Meeting Notes']
  },
  observer: {
    title: 'Observer',
    description: 'Read-only access to board materials and company updates.',
    icon: FileText,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    features: ['Board Updates', 'Company News', 'Public Documents', 'Milestone Tracking', 'Team Directory', 'Event Calendar']
  }
};

type RoleType = keyof typeof ROLE_CONFIG;

export default function BoardMemberJoin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const role = (searchParams.get('role') as RoleType) || 'board_member';
  const inviteCode = searchParams.get('code');
  const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.board_member;
  const IconComponent = roleConfig.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      // Sign up the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/board/dashboard`,
          data: {
            full_name: formData.fullName,
            invited_role: role,
            invite_code: inviteCode,
            onboarding_completed: true // Skip onboarding for board members
          }
        }
      });

      if (signUpError) throw signUpError;

      if (signUpData.user) {
        // Update profile with full name
        await supabase.from('profiles').update({
          full_name: formData.fullName,
          onboarding_completed: true
        }).eq('id', signUpData.user.id);

        // Assign board_member role
        await supabase.from('user_roles').insert({
          user_id: signUpData.user.id,
          role: 'board_member'
        });

        // Mark the invitation as accepted in team_invitations table
        await supabase.from('team_invitations')
          .update({ status: 'accepted' })
          .eq('invitee_email', formData.email)
          .eq('status', 'pending');

        // Notify admins
        await supabase.functions.invoke('notify-board-invite-accepted', {
          body: {
            inviterUserId: inviteCode || 'direct_signup',
            inviteeName: formData.fullName,
            inviteeEmail: formData.email
          }
        });

        toast.success('Account created! Redirecting to Board Portal...');
        navigate('/board/dashboard');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side with form */}
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-[#053877] via-[#0a4a8f] to-[#053877] flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-lg space-y-8">
          {/* Header */}
          <div className="text-white space-y-6">
            <div className="flex items-center gap-3">
              <img 
                src="/lovable-uploads/ee012793-e2be-4b76-a347-dad1dd059498.png" 
                alt="Seeksy" 
                className="h-10"
              />
              <span className="text-2xl font-bold">Board Portal</span>
            </div>
            
            <div className={`inline-flex items-center gap-2 ${roleConfig.bgColor} ${roleConfig.color} px-4 py-2 rounded-full`}>
              <IconComponent className="h-5 w-5" />
              <span className="font-semibold">{roleConfig.title}</span>
            </div>

            <h1 className="text-3xl lg:text-4xl font-bold leading-tight">
              Join the Seeksy<br />Board Portal
            </h1>
            
            <p className="text-lg text-white/80">
              {roleConfig.description}
            </p>
          </div>

          {/* Signup form */}
          <Card className="bg-white/95 backdrop-blur shadow-2xl border-0">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Create Your Account</CardTitle>
              <CardDescription>
                Set up your credentials to access the Board Portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Smith"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={8}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-[#053877] hover:bg-[#042a5c] text-white font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Account...' : 'Join Board Portal'}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By joining, you agree to the Seeksy Board Portal terms and NDA requirements.
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Features list */}
          <div className="text-white space-y-3">
            <p className="text-sm text-white/60 uppercase tracking-wider">You'll have access to:</p>
            <div className="grid grid-cols-2 gap-2">
              {roleConfig.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-white/90">
                  <Shield className="h-4 w-4 text-[#2C6BED]" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-white/60 text-sm pt-2">
              <BarChart3 className="h-4 w-4" />
              <span>Secure, read-only access to company data</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side with image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img 
          src={boardPortalHero} 
          alt="Business executives in boardroom meeting"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#053877]/30" />
      </div>
    </div>
  );
}

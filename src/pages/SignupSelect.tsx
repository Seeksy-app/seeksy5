import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, Megaphone, Users, Calendar, Building, Sparkles } from 'lucide-react';
import { type AccountType } from '@/hooks/useAccountType';

interface RoleOption {
  type: AccountType;
  label: string;
  description: string;
  icon: any;
  gradient: string;
}

const roleOptions: RoleOption[] = [
  {
    type: 'creator',
    label: 'Creator',
    description: 'Create and share content across platforms',
    icon: Sparkles,
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    type: 'podcaster',
    label: 'Podcaster',
    description: 'Host and produce podcasts',
    icon: Mic,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    type: 'advertiser',
    label: 'Advertiser',
    description: 'Run campaigns and sponsor creators',
    icon: Megaphone,
    gradient: 'from-orange-500 to-red-500',
  },
  {
    type: 'agency',
    label: 'Agency',
    description: 'Manage creators and campaigns',
    icon: Users,
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    type: 'event_planner',
    label: 'Event Planner',
    description: 'Organize and manage events',
    icon: Calendar,
    gradient: 'from-indigo-500 to-purple-500',
  },
  {
    type: 'brand',
    label: 'Brand',
    description: 'Explore Seeksy tools',
    icon: Building,
    gradient: 'from-slate-500 to-gray-500',
  },
];

export default function SignupSelect() {
  const navigate = useNavigate();

  const handleSelect = (type: AccountType) => {
    // Store selection and navigate to actual signup
    sessionStorage.setItem('selectedAccountType', type);
    navigate('/auth?tab=signup');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-5xl space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold">Join Seeksy</h1>
          <p className="text-xl text-muted-foreground">
            Choose how you want to use Seeksy
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roleOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Card
                key={option.type}
                className="p-6 cursor-pointer transition-all hover:scale-105 hover:shadow-xl border-2 border-transparent hover:border-primary group relative overflow-hidden"
                onClick={() => handleSelect(option.type)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${option.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                <div className="relative space-y-4">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${option.gradient} text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{option.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                  <Button className="w-full" variant="outline">
                    Get Started
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Button variant="link" onClick={() => navigate('/auth?tab=login')}>
            Already have an account? Sign in
          </Button>
        </div>
      </div>
    </div>
  );
}

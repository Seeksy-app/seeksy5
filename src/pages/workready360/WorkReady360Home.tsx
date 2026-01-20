import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Compass, 
  Heart, 
  Briefcase, 
  Users, 
  Shield, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function WorkReady360Home() {
  const navigate = useNavigate();

  const assessments = [
    {
      id: 'wip',
      title: 'Work Importance Profiler',
      subtitle: 'Discover Your Work Values',
      description: 'Identify what matters most to you in a career. This 21-round assessment reveals your top work values and needs.',
      icon: Heart,
      duration: '10-15 min',
      questions: '21 rounds',
      status: 'available',
      path: '/workready360/wip',
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
    {
      id: 'ip',
      title: 'Interest Profiler',
      subtitle: 'Explore Your Interests',
      description: 'Discover career areas that match your interests using the RIASEC model (Realistic, Investigative, Artistic, Social, Enterprising, Conventional).',
      icon: Compass,
      duration: '15-20 min',
      questions: '60 questions',
      status: 'available',
      path: '/workready360/interest-profiler',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      id: 'crosswalk',
      title: 'Career Crosswalk',
      subtitle: 'Military & Civilian Mapping',
      description: 'Translate military experience and skills into civilian career opportunities with our SOC/KSA crosswalk engine.',
      icon: Briefcase,
      duration: '5-10 min',
      questions: 'Varies',
      status: 'coming-soon',
      path: '/workready360/crosswalk',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  const audiences = [
    { id: 'civilian', label: 'Civilian', icon: Users, description: 'Career exploration for everyone' },
    { id: 'military', label: 'Military / Veteran', icon: Shield, description: 'Transition support & skill mapping' },
    { id: 'reentry', label: 'Reentry', icon: Briefcase, description: 'Second chance career pathways' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="container mx-auto px-4 py-16 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <Badge variant="outline" className="mb-4">
              Powered by O*NET
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              WorkReady360
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Discover your career identity. Understand not just <em>what</em> jobs fit you,
              but <em>why</em> you'll thrive there and <em>where</em> you'll find engagement.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/workready360/wip')}>
                Start Work Values Assessment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Audience Selector */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center mb-8">Choose Your Path</h2>
        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {audiences.map((audience, index) => (
            <motion.div
              key={audience.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${
                  audience.id === 'civilian' ? 'border-primary border-2' : ''
                }`}
              >
                <CardContent className="p-6 text-center">
                  <audience.icon className="h-10 w-10 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-1">{audience.label}</h3>
                  <p className="text-sm text-muted-foreground">{audience.description}</p>
                  {audience.id === 'civilian' && (
                    <Badge variant="secondary" className="mt-3">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Selected
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Assessments Grid */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center mb-2">Career Assessments</h2>
        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
          Complete these assessments to build your career identity profile and discover
          occupations that align with your values, interests, and skills.
        </p>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {assessments.map((assessment, index) => (
            <motion.div
              key={assessment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${assessment.bgColor} flex items-center justify-center mb-3`}>
                    <assessment.icon className={`h-6 w-6 ${assessment.color}`} />
                  </div>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{assessment.title}</CardTitle>
                    {assessment.status === 'coming-soon' && (
                      <Badge variant="secondary">Coming Soon</Badge>
                    )}
                  </div>
                  <CardDescription>{assessment.subtitle}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-sm text-muted-foreground mb-4 flex-1">
                    {assessment.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <span>{assessment.duration}</span>
                    <span>{assessment.questions}</span>
                  </div>
                  <Button
                    className="w-full"
                    variant={assessment.status === 'available' ? 'default' : 'secondary'}
                    disabled={assessment.status !== 'available'}
                    onClick={() => navigate(assessment.path)}
                  >
                    {assessment.status === 'available' ? 'Start Assessment' : 'Coming Soon'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 border-t">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-12">Why WorkReady360?</h2>
          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              { title: 'Identity-First', description: 'Understand WHO you are before matching to jobs' },
              { title: 'O*NET Aligned', description: 'Built on the gold standard of occupational data' },
              { title: 'Evidence-Based', description: 'Validated assessments with proven accuracy' },
              { title: 'Action-Oriented', description: 'Clear next steps for your career journey' },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Plus, Target, Calendar, ArrowRight, FolderOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface GTMProject {
  id: string;
  name: string;
  description: string | null;
  primary_goal: string | null;
  status: string;
  mode: string;
  timeframe: string | null;
  created_at: string;
  updated_at: string;
}

export default function GTMBuilderList() {
  const navigate = useNavigate();
  const { isAdmin } = useUserRoles();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['gtm-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gtm_projects')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as GTMProject[];
    },
  });

  const userProjects = projects?.filter(p => p.mode === 'business_tool') || [];
  const adminProjects = projects?.filter(p => p.mode === 'admin_cfo') || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-500';
      case 'draft': return 'bg-yellow-500/10 text-yellow-500';
      case 'archived': return 'bg-slate-500/10 text-slate-500';
      default: return 'bg-slate-500/10 text-slate-500';
    }
  };

  const ProjectCard = ({ project }: { project: GTMProject }) => (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer group"
      onClick={() => navigate(`/business-tools/gtm/${project.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <Badge className={getStatusColor(project.status)}>
            {project.status}
          </Badge>
        </div>
        <CardTitle className="text-lg mt-3 group-hover:text-primary transition-colors">
          {project.name}
        </CardTitle>
        {project.description && (
          <CardDescription className="line-clamp-2">
            {project.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {project.timeframe || 'No timeframe set'}
          </div>
          <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ isAdmin: isAdminView }: { isAdmin?: boolean }) => (
    <div className="text-center py-16">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
        <FolderOpen className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">
        {isAdminView ? 'No Internal GTM Plans' : 'No GTM Plans Yet'}
      </h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {isAdminView 
          ? 'Create internal GTM plans for CFO analysis and strategic planning.'
          : 'Create your first go-to-market plan to start growing your business strategically.'
        }
      </p>
      <Button onClick={() => navigate('/business-tools/gtm/new')} className="gap-2">
        <Plus className="w-4 h-4" />
        {isAdminView ? 'Create Internal Plan' : 'Create GTM Plan'}
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">GTM Builder</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage your go-to-market strategies
            </p>
          </div>
          <Button onClick={() => navigate('/business-tools/gtm/new')} className="gap-2">
            <Plus className="w-4 h-4" />
            New GTM Plan
          </Button>
        </div>

        {/* Content */}
        {isAdmin ? (
          <Tabs defaultValue="my-plans" className="space-y-6">
            <TabsList>
              <TabsTrigger value="my-plans">Creator GTM Builder</TabsTrigger>
              <TabsTrigger value="admin-plans">Internal CFO GTM</TabsTrigger>
            </TabsList>
            
            <TabsContent value="my-plans">
              {userProjects.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userProjects.map(project => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
            </TabsContent>
            
            <TabsContent value="admin-plans">
              {adminProjects.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {adminProjects.map(project => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              ) : (
                <EmptyState isAdmin />
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <>
            {userProjects.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userProjects.map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </>
        )}
      </div>
    </div>
  );
}

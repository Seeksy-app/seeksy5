import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useMilestones, 
  Milestone, 
  MilestoneCategory, 
  MilestoneStatus,
  CATEGORY_LABELS,
  STATUS_LABELS,
} from '@/hooks/useMilestones';
import { MilestoneCard } from '@/components/admin/milestones/MilestoneCard';
import { MilestoneFormDialog } from '@/components/admin/milestones/MilestoneFormDialog';
import { Plus, Search, LayoutGrid, List, Target } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminMilestones() {
  const { data: milestones, isLoading } = useMilestones();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<MilestoneCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<MilestoneStatus | 'all'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const filteredMilestones = milestones?.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  }) || [];

  const handleEdit = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingMilestone(null);
    setFormOpen(true);
  };

  const stats = {
    total: milestones?.length || 0,
    completed: milestones?.filter(m => m.status === 'completed').length || 0,
    inProgress: milestones?.filter(m => m.status === 'in_progress').length || 0,
    atRisk: milestones?.filter(m => m.status === 'at_risk').length || 0,
    blocked: milestones?.filter(m => m.status === 'blocked').length || 0,
  };

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Target className="h-6 w-6" />
              Milestones Manager
            </h1>
            <p className="text-muted-foreground mt-1">
              Track and manage company milestones across all teams
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Milestone
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">At Risk</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.atRisk}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Blocked</p>
            <p className="text-2xl font-bold text-red-600">{stats.blocked}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search milestones..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as MilestoneCategory | 'all')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as MilestoneStatus | 'all')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex border rounded-lg">
            <Button
              variant={view === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setView('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setView('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            <MilestoneGrid
              milestones={filteredMilestones}
              allMilestones={milestones || []}
              isLoading={isLoading}
              view={view}
              onEdit={handleEdit}
            />
          </TabsContent>
          
          {Object.keys(CATEGORY_LABELS).map((category) => (
            <TabsContent key={category} value={category} className="mt-4">
              <MilestoneGrid
                milestones={filteredMilestones.filter(m => m.category === category)}
                allMilestones={milestones || []}
                isLoading={isLoading}
                view={view}
                onEdit={handleEdit}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <MilestoneFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        milestone={editingMilestone}
        allMilestones={milestones || []}
      />
    </div>
  );
}

function MilestoneGrid({ 
  milestones, 
  allMilestones,
  isLoading, 
  view,
  onEdit,
}: { 
  milestones: Milestone[]; 
  allMilestones: Milestone[];
  isLoading: boolean;
  view: 'grid' | 'list';
  onEdit: (milestone: Milestone) => void;
}) {
  if (isLoading) {
    return (
      <div className={view === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  if (milestones.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No milestones found</p>
      </div>
    );
  }

  return (
    <div className={view === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
      {milestones.map((milestone) => (
        <MilestoneCard
          key={milestone.id}
          milestone={milestone}
          allMilestones={allMilestones}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

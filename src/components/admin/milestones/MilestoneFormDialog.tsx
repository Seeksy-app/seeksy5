import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Milestone, 
  CreateMilestoneInput, 
  MilestoneCategory, 
  MilestoneStatus, 
  ProgressType,
  CATEGORY_LABELS,
  STATUS_LABELS,
  AVAILABLE_METRICS,
  useCreateMilestone,
  useUpdateMilestone,
} from '@/hooks/useMilestones';

interface MilestoneFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestone?: Milestone | null;
  allMilestones: Milestone[];
}

export function MilestoneFormDialog({ 
  open, 
  onOpenChange, 
  milestone,
  allMilestones,
}: MilestoneFormDialogProps) {
  const isEditing = !!milestone;
  const createMilestone = useCreateMilestone();
  const updateMilestone = useUpdateMilestone();
  
  const [formData, setFormData] = useState<CreateMilestoneInput>({
    title: '',
    description: '',
    category: 'product',
    status: 'not_started',
    owner: '',
    due_date: '',
    progress_type: 'manual',
    progress_value: 0,
    metric_key: '',
    metric_target: 0,
    dependencies: [],
  });

  useEffect(() => {
    if (milestone) {
      setFormData({
        title: milestone.title,
        description: milestone.description || '',
        category: milestone.category,
        status: milestone.status,
        owner: milestone.owner || '',
        due_date: milestone.due_date || '',
        progress_type: milestone.progress_type,
        progress_value: milestone.progress_value || 0,
        metric_key: milestone.metric_key || '',
        metric_target: milestone.metric_target || 0,
        dependencies: milestone.dependencies || [],
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'product',
        status: 'not_started',
        owner: '',
        due_date: '',
        progress_type: 'manual',
        progress_value: 0,
        metric_key: '',
        metric_target: 0,
        dependencies: [],
      });
    }
  }, [milestone, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing && milestone) {
      await updateMilestone.mutateAsync({ id: milestone.id, ...formData });
    } else {
      await createMilestone.mutateAsync(formData);
    }
    
    onOpenChange(false);
  };

  const availableDependencies = allMilestones.filter(m => m.id !== milestone?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Milestone' : 'Create Milestone'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Milestone title"
                required
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this milestone..."
                rows={3}
              />
            </div>
            
            <div>
              <Label>Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value: MilestoneCategory) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: MilestoneStatus) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="owner">Owner/Team</Label>
              <Input
                id="owner"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                placeholder="e.g., Product Team"
              />
            </div>
            
            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
            
            <div className="col-span-2">
              <Label>Progress Type *</Label>
              <Select
                value={formData.progress_type}
                onValueChange={(value: ProgressType) => setFormData({ ...formData, progress_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual % Complete</SelectItem>
                  <SelectItem value="subtask">Subtask Completion</SelectItem>
                  <SelectItem value="metric">Metric-Based (Auto-updating)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formData.progress_type === 'manual' && (
              <div className="col-span-2">
                <Label htmlFor="progress_value">Progress (%)</Label>
                <Input
                  id="progress_value"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress_value}
                  onChange={(e) => setFormData({ ...formData, progress_value: parseInt(e.target.value) || 0 })}
                />
              </div>
            )}
            
            {formData.progress_type === 'metric' && (
              <>
                <div>
                  <Label>Metric</Label>
                  <Select
                    value={formData.metric_key || ''}
                    onValueChange={(value) => setFormData({ ...formData, metric_key: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select metric" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_METRICS.map((metric) => (
                        <SelectItem key={metric.key} value={metric.key}>{metric.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="metric_target">Target Value</Label>
                  <Input
                    id="metric_target"
                    type="number"
                    value={formData.metric_target}
                    onChange={(e) => setFormData({ ...formData, metric_target: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </>
            )}
            
            {availableDependencies.length > 0 && (
              <div className="col-span-2">
                <Label>Dependencies</Label>
                <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                  {availableDependencies.map((dep) => (
                    <label key={dep.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.dependencies?.includes(dep.id) || false}
                        onChange={(e) => {
                          const deps = formData.dependencies || [];
                          if (e.target.checked) {
                            setFormData({ ...formData, dependencies: [...deps, dep.id] });
                          } else {
                            setFormData({ ...formData, dependencies: deps.filter(d => d !== dep.id) });
                          }
                        }}
                        className="rounded"
                      />
                      <span>{dep.title}</span>
                      <span className="text-muted-foreground">({CATEGORY_LABELS[dep.category]})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMilestone.isPending || updateMilestone.isPending}
            >
              {isEditing ? 'Save Changes' : 'Create Milestone'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

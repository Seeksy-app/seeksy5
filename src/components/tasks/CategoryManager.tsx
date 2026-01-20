import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface CategoryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryChange?: () => void;
}

const DEFAULT_COLORS = [
  '#6B7280', // Gray
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#14B8A6', // Teal
  '#A855F7', // Violet
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
];

export function CategoryManager({ open, onOpenChange, onCategoryChange }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadCategories();
    }
  }, [open]);

  const loadCategories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('task_categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) {
      toast({
        title: "Error loading categories",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // If no categories exist, create defaults
    if (!data || data.length === 0) {
      await createDefaultCategories(user.id);
      loadCategories();
      return;
    }

    setCategories(data);
  };

  const createDefaultCategories = async (userId: string) => {
    const defaultCategories = [
      { name: 'General', color: '#6B7280' },
      { name: 'Development', color: '#3B82F6' },
      { name: 'Design', color: '#8B5CF6' },
      { name: 'Marketing', color: '#EC4899' },
      { name: 'Content', color: '#10B981' },
      { name: 'Sales', color: '#F59E0B' },
      { name: 'Support', color: '#EF4444' },
      { name: 'InfluenceHub', color: '#14B8A6' },
      { name: 'AI', color: '#A855F7' },
      { name: 'Integrations', color: '#06B6D4' },
      { name: 'Task Manager', color: '#84CC16' },
      { name: 'Blog', color: '#F97316' },
    ];

    const { error } = await supabase
      .from('task_categories')
      .insert(
        defaultCategories.map(cat => ({
          user_id: userId,
          name: cat.name,
          color: cat.color,
        }))
      );

    if (error) {
      console.error('Error creating default categories:', error);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Category name required",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('task_categories')
      .insert({
        user_id: user.id,
        name: newCategoryName.trim(),
        color: selectedColor,
      });

    if (error) {
      toast({
        title: "Error creating category",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Category created",
      description: `${newCategoryName} has been created`,
    });

    setNewCategoryName("");
    setSelectedColor(DEFAULT_COLORS[0]);
    setIsCreating(false);
    loadCategories();
    onCategoryChange?.();
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) return;

    const { error } = await supabase
      .from('task_categories')
      .update({
        name: newCategoryName.trim(),
        color: selectedColor,
      })
      .eq('id', editingCategory.id);

    if (error) {
      toast({
        title: "Error updating category",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Category updated",
      description: `${newCategoryName} has been updated`,
    });

    setEditingCategory(null);
    setNewCategoryName("");
    setSelectedColor(DEFAULT_COLORS[0]);
    loadCategories();
    onCategoryChange?.();
  };

  const handleDeleteCategory = async (category: Category) => {
    const { error } = await supabase
      .from('task_categories')
      .delete()
      .eq('id', category.id);

    if (error) {
      toast({
        title: "Error deleting category",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Category deleted",
      description: `${category.name} has been deleted`,
    });

    loadCategories();
    onCategoryChange?.();
  };

  const startEditing = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setSelectedColor(category.color);
    setIsCreating(false);
  };

  const startCreating = () => {
    setIsCreating(true);
    setEditingCategory(null);
    setNewCategoryName("");
    setSelectedColor(DEFAULT_COLORS[0]);
  };

  const cancelEditing = () => {
    setEditingCategory(null);
    setIsCreating(false);
    setNewCategoryName("");
    setSelectedColor(DEFAULT_COLORS[0]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
          <DialogDescription>
            Create, edit, and delete task categories with custom colors
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full border-2"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(category)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {(isCreating || editingCategory) && (
            <div className="space-y-4 p-4 border rounded-lg bg-accent/20">
              <div className="space-y-2">
                <Label>Category Name</Label>
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name"
                />
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="grid grid-cols-6 gap-2">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${
                        selectedColor === color
                          ? 'border-primary ring-2 ring-primary ring-offset-2'
                          : 'border-border'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                  className="flex-1"
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </Button>
                <Button
                  onClick={cancelEditing}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {!isCreating && !editingCategory && (
            <Button
              onClick={startCreating}
              variant="outline"
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Category
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

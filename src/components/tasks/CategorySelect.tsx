import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface CategorySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  onManageCategories: () => void;
}

export function CategorySelect({ value, onValueChange, onManageCategories }: CategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('task_categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (data) {
      setCategories(data);
    }
  };

  // Expose reload method for parent component
  useEffect(() => {
    (window as any)._reloadTaskCategories = loadCategories;
    return () => {
      delete (window as any)._reloadTaskCategories;
    };
  }, []);

  const selectedCategory = categories.find(cat => cat.name === value);

  return (
    <div className="flex gap-2">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Select category">
            {selectedCategory && (
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedCategory.color }}
                />
                <span>{selectedCategory.name}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-background/95 backdrop-blur-sm border-border z-50">
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.name}>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span>{category.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onManageCategories}
      >
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  );
}

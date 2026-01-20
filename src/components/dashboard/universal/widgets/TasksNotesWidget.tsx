import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, ListTodo } from "lucide-react";

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export function TasksNotesWidget() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now().toString(), text: newTask, completed: false }]);
    setNewTask("");
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  if (tasks.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <ListTodo className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground mb-3">
            Start by adding your first task.
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add a new task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            className="text-sm"
          />
          <Button size="sm" onClick={addTask}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2 max-h-[150px] overflow-y-auto">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center gap-2">
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => toggleTask(task.id)}
            />
            <span className={`text-sm flex-1 ${task.completed ? "line-through text-muted-foreground" : ""}`}>
              {task.text}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Add a new task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          className="text-sm"
        />
        <Button size="sm" onClick={addTask}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

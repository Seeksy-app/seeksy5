import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Inbox, Star, Clock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface List {
  id: string;
  name: string;
  color: string;
  is_system?: boolean;
  contact_list_members: { count: number }[];
}

interface ListsSidebarProps {
  lists: List[];
  selectedList: string | null;
  onSelectList: (id: string | null) => void;
  totalContacts: number;
}

export function ListsSidebar({ lists, selectedList, onSelectList, totalContacts }: ListsSidebarProps) {
  const defaultLists = [
    {
      id: "all",
      name: "All Contacts",
      icon: Users,
      count: totalContacts,
      color: "hsl(var(--primary))",
    },
  ];

  // Separate system lists from custom lists
  const systemLists = lists.filter(list => list.is_system);
  const customLists = lists.filter(list => !list.is_system);

  return (
    <div className="w-64 bg-card border-r border-border/40 flex flex-col">
      <div className="p-4 border-b border-border/40">
        <h2 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider">
          Lists
        </h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Default Lists */}
          <div className="mb-4">
            {defaultLists.map((list) => {
              const Icon = list.icon;
              return (
                <Button
                  key={list.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start mb-1 hover:bg-muted/50",
                    selectedList === list.id && "bg-muted text-primary font-medium"
                  )}
                  onClick={() => onSelectList(list.id)}
                >
                  <Icon className="w-4 h-4 mr-3" style={{ color: list.color }} />
                  <span className="flex-1 text-left">{list.name}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {list.count}
                  </span>
                </Button>
              );
            })}
          </div>

          {/* System Lists */}
          {systemLists.length > 0 && (
            <div className="mb-4">
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Automated Lists
              </div>
              {systemLists.map((list) => {
                const count = list.contact_list_members?.[0]?.count || 0;
                return (
                  <Button
                    key={list.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start mb-1 hover:bg-muted/50",
                      selectedList === list.id && "bg-muted text-primary font-medium"
                    )}
                    onClick={() => onSelectList(list.id)}
                  >
                    <Inbox className="w-4 h-4 mr-3" style={{ color: list.color }} />
                    <span className="flex-1 text-left">{list.name}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {count}
                    </span>
                  </Button>
                );
              })}
            </div>
          )}

          {/* Custom Lists */}
          {customLists.length > 0 && (
            <div>
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                My Lists
              </div>
              {customLists.map((list) => {
                const count = list.contact_list_members?.[0]?.count || 0;
                return (
                  <Button
                    key={list.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start mb-1 hover:bg-muted/50",
                      selectedList === list.id && "bg-muted text-primary font-medium"
                    )}
                    onClick={() => onSelectList(list.id)}
                  >
                    <div
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: list.color }}
                    />
                    <span className="flex-1 text-left">{list.name}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {count}
                    </span>
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

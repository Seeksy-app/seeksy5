import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListOverviewTab } from "./tabs/ListOverviewTab";
import { ListSubscribersTab } from "./tabs/ListSubscribersTab";
import { ListPreferencesTab } from "./tabs/ListPreferencesTab";
import { ListImportTab } from "./tabs/ListImportTab";
import { ListCommunicationTab } from "./tabs/ListCommunicationTab";
import { FileText, Users, Settings, Upload, MessageSquare } from "lucide-react";

interface ListDetailsPanelProps {
  list: any;
  onListUpdated: () => void;
}

export function ListDetailsPanel({ list, onListUpdated }: ListDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!list) {
    return (
      <div className="bg-white rounded-xl p-12 shadow-[0_2px_4px_rgba(0,0,0,0.05)] flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No List Selected
          </h3>
          <p className="text-muted-foreground max-w-md">
            Select a list from the directory or create a new one to begin managing your subscribers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b border-border/50 px-6 pt-6">
          <TabsList className="bg-transparent h-auto p-0 gap-1">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-50 data-[state=active]:to-indigo-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-t-lg px-4 py-2"
            >
              <FileText className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="subscribers"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-50 data-[state=active]:to-indigo-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-t-lg px-4 py-2"
            >
              <Users className="h-4 w-4 mr-2" />
              Subscribers
            </TabsTrigger>
            <TabsTrigger
              value="preferences"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-50 data-[state=active]:to-indigo-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-t-lg px-4 py-2"
            >
              <Settings className="h-4 w-4 mr-2" />
              Preferences
            </TabsTrigger>
            <TabsTrigger
              value="import"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-50 data-[state=active]:to-indigo-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-t-lg px-4 py-2"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </TabsTrigger>
            <TabsTrigger
              value="communication"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-50 data-[state=active]:to-indigo-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-t-lg px-4 py-2"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Communication History
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="p-6">
          <TabsContent value="overview" className="mt-0">
            <ListOverviewTab list={list} onListUpdated={onListUpdated} />
          </TabsContent>

          <TabsContent value="subscribers" className="mt-0">
            <ListSubscribersTab listId={list.id} />
          </TabsContent>

          <TabsContent value="preferences" className="mt-0">
            <ListPreferencesTab listId={list.id} />
          </TabsContent>

          <TabsContent value="import" className="mt-0">
            <ListImportTab listId={list.id} />
          </TabsContent>

          <TabsContent value="communication" className="mt-0">
            <ListCommunicationTab listId={list.id} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

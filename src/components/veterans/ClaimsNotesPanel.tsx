import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Download, FileText, ClipboardList } from "lucide-react";

export interface ClaimsNote {
  category: string;
  value: string;
}

interface ClaimsNotesPanelProps {
  notes: ClaimsNote[];
  intakeData?: {
    status: string;
    branch: string;
    claimStatus: string;
    primaryGoals: string[];
  };
  isMobile?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  veteran: "Veteran",
  active_duty: "Active Duty",
  guard_reserve: "Guard/Reserve",
  spouse_caregiver: "Spouse/Caregiver",
  federal_employee: "Federal Employee",
  other: "Other",
};

const BRANCH_LABELS: Record<string, string> = {
  army: "Army",
  marine_corps: "Marine Corps",
  navy: "Navy",
  air_force: "Air Force",
  space_force: "Space Force",
  coast_guard: "Coast Guard",
  multiple_other: "Multiple/Other",
};

const CLAIM_STATUS_LABELS: Record<string, string> = {
  not_filed: "Not Filed Yet",
  need_intent: "Needs Intent to File",
  has_intent: "Has Intent to File",
  submitted_claim: "Claim Submitted",
  supplemental: "Supplemental/Increase",
  not_sure: "Unsure",
};

const PRIMARY_GOAL_LABELS: Record<string, string> = {
  understanding: "Understanding Benefits",
  deciding: "Deciding Whether to File",
  intent_to_file: "Filing Intent to File",
  initial_claim: "Preparing Initial Claim",
  understanding_rating: "Understanding Current Rating",
};

function NotesList({ notes, intakeData }: { notes: ClaimsNote[]; intakeData?: ClaimsNotesPanelProps["intakeData"] }) {
  const hasNotes = notes.length > 0 || intakeData;
  
  const handleDownload = () => {
    let content = "VA CLAIMS AGENT - SUMMARY NOTES\n";
    content += "================================\n\n";
    content += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    if (intakeData) {
      content += "INTAKE INFORMATION\n";
      content += "------------------\n";
      content += `Status: ${STATUS_LABELS[intakeData.status] || intakeData.status}\n`;
      content += `Branch: ${BRANCH_LABELS[intakeData.branch] || intakeData.branch}\n`;
      content += `Claim Status: ${CLAIM_STATUS_LABELS[intakeData.claimStatus] || intakeData.claimStatus}\n`;
      content += `Goals: ${intakeData.primaryGoals.map(g => PRIMARY_GOAL_LABELS[g] || g).join(", ")}\n\n`;
    }
    
    if (notes.length > 0) {
      content += "COLLECTED INFORMATION\n";
      content += "---------------------\n";
      notes.forEach(note => {
        content += `• ${note.category}: ${note.value}\n`;
      });
    }
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "va-claims-summary.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-1">
          {intakeData && (
            <>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Status</p>
                <p className="text-sm">• {STATUS_LABELS[intakeData.status] || intakeData.status}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Branch of Service</p>
                <p className="text-sm">• {BRANCH_LABELS[intakeData.branch] || intakeData.branch}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Claim Status</p>
                <p className="text-sm">• {CLAIM_STATUS_LABELS[intakeData.claimStatus] || intakeData.claimStatus}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Goals</p>
                {intakeData.primaryGoals.map((goal, i) => (
                  <p key={i} className="text-sm">• {PRIMARY_GOAL_LABELS[goal] || goal}</p>
                ))}
              </div>
              {notes.length > 0 && <Separator />}
            </>
          )}
          
          {notes.map((note, index) => (
            <div key={index}>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                {note.category}
              </p>
              <p className="text-sm">• {note.value}</p>
              {index < notes.length - 1 && <Separator className="mt-3" />}
            </div>
          ))}
          
          {!hasNotes && (
            <p className="text-sm text-muted-foreground italic">
              Notes will appear here as you provide information...
            </p>
          )}
        </div>
      </ScrollArea>
      
      {hasNotes && (
        <div className="pt-4 border-t mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Notes
          </Button>
        </div>
      )}
    </div>
  );
}

export function ClaimsNotesPanel({ notes, intakeData, isMobile }: ClaimsNotesPanelProps) {
  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="fixed bottom-20 right-4 z-50 shadow-lg">
            <ClipboardList className="w-4 h-4 mr-2" />
            Notes ({notes.length + (intakeData ? 3 : 0)})
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Your Summary
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 h-[calc(100vh-120px)]">
            <NotesList notes={notes} intakeData={intakeData} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Your Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <NotesList notes={notes} intakeData={intakeData} />
      </CardContent>
    </Card>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Download, FileText, User, Flag, Target, ClipboardList, StickyNote } from "lucide-react";

export interface ClaimsNote {
  category: string;
  value: string;
}

interface VeteranProfile {
  service_status: string | null;
  branch_of_service: string | null;
  has_intent_to_file: boolean | null;
  last_claim_stage: string | null;
}

interface ClaimsRightSidebarProps {
  notes: ClaimsNote[];
  intakeData?: {
    status: string;
    branch: string;
    claimStatus: string;
    primaryGoals: string[];
  };
  userName?: string;
  profile?: VeteranProfile | null;
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
  understand_benefits: "Understanding Benefits",
  decide_filing: "Deciding Whether to File",
  file_intent: "Filing Intent to File",
  prepare_claim: "Preparing Initial Claim",
  understand_rating: "Understanding Rating",
};

export function ClaimsRightSidebar({ notes, intakeData, userName, profile }: ClaimsRightSidebarProps) {
  const claimedConditions = notes.filter(n => 
    n.category.toLowerCase().includes('condition') || 
    n.category.toLowerCase().includes('symptom')
  );
  
  const otherNotes = notes.filter(n => 
    !n.category.toLowerCase().includes('condition') && 
    !n.category.toLowerCase().includes('symptom')
  );

  const handleDownload = () => {
    let content = "VA CLAIMS AGENT - YOUR SUMMARY\n";
    content += "================================\n\n";
    content += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    if (userName) {
      content += `Name: ${userName}\n\n`;
    }
    
    if (intakeData) {
      content += "YOUR INFORMATION\n";
      content += "-----------------\n";
      content += `Status: ${STATUS_LABELS[intakeData.status] || intakeData.status}\n`;
      content += `Branch: ${BRANCH_LABELS[intakeData.branch] || intakeData.branch}\n`;
      content += `Claim Status: ${CLAIM_STATUS_LABELS[intakeData.claimStatus] || intakeData.claimStatus}\n`;
      content += `Goals: ${intakeData.primaryGoals.map(g => PRIMARY_GOAL_LABELS[g] || g).join(", ")}\n\n`;
    }
    
    if (claimedConditions.length > 0) {
      content += "CLAIMED CONDITIONS\n";
      content += "------------------\n";
      claimedConditions.forEach(note => {
        content += `• ${note.value}\n`;
      });
      content += "\n";
    }
    
    if (otherNotes.length > 0) {
      content += "ADDITIONAL NOTES\n";
      content += "----------------\n";
      otherNotes.forEach(note => {
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
    <Card className="h-full flex flex-col border-0 shadow-none rounded-none">
      <CardHeader className="pb-3 flex-shrink-0 border-b">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-5 h-5 text-orange-500" />
          Your Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="p-5 space-y-5">
            {/* Profile-based Status Section (always show when profile exists) */}
            {!intakeData && profile && (
              <>
                {profile.service_status && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</p>
                    </div>
                    <p className="text-[15px] pl-6">• {STATUS_LABELS[profile.service_status] || profile.service_status}</p>
                  </div>
                )}
                {profile.service_status && profile.branch_of_service && <Separator />}
                {profile.branch_of_service && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Flag className="w-4 h-4 text-muted-foreground" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Branch of Service</p>
                    </div>
                    <p className="text-[15px] pl-6">• {BRANCH_LABELS[profile.branch_of_service] || profile.branch_of_service}</p>
                  </div>
                )}
                {(profile.service_status || profile.branch_of_service) && <Separator />}
              </>
            )}
            
            {/* IntakeData-based Status Section */}
            {intakeData && (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</p>
                  </div>
                  <p className="text-[15px] pl-6">• {STATUS_LABELS[intakeData.status] || intakeData.status}</p>
                </div>
                <Separator />
                
                {/* Branch Section */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Flag className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Branch of Service</p>
                  </div>
                  <p className="text-[15px] pl-6">• {BRANCH_LABELS[intakeData.branch] || intakeData.branch}</p>
                </div>
                <Separator />
                
                {/* Claim Status Section */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardList className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Claim Status</p>
                  </div>
                  <p className="text-[15px] pl-6">• {CLAIM_STATUS_LABELS[intakeData.claimStatus] || intakeData.claimStatus}</p>
                </div>
                <Separator />
                
                {/* Goals Section */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Goals</p>
                  </div>
                  <div className="pl-6 space-y-1">
                    {intakeData.primaryGoals.map((goal, i) => (
                      <p key={i} className="text-[15px]">• {PRIMARY_GOAL_LABELS[goal] || goal}</p>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {/* Claimed Conditions */}
            {claimedConditions.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardList className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Claimed Conditions</p>
                  </div>
                  <div className="pl-6 space-y-1">
                    {claimedConditions.map((note, i) => (
                      <p key={i} className="text-[15px]">• {note.value}</p>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {/* Other Notes */}
            {otherNotes.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <StickyNote className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes</p>
                  </div>
                  <div className="pl-6 space-y-2">
                    {otherNotes.map((note, i) => (
                      <p key={i} className="text-[15px]">• {note.value}</p>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {/* Empty State */}
            {!intakeData && notes.length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                Your summary will appear here as we talk...
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      
      {/* Download Button */}
      {(intakeData || notes.length > 0) && (
        <div className="p-4 border-t flex-shrink-0">
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
    </Card>
  );
}

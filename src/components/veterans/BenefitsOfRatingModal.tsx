import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Award, Heart, Home, Briefcase, CheckCircle2 } from "lucide-react";

interface BenefitsOfRatingModalProps {
  trigger?: React.ReactNode;
}

const BENEFIT_SECTIONS = [
  {
    title: "Financial Benefits",
    icon: Award,
    color: "text-emerald-500",
    bullets: [
      "Tax-free monthly disability compensation based on your rating",
      "Potential retroactive pay based on your Intent to File date",
      "Access to additional programs like Special Monthly Compensation for severe conditions",
    ],
  },
  {
    title: "Healthcare & Family Support",
    icon: Heart,
    color: "text-rose-500",
    bullets: [
      "VA health care enrollment and priority group assignment",
      "Mental health services, counseling, and specialty care",
      "Potential eligibility for CHAMPVA coverage for certain dependents at higher ratings",
    ],
  },
  {
    title: "Lifestyle & Access Benefits",
    icon: Home,
    color: "text-blue-500",
    bullets: [
      "Commissary and Exchange access for eligible veterans and caregivers",
      "Morale, Welfare, and Recreation (MWR) access at many installations",
      "VA Home Loan benefits, including waived funding fee at qualifying ratings",
    ],
  },
  {
    title: "Employment & Future Security",
    icon: Briefcase,
    color: "text-purple-500",
    bullets: [
      "Preference for certain federal employment opportunities",
      "Vocational Rehabilitation and Employment (VR&E) services for those who qualify",
      "Life insurance and burial benefits for veterans and eligible family members",
    ],
  },
];

export function BenefitsOfRatingModal({ trigger }: BenefitsOfRatingModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="lg">
            <Award className="w-4 h-4 mr-2" />
            See What a Rating Unlocks
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            Benefits of Having a VA Disability Rating
          </DialogTitle>
          <DialogDescription className="text-base">
            A disability rating does more than provide monthly compensation. It can unlock healthcare, family support, and lifetime benefits.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {BENEFIT_SECTIONS.map((section) => (
              <div key={section.title} className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <section.icon className={`w-5 h-5 ${section.color}`} />
                  {section.title}
                </h3>
                <ul className="space-y-2 ml-7">
                  {section.bullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Exact benefits depend on your disability rating, service history, and other factors. This is general information, not legal advice. For specific eligibility questions, consult the VA or an accredited representative.
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

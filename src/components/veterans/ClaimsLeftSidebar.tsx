import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, FileText, ExternalLink, CheckCircle2, Calculator } from "lucide-react";
import { Link } from "react-router-dom";

interface ClaimsLeftSidebarProps {
  currentStep: number;
  onHandoffClick: () => void;
  onCalculatorsClick?: () => void;
}

export function ClaimsLeftSidebar({ currentStep, onHandoffClick, onCalculatorsClick }: ClaimsLeftSidebarProps) {
  return (
    <div className="p-5 space-y-5">
      {/* Quick Calculator Access */}
      <Card className="border-0 shadow-sm bg-blue-50 dark:bg-blue-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            Benefit Calculators
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground mb-3">
            Estimate your benefits with our free tools.
          </p>
          <div className="space-y-2">
            <Link to="/yourbenefits/calculators/va-combined-rating">
              <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                VA Combined Rating
              </Button>
            </Link>
            <Link to="/yourbenefits/calculators/va-compensation">
              <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                Monthly Compensation
              </Button>
            </Link>
            <Link to="/yourbenefits/calculators/tsp-growth">
              <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                TSP Calculator
              </Button>
            </Link>
            {onCalculatorsClick && (
              <Button variant="outline" size="sm" className="w-full text-sm" onClick={onCalculatorsClick}>
                View All Calculators
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-500" />
            What We'll Cover
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-[15px] leading-relaxed">
          <div className="flex items-start gap-3">
            <CheckCircle2 className={`w-5 h-5 mt-0.5 flex-shrink-0 ${currentStep >= 1 ? 'text-green-500' : 'text-muted-foreground/40'}`} />
            <span className={currentStep >= 1 ? 'text-foreground' : 'text-muted-foreground'}>
              Your benefits and what you may be entitled to
            </span>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircle2 className={`w-5 h-5 mt-0.5 flex-shrink-0 ${currentStep >= 2 ? 'text-green-500' : 'text-muted-foreground/40'}`} />
            <span className={currentStep >= 2 ? 'text-foreground' : 'text-muted-foreground'}>
              Intent to File – why it matters and how to file
            </span>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircle2 className={`w-5 h-5 mt-0.5 flex-shrink-0 ${currentStep >= 2 ? 'text-green-500' : 'text-muted-foreground/40'}`} />
            <span className={currentStep >= 2 ? 'text-foreground' : 'text-muted-foreground'}>
              Conditions connected to your service
            </span>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircle2 className={`w-5 h-5 mt-0.5 flex-shrink-0 ${currentStep >= 3 ? 'text-green-500' : 'text-muted-foreground/40'}`} />
            <span className={currentStep >= 3 ? 'text-foreground' : 'text-muted-foreground'}>
              Gathering evidence for your claim
            </span>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircle2 className={`w-5 h-5 mt-0.5 flex-shrink-0 ${currentStep >= 3 ? 'text-green-500' : 'text-muted-foreground/40'}`} />
            <span className={currentStep >= 3 ? 'text-foreground' : 'text-muted-foreground'}>
              Options for filing your claim
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-orange-50 dark:bg-orange-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-600" />
            Ready to File?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-[15px] leading-relaxed">
          <p className="text-muted-foreground mb-4">
            When you're ready, we can connect you with a professional claims filing partner who can help.
          </p>
          <Button 
            size="sm" 
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            onClick={onHandoffClick}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Connect with a Claims Pro
          </Button>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-5 text-sm text-muted-foreground leading-relaxed">
          <p className="font-medium text-foreground mb-2">Did you know?</p>
          <p>
            Filing an Intent to File can protect your effective date for up to one year. 
            This means if your claim is approved, you may receive back pay from the date 
            you filed your Intent.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

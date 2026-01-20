import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Target, 
  Eye, 
  Monitor, 
  UserPlus, 
  TrendingUp, 
  ShoppingCart, 
  Smartphone, 
  RefreshCw,
  Plus,
  X
} from "lucide-react";

interface AdvertiserSignupStepsProps {
  onComplete: (data: any) => void;
  isSubmitting: boolean;
}

const CAMPAIGN_GOALS = {
  awareness: [
    {
      id: "reach",
      name: "Reach",
      description: "Maximize the number of people who will see your ad",
      icon: Eye
    }
  ],
  consideration: [
    {
      id: "page_views",
      name: "Page Views",
      description: "Increase visits to site pages",
      icon: Monitor
    },
    {
      id: "signups",
      name: "Sign-ups",
      description: "Boost sign-ups for your website or app",
      icon: UserPlus
    },
    {
      id: "leads",
      name: "Leads",
      description: "Collect more leads for your business",
      icon: TrendingUp
    }
  ],
  conversion: [
    {
      id: "purchases",
      name: "Purchases",
      description: "Boost the number of product purchases made on your website or app",
      icon: ShoppingCart
    },
    {
      id: "app_installs",
      name: "App installs",
      description: "Maximize total app installations",
      icon: Smartphone
    },
    {
      id: "subscriptions",
      name: "Subscriptions",
      description: "Increase subscriptions to your service, website, app, etc.",
      icon: RefreshCw
    }
  ]
};

const CATEGORIES = [
  "Arts", "Business", "Comedy", "Education", "Fiction", "Government",
  "History", "Health & Fitness", "Kids & Family", "Leisure", "Music",
  "News", "Religion & Spirituality", "Science", "Society & Culture",
  "Sports", "Technology", "True Crime", "TV & Film"
];

export function AdvertiserSignupSteps({ onComplete, isSubmitting }: AdvertiserSignupStepsProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    company_name: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    website_url: "",
    business_description: "",
    campaign_goals: [] as string[],
    target_categories: [] as string[],
    team_members: [] as Array<{ email: string; role: string; name: string }>
  });

  const [newTeamMember, setNewTeamMember] = useState({ name: "", email: "", role: "ad_manager" });

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.company_name || !formData.contact_name || !formData.contact_email) {
        return;
      }
    }
    if (currentStep === 2 && formData.campaign_goals.length === 0) {
      return;
    }
    if (currentStep === 3 && formData.target_categories.length === 0) {
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const toggleGoal = (goalId: string) => {
    setFormData(prev => ({
      ...prev,
      campaign_goals: prev.campaign_goals.includes(goalId)
        ? prev.campaign_goals.filter(g => g !== goalId)
        : [...prev.campaign_goals, goalId]
    }));
  };

  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      target_categories: prev.target_categories.includes(category)
        ? prev.target_categories.filter(c => c !== category)
        : [...prev.target_categories, category]
    }));
  };

  const addTeamMember = () => {
    if (newTeamMember.email && newTeamMember.name) {
      setFormData(prev => ({
        ...prev,
        team_members: [...prev.team_members, { ...newTeamMember }]
      }));
      setNewTeamMember({ name: "", email: "", role: "ad_manager" });
    }
  };

  const removeTeamMember = (index: number) => {
    setFormData(prev => ({
      ...prev,
      team_members: prev.team_members.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    onComplete(formData);
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex justify-between items-center mb-8">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              step === currentStep ? 'bg-primary text-primary-foreground' :
              step < currentStep ? 'bg-primary/20 text-primary' :
              'bg-muted text-muted-foreground'
            }`}>
              {step}
            </div>
            {step < 4 && (
              <div className={`flex-1 h-1 mx-2 ${
                step < currentStep ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Company Information */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Tell us about your business</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Acme Corp"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_name">Contact Name *</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email *</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="john@acme.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="https://acme.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_description">Business Description</Label>
              <Textarea
                id="business_description"
                value={formData.business_description}
                onChange={(e) => setFormData({ ...formData, business_description: e.target.value })}
                placeholder="Tell us about your business, products/services, and advertising goals..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Campaign Goals */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>What's your campaign goal?</CardTitle>
            <CardDescription>Optimize your advertising for one or more of the following goals. You can change these anytime.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Awareness */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Awareness</h3>
              <div className="space-y-2">
                {CAMPAIGN_GOALS.awareness.map((goal) => {
                  const Icon = goal.icon;
                  const isSelected = formData.campaign_goals.includes(goal.id);
                  return (
                    <button
                      key={goal.id}
                      onClick={() => toggleGoal(goal.id)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                        isSelected 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{goal.name}</h4>
                          <p className="text-sm text-muted-foreground">{goal.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Consideration */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Consideration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {CAMPAIGN_GOALS.consideration.map((goal) => {
                  const Icon = goal.icon;
                  const isSelected = formData.campaign_goals.includes(goal.id);
                  return (
                    <button
                      key={goal.id}
                      onClick={() => toggleGoal(goal.id)}
                      className={`p-4 rounded-lg border-2 text-left transition-colors ${
                        isSelected 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{goal.name}</h4>
                          <p className="text-sm text-muted-foreground">{goal.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conversion */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Conversion</h3>
              <div className="space-y-2">
                {CAMPAIGN_GOALS.conversion.map((goal) => {
                  const Icon = goal.icon;
                  const isSelected = formData.campaign_goals.includes(goal.id);
                  return (
                    <button
                      key={goal.id}
                      onClick={() => toggleGoal(goal.id)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                        isSelected 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{goal.name}</h4>
                          <p className="text-sm text-muted-foreground">{goal.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Target Categories */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Target Categories</CardTitle>
            <CardDescription>Select the podcast categories you want to target with your ads. You can change these anytime.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => {
                const isSelected = formData.target_categories.includes(category);
                return (
                  <Badge
                    key={category}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer px-4 py-2 text-sm"
                    onClick={() => toggleCategory(category)}
                  >
                    {category}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Team Members */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Add Team Members (Optional)</CardTitle>
            <CardDescription>Invite team members to help manage your advertising campaigns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="member_name">Name</Label>
                  <Input
                    id="member_name"
                    value={newTeamMember.name}
                    onChange={(e) => setNewTeamMember({ ...newTeamMember, name: e.target.value })}
                    placeholder="Jane Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member_email">Email</Label>
                  <Input
                    id="member_email"
                    type="email"
                    value={newTeamMember.email}
                    onChange={(e) => setNewTeamMember({ ...newTeamMember, email: e.target.value })}
                    placeholder="jane@acme.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member_role">Role</Label>
                  <select
                    id="member_role"
                    value={newTeamMember.role}
                    onChange={(e) => setNewTeamMember({ ...newTeamMember, role: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="owner">Owner</option>
                    <option value="ad_manager">Ad Manager</option>
                    <option value="billing">Billing</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={addTeamMember}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Team Member
              </Button>
            </div>

            {formData.team_members.length > 0 && (
              <div className="space-y-2">
                <Label>Team Members</Label>
                <div className="space-y-2">
                  {formData.team_members.map((member, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                        <Badge variant="secondary" className="mt-1">{member.role.replace('_', ' ')}</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTeamMember(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">What happens next?</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• We'll review your application within 1-2 business days</li>
                <li>• Once approved, you'll be able to create ad campaigns</li>
                <li>• A small retainer deposit will be required to get started</li>
                <li>• You'll be charged based on actual impressions delivered</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        {currentStep > 1 && (
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
        )}
        {currentStep < 4 ? (
          <Button 
            onClick={handleNext}
            className="ml-auto"
            disabled={
              (currentStep === 1 && (!formData.company_name || !formData.contact_name || !formData.contact_email)) ||
              (currentStep === 2 && formData.campaign_goals.length === 0) ||
              (currentStep === 3 && formData.target_categories.length === 0)
            }
          >
            Next
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting} className="ml-auto">
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </Button>
        )}
      </div>
    </div>
  );
}

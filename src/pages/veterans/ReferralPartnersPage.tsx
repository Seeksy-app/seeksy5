import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Shield, Users, Clock, FileCheck, MessageSquare, Info, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SERVICES_OPTIONS = [
  'VA disability claims support',
  'Federal retirement / pension planning',
  'Social Security / long-term disability',
  'Financial planning / counseling',
  'Healthcare or TRICARE navigation',
  'Other benefits support'
];

const ORG_TYPE_OPTIONS = [
  'Accredited VSO',
  'Law firm',
  'Claims consulting firm',
  'Nonprofit / government program',
  'Financial planning firm',
  'Other'
];

const RESPONSE_TIME_OPTIONS = [
  'Under 24 hours',
  '1–2 business days',
  '3+ business days'
];

export default function ReferralPartnersPage() {
  const [activeTab, setActiveTab] = useState('qualifications');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    org_name: '',
    contact_name: '',
    email: '',
    phone: '',
    website: '',
    org_type: '',
    services: [] as string[],
    regions: '',
    response_time: '',
    ideal_client: '',
    licensing: '',
    extra_notes: '',
    consent: false
  });

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.consent) {
      toast.error('Please confirm that you agree to our referral and service standards.');
      return;
    }

    if (formData.services.length === 0) {
      toast.error('Please select at least one service you provide.');
      return;
    }

    setIsSubmitting(true);

    try {
      const regions = formData.regions.split(',').map(r => r.trim()).filter(Boolean);
      
      const { error } = await supabase
        .from('veteran_referral_partner_applications')
        .insert({
          org_name: formData.org_name.trim(),
          contact_name: formData.contact_name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim() || null,
          website: formData.website.trim() || null,
          org_type: formData.org_type,
          services: formData.services,
          regions: regions,
          response_time: formData.response_time,
          ideal_client: formData.ideal_client.trim(),
          licensing: formData.licensing.trim(),
          extra_notes: formData.extra_notes.trim() || null,
          consent: formData.consent
        });

      if (error) throw error;

      setSubmitted(true);
      toast.success('Application submitted successfully!');
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-slate-900 text-white py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-400" />
            <span className="font-semibold text-lg">Military & Federal Benefits Hub</span>
          </div>
          <Button 
            variant="secondary"
            onClick={() => window.location.href = '/yourbenefits'}
          >
            Back to Hub
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
            Referral Partner Program
          </Badge>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Become a Trusted Benefits Referral Partner
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            Apply to receive qualified referrals from our Military & Federal Benefits Hub. We work with organizations that put service members, veterans, and federal employees first.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => setActiveTab('qualifications')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              View Qualifications
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => setActiveTab('registration')}
            >
              Apply Now
            </Button>
          </div>
        </div>
      </section>

      {/* Tabs Content */}
      <section className="pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="qualifications">Qualifications</TabsTrigger>
              <TabsTrigger value="how-it-works">How It Works</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="registration">Registration</TabsTrigger>
            </TabsList>

            {/* Qualifications Tab */}
            <TabsContent value="qualifications" className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Who We Partner With</h2>
              <p className="text-slate-600">
                We work with organizations that support military service members, veterans, and federal employees with benefits, retirement, and financial wellness. To protect our users, all partners must meet a few basic requirements.
              </p>
              
              <div className="space-y-4">
                {[
                  { icon: Shield, title: 'Focus on military and federal benefits', body: 'Your core services include VA disability, federal retirement, or related benefits support.' },
                  { icon: FileCheck, title: 'Licensed and compliant', body: 'You maintain all required licenses, accreditations, and insurance for your state(s) of operation.' },
                  { icon: CheckCircle2, title: 'Transparent fees', body: 'You provide clear pricing with no hidden costs or surprise back-end fees to the client.' },
                  { icon: Users, title: 'Dedicated case support', body: 'Each referral has a real point of contact, not only a generic inbox or ticket number.' },
                  { icon: MessageSquare, title: 'Service-first mindset', body: 'You agree to our service standards: respectful communication, clear expectations, and timely follow-up.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-white rounded-lg border border-slate-200">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <item.icon className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{item.title}</h3>
                      <p className="text-slate-600 text-sm">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  Once approved, you'll be listed as an eligible referral destination within the Military & Federal Benefits Hub.
                </p>
              </div>
            </TabsContent>

            {/* How It Works Tab */}
            <TabsContent value="how-it-works" className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">How the Referral Program Works</h2>
              
              <div className="space-y-4">
                {[
                  { step: 1, title: 'Apply once', body: 'Tell us about your organization, licenses, service areas, and who you serve.' },
                  { step: 2, title: 'Review and onboarding', body: 'Our team reviews your details, verifies credentials, and confirms your ideal client profile.' },
                  { step: 3, title: 'Matched referrals', body: 'When a user asks for help, we route them to partners that best match their needs and location.' },
                  { step: 4, title: 'Simple status updates', body: 'You agree to send quick status updates so we can track outcomes and improve the experience.' },
                  { step: 5, title: 'Ongoing quality checks', body: 'We review feedback, response times, and case outcomes to keep the network high-quality.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-white rounded-lg border border-slate-200">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700">
                        {item.step}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{item.title}</h3>
                      <p className="text-slate-600 text-sm">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <AlertCircle className="h-5 w-5 text-slate-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600">
                  We do not share a user's full conversation history without consent. You only receive the information they choose to send with their referral.
                </p>
              </div>
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Pricing and Partnership Options</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Standard Referral Partner</CardTitle>
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Most common</Badge>
                    </div>
                    <p className="text-sm text-slate-600">Ideal for VSOs, small–mid sized firms, and nonprofits.</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {[
                        'No upfront platform fee',
                        'You set and manage your own client pricing',
                        'Must meet service and response-time standards',
                        'Eligible for general referral routing'
                      ].map((item, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Premium Integration</CardTitle>
                      <Badge variant="secondary">Future option</Badge>
                    </div>
                    <p className="text-sm text-slate-600">For larger organizations that want deeper technical integration.</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {[
                        'Custom routing rules and service areas',
                        'Co-branded experiences and reporting',
                        'Volume-based or per-lead pricing',
                        'Designed together during onboarding'
                      ].map((item, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  We are currently prioritizing high-quality partners over high volume. Share your details in the registration form and we'll follow up with next steps.
                </p>
              </div>
            </TabsContent>

            {/* Registration Tab */}
            <TabsContent value="registration">
              {submitted ? (
                <Card className="p-8 text-center">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Submitted!</h2>
                  <p className="text-slate-600">
                    Thank you. Your application has been submitted. Our team will review your information and follow up by email.
                  </p>
                </Card>
              ) : (
                <div className="grid lg:grid-cols-5 gap-8">
                  {/* Form - Left Side */}
                  <div className="lg:col-span-3 space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-2">Apply to Join Our Referral Network</h2>
                      <p className="text-slate-600">
                        Complete this form to be considered as a referral partner for the Military & Federal Benefits Hub. We'll review your information and contact you by email with next steps.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="org_name">Organization name *</Label>
                          <Input
                            id="org_name"
                            value={formData.org_name}
                            onChange={(e) => handleInputChange('org_name', e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact_name">Primary contact name *</Label>
                          <Input
                            id="contact_name"
                            value={formData.contact_name}
                            onChange={(e) => handleInputChange('contact_name', e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone (optional)</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="(555) 123-4567"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="website">Website (optional)</Label>
                          <Input
                            id="website"
                            value={formData.website}
                            onChange={(e) => handleInputChange('website', e.target.value)}
                            placeholder="https://yourorganization.org"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="org_type">Type of organization *</Label>
                          <Select value={formData.org_type} onValueChange={(v) => handleInputChange('org_type', v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {ORG_TYPE_OPTIONS.map(opt => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Primary services you provide *</Label>
                        <div className="grid md:grid-cols-2 gap-2">
                          {SERVICES_OPTIONS.map(service => (
                            <div 
                              key={service}
                              className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                                formData.services.includes(service) 
                                  ? 'bg-blue-50 border-blue-300' 
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                              onClick={() => toggleService(service)}
                            >
                              <Checkbox checked={formData.services.includes(service)} />
                              <span className="text-sm">{service}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="regions">States / regions you serve *</Label>
                        <Input
                          id="regions"
                          value={formData.regions}
                          onChange={(e) => handleInputChange('regions', e.target.value)}
                          placeholder="Example: VA, NC, SC or Nationwide"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="response_time">Average response time to new inquiries *</Label>
                        <Select value={formData.response_time} onValueChange={(v) => handleInputChange('response_time', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select response time" />
                          </SelectTrigger>
                          <SelectContent>
                            {RESPONSE_TIME_OPTIONS.map(opt => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ideal_client">Briefly describe your ideal client *</Label>
                        <Textarea
                          id="ideal_client"
                          value={formData.ideal_client}
                          onChange={(e) => handleInputChange('ideal_client', e.target.value)}
                          placeholder="Example: Post-9/11 veterans with 30%+ ratings, federal employees within 5 years of retirement, etc."
                          required
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="licensing">Licensing / accreditation details *</Label>
                        <Textarea
                          id="licensing"
                          value={formData.licensing}
                          onChange={(e) => handleInputChange('licensing', e.target.value)}
                          placeholder="Example: VA-accredited attorney, CFP®, state bar number, VSOC accreditation, etc."
                          required
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="extra_notes">Anything else we should know? (optional)</Label>
                        <Textarea
                          id="extra_notes"
                          value={formData.extra_notes}
                          onChange={(e) => handleInputChange('extra_notes', e.target.value)}
                          rows={2}
                        />
                      </div>

                      <div 
                        className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer"
                        onClick={() => handleInputChange('consent', !formData.consent)}
                      >
                        <Checkbox checked={formData.consent} className="mt-0.5" />
                        <span className="text-sm text-slate-700">
                          I confirm that the information provided is accurate and that our organization agrees to follow Seeksy's referral and service standards.
                        </span>
                      </div>

                      <Button 
                        type="submit" 
                        size="lg" 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Application'}
                      </Button>
                    </form>
                  </div>

                  {/* Info Card - Right Side */}
                  <div className="lg:col-span-2">
                    <Card className="sticky top-6">
                      <CardHeader>
                        <CardTitle className="text-lg">What Happens After You Apply?</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {[
                          { title: 'Review', body: 'We review your application, website, and licensing information.' },
                          { title: 'Follow-up', body: 'If we have questions, we will reach out by email for clarification.' },
                          { title: 'Decision', body: 'You will receive an approval, waitlist, or decline notice with feedback.' },
                          { title: 'Onboarding', body: 'Approved partners receive a brief onboarding guide and referral expectations.' },
                        ].map((item, i) => (
                          <div key={i} className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <Clock className="h-3 w-3 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-slate-900 text-sm">{item.title}</h4>
                              <p className="text-slate-600 text-sm">{item.body}</p>
                            </div>
                          </div>
                        ))}

                        <div className="pt-4 border-t border-slate-100">
                          <p className="text-xs text-slate-500">
                            Your information is kept private and is only used to evaluate your fit for the referral network.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Military & Federal Benefits Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

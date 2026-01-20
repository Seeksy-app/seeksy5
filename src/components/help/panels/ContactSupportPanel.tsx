/**
 * Portal-scoped Contact Support Panel
 * Prefills support form with portal context
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Mail, MessageSquare, Bug, Lightbulb, HelpCircle } from 'lucide-react';
import { PortalType, PORTAL_LABELS } from '@/hooks/useHelpDrawer';
import { useToast } from '@/hooks/use-toast';

interface ContactSupportPanelProps {
  portal: PortalType;
  contentKey: string;
  currentRoute: string | null;
}

// Portal-specific support categories
const PORTAL_CATEGORIES: Record<PortalType, string[]> = {
  admin: ['Technical Issue', 'User Management', 'Security Concern', 'Configuration Help', 'Other'],
  creator: ['Account Help', 'Studio Issue', 'Monetization', 'Content Issue', 'Feature Request', 'Other'],
  advertiser: ['Campaign Issue', 'Billing', 'Targeting Help', 'Analytics', 'Other'],
  board: ['Report Access', 'Portal Issue', 'Document Request', 'Other'],
};

export function ContactSupportPanel({ portal, contentKey, currentRoute }: ContactSupportPanelProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subject: `Support - ${PORTAL_LABELS[portal]}`,
    category: '',
    message: '',
    email: '',
  });
  
  const categories = PORTAL_CATEGORIES[portal] || ['Other'];
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simulate submission - in production, this would call an edge function
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Support request submitted',
        description: 'We\'ll get back to you as soon as possible.',
      });
      
      // Reset form
      setFormData({
        subject: `Support - ${PORTAL_LABELS[portal]}`,
        category: '',
        message: '',
        email: '',
      });
    } catch (error) {
      toast({
        title: 'Failed to submit',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">
          Get help from our support team
        </p>
        <Badge variant="outline" className="text-xs">
          {PORTAL_LABELS[portal]} Support
        </Badge>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardContent className="p-3 text-center">
            <Bug className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs font-medium">Report Bug</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardContent className="p-3 text-center">
            <Lightbulb className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs font-medium">Suggest Feature</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardContent className="p-3 text-center">
            <HelpCircle className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs font-medium">Ask Question</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Contact Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            placeholder="Brief description"
            value={formData.subject}
            onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            placeholder="Describe your issue or question..."
            value={formData.message}
            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
            rows={4}
            required
          />
        </div>
        
        {/* Debug info (hidden but included in submission) */}
        <input type="hidden" name="portal" value={portal} />
        <input type="hidden" name="currentRoute" value={currentRoute || ''} />
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>Sending...</>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </>
          )}
        </Button>
      </form>
      
      <p className="text-xs text-muted-foreground text-center">
        Typical response time: 24-48 hours
      </p>
    </div>
  );
}

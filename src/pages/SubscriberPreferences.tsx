import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, Mail, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SubscriberList {
  id: string;
  name: string;
  slug: string;
  isMember: boolean;
}

export default function SubscriberPreferences() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [subscriber, setSubscriber] = useState<{ id: string; email: string; tenant_id: string } | null>(null);
  const [lists, setLists] = useState<SubscriberList[]>([]);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid preferences link');
      setIsLoading(false);
      return;
    }
    loadPreferences();
  }, [token]);

  const loadPreferences = async () => {
    try {
      // Get subscriber by token
      const { data: sub, error: subError } = await (supabase
        .from('newsletter_subscribers')
        .select('id, email, tenant_id') as any)
        .eq('preferences_token', token)
        .single();

      if (subError || !sub) {
        setError('Preferences link expired or invalid');
        return;
      }

      setSubscriber(sub);

      // Get all available lists
      const { data: allLists } = await supabase
        .from('subscriber_lists')
        .select('id, name, slug')
        .order('name');

      // Get subscriber's current list memberships
      const { data: memberships } = await supabase
        .from('subscriber_list_members')
        .select('list_id')
        .eq('subscriber_id', sub.id);

      const memberListIds = new Set(memberships?.map(m => m.list_id) || []);

      const listsWithStatus = (allLists || []).map(list => ({
        ...list,
        isMember: memberListIds.has(list.id),
      }));

      setLists(listsWithStatus);
      setSelectedLists(listsWithStatus.filter(l => l.isMember).map(l => l.id));
    } catch (err) {
      setError('Failed to load preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleList = (listId: string) => {
    setSelectedLists(prev =>
      prev.includes(listId) ? prev.filter(id => id !== listId) : [...prev, listId]
    );
  };

  const savePreferences = async () => {
    if (!subscriber) return;
    setIsSaving(true);

    try {
      // Remove all current memberships
      await supabase
        .from('subscriber_list_members')
        .delete()
        .eq('subscriber_id', subscriber.id);

      // Add selected memberships
      if (selectedLists.length > 0) {
        const memberships = selectedLists.map(listId => ({
          subscriber_id: subscriber.id,
          list_id: listId,
          tenant_id: subscriber.tenant_id,
        }));
        await supabase.from('subscriber_list_members').insert(memberships);
      }

      toast.success('Preferences saved!');
    } catch (err) {
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const unsubscribeAll = async () => {
    if (!subscriber) return;
    setIsSaving(true);

    try {
      await supabase
        .from('subscriber_list_members')
        .delete()
        .eq('subscriber_id', subscriber.id);

      await supabase
        .from('newsletter_subscribers')
        .update({ status: 'unsubscribed' })
        .eq('id', subscriber.id);

      setSelectedLists([]);
      toast.success('Unsubscribed from all lists');
    } catch (err) {
      toast.error('Failed to unsubscribe');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Link</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-lg mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Email Preferences</CardTitle>
            <CardDescription>
              Manage your subscriptions for {subscriber?.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              {lists.map(list => (
                <div
                  key={list.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={list.id}
                    checked={selectedLists.includes(list.id)}
                    onCheckedChange={() => toggleList(list.id)}
                  />
                  <Label htmlFor={list.id} className="flex-1 cursor-pointer">
                    <span className="font-medium">{list.name}</span>
                  </Label>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={savePreferences} disabled={isSaving} className="w-full">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Save Preferences
              </Button>
              <Button variant="outline" onClick={unsubscribeAll} disabled={isSaving} className="w-full text-destructive hover:text-destructive">
                Unsubscribe from All
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

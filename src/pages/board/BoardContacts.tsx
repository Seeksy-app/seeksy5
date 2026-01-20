import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { Search, Mail, Phone, Building2, Linkedin, Plus, StickyNote, User } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface BoardMember {
  id: string;
  full_name: string;
  role: string;
  email: string;
  phone?: string;
  bio?: string;
  photo_url?: string;
  company?: string;
  linkedin_url?: string;
  is_active: boolean;
  joined_at: string;
}

interface BoardNote {
  id: string;
  board_member_id: string;
  content: string;
  created_at: string;
}

export default function BoardContacts() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<BoardMember | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['board-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('board_members')
        .select('*')
        .eq('is_active', true)
        .order('role', { ascending: true });
      
      if (error) throw error;
      return data as BoardMember[];
    }
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['board-notes', selectedMember?.id],
    queryFn: async () => {
      if (!selectedMember) return [];
      const { data, error } = await supabase
        .from('board_notes')
        .select('*')
        .eq('board_member_id', selectedMember.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BoardNote[];
    },
    enabled: !!selectedMember
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({ memberId, content }: { memberId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('board_notes')
        .insert({
          board_member_id: memberId,
          created_by: user.id,
          content
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-notes'] });
      setNoteContent('');
      toast.success('Note added successfully');
    },
    onError: () => {
      toast.error('Failed to add note');
    }
  });

  const filteredMembers = members.filter(member =>
    member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendEmail = (member: BoardMember) => {
    const mailto = `mailto:${member.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailto);
    setEmailSubject('');
    setEmailBody('');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'chair': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'board member': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'board observer': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Board Contacts</h1>
            <p className="text-sm text-slate-500">Directory of board members and key contacts</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, role, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Members Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-slate-200 rounded w-1/2" />
                      <div className="h-4 bg-slate-100 rounded w-1/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredMembers.map((member) => (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16 border-2 border-slate-100">
                      <AvatarImage src={member.photo_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg font-semibold">
                        {getInitials(member.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 truncate">{member.full_name}</h3>
                        <Badge variant="outline" className={getRoleBadgeColor(member.role)}>
                          {member.role}
                        </Badge>
                      </div>
                      
                      {member.company && (
                        <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-2">
                          <Building2 className="h-3.5 w-3.5" />
                          <span>{member.company}</span>
                        </div>
                      )}
                      
                      {member.bio && (
                        <p className="text-sm text-slate-600 line-clamp-2 mb-3">{member.bio}</p>
                      )}
                      
                      <div className="flex items-center gap-2">
                        {/* Contact Email Modal */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="gap-1.5">
                              <Mail className="h-3.5 w-3.5" />
                              Contact
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Contact {member.full_name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <div>
                                <label className="text-sm font-medium text-slate-700">Subject</label>
                                <Input
                                  value={emailSubject}
                                  onChange={(e) => setEmailSubject(e.target.value)}
                                  placeholder="Email subject..."
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700">Message</label>
                                <Textarea
                                  value={emailBody}
                                  onChange={(e) => setEmailBody(e.target.value)}
                                  placeholder="Your message..."
                                  rows={4}
                                />
                              </div>
                              <Button onClick={() => handleSendEmail(member)} className="w-full">
                                <Mail className="h-4 w-4 mr-2" />
                                Open in Email Client
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {/* Notes Sheet */}
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => setSelectedMember(member)}
                            >
                              <StickyNote className="h-3.5 w-3.5" />
                            </Button>
                          </SheetTrigger>
                          <SheetContent>
                            <SheetHeader>
                              <SheetTitle>Notes on {member.full_name}</SheetTitle>
                            </SheetHeader>
                            <div className="mt-6 space-y-4">
                              {/* Add Note */}
                              <div className="space-y-2">
                                <Textarea
                                  value={noteContent}
                                  onChange={(e) => setNoteContent(e.target.value)}
                                  placeholder="Add a private note..."
                                  rows={3}
                                />
                                <Button 
                                  size="sm"
                                  disabled={!noteContent.trim()}
                                  onClick={() => addNoteMutation.mutate({ 
                                    memberId: member.id, 
                                    content: noteContent 
                                  })}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add Note
                                </Button>
                              </div>
                              
                              {/* Notes List */}
                              <div className="space-y-3 pt-4 border-t">
                                {notes.length === 0 ? (
                                  <p className="text-sm text-slate-500 text-center py-4">No notes yet</p>
                                ) : (
                                  notes.map((note) => (
                                    <div key={note.id} className="p-3 bg-slate-50 rounded-lg">
                                      <p className="text-sm text-slate-700">{note.content}</p>
                                      <p className="text-xs text-slate-400 mt-2">
                                        {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                                      </p>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </SheetContent>
                        </Sheet>

                        {member.linkedin_url && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => window.open(member.linkedin_url, '_blank')}
                          >
                            <Linkedin className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredMembers.length === 0 && !isLoading && (
          <Card className="p-12 text-center">
            <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-700 mb-2">No contacts found</h3>
            <p className="text-sm text-slate-500">Try adjusting your search terms</p>
          </Card>
        )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Database, ExternalLink, FileText, Headphones, Newspaper, Search, Tag, Flag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useBoardDataMode } from '@/contexts/BoardDataModeContext';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface RDIntelDocument {
  id: string;
  title: string;
  source: string;
  url: string | null;
  publish_date: string | null;
  type: 'blog' | 'podcast' | 'pdf';
  summary: string | null;
  category_tags: string[];
  use_in_board_insights: boolean;
  created_at: string;
}

const typeIcons = {
  blog: Newspaper,
  podcast: Headphones,
  pdf: FileText
};

const typeColors = {
  blog: 'bg-blue-100 text-blue-700',
  podcast: 'bg-purple-100 text-purple-700',
  pdf: 'bg-amber-100 text-amber-700'
};

// Demo data for when no real data exists
const DEMO_DOCUMENTS: RDIntelDocument[] = [
  {
    id: '1',
    title: 'The Future of Creator Economy: 2025 Predictions',
    source: 'TechCrunch',
    url: 'https://techcrunch.com/creator-economy-2025',
    publish_date: '2024-12-01T00:00:00Z',
    type: 'blog',
    summary: 'Comprehensive analysis of emerging trends in the creator economy, including the rise of AI tools, identity verification, and direct monetization strategies.',
    category_tags: ['creator economy', 'trends', 'monetization'],
    use_in_board_insights: true,
    created_at: '2024-12-01T00:00:00Z'
  },
  {
    id: '2',
    title: 'Podcast Industry Revenue Report Q4 2024',
    source: 'IAB',
    url: 'https://iab.com/podcast-report-2024',
    publish_date: '2024-11-15T00:00:00Z',
    type: 'pdf',
    summary: 'Industry benchmark report showing podcast ad revenue growth of 25% YoY, with programmatic advertising leading adoption.',
    category_tags: ['podcasting', 'advertising', 'market research'],
    use_in_board_insights: true,
    created_at: '2024-11-20T00:00:00Z'
  },
  {
    id: '3',
    title: 'Building Trust in the Age of Deepfakes',
    source: 'The Verge Podcast',
    url: null,
    publish_date: '2024-11-28T00:00:00Z',
    type: 'podcast',
    summary: 'Discussion on voice and face verification technologies as a defense against synthetic media, featuring industry experts.',
    category_tags: ['identity', 'security', 'AI'],
    use_in_board_insights: true,
    created_at: '2024-11-30T00:00:00Z'
  },
  {
    id: '4',
    title: 'SaaS Metrics That Matter for Creator Platforms',
    source: 'a16z',
    url: 'https://a16z.com/saas-metrics-creator',
    publish_date: '2024-10-20T00:00:00Z',
    type: 'blog',
    summary: 'Deep dive into key SaaS metrics for creator-focused platforms, including creator NPS, revenue retention, and engagement benchmarks.',
    category_tags: ['metrics', 'SaaS', 'benchmarks'],
    use_in_board_insights: true,
    created_at: '2024-10-25T00:00:00Z'
  }
];

export default function BoardResearch() {
  const navigate = useNavigate();
  const { dataMode, isDemo } = useBoardDataMode();
  const [documents, setDocuments] = useState<RDIntelDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [dataMode]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    
    if (isDemo) {
      // Use demo data
      setDocuments(DEMO_DOCUMENTS);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('rd_intel_documents')
        .select('*')
        .eq('use_in_board_insights', true)
        .order('publish_date', { ascending: false });

      if (error) {
        console.error('Error fetching R&D documents:', error);
        setDocuments(DEMO_DOCUMENTS); // Fallback to demo
      } else if (data?.length) {
        // Cast the type field to our union type
        const typedData = data.map(d => ({
          ...d,
          type: d.type as 'blog' | 'podcast' | 'pdf'
        }));
        setDocuments(typedData);
      } else {
        setDocuments(DEMO_DOCUMENTS);
      }
    } catch (err) {
      console.error('Error:', err);
      setDocuments(DEMO_DOCUMENTS);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchQuery || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category_tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = !filterType || doc.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const stats = {
    total: documents.length,
    blog: documents.filter(d => d.type === 'blog').length,
    podcast: documents.filter(d => d.type === 'podcast').length,
    pdf: documents.filter(d => d.type === 'pdf').length
  };

  return (
    <div className="w-full space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md">
                <Database className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold text-slate-900">R&D Research</h1>
                  {isDemo && (
                    <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                      Demo Data
                    </Badge>
                  )}
                </div>
                <p className="text-slate-500">
                  Market intelligence and research flagged for board review
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Total Documents</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={() => setFilterType(filterType === 'blog' ? null : 'blog')}>
            <CardContent className="p-4">
              <p className="text-sm text-blue-600">Blog Articles</p>
              <p className="text-2xl font-bold text-blue-700">{stats.blog}</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors"
                onClick={() => setFilterType(filterType === 'podcast' ? null : 'podcast')}>
            <CardContent className="p-4">
              <p className="text-sm text-purple-600">Podcasts</p>
              <p className="text-2xl font-bold text-purple-700">{stats.podcast}</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors"
                onClick={() => setFilterType(filterType === 'pdf' ? null : 'pdf')}>
            <CardContent className="p-4">
              <p className="text-sm text-amber-600">PDF Reports</p>
              <p className="text-2xl font-bold text-amber-700">{stats.pdf}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {filterType && (
            <Button 
              variant="outline" 
              onClick={() => setFilterType(null)}
              className="text-slate-600"
            >
              Clear filter: {filterType}
            </Button>
          )}
        </div>

        {/* Documents List */}
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-slate-200">
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/4 mb-4" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))
          ) : filteredDocuments.length === 0 ? (
            <Card className="border-slate-200">
              <CardContent className="p-12 text-center">
                <Database className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-700 mb-1">No documents found</h3>
                <p className="text-slate-500">
                  {searchQuery ? 'Try adjusting your search query' : 'No research has been flagged for board review yet'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredDocuments.map((doc, index) => {
              const Icon = typeIcons[doc.type];
              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-slate-200 hover:border-slate-300 hover:shadow-md transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${typeColors[doc.type]}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                                {doc.title}
                              </h3>
                              <div className="flex items-center gap-3 text-sm text-slate-500 mb-3">
                                <span>{doc.source}</span>
                                {doc.publish_date && (
                                  <>
                                    <span>•</span>
                                    <span>{format(new Date(doc.publish_date), 'MMM d, yyyy')}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-emerald-100 text-emerald-700 border-0">
                                <Flag className="w-3 h-3 mr-1" />
                                Flagged for Board
                              </Badge>
                              {doc.url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(doc.url!, '_blank')}
                                  className="text-slate-500 hover:text-slate-700"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {doc.summary && (
                            <p className="text-slate-600 mb-3 line-clamp-2">
                              {doc.summary}
                            </p>
                          )}
                          
                          {doc.category_tags.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <Tag className="w-3 h-3 text-slate-400" />
                              {doc.category_tags.map((tag, i) => (
                                <Badge 
                                  key={i} 
                                  variant="secondary"
                                  className="text-xs bg-slate-100 text-slate-600"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Info Banner */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Database className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-blue-700">
              These documents have been curated by the R&D team and flagged for board review. 
              For full access to the intelligence feeds, please contact administration.
            </p>
          </CardContent>
        </Card>
    </div>
  );
}
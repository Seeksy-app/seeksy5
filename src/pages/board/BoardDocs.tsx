
import { MarkdownRenderer } from '@/components/board/MarkdownRenderer';
import { useBoardContent, useBoardDocuments } from '@/hooks/useBoardContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ArrowLeft, Download, ExternalLink, File, FileImage, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const getFileIcon = (fileType: string | null) => {
  if (!fileType) return File;
  if (fileType.includes('pdf')) return FileText;
  if (fileType.includes('image')) return FileImage;
  if (fileType.includes('sheet') || fileType.includes('excel')) return FileSpreadsheet;
  return File;
};

// Placeholder documents for layout
const placeholderDocs = [
  {
    id: 'placeholder-1',
    title: 'Investor Deck Q4 2024',
    description: 'Latest investor presentation deck',
    file_type: 'pdf',
    file_url: null,
    content: null,
  },
  {
    id: 'placeholder-2',
    title: 'Financial Projections Model',
    description: 'Detailed 3-year financial model spreadsheet',
    file_type: 'excel',
    file_url: null,
    content: null,
  },
  {
    id: 'placeholder-3',
    title: 'Board Meeting Minutes - November 2024',
    description: 'Summary of last board meeting discussions',
    file_type: 'pdf',
    file_url: null,
    content: null,
  },
];

export default function BoardDocs() {
  const navigate = useNavigate();
  const { content, isLoading: contentLoading } = useBoardContent('docs');
  const { documents: dbDocuments, isLoading: docsLoading } = useBoardDocuments();

  // Use database documents if available, otherwise use placeholders
  const documents = dbDocuments && dbDocuments.length > 0 ? dbDocuments : placeholderDocs;
  const hasRealDocs = dbDocuments && dbDocuments.length > 0;

  return (
    <div className="w-full">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-md">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Documents</h1>
            <p className="text-slate-500">Reports, legal documents & meeting minutes</p>
          </div>
        </div>

        {/* Overview Content */}
        <Card className="bg-white border-slate-200 shadow-sm mb-8">
          <CardContent className="p-8">
            {contentLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : content?.content ? (
              <div className="prose prose-slate max-w-none">
                <MarkdownRenderer content={content.content} />
              </div>
            ) : (
              <div className="text-slate-600">
                <p>Access key documents, reports, and meeting materials for board members and investors.</p>
                <p className="mt-2 text-slate-500 text-sm">Documents are organized by category and updated regularly.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Available Documents</h2>
          
          {docsLoading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="bg-white border-slate-200">
                <CardContent className="p-4 flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            documents?.map((doc) => {
              const Icon = getFileIcon(doc.file_type);
              const isPlaceholder = !doc.file_url;
              
              return (
                <Card 
                  key={doc.id} 
                  className="bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-900">{doc.title}</h3>
                        {doc.description && (
                          <p className="text-sm text-slate-500 truncate">{doc.description}</p>
                        )}
                      </div>
                      {doc.file_url ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() => window.open(doc.file_url!, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400 px-3 py-1 bg-slate-100 rounded-full">
                          Coming soon
                        </span>
                      )}
                    </div>
                    
                    {doc.content && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="prose prose-slate prose-sm max-w-none">
                          <MarkdownRenderer content={doc.content} />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}

          {/* Empty state message when using placeholders */}
          {!hasRealDocs && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800 font-medium">
                Documents are being prepared.
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Once uploaded, files will be available for viewing and download.
              </p>
            </div>
          )}
        </div>

        {content?.updated_at && (
          <p className="text-sm text-slate-400 mt-6 text-right">
            Last updated: {new Date(content.updated_at).toLocaleDateString()}
          </p>
        )}
    </div>
  );
}

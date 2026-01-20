/**
 * GBPNotFound - Not found state for invalid GBP resources
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GBPNotFoundProps {
  message?: string;
  returnPath?: string;
  returnLabel?: string;
}

export function GBPNotFound({ 
  message = 'The requested location could not be found.',
  returnPath = '/admin/gbp/locations',
  returnLabel = 'Back to Locations'
}: GBPNotFoundProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Not Found</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {message}
          </p>
          <Button 
            variant="outline" 
            onClick={() => navigate(returnPath)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {returnLabel}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

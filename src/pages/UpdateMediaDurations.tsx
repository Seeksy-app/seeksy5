import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function UpdateMediaDurations() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [processed, setProcessed] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const extractDuration = (fileUrl: string, fileType: string): Promise<number | null> => {
    return new Promise((resolve) => {
      const isVideo = fileType === 'video';
      const element = isVideo 
        ? document.createElement('video')
        : document.createElement('audio');
      
      element.preload = 'metadata';
      
      element.onloadedmetadata = () => {
        resolve(element.duration);
      };
      
      element.onerror = () => {
        resolve(null);
      };
      
      element.src = fileUrl;
    });
  };

  const processFiles = async () => {
    setIsProcessing(true);
    setProgress(0);
    setProcessed(0);
    setErrors([]);

    try {
      // Fetch all media files with null duration
      const { data: files, error: fetchError } = await supabase
        .from('media_files')
        .select('id, file_url, file_type, file_name')
        .is('duration_seconds', null);

      if (fetchError) throw fetchError;

      if (!files || files.length === 0) {
        toast({
          title: "No files to process",
          description: "All media files already have duration information",
        });
        setIsProcessing(false);
        return;
      }

      setTotal(files.length);
      const errorsList: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          // Extract duration
          const duration = await extractDuration(file.file_url, file.file_type);
          
          if (duration) {
            // Update database
            const { error: updateError } = await supabase
              .from('media_files')
              .update({ duration_seconds: duration })
              .eq('id', file.id);

            if (updateError) {
              errorsList.push(`Failed to update ${file.file_name}: ${updateError.message}`);
            }
          } else {
            errorsList.push(`Could not extract duration from ${file.file_name}`);
          }
        } catch (error) {
          errorsList.push(`Error processing ${file.file_name}: ${error}`);
        }

        setProcessed(i + 1);
        setProgress(((i + 1) / files.length) * 100);
      }

      setErrors(errorsList);

      toast({
        title: "Processing complete!",
        description: `Updated ${files.length - errorsList.length} of ${files.length} files`,
      });

    } catch (error) {
      console.error('Error processing files:', error);
      toast({
        title: "Error",
        description: "Failed to process media files",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Update Media Durations</CardTitle>
          <CardDescription>
            Extract and update duration information for existing media files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            onClick={processFiles}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Start Processing'
            )}
          </Button>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progress</span>
                <span>{processed} / {total}</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {!isProcessing && processed > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">
                  Successfully processed {processed - errors.length} files
                </span>
              </div>

              {errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">{errors.length} errors</span>
                  </div>
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 max-h-60 overflow-y-auto">
                    <ul className="text-sm space-y-1">
                      {errors.map((error, i) => (
                        <li key={i} className="text-muted-foreground">
                          • {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

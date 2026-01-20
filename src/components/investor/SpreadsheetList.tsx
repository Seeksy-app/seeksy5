import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSpreadsheet, Download, Eye, Trash2, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface SpreadsheetListProps {
  onViewSpreadsheet: (spreadsheet: any) => void;
  showAdminActions?: boolean;
}

export function SpreadsheetList({ onViewSpreadsheet, showAdminActions = false }: SpreadsheetListProps) {
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<any>(null);

  const { data: spreadsheets, isLoading } = useQuery({
    queryKey: ['investor-spreadsheets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investor_spreadsheets')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (spreadsheet: any) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('investor-spreadsheets')
        .remove([spreadsheet.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('investor_spreadsheets')
        .delete()
        .eq('id', spreadsheet.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investor-spreadsheets'] });
      toast.success("Spreadsheet deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedSpreadsheet(null);
    },
    onError: (error: any) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const handleDownload = async (spreadsheet: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('investor-spreadsheets')
        .download(spreadsheet.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = spreadsheet.name + '.' + spreadsheet.file_type;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Download started");
    } catch (error: any) {
      toast.error(`Failed to download: ${error.message}`);
    }
  };

  const handleDelete = (spreadsheet: any) => {
    setSelectedSpreadsheet(spreadsheet);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading spreadsheets...</p>
        </CardContent>
      </Card>
    );
  }

  if (!spreadsheets || spreadsheets.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileSpreadsheet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Spreadsheets Available</h3>
          <p className="text-muted-foreground">
            {showAdminActions 
              ? "Upload your first financial spreadsheet to share with investors"
              : "No financial spreadsheets have been shared yet"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Description</TableHead>
                <TableHead className="font-semibold">Period</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Last Updated</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {spreadsheets.map((spreadsheet) => (
                <TableRow key={spreadsheet.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-primary" />
                      <span className="font-medium">{spreadsheet.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground line-clamp-2">
                      {spreadsheet.description || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {spreadsheet.period ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3" />
                        {spreadsheet.period}
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="uppercase text-xs font-mono bg-muted px-2 py-1 rounded">
                      {spreadsheet.file_type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {format(new Date(spreadsheet.updated_at), "MMM d, yyyy")}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onViewSpreadsheet(spreadsheet)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View in Browser
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(spreadsheet)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      {showAdminActions && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(spreadsheet)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Spreadsheet</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedSpreadsheet?.name}"? This will remove the file and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedSpreadsheet && deleteMutation.mutate(selectedSpreadsheet)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

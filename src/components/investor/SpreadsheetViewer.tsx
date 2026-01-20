import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Download, Search, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import * as XLSX from 'xlsx';

interface SpreadsheetViewerProps {
  spreadsheet: any;
  onBack: () => void;
}

export function SpreadsheetViewer({ spreadsheet, onBack }: SpreadsheetViewerProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  useEffect(() => {
    loadSpreadsheet();
  }, [spreadsheet]);

  const loadSpreadsheet = async () => {
    setLoading(true);
    try {
      const { data: fileData, error } = await supabase.storage
        .from('investor-spreadsheets')
        .download(spreadsheet.file_path);

      if (error) throw error;

      if (spreadsheet.file_type === 'csv') {
        await parseCSV(fileData);
      } else if (spreadsheet.file_type === 'xlsx') {
        await parseXLSX(fileData);
      }
    } catch (error: any) {
      console.error('Error loading spreadsheet:', error);
      toast.error(`Failed to load spreadsheet: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const parseCSV = async (file: Blob) => {
    const text = await file.text();
    const rows = text.split('\n').map(row => 
      row.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
    );
    
    if (rows.length > 0) {
      setHeaders(rows[0]);
      setData(rows.slice(1).filter(row => row.some(cell => cell !== '')));
    }
  };

  const parseXLSX = async (file: Blob) => {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Get the first sheet
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    if (jsonData.length > 0) {
      setHeaders(jsonData[0].map(h => String(h || '')));
      setData(jsonData.slice(1).filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== '')));
    }
  };

  const handleDownload = async () => {
    try {
      const { data: fileData, error } = await supabase.storage
        .from('investor-spreadsheets')
        .download(spreadsheet.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(fileData);
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

  // Filter data based on search term
  const filteredData = data.filter(row =>
    row.some(cell =>
      String(cell || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Loading spreadsheet...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onBack}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <CardTitle className="text-2xl">{spreadsheet.name}</CardTitle>
              </div>
              {spreadsheet.description && (
                <CardDescription className="ml-10">{spreadsheet.description}</CardDescription>
              )}
              <div className="flex items-center gap-4 ml-10 text-sm text-muted-foreground">
                {spreadsheet.period && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {spreadsheet.period}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Last updated: {format(new Date(spreadsheet.updated_at), "MMM d, yyyy 'at' h:mm a")}
                </div>
              </div>
            </div>
            <Button onClick={handleDownload} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search in spreadsheet..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of {filteredData.length} rows
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[600px]">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow className="bg-muted/30">
                  {headers.map((header, index) => (
                    <TableHead key={index} className="font-semibold whitespace-nowrap">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={headers.length} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "No results found" : "No data available"}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {headers.map((_, colIndex) => (
                        <TableCell key={colIndex} className="whitespace-nowrap">
                          {String(row[colIndex] || '')}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

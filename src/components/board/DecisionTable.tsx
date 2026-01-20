import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DecisionRow {
  Topic: string;
  Option: string;
  Upside: string;
  Risk: string;
  Decision: string;
}

interface DecisionTableProps {
  rows: DecisionRow[];
  onDecisionChange: (rowIndex: number, value: string) => void;
  readOnly?: boolean;
}

export function DecisionTable({ rows, onDecisionChange, readOnly = false }: DecisionTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Topic</TableHead>
            <TableHead className="w-[180px]">Option</TableHead>
            <TableHead>Upside</TableHead>
            <TableHead>Risk</TableHead>
            <TableHead className="w-[200px]">Decision</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium text-sm">{row.Topic}</TableCell>
              <TableCell className="text-sm">{row.Option}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{row.Upside}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{row.Risk}</TableCell>
              <TableCell>
                {readOnly ? (
                  <span className="text-sm">{row.Decision || "—"}</span>
                ) : (
                  <Input
                    value={row.Decision}
                    onChange={(e) => onDecisionChange(index, e.target.value)}
                    placeholder="Enter decision..."
                    className={`h-8 text-sm ${!row.Decision?.trim() ? 'border-destructive text-destructive placeholder:text-destructive/70' : ''}`}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
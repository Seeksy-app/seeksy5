import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, DollarSign, Users, Calendar } from "lucide-react";
import { format } from "date-fns";

export function AwardsRevenueTab() {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: programs, isLoading } = useQuery({
    queryKey: ["awards-revenue", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get all user's programs
      const { data: programsData } = await supabase
        .from("awards_programs")
        .select("*")
        .eq("user_id", user.id);

      if (!programsData) return [];

      // For each program, get financial data
      const programsWithFinancials = await Promise.all(
        programsData.map(async (program) => {
          const { data: sponsorships } = await supabase
            .from("award_sponsorships")
            .select("amount_paid, status")
            .eq("program_id", program.id)
            .eq("status", "paid");

          const { data: nominations } = await supabase
            .from("award_self_nominations")
            .select("amount_paid, status")
            .eq("program_id", program.id)
            .eq("status", "paid");

          const { data: registrations } = await supabase
            .from("award_registrations")
            .select("amount_paid, status")
            .eq("program_id", program.id)
            .eq("status", "paid");

          const { data: payouts } = await supabase
            .from("award_payouts")
            .select("net_amount, status")
            .eq("program_id", program.id);

          const totalCollected = [
            ...(sponsorships || []),
            ...(nominations || []),
            ...(registrations || []),
          ].reduce((sum, t) => sum + Number(t.amount_paid), 0);

          const totalPaidOut = (payouts || [])
            .filter((p) => p.status === "completed")
            .reduce((sum, p) => sum + Number(p.net_amount), 0);

          const held = totalCollected - totalPaidOut;

          return {
            ...program,
            totalCollected,
            totalPaidOut,
            held,
            sponsorCount: sponsorships?.length || 0,
            nomineeCount: nominations?.length || 0,
            registrationCount: registrations?.length || 0,
          };
        })
      );

      return programsWithFinancials;
    },
    enabled: !!user,
  });

  const totalRevenue = programs?.reduce((sum, p) => sum + p.totalCollected, 0) || 0;
  const totalPaidOut = programs?.reduce((sum, p) => sum + p.totalPaidOut, 0) || 0;
  const totalHeld = programs?.reduce((sum, p) => sum + p.held, 0) || 0;
  const totalPrograms = programs?.length || 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From awards programs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPaidOut.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Completed payouts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Held Funds</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalHeld.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Pending payout</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Programs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPrograms}</div>
            <p className="text-xs text-muted-foreground">Awards programs</p>
          </CardContent>
        </Card>
      </div>

      {/* Programs Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Program</CardTitle>
          <CardDescription>Earnings breakdown across your awards programs</CardDescription>
        </CardHeader>
        <CardContent>
          {programs && programs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Sponsors</TableHead>
                  <TableHead className="text-right">Nominees</TableHead>
                  <TableHead className="text-right">Collected</TableHead>
                  <TableHead className="text-right">Paid Out</TableHead>
                  <TableHead className="text-right">Held</TableHead>
                  <TableHead>Ceremony</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs.map((program) => (
                  <TableRow key={program.id}>
                    <TableCell className="font-medium">{program.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{program.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{program.sponsorCount}</TableCell>
                    <TableCell className="text-right">{program.nomineeCount}</TableCell>
                    <TableCell className="text-right font-medium">
                      ${program.totalCollected.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      ${program.totalPaidOut.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-amber-600">
                      ${program.held.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {program.ceremony_date
                        ? format(new Date(program.ceremony_date), "MMM d, yyyy")
                        : "Not set"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No awards programs created yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

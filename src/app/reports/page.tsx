'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Loader2, Printer } from 'lucide-react';
import { TableSkeleton } from '@/components/skeletons';
import { getAllGoalSheets, getActiveCycle, getQuarterlyUpdates } from '@/lib/actions';

const UOM_LABELS: Record<string, string> = {
  min_numeric: 'Numeric (Higher is Better)', max_numeric: 'Numeric (Lower is Better)',
  min_percent: 'Percentage (Higher is Better)', max_percent: 'Percentage (Lower is Better)',
  timeline: 'Timeline (Date-based)', zero: 'Zero-based (Zero = Success)',
};

export default function ReportsPage() {
  const [sheets, setSheets] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, Record<string, any>>>({});
  const [cycleName, setCycleName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const cycle = await getActiveCycle();
      setCycleName(cycle.name);
      const s = await getAllGoalSheets(cycle.id);
      const approved = s.filter(sheet => sheet.status === 'approved');
      setSheets(approved);

      const scoreMap: Record<string, Record<string, any>> = {};
      for (const sheet of approved) {
        const updates = await getQuarterlyUpdates(sheet.id, 'Q1');
        scoreMap[sheet.id] = {};
        updates.forEach(u => { scoreMap[sheet.id][u.goalId] = u; });
      }
      setScores(scoreMap);
      setLoading(false);
    })();
  }, []);

  const exportCSV = () => {
    const rows = [['Employee', 'Department', 'Goal', 'Thrust Area', 'UoM', 'Target', 'Weightage', 'Q1 Actual', 'Q1 Score', 'Status']];
    sheets.forEach(sheet => {
      sheet.goals.forEach((goal: any) => {
        const ach = scores[sheet.id]?.[goal.id];
        rows.push([
          sheet.employee.name, sheet.employee.department.name, goal.title, goal.thrustArea,
          UOM_LABELS[goal.uomType], 
          goal.uomType === 'timeline' ? (goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : '—') : String(goal.target), 
          `${goal.weightage}%`,
          String(ach?.actualValue ?? ''), `${ach?.computedScore ? Math.round(ach.computedScore) : 0}%`,
          ach?.status?.replace('_', ' ') || 'N/A',
        ]);
      });
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `achievement_report_${cycleName}.csv`; a.click();
  };

  if (loading) return <AppShell><TableSkeleton /></AppShell>;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between print:hidden">
          <div>
            <h1 className="text-xl font-semibold">Achievement Report</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{cycleName} • {sheets.length} employees</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" /> Print PDF</Button>
            <Button onClick={exportCSV}><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
          </div>
        </div>
        
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold">Achievement Report</h1>
          <p className="text-sm text-gray-600">{cycleName} • {sheets.length} employees included</p>
        </div>

        <Card className="print:shadow-none print:border-none">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Goal</TableHead>
                  <TableHead>UoM</TableHead>
                  <TableHead className="text-right">Target</TableHead>
                  <TableHead className="text-right">Weight</TableHead>
                  <TableHead className="text-right">Q1 Actual</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sheets.flatMap(sheet => {
                  return sheet.goals.map((goal: any, i: number) => {
                    const ach = scores[sheet.id]?.[goal.id];
                    return (
                      <TableRow key={goal.id}>
                        {i === 0 ? (
                          <TableCell rowSpan={sheet.goals.length} className="font-medium align-top border-r">
                            <p>{sheet.employee.name}</p>
                            <p className="text-[10px] text-muted-foreground">{sheet.employee.department.name}</p>
                          </TableCell>
                        ) : null}
                        <TableCell className="text-sm">{goal.title}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{goal.uomType.replace('_', ' ')}</TableCell>
                        <TableCell className="text-right">{goal.uomType === 'timeline' ? (goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : '—') : goal.target}</TableCell>
                        <TableCell className="text-right">{goal.weightage}%</TableCell>
                        <TableCell className="text-right">{ach?.actualValue ?? '—'}</TableCell>
                        <TableCell className="text-right font-medium">{ach?.computedScore ? Math.round(ach.computedScore) : 0}%</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">{ach?.status?.replace('_', ' ') || 'N/A'}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  });
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

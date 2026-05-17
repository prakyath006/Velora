'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/app-shell';
import { useAuth } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Lock, Unlock, Loader2 } from 'lucide-react';
import { getAllGoalSheets, getActiveCycle, unlockGoalSheet } from '@/lib/actions';

export default function AdminGoalsPage() {
  const { currentUser } = useAuth();
  const [sheets, setSheets] = useState<any[]>([]);
  const [cycleName, setCycleName] = useState('');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const loadData = async () => {
    const cycle = await getActiveCycle();
    setCycleName(cycle.name);
    const data = await getAllGoalSheets(cycle.id);
    setSheets(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleUnlock = async (sheetId: string) => {
    setActing(true);
    await unlockGoalSheet(sheetId, currentUser!.id);
    await loadData();
    setActing(false);
  };

  if (loading) return <AppShell><div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div></AppShell>;

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600', submitted: 'bg-blue-100 text-blue-700',
    approved: 'bg-emerald-100 text-emerald-700', returned: 'bg-amber-100 text-amber-700',
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold">All Goal Sheets</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{sheets.length} sheets • {cycleName}</p>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead className="text-center">Goals</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sheets.map(sheet => {
                  return (
                    <TableRow key={sheet.id}>
                      <TableCell className="font-medium">{sheet.employee.name}</TableCell>
                      <TableCell className="text-sm">{sheet.employee.department.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{sheet.employee.manager?.name || '—'}</TableCell>
                      <TableCell className="text-center">{sheet.goals.length}</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${statusColors[sheet.status]}`}>
                          {sheet.status === 'approved' && <Lock className="w-3 h-3 mr-1" />}
                          {sheet.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {sheet.submittedAt ? new Date(sheet.submittedAt).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        {sheet.status === 'approved' && (
                          <Button variant="ghost" size="sm" className="text-xs" onClick={() => handleUnlock(sheet.id)} disabled={acting}>
                            <Unlock className="w-3 h-3 mr-1" /> Unlock
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

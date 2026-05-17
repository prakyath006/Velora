'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { getAuditLogs } from '@/lib/actions';

const ACTION_COLORS: Record<string, string> = {
  goal_sheet_submitted: 'bg-blue-100 text-blue-700',
  goal_sheet_approved: 'bg-emerald-100 text-emerald-700',
  goal_sheet_returned: 'bg-amber-100 text-amber-700',
  goal_sheet_unlocked: 'bg-purple-100 text-purple-700',
  goal_created: 'bg-gray-100 text-gray-700',
  goal_updated: 'bg-gray-100 text-gray-700',
  achievement_updated: 'bg-blue-100 text-blue-700',
  checkin_comment_added: 'bg-emerald-100 text-emerald-700',
  shared_goal_pushed: 'bg-purple-100 text-purple-700',
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await getAuditLogs(100);
      setLogs(data);
      setLoading(false);
    })();
  }, []);

  if (loading) return <AppShell><div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div></AppShell>;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Audit Log</h1>
          <p className="text-sm text-muted-foreground mt-0.5">All system changes tracked with full traceability</p>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Entity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{log.user?.name || log.userId}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[10px] ${ACTION_COLORS[log.action] || ''}`}>
                        {log.action.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate">{log.details}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{log.entityType}</TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No audit logs yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

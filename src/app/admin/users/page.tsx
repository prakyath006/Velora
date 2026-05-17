'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { getAllUsers } from '@/lib/actions';

const ROLE_COLORS: Record<string, string> = {
  employee: 'bg-blue-100 text-blue-700',
  manager: 'bg-purple-100 text-purple-700',
  admin: 'bg-amber-100 text-amber-700',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await getAllUsers();
      
      // Need to map managerId to managerName manually since we didn't include manager in query
      // For a real app we'd do a recursive include or join
      const managerMap = data.reduce((acc, u) => {
        acc[u.id] = u.name;
        return acc;
      }, {} as Record<string, string>);
      
      const enriched = data.map(u => ({
        ...u,
        managerName: u.managerId ? managerMap[u.managerId] : null
      }));
      
      setUsers(enriched);
      setLoading(false);
    })();
  }, []);

  if (loading) return <AppShell><div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div></AppShell>;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold">User Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{users.length} users in organization</p>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Reports To</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => {
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary">
                            {user.name.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          {user.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                      <TableCell><Badge className={`text-[10px] ${ROLE_COLORS[user.role]}`}>{user.role}</Badge></TableCell>
                      <TableCell className="text-sm">{user.department.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.designation}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.managerName || '—'}</TableCell>
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

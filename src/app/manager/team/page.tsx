'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/app-shell';
import { useAuth } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { getTeamMembers, getTeamGoalSheets, getActiveCycle, getQuarterlyUpdates } from '@/lib/actions';

export default function ManagerTeamPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const [team, setTeam] = useState<any[]>([]);
  const [sheets, setSheets] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, Record<string, number>>>({});
  const [cycleName, setCycleName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      const cycle = await getActiveCycle();
      setCycleName(cycle.name);
      const [t, s] = await Promise.all([getTeamMembers(currentUser.id), getTeamGoalSheets(currentUser.id, cycle.id)]);
      setTeam(t); setSheets(s);
      const scoreMap: Record<string, Record<string, number>> = {};
      for (const sheet of s) {
        const updates = await getQuarterlyUpdates(sheet.id, 'Q1');
        scoreMap[sheet.id] = {};
        updates.forEach(u => { scoreMap[sheet.id][u.goalId] = u.computedScore || 0; });
      }
      setScores(scoreMap);
      setLoading(false);
    })();
  }, [currentUser]);

  if (authLoading || loading) return <AppShell><div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div></AppShell>;

  const statusColors: Record<string, string> = { draft: 'bg-gray-100 text-gray-600', submitted: 'bg-blue-100 text-blue-700', approved: 'bg-emerald-100 text-emerald-700', returned: 'bg-amber-100 text-amber-700' };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div><h1 className="text-xl font-semibold">Team Goals</h1><p className="text-sm text-muted-foreground mt-0.5">{team.length} team members • {cycleName}</p></div>
        {team.map(member => {
          const sheet = sheets.find((gs: any) => gs.employeeId === member.id);
          const sheetScores = sheet ? (scores[sheet.id] || {}) : {};
          return (
            <Card key={member.id}>
              <CardContent className="py-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">{member.name.split(' ').map((n: string) => n[0]).join('')}</div>
                  <div className="flex-1"><p className="text-sm font-medium">{member.name}</p><p className="text-xs text-muted-foreground">{member.designation}</p></div>
                  {sheet && <Badge className={`text-[10px] ${statusColors[sheet.status]}`}>{sheet.status}</Badge>}
                </div>
                {sheet && sheet.goals.length > 0 ? (
                  <div className="space-y-2">
                    {sheet.goals.map((goal: any) => (
                      <div key={goal.id} className="flex items-center gap-3 text-xs">
                        <span className="flex-1 truncate">{goal.title}</span>
                        <span className="text-muted-foreground w-12 text-right">{goal.weightage}%</span>
                        <div className="w-20"><Progress value={sheetScores[goal.id] || 0} className="h-1.5" /></div>
                        <span className="w-8 text-right font-medium">{Math.round(sheetScores[goal.id] || 0)}%</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-muted-foreground">No goals created yet.</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}

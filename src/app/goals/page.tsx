'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/app-shell';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GoalListSkeleton } from '@/components/skeletons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, Lock, Edit, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getGoalSheetByEmployee, getActiveCycle, getQuarterlyUpdates } from '@/lib/actions';

const UOM_LABELS: Record<string, string> = {
  min_numeric: 'Numeric (Higher is Better)', max_numeric: 'Numeric (Lower is Better)',
  min_percent: 'Percentage (Higher is Better)', max_percent: 'Percentage (Lower is Better)',
  timeline: 'Timeline (Date-based)', zero: 'Zero-based (Zero = Success)',
};

const STATUS_STYLES: Record<string, { badge: string; label: string }> = {
  not_started: { badge: 'bg-gray-100 text-gray-600', label: 'Not Started' },
  on_track: { badge: 'bg-emerald-50 text-emerald-700', label: 'On Track' },
  completed: { badge: 'bg-blue-50 text-blue-700', label: 'Completed' },
};
const SHEET_STATUS_STYLES: Record<string, { badge: string; label: string }> = {
  draft: { badge: 'bg-gray-100 text-gray-600', label: 'Draft' },
  submitted: { badge: 'bg-blue-100 text-blue-700', label: 'Submitted' },
  approved: { badge: 'bg-emerald-100 text-emerald-700', label: 'Approved' },
  returned: { badge: 'bg-amber-100 text-amber-700', label: 'Returned' },
};

export default function GoalsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const [goalSheet, setGoalSheet] = useState<any>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [cycleName, setCycleName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      const cycle = await getActiveCycle();
      setCycleName(cycle.name);
      const gs = await getGoalSheetByEmployee(currentUser.id, cycle.id);
      setGoalSheet(gs);
      if (gs) {
        const u = await getQuarterlyUpdates(gs.id, 'Q1');
        setUpdates(u);
      }
      setLoading(false);
    })();
  }, [currentUser]);

  if (authLoading || loading) return <AppShell><GoalListSkeleton /></AppShell>;

  if (!goalSheet) {
    return (
      <AppShell>
        <div className="text-center py-16">
          <Target className="w-12 h-12 text-muted-foreground/40 mx-auto" />
          <h2 className="text-lg font-semibold mt-4">No Goal Sheet</h2>
          <p className="text-sm text-muted-foreground mt-1">Create your goal sheet for {cycleName}</p>
          <Link href="/goals/create"><Button className="mt-4"><Plus className="w-4 h-4 mr-2" /> Create Goal Sheet</Button></Link>
        </div>
      </AppShell>
    );
  }

  const isLocked = goalSheet.status === 'approved';
  const totalWeightage = goalSheet.goals.reduce((s: number, g: any) => s + g.weightage, 0);

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">My Goals</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{cycleName} • {goalSheet.goals.length} goals</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={SHEET_STATUS_STYLES[goalSheet.status].badge}>
              {isLocked && <Lock className="w-3 h-3 mr-1" />}
              {SHEET_STATUS_STYLES[goalSheet.status].label}
            </Badge>
            {(goalSheet.status === 'draft' || goalSheet.status === 'returned') && (
              <Link href="/goals/create"><Button size="sm" variant="outline"><Edit className="w-3 h-3 mr-1" /> Edit</Button></Link>
            )}
          </div>
        </div>

        {goalSheet.returnComment && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="py-3">
              <p className="text-sm font-medium text-amber-800">Manager Feedback</p>
              <p className="text-sm text-amber-700 mt-1">{goalSheet.returnComment}</p>
            </CardContent>
          </Card>
        )}

        <Card><CardContent className="py-3"><div className="flex items-center justify-between"><span className="text-sm font-medium">Total Weightage</span><Badge variant={totalWeightage === 100 ? 'default' : 'destructive'}>{totalWeightage}%</Badge></div></CardContent></Card>

        {goalSheet.goals.map((goal: any) => {
          const ach = updates.find((u: any) => u.goalId === goal.id);
          const score = ach?.computedScore || 0;
          return (
            <Card key={goal.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px]">{goal.thrustArea}</Badge>
                      <Badge className={`text-[10px] ${STATUS_STYLES[goal.status].badge}`}>{STATUS_STYLES[goal.status].label}</Badge>
                      {goal.isShared && <Badge variant="secondary" className="text-[10px]">Shared</Badge>}
                    </div>
                    <CardTitle className="text-sm">{goal.title}</CardTitle>
                    {goal.description && <p className="text-xs text-muted-foreground mt-1">{goal.description}</p>}
                  </div>
                  <div className="text-right shrink-0 ml-4"><p className="text-lg font-bold">{goal.weightage}%</p><p className="text-[10px] text-muted-foreground">weightage</p></div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div><p className="text-muted-foreground">Measurement</p><p className="font-medium mt-0.5">{UOM_LABELS[goal.uomType]}</p></div>
                  <div><p className="text-muted-foreground">Target</p><p className="font-medium mt-0.5">
                    {goal.uomType === 'timeline' ? (goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : '—') : goal.uomType === 'zero' ? '0' : goal.target}
                    {goal.uomType.includes('percent') ? '%' : ''}
                  </p></div>
                  <div><p className="text-muted-foreground">Progress</p><div className="mt-0.5"><Progress value={score} className="h-1.5" /><p className="text-[10px] mt-0.5">{Math.round(score)}%</p></div></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}

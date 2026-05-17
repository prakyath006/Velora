'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/app-shell';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getGoalSheetByEmployee, getActiveCycle, getQuarterlyUpdates, saveQuarterlyUpdate, addAuditLog } from '@/lib/actions';

const UOM_LABELS: Record<string, string> = {
  min_numeric: 'Numeric (Higher is Better)', max_numeric: 'Numeric (Lower is Better)',
  min_percent: 'Percentage (Higher is Better)', max_percent: 'Percentage (Lower is Better)',
  timeline: 'Timeline (Date-based)', zero: 'Zero-based (Zero = Success)',
};
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'on_track', label: 'On Track' },
  { value: 'completed', label: 'Completed' },
];

export default function CheckinsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const [goalSheet, setGoalSheet] = useState<any>(null);
  const [quarter, setQuarter] = useState('Q1');
  const [updates, setUpdates] = useState<Record<string, any>>({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      const cycle = await getActiveCycle();
      const gs = await getGoalSheetByEmployee(currentUser.id, cycle.id);
      setGoalSheet(gs);
      setLoading(false);
    })();
  }, [currentUser]);

  useEffect(() => {
    if (!goalSheet) return;
    (async () => {
      const qUpdates = await getQuarterlyUpdates(goalSheet.id, quarter);
      const map: Record<string, any> = {};
      qUpdates.forEach(u => { map[u.goalId] = u; });
      setUpdates(map);
    })();
  }, [goalSheet, quarter]);

  const updateLocal = (goalId: string, field: string, value: any) => {
    setUpdates(prev => ({
      ...prev,
      [goalId]: { ...(prev[goalId] || { status: 'not_started' }), [field]: value },
    }));
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const goal of goalSheet.goals) {
        const u = updates[goal.id];
        if (u) {
          await saveQuarterlyUpdate(goal.id, quarter, currentUser!.id, {
            actualValue: u.actualValue ?? null,
            completionDate: u.completionDate ? (typeof u.completionDate === 'string' ? u.completionDate : new Date(u.completionDate).toISOString().split('T')[0]) : undefined,
            status: u.status || 'not_started',
          });
        }
      }
      await addAuditLog(currentUser!.id, 'achievement', goalSheet.id, 'achievement_updated', `${quarter} achievements updated`);
      toast.success(`${quarter} check-in saved successfully!`);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      // Reload
      const qUpdates = await getQuarterlyUpdates(goalSheet.id, quarter);
      const map: Record<string, any> = {};
      qUpdates.forEach((u: any) => { map[u.goalId] = u; });
      setUpdates(map);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save check-in');
    }
    setSaving(false);
  };

  if (authLoading || loading) return <AppShell><div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div></AppShell>;

  if (!goalSheet || goalSheet.status !== 'approved') {
    return (
      <AppShell>
        <div className="text-center py-16">
          <CheckCircle2 className="w-12 h-12 text-muted-foreground/40 mx-auto" />
          <h3 className="text-base font-medium mt-4">No Approved Goals</h3>
          <p className="text-sm text-muted-foreground mt-1">Your goal sheet must be approved before you can log check-ins.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-xl font-semibold">Quarterly Check-in</h1><p className="text-sm text-muted-foreground mt-0.5">Log your actual achievements against planned targets</p></div>
          <Button onClick={saveAll} disabled={saving || saved}>
            {saved ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Saved!</> : saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save Progress</>}
          </Button>
        </div>

        <Tabs value={quarter} onValueChange={v => setQuarter(v as string)}>
          <TabsList>{QUARTERS.map(q => <TabsTrigger key={q} value={q}>{q} Check-in</TabsTrigger>)}</TabsList>
          {QUARTERS.map(q => (
            <TabsContent key={q} value={q} className="space-y-4 mt-4">
              {goalSheet.goals.map((goal: any) => {
                const u = updates[goal.id] || {};
                return (
                  <Card key={goal.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1"><Badge variant="outline" className="text-[10px]">{goal.thrustArea}</Badge><span className="text-xs text-muted-foreground">{goal.weightage}% weight</span></div>
                          <CardTitle className="text-sm">{goal.title}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">{UOM_LABELS[goal.uomType]}</p>
                        </div>
                        {u.computedScore != null && <div className="text-right"><p className="text-lg font-bold">{Math.round(u.computedScore)}%</p><p className="text-[10px] text-muted-foreground">score</p></div>}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1.5"><Label className="text-xs">Planned Target</Label><Input disabled value={goal.uomType === 'timeline' ? (goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : '') : goal.uomType === 'zero' ? '0' : `${goal.target}${goal.uomType.includes('percent') ? '%' : ''}`} /></div>
                        <div className="space-y-1.5"><Label className="text-xs">Actual</Label>
                          {goal.uomType === 'timeline' ? (
                            <Input type="date" value={u.completionDate ? (typeof u.completionDate === 'string' ? u.completionDate.split('T')[0] : new Date(u.completionDate).toISOString().split('T')[0]) : ''} onChange={e => updateLocal(goal.id, 'completionDate', e.target.value)} />
                          ) : (
                            <Input type="number" placeholder="Enter actual" value={u.actualValue ?? ''} onChange={e => updateLocal(goal.id, 'actualValue', parseFloat(e.target.value) || 0)} />
                          )}
                        </div>
                        <div className="space-y-1.5"><Label className="text-xs">Status</Label>
                          <Select value={u.status || 'not_started'} onValueChange={v => updateLocal(goal.id, 'status', v as string)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AppShell>
  );
}

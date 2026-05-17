'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/app-shell';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GoalListSkeleton } from '@/components/skeletons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Plus, Trash2, AlertCircle, CheckCircle2, Send, Save, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuid } from 'uuid';
import { getGoalSheetByEmployee, getActiveCycle, saveGoalSheet, addAuditLog, addNotification } from '@/lib/actions';
import { analyzeGoalSMART } from '@/lib/ai-actions';

const THRUST_AREAS = ['Revenue Growth', 'Customer Satisfaction', 'Operational Excellence', 'Innovation & Technology', 'People & Culture', 'Safety & Compliance', 'Cost Optimization', 'Quality Improvement'];
const UOM_LABELS: Record<string, string> = {
  min_numeric: 'Numeric (Higher is Better)', max_numeric: 'Numeric (Lower is Better)',
  min_percent: 'Percentage (Higher is Better)', max_percent: 'Percentage (Lower is Better)',
  timeline: 'Timeline (Date-based)', zero: 'Zero-based (Zero = Success)',
};

interface GoalForm { tempId: string; thrustArea: string; title: string; description: string; uomType: string; target: number; targetDate: string; weightage: number; isShared: boolean; }

const emptyGoal = (): GoalForm => ({
  tempId: uuid(), thrustArea: 'Revenue Growth', title: '', description: '', uomType: 'min_numeric', target: 0, targetDate: '', weightage: 10, isShared: false,
});

export default function GoalCreatePage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [goals, setGoals] = useState<GoalForm[]>([emptyGoal()]);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [cycleId, setCycleId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      const cycle = await getActiveCycle();
      setCycleId(cycle.id);
      const existing = await getGoalSheetByEmployee(currentUser.id, cycle.id);
      if (existing) {
        if (existing.status === 'approved' || existing.status === 'submitted') {
          setIsLocked(true);
        } else {
          setGoals(existing.goals.map(g => ({
            tempId: g.id, thrustArea: g.thrustArea, title: g.title, description: g.description,
            uomType: g.uomType, target: g.target, targetDate: g.targetDate ? new Date(g.targetDate).toISOString().split('T')[0] : '',
            weightage: g.weightage, isShared: g.isShared,
          })));
        }
      }
      setLoading(false);
    })();
  }, [currentUser]);

  const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
  const canAddMore = goals.length < 8;

  const addGoal = () => { if (canAddMore) setGoals([...goals, emptyGoal()]); };
  const removeGoal = (id: string) => { if (goals.length > 1) setGoals(goals.filter(g => g.tempId !== id)); };
  const updateGoal = (id: string, field: string, value: string | number) => {
    setGoals(goals.map(g => g.tempId === id ? { ...g, [field]: value } : g));
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    if (goals.length === 0) errs.push('At least one goal is required');
    if (goals.length > 8) errs.push('Maximum 8 goals allowed');
    if (totalWeightage !== 100) errs.push(`Total weightage must equal 100% (currently ${totalWeightage}%)`);
    goals.forEach((g, i) => {
      if (!g.title.trim()) errs.push(`Goal ${i + 1}: Title is required`);
      if (g.weightage < 10) errs.push(`Goal ${i + 1}: Minimum weightage is 10%`);
      if (g.uomType !== 'zero' && g.uomType !== 'timeline' && g.target <= 0) errs.push(`Goal ${i + 1}: Target must be greater than 0`);
      if (g.uomType === 'timeline' && !g.targetDate) errs.push(`Goal ${i + 1}: Target date is required`);
    });
    return errs;
  };

  const handleAnalyzeSMART = async (goal: GoalForm) => {
    if (!goal.title.trim()) {
      toast.error('Please enter a goal title first');
      return;
    }
    setAnalyzingId(goal.tempId);
    try {
      const result = await analyzeGoalSMART(goal.title, goal.thrustArea);
      if (result.isSmart) {
        toast.success(`SMART Score: ${result.score}/100. ${result.feedback}`, { duration: 6000 });
      } else {
        toast.warning(`SMART Score: ${result.score}/100. ${result.feedback}`, { duration: 8000 });
      }
    } catch (e) {
      toast.error('AI analysis failed');
    }
    setAnalyzingId(null);
  };

  const save = async (status: 'draft' | 'submitted') => {
    if (status === 'submitted') {
      const e = validate();
      if (e.length > 0) { setErrors(e); return; }
    }
    setSaving(true);
    try {
      await saveGoalSheet(currentUser!.id, cycleId, goals.map(g => ({
        thrustArea: g.thrustArea, title: g.title, description: g.description,
        uomType: g.uomType as any, target: g.target, targetDate: g.targetDate || undefined, weightage: g.weightage,
      })), status);
      if (status === 'submitted') {
        await addAuditLog(currentUser!.id, 'goal_sheet', '', 'goal_sheet_submitted', `Goal sheet submitted with ${goals.length} goals`);
        if (currentUser!.managerId) {
          await addNotification(currentUser!.managerId, 'Goal Sheet Submitted', `${currentUser!.name} submitted a goal sheet for your approval.`, 'action', '/manager/approvals');
        }
        toast.success('Goal sheet submitted for approval!');
      } else {
        toast.success('Goal sheet saved as draft');
      }
      router.push('/goals');
    } catch (e: any) { 
      console.error(e); 
      toast.error(e.message || 'Failed to save goal sheet');
    }
    setSaving(false);
    setShowSubmitDialog(false);
  };

  if (authLoading || loading) return <AppShell><GoalListSkeleton /></AppShell>;

  if (isLocked) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto text-center py-16">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h2 className="text-lg font-semibold mt-4">Goal Sheet is Locked</h2>
          <p className="text-sm text-muted-foreground mt-1">Your goal sheet has been submitted/approved. Contact Admin to unlock.</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/goals')}>View Goals</Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Create Goal Sheet</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Max 8 goals • Total weightage must equal 100%</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => save('draft')} disabled={saving}><Save className="w-4 h-4 mr-2" /> Save Draft</Button>
            <Button onClick={() => { const e = validate(); if (e.length > 0) setErrors(e); else setShowSubmitDialog(true); }} disabled={saving}>
              <Send className="w-4 h-4 mr-2" /> Submit
            </Button>
          </div>
        </div>

        <Card><CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Total Weightage</span>
              <Badge variant={totalWeightage === 100 ? 'default' : 'destructive'} className="text-xs">{totalWeightage}% / 100%</Badge>
            </div>
            <span className="text-xs text-muted-foreground">{goals.length} of 8 goals</span>
          </div>
          <Progress value={Math.min(totalWeightage, 100)} className="h-2.5" />
        </CardContent></Card>

        {errors.length > 0 && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="py-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-destructive">Please fix the following:</p>
                  <ul className="text-xs text-destructive/80 mt-1 space-y-0.5">{errors.map((err, i) => <li key={i}>• {err}</li>)}</ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {goals.map((goal, index) => (
          <Card key={goal.tempId}>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Goal {index + 1}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-8 text-xs text-purple-600 border-purple-200 hover:bg-purple-50 hover:text-purple-700" onClick={() => handleAnalyzeSMART(goal)} disabled={analyzingId === goal.tempId}>
                    {analyzingId === goal.tempId ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />} AI Assist
                  </Button>
                  {goals.length > 1 && <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeGoal(goal.tempId)}><Trash2 className="w-4 h-4" /></Button>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Thrust Area</Label>
                  <Select value={goal.thrustArea} onValueChange={v => updateGoal(goal.tempId, 'thrustArea', v as string)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{THRUST_AREAS.map(ta => <SelectItem key={ta} value={ta}>{ta}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Unit of Measurement</Label>
                  <Select value={goal.uomType} onValueChange={v => updateGoal(goal.tempId, 'uomType', v as string)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(UOM_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label className="text-xs">Goal Title</Label><Input placeholder="e.g., Achieve 95% customer satisfaction" value={goal.title} onChange={e => updateGoal(goal.tempId, 'title', e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-xs">Description</Label><Textarea placeholder="Describe the goal..." rows={2} value={goal.description} onChange={e => updateGoal(goal.tempId, 'description', e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4">
                {goal.uomType === 'timeline' ? (
                  <div className="space-y-2"><Label className="text-xs">Target Date</Label><Input type="date" value={goal.targetDate} onChange={e => updateGoal(goal.tempId, 'targetDate', e.target.value)} /></div>
                ) : goal.uomType === 'zero' ? (
                  <div className="space-y-2"><Label className="text-xs">Target</Label><Input value="0 (Zero = Success)" disabled /></div>
                ) : (
                  <div className="space-y-2"><Label className="text-xs">Target {goal.uomType.includes('percent') ? '(%)' : '(Numeric)'}</Label><Input type="number" min="0" value={goal.target || ''} onChange={e => updateGoal(goal.tempId, 'target', parseFloat(e.target.value) || 0)} /></div>
                )}
                <div className="space-y-2">
                  <Label className="text-xs">Weightage (%)</Label>
                  <Input type="number" min="10" max="100" step="5" value={goal.weightage} onChange={e => updateGoal(goal.tempId, 'weightage', parseFloat(e.target.value) || 0)} />
                  {goal.weightage < 10 && <p className="text-[10px] text-destructive">Minimum 10%</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {canAddMore && <Button variant="outline" className="w-full border-dashed" onClick={addGoal}><Plus className="w-4 h-4 mr-2" /> Add Goal ({goals.length}/8)</Button>}
      </div>

      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit Goal Sheet?</DialogTitle><DialogDescription>This will send your goal sheet to your manager for approval.</DialogDescription></DialogHeader>
          <div className="py-3 space-y-2">
            <p className="text-sm"><strong>{goals.length}</strong> goals • <strong>{totalWeightage}%</strong> total weightage</p>
            {goals.map((g, i) => <div key={i} className="text-xs text-muted-foreground flex justify-between"><span>{g.title || `Goal ${i + 1}`}</span><span>{g.weightage}%</span></div>)}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>Cancel</Button>
            <Button onClick={() => save('submitted')} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Submit'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

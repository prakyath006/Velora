'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/app-shell';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ApprovalsSkeleton } from '@/components/skeletons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Check, X, Edit3, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getPendingApprovals, getActiveCycle, approveGoalSheet, returnGoalSheet, editGoalDuringApproval, addNotification } from '@/lib/actions';

const UOM_LABELS: Record<string, string> = {
  min_numeric: 'Numeric (Higher is Better)', max_numeric: 'Numeric (Lower is Better)',
  min_percent: 'Percentage (Higher is Better)', max_percent: 'Percentage (Lower is Better)',
  timeline: 'Timeline (Date-based)', zero: 'Zero-based (Zero = Success)',
};

export default function ApprovalsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const [pendingSheets, setPendingSheets] = useState<any[]>([]);
  const [expandedSheet, setExpandedSheet] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<{ sheetId: string; goalId: string } | null>(null);
  const [editTarget, setEditTarget] = useState<number>(0);
  const [editWeightage, setEditWeightage] = useState<number>(0);
  const [returnDialog, setReturnDialog] = useState<string | null>(null);
  const [returnComment, setReturnComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const loadData = async () => {
    if (!currentUser) return;
    const cycle = await getActiveCycle();
    const sheets = await getPendingApprovals(currentUser.id, cycle.id);
    setPendingSheets(sheets);
    if (sheets.length > 0 && !expandedSheet) setExpandedSheet(sheets[0].id);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [currentUser]);

  const handleApprove = async (sheetId: string) => {
    setActing(true);
    try {
      const sheet = pendingSheets.find(s => s.id === sheetId);
      await approveGoalSheet(sheetId, currentUser!.id);
      if (sheet) await addNotification(sheet.employeeId, 'Goals Approved', `Your goal sheet has been approved by ${currentUser!.name}.`, 'success');
      toast.success('Goal sheet approved successfully');
      await loadData();
    } catch (e: any) { toast.error(e.message || 'Failed to approve'); }
    setActing(false);
  };

  const handleReturn = async (sheetId: string) => {
    setActing(true);
    try {
      const sheet = pendingSheets.find(s => s.id === sheetId);
      await returnGoalSheet(sheetId, currentUser!.id, returnComment);
      if (sheet) await addNotification(sheet.employeeId, 'Goals Returned', `Your goal sheet was returned by ${currentUser!.name} for rework.`, 'warning');
      toast.success('Goal sheet returned for rework');
      setReturnDialog(null); setReturnComment('');
      await loadData();
    } catch (e: any) { toast.error(e.message || 'Failed to return'); }
    setActing(false);
  };

  const handleEditSave = async () => {
    if (!editingGoal) return;
    setActing(true);
    try {
      await editGoalDuringApproval(editingGoal.goalId, currentUser!.id, { target: editTarget, weightage: editWeightage });
      toast.success('Goal updated successfully');
      setEditingGoal(null);
      await loadData();
    } catch (e: any) { toast.error(e.message || 'Failed to update goal'); }
    setActing(false);
  };

  if (authLoading || loading) return <AppShell><ApprovalsSkeleton /></AppShell>;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div><h1 className="text-xl font-semibold">Pending Approvals</h1><p className="text-sm text-muted-foreground mt-0.5">{pendingSheets.length} goal sheet(s) awaiting review</p></div>

        {pendingSheets.length === 0 && (
          <Card><CardContent className="py-12 text-center"><Check className="w-12 h-12 text-emerald-400 mx-auto" /><h3 className="text-base font-medium mt-4">All Caught Up</h3><p className="text-sm text-muted-foreground mt-1">No pending goal sheets to review.</p></CardContent></Card>
        )}

        {pendingSheets.map(sheet => {
          const isExpanded = expandedSheet === sheet.id;
          const totalW = sheet.goals.reduce((s: number, g: any) => s + g.weightage, 0);
          return (
            <Card key={sheet.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedSheet(isExpanded ? null : sheet.id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                      {sheet.employee.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div><CardTitle className="text-sm">{sheet.employee.name}</CardTitle><p className="text-xs text-muted-foreground">{sheet.employee.designation} • {sheet.goals.length} goals • {totalW}%</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={totalW === 100 ? 'default' : 'destructive'} className="text-xs">{totalW}%</Badge>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </CardHeader>
              {isExpanded && (
                <CardContent className="pt-0 space-y-4">
                  {sheet.goals.map((goal: any) => (
                    <div key={goal.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1"><Badge variant="outline" className="text-[10px]">{goal.thrustArea}</Badge><span className="text-xs text-muted-foreground">{UOM_LABELS[goal.uomType]}</span></div>
                          <p className="text-sm font-medium">{goal.title}</p>
                          {goal.description && <p className="text-xs text-muted-foreground mt-1">{goal.description}</p>}
                          <div className="flex gap-4 mt-2 text-xs">
                            <span>Target: <strong>{goal.uomType === 'timeline' ? (goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : '—') : goal.target}</strong></span>
                            <span>Weightage: <strong>{goal.weightage}%</strong></span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingGoal({ sheetId: sheet.id, goalId: goal.id }); setEditTarget(goal.target); setEditWeightage(goal.weightage); }}>
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => setReturnDialog(sheet.id)} disabled={acting}><X className="w-4 h-4 mr-1" /> Return</Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(sheet.id)} disabled={acting}><Check className="w-4 h-4 mr-1" /> Approve</Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <Dialog open={!!editingGoal} onOpenChange={() => setEditingGoal(null)}>
        <DialogContent><DialogHeader><DialogTitle>Edit Goal</DialogTitle><DialogDescription>Adjust target and weightage.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Target</Label><Input type="number" value={editTarget} onChange={e => setEditTarget(parseFloat(e.target.value) || 0)} /></div>
            <div className="space-y-2"><Label>Weightage (%)</Label><Input type="number" min={10} max={100} value={editWeightage} onChange={e => setEditWeightage(parseFloat(e.target.value) || 0)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditingGoal(null)}>Cancel</Button><Button onClick={handleEditSave} disabled={acting}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!returnDialog} onOpenChange={() => setReturnDialog(null)}>
        <DialogContent><DialogHeader><DialogTitle>Return for Rework</DialogTitle><DialogDescription>Provide feedback.</DialogDescription></DialogHeader>
          <div className="py-2"><Label>Feedback</Label><Textarea className="mt-2" rows={4} placeholder="Explain what needs to change..." value={returnComment} onChange={e => setReturnComment(e.target.value)} /></div>
          <DialogFooter><Button variant="outline" onClick={() => setReturnDialog(null)}>Cancel</Button><Button variant="destructive" onClick={() => returnDialog && handleReturn(returnDialog)} disabled={acting || !returnComment.trim()}>Return</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

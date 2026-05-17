'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/app-shell';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Save, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getTeamMembers, getActiveCycle, getTeamGoalSheets, getQuarterlyUpdates, getCheckinComments, saveCheckinComment } from '@/lib/actions';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

export default function ManagerCheckinsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const [team, setTeam] = useState<any[]>([]);
  const [sheets, setSheets] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [quarter, setQuarter] = useState('Q1');
  const [updates, setUpdates] = useState<any[]>([]);
  const [comment, setComment] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      const cycle = await getActiveCycle();
      const [t, s] = await Promise.all([getTeamMembers(currentUser.id), getTeamGoalSheets(currentUser.id, cycle.id)]);
      setTeam(t); setSheets(s);
      if (t.length > 0) setSelectedMember(t[0].id);
      setLoading(false);
    })();
  }, [currentUser]);

  useEffect(() => {
    if (!selectedMember) return;
    const sheet = sheets.find(s => s.employeeId === selectedMember && s.status === 'approved');
    if (sheet) {
      (async () => {
        const [u, c] = await Promise.all([getQuarterlyUpdates(sheet.id, quarter), getCheckinComments(sheet.id, quarter)]);
        setUpdates(u);
        const existing = c.find((cc: any) => cc.managerId === currentUser?.id);
        setComment(existing?.comment || '');
      })();
    } else { setUpdates([]); setComment(''); }
  }, [selectedMember, quarter, sheets, currentUser]);

  const handleSave = async () => {
    const sheet = sheets.find(s => s.employeeId === selectedMember);
    if (!sheet || !comment.trim()) return;
    try {
      await saveCheckinComment(sheet.id, currentUser!.id, quarter, comment);
      toast.success('Feedback saved successfully');
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save feedback');
    }
  };

  if (authLoading || loading) return <AppShell><div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div></AppShell>;

  const memberSheet = sheets.find(s => s.employeeId === selectedMember && s.status === 'approved');

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div><h1 className="text-xl font-semibold">Team Check-ins</h1><p className="text-sm text-muted-foreground mt-0.5">Review team progress and provide feedback</p></div>
        <div className="flex gap-4">
          <div className="w-48">
            <Label className="text-xs mb-1.5 block">Team Member</Label>
            <Select value={selectedMember} onValueChange={v => setSelectedMember(v as string)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{team.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">Quarter</Label>
            <Select value={quarter} onValueChange={v => setQuarter(v as string)}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>{QUARTERS.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {!memberSheet ? (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No approved goal sheet for this member.</CardContent></Card>
        ) : (
          <>
            {memberSheet.goals.map((goal: any) => {
              const u = updates.find((a: any) => a.goalId === goal.id);
              return (
                <Card key={goal.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1"><Badge variant="outline" className="text-[10px]">{goal.thrustArea}</Badge><span className="text-xs text-muted-foreground">{goal.weightage}%</span></div>
                        <p className="text-sm font-medium">{goal.title}</p>
                        <div className="grid grid-cols-3 gap-3 mt-2 text-xs">
                          <div><span className="text-muted-foreground">Target:</span> <strong>{goal.uomType === 'timeline' ? (goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : '—') : goal.target}</strong></div>
                          <div><span className="text-muted-foreground">Actual:</span> <strong>{u?.actualValue ?? '—'}</strong></div>
                          <div><span className="text-muted-foreground">Status:</span> <Badge variant="secondary" className="text-[10px]">{u?.status?.replace('_', ' ') || 'No update'}</Badge></div>
                        </div>
                      </div>
                      <div className="w-20 text-right">
                        <p className="text-lg font-bold">{u?.computedScore ? Math.round(u.computedScore) : 0}%</p>
                        <Progress value={u?.computedScore || 0} className="h-1.5 mt-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Check-in Comment</CardTitle></CardHeader>
              <CardContent>
                <Textarea rows={4} placeholder="Document your check-in discussion..." value={comment} onChange={e => setComment(e.target.value)} />
                <div className="flex justify-end mt-3">
                  <Button onClick={handleSave} disabled={saved || !comment.trim()}>
                    {saved ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Saved!</> : <><Save className="w-4 h-4 mr-2" /> Save</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}

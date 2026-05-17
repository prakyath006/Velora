'use client';

import { useState, useEffect, useRef } from 'react';
import AppShell from '@/components/app-shell';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Share2, Plus, Users, Loader2, UploadCloud, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { getEmployeesForAdmin, getActiveCycle, getAllGoalSheets, pushSharedGoal, bulkPushSharedGoals } from '@/lib/actions';
import { ThrustArea, THRUST_AREAS, UoMType, UOM_LABELS } from '@/lib/types';

export default function SharedGoalsPage() {
  const { currentUser } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [sharedGoalsMap, setSharedGoalsMap] = useState<Record<string, any>>({});
  const [cycleId, setCycleId] = useState('');
  const [loading, setLoading] = useState(true);

  // Manual Push State
  const [showDialog, setShowDialog] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thrustArea, setThrustArea] = useState<ThrustArea>('Revenue Growth');
  const [uomType, setUomType] = useState<UoMType>('min_numeric');
  const [target, setTarget] = useState(0);
  const [targetDate, setTargetDate] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [pushing, setPushing] = useState(false);

  // CSV Import State
  const [showCsvDialog, setShowCsvDialog] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    const cycle = await getActiveCycle();
    setCycleId(cycle.id);
    const [emps, sheets] = await Promise.all([getEmployeesForAdmin(), getAllGoalSheets(cycle.id)]);
    setEmployees(emps);
    
    const map: Record<string, any> = {};
    sheets.forEach(sheet => {
      sheet.goals.filter((g: any) => g.isShared).forEach((g: any) => {
        const key = g.sharedFromGoalId || g.title; // fallback
        if (!map[key]) map[key] = { title: g.title, thrustArea: g.thrustArea, recipients: [] };
        map[key].recipients.push(sheet.employee.name);
      });
    });
    setSharedGoalsMap(map);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handlePush = async () => {
    if (!title.trim() || selectedEmployees.length === 0) return;
    setPushing(true);
    try {
      await pushSharedGoal(currentUser!.id, cycleId, {
        thrustArea, title, description, uomType, target, 
        targetDate: uomType === 'timeline' ? targetDate : undefined,
        weightage: 10
      }, selectedEmployees);
      toast.success(`Goal pushed to ${selectedEmployees.length} employees`);
      setShowDialog(false);
      setTitle(''); setDescription(''); setTarget(0); setSelectedEmployees([]);
      await loadData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to push shared goal');
    }
    setPushing(false);
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    setIsUploading(true);

    try {
      const text = await csvFile.text();
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const emailIdx = headers.indexOf('email');
      const titleIdx = headers.indexOf('title');
      const targetIdx = headers.indexOf('target');
      
      if (emailIdx === -1 || titleIdx === -1 || targetIdx === -1) {
        toast.error('CSV must contain "Email", "Title", and "Target" columns');
        setIsUploading(false);
        return;
      }

      // Group rows by goal title
      const goalGroups: Record<string, { goal: any, emails: string[] }> = {};
      
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        const empEmail = cols[emailIdx];
        const gTitle = cols[titleIdx];
        const gTarget = parseFloat(cols[targetIdx]) || 0;
        
        if (!empEmail || !gTitle) continue;
        
        if (!goalGroups[gTitle]) {
          goalGroups[gTitle] = {
            goal: { thrustArea: 'Operational Excellence', title: gTitle, description: 'Imported via CSV', uomType: 'min_numeric', target: gTarget, weightage: 10 },
            emails: []
          };
        }
        goalGroups[gTitle].emails.push(empEmail);
      }

      // Map emails to employee IDs
      const bulkPayload = Object.values(goalGroups).map(group => {
        const empIds = group.emails.map(email => employees.find(e => e.email === email)?.id).filter(id => id) as string[];
        return { goalData: group.goal, recipientIds: empIds };
      }).filter(p => p.recipientIds.length > 0);

      if (bulkPayload.length === 0) {
        toast.error('No valid matches found between CSV emails and employee records.');
        setIsUploading(false);
        return;
      }

      const totalAssigned = await bulkPushSharedGoals(currentUser!.id, cycleId, bulkPayload);
      toast.success(`Successfully pushed ${bulkPayload.length} unique goals to ${totalAssigned} employees`);
      
      setShowCsvDialog(false);
      setCsvFile(null);
      await loadData();

    } catch (e: any) {
      toast.error('Failed to parse CSV');
    }
    setIsUploading(false);
  };

  if (loading) return <AppShell><div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div></AppShell>;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Shared Goals</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Push departmental KPIs to multiple employees</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setShowCsvDialog(true)}>
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Bulk Import CSV
            </Button>
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="w-4 h-4 mr-2" /> Push Shared Goal
            </Button>
          </div>
        </div>

        {Object.keys(sharedGoalsMap).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Share2 className="w-12 h-12 text-muted-foreground/40 mx-auto" />
              <h3 className="text-base font-medium mt-4">No Shared Goals Yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Push a departmental KPI to distribute it across team members.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(sharedGoalsMap).map(([key, sg]) => (
              <Card key={key}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="outline" className="text-[10px] mb-1">{sg.thrustArea}</Badge>
                      <p className="text-sm font-medium pr-4">{sg.title}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <Users className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground line-clamp-1">{sg.recipients.join(', ')}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0">{sg.recipients.length} recipients</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Manual Push Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Push Shared Goal</DialogTitle>
            <DialogDescription>Recipients can only adjust weightage. Title and target are read-only for them.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Thrust Area</Label>
                <Select value={thrustArea} onValueChange={v => setThrustArea(v as ThrustArea)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{THRUST_AREAS.map(ta => <SelectItem key={ta} value={ta}>{ta}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">UoM Type</Label>
                <Select value={uomType} onValueChange={v => setUomType(v as UoMType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(UOM_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Goal Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Department Revenue Target" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Target</Label>
              {uomType === 'timeline' ? (
                <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
              ) : (
                <Input type="number" value={target || ''} onChange={e => setTarget(parseFloat(e.target.value) || 0)} />
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Assign To</Label>
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                {employees.map(emp => (
                  <div key={emp.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedEmployees.includes(emp.id)}
                      onCheckedChange={(checked) => {
                        setSelectedEmployees(checked
                          ? [...selectedEmployees, emp.id]
                          : selectedEmployees.filter(id => id !== emp.id));
                      }}
                    />
                    <span className="text-sm">{emp.name}</span>
                    <span className="text-xs text-muted-foreground">({emp.department.name})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handlePush} disabled={!title.trim() || selectedEmployees.length === 0 || pushing}>
              {pushing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : `Push to ${selectedEmployees.length} Employee(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      <Dialog open={showCsvDialog} onOpenChange={setShowCsvDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Import Goals (CSV)</DialogTitle>
            <DialogDescription>Upload a CSV file to automatically assign shared goals. The CSV must contain <strong className="text-foreground">Email</strong>, <strong className="text-foreground">Title</strong>, and <strong className="text-foreground">Target</strong> columns.</DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
            />
            
            {!csvFile ? (
              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium">Click to select CSV file</p>
                <p className="text-xs text-muted-foreground mt-1">Example: email,title,target</p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium">{csvFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(csvFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setCsvFile(null)}>Remove</Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCsvDialog(false); setCsvFile(null); }}>Cancel</Button>
            <Button onClick={handleCsvUpload} disabled={!csvFile || isUploading}>
              {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Process Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

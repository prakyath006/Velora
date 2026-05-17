'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle2, Clock, Loader2, PlayCircle, RefreshCw, Shield, FileText, Users } from 'lucide-react';
import { TableSkeleton } from '@/components/skeletons';
import { getEscalationLogs, resolveEscalation, runEscalationCheck, getActiveCycle } from '@/lib/actions';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const RULE_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  goal_not_submitted: {
    label: 'Goal Not Submitted',
    icon: FileText,
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  approval_pending: {
    label: 'Approval Pending',
    icon: Shield,
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  checkin_overdue: {
    label: 'Check-in Overdue',
    icon: Clock,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
};

const SEVERITY_STYLES: Record<string, string> = {
  info: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function EscalationsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<any>(null);

  const fetchLogs = async () => {
    const data = await getEscalationLogs();
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleRunCheck = async () => {
    setRunning(true);
    try {
      const cycle = await getActiveCycle();
      const result = await runEscalationCheck(cycle.id);
      setLastRun(result);
      toast.success(`Escalation check complete: ${result.checked} rules evaluated, ${result.created} new escalations`);
      await fetchLogs();
    } catch (e) {
      toast.error('Escalation check failed');
    }
    setRunning(false);
  };

  const handleResolve = async (id: string) => {
    await resolveEscalation(id);
    toast.success('Escalation resolved');
    setLogs(prev => prev.map(l => l.id === id ? { ...l, resolved: true, resolvedAt: new Date() } : l));
  };

  if (loading) return <AppShell><TableSkeleton /></AppShell>;

  const openLogs = logs.filter(l => !l.resolved);
  const resolvedLogs = logs.filter(l => l.resolved);

  const ruleStats = {
    goal_not_submitted: openLogs.filter(l => l.ruleType === 'goal_not_submitted').length,
    approval_pending: openLogs.filter(l => l.ruleType === 'approval_pending').length,
    checkin_overdue: openLogs.filter(l => l.ruleType === 'checkin_overdue').length,
  };

  return (
    <AppShell>
      <motion.div
        initial="hidden" animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Escalation Module</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Rule-based escalation engine • {openLogs.length} open escalation{openLogs.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={handleRunCheck} disabled={running}>
            {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlayCircle className="w-4 h-4 mr-2" />}
            Run Escalation Check
          </Button>
        </div>

        {/* Last Run Result */}
        {lastRun && (
          <motion.div variants={fadeUp}>
            <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
              <CardContent className="py-3 flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <p className="text-sm">
                  Last check at <span className="font-medium">{new Date(lastRun.timestamp).toLocaleTimeString()}</span> —{' '}
                  <span className="font-medium">{lastRun.checked}</span> rules evaluated,{' '}
                  <span className="font-medium">{lastRun.created}</span> new escalations created
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Escalation Rules */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Active Escalation Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-red-500" />
                    <h3 className="text-sm font-semibold">Goal Not Submitted</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">Employee has not submitted goals after cycle opens</p>
                  <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
                    <p>• <span className="font-medium">7+ days</span> → Warning</p>
                    <p>• <span className="font-medium">14+ days</span> → Critical (escalate to HR)</p>
                  </div>
                  <Badge variant="secondary" className="mt-3 text-[10px]">{ruleStats.goal_not_submitted} open</Badge>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-semibold">Approval Pending</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">Manager has not approved goals after submission</p>
                  <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
                    <p>• <span className="font-medium">3+ days</span> → Warning</p>
                    <p>• <span className="font-medium">7+ days</span> → Critical (escalate to skip-level)</p>
                  </div>
                  <Badge variant="secondary" className="mt-3 text-[10px]">{ruleStats.approval_pending} open</Badge>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <h3 className="text-sm font-semibold">Check-in Overdue</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">Quarterly check-in not completed within window</p>
                  <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
                    <p>• Active quarter window open → Warning</p>
                    <p>• Window closing → Critical</p>
                  </div>
                  <Badge variant="secondary" className="mt-3 text-[10px]">{ruleStats.checkin_overdue} open</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Escalation Log */}
        <motion.div variants={fadeUp}>
          <Tabs defaultValue="open">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="open">Open ({openLogs.length})</TabsTrigger>
                <TabsTrigger value="resolved">Resolved ({resolvedLogs.length})</TabsTrigger>
              </TabsList>
              <Button variant="ghost" size="sm" onClick={fetchLogs}>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
              </Button>
            </div>

            <TabsContent value="open">
              <Card>
                <CardContent className="p-0">
                  {openLogs.length === 0 ? (
                    <div className="py-12 text-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No open escalations</p>
                      <p className="text-xs text-muted-foreground mt-1">Click "Run Escalation Check" to evaluate rules</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rule</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Employee / Manager</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Message</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {openLogs.map((log) => {
                          const rule = RULE_LABELS[log.ruleType] || { label: log.ruleType, color: '' };
                          return (
                            <TableRow key={log.id}>
                              <TableCell>
                                <Badge variant="secondary" className={`text-[10px] ${rule.color}`}>
                                  {rule.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className={`text-[10px] ${SEVERITY_STYLES[log.severity]}`}>
                                  {log.severity === 'critical' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                  {log.severity}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium text-sm">{log.targetUser?.name}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{log.targetUser?.department?.name}</TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate">{log.message}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="outline" size="sm" onClick={() => handleResolve(log.id)}>
                                  Resolve
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resolved">
              <Card>
                <CardContent className="p-0">
                  {resolvedLogs.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-sm text-muted-foreground">No resolved escalations yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rule</TableHead>
                          <TableHead>Employee / Manager</TableHead>
                          <TableHead>Message</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Resolved</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resolvedLogs.map((log) => {
                          const rule = RULE_LABELS[log.ruleType] || { label: log.ruleType, color: '' };
                          return (
                            <TableRow key={log.id} className="opacity-60">
                              <TableCell>
                                <Badge variant="secondary" className="text-[10px]">{rule.label}</Badge>
                              </TableCell>
                              <TableCell className="font-medium text-sm">{log.targetUser?.name}</TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate">{log.message}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {log.resolvedAt ? new Date(log.resolvedAt).toLocaleDateString() : '—'}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}

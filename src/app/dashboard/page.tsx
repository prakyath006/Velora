'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/app-shell';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Target, CheckCircle2, Clock, AlertCircle, Users, FileText,
  ArrowRight, TrendingUp, BarChart3, Settings, Loader2, Trophy, Activity
} from 'lucide-react';
import Link from 'next/link';
import {
  getDashboardStats, getTeamMembers, getTeamGoalSheets,
  getActiveCycle, getAllGoalSheets, getEmployeesForAdmin,
  getLeaderboard, getAuditLogs
} from '@/lib/actions';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DashboardSkeleton } from '@/components/skeletons';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

function StatCard({ title, value, subtitle, icon: Icon, color, delay = 0 }: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ElementType; color: string; delay?: number;
}) {
  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay }}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">{title}</p>
              <p className="text-2xl font-bold mt-1 tracking-tight">{value}</p>
              {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EmployeeDashboard() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [cycleName, setCycleName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    (async () => {
      const cycle = await getActiveCycle();
      if (cancelled) return;
      setCycleName(cycle.name);
      const data = await getDashboardStats(currentUser.id, cycle.id);
      if (cancelled) return;
      setStats(data);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [currentUser]);

  if (loading) return <DashboardSkeleton />;

  const chartData = stats?.goals.map((g: any) => ({
    name: g.title.substring(0, 15) + '...',
    progress: Math.round(g.achievement?.computedScore || 0),
    weightage: g.weightage,
  })) || [];

  return (
    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Welcome back, {currentUser!.name.split(' ')[0]}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{cycleName} • Goal Setting Phase</p>
        </div>
        {(!stats || stats.sheetStatus === 'draft' || !stats.sheetStatus) && (
          <Link href="/goals/create">
            <Button className="shadow-sm hover:shadow transition-shadow"><Target className="w-4 h-4 mr-2" /> {stats ? 'Continue Goal Sheet' : 'Create Goal Sheet'}</Button>
          </Link>
        )}
      </div>

      {stats && (
        <>
          <motion.div variants={fadeUp}>
            <Card className={
              stats.sheetStatus === 'approved' ? 'border-emerald-200 bg-emerald-50/50' :
              stats.sheetStatus === 'submitted' ? 'border-blue-200 bg-blue-50/50' :
              stats.sheetStatus === 'returned' ? 'border-amber-200 bg-amber-50/50' : 'border-border'
            }>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  {stats.sheetStatus === 'approved' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                  {stats.sheetStatus === 'submitted' && <Clock className="w-5 h-5 text-blue-600" />}
                  {stats.sheetStatus === 'returned' && <AlertCircle className="w-5 h-5 text-amber-600" />}
                  {stats.sheetStatus === 'draft' && <FileText className="w-5 h-5 text-gray-500" />}
                  <div>
                    <p className="text-sm font-medium">
                      {stats.sheetStatus === 'approved' && 'Your goals are approved and locked'}
                      {stats.sheetStatus === 'submitted' && 'Goal sheet submitted — awaiting manager approval'}
                      {stats.sheetStatus === 'returned' && 'Goal sheet returned for rework'}
                      {stats.sheetStatus === 'draft' && 'Goal sheet in draft — complete and submit'}
                    </p>
                    {stats.returnComment && <p className="text-xs text-muted-foreground mt-1">Manager feedback: {stats.returnComment}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-4 gap-4">
            <StatCard title="Total Goals" value={stats.totalGoals} subtitle="of max 8" icon={Target} color="bg-primary/10 text-primary" delay={0.1} />
            <StatCard title="On Track" value={stats.onTrackGoals} icon={TrendingUp} color="bg-emerald-50 text-emerald-600" delay={0.2} />
            <StatCard title="Completed" value={stats.completedGoals} icon={CheckCircle2} color="bg-blue-50 text-blue-600" delay={0.3} />
            <StatCard title="Avg Score" value={`${stats.avgScore}%`} subtitle="Q1 Progress" icon={BarChart3} color="bg-purple-50 text-purple-600" delay={0.4} />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <motion.div variants={fadeUp} className="col-span-2">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Goal Progress Breakdown</CardTitle>
                    <Link href="/goals"><Button variant="ghost" size="sm" className="text-xs">View All <ArrowRight className="w-3 h-3 ml-1" /></Button></Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis dataKey="name" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                        <YAxis tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{fill: '#f4f4f5'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Bar dataKey="progress" name="Score (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Card className="h-full">
                <CardHeader className="pb-3"><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.goals.slice(0, 4).map((goal: any, i: number) => {
                      const score = goal.achievement?.computedScore || 0;
                      return (
                        <div key={goal.id} className="relative pl-4 border-l-2 border-primary/20 pb-4 last:pb-0">
                          <div className="absolute w-2 h-2 rounded-full bg-primary -left-[5px] top-1.5 ring-4 ring-background"></div>
                          <p className="text-sm font-medium line-clamp-1">{goal.title}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-muted-foreground">{goal.thrustArea}</span>
                            <span className="text-xs font-semibold">{Math.round(score)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}

      {!stats && (
        <motion.div variants={fadeUp}>
          <Card>
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-primary/40" />
              </div>
              <h3 className="text-lg font-medium">No Goals Set Yet</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">Start planning your objectives for {cycleName} to align with company targets.</p>
              <Link href="/goals/create"><Button className="mt-6 shadow-sm hover:shadow transition-all hover:-translate-y-0.5">Create Goal Sheet</Button></Link>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

function ManagerDashboard() {
  const { currentUser } = useAuth();
  const [team, setTeam] = useState<any[]>([]);
  const [sheets, setSheets] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [cycleName, setCycleName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      const cycle = await getActiveCycle();
      setCycleName(cycle.name);
      const [t, s, l] = await Promise.all([
        getTeamMembers(currentUser.id),
        getTeamGoalSheets(currentUser.id, cycle.id),
        getLeaderboard(cycle.id, 5)
      ]);
      setTeam(t);
      setSheets(s);
      
      // Filter leaderboard to only show own team
      const teamIds = t.map(emp => emp.id);
      setLeaderboard(l.filter((entry: any) => teamIds.includes(entry.employee.id)));
      setLoading(false);
    })();
  }, [currentUser]);

  if (loading) return <DashboardSkeleton />;

  const pending = sheets.filter(s => s.status === 'submitted').length;
  const approved = sheets.filter(s => s.status === 'approved').length;
  const drafts = sheets.filter(s => s.status === 'draft').length;
  const noSheet = team.length - sheets.length;

  const chartData = [
    { name: 'Approved', value: approved, fill: '#10b981' },
    { name: 'Pending', value: pending, fill: '#f59e0b' },
    { name: 'Draft/None', value: drafts + noSheet, fill: '#94a3b8' },
  ];

  return (
    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Team Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{cycleName} • {team.length} team members</p>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Team Members" value={team.length} icon={Users} color="bg-primary/10 text-primary" delay={0.1} />
        <StatCard title="Pending Approval" value={pending} icon={Clock} color="bg-amber-50 text-amber-600" delay={0.2} />
        <StatCard title="Approved" value={approved} icon={CheckCircle2} color="bg-emerald-50 text-emerald-600" delay={0.3} />
        <StatCard title="Not Started" value={noSheet + drafts} icon={AlertCircle} color="bg-red-50 text-red-600" delay={0.4} />
      </div>

      {pending > 0 && (
        <motion.div variants={fadeUp}>
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center"><Clock className="w-4 h-4 text-amber-600" /></div>
                  <div>
                    <p className="text-sm font-semibold text-amber-900">{pending} goal sheet(s) awaiting review</p>
                    <p className="text-xs text-amber-700 mt-0.5">Approve them to lock in the goals for this cycle.</p>
                  </div>
                </div>
                <Link href="/manager/approvals"><Button size="sm" variant="outline" className="border-amber-300 hover:bg-amber-100 text-amber-900">Review Now</Button></Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <motion.div variants={fadeUp} className="col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Team Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">No check-ins submitted yet.</div>
              ) : (
                <div className="space-y-4 mt-2">
                  {leaderboard.map((entry, idx) => (
                    <div key={entry.employee.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        <div className="w-6 text-center font-bold text-muted-foreground">{idx + 1}</div>
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                            {entry.employee.name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{entry.employee.name}</p>
                          <p className="text-xs text-muted-foreground">{entry.goalsCompleted} of {entry.totalGoals} goals completed</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">{entry.score}%</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Score</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader className="pb-0"><CardTitle className="text-base">Team Adoption</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{fontSize: '12px'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

function AdminDashboard() {
  const [sheets, setSheets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [cycleName, setCycleName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const cycle = await getActiveCycle();
      setCycleName(cycle.name);
      const [s, e, l, logs] = await Promise.all([
        getAllGoalSheets(cycle.id), 
        getEmployeesForAdmin(),
        getLeaderboard(cycle.id, 5),
        getAuditLogs(10)
      ]);
      setSheets(s); setEmployees(e); setLeaderboard(l); setAuditLogs(logs); setLoading(false);
    })();
  }, []);

  if (loading) return <DashboardSkeleton />;

  const departments = [...new Set(employees.map(e => e.department.name))];
  
  const chartData = departments.map(dept => {
    const deptEmps = employees.filter(e => e.department.name === dept);
    const deptApproved = sheets.filter(gs => gs.status === 'approved' && deptEmps.some((e: any) => e.id === gs.employeeId)).length;
    return {
      name: dept,
      Approved: deptApproved,
      Pending: sheets.filter(gs => gs.status === 'submitted' && deptEmps.some((e: any) => e.id === gs.employeeId)).length,
      Missing: deptEmps.length - sheets.filter(gs => deptEmps.some((e: any) => e.id === gs.employeeId)).length,
    };
  });

  return (
    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{cycleName} • Organization Overview</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Total Employees" value={employees.length} icon={Users} color="bg-primary/10 text-primary" delay={0.1} />
        <StatCard title="Goal Sheets" value={sheets.length} subtitle={`of ${employees.length}`} icon={FileText} color="bg-blue-50 text-blue-600" delay={0.2} />
        <StatCard title="Approved" value={sheets.filter(s => s.status === 'approved').length} icon={CheckCircle2} color="bg-emerald-50 text-emerald-600" delay={0.3} />
        <StatCard title="Pending" value={sheets.filter(s => s.status === 'submitted').length} icon={Clock} color="bg-amber-50 text-amber-600" delay={0.4} />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <motion.div variants={fadeUp} className="col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3"><CardTitle className="text-base">Departmental Adoption</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="name" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                    <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: '#f4f4f5'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{fontSize: '12px'}} />
                    <Bar dataKey="Approved" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="Pending" stackId="a" fill="#f59e0b" />
                    <Bar dataKey="Missing" stackId="a" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} className="space-y-6">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">No check-ins submitted yet.</div>
              ) : (
                <div className="space-y-3 mt-1">
                  {leaderboard.slice(0, 3).map((entry, idx) => (
                    <div key={entry.employee.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 text-xs font-bold text-muted-foreground">{idx + 1}</div>
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-medium">
                            {entry.employee.name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-medium line-clamp-1">{entry.employee.name}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">{entry.score}%</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Live Activity Feed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditLogs.slice(0, 4).map((log, i) => (
                  <div key={log.id} className="relative pl-4 border-l-2 border-border pb-4 last:pb-0">
                    <div className="absolute w-2 h-2 rounded-full bg-primary/40 -left-[5px] top-1.5 ring-4 ring-background"></div>
                    <p className="text-xs font-semibold text-foreground/80">{log.user?.name || 'System'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{log.details}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{new Date(log.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { currentUser, loading } = useAuth();
  if (loading || !currentUser) return <AppShell><DashboardSkeleton /></AppShell>;

  return (
    <AppShell>
      {currentUser.role === 'employee' && <EmployeeDashboard />}
      {currentUser.role === 'manager' && <ManagerDashboard />}
      {currentUser.role === 'admin' && <AdminDashboard />}
    </AppShell>
  );
}

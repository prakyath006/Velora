'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar,
} from 'recharts';
import { Target, Users, CheckCircle2, TrendingUp, Activity, BarChart3 } from 'lucide-react';
import { getActiveCycle, getAnalyticsData } from '@/lib/actions';
import { DashboardSkeleton } from '@/components/skeletons';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const THRUST_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#06b6d4',
];

const STATUS_COLORS: Record<string, string> = {
  not_started: '#94a3b8',
  on_track: '#f59e0b',
  completed: '#10b981',
};

const UOM_LABELS: Record<string, string> = {
  min_numeric: 'Numeric (↑)',
  max_numeric: 'Numeric (↓)',
  min_percent: 'Percent (↑)',
  max_percent: 'Percent (↓)',
  timeline: 'Timeline',
  zero: 'Zero-based',
};

const UOM_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#22c55e', '#06b6d4'];

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [cycleName, setCycleName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const cycle = await getActiveCycle();
      setCycleName(cycle.name);
      const analytics = await getAnalyticsData(cycle.id);
      setData(analytics);
      setLoading(false);
    })();
  }, []);

  if (loading) return <AppShell><DashboardSkeleton /></AppShell>;

  const { thrustAreaDistribution, uomDistribution, statusDistribution, departmentCompletion, managerEffectiveness, sheetStatusSummary, totalGoals, totalEmployees } = data;

  const sheetPieData = [
    { name: 'Approved', value: sheetStatusSummary.approved, fill: '#10b981' },
    { name: 'Submitted', value: sheetStatusSummary.submitted, fill: '#f59e0b' },
    { name: 'Draft', value: sheetStatusSummary.draft, fill: '#94a3b8' },
    { name: 'Returned', value: sheetStatusSummary.returned, fill: '#ef4444' },
    { name: 'Not Started', value: sheetStatusSummary.noSheet, fill: '#e2e8f0' },
  ].filter(d => d.value > 0);

  const statusPieData = statusDistribution.map((s: any) => ({
    ...s,
    name: s.name.replace('_', ' '),
    fill: STATUS_COLORS[s.name] || '#94a3b8',
  }));

  return (
    <AppShell>
      <motion.div
        initial="hidden" animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{cycleName} • Organization-wide Insights</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div variants={fadeUp}>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Target className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalGoals}</p>
                    <p className="text-[11px] text-muted-foreground">Total Goals</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={fadeUp}>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{sheetStatusSummary.approved}</p>
                    <p className="text-[11px] text-muted-foreground">Sheets Approved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={fadeUp}>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {totalEmployees > 0 ? Math.round((sheetStatusSummary.approved / totalEmployees) * 100) : 0}%
                    </p>
                    <p className="text-[11px] text-muted-foreground">Org Completion</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={fadeUp}>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalEmployees}</p>
                    <p className="text-[11px] text-muted-foreground">Employees</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Row 1: Thrust Area + Sheet Status Pie */}
        <div className="grid md:grid-cols-3 gap-6">
          <motion.div variants={fadeUp} className="col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Goal Distribution by Thrust Area</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={thrustAreaDistribution} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb40" />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                        cursor={{ fill: '#f4f4f540' }}
                      />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="#6366f1">
                        {thrustAreaDistribution.map((_: any, i: number) => (
                          <Cell key={i} fill={THRUST_COLORS[i % THRUST_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Goal Sheet Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sheetPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                        {sheetPieData.map((entry: any, i: number) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Row 2: UoM Distribution + Goal Status */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div variants={fadeUp}>
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Goal Distribution by UoM Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={uomDistribution.map((d: any) => ({ ...d, name: UOM_LABELS[d.name] || d.name }))} cx="50%" cy="50%" outerRadius={80} dataKey="count" label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                        {uomDistribution.map((_: any, i: number) => (
                          <Cell key={i} fill={UOM_COLORS[i % UOM_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Goal Progress Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5 mt-2">
                  {statusPieData.map((s: any) => {
                    const pct = totalGoals > 0 ? Math.round((s.count / totalGoals) * 100) : 0;
                    return (
                      <div key={s.name}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.fill }} />
                            <span className="text-sm font-medium capitalize">{s.name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{s.count} ({pct}%)</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Row 3: Department Completion Heatmap */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Department Completion Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {departmentCompletion.map((dept: any) => (
                  <div key={dept.department} className="flex items-center gap-4">
                    <div className="w-28 text-sm font-medium truncate">{dept.department}</div>
                    <div className="flex-1">
                      <div className="flex gap-1 h-8">
                        {dept.approved > 0 && (
                          <div
                            className="bg-emerald-500 rounded-l flex items-center justify-center text-white text-[10px] font-bold transition-all"
                            style={{ width: `${(dept.approved / dept.total) * 100}%` }}
                          >
                            {dept.approved}
                          </div>
                        )}
                        {dept.submitted > 0 && (
                          <div
                            className="bg-amber-500 flex items-center justify-center text-white text-[10px] font-bold transition-all"
                            style={{ width: `${(dept.submitted / dept.total) * 100}%` }}
                          >
                            {dept.submitted}
                          </div>
                        )}
                        {dept.draft > 0 && (
                          <div
                            className="bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-[10px] font-bold transition-all"
                            style={{ width: `${(dept.draft / dept.total) * 100}%` }}
                          >
                            {dept.draft}
                          </div>
                        )}
                        {dept.noSheet > 0 && (
                          <div
                            className="bg-slate-100 dark:bg-slate-800 rounded-r flex items-center justify-center text-[10px] text-muted-foreground font-bold transition-all"
                            style={{ width: `${(dept.noSheet / dept.total) * 100}%` }}
                          >
                            {dept.noSheet}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] w-14 justify-center ${
                        dept.completionRate >= 75 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' :
                        dept.completionRate >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' :
                        'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      }`}
                    >
                      {dept.completionRate}%
                    </Badge>
                  </div>
                ))}
                <div className="flex gap-4 text-[10px] text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><span className="w-3 h-2 bg-emerald-500 rounded-sm inline-block" /> Approved</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-2 bg-amber-500 rounded-sm inline-block" /> Submitted</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-2 bg-slate-300 dark:bg-slate-600 rounded-sm inline-block" /> Draft</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-2 bg-slate-100 dark:bg-slate-800 rounded-sm inline-block" /> Not Started</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Row 4: Manager Effectiveness */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Manager Effectiveness</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Manager</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-center">Team Size</TableHead>
                    <TableHead className="text-center">Sheets Approved</TableHead>
                    <TableHead className="text-center">Check-ins Done</TableHead>
                    <TableHead className="text-center">Approval Rate</TableHead>
                    <TableHead className="text-center">Check-in Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {managerEffectiveness.map((mgr: any) => (
                    <TableRow key={mgr.name}>
                      <TableCell className="font-medium">{mgr.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{mgr.department}</TableCell>
                      <TableCell className="text-center">{mgr.teamSize}</TableCell>
                      <TableCell className="text-center">{mgr.sheetsApproved}</TableCell>
                      <TableCell className="text-center">{mgr.checkinsCompleted}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className={`text-[10px] ${mgr.approvalRate >= 75 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : mgr.approvalRate >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                          {mgr.approvalRate}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className={`text-[10px] ${mgr.checkinRate >= 75 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : mgr.checkinRate >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                          {mgr.checkinRate}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}

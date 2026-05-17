'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Target, ArrowRight, ClipboardCheck, Shield, Users,
  FileText, BarChart3, CheckCircle2, Clock, TrendingUp,
  AlertCircle, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

const cardHover = {
  rest: { y: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  hover: { y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.1)', transition: { duration: 0.25 } }
};

/* ─── Fake product data for mockups ─────────────────────────── */

const MOCK_APPROVALS = [
  { name: 'Emily Chen', dept: 'Engineering', goals: 6, status: 'submitted', initials: 'EC' },
  { name: 'Raj Patel', dept: 'Product', goals: 5, status: 'approved', initials: 'RP' },
  { name: 'Sarah Kim', dept: 'Marketing', goals: 7, status: 'submitted', initials: 'SK' },
  { name: 'James Liu', dept: 'Sales', goals: 4, status: 'draft', initials: 'JL' },
];

const MOCK_GOALS = [
  { title: 'Increase quarterly revenue by 15%', area: 'Revenue Growth', progress: 72, weight: 25 },
  { title: 'Reduce deployment cycle time to under 2 hours', area: 'Operational Excellence', progress: 88, weight: 20 },
  { title: 'Achieve NPS score above 65', area: 'Customer Satisfaction', progress: 54, weight: 15 },
];

const MOCK_ACTIVITY = [
  { user: 'Vikram Singh', action: 'approved goal sheet for Emily Chen', time: '2 min ago' },
  { user: 'Sarah Kim', action: 'submitted Q2 check-in updates', time: '18 min ago' },
  { user: 'Admin', action: 'pushed shared KPI to Engineering dept', time: '1 hr ago' },
];

const STATUS_STYLE: Record<string, string> = {
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

/* ─── Mini product preview components ───────────────────────── */

function MiniStatCard({ label, value, icon: Icon, trend }: { label: string; value: string; icon: React.ElementType; trend?: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <p className="text-lg font-bold mt-1">{value}</p>
      {trend && <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">{trend}</p>}
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="rounded-xl border border-border/60 bg-card/80 backdrop-blur shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60 bg-muted/30">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        </div>
        <span className="text-[10px] text-muted-foreground ml-2 font-medium">Velora — Manager Dashboard</span>
      </div>
      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-4 gap-2">
          <MiniStatCard label="Team" value="12" icon={Users} />
          <MiniStatCard label="Pending" value="3" icon={Clock} trend="Action needed" />
          <MiniStatCard label="Approved" value="8" icon={CheckCircle2} trend="+2 this week" />
          <MiniStatCard label="Avg Score" value="76%" icon={TrendingUp} trend="↑ 4%" />
        </div>
        {/* Mini approvals table */}
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="grid grid-cols-[1fr_80px_60px_70px] gap-2 px-3 py-1.5 bg-muted/40 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            <span>Employee</span><span>Department</span><span>Goals</span><span>Status</span>
          </div>
          {MOCK_APPROVALS.map((row) => (
            <div key={row.name} className="grid grid-cols-[1fr_80px_60px_70px] gap-2 px-3 py-2 border-t border-border/60 items-center">
              <div className="flex items-center gap-2">
                <Avatar className="w-5 h-5">
                  <AvatarFallback className="text-[8px] bg-primary/10 text-primary">{row.initials}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium truncate">{row.name}</span>
              </div>
              <span className="text-[11px] text-muted-foreground">{row.dept}</span>
              <span className="text-[11px]">{row.goals}</span>
              <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 h-4 ${STATUS_STYLE[row.status]}`}>{row.status}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Velora" width={28} height={28} className="rounded" />
            <span className="font-bold tracking-tight">Velora</span>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <ThemeToggle />
            <Link href="/dashboard"><Button size="sm">Open Portal <ArrowRight className="w-3.5 h-3.5 ml-1.5" /></Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero — Split Layout */}
      <section className="pt-24 pb-4 px-6 bg-gradient-to-b from-muted/50 to-background border-b border-border/40">
        <div className="max-w-6xl mx-auto grid md:grid-cols-[1fr_1.2fr] gap-10 items-center py-8">
          {/* Left — Text */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <h1 className="text-3xl md:text-4xl font-bold leading-[1.2] tracking-tight">
              Goal Setting, Reviews, and Quarterly Tracking — in One System
            </h1>
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed max-w-md">
              Velora centralizes employee goals, manager approvals, quarterly check-ins, and KPI tracking into a single structured workflow platform.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <Link href="/dashboard">
                <Button className="shadow-sm">Open Portal <ArrowRight className="w-4 h-4 ml-1.5" /></Button>
              </Link>
              <Link href="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
            </div>
            <div className="flex items-center gap-4 mt-8 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Role-based access</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Full audit trail</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Quarterly reviews</span>
            </div>
          </motion.div>

          {/* Right — Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <DashboardMockup />
          </motion.div>
        </div>
      </section>

      {/* Bento Features — Asymmetric Grid */}
      <section className="py-14 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl font-bold tracking-tight">Core Capabilities</h2>
          <p className="text-sm text-muted-foreground mt-1.5 mb-8">End-to-end goal management — from creation to quarterly review.</p>

          <motion.div
            className="grid md:grid-cols-3 gap-4"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {/* Large card — Goal Lifecycle with embedded preview */}
            <motion.div variants={fadeUp} className="md:col-span-2"
              initial="rest" whileHover="hover" animate="rest"
            >
              <motion.div variants={cardHover}>
                <Card className="h-full transition-colors hover:border-primary/30">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="w-4 h-4 text-primary" />
                          <h3 className="font-semibold text-sm">Goal Lifecycle Management</h3>
                        </div>
                        <p className="text-xs text-muted-foreground max-w-sm">Create, review, approve, and lock employee goals with structured workflows and configurable UoM types.</p>
                      </div>
                      <Badge variant="outline" className="text-[9px] shrink-0">Up to 8 goals</Badge>
                    </div>
                    <div className="space-y-2.5 mt-2">
                      {MOCK_GOALS.map((goal) => (
                        <div key={goal.title} className="flex items-center gap-3 p-2.5 rounded-md border border-border/60 bg-muted/20">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{goal.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-muted-foreground">{goal.area}</span>
                              <span className="text-[10px] text-muted-foreground">•</span>
                              <span className="text-[10px] text-muted-foreground">Weight: {goal.weight}%</span>
                            </div>
                          </div>
                          <div className="w-20 shrink-0">
                            <Progress value={goal.progress} className="h-1.5" />
                            <p className="text-[10px] text-right mt-0.5 font-medium">{goal.progress}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Right column — stacked */}
            <div className="space-y-4">
              <motion.div variants={fadeUp} initial="rest" whileHover="hover" animate="rest">
                <motion.div variants={cardHover}>
                  <Card className="h-full transition-colors hover:border-primary/30">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold text-sm">Manager Approvals</h3>
                      </div>
                      <p className="text-xs text-muted-foreground">Inline editing, return-for-rework, and one-click approval to lock goals.</p>
                      <div className="mt-3 space-y-1.5">
                        {[
                          { name: 'Emily C.', status: 'Pending', color: 'text-amber-600 dark:text-amber-400' },
                          { name: 'Raj P.', status: 'Approved', color: 'text-emerald-600 dark:text-emerald-400' },
                          { name: 'Sarah K.', status: 'Returned', color: 'text-red-500 dark:text-red-400' },
                        ].map((item) => (
                          <div key={item.name} className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">{item.name}</span>
                            <span className={`font-medium ${item.color}`}>{item.status}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>

              <motion.div variants={fadeUp} initial="rest" whileHover="hover" animate="rest">
                <motion.div variants={cardHover}>
                  <Card className="h-full transition-colors hover:border-primary/30">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold text-sm">Audit & Governance</h3>
                      </div>
                      <p className="text-xs text-muted-foreground">Every edit, submission, and approval is logged with timestamp and user attribution.</p>
                      <div className="mt-3 space-y-2">
                        {MOCK_ACTIVITY.map((item, i) => (
                          <div key={i} className="text-[10px] text-muted-foreground leading-relaxed">
                            <span className="font-medium text-foreground">{item.user}</span>{' '}{item.action}
                            <span className="block text-[9px] text-muted-foreground/60 mt-0.5">{item.time}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </div>

            {/* Bottom row — 3 smaller cards with hover lift */}
            {[
              { icon: ClipboardCheck, title: 'Quarterly Check-ins', desc: 'Track planned vs actual across Q1–Q4 with automatic score computation.' },
              { icon: Users, title: 'Shared KPIs', desc: 'Push department-wide objectives to multiple employees simultaneously.' },
              { icon: BarChart3, title: 'Reporting', desc: 'Department adoption funnels, progress breakdowns, and exportable PDF reports.' },
            ].map((card) => (
              <motion.div key={card.title} variants={fadeUp} initial="rest" whileHover="hover" animate="rest">
                <motion.div variants={cardHover}>
                  <Card className="transition-colors hover:border-primary/30">
                    <CardContent className="p-5">
                      <card.icon className="w-4 h-4 text-primary mb-2" />
                      <h3 className="font-semibold text-sm">{card.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{card.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-14 px-6 bg-muted/30 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl font-bold tracking-tight">How It Works</h2>
          <p className="text-sm text-muted-foreground mt-1.5 mb-8">A structured six-step cycle from setup to reporting.</p>

          <div className="grid md:grid-cols-6 gap-3">
            {[
              { n: '01', title: 'Create Cycle', desc: 'Admin defines FY, dates, and review windows' },
              { n: '02', title: 'Set Goals', desc: 'Employees draft goals with targets and weightage' },
              { n: '03', title: 'Manager Review', desc: 'Approve, edit inline, or return for rework' },
              { n: '04', title: 'Goals Locked', desc: 'Approved goals become read-only for the cycle' },
              { n: '05', title: 'Check-ins', desc: 'Log quarterly actuals; managers give feedback' },
              { n: '06', title: 'Reports', desc: 'Scores computed; reports exported for HR' },
            ].map((step, i) => (
              <motion.div
                key={step.n}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} transition={{ delay: i * 0.06 }}
              >
                <div className="p-4 rounded-lg border border-border bg-card h-full">
                  <span className="text-lg font-bold text-primary/25">{step.n}</span>
                  <h3 className="font-semibold text-xs mt-2">{step.title}</h3>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Role-Based Access */}
      <section className="py-14 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl font-bold tracking-tight">Role-Based Access</h2>
          <p className="text-sm text-muted-foreground mt-1.5 mb-8">Three interfaces tailored to each level of the organization.</p>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { role: 'Employee', icon: Target, items: ['Create and manage personal goals', 'Log quarterly achievements', 'View progress and scores'], border: 'border-blue-200 dark:border-blue-900' },
              { role: 'Manager', icon: Users, items: ['Review and approve team goals', 'Provide quarterly feedback', 'Monitor team performance'], border: 'border-purple-200 dark:border-purple-900' },
              { role: 'Admin', icon: Shield, items: ['Configure performance cycles', 'Push shared KPIs', 'Access audit logs and reports'], border: 'border-amber-200 dark:border-amber-900' },
            ].map((item, i) => (
              <motion.div
                key={item.role}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} transition={{ delay: i * 0.08 }}
              >
                <div className={`rounded-lg border-2 ${item.border} bg-card p-5 h-full`}>
                  <div className="flex items-center gap-2 mb-3">
                    <item.icon className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-sm">{item.role}</h3>
                  </div>
                  <ul className="space-y-2">
                    {item.items.map((li) => (
                      <li key={li} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary/50 mt-0.5 shrink-0" />
                        {li}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-6 border-t border-border">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="max-w-xl mx-auto text-center">
          <h2 className="text-lg font-bold">Explore the Workspace</h2>
          <p className="text-sm text-muted-foreground mt-2">Pre-configured evaluation environment with 8 employees, 2 managers, and 1 HR admin across Engineering, Sales, and HR departments.</p>
          <Link href="/login">
            <Button className="mt-5 shadow-sm">Launch Portal <ChevronRight className="w-4 h-4 ml-1" /></Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-5 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Velora" width={20} height={20} className="rounded" />
            <span className="text-sm font-semibold">Velora</span>
          </div>
          <p className="text-xs text-muted-foreground">Enterprise Goal Management System</p>
        </div>
      </footer>
    </div>
  );
}

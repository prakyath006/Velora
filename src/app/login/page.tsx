'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { Users, Shield, Settings, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const ROLES = [
  {
    role: 'Employee',
    name: 'Priya Sharma',
    designation: 'Software Engineer',
    department: 'Engineering',
    icon: Users,
    capabilities: [
      'Create & submit goal sheets',
      'Log quarterly achievements',
      'Track progress & scores',
    ],
  },
  {
    role: 'Manager',
    name: 'Vikram Mehta',
    designation: 'Engineering Manager',
    department: 'Engineering',
    icon: Shield,
    capabilities: [
      'Review & approve goal sheets',
      'Conduct quarterly check-ins',
      'View team dashboards',
    ],
  },
  {
    role: 'Admin',
    name: 'Admin User',
    designation: 'HR Admin',
    department: 'HR',
    icon: Settings,
    capabilities: [
      'Configure cycles & phases',
      'Manage org hierarchy',
      'View audit logs & reports',
    ],
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const { switchToRole } = useAuth();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const handleEnter = (role: string) => {
    setLoadingRole(role);
    switchToRole(role);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Velora" width={28} height={28} className="rounded" />
            <span className="font-bold tracking-tight">Velora</span>
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-10">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 -left-40 w-96 h-96 bg-primary/8 rounded-full blur-[128px]" />
          <div className="absolute bottom-20 -right-40 w-96 h-96 bg-purple-500/8 rounded-full blur-[128px]" />
        </div>

        <motion.div
          initial="hidden" animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="relative z-10 w-full max-w-4xl"
        >
          {/* Header */}
          <motion.div variants={fadeUp} className="text-center mb-8">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest mb-2">FY 2026–27 Evaluation Environment</p>
            <h1 className="text-2xl font-bold tracking-tight">Select Your Workspace Role</h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              8 Employees • 2 Managers • 1 HR Admin — across Engineering, Sales, and HR.
            </p>
          </motion.div>

          {/* Role Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            {ROLES.map((r, i) => (
              <motion.div
                key={r.role}
                variants={fadeUp}
                transition={{ delay: i * 0.1 }}
              >
                <Card
                  className="cursor-pointer transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 group border-border"
                  onClick={() => handleEnter(r.role)}
                >
                  <CardContent className="p-5">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 bg-primary/10 border border-primary/20">
                      <r.icon className="w-5 h-5 text-primary" />
                    </div>

                    <h3 className="font-semibold text-base">{r.role}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.name} • {r.designation}</p>
                    <p className="text-[10px] text-muted-foreground">{r.department}</p>

                    <ul className="mt-4 space-y-1.5">
                      {r.capabilities.map((cap) => (
                        <li key={cap} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                          {cap}
                        </li>
                      ))}
                    </ul>

                    <Button size="sm" className="w-full mt-5 opacity-80 group-hover:opacity-100 transition-opacity" disabled={loadingRole !== null}>
                      {loadingRole === r.role ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Loading...</>
                      ) : (
                        <>View as {r.role} <ArrowRight className="w-3.5 h-3.5 ml-1.5" /></>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Footer note */}
          <motion.p variants={fadeUp} className="text-center text-[11px] text-muted-foreground/60 mt-6">
            Pre-configured workspace with seeded goals, approvals, and check-ins. Switch roles anytime from the sidebar.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { getAllCycles } from '@/lib/actions';

export default function CyclesPage() {
  const [cycles, setCycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await getAllCycles();
      setCycles(data);
      setLoading(false);
    })();
  }, []);

  if (loading) return <AppShell><div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div></AppShell>;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Performance Cycles</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage goal-setting and check-in windows</p>
        </div>

        {cycles.map(cycle => (
          <Card key={cycle.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{cycle.name}</CardTitle>
                <Badge variant={cycle.status === 'active' ? 'default' : 'secondary'}>{cycle.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4 text-xs">
                {[
                  { label: 'Goal Setting', start: cycle.goalSettingStart, end: cycle.goalSettingEnd },
                  { label: 'Q1 Check-in', start: cycle.q1Start, end: cycle.q1End },
                  { label: 'Q2 Check-in', start: cycle.q2Start, end: cycle.q2End },
                  { label: 'Q3 Check-in', start: cycle.q3Start, end: cycle.q3End },
                  { label: 'Q4 / Annual', start: cycle.q4Start, end: cycle.q4End },
                ].map(phase => {
                  const now = new Date();
                  const isActive = now >= new Date(phase.start) && now <= new Date(phase.end);
                  return (
                    <div key={phase.label} className={`p-3 rounded-lg border ${isActive ? 'border-primary bg-primary/5' : 'border-border'}`}>
                      <p className="font-medium">{phase.label}</p>
                      {isActive && <Badge className="text-[9px] mt-1 mb-1">Active</Badge>}
                      <p className="text-muted-foreground mt-1">{new Date(phase.start).toLocaleDateString()} — {new Date(phase.end).toLocaleDateString()}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

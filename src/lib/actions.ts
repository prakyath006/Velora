'use server';

import prisma from '@/lib/prisma';
import type { GoalStatus, UoMType, GoalSheetStatus } from '@prisma/client';

// ── Users ───────────────────────────────────────────────────

export async function getAllUsers() {
  return prisma.user.findMany({
    include: { department: true },
    orderBy: { name: 'asc' },
  });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { department: true },
  });
}

export async function getTeamMembers(managerId: string) {
  return prisma.user.findMany({
    where: { managerId },
    include: { department: true },
    orderBy: { name: 'asc' },
  });
}

// ── Cycles ──────────────────────────────────────────────────

export async function getActiveCycle() {
  const cycle = await prisma.cycle.findFirst({ where: { status: 'active' } });
  if (!cycle) throw new Error('No active cycle found');
  return cycle;
}

export async function getAllCycles() {
  return prisma.cycle.findMany({ orderBy: { createdAt: 'desc' } });
}

// ── Goal Sheets ─────────────────────────────────────────────

export async function getGoalSheetByEmployee(employeeId: string, cycleId: string) {
  return prisma.goalSheet.findUnique({
    where: { employeeId_cycleId: { employeeId, cycleId } },
    include: {
      goals: { orderBy: { createdAt: 'asc' } },
      employee: { include: { department: true } },
      approvedBy: true,
    },
  });
}

export async function getGoalSheetById(id: string) {
  return prisma.goalSheet.findUnique({
    where: { id },
    include: {
      goals: { orderBy: { createdAt: 'asc' } },
      employee: { include: { department: true } },
      approvedBy: true,
    },
  });
}

export async function getAllGoalSheets(cycleId: string) {
  return prisma.goalSheet.findMany({
    where: { cycleId },
    include: {
      goals: true,
      employee: { include: { department: true, manager: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getTeamGoalSheets(managerId: string, cycleId: string) {
  const team = await getTeamMembers(managerId);
  const teamIds = team.map(m => m.id);
  return prisma.goalSheet.findMany({
    where: { cycleId, employeeId: { in: teamIds } },
    include: {
      goals: true,
      employee: { include: { department: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getPendingApprovals(managerId: string, cycleId: string) {
  const team = await getTeamMembers(managerId);
  const teamIds = team.map(m => m.id);
  return prisma.goalSheet.findMany({
    where: { cycleId, employeeId: { in: teamIds }, status: 'submitted' },
    include: {
      goals: true,
      employee: { include: { department: true } },
    },
    orderBy: { submittedAt: 'asc' },
  });
}

// ── Goal CRUD ───────────────────────────────────────────────

interface GoalInput {
  thrustArea: string;
  title: string;
  description: string;
  uomType: UoMType;
  target: number;
  targetDate?: string;
  weightage: number;
}

export async function saveGoalSheet(
  employeeId: string,
  cycleId: string,
  goals: GoalInput[],
  status: 'draft' | 'submitted'
) {
  const existing = await prisma.goalSheet.findUnique({
    where: { employeeId_cycleId: { employeeId, cycleId } },
  });

  const goalData = goals.map(g => ({
    thrustArea: g.thrustArea,
    title: g.title,
    description: g.description,
    uomType: g.uomType,
    target: g.target,
    targetDate: g.targetDate ? new Date(g.targetDate) : null,
    weightage: g.weightage,
  }));

  if (existing) {
    // Delete old goals and create new ones
    await prisma.goal.deleteMany({ where: { goalSheetId: existing.id } });
    const sheet = await prisma.goalSheet.update({
      where: { id: existing.id },
      data: {
        status,
        submittedAt: status === 'submitted' ? new Date() : existing.submittedAt,
        goals: { create: goalData },
      },
      include: { goals: true },
    });
    return sheet;
  } else {
    const sheet = await prisma.goalSheet.create({
      data: {
        employeeId,
        cycleId,
        status,
        submittedAt: status === 'submitted' ? new Date() : null,
        goals: { create: goalData },
      },
      include: { goals: true },
    });
    return sheet;
  }
}

export async function approveGoalSheet(sheetId: string, managerId: string) {
  const sheet = await prisma.goalSheet.update({
    where: { id: sheetId },
    data: { status: 'approved', approvedAt: new Date(), approvedById: managerId },
  });
  await addAuditLog(managerId, 'goal_sheet', sheetId, 'goal_sheet_approved', 'Goal sheet approved by manager');
  return sheet;
}

export async function returnGoalSheet(sheetId: string, managerId: string, comment: string) {
  const sheet = await prisma.goalSheet.update({
    where: { id: sheetId },
    data: { status: 'returned', returnedAt: new Date(), returnComment: comment },
  });
  await addAuditLog(managerId, 'goal_sheet', sheetId, 'goal_sheet_returned', `Returned: ${comment}`);
  return sheet;
}

export async function unlockGoalSheet(sheetId: string, adminId: string) {
  const sheet = await prisma.goalSheet.update({
    where: { id: sheetId },
    data: { status: 'draft', approvedAt: null, approvedById: null },
  });
  await addAuditLog(adminId, 'goal_sheet', sheetId, 'goal_sheet_unlocked', 'Goal sheet unlocked by admin');
  return sheet;
}

export async function editGoalDuringApproval(
  goalId: string,
  managerId: string,
  updates: { target?: number; weightage?: number }
) {
  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal) throw new Error('Goal not found');

  const updated = await prisma.goal.update({
    where: { id: goalId },
    data: updates,
  });

  await addAuditLog(managerId, 'goal', goalId, 'goal_updated',
    `Manager edited: target ${goal.target}→${updates.target ?? goal.target}, weightage ${goal.weightage}→${updates.weightage ?? goal.weightage}`
  );
  return updated;
}

// ── Quarterly Updates ───────────────────────────────────────

export async function getQuarterlyUpdates(goalSheetId: string, quarter?: string) {
  const goals = await prisma.goal.findMany({ where: { goalSheetId } });
  const goalIds = goals.map(g => g.id);
  return prisma.quarterlyUpdate.findMany({
    where: {
      goalId: { in: goalIds },
      ...(quarter ? { quarter } : {}),
    },
    include: { goal: true },
  });
}

export async function saveQuarterlyUpdate(
  goalId: string,
  quarter: string,
  userId: string,
  data: { actualValue?: number | null; completionDate?: string; status: GoalStatus }
) {
  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal) throw new Error('Goal not found');

  // Compute score
  let computedScore: number | null = null;
  const actual = data.actualValue;
  if (actual !== null && actual !== undefined) {
    switch (goal.uomType) {
      case 'min_numeric':
      case 'min_percent':
        computedScore = goal.target > 0 ? Math.min((actual / goal.target) * 100, 100) : 0;
        break;
      case 'max_numeric':
      case 'max_percent':
        computedScore = actual > 0 ? Math.min((goal.target / actual) * 100, 100) : 100;
        break;
      case 'zero':
        computedScore = actual === 0 ? 100 : 0;
        break;
      case 'timeline':
        if (data.completionDate && goal.targetDate) {
          computedScore = new Date(data.completionDate) <= goal.targetDate ? 100 : 0;
        }
        break;
    }
  }

  return prisma.quarterlyUpdate.upsert({
    where: { goalId_quarter: { goalId, quarter } },
    create: {
      goalId, quarter, updatedById: userId,
      actualValue: data.actualValue,
      completionDate: data.completionDate ? new Date(data.completionDate) : null,
      status: data.status, computedScore,
    },
    update: {
      actualValue: data.actualValue,
      completionDate: data.completionDate ? new Date(data.completionDate) : null,
      status: data.status, computedScore, updatedById: userId,
    },
  });
}

// ── Check-in Comments ───────────────────────────────────────

export async function getCheckinComments(goalSheetId: string, quarter?: string) {
  return prisma.checkinComment.findMany({
    where: { goalSheetId, ...(quarter ? { quarter } : {}) },
    include: { manager: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function saveCheckinComment(
  goalSheetId: string, managerId: string, quarter: string, comment: string
) {
  // Check if exists, update or create
  const existing = await prisma.checkinComment.findFirst({
    where: { goalSheetId, managerId, quarter },
  });
  if (existing) {
    return prisma.checkinComment.update({
      where: { id: existing.id },
      data: { comment },
    });
  }
  const result = await prisma.checkinComment.create({
    data: { goalSheetId, managerId, quarter, comment },
  });
  await addAuditLog(managerId, 'checkin', goalSheetId, 'checkin_comment_added', `${quarter} check-in comment added`);
  return result;
}

// ── Shared Goals ────────────────────────────────────────────

export async function pushSharedGoal(
  pushedById: string,
  cycleId: string,
  goalData: GoalInput,
  recipientIds: string[]
) {
  // Create a "source" goal ID to link shared copies
  const results = [];

  for (const empId of recipientIds) {
    let sheet = await prisma.goalSheet.findUnique({
      where: { employeeId_cycleId: { employeeId: empId, cycleId } },
      include: { goals: true },
    });

    if (!sheet) {
      sheet = await prisma.goalSheet.create({
        data: { employeeId: empId, cycleId, status: 'draft' },
        include: { goals: true },
      });
    }

    if (sheet.goals.length >= 8) continue;

    const goal = await prisma.goal.create({
      data: {
        goalSheetId: sheet.id,
        thrustArea: goalData.thrustArea,
        title: goalData.title,
        description: goalData.description,
        uomType: goalData.uomType,
        target: goalData.target,
        targetDate: goalData.targetDate ? new Date(goalData.targetDate) : null,
        weightage: goalData.weightage,
        isShared: true,
        primaryOwnerId: pushedById,
      },
    });
    results.push(goal);
  }

  await addAuditLog(pushedById, 'goal', 'shared', 'shared_goal_pushed',
    `Shared goal "${goalData.title}" pushed to ${recipientIds.length} employees`
  );

  return results;
}

export async function bulkPushSharedGoals(
  pushedById: string,
  cycleId: string,
  bulkData: { goalData: GoalInput; recipientIds: string[] }[]
) {
  let totalPushed = 0;
  for (const item of bulkData) {
    await pushSharedGoal(pushedById, cycleId, item.goalData, item.recipientIds);
    totalPushed += item.recipientIds.length;
  }
  return totalPushed;
}

// ── Audit Logs ──────────────────────────────────────────────

export async function addAuditLog(
  userId: string, entityType: string, entityId: string,
  action: string, details: string, oldValue?: string, newValue?: string
) {
  return prisma.auditLog.create({
    data: {
      userId, entityType, entityId,
      action: action as any, details, oldValue, newValue,
    },
  });
}

export async function getAuditLogs(limit = 50) {
  return prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

// ── Notifications ───────────────────────────────────────────

export async function getNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
}

export async function addNotification(
  userId: string, title: string, message: string, type: string, link?: string
) {
  return prisma.notification.create({
    data: { userId, title, message, type, link },
  });
}

export async function markNotificationRead(id: string) {
  return prisma.notification.update({
    where: { id },
    data: { read: true },
  });
}

// ── Dashboard Stats ─────────────────────────────────────────

export async function getDashboardStats(employeeId: string, cycleId: string) {
  const sheet = await getGoalSheetByEmployee(employeeId, cycleId);
  if (!sheet) return null;

  const goals = sheet.goals;
  const updates = await getQuarterlyUpdates(sheet.id, 'Q1');

  return {
    totalGoals: goals.length,
    completedGoals: goals.filter(g => g.status === 'completed').length,
    onTrackGoals: goals.filter(g => g.status === 'on_track').length,
    notStartedGoals: goals.filter(g => g.status === 'not_started').length,
    sheetStatus: sheet.status,
    returnComment: sheet.returnComment,
    totalWeightage: goals.reduce((s, g) => s + g.weightage, 0),
    avgScore: updates.length > 0
      ? Math.round(updates.reduce((s, u) => s + (u.computedScore || 0), 0) / updates.length)
      : 0,
    goals: goals.map(g => ({
      ...g,
      targetDate: g.targetDate?.toISOString() ?? null,
      createdAt: g.createdAt.toISOString(),
      achievement: updates.find(u => u.goalId === g.id) ?? null,
    })),
  };
}

export async function getEmployeesForAdmin() {
  return prisma.user.findMany({
    where: { role: 'employee' },
    include: { department: true },
  });
}

export async function getLeaderboard(cycleId: string, limit: number = 5) {
  const sheets = await prisma.goalSheet.findMany({
    where: { cycleId },
    include: {
      employee: { include: { department: true } },
      goals: { include: { quarterlyUpdates: true } }
    }
  });

  const leaderboard = sheets.map(sheet => {
    let totalScore = 0;
    let updatesCount = 0;
    sheet.goals.forEach(goal => {
      goal.quarterlyUpdates.forEach(u => {
        if (u.computedScore !== null) {
          totalScore += u.computedScore;
          updatesCount++;
        }
      });
    });
    return {
      employee: sheet.employee,
      score: updatesCount > 0 ? Math.round(totalScore / updatesCount) : 0,
      goalsCompleted: sheet.goals.filter(g => g.status === 'completed').length,
      totalGoals: sheet.goals.length
    };
  }).filter(l => l.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);

  return leaderboard;
}

// ── Analytics ───────────────────────────────────────────────

export async function getAnalyticsData(cycleId: string) {
  const [sheets, employees, checkins, managers] = await Promise.all([
    prisma.goalSheet.findMany({
      where: { cycleId },
      include: {
        goals: { include: { quarterlyUpdates: true } },
        employee: { include: { department: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: 'employee' },
      include: { department: true },
    }),
    prisma.checkinComment.findMany({
      where: { goalSheet: { cycleId } },
      include: { manager: true },
    }),
    prisma.user.findMany({
      where: { role: 'manager' },
      include: { department: true },
    }),
  ]);

  // All goals flattened
  const allGoals = sheets.flatMap(s => s.goals);

  // 1. Goal distribution by Thrust Area
  const thrustAreaMap: Record<string, number> = {};
  allGoals.forEach(g => {
    thrustAreaMap[g.thrustArea] = (thrustAreaMap[g.thrustArea] || 0) + 1;
  });
  const thrustAreaDistribution = Object.entries(thrustAreaMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // 2. Goal distribution by UoM type
  const uomMap: Record<string, number> = {};
  allGoals.forEach(g => {
    uomMap[g.uomType] = (uomMap[g.uomType] || 0) + 1;
  });
  const uomDistribution = Object.entries(uomMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // 3. Status breakdown
  const statusMap: Record<string, number> = { not_started: 0, on_track: 0, completed: 0 };
  allGoals.forEach(g => {
    statusMap[g.status] = (statusMap[g.status] || 0) + 1;
  });
  const statusDistribution = Object.entries(statusMap)
    .map(([name, count]) => ({ name, count }));

  // 4. Department completion rates
  const departments = [...new Set(employees.map(e => e.department.name))];
  const departmentCompletion = departments.map(dept => {
    const deptEmployees = employees.filter(e => e.department.name === dept);
    const deptSheets = sheets.filter(s => deptEmployees.some(e => e.id === s.employeeId));
    const approved = deptSheets.filter(s => s.status === 'approved').length;
    const submitted = deptSheets.filter(s => s.status === 'submitted').length;
    const total = deptEmployees.length;
    return {
      department: dept,
      total,
      approved,
      submitted,
      draft: deptSheets.filter(s => s.status === 'draft').length,
      noSheet: total - deptSheets.length,
      completionRate: total > 0 ? Math.round((approved / total) * 100) : 0,
    };
  });

  // 5. Manager effectiveness — check-in completion
  const managerEffectiveness = managers.map(mgr => {
    const teamMembers = employees.filter(e => e.managerId === mgr.id);
    const teamSheets = sheets.filter(s => teamMembers.some(e => e.id === s.employeeId));
    const approvedSheets = teamSheets.filter(s => s.status === 'approved');
    const mgrCheckins = checkins.filter(c => c.managerId === mgr.id);
    const uniqueCheckinSheets = new Set(mgrCheckins.map(c => c.goalSheetId));
    return {
      name: mgr.name,
      department: mgr.department.name,
      teamSize: teamMembers.length,
      sheetsApproved: approvedSheets.length,
      checkinsCompleted: uniqueCheckinSheets.size,
      approvalRate: teamSheets.length > 0 ? Math.round((approvedSheets.length / teamSheets.length) * 100) : 0,
      checkinRate: approvedSheets.length > 0 ? Math.round((uniqueCheckinSheets.size / approvedSheets.length) * 100) : 0,
    };
  });

  // 6. Goal sheet status summary
  const sheetStatusSummary = {
    total: sheets.length,
    approved: sheets.filter(s => s.status === 'approved').length,
    submitted: sheets.filter(s => s.status === 'submitted').length,
    draft: sheets.filter(s => s.status === 'draft').length,
    returned: sheets.filter(s => s.status === 'returned').length,
    noSheet: employees.length - sheets.length,
  };

  return {
    thrustAreaDistribution,
    uomDistribution,
    statusDistribution,
    departmentCompletion,
    managerEffectiveness,
    sheetStatusSummary,
    totalGoals: allGoals.length,
    totalEmployees: employees.length,
  };
}

// ── Escalation Module ───────────────────────────────────────

export async function getEscalationLogs() {
  return prisma.escalationLog.findMany({
    include: { targetUser: { include: { department: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export async function resolveEscalation(id: string) {
  return prisma.escalationLog.update({
    where: { id },
    data: { resolved: true, resolvedAt: new Date() },
  });
}

export async function runEscalationCheck(cycleId: string) {
  const cycle = await prisma.cycle.findUnique({ where: { id: cycleId } });
  if (!cycle) throw new Error('Cycle not found');

  const employees = await prisma.user.findMany({
    where: { role: 'employee' },
    include: { department: true, manager: true },
  });

  const sheets = await prisma.goalSheet.findMany({
    where: { cycleId },
    include: { goals: { include: { quarterlyUpdates: true } }, employee: true },
  });

  const now = new Date();
  const results: { ruleType: string; severity: string; targetUserId: string; message: string }[] = [];

  // Rule 1: Employee has not submitted goals within N days of cycle goal-setting start
  const goalSettingDays = Math.floor((now.getTime() - cycle.goalSettingStart.getTime()) / (1000 * 60 * 60 * 24));
  if (goalSettingDays > 0) {
    for (const emp of employees) {
      const sheet = sheets.find(s => s.employeeId === emp.id);
      if (!sheet || sheet.status === 'draft') {
        const severity = goalSettingDays > 14 ? 'critical' : goalSettingDays > 7 ? 'warning' : 'info';
        results.push({
          ruleType: 'goal_not_submitted',
          severity,
          targetUserId: emp.id,
          message: `${emp.name} (${emp.department.name}) has not submitted goals — ${goalSettingDays} days since goal-setting opened`,
        });
      }
    }
  }

  // Rule 2: Manager has not approved goals within N days of submission
  const pendingSheets = sheets.filter(s => s.status === 'submitted' && s.submittedAt);
  for (const sheet of pendingSheets) {
    const daysPending = Math.floor((now.getTime() - sheet.submittedAt!.getTime()) / (1000 * 60 * 60 * 24));
    if (daysPending > 2) {
      const manager = employees.find(e => e.id === sheet.employee.managerId) 
        || await prisma.user.findUnique({ where: { id: sheet.employee.managerId! }, include: { department: true } });
      if (manager) {
        results.push({
          ruleType: 'approval_pending',
          severity: daysPending > 7 ? 'critical' : 'warning',
          targetUserId: manager.id,
          message: `${(manager as any).name} has not approved ${sheet.employee.name}'s goal sheet — pending ${daysPending} days`,
        });
      }
    }
  }

  // Rule 3: Quarterly check-in not completed within active window
  const quarters = [
    { name: 'Q1', start: cycle.q1Start, end: cycle.q1End },
    { name: 'Q2', start: cycle.q2Start, end: cycle.q2End },
    { name: 'Q3', start: cycle.q3Start, end: cycle.q3End },
    { name: 'Q4', start: cycle.q4Start, end: cycle.q4End },
  ];
  const activeQuarter = quarters.find(q => now >= q.start && now <= q.end);
  if (activeQuarter) {
    const approvedSheets = sheets.filter(s => s.status === 'approved');
    for (const sheet of approvedSheets) {
      const hasUpdates = sheet.goals.some(g => 
        g.quarterlyUpdates.some(u => u.quarter === activeQuarter.name)
      );
      if (!hasUpdates) {
        results.push({
          ruleType: 'checkin_overdue',
          severity: 'warning',
          targetUserId: sheet.employeeId,
          message: `${sheet.employee.name} has not submitted ${activeQuarter.name} check-in achievement data`,
        });
      }
    }
  }

  // Create escalation logs and notifications (avoid duplicates for same rule+user today)
  const today = new Date().toISOString().split('T')[0];
  let created = 0;
  for (const r of results) {
    // Check if already escalated today for this rule+user
    const existing = await prisma.escalationLog.findFirst({
      where: {
        ruleType: r.ruleType,
        targetUserId: r.targetUserId,
        resolved: false,
        createdAt: { gte: new Date(today) },
      },
    });
    if (!existing) {
      await prisma.escalationLog.create({ data: r });
      // Also send notification
      await prisma.notification.create({
        data: {
          userId: r.targetUserId,
          title: r.ruleType === 'goal_not_submitted' ? 'Goal Submission Overdue'
            : r.ruleType === 'approval_pending' ? 'Approval Pending'
            : 'Check-in Overdue',
          message: r.message,
          type: r.severity === 'critical' ? 'warning' : 'info',
        },
      });
      created++;
    }
  }

  return { checked: results.length, created, timestamp: new Date().toISOString() };
}

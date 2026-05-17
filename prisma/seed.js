/**
 * Database Seed — Evaluation Environment Provisioning
 * 
 * Populates the database with a realistic organizational structure
 * for evaluation and testing purposes:
 * 
 *   - 3 departments (Engineering, Sales, HR)
 *   - 8 users across 3 roles (Employee, Manager, Admin)
 *   - 1 active performance cycle (FY 2026-27)
 *   - Goal sheets in various lifecycle stages (draft → submitted → approved)
 *   - Q1 quarterly achievements with computed scores
 *   - Check-in comments, audit logs, and notifications
 * 
 * Usage: node prisma/seed.js
 */

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv/config');

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  console.log('[seed] Resetting database...');
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.checkinComment.deleteMany();
  await prisma.quarterlyUpdate.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.goalSheet.deleteMany();
  await prisma.cycle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  console.log('[seed] Provisioning departments...');
  const engineering = await prisma.department.create({ data: { name: 'Engineering' } });
  const sales = await prisma.department.create({ data: { name: 'Sales' } });
  const hr = await prisma.department.create({ data: { name: 'HR' } });

  console.log('[seed] Provisioning users & org hierarchy...');
  const admin = await prisma.user.create({
    data: { email: 'admin@atomquest.com', name: 'Admin User', role: 'admin', designation: 'HR Admin', departmentId: hr.id },
  });
  const vikram = await prisma.user.create({
    data: { email: 'vikram@atomquest.com', name: 'Vikram Mehta', role: 'manager', designation: 'Engineering Manager', departmentId: engineering.id },
  });
  const sonal = await prisma.user.create({
    data: { email: 'sonal@atomquest.com', name: 'Sonal Kapoor', role: 'manager', designation: 'Sales Manager', departmentId: sales.id },
  });
  const priya = await prisma.user.create({
    data: { email: 'priya@atomquest.com', name: 'Priya Sharma', role: 'employee', designation: 'Software Engineer', departmentId: engineering.id, managerId: vikram.id },
  });
  const rahul = await prisma.user.create({
    data: { email: 'rahul@atomquest.com', name: 'Rahul Verma', role: 'employee', designation: 'Frontend Developer', departmentId: engineering.id, managerId: vikram.id },
  });
  const anita = await prisma.user.create({
    data: { email: 'anita@atomquest.com', name: 'Anita Desai', role: 'employee', designation: 'Sales Executive', departmentId: sales.id, managerId: sonal.id },
  });
  const deepak = await prisma.user.create({
    data: { email: 'deepak@atomquest.com', name: 'Deepak Joshi', role: 'employee', designation: 'Backend Developer', departmentId: engineering.id, managerId: vikram.id },
  });
  const meera = await prisma.user.create({
    data: { email: 'meera@atomquest.com', name: 'Meera Nair', role: 'employee', designation: 'Account Manager', departmentId: sales.id, managerId: sonal.id },
  });

  console.log('[seed] Creating performance cycle (FY 2026-27)...');
  const cycle = await prisma.cycle.create({
    data: {
      name: 'FY 2026-27', financialYear: '2026-27', status: 'active',
      goalSettingStart: new Date('2026-05-01'), goalSettingEnd: new Date('2026-05-31'),
      q1Start: new Date('2026-07-01'), q1End: new Date('2026-07-31'),
      q2Start: new Date('2026-10-01'), q2End: new Date('2026-10-31'),
      q3Start: new Date('2027-01-01'), q3End: new Date('2027-01-31'),
      q4Start: new Date('2027-03-01'), q4End: new Date('2027-04-30'),
    },
  });

  console.log('[seed] Creating goal sheets across lifecycle stages...');

  // Priya's approved goal sheet
  const gs1 = await prisma.goalSheet.create({
    data: {
      employeeId: priya.id, cycleId: cycle.id, status: 'approved',
      submittedAt: new Date('2026-05-10T10:00:00Z'), approvedAt: new Date('2026-05-12T14:00:00Z'), approvedById: vikram.id,
    },
  });

  const g1 = await prisma.goal.create({
    data: { goalSheetId: gs1.id, thrustArea: 'Innovation & Technology', title: 'Deliver Project Alpha MVP', description: 'Complete all core features for Project Alpha minimum viable product', uomType: 'timeline', target: 0, targetDate: new Date('2026-09-30'), weightage: 25, status: 'on_track' },
  });
  const g2 = await prisma.goal.create({
    data: { goalSheetId: gs1.id, thrustArea: 'Quality Improvement', title: 'Achieve 95% Code Coverage', description: 'Increase unit test coverage across all modules', uomType: 'min_percent', target: 95, weightage: 20, status: 'on_track' },
  });
  const g3 = await prisma.goal.create({
    data: { goalSheetId: gs1.id, thrustArea: 'Operational Excellence', title: 'Reduce Build Time by 40%', description: 'Optimize CI/CD pipeline to reduce build time in seconds', uomType: 'max_numeric', target: 180, weightage: 15 },
  });
  const g4 = await prisma.goal.create({
    data: { goalSheetId: gs1.id, thrustArea: 'Safety & Compliance', title: 'Zero Critical Production Bugs', description: 'Maintain zero critical severity bugs in production', uomType: 'zero', target: 0, weightage: 20 },
  });
  const g5 = await prisma.goal.create({
    data: { goalSheetId: gs1.id, thrustArea: 'Revenue Growth', title: 'Revenue from Tech Consulting', description: 'Generate revenue through internal tech consulting projects', uomType: 'min_numeric', target: 500000, weightage: 20 },
  });

  // Rahul's submitted (pending approval) goal sheet
  const gs2 = await prisma.goalSheet.create({
    data: {
      employeeId: rahul.id, cycleId: cycle.id, status: 'submitted',
      submittedAt: new Date('2026-05-14T09:00:00Z'),
    },
  });

  await prisma.goal.createMany({
    data: [
      { goalSheetId: gs2.id, thrustArea: 'Customer Satisfaction', title: 'Redesign Customer Portal UI', description: 'Complete redesign of customer-facing portal with modern UX', uomType: 'timeline', target: 0, targetDate: new Date('2026-08-31'), weightage: 30 },
      { goalSheetId: gs2.id, thrustArea: 'Operational Excellence', title: 'Page Load Time Under 2s', description: 'Optimize all pages to load within 2 seconds', uomType: 'max_numeric', target: 2, weightage: 25 },
      { goalSheetId: gs2.id, thrustArea: 'Innovation & Technology', title: 'Component Library Coverage', description: 'Build reusable component library covering 80% of UI patterns', uomType: 'min_percent', target: 80, weightage: 25 },
      { goalSheetId: gs2.id, thrustArea: 'Quality Improvement', title: 'Accessibility Score A+', description: 'Achieve WCAG 2.1 AA compliance across all pages', uomType: 'min_percent', target: 100, weightage: 20 },
    ],
  });

  // Anita's approved goal sheet
  const gs3 = await prisma.goalSheet.create({
    data: {
      employeeId: anita.id, cycleId: cycle.id, status: 'approved',
      submittedAt: new Date('2026-05-09T11:00:00Z'), approvedAt: new Date('2026-05-11T16:00:00Z'), approvedById: sonal.id,
    },
  });

  const g10 = await prisma.goal.create({
    data: { goalSheetId: gs3.id, thrustArea: 'Revenue Growth', title: 'Quarterly Sales Target', description: 'Achieve quarterly sales revenue of ₹20L', uomType: 'min_numeric', target: 2000000, weightage: 35, status: 'on_track' },
  });
  const g11 = await prisma.goal.create({
    data: { goalSheetId: gs3.id, thrustArea: 'Customer Satisfaction', title: 'New Client Acquisition', description: 'Onboard 15 new enterprise clients', uomType: 'min_numeric', target: 15, weightage: 25, status: 'on_track' },
  });
  await prisma.goal.createMany({
    data: [
      { goalSheetId: gs3.id, thrustArea: 'Customer Satisfaction', title: 'Client Retention Rate', description: 'Maintain client retention above 95%', uomType: 'min_percent', target: 95, weightage: 25 },
      { goalSheetId: gs3.id, thrustArea: 'Cost Optimization', title: 'Reduce Sales Cycle Time', description: 'Reduce average sales cycle to under 30 days', uomType: 'max_numeric', target: 30, weightage: 15 },
    ],
  });

  // Deepak's draft goal sheet
  await prisma.goalSheet.create({
    data: {
      employeeId: deepak.id, cycleId: cycle.id, status: 'draft',
      goals: {
        create: [
          { thrustArea: 'Operational Excellence', title: 'API Response Time Optimization', description: 'Reduce p95 API response time to under 200ms', uomType: 'max_numeric', target: 200, weightage: 30 },
          { thrustArea: 'Innovation & Technology', title: 'Database Migration Project', description: 'Migrate legacy database to new architecture', uomType: 'timeline', target: 0, targetDate: new Date('2026-12-31'), weightage: 30 },
        ],
      },
    },
  });

  console.log('[seed] Populating Q1 quarterly achievements...');
  await prisma.quarterlyUpdate.createMany({
    data: [
      { goalId: g2.id, quarter: 'Q1', actualValue: 72, status: 'on_track', computedScore: 75.8, updatedById: priya.id },
      { goalId: g3.id, quarter: 'Q1', actualValue: 240, status: 'not_started', computedScore: 75, updatedById: priya.id },
      { goalId: g10.id, quarter: 'Q1', actualValue: 1800000, status: 'on_track', computedScore: 90, updatedById: anita.id },
      { goalId: g11.id, quarter: 'Q1', actualValue: 12, status: 'on_track', computedScore: 80, updatedById: anita.id },
    ],
  });

  console.log('[seed] Adding manager check-in records...');
  await prisma.checkinComment.createMany({
    data: [
      { goalSheetId: gs1.id, managerId: vikram.id, quarter: 'Q1', comment: 'Good progress on Project Alpha. Code coverage needs more focus in Q2. Build time optimization should be prioritized.' },
      { goalSheetId: gs3.id, managerId: sonal.id, quarter: 'Q1', comment: 'Strong sales performance. Client acquisition on track. Focus on reducing sales cycle time in Q2.' },
    ],
  });

  console.log('[seed] Generating audit trail entries...');
  await prisma.auditLog.createMany({
    data: [
      { userId: priya.id, entityType: 'goal_sheet', entityId: gs1.id, action: 'goal_sheet_submitted', details: 'Goal sheet submitted for approval' },
      { userId: vikram.id, entityType: 'goal_sheet', entityId: gs1.id, action: 'goal_sheet_approved', details: 'Goal sheet approved by manager' },
      { userId: anita.id, entityType: 'goal_sheet', entityId: gs3.id, action: 'goal_sheet_submitted', details: 'Goal sheet submitted for approval' },
      { userId: sonal.id, entityType: 'goal_sheet', entityId: gs3.id, action: 'goal_sheet_approved', details: 'Goal sheet approved by manager' },
      { userId: rahul.id, entityType: 'goal_sheet', entityId: gs2.id, action: 'goal_sheet_submitted', details: 'Goal sheet submitted with 4 goals' },
    ],
  });

  console.log('[seed] Creating notification queue...');
  await prisma.notification.createMany({
    data: [
      { userId: vikram.id, title: 'Goal Sheet Pending', message: 'Rahul Verma submitted a goal sheet for your approval.', type: 'action', link: '/manager/approvals' },
      { userId: deepak.id, title: 'Goal Setting Reminder', message: 'Please complete your goal sheet before May 31.', type: 'warning' },
    ],
  });

  console.log('[seed] Environment provisioned successfully.');
  
  // Print summary
  const userCount = await prisma.user.count();
  const goalSheetCount = await prisma.goalSheet.count();
  const goalCount = await prisma.goal.count();
  console.log(`   ${userCount} users, ${goalSheetCount} goal sheets, ${goalCount} goals`);

  await prisma.$disconnect();
}

main().catch(e => { console.error('❌ Seed failed:', e); process.exit(1); });

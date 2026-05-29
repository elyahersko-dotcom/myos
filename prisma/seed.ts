import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // User
  const password = await bcrypt.hash("password123", 10);
  await prisma.user.upsert({
    where: { email: "admin@myos.com" },
    update: {},
    create: { email: "admin@myos.com", password, name: "Admin" },
  });

  // Clients
  const [alice, bob, carol] = await Promise.all([
    prisma.client.create({ data: { name: "Alice Johnson", company: "TechCorp", email: "alice@techcorp.com", phone: "555-0101", status: "active", notes: "Main contact for web project" } }),
    prisma.client.create({ data: { name: "Bob Smith", company: "StartupXYZ", email: "bob@startupxyz.com", phone: "555-0102", status: "active" } }),
    prisma.client.create({ data: { name: "Carol White", company: "RetailCo", email: "carol@retailco.com", status: "inactive" } }),
  ]);

  // Tasks
  await Promise.all([
    prisma.task.create({ data: { title: "Design new landing page", description: "Figma mockups for homepage redesign", priority: "high", status: "in-progress", clientId: alice.id, dueDate: new Date(Date.now() + 2 * 86400000) } }),
    prisma.task.create({ data: { title: "Send Q2 invoice", priority: "urgent", status: "todo", clientId: bob.id, dueDate: new Date() } }),
    prisma.task.create({ data: { title: "Weekly team sync prep", priority: "medium", status: "todo", dueDate: new Date(Date.now() + 86400000) } }),
    prisma.task.create({ data: { title: "Fix login bug", priority: "high", status: "done", clientId: alice.id } }),
    prisma.task.create({ data: { title: "Update client portfolio", priority: "low", status: "todo", dueDate: new Date(Date.now() + 7 * 86400000) } }),
  ]);

  // Invoices
  await Promise.all([
    prisma.invoice.create({ data: { clientId: alice.id, amount: 4500, status: "sent", dueDate: new Date(Date.now() + 14 * 86400000), lineItems: [{ desc: "Web Development", qty: 1, price: 4500 }] } }),
    prisma.invoice.create({ data: { clientId: bob.id, amount: 1200, status: "paid", dueDate: new Date(Date.now() - 7 * 86400000), lineItems: [{ desc: "Consulting", qty: 4, price: 300 }] } }),
    prisma.invoice.create({ data: { clientId: carol.id, amount: 800, status: "overdue", dueDate: new Date(Date.now() - 30 * 86400000), lineItems: [{ desc: "Design", qty: 1, price: 800 }] } }),
  ]);

  // Leads
  await Promise.all([
    prisma.lead.create({ data: { name: "Dave Martinez", company: "Enterprise Inc", contact: "dave@enterprise.com", stage: "new", notes: "Met at ProductConf 2026", nextFollowUp: new Date(Date.now() + 3 * 86400000) } }),
    prisma.lead.create({ data: { name: "Eve Chen", company: "GrowthCo", contact: "555-0201", stage: "contacted", nextFollowUp: new Date(Date.now() + 1 * 86400000) } }),
    prisma.lead.create({ data: { name: "Frank Davis", company: "LocalBiz", stage: "qualified", notes: "Interested in monthly retainer" } }),
    prisma.lead.create({ data: { name: "Grace Lee", company: "BigCorp", stage: "proposal", nextFollowUp: new Date(Date.now() + 5 * 86400000) } }),
  ]);

  // Payments
  await Promise.all([
    prisma.payment.create({ data: { label: "Rent", amount: 1850, dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1), recurrence: "monthly", category: "rent", isPaid: true } }),
    prisma.payment.create({ data: { label: "Car Payment", amount: 420, dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 15), recurrence: "monthly", category: "car" } }),
    prisma.payment.create({ data: { label: "Electric Bill", amount: 95, dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 20), recurrence: "monthly", category: "utilities" } }),
    prisma.payment.create({ data: { label: "Internet", amount: 65, dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 10), recurrence: "monthly", category: "utilities", isPaid: true } }),
    prisma.payment.create({ data: { label: "Car Insurance", amount: 1200, dueDate: new Date(new Date().getFullYear(), 5, 1), recurrence: "yearly", category: "car" } }),
  ]);

  // Calendar Events
  const now = new Date();
  await Promise.all([
    prisma.calendarEvent.create({ data: { title: "Client Call — Alice", startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0), endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 11, 0) } }),
    prisma.calendarEvent.create({ data: { title: "Team Standup", startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0), endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 30), allDay: false } }),
    prisma.calendarEvent.create({ data: { title: "Dentist Appointment", startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5, 14, 0), endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5, 15, 0) } }),
  ]);

  // Todos
  await Promise.all([
    prisma.todo.create({ data: { title: "Review contract with Alice", priority: "high", dueDate: new Date(Date.now() + 2 * 86400000) } }),
    prisma.todo.create({ data: { title: "Buy groceries", priority: "medium" } }),
    prisma.todo.create({ data: { title: "Read 'Deep Work' chapter 3", priority: "low" } }),
    prisma.todo.create({ data: { title: "File quarterly taxes", priority: "urgent", dueDate: new Date(Date.now() + 10 * 86400000) } }),
    prisma.todo.create({ data: { title: "Call mom", priority: "medium", status: "done" } }),
  ]);

  // Transactions
  const categories = ["food", "transport", "utilities", "entertainment", "other"];
  const merchants = ["Whole Foods", "Uber", "Netflix", "Electric Co", "Amazon", "Starbucks", "Shell Gas", "Spotify", "Target"];
  for (let i = 0; i < 30; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const isIncome = i === 0 || i === 15;
    await prisma.transaction.create({
      data: {
        amount: isIncome ? 3500 + Math.random() * 500 : 10 + Math.random() * 200,
        date: new Date(Date.now() - daysAgo * 86400000),
        description: isIncome ? "Client Payment" : merchants[Math.floor(Math.random() * merchants.length)],
        category: isIncome ? "income" : categories[Math.floor(Math.random() * (categories.length - 1))],
        merchantName: isIncome ? null : merchants[Math.floor(Math.random() * merchants.length)],
        type: isIncome ? "income" : "expense",
      },
    });
  }

  console.log("Seeding complete. Login: admin@myos.com / password123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

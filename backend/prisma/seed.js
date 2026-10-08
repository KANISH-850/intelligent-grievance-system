const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Seed Departments
  const departments = [
    { name: "Water Supply", code: "WS", description: "Water supply, pipelines, water quality, and supply disruption complaints" },
    { name: "Electricity", code: "ELEC", description: "Power outage, electrical grid, transformer, and billing complaints" },
    { name: "Roads and Transport", code: "RT", description: "Potholes, road maintenance, streetlights, and public transit complaints" },
    { name: "Healthcare", code: "HC", description: "Public hospitals, primary health centers, and medical facility issues" },
    { name: "Education", code: "EDU", description: "Government schools, educational infrastructure, and scholarship queries" },
    { name: "Sanitation", code: "SAN", description: "Garbage collection, sewage, cleanliness, and public hygiene" },
    { name: "Municipal Services", code: "MS", description: "Property tax, trade license, birth/death certificates, and civic amenities" },
    { name: "Revenue", code: "REV", description: "Land records, taxation, revenue administration, and revenue certificates" },
    { name: "Other", code: "OTH", description: "General grievances not covered under specific departmental domains" },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name, description: dept.description },
      create: dept,
    });
  }
  console.log(`✅ Seeded ${departments.length} departments.`);

  // Seed Demo Users
  const saltRounds = 10;
  const demoPassword = await bcrypt.hash("Password@123", saltRounds);

  // Fetch Water Supply department for Demo Officer
  const waterDept = await prisma.department.findUnique({ where: { code: "WS" } });

  const users = [
    {
      name: "Demo Citizen",
      email: "citizen@example.com",
      password_hash: demoPassword,
      role: "CITIZEN",
      department_id: null,
    },
    {
      name: "Demo Officer",
      email: "officer@example.com",
      password_hash: demoPassword,
      role: "OFFICER",
      department_id: waterDept ? waterDept.id : null,
    },
    {
      name: "Demo Admin",
      email: "admin@example.com",
      password_hash: demoPassword,
      role: "ADMIN",
      department_id: null,
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, password_hash: u.password_hash, role: u.role, department_id: u.department_id },
      create: u,
    });
  }
  console.log(`✅ Seeded ${users.length} demo users (Citizen, Officer [Water Supply], Admin).`);

  console.log("🌱 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

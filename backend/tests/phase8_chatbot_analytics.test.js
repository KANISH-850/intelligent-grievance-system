const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const supertest = require("supertest");
const app = require("../src/app");
const { prisma } = require("../src/config/database");

const request = supertest(app);

describe("Phase 8 — Multilingual Chatbot & Analytics APIs", () => {
  let citizenToken = "";
  let citizen2Token = "";
  let officerToken = "";
  let adminToken = "";

  let citizenUser = null;
  let citizen2User = null;
  let officerUser = null;
  let adminUser = null;

  let testDept = null;
  let testDept2 = null;

  let testGrievance1 = null;
  let testGrievance2 = null;

  before(async () => {
    // 1. Create unique test departments
    testDept = await prisma.department.create({
      data: {
        name: "P8 Sanitation Dept",
        code: `P8SAN_${Date.now()}`,
        description: "Phase 8 Test Department 1",
      },
    });

    testDept2 = await prisma.department.create({
      data: {
        name: "P8 Health Dept",
        code: `P8HC_${Date.now()}`,
        description: "Phase 8 Test Department 2",
      },
    });

    // 2. Register Citizen 1
    const citizenEmail = `p8_citizen1_${Date.now()}@example.com`;
    const citRes = await request.post("/api/v1/auth/register").send({
      name: "P8 Citizen One",
      email: citizenEmail,
      password: "Password@123",
    });
    citizenToken = citRes.body.token;
    citizenUser = citRes.body.user;

    // 3. Register Citizen 2
    const citizen2Email = `p8_citizen2_${Date.now()}@example.com`;
    const cit2Res = await request.post("/api/v1/auth/register").send({
      name: "P8 Citizen Two",
      email: citizen2Email,
      password: "Password@123",
    });
    citizen2Token = cit2Res.body.token;
    citizen2User = cit2Res.body.user;

    // 4. Create Officer User assigned to testDept
    const officerEmail = `p8_officer_${Date.now()}@example.com`;
    officerUser = await prisma.user.create({
      data: {
        name: "P8 Officer",
        email: officerEmail,
        password_hash: citizenUser.id, // placeholder hash
        role: "OFFICER",
        department_id: testDept.id,
      },
    });
    const offLoginRes = await request.post("/api/v1/auth/login").send({
      email: officerEmail,
      password: "Password@123",
    }).catch(() => null);

    const { generateToken } = require("../src/utils/jwt");
    officerToken = generateToken(officerUser);

    // 5. Create Admin User
    const adminEmail = `p8_admin_${Date.now()}@example.com`;
    adminUser = await prisma.user.create({
      data: {
        name: "P8 Admin",
        email: adminEmail,
        password_hash: "hash",
        role: "ADMIN",
      },
    });
    adminToken = generateToken(adminUser);

    // 6. Create Grievance for Citizen 1 under testDept
    testGrievance1 = await prisma.grievance.create({
      data: {
        grievance_number: `GRV-2026-800${Date.now().toString().slice(-3)}`,
        user_id: citizenUser.id,
        original_text: "Sanitation waste accumulation near main street market area",
        detected_language: "English",
        translated_text: "Sanitation waste accumulation near main street market area",
        category: "Sanitation",
        priority: "HIGH",
        department_id: testDept.id,
        status: "IN_PROGRESS",
      },
    });

    // 7. Create Grievance for Citizen 2 under testDept2
    testGrievance2 = await prisma.grievance.create({
      data: {
        grievance_number: `GRV-2026-900${Date.now().toString().slice(-3)}`,
        user_id: citizen2User.id,
        original_text: "Healthcare dispensary shortage of emergency medicine",
        detected_language: "English",
        translated_text: "Healthcare dispensary shortage of emergency medicine",
        category: "Healthcare",
        priority: "CRITICAL",
        department_id: testDept2.id,
        status: "SUBMITTED",
      },
    });
  });

  after(async () => {
    // Cleanup test data
    if (testGrievance1?.id) {
      await prisma.grievanceStatusHistory.deleteMany({ where: { grievance_id: testGrievance1.id } });
      await prisma.grievance.delete({ where: { id: testGrievance1.id } }).catch(() => {});
    }
    if (testGrievance2?.id) {
      await prisma.grievanceStatusHistory.deleteMany({ where: { grievance_id: testGrievance2.id } });
      await prisma.grievance.delete({ where: { id: testGrievance2.id } }).catch(() => {});
    }

    const userIds = [citizenUser?.id, citizen2User?.id, officerUser?.id, adminUser?.id].filter(Boolean);
    if (userIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }

    if (testDept?.id) await prisma.department.delete({ where: { id: testDept.id } }).catch(() => {});
    if (testDept2?.id) await prisma.department.delete({ where: { id: testDept2.id } }).catch(() => {});
  });

  describe("1. Multilingual Chatbot Access & RBAC", () => {
    it("Unauthenticated chatbot query should return 401 Unauthorized", async () => {
      const res = await request.post("/api/v1/chatbot/message").send({
        message: "Hello chatbot",
      });
      assert.equal(res.status, 401);
    });

    it("Non-Citizen (Officer) chatbot query should return 403 Forbidden", async () => {
      const res = await request
        .post("/api/v1/chatbot/message")
        .set("Authorization", `Bearer ${officerToken}`)
        .send({ message: "Can I query grievances?" });
      assert.equal(res.status, 403);
    });

    it("Authenticated Citizen can send general chatbot query", async () => {
      const res = await request
        .post("/api/v1/chatbot/message")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send({ message: "How do I submit a grievance?" });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(typeof res.body.message, "string");
      assert.equal(typeof res.body.language, "string");
    });

    it("Citizen querying their OWN grievance receives status details", async () => {
      const query = `What is the status of my grievance ${testGrievance1.grievance_number}?`;
      const res = await request
        .post("/api/v1/chatbot/message")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send({ message: query });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.intent, "GRIEVANCE_STATUS");
      assert.ok(res.body.message.includes(testGrievance1.grievance_number));
      assert.equal(res.body.grievance.status, "IN_PROGRESS");
    });

    it("Citizen querying ANOTHER citizen's grievance is BLOCKED safely without data leak", async () => {
      const query = `Check status for ${testGrievance2.grievance_number}`;
      const res = await request
        .post("/api/v1/chatbot/message")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send({ message: query });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.intent, "GRIEVANCE_STATUS");
      assert.ok(res.body.message.includes("No grievance record with reference"));
      assert.equal(res.body.grievance, null);
    });

    it("Citizen asking for list of grievances gets personal overview", async () => {
      const res = await request
        .post("/api/v1/chatbot/message")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send({ message: "Show all my grievances" });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.intent, "LIST_GRIEVANCES");
      assert.ok(res.body.message.includes(testGrievance1.grievance_number));
    });
  });

  describe("2. Advanced Analytics APIs & RBAC Isolation", () => {
    it("Unauthenticated analytics access is rejected with 401", async () => {
      const resAdmin = await request.get("/api/v1/admin/analytics");
      assert.equal(resAdmin.status, 401);

      const resOfficer = await request.get("/api/v1/officer/analytics");
      assert.equal(resOfficer.status, 401);
    });

    it("Citizen attempting to access Admin or Officer analytics is rejected with 403", async () => {
      const resAdmin = await request
        .get("/api/v1/admin/analytics")
        .set("Authorization", `Bearer ${citizenToken}`);
      assert.equal(resAdmin.status, 403);

      const resOfficer = await request
        .get("/api/v1/officer/analytics")
        .set("Authorization", `Bearer ${citizenToken}`);
      assert.equal(resOfficer.status, 403);
    });

    it("Authenticated ADMIN can view system-wide analytics", async () => {
      const res = await request
        .get("/api/v1/admin/analytics")
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.summary);
      assert.ok(typeof res.body.data.summary.total === "number");
      assert.ok(res.body.data.priority);
      assert.ok(Array.isArray(res.body.data.departments));
      assert.ok(Array.isArray(res.body.data.categories));
    });

    it("Authenticated OFFICER can view department-scoped analytics", async () => {
      const res = await request
        .get("/api/v1/officer/analytics")
        .set("Authorization", `Bearer ${officerToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.department.id, testDept.id);
      assert.ok(res.body.data.summary);
      assert.ok(typeof res.body.data.summary.total === "number");
      assert.ok(res.body.data.summary.total >= 1);
    });
  });
});

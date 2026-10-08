const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const supertest = require("supertest");
const app = require("../src/app");
const { prisma } = require("../src/config/database");
const { generateToken } = require("../src/utils/jwt");

const request = supertest(app);

describe("Phase 6 — Officer & Admin Management Workflows Test Suite", () => {
  let citizenToken, citizenUser;
  let waterOfficerToken, waterOfficerUser;
  let electricityOfficerToken, electricityOfficerUser;
  let unassignedOfficerToken, unassignedOfficerUser;
  let adminToken, adminUser;
  let waterDept, elecDept;
  let waterGrievanceId, elecGrievanceId;

  before(async () => {
    // 1. Fetch departments
    waterDept = await prisma.department.findUnique({ where: { code: "WS" } });
    elecDept = await prisma.department.findUnique({ where: { code: "ELEC" } });

    // 2. Create / setup test users
    citizenUser = await prisma.user.upsert({
      where: { email: "phase6_citizen@example.com" },
      update: {},
      create: {
        name: "Phase 6 Citizen",
        email: "phase6_citizen@example.com",
        password_hash: "hashedpassword",
        role: "CITIZEN",
      },
    });
    citizenToken = generateToken(citizenUser);

    waterOfficerUser = await prisma.user.upsert({
      where: { email: "phase6_water_officer@example.com" },
      update: { department_id: waterDept.id },
      create: {
        name: "Water Officer",
        email: "phase6_water_officer@example.com",
        password_hash: "hashedpassword",
        role: "OFFICER",
        department_id: waterDept.id,
      },
    });
    waterOfficerToken = generateToken(waterOfficerUser);

    electricityOfficerUser = await prisma.user.upsert({
      where: { email: "phase6_elec_officer@example.com" },
      update: { department_id: elecDept.id },
      create: {
        name: "Electricity Officer",
        email: "phase6_elec_officer@example.com",
        password_hash: "hashedpassword",
        role: "OFFICER",
        department_id: elecDept.id,
      },
    });
    electricityOfficerToken = generateToken(electricityOfficerUser);

    unassignedOfficerUser = await prisma.user.upsert({
      where: { email: "phase6_unassigned_officer@example.com" },
      update: { department_id: null },
      create: {
        name: "Unassigned Officer",
        email: "phase6_unassigned_officer@example.com",
        password_hash: "hashedpassword",
        role: "OFFICER",
        department_id: null,
      },
    });
    unassignedOfficerToken = generateToken(unassignedOfficerUser);

    adminUser = await prisma.user.upsert({
      where: { email: "phase6_admin@example.com" },
      update: {},
      create: {
        name: "Phase 6 Admin",
        email: "phase6_admin@example.com",
        password_hash: "hashedpassword",
        role: "ADMIN",
      },
    });
    adminToken = generateToken(adminUser);

    // 3. Create test grievances
    const gWater = await prisma.grievance.create({
      data: {
        grievance_number: `GRV-TEST-P6-W-${Date.now()}`,
        user_id: citizenUser.id,
        original_text: "Water supply pipeline broken in test sector.",
        detected_language: "English",
        translated_text: "Water supply pipeline broken in test sector.",
        category: "Water Supply",
        priority: "HIGH",
        department_id: waterDept.id,
        status: "SUBMITTED",
      },
    });
    waterGrievanceId = gWater.id;

    await prisma.grievanceStatusHistory.create({
      data: {
        grievance_id: waterGrievanceId,
        status: "SUBMITTED",
        remarks: "Grievance submitted successfully",
        changed_by: citizenUser.id,
      },
    });

    const gElec = await prisma.grievance.create({
      data: {
        grievance_number: `GRV-TEST-P6-E-${Date.now()}`,
        user_id: citizenUser.id,
        original_text: "Power grid failure on main boulevard.",
        detected_language: "English",
        translated_text: "Power grid failure on main boulevard.",
        category: "Electricity",
        priority: "CRITICAL",
        department_id: elecDept.id,
        status: "SUBMITTED",
      },
    });
    elecGrievanceId = gElec.id;

    await prisma.grievanceStatusHistory.create({
      data: {
        grievance_id: elecGrievanceId,
        status: "SUBMITTED",
        remarks: "Grievance submitted successfully",
        changed_by: citizenUser.id,
      },
    });
  });

  after(async () => {
    // Cleanup test data
    const userIds = [
      citizenUser.id,
      waterOfficerUser.id,
      electricityOfficerUser.id,
      unassignedOfficerUser.id,
      adminUser.id,
    ];
    await prisma.grievanceStatusHistory.deleteMany({
      where: { grievance_id: { in: [waterGrievanceId, elecGrievanceId] } },
    });
    await prisma.grievance.deleteMany({
      where: { id: { in: [waterGrievanceId, elecGrievanceId] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: userIds } },
    });
    await prisma.$disconnect();
  });

  describe("1. Officer Authentication & Department RBAC Controls", () => {
    it("1. Unauthenticated officer request returns 401", async () => {
      const res = await request.get("/api/v1/officer/grievances");
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    it("2. Citizen accessing officer endpoint returns 403", async () => {
      const res = await request
        .get("/api/v1/officer/grievances")
        .set("Authorization", `Bearer ${citizenToken}`);

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
    });

    it("3. Officer can list grievances for their own assigned department", async () => {
      const res = await request
        .get("/api/v1/officer/grievances")
        .set("Authorization", `Bearer ${waterOfficerToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));

      const ids = res.body.data.map((g) => g.id);
      assert.ok(ids.includes(waterGrievanceId));
      assert.ok(!ids.includes(elecGrievanceId)); // 4. Does not list other department's grievance
    });

    it("5. Officer can view single grievance in their department", async () => {
      const res = await request
        .get(`/api/v1/officer/grievances/${waterGrievanceId}`)
        .set("Authorization", `Bearer ${waterOfficerToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.id, waterGrievanceId);
      assert.equal(res.body.data.department.code, "WS");
    });

    it("6. Officer CANNOT view grievance belonging to another department (404)", async () => {
      const res = await request
        .get(`/api/v1/officer/grievances/${elecGrievanceId}`)
        .set("Authorization", `Bearer ${waterOfficerToken}`);

      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
      assert.equal(res.body.message, "Grievance not found");
    });

    it("Unassigned officer request returns 400", async () => {
      const res = await request
        .get("/api/v1/officer/grievances")
        .set("Authorization", `Bearer ${unassignedOfficerToken}`);

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /not assigned/i);
    });
  });

  describe("2. Officer Status Transition & History Updates", () => {
    it("7 & 10 & 11. Officer can update status (SUBMITTED -> UNDER_REVIEW) creating status history with changed_by = officer.id", async () => {
      const res = await request
        .patch(`/api/v1/officer/grievances/${waterGrievanceId}/status`)
        .set("Authorization", `Bearer ${waterOfficerToken}`)
        .send({
          status: "UNDER_REVIEW",
          remarks: "Water supply complaint under officer review.",
          changed_by: "SPOOFED_ID_SHOULD_BE_IGNORED", // 21. Attempt spoof
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.status, "UNDER_REVIEW");

      // Verify status history
      const history = await prisma.grievanceStatusHistory.findMany({
        where: { grievance_id: waterGrievanceId },
        orderBy: { created_at: "asc" },
      });

      assert.equal(history.length, 2);
      const latest = history[history.length - 1];
      assert.equal(latest.status, "UNDER_REVIEW");
      assert.equal(latest.remarks, "Water supply complaint under officer review.");
      assert.equal(latest.changed_by, waterOfficerUser.id); // 21. Verify spoofing blocked
    });

    it("8. Officer cannot perform invalid status transition (e.g. SUBMITTED or identical status)", async () => {
      // Identical status
      const sameRes = await request
        .patch(`/api/v1/officer/grievances/${waterGrievanceId}/status`)
        .set("Authorization", `Bearer ${waterOfficerToken}`)
        .send({ status: "UNDER_REVIEW", remarks: "Duplicate status" });

      assert.equal(sameRes.status, 400);
      assert.equal(sameRes.body.success, false);
      assert.match(sameRes.body.message, /already in status/i);

      // Revert to SUBMITTED
      const subRes = await request
        .patch(`/api/v1/officer/grievances/${waterGrievanceId}/status`)
        .set("Authorization", `Bearer ${waterOfficerToken}`)
        .send({ status: "SUBMITTED", remarks: "Reverting" });

      assert.equal(subRes.status, 400);
      assert.equal(subRes.body.success, false);
      assert.match(subRes.body.message, /cannot revert/i);
    });

    it("9. Officer CANNOT modify status of a grievance from another department (404)", async () => {
      const res = await request
        .patch(`/api/v1/officer/grievances/${elecGrievanceId}/status`)
        .set("Authorization", `Bearer ${waterOfficerToken}`)
        .send({ status: "IN_PROGRESS", remarks: "Unauthorized attempt" });

      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
      assert.equal(res.body.message, "Grievance not found");
    });

    it("12. Resolving requires non-empty remarks (400 if missing/empty)", async () => {
      // First transition UNDER_REVIEW -> IN_PROGRESS
      await request
        .patch(`/api/v1/officer/grievances/${waterGrievanceId}/status`)
        .set("Authorization", `Bearer ${waterOfficerToken}`)
        .send({ status: "IN_PROGRESS", remarks: "Inspecting site" });

      // Attempt RESOLVED with empty remarks
      const res = await request
        .patch(`/api/v1/officer/grievances/${waterGrievanceId}/status`)
        .set("Authorization", `Bearer ${waterOfficerToken}`)
        .send({ status: "RESOLVED", remarks: "   " });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /remarks are required/i);
    });

    it("13. Rejecting requires non-empty remarks (400 if missing/empty)", async () => {
      const res = await request
        .patch(`/api/v1/officer/grievances/${elecGrievanceId}/status`)
        .set("Authorization", `Bearer ${electricityOfficerToken}`)
        .send({ status: "REJECTED", remarks: "" });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /remarks are required/i);
    });

    it("Terminal state transition protection (RESOLVED -> IN_PROGRESS is blocked)", async () => {
      // Resolve water grievance with remarks
      const resResolve = await request
        .patch(`/api/v1/officer/grievances/${waterGrievanceId}/status`)
        .set("Authorization", `Bearer ${waterOfficerToken}`)
        .send({ status: "RESOLVED", remarks: "Pipeline fixed successfully." });

      assert.equal(resResolve.status, 200);
      assert.equal(resResolve.body.data.status, "RESOLVED");

      // Attempt transition from RESOLVED -> IN_PROGRESS
      const resReopen = await request
        .patch(`/api/v1/officer/grievances/${waterGrievanceId}/status`)
        .set("Authorization", `Bearer ${waterOfficerToken}`)
        .send({ status: "IN_PROGRESS", remarks: "Trying to reopen" });

      assert.equal(resReopen.status, 400);
      assert.equal(resReopen.body.success, false);
      assert.match(resReopen.body.message, /invalid status transition/i);
    });
  });

  describe("3. Admin Workflows & Monitoring", () => {
    it("14. Unauthenticated admin request returns 401", async () => {
      const res = await request.get("/api/v1/admin/grievances");
      assert.equal(res.status, 401);
    });

    it("15. Citizen accessing admin endpoint returns 403", async () => {
      const res = await request
        .get("/api/v1/admin/grievances")
        .set("Authorization", `Bearer ${citizenToken}`);

      assert.equal(res.status, 403);
    });

    it("16. Officer accessing admin endpoint returns 403", async () => {
      const res = await request
        .get("/api/v1/admin/grievances")
        .set("Authorization", `Bearer ${waterOfficerToken}`);

      assert.equal(res.status, 403);
    });

    it("17 & 23. Admin can list ALL grievances across departments and password_hash is omitted", async () => {
      const res = await request
        .get("/api/v1/admin/grievances")
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));

      const ids = res.body.data.map((g) => g.id);
      assert.ok(ids.includes(waterGrievanceId));
      assert.ok(ids.includes(elecGrievanceId));

      // 23. Verify password_hash is not returned
      const str = JSON.stringify(res.body.data);
      assert.equal(str.includes("password_hash"), false);
    });

    it("18. Admin can view any grievance by ID", async () => {
      const res = await request
        .get(`/api/v1/admin/grievances/${waterGrievanceId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.data.id, waterGrievanceId);
    });

    it("19. Admin can filter grievances by department code/ID", async () => {
      const res = await request
        .get(`/api/v1/admin/departments/${elecDept.code}/grievances`)
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.department.code, "ELEC");
      const ids = res.body.data.map((g) => g.id);
      assert.ok(ids.includes(elecGrievanceId));
      assert.ok(!ids.includes(waterGrievanceId));
    });

    it("20. Admin status update works across any department", async () => {
      const res = await request
        .patch(`/api/v1/admin/grievances/${elecGrievanceId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "UNDER_REVIEW",
          remarks: "Admin initiated review for electricity complaint.",
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.status, "UNDER_REVIEW");
    });
  });

  describe("4. Security & Transaction Integrity", () => {
    it("24. Invalid grievance ID returns 404", async () => {
      const res = await request
        .get("/api/v1/admin/grievances/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
      assert.equal(res.body.message, "Grievance not found");
    });
  });
});

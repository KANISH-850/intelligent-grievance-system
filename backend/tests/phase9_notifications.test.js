const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const supertest = require("supertest");
const app = require("../src/app");
const { prisma } = require("../src/config/database");
const { generateToken } = require("../src/utils/jwt");

const request = supertest(app);

describe("Phase 9 — Notification System & Workflow Integration APIs", () => {
  let citizenToken = "";
  let citizen2Token = "";
  let officerToken = "";

  let citizenUser = null;
  let citizen2User = null;
  let officerUser = null;

  let testDept = null;
  let createdGrievanceId = "";
  let createdGrievanceNum = "";
  let testNotificationId = "";

  before(async () => {
    // 1. Create unique test department
    testDept = await prisma.department.create({
      data: {
        name: "P9 Notifications Dept",
        code: `P9NOTIF_${Date.now()}`,
        description: "Phase 9 Test Department",
      },
    });

    // 2. Register Citizen 1
    const citizenEmail = `p9_citizen1_${Date.now()}@example.com`;
    const citRes = await request.post("/api/v1/auth/register").send({
      name: "P9 Citizen One",
      email: citizenEmail,
      password: "Password@123",
    });
    citizenToken = citRes.body.token;
    citizenUser = citRes.body.user;

    // 3. Register Citizen 2
    const citizen2Email = `p9_citizen2_${Date.now()}@example.com`;
    const cit2Res = await request.post("/api/v1/auth/register").send({
      name: "P9 Citizen Two",
      email: citizen2Email,
      password: "Password@123",
    });
    citizen2Token = cit2Res.body.token;
    citizen2User = cit2Res.body.user;

    // 4. Create Officer User assigned to testDept
    const officerEmail = `p9_officer_${Date.now()}@example.com`;
    officerUser = await prisma.user.create({
      data: {
        name: "P9 Officer",
        email: officerEmail,
        password_hash: "hash",
        role: "OFFICER",
        department_id: testDept.id,
      },
    });
    officerToken = generateToken(officerUser);
  });

  after(async () => {
    // Cleanup test data
    if (createdGrievanceId) {
      await prisma.notification.deleteMany({ where: { grievance_id: createdGrievanceId } });
      await prisma.grievanceStatusHistory.deleteMany({ where: { grievance_id: createdGrievanceId } });
      await prisma.grievance.delete({ where: { id: createdGrievanceId } }).catch(() => {});
    }

    const userIds = [citizenUser?.id, citizen2User?.id, officerUser?.id].filter(Boolean);
    if (userIds.length > 0) {
      await prisma.notification.deleteMany({ where: { user_id: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }

    if (testDept?.id) await prisma.department.delete({ where: { id: testDept.id } }).catch(() => {});
  });

  describe("1. Notification Access & Security", () => {
    it("Unauthenticated GET /api/v1/notifications should return 401", async () => {
      const res = await request.get("/api/v1/notifications");
      assert.equal(res.status, 401);
    });

    it("Authenticated Citizen can fetch their notifications list and unread count", async () => {
      const res = await request
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${citizenToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(typeof res.body.unreadCount === "number");
    });
  });

  describe("2. Workflow Event Notification Generation", () => {
    it("Citizen grievance submission creates citizen notification", async () => {
      // Mock AI service is used or live endpoint. Submit grievance
      const subRes = await request
        .post("/api/v1/grievances")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send({ text: "Sanitation waste overflow near water tank area in locality" });

      assert.equal(subRes.status, 201);
      createdGrievanceId = subRes.body.data.id;
      createdGrievanceNum = subRes.body.data.grievance_number;

      // Fetch Citizen 1 notifications
      const notifRes = await request
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${citizenToken}`);

      assert.equal(notifRes.status, 200);
      const found = notifRes.body.data.find((n) => n.grievance_id === createdGrievanceId);
      assert.ok(found, "Notification for submitted grievance should exist");
      assert.equal(found.type, "GRIEVANCE_SUBMITTED");
      assert.ok(found.message.includes(createdGrievanceNum));
      assert.equal(found.is_read, false);
      testNotificationId = found.id;
    });

    it("Marking single notification as read updates state", async () => {
      assert.ok(testNotificationId, "Test notification ID required");

      const readRes = await request
        .patch(`/api/v1/notifications/${testNotificationId}/read`)
        .set("Authorization", `Bearer ${citizenToken}`);

      assert.equal(readRes.status, 200);
      assert.equal(readRes.body.success, true);
      assert.equal(readRes.body.data.is_read, true);
    });

    it("User CANNOT mark another user's notification as read (404/403 security isolation)", async () => {
      const readRes = await request
        .patch(`/api/v1/notifications/${testNotificationId}/read`)
        .set("Authorization", `Bearer ${citizen2Token}`);

      assert.equal(readRes.status, 404);
    });

    it("Officer updating status creates citizen notification (STATUS_CHANGED / RESOLVED)", async () => {
      // Create a grievance directly assigned to officer's department
      const grv = await prisma.grievance.create({
        data: {
          grievance_number: `GRV-2026-P9${Date.now().toString().slice(-4)}`,
          user_id: citizenUser.id,
          original_text: "Water supply pipeline leakage near market street",
          detected_language: "English",
          translated_text: "Water supply pipeline leakage near market street",
          category: "Water Supply",
          priority: "HIGH",
          department_id: testDept.id,
          status: "IN_PROGRESS",
        },
      });

      // Officer updates status to RESOLVED
      const updateRes = await request
        .patch(`/api/v1/officer/grievances/${grv.id}/status`)
        .set("Authorization", `Bearer ${officerToken}`)
        .send({ status: "RESOLVED", remarks: "Repaired pipeline and restored supply" });

      assert.equal(updateRes.status, 200);

      // Verify citizen received RESOLVED notification
      const notifRes = await request
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${citizenToken}`);

      assert.equal(notifRes.status, 200);
      const notif = notifRes.body.data.find((n) => n.grievance_id === grv.id);
      assert.ok(notif, "Resolution notification should be created");
      assert.equal(notif.type, "GRIEVANCE_RESOLVED");
      assert.ok(notif.message.includes("RESOLVED"));

      // Cleanup temp grievance
      await prisma.notification.deleteMany({ where: { grievance_id: grv.id } });
      await prisma.grievanceStatusHistory.deleteMany({ where: { grievance_id: grv.id } });
      await prisma.grievance.delete({ where: { id: grv.id } });
    });

    it("Marking all notifications as read updates all unread items", async () => {
      const markAllRes = await request
        .patch("/api/v1/notifications/read-all")
        .set("Authorization", `Bearer ${citizenToken}`);

      assert.equal(markAllRes.status, 200);
      assert.equal(markAllRes.body.success, true);

      const notifRes = await request
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${citizenToken}`);

      assert.equal(notifRes.body.unreadCount, 0);
    });
  });
});

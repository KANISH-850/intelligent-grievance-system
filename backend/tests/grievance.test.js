const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const supertest = require("supertest");
const app = require("../src/app");
const { prisma } = require("../src/config/database");
const { generateToken } = require("../src/utils/jwt");
const aiService = require("../src/services/ai.service");

const request = supertest(app);

describe("Phase 5 — Grievance API & AI Integration Test Suite", () => {
  let citizen1Token;
  let citizen1User;
  let citizen2Token;
  let citizen2User;
  let officerToken;
  let officerUser;
  let waterDepartment;
  let createdGrievanceId;
  const originalAnalyzeGrievance = aiService.analyzeGrievance;

  before(async () => {
    // 1. Fetch or create test department
    waterDepartment = await prisma.department.findFirst({
      where: { code: "WS" },
    });

    if (!waterDepartment) {
      waterDepartment = await prisma.department.create({
        data: {
          name: "Water Supply",
          code: "WS",
          description: "Water supply department",
        },
      });
    }

    // 2. Fetch or create test users
    // Citizen 1
    citizen1User = await prisma.user.upsert({
      where: { email: "test_citizen1@example.com" },
      update: {},
      create: {
        name: "Test Citizen One",
        email: "test_citizen1@example.com",
        password_hash: "hashedpassword",
        role: "CITIZEN",
      },
    });
    citizen1Token = generateToken(citizen1User);

    // Citizen 2
    citizen2User = await prisma.user.upsert({
      where: { email: "test_citizen2@example.com" },
      update: {},
      create: {
        name: "Test Citizen Two",
        email: "test_citizen2@example.com",
        password_hash: "hashedpassword",
        role: "CITIZEN",
      },
    });
    citizen2Token = generateToken(citizen2User);

    // Officer
    officerUser = await prisma.user.upsert({
      where: { email: "test_officer@example.com" },
      update: {},
      create: {
        name: "Test Officer",
        email: "test_officer@example.com",
        password_hash: "hashedpassword",
        role: "OFFICER",
      },
    });
    officerToken = generateToken(officerUser);
  });

  after(async () => {
    // Restore AI service method
    aiService.analyzeGrievance = originalAnalyzeGrievance;

    // Cleanup created test grievances & status histories
    await prisma.grievanceStatusHistory.deleteMany({
      where: {
        changed_by: { in: [citizen1User.id, citizen2User.id] },
      },
    });
    await prisma.grievance.deleteMany({
      where: {
        user_id: { in: [citizen1User.id, citizen2User.id] },
      },
    });
    await prisma.$disconnect();
  });

  describe("1. Authentication & Role Controls", () => {
    it("should reject grievance submission without JWT token (401)", async () => {
      const res = await request
        .post("/api/v1/grievances")
        .send({ text: "There has been no water supply for 3 days." });

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    it("should reject grievance submission from non-CITIZEN role e.g. OFFICER (403)", async () => {
      const res = await request
        .post("/api/v1/grievances")
        .set("Authorization", `Bearer ${officerToken}`)
        .send({ text: "There has been no water supply for 3 days." });

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
    });
  });

  describe("2. Request Input Validation", () => {
    it("should return 400 when text is missing", async () => {
      const res = await request
        .post("/api/v1/grievances")
        .set("Authorization", `Bearer ${citizen1Token}`)
        .send({});

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /required/i);
    });

    it("should return 400 when text is empty or whitespace", async () => {
      const res = await request
        .post("/api/v1/grievances")
        .set("Authorization", `Bearer ${citizen1Token}`)
        .send({ text: "   " });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /empty/i);
    });

    it("should return 400 when text is less than 3 characters", async () => {
      const res = await request
        .post("/api/v1/grievances")
        .set("Authorization", `Bearer ${citizen1Token}`)
        .send({ text: "Hi" });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /short/i);
    });

    it("should return 400 when text exceeds 5000 characters", async () => {
      const longText = "A".repeat(5001);
      const res = await request
        .post("/api/v1/grievances")
        .set("Authorization", `Bearer ${citizen1Token}`)
        .send({ text: longText });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /exceeds/i);
    });
  });

  describe("3. AI Microservice Integration & Failure Handling", () => {
    it("should return 503 Service Unavailable when AI microservice fails", async () => {
      // Mock AI service to throw error
      aiService.analyzeGrievance = async () => {
        const err = new Error("AI grievance analysis service is currently unavailable");
        err.statusCode = 503;
        throw err;
      };

      const res = await request
        .post("/api/v1/grievances")
        .set("Authorization", `Bearer ${citizen1Token}`)
        .send({ text: "There has been no water supply for 3 days." });

      assert.equal(res.status, 503);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /unavailable/i);
    });

    it("should successfully process grievance when AI microservice succeeds", async () => {
      // Mock AI service to return valid analysis
      aiService.analyzeGrievance = async (text) => {
        return {
          language: "English",
          translated_text: text,
          category: "Water Supply",
          category_confidence: 0.95,
          priority: "HIGH",
          priority_confidence: 0.90,
          department: "Water Supply",
          processing_time_ms: 12.5,
        };
      };

      const res = await request
        .post("/api/v1/grievances")
        .set("Authorization", `Bearer ${citizen1Token}`)
        .send({ text: "There has been no water supply in our area for three days." });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.message, "Grievance submitted successfully");

      const g = res.body.data;
      createdGrievanceId = g.id;
      assert.ok(g.id);
      assert.match(g.grievance_number, /^GRV-\d{4}-\d{6}$/);
      assert.equal(g.original_text, "There has been no water supply in our area for three days.");
      assert.equal(g.detected_language, "English");
      assert.equal(g.translated_text, "There has been no water supply in our area for three days.");
      assert.equal(g.category, "Water Supply");
      assert.equal(g.priority, "HIGH");
      assert.equal(g.status, "SUBMITTED");
      assert.equal(g.department.name, "Water Supply");

      // Verify Status History created transactionally in DB
      const history = await prisma.grievanceStatusHistory.findMany({
        where: { grievance_id: g.id },
      });
      assert.equal(history.length, 1);
      assert.equal(history[0].status, "SUBMITTED");
      assert.equal(history[0].remarks, "Grievance submitted successfully");
      assert.equal(history[0].changed_by, citizen1User.id);
    });
  });

  describe("4. Grievance Retrieval & Citizen Ownership Protection", () => {
    it("should allow Citizen 1 to list their own grievances", async () => {
      const res = await request
        .get("/api/v1/grievances")
        .set("Authorization", `Bearer ${citizen1Token}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.data.length >= 1);
      const found = res.body.data.find((g) => g.id === createdGrievanceId);
      assert.ok(found);
    });

    it("should NOT return Citizen 1's grievance to Citizen 2", async () => {
      const res = await request
        .get("/api/v1/grievances")
        .set("Authorization", `Bearer ${citizen2Token}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      const found = res.body.data.find((g) => g.id === createdGrievanceId);
      assert.equal(found, undefined);
    });

    it("should allow Citizen 1 to view their single grievance details with status history", async () => {
      const res = await request
        .get(`/api/v1/grievances/${createdGrievanceId}`)
        .set("Authorization", `Bearer ${citizen1Token}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.id, createdGrievanceId);
      assert.ok(Array.isArray(res.body.data.status_history));
      assert.equal(res.body.data.status_history.length, 1);
      assert.equal(res.body.data.status_history[0].status, "SUBMITTED");
    });

    it("should return 404 when Citizen 2 attempts to view Citizen 1's grievance", async () => {
      const res = await request
        .get(`/api/v1/grievances/${createdGrievanceId}`)
        .set("Authorization", `Bearer ${citizen2Token}`);

      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
      assert.equal(res.body.message, "Grievance not found");
    });

    it("should return 404 for non-existent grievance ID", async () => {
      const res = await request
        .get("/api/v1/grievances/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${citizen1Token}`);

      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
      assert.equal(res.body.message, "Grievance not found");
    });
  });
});

const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const supertest = require("supertest");
const app = require("../src/app");
const { prisma } = require("../src/config/database");
const { generateToken } = require("../src/utils/jwt");
const aiService = require("../src/services/ai.service");

const request = supertest(app);

describe("Phase 11 — Realistic AI Validation, Explainability & Production Hardening", () => {
  let citizenUser;
  let officerUser;
  let adminUser;
  let citizenToken;
  let officerToken;
  let adminToken;
  let testDept;
  let createdGrievanceId;
  const originalAnalyzeGrievance = aiService.analyzeGrievance;

  before(async () => {
    // Mock aiService for unit testing
    aiService.analyzeGrievance = async (text) => {
      const isLowConf = text.includes("lowconf");
      return {
        language: "English",
        translated_text: text,
        category: "Water Supply",
        category_confidence: isLowConf ? 0.60 : 0.92,
        confidence_level: isLowConf ? "MEDIUM" : "HIGH",
        ai_review_required: isLowConf,
        classification_method: "tfidf_logistic_regression",
        model_used: "tfidf-logistic-regression",
        explanation_terms: ["water", "supply"],
        priority: "HIGH",
        priority_confidence: 0.88,
        department: "Water Supply",
        processing_time_ms: 4.2,
      };
    };

    // Setup test department
    testDept = await prisma.department.findFirst({ where: { code: "WS" } });
    if (!testDept) {
      testDept = await prisma.department.create({
        data: {
          name: "Water Supply",
          code: "WS",
          description: "Phase 11 Test Water Department",
        },
      });
    }

    // Create test users
    citizenUser = await prisma.user.create({
      data: {
        name: "Phase 11 Citizen",
        email: `citizen_p11_${Date.now()}@gov.in`,
        password_hash: "hashedpass123",
        role: "CITIZEN",
      },
    });

    officerUser = await prisma.user.create({
      data: {
        name: "Phase 11 Officer",
        email: `officer_p11_${Date.now()}@gov.in`,
        password_hash: "hashedpass123",
        role: "OFFICER",
        department_id: testDept.id,
      },
    });

    adminUser = await prisma.user.create({
      data: {
        name: "Phase 11 Admin",
        email: `admin_p11_${Date.now()}@gov.in`,
        password_hash: "hashedpass123",
        role: "ADMIN",
      },
    });

    citizenToken = generateToken(citizenUser);
    officerToken = generateToken(officerUser);
    adminToken = generateToken(adminUser);
  });

  after(async () => {
    aiService.analyzeGrievance = originalAnalyzeGrievance;

    // Cleanup test records
    await prisma.notification.deleteMany({
      where: { user_id: { in: [citizenUser.id, officerUser.id, adminUser.id] } },
    });
    if (createdGrievanceId) {
      await prisma.grievanceStatusHistory.deleteMany({ where: { grievance_id: createdGrievanceId } });
      await prisma.grievance.deleteMany({ where: { id: createdGrievanceId } });
    }
    await prisma.user.deleteMany({
      where: { id: { in: [citizenUser.id, officerUser.id, adminUser.id] } },
    });
  });

  test("1. Submitting grievance stores Phase 11 AI confidence, review status, method & explanation terms", async () => {
    const res = await request
      .post("/api/v1/grievances")
      .set("Authorization", `Bearer ${citizenToken}`)
      .send({ text: "No water supply in Ward 12 for past three days due to broken pipeline" });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.id);
    createdGrievanceId = res.body.data.id;

    assert.strictEqual(typeof res.body.data.ai_confidence, "number");
    assert.ok(["HIGH", "MEDIUM", "LOW"].includes(res.body.data.ai_confidence_level));
    assert.strictEqual(typeof res.body.data.ai_review_required, "boolean");
    assert.ok(Array.isArray(res.body.data.ai_explanation_terms));
  });

  test("2. Input validation rejects grievance with text shorter than 5 characters", async () => {
    const shortRes = await request
      .post("/api/v1/grievances")
      .set("Authorization", `Bearer ${citizenToken}`)
      .send({ text: "Wtr" });

    assert.strictEqual(shortRes.status, 400);
    assert.strictEqual(shortRes.body.success, false);
  });

  test("3. Citizen cannot call Admin Classification Correction (403 Forbidden)", async () => {
    const res = await request
      .patch(`/api/v1/admin/grievances/${createdGrievanceId}/classification`)
      .set("Authorization", `Bearer ${citizenToken}`)
      .send({ category: "Electricity", remarks: "Attempted edit" });

    assert.strictEqual(res.status, 403);
  });

  test("4. Officer cannot call Admin Classification Correction (403 Forbidden)", async () => {
    const res = await request
      .patch(`/api/v1/admin/grievances/${createdGrievanceId}/classification`)
      .set("Authorization", `Bearer ${officerToken}`)
      .send({ category: "Electricity", remarks: "Attempted edit" });

    assert.strictEqual(res.status, 403);
  });

  test("5. Admin correcting classification with invalid category is rejected (400 Bad Request)", async () => {
    const res = await request
      .patch(`/api/v1/admin/grievances/${createdGrievanceId}/classification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ category: "NonExistentCategory", remarks: "Invalid" });

    assert.strictEqual(res.status, 400);
  });

  test("6. Admin successfully corrects classification and updates routing", async () => {
    const res = await request
      .patch(`/api/v1/admin/grievances/${createdGrievanceId}/classification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ category: "Electricity", remarks: "Reclassified after human verification" });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.category, "Electricity");
    assert.strictEqual(res.body.data.is_human_corrected, true);
    assert.strictEqual(res.body.data.ai_review_required, false);
    assert.strictEqual(res.body.data.human_corrected_by, adminUser.id);
  });

  test("7. Admin can retrieve AI performance and review analytics (GET /api/v1/admin/analytics/ai)", async () => {
    const res = await request
      .get("/api/v1/admin/analytics/ai")
      .set("Authorization", `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(typeof res.body.data.total_predictions, "number");
    assert.ok(res.body.data.confidence_distribution);
    assert.ok(typeof res.body.data.human_corrected_count, "number");
  });
});

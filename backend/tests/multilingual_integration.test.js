const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const request = require("supertest");
const app = require("../src/app");
const { prisma } = require("../src/config/database");
const { generateToken } = require("../src/utils/jwt");
const { JWT_SECRET } = require("../src/config/env");

describe("Multilingual Grievance Submission & Translation Integration Test Suite", () => {
  let citizenUser;
  let citizenToken;
  let officerUser;
  let officerToken;
  let adminUser;
  let adminToken;
  let waterDept;
  let electricityDept;
  let roadsDept;
  let sanitationDept;
  let otherDept;

  const testGrievanceIds = [];

  before(async () => {
    // 1. Ensure required departments exist
    waterDept = await prisma.department.upsert({
      where: { code: "WS" },
      update: {},
      create: { name: "Water Supply", code: "WS", description: "Water supply and sewage management" },
    });
    electricityDept = await prisma.department.upsert({
      where: { code: "ELEC" },
      update: {},
      create: { name: "Electricity", code: "ELEC", description: "Power distribution and street lighting" },
    });
    roadsDept = await prisma.department.upsert({
      where: { code: "RT" },
      update: {},
      create: { name: "Roads and Transport", code: "RT", description: "Road infrastructure and transport" },
    });
    sanitationDept = await prisma.department.upsert({
      where: { code: "SAN" },
      update: {},
      create: { name: "Sanitation", code: "SAN", description: "Garbage and public cleanliness" },
    });
    otherDept = await prisma.department.upsert({
      where: { code: "OTH" },
      update: {},
      create: { name: "Other", code: "OTH", description: "General grievances" },
    });

    // 2. Create test users
    const timestamp = Date.now();
    citizenUser = await prisma.user.create({
      data: {
        name: "Test Multilingual Citizen",
        email: `citizen_multi_${timestamp}@example.com`,
        password_hash: "hashed",
        role: "CITIZEN",
      },
    });
    citizenToken = generateToken(citizenUser);

    officerUser = await prisma.user.create({
      data: {
        name: "Test Water Officer",
        email: `officer_multi_${timestamp}@example.com`,
        password_hash: "hashed",
        role: "OFFICER",
        department_id: waterDept.id,
      },
    });
    officerToken = generateToken(officerUser);

    adminUser = await prisma.user.create({
      data: {
        name: "Test Admin",
        email: `admin_multi_${timestamp}@example.com`,
        password_hash: "hashed",
        role: "ADMIN",
      },
    });
    adminToken = generateToken(adminUser);
  });

  after(async () => {
    // Cleanup created test records
    if (testGrievanceIds.length > 0) {
      await prisma.grievanceDepartmentAssignment.deleteMany({
        where: { grievance_id: { in: testGrievanceIds } },
      });
      await prisma.grievanceStatusHistory.deleteMany({
        where: { grievance_id: { in: testGrievanceIds } },
      });
      await prisma.notification.deleteMany({
        where: { grievance_id: { in: testGrievanceIds } },
      });
      await prisma.grievance.deleteMany({
        where: { id: { in: testGrievanceIds } },
      });
    }

    const userIds = [citizenUser?.id, officerUser?.id, adminUser?.id].filter(Boolean);
    if (userIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
  });

  // ── 1. Translation Preview Endpoint Tests ──
  test("Citizen can preview language detection and translation before submitting", async () => {
    const res = await request(app)
      .post("/api/v1/grievances/translate-preview")
      .set("Authorization", `Bearer ${citizenToken}`)
      .send({ text: "எங்கள் பகுதியில் கடந்த மூன்று நாட்களாக குடிநீர் வரவில்லை." });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.detected_language, "Tamil");
    assert.strictEqual(res.body.data.detected_language_code, "ta");
    assert.strictEqual(res.body.data.translation_status, "translated");
    assert.match(res.body.data.translated_text, /water/i);
  });

  test("Translation preview for English text returns passthrough status", async () => {
    const res = await request(app)
      .post("/api/v1/grievances/translate-preview")
      .set("Authorization", `Bearer ${citizenToken}`)
      .send({ text: "There has been no drinking water for three days in Indiranagar." });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.detected_language, "English");
    assert.strictEqual(res.body.data.detected_language_code, "en");
    assert.strictEqual(res.body.data.translation_status, "passthrough");
  });

  // ── 2. Full Multilingual Grievance Submission Matrix ──
  const submissionMatrix = [
    {
      lang: "Tamil",
      code: "ta",
      text: "எங்கள் பகுதியில் கடந்த மூன்று நாட்களாக குடிநீர் வரவில்லை.",
      expectedCat: "Water Supply",
      expectedDept: "Water Supply",
    },
    {
      lang: "Hindi",
      code: "hi",
      text: "हमारे इलाके में पिछले तीन दिनों से पानी नहीं आ रहा है।",
      expectedCat: "Water Supply",
      expectedDept: "Water Supply",
    },
    {
      lang: "Telugu",
      code: "te",
      text: "మా వీధిలో వీధి దీపాలు పనిచేయడం లేదు.",
      expectedCat: "Electricity",
      expectedDept: "Electricity",
    },
    {
      lang: "Kannada",
      code: "kn",
      text: "ನಮ್ಮ ರಸ್ತೆಯಲ್ಲಿ ದೊಡ್ಡ ಗುಂಡಿ ಇದೆ.",
      expectedCat: "Roads and Transport",
      expectedDept: "Roads and Transport",
    },
    {
      lang: "Bengali",
      code: "bn",
      text: "আমাদের এলাকায় রাস্তার আলো কাজ করছে না।",
      expectedCat: "Electricity",
      expectedDept: "Electricity",
    },
    {
      lang: "French",
      code: "fr",
      text: "Il n y a pas d eau potable dans notre quartier depuis trois jours.",
      expectedCat: "Water Supply",
      expectedDept: "Water Supply",
    },
    {
      lang: "English",
      code: "en",
      text: "Drinking water has not been available in our area for the last three days.",
      expectedCat: "Water Supply",
      expectedDept: "Water Supply",
    },
  ];

  for (const item of submissionMatrix) {
    test(`Submit grievance in ${item.lang} -> preserves original text, stores translation, routes via English`, async () => {
      const res = await request(app)
        .post("/api/v1/grievances")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send({ text: item.text });

      assert.strictEqual(res.status, 201, `Failed for ${item.lang}: ${JSON.stringify(res.body)}`);
      assert.strictEqual(res.body.success, true);
      const data = res.body.data;
      testGrievanceIds.push(data.id);

      // Verify response metadata
      assert.strictEqual(data.original_text, item.text, "Original text must be preserved verbatim");
      assert.strictEqual(data.detected_language, item.lang, "Language must match expected");
      assert.ok(data.translated_text, "Translated text must not be empty");
      assert.strictEqual(data.category, item.expectedCat, "Category must match translated meaning");

      // Verify PostgreSQL database persistence directly
      const dbRecord = await prisma.grievance.findUnique({
        where: { id: data.id },
      });
      assert.ok(dbRecord, "Database record must exist");
      assert.strictEqual(dbRecord.original_text, item.text, "DB original_text must match");
      assert.strictEqual(dbRecord.detected_language, item.lang, "DB detected_language must match");
      assert.ok(dbRecord.translated_text, "DB translated_text must exist");
      assert.ok(["translated", "passthrough"].includes(dbRecord.translation_status));
    });
  }

  // ── 3. Officer Dashboard View & Action ──
  test("Officer can view English translation by default and access original text", async () => {
    // Find the Tamil grievance submitted in the matrix
    const tamilGrievance = await prisma.grievance.findFirst({
      where: { detected_language: "Tamil", user_id: citizenUser.id },
      include: { department: true, assignments: true },
    });
    assert.ok(tamilGrievance, "Tamil grievance record must exist");

    const res = await request(app)
      .get(`/api/v1/officer/grievances/${tamilGrievance.id}`)
      .set("Authorization", `Bearer ${officerToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    const g = res.body.data;
    assert.strictEqual(g.detected_language, "Tamil");
    assert.strictEqual(g.original_text, "எங்கள் பகுதியில் கடந்த மூன்று நாட்களாக குடிநீர் வரவில்லை.");
    assert.strictEqual(g.translation_status, "translated");
    assert.ok(g.translated_text.toLowerCase().includes("water"));

    // Officer updates status
    const updateRes = await request(app)
      .patch(`/api/v1/officer/grievances/${tamilGrievance.id}/status`)
      .set("Authorization", `Bearer ${officerToken}`)
      .send({ status: "IN_PROGRESS", remarks: "Inspection team dispatched to the location." });

    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.body.data.status, "IN_PROGRESS");
  });

  // ── 4. Admin Dashboard View ──
  test("Admin can view complete multilingual metadata across all grievances", async () => {
    const res = await request(app)
      .get("/api/v1/admin/grievances")
      .set("Authorization", `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    const items = res.body.data;
    const hasMultilingual = items.some((item) => item.detected_language && item.detected_language !== "English");
    assert.ok(hasMultilingual, "Admin should see grievances with detected non-English languages");
  });

  // ── 5. Citizen Isolation and RBAC ──
  test("Citizen cannot access grievances submitted by other citizens", async () => {
    // Create citizen 2
    const citizen2 = await prisma.user.create({
      data: {
        name: "Citizen Two",
        email: `citizen2_${Date.now()}@example.com`,
        password_hash: "hashed",
        role: "CITIZEN",
      },
    });
    const citizen2Token = generateToken(citizen2);

    // Citizen 2 tries to access Citizen 1's grievance
    const firstGrievanceId = testGrievanceIds[0];
    const res = await request(app)
      .get(`/api/v1/grievances/${firstGrievanceId}`)
      .set("Authorization", `Bearer ${citizen2Token}`);

    assert.strictEqual(res.status, 404, "Citizen should receive 404 for another citizen's complaint");

    // Clean up citizen 2
    await prisma.user.delete({ where: { id: citizen2.id } });
  });

  // ── 6. Edge Cases ──
  test("Empty grievance text is rejected with 400", async () => {
    const res = await request(app)
      .post("/api/v1/grievances")
      .set("Authorization", `Bearer ${citizenToken}`)
      .send({ text: "   " });

    assert.strictEqual(res.status, 400);
  });

  test("Short text (<3 characters) is rejected with 400", async () => {
    const res = await request(app)
      .post("/api/v1/grievances")
      .set("Authorization", `Bearer ${citizenToken}`)
      .send({ text: "ok" });

    assert.strictEqual(res.status, 400);
  });

  test("Mixed Tamil and English text is successfully processed and routed", async () => {
    const res = await request(app)
      .post("/api/v1/grievances")
      .set("Authorization", `Bearer ${citizenToken}`)
      .send({ text: "Water problem in எங்கள் பகுதி since yesterday, please fix." });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.data.detected_language, "Tamil");
    assert.ok(["Water Supply", "Other"].includes(res.body.data.category));
    assert.ok(["ASSIGNED", "REVIEW_REQUIRED"].includes(res.body.data.routing_status));
    testGrievanceIds.push(res.body.data.id);
  });
});

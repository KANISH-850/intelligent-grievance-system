const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const supertest = require("supertest");
const path = require("path");
const fs = require("fs");
const app = require("../src/app");
const { prisma } = require("../src/config/database");
const { generateToken } = require("../src/utils/jwt");
const aiService = require("../src/services/ai.service");

const request = supertest(app);

const POSITIVE_DIR = path.resolve(__dirname, "../../test-images/positive");
const NEGATIVE_DIR = path.resolve(__dirname, "../../test-images/negative");
const TECHNICAL_DIR = path.resolve(__dirname, "../../test-images/technical");

describe("MASTER CV IMAGE UPLOAD TESTING — POSITIVE, NEGATIVE & TECHNICAL SUITE", () => {
  let citizenUser;
  let citizenToken;
  let otherCitizenUser;
  let otherCitizenToken;
  let officerUser;
  let officerToken;
  let unassignedOfficerUser;
  let unassignedOfficerToken;
  let adminUser;
  let adminToken;
  let roadsDept;
  let sanitationDept;
  let waterDept;
  let elecDept;
  let municipalDept;

  const createdGrievanceIds = [];

  before(async () => {
    // 1. Ensure required departments exist
    roadsDept = await prisma.department.upsert({
      where: { code: "RT" },
      update: {},
      create: { name: "Roads and Transport", code: "RT", description: "Roads and Transport Department" },
    });
    sanitationDept = await prisma.department.upsert({
      where: { code: "SAN" },
      update: {},
      create: { name: "Sanitation", code: "SAN", description: "Sanitation Department" },
    });
    waterDept = await prisma.department.upsert({
      where: { code: "WS" },
      update: {},
      create: { name: "Water Supply", code: "WS", description: "Water Supply Department" },
    });
    elecDept = await prisma.department.upsert({
      where: { code: "ELEC" },
      update: {},
      create: { name: "Electricity", code: "ELEC", description: "Electricity Department" },
    });
    municipalDept = await prisma.department.upsert({
      where: { code: "MS" },
      update: {},
      create: { name: "Municipal Services", code: "MS", description: "Municipal Services Department" },
    });

    // 2. Create distinct test users
    citizenUser = await prisma.user.upsert({
      where: { email: "cv_citizen_primary@test.com" },
      update: {},
      create: {
        name: "CV Primary Citizen",
        email: "cv_citizen_primary@test.com",
        password_hash: "hashed",
        role: "CITIZEN",
      },
    });
    citizenToken = generateToken(citizenUser);

    otherCitizenUser = await prisma.user.upsert({
      where: { email: "cv_citizen_other@test.com" },
      update: {},
      create: {
        name: "CV Other Citizen",
        email: "cv_citizen_other@test.com",
        password_hash: "hashed",
        role: "CITIZEN",
      },
    });
    otherCitizenToken = generateToken(otherCitizenUser);

    officerUser = await prisma.user.upsert({
      where: { email: "cv_officer_roads@test.com" },
      update: { department_id: roadsDept.id },
      create: {
        name: "CV Roads Officer",
        email: "cv_officer_roads@test.com",
        password_hash: "hashed",
        role: "OFFICER",
        department_id: roadsDept.id,
      },
    });
    officerToken = generateToken(officerUser);

    unassignedOfficerUser = await prisma.user.upsert({
      where: { email: "cv_officer_water@test.com" },
      update: { department_id: waterDept.id },
      create: {
        name: "CV Water Officer",
        email: "cv_officer_water@test.com",
        password_hash: "hashed",
        role: "OFFICER",
        department_id: waterDept.id,
      },
    });
    unassignedOfficerToken = generateToken(unassignedOfficerUser);

    adminUser = await prisma.user.upsert({
      where: { email: "cv_admin_super@test.com" },
      update: {},
      create: {
        name: "CV Super Admin",
        email: "cv_admin_super@test.com",
        password_hash: "hashed",
        role: "ADMIN",
      },
    });
    adminToken = generateToken(adminUser);
  });

  after(async () => {
    // Clean up created test grievances
    for (const gid of createdGrievanceIds) {
      await prisma.notification.deleteMany({ where: { grievance_id: gid } }).catch(() => {});
      await prisma.grievanceImage.deleteMany({ where: { grievance_id: gid } }).catch(() => {});
      await prisma.grievanceDepartmentAssignment.deleteMany({ where: { grievance_id: gid } }).catch(() => {});
      await prisma.grievanceStatusHistory.deleteMany({ where: { grievance_id: gid } }).catch(() => {});
      await prisma.grievance.delete({ where: { id: gid } }).catch(() => {});
    }
  });

  /* -------------------------------------------------------------
   * 1. PRE-SUBMISSION ANALYSIS ENDPOINT (Interactive Feedback)
   * ------------------------------------------------------------- */
  describe("1. Pre-Submission Image Analysis API", () => {
    it("should accept real image upload and return structured analysis result", async () => {
      const imgPath = path.join(POSITIVE_DIR, "P01_pothole.jpg");
      assert.ok(fs.existsSync(imgPath), "P01_pothole.jpg must exist");

      const res = await request
        .post("/api/v1/grievances/analyze-image")
        .set("Authorization", `Bearer ${citizenToken}`)
        .attach("image", imgPath);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data);
      assert.ok("analysis_status" in res.body.data);
      assert.ok("is_grievance_related" in res.body.data);
    });

    it("should reject pre-submission call without file (400 Bad Request)", async () => {
      const res = await request
        .post("/api/v1/grievances/analyze-image")
        .set("Authorization", `Bearer ${citizenToken}`);

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /no image file/i);
    });
  });

  /* -------------------------------------------------------------
   * 2. POSITIVE TEST IMAGES (P01 - P08)
   * ------------------------------------------------------------- */
  describe("2. Positive Civic Test Cases (P01 - P08)", () => {
    const positiveCases = [
      { id: "P01", file: "P01_pothole.jpg", issue: "Road damage", dept: "Roads and Transport", deptCode: "RT" },
      { id: "P02", file: "P02_garbage.jpg", issue: "Garbage/sanitation", dept: "Sanitation", deptCode: "SAN" },
      { id: "P03", file: "P03_water_leakage.jpg", issue: "Waterlogging/leakage", dept: "Water Supply", deptCode: "WS" },
      { id: "P04", file: "P04_blocked_drainage.jpg", issue: "Garbage/sanitation", dept: "Sanitation", deptCode: "SAN" },
      { id: "P05", file: "P05_broken_streetlight.jpg", issue: "Electrical infrastructure damage", dept: "Electricity", deptCode: "ELEC" },
      { id: "P06", file: "P06_waterlogging.jpg", issue: "Waterlogging/leakage", dept: "Municipal Services", deptCode: "MS" },
      { id: "P07", file: "P07_exposed_wires.jpg", issue: "Electrical infrastructure damage", dept: "Electricity", deptCode: "ELEC" },
      { id: "P08", file: "P08_damaged_infrastructure.jpg", issue: "Public infrastructure damage", dept: "Municipal Services", deptCode: "MS" },
    ];

    for (const tc of positiveCases) {
      it(`should successfully submit civic grievance with image ${tc.id} (${tc.file})`, async () => {
        const filePath = path.join(POSITIVE_DIR, tc.file);
        assert.ok(fs.existsSync(filePath), `File ${tc.file} must exist`);

        // Mock vision analysis to represent accurate detection for this positive defect
        aiService.analyzeImage = async () => ({
          analysis_status: "success",
          image_type: "civic_issue",
          is_grievance_related: true,
          issue_detected: true,
          detected_issue: tc.issue,
          issue_description: `Visual evidence of ${tc.issue}`,
          recommended_category: tc.dept,
          recommended_department: tc.dept,
          additional_departments: [],
          visual_observations: ["visible civic defect", "infrastructure damage"],
          confidence: 0.89,
          human_review_required: tc.id === "P06" || tc.id === "P07",
          citizen_message: `Identified ${tc.issue}.`,
        });

        const res = await request
          .post("/api/v1/grievances")
          .set("Authorization", `Bearer ${citizenToken}`)
          .field("text", `Automated civic test for ${tc.id}: ${tc.issue}`)
          .attach("images", filePath);

        assert.equal(res.status, 201, `Failed submitting for ${tc.id}: ${JSON.stringify(res.body)}`);
        assert.equal(res.body.success, true);
        const grievanceId = res.body.data.id;
        createdGrievanceIds.push(grievanceId);

        // Verify Database Records
        const dbGrievance = await prisma.grievance.findUnique({
          where: { id: grievanceId },
          include: { images: true, assignments: { include: { department: true } } },
        });

        assert.ok(dbGrievance, "Grievance must exist in DB");
        assert.equal(dbGrievance.images.length, 1, "Exactly one image must be attached");
        assert.equal(dbGrievance.images[0].detected_issue, tc.issue);
        assert.equal(dbGrievance.images[0].analysis_status, "success");
        assert.ok(dbGrievance.images[0].path, "Image storage path must be recorded");

        // Verify Department Assignment
        const primaryAssignment = dbGrievance.assignments.find((a) => a.department.code === tc.deptCode);
        assert.ok(primaryAssignment, `Department ${tc.deptCode} must be assigned to grievance`);
      });
    }
  });

  /* -------------------------------------------------------------
   * 3. NEGATIVE TEST IMAGES (N01 - N08)
   * ------------------------------------------------------------- */
  describe("3. Negative Test Cases (N01 - N08) — Unrelated Images", () => {
    const negativeCases = [
      { id: "N01", file: "N01_selfie.jpg", type: "selfie", message: "Photo appears to be a portrait." },
      { id: "N02", file: "N02_animal.jpg", type: "animal", message: "Photo appears to show an animal." },
      { id: "N03", file: "N03_food.jpg", type: "food", message: "Photo appears to show food." },
      { id: "N04", file: "N04_landscape.jpg", type: "landscape", message: "Photo appears to show a landscape." },
      { id: "N05", file: "N05_indoor_room.jpg", type: "indoor", message: "Photo appears to show an indoor room." },
      { id: "N06", file: "N06_screenshot.jpg", type: "screenshot", message: "Photo appears to be a screenshot." },
      { id: "N07", file: "N07_ordinary_vehicle.jpg", type: "vehicle", message: "Photo shows an ordinary vehicle." },
      { id: "N08", file: "N08_ordinary_building.jpg", type: "building", message: "Photo shows a regular building." },
    ];

    for (const tc of negativeCases) {
      it(`should REJECT image-only submission for unrelated image ${tc.id} (${tc.file}) with HTTP 400`, async () => {
        const filePath = path.join(NEGATIVE_DIR, tc.file);
        assert.ok(fs.existsSync(filePath), `File ${tc.file} must exist`);

        aiService.analyzeImage = async () => ({
          analysis_status: "success",
          image_type: "unrelated",
          is_grievance_related: false,
          issue_detected: false,
          detected_issue: null,
          issue_description: null,
          recommended_category: null,
          recommended_department: null,
          additional_departments: [],
          visual_observations: [tc.type],
          confidence: null,
          human_review_required: false,
          citizen_message: tc.message,
        });

        // Image-only submission with empty text
        const res = await request
          .post("/api/v1/grievances")
          .set("Authorization", `Bearer ${citizenToken}`)
          .field("text", "")
          .attach("images", filePath);

        assert.equal(res.status, 400, `Expected 400 rejection for ${tc.id}, got ${res.status}`);
        assert.equal(res.body.success, false);
        assert.ok(res.body.message.includes(tc.message) || res.body.message.includes("civic grievance"));

        // Verify NO false grievance record was created in PostgreSQL
        const count = await prisma.grievance.count({
          where: { original_text: { contains: tc.id } },
        });
        assert.equal(count, 0, "No grievance record should be created for unrelated image-only submission");
      });
    }
  });

  /* -------------------------------------------------------------
   * 4. WORKFLOW SCENARIOS (A - E)
   * ------------------------------------------------------------- */
  describe("4. Detailed Workflow Scenarios (A - E)", () => {
    it("Scenario A: Valid civic image only (empty text) creates synthesized grievance with LOW confidence & human review", async () => {
      const filePath = path.join(POSITIVE_DIR, "P01_pothole.jpg");
      aiService.analyzeImage = async () => ({
        analysis_status: "success",
        image_type: "civic_issue",
        is_grievance_related: true,
        issue_detected: true,
        detected_issue: "Road damage",
        issue_description: "Deep pothole on asphalt roadway",
        recommended_category: "Roads and Transport",
        recommended_department: "Roads and Transport",
        additional_departments: [],
        visual_observations: ["asphalt crater", "road defect"],
        confidence: null, // multimodal LLM does not provide token prob
        human_review_required: true,
        citizen_message: "Pothole detected.",
      });

      const res = await request
        .post("/api/v1/grievances")
        .set("Authorization", `Bearer ${citizenToken}`)
        .field("text", "") // Blank text
        .attach("images", filePath);

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      const gid = res.body.data.id;
      createdGrievanceIds.push(gid);

      const dbG = await prisma.grievance.findUnique({
        where: { id: gid },
        include: { images: true },
      });

      assert.match(dbG.original_text, /\[Visual Grievance Report\]/);
      assert.match(dbG.original_text, /Road damage/);
      assert.equal(dbG.ai_confidence, null, "Confidence must be null without calibrated basis");
      assert.equal(dbG.ai_confidence_level, "LOW");
      assert.equal(dbG.ai_review_required, true, "Human review must be required");
      assert.equal(dbG.routing_status, "REVIEW_REQUIRED");
    });

    it("Scenario B: Unrelated image only is strictly rejected (400) without database persistence", async () => {
      const filePath = path.join(NEGATIVE_DIR, "N01_selfie.jpg");
      aiService.analyzeImage = async () => ({
        analysis_status: "success",
        image_type: "unrelated",
        is_grievance_related: false,
        issue_detected: false,
        detected_issue: null,
        citizen_message: "The uploaded image appears to be a personal selfie.",
      });

      const res = await request
        .post("/api/v1/grievances")
        .set("Authorization", `Bearer ${citizenToken}`)
        .field("text", "")
        .attach("images", filePath);

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });

    it("Scenario C: Multimodal text + civic image combines evidence without duplicate assignments", async () => {
      const filePath = path.join(POSITIVE_DIR, "P01_pothole.jpg");
      aiService.analyzeGrievance = async () => ({
        language: "English",
        translated_text: "Severe pothole on Main Street causing traffic hazards.",
        category: "Roads and Transport",
        category_confidence: 0.91,
        confidence_level: "HIGH",
        ai_review_required: false,
        classification_method: "tfidf_logistic_regression",
        model_used: "tfidf-logistic-regression",
        explanation_terms: ["pothole", "street"],
        priority: "HIGH",
        priority_confidence: 0.85,
        department: "Roads and Transport",
        departments: [
          { department_name: "Roads and Transport", category: "Roads and Transport", confidence: 0.91, reason: "Text matched", source: "text" },
        ],
        processing_time_ms: 15,
      });

      aiService.analyzeImage = async () => ({
        analysis_status: "success",
        image_type: "civic_issue",
        is_grievance_related: true,
        issue_detected: true,
        detected_issue: "Road damage",
        recommended_category: "Roads and Transport",
        recommended_department: "Roads and Transport",
        additional_departments: [],
        visual_observations: ["asphalt fracture"],
        confidence: 0.88,
        human_review_required: false,
      });

      const res = await request
        .post("/api/v1/grievances")
        .set("Authorization", `Bearer ${citizenToken}`)
        .field("text", "Severe pothole on Main Street causing traffic hazards.")
        .attach("images", filePath);

      assert.equal(res.status, 201);
      const gid = res.body.data.id;
      createdGrievanceIds.push(gid);

      const assignments = await prisma.grievanceDepartmentAssignment.findMany({
        where: { grievance_id: gid },
      });
      assert.equal(assignments.length, 1, "Must NOT create duplicate department assignments for same department");
    });

    it("Scenario D: Conflicting text and image creates multi-department routing and flags human review", async () => {
      const filePath = path.join(POSITIVE_DIR, "P07_exposed_wires.jpg");
      aiService.analyzeGrievance = async () => ({
        language: "English",
        translated_text: "Large pile of uncollected garbage rotting on the pavement.",
        category: "Sanitation",
        category_confidence: 0.89,
        confidence_level: "HIGH",
        ai_review_required: false,
        classification_method: "tfidf_logistic_regression",
        model_used: "tfidf-logistic-regression",
        explanation_terms: ["garbage"],
        priority: "MEDIUM",
        priority_confidence: 0.80,
        department: "Sanitation",
        departments: [
          { department_name: "Sanitation", category: "Sanitation", confidence: 0.89, reason: "Text matched sanitation", source: "text" },
        ],
        processing_time_ms: 12,
      });

      aiService.analyzeImage = async () => ({
        analysis_status: "success",
        image_type: "civic_issue",
        is_grievance_related: true,
        issue_detected: true,
        detected_issue: "Electrical infrastructure damage",
        recommended_category: "Electricity",
        recommended_department: "Electricity",
        additional_departments: [],
        visual_observations: ["hanging live wire"],
        confidence: 0.90,
        human_review_required: true,
      });

      const res = await request
        .post("/api/v1/grievances")
        .set("Authorization", `Bearer ${citizenToken}`)
        .field("text", "Large pile of uncollected garbage rotting on the pavement.")
        .attach("images", filePath);

      assert.equal(res.status, 201);
      const gid = res.body.data.id;
      createdGrievanceIds.push(gid);

      const dbG = await prisma.grievance.findUnique({
        where: { id: gid },
        include: { assignments: { include: { department: true } } },
      });

      assert.equal(dbG.ai_review_required, true, "Conflicting multimodal evidence must flag human review");
      assert.equal(dbG.routing_status, "REVIEW_REQUIRED");
      assert.equal(dbG.assignments.length, 2, "Both text and image departments must be assigned");

      const deptCodes = dbG.assignments.map((a) => a.department.code);
      assert.ok(deptCodes.includes("SAN"), "Sanitation must be assigned");
      assert.ok(deptCodes.includes("ELEC"), "Electricity must be assigned");
    });

    it("Scenario E: Unclear blurry image triggers safe fallback without fabricated prediction", async () => {
      const filePath = path.join(TECHNICAL_DIR, "T06_blurry.jpg");
      aiService.analyzeImage = async () => ({
        analysis_status: "uncertain",
        image_type: "uncertain",
        is_grievance_related: false,
        issue_detected: false,
        detected_issue: null,
        visual_observations: ["low contrast", "blurred pixels"],
        confidence: null,
        human_review_required: true,
        citizen_message: "Image is blurry or unclear.",
      });

      const res = await request
        .post("/api/v1/grievances")
        .set("Authorization", `Bearer ${citizenToken}`)
        .field("text", "Vague report about something broken near the corner.")
        .attach("images", filePath);

      assert.equal(res.status, 201);
      const gid = res.body.data.id;
      createdGrievanceIds.push(gid);

      const dbG = await prisma.grievance.findUnique({
        where: { id: gid },
        include: { images: true },
      });

      assert.equal(dbG.images[0].analysis_status, "uncertain");
      assert.equal(dbG.images[0].detected_issue, null);
      assert.equal(dbG.images[0].analysis_confidence, null, "Must not fabricate a confidence score");
      assert.equal(dbG.images[0].human_review_required, true);
    });
  });

  /* -------------------------------------------------------------
   * 5. TECHNICAL EDGE CASES & VALIDATION
   * ------------------------------------------------------------- */
  describe("5. Technical Upload Constraints & Negative Validation", () => {
    it("should reject unsupported file extension (.txt)", async () => {
      const filePath = path.join(TECHNICAL_DIR, "T01_unsupported.txt");
      const res = await request
        .post("/api/v1/grievances")
        .set("Authorization", `Bearer ${citizenToken}`)
        .field("text", "Attempting to upload txt file")
        .attach("images", filePath);

      assert.equal(res.status, 400); // 400 Bad Request for upload validation errors
      assert.match(res.body.message, /unsupported file type/i);
    });

    it("should reject oversized image (> 5MB limit)", async () => {
      const filePath = path.join(TECHNICAL_DIR, "T04_oversized.jpg");
      assert.ok(fs.statSync(filePath).size > 5 * 1024 * 1024);

      const res = await request
        .post("/api/v1/grievances")
        .set("Authorization", `Bearer ${citizenToken}`)
        .field("text", "Attempting oversized image")
        .attach("images", filePath);

      assert.equal(res.status, 400); // 400 Bad Request for file size limit exceeded
      assert.match(res.body.message, /file too large/i);
    });

    it("should support multiple images within allowed maximum (3 files)", async () => {
      const img1 = path.join(POSITIVE_DIR, "P01_pothole.jpg");
      const img2 = path.join(POSITIVE_DIR, "P02_garbage.jpg");
      const img3 = path.join(POSITIVE_DIR, "P03_water_leakage.jpg");

      const res = await request
        .post("/api/v1/grievances")
        .set("Authorization", `Bearer ${citizenToken}`)
        .field("text", "Multiple civic defects observed along market street.")
        .attach("images", img1)
        .attach("images", img2)
        .attach("images", img3);

      assert.equal(res.status, 201);
      const gid = res.body.data.id;
      createdGrievanceIds.push(gid);

      const dbG = await prisma.grievance.findUnique({
        where: { id: gid },
        include: { images: true },
      });

      assert.equal(dbG.images.length, 3, "All 3 images must be persisted in database");
    });
  });

  /* -------------------------------------------------------------
   * 6. ROLE-BASED ACCESS CONTROL (RBAC) FOR ATTACHED IMAGES
   * ------------------------------------------------------------- */
  describe("6. Role-Based Image Access (RBAC)", () => {
    let testGrievanceId;
    let testImageId;

    before(async () => {
      aiService.analyzeGrievance = async () => ({
        language: "English",
        translated_text: "Pothole road hazard for RBAC test",
        category: "Roads and Transport",
        category_confidence: 0.92,
        confidence_level: "HIGH",
        ai_review_required: false,
        classification_method: "tfidf_logistic_regression",
        model_used: "tfidf-logistic-regression",
        explanation_terms: ["pothole"],
        priority: "HIGH",
        priority_confidence: 0.88,
        department: "Roads and Transport",
        departments: [
          { department_name: "Roads and Transport", category: "Roads and Transport", confidence: 0.92, reason: "Roads issue", source: "text" },
        ],
        processing_time_ms: 10,
      });

      const imgPath = path.join(POSITIVE_DIR, "P01_pothole.jpg");
      const res = await request
        .post("/api/v1/grievances")
        .set("Authorization", `Bearer ${citizenToken}`)
        .field("text", "Pothole road hazard for RBAC test")
        .attach("images", imgPath);

      assert.equal(res.status, 201);
      testGrievanceId = res.body.data.id;
      createdGrievanceIds.push(testGrievanceId);

      const dbG = await prisma.grievance.findUnique({
        where: { id: testGrievanceId },
        include: { images: true },
      });
      testImageId = dbG.images[0].id;
    });

    it("Citizen owner CAN access their uploaded image (200 OK)", async () => {
      const res = await request
        .get(`/api/v1/grievances/${testGrievanceId}/images/${testImageId}`)
        .set("Authorization", `Bearer ${citizenToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.header["content-type"], "image/jpeg");
    });

    it("Different citizen CANNOT access other citizen's image (404/403)", async () => {
      const res = await request
        .get(`/api/v1/grievances/${testGrievanceId}/images/${testImageId}`)
        .set("Authorization", `Bearer ${otherCitizenToken}`);

      assert.ok([403, 404].includes(res.status), `Expected 403 or 404, got ${res.status}`);
    });

    it("Assigned department officer CAN access the grievance image (200 OK)", async () => {
      const res = await request
        .get(`/api/v1/grievances/${testGrievanceId}/images/${testImageId}`)
        .set("Authorization", `Bearer ${officerToken}`);

      assert.equal(res.status, 200);
    });

    it("Unassigned department officer CANNOT access the image (403 Forbidden)", async () => {
      const res = await request
        .get(`/api/v1/grievances/${testGrievanceId}/images/${testImageId}`)
        .set("Authorization", `Bearer ${unassignedOfficerToken}`);

      assert.equal(res.status, 403);
    });

    it("Admin CAN access any grievance image (200 OK)", async () => {
      const res = await request
        .get(`/api/v1/grievances/${testGrievanceId}/images/${testImageId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
    });
  });
});

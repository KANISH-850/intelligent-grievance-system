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

describe("Phase 13 — Computer Vision & Multimodal Grievance Integration Suite", () => {
  let citizenUser;
  let citizenToken;
  let otherCitizenToken;
  let officerUser;
  let officerToken;
  let roadsDepartment;
  let sanitationDepartment;
  let testImagePath;

  const originalAnalyzeImage = aiService.analyzeImage;
  const originalAnalyzeGrievance = aiService.analyzeGrievance;

  before(async () => {
    // 1. Ensure test departments exist
    roadsDepartment = await prisma.department.upsert({
      where: { code: "RT" },
      update: {},
      create: { name: "Roads and Transport", code: "RT", description: "Roads and transit" },
    });

    sanitationDepartment = await prisma.department.upsert({
      where: { code: "SAN" },
      update: {},
      create: { name: "Sanitation", code: "SAN", description: "Sanitation and waste" },
    });

    await prisma.department.upsert({
      where: { code: "WS" },
      update: {},
      create: { name: "Water Supply", code: "WS", description: "Water Supply and pipeline" },
    });


    // 2. Users
    citizenUser = await prisma.user.upsert({
      where: { email: "vision_citizen@example.com" },
      update: {},
      create: {
        name: "Vision Citizen",
        email: "vision_citizen@example.com",
        password_hash: "hashedpass",
        role: "CITIZEN",
      },
    });
    citizenToken = generateToken(citizenUser);

    const otherUser = await prisma.user.upsert({
      where: { email: "vision_other@example.com" },
      update: {},
      create: {
        name: "Other Citizen",
        email: "vision_other@example.com",
        password_hash: "hashedpass",
        role: "CITIZEN",
      },
    });
    otherCitizenToken = generateToken(otherUser);

    officerUser = await prisma.user.upsert({
      where: { email: "vision_officer@example.com" },
      update: {},
      create: {
        name: "Vision Officer",
        email: "vision_officer@example.com",
        password_hash: "hashedpass",
        role: "OFFICER",
        department_id: roadsDepartment.id,
      },
    });
    officerToken = generateToken(officerUser);

    // Create a temporary valid test image file
    testImagePath = path.join(__dirname, "test_sample.png");
    // Minimal 1x1 valid PNG
    const pngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );
    fs.writeFileSync(testImagePath, pngBuffer);
  });

  after(async () => {
    aiService.analyzeImage = originalAnalyzeImage;
    aiService.analyzeGrievance = originalAnalyzeGrievance;
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
    // Cleanup test data
    await prisma.grievanceImage.deleteMany({
      where: { grievance: { user_id: { in: [citizenUser.id] } } },
    });
    await prisma.grievanceDepartmentAssignment.deleteMany({
      where: { grievance: { user_id: { in: [citizenUser.id] } } },
    });
    await prisma.grievanceStatusHistory.deleteMany({
      where: { grievance: { user_id: { in: [citizenUser.id] } } },
    });
    await prisma.notification.deleteMany({
      where: { user_id: { in: [citizenUser.id] } },
    });
    await prisma.grievance.deleteMany({
      where: { user_id: { in: [citizenUser.id] } },
    });
  });

  it("1. Pre-submission image analysis endpoint should return structured civic analysis", async () => {
    aiService.analyzeImage = async () => ({
      analysis_status: "analyzed",
      image_type: "civic_issue",
      is_grievance_related: true,
      issue_detected: true,
      detected_issue: "Road damage",
      issue_description: "A large pothole with broken asphalt on a public roadway.",
      recommended_category: "Roads and Transport",
      recommended_department: "Roads and Transport",
      visual_observations: ["Pothole cavity", "Broken asphalt"],
      observations: ["Pothole cavity", "Broken asphalt"],
      confidence: 0.90,
      human_review_required: false,
      citizen_message: "A possible road damage issue was detected (Roads and Transport).",
    });

    const res = await request
      .post("/api/v1/grievances/analyze-image")
      .set("Authorization", `Bearer ${citizenToken}`)
      .attach("image", testImagePath);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.is_grievance_related, true);
    assert.equal(res.body.data.detected_issue, "Road damage");
    assert.equal(res.body.data.recommended_department, "Roads and Transport");
  });

  it("2. Image-only submission creates grievance and routes to detected department", async () => {
    aiService.analyzeImage = async () => ({
      analysis_status: "analyzed",
      image_type: "civic_issue",
      is_grievance_related: true,
      issue_detected: true,
      detected_issue: "Road damage",
      issue_description: "A large pothole with broken asphalt on a public roadway.",
      recommended_category: "Roads and Transport",
      recommended_department: "Roads and Transport",
      visual_observations: ["Pothole cavity", "Broken asphalt"],
      confidence: 0.88,
      human_review_required: false,
      citizen_message: "A possible road damage issue was detected.",
    });

    const res = await request
      .post("/api/v1/grievances")
      .set("Authorization", `Bearer ${citizenToken}`)
      .attach("images", testImagePath)
      .field("text", ""); // Empty description -> image-only

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    const grv = res.body.data;
    assert.equal(grv.category, "Roads and Transport");
    assert.equal(grv.department.name, "Roads and Transport");
    assert.match(grv.original_text, /Visual Grievance Report/i);
    assert.match(grv.original_text, /Road damage/i);
  });

  it("3. Image-only submission with unrelated image is rejected with 400", async () => {
    aiService.analyzeImage = async () => ({
      analysis_status: "analyzed",
      image_type: "unrelated",
      is_grievance_related: false,
      issue_detected: false,
      detected_issue: null,
      issue_description: "A selfie of a person indoors.",
      recommended_category: null,
      recommended_department: null,
      visual_observations: [],
      confidence: null,
      human_review_required: false,
      citizen_message: "This image does not appear to contain a recognizable civic grievance.",
    });

    const res = await request
      .post("/api/v1/grievances")
      .set("Authorization", `Bearer ${citizenToken}`)
      .attach("images", testImagePath)
      .field("text", ""); // No text and unrelated image

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /recognizable civic/i);
  });

  it("4. Multimodal submission with conflicting text and image flags review required", async () => {
    aiService.analyzeGrievance = async () => ({
      language: "English",
      translated_text: "There is dirty water leaking from pipe.",
      translation_status: "passthrough",
      category: "Water Supply",
      department: "Water Supply",
      priority: "HIGH",
      category_confidence: 0.92,
      confidence_level: "HIGH",
      ai_review_required: false,
      classification_method: "test",
      explanation_terms: ["water", "leaking"],
      departments: [
        {
          department_name: "Water Supply",
          category: "Water Supply",
          confidence: 0.92,
          reason: "Mentions water pipe leak",
          source: "text",
        },
      ],
    });

    aiService.analyzeImage = async () => ({
      analysis_status: "analyzed",
      image_type: "civic_issue",
      is_grievance_related: true,
      issue_detected: true,
      detected_issue: "Road damage",
      issue_description: "Broken tar road with large cracks.",
      recommended_category: "Roads and Transport",
      recommended_department: "Roads and Transport",
      visual_observations: ["Asphalt cracks"],
      confidence: 0.85,
      human_review_required: false,
    });

    const res = await request
      .post("/api/v1/grievances")
      .set("Authorization", `Bearer ${citizenToken}`)
      .attach("images", testImagePath)
      .field("text", "There is dirty water leaking from pipe.");

    assert.equal(res.status, 201);
    const grv = res.body.data;
    // Conflict between Water Supply (text) and Roads and Transport (image)
    assert.equal(grv.ai_review_required, true);
    assert.equal(grv.routing_status, "REVIEW_REQUIRED");
  });

  it("5. Protected image streaming verifies user authorization and headers", async () => {
    aiService.analyzeImage = async () => ({
      analysis_status: "analyzed",
      image_type: "civic_issue",
      is_grievance_related: true,
      issue_detected: true,
      detected_issue: "Road damage",
      issue_description: "Road pothole",
      recommended_category: "Roads and Transport",
      recommended_department: "Roads and Transport",
      visual_observations: ["Pothole"],
      human_review_required: false,
    });

    const createRes = await request
      .post("/api/v1/grievances")
      .set("Authorization", `Bearer ${citizenToken}`)
      .attach("images", testImagePath)
      .field("text", "Pothole on main road.");

    assert.equal(createRes.status, 201);
    const grievanceId = createRes.body.data.id;

    // Fetch grievance details to get image ID
    const detailRes = await request
      .get(`/api/v1/grievances/${grievanceId}`)
      .set("Authorization", `Bearer ${citizenToken}`);

    assert.equal(detailRes.status, 200);
    const images = detailRes.body.data.images;
    assert.equal(images.length, 1);
    const imageId = images[0].id;

    // Author of grievance can stream image
    const streamRes = await request
      .get(`/api/v1/grievances/${grievanceId}/images/${imageId}`)
      .set("Authorization", `Bearer ${citizenToken}`);

    assert.equal(streamRes.status, 200);
    assert.equal(streamRes.headers["content-type"], "image/png");

    // Other citizen cannot stream image (ownership check)
    const forbiddenRes = await request
      .get(`/api/v1/grievances/${grievanceId}/images/${imageId}`)
      .set("Authorization", `Bearer ${otherCitizenToken}`);

    assert.equal(forbiddenRes.status, 404);
  });
});

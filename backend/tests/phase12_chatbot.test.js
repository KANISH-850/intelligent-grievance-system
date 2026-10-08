const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const supertest = require("supertest");
const app = require("../src/app");
const { prisma } = require("../src/config/database");

const request = supertest(app);

describe("Phase 12 — Advanced Multilingual AI & Intelligent Citizen Chatbot", () => {
  let citizen1Token = "";
  let citizen2Token = "";
  let citizen1User = null;
  let citizen2User = null;
  let testDept = null;
  let grievance1 = null;
  let grievance2 = null;

  before(async () => {
    // 1. Create test department
    testDept = await prisma.department.create({
      data: {
        name: "P12 Test Dept",
        code: `P12DEPT_${Date.now()}`,
        description: "Phase 12 Chatbot Test Department",
      },
    });

    // 2. Register Citizen 1
    const email1 = `p12_cit1_${Date.now()}@example.com`;
    const res1 = await request.post("/api/v1/auth/register").send({
      name: "P12 Citizen One",
      email: email1,
      password: "Password@123",
    });
    citizen1Token = res1.body.token;
    citizen1User = res1.body.user;

    // 3. Register Citizen 2
    const email2 = `p12_cit2_${Date.now()}@example.com`;
    const res2 = await request.post("/api/v1/auth/register").send({
      name: "P12 Citizen Two",
      email: email2,
      password: "Password@123",
    });
    citizen2Token = res2.body.token;
    citizen2User = res2.body.user;

    // 4. Create Grievance for Citizen 1
    grievance1 = await prisma.grievance.create({
      data: {
        grievance_number: `GRV-2026-${Math.floor(100000 + Math.random() * 900000)}`,
        user_id: citizen1User.id,
        department_id: testDept.id,
        original_text: "Water supply pipeline broken in street 4",
        translated_text: "Water supply pipeline broken in street 4",
        detected_language: "English",
        category: "Water Supply",
        priority: "HIGH",
        status: "IN_PROGRESS",
      },
    });

    // 5. Create Grievance for Citizen 2
    grievance2 = await prisma.grievance.create({
      data: {
        grievance_number: `GRV-2026-${Math.floor(100000 + Math.random() * 900000)}`,
        user_id: citizen2User.id,
        department_id: testDept.id,
        original_text: "Power outage in sector 9 for 6 hours",
        translated_text: "Power outage in sector 9 for 6 hours",
        detected_language: "English",
        category: "Electricity",
        priority: "MEDIUM",
        status: "SUBMITTED",
      },
    });
  });

  after(async () => {
    // Clean up created records
    if (grievance1) await prisma.grievance.delete({ where: { id: grievance1.id } }).catch(() => {});
    if (grievance2) await prisma.grievance.delete({ where: { id: grievance2.id } }).catch(() => {});
    if (citizen1User) await prisma.user.delete({ where: { id: citizen1User.id } }).catch(() => {});
    if (citizen2User) await prisma.user.delete({ where: { id: citizen2User.id } }).catch(() => {});
    if (testDept) await prisma.department.delete({ where: { id: testDept.id } }).catch(() => {});
  });

  it("12.1 — Unauthenticated request to chatbot returns 401 Unauthorized", async () => {
    const res = await request
      .post("/api/v1/chatbot/message")
      .send({ message: "Hello" });

    assert.equal(res.status, 401);
  });

  it("12.2 — Citizen 1 can retrieve own grievance status", async () => {
    const res = await request
      .post("/api/v1/chatbot/message")
      .set("Authorization", `Bearer ${citizen1Token}`)
      .send({ message: `Status of my grievance ${grievance1.grievance_number}` });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.intent, "GRIEVANCE_STATUS");
    assert.ok(res.body.message.includes(grievance1.grievance_number));
    assert.ok(res.body.message.includes("IN_PROGRESS"));
  });

  it("12.3 — Security Isolation: Citizen A CANNOT access Citizen B's grievance", async () => {
    // Citizen 1 tries to query Citizen 2's grievance
    const res = await request
      .post("/api/v1/chatbot/message")
      .set("Authorization", `Bearer ${citizen1Token}`)
      .send({ message: `Check status of ${grievance2.grievance_number}` });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.grievance, null);
    assert.ok(
      res.body.message.includes("No grievance record") ||
      res.body.message.includes("only be viewed if registered under your authenticated citizen account") ||
      res.body.message.includes("privacy and security")
    );
  });

  it("12.4 — Chatbot processes explicit GREETING intent", async () => {
    const res = await request
      .post("/api/v1/chatbot/message")
      .set("Authorization", `Bearer ${citizen1Token}`)
      .send({ message: "Hello there" });

    assert.equal(res.status, 200);
    assert.equal(res.body.intent, "GREETING");
    assert.ok(typeof res.body.message === "string");
  });

  it("12.5 — Chatbot processes DEPARTMENT_INFORMATION intent", async () => {
    const res = await request
      .post("/api/v1/chatbot/message")
      .set("Authorization", `Bearer ${citizen1Token}`)
      .send({ message: "Which department handles electricity issues?" });

    assert.equal(res.status, 200);
    assert.equal(res.body.intent, "DEPARTMENT_INFORMATION");
    assert.ok(res.body.message.includes("Electricity"));
  });

  it("12.6 — Chatbot processes SUBMIT_GRIEVANCE_GUIDANCE intent", async () => {
    const res = await request
      .post("/api/v1/chatbot/message")
      .set("Authorization", `Bearer ${citizen1Token}`)
      .send({ message: "How do I submit a complaint?" });

    assert.equal(res.status, 200);
    assert.equal(res.body.intent, "SUBMIT_GRIEVANCE_GUIDANCE");
    assert.ok(res.body.message.toLowerCase().includes("submit"));
  });

  it("12.7 — Chatbot safely handles UNKNOWN intent", async () => {
    const res = await request
      .post("/api/v1/chatbot/message")
      .set("Authorization", `Bearer ${citizen1Token}`)
      .send({ message: "Who won yesterday's football match?" });

    assert.equal(res.status, 200);
    assert.equal(res.body.intent, "UNKNOWN");
    assert.ok(
      res.body.message.includes("don't have enough information") ||
      res.body.message.includes("I can assist you with submitting a grievance") ||
      res.body.message.includes("information on that topic")
    );
  });

  it("12.8 — Chatbot safely handles malformed grievance number", async () => {
    const res = await request
      .post("/api/v1/chatbot/message")
      .set("Authorization", `Bearer ${citizen1Token}`)
      .send({ message: "Check status of GRV-INVALID-XYZ" });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(typeof res.body.message === "string");
  });
});

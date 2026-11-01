const { afterEach, describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { analyzeGrievance, processChatbotMessage } = require("../src/services/ai.service");

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

describe("chatbot AI service request contract and fallback", () => {
  it("sends the expected request and accepts a valid AI response", async () => {
    let requestOptions;
    global.fetch = async (url, options) => {
      assert.match(url, /\/chatbot\/process$/);
      requestOptions = options;
      return { ok: true, json: async () => ({ message: "Your grievance is in progress.", intent: "GRIEVANCE_STATUS" }) };
    };
    const result = await processChatbotMessage("Status of GRV-2026-000001", [{ grievance_number: "GRV-2026-000001" }], { last_grievance_number: "GRV-2026-000001" });
    assert.equal(requestOptions.method, "POST");
    assert.equal(JSON.parse(requestOptions.body).message, "Status of GRV-2026-000001");
    assert.equal(result.message, "Your grievance is in progress.");
    assert.equal(result.intent, "GRIEVANCE_STATUS");
  });

  it("falls back to a useful response when the AI response schema is invalid", async () => {
    global.fetch = async () => ({ ok: true, json: async () => ({ unexpected: true }) });
    const result = await processChatbotMessage("How do I submit a complaint?");
    assert.match(result.message, /Submit Grievance/i);
  });

  it("falls back to a useful response when the AI service times out", async () => {
    global.fetch = async () => { throw new TypeError("fetch failed"); };
    const result = await processChatbotMessage("How do I submit a complaint?");
    assert.match(result.message, /Submit Grievance/i);
  });
});

describe("AI grievance analysis fallback", () => {
  it("returns a reviewable fallback when the AI service is unavailable", async () => {
    global.fetch = async () => ({
      ok: false,
      status: 503,
      text: async () => "Service unavailable",
    });

    const text = "There has been no drinking water for five days.";
    const analysis = await analyzeGrievance(text);

    assert.equal(analysis.category, "Water Supply");
    assert.equal(analysis.department, "Water Supply");
    assert.equal(analysis.priority, "HIGH");
    assert.equal(analysis.language, "English");
    assert.equal(analysis.translated_text, text);
    assert.equal(analysis.ai_review_required, true);
    assert.equal(analysis.classification_method, "backend_keyword_fallback");
    assert.equal(analysis.category_confidence, null, "fallbacks must not invent a model confidence score");
    assert.equal(analysis.translation_status, "passthrough");
  });

  it("returns a reviewable fallback when the AI service cannot be reached", async () => {
    global.fetch = async () => {
      throw new TypeError("fetch failed");
    };

    const analysis = await analyzeGrievance("Road damage near the school.");

    assert.equal(analysis.category, "Roads and Transport");
    assert.equal(analysis.department, "Roads and Transport");
    assert.equal(analysis.ai_review_required, true);
  });

  it("uses Other when no local category keywords match", async () => {
    global.fetch = async () => ({
      ok: false,
      status: 503,
      text: async () => "Service unavailable",
    });

    const analysis = await analyzeGrievance("I need help with an unusual civic issue.");

    assert.equal(analysis.category, "Other");
    assert.equal(analysis.department, "Other");
    assert.equal(analysis.ai_review_required, true);
  });
});

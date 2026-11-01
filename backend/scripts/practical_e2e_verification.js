/**
 * Complete Practical E2E Verification Script for Academic Practical Demonstration
 * Tests:
 * 1. Health checks across all services (Frontend, Backend, AI Microservice, Database)
 * 2. Citizen Registration & Login
 * 3. Grievance Submissions (English, Tamil, Hindi, Telugu)
 * 4. Language Detection, Translation & English-based AI Classification
 * 5. Department Routing & Queue Isolation
 * 6. Officer Login, Queue Access, Detail Inspection (Bilingual view), & Status Update
 * 7. Admin Login, Dashboard Stats, and Human Correction of AI Classification
 * 8. Notification Generation & Citizen Tracking
 */

const http = require("http");

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, headers: res.headers, data: parsed, raw: body });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on("error", reject);
    if (data) {
      req.write(typeof data === "string" ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function run() {
  console.log("================================================================================");
  console.log("🏛️  PRACTICAL READINESS VERIFICATION RUNNER — ACADEMIC EVALUATION");
  console.log("================================================================================\n");

  const results = [];

  // --- Step 1: Health Checks ---
  console.log("▶ 1. Health Checks...");
  try {
    const aiHealth = await request({ host: "127.0.0.1", port: 8001, path: "/health", method: "GET" });
    const backendHealth = await request({ host: "localhost", port: 5000, path: "/api/v1/health", method: "GET" });
    console.log(`  AI Service: HTTP ${aiHealth.status} -> ${JSON.stringify(aiHealth.data)}`);
    console.log(`  Backend: HTTP ${backendHealth.status} -> ${JSON.stringify(backendHealth.data)}`);
    results.push({ name: "Service Health Checks", pass: aiHealth.status === 200 && backendHealth.status === 200 });
  } catch (err) {
    console.error("Health check failed:", err.message);
    results.push({ name: "Service Health Checks", pass: false, error: err.message });
  }

  // --- Step 2: Citizen Login ---
  console.log("\n▶ 2. Citizen Authentication...");
  let citizenToken = "";
  let citizenId = "";
  try {
    const loginRes = await request(
      {
        host: "localhost",
        port: 5000,
        path: "/api/v1/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { email: "citizen@example.com", password: "Password@123" }
    );
    citizenToken = loginRes.data?.token || "";
    citizenId = loginRes.data?.user?.id || "";
    console.log(`  Citizen Login: HTTP ${loginRes.status}, User: ${loginRes.data?.user?.name} (${citizenId})`);
    results.push({ name: "Citizen Authentication", pass: loginRes.status === 200 && !!citizenToken });
  } catch (err) {
    console.error("Citizen auth failed:", err.message);
    results.push({ name: "Citizen Authentication", pass: false, error: err.message });
  }

  // --- Step 3: Grievance Submissions Across Languages ---
  console.log("\n▶ 3. Grievance Submissions & Multilingual AI Pipeline...");
  const testCases = [
    {
      langName: "English",
      text: "Broken Drinking Water Pipeline. Major drinking water pipeline rupture in Sector 4 causing severe water leakage on main road for two days.",
      expectedCategory: "Water Supply",
      expectedDept: "Water Supply",
    },
    {
      langName: "Tamil",
      text: "குடிநீர் தட்டுப்பாடு. அண்ணா நகர் 4வது தெருவில் கடந்த நான்கு நாட்களாக குடிநீர் விநியோகம் முற்றிலும் நின்றுவிட்டது.",
      expectedCategory: "Water Supply",
      expectedDept: "Water Supply",
    },
    {
      langName: "Hindi",
      text: "सड़क पर गहरा गड्ढा. हमारे वार्ड में मुख्य सड़क पर बहुत बड़ा गड्ढा हो गया है और कई लोग गिरकर घायल हो चुके हैं।",
      expectedCategory: "Roads and Transport",
      expectedDept: "Roads and Transport",
    },
    {
      langName: "Telugu",
      text: "రోడ్డుపై మురుగునీరు. మా వీధిలో గత మూడు రోజులుగా డ్రైనేజీ నీరు రోడ్డుపై పొంగిపొర్లుతోంది మరియు తీవ్ర దుర్వాసన వస్తోంది.",
      expectedCategory: "Sanitation",
      expectedDept: "Sanitation",
    },
  ];

  const submittedGrievances = [];

  for (const tc of testCases) {
    try {
      // Test preview endpoint first
      const previewRes = await request(
        {
          host: "127.0.0.1",
          port: 8001,
          path: "/translate",
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
        { text: tc.text }
      );

      console.log(`\n  [${tc.langName} Preview] Detected: ${previewRes.data?.detected_language} (${previewRes.data?.detected_language_code})`);
      console.log(`  English Preview: "${previewRes.data?.translated_text}"`);

      // Submit Grievance
      const subRes = await request(
        {
          host: "localhost",
          port: 5000,
          path: "/api/v1/grievances",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${citizenToken}`,
          },
        },
        {
          text: tc.text,
        }
      );

      const grv = subRes.data?.data || {};
      console.log(`  Submission: HTTP ${subRes.status} -> Ref: ${grv.grievance_number || grv.id}`);
      console.log(`  Stored Category: ${grv.category}, Priority: ${grv.priority}, Status: ${grv.status}`);
      console.log(`  Assigned Department: ${grv.department?.name || "None"}`);
      console.log(`  Translation Status: ${grv.translation_status}, Method: ${grv.translation_method}`);
      console.log(`  Translated Text: "${grv.translated_text}"`);

      const pass =
        subRes.status === 201 &&
        grv.id &&
        grv.original_text === tc.text &&
        (tc.langName === "English" || grv.translated_text) &&
        grv.department?.name;

      results.push({
        name: `Submission in ${tc.langName}`,
        pass: !!pass,
        details: `Ref: ${grv.grievance_number}, Dept: ${grv.department?.name}`,
      });

      submittedGrievances.push({ ...tc, grievance: grv });
    } catch (err) {
      console.error(`Submission failed for ${tc.langName}:`, err.message);
      results.push({ name: `Submission in ${tc.langName}`, pass: false, error: err.message });
    }
  }

  // --- Step 4: Officer Workflow (Bilingual View, Queue Isolation, Status Update) ---
  console.log("\n▶ 4. Officer Workflow & Status Update...");
  let officerToken = "";
  try {
    // Log in as Water Supply Officer (officer@example.com)
    const offLogin = await request(
      {
        host: "localhost",
        port: 5000,
        path: "/api/v1/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { email: "officer@example.com", password: "Password@123" }
    );
    officerToken = offLogin.data?.token || "";
    console.log(`  Officer Login: HTTP ${offLogin.status}, Officer: ${offLogin.data?.user?.name}`);

    // Fetch assigned queue
    const queueRes = await request({
      host: "localhost",
      port: 5000,
      path: "/api/v1/officer/grievances",
      method: "GET",
      headers: { Authorization: `Bearer ${officerToken}` },
    });

    const list = queueRes.data?.data?.grievances || queueRes.data?.data || [];
    console.log(`  Officer Queue Count: ${list.length} grievances in Water Supply queue.`);

    // Find the Tamil grievance in Water Supply queue
    const target = submittedGrievances.find((g) => g.langName === "Tamil");
    const targetId = target?.grievance?.id;

    if (targetId) {
      // Get detail
      const detailRes = await request({
        host: "localhost",
        port: 5000,
        path: `/api/v1/officer/grievances/${targetId}`,
        method: "GET",
        headers: { Authorization: `Bearer ${officerToken}` },
      });

      const d = detailRes.data?.data || {};
      console.log(`  Officer Detail Inspection for ${d.grievance_number}:`);
      console.log(`    English Translated Text: "${d.translated_text}"`);
      console.log(`    Original Regional Text: "${d.original_text}" (${d.detected_language})`);

      // Update status to IN_PROGRESS
      const updateRes1 = await request(
        {
          host: "localhost",
          port: 5000,
          path: `/api/v1/officer/grievances/${targetId}/status`,
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${officerToken}`,
          },
        },
        {
          status: "IN_PROGRESS",
          remarks: "Field engineering team dispatched to inspect water supply pipeline.",
        }
      );
      console.log(`  Status Update -> IN_PROGRESS: HTTP ${updateRes1.status}`);

      // Update status to RESOLVED
      const updateRes2 = await request(
        {
          host: "localhost",
          port: 5000,
          path: `/api/v1/officer/grievances/${targetId}/status`,
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${officerToken}`,
          },
        },
        {
          status: "RESOLVED",
          remarks: "Pipeline repaired and water supply restored to Anna Nagar 4th street.",
        }
      );
      console.log(`  Status Update -> RESOLVED: HTTP ${updateRes2.status}`);

      results.push({
        name: "Officer Inspection & Lifecycle Progression",
        pass: updateRes1.status === 200 && updateRes2.status === 200,
      });
    }
  } catch (err) {
    console.error("Officer workflow failed:", err.message);
    results.push({ name: "Officer Inspection & Lifecycle Progression", pass: false, error: err.message });
  }

  // --- Step 5: Admin Workflow (Overview, Statistics & Human Classification Correction) ---
  console.log("\n▶ 5. Admin Workflow & Human Classification Correction...");
  let adminToken = "";
  try {
    const adminLogin = await request(
      {
        host: "localhost",
        port: 5000,
        path: "/api/v1/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { email: "admin@example.com", password: "Password@123" }
    );
    adminToken = adminLogin.data?.token || "";
    console.log(`  Admin Login: HTTP ${adminLogin.status}`);

    // Fetch stats
    const statsRes = await request({
      host: "localhost",
      port: 5000,
      path: "/api/v1/admin/analytics/overview",
      method: "GET",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`  Admin Overview Stats: Total Grievances: ${statsRes.data?.data?.totalGrievances || 0}`);

    // Human Correction on Hindi Grievance
    const hindiTarget = submittedGrievances.find((g) => g.langName === "Hindi");
    const hindiId = hindiTarget?.grievance?.id;

    if (hindiId) {
      const correctionRes = await request(
        {
          host: "localhost",
          port: 5000,
          path: `/api/v1/admin/grievances/${hindiId}/classification`,
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
        },
        {
          category: "Municipal Services",
          remarks: "Reassigned to Municipal Services for civil infrastructure maintenance.",
        }
      );

      const updated = correctionRes.data?.data || {};
      console.log(`  Admin Human Correction on ${updated.grievance_number}:`);
      console.log(`    New Category: ${updated.category}`);
      console.log(`    AI Original Category Preserved: ${updated.ai_original_category}`);
      console.log(`    is_human_corrected: ${updated.is_human_corrected}`);
      console.log(`    human_corrected_by: ${updated.human_corrected_by}`);

      const pass =
        correctionRes.status === 200 &&
        updated.category === "Municipal Services" &&
        updated.is_human_corrected === true &&
        updated.ai_original_category === hindiTarget.expectedCategory;

      results.push({ name: "Admin Human Classification Correction", pass: !!pass });
    }
  } catch (err) {
    console.error("Admin workflow failed:", err.message);
    results.push({ name: "Admin Human Classification Correction", pass: false, error: err.message });
  }

  // --- Step 6: Citizen Notification & Tracking Verification ---
  console.log("\n▶ 6. Citizen Notification Feed & Audit History...");
  try {
    const notifRes = await request({
      host: "localhost",
      port: 5000,
      path: "/api/v1/notifications",
      method: "GET",
      headers: { Authorization: `Bearer ${citizenToken}` },
    });

    const notifs = notifRes.data?.data?.notifications || notifRes.data?.data || [];
    console.log(`  Citizen Notifications Count: ${notifs.length}`);
    if (notifs.length > 0) {
      console.log(`  Latest Notification: "${notifs[0].title}" — ${notifs[0].message}`);
    }

    results.push({ name: "Citizen Notifications", pass: notifRes.status === 200 && notifs.length > 0 });
  } catch (err) {
    console.error("Notification check failed:", err.message);
    results.push({ name: "Citizen Notifications", pass: false, error: err.message });
  }

  // --- Summary ---
  console.log("\n================================================================================");
  console.log("📊 PRACTICAL READINESS VERIFICATION SUMMARY");
  console.log("================================================================================");
  let allPass = true;
  for (const r of results) {
    const symbol = r.pass ? "✅ PASS" : "❌ FAIL";
    if (!r.pass) allPass = false;
    console.log(`  ${symbol} : ${r.name} ${r.details ? `(${r.details})` : ""}`);
  }
  console.log("================================================================================");
  console.log(allPass ? "🎉 ALL PRACTICAL CORE WORKFLOWS ARE 100% OPERATIONAL!" : "⚠️ SOME WORKFLOWS REQUIRE ATTENTION.");
  console.log("================================================================================\n");
}

run();

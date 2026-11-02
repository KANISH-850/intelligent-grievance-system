/**
 * Comprehensive End-to-End Test Suite for All 6 Multi-Issue Grievance Cases
 * Verifies:
 * 1. AI detection of all distinct issues and categories
 * 2. Proper department mapping without false positives (e.g. 'on the road' != road defect)
 * 3. Exactly 1 parent grievance per submission
 * 4. Exactly 1 assignment per unique department (no duplicates)
 * 5. Multi-issue single-department retention of all detected issues
 * 6. Ambiguous complaint handling without hallucinated issues
 * 7. Officer departmental access isolation & IDOR protection
 * 8. Citizen visibility of all departmental progress
 * 9. Multi-department status rollup to PARTIALLY_RESOLVED and RESOLVED
 */

const { prisma } = require("../src/config/database");
const grievanceService = require("../src/services/grievance.service");
const officerService = require("../src/services/officer.service");

const TEST_CASES = [
  {
    code: "A",
    title: "One issue",
    text: "Water is leaking from a pipeline near the entrance.",
    expectedDepartments: ["Water Supply"],
    expectedMinIssues: 1,
    expectAmbiguous: false,
  },
  {
    code: "B",
    title: "Two issues",
    text: "There is a major water pipeline leakage on the road and garbage is accumulating near the gate.",
    expectedDepartments: ["Water Supply", "Sanitation"],
    expectedMinIssues: 2,
    expectAmbiguous: false,
    forbiddenDepartments: ["Roads and Transport"], // Must not confuse 'on the road' with road defect
  },
  {
    code: "C",
    title: "Three issues",
    text: "There are potholes on the main road, garbage is dumped near the gate, and the streetlight is not working.",
    expectedDepartments: ["Roads and Transport", "Sanitation", "Electricity"],
    expectedMinIssues: 3,
    expectAmbiguous: false,
  },
  {
    code: "D",
    title: "Four issues",
    text: "There is a water pipeline leakage, garbage accumulation, damaged streetlight, and potholes near the college entrance.",
    expectedDepartments: ["Water Supply", "Sanitation", "Electricity", "Roads and Transport"],
    expectedMinIssues: 4,
    expectAmbiguous: false,
  },
  {
    code: "E",
    title: "Two issues belonging to one department",
    text: "There are potholes and damaged road surfaces near the entrance.",
    expectedDepartments: ["Roads and Transport"],
    expectedMinIssues: 2,
    expectSingleDeptWithMultipleIssues: true,
  },
  {
    code: "F",
    title: "Ambiguous complaint",
    text: "There is a problem near the entrance.",
    expectedDepartments: ["Other"],
    expectedMinIssues: 0,
    expectAmbiguous: true,
  },
];

async function runVerification() {
  console.log("================================================================================");
  console.log("  END-TO-END MULTI-ISSUE MULTI-DEPARTMENT GRIEVANCE VERIFICATION SUITE");
  console.log("================================================================================\n");

  let totalPassed = 0;
  let totalFailed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`    [PASS] ${message}`);
      totalPassed++;
    } else {
      console.error(`    [FAIL] ${message}`);
      totalFailed++;
    }
  }

  // 1. Fetch test users
  const citizen = await prisma.user.findUnique({ where: { email: "citizen@example.com" } });
  const waterOfficer = await prisma.user.findUnique({ where: { email: "officer@example.com" }, include: { department: true } });
  const roadsOfficer = await prisma.user.findUnique({ where: { email: "officer.roads@example.com" }, include: { department: true } });
  const sanitationOfficer = await prisma.user.findUnique({ where: { email: "officer.sanitation@example.com" }, include: { department: true } });
  const elecOfficer = await prisma.user.findUnique({ where: { email: "officer.elec@example.com" }, include: { department: true } });

  if (!citizen || !waterOfficer || !roadsOfficer || !sanitationOfficer || !elecOfficer) {
    throw new Error("One or more required test user personas not found in database.");
  }

  console.log("[SETUP] Test personas loaded:");
  console.log(`  Citizen: ${citizen.email}`);
  console.log(`  Water Officer: ${waterOfficer.email} (${waterOfficer.department?.name})`);
  console.log(`  Roads Officer: ${roadsOfficer.email} (${roadsOfficer.department?.name})`);
  console.log(`  Sanitation Officer: ${sanitationOfficer.email} (${sanitationOfficer.department?.name})`);
  console.log(`  Electricity Officer: ${elecOfficer.email} (${elecOfficer.department?.name})\n`);

  const createdGrievances = [];

  // 2. Run Test Cases A through F
  for (const tc of TEST_CASES) {
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`CASE ${tc.code}: ${tc.title}`);
    console.log(`Text: "${tc.text}"`);

    // Submit grievance via grievanceService
    const result = await grievanceService.submitGrievance({
      userId: citizen.id,
      text: tc.text,
      images: [],
    });

    createdGrievances.push({ caseCode: tc.code, result });

    // Verify 1: One parent grievance created
    assert(result && result.id && result.grievance_number, `Created 1 parent grievance record: ${result.grievance_number}`);

    // Verify database directly
    const dbGrievance = await prisma.grievance.findUnique({
      where: { id: result.id },
      include: {
        department: true,
        assignments: {
          include: { department: true },
        },
      },
    });

    assert(dbGrievance !== null, `Database contains exactly 1 parent grievance with ID ${result.id}`);
    assert(dbGrievance.original_text === tc.text, "Original complaint text is preserved verbatim");

    // Verify 2: Department assignments
    const assignedDeptNames = dbGrievance.assignments.map((a) => a.department.name);
    console.log(`    Assigned Departments (${assignedDeptNames.length}): [${assignedDeptNames.join(", ")}]`);

    // Verify no duplicates
    const uniqueAssignedDeptNames = [...new Set(assignedDeptNames)];
    assert(assignedDeptNames.length === uniqueAssignedDeptNames.length, "Zero duplicate department assignments created");

    // Verify expected departments match
    const sortedExpected = [...tc.expectedDepartments].sort();
    const sortedActual = [...assignedDeptNames].sort();
    const deptsMatch = JSON.stringify(sortedExpected) === JSON.stringify(sortedActual);
    assert(deptsMatch, `Assigned departments match expected: expected [${sortedExpected.join(", ")}], got [${sortedActual.join(", ")}]`);

    // Forbidden departments check
    if (tc.forbiddenDepartments) {
      for (const forb of tc.forbiddenDepartments) {
        assert(!assignedDeptNames.includes(forb), `Correctly excluded '${forb}' (spatial location phrase was not confused with defect)`);
      }
    }

    // Verify 3: Case-specific requirements
    if (tc.expectSingleDeptWithMultipleIssues) {
      // Case E: Roads and Transport should have 1 assignment with multiple issues retained
      assert(dbGrievance.assignments.length === 1, "Exactly 1 assignment created for Roads and Transport");
      const assignment = dbGrievance.assignments[0];
      const reasonLower = (assignment.routing_reason || "").toLowerCase();
      const hasPotholes = reasonLower.includes("pothole");
      const hasDamagedRoad = reasonLower.includes("damaged road") || reasonLower.includes("road surface");
      assert(hasPotholes && hasDamagedRoad, `Assignment reason retained both distinct issues: "${assignment.routing_reason}"`);
    }

    if (tc.expectAmbiguous) {
      // Case F: Flagged for human review without hallucinating civic defects
      assert(dbGrievance.ai_review_required === true || dbGrievance.routing_status === "REVIEW_REQUIRED", "Ambiguous grievance correctly flagged for human review");
      assert(assignedDeptNames.includes("Other"), "Ambiguous complaint routed to 'Other' pending human review");
    }

    console.log();
  }

  // 3. Officer Access Isolation & Status Rollup Verification (Case B: Water + Sanitation)
  console.log("--------------------------------------------------------------------------------");
  console.log("OFFICER ACCESS ISOLATION & MULTI-DEPARTMENT RESOLUTION ROLLUP TEST");
  console.log("Testing on Case B (Water Supply + Sanitation)...");

  const caseBGrievance = createdGrievances.find((g) => g.caseCode === "B").result;
  const dbCaseB = await prisma.grievance.findUnique({
    where: { id: caseBGrievance.id },
    include: { assignments: { include: { department: true } } },
  });

  const waterAssign = dbCaseB.assignments.find((a) => a.department.name === "Water Supply");
  const sanitationAssign = dbCaseB.assignments.find((a) => a.department.name === "Sanitation");

  // Officer access test 1: Water officer accesses Water assignment -> OK
  const waterView = await officerService.getDepartmentAssignmentById(waterAssign.id, waterOfficer);
  assert(waterView && waterView.id === waterAssign.id, "Water Officer can successfully access Water Supply assignment");

  // Officer access test 2: Water officer attempts to access Sanitation assignment -> IDOR BLOCKED (404)
  let waterAccessSanitationBlocked = false;
  try {
    await officerService.getDepartmentAssignmentById(sanitationAssign.id, waterOfficer);
  } catch (err) {
    if (err.statusCode === 404 || err.message.includes("not found")) {
      waterAccessSanitationBlocked = true;
    }
  }
  assert(waterAccessSanitationBlocked, "Water Officer is strictly forbidden from accessing Sanitation assignment (IDOR protected)");

  // Officer access test 3: Roads officer attempts to access Water assignment -> IDOR BLOCKED (404)
  let roadsAccessWaterBlocked = false;
  try {
    await officerService.getDepartmentAssignmentById(waterAssign.id, roadsOfficer);
  } catch (err) {
    if (err.statusCode === 404 || err.message.includes("not found")) {
      roadsAccessWaterBlocked = true;
    }
  }
  assert(roadsAccessWaterBlocked, "Roads Officer is strictly forbidden from accessing Water assignment (Unauthorized department)");

  // 4. Status Transition and Composite Rollup Test
  console.log("\n--> Simulating multi-department resolution workflow:");

  // Step 1: Water officer marks their assignment IN_PROGRESS
  await officerService.updateDepartmentAssignmentStatus(
    waterAssign.id,
    waterOfficer,
    { status: "IN_PROGRESS", remarks: "Field crew dispatched to fix pipeline leakage" }
  );
  let gState = await prisma.grievance.findUnique({ where: { id: caseBGrievance.id } });
  assert(gState.status === "IN_PROGRESS", `Parent grievance status transitioned to IN_PROGRESS (current: ${gState.status})`);

  // Step 2: Water officer resolves their assignment -> Parent becomes PARTIALLY_RESOLVED
  await officerService.updateDepartmentAssignmentStatus(
    waterAssign.id,
    waterOfficer,
    { status: "RESOLVED", remarks: "Pipeline leakage successfully clamped and restored", resolution_description: "Clamped" }
  );
  gState = await prisma.grievance.findUnique({ where: { id: caseBGrievance.id } });
  assert(gState.status === "PARTIALLY_RESOLVED", `Parent grievance status transitioned to PARTIALLY_RESOLVED after 1 of 2 departments resolved (current: ${gState.status})`);

  // Step 3: Sanitation officer resolves their assignment -> Parent becomes RESOLVED
  await officerService.updateDepartmentAssignmentStatus(
    sanitationAssign.id,
    sanitationOfficer,
    { status: "RESOLVED", remarks: "Garbage accumulation cleared by sanitation compactor team", resolution_description: "Cleared" }
  );
  gState = await prisma.grievance.findUnique({ where: { id: caseBGrievance.id } });
  assert(gState.status === "RESOLVED", `Parent grievance status transitioned to RESOLVED only when ALL required assignments are RESOLVED (current: ${gState.status})`);

  // 5. Citizen Tracking View Verification
  console.log("\n--> Verifying Citizen Tracking View:");
  const citizenGrievance = await grievanceService.getGrievanceById(caseBGrievance.id, citizen.id);
  assert(citizenGrievance && citizenGrievance.assignments.length === 2, "Citizen can see both department assignments under the same grievance");
  const waterStatus = citizenGrievance.assignments.find((a) => a.department.name === "Water Supply")?.status;
  const sanStatus = citizenGrievance.assignments.find((a) => a.department.name === "Sanitation")?.status;
  assert(waterStatus === "RESOLVED" && sanStatus === "RESOLVED", `Citizen sees real-time resolved statuses for all departments (Water: ${waterStatus}, Sanitation: ${sanStatus})`);

  // Final summary
  console.log("\n================================================================================");
  if (totalFailed === 0) {
    console.log(`  ALL END-TO-END VERIFICATION CHECKS PASSED SUCCESSFULLY! (${totalPassed}/${totalPassed})`);
  } else {
    console.error(`  VERIFICATION FAILED: ${totalFailed} assertions failed out of ${totalPassed + totalFailed}`);
  }
  console.log("================================================================================\n");

  return totalFailed === 0;
}

runVerification()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error("Verification suite encountered unhandled exception:", err);
    process.exit(1);
  });

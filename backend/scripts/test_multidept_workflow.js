/**
 * Complete End-to-End Test Suite for Multi-Department Grievance Routing
 * and Independent Progress Tracking (Phases 10 & 11)
 */

const API_BASE = "http://localhost:5000/api/v1";

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function login(email, password = "Password@123") {
  const res = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const token = res.data?.token || res.data?.data?.token;
  const user = res.data?.user || res.data?.data?.user;
  if (!res.ok || !token) {
    throw new Error(`Failed to login as ${email}: ${JSON.stringify(res.data)}`);
  }
  return { token, user };
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

async function runTests() {
  console.log("\n========================================================");
  console.log("   MULTI-DEPARTMENT WORKFLOW END-TO-END VERIFICATION    ");
  console.log("========================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // --- Step 0: Authenticate All Personas ---
  console.log("--> Authenticating test personas...");
  const citizen = await login("citizen@example.com");
  const waterOfficer = await login("officer@example.com"); // Water Supply (WS)
  const roadsOfficer = await login("officer.roads@example.com"); // Roads and Transport (RT)
  const sanitationOfficer = await login("officer.sanitation@example.com"); // Sanitation (SAN)
  const admin = await login("admin@example.com");

  console.log("  ✓ Citizen authenticated:", citizen.user.email);
  console.log("  ✓ Water Officer authenticated:", waterOfficer.user.email, `(${waterOfficer.user.department?.name})`);
  console.log("  ✓ Roads Officer authenticated:", roadsOfficer.user.email, `(${roadsOfficer.user.department?.name})`);
  console.log("  ✓ Sanitation Officer authenticated:", sanitationOfficer.user.email, `(${sanitationOfficer.user.department?.name})`);
  console.log("  ✓ Admin authenticated:", admin.user.email);

  // --- Test Case 1: Multi-department complaint creation ---
  console.log("\n--> TEST CASE 1: Multi-department complaint creation");
  const submissionRes = await request("/grievances", {
    method: "POST",
    headers: authHeader(citizen.token),
    body: JSON.stringify({
      text: "There is water leakage on the road, a large pothole, and garbage accumulation near the leaking pipeline.",
    }),
  });

  assert(submissionRes.status === 201, `Complaint created with status 201 (received ${submissionRes.status})`);
  const parentGrievance = submissionRes.data?.data;
  assert(!!parentGrievance?.id, `Parent grievance ID created: ${parentGrievance?.grievance_number}`);
  assert(Array.isArray(parentGrievance?.assignments), "Response returns assignments array");
  assert(parentGrievance?.assignments?.length === 3, `Exactly 3 assignments created (received ${parentGrievance?.assignments?.length})`);

  const assignedDepts = parentGrievance?.assignments?.map((a) => a.department?.name).sort();
  assert(
    assignedDepts?.includes("Water Supply") &&
    assignedDepts?.includes("Roads and Transport") &&
    assignedDepts?.includes("Sanitation"),
    `All 3 target departments assigned: ${assignedDepts?.join(", ")}`
  );

  // Check unique constraint (no duplicate assignments)
  const deptIds = parentGrievance?.assignments?.map((a) => a.department_id);
  const uniqueDeptIds = new Set(deptIds);
  assert(uniqueDeptIds.size === deptIds.length, "No duplicate department assignments exist for the grievance");

  const waterAssign = parentGrievance.assignments.find((a) => a.department?.name === "Water Supply");
  const roadsAssign = parentGrievance.assignments.find((a) => a.department?.name === "Roads and Transport");
  const sanAssign = parentGrievance.assignments.find((a) => a.department?.name === "Sanitation");

  // --- Test Case 2: Officer dashboard separation ---
  console.log("\n--> TEST CASE 2: Officer dashboard separation");
  // Water Officer queue
  const waterQueue = await request("/officer/assignments", {
    headers: authHeader(waterOfficer.token),
  });
  assert(waterQueue.status === 200, "Water Officer can fetch departmental assignments");
  const waterMyItem = waterQueue.data?.data?.find((a) => a.grievance_id === parentGrievance.id);
  assert(!!waterMyItem, "Water Officer sees the Water assignment for this complaint");
  assert(waterMyItem?.department?.name === "Water Supply", "Water Officer assignment belongs to Water Supply department");

  // Roads Officer queue
  const roadsQueue = await request("/officer/assignments", {
    headers: authHeader(roadsOfficer.token),
  });
  const roadsMyItem = roadsQueue.data?.data?.find((a) => a.grievance_id === parentGrievance.id);
  assert(!!roadsMyItem, "Roads Officer sees the Roads assignment for this complaint");
  assert(roadsMyItem?.department?.name === "Roads and Transport", "Roads Officer assignment belongs to Roads and Transport department");

  // Sanitation Officer queue
  const sanQueue = await request("/officer/assignments", {
    headers: authHeader(sanitationOfficer.token),
  });
  const sanMyItem = sanQueue.data?.data?.find((a) => a.grievance_id === parentGrievance.id);
  assert(!!sanMyItem, "Sanitation Officer sees the Sanitation assignment for this complaint");
  assert(sanMyItem?.department?.name === "Sanitation", "Sanitation Officer assignment belongs to Sanitation department");

  // Verify separation: each officer's queue ONLY contains assignments for their department
  const waterAllWS = waterQueue.data?.data?.every((a) => a.department_id === waterOfficer.user.department_id);
  assert(waterAllWS, "Water Officer queue contains ONLY Water department assignments");

  const roadsAllRT = roadsQueue.data?.data?.every((a) => a.department_id === roadsOfficer.user.department_id);
  assert(roadsAllRT, "Roads Officer queue contains ONLY Roads department assignments");

  // --- Test Case 3: Independent status updates ---
  console.log("\n--> TEST CASE 3: Independent status updates");
  // 1. Water -> RESOLVED
  const waterUpdate = await request(`/officer/assignments/${waterAssign.id}/status`, {
    method: "PATCH",
    headers: authHeader(waterOfficer.token),
    body: JSON.stringify({
      status: "RESOLVED",
      remarks: "Water main valve repaired and pressure normalized.",
      resolution_description: "Repaired pipeline leak at junction.",
    }),
  });
  assert(waterUpdate.status === 200, "Water Officer resolved Water assignment");
  assert(waterUpdate.data?.data?.updatedAssignment?.status === "RESOLVED", "Water assignment status is RESOLVED");
  assert(!!waterUpdate.data?.data?.updatedAssignment?.resolved_at, "Water assignment resolved_at timestamp populated");

  // 2. Roads -> IN_PROGRESS
  const roadsUpdate = await request(`/officer/assignments/${roadsAssign.id}/status`, {
    method: "PATCH",
    headers: authHeader(roadsOfficer.token),
    body: JSON.stringify({
      status: "IN_PROGRESS",
      remarks: "Asphalt patching crew dispatched to fill pothole.",
    }),
  });
  assert(roadsUpdate.status === 200, "Roads Officer updated Roads assignment to IN_PROGRESS");
  assert(roadsUpdate.data?.data?.updatedAssignment?.status === "IN_PROGRESS", "Roads assignment status is IN_PROGRESS");
  assert(!!roadsUpdate.data?.data?.updatedAssignment?.started_at, "Roads assignment started_at timestamp populated");

  // 3. Sanitation -> verify remains SUBMITTED / ASSIGNED
  const sanDetail = await request(`/officer/assignments/${sanAssign.id}`, {
    headers: authHeader(sanitationOfficer.token),
  });
  assert(sanDetail.status === 200, "Sanitation Officer fetched Sanitation assignment");
  assert(
    sanDetail.data?.data?.status === "SUBMITTED" || sanDetail.data?.data?.status === "ASSIGNED",
    `Sanitation assignment remains independent (${sanDetail.data?.data?.status})`
  );

  // --- Test Case 4: Citizen progress view & Composite Status ---
  console.log("\n--> TEST CASE 4: Citizen consolidated progress");
  const citizenGrievance = await request(`/grievances/${parentGrievance.id}`, {
    headers: authHeader(citizen.token),
  });
  assert(citizenGrievance.status === 200, "Citizen can fetch original single complaint");
  const cData = citizenGrievance.data?.data;
  assert(cData?.assignments?.length === 3, "Citizen sees all 3 department assignments under 1 complaint");

  const cWater = cData?.assignments?.find((a) => a.id === waterAssign.id);
  const cRoads = cData?.assignments?.find((a) => a.id === roadsAssign.id);
  const cSan = cData?.assignments?.find((a) => a.id === sanAssign.id);

  assert(cWater?.status === "RESOLVED", "Citizen sees Water department as RESOLVED");
  assert(cRoads?.status === "IN_PROGRESS", "Citizen sees Roads department as IN_PROGRESS");
  assert(cSan?.status === "SUBMITTED" || cSan?.status === "ASSIGNED", "Citizen sees Sanitation department as SUBMITTED/ASSIGNED");

  // Overall status check: Water is resolved, but others not resolved => Must be PARTIALLY_RESOLVED or IN_PROGRESS, NOT RESOLVED!
  assert(cData?.status === "PARTIALLY_RESOLVED", `Overall status correctly calculated as PARTIALLY_RESOLVED (received '${cData?.status}')`);
  assert(cData?.status !== "RESOLVED", "Overall status is NOT prematurely marked as RESOLVED");

  // --- Test Case 5: Second department update ---
  console.log("\n--> TEST CASE 5: Second department update");
  const roadsResolve = await request(`/officer/assignments/${roadsAssign.id}/status`, {
    method: "PATCH",
    headers: authHeader(roadsOfficer.token),
    body: JSON.stringify({
      status: "RESOLVED",
      remarks: "Pothole filled and road resurfaced cleanly.",
      resolution_description: "Road surface repaired and cleared for traffic.",
    }),
  });
  assert(roadsResolve.status === 200, "Roads Officer resolved Roads assignment");

  const citizenCheck2 = await request(`/grievances/${parentGrievance.id}`, {
    headers: authHeader(citizen.token),
  });
  const cData2 = citizenCheck2.data?.data;
  const cWater2 = cData2?.assignments?.find((a) => a.id === waterAssign.id);
  const cRoads2 = cData2?.assignments?.find((a) => a.id === roadsAssign.id);
  const cSan2 = cData2?.assignments?.find((a) => a.id === sanAssign.id);

  assert(cWater2?.status === "RESOLVED", "Water remains RESOLVED");
  assert(cRoads2?.status === "RESOLVED", "Roads is now RESOLVED");
  assert(cSan2?.status === "SUBMITTED" || cSan2?.status === "ASSIGNED", "Sanitation is still unresolved");
  assert(cData2?.status === "PARTIALLY_RESOLVED", `Overall grievance remains PARTIALLY_RESOLVED (status: '${cData2?.status}')`);

  // --- Test Case 6: All departments resolved ---
  console.log("\n--> TEST CASE 6: All departments resolved");
  const sanResolve = await request(`/officer/assignments/${sanAssign.id}/status`, {
    method: "PATCH",
    headers: authHeader(sanitationOfficer.token),
    body: JSON.stringify({
      status: "RESOLVED",
      remarks: "Garbage collection completed and area sanitized with disinfectant.",
      resolution_description: "Garbage cleared and waste bins replaced.",
    }),
  });
  assert(sanResolve.status === 200, "Sanitation Officer resolved Sanitation assignment");

  const citizenFinal = await request(`/grievances/${parentGrievance.id}`, {
    headers: authHeader(citizen.token),
  });
  const cDataFinal = citizenFinal.data?.data;
  assert(cDataFinal?.assignments?.every((a) => a.status === "RESOLVED"), "All 3 department assignments are now RESOLVED");
  assert(cDataFinal?.status === "RESOLVED", `Overall grievance is now accurately marked as RESOLVED (status: '${cDataFinal?.status}')`);

  // --- Test Case 7: Authorization and Security (IDOR & Role Checks) ---
  console.log("\n--> TEST CASE 7: Authorization and Security");

  // 1. Water officer attempts to update Roads assignment (IDOR Attack)
  const idorUpdate = await request(`/officer/assignments/${roadsAssign.id}/status`, {
    method: "PATCH",
    headers: authHeader(waterOfficer.token),
    body: JSON.stringify({ status: "REJECTED", remarks: "Malicious update from Water officer" }),
  });
  assert(idorUpdate.status === 404 || idorUpdate.status === 403, `Cross-department assignment update blocked (HTTP ${idorUpdate.status})`);

  // 2. Roads officer attempts to view Sanitation assignment detail
  const idorView = await request(`/officer/assignments/${sanAssign.id}`, {
    headers: authHeader(roadsOfficer.token),
  });
  assert(idorView.status === 404 || idorView.status === 403, `Cross-department assignment detail view blocked (HTTP ${idorView.status})`);

  // 3. Citizen attempts to modify an assignment
  const citizenUpdate = await request(`/officer/assignments/${waterAssign.id}/status`, {
    method: "PATCH",
    headers: authHeader(citizen.token),
    body: JSON.stringify({ status: "IN_PROGRESS", remarks: "Citizen tampering" }),
  });
  assert(citizenUpdate.status === 403, `Citizen modification of officer assignment rejected (HTTP ${citizenUpdate.status})`);

  // 4. Unauthenticated request
  const unauthReq = await request(`/officer/assignments/${waterAssign.id}`);
  assert(unauthReq.status === 401, `Unauthenticated request rejected (HTTP ${unauthReq.status})`);

  // 5. Nonexistent assignment ID
  const nonexistent = await request("/officer/assignments/00000000-0000-0000-0000-000000000000", {
    headers: authHeader(waterOfficer.token),
  });
  assert(nonexistent.status === 404, `Nonexistent assignment ID returns 404 (HTTP ${nonexistent.status})`);

  // 6. Invalid status transition (attempt to revert terminal RESOLVED to SUBMITTED)
  const invalidTransition = await request(`/officer/assignments/${waterAssign.id}/status`, {
    method: "PATCH",
    headers: authHeader(waterOfficer.token),
    body: JSON.stringify({ status: "SUBMITTED", remarks: "Invalid transition attempt" }),
  });
  assert(invalidTransition.status === 400, `Invalid status transition rejected (HTTP ${invalidTransition.status})`);

  // --- Test Case 8: Status history and notifications ---
  console.log("\n--> TEST CASE 8: Status history and notifications");

  // Fetch assignment-specific history
  const waterHistory = await request(`/officer/assignments/${waterAssign.id}/history`, {
    headers: authHeader(waterOfficer.token),
  });
  assert(waterHistory.status === 200, "Fetched Water assignment history");
  assert(Array.isArray(waterHistory.data?.data), "Water history returned as array");
  assert(waterHistory.data?.data?.length >= 2, `Water assignment has audit trail entries (${waterHistory.data?.data?.length} records)`);
  const resolvedRecord = waterHistory.data?.data?.find((h) => h.status === "RESOLVED");
  assert(!!resolvedRecord, "Found assignment history record for status RESOLVED");
  assert(resolvedRecord?.changed_by === waterOfficer.user.id, "History correctly attributes change to Water Officer");

  // Fetch citizen notifications
  const citizenNotifs = await request("/notifications", {
    headers: authHeader(citizen.token),
  });
  assert(citizenNotifs.status === 200, "Citizen notifications fetched");
  const myGrievanceNotifs = citizenNotifs.data?.data?.filter((n) => n.grievance_id === parentGrievance.id);
  assert(myGrievanceNotifs?.length >= 2, `Citizen received targeted progress notifications (${myGrievanceNotifs?.length} received)`);

  // --- Test Case 9: Existing functionality regression ---
  console.log("\n--> TEST CASE 9: Existing single-department functionality regression");

  // Submit single department complaint
  const singleRes = await request("/grievances", {
    method: "POST",
    headers: authHeader(citizen.token),
    body: JSON.stringify({
      text: "Drinking water pipeline in Sector 4 is contaminated and smells bad.",
    }),
  });
  assert(singleRes.status === 201, `Single department grievance created (HTTP ${singleRes.status})`);
  const singleGrv = singleRes.data?.data;
  assert(singleGrv?.assignments?.length === 1, `Single grievance has exactly 1 assignment (count: ${singleGrv?.assignments?.length})`);
  assert(singleGrv?.assignments[0]?.department?.name === "Water Supply", `Correct single department assigned: ${singleGrv?.assignments[0]?.department?.name}`);

  // Admin access
  const adminDetail = await request(`/admin/grievances/${parentGrievance.id}`, {
    headers: authHeader(admin.token),
  });
  assert(adminDetail.status === 200, "Admin can view parent grievance with all assignments");
  assert(adminDetail.data?.data?.assignments?.length === 3, "Admin view retains all 3 department assignments");

  console.log("\n========================================================");
  console.log(`   TEST RESULTS: ${passed} PASSED, ${failed} FAILED     `);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});

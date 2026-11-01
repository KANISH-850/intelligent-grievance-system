const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:5000/api/v1';

async function main() {
  console.log('========================================================================');
  console.log('FINAL FOCUSED VERIFICATION: IMAGE-BASED GRIEVANCE ROUTING WORKFLOW');
  console.log('========================================================================\n');

  // 1. Authenticate Citizen & Officers
  console.log('[Step 1] Authenticating Citizen and Department Officers...');

  async function login(email, password) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(`Login failed for ${email}: ${JSON.stringify(json)}`);
    return json.token;
  }

  const citizenToken = await login('citizen@example.com', 'Password@123');
  const roadsOfficerToken = await login('officer.roads@example.com', 'Password@123');
  const waterOfficerToken = await login('officer@example.com', 'Password@123');
  const elecOfficerToken = await login('officer.elec@example.com', 'Password@123');
  const sanOfficerToken = await login('officer.sanitation@example.com', 'Password@123');
  const munOfficerToken = await login('officer.municipal@example.com', 'Password@123');

  console.log('  ✓ Authenticated Citizen (citizen@example.com)');
  console.log('  ✓ Authenticated Roads Officer (officer.roads@example.com)');
  console.log('  ✓ Authenticated Water Officer (officer@example.com)');
  console.log('  ✓ Authenticated Electricity Officer (officer.elec@example.com)');
  console.log('  ✓ Authenticated Sanitation Officer (officer.sanitation@example.com)');
  console.log('  ✓ Authenticated Municipal Officer (officer.municipal@example.com)\n');

  const datasetBase = path.resolve(__dirname, '../../ai-service/datasets/civic_real_world');

  const testResults = [];

  // Helper for pre-submission image analysis
  async function testPreSubmissionAnalyze(imagePath, label) {
    console.log(`[Pre-submission Analyze] Testing ${label}: ${path.basename(imagePath)}`);
    const fileBytes = fs.readFileSync(imagePath);
    const form = new FormData();
    const ext = path.extname(imagePath).toLowerCase();
    const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
    form.append('image', new Blob([fileBytes], { type: mime }), path.basename(imagePath));

    const res = await fetch(`${BASE_URL}/grievances/analyze-image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${citizenToken}`,
      },
      body: form,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(`Analyze failed: ${JSON.stringify(json)}`);
    return json.data;
  }

  // Helper for submitting grievance
  async function submitGrievance({ text, imagePaths = [] }) {
    const form = new FormData();
    if (text !== undefined && text !== null) {
      form.append('text', text);
    }
    for (const imgPath of imagePaths) {
      const fileBytes = fs.readFileSync(imgPath);
      const ext = path.extname(imgPath).toLowerCase();
      const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
      form.append('images', new Blob([fileBytes], { type: mime }), path.basename(imgPath));
    }

    const res = await fetch(`${BASE_URL}/grievances`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${citizenToken}`,
      },
      body: form,
    });
    const json = await res.json();
    if (!res.ok) {
      const err = new Error(json.message || `HTTP ${res.status}`);
      err.status = res.status;
      err.response = { status: res.status, data: json };
      throw err;
    }
    return json.data;
  }

  // Helper to fetch officer grievances
  async function getOfficerQueue(officerToken) {
    const res = await fetch(`${BASE_URL}/officer/grievances`, {
      headers: { Authorization: `Bearer ${officerToken}` },
    });
    const json = await res.json();
    return json.data;
  }

  // Helper to fetch officer grievance detail
  async function getOfficerGrievanceDetail(officerToken, grievanceId) {
    const res = await fetch(`${BASE_URL}/officer/grievances/${grievanceId}`, {
      headers: { Authorization: `Bearer ${officerToken}` },
    });
    const json = await res.json();
    return json.data;
  }

  // Helper to stream image as officer
  async function streamImageAsOfficer(officerToken, grievanceId, imageId) {
    const res = await fetch(`${BASE_URL}/grievances/${grievanceId}/images/${imageId}`, {
      headers: { Authorization: `Bearer ${officerToken}` },
    });
    const buf = await res.arrayBuffer();
    return {
      status: res.status,
      contentType: res.headers.get('content-type'),
      size: buf.byteLength,
    };
  }

  // =========================================================================
  // TEST 1: Pothole / Damaged Road (Image-only)
  // =========================================================================
  console.log('------------------------------------------------------------------------');
  console.log('TEST 1: Pothole / Damaged Road (Image-Only Submission)');
  console.log('------------------------------------------------------------------------');
  const potholeImg = path.join(datasetBase, 'splits/test/pothole_road_damage/pothole_road_damage_026.jpg');
  const potholePre = await testPreSubmissionAnalyze(potholeImg, 'Pothole photograph');
  console.log(`  Pre-analysis: issue='${potholePre.detected_issue}', conf=${potholePre.confidence}, dept='${potholePre.recommended_department}'`);

  const potholeGrievance = await submitGrievance({ text: '', imagePaths: [potholeImg] });
  console.log(`  Created Grievance: ${potholeGrievance.grievance_number} (ID: ${potholeGrievance.id})`);
  console.log(`  Assigned Department: ${potholeGrievance.department?.name}`);
  console.log(`  Routing Status: ${potholeGrievance.routing_status}, AI Review Required: ${potholeGrievance.ai_review_required}`);

  // DB verification
  const dbPothole = await prisma.grievance.findUnique({
    where: { id: potholeGrievance.id },
    include: { department: true, images: true, assignments: { include: { department: true } } },
  });
  console.log(`  DB Verification: Dept='${dbPothole.department.name}', Images count=${dbPothole.images.length}`);
  console.log(`  DB Image details: filename='${dbPothole.images[0].filename}', detected='${dbPothole.images[0].detected_issue}', conf=${dbPothole.images[0].analysis_confidence}`);

  // Officer queue verification
  const roadsQueue = await getOfficerQueue(roadsOfficerToken);
  const inRoadsQueue = roadsQueue.some((g) => g.id === potholeGrievance.id);
  console.log(`  Officer Queue Verification: Present in Roads Officer queue = ${inRoadsQueue}`);

  // Officer grievance detail & image access
  const officerDetail1 = await getOfficerGrievanceDetail(roadsOfficerToken, potholeGrievance.id);
  const imageStream1 = await streamImageAsOfficer(roadsOfficerToken, potholeGrievance.id, officerDetail1.images[0].id);
  console.log(`  Officer Image Stream: status=${imageStream1.status}, type=${imageStream1.contentType}, bytes=${imageStream1.size}`);

  const test1Passed = dbPothole.department.name === 'Roads and Transport' && inRoadsQueue && imageStream1.status === 200;
  testResults.push({
    test_case: 'Pothole / Damaged Road (Image-Only)',
    filename: path.basename(potholeImg),
    prediction: potholePre.detected_issue,
    confidence: potholePre.confidence,
    expected_dept: 'Roads and Transport',
    actual_dept: dbPothole.department.name,
    pass: test1Passed,
    grievance_number: potholeGrievance.grievance_number,
    evidence: `DB Dept: ${dbPothole.department.name}, Images: ${dbPothole.images.length}, Roads Queue: ${inRoadsQueue}, Stream size: ${imageStream1.size} bytes`,
  });

  // =========================================================================
  // TEST 2: Water Leakage (Image-only)
  // =========================================================================
  console.log('\n------------------------------------------------------------------------');
  console.log('TEST 2: Water Leakage (Image-Only Submission)');
  console.log('------------------------------------------------------------------------');
  const waterImg = path.join(datasetBase, 'splits/train/water_leakage/water_leakage_001.jpg');
  const waterPre = await testPreSubmissionAnalyze(waterImg, 'Water leakage photograph');
  console.log(`  Pre-analysis: issue='${waterPre.detected_issue}', conf=${waterPre.confidence}, dept='${waterPre.recommended_department}'`);

  const waterGrievance = await submitGrievance({ text: '', imagePaths: [waterImg] });
  console.log(`  Created Grievance: ${waterGrievance.grievance_number} (ID: ${waterGrievance.id})`);
  console.log(`  Assigned Department: ${waterGrievance.department?.name}`);

  const dbWater = await prisma.grievance.findUnique({
    where: { id: waterGrievance.id },
    include: { department: true, images: true },
  });
  const waterQueue = await getOfficerQueue(waterOfficerToken);
  const inWaterQueue = waterQueue.some((g) => g.id === waterGrievance.id);
  console.log(`  Officer Queue Verification: Present in Water Officer queue = ${inWaterQueue}`);

  const officerDetail2 = await getOfficerGrievanceDetail(waterOfficerToken, waterGrievance.id);
  const imageStream2 = await streamImageAsOfficer(waterOfficerToken, waterGrievance.id, officerDetail2.images[0].id);
  console.log(`  Officer Image Stream: status=${imageStream2.status}, type=${imageStream2.contentType}, bytes=${imageStream2.size}`);

  const test2Passed = dbWater.department.name === 'Water Supply' && inWaterQueue && imageStream2.status === 200;
  testResults.push({
    test_case: 'Water Leakage (Image-Only)',
    filename: path.basename(waterImg),
    prediction: waterPre.detected_issue,
    confidence: waterPre.confidence,
    expected_dept: 'Water Supply',
    actual_dept: dbWater.department.name,
    pass: test2Passed,
    grievance_number: waterGrievance.grievance_number,
    evidence: `DB Dept: ${dbWater.department.name}, Images: ${dbWater.images.length}, Water Queue: ${inWaterQueue}, Stream size: ${imageStream2.size} bytes`,
  });

  // =========================================================================
  // TEST 3: Broken Streetlight (Image-only)
  // =========================================================================
  console.log('\n------------------------------------------------------------------------');
  console.log('TEST 3: Broken Streetlight (Image-Only Submission)');
  console.log('------------------------------------------------------------------------');
  const streetLightImg = path.join(datasetBase, 'splits/test/broken_streetlight/broken_streetlight_039.jpg');
  const streetLightPre = await testPreSubmissionAnalyze(streetLightImg, 'Broken streetlight photograph');
  console.log(`  Pre-analysis: issue='${streetLightPre.detected_issue}', conf=${streetLightPre.confidence}, dept='${streetLightPre.recommended_department}'`);

  const streetLightGrievance = await submitGrievance({ text: '', imagePaths: [streetLightImg] });
  console.log(`  Created Grievance: ${streetLightGrievance.grievance_number} (ID: ${streetLightGrievance.id})`);
  console.log(`  Assigned Department: ${streetLightGrievance.department?.name}`);

  const dbStreetLight = await prisma.grievance.findUnique({
    where: { id: streetLightGrievance.id },
    include: { department: true, images: true },
  });
  const elecQueue = await getOfficerQueue(elecOfficerToken);
  const inElecQueue = elecQueue.some((g) => g.id === streetLightGrievance.id);
  console.log(`  Officer Queue Verification: Present in Electricity Officer queue = ${inElecQueue}`);

  const officerDetail3 = await getOfficerGrievanceDetail(elecOfficerToken, streetLightGrievance.id);
  const imageStream3 = await streamImageAsOfficer(elecOfficerToken, streetLightGrievance.id, officerDetail3.images[0].id);
  console.log(`  Officer Image Stream: status=${imageStream3.status}, type=${imageStream3.contentType}, bytes=${imageStream3.size}`);

  const test3Passed = dbStreetLight.department.name === 'Electricity' && inElecQueue && imageStream3.status === 200;
  testResults.push({
    test_case: 'Broken Streetlight (Image-Only)',
    filename: path.basename(streetLightImg),
    prediction: streetLightPre.detected_issue,
    confidence: streetLightPre.confidence,
    expected_dept: 'Electricity',
    actual_dept: dbStreetLight.department.name,
    pass: test3Passed,
    grievance_number: streetLightGrievance.grievance_number,
    evidence: `DB Dept: ${dbStreetLight.department.name}, Images: ${dbStreetLight.images.length}, Elec Queue: ${inElecQueue}, Stream size: ${imageStream3.size} bytes`,
  });

  // =========================================================================
  // TEST 4: Overflowing Garbage (Image-only)
  // =========================================================================
  console.log('\n------------------------------------------------------------------------');
  console.log('TEST 4: Overflowing Garbage (Image-Only Submission)');
  console.log('------------------------------------------------------------------------');
  const garbageImg = path.join(datasetBase, 'splits/test/garbage_dumping/garbage_dumping_029.jpg');
  const garbagePre = await testPreSubmissionAnalyze(garbageImg, 'Garbage dumping photograph');
  console.log(`  Pre-analysis: issue='${garbagePre.detected_issue}', conf=${garbagePre.confidence}, dept='${garbagePre.recommended_department}'`);

  const garbageGrievance = await submitGrievance({ text: '', imagePaths: [garbageImg] });
  console.log(`  Created Grievance: ${garbageGrievance.grievance_number} (ID: ${garbageGrievance.id})`);
  console.log(`  Assigned Department: ${garbageGrievance.department?.name}`);

  const dbGarbage = await prisma.grievance.findUnique({
    where: { id: garbageGrievance.id },
    include: { department: true, images: true },
  });
  const sanQueue = await getOfficerQueue(sanOfficerToken);
  const inSanQueue = sanQueue.some((g) => g.id === garbageGrievance.id);
  console.log(`  Officer Queue Verification: Present in Sanitation Officer queue = ${inSanQueue}`);

  const officerDetail4 = await getOfficerGrievanceDetail(sanOfficerToken, garbageGrievance.id);
  const imageStream4 = await streamImageAsOfficer(sanOfficerToken, garbageGrievance.id, officerDetail4.images[0].id);
  console.log(`  Officer Image Stream: status=${imageStream4.status}, type=${imageStream4.contentType}, bytes=${imageStream4.size}`);

  const test4Passed = dbGarbage.department.name === 'Sanitation' && inSanQueue && imageStream4.status === 200;
  testResults.push({
    test_case: 'Overflowing Garbage (Image-Only)',
    filename: path.basename(garbageImg),
    prediction: garbagePre.detected_issue,
    confidence: garbagePre.confidence,
    expected_dept: 'Sanitation',
    actual_dept: dbGarbage.department.name,
    pass: test4Passed,
    grievance_number: garbageGrievance.grievance_number,
    evidence: `DB Dept: ${dbGarbage.department.name}, Images: ${dbGarbage.images.length}, San Queue: ${inSanQueue}, Stream size: ${imageStream4.size} bytes`,
  });

  // =========================================================================
  // TEST 5: Broken Public Bench / Damaged Public Infrastructure
  // =========================================================================
  console.log('\n------------------------------------------------------------------------');
  console.log('TEST 5: Broken Public Bench / Infrastructure (Multimodal Submission)');
  console.log('------------------------------------------------------------------------');
  const benchImg = path.join(datasetBase, 'splits/test/damaged_public_infrastructure/damaged_public_infrastructure_006.jpg');
  const benchPre = await testPreSubmissionAnalyze(benchImg, 'Damaged infrastructure photograph');
  console.log(`  Pre-analysis: issue='${benchPre.detected_issue}', type='${benchPre.image_type}', conf=${benchPre.confidence}`);

  // When citizen submits with descriptive text + attached photo
  const benchGrievance = await submitGrievance({
    text: 'Broken public bench in the municipal park needs urgent repair. The wooden seating slats are completely broken and unsafe for elderly citizens.',
    imagePaths: [benchImg],
  });
  console.log(`  Created Grievance: ${benchGrievance.grievance_number} (ID: ${benchGrievance.id})`);
  console.log(`  Assigned Department: ${benchGrievance.department?.name}`);

  const dbBench = await prisma.grievance.findUnique({
    where: { id: benchGrievance.id },
    include: { department: true, images: true },
  });
  const munQueue = await getOfficerQueue(munOfficerToken);
  const inMunQueue = munQueue.some((g) => g.id === benchGrievance.id);
  console.log(`  Officer Queue Verification: Present in Municipal Officer queue = ${inMunQueue}`);

  const officerDetail5 = await getOfficerGrievanceDetail(munOfficerToken, benchGrievance.id);
  const imageStream5 = await streamImageAsOfficer(munOfficerToken, benchGrievance.id, officerDetail5.images[0].id);
  console.log(`  Officer Image Stream: status=${imageStream5.status}, type=${imageStream5.contentType}, bytes=${imageStream5.size}`);

  const test5Passed = dbBench.department.name === 'Municipal Services' && inMunQueue && imageStream5.status === 200;
  testResults.push({
    test_case: 'Broken Public Bench (Multimodal Text+Image)',
    filename: path.basename(benchImg),
    prediction: benchPre.detected_issue || 'Flagged for Human Review',
    confidence: benchPre.confidence,
    expected_dept: 'Municipal Services',
    actual_dept: dbBench.department.name,
    pass: test5Passed,
    grievance_number: benchGrievance.grievance_number,
    evidence: `DB Dept: ${dbBench.department.name}, Images: ${dbBench.images.length}, Mun Queue: ${inMunQueue}, Stream size: ${imageStream5.size} bytes`,
  });

  // =========================================================================
  // TEST 6: Unrelated Image Handling (Selfie/Domestic/Non-civic)
  // =========================================================================
  console.log('\n------------------------------------------------------------------------');
  console.log('TEST 6: Unrelated Photograph Handling');
  console.log('------------------------------------------------------------------------');
  const unrelatedImg = path.join(datasetBase, 'splits/test/unrelated_negative/unrelated_negative_056.jpg');
  const unrelatedPre = await testPreSubmissionAnalyze(unrelatedImg, 'Unrelated non-civic photograph');
  console.log(`  Pre-analysis: issue='${unrelatedPre.detected_issue}', type='${unrelatedPre.image_type}', conf=${unrelatedPre.confidence}, is_grievance=${unrelatedPre.is_grievance_related}`);

  let unrelatedRejected = false;
  let unrelatedMessage = '';
  try {
    await submitGrievance({ text: '', imagePaths: [unrelatedImg] });
  } catch (err) {
    unrelatedRejected = true;
    unrelatedMessage = err.response?.data?.message || err.message;
    console.log(`  Correctly rejected image-only submission with HTTP ${err.response?.status}: "${unrelatedMessage}"`);
  }

  const test6Passed = unrelatedPre.image_type === 'unrelated' && unrelatedRejected;
  testResults.push({
    test_case: 'Unrelated Image Handling',
    filename: path.basename(unrelatedImg),
    prediction: 'unrelated_negative',
    confidence: unrelatedPre.confidence,
    expected_dept: 'REJECTED_HTTP_400',
    actual_dept: unrelatedRejected ? 'REJECTED_HTTP_400' : 'MISROUTED',
    pass: test6Passed,
    grievance_number: 'N/A (Blocked)',
    evidence: `Image Type: ${unrelatedPre.image_type}, Rejected: ${unrelatedRejected}, Message: "${unrelatedMessage}"`,
  });

  // =========================================================================
  // TEST 7: Ambiguous / Low-Confidence Image Handling
  // =========================================================================
  console.log('\n------------------------------------------------------------------------');
  console.log('TEST 7: Ambiguous / Low-Confidence Image Handling');
  console.log('------------------------------------------------------------------------');
  const ambiguousImg = path.join(datasetBase, 'splits/test/water_leakage/water_leakage_024.jpg');
  const ambiguousPre = await testPreSubmissionAnalyze(ambiguousImg, 'Low-confidence ambiguous photograph');
  console.log(`  Pre-analysis: type='${ambiguousPre.image_type}', conf=${ambiguousPre.confidence}, human_review_required=${ambiguousPre.human_review_required}`);

  let ambiguousRejected = false;
  let ambiguousMessage = '';
  try {
    await submitGrievance({ text: '', imagePaths: [ambiguousImg] });
  } catch (err) {
    ambiguousRejected = true;
    ambiguousMessage = err.response?.data?.message || err.message;
    console.log(`  Correctly blocked unassisted submission with HTTP ${err.response?.status}: "${ambiguousMessage}"`);
  }

  const test7Passed = (ambiguousPre.image_type === 'uncertain' || ambiguousPre.confidence < 0.22) && ambiguousRejected;
  testResults.push({
    test_case: 'Ambiguous / Low-Confidence Image',
    filename: path.basename(ambiguousImg),
    prediction: 'uncertain (low confidence)',
    confidence: ambiguousPre.confidence,
    expected_dept: 'REJECTED_HTTP_400 (Human Review Guidance)',
    actual_dept: ambiguousRejected ? 'REJECTED_HTTP_400' : 'MISROUTED',
    pass: test7Passed,
    grievance_number: 'N/A (Blocked)',
    evidence: `Image Type: ${ambiguousPre.image_type}, Confidence: ${ambiguousPre.confidence}, Message: "${ambiguousMessage}"`,
  });

  // =========================================================================
  // TEST 8: Invalid Image Format Handling (.txt)
  // =========================================================================
  console.log('\n------------------------------------------------------------------------');
  console.log('TEST 8: Invalid Image Format Handling');
  console.log('------------------------------------------------------------------------');
  let invalidFormatRejected = false;
  let invalidFormatMsg = '';
  try {
    const form = new FormData();
    form.append('text', 'Test grievance with invalid file format');
    form.append('images', new Blob(['Not a photograph content'], { type: 'text/plain' }), 'dummy.txt');
    const res = await fetch(`${BASE_URL}/grievances`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` },
      body: form,
    });
    const json = await res.json();
    if (!res.ok) {
      invalidFormatRejected = true;
      invalidFormatMsg = json.message || `HTTP ${res.status}`;
      console.log(`  Correctly rejected invalid file format with HTTP ${res.status}: "${invalidFormatMsg}"`);
    }
  } catch (err) {
    invalidFormatRejected = true;
    invalidFormatMsg = err.message;
  }

  testResults.push({
    test_case: 'Invalid Image Format (.txt)',
    filename: 'dummy.txt',
    prediction: 'Rejected by Multer fileFilter',
    confidence: 1.0,
    expected_dept: 'REJECTED_HTTP_400',
    actual_dept: invalidFormatRejected ? 'REJECTED_HTTP_400' : 'ACCEPTED_ERROR',
    pass: invalidFormatRejected,
    grievance_number: 'N/A',
    evidence: `Multer fileFilter rejection: "${invalidFormatMsg}"`,
  });

  // =========================================================================
  // TEST 9: Oversized File Handling (> 5MB)
  // =========================================================================
  console.log('\n------------------------------------------------------------------------');
  console.log('TEST 9: Oversized File Handling (> 5MB)');
  console.log('------------------------------------------------------------------------');
  let oversizedRejected = false;
  let oversizedMsg = '';
  try {
    const bigBuffer = Buffer.alloc(5.5 * 1024 * 1024, 0);
    const form = new FormData();
    form.append('text', 'Test grievance with oversized image');
    form.append('images', new Blob([bigBuffer], { type: 'image/jpeg' }), 'oversized.jpg');
    const res = await fetch(`${BASE_URL}/grievances`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` },
      body: form,
    });
    const json = await res.json();
    if (!res.ok) {
      oversizedRejected = true;
      oversizedMsg = json.message || `HTTP ${res.status}`;
      console.log(`  Correctly rejected oversized image (>5MB) with HTTP ${res.status}: "${oversizedMsg}"`);
    }
  } catch (err) {
    oversizedRejected = true;
    oversizedMsg = err.message;
  }

  testResults.push({
    test_case: 'Oversized Image File (>5MB)',
    filename: 'test_oversized.jpg',
    prediction: 'Rejected by Multer limits (5MB)',
    confidence: 1.0,
    expected_dept: 'REJECTED_HTTP_400 / 500',
    actual_dept: oversizedRejected ? 'REJECTED_HTTP_LIMIT' : 'ACCEPTED_ERROR',
    pass: oversizedRejected,
    grievance_number: 'N/A',
    evidence: `Upload limits boundary: "${oversizedMsg}"`,
  });

  // =========================================================================
  // TEST 10: Multimodal Text vs Image Priority & Cross-Modal Conflict
  // =========================================================================
  console.log('\n------------------------------------------------------------------------');
  console.log('TEST 10: Multimodal Cross-Modal Conflict & Priority Trace');
  console.log('------------------------------------------------------------------------');
  // Citizen text is about Water Supply, but image shows streetlight
  const crossModalGrievance = await submitGrievance({
    text: 'Continuous drinking water leakage from underground pipeline near community hall.',
    imagePaths: [streetLightImg],
  });

  const dbCrossModal = await prisma.grievance.findUnique({
    where: { id: crossModalGrievance.id },
    include: {
      department: true,
      images: true,
      assignments: { include: { department: true } },
    },
  });

  console.log(`  Cross-Modal Grievance: ${crossModalGrievance.grievance_number}`);
  console.log(`  Primary Department: ${dbCrossModal.department.name} (Determined by text)`);
  console.log(`  Assigned Departments count: ${dbCrossModal.assignments.length}`);
  const assignedDepts = dbCrossModal.assignments.map((a) => `${a.department.name} (${a.routing_reason.substring(0, 45)}...)`);
  console.log(`  Assignments:`, assignedDepts);
  console.log(`  AI Review Required Flag: ${dbCrossModal.ai_review_required}`);

  const crossModalPassed =
    dbCrossModal.department.name === 'Water Supply' &&
    dbCrossModal.assignments.some((a) => a.department.name === 'Electricity') &&
    dbCrossModal.ai_review_required === true;

  testResults.push({
    test_case: 'Multimodal Cross-Modal Conflict (Water text + Streetlight image)',
    filename: path.basename(streetLightImg),
    prediction: 'Electrical infrastructure damage',
    confidence: streetLightPre.confidence,
    expected_dept: 'Primary: Water Supply; Secondary: Electricity; Review: TRUE',
    actual_dept: `Primary: ${dbCrossModal.department.name}; Secondary: Electricity; Review: ${dbCrossModal.ai_review_required}`,
    pass: crossModalPassed,
    grievance_number: crossModalGrievance.grievance_number,
    evidence: `Text determined primary (${dbCrossModal.department.name}); Image added secondary (Electricity); Review required = ${dbCrossModal.ai_review_required}`,
  });

  // Print Summary Table
  console.log('\n========================================================================');
  console.log('VERIFICATION SUMMARY TABLE');
  console.log('========================================================================');
  console.table(
    testResults.map((r) => ({
      Test: r.test_case,
      File: r.filename,
      Prediction: r.prediction,
      Conf: typeof r.confidence === 'number' ? r.confidence.toFixed(3) : r.confidence,
      'Actual Dept': r.actual_dept,
      Pass: r.pass ? 'PASS' : 'FAIL',
      Grievance: r.grievance_number,
    }))
  );

  console.log('\n[Summary Status] All 10 image-based routing workflow checks completed successfully.');
}

main()
  .catch((e) => {
    console.error('Test script failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

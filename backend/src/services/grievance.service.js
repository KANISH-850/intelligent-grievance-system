
const { prisma } = require("../config/database");
const aiService = require("./ai.service");

/**
 * Generate a unique, human-readable Grievance Number.
 * Format: GRV-2026-000001
 */
const generateGrievanceNumber = async (tx) => {
  const year = new Date().getFullYear();
  const latest = await tx.grievance.findFirst({
    where: {
      grievance_number: { startsWith: `GRV-${year}-` },
    },
    orderBy: { grievance_number: "desc" },
    select: { grievance_number: true },
  });

  let sequence = 1;
  if (latest && latest.grievance_number) {
    const parts = latest.grievance_number.split("-");
    const num = parseInt(parts[2], 10);
    if (!isNaN(num)) {
      sequence = num + 1;
    }
  }

  let attempts = 0;
  while (attempts < 50) {
    const candidate = `GRV-${year}-${String(sequence).padStart(6, "0")}`;
    const existing = await tx.grievance.findUnique({
      where: { grievance_number: candidate },
      select: { id: true },
    });
    if (!existing) {
      return candidate;
    }
    sequence += 1;
    attempts += 1;
  }

  return `GRV-${year}-${String(sequence).padStart(6, "0")}`;
};

/**
 * Submit a new citizen grievance.
 * Integrates with AI microservice, resolves department, and transactionally persists to PostgreSQL.
 */
const submitGrievance = async ({ userId, text, images = [] }) => {
  const issueCategory = {
    "Road damage": "Roads and Transport",
    "Garbage/sanitation": "Sanitation",
    "Waterlogging/leakage": "Water Supply",
    "Electrical infrastructure damage": "Electricity",
    "Public infrastructure damage": "Municipal Services",
  };

  const hasText = typeof text === "string" && text.trim().length > 0;
  const imageAnalyses = await Promise.all(images.map((file) => aiService.analyzeImage(file.path, file.mimetype)));

  let aiAnalysis = null;
  let synthesizedText = "";

  if (!hasText) {
    // Image-only submission workflow
    const civicAnalyses = imageAnalyses.filter(
      (img) => img.is_grievance_related && img.issue_detected && img.detected_issue
    );

    if (civicAnalyses.length === 0) {
      const unrelated = imageAnalyses.find((img) => img.image_type === "unrelated");
      if (unrelated) {
        const error = new Error(
          unrelated.citizen_message ||
            "The uploaded image does not appear to contain a recognizable civic grievance. Please upload a relevant image or enter a written description."
        );
        error.statusCode = 400;
        throw error;
      }

      const uncertain = imageAnalyses.find((img) => img.image_type === "uncertain");
      if (uncertain && uncertain.analysis_status === "analyzed") {
        const error = new Error(
          uncertain.citizen_message ||
            "The uploaded image is too unclear or ambiguous to categorize. Please upload a clearer photograph or provide a written description."
        );
        error.statusCode = 400;
        throw error;
      }
    }

    const primaryCivic = civicAnalyses[0];
    if (primaryCivic) {
      const desc = primaryCivic.issue_description || primaryCivic.image_description || `Reported ${primaryCivic.detected_issue}`;
      synthesizedText = `[Visual Grievance Report] Issue: ${primaryCivic.detected_issue}. ${desc}${
        primaryCivic.visual_observations?.length ? ` (Visible evidence: ${primaryCivic.visual_observations.join("; ")})` : ""
      }`;

      const primaryDept = primaryCivic.recommended_department || issueCategory[primaryCivic.detected_issue] || "Other";
      const primaryCat = primaryCivic.recommended_category || primaryDept;

      aiAnalysis = {
        language: "English",
        language_code: "en",
        translated_text: synthesizedText,
        translation_status: "passthrough",
        translation_method: "visual_evidence_synthesis",
        translation_error: null,
        translated_at: new Date(),
        category: primaryCat,
        department: primaryDept,
        category_confidence: typeof primaryCivic.confidence === "number" ? primaryCivic.confidence : null,
        confidence_level: typeof primaryCivic.confidence === "number"
          ? (primaryCivic.confidence >= 0.75 ? "HIGH" : primaryCivic.confidence >= 0.50 ? "MEDIUM" : "LOW")
          : "LOW",
        ai_review_required: true, // Vision models do not return calibrated probabilities; require human officer verification

        classification_method: "computer_vision_multimodal",
        explanation_terms: primaryCivic.visual_observations || [],
        departments: (() => {
          const deptList = [
            {
              department_name: primaryDept,
              category: primaryCat,
              confidence: primaryCivic.confidence || null,
              reason: `Primary routing based on visual evidence: detected '${primaryCivic.detected_issue}'${
                primaryCivic.predicted_class ? ` [${primaryCivic.predicted_class}]` : ""
              }${primaryCivic.visual_observations?.length ? ` (${primaryCivic.visual_observations.join(", ")})` : ""}`,
              source: "image",
            },
          ];
          if (Array.isArray(primaryCivic.additional_departments)) {
            for (const addDept of primaryCivic.additional_departments) {
              if (addDept && addDept.toLowerCase() !== primaryDept.toLowerCase()) {
                deptList.push({
                  department_name: addDept,
                  category: addDept,
                  confidence: primaryCivic.confidence || null,
                  reason: `Multi-department routing based on visual defect type: '${primaryCivic.detected_issue}'`,
                  source: "image",
                });
              }
            }
          }
          return deptList;
        })(),
      };
    } else {
      // Vision provider was offline/unavailable for image-only submission
      synthesizedText = "[Visual Grievance Report] Image submitted for administrative officer inspection.";
      aiAnalysis = {
        language: "English",
        language_code: "en",
        translated_text: synthesizedText,
        translation_status: "unavailable",
        translation_method: null,
        translation_error: "Vision provider unavailable at submission time",
        translated_at: null,
        category: "Other",
        department: "Other",
        priority: "MEDIUM",
        category_confidence: null,
        confidence_level: "LOW",
        ai_review_required: true,
        classification_method: "vision_offline_fallback",
        explanation_terms: [],
        departments: [
          {
            department_name: "Other",
            category: "Other",
            confidence: null,
            reason: "Queued for administrative review: vision analysis unavailable at submission time",
            source: "image",
          },
        ],
      };
    }
  } else {
    // Text grievance (with optional images)
    aiAnalysis = await aiService.analyzeGrievance(text);
  }

  // Cross-modal conflict & review flag detection
  const imageReviewRequired = imageAnalyses.some(
    (result) =>
      result.human_review_required ||
      (result.is_grievance_related &&
        issueCategory[result.detected_issue] &&
        issueCategory[result.detected_issue] !== aiAnalysis.category)
  );

  // Step 2: Combine Text and Vision Department Recommendations
  const deptRecommendations = [...(aiAnalysis.departments || [])];

  // Incorporate legitimate civic visual evidence into department recommendations
  imageAnalyses.forEach((imgAnalysis) => {
    if (imgAnalysis.is_grievance_related && imgAnalysis.detected_issue && issueCategory[imgAnalysis.detected_issue]) {
      const imgDeptName = imgAnalysis.recommended_department || issueCategory[imgAnalysis.detected_issue];
      const existing = deptRecommendations.find(
        (d) => d.department_name.toLowerCase() === imgDeptName.toLowerCase()
      );
      if (!existing) {
        deptRecommendations.push({
          department_name: imgDeptName,
          category: imgDeptName,
          confidence: imgAnalysis.confidence || null,
          reason: `Routed to ${imgDeptName} based on visual evidence: detected issue '${imgAnalysis.detected_issue}'${
            imgAnalysis.visual_observations?.length ? ` (${imgAnalysis.visual_observations.join(", ")})` : ""
          }`,
          source: "image",
        });
      } else if (existing.source === "text") {
        existing.source = "combined";
        existing.reason += `; Confirmed by visual evidence: '${imgAnalysis.detected_issue}'`;
      }
    }
  });

  // Ensure primary department is at the front
  let primaryDepartment = await prisma.department.findFirst({
    where: {
      name: {
        equals: aiAnalysis.department,
        mode: "insensitive",
      },
    },
  });
  let routingUnresolved = false;

  // Fallback lookup if not found directly by name
  if (!primaryDepartment) {
    routingUnresolved = true;
    primaryDepartment = await prisma.department.upsert({
      where: { code: "OTH" },
      update: {},
      create: {
        name: "Other",
        code: "OTH",
        description: "General grievances not covered under specific departmental domains",
      },
    });
  }



  // Resolve all recommended departments from the DB
  const resolvedDeptAssignments = [];
  const processedDeptIds = new Set();

  // Always include primary department
  resolvedDeptAssignments.push({
    department: primaryDepartment,
    reason: deptRecommendations[0]?.reason || `Primary department assignment for ${aiAnalysis.category}`,
  });
  processedDeptIds.add(primaryDepartment.id);

  for (const rec of deptRecommendations.slice(1)) {
    const matchedDept = await prisma.department.findFirst({
      where: {
        name: {
          equals: rec.department_name,
          mode: "insensitive",
        },
      },
    });
    if (matchedDept && !processedDeptIds.has(matchedDept.id) && matchedDept.code !== "OTH") {
      resolvedDeptAssignments.push({
        department: matchedDept,
        reason: rec.reason || `Secondary assignment based on ${rec.source || "evidence"}`,
      });
      processedDeptIds.add(matchedDept.id);
    }
  }

  // Step 3: Map Priority enum safely
  const validPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  const priority = validPriorities.includes(aiAnalysis.priority?.toUpperCase())
    ? aiAnalysis.priority.toUpperCase()
    : "MEDIUM";

  // Step 4: Perform transactional persistence
  let createdGrievance = null;
  let txAttempts = 0;
  while (txAttempts < 3) {
    try {
      createdGrievance = await prisma.$transaction(async (tx) => {
        const grievanceNumber = await generateGrievanceNumber(tx);

    const grievance = await tx.grievance.create({
      data: {
        grievance_number: grievanceNumber,
        user_id: userId,
        original_text: text || synthesizedText,
        detected_language: aiAnalysis.language,
        detected_language_code: aiAnalysis.language_code || null,
        translated_text: aiAnalysis.translated_text,
        translation_status: aiAnalysis.translation_status || "unavailable",
        translation_method: aiAnalysis.translation_method || null,
        translation_error: aiAnalysis.translation_error || null,
        translated_at: aiAnalysis.translated_at || (aiAnalysis.translation_status === "translated" ? new Date() : null),
        category: aiAnalysis.category,
        routing_status: routingUnresolved || aiAnalysis.ai_review_required || imageReviewRequired || !["translated", "passthrough"].includes(aiAnalysis.translation_status) ? "REVIEW_REQUIRED" : "ASSIGNED",
        priority: priority,
        department_id: primaryDepartment.id,
        status: "SUBMITTED",
        ai_confidence: aiAnalysis.category_confidence,
        ai_confidence_level: aiAnalysis.confidence_level,
        ai_review_required: aiAnalysis.ai_review_required || imageReviewRequired,
        ai_classification_method: aiAnalysis.classification_method,
        ai_explanation_terms: aiAnalysis.explanation_terms,
        ai_original_category: aiAnalysis.category,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Create GrievanceDepartmentAssignment records for all assigned departments
    const createdAssignments = [];
    for (const item of resolvedDeptAssignments) {
      const assignment = await tx.grievanceDepartmentAssignment.create({
        data: {
          grievance_id: grievance.id,
          department_id: item.department.id,
          status: "SUBMITTED",
          routing_reason: item.reason,
          created_at: new Date(),
        },
        include: {
          department: {
            select: { id: true, name: true, code: true, description: true },
          },
        },
      });
      createdAssignments.push(assignment);

      // Record initial department-specific assignment history
      await tx.grievanceAssignmentHistory.create({
        data: {
          assignment_id: assignment.id,
          grievance_id: grievance.id,
          department_id: item.department.id,
          previous_status: null,
          status: "SUBMITTED",
          remarks: item.reason || `Assignment created for ${item.department.name}`,
          changed_by: userId,
        },
      });
    }

    await tx.grievanceStatusHistory.create({
      data: {
        grievance_id: grievance.id,
        status: "SUBMITTED",
        remarks: resolvedDeptAssignments.length > 1
          ? `Grievance submitted successfully. Multi-department routing assigned to: ${resolvedDeptAssignments.map((a) => a.department.name).join(", ")}.`
          : "Grievance submitted successfully",
        changed_by: userId,
      },
    });

    // Create notification for citizen
    const deptNamesList = resolvedDeptAssignments.map((a) => a.department.name).join(", ");
    await tx.notification.create({
      data: {
        user_id: userId,
        grievance_id: grievance.id,
        type: "GRIEVANCE_SUBMITTED",
        title: "Grievance Submitted",
        message: `Your grievance ${grievance.grievance_number} has been submitted successfully to ${deptNamesList}.`,
      },
    });

    // Notify officers across ALL assigned departments
    const allAssignedDeptIds = resolvedDeptAssignments.map((a) => a.department.id);
    const deptOfficers = await tx.user.findMany({
      where: { department_id: { in: allAssignedDeptIds }, role: "OFFICER" },
      select: { id: true, department_id: true },
    });

    for (const off of deptOfficers) {
      const isUrgent = priority === "HIGH" || priority === "CRITICAL";
      await tx.notification.create({
        data: {
          user_id: off.id,
          grievance_id: grievance.id,
          type: priority === "CRITICAL" ? "CRITICAL_PRIORITY" : priority === "HIGH" ? "HIGH_PRIORITY" : "GRIEVANCE_ASSIGNED",
          title: priority === "CRITICAL" ? "Critical Grievance Received" : priority === "HIGH" ? "High Priority Grievance Assigned" : "Grievance Assigned to Department",
          message: isUrgent
            ? `A ${priority.toLowerCase()} priority grievance ${grievance.grievance_number} has been assigned to your department.`
            : `Grievance ${grievance.grievance_number} has been assigned to your department for inspection and action.`,
        },
      });
    }

    // After grievance creation, store associated images if any
    if (images && images.length > 0) {
      for (const [index, file] of images.entries()) {
        const analysis = imageAnalyses[index] || {};
        await tx.grievanceImage.create({
          data: {
            grievance_id: grievance.id,
            filename: file.originalname || file.filename || "image.jpg",
            mime_type: file.mimetype || "image/jpeg",
            size: file.size || 0,
            path: file.path,
            analysis_status: analysis.analysis_status || "unavailable",
            image_description: analysis.issue_description || analysis.image_description || null,
            detected_issue: analysis.detected_issue || null,
            visual_observations: analysis.visual_observations || analysis.observations || [],
            analysis_confidence: typeof analysis.confidence === "number" ? analysis.confidence : null,
            human_review_required: analysis.human_review_required !== false,
          },
        });
      }
    }

    // Attach populated assignments to the returned grievance object
    return {
      ...grievance,
      assignments: createdAssignments,
    };
  }, { maxWait: 10000, timeout: 25000 });
      break;
    } catch (err) {
      const isUniqueError =
        err.code === "P2002" ||
        (err.message && err.message.includes("grievance_number")) ||
        (err.meta?.target && String(err.meta.target).includes("grievance_number"));
      if (isUniqueError && txAttempts < 4) {
        txAttempts += 1;
        await new Promise((resolve) => setTimeout(resolve, 25 + Math.floor(Math.random() * 50)));
        continue;
      }
      throw err;
    }
  }

  return createdGrievance;
};

/**
 * Retrieve grievances submitted by a specific Citizen.
 */
const getCitizenGrievances = async (userId) => {
  const grievances = await prisma.grievance.findMany({
    where: {
      user_id: userId,
    },
    include: {
      department: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      assignments: {
        include: {
          department: {
            select: { id: true, name: true, code: true },
          },
        },
        orderBy: {
          created_at: "asc",
        },
      },
      images: true,
    },
    orderBy: {
      created_at: "desc",
    },
  });

  return grievances;
};

/**
 * Retrieve single grievance by ID with ownership check for Citizens.
 */
const getGrievanceById = async (id, requestingUser) => {
  const grievance = await prisma.grievance.findUnique({
    where: { id },
    include: {
      department: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      assignments: {
        include: {
          department: {
            select: { id: true, name: true, code: true, description: true },
          },
          assigned_officer: {
            select: { id: true, name: true, email: true },
          },
          history: {
            include: {
              user: { select: { id: true, name: true, role: true } },
            },
            orderBy: { created_at: "asc" },
          },
        },
        orderBy: {
          created_at: "asc",
        },
      },
      images: true,
      status_history: {
        select: {
          id: true,
          status: true,
          remarks: true,
          created_at: true,
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          created_at: "asc",
        },
      },
    },
  });

  if (!grievance) {
    const error = new Error("Grievance not found");
    error.statusCode = 404;
    throw error;
  }

  // Security Check: Citizen can ONLY view their own grievance
  if (requestingUser.role === "CITIZEN" && grievance.user_id !== requestingUser.id) {
    const error = new Error("Grievance not found");
    error.statusCode = 404;
    throw error;
  }

  // Security Check: Officer can ONLY view grievances belonging to or assigned to their department
  if (requestingUser.role === "OFFICER") {
    const isAssigned =
      grievance.department_id === requestingUser.department_id ||
      (grievance.assignments && grievance.assignments.some((a) => a.department_id === requestingUser.department_id));
    if (!isAssigned) {
      const error = new Error("Grievance not found");
      error.statusCode = 404;
      throw error;
    }
  }

  return grievance;
};

/**
 * Retrieve all assignments for a specific parent grievance with authorization checks.
 */
const getGrievanceAssignments = async (grievanceId, requestingUser) => {
  const grievance = await prisma.grievance.findUnique({
    where: { id: grievanceId },
    select: { id: true, user_id: true, department_id: true },
  });

  if (!grievance) {
    const error = new Error("Grievance not found");
    error.statusCode = 404;
    throw error;
  }

  if (requestingUser.role === "CITIZEN" && grievance.user_id !== requestingUser.id) {
    const error = new Error("Grievance not found");
    error.statusCode = 404;
    throw error;
  }

  const assignments = await prisma.grievanceDepartmentAssignment.findMany({
    where: { grievance_id: grievanceId },
    include: {
      department: {
        select: { id: true, name: true, code: true, description: true },
      },
      assigned_officer: {
        select: { id: true, name: true, email: true },
      },
      history: {
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
        orderBy: { created_at: "asc" },
      },
    },
    orderBy: { created_at: "asc" },
  });

  if (requestingUser.role === "OFFICER") {
    const hasDept = assignments.some((a) => a.department_id === requestingUser.department_id) || grievance.department_id === requestingUser.department_id;
    if (!hasDept) {
      const error = new Error("Grievance not found");
      error.statusCode = 404;
      throw error;
    }
  }

  return assignments;
};

module.exports = {
  submitGrievance,
  getCitizenGrievances,
  getGrievanceById,
  getGrievanceAssignments,
};

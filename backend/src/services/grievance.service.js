const { prisma } = require("../config/database");
const aiService = require("./ai.service");

/**
 * Generate a unique, human-readable Grievance Number.
 * Format: GRV-2026-000001
 */
const generateGrievanceNumber = async (tx) => {
  const year = new Date().getFullYear();
  const count = await tx.grievance.count();
  let sequence = count + 1;
  let grievanceNumber = `GRV-${year}-${String(sequence).padStart(6, "0")}`;

  let existing = await tx.grievance.findUnique({
    where: { grievance_number: grievanceNumber },
  });

  while (existing) {
    sequence += 1;
    grievanceNumber = `GRV-${year}-${String(sequence).padStart(6, "0")}`;
    existing = await tx.grievance.findUnique({
      where: { grievance_number: grievanceNumber },
    });
  }

  return grievanceNumber;
};

/**
 * Submit a new citizen grievance.
 * Integrates with AI microservice, resolves department, and transactionally persists to PostgreSQL.
 */
const submitGrievance = async ({ userId, text }) => {
  // Step 1: Request AI analysis
  const aiAnalysis = await aiService.analyzeGrievance(text);

  // Step 2: Resolve department in PostgreSQL database
  let department = await prisma.department.findFirst({
    where: {
      name: {
        equals: aiAnalysis.department,
        mode: "insensitive",
      },
    },
  });

  // Fallback lookup if not found directly by name
  if (!department) {
    department = await prisma.department.findFirst({
      where: { code: "OTH" },
    });
  }

  if (!department) {
    console.error(`Department resolution error: Department '${aiAnalysis.department}' not found in database.`);
    const error = new Error(`Target department '${aiAnalysis.department}' could not be resolved.`);
    error.statusCode = 500;
    throw error;
  }

  // Step 3: Map Priority enum safely
  const validPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  const priority = validPriorities.includes(aiAnalysis.priority?.toUpperCase())
    ? aiAnalysis.priority.toUpperCase()
    : "MEDIUM";

  // Step 4: Perform transactional persistence
  const createdGrievance = await prisma.$transaction(async (tx) => {
    const grievanceNumber = await generateGrievanceNumber(tx);

    const grievance = await tx.grievance.create({
      data: {
        grievance_number: grievanceNumber,
        user_id: userId,
        original_text: text,
        detected_language: aiAnalysis.language,
        translated_text: aiAnalysis.translated_text,
        category: aiAnalysis.category,
        priority: priority,
        department_id: department.id,
        status: "SUBMITTED",
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

    await tx.grievanceStatusHistory.create({
      data: {
        grievance_id: grievance.id,
        status: "SUBMITTED",
        remarks: "Grievance submitted successfully",
        changed_by: userId,
      },
    });

    // Create notification for citizen
    await tx.notification.create({
      data: {
        user_id: userId,
        grievance_id: grievance.id,
        type: "GRIEVANCE_SUBMITTED",
        title: "Grievance Submitted",
        message: `Your grievance ${grievance.grievance_number} has been submitted successfully to ${department.name}.`,
      },
    });

    // High / Critical priority alert notification for department officer(s)
    if (priority === "HIGH" || priority === "CRITICAL") {
      const deptOfficers = await tx.user.findMany({
        where: { department_id: department.id, role: "OFFICER" },
        select: { id: true },
      });

      for (const off of deptOfficers) {
        await tx.notification.create({
          data: {
            user_id: off.id,
            grievance_id: grievance.id,
            type: priority === "CRITICAL" ? "CRITICAL_PRIORITY" : "HIGH_PRIORITY",
            title: priority === "CRITICAL" ? "Critical Grievance Received" : "High Priority Grievance Assigned",
            message: `A ${priority.toLowerCase()} priority grievance ${grievance.grievance_number} has been assigned to your department.`,
          },
        });
      }
    }

    return grievance;
  });

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

  return grievance;
};

module.exports = {
  submitGrievance,
  getCitizenGrievances,
  getGrievanceById,
};

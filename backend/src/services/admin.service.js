const { prisma } = require("../config/database");
const { validateStatusTransition } = require("./statusTransition.service");

/**
 * Fetch all system grievances (Admin oversight) with optional filters.
 */
const getAllGrievances = async (filters = {}) => {
  const { department_id, status, priority } = filters;

  const whereClause = {};

  if (department_id) {
    whereClause.department_id = department_id;
  }

  if (status) {
    whereClause.status = status.toUpperCase();
  }

  if (priority) {
    whereClause.priority = priority.toUpperCase();
  }

  const grievances = await prisma.grievance.findMany({
    where: whereClause,
    include: {
      department: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
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
 * Fetch single grievance by ID (Admin access across any department).
 */
const getAdminGrievanceById = async (id) => {
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
      user: {
        select: {
          id: true,
          name: true,
          email: true,
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

  return grievance;
};

/**
 * Update grievance status by Admin across any department.
 */
const updateAdminGrievanceStatus = async (id, adminUser, { status, remarks }) => {
  const grievance = await prisma.grievance.findUnique({
    where: { id },
  });

  if (!grievance) {
    const error = new Error("Grievance not found");
    error.statusCode = 404;
    throw error;
  }

  // Validate status transition & remarks
  const { targetStatus, remarks: cleanRemarks } = validateStatusTransition({
    currentStatus: grievance.status,
    targetStatus: status,
    remarks,
    userRole: "ADMIN",
  });

  // Perform transactional status update & status history creation
  const updatedGrievance = await prisma.$transaction(async (tx) => {
    const updated = await tx.grievance.update({
      where: { id },
      data: {
        status: targetStatus,
        updated_at: new Date(),
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await tx.grievanceStatusHistory.create({
      data: {
        grievance_id: id,
        status: targetStatus,
        remarks: cleanRemarks,
        changed_by: adminUser.id,
      },
    });

    let notifType = "STATUS_CHANGED";
    if (targetStatus === "RESOLVED") notifType = "GRIEVANCE_RESOLVED";
    if (targetStatus === "REJECTED") notifType = "GRIEVANCE_REJECTED";

    await tx.notification.create({
      data: {
        user_id: grievance.user_id,
        grievance_id: id,
        type: notifType,
        title: `Admin Override Status: ${targetStatus.replace("_", " ")}`,
        message: `Your grievance ${grievance.grievance_number} status has been updated by Admin to ${targetStatus}.${cleanRemarks ? ` Remarks: ${cleanRemarks}` : ""}`,
      },
    });

    return updated;
  });

  return updatedGrievance;
};

/**
 * Fetch grievances belonging to a specific Department ID or Department Code.
 */
const getDepartmentGrievances = async (departmentIdentifier, filters = {}) => {
  // Find department by ID or Code
  const department = await prisma.department.findFirst({
    where: {
      OR: [
        { id: departmentIdentifier },
        { code: departmentIdentifier.toUpperCase() },
      ],
    },
  });

  if (!department) {
    const error = new Error(`Department '${departmentIdentifier}' not found`);
    error.statusCode = 404;
    throw error;
  }

  const grievances = await getAllGrievances({
    ...filters,
    department_id: department.id,
  });

  return {
    department: {
      id: department.id,
      name: department.name,
      code: department.code,
    },
    grievances,
  };
};

/**
 * Compute System-wide Admin analytics using Prisma database aggregation across all departments.
 */
const getAdminAnalytics = async () => {
  const [totalCount, statusCounts, priorityCounts, deptCounts, categoryCounts, departments] = await Promise.all([
    prisma.grievance.count(),
    prisma.grievance.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.grievance.groupBy({
      by: ["priority"],
      _count: { _all: true },
    }),
    prisma.grievance.groupBy({
      by: ["department_id"],
      _count: { _all: true },
    }),
    prisma.grievance.groupBy({
      by: ["category"],
      _count: { _all: true },
      orderBy: { _count: { category: "desc" } },
      take: 10,
    }),
    prisma.department.findMany({
      select: { id: true, name: true, code: true },
    }),
  ]);

  const summary = {
    total: totalCount,
    submitted: 0,
    assigned: 0,
    under_review: 0,
    in_progress: 0,
    resolved: 0,
    rejected: 0,
    high_critical_count: 0,
    resolution_rate: 0.0,
  };

  statusCounts.forEach((item) => {
    const key = item.status.toLowerCase();
    if (key in summary) {
      summary[key] = item._count._all;
    }
  });

  const priorityMap = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0,
  };

  priorityCounts.forEach((item) => {
    if (item.priority in priorityMap) {
      priorityMap[item.priority] = item._count._all;
    }
    if (item.priority === "HIGH" || item.priority === "CRITICAL") {
      summary.high_critical_count += item._count._all;
    }
  });

  if (totalCount > 0) {
    summary.resolution_rate = Number(((summary.resolved / totalCount) * 100).toFixed(1));
  }

  const deptMap = new Map(departments.map((d) => [d.id, d]));
  const departmentBreakdown = deptCounts.map((item) => {
    const deptInfo = deptMap.get(item.department_id);
    return {
      id: item.department_id,
      code: deptInfo?.code || "N/A",
      name: deptInfo?.name || "Unknown Department",
      count: item._count._all,
    };
  });

  const categories = categoryCounts.map((item) => ({
    category: item.category,
    count: item._count._all,
  }));

  return {
    summary,
    priority: priorityMap,
    departments: departmentBreakdown,
    categories,
  };
};

module.exports = {
  getAllGrievances,
  getAdminGrievanceById,
  updateAdminGrievanceStatus,
  getDepartmentGrievances,
  getAdminAnalytics,
};

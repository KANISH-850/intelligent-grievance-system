const { prisma } = require("../config/database");
const { validateStatusTransition } = require("./statusTransition.service");

/**
 * Fetch grievances assigned to the Officer's department.
 * Matches either legacy grievance.department_id OR any assignment in grievance_department_assignments.
 */
const getDepartmentGrievances = async (officerUser, filters = {}) => {
  if (!officerUser.department_id) {
    const error = new Error("Officer is not assigned to any department.");
    error.statusCode = 400;
    throw error;
  }

  const { status, priority } = filters;
  const deptId = officerUser.department_id;

  const whereClause = {
    OR: [
      { department_id: deptId },
      { assignments: { some: { department_id: deptId } } },
    ],
  };

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
      assignments: {
        include: {
          department: {
            select: { id: true, name: true, code: true },
          },
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
 * Fetch single grievance by ID with Officer department access check.
 */
const getOfficerGrievanceById = async (id, officerUser) => {
  if (!officerUser.department_id) {
    const error = new Error("Officer is not assigned to any department.");
    error.statusCode = 400;
    throw error;
  }

  const deptId = officerUser.department_id;

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
            select: { id: true, name: true, code: true },
          },
          assigned_officer: {
            select: { id: true, name: true, email: true },
          },
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
      images: true,
    },
  });

  const isAssigned = grievance && (
    grievance.department_id === deptId ||
    grievance.assignments?.some((a) => a.department_id === deptId)
  );

  if (!grievance || !isAssigned) {
    const error = new Error("Grievance not found");
    error.statusCode = 404;
    throw error;
  }

  return grievance;
};

/**
 * Update grievance status with status transition validation, isolated department assignment update,
 * and composite grievance status calculation.
 */
const updateOfficerGrievanceStatus = async (id, officerUser, { status, remarks }) => {
  if (!officerUser.department_id) {
    const error = new Error("Officer is not assigned to any department.");
    error.statusCode = 400;
    throw error;
  }

  const deptId = officerUser.department_id;

  const grievance = await prisma.grievance.findUnique({
    where: { id },
    include: {
      assignments: true,
    },
  });

  const isAssigned = grievance && (
    grievance.department_id === deptId ||
    grievance.assignments?.some((a) => a.department_id === deptId)
  );

  // Department ownership security check
  if (!grievance || !isAssigned) {
    const error = new Error("Grievance not found");
    error.statusCode = 404;
    throw error;
  }

  // Find officer's department assignment or fallback to grievance status
  const officerAssignment = grievance.assignments?.find((a) => a.department_id === deptId);
  const currentDeptStatus = officerAssignment ? officerAssignment.status : grievance.status;

  // Validate status transition & remarks against current department assignment status
  const { targetStatus, remarks: cleanRemarks } = validateStatusTransition({
    currentStatus: currentDeptStatus,
    targetStatus: status,
    remarks,
    userRole: "OFFICER",
  });

  // Perform transactional status update
  const updatedGrievance = await prisma.$transaction(async (tx) => {
    // 1. Update department assignment for this officer's department
    if (officerAssignment) {
      await tx.grievanceDepartmentAssignment.update({
        where: { id: officerAssignment.id },
        data: {
          status: targetStatus,
          notes: cleanRemarks || officerAssignment.notes,
          assigned_officer_id: officerUser.id,
          updated_at: new Date(),
        },
      });
    }

    // 2. Fetch all assignments to compute composite grievance status
    const allAssignments = await tx.grievanceDepartmentAssignment.findMany({
      where: { grievance_id: id },
    });

    let compositeStatus = targetStatus;
    if (allAssignments.length > 0) {
      const statuses = allAssignments.map((a) =>
        a.department_id === deptId ? targetStatus : a.status
      );
      // All resolved => RESOLVED
      if (statuses.every((s) => s === "RESOLVED")) {
        compositeStatus = "RESOLVED";
      } else if (statuses.every((s) => s === "REJECTED")) {
        compositeStatus = "REJECTED";
      } else if (statuses.some((s) => s === "IN_PROGRESS")) {
        compositeStatus = "IN_PROGRESS";
      } else if (statuses.some((s) => s === "UNDER_REVIEW")) {
        compositeStatus = "UNDER_REVIEW";
      } else {
        compositeStatus = "ASSIGNED";
      }
    }

    const updated = await tx.grievance.update({
      where: { id },
      data: {
        status: compositeStatus,
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
        assignments: {
          include: {
            department: {
              select: { id: true, name: true, code: true },
            },
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
        changed_by: officerUser.id,
      },
    });

    let notifType = "STATUS_CHANGED";
    if (compositeStatus === "RESOLVED") notifType = "GRIEVANCE_RESOLVED";
    if (compositeStatus === "REJECTED") notifType = "GRIEVANCE_REJECTED";

    await tx.notification.create({
      data: {
        user_id: grievance.user_id,
        grievance_id: id,
        type: notifType,
        title: `Grievance Status: ${targetStatus.replace("_", " ")}`,
        message: `Your grievance ${grievance.grievance_number} department progress updated to ${targetStatus}.${cleanRemarks ? ` Remarks: ${cleanRemarks}` : ""}`,
      },
    });

    return updated;
  });

  return updatedGrievance;
};

/**
 * Compute Officer analytics using Prisma database aggregation for Officer's department.
 */
const getOfficerAnalytics = async (officerUser) => {
  if (!officerUser.department_id) {
    const error = new Error("Officer is not assigned to any department.");
    error.statusCode = 400;
    throw error;
  }

  const departmentId = officerUser.department_id;

  const [totalCount, statusCounts, priorityCounts, categoryCounts, departmentInfo] = await Promise.all([
    prisma.grievance.count({
      where: { department_id: departmentId },
    }),
    prisma.grievance.groupBy({
      by: ["status"],
      where: { department_id: departmentId },
      _count: { _all: true },
    }),
    prisma.grievance.groupBy({
      by: ["priority"],
      where: { department_id: departmentId },
      _count: { _all: true },
    }),
    prisma.grievance.groupBy({
      by: ["category"],
      where: { department_id: departmentId },
      _count: { _all: true },
      orderBy: { _count: { category: "desc" } },
      take: 10,
    }),
    prisma.department.findUnique({
      where: { id: departmentId },
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

  const categories = categoryCounts.map((item) => ({
    category: item.category,
    count: item._count._all,
  }));

  return {
    department: departmentInfo,
    summary,
    priority: priorityMap,
    categories,
  };
};

module.exports = {
  getDepartmentGrievances,
  getOfficerGrievanceById,
  updateOfficerGrievanceStatus,
  getOfficerAnalytics,
};

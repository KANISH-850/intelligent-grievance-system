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
    // If filtering by status, check department assignment status or parent grievance status
    whereClause.OR = [
      { department_id: deptId, status: status.toUpperCase() },
      { assignments: { some: { department_id: deptId, status: status.toUpperCase() } } },
    ];
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
            select: { id: true, name: true, code: true, description: true },
          },
          assigned_officer: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: {
          created_at: "asc",
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

  // Attach officer's department assignment for easy consumption by dashboard
  return grievances.map((g) => {
    const myAssignment = g.assignments?.find((a) => a.department_id === deptId) || null;
    return {
      ...g,
      officer_assignment: myAssignment,
    };
  });
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

  const myAssignment = grievance.assignments?.find((a) => a.department_id === deptId) || null;

  return {
    ...grievance,
    officer_assignment: myAssignment,
  };
};

/**
 * Fetch department assignments directly for the authenticated officer's department.
 */
const getDepartmentAssignments = async (officerUser, filters = {}) => {
  if (!officerUser.department_id) {
    const error = new Error("Officer is not assigned to any department.");
    error.statusCode = 400;
    throw error;
  }

  const { status, priority } = filters;
  const deptId = officerUser.department_id;

  const where = {
    department_id: deptId,
  };

  if (status) {
    where.status = status.toUpperCase();
  }

  if (priority) {
    where.grievance = { priority: priority.toUpperCase() };
  }

  const assignments = await prisma.grievanceDepartmentAssignment.findMany({
    where,
    include: {
      department: {
        select: { id: true, name: true, code: true, description: true },
      },
      assigned_officer: {
        select: { id: true, name: true, email: true },
      },
      grievance: {
        include: {
          department: {
            select: { id: true, name: true, code: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
          images: true,
        },
      },
      history: {
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
        orderBy: { created_at: "asc" },
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });

  return assignments;
};

/**
 * Fetch a single assignment with authorization check.
 */
const getDepartmentAssignmentById = async (assignmentId, officerUser) => {
  if (!officerUser.department_id) {
    const error = new Error("Officer is not assigned to any department.");
    error.statusCode = 400;
    throw error;
  }

  const assignment = await prisma.grievanceDepartmentAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      department: {
        select: { id: true, name: true, code: true, description: true },
      },
      assigned_officer: {
        select: { id: true, name: true, email: true },
      },
      grievance: {
        include: {
          department: {
            select: { id: true, name: true, code: true },
          },
          assignments: {
            include: {
              department: { select: { id: true, name: true, code: true } },
              assigned_officer: { select: { id: true, name: true, email: true } },
            },
            orderBy: { created_at: "asc" },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
          status_history: {
            include: {
              user: { select: { id: true, name: true, role: true } },
            },
            orderBy: { created_at: "asc" },
          },
          images: true,
        },
      },
      history: {
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
        orderBy: { created_at: "asc" },
      },
    },
  });

  // IDOR protection: officer can only view assignment for their authorized department
  if (!assignment || assignment.department_id !== officerUser.department_id) {
    const error = new Error("Assignment not found");
    error.statusCode = 404;
    throw error;
  }

  return assignment;
};

/**
 * Recalculate composite grievance status from a list of assignments.
 */
const calculateOverallStatus = (assignments) => {
  if (!assignments || assignments.length === 0) return "SUBMITTED";

  const statuses = assignments.map((a) => a.status);

  // All resolved => RESOLVED
  if (statuses.every((s) => s === "RESOLVED")) {
    return "RESOLVED";
  }

  // All rejected => REJECTED
  if (statuses.every((s) => s === "REJECTED")) {
    return "REJECTED";
  }

  // Some resolved and others pending/in progress/assigned => PARTIALLY_RESOLVED
  const hasResolved = statuses.some((s) => s === "RESOLVED");
  const hasUnresolved = statuses.some((s) => s !== "RESOLVED" && s !== "REJECTED");
  if (hasResolved && hasUnresolved) {
    return "PARTIALLY_RESOLVED";
  }

  // Any in progress => IN_PROGRESS
  if (statuses.some((s) => s === "IN_PROGRESS")) {
    return "IN_PROGRESS";
  }

  // Any under review => UNDER_REVIEW
  if (statuses.some((s) => s === "UNDER_REVIEW")) {
    return "UNDER_REVIEW";
  }

  // Any assigned => ASSIGNED
  if (statuses.some((s) => s === "ASSIGNED")) {
    return "ASSIGNED";
  }

  return "SUBMITTED";
};

/**
 * Update assignment status independently, with status transition validation,
 * assignment-specific history recording, parent composite status recalculation, and targeted notification.
 */
const updateDepartmentAssignmentStatus = async (
  assignmentId,
  officerUser,
  { status, remarks, resolution_description }
) => {
  if (!officerUser.department_id) {
    const error = new Error("Officer is not assigned to any department.");
    error.statusCode = 400;
    throw error;
  }

  const assignment = await prisma.grievanceDepartmentAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      department: true,
      grievance: {
        include: {
          assignments: true,
        },
      },
    },
  });

  // IDOR & Authorization check: verify assignment belongs to officer's department
  if (!assignment || assignment.department_id !== officerUser.department_id) {
    const error = new Error("Assignment not found");
    error.statusCode = 404;
    throw error;
  }

  // Validate status transition against current assignment status
  const { targetStatus, remarks: cleanRemarks } = validateStatusTransition({
    currentStatus: assignment.status,
    targetStatus: status,
    remarks,
    userRole: "OFFICER",
  });

  const now = new Date();
  const updateData = {
    status: targetStatus,
    notes: cleanRemarks || assignment.notes,
    remarks: cleanRemarks || assignment.remarks,
    assigned_officer_id: officerUser.id,
    updated_at: now,
  };

  if (targetStatus === "IN_PROGRESS" && !assignment.started_at) {
    updateData.started_at = now;
  }

  if (targetStatus === "RESOLVED") {
    updateData.resolved_at = now;
    if (resolution_description || cleanRemarks) {
      updateData.resolution_description = resolution_description || cleanRemarks;
    }
  }

  const updatedGrievance = await prisma.$transaction(async (tx) => {
    // 1. Update department assignment
    const updatedAssignment = await tx.grievanceDepartmentAssignment.update({
      where: { id: assignmentId },
      data: updateData,
      include: {
        department: { select: { id: true, name: true, code: true, description: true } },
        assigned_officer: { select: { id: true, name: true, email: true } },
      },
    });

    // 2. Record assignment-specific status history
    await tx.grievanceAssignmentHistory.create({
      data: {
        assignment_id: assignment.id,
        grievance_id: assignment.grievance_id,
        department_id: assignment.department_id,
        previous_status: assignment.status,
        status: targetStatus,
        remarks: cleanRemarks,
        changed_by: officerUser.id,
      },
    });

    // 3. Fetch all assignments to compute composite grievance status
    const allAssignments = await tx.grievanceDepartmentAssignment.findMany({
      where: { grievance_id: assignment.grievance_id },
      include: {
        department: { select: { id: true, name: true, code: true } },
      },
    });

    const compositeStatus = calculateOverallStatus(allAssignments);

    // 4. Update parent grievance composite status
    const updatedParent = await tx.grievance.update({
      where: { id: assignment.grievance_id },
      data: {
        status: compositeStatus,
        updated_at: now,
      },
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
        assignments: {
          include: {
            department: { select: { id: true, name: true, code: true, description: true } },
            assigned_officer: { select: { id: true, name: true, email: true } },
            history: {
              include: {
                user: { select: { id: true, name: true, role: true } },
              },
              orderBy: { created_at: "asc" },
            },
          },
          orderBy: { created_at: "asc" },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
        status_history: {
          select: {
            id: true,
            status: true,
            remarks: true,
            created_at: true,
            user: { select: { id: true, name: true, role: true } },
          },
          orderBy: { created_at: "asc" },
        },
      },
    });

    // 5. Create grievance status history entry reflecting this department's action
    const deptName = assignment.department?.name || "Department";
    await tx.grievanceStatusHistory.create({
      data: {
        grievance_id: assignment.grievance_id,
        status: compositeStatus,
        remarks: `[${deptName}] assignment updated to ${targetStatus}.${cleanRemarks ? ` Remarks: ${cleanRemarks}` : ""}`,
        changed_by: officerUser.id,
      },
    });

    // 6. Targeted notification for Citizen
    let notifType = "STATUS_CHANGED";
    if (compositeStatus === "RESOLVED") notifType = "GRIEVANCE_RESOLVED";
    if (compositeStatus === "REJECTED") notifType = "GRIEVANCE_REJECTED";

    await tx.notification.create({
      data: {
        user_id: assignment.grievance.user_id,
        grievance_id: assignment.grievance_id,
        type: notifType,
        title: `${deptName}: ${targetStatus.replace("_", " ")}`,
        message: `Department ${deptName} updated your grievance ${assignment.grievance.grievance_number} assignment to ${targetStatus}.${cleanRemarks ? ` Remarks: ${cleanRemarks}` : ""}`,
      },
    });

    return {
      updatedAssignment,
      grievance: updatedParent,
    };
  });

  return updatedGrievance;
};

/**
 * Update grievance status by grievance ID (backward compatibility for existing endpoints).
 * Resolves the authenticated officer's department assignment for this grievance and updates it.
 */
const updateOfficerGrievanceStatus = async (id, officerUser, { status, remarks, resolution_description }) => {
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

  const officerAssignment = grievance?.assignments?.find((a) => a.department_id === deptId);

  if (!grievance || (!officerAssignment && grievance.department_id !== deptId)) {
    const error = new Error("Grievance not found");
    error.statusCode = 404;
    throw error;
  }

  // If assignment exists, delegate to updateDepartmentAssignmentStatus
  if (officerAssignment) {
    const result = await updateDepartmentAssignmentStatus(officerAssignment.id, officerUser, {
      status,
      remarks,
      resolution_description,
    });
    return result.grievance;
  }

  // Fallback for legacy single-department grievances without assignment records
  const { targetStatus, remarks: cleanRemarks } = validateStatusTransition({
    currentStatus: grievance.status,
    targetStatus: status,
    remarks,
    userRole: "OFFICER",
  });

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.grievance.update({
      where: { id },
      data: {
        status: targetStatus,
        updated_at: new Date(),
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
        assignments: {
          include: {
            department: { select: { id: true, name: true, code: true } },
          },
        },
        user: { select: { id: true, name: true, email: true } },
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

    return updated;
  });
};

/**
 * Retrieve assignment history for an assignment.
 */
const getAssignmentHistory = async (assignmentId, requestingUser) => {
  const assignment = await prisma.grievanceDepartmentAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      grievance: { select: { id: true, user_id: true } },
    },
  });

  if (!assignment) {
    const error = new Error("Assignment not found");
    error.statusCode = 404;
    throw error;
  }

  if (requestingUser.role === "CITIZEN" && assignment.grievance.user_id !== requestingUser.id) {
    const error = new Error("Assignment not found");
    error.statusCode = 404;
    throw error;
  }

  if (requestingUser.role === "OFFICER" && assignment.department_id !== requestingUser.department_id) {
    const error = new Error("Assignment not found");
    error.statusCode = 404;
    throw error;
  }

  const history = await prisma.grievanceAssignmentHistory.findMany({
    where: { assignment_id: assignmentId },
    include: {
      department: { select: { id: true, name: true, code: true } },
      user: { select: { id: true, name: true, role: true } },
    },
    orderBy: { created_at: "asc" },
  });

  return history;
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
    prisma.grievanceDepartmentAssignment.count({
      where: { department_id: departmentId },
    }),
    prisma.grievanceDepartmentAssignment.groupBy({
      by: ["status"],
      where: { department_id: departmentId },
      _count: { _all: true },
    }),
    prisma.grievance.groupBy({
      by: ["priority"],
      where: {
        OR: [
          { department_id: departmentId },
          { assignments: { some: { department_id: departmentId } } },
        ],
      },
      _count: { _all: true },
    }),
    prisma.grievance.groupBy({
      by: ["category"],
      where: {
        OR: [
          { department_id: departmentId },
          { assignments: { some: { department_id: departmentId } } },
        ],
      },
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
    partially_resolved: 0,
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
  getDepartmentAssignments,
  getDepartmentAssignmentById,
  updateDepartmentAssignmentStatus,
  updateOfficerGrievanceStatus,
  getAssignmentHistory,
  calculateOverallStatus,
  getOfficerAnalytics,
};

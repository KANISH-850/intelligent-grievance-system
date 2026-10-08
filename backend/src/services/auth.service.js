const bcrypt = require("bcryptjs");
const { prisma } = require("../config/database");
const { generateToken } = require("../utils/jwt");

/**
 * Register a new citizen account
 */
const registerCitizen = async ({ name, email, password }) => {
  // Check for duplicate email
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (existingUser) {
    const error = new Error("An account with this email address already exists.");
    error.statusCode = 409;
    throw error;
  }

  // Hash password
  const saltRounds = 10;
  const password_hash = await bcrypt.hash(password, saltRounds);

  // Create user (Strictly CITIZEN role for public registration)
  const newUser = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password_hash,
      role: "CITIZEN",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      created_at: true,
    },
  });

  const token = generateToken(newUser);

  return { user: newUser, token };
};

/**
 * Authenticate user login credentials
 */
const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
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

  if (!user) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user);

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department_id: user.department_id,
    department: user.department,
    created_at: user.created_at,
  };

  return { user: safeUser, token };
};

module.exports = {
  registerCitizen,
  loginUser,
};

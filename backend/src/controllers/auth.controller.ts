import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  agencyName: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Register (creates agency + admin user)
export const register = async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, agencyName } = registerSchema.parse(req.body);

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError(400, 'Email already registered');
  }

  // Create agency slug from name
  const agencySlug = agencyName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  // Check if agency slug exists
  const existingAgency = await prisma.agency.findUnique({
    where: { slug: agencySlug },
  });

  if (existingAgency) {
    throw new AppError(400, 'Agency name already taken');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create agency + user in transaction
  const result = await prisma.$transaction(async (tx) => {
    const agency = await tx.agency.create({
      data: {
        name: agencyName,
        slug: agencySlug,
      },
    });

    const user = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'AGENCY_ADMIN',
        agencyId: agency.id,
      },
    });

    return { agency, user };
  });

  // Generate JWT
  const token = jwt.sign(
    {
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
      agencyId: result.agency.id,
    },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.status(201).json({
    token,
    user: {
      id: result.user.id,
      email: result.user.email,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
      role: result.user.role,
      agency: {
        id: result.agency.id,
        name: result.agency.name,
        slug: result.agency.slug,
      },
    },
  });
};

// Login
export const login = async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);

  // Find user with agency
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      agency: true,
    },
  });

  if (!user) {
    throw new AppError(401, 'Invalid credentials');
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid credentials');
  }

  // Generate JWT
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      agencyId: user.agencyId,
    },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      agency: user.agency
        ? {
            id: user.agency.id,
            name: user.agency.name,
            slug: user.agency.slug,
          }
        : null,
    },
  });
};

// Get current user
export const me = async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      agency: true,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      agency: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  res.json(user);
};

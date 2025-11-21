import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const createProjectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  clientId: z.string(),
  designTokens: z.record(z.any()).optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  designTokens: z.record(z.any()).optional(),
});

// Get all projects (optionally filter by clientId)
export const getProjects = async (req: AuthRequest, res: Response) => {
  if (!req.user?.agencyId) {
    throw new AppError(404, 'No agency found');
  }

  const { clientId } = req.query;

  const projects = await prisma.project.findMany({
    where: {
      client: {
        agencyId: req.user.agencyId,
      },
      ...(clientId && { clientId: clientId as string }),
    },
    include: {
      client: true,
      _count: {
        select: { pages: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(projects);
};

// Get single project
export const getProject = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      pages: {
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: { pages: true },
      },
    },
  });

  if (!project) {
    throw new AppError(404, 'Project not found');
  }

  // Check if project belongs to user's agency
  if (project.client.agencyId !== req.user?.agencyId) {
    throw new AppError(403, 'Access denied');
  }

  res.json(project);
};

// Create project
export const createProject = async (req: AuthRequest, res: Response) => {
  if (!req.user?.agencyId) {
    throw new AppError(404, 'No agency found');
  }

  const { name, description, clientId, designTokens } = createProjectSchema.parse(req.body);

  // Verify client belongs to agency
  const client = await prisma.client.findUnique({
    where: { id: clientId },
  });

  if (!client || client.agencyId !== req.user.agencyId) {
    throw new AppError(404, 'Client not found');
  }

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  // Check if slug exists for this client
  const existing = await prisma.project.findUnique({
    where: {
      clientId_slug: {
        clientId,
        slug,
      },
    },
  });

  if (existing) {
    throw new AppError(400, 'A project with this name already exists for this client');
  }

  const project = await prisma.project.create({
    data: {
      name,
      slug,
      description,
      clientId,
      designTokens: designTokens || {},
    },
    include: {
      client: true,
    },
  });

  res.status(201).json(project);
};

// Update project
export const updateProject = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const data = updateProjectSchema.parse(req.body);

  // Check if project exists and belongs to agency
  const existing = await prisma.project.findUnique({
    where: { id },
    include: { client: true },
  });

  if (!existing) {
    throw new AppError(404, 'Project not found');
  }

  if (existing.client.agencyId !== req.user?.agencyId) {
    throw new AppError(403, 'Access denied');
  }

  // If name is being updated, regenerate slug
  let updateData: any = { ...data };
  if (data.name) {
    const newSlug = data.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    updateData.slug = newSlug;
  }

  const project = await prisma.project.update({
    where: { id },
    data: updateData,
    include: {
      client: true,
    },
  });

  res.json(project);
};

// Delete project
export const deleteProject = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Check if project exists and belongs to agency
  const existing = await prisma.project.findUnique({
    where: { id },
    include: { client: true },
  });

  if (!existing) {
    throw new AppError(404, 'Project not found');
  }

  if (existing.client.agencyId !== req.user?.agencyId) {
    throw new AppError(403, 'Access denied');
  }

  await prisma.project.delete({
    where: { id },
  });

  res.status(204).send();
};

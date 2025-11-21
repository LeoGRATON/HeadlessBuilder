import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const createClientSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

const updateClientSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
});

// Get all clients for agency
export const getClients = async (req: AuthRequest, res: Response) => {
  if (!req.user?.agencyId) {
    throw new AppError(404, 'No agency found');
  }

  const clients = await prisma.client.findMany({
    where: { agencyId: req.user.agencyId },
    include: {
      _count: {
        select: { projects: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(clients);
};

// Get single client
export const getClient = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      projects: {
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: { projects: true },
      },
    },
  });

  if (!client) {
    throw new AppError(404, 'Client not found');
  }

  // Check if client belongs to user's agency
  if (client.agencyId !== req.user?.agencyId) {
    throw new AppError(403, 'Access denied');
  }

  res.json(client);
};

// Create client
export const createClient = async (req: AuthRequest, res: Response) => {
  if (!req.user?.agencyId) {
    throw new AppError(404, 'No agency found');
  }

  const { name, description } = createClientSchema.parse(req.body);

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  // Check if slug exists for this agency
  const existing = await prisma.client.findUnique({
    where: {
      agencyId_slug: {
        agencyId: req.user.agencyId,
        slug,
      },
    },
  });

  if (existing) {
    throw new AppError(400, 'A client with this name already exists');
  }

  const client = await prisma.client.create({
    data: {
      name,
      slug,
      description,
      agencyId: req.user.agencyId,
    },
  });

  res.status(201).json(client);
};

// Update client
export const updateClient = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const data = updateClientSchema.parse(req.body);

  // Check if client exists and belongs to agency
  const existing = await prisma.client.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError(404, 'Client not found');
  }

  if (existing.agencyId !== req.user?.agencyId) {
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

  const client = await prisma.client.update({
    where: { id },
    data: updateData,
  });

  res.json(client);
};

// Delete client
export const deleteClient = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Check if client exists and belongs to agency
  const existing = await prisma.client.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError(404, 'Client not found');
  }

  if (existing.agencyId !== req.user?.agencyId) {
    throw new AppError(403, 'Access denied');
  }

  await prisma.client.delete({
    where: { id },
  });

  res.status(204).send();
};

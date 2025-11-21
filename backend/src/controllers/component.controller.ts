import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// Schema for field types
const fieldTypeSchema = z.enum([
  'text',
  'textarea',
  'wysiwyg',
  'image',
  'url',
  'number',
  'boolean',
  'select',
]);

// Schema for a single field
const fieldSchema = z.object({
  name: z.string().min(1),
  type: fieldTypeSchema,
  label: z.string().min(1),
  required: z.boolean().optional().default(false),
  defaultValue: z.any().optional(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  // For select type
  options: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).optional(),
  // Validation rules
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
  }).optional(),
});

// Schema for component creation
const createComponentSchema = z.object({
  name: z.string().min(2),
  category: z.string().optional(),
  description: z.string().optional(),
  schema: z.object({
    fields: z.array(fieldSchema).min(1),
  }),
  thumbnail: z.string().url().optional(),
});

// Schema for component update
const updateComponentSchema = z.object({
  name: z.string().min(2).optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  schema: z.object({
    fields: z.array(fieldSchema).min(1),
  }).optional(),
  thumbnail: z.string().url().optional(),
});

// Get all components for agency
export const getComponents = async (req: AuthRequest, res: Response) => {
  if (!req.user?.agencyId) {
    throw new AppError(404, 'No agency found');
  }

  const { category, search } = req.query;

  const components = await prisma.component.findMany({
    where: {
      agencyId: req.user.agencyId,
      ...(category && { category: category as string }),
      ...(search && {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
        ],
      }),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      description: true,
      thumbnail: true,
      version: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { pageComponents: true },
      },
    },
  });

  res.json(components);
};

// Get single component
export const getComponent = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const component = await prisma.component.findUnique({
    where: { id },
    include: {
      _count: {
        select: { pageComponents: true },
      },
    },
  });

  if (!component) {
    throw new AppError(404, 'Component not found');
  }

  // Check if component belongs to user's agency
  if (component.agencyId !== req.user?.agencyId) {
    throw new AppError(403, 'Access denied');
  }

  res.json(component);
};

// Create component
export const createComponent = async (req: AuthRequest, res: Response) => {
  if (!req.user?.agencyId) {
    throw new AppError(404, 'No agency found');
  }

  const data = createComponentSchema.parse(req.body);

  // Generate slug from name
  const slug = data.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  // Check if slug exists for this agency
  const existing = await prisma.component.findUnique({
    where: {
      agencyId_slug: {
        agencyId: req.user.agencyId,
        slug,
      },
    },
  });

  if (existing) {
    throw new AppError(400, 'A component with this name already exists');
  }

  const component = await prisma.component.create({
    data: {
      name: data.name,
      slug,
      category: data.category,
      description: data.description,
      schema: data.schema,
      thumbnail: data.thumbnail,
      agencyId: req.user.agencyId,
    },
  });

  res.status(201).json(component);
};

// Update component
export const updateComponent = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const data = updateComponentSchema.parse(req.body);

  // Check if component exists and belongs to agency
  const existing = await prisma.component.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError(404, 'Component not found');
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

    // Check if new slug conflicts with another component
    if (newSlug !== existing.slug) {
      const slugExists = await prisma.component.findUnique({
        where: {
          agencyId_slug: {
            agencyId: req.user.agencyId!,
            slug: newSlug,
          },
        },
      });

      if (slugExists) {
        throw new AppError(400, 'A component with this name already exists');
      }

      updateData.slug = newSlug;
    }
  }

  const component = await prisma.component.update({
    where: { id },
    data: updateData,
  });

  res.json(component);
};

// Delete component
export const deleteComponent = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Check if component exists and belongs to agency
  const existing = await prisma.component.findUnique({
    where: { id },
    include: {
      _count: {
        select: { pageComponents: true },
      },
    },
  });

  if (!existing) {
    throw new AppError(404, 'Component not found');
  }

  if (existing.agencyId !== req.user?.agencyId) {
    throw new AppError(403, 'Access denied');
  }

  // Check if component is used in any pages
  if (existing._count.pageComponents > 0) {
    throw new AppError(
      400,
      `Cannot delete component. It is used in ${existing._count.pageComponents} page(s)`
    );
  }

  await prisma.component.delete({
    where: { id },
  });

  res.status(204).send();
};

import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// Validation schemas
const createPageSchema = z.object({
  name: z.string().min(2),
  projectId: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
});

const updatePageSchema = z.object({
  name: z.string().min(2).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

const addComponentSchema = z.object({
  componentId: z.string(),
  order: z.number().int().min(0),
  config: z.record(z.any()),
  styles: z.record(z.any()).optional(),
});

const updateComponentSchema = z.object({
  config: z.record(z.any()).optional(),
  styles: z.record(z.any()).optional(),
  order: z.number().int().min(0).optional(),
});

const reorderComponentsSchema = z.object({
  componentIds: z.array(z.string()),
});

// Get all pages (optionally filtered by project)
export const getPages = async (req: AuthRequest, res: Response) => {
  if (!req.user?.agencyId) {
    throw new AppError(404, 'No agency found');
  }

  const { projectId } = req.query;

  const pages = await prisma.page.findMany({
    where: {
      project: {
        client: {
          agencyId: req.user.agencyId,
        },
      },
      ...(projectId && { projectId: projectId as string }),
    },
    include: {
      project: {
        include: {
          client: true,
        },
      },
      _count: {
        select: { components: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(pages);
};

// Get single page with all components
export const getPage = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const page = await prisma.page.findUnique({
    where: { id },
    include: {
      project: {
        include: {
          client: true,
        },
      },
      components: {
        include: {
          component: {
            select: {
              id: true,
              name: true,
              slug: true,
              category: true,
              schema: true,
              thumbnail: true,
            },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!page) {
    throw new AppError(404, 'Page not found');
  }

  // Check if page belongs to user's agency
  if (page.project.client.agencyId !== req.user?.agencyId) {
    throw new AppError(403, 'Access denied');
  }

  res.json(page);
};

// Create page
export const createPage = async (req: AuthRequest, res: Response) => {
  if (!req.user?.agencyId) {
    throw new AppError(404, 'No agency found');
  }

  const data = createPageSchema.parse(req.body);

  // Verify project belongs to agency
  const project = await prisma.project.findUnique({
    where: { id: data.projectId },
    include: { client: true },
  });

  if (!project || project.client.agencyId !== req.user.agencyId) {
    throw new AppError(404, 'Project not found');
  }

  // Generate slug from name
  const slug = data.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  // Check if slug exists for this project
  const existing = await prisma.page.findUnique({
    where: {
      projectId_slug: {
        projectId: data.projectId,
        slug,
      },
    },
  });

  if (existing) {
    throw new AppError(400, 'A page with this name already exists for this project');
  }

  const page = await prisma.page.create({
    data: {
      name: data.name,
      slug,
      title: data.title,
      description: data.description,
      projectId: data.projectId,
    },
    include: {
      project: {
        include: {
          client: true,
        },
      },
    },
  });

  res.status(201).json(page);
};

// Update page
export const updatePage = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const data = updatePageSchema.parse(req.body);

  // Check if page exists and belongs to agency
  const existing = await prisma.page.findUnique({
    where: { id },
    include: {
      project: {
        include: {
          client: true,
        },
      },
    },
  });

  if (!existing) {
    throw new AppError(404, 'Page not found');
  }

  if (existing.project.client.agencyId !== req.user?.agencyId) {
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

    if (newSlug !== existing.slug) {
      const slugExists = await prisma.page.findUnique({
        where: {
          projectId_slug: {
            projectId: existing.projectId,
            slug: newSlug,
          },
        },
      });

      if (slugExists) {
        throw new AppError(400, 'A page with this name already exists');
      }

      updateData.slug = newSlug;
    }
  }

  // If status is being changed to PUBLISHED, set publishedAt
  if (data.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
    updateData.publishedAt = new Date();
  }

  const page = await prisma.page.update({
    where: { id },
    data: updateData,
    include: {
      project: {
        include: {
          client: true,
        },
      },
    },
  });

  res.json(page);
};

// Delete page
export const deletePage = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Check if page exists and belongs to agency
  const existing = await prisma.page.findUnique({
    where: { id },
    include: {
      project: {
        include: {
          client: true,
        },
      },
    },
  });

  if (!existing) {
    throw new AppError(404, 'Page not found');
  }

  if (existing.project.client.agencyId !== req.user?.agencyId) {
    throw new AppError(403, 'Access denied');
  }

  await prisma.page.delete({
    where: { id },
  });

  res.status(204).send();
};

// Add component to page
export const addComponentToPage = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const data = addComponentSchema.parse(req.body);

  // Check if page exists and belongs to agency
  const page = await prisma.page.findUnique({
    where: { id },
    include: {
      project: {
        include: {
          client: true,
        },
      },
    },
  });

  if (!page) {
    throw new AppError(404, 'Page not found');
  }

  if (page.project.client.agencyId !== req.user?.agencyId) {
    throw new AppError(403, 'Access denied');
  }

  // Check if component exists and belongs to agency
  const component = await prisma.component.findUnique({
    where: { id: data.componentId },
  });

  if (!component || component.agencyId !== req.user.agencyId) {
    throw new AppError(404, 'Component not found');
  }

  // Add component to page
  const pageComponent = await prisma.pageComponent.create({
    data: {
      pageId: id,
      componentId: data.componentId,
      order: data.order,
      config: data.config,
      styles: data.styles || {},
    },
    include: {
      component: {
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          schema: true,
        },
      },
    },
  });

  res.status(201).json(pageComponent);
};

// Remove component from page
export const removeComponentFromPage = async (req: AuthRequest, res: Response) => {
  const { id, componentId } = req.params;

  // Check if page exists and belongs to agency
  const page = await prisma.page.findUnique({
    where: { id },
    include: {
      project: {
        include: {
          client: true,
        },
      },
    },
  });

  if (!page) {
    throw new AppError(404, 'Page not found');
  }

  if (page.project.client.agencyId !== req.user?.agencyId) {
    throw new AppError(403, 'Access denied');
  }

  // Delete the page component
  await prisma.pageComponent.delete({
    where: { id: componentId },
  });

  res.status(204).send();
};

// Update page component (config or styles)
export const updatePageComponent = async (req: AuthRequest, res: Response) => {
  const { id, componentId } = req.params;
  const data = updateComponentSchema.parse(req.body);

  // Check if page exists and belongs to agency
  const page = await prisma.page.findUnique({
    where: { id },
    include: {
      project: {
        include: {
          client: true,
        },
      },
    },
  });

  if (!page) {
    throw new AppError(404, 'Page not found');
  }

  if (page.project.client.agencyId !== req.user?.agencyId) {
    throw new AppError(403, 'Access denied');
  }

  // Update the page component
  const pageComponent = await prisma.pageComponent.update({
    where: { id: componentId },
    data,
    include: {
      component: {
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          schema: true,
        },
      },
    },
  });

  res.json(pageComponent);
};

// Reorder page components
export const reorderPageComponents = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { componentIds } = reorderComponentsSchema.parse(req.body);

  // Check if page exists and belongs to agency
  const page = await prisma.page.findUnique({
    where: { id },
    include: {
      project: {
        include: {
          client: true,
        },
      },
    },
  });

  if (!page) {
    throw new AppError(404, 'Page not found');
  }

  if (page.project.client.agencyId !== req.user?.agencyId) {
    throw new AppError(403, 'Access denied');
  }

  // Update order for each component
  await Promise.all(
    componentIds.map((componentId, index) =>
      prisma.pageComponent.update({
        where: { id: componentId },
        data: { order: index },
      })
    )
  );

  res.json({ success: true });
};

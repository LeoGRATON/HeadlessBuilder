import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

/**
 * Create a new variant for a component
 */
export async function createComponentVariant(req: Request, res: Response) {
  try {
    const { componentId } = req.params;
    const { name, slug, description, config, isDefault } = req.body;

    // Check if component exists
    const component = await prisma.component.findUnique({
      where: { id: componentId },
    });

    if (!component) {
      return res.status(404).json({
        success: false,
        error: 'Component not found',
      });
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.componentVariant.updateMany({
        where: {
          componentId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const variant = await prisma.componentVariant.create({
      data: {
        name,
        slug,
        description,
        config,
        isDefault: isDefault || false,
        componentId,
      },
    });

    res.json({
      success: true,
      data: variant,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'A variant with this slug already exists for this component',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get all variants for a component
 */
export async function getComponentVariants(req: Request, res: Response) {
  try {
    const { componentId } = req.params;

    const variants = await prisma.componentVariant.findMany({
      where: { componentId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    res.json({
      success: true,
      data: variants,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get a specific variant
 */
export async function getComponentVariant(req: Request, res: Response) {
  try {
    const { componentId, variantId } = req.params;

    const variant = await prisma.componentVariant.findFirst({
      where: {
        id: variantId,
        componentId,
      },
    });

    if (!variant) {
      return res.status(404).json({
        success: false,
        error: 'Variant not found',
      });
    }

    res.json({
      success: true,
      data: variant,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Update a variant
 */
export async function updateComponentVariant(req: Request, res: Response) {
  try {
    const { componentId, variantId } = req.params;
    const { name, description, config, isDefault } = req.body;

    const variant = await prisma.componentVariant.findFirst({
      where: {
        id: variantId,
        componentId,
      },
    });

    if (!variant) {
      return res.status(404).json({
        success: false,
        error: 'Variant not found',
      });
    }

    // If setting as default, unset other defaults
    if (isDefault && !variant.isDefault) {
      await prisma.componentVariant.updateMany({
        where: {
          componentId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const updated = await prisma.componentVariant.update({
      where: { id: variantId },
      data: {
        name,
        description,
        config,
        isDefault,
      },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Delete a variant
 */
export async function deleteComponentVariant(req: Request, res: Response) {
  try {
    const { componentId, variantId } = req.params;

    const variant = await prisma.componentVariant.findFirst({
      where: {
        id: variantId,
        componentId,
      },
    });

    if (!variant) {
      return res.status(404).json({
        success: false,
        error: 'Variant not found',
      });
    }

    // Check if variant is in use
    const usageCount = await prisma.pageComponent.count({
      where: { variantId },
    });

    if (usageCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete variant: it is used in ${usageCount} page(s)`,
      });
    }

    await prisma.componentVariant.delete({
      where: { id: variantId },
    });

    res.json({
      success: true,
      message: 'Variant deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Duplicate a variant
 */
export async function duplicateComponentVariant(req: Request, res: Response) {
  try {
    const { componentId, variantId } = req.params;
    const { name, slug } = req.body;

    const original = await prisma.componentVariant.findFirst({
      where: {
        id: variantId,
        componentId,
      },
    });

    if (!original) {
      return res.status(404).json({
        success: false,
        error: 'Variant not found',
      });
    }

    const duplicate = await prisma.componentVariant.create({
      data: {
        name: name || `${original.name} (Copy)`,
        slug: slug || `${original.slug}-copy`,
        description: original.description,
        config: original.config as any,
        isDefault: false,
        componentId,
      },
    });

    res.json({
      success: true,
      data: duplicate,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'A variant with this slug already exists',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

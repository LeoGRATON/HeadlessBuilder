import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

/**
 * Create a new version of a component
 */
export async function createComponentVersion(req: Request, res: Response) {
  try {
    const { componentId } = req.params;
    const { version, changelog } = req.body;
    const id = (req as any).user?.id;

    // Get current component state
    const component = await prisma.component.findUnique({
      where: { id: componentId },
    });

    if (!component) {
      return res.status(404).json({
        success: false,
        error: 'Component not found',
      });
    }

    // Create version snapshot
    const componentVersion = await prisma.componentVersion.create({
      data: {
        version,
        name: component.name,
        description: component.description,
        schema: component.schema as any,
        thumbnail: component.thumbnail,
        changelog,
        componentId,
        createdBy: id,
      },
    });

    // Update component's current version
    await prisma.component.update({
      where: { id: componentId },
      data: { currentVersion: version },
    });

    res.json({
      success: true,
      data: componentVersion,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get all versions of a component
 */
export async function getComponentVersions(req: Request, res: Response) {
  try {
    const { componentId } = req.params;

    const versions = await prisma.componentVersion.findMany({
      where: { componentId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: versions,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get a specific version
 */
export async function getComponentVersion(req: Request, res: Response) {
  try {
    const { componentId, versionId } = req.params;

    const version = await prisma.componentVersion.findFirst({
      where: {
        id: versionId,
        componentId,
      },
    });

    if (!version) {
      return res.status(404).json({
        success: false,
        error: 'Version not found',
      });
    }

    res.json({
      success: true,
      data: version,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Restore a component to a specific version
 */
export async function restoreComponentVersion(req: Request, res: Response) {
  try {
    const { componentId, versionId } = req.params;
    const { createNewVersion } = req.body;

    const version = await prisma.componentVersion.findFirst({
      where: {
        id: versionId,
        componentId,
      },
    });

    if (!version) {
      return res.status(404).json({
        success: false,
        error: 'Version not found',
      });
    }

    const component = await prisma.component.findUnique({
      where: { id: componentId },
    });

    if (!component) {
      return res.status(404).json({
        success: false,
        error: 'Component not found',
      });
    }

    // If createNewVersion is true, create a snapshot before restoring
    if (createNewVersion) {
      const newVersionNumber = incrementVersion(component.currentVersion);

      await prisma.componentVersion.create({
        data: {
          version: newVersionNumber,
          name: component.name,
          description: component.description,
          schema: component.schema as any,
          thumbnail: component.thumbnail,
          changelog: `Backup before restoring to v${version.version}`,
          componentId,
          createdBy: (req as any).user?.id,
        },
      });
    }

    // Restore component to version state
    const updated = await prisma.component.update({
      where: { id: componentId },
      data: {
        name: version.name,
        description: version.description,
        schema: version.schema as any,
        thumbnail: version.thumbnail,
        currentVersion: version.version,
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
 * Compare two versions
 */
export async function compareVersions(req: Request, res: Response) {
  try {
    const { componentId } = req.params;
    const { versionA, versionB } = req.query;

    const [vA, vB] = await Promise.all([
      prisma.componentVersion.findFirst({
        where: { componentId, version: versionA as string },
      }),
      prisma.componentVersion.findFirst({
        where: { componentId, version: versionB as string },
      }),
    ]);

    if (!vA || !vB) {
      return res.status(404).json({
        success: false,
        error: 'One or both versions not found',
      });
    }

    res.json({
      success: true,
      data: {
        versionA: vA,
        versionB: vB,
        // Frontend can compute diff from these
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Helper: Increment semantic version
 */
function incrementVersion(version: string, type: 'major' | 'minor' | 'patch' = 'patch'): string {
  const parts = version.split('.').map(Number);

  switch (type) {
    case 'major':
      parts[0]++;
      parts[1] = 0;
      parts[2] = 0;
      break;
    case 'minor':
      parts[1]++;
      parts[2] = 0;
      break;
    case 'patch':
      parts[2]++;
      break;
  }

  return parts.join('.');
}

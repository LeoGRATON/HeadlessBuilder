import { Request, Response } from 'express';
import { generateACFFieldGroups, generateProjectACFFieldGroups } from '../services/acf-generator.service';
import { generatePageGraphQLSchema, generateProjectGraphQLSchema } from '../services/graphql-generator.service';
import { prisma } from '../lib/prisma';

/**
 * Export ACF field groups for a specific page
 */
export async function exportPageACF(req: Request, res: Response) {
  try {
    const { pageId } = req.params;

    const fieldGroups = await generateACFFieldGroups(pageId);

    res.json({
      success: true,
      data: {
        fieldGroups,
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
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
 * Export ACF field groups for an entire project
 */
export async function exportProjectACF(req: Request, res: Response) {
  try {
    const { projectId } = req.params;

    const fieldGroups = await generateProjectACFFieldGroups(projectId);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true },
    });

    res.json({
      success: true,
      data: {
        project: project?.name,
        fieldGroups,
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
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
 * Export GraphQL schema for a specific page
 */
export async function exportPageGraphQL(req: Request, res: Response) {
  try {
    const { pageId } = req.params;

    const schema = await generatePageGraphQLSchema(pageId);

    res.setHeader('Content-Type', 'text/plain');
    res.send(schema);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Export GraphQL schema for an entire project
 */
export async function exportProjectGraphQL(req: Request, res: Response) {
  try {
    const { projectId } = req.params;

    const schema = await generateProjectGraphQLSchema(projectId);

    res.setHeader('Content-Type', 'text/plain');
    res.send(schema);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Export complete project data (ACF + GraphQL + metadata)
 */
export async function exportProjectComplete(req: Request, res: Response) {
  try {
    const { projectId } = req.params;

    const [fieldGroups, graphqlSchema, project] = await Promise.all([
      generateProjectACFFieldGroups(projectId),
      generateProjectGraphQLSchema(projectId),
      prisma.project.findUnique({
        where: { id: projectId },
        include: {
          client: true,
          pages: {
            include: {
              components: {
                include: {
                  component: true,
                },
                orderBy: {
                  order: 'asc',
                },
              },
            },
          },
        },
      }),
    ]);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    res.json({
      success: true,
      data: {
        project: {
          id: project.id,
          name: project.name,
          client: project.client.name,
        },
        acf: {
          fieldGroups,
          version: '1.0.0',
        },
        graphql: {
          schema: graphqlSchema,
        },
        pages: project.pages.map((page) => ({
          id: page.id,
          name: page.name,
          slug: page.slug,
          title: page.title,
          description: page.description,
          componentCount: page.components.length,
        })),
        exportedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

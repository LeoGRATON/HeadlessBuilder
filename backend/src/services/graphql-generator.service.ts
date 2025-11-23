import { prisma } from '../lib/prisma';

interface GraphQLField {
  name: string;
  type: string;
  description?: string;
}

interface GraphQLType {
  name: string;
  fields: GraphQLField[];
}

/**
 * Map component field types to GraphQL types
 */
function mapFieldTypeToGraphQL(fieldType: string): string {
  const typeMap: Record<string, string> = {
    text: 'String',
    textarea: 'String',
    wysiwyg: 'String',
    image: 'MediaItem',
    url: 'String',
    number: 'Int',
    boolean: 'Boolean',
    select: 'String',
  };

  return typeMap[fieldType] || 'String';
}

/**
 * Generate GraphQL type for a component
 */
function generateComponentType(component: any): GraphQLType {
  const fields: GraphQLField[] = component.schema.fields.map((field: any) => ({
    name: field.name,
    type: mapFieldTypeToGraphQL(field.type),
    description: field.helpText || field.label,
  }));

  return {
    name: `${toPascalCase(component.slug)}Component`,
    fields,
  };
}

/**
 * Convert slug to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Generate GraphQL schema string for a component
 */
function generateComponentSchema(component: any): string {
  const typeName = `${toPascalCase(component.slug)}Component`;

  const fields = component.schema.fields
    .map((field: any) => {
      const graphqlType = mapFieldTypeToGraphQL(field.type);
      const isRequired = field.required ? '!' : '';
      const description = field.helpText || field.label;

      return `  """${description}"""\n  ${field.name}: ${graphqlType}${isRequired}`;
    })
    .join('\n\n');

  return `"""
${component.name} component
"""
type ${typeName} {
${fields}
}`;
}

/**
 * Generate page components union type
 */
function generatePageComponentsUnion(components: any[]): string {
  const typeNames = components
    .map((comp) => `${toPascalCase(comp.slug)}Component`)
    .join(' | ');

  return `"""
Union type for all page components
"""
union PageComponent = ${typeNames}`;
}

/**
 * Generate complete GraphQL schema for a page
 */
export async function generatePageGraphQLSchema(pageId: string): Promise<string> {
  const page = await prisma.page.findUnique({
    where: { id: pageId },
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
  });

  if (!page) {
    throw new Error('Page not found');
  }

  const uniqueComponents = Array.from(
    new Map(
      page.components.map((pc) => [pc.component.id, pc.component])
    ).values()
  );

  const componentSchemas = uniqueComponents.map((comp) =>
    generateComponentSchema(comp)
  );

  const unionType = generatePageComponentsUnion(uniqueComponents);

  const pageType = `"""
Page: ${page.name}
"""
type ${toPascalCase(page.slug)}Page {
  """Page ID"""
  id: ID!

  """Page name"""
  name: String!

  """Page slug"""
  slug: String!

  """Page title"""
  title: String

  """Page description"""
  description: String

  """Page components"""
  components: [PageComponent!]!
}`;

  return [
    '# Auto-generated GraphQL schema',
    `# Page: ${page.name}`,
    '',
    ...componentSchemas,
    '',
    unionType,
    '',
    pageType,
  ].join('\n');
}

/**
 * Generate GraphQL schema for entire project
 */
export async function generateProjectGraphQLSchema(projectId: string): Promise<string> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      pages: {
        include: {
          components: {
            include: {
              component: true,
            },
          },
        },
      },
    },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  // Collect all unique components across all pages
  const allComponents = new Map();
  project.pages.forEach((page) => {
    page.components.forEach((pc) => {
      allComponents.set(pc.component.id, pc.component);
    });
  });

  const uniqueComponents = Array.from(allComponents.values());

  const componentSchemas = uniqueComponents.map((comp) =>
    generateComponentSchema(comp)
  );

  const unionType = generatePageComponentsUnion(uniqueComponents);

  const pageTypes = project.pages.map((page) => {
    return `"""
Page: ${page.name}
"""
type ${toPascalCase(page.slug)}Page {
  """Page ID"""
  id: ID!

  """Page name"""
  name: String!

  """Page slug"""
  slug: String!

  """Page title"""
  title: String

  """Page description"""
  description: String

  """Page components"""
  components: [PageComponent!]!
}`;
  });

  return [
    '# Auto-generated GraphQL schema',
    `# Project: ${project.name}`,
    '',
    ...componentSchemas,
    '',
    unionType,
    '',
    ...pageTypes,
  ].join('\n');
}

import { prisma } from '../lib/prisma';

interface ACFField {
  key: string;
  label: string;
  name: string;
  type: string;
  required: number;
  default_value?: any;
  placeholder?: string;
  instructions?: string;
}

interface ACFFieldGroup {
  key: string;
  title: string;
  fields: ACFField[];
  location: Array<Array<{
    param: string;
    operator: string;
    value: string;
  }>>;
  menu_order: number;
  position: string;
  style: string;
  label_placement: string;
  instruction_placement: string;
  active: boolean;
}

/**
 * Map component field types to ACF field types
 */
function mapFieldTypeToACF(fieldType: string): string {
  const typeMap: Record<string, string> = {
    text: 'text',
    textarea: 'textarea',
    wysiwyg: 'wysiwyg',
    image: 'image',
    url: 'url',
    number: 'number',
    boolean: 'true_false',
    select: 'select',
  };

  return typeMap[fieldType] || 'text';
}

/**
 * Generate ACF field group for a single component
 */
function generateComponentFieldGroup(
  component: any,
  pageSlug: string,
  order: number
): ACFFieldGroup {
  const fields: ACFField[] = component.schema.fields.map((field: any, index: number) => {
    const acfField: ACFField = {
      key: `field_${component.slug}_${field.name}`,
      label: field.label,
      name: field.name,
      type: mapFieldTypeToACF(field.type),
      required: field.required ? 1 : 0,
    };

    // Add optional properties
    if (field.defaultValue !== undefined) {
      acfField.default_value = field.defaultValue;
    }
    if (field.placeholder) {
      acfField.placeholder = field.placeholder;
    }
    if (field.helpText) {
      acfField.instructions = field.helpText;
    }

    return acfField;
  });

  return {
    key: `group_${pageSlug}_${component.slug}`,
    title: `${component.name} - ${pageSlug}`,
    fields,
    location: [
      [
        {
          param: 'post_type',
          operator: '==',
          value: 'page',
        },
        {
          param: 'page_template',
          operator: '==',
          value: pageSlug,
        },
      ],
    ],
    menu_order: order,
    position: 'normal',
    style: 'default',
    label_placement: 'top',
    instruction_placement: 'label',
    active: true,
  };
}

/**
 * Generate all ACF field groups for a page
 */
export async function generateACFFieldGroups(pageId: string): Promise<ACFFieldGroup[]> {
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
      project: true,
    },
  });

  if (!page) {
    throw new Error('Page not found');
  }

  const fieldGroups: ACFFieldGroup[] = [];

  // Generate a field group for each component on the page
  page.components.forEach((pageComponent, index) => {
    const fieldGroup = generateComponentFieldGroup(
      pageComponent.component,
      page.slug,
      index
    );
    fieldGroups.push(fieldGroup);
  });

  return fieldGroups;
}

/**
 * Generate ACF field groups for an entire project
 */
export async function generateProjectACFFieldGroups(projectId: string): Promise<ACFFieldGroup[]> {
  const pages = await prisma.page.findMany({
    where: { projectId },
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

  const allFieldGroups: ACFFieldGroup[] = [];

  for (const page of pages) {
    page.components.forEach((pageComponent, index) => {
      const fieldGroup = generateComponentFieldGroup(
        pageComponent.component,
        page.slug,
        index
      );
      allFieldGroups.push(fieldGroup);
    });
  }

  return allFieldGroups;
}

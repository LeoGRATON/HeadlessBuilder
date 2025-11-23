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
    repeater: 'repeater',
    group: 'group',
    flexible_content: 'flexible_content',
  };

  return typeMap[fieldType] || 'text';
}

/**
 * Generate ACF field from schema field (supports nested fields for repeater/group)
 */
function generateACFField(field: any, componentSlug: string, parentKey: string = ''): any {
  const fieldKey = parentKey ? `${parentKey}_${field.name}` : `field_${componentSlug}_${field.name}`;

  const acfField: any = {
    key: fieldKey,
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

  // Handle select field choices
  if (field.type === 'select' && field.choices) {
    acfField.choices = field.choices.reduce((acc: any, choice: any) => {
      acc[choice.value] = choice.label;
      return acc;
    }, {});
  }

  // Handle repeater fields (with sub_fields)
  if (field.type === 'repeater' && field.subFields) {
    acfField.sub_fields = field.subFields.map((subField: any) =>
      generateACFField(subField, componentSlug, fieldKey)
    );
    acfField.layout = field.layout || 'table';
    acfField.button_label = field.buttonLabel || 'Add Row';
    if (field.min !== undefined) acfField.min = field.min;
    if (field.max !== undefined) acfField.max = field.max;
  }

  // Handle group fields
  if (field.type === 'group' && field.subFields) {
    acfField.sub_fields = field.subFields.map((subField: any) =>
      generateACFField(subField, componentSlug, fieldKey)
    );
    acfField.layout = field.layout || 'block';
  }

  // Handle flexible content
  if (field.type === 'flexible_content' && field.layouts) {
    acfField.layouts = field.layouts.map((layout: any, index: number) => ({
      key: `${fieldKey}_layout_${index}`,
      name: layout.name,
      label: layout.label,
      display: layout.display || 'block',
      sub_fields: layout.subFields.map((subField: any) =>
        generateACFField(subField, componentSlug, `${fieldKey}_layout_${index}`)
      ),
    }));
    acfField.button_label = field.buttonLabel || 'Add Row';
  }

  return acfField;
}

/**
 * Generate ACF field group for a single component
 */
function generateComponentFieldGroup(
  component: any,
  pageSlug: string,
  order: number
): ACFFieldGroup {
  const fields: ACFField[] = component.schema.fields.map((field: any) =>
    generateACFField(field, component.slug)
  );

  return {
    key: `group_${pageSlug}_${component.slug}`,
    title: `${component.name} - ${pageSlug}`,
    fields,
    location: [
      [
        {
          param: 'page',
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

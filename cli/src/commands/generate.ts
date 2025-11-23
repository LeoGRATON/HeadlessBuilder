import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';

interface GenerateOptions {
  schema?: string;
  output?: string;
}

export async function generateCommand(options: GenerateOptions) {
  console.log(chalk.blue.bold('\n📦 Generating types and components\n'));

  const schemaPath = options.schema || 'schema.graphql';
  const outputDir = options.output || 'src/generated';

  // Check if schema exists
  if (!(await fs.pathExists(schemaPath))) {
    console.log(chalk.red(`\n❌ Schema file not found: ${schemaPath}\n`));
    process.exit(1);
  }

  const spinner = ora('Running GraphQL Code Generator...').start();

  try {
    execSync('npx graphql-codegen', { stdio: 'pipe' });
    spinner.succeed('Types generated successfully');

    // Parse schema and generate component stubs
    await generateComponentStubs(schemaPath, outputDir);

    console.log(chalk.green.bold('\n✅ Generation complete!\n'));
  } catch (error: any) {
    spinner.fail('Generation failed');
    console.error(chalk.red('\nError:'), error.message);
    process.exit(1);
  }
}

async function generateComponentStubs(schemaPath: string, outputDir: string) {
  const spinner = ora('Generating component stubs...').start();

  try {
    const schema = await fs.readFile(schemaPath, 'utf-8');

    // Parse component types from schema
    const componentTypes = parseComponentTypes(schema);

    if (componentTypes.length === 0) {
      spinner.info('No component types found in schema');
      return;
    }

    const componentsDir = path.join(process.cwd(), 'components', 'builder');
    await fs.ensureDir(componentsDir);

    for (const componentType of componentTypes) {
      const componentPath = path.join(componentsDir, `${componentType.name}.tsx`);

      // Only create if doesn't exist
      if (!(await fs.pathExists(componentPath))) {
        const componentCode = generateComponentCode(componentType);
        await fs.writeFile(componentPath, componentCode);
      }
    }

    spinner.succeed(`Generated ${componentTypes.length} component stubs`);
  } catch (error: any) {
    spinner.warn('Could not generate component stubs');
  }
}

interface ComponentType {
  name: string;
  fields: Array<{ name: string; type: string; description?: string }>;
  description?: string;
}

function parseComponentTypes(schema: string): ComponentType[] {
  const types: ComponentType[] = [];

  // Match type definitions that end with "Component"
  const typeRegex = /"""([^"]*)"""\s*type\s+(\w+Component)\s*\{([^}]+)\}/g;

  let match;
  while ((match = typeRegex.exec(schema)) !== null) {
    const [, description, typeName, fieldsBlock] = match;

    const fields = parseFields(fieldsBlock);

    types.push({
      name: typeName.replace(/Component$/, ''),
      fields,
      description: description.trim(),
    });
  }

  return types;
}

function parseFields(fieldsBlock: string): Array<{ name: string; type: string; description?: string }> {
  const fields: Array<{ name: string; type: string; description?: string }> = [];

  // Match field definitions with optional descriptions
  const fieldLines = fieldsBlock.split('\n');
  let currentDescription: string | undefined;

  for (const line of fieldLines) {
    const trimmed = line.trim();

    // Check for description
    const descMatch = trimmed.match(/"""([^"]*)"""/);
    if (descMatch) {
      currentDescription = descMatch[1];
      continue;
    }

    // Check for field definition
    const fieldMatch = trimmed.match(/(\w+):\s*(\w+)(!?)/);
    if (fieldMatch) {
      const [, name, type] = fieldMatch;
      fields.push({
        name,
        type,
        description: currentDescription,
      });
      currentDescription = undefined;
    }
  }

  return fields;
}

function generateComponentCode(componentType: ComponentType): string {
  const interfaceName = `${componentType.name}Props`;

  // Generate interface
  const interfaceFields = componentType.fields
    .map((field) => {
      const optional = field.type.includes('!') ? '' : '?';
      const tsType = graphqlToTypeScript(field.type);
      const comment = field.description ? `  /** ${field.description} */\n` : '';
      return `${comment}  ${field.name}${optional}: ${tsType};`;
    })
    .join('\n');

  const description = componentType.description
    ? `/**\n * ${componentType.description}\n */\n`
    : '';

  return `${description}interface ${interfaceName} {
${interfaceFields}
}

export default function ${componentType.name}(props: ${interfaceName}) {
  return (
    <div className="${componentType.name.toLowerCase()}">
      {/* TODO: Implement ${componentType.name} component */}
      <pre>{JSON.stringify(props, null, 2)}</pre>
    </div>
  );
}
`;
}

function graphqlToTypeScript(graphqlType: string): string {
  const baseType = graphqlType.replace(/!/g, '');

  const typeMap: Record<string, string> = {
    String: 'string',
    Int: 'number',
    Float: 'number',
    Boolean: 'boolean',
    ID: 'string',
    MediaItem: '{ url: string; alt?: string }',
  };

  return typeMap[baseType] || 'any';
}

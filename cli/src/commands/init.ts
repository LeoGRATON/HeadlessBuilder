import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { execSync } from 'child_process';

interface InitOptions {
  template?: string;
  builderUrl?: string;
  projectId?: string;
  wpUrl?: string;
}

export async function initCommand(projectName: string | undefined, options: InitOptions) {
  console.log(chalk.blue.bold('\n🚀 Headless Builder CLI\n'));

  // Prompt for missing options
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: projectName || 'my-headless-site',
      when: !projectName,
    },
    {
      type: 'list',
      name: 'template',
      message: 'Choose a template:',
      choices: [
        { name: 'Next.js + Apollo Client', value: 'nextjs-apollo' },
        { name: 'Next.js + urql', value: 'nextjs-urql' },
      ],
      default: options.template || 'nextjs-apollo',
      when: !options.template,
    },
    {
      type: 'input',
      name: 'builderUrl',
      message: 'Headless Builder URL:',
      default: 'http://localhost:3001',
      when: !options.builderUrl,
    },
    {
      type: 'input',
      name: 'projectId',
      message: 'Project ID:',
      when: !options.projectId,
    },
    {
      type: 'input',
      name: 'wpUrl',
      message: 'WordPress GraphQL endpoint:',
      default: 'http://localhost:8000/graphql',
      when: !options.wpUrl,
    },
  ]);

  const config = {
    projectName: projectName || answers.projectName,
    template: options.template || answers.template,
    builderUrl: options.builderUrl || answers.builderUrl,
    projectId: options.projectId || answers.projectId,
    wpUrl: options.wpUrl || answers.wpUrl,
  };

  const targetDir = path.join(process.cwd(), config.projectName);

  // Check if directory exists
  if (await fs.pathExists(targetDir)) {
    console.log(chalk.red(`\n❌ Directory "${config.projectName}" already exists\n`));
    process.exit(1);
  }

  let spinner = ora('Creating Next.js project...').start();

  try {
    // Create Next.js project
    execSync(
      `npx create-next-app@latest ${config.projectName} --typescript --tailwind --app --no-src-dir --import-alias "@/*"`,
      { stdio: 'pipe' }
    );

    spinner.succeed('Next.js project created');

    // Fetch GraphQL schema from Builder
    spinner = ora('Fetching GraphQL schema from Builder...').start();

    let schema: string;
    try {
      const response = await axios.get(
        `${config.builderUrl}/api/export/projects/${config.projectId}/graphql`
      );
      schema = response.data;
    } catch (error) {
      spinner.warn('Could not fetch schema from Builder');
      schema = '# Add your GraphQL schema here';
    }

    // Write schema file
    const schemaPath = path.join(targetDir, 'schema.graphql');
    await fs.writeFile(schemaPath, schema);

    spinner.succeed('GraphQL schema saved');

    // Install dependencies based on template
    spinner = ora('Installing dependencies...').start();

    const deps = config.template === 'nextjs-apollo'
      ? '@apollo/client graphql'
      : 'urql graphql';

    execSync(`cd ${config.projectName} && npm install ${deps}`, { stdio: 'pipe' });

    const devDeps = '@graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations';
    const templateDeps = config.template === 'nextjs-apollo'
      ? '@graphql-codegen/typescript-react-apollo'
      : '@graphql-codegen/typescript-urql';

    execSync(
      `cd ${config.projectName} && npm install -D ${devDeps} ${templateDeps}`,
      { stdio: 'pipe' }
    );

    spinner.succeed('Dependencies installed');

    // Copy template files
    spinner = ora('Setting up project files...').start();

    await setupProjectFiles(targetDir, config);

    spinner.succeed('Project files created');

    // Generate types
    spinner = ora('Generating TypeScript types...').start();

    try {
      execSync(`cd ${config.projectName} && npx graphql-codegen`, { stdio: 'pipe' });
      spinner.succeed('Types generated');
    } catch (error) {
      spinner.warn('Could not generate types (you can run "npm run codegen" later)');
    }

    // Success message
    console.log(chalk.green.bold('\n✅ Project created successfully!\n'));
    console.log(chalk.cyan('Next steps:\n'));
    console.log(chalk.white(`  cd ${config.projectName}`));
    console.log(chalk.white('  npm run dev\n'));
    console.log(chalk.gray('To regenerate types after schema changes:\n'));
    console.log(chalk.white('  npm run codegen\n'));

  } catch (error: any) {
    spinner.fail('Failed to create project');
    console.error(chalk.red('\nError:'), error.message);
    process.exit(1);
  }
}

async function setupProjectFiles(targetDir: string, config: any) {
  // Create .env.local
  const envContent = `# WordPress GraphQL endpoint
NEXT_PUBLIC_WORDPRESS_URL=${config.wpUrl}

# Headless Builder (optional - for syncing schema)
HEADLESS_BUILDER_URL=${config.builderUrl}
HEADLESS_BUILDER_PROJECT_ID=${config.projectId}
`;
  await fs.writeFile(path.join(targetDir, '.env.local'), envContent);

  // Create codegen.ts
  const codegenConfig = config.template === 'nextjs-apollo'
    ? getApolloCodegenConfig()
    : getUrqlCodegenConfig();

  await fs.writeFile(
    path.join(targetDir, 'codegen.ts'),
    codegenConfig
  );

  // Create GraphQL client
  const clientCode = config.template === 'nextjs-apollo'
    ? getApolloClient()
    : getUrqlClient();

  const libDir = path.join(targetDir, 'lib');
  await fs.ensureDir(libDir);
  await fs.writeFile(path.join(libDir, 'graphql-client.ts'), clientCode);

  // Update package.json scripts
  const packageJsonPath = path.join(targetDir, 'package.json');
  const packageJson = await fs.readJson(packageJsonPath);
  packageJson.scripts = {
    ...packageJson.scripts,
    codegen: 'graphql-codegen --config codegen.ts',
    'codegen:watch': 'graphql-codegen --config codegen.ts --watch',
  };
  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

  // Create sample component
  const componentsDir = path.join(targetDir, 'components');
  await fs.ensureDir(componentsDir);
  await fs.writeFile(
    path.join(componentsDir, 'PageRenderer.tsx'),
    getPageRendererComponent(config.template)
  );

  // Update README
  const readme = getReadme(config);
  await fs.writeFile(path.join(targetDir, 'README.md'), readme);
}

function getApolloCodegenConfig(): string {
  return `import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: './schema.graphql',
  documents: ['app/**/*.tsx', 'components/**/*.tsx', 'lib/**/*.ts'],
  ignoreNoDocuments: true,
  generates: {
    './lib/generated/': {
      preset: 'client',
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-apollo',
      ],
      config: {
        withHooks: true,
        withComponent: false,
        withHOC: false,
      },
    },
  },
};

export default config;
`;
}

function getUrqlCodegenConfig(): string {
  return `import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: './schema.graphql',
  documents: ['app/**/*.tsx', 'components/**/*.tsx', 'lib/**/*.ts'],
  ignoreNoDocuments: true,
  generates: {
    './lib/generated/': {
      preset: 'client',
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-urql',
      ],
    },
  },
};

export default config;
`;
}

function getApolloClient(): string {
  return `import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_WORDPRESS_URL,
});

export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
`;
}

function getUrqlClient(): string {
  return `import { createClient, fetchExchange, cacheExchange } from 'urql';

export const client = createClient({
  url: process.env.NEXT_PUBLIC_WORDPRESS_URL!,
  exchanges: [cacheExchange, fetchExchange],
});
`;
}

function getPageRendererComponent(template: string): string {
  const imports = template === 'nextjs-apollo'
    ? `import { useQuery, gql } from '@apollo/client';`
    : `import { useQuery } from 'urql';`;

  return `${imports}

interface PageRendererProps {
  slug: string;
}

export default function PageRenderer({ slug }: PageRendererProps) {
  // TODO: Add your page query here
  // Example:
  // const { data, loading, error } = useQuery(GET_PAGE, {
  //   variables: { slug },
  // });

  return (
    <div>
      <h1>Page: {slug}</h1>
      {/* Render your components here based on the page data */}
    </div>
  );
}
`;
}

function getReadme(config: any): string {
  return `# ${config.projectName}

Next.js project generated by Headless Builder CLI.

## Getting Started

1. Start the development server:

\`\`\`bash
npm run dev
\`\`\`

2. Open [http://localhost:3000](http://localhost:3000)

## GraphQL Code Generation

This project uses GraphQL Code Generator to create TypeScript types from your schema.

### Generate types

\`\`\`bash
npm run codegen
\`\`\`

### Watch mode

\`\`\`bash
npm run codegen:watch
\`\`\`

## Project Structure

- \`schema.graphql\` - GraphQL schema from Headless Builder
- \`lib/graphql-client.ts\` - ${config.template === 'nextjs-apollo' ? 'Apollo' : 'urql'} client configuration
- \`lib/generated/\` - Auto-generated TypeScript types
- \`components/\` - React components

## Environment Variables

Copy \`.env.local\` and update with your values:

- \`NEXT_PUBLIC_WORDPRESS_URL\` - WordPress GraphQL endpoint
- \`HEADLESS_BUILDER_URL\` - Headless Builder API URL
- \`HEADLESS_BUILDER_PROJECT_ID\` - Your project ID

## Sync Schema

To sync the latest schema from Headless Builder:

\`\`\`bash
npx headless-builder sync
\`\`\`

Then regenerate types:

\`\`\`bash
npm run codegen
\`\`\`

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [${config.template === 'nextjs-apollo' ? 'Apollo Client' : 'urql'} Documentation](https://${config.template === 'nextjs-apollo' ? 'www.apollographql.com/docs/react' : 'formidable.com/open-source/urql'})
- [GraphQL Code Generator](https://the-guild.dev/graphql/codegen)
`;
}

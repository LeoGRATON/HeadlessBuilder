import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { execSync } from 'child_process';

interface SyncOptions {
  builderUrl?: string;
  projectId?: string;
}

export async function syncCommand(options: SyncOptions) {
  console.log(chalk.blue.bold('\n🔄 Syncing schema from Headless Builder\n'));

  // Read config from .env.local or options
  const config = await loadConfig(options);

  if (!config.builderUrl || !config.projectId) {
    console.log(chalk.red('❌ Missing configuration\n'));
    console.log(chalk.yellow('Please provide:'));
    console.log(chalk.white('  --builder-url <url>'));
    console.log(chalk.white('  --project-id <id>'));
    console.log(chalk.gray('\nOr set in .env.local:'));
    console.log(chalk.white('  HEADLESS_BUILDER_URL=...'));
    console.log(chalk.white('  HEADLESS_BUILDER_PROJECT_ID=...\n'));
    process.exit(1);
  }

  const spinner = ora('Fetching schema from Builder...').start();

  try {
    // Fetch GraphQL schema
    const response = await axios.get(
      `${config.builderUrl}/api/export/projects/${config.projectId}/graphql`
    );

    const schema = response.data;

    // Write schema file
    await fs.writeFile('schema.graphql', schema);

    spinner.succeed('Schema synced successfully');

    // Regenerate types
    const regenerate = ora('Regenerating types...').start();

    try {
      execSync('npm run codegen', { stdio: 'pipe' });
      regenerate.succeed('Types regenerated');
    } catch (error) {
      regenerate.warn('Could not regenerate types (run "npm run codegen" manually)');
    }

    console.log(chalk.green.bold('\n✅ Sync complete!\n'));
  } catch (error: any) {
    spinner.fail('Sync failed');

    if (error.response) {
      console.error(chalk.red('\nAPI Error:'), error.response.status, error.response.statusText);
    } else if (error.request) {
      console.error(chalk.red('\nNetwork Error:'), 'Could not connect to Builder');
    } else {
      console.error(chalk.red('\nError:'), error.message);
    }

    process.exit(1);
  }
}

async function loadConfig(options: SyncOptions): Promise<SyncOptions> {
  const config: SyncOptions = { ...options };

  // Try to read from .env.local
  const envPath = path.join(process.cwd(), '.env.local');

  if (await fs.pathExists(envPath)) {
    const envContent = await fs.readFile(envPath, 'utf-8');

    if (!config.builderUrl) {
      const urlMatch = envContent.match(/HEADLESS_BUILDER_URL=(.+)/);
      if (urlMatch) {
        config.builderUrl = urlMatch[1].trim();
      }
    }

    if (!config.projectId) {
      const idMatch = envContent.match(/HEADLESS_BUILDER_PROJECT_ID=(.+)/);
      if (idMatch) {
        config.projectId = idMatch[1].trim();
      }
    }
  }

  return config;
}

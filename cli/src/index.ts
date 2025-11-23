#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init';
import { generateCommand } from './commands/generate';
import { syncCommand } from './commands/sync';

const program = new Command();

program
  .name('headless-builder')
  .description('CLI for scaffolding Next.js projects from Headless Builder')
  .version('1.0.0');

program
  .command('init [project-name]')
  .description('Initialize a new Next.js project with Headless Builder')
  .option('-t, --template <template>', 'Template to use (nextjs-apollo, nextjs-urql)', 'nextjs-apollo')
  .option('--builder-url <url>', 'Headless Builder API URL')
  .option('--project-id <id>', 'Project ID from Headless Builder')
  .option('--wp-url <url>', 'WordPress GraphQL endpoint URL')
  .action(initCommand);

program
  .command('generate')
  .description('Generate types and components from GraphQL schema')
  .option('--schema <path>', 'Path to GraphQL schema file')
  .option('--output <path>', 'Output directory', 'src/generated')
  .action(generateCommand);

program
  .command('sync')
  .description('Sync schema and regenerate types from Headless Builder')
  .option('--builder-url <url>', 'Headless Builder API URL')
  .option('--project-id <id>', 'Project ID from Headless Builder')
  .action(syncCommand);

program.parse();

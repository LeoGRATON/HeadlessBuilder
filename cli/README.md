# Headless Builder CLI

CLI tool for scaffolding Next.js projects with Headless Builder integration.

## Installation

```bash
npm install -g @headless-builder/cli
```

Or use directly with npx:

```bash
npx @headless-builder/cli init my-project
```

## Commands

### `init [project-name]`

Initialize a new Next.js project with Headless Builder configuration.

```bash
headless-builder init my-site
```

**Options:**

- `-t, --template <template>` - Template to use (`nextjs-apollo` or `nextjs-urql`, default: `nextjs-apollo`)
- `--builder-url <url>` - Headless Builder API URL
- `--project-id <id>` - Project ID from Headless Builder
- `--wp-url <url>` - WordPress GraphQL endpoint URL

**Interactive mode:**

```bash
headless-builder init
```

The CLI will prompt you for all required information.

**Example:**

```bash
headless-builder init my-site \
  --template nextjs-apollo \
  --builder-url http://localhost:3001 \
  --project-id abc123 \
  --wp-url http://localhost:8000/graphql
```

### `generate`

Generate TypeScript types and React component stubs from GraphQL schema.

```bash
headless-builder generate
```

**Options:**

- `--schema <path>` - Path to GraphQL schema file (default: `schema.graphql`)
- `--output <path>` - Output directory for generated files (default: `src/generated`)

This command:
1. Runs GraphQL Code Generator to create TypeScript types
2. Parses your schema for component types
3. Creates React component stubs in `components/builder/`

### `sync`

Sync GraphQL schema from Headless Builder and regenerate types.

```bash
headless-builder sync
```

**Options:**

- `--builder-url <url>` - Headless Builder API URL
- `--project-id <id>` - Project ID

If not provided, values are read from `.env.local`:

```env
HEADLESS_BUILDER_URL=http://localhost:3001
HEADLESS_BUILDER_PROJECT_ID=abc123
```

## Workflow

### 1. Create a new project

```bash
headless-builder init my-headless-site
cd my-headless-site
```

### 2. Start development

```bash
npm run dev
```

### 3. After updating components in Builder

```bash
# Sync the latest schema
headless-builder sync

# Or manually regenerate types
npm run codegen
```

## Templates

### Next.js + Apollo Client

Full-featured GraphQL client with caching, optimistic UI, and more.

```bash
headless-builder init my-site --template nextjs-apollo
```

**Generated files:**

- `lib/graphql-client.ts` - Apollo Client setup
- `lib/generated/` - TypeScript types and hooks
- `components/builder/` - Component stubs

**Usage:**

```tsx
import { useQuery, gql } from '@apollo/client';

const GET_PAGE = gql`
  query GetPage($slug: String!) {
    page(slug: $slug) {
      id
      name
      components
    }
  }
`;

function Page({ slug }: { slug: string }) {
  const { data, loading } = useQuery(GET_PAGE, {
    variables: { slug },
  });

  // ...
}
```

### Next.js + urql

Lightweight and extensible GraphQL client.

```bash
headless-builder init my-site --template nextjs-urql
```

**Generated files:**

- `lib/graphql-client.ts` - urql client setup
- `lib/generated/` - TypeScript types
- `components/builder/` - Component stubs

**Usage:**

```tsx
import { useQuery } from 'urql';

const GET_PAGE = `
  query GetPage($slug: String!) {
    page(slug: $slug) {
      id
      name
      components
    }
  }
`;

function Page({ slug }: { slug: string }) {
  const [result] = useQuery({
    query: GET_PAGE,
    variables: { slug },
  });

  // ...
}
```

## Project Structure

```
my-headless-site/
├── app/                      # Next.js app directory
├── components/
│   ├── builder/             # Auto-generated component stubs
│   │   ├── Hero.tsx
│   │   ├── Cta.tsx
│   │   └── ...
│   └── PageRenderer.tsx     # Page rendering logic
├── lib/
│   ├── graphql-client.ts    # GraphQL client config
│   └── generated/           # Auto-generated types
├── schema.graphql           # GraphQL schema from Builder
├── codegen.ts              # GraphQL Codegen config
├── .env.local              # Environment variables
└── package.json
```

## Code Generation

The CLI uses [GraphQL Code Generator](https://the-guild.dev/graphql/codegen) to create TypeScript types from your schema.

**Configuration** (`codegen.ts`):

```typescript
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: './schema.graphql',
  documents: ['app/**/*.tsx', 'components/**/*.tsx'],
  generates: {
    './lib/generated/': {
      preset: 'client',
      plugins: ['typescript', 'typescript-operations'],
    },
  },
};

export default config;
```

**Commands:**

```bash
# Generate once
npm run codegen

# Watch mode
npm run codegen:watch
```

## Component Generation

The CLI automatically generates React component stubs for each component type in your GraphQL schema.

**Example schema:**

```graphql
"""
Hero component with title and CTA
"""
type HeroComponent {
  """Main headline"""
  title: String!

  """Subheading text"""
  subtitle: String

  """Call to action button"""
  ctaText: String
  ctaUrl: String
}
```

**Generated component:**

```tsx
/**
 * Hero component with title and CTA
 */
interface HeroProps {
  /** Main headline */
  title: string;
  /** Subheading text */
  subtitle?: string;
  /** Call to action button */
  ctaText?: string;
  ctaUrl?: string;
}

export default function Hero(props: HeroProps) {
  return (
    <div className="hero">
      {/* TODO: Implement Hero component */}
      <pre>{JSON.stringify(props, null, 2)}</pre>
    </div>
  );
}
```

## Environment Variables

Create `.env.local`:

```env
# WordPress GraphQL endpoint
NEXT_PUBLIC_WORDPRESS_URL=http://localhost:8000/graphql

# Headless Builder (for syncing)
HEADLESS_BUILDER_URL=http://localhost:3001
HEADLESS_BUILDER_PROJECT_ID=your-project-id
```

## Development

### Building the CLI

```bash
cd cli
npm install
npm run build
```

### Testing locally

```bash
# Link the CLI globally
npm link

# Use it
headless-builder init test-project
```

### Publishing

```bash
npm publish --access public
```

## Requirements

- Node.js 18+
- npm or yarn

## License

MIT

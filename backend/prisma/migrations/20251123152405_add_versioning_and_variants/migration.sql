-- CreateTable: ComponentVersion
CREATE TABLE "component_versions" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "schema" JSONB NOT NULL,
    "thumbnail" TEXT,
    "changelog" TEXT,
    "componentId" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "component_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ComponentVariant
CREATE TABLE "component_variants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "config" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "componentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "component_variants_pkey" PRIMARY KEY ("id")
);

-- AlterTable: components
-- Rename version to currentVersion and add deprecated field
ALTER TABLE "components" RENAME COLUMN "version" TO "currentVersion";
ALTER TABLE "components" ADD COLUMN "deprecated" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: page_components
-- Add variantId and lockedVersion columns
ALTER TABLE "page_components" ADD COLUMN "variantId" TEXT;
ALTER TABLE "page_components" ADD COLUMN "lockedVersion" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "component_versions_componentId_version_key" ON "component_versions"("componentId", "version");
CREATE INDEX "component_versions_componentId_idx" ON "component_versions"("componentId");

CREATE UNIQUE INDEX "component_variants_componentId_slug_key" ON "component_variants"("componentId", "slug");
CREATE INDEX "component_variants_componentId_idx" ON "component_variants"("componentId");

CREATE INDEX "page_components_variantId_idx" ON "page_components"("variantId");

-- AddForeignKey
ALTER TABLE "component_versions" ADD CONSTRAINT "component_versions_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "components"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "component_variants" ADD CONSTRAINT "component_variants_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "components"("id") ON DELETE CASCADE ON UPDATE CASCADE;

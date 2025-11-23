import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export default function ComponentVariantsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState<any>(null);

  const { data: component, isLoading: loadingComponent } = useQuery({
    queryKey: ['component', id],
    queryFn: async () => {
      const response = await api.get(`/components/${id}`);
      return response.data;
    },
  });

  const { data: variants, isLoading: loadingVariants } = useQuery({
    queryKey: ['component-variants', id],
    queryFn: async () => {
      const response = await api.get(`/components/${id}/variants`);
      return response.data.data;
    },
  });

  const createVariantMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post(`/components/${id}/variants`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['component-variants', id] });
      setShowCreateModal(false);
    },
  });

  const updateVariantMutation = useMutation({
    mutationFn: async ({ variantId, data }: { variantId: string; data: any }) => {
      await api.put(`/components/${id}/variants/${variantId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['component-variants', id] });
      setEditingVariant(null);
    },
  });

  const deleteVariantMutation = useMutation({
    mutationFn: async (variantId: string) => {
      await api.delete(`/components/${id}/variants/${variantId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['component-variants', id] });
    },
  });

  const duplicateVariantMutation = useMutation({
    mutationFn: async ({ variantId, name, slug }: { variantId: string; name: string; slug: string }) => {
      await api.post(`/components/${id}/variants/${variantId}/duplicate`, { name, slug });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['component-variants', id] });
    },
  });

  if (loadingComponent || loadingVariants) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-2 text-gray-600">Loading variants...</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/components')}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center mb-2"
        >
          <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Components
        </button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Variants</h1>
            <p className="text-gray-600">{component?.name}</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Variant
          </button>
        </div>
      </div>

      {/* Variants Grid */}
      {!variants || variants.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No variants</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new variant.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {variants.map((variant: any) => (
            <div
              key={variant.id}
              className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{variant.name}</h3>
                  {variant.isDefault && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Default
                    </span>
                  )}
                </div>

                {variant.description && (
                  <p className="text-sm text-gray-600 mb-4">{variant.description}</p>
                )}

                <div className="text-xs text-gray-500 mb-4">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">{variant.slug}</span>
                </div>

                {/* Config preview */}
                <div className="mb-4">
                  <details className="text-sm">
                    <summary className="cursor-pointer text-gray-700 hover:text-gray-900">
                      View config
                    </summary>
                    <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(variant.config, null, 2)}
                    </pre>
                  </details>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingVariant(variant)}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        const name = prompt('Duplicate variant name:', `${variant.name} (Copy)`);
                        if (name) {
                          const slug = name.toLowerCase().replace(/\s+/g, '-');
                          duplicateVariantMutation.mutate({
                            variantId: variant.id,
                            name,
                            slug,
                          });
                        }
                      }}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      Duplicate
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Delete variant "${variant.name}"?`)) {
                        deleteVariantMutation.mutate(variant.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <VariantModal
          onClose={() => setShowCreateModal(false)}
          onSave={(data) => createVariantMutation.mutate(data)}
          componentSchema={component?.schema}
        />
      )}

      {/* Edit Modal */}
      {editingVariant && (
        <VariantModal
          variant={editingVariant}
          onClose={() => setEditingVariant(null)}
          onSave={(data) =>
            updateVariantMutation.mutate({
              variantId: editingVariant.id,
              data,
            })
          }
          componentSchema={component?.schema}
        />
      )}
    </div>
  );
}

function VariantModal({
  variant,
  onClose,
  onSave,
  componentSchema,
}: {
  variant?: any;
  onClose: () => void;
  onSave: (data: any) => void;
  componentSchema: any;
}) {
  const [name, setName] = useState(variant?.name || '');
  const [slug, setSlug] = useState(variant?.slug || '');
  const [description, setDescription] = useState(variant?.description || '');
  const [config, setConfig] = useState(
    JSON.stringify(variant?.config || {}, null, 2)
  );
  const [isDefault, setIsDefault] = useState(variant?.isDefault || false);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!variant) {
      // Auto-generate slug for new variants
      setSlug(value.toLowerCase().replace(/\s+/g, '-'));
    }
  };

  const handleSubmit = () => {
    try {
      const parsedConfig = JSON.parse(config);
      onSave({
        name,
        slug,
        description,
        config: parsedConfig,
        isDefault,
      });
    } catch (error) {
      alert('Invalid JSON configuration');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {variant ? 'Edit Variant' : 'Create Variant'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g., Large, Compact, Dark"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
              placeholder="e.g., large, compact, dark"
              disabled={!!variant}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Configuration (JSON)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Variant-specific config overrides. Can include default values, CSS classes, etc.
            </p>
            <textarea
              value={config}
              onChange={(e) => setConfig(e.target.value)}
              rows={10}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono text-xs"
              placeholder='{"classes": "hero-large", "defaultValues": {...}}'
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
              Set as default variant
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name || !slug}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {variant ? 'Update' : 'Create'} Variant
          </button>
        </div>
      </div>
    </div>
  );
}

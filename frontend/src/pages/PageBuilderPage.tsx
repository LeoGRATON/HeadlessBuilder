import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

interface PageComponent {
  id: string;
  order: number;
  config: Record<string, any>;
  styles: Record<string, any>;
  component: {
    id: string;
    name: string;
    slug: string;
    category: string | null;
    schema: {
      fields: Array<{
        name: string;
        type: string;
        label: string;
        required: boolean;
        defaultValue?: any;
        placeholder?: string;
        options?: Array<{ label: string; value: string }>;
      }>;
    };
  };
}

export default function PageBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showComponentLibrary, setShowComponentLibrary] = useState(false);
  const [editingComponent, setEditingComponent] = useState<PageComponent | null>(null);
  const [editConfig, setEditConfig] = useState<Record<string, any>>({});

  const { data: page, isLoading } = useQuery({
    queryKey: ['page', id],
    queryFn: async () => {
      const response = await api.get(`/pages/${id}`);
      return response.data;
    },
  });

  const { data: components } = useQuery({
    queryKey: ['components'],
    queryFn: async () => {
      const response = await api.get('/components');
      return response.data;
    },
  });

  const addComponentMutation = useMutation({
    mutationFn: async (data: { componentId: string; order: number; config: any }) => {
      const response = await api.post(`/pages/${id}/components`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page', id] });
      setShowComponentLibrary(false);
    },
  });

  const updateComponentMutation = useMutation({
    mutationFn: async ({ componentId, config }: { componentId: string; config: any }) => {
      const response = await api.put(`/pages/${id}/components/${componentId}`, { config });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page', id] });
      setEditingComponent(null);
    },
  });

  const removeComponentMutation = useMutation({
    mutationFn: async (componentId: string) => {
      await api.delete(`/pages/${id}/components/${componentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page', id] });
    },
  });

  const handleAddComponent = (componentId: string) => {
    const component = components?.find((c: any) => c.id === componentId);
    if (!component) return;

    // Build default config from schema
    const defaultConfig: Record<string, any> = {};
    const schema = typeof component.schema === 'string'
      ? JSON.parse(component.schema)
      : component.schema;

    if (schema?.fields) {
      schema.fields.forEach((field: any) => {
        if (field.defaultValue !== undefined) {
          defaultConfig[field.name] = field.defaultValue;
        }
      });
    }

    addComponentMutation.mutate({
      componentId,
      order: page?.components?.length || 0,
      config: defaultConfig,
    });
  };

  const handleEditComponent = (pageComponent: PageComponent) => {
    setEditingComponent(pageComponent);
    setEditConfig({ ...pageComponent.config });
  };

  const handleSaveConfig = () => {
    if (!editingComponent) return;
    updateComponentMutation.mutate({
      componentId: editingComponent.id,
      config: editConfig,
    });
  };

  const handleRemoveComponent = (componentId: string) => {
    if (confirm('Remove this component from the page?')) {
      removeComponentMutation.mutate(componentId);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-2 text-gray-600">Loading page...</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <button
            onClick={() => navigate('/pages')}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center mb-2"
          >
            <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Pages
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{page?.name}</h1>
          <p className="text-gray-600">
            {page?.project.client.name} - {page?.project.name}
          </p>
        </div>
        <button
          onClick={() => setShowComponentLibrary(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Component
        </button>
      </div>

      {/* Page Components */}
      <div className="space-y-4">
        {page?.components?.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow border-2 border-dashed border-gray-300">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No components yet</h3>
            <p className="mt-1 text-sm text-gray-500">Add your first component to start building this page.</p>
            <button
              onClick={() => setShowComponentLibrary(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Add Component
            </button>
          </div>
        ) : (
          page?.components.map((pageComp: PageComponent) => (
            <div key={pageComp.id} className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-900">{pageComp.component.name}</h3>
                    {pageComp.component.category && (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                        {pageComp.component.category}
                      </span>
                    )}
                  </div>

                  {/* Display config values */}
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {Object.entries(pageComp.config).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="font-medium text-gray-700">{key}:</span>
                        <span className="ml-2 text-gray-600">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditComponent(pageComp)}
                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleRemoveComponent(pageComp.id)}
                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Component Library Modal */}
      {showComponentLibrary && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Component</h2>
              <button onClick={() => setShowComponentLibrary(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {components?.map((component: any) => (
                <div key={component.id} className="border rounded-lg p-4 hover:border-indigo-500 cursor-pointer" onClick={() => handleAddComponent(component.id)}>
                  <h3 className="font-semibold text-gray-900">{component.name}</h3>
                  {component.category && (
                    <span className="inline-block mt-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      {component.category}
                    </span>
                  )}
                  {component.description && (
                    <p className="mt-2 text-sm text-gray-600">{component.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Component Modal */}
      {editingComponent && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit {editingComponent.component.name}</h2>
              <button onClick={() => setEditingComponent(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {(() => {
                const schema = typeof editingComponent.component.schema === 'string'
                  ? JSON.parse(editingComponent.component.schema)
                  : editingComponent.component.schema;
                return schema?.fields?.map((field: any) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>

                  {field.type === 'textarea' ? (
                    <textarea
                      value={editConfig[field.name] || ''}
                      onChange={(e) => setEditConfig({ ...editConfig, [field.name]: e.target.value })}
                      placeholder={field.placeholder}
                      rows={3}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  ) : field.type === 'select' ? (
                    <select
                      value={editConfig[field.name] || ''}
                      onChange={(e) => setEditConfig({ ...editConfig, [field.name]: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="">Select...</option>
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'boolean' ? (
                    <input
                      type="checkbox"
                      checked={editConfig[field.name] || false}
                      onChange={(e) => setEditConfig({ ...editConfig, [field.name]: e.target.checked })}
                      className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  ) : (
                    <input
                      type={field.type === 'number' ? 'number' : field.type === 'url' ? 'url' : 'text'}
                      value={editConfig[field.name] || ''}
                      onChange={(e) => setEditConfig({ ...editConfig, [field.name]: e.target.value })}
                      placeholder={field.placeholder}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  )}
                </div>
              ));
              })()}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setEditingComponent(null)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveConfig}
                  disabled={updateComponentMutation.isPending}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {updateComponentMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

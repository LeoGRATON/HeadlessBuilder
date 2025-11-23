import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ComponentPreview from '../components/ComponentPreview';

export default function PageBuilderPageV2() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingComponent, setEditingComponent] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: page, isLoading: loadingPage } = useQuery({
    queryKey: ['page', id],
    queryFn: async () => {
      const response = await api.get(`/pages/${id}`);
      return response.data;
    },
  });

  const { data: components, isLoading: loadingComponents } = useQuery({
    queryKey: ['components'],
    queryFn: async () => {
      const response = await api.get('/components');
      return response.data;
    },
  });

  const { data: pageComponents, refetch: refetchPageComponents } = useQuery({
    queryKey: ['page-components', id],
    queryFn: async () => {
      const response = await api.get(`/pages/${id}/components`);
      return response.data.sort((a: any, b: any) => a.order - b.order);
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (items: any[]) => {
      await Promise.all(
        items.map((item, index) =>
          api.put(`/pages/${id}/components/${item.id}`, {
            order: index,
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-components', id] });
    },
  });

  const addComponentMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post(`/pages/${id}/components`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-components', id] });
      setShowAddModal(false);
    },
  });

  const updateComponentMutation = useMutation({
    mutationFn: async ({ componentId, data }: { componentId: string; data: any }) => {
      await api.put(`/pages/${id}/components/${componentId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-components', id] });
      setEditingComponent(null);
    },
  });

  const deleteComponentMutation = useMutation({
    mutationFn: async (componentId: string) => {
      await api.delete(`/pages/${id}/components/${componentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-components', id] });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = pageComponents.findIndex((item: any) => item.id === active.id);
      const newIndex = pageComponents.findIndex((item: any) => item.id === over.id);

      const newOrder = arrayMove(pageComponents, oldIndex, newIndex);
      updateOrderMutation.mutate(newOrder);
    }
  };

  if (loadingPage || loadingComponents) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-2 text-gray-600">Loading page builder...</p>
      </div>
    );
  }

  const activeItem = pageComponents?.find((item: any) => item.id === activeId);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/pages')}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{page?.name}</h1>
              <p className="text-sm text-gray-500">Page Builder</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Component
          </button>
        </div>
      </div>

      {/* Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Component List */}
        <div className="w-1/3 border-r border-gray-200 bg-gray-50 overflow-y-auto">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Components ({pageComponents?.length || 0})
            </h2>

            {!pageComponents || pageComponents.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">No components yet</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  Add your first component
                </button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={pageComponents.map((item: any) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {pageComponents.map((pageComponent: any) => (
                      <SortableComponentItem
                        key={pageComponent.id}
                        pageComponent={pageComponent}
                        onEdit={setEditingComponent}
                        onDelete={(id) => {
                          if (confirm('Delete this component?')) {
                            deleteComponentMutation.mutate(id);
                          }
                        }}
                      />
                    ))}
                  </div>
                </SortableContext>

                <DragOverlay>
                  {activeId && activeItem ? (
                    <div className="bg-white border-2 border-indigo-500 rounded-lg p-4 shadow-xl opacity-90">
                      <h4 className="font-semibold text-gray-900">{activeItem.component.name}</h4>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="flex-1 bg-white overflow-y-auto">
          <div className="p-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Live Preview</h2>
                <p className="text-sm text-gray-500">See your page as it will appear</p>
              </div>

              {!pageComponents || pageComponents.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-500">Add components to see preview</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {pageComponents.map((pageComponent: any) => (
                    <ComponentPreview
                      key={pageComponent.id}
                      component={pageComponent.component}
                      config={pageComponent.config}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Component Modal */}
      {showAddModal && (
        <AddComponentModal
          components={components}
          onClose={() => setShowAddModal(false)}
          onAdd={(componentId, config) => {
            const order = pageComponents?.length || 0;
            addComponentMutation.mutate({
              componentId,
              config,
              order,
            });
          }}
        />
      )}

      {/* Edit Component Modal */}
      {editingComponent && (
        <EditComponentModal
          pageComponent={editingComponent}
          onClose={() => setEditingComponent(null)}
          onSave={(config) => {
            updateComponentMutation.mutate({
              componentId: editingComponent.id,
              data: { config },
            });
          }}
        />
      )}
    </div>
  );
}

function SortableComponentItem({
  pageComponent,
  onEdit,
  onDelete,
}: {
  pageComponent: any;
  onEdit: (component: any) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: pageComponent.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </button>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{pageComponent.component.name}</h4>
            <p className="text-xs text-gray-500">Order: {pageComponent.order}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(pageComponent)}
            className="text-indigo-600 hover:text-indigo-900 p-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(pageComponent.id)}
            className="text-red-600 hover:text-red-900 p-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Add Component Modal (simplified - reuse existing logic)
function AddComponentModal({ components, onClose, onAdd }: any) {
  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const [config, setConfig] = useState<any>({});

  const handleAdd = () => {
    if (!selectedComponent) return;
    onAdd(selectedComponent.id, config);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Component</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Component
            </label>
            <select
              value={selectedComponent?.id || ''}
              onChange={(e) => {
                const comp = components.find((c: any) => c.id === e.target.value);
                setSelectedComponent(comp);
                // Initialize config with default values
                const schema = typeof comp.schema === 'string' ? JSON.parse(comp.schema) : comp.schema;
                const defaultConfig: any = {};
                schema.fields?.forEach((field: any) => {
                  if (field.defaultValue !== undefined) {
                    defaultConfig[field.name] = field.defaultValue;
                  }
                });
                setConfig(defaultConfig);
              }}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select a component...</option>
              {components?.map((comp: any) => (
                <option key={comp.id} value={comp.id}>
                  {comp.name} {comp.category && `(${comp.category})`}
                </option>
              ))}
            </select>
          </div>

          {selectedComponent && (
            <ComponentConfigForm
              component={selectedComponent}
              config={config}
              onChange={setConfig}
            />
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!selectedComponent}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            Add Component
          </button>
        </div>
      </div>
    </div>
  );
}

// Edit Component Modal
function EditComponentModal({ pageComponent, onClose, onSave }: any) {
  const [config, setConfig] = useState(pageComponent.config);

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Edit {pageComponent.component.name}
        </h3>

        <ComponentConfigForm
          component={pageComponent.component}
          config={config}
          onChange={setConfig}
        />

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(config)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// Component Config Form
function ComponentConfigForm({ component, config, onChange }: any) {
  if (!component || !component.schema) {
    return <div className="text-gray-500">Component schema not available</div>;
  }

  const schema = typeof component.schema === 'string'
    ? JSON.parse(component.schema)
    : component.schema;

  const handleFieldChange = (fieldName: string, value: any) => {
    onChange({ ...config, [fieldName]: value });
  };

  if (!schema || !schema.fields) {
    return <div className="text-gray-500">No fields defined for this component</div>;
  }

  return (
    <div className="space-y-4">
      {schema.fields?.map((field: any) => (
        <div key={field.name}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {field.helpText && (
            <p className="text-xs text-gray-500 mb-2">{field.helpText}</p>
          )}

          {renderFieldInput(field, config[field.name], (value) =>
            handleFieldChange(field.name, value)
          )}
        </div>
      ))}
    </div>
  );
}

function renderFieldInput(field: any, value: any, onChange: (value: any) => void) {
  switch (field.type) {
    case 'text':
    case 'url':
      return (
        <input
          type={field.type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      );

    case 'textarea':
      return (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      );

    case 'number':
      return (
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value))}
          placeholder={field.placeholder}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      );

    case 'boolean':
      return (
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Enabled</span>
        </label>
      );

    case 'select':
      return (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="">Select...</option>
          {field.choices?.map((choice: any) => (
            <option key={choice.value} value={choice.value}>
              {choice.label}
            </option>
          ))}
        </select>
      );

    case 'image':
      return (
        <input
          type="url"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Image URL"
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      );

    default:
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      );
  }
}

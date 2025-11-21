import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

type FieldType = 'text' | 'textarea' | 'wysiwyg' | 'image' | 'url' | 'number' | 'boolean' | 'select';

interface Field {
  id: string;
  name: string;
  type: FieldType;
  label: string;
  required: boolean;
  defaultValue?: any;
  placeholder?: string;
  helpText?: string;
  options?: { label: string; value: string }[];
}

export default function CreateComponentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<Field[]>([]);
  const [showFieldForm, setShowFieldForm] = useState(false);

  // Field form state
  const [currentField, setCurrentField] = useState<Field>({
    id: crypto.randomUUID(),
    name: '',
    type: 'text',
    label: '',
    required: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/components', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['components'] });
      navigate('/components');
    },
  });

  const handleAddField = () => {
    if (!currentField.name || !currentField.label) {
      alert('Name and label are required');
      return;
    }

    setFields([...fields, currentField]);
    setCurrentField({
      id: crypto.randomUUID(),
      name: '',
      type: 'text',
      label: '',
      required: false,
    });
    setShowFieldForm(false);
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) {
      alert('Component name is required');
      return;
    }

    if (fields.length === 0) {
      alert('At least one field is required');
      return;
    }

    createMutation.mutate({
      name,
      category: category || undefined,
      description: description || undefined,
      schema: {
        fields: fields.map(({ id, ...field }) => field),
      },
    });
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <button
          onClick={() => navigate('/components')}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
        >
          <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Components
        </button>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Component</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Component Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Hero Section"
                required
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <input
                type="text"
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Hero, Card, CTA, etc."
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Describe what this component does..."
              />
            </div>
          </div>
        </div>

        {/* Fields */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Fields</h2>
            <button
              type="button"
              onClick={() => setShowFieldForm(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Field
            </button>
          </div>

          {/* Fields List */}
          {fields.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No fields yet. Click "Add Field" to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((field) => (
                <div key={field.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-900">{field.label}</span>
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                        {field.type}
                      </span>
                      {field.required && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">
                          Required
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      Name: <code className="bg-gray-100 px-1 rounded">{field.name}</code>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveField(field.id)}
                    className="ml-4 text-red-600 hover:text-red-800"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Field Form */}
          {showFieldForm && (
            <div className="mt-4 p-4 border-2 border-indigo-200 rounded-md bg-indigo-50">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">New Field</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Field Name *</label>
                  <input
                    type="text"
                    value={currentField.name}
                    onChange={(e) => setCurrentField({ ...currentField, name: e.target.value })}
                    placeholder="title"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Label *</label>
                  <input
                    type="text"
                    value={currentField.label}
                    onChange={(e) => setCurrentField({ ...currentField, label: e.target.value })}
                    placeholder="Title"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={currentField.type}
                    onChange={(e) => setCurrentField({ ...currentField, type: e.target.value as FieldType })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="text">Text</option>
                    <option value="textarea">Textarea</option>
                    <option value="wysiwyg">WYSIWYG</option>
                    <option value="image">Image</option>
                    <option value="url">URL</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="select">Select</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Placeholder</label>
                  <input
                    type="text"
                    value={currentField.placeholder || ''}
                    onChange={(e) => setCurrentField({ ...currentField, placeholder: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div className="col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={currentField.required}
                      onChange={(e) => setCurrentField({ ...currentField, required: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Required field</span>
                  </label>
                </div>
              </div>

              <div className="mt-4 flex space-x-2">
                <button
                  type="button"
                  onClick={handleAddField}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Add Field
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFieldForm(false);
                    setCurrentField({
                      id: crypto.randomUUID(),
                      name: '',
                      type: 'text',
                      label: '',
                      required: false,
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/components')}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Component'}
          </button>
        </div>

        {createMutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Failed to create component</p>
          </div>
        )}
      </form>
    </div>
  );
}

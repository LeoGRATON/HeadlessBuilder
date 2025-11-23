import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export default function CreatePagePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/pages', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      navigate(`/pages/${data.id}/builder`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !projectId) {
      alert('Name and project are required');
      return;
    }

    createMutation.mutate({
      name,
      projectId,
      title: title || undefined,
      description: description || undefined,
    });
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <button
          onClick={() => navigate('/pages')}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
        >
          <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Pages
        </button>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Page</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <label htmlFor="project" className="block text-sm font-medium text-gray-700">
              Project *
            </label>
            <select
              id="project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Select a project</option>
              {projects?.map((project: any) => (
                <option key={project.id} value={project.id}>
                  {project.client.name} - {project.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Select which project this page belongs to
            </p>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Page Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Homepage"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            <p className="mt-1 text-sm text-gray-500">
              Will be used to generate the URL slug
            </p>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Page Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Welcome to our website"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            <p className="mt-1 text-sm text-gray-500">
              SEO title for the page (optional)
            </p>
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
              placeholder="Page description for SEO..."
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/pages')}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Page'}
            </button>
          </div>

          {createMutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">Failed to create page</p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

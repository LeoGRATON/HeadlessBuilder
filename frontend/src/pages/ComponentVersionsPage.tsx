import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export default function ComponentVersionsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: component, isLoading: loadingComponent } = useQuery({
    queryKey: ['component', id],
    queryFn: async () => {
      const response = await api.get(`/components/${id}`);
      return response.data;
    },
  });

  const { data: versions, isLoading: loadingVersions } = useQuery({
    queryKey: ['component-versions', id],
    queryFn: async () => {
      const response = await api.get(`/components/${id}/versions`);
      return response.data.data;
    },
  });

  const createVersionMutation = useMutation({
    mutationFn: async (data: { version: string; changelog: string }) => {
      await api.post(`/components/${id}/versions`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['component-versions', id] });
      setShowCreateModal(false);
    },
  });

  const restoreVersionMutation = useMutation({
    mutationFn: async ({ versionId, createBackup }: { versionId: string; createBackup: boolean }) => {
      await api.post(`/components/${id}/versions/${versionId}/restore`, {
        createNewVersion: createBackup,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['component', id] });
      queryClient.invalidateQueries({ queryKey: ['component-versions', id] });
      alert('Version restored successfully!');
    },
  });

  if (loadingComponent || loadingVersions) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-2 text-gray-600">Loading versions...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Version History</h1>
            <p className="text-gray-600">{component?.name} - v{component?.currentVersion}</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Version
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flow-root">
          <ul className="-mb-8">
            {versions?.map((version: any, index: number) => (
              <li key={version.id}>
                <div className="relative pb-8">
                  {index !== versions.length - 1 && (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                        version.version === component?.currentVersion
                          ? 'bg-indigo-600'
                          : 'bg-gray-400'
                      }`}>
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">
                            Version {version.version}
                          </p>
                          {version.version === component?.currentVersion && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{version.changelog || 'No changelog'}</p>
                        <div className="mt-2 text-sm text-gray-500">
                          <p>{version.name}</p>
                          {version.description && <p className="text-xs">{version.description}</p>}
                        </div>
                      </div>
                      <div className="text-right whitespace-nowrap text-sm text-gray-500">
                        <p>{new Date(version.createdAt).toLocaleDateString()}</p>
                        <p className="text-xs">{new Date(version.createdAt).toLocaleTimeString()}</p>
                        {version.version !== component?.currentVersion && (
                          <button
                            onClick={() => {
                              if (confirm('Restore this version? This will replace the current component configuration.')) {
                                restoreVersionMutation.mutate({
                                  versionId: version.id,
                                  createBackup: true,
                                });
                              }
                            }}
                            className="mt-2 text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Create Version Modal */}
      {showCreateModal && (
        <CreateVersionModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(data) => createVersionMutation.mutate(data)}
          currentVersion={component?.currentVersion}
        />
      )}
    </div>
  );
}

function CreateVersionModal({
  onClose,
  onCreate,
  currentVersion,
}: {
  onClose: () => void;
  onCreate: (data: { version: string; changelog: string }) => void;
  currentVersion: string;
}) {
  const [version, setVersion] = useState('');
  const [changelog, setChangelog] = useState('');

  const suggestNextVersion = (type: 'major' | 'minor' | 'patch') => {
    const parts = currentVersion.split('.').map(Number);
    switch (type) {
      case 'major':
        parts[0]++;
        parts[1] = 0;
        parts[2] = 0;
        break;
      case 'minor':
        parts[1]++;
        parts[2] = 0;
        break;
      case 'patch':
        parts[2]++;
        break;
    }
    setVersion(parts.join('.'));
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Version</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Version Number
          </label>
          <input
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="e.g., 1.1.0"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => suggestNextVersion('patch')}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
            >
              Patch
            </button>
            <button
              type="button"
              onClick={() => suggestNextVersion('minor')}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
            >
              Minor
            </button>
            <button
              type="button"
              onClick={() => suggestNextVersion('major')}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
            >
              Major
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Changelog
          </label>
          <textarea
            value={changelog}
            onChange={(e) => setChangelog(e.target.value)}
            rows={4}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="What changed in this version?"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onCreate({ version, changelog })}
            disabled={!version}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            Create Version
          </button>
        </div>
      </div>
    </div>
  );
}

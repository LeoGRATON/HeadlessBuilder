import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export default function ProjectExportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState<string | null>(null);

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await api.get(`/projects/${id}`);
      return response.data;
    },
  });

  const { data: exportData, isLoading: isLoadingExport } = useQuery({
    queryKey: ['export', id],
    queryFn: async () => {
      const response = await api.get(`/export/projects/${id}/complete`);
      return response.data.data;
    },
    enabled: !!id,
  });

  const handleDownloadACF = async () => {
    try {
      setDownloading('acf');
      const response = await api.get(`/export/projects/${id}/acf`);

      const blob = new Blob([JSON.stringify(response.data.data, null, 2)], {
        type: 'application/json',
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.slug}-acf-fields.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading ACF:', error);
      alert('Failed to download ACF export');
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadGraphQL = async () => {
    try {
      setDownloading('graphql');
      const response = await api.get(`/export/projects/${id}/graphql`);

      const blob = new Blob([response.data], {
        type: 'text/plain',
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.slug}-schema.graphql`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading GraphQL:', error);
      alert('Failed to download GraphQL schema');
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadComplete = async () => {
    try {
      setDownloading('complete');
      const response = await api.get(`/export/projects/${id}/complete`);

      const blob = new Blob([JSON.stringify(response.data.data, null, 2)], {
        type: 'application/json',
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.slug}-complete-export.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading complete export:', error);
      alert('Failed to download complete export');
    } finally {
      setDownloading(null);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${label} copied to clipboard!`);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (isLoading || isLoadingExport) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-2 text-gray-600">Loading export data...</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/projects')}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center mb-2"
        >
          <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Projects
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Export: {project?.name}</h1>
        <p className="text-gray-600">{project?.client?.name}</p>
      </div>

      {/* Export Summary */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Export Summary</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-indigo-600">{exportData?.pages?.length || 0}</div>
            <div className="text-sm text-gray-600">Pages</div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-indigo-600">{exportData?.acf?.fieldGroups?.length || 0}</div>
            <div className="text-sm text-gray-600">ACF Field Groups</div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600">Exported at</div>
            <div className="text-xs text-gray-500">
              {exportData?.exportedAt ? new Date(exportData.exportedAt).toLocaleString() : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Download Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* ACF Export */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <svg className="h-8 w-8 text-indigo-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">ACF Fields</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Download ACF field groups in JSON format for WordPress import.
          </p>
          <button
            onClick={handleDownloadACF}
            disabled={downloading === 'acf'}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {downloading === 'acf' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Downloading...
              </>
            ) : (
              <>
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download ACF JSON
              </>
            )}
          </button>
        </div>

        {/* GraphQL Export */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <svg className="h-8 w-8 text-pink-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">GraphQL Schema</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Download GraphQL schema for WPGraphQL integration.
          </p>
          <button
            onClick={handleDownloadGraphQL}
            disabled={downloading === 'graphql'}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 disabled:opacity-50"
          >
            {downloading === 'graphql' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Downloading...
              </>
            ) : (
              <>
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Schema
              </>
            )}
          </button>
        </div>

        {/* Complete Export */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <svg className="h-8 w-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">Complete Export</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Download all data including ACF, GraphQL, and metadata.
          </p>
          <button
            onClick={handleDownloadComplete}
            disabled={downloading === 'complete'}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {downloading === 'complete' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Downloading...
              </>
            ) : (
              <>
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Complete
              </>
            )}
          </button>
        </div>
      </div>

      {/* WordPress Setup Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
          <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          WordPress Setup Instructions
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li>Install and activate <strong>Advanced Custom Fields Pro</strong></li>
          <li>Install and activate <strong>WPGraphQL</strong> (recommended)</li>
          <li>Copy the plugin from <code className="bg-blue-100 px-1 rounded">wordpress-plugin/</code> to <code className="bg-blue-100 px-1 rounded">/wp-content/plugins/</code></li>
          <li>Activate the <strong>Headless Builder Sync</strong> plugin</li>
          <li>Go to <strong>Headless Builder</strong> menu in WordPress admin</li>
          <li>Configure: Builder URL, Project ID, and your JWT token</li>
          <li>Click <strong>Sync Now</strong> to import field groups</li>
        </ol>
      </div>

      {/* Configuration Info */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">WordPress Plugin Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Builder URL</label>
            <div className="flex items-center">
              <input
                type="text"
                value={window.location.origin.replace(':5173', ':3001')}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
              />
              <button
                onClick={() => copyToClipboard(window.location.origin.replace(':5173', ':3001'), 'Builder URL')}
                className="ml-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Copy
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project ID</label>
            <div className="flex items-center">
              <input
                type="text"
                value={id || ''}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
              />
              <button
                onClick={() => copyToClipboard(id || '', 'Project ID')}
                className="ml-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Copy
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Token</label>
            <p className="text-sm text-gray-600">
              Use your JWT token from localStorage. Check the browser console or login again to get a fresh token.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

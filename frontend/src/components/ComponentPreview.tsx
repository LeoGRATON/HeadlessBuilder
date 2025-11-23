interface ComponentPreviewProps {
  component: any;
  config: any;
}

export default function ComponentPreview({ component, config }: ComponentPreviewProps) {
  const schema = typeof component.schema === 'string'
    ? JSON.parse(component.schema)
    : component.schema;

  // Render a preview based on component type and config
  return (
    <div className="border-2 border-indigo-200 rounded-lg p-6 bg-white shadow-sm">
      <div className="mb-4 pb-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{component.name}</h3>
        {component.category && (
          <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded">
            {component.category}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {schema.fields?.map((field: any) => {
          const value = config[field.name];

          return (
            <div key={field.name} className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {renderFieldPreview(field, value)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function renderFieldPreview(field: any, value: any) {
  switch (field.type) {
    case 'text':
    case 'url':
      return (
        <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded border border-gray-200">
          {value || <span className="text-gray-400 italic">No value</span>}
        </div>
      );

    case 'textarea':
      return (
        <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded border border-gray-200 whitespace-pre-wrap">
          {value || <span className="text-gray-400 italic">No value</span>}
        </div>
      );

    case 'wysiwyg':
      return (
        <div
          className="text-sm text-gray-900 p-3 bg-gray-50 rounded border border-gray-200 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: value || '<span class="text-gray-400 italic">No content</span>' }}
        />
      );

    case 'image':
      return value ? (
        <div className="relative w-full h-48 bg-gray-100 rounded border border-gray-200 overflow-hidden">
          <img
            src={value}
            alt={field.label}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-48 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
          <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      );

    case 'number':
      return (
        <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded border border-gray-200 font-mono">
          {value !== undefined && value !== null ? value : <span className="text-gray-400 italic">No value</span>}
        </div>
      );

    case 'boolean':
      return (
        <div className="flex items-center p-3 bg-gray-50 rounded border border-gray-200">
          <div className={`w-5 h-5 rounded flex items-center justify-center ${
            value ? 'bg-green-500' : 'bg-gray-300'
          }`}>
            {value && (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <span className="ml-2 text-sm text-gray-900">
            {value ? 'Yes' : 'No'}
          </span>
        </div>
      );

    case 'select':
      const selectedChoice = field.choices?.find((c: any) => c.value === value);
      return (
        <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded border border-gray-200">
          {selectedChoice?.label || value || <span className="text-gray-400 italic">No selection</span>}
        </div>
      );

    default:
      return (
        <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded border border-gray-200">
          {JSON.stringify(value) || <span className="text-gray-400 italic">No value</span>}
        </div>
      );
  }
}

interface FieldValueProps {
  field: string;
  value: unknown;
}

export const FieldValue = ({ field, value }: FieldValueProps) => {
  // string
  if (typeof value === 'string') {
    return (
      <div className="text-sm">
        <span className="font-medium text-gray-700">{field}:</span>
        <span className="ml-2 text-gray-900">{value}</span>
      </div>
    );
  }

  // number
  if (typeof value === 'number') {
    return (
      <div className="text-sm">
        <span className="font-medium text-gray-700">{field}:</span>
        <span className="ml-2 text-gray-900">{value}</span>
      </div>
    );
  }

  // boolean
  if (typeof value === 'boolean') {
    return (
      <div className="text-sm">
        <span className="font-medium text-gray-700">{field}:</span>
        <span className="ml-2 text-gray-900">{value ? 'Yes' : 'No'}</span>
      </div>
    );
  }

  // array - display as badges
  if (Array.isArray(value)) {
    return (
      <div className="text-sm">
        <div className="font-medium text-gray-700 mb-1">{field}:</div>
        <div className="flex flex-wrap gap-1">
          {value.map((item, i) => (
            <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-700">
              {String(item)}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // object - display as JSON
  if (typeof value === 'object' && value !== null) {
    return (
      <div className="text-sm">
        <div className="font-medium text-gray-700 mb-1">{field}:</div>
        <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto text-gray-700">
          {JSON.stringify(value, null, 2)}
        </pre>
      </div>
    );
  }

  // null/undefined
  return (
    <div className="text-sm">
      <span className="font-medium text-gray-700">{field}:</span>
      <span className="ml-2 text-gray-400">-</span>
    </div>
  );
};

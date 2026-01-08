interface FieldValueProps {
  field: string; // Still passed for consistency, but not displayed
  value: unknown;
  reasoning?: string;
}

// Reasoning 표시 컴포넌트
const ReasoningText = ({ reasoning }: { reasoning?: string }) =>
  reasoning ? (
    <div className="mt-1 text-xs text-gray-400">{reasoning}</div>
  ) : null;

export const FieldValue = ({ value, reasoning }: FieldValueProps) => {
  // string
  if (typeof value === 'string') {
    return (
      <div>
        <span className="text-gray-900">{value}</span>
        <ReasoningText reasoning={reasoning} />
      </div>
    );
  }

  // number
  if (typeof value === 'number') {
    return (
      <div>
        <span className="text-gray-900">{value}</span>
        <ReasoningText reasoning={reasoning} />
      </div>
    );
  }

  // boolean
  if (typeof value === 'boolean') {
    return (
      <div>
        <span className="text-gray-900">{value ? 'Yes' : 'No'}</span>
        <ReasoningText reasoning={reasoning} />
      </div>
    );
  }

  // array - display as badges or JSON for complex items
  if (Array.isArray(value)) {
    const hasObjectItems = value.some(item => typeof item === 'object' && item !== null);

    // 객체 배열 (condition_contributes 등) → JSON 표시
    if (hasObjectItems) {
      return (
        <div>
          <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto text-gray-700">
            {JSON.stringify(value, null, 2)}
          </pre>
          <ReasoningText reasoning={reasoning} />
        </div>
      );
    }

    // 단순 배열 (문자열/숫자) → 뱃지 표시
    return (
      <div>
        <div className="flex flex-wrap gap-1">
          {value.map((item, i) => (
            <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-700">
              {String(item)}
            </span>
          ))}
        </div>
        <ReasoningText reasoning={reasoning} />
      </div>
    );
  }

  // object - display as JSON
  if (typeof value === 'object' && value !== null) {
    return (
      <div>
        <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto text-gray-700">
          {JSON.stringify(value, null, 2)}
        </pre>
        <ReasoningText reasoning={reasoning} />
      </div>
    );
  }

  // null/undefined
  return (
    <div>
      <span className="text-gray-400">-</span>
      <ReasoningText reasoning={reasoning} />
    </div>
  );
};

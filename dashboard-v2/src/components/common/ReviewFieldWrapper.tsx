import { ReactNode } from 'react';

/**
 * ReviewFieldWrapper
 *
 * Pending Review 페이지의 review mode에서 suggested 필드를 시각적으로 강조하는 래퍼 컴포넌트.
 *
 * Features:
 * - isSuggested=true: 왼쪽 amber 보더, 배경 tint, 별 아이콘 (★)
 * - reasoning: 필드 아래에 제안 근거 표시 (plain text)
 * - 기존 필드 레이아웃 유지 (border/background는 wrapping div에만 적용)
 */

interface ReviewFieldWrapperProps {
  /** 제안된 필드인지 여부 */
  isSuggested: boolean;
  /** 제안 근거 (plain text, XSS safe) */
  reasoning?: string;
  /** 래핑할 필드 컴포넌트 */
  children: ReactNode;
}

export const ReviewFieldWrapper = ({
  isSuggested,
  reasoning,
  children,
}: ReviewFieldWrapperProps) => {
  if (!isSuggested) {
    // Non-suggested field: 스타일 없이 그대로 렌더
    return <>{children}</>;
  }

  return (
    <div className="border-l-3 border-amber-400 bg-amber-50/30 pl-3 -ml-3 pr-3 py-2 rounded-r">
      {/* Star icon + field */}
      <div className="flex items-start gap-1.5">
        <span className="text-amber-500 text-sm mt-2 flex-shrink-0" aria-label="Suggested field">
          ★
        </span>
        <div className="flex-1 min-w-0">{children}</div>
      </div>

      {/* Reasoning (plain text) */}
      {reasoning && (
        <p className="text-xs text-gray-600 italic mt-1.5 ml-5 leading-relaxed">
          {reasoning}
        </p>
      )}
    </div>
  );
};

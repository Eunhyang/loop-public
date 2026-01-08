import { useState, useCallback, useMemo } from 'react';

/**
 * Review Mode Hook
 *
 * Pending Review 페이지에서 EntityForm을 review mode로 사용할 때
 * suggested_fields 값 관리 및 변경 추적을 담당합니다.
 *
 * 핵심 동작:
 * 1. suggested_fields에 있는 필드 → suggested 값으로 초기화
 * 2. 나머지 필드 → 원본 Entity 값 사용
 * 3. 사용자 수정 추적 → approve 시 modified_fields만 전달
 */

export interface UseReviewModeParams {
  /** 실제 Entity 데이터 (API에서 로드) */
  entityData: Record<string, unknown> | null | undefined;
  /** 제안된 필드 값 (pending review에서 전달) */
  suggestedFields?: Record<string, unknown>;
  /** 필드별 reasoning */
  reasoning?: Record<string, string>;
}

export interface UseReviewModeReturn {
  /**
   * 필드 값 조회
   * - selectedValues에 있으면 사용자 수정값
   * - 없으면 suggested 값 (있을 경우)
   * - 둘 다 없으면 원본 Entity 값
   */
  getFieldValue: (field: string) => unknown;

  /** 해당 필드가 suggested인지 */
  isSuggested: (field: string) => boolean;

  /** 해당 필드의 reasoning */
  getReasoning: (field: string) => string | undefined;

  /** 현재 선택된 값 (사용자 수정 포함) */
  selectedValues: Record<string, unknown>;

  /** 값 변경 */
  setFieldValue: (field: string, value: unknown) => void;

  /**
   * 변경된 필드만 추출 (approve 시 API 전달용)
   * suggested 값과 다른 값만 반환
   */
  getModifiedFields: () => Record<string, unknown>;

  /** 초기 suggested 값으로 리셋 */
  resetToSuggested: () => void;
}

export function useReviewMode({
  entityData,
  suggestedFields,
  reasoning,
}: UseReviewModeParams): UseReviewModeReturn {
  // 사용자가 수정한 값 (suggested와 다른 경우만 저장)
  const [selectedValues, setSelectedValues] = useState<Record<string, unknown>>(() => {
    // 초기값: suggested_fields 값으로 시작
    return { ...suggestedFields };
  });

  // suggested 필드 목록 (Set으로 O(1) lookup)
  const suggestedFieldSet = useMemo(
    () => new Set(Object.keys(suggestedFields || {})),
    [suggestedFields]
  );

  /**
   * 필드 값 조회
   * 우선순위: selectedValues > suggestedFields > entityData
   */
  const getFieldValue = useCallback(
    (field: string): unknown => {
      // 1. 사용자가 수정한 값이 있으면 우선
      if (field in selectedValues) {
        return selectedValues[field];
      }
      // 2. suggested 값이 있으면 사용 (초기 상태)
      if (suggestedFields && field in suggestedFields) {
        return suggestedFields[field];
      }
      // 3. 원본 Entity 값
      return entityData?.[field];
    },
    [selectedValues, suggestedFields, entityData]
  );

  /** 해당 필드가 suggested인지 */
  const isSuggested = useCallback(
    (field: string): boolean => {
      return suggestedFieldSet.has(field);
    },
    [suggestedFieldSet]
  );

  /** 해당 필드의 reasoning */
  const getReasoning = useCallback(
    (field: string): string | undefined => {
      return reasoning?.[field];
    },
    [reasoning]
  );

  /** 값 변경 */
  const setFieldValue = useCallback((field: string, value: unknown) => {
    setSelectedValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  /**
   * 변경된 필드만 추출
   * suggested 값과 현재 선택된 값이 다른 경우만 반환
   */
  const getModifiedFields = useCallback((): Record<string, unknown> => {
    if (!suggestedFields) return {};

    const modified: Record<string, unknown> = {};

    for (const [field, suggestedValue] of Object.entries(suggestedFields)) {
      const currentValue = selectedValues[field];

      // 값이 selectedValues에 없으면 변경 없음 (suggested 그대로 사용)
      if (!(field in selectedValues)) continue;

      // 깊은 비교 (배열, 객체 처리)
      if (!deepEqual(currentValue, suggestedValue)) {
        modified[field] = currentValue;
      }
    }

    return modified;
  }, [suggestedFields, selectedValues]);

  /** 초기 suggested 값으로 리셋 */
  const resetToSuggested = useCallback(() => {
    setSelectedValues({ ...suggestedFields });
  }, [suggestedFields]);

  return {
    getFieldValue,
    isSuggested,
    getReasoning,
    selectedValues,
    setFieldValue,
    getModifiedFields,
    resetToSuggested,
  };
}

/**
 * 깊은 비교 유틸리티
 * 배열과 객체를 재귀적으로 비교
 */
function deepEqual(a: unknown, b: unknown): boolean {
  // 동일 참조 또는 primitive 비교
  if (a === b) return true;

  // null/undefined 체크
  if (a == null || b == null) return a === b;

  // 타입이 다르면 false
  if (typeof a !== typeof b) return false;

  // 배열 비교
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    // 순서 무관 비교를 위해 정렬 후 비교
    const sortedA = [...a].map(String).sort();
    const sortedB = [...b].map(String).sort();
    return sortedA.every((v, i) => v === sortedB[i]);
  }

  // 객체 비교
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a as object);
    const keysB = Object.keys(b as object);

    if (keysA.length !== keysB.length) return false;

    return keysA.every((key) =>
      deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    );
  }

  // String 비교 (숫자 vs 문자열 ID 처리)
  return String(a) === String(b);
}

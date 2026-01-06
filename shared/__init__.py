"""
LOOP Shared Module

보안 무관 공통 코드를 관리합니다.
- auth/: 인증 미들웨어, OAuth 검증, 스코프 체크
- utils/: vault 유틸리티, YAML 파서
- models/: 공통 Pydantic 모델

exec/api에서 사용 시:
    import sys
    from pathlib import Path
    PUBLIC_PATH = Path(__file__).parent.parent.parent / "public"
    sys.path.insert(0, str(PUBLIC_PATH))

    from shared.auth.middleware import AuthMiddleware
"""

__version__ = "1.0.0"

FROM python:3.11-slim

WORKDIR /app

# 시스템 의존성
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 설치
COPY pyproject.toml ./
RUN pip install --no-cache-dir \
    pyyaml \
    fastapi \
    uvicorn \
    python-multipart \
    fastapi-mcp \
    # OAuth dependencies
    bcrypt \
    python-jose[cryptography] \
    jinja2 \
    sqlalchemy \
    # LLM dependencies
    openai \
    anthropic

# API 코드 및 설정 파일 복사
COPY api/ ./api/
COPY impact_model_config.yml ./

# 포트 노출
EXPOSE 8081

# 서버 실행
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8081"]

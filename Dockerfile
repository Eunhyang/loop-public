# ============================================
# Stage 1: Build React Dashboard (dashboard-v2)
# ============================================
FROM node:20-slim AS frontend

WORKDIR /frontend
COPY dashboard-v2/package*.json ./
RUN npm ci
COPY dashboard-v2/ ./
RUN npm run build

# ============================================
# Stage 2: Python API + Built Frontend
# ============================================
FROM python:3.11-slim

WORKDIR /app

# 시스템 의존성 (gcc + LibreOffice for text extraction)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libreoffice-writer \
    libreoffice-calc \
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
    anthropic \
    # Text extraction (tsk-dashboard-ux-v1-21)
    pdfplumber \
    # HTML/XML parsing (link preview)
    beautifulsoup4 \
    lxml

# API 코드 및 설정 파일 복사
COPY api/ ./api/
COPY shared/ ./shared/
COPY impact_model_config.yml ./

# Dashboard v2 빌드 결과물 복사 (Stage 1에서)
COPY --from=frontend /frontend/dist ./dashboard-v2-dist/

# 포트 노출
EXPOSE 8081

# 서버 실행
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8081", "--limit-max-requests", "104857600"]

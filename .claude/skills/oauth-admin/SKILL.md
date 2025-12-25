# OAuth Admin Skill

OAuth 사용자 및 클라이언트를 관리하는 skill입니다.
Docker 컨테이너 내에서 실행되거나 로컬에서 직접 실행할 수 있습니다.

## 사용 시기

다음 상황에서 이 skill을 사용하세요:
- 새 OAuth 사용자 생성
- 사용자 목록 확인
- OAuth 클라이언트 생성/조회
- OAuth 통계 확인
- 만료된 세션/코드 정리

## 명령어

### 사용자 관리

**사용자 생성** (비밀번호 프롬프트):
```bash
cd /Volumes/LOOP_CORE/vault/LOOP && python -m api.oauth.cli create-user --email <이메일>
```

**사용자 생성** (비밀번호 직접 지정):
```bash
cd /Volumes/LOOP_CORE/vault/LOOP && python -m api.oauth.cli create-user --email <이메일> --password '<비밀번호>'
```

**사용자 목록**:
```bash
cd /Volumes/LOOP_CORE/vault/LOOP && python -m api.oauth.cli list-users
```

### 클라이언트 관리

**클라이언트 생성**:
```bash
cd /Volumes/LOOP_CORE/vault/LOOP && python -m api.oauth.cli create-client --name "ChatGPT MCP" --redirect-uri "https://chatgpt.com/aip/..."
```

**클라이언트 목록**:
```bash
cd /Volumes/LOOP_CORE/vault/LOOP && python -m api.oauth.cli list-clients
```

### 유틸리티

**통계 확인**:
```bash
cd /Volumes/LOOP_CORE/vault/LOOP && python -m api.oauth.cli stats
```

**만료 세션/코드 정리**:
```bash
cd /Volumes/LOOP_CORE/vault/LOOP && python -m api.oauth.cli cleanup
```

## Docker 컨테이너에서 실행

NAS Docker 컨테이너 내에서 직접 실행하려면:

```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker exec loop-api python -m api.oauth.cli <명령어>'
```

예시:
```bash
# 사용자 목록 (Docker)
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker exec loop-api python -m api.oauth.cli list-users'

# 사용자 생성 (Docker)
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker exec loop-api python -m api.oauth.cli create-user --email admin@sosilab.com --password "secure123"'
```

## 보안 참고사항

- 비밀번호는 bcrypt로 해시됨 (12 rounds)
- 클라이언트 시크릿은 생성 시 한 번만 표시됨 (복구 불가)
- redirect_uri는 허용 목록에 있는 도메인만 가능:
  - `https://chatgpt.com/`
  - `https://chat.openai.com/`
  - `https://platform.openai.com/`

## 관련 파일

| 파일 | 설명 |
|------|------|
| `api/oauth/cli.py` | CLI 스크립트 본체 |
| `api/oauth/models.py` | SQLAlchemy 모델 |
| `api/oauth/security.py` | 보안 유틸리티 |
| `api/oauth/oauth.db` | SQLite 데이터베이스 |

# LOOP Vault Setup Guide

> 🎯 팀원을 위한 초기 설정 가이드

이 문서는 LOOP Obsidian vault를 처음 받은 팀원이 로컬 환경을 세팅하는 방법을 안내합니다.

---

## 📋 목차

1. [환영합니다](#환영합니다)
2. [필수 요구사항](#필수-요구사항)
3. [첫 설치](#첫-설치)
4. [Obsidian 플러그인 설정](#obsidian-플러그인-설정)
5. [Claude Code 사용법](#claude-code-사용법)
6. [첫 기여하기](#첫-기여하기)
7. [일일 워크플로우](#일일-워크플로우)
8. [문제 해결](#문제-해결)
9. [추가 리소스](#추가-리소스)

---

## 환영합니다

**LOOP Vault**는 Inner Loop OS (ILOS)의 전략-온톨로지 통합 지식 시스템입니다.

### 이 Vault가 다루는 것
- 📍 **10년 비전**: Human Inner Loop OS 글로벌 표준
- 🎯 **전략 가설**: Meta Hypotheses, Conditions, Tracks
- 🔷 **온톨로지**: 데이터 모델 (Event, Episode, ActionExecution 등)
- 🚀 **프로젝트**: Track별 실행 단위
- 🧪 **가설 검증**: 실험 로그

### 협업 방식
- **Obsidian**: 마크다운 기반 지식 관리
- **Claude Code**: AI 기반 문서 작성/검증
- **Git**: 버전 관리 및 협업
- **Python Scripts**: 자동 검증 및 그래프 생성

---

## 필수 요구사항

시작하기 전에 다음을 준비해주세요:

```
✅ Obsidian (최신 버전)
✅ Git
✅ Python 3.7+
✅ Claude Code CLI (선택, 하지만 강력 권장)
```

### 버전 확인
```bash
git --version
python3 --version
# Python 3.7 이상이어야 함
```

---

## 첫 설치

### Step 1: Repository Clone

```bash
# Repository clone
git clone [repository-url]
cd LOOP

# 현재 브랜치 확인
git branch
# * main
```

### Step 2: Obsidian 설치 및 Vault 열기

1. **Obsidian 다운로드**
   - 공식 사이트: https-//obsidian.md
   - 무료 버전으로 충분합니다

2. **Vault 열기**
   - Obsidian 실행
   - "Open folder as vault" 클릭
   - Clone한 `LOOP` 폴더 선택

3. **플러그인 활성화**
   - "Trust author and enable plugins" 클릭
   - Community plugins 활성화 허용

### Step 3: Python 환경 설정

```bash
# PyYAML 설치 (필수)
pip install pyyaml

# 또는 pip3 사용
pip3 install pyyaml

# 설치 확인
python3 -c "import yaml; print('✓ PyYAML installed successfully')"
```

**출력 예시**:
```
✓ PyYAML installed successfully
```

### Step 4: Git Pre-commit Hook 설정

Pre-commit hook은 commit 전에 자동으로 검증을 실행합니다.

```bash
# Hook 파일 생성
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
set -e

VAULT_DIR="."
SCRIPTS_DIR="$VAULT_DIR/scripts"

echo "=== LOOP Vault Pre-commit Hook ==="

# 1. 스키마 검증
echo "[1/3] Validating schema..."
python3 "$SCRIPTS_DIR/validate_schema.py" "$VAULT_DIR" || exit 1

# 2. 고아 엔티티 검사
echo "[2/3] Checking orphans..."
python3 "$SCRIPTS_DIR/check_orphans.py" "$VAULT_DIR"

# 3. 그래프 인덱스 재생성
echo "[3/3] Building graph index..."
python3 "$SCRIPTS_DIR/build_graph_index.py" "$VAULT_DIR" || exit 1

# 변경된 인덱스 자동 stage
git add _Graph_Index.md

echo "✓ Pre-commit checks passed!"
EOF

# 실행 권한 부여
chmod +x .git/hooks/pre-commit

# 확인
ls -l .git/hooks/pre-commit
```

### Step 5: 첫 검증 실행

모든 스크립트가 정상 동작하는지 확인합니다.

```bash
# 스키마 검증
python3 scripts/validate_schema.py .

# 고아 엔티티 검사
python3 scripts/check_orphans.py .

# 그래프 인덱스 생성
python3 scripts/build_graph_index.py .

# 대시보드 생성 (선택)
python3 scripts/build_dashboard.py .
```

**정상 출력 예시**:
```
=== Schema Validation Report ===
Files checked: 10
Files with errors: 0

All files passed validation!
```

---

## Obsidian 플러그인 설정

### Community Plugins (이미 설치됨)

다음 플러그인들이 이미 설정되어 있습니다:

1. **Dataview**: 데이터 쿼리 및 테이블 생성
2. **Obsidian Git**: Git 통합 (선택적 사용)
3. **Excalidraw**: 다이어그램 그리기

### 플러그인 확인 방법

1. Settings (⚙️) → Community plugins
2. "Restricted mode" OFF 확인
3. Installed plugins에서 위 3개 확인

### Core Plugins (권장 활성화)

Settings → Core plugins에서 다음을 활성화:
- ✅ Graph view
- ✅ Backlinks
- ✅ Templates
- ✅ Properties
- ✅ Daily notes (선택)

---

## Claude Code 사용법

Claude Code는 이 vault와 함께 사용하도록 최적화되어 있습니다.

### 설치 (선택, 하지만 강력 권장)

```bash
# Claude Code CLI 설치
npm install -g @anthropic-ai/claude-code

# 또는 다른 설치 방법은 공식 문서 참고
```

### 기본 사용

```bash
# LOOP 디렉토리에서 실행
cd /path/to/LOOP
claude-code

# 또는
claude
```

### 주요 작업 예시

Claude Code를 실행한 후:

```
📝 새 전략 가설 문서 만들어줘
→ 템플릿 기반으로 문서 생성 + frontmatter 자동 작성

✓ 스키마 검증해줘
→ validate_schema.py 실행

🔗 그래프 인덱스 재생성해줘
→ build_graph_index.py 실행

📊 MH3 관련 문서 찾아줘
→ grep/glob으로 검색 후 연결 분석
```

### CLAUDE.md 참고

Claude Code 전용 가이드는 `CLAUDE.md`에 상세히 작성되어 있습니다.

---

## 첫 기여하기

### 브랜치 전략

```bash
# Feature 브랜치 생성
git checkout -b feature/my-first-contribution

# 또는 수정 작업
git checkout -b fix/update-hypothesis
```

### 새 문서 생성 (템플릿 사용)

```bash
# 1. 템플릿 복사
cp 00_Meta/_TEMPLATES/template_hypothesis.md \
   60_Hypotheses/H_my_hypothesis.md

# 2. Obsidian에서 파일 열기
# 3. {{PLACEHOLDERS}} 교체
```

### YAML Frontmatter 작성 예시

```yaml
---
entity_type: Hypothesis
entity_id: hyp-001
entity_name: H_my_hypothesis
created: 2025-12-18
updated: 2025-12-18
status: todo

hypothesis_text: "루프 데이터는 패턴화 가능하다"

validates:
  - MH3

tags: [hypothesis, data, pattern]
---
```

### 로컬 검증

```bash
# 작성 후 반드시 검증
python3 scripts/validate_schema.py .
python3 scripts/check_orphans.py .
```

**오류가 있으면 수정 후 재검증**

### Commit & Push

```bash
# 변경사항 확인
git status

# Stage
git add .

# Commit (pre-commit hook 자동 실행)
git commit -m "Add: H_my_hypothesis 추가"

# Push
git push origin feature/my-first-contribution
```

### Pull Request 생성

GitHub에서 Pull Request 생성 후 리뷰 요청

---

## 일일 워크플로우

### 아침: 최신 상태로 동기화

```bash
# main 브랜치로 이동
git checkout main

# 최신 변경사항 pull
git pull origin main
```

### 작업 중: 수시 검증

**Obsidian에서 작업하면서**:
- Claude Code 실행: `"스키마 검증해줘"`
- 또는 터미널: `python3 scripts/validate_schema.py .`

### 저녁: Commit & Push

```bash
# 변경사항 stage
git add .

# Commit (hook이 자동 검증)
git commit -m "Update: [작업 내용]"

# Push
git push
```

---

## 문제 해결

### Q: Pre-commit hook이 실패한다

**증상**:
```
Schema validation failed. Commit aborted.
```

**해결**:
```bash
# 수동으로 검증하여 오류 확인
python3 scripts/validate_schema.py .

# 오류 메시지 읽고 해당 파일 수정
# 예: "Missing required field: entity_id"
# → frontmatter에 entity_id 추가

# 다시 commit 시도
```

### Q: PyYAML import 에러

**증상**:
```
ModuleNotFoundError: No module named 'yaml'
```

**해결**:
```bash
# PyYAML 재설치
pip3 install --upgrade pyyaml

# 또는 사용자 로컬에 설치
pip3 install --user pyyaml
```

### Q: _Graph_Index.md 충돌

**증상**:
```
CONFLICT (content): Merge conflict in _Graph_Index.md
```

**해결**:
```bash
# _Graph_Index.md는 자동 생성 파일이므로 로컬 버전 삭제
git checkout --theirs _Graph_Index.md

# 또는 재생성
python3 scripts/build_graph_index.py .

# Conflict 해결 후
git add _Graph_Index.md
git commit
```

### Q: Obsidian에서 플러그인이 안 보인다

**해결**:
1. Settings → Community plugins
2. "Restricted mode" OFF
3. "Browse" 클릭하여 수동 설치 가능

### Q: Python 버전이 낮다

**확인**:
```bash
python3 --version
# Python 3.6.x → 업그레이드 필요
```

**해결**:
- macOS: `brew install python3`
- Ubuntu: `sudo apt install python3.9`
- Windows: Python 공식 사이트에서 다운로드

### Q: Git hook이 실행 안 된다

**확인**:
```bash
# 실행 권한 확인
ls -l .git/hooks/pre-commit

# 권한이 없으면
chmod +x .git/hooks/pre-commit
```

---

## 추가 리소스

### 핵심 문서

| 문서 | 설명 | 경로 |
|------|------|------|
| **CLAUDE.md** | Claude Code 전용 가이드 | `./CLAUDE.md` |
| **_HOME.md** | 메인 네비게이션 허브 | `./_HOME.md` |
| **10년 비전** | 전략의 시작점 | `01_North_Star/10년 비전.md` |
| **온톨로지 v0.1** | 데이터 스키마 | `30_Ontology/Schema/v0.1/` |

### 템플릿 위치

모든 엔티티 타입별 템플릿:
```
00_Meta/_TEMPLATES/
├── template_northstar.md
├── template_metahypothesis.md
├── template_condition.md
├── template_track.md
├── template_project.md
├── template_task.md
├── template_hypothesis.md
└── template_experiment.md
```

### Python Scripts 설명

| Script | 용도 | 실행 시점 |
|--------|------|----------|
| `validate_schema.py` | Frontmatter 검증 | Pre-commit |
| `check_orphans.py` | 끊어진 링크 검사 | Pre-commit |
| `build_graph_index.py` | 그래프 인덱스 생성 | Pre-commit |
| `build_dashboard.py` | 대시보드 생성 | 수동 |

### ID 형식 레퍼런스

| Prefix | 패턴 | 예시 | Entity Type |
|--------|------|------|-------------|
| `ns-` | `ns-NNN` | `ns-001` | NorthStar |
| `mh-` | `mh-1-4` | `mh-3` | MetaHypothesis |
| `cond-` | `cond-a-e` | `cond-b` | Condition |
| `trk-` | `trk-1-6` | `trk-2` | Track |
| `prj-` | `prj-NNN` | `prj-003` | Project |
| `tsk-` | `tsk-NNN-NN` | `tsk-003-01` | Task |
| `hyp-` | `hyp-NNN` | `hyp-001` | Hypothesis |
| `exp-` | `exp-NNN` | `exp-001` | Experiment |

---

## 체크리스트

설정이 완료되었는지 확인하세요:

- [ ] Repository clone 완료
- [ ] Obsidian 설치 및 vault 열기 완료
- [ ] PyYAML 설치 확인
- [ ] Pre-commit hook 설정 완료
- [ ] 4개 스크립트 실행 테스트 성공
- [ ] Claude Code 설치 (선택)
- [ ] `_HOME.md` 읽고 구조 이해
- [ ] `CLAUDE.md` 스캔 완료

✅ **All done!** 이제 LOOP 팀원으로서 기여할 준비가 완료되었습니다!

---

**문서 버전**: 1.0
**마지막 업데이트**: 2025-12-18
**작성자**: LOOP Team

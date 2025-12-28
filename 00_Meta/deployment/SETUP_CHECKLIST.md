# 🎯 LOOP Vault Setup Checklist

> 복사해서 자신의 환경에서 체크하세요!

---

## ✅ Phase 1: 기본 환경

- [ ] **Git 설치 확인**
  ```bash
  git --version
  ```

- [ ] **Python 3.7+ 설치 확인**
  ```bash
  python3 --version
  ```

- [ ] **Obsidian 설치**
  - 다운로드: https-//obsidian.md
  - 버전: 최신 버전

---

## ✅ Phase 2: Repository 준비

- [ ] **Repository clone**
  ```bash
  git clone [repository-url]
  cd LOOP
  ```

- [ ] **브랜치 확인**
  ```bash
  git branch
  # * main
  ```

- [ ] **파일 구조 확인**
  ```bash
  ls -la
  # README.md, SETUP.md, CLAUDE.md, scripts/ 등 확인
  ```

---

## ✅ Phase 3: Python 환경

- [ ] **PyYAML 설치**
  ```bash
  pip3 install pyyaml
  ```

- [ ] **설치 확인**
  ```bash
  python3 -c "import yaml; print('✓ PyYAML OK')"
  ```

---

## ✅ Phase 4: Git Hook 설정

- [ ] **Pre-commit hook 파일 생성**
  ```bash
  cat > .git/hooks/pre-commit << 'EOF'
  #!/bin/bash
  set -e

  VAULT_DIR="."
  SCRIPTS_DIR="$VAULT_DIR/scripts"

  echo "=== LOOP Vault Pre-commit Hook ==="

  echo "[1/3] Validating schema..."
  python3 "$SCRIPTS_DIR/validate_schema.py" "$VAULT_DIR" || exit 1

  echo "[2/3] Checking orphans..."
  python3 "$SCRIPTS_DIR/check_orphans.py" "$VAULT_DIR"

  echo "[3/3] Building graph index..."
  python3 "$SCRIPTS_DIR/build_graph_index.py" "$VAULT_DIR" || exit 1

  git add _Graph_Index.md

  echo "✓ Pre-commit checks passed!"
  EOF
  ```

- [ ] **실행 권한 부여**
  ```bash
  chmod +x .git/hooks/pre-commit
  ```

- [ ] **권한 확인**
  ```bash
  ls -l .git/hooks/pre-commit
  # -rwxr-xr-x ... pre-commit
  ```

---

## ✅ Phase 5: 스크립트 테스트

- [ ] **validate_schema.py 실행**
  ```bash
  python3 scripts/validate_schema.py .
  ```
  - 예상 출력: `All files passed validation!`

- [ ] **check_orphans.py 실행**
  ```bash
  python3 scripts/check_orphans.py .
  ```
  - 예상 출력: `No orphans found!` 또는 warnings

- [ ] **build_graph_index.py 실행**
  ```bash
  python3 scripts/build_graph_index.py .
  ```
  - 예상 출력: `Graph index saved to: ...`

- [ ] **build_dashboard.py 실행 (선택)**
  ```bash
  python3 scripts/build_dashboard.py .
  ```

---

## ✅ Phase 6: Obsidian 설정

- [ ] **Obsidian 실행**

- [ ] **"Open folder as vault" 클릭**

- [ ] **LOOP 폴더 선택**

- [ ] **"Trust author and enable plugins" 클릭**

- [ ] **Community plugins 활성화 확인**
  - Settings → Community plugins → Restricted mode OFF

- [ ] **설치된 플러그인 확인**
  - [ ] Dataview
  - [ ] Obsidian Git
  - [ ] Excalidraw

- [ ] **Core plugins 활성화**
  - [ ] Graph view
  - [ ] Backlinks
  - [ ] Templates
  - [ ] Properties

---

## ✅ Phase 7: 문서 탐색

- [ ] **_HOME.md 읽기**
  - Vault 전체 구조 이해

- [ ] **CLAUDE.md 스캔**
  - Claude Code 사용법 이해

- [ ] **01_North_Star/10년 비전.md 읽기**
  - 전략 체계 이해

- [ ] **30_Ontology/Schema/v0.1/ 확인**
  - 온톨로지 스키마 확인

- [ ] **00_Meta/_TEMPLATES/ 확인**
  - 템플릿 파일들 확인

---

## ✅ Phase 8: Claude Code (선택)

- [ ] **Claude Code CLI 설치**
  ```bash
  npm install -g @anthropic-ai/claude-code
  ```

- [ ] **LOOP 디렉토리에서 실행**
  ```bash
  claude-code
  ```

- [ ] **기본 명령 테스트**
  - "스키마 검증해줘"
  - "그래프 인덱스 재생성해줘"

---

## ✅ Phase 9: 첫 기여 테스트

- [ ] **테스트 브랜치 생성**
  ```bash
  git checkout -b test/my-setup
  ```

- [ ] **템플릿 복사**
  ```bash
  cp 00_Meta/_TEMPLATES/template_hypothesis.md \
     60_Hypotheses/H_test_setup.md
  ```

- [ ] **Obsidian에서 파일 편집**
  - frontmatter {{PLACEHOLDERS}} 교체
  - entity_id: hyp-999 (테스트용)

- [ ] **로컬 검증**
  ```bash
  python3 scripts/validate_schema.py .
  python3 scripts/check_orphans.py .
  ```

- [ ] **Commit 테스트**
  ```bash
  git add 60_Hypotheses/H_test_setup.md
  git commit -m "Test: setup verification"
  ```
  - Pre-commit hook이 실행되는지 확인

- [ ] **브랜치 삭제 (테스트 완료)**
  ```bash
  git checkout main
  git branch -D test/my-setup
  ```

---

## 🎊 완료!

**모든 항목을 체크했다면 축하합니다!**

✅ 이제 LOOP Vault 팀원으로서 기여할 준비가 완료되었습니다.

### 다음 단계

1. 실제 작업 브랜치 생성
2. 문서 작성/수정
3. Pull Request 생성
4. 리뷰 받기

### 문제가 있다면

- `SETUP.md`의 "문제 해결" 섹션 참고
- `CLAUDE.md` 참고
- 팀원에게 문의

---

**문서 버전**: 1.0
**마지막 업데이트**: 2025-12-18

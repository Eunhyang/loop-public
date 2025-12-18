# LOOP Obsidian Vault

Inner Loop OS (ILOS) 온톨로지 학습 및 스키마 개발을 위한 Obsidian vault입니다.

## 🚀 Quick Start

### 처음이신가요?

👉 **[SETUP.md](./SETUP.md)** 먼저 읽어주세요!

### TL;DR (기존 팀원용)

```bash
# 1. Clone & Install
git clone [repository-url]
cd LOOP
pip install pyyaml

# 2. Pre-commit Hook 설정
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
python3 scripts/validate_schema.py . || exit 1
python3 scripts/check_orphans.py .
python3 scripts/build_graph_index.py . || exit 1
git add _Graph_Index.md
EOF
chmod +x .git/hooks/pre-commit

# 3. Obsidian으로 폴더 열기

# 4. 검증 테스트
python3 scripts/validate_schema.py .
```

**체크리스트**: [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)

---

## 프로젝트 개요

Inner Loop OS는 인간의 정서-섭식-습관-보상-신경계 루프를 하나의 시스템으로 다루는 행동 OS입니다.

## 구조

- `00_Meta/` - 메타 문서, 템플릿, 빌드 설정
- `01_North_Star/` - 10년 비전 + Meta Hypotheses
- `10_Study/` - 온톨로지 학습 노트
- `20_Strategy/` - 전략 계층 (Conditions, Tracks)
- `30_Ontology/` - 온톨로지 스키마 개발
- `40_LOOP_OS/` - LOOP OS 시스템 정의
- `50_Projects/` - 프로젝트 실행 단위
- `60_Hypotheses/` - 가설 검증 로그
- `70_Experiments/` - 실험 및 검증
- `scripts/` - Python 자동화 스크립트
- `.claude/` - Claude Code 설정

## 시작하기

1. Obsidian으로 이 폴더를 vault로 열기
2. `_HOME.md`에서 시작
3. MOC 파일들을 통해 네비게이션

## 핵심 문서

### 가이드
- **팀원 온보딩**: `SETUP.md` ⭐
- **Claude Code 가이드**: `CLAUDE.md`
- **체크리스트**: `SETUP_CHECKLIST.md`

### 전략
- **10년 비전**: `01_North_Star/10년 비전.md`
- **Meta Hypothesis 3**: `01_North_Star/MH3_데이터_모델링_가능.md`
- **Condition B**: `20_Strategy/3Y_Conditions/Condition_B_Loop_Dataset.md`
- **Track 2 (Data)**: `20_Strategy/12M_Tracks/Track_2_Data.md`

### 온톨로지
- **스키마 v0.1**: `30_Ontology/Schema/v0.1/Ontology-lite v0.1.md`
- **시스템 정의**: `40_LOOP_OS/Inner Loop OS 정의v1.md`

### 네비게이션
- **홈**: `_HOME.md`
- **그래프 인덱스**: `_Graph_Index.md` (자동 생성)

---

## 협업 도구

- **Obsidian**: 지식 관리
- **Claude Code**: AI 기반 문서 작성/검증
- **Git**: 버전 관리
- **Python Scripts**: 자동 검증 (PyYAML 필요)

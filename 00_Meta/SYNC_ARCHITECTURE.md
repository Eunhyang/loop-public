# LOOP Vault 동기화 구조

> **Version 1.0** | Last updated: 2026-01-01

---

## 개요

LOOP Vault는 NAS를 Primary로 하고, GitHub을 Hub로 사용하여 로컬 SSD와 동기화합니다.

---

## 전체 구조

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         LOOP Vault 동기화 구조                           │
└─────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │   GitHub     │ ◄── 중앙 Hub (백업 + 외부 접근)
                              │   (Remote)   │
                              └──────┬───────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           │                         │                         │
           ▼                         ▼                         ▼
    ┌────────────┐            ┌────────────┐            ┌────────────┐
    │   로컬     │            │    NAS     │            │   팀원     │
    │   SSD      │            │ (Primary)  │            │ Obsidian   │
    │            │            │            │            │            │
    │ 외부 작업  │            │ 원본 저장  │            │ 직접 편집  │
    │ Claude Code│            │ API Server │            │            │
    └────────────┘            └──────┬─────┘            └────────────┘
                                     │
                                     ▼
                              ┌────────────┐
                              │ Dashboard  │ ◄── 같은 볼륨, 즉시 반영
                              │ (API)      │
                              └────────────┘
```

---

## 노드별 역할

| 노드 | 역할 | 비고 |
|------|------|------|
| **NAS** | Primary 저장소 | Synology NAS, `/volume1/LOOP_CORE/vault/LOOP` |
| **GitHub** | 중앙 Hub | 백업 + GPT/외부 LLM 접근용 |
| **로컬 SSD** | 외부 작업용 | 외부 네트워크에서 작업 시 사용 |
| **팀원 Obsidian** | 직접 편집 | NAS SMB 마운트로 직접 접근 |
| **Dashboard/API** | 실시간 표시 | NAS 동일 볼륨, 파일 변경 즉시 반영 |

---

## 동기화 메커니즘

### 1. NAS ↔ GitHub 자동 동기화 (15분 cron)

NAS에서 cron으로 자동 실행됩니다.

| 항목 | 값 |
|------|-----|
| 스크립트 | `/volume1/LOOP_CORE/vault/LOOP/scripts/nas-git-sync.sh` |
| 실행 주기 | 15분마다 |
| 로그 | `_build/git-sync.log` |

**동작 순서:**
```bash
git add -A                        # 변경사항 스테이징
git commit --no-verify            # 커밋 (pre-commit hook 스킵)
git pull --rebase origin main     # GitHub에서 pull
git push origin main              # GitHub로 push
```

### 2. 로컬 SSD ↔ GitHub

수동 git 명령어 또는 `/nas-git local-sync` 명령어 사용

```bash
# 작업 시작 전
git pull

# 작업 후
git add -A && git commit -m "메시지" && git push
# → 15분 내 NAS에 자동 반영
```

---

## 데이터 흐름 시나리오

### 시나리오 1: 내가 로컬에서 작업

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  로컬    │────►│  GitHub  │────►│   NAS    │────►│Dashboard │
│  SSD     │push │          │pull │(15분cron)│즉시 │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

**반영 시간**: 로컬 push 후 최대 15분

### 시나리오 2: 팀원이 NAS에서 직접 편집

```
┌──────────┐     ┌──────────┐
│   NAS    │────►│Dashboard │
│ (편집)   │즉시 │          │
└──────────┘     └──────────┘
      │
      ▼ (15분 cron)
┌──────────┐
│  GitHub  │
└──────────┘
```

**Dashboard 반영**: 즉시 (동일 볼륨)
**GitHub 반영**: 최대 15분

### 시나리오 3: 급한 동기화 필요

```bash
/nas-git local-sync
```

**순서:**
1. NAS 변경사항 → GitHub push
2. 로컬 pull (충돌 시 여기서 해결)
3. 로컬 변경사항 → GitHub push
4. NAS pull

---

## 관련 커맨드 & 스킬

### Slash Commands

| 명령어 | 설명 |
|--------|------|
| `/nas-git local-sync` | 로컬 → GitHub → NAS 전체 동기화 (권장) |
| `/nas-git sync` | NAS만 즉시 동기화 |
| `/nas-git pull` | GitHub → NAS |
| `/nas-git push` | NAS → GitHub |
| `/nas-git status` | NAS git status 확인 |
| `/nas-git logs` | 동기화 로그 확인 |
| `/nas-git reset` | 충돌 시 GitHub 기준 리셋 |

### Skills

| 스킬 | 설명 |
|------|------|
| `nas-git-status` | NAS git 상태 + 최근 로그 확인 (읽기 전용) |

---

## 주의사항

1. **NAS가 Primary**: 팀원들은 NAS에 직접 접근하여 편집
2. **로컬은 외부 작업용**: 외부 네트워크에서 끊길 때 사용
3. **Dashboard 즉시 반영**: NAS 편집은 Dashboard에 바로 반영 (같은 볼륨)
4. **GitHub은 Hub**: 직접 편집하지 않음, 동기화 허브로만 사용
5. **충돌 해결은 로컬에서**: `/nas-git local-sync`의 Step 2에서 해결 (NAS보다 편함)

---

## 트러블슈팅

| 문제 | 해결 |
|------|------|
| NAS 동기화 실패 | `/nas-git logs`로 에러 확인 |
| 충돌 발생 | `/nas-git local-sync` 후 로컬에서 해결 |
| NAS git 상태 이상 | `/nas-git reset`으로 GitHub 기준 리셋 |
| cron 동작 확인 | `/nas-git logs`로 15분 간격 로그 확인 |

---

## 관련 파일

| 파일 | 위치 | 설명 |
|------|------|------|
| `nas-git-sync.sh` | `scripts/` | NAS cron 스크립트 |
| `nas-git.md` | `.claude/commands/` | nas-git 커맨드 정의 |
| `SKILL.md` | `.claude/skills/nas-git-status/` | 상태 확인 스킬 |

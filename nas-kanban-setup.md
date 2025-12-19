# NAS 칸반 서버 배포 가이드

## 목표
Git으로 vault를 sync하면서, NAS에서 웹 기반 칸반 보드를 서빙

## 옵션 1: MkDocs Material (추천)

### 1. NAS 준비
```bash
# Python 3.7+ 설치 확인
python3 --version

# MkDocs 설치
pip3 install mkdocs-material
```

### 2. Vault Clone
```bash
# NAS에 vault clone
cd /volume1/web  # Synology 예시
git clone <your-repo-url> LOOP
cd LOOP
```

### 3. MkDocs 설정
```bash
cat > mkdocs.yml << 'EOF'
site_name: LOOP Vault
site_description: Inner Loop OS Strategy & Ontology
theme:
  name: material
  palette:
    scheme: slate
  features:
    - navigation.tabs
    - navigation.sections
    - search.suggest
    - search.highlight

nav:
  - Home: _HOME.md
  - North Star: 01_North_Star/
  - Strategy: 20_Strategy/
  - Ontology: 30_Ontology/
  - Projects: 50_Projects/
  - Kanban: kanban.md

plugins:
  - search
  - tags

markdown_extensions:
  - pymdownx.tasklist:
      custom_checkbox: true
  - pymdownx.superfences
  - tables
  - attr_list
EOF
```

### 4. 커스텀 칸반 페이지
```bash
cat > kanban.md << 'EOF'
# Project Kanban Board

## Pending Tasks
{% for file in config.extra.tasks %}
  {% if file.status == "pending" %}
- **{{ file.entity_name }}** ({{ file.entity_id }})
  - 담당: {{ file.assignee }}
  - 마감: {{ file.due }}
  - [상세보기]({{ file.path }})
  {% endif %}
{% endfor %}

## In Progress
{% for file in config.extra.tasks %}
  {% if file.status == "in_progress" %}
- **{{ file.entity_name }}** ({{ file.entity_id }})
  - 담당: {{ file.assignee }}
  - 마감: {{ file.due }}
  - [상세보기]({{ file.path }})
  {% endif %}
{% endfor %}

## Completed
{% for file in config.extra.tasks %}
  {% if file.status == "completed" %}
- ~~**{{ file.entity_name }}**~~ ({{ file.entity_id }})
  - 담당: {{ file.assignee }}
  - 완료일: {{ file.updated }}
  {% endif %}
{% endfor %}
EOF
```

### 5. 자동 배포 스크립트
```bash
cat > /volume1/scripts/deploy-vault.sh << 'EOF'
#!/bin/bash
set -e

VAULT_PATH="/volume1/web/LOOP"
BUILD_PATH="/volume1/web/loop-site"

echo "📥 Pulling latest changes..."
cd $VAULT_PATH
git pull origin main

echo "📊 Running validations..."
python3 scripts/validate_schema.py . || exit 1
python3 scripts/build_graph_index.py . || exit 1

echo "🔨 Building site..."
mkdocs build -d $BUILD_PATH

echo "✅ Deployment complete!"
echo "Site available at: http://<nas-ip>:8000"
EOF

chmod +x /volume1/scripts/deploy-vault.sh
```

### 6. Cron 자동화 (선택)
```bash
# 15분마다 자동 pull & build
crontab -e
*/15 * * * * /volume1/scripts/deploy-vault.sh >> /volume1/logs/vault-deploy.log 2>&1
```

### 7. 웹서버 실행
```bash
# 개발 서버 (간단)
mkdocs serve -a 0.0.0.0:8000

# 프로덕션 (Nginx)
# 1. nginx 설치
# 2. /etc/nginx/sites-available/vault 생성
cat > /etc/nginx/sites-available/vault << 'EOF'
server {
    listen 8000;
    server_name nas.local;

    root /volume1/web/loop-site;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
EOF

# 3. 활성화
ln -s /etc/nginx/sites-available/vault /etc/nginx/sites-enabled/
nginx -s reload
```

---

## 옵션 2: 커스텀 Next.js 칸반

### 1. Next.js 프로젝트 생성
```bash
cd /volume1/web
npx create-next-app@latest kanban-board
cd kanban-board
npm install gray-matter js-yaml
```

### 2. API 라우트
```typescript
// pages/api/tasks.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export default function handler(req, res) {
  const tasksDir = path.join(process.cwd(), '../LOOP/50_Projects/2025/P001_Ontology/Tasks');
  const files = fs.readdirSync(tasksDir);

  const tasks = files
    .filter(f => f.endsWith('.md'))
    .map(file => {
      const filePath = path.join(tasksDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const { data } = matter(content);
      return data;
    });

  res.json(tasks);
}
```

### 3. 칸반 UI
```tsx
// pages/kanban.tsx
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then(r => r.json());

export default function Kanban() {
  const { data: tasks } = useSWR('/api/tasks', fetcher);

  const pending = tasks?.filter(t => t.status === 'pending') || [];
  const inProgress = tasks?.filter(t => t.status === 'in_progress') || [];
  const completed = tasks?.filter(t => t.status === 'completed') || [];

  return (
    <div className="flex gap-4 p-8">
      <Column title="Pending" tasks={pending} />
      <Column title="In Progress" tasks={inProgress} />
      <Column title="Completed" tasks={completed} />
    </div>
  );
}

function Column({ title, tasks }) {
  return (
    <div className="flex-1 bg-gray-100 p-4 rounded">
      <h2 className="font-bold mb-4">{title} ({tasks.length})</h2>
      {tasks.map(task => (
        <div key={task.entity_id} className="bg-white p-3 mb-2 rounded shadow">
          <h3 className="font-semibold">{task.entity_name}</h3>
          <p className="text-sm text-gray-600">담당: {task.assignee}</p>
          <p className="text-sm text-gray-600">마감: {task.due}</p>
        </div>
      ))}
    </div>
  );
}
```

### 4. 빌드 및 배포
```bash
npm run build
npm run start -p 3000

# PM2로 프로덕션 관리
npm install -g pm2
pm2 start npm --name "kanban" -- start
pm2 save
pm2 startup
```

---

## 옵션 3: Focalboard

### Docker Compose
```yaml
# docker-compose.yml
version: '3'
services:
  focalboard:
    image: mattermost/focalboard
    ports:
      - "8000:8000"
    volumes:
      - /volume1/docker/focalboard:/data
    restart: always
```

### 동기화 스크립트
```python
# scripts/sync_to_focalboard.py
import yaml
import requests
from pathlib import Path

FOCALBOARD_API = "http://localhost:8000/api/v1"
TASKS_DIR = Path("50_Projects/2025/P001_Ontology/Tasks")

def sync_tasks():
    for task_file in TASKS_DIR.glob("*.md"):
        content = task_file.read_text()
        frontmatter = yaml.safe_load(content.split('---')[1])

        # Focalboard API 호출
        requests.post(f"{FOCALBOARD_API}/cards", json={
            "title": frontmatter["entity_name"],
            "properties": {
                "status": frontmatter["status"],
                "assignee": frontmatter["assignee"],
                "due": frontmatter["due"]
            }
        })

if __name__ == "__main__":
    sync_tasks()
```

---

## 비교표

| 옵션 | 설정 난이도 | 유지보수 | 유연성 | 비용 |
|------|------------|----------|--------|------|
| MkDocs | ⭐⭐ | ⭐ | ⭐⭐⭐ | 무료 |
| Next.js | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | 무료 |
| Focalboard | ⭐ | ⭐⭐ | ⭐⭐ | 무료 |
| Obsidian Publish | ⭐ | ⭐ | ⭐⭐⭐ | $8/월 |

---

## 추천

**현재 vault 구조에 최적**: MkDocs Material

**이유**:
- ✅ Markdown 네이티브
- ✅ YAML frontmatter 활용
- ✅ 설정 간단
- ✅ 정적 사이트 (빠름)
- ✅ Git pull → 빌드 자동화 쉬움

**더 많은 커스터마이징 필요 시**: Next.js

---

**Last updated**: 2025-12-19

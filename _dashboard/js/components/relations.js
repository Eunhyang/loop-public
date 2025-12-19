/**
 * Relations Component
 * Task/Project의 상위 연결 정보 표시
 * - Track (부모 Track)
 * - validates (검증하는 가설)
 * - conditions_3y (연결된 3년 조건)
 */
const Relations = {
    /**
     * Task의 관계 정보 HTML 반환
     */
    getTaskRelations(task, project) {
        const items = [];

        // 1. Track (Project의 상위 Track)
        if (project) {
            const track = State.getTrackForProject(project);
            if (track) {
                items.push(this.renderRelationItem('Track', track.entity_name || track.entity_id, 'track'));
            }
        }

        // 2. validates (Task가 검증하는 가설)
        if (task.validates && task.validates.length > 0) {
            const validatesStr = task.validates.join(', ');
            items.push(this.renderRelationItem('Validates', validatesStr, 'validates'));
        }

        // 3. conditions_3y (Project에서 상속)
        if (project?.conditions_3y && project.conditions_3y.length > 0) {
            const conditionsStr = project.conditions_3y.join(', ');
            items.push(this.renderRelationItem('Condition', conditionsStr, 'condition'));
        }

        return items.length > 0 ? items.join('') : null;
    },

    /**
     * Project의 관계 정보 HTML 반환
     */
    getProjectRelations(project) {
        const items = [];

        // 1. Track
        const track = State.getTrackForProject(project);
        if (track) {
            items.push(this.renderRelationItem('Track', track.entity_name || track.entity_id, 'track'));
        }

        // 2. validates
        if (project.validates && project.validates.length > 0) {
            const validatesStr = project.validates.join(', ');
            items.push(this.renderRelationItem('Validates', validatesStr, 'validates'));
        }

        // 3. conditions_3y
        if (project.conditions_3y && project.conditions_3y.length > 0) {
            const conditionsStr = project.conditions_3y.join(', ');
            items.push(this.renderRelationItem('Condition', conditionsStr, 'condition'));
        }

        // 4. hypothesis_id
        if (project.hypothesis_id) {
            items.push(this.renderRelationItem('Hypothesis', project.hypothesis_id, 'validates'));
        }

        return items.length > 0 ? items.join('') : null;
    },

    /**
     * 단일 관계 아이템 렌더링
     */
    renderRelationItem(label, value, type) {
        return `
            <div class="relation-item">
                <span class="relation-label">${label}:</span>
                <span class="relation-value ${type}">${value}</span>
            </div>
        `;
    }
};

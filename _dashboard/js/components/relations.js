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
                items.push(this.renderRelationItem('Track', track.entity_name || track.entity_id, 'track', 'Track', track.entity_id));
            }
        }

        // 2. validates (Task가 검증하는 가설)
        if (task.validates && task.validates.length > 0) {
            // 각 hypothesis를 개별 클릭 가능하게
            const hypItems = task.validates.map(hypId =>
                this.renderClickableValue(hypId, 'validates', 'Hypothesis', hypId)
            ).join(', ');
            items.push(`<div class="relation-item"><span class="relation-label">Validates:</span>${hypItems}</div>`);
        }

        // 3. conditions_3y (Project에서 상속)
        if (project?.conditions_3y && project.conditions_3y.length > 0) {
            // 각 condition을 개별 클릭 가능하게
            const condItems = project.conditions_3y.map(condId =>
                this.renderClickableValue(condId, 'condition', 'Condition', condId)
            ).join(', ');
            items.push(`<div class="relation-item"><span class="relation-label">Condition:</span>${condItems}</div>`);
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
            items.push(this.renderRelationItem('Track', track.entity_name || track.entity_id, 'track', 'Track', track.entity_id));
        }

        // 2. validates
        if (project.validates && project.validates.length > 0) {
            const hypItems = project.validates.map(hypId =>
                this.renderClickableValue(hypId, 'validates', 'Hypothesis', hypId)
            ).join(', ');
            items.push(`<div class="relation-item"><span class="relation-label">Validates:</span>${hypItems}</div>`);
        }

        // 3. conditions_3y
        if (project.conditions_3y && project.conditions_3y.length > 0) {
            const condItems = project.conditions_3y.map(condId =>
                this.renderClickableValue(condId, 'condition', 'Condition', condId)
            ).join(', ');
            items.push(`<div class="relation-item"><span class="relation-label">Condition:</span>${condItems}</div>`);
        }

        // 4. hypothesis_id
        if (project.hypothesis_id) {
            items.push(this.renderRelationItem('Hypothesis', project.hypothesis_id, 'validates', 'Hypothesis', project.hypothesis_id));
        }

        return items.length > 0 ? items.join('') : null;
    },

    /**
     * 단일 관계 아이템 렌더링 (클릭 가능)
     */
    renderRelationItem(label, value, type, entityType, entityId) {
        return `
            <div class="relation-item">
                <span class="relation-label">${label}:</span>
                <span class="relation-value ${type} clickable"
                      data-entity-type="${entityType}"
                      data-entity-id="${entityId}">${value}</span>
            </div>
        `;
    },

    /**
     * 클릭 가능한 값만 렌더링 (label 없이)
     */
    renderClickableValue(value, type, entityType, entityId) {
        return `<span class="relation-value ${type} clickable"
                      data-entity-type="${entityType}"
                      data-entity-id="${entityId}">${value}</span>`;
    }
};

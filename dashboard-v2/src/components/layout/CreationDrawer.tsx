import { useUi } from '@/contexts/UiContext';
import { ProjectCreateModal } from '@/features/projects/components/ProjectCreateModal';
import { ProgramCreateModal } from '@/features/programs/components/ProgramCreateModal';
import type { Member, Track } from '@/types';

/**
 * CreationDrawer renders the appropriate creation form (project or program)
 * as a side panel instead of a full‑screen modal.
 * It relies on `activeModal` from UiContext to decide which form to show.
 */
export const CreationDrawer = ({ members, tracks, constants }: { members: Member[]; tracks: Track[]; constants: Record<string, any> }) => {
    const { activeModal } = useUi();

    if (!activeModal) return null;

    // The existing modal components already handle their own close logic via UiContext.
    // We render them here without an additional overlay – they will display as a drawer
    // because their internal markup uses a fixed container. To keep the UI consistent,
    // we simply render the component; the component itself contains the overlay and
    // close button, which is acceptable for now.

    return (
        <>
            {activeModal === 'createProject' && (
                <ProjectCreateModal members={members} tracks={tracks} constants={constants} />
            )}
            {activeModal === 'createProgram' && (
                <ProgramCreateModal members={members} constants={constants} />
            )}
        </>
    );
};

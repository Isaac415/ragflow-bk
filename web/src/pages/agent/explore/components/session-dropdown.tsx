import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AgentApiAction,
  useDeleteAgentSession,
} from '@/hooks/use-agent-request';
import {
  useFetchFolders,
  useMoveToFolder,
  useUnfileSessions,
} from '@/hooks/use-conversation-folder';
import { IAgentLogResponse } from '@/interfaces/database/agent';
import { FolderInput, FolderOutput, Trash2 } from 'lucide-react';
import { MouseEventHandler, PropsWithChildren, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useExploreUrlParams } from '../hooks/use-explore-url-params';

interface SessionDropdownProps {
  session: IAgentLogResponse & { is_new?: boolean };
  removeTemporarySession?: (sessionId: string) => void;
}

export function SessionDropdown({
  children,
  session,
  removeTemporarySession,
}: PropsWithChildren<SessionDropdownProps>) {
  const { t } = useTranslation();
  const { canvasId, setSessionId, sessionId } = useExploreUrlParams();
  const { deleteAgentSession } = useDeleteAgentSession();

  const { data: folders } = useFetchFolders(canvasId, 'agent');
  const { moveToFolder } = useMoveToFolder([
    AgentApiAction.FetchSessionsByCanvasId,
    canvasId,
  ]);
  const { unfileSessions } = useUnfileSessions([
    AgentApiAction.FetchSessionsByCanvasId,
    canvasId,
  ]);

  const handleDelete: MouseEventHandler<HTMLDivElement> =
    useCallback(async () => {
      if (session.is_new && removeTemporarySession) {
        removeTemporarySession(session.id);
      } else if (canvasId) {
        const code = await deleteAgentSession({
          canvasId,
          sessionId: session.id,
        });
        if (code === 0 && sessionId === session.id) {
          setSessionId('', true);
        }
      }
    }, [
      session.is_new,
      session.id,
      removeTemporarySession,
      canvasId,
      deleteAgentSession,
      sessionId,
      setSessionId,
    ]);

  const handleMoveToFolder = useCallback(
    async (folderId: string) => {
      await moveToFolder({ folderId, sessionIds: [session.id] });
    },
    [moveToFolder, session.id],
  );

  const handleRemoveFromFolder = useCallback(async () => {
    await unfileSessions({ sessionIds: [session.id], source: 'agent' });
  }, [unfileSessions, session.id]);

  const showFolderOptions = !session.is_new && folders.length > 0;
  const isInFolder = !!session.folder_id;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent>
        {showFolderOptions && (
          <>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FolderInput className="h-4 w-4 mr-2" />
                {t('explore.moveToFolder')}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {folders.map((folder) => (
                  <DropdownMenuItem
                    key={folder.id}
                    onClick={() => handleMoveToFolder(folder.id)}
                    disabled={session.folder_id === folder.id}
                  >
                    {folder.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            {isInFolder && (
              <DropdownMenuItem onClick={handleRemoveFromFolder}>
                <FolderOutput className="h-4 w-4 mr-2" />
                {t('explore.removeFromFolder')}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
          </>
        )}
        <ConfirmDeleteDialog onOk={handleDelete}>
          <DropdownMenuItem
            className="text-state-error"
            onSelect={(e) => {
              e.preventDefault();
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {t('common.delete')} <Trash2 />
          </DropdownMenuItem>
        </ConfirmDeleteDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

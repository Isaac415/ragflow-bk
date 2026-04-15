import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AgentApiAction } from '@/hooks/use-agent-request';
import { useClientSearch } from '@/hooks/use-client-search';
import {
  useCreateFolder,
  useDeleteFolder,
  useRenameFolder,
} from '@/hooks/use-conversation-folder';
import { IAgentLogResponse } from '@/interfaces/database/agent';
import { FolderPlus, Plus } from 'lucide-react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useExploreUrlParams } from '../hooks/use-explore-url-params';
import { useSelectDerivedSessionList } from '../hooks/use-select-derived-session-list';
import { FolderSection } from './folder-section';
import { SessionCard } from './session-card';

interface SessionListProps {
  selectedSessionId?: string;
  onSelectSession: (sessionId: string, isNew?: boolean) => void;
}

export function SessionList({
  selectedSessionId,
  onSelectSession,
}: SessionListProps) {
  const { t } = useTranslation();
  const { canvasId } = useExploreUrlParams();

  const {
    sessions,
    loading,
    addTemporarySession,
    removeTemporarySession,
    folderGroups,
    unfiledSessions,
  } = useSelectDerivedSessionList();

  const { filteredData, handleSearchChange, searchKeyword } =
    useClientSearch<IAgentLogResponse>({
      data: sessions,
      searchFields: ['name'],
    });

  // Folder mutations
  const { createFolder } = useCreateFolder();
  const { renameFolder } = useRenameFolder();
  const { deleteFolder } = useDeleteFolder([
    AgentApiAction.FetchSessionsByCanvasId,
    canvasId,
  ]);

  const handleCreateFolder = useCallback(async () => {
    if (canvasId) {
      await createFolder({
        parent_id: canvasId,
        source: 'agent',
        name: t('explore.newFolder'),
      });
    }
  }, [canvasId, createFolder, t]);

  const handleRenameFolder = useCallback(
    async (folderId: string, name: string) => {
      if (canvasId) {
        await renameFolder({
          folderId,
          name,
          parentId: canvasId,
          source: 'agent',
        });
      }
    },
    [canvasId, renameFolder],
  );

  const handleDeleteFolder = useCallback(
    async (folderId: string) => {
      if (canvasId) {
        await deleteFolder({
          folderId,
          parentId: canvasId,
          source: 'agent',
        });
      }
    },
    [canvasId, deleteFolder],
  );

  const isSearching = !!searchKeyword;

  const renderSessionCard = useCallback(
    (session: IAgentLogResponse & { is_new?: boolean }) => (
      <SessionCard
        key={session.id}
        session={session}
        selected={session.id === selectedSessionId}
        onClick={() => onSelectSession(session.id, session.is_new)}
        removeTemporarySession={removeTemporarySession}
      />
    ),
    [selectedSessionId, onSelectSession, removeTemporarySession],
  );

  return (
    <section className="p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold">{t('explore.sessions')}</h2>
          <span className="text-xs text-text-secondary">{sessions.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={addTemporarySession}>
            <Plus className="h-4 w-4" />
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleCreateFolder}>
                <FolderPlus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('explore.newFolder')}</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div className="mb-4">
        <SearchInput
          placeholder={t('explore.searchSessions')}
          onChange={handleSearchChange}
          value={searchKeyword}
        />
      </div>
      <div className="flex-1 overflow-auto space-y-1">
        {isSearching ? (
          // Flat view during search
          filteredData.map(renderSessionCard)
        ) : (
          <>
            {/* Folder sections */}
            {folderGroups.map(({ folder, sessions: folderSessions }) => (
              <FolderSection
                key={folder.id}
                folder={folder}
                sessions={folderSessions}
                onRenameFolder={handleRenameFolder}
                onDeleteFolder={handleDeleteFolder}
              >
                <div className="space-y-2">
                  {folderSessions.map(renderSessionCard)}
                </div>
              </FolderSection>
            ))}

            {/* Unfiled sessions */}
            {unfiledSessions.map(renderSessionCard)}
          </>
        )}
        {!loading && filteredData.length === 0 && isSearching && (
          <div className="text-center text-text-secondary py-8">
            {t('explore.noSessionsFound')}
          </div>
        )}
        {!loading && sessions.length === 0 && !isSearching && (
          <div className="text-center text-text-secondary py-8">
            {t('explore.noSessionsFound')}
          </div>
        )}
      </div>
    </section>
  );
}

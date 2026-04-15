import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { MoreButton } from '@/components/more-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { IAgentLogResponse } from '@/interfaces/database/agent';
import { IConversationFolder } from '@/interfaces/database/conversation-folder';
import {
  ChevronDown,
  ChevronRight,
  Folder,
  Pencil,
  Trash2,
} from 'lucide-react';
import { MouseEventHandler, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface FolderSectionProps {
  folder: IConversationFolder;
  sessions: IAgentLogResponse[];
  onRenameFolder: (folderId: string, name: string) => void;
  onDeleteFolder: (folderId: string) => void;
  children: React.ReactNode;
}

export function FolderSection({
  folder,
  sessions,
  onRenameFolder,
  onDeleteFolder,
  children,
}: FolderSectionProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameName, setRenameName] = useState(folder.name);

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const handleRenameSubmit = useCallback(() => {
    const trimmed = renameName.trim();
    if (trimmed && trimmed !== folder.name) {
      onRenameFolder(folder.id, trimmed);
    }
    setIsRenaming(false);
  }, [renameName, folder.id, folder.name, onRenameFolder]);

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleRenameSubmit();
      } else if (e.key === 'Escape') {
        setIsRenaming(false);
        setRenameName(folder.name);
      }
    },
    [handleRenameSubmit, folder.name],
  );

  const handleStartRename: MouseEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      e.stopPropagation();
      setRenameName(folder.name);
      setIsRenaming(true);
    },
    [folder.name],
  );

  const handleDelete: MouseEventHandler<HTMLDivElement> = useCallback(() => {
    onDeleteFolder(folder.id);
  }, [folder.id, onDeleteFolder]);

  return (
    <div className="mb-1">
      <div className="flex items-center gap-1 px-1 py-1.5 rounded-lg hover:bg-bg-card group">
        <button
          type="button"
          className="flex items-center gap-1.5 flex-1 min-w-0 focus-visible:outline-none"
          onClick={toggleExpanded}
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
          )}
          <Folder className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
          {isRenaming ? (
            <Input
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={handleRenameKeyDown}
              className="h-6 text-sm px-1"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate text-sm">{folder.name}</span>
          )}
          <span className="text-xs text-text-secondary shrink-0">
            {sessions.length}
          </span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <MoreButton className="opacity-0 group-hover:opacity-100" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              onClick={handleStartRename}
            >
              <Pencil className="h-4 w-4 mr-2" />
              {t('explore.renameFolder')}
            </DropdownMenuItem>
            <ConfirmDeleteDialog
              onOk={handleDelete}
              title={t('explore.deleteFolder')}
              content={{ title: t('explore.deleteFolderConfirm') }}
            >
              <DropdownMenuItem
                className="text-state-error"
                onSelect={(e) => e.preventDefault()}
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('explore.deleteFolder')}
              </DropdownMenuItem>
            </ConfirmDeleteDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {expanded && <div className="pl-3">{children}</div>}
    </div>
  );
}

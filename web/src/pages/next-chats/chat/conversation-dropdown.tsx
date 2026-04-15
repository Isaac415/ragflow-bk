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
  ChatApiAction,
  useGetChatSearchParams,
  useRemoveSessions,
} from '@/hooks/use-chat-request';
import {
  useFetchFolders,
  useMoveToFolder,
  useUnfileSessions,
} from '@/hooks/use-conversation-folder';
import { IConversation } from '@/interfaces/database/chat';
import { FolderInput, FolderOutput, Trash2 } from 'lucide-react';
import { MouseEventHandler, PropsWithChildren, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { useChatUrlParams } from '../hooks/use-chat-url';

export function ConversationDropdown({
  children,
  conversation,
  removeTemporaryConversation,
}: PropsWithChildren & {
  conversation: IConversation;
  removeTemporaryConversation?: (conversationId: string) => void;
}) {
  const { t } = useTranslation();
  const { id: chatId } = useParams();
  const { setConversationBoth } = useChatUrlParams();
  const { removeSessions } = useRemoveSessions();
  const { conversationId, isNew } = useGetChatSearchParams();

  const { data: folders } = useFetchFolders(chatId, 'chat');
  const { moveToFolder } = useMoveToFolder([
    ChatApiAction.FetchSessionList,
    chatId,
  ]);
  const { unfileSessions } = useUnfileSessions([
    ChatApiAction.FetchSessionList,
    chatId,
  ]);

  const handleDelete: MouseEventHandler<HTMLDivElement> =
    useCallback(async () => {
      if (isNew === 'true' && removeTemporaryConversation) {
        removeTemporaryConversation(conversation.id);
        if (conversationId === conversation.id) {
          setConversationBoth('', '');
        }
      } else {
        const code = await removeSessions([conversation.id]);
        if (code === 0) {
          setConversationBoth('', '');
        }
      }
    }, [
      conversation.id,
      conversationId,
      isNew,
      removeSessions,
      removeTemporaryConversation,
      setConversationBoth,
    ]);

  const handleMoveToFolder = useCallback(
    async (folderId: string) => {
      await moveToFolder({ folderId, sessionIds: [conversation.id] });
    },
    [moveToFolder, conversation.id],
  );

  const handleRemoveFromFolder = useCallback(async () => {
    await unfileSessions({ sessionIds: [conversation.id], source: 'chat' });
  }, [unfileSessions, conversation.id]);

  const showFolderOptions = !conversation.is_new && folders.length > 0;
  const isInFolder = !!conversation.folder_id;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent>
        {showFolderOptions && (
          <>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FolderInput className="h-4 w-4 mr-2" />
                {t('chat.moveToFolder')}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {folders.map((folder) => (
                  <DropdownMenuItem
                    key={folder.id}
                    onClick={() => handleMoveToFolder(folder.id)}
                    disabled={conversation.folder_id === folder.id}
                  >
                    {folder.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            {isInFolder && (
              <DropdownMenuItem onClick={handleRemoveFromFolder}>
                <FolderOutput className="h-4 w-4 mr-2" />
                {t('chat.removeFromFolder')}
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
            data-testid="chat-detail-session-delete"
            data-session-id={conversation.id}
          >
            {t('common.delete')} <Trash2 />
          </DropdownMenuItem>
        </ConfirmDeleteDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

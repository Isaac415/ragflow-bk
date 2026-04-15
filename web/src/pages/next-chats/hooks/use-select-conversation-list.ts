import { MessageType } from '@/constants/chat';
import { useTranslate } from '@/hooks/common-hooks';
import {
  useFetchChatList,
  useFetchSessionList,
} from '@/hooks/use-chat-request';
import { useFetchFolders } from '@/hooks/use-conversation-folder';
import { IConversation } from '@/interfaces/database/chat';
import { IConversationFolder } from '@/interfaces/database/conversation-folder';
import { generateConversationId } from '@/utils/chat';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { useChatUrlParams } from './use-chat-url';

export const useFindPrologueFromDialogList = () => {
  const { id: dialogId } = useParams();
  const { data } = useFetchChatList();

  const prologue = useMemo(() => {
    return data.chats.find((x) => x.id === dialogId)?.prompt_config?.prologue;
  }, [dialogId, data]);

  return prologue;
};

export const useSelectDerivedConversationList = () => {
  const { t } = useTranslate('chat');

  const [list, setList] = useState<Array<IConversation>>([]);
  const {
    data: conversationList,
    loading,
    handleInputChange,
    searchString,
  } = useFetchSessionList();

  const { id: dialogId } = useParams();
  const prologue = useFindPrologueFromDialogList();
  const { setConversationBoth } = useChatUrlParams();

  const { data: folders } = useFetchFolders(dialogId, 'chat');

  const addTemporaryConversation = useCallback(() => {
    const conversationId = generateConversationId();
    setList((pre) => {
      if (dialogId) {
        setConversationBoth(conversationId, 'true');
        const nextList = [
          {
            id: conversationId,
            name: t('newConversation'),
            chat_id: dialogId,
            is_new: true,
            messages: [
              {
                content: prologue,
                role: MessageType.Assistant,
              },
            ],
          } as any,
          ...conversationList,
        ];
        return nextList;
      }

      return pre;
    });
  }, [dialogId, setConversationBoth, t, prologue, conversationList]);

  const removeTemporaryConversation = useCallback((conversationId: string) => {
    setList((prevList) => {
      return prevList.filter(
        (conversation) => conversation.id !== conversationId,
      );
    });
  }, []);

  // When you first enter the page, select the top conversation card

  useEffect(() => {
    setList([...conversationList]);
  }, [conversationList]);

  // Group conversations by folder
  const { folderGroups, unfiledConversations } = useMemo(() => {
    // When searching, flatten the view
    if (searchString) {
      return { folderGroups: [], unfiledConversations: list };
    }

    const unfiledConversations = list.filter((c) => !c.folder_id);
    const folderGroups = folders.map((folder: IConversationFolder) => ({
      folder,
      conversations: list.filter((c) => c.folder_id === folder.id),
    }));

    return { folderGroups, unfiledConversations };
  }, [list, folders, searchString]);

  return {
    list,
    folders,
    folderGroups,
    unfiledConversations,
    addTemporaryConversation,
    removeTemporaryConversation,
    loading,
    handleInputChange,
    searchString,
  };
};

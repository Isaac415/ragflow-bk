import { useFetchSessionsByCanvasId } from '@/hooks/use-agent-request';
import { useFetchFolders } from '@/hooks/use-conversation-folder';
import { IAgentLogResponse } from '@/interfaces/database/agent';
import { IConversationFolder } from '@/interfaces/database/conversation-folder';
import { generateConversationId } from '@/utils/chat';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useExploreUrlParams } from './use-explore-url-params';

export const useSelectDerivedSessionList = () => {
  const [list, setList] = useState<
    Array<IAgentLogResponse & { is_new?: boolean }>
  >([]);

  const { data: sessions = [], loading } = useFetchSessionsByCanvasId();

  const { setSessionId, canvasId } = useExploreUrlParams();

  const { data: folders } = useFetchFolders(canvasId, 'agent');

  const addTemporarySession = useCallback(() => {
    const sessionId = generateConversationId();
    const now = Date.now() / 1000;

    const tempSession: IAgentLogResponse & { is_new?: boolean } = {
      id: sessionId,
      message: [],
      create_date: '',
      create_time: now,
      update_date: '',
      update_time: now,
      round: 0,
      thumb_up: 0,
      errors: '',
      source: '',
      user_id: '',
      dsl: '',
      reference: {},
      is_new: true,
    };

    setList([tempSession, ...sessions]);

    setSessionId('', true);
  }, [sessions, setSessionId]);

  const removeTemporarySession = useCallback((sessionId: string) => {
    setList((prevList) => {
      return prevList.filter((session) => session.id !== sessionId);
    });
  }, []);

  // Sync server data to local state
  useEffect(() => {
    setList(sessions);
  }, [sessions]);

  // Group sessions by folder
  const { folderGroups, unfiledSessions } = useMemo(() => {
    const unfiledSessions = list.filter((s) => !s.folder_id);
    const folderGroups = folders.map((folder: IConversationFolder) => ({
      folder,
      sessions: list.filter((s) => s.folder_id === folder.id),
    }));

    return { folderGroups, unfiledSessions };
  }, [list, folders]);

  return {
    sessions: list,
    folders,
    folderGroups,
    unfiledSessions,
    loading,
    addTemporarySession,
    removeTemporarySession,
  };
};

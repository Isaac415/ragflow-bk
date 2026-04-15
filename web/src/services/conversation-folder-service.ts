import api from '@/utils/api';
import request from '@/utils/next-request';

export const listFolders = (parentId: string, source: 'chat' | 'agent') =>
  request.get(api.listConversationFolders, {
    params: { parent_id: parentId, source },
  });

export const createFolder = (data: {
  parent_id: string;
  source: string;
  name: string;
}) => request.post(api.createConversationFolder, data);

export const renameFolder = (folderId: string, name: string) =>
  request.put(api.updateConversationFolder(folderId), { name });

export const deleteFolder = (folderId: string) =>
  request.delete(api.deleteConversationFolder(folderId));

export const moveToFolder = (folderId: string, sessionIds: string[]) =>
  request.put(api.moveSessionsToFolder(folderId), {
    session_ids: sessionIds,
  });

export const unfileSessions = (sessionIds: string[], source: string) =>
  request.put(api.unfileSessions, { session_ids: sessionIds, source });

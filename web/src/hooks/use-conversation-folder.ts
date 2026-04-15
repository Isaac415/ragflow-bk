import { IConversationFolder } from '@/interfaces/database/conversation-folder';
import {
  createFolder,
  deleteFolder,
  listFolders,
  moveToFolder,
  renameFolder,
  unfileSessions,
} from '@/services/conversation-folder-service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const enum FolderApiAction {
  FetchFolders = 'fetchConversationFolders',
}

export const useFetchFolders = (
  parentId: string | undefined,
  source: 'chat' | 'agent',
) => {
  const {
    data,
    isFetching: loading,
    refetch,
  } = useQuery<IConversationFolder[]>({
    queryKey: [FolderApiAction.FetchFolders, parentId, source],
    initialData: [],
    gcTime: 0,
    refetchOnWindowFocus: false,
    enabled: !!parentId,
    queryFn: async () => {
      const { data } = await listFolders(parentId!, source);
      return data?.data ?? [];
    },
  });

  return { data, loading, refetch };
};

export const useCreateFolder = () => {
  const queryClient = useQueryClient();

  const {
    data,
    isPending: loading,
    mutateAsync,
  } = useMutation({
    mutationFn: async (params: {
      parent_id: string;
      source: 'chat' | 'agent';
      name: string;
    }) => {
      const { data } = await createFolder(params);
      return data?.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          FolderApiAction.FetchFolders,
          variables.parent_id,
          variables.source,
        ],
      });
    },
  });

  return { data, loading, createFolder: mutateAsync };
};

export const useRenameFolder = () => {
  const queryClient = useQueryClient();

  const {
    data,
    isPending: loading,
    mutateAsync,
  } = useMutation({
    mutationFn: async (params: {
      folderId: string;
      name: string;
      parentId: string;
      source: 'chat' | 'agent';
    }) => {
      const { data } = await renameFolder(params.folderId, params.name);
      return data?.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          FolderApiAction.FetchFolders,
          variables.parentId,
          variables.source,
        ],
      });
    },
  });

  return { data, loading, renameFolder: mutateAsync };
};

export const useDeleteFolder = (sessionQueryKey?: unknown[]) => {
  const queryClient = useQueryClient();

  const {
    data,
    isPending: loading,
    mutateAsync,
  } = useMutation({
    mutationFn: async (params: {
      folderId: string;
      parentId: string;
      source: 'chat' | 'agent';
    }) => {
      const { data } = await deleteFolder(params.folderId);
      return data?.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          FolderApiAction.FetchFolders,
          variables.parentId,
          variables.source,
        ],
      });
      if (sessionQueryKey) {
        queryClient.invalidateQueries({ queryKey: sessionQueryKey });
      }
    },
  });

  return { data, loading, deleteFolder: mutateAsync };
};

export const useMoveToFolder = (sessionQueryKey?: unknown[]) => {
  const queryClient = useQueryClient();

  const {
    data,
    isPending: loading,
    mutateAsync,
  } = useMutation({
    mutationFn: async (params: { folderId: string; sessionIds: string[] }) => {
      const { data } = await moveToFolder(params.folderId, params.sessionIds);
      return data?.data;
    },
    onSuccess: () => {
      if (sessionQueryKey) {
        queryClient.invalidateQueries({ queryKey: sessionQueryKey });
      }
    },
  });

  return { data, loading, moveToFolder: mutateAsync };
};

export const useUnfileSessions = (sessionQueryKey?: unknown[]) => {
  const queryClient = useQueryClient();

  const {
    data,
    isPending: loading,
    mutateAsync,
  } = useMutation({
    mutationFn: async (params: {
      sessionIds: string[];
      source: 'chat' | 'agent';
    }) => {
      const { data } = await unfileSessions(params.sessionIds, params.source);
      return data?.data;
    },
    onSuccess: () => {
      if (sessionQueryKey) {
        queryClient.invalidateQueries({ queryKey: sessionQueryKey });
      }
    },
  });

  return { data, loading, unfileSessions: mutateAsync };
};

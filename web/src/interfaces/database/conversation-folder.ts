export interface IConversationFolder {
  id: string;
  user_id: string;
  parent_id: string;
  source: 'chat' | 'agent';
  name: string;
  create_time: number;
  create_date: string;
  update_time: number;
  update_date: string;
}

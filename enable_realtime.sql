-- Enable Realtime for conversations and leads tables
alter publication supabase_realtime add table conversations;
alter publication supabase_realtime add table leads;

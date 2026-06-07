-- Actualizar tabla de Clientes para Meta Integrations (Messenger & Instagram)
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS facebook_page_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS instagram_account_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS facebook_access_token TEXT;

-- Añadir canal a las conversaciones (whatsapp, messenger, instagram)
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS channel VARCHAR(50) DEFAULT 'whatsapp';

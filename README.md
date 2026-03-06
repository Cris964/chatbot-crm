# BotCRM — Panel SaaS

## Setup en Vercel

1. Sube este repo a GitHub como `chatbot-crm`
2. Importa en vercel.com
3. Agrega variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_ADMIN_EMAIL`
   - `NEXT_PUBLIC_ADMIN_PASS`
4. Deploy 🚀

## SQL adicional para Supabase

```sql
-- Agregar columnas de login para clientes
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_password TEXT;
```

## Multi-tenant

- Admin: ve todos los clientes y puede filtrar
- Cliente: solo ve sus propias conversaciones, pedidos y configuración

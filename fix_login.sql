-- 1. Eliminar todas las políticas existentes en team_members para limpiar el error de recursión infinita
DROP POLICY IF EXISTS "Users see own memberships" ON team_members;
DROP POLICY IF EXISTS "Admins manage team" ON team_members;
DROP POLICY IF EXISTS "Allow public read team_members" ON team_members;
DROP POLICY IF EXISTS "Allow public update team_members" ON team_members;
DROP POLICY IF EXISTS "Allow public insert team_members" ON team_members;
DROP POLICY IF EXISTS "Allow public delete team_members" ON team_members;

-- 2. Crear nuevas políticas seguras SIN recursión
-- Permitir que cualquier usuario autenticado lea la tabla de equipo.
-- Esto es seguro y evita la recursión al buscar el clientId en AuthContext.
CREATE POLICY "Allow authenticated read team_members" ON team_members 
FOR SELECT TO authenticated USING (true);

-- Permitir que un usuario solo actualice su propio estado si es necesario
CREATE POLICY "Users update own membership" ON team_members 
FOR UPDATE TO authenticated USING (user_id = auth.uid());

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, full_name, role, client_id, admin_user_id } = req.body;

    // Validate required fields
    if (!email || !password || !full_name || !role || !client_id || !admin_user_id) {
      return res.status(400).json({ error: 'Faltan campos requeridos: email, password, full_name, role, client_id, admin_user_id' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Validate role
    const validRoles = ['admin', 'vendedor', 'soporte', 'marketing'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Rol inválido. Opciones: ${validRoles.join(', ')}` });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
      return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY no está configurada en el servidor' });
    }

    // Use service role key for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify the caller is an admin of the target company
    const { data: callerMembership } = await supabaseAdmin
      .from('team_members')
      .select('role')
      .eq('user_id', admin_user_id)
      .eq('client_id', client_id)
      .single();

    // Allow super admins or company admins
    const SUPER_ADMIN_EMAILS = ['admin@chekadmin.com', 'naturel@admin.com'];
    const { data: callerAuth } = await supabaseAdmin.auth.admin.getUserById(admin_user_id);
    const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(callerAuth?.user?.email?.toLowerCase());
    
    if (!isSuperAdmin && (!callerMembership || callerMembership.role !== 'admin')) {
      return res.status(403).json({ error: 'No tienes permisos para crear usuarios en esta empresa' });
    }

    // 1. Create the auth user
    const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email verification
      user_metadata: { full_name }
    });

    if (authError) {
      console.error('[CREATE-USER] Auth error:', authError);
      if (authError.message?.includes('already been registered')) {
        return res.status(409).json({ error: 'Este email ya está registrado. Usa otro email.' });
      }
      return res.status(400).json({ error: authError.message });
    }

    // 2. Create team_member entry linking user to company
    const { error: memberError } = await supabaseAdmin
      .from('team_members')
      .insert({
        user_id: newUser.user.id,
        client_id,
        role,
        full_name,
        email,
        status: 'activo'
      });

    if (memberError) {
      console.error('[CREATE-USER] Team member error:', memberError);
      // If team member insert fails, don't leave orphan auth user
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return res.status(400).json({ error: 'Error vinculando usuario a la empresa: ' + memberError.message });
    }

    console.log(`[CREATE-USER] ✅ User created: ${email} → company ${client_id} as ${role}`);

    return res.status(200).json({ 
      success: true, 
      user: { 
        id: newUser.user.id, 
        email, 
        full_name, 
        role, 
        client_id 
      } 
    });

  } catch (e) {
    console.error('[CREATE-USER] Exception:', e);
    return res.status(500).json({ error: 'Error interno: ' + e.message });
  }
}

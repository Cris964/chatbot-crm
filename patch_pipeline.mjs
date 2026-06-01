import fs from 'fs';

const file = 'src/pages/Pipeline.jsx';
let content = fs.readFileSync(file, 'utf8');

// Add useTenant import if not present
if (!content.includes('useTenant')) {
    content = content.replace("import { useOutletContext } from 'react-router-dom'", "import { useOutletContext } from 'react-router-dom'\nimport { useTenant } from '../lib/useTenant'");
}

// Replace session with tenant inside Pipeline component
content = content.replace("const { session } = useOutletContext()", "const { session } = useOutletContext()\n  const tenant = useTenant()");

// Replace useEffect dependencies
content = content.replace("useEffect(() => {\n    if (session?.user?.id) {\n       fetchLeads()\n    }\n  }, [session])", "useEffect(() => {\n    if (tenant.clientId && !tenant.isLoading) {\n       fetchLeads()\n    }\n  }, [tenant.clientId, tenant.isLoading])");

// Replace fetchLeads logic
const oldFetchLeads = `  const fetchLeads = async () => {
    setIsLoading(true)
    
    // 1. Get client IDs for multitenancy
    const { data: clients } = await supabase.from('clients').select('id').eq('user_id', session.user.id)
    const clientIds = clients?.map(c => c.id) || []

    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .in('client_id', clientIds)`;

const newFetchLeads = `  const fetchLeads = async () => {
    setIsLoading(true)

    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .eq('client_id', tenant.clientId)`;

content = content.replace(oldFetchLeads, newFetchLeads);

// Fix handleCreateDeal
const oldHandleCreateDeal = `    // Get client for multitenancy
    const { data: client } = await supabase.from('clients').select('id').eq('user_id', session.user.id).single()
    
    if (!client) {
        alert('No se encontró un cliente asociado a tu cuenta.')
        setIsSaving(false)
        return
    }

    const { error } = await supabase.from('leads').insert({
      client_id: client.id,`;

const newHandleCreateDeal = `    if (!tenant.clientId) {
        alert('No se encontró un cliente asociado a tu cuenta.')
        setIsSaving(false)
        return
    }

    const { error } = await supabase.from('leads').insert({
      client_id: tenant.clientId,`;

content = content.replace(oldHandleCreateDeal, newHandleCreateDeal);

fs.writeFileSync(file, content);
console.log("Pipeline.jsx patched!");

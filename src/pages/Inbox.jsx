import { useState, useRef, useEffect, useMemo } from 'react'
import { useOutletContext, useLocation } from 'react-router-dom'
import {
  Search, Filter, MoreVertical, Send, Paperclip, Smile,
  Phone, Video, Star, Tag, AlertTriangle, Bot, UserCheck,
  Mail, MapPin, Calendar, ShoppingBag, Clock, ChevronDown, CheckCheck, MessageSquare,
  Sparkles, Check, X as Close, User, Globe, History, CheckCircle2, ChevronRight,
  Mic, Square, Trash2, UserPlus, Facebook, Instagram, MessageCircle, Archive, Download, Megaphone, CheckSquare, FileText
, PanelRightClose, PanelRightOpen, ArrowRightFromLine } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useTenant } from '../lib/useTenant'

const VoiceNotePlayer = ({ src, sender, durationText = "0:00", avatar }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef(null)

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime
      const total = audioRef.current.duration || 1
      setProgress((current / total) * 100)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setProgress(0)
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      background: sender === 'client' ? 'rgba(var(--overlay-rgb), 0.05)' : 'var(--primary-700)',
      padding: '8px 12px',
      borderRadius: '24px',
      marginBottom: '8px',
      minWidth: '220px'
    }}>
      <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
         <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#ccc', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {avatar && avatar.startsWith('http') ? (
               <img src={avatar} style={{width:'100%', height:'100%', objectFit:'cover'}} alt="avatar" />
            ) : avatar ? (
               <div style={{fontSize: '16px', fontWeight: 700, color: '#333'}}>{avatar}</div>
            ) : (
               <User size={40} color="#666" style={{ marginTop: 8 }} />
            )}
         </div>
         <div style={{ position: 'absolute', bottom: -2, right: -2, background: sender === 'client' ? '#10b981' : '#3b82f6', borderRadius: '50%', padding: 2 }}>
            <Mic size={10} color="white" />
         </div>
      </div>
      
      <button 
        onClick={togglePlay}
        style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', color: "var(--text-primary)" }}
      >
        {isPlaying ? <Square size={16} fill="white" /> : <div style={{ width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: '12px solid white', marginLeft: 4 }} />}
      </button>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
         <div style={{ width: '100%', height: 4, background: 'rgba(var(--overlay-rgb), 0.2)', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: sender === 'client' ? '#10b981' : 'white', borderRadius: 2 }} />
         </div>
         <div style={{ fontSize: '0.65rem', color: 'rgba(var(--overlay-rgb), 0.6)' }}>
            {durationText}
         </div>
      </div>
      
      <audio 
        ref={audioRef} 
        src={src} 
        onTimeUpdate={handleTimeUpdate} 
        onEnded={handleEnded} 
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default function Inbox() {
  const { session } = useOutletContext()
  const location = useLocation()
  const tenant = useTenant()
  const [conversationsList, setConversationsList] = useState([])
  const [activeTab, setActiveTab] = useState('all');
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [broadcastLists, setBroadcastLists] = useState([]);
  const [isListsExpanded, setIsListsExpanded] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedConv, setSelectedConv] = useState(null)
  const [mobileView, setMobileView] = useState('list') // 'list' | 'chat' | 'info'
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [botActive, setBotActive] = useState(true)
  const [showAI, setShowAI] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [pendingFile, setPendingFile] = useState(null)
  
  // Plantillas state
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templateName, setTemplateName] = useState('hello_world')
  const [teamMembers, setTeamMembers] = useState([])
  const [activeInfoTab, setActiveInfoTab] = useState('Contact')
  const [showSimModal, setShowSimModal] = useState(false)
  const [simMessage, setSimMessage] = useState('')
  const [isSimulating, setIsSimulating] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [chatToDelete, setChatToDelete] = useState(null)
  const [selectedChats, setSelectedChats] = useState([])
  const [isSelectMode, setIsSelectMode] = useState(false)
  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingTimerRef = useRef(null)

  const dealInfo = useMemo(() => {
    if (!selectedConv || !selectedConv.rawMessages) return null;
    const aiMsgs = selectedConv.rawMessages.filter(m => m.role === 'agent' || m.role === 'assistant');
    const summaryMsg = aiMsgs.slice().reverse().find(m => {
       const txt = m.content || m.text || '';
       return txt.includes('- Producto y Cantidad:');
    });
    
    if (!summaryMsg) return null;
    const text = summaryMsg.content || summaryMsg.text || '';
    
    const extractField = (regex) => {
       const match = text.match(regex);
       return match ? match[1].trim() : 'N/A';
    };

    return {
       producto: extractField(/- Producto y Cantidad:\s*([^\n]+)/i),
       nombre: extractField(/- Nombre:\s*([^\n]+)/i),
       ubicacion: extractField(/- Ubicación:\s*([^\n]+)/i),
       telefono: extractField(/- Teléfono:\s*([^\n]+)/i),
       fecha: extractField(/- Fecha:\s*([^\n]+)/i)
    };
  }, [selectedConv]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSimulateChat = async (e) => {
    if (e) e.preventDefault()
    if (!simMessage.trim()) return
    
    setIsSimulating(true)
    try {
      let effectiveClientId = tenant.clientId
      
      // If no clientId or if it's the generic Global Admin ID, use the known Trazzos ID directly
      // This bypasses RLS restrictions that block reading the clients table
      if (!effectiveClientId || effectiveClientId === '00000000-0000-0000-0000-000000000000') {
        effectiveClientId = 'c90f532b-0b32-4614-9c21-bbf664213468' // Trazzos Official ID
      }
      
      const { data: conv, error } = await supabase.from('conversations').insert([{
        client_id: effectiveClientId,
        user_phone: 'SIM_' + Math.floor(Math.random() * 10000),
        user_name: 'Cliente de Prueba',
        messages: [{ role: 'user', content: simMessage, timestamp: new Date().toISOString() }],
        needs_human: false
      }]).select().single()
      
      if (conv) {
        setSimMessage('')
        setShowSimModal(false)
        await fetchConversations(true)
        
        // Map and select immediately
        const newConv = {
          id: conv.id,
          name: conv.user_name,
          preview: simMessage,
          time: 'Ahora',
          channel: 'whatsapp',
          unread: false,
          avatar: 'CP',
          bg: '#6366f1',
          tags: [],
          phone: conv.user_phone,
          rawMessages: conv.messages || [],
          needs_human: false
        }
        setSelectedConv(newConv)
        // Reload tenant to stop "Cargando..."
        if (tenant.reload) tenant.reload()

        // TRIGGER THE AI!
        try {
          fetch('/api/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationId: conv.id, clientId: effectiveClientId })
          }).catch(e => console.error("Error calling /api/simulate:", e));
        } catch(e) {
           console.error("Fetch simulate error:", e);
        }

      } else if (error) {
        console.error("Simulation error details:", error)
        alert("Error de base de datos: " + error.message)
      }
    } catch (err) {
      console.error("Simulation exception:", err)
    } finally {
      setIsSimulating(false)
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, selectedConv])

  useEffect(() => {
    if (!tenant.clientId || tenant.isLoading) return

    fetchConversations(false)
    fetchTeamMembers()



    // Realtime listener for new conversations or updates
    const convSub = supabase
      .channel('inbox-conversations-list')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'conversations',
        filter: `client_id=eq.${tenant.clientId}`
      }, (payload) => {
        console.log('Realtime conversation list update', payload)
        fetchConversations(true)
      })
      .subscribe()

    return () => {
      if (convSub) {
        supabase.removeChannel(convSub)
      }
    }
  }, [tenant.clientId, tenant.isLoading])

  useEffect(() => {
    // If we have a target phone from the Router state (e.g., navigated from Leads page)
    if (location.state?.phone && conversationsList.length > 0) {
      const targetConv = conversationsList.find(c => c.phone === location.state.phone);
      if (targetConv && (!selectedConv || selectedConv.id !== targetConv.id)) {
        setSelectedConv(targetConv);
      }
    }
  }, [location.state?.phone, conversationsList])

  useEffect(() => {
    if (selectedConv) {
      setBotActive(selectedConv.needs_human === false || selectedConv.needs_human == null);
      setMessages((selectedConv.rawMessages || []).map((m, i) => {
        let ts = m.timestamp || m.created_at || selectedConv.updated_at || Date.now();
        let safeTs = ts;
        if (typeof ts === 'string' && ts.includes('T') && !ts.endsWith('Z')) {
           safeTs += 'Z';
        }
        let dateObj = (typeof safeTs === 'string' && /^\d{10}$/.test(safeTs)) ? new Date(parseInt(safeTs) * 1000) : ((typeof safeTs === 'number' && safeTs < 20000000000) ? new Date(safeTs * 1000) : new Date(safeTs));
        const mediaUrl = m.media_url || m.url || 
          (m.content?.startsWith('http') ? m.content : null) || 
          (m.text?.startsWith('http') ? m.text : null);
        const inferredType = (mediaUrl && mediaUrl.match(/\.(jpeg|jpg|gif|png|webp)/i)) ? 'image' : ((mediaUrl && mediaUrl.match(/\.(mp3|wav|ogg|oga|aac|m4a|webm)/i)) ? 'audio' : 'text');
        
        let finalContent = m.content || m.text || m.media_url || m.url || '';
        let finalType = m.type || m.message_type || inferredType;
        if (finalContent.includes('[IMAGEN_BASE64_URL]:')) {
            finalType = 'image';
            finalContent = finalContent.replace('[IMAGEN_BASE64_URL]:', '').trim();
        } else if (finalContent.includes('[Multimedia:')) {
            finalContent = '🖼️ [Multimedia no disponible]';
        }

        const dateStr = dateObj.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const timeStr = dateObj.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

        return {
          id: i,
          sender: m.role === 'user' ? 'client' : (m.role === 'assistant' ? 'bot' : 'agent'),
          text: finalContent,
          type: m.media_type || finalType,
          media_url: mediaUrl,
          time: `${dateStr} ${timeStr}`
        };
      }))
    }
  }, [selectedConv])

  useEffect(() => {
    if (!selectedConv?.id) return;

    const convUpdateSub = supabase
      .channel(`inbox-active-conversation-${selectedConv.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'conversations', 
        filter: `id=eq.${selectedConv.id}` 
      }, (payload) => {
        console.log('Realtime active conversation update', payload)
        if (payload.new && payload.new.messages) {
          const updatedConv = payload.new
          setSelectedConv(prev => {
             if (prev && prev.id === updatedConv.id) {
                return { ...prev, ...updatedConv, rawMessages: updatedConv.messages }
             }
             return prev
          })
        }
      })
      .subscribe()

    return () => {
      if (convUpdateSub) {
        supabase.removeChannel(convUpdateSub)
      }
    }
  }, [selectedConv?.id])

  
  const fetchBroadcastLists = async () => {
    if (!tenant.clientId) return;
    try {
      const { data } = await supabase.from('broadcast_lists').select('id, name').eq('client_id', tenant.clientId).order('created_at', { ascending: false });
      if (data) setBroadcastLists(data);
    } catch(e) {}
  };
  useEffect(() => { fetchBroadcastLists(); }, [tenant.clientId]);

  const getConversationFolder = (conv) => {
      if (!conv || !conv.rawMessages) return 'inbox';
      for (let i = conv.rawMessages.length - 1; i >= 0; i--) {
          const m = conv.rawMessages[i];
          if (m.action === 'move_to_inbox') return 'inbox';
          if (m.is_broadcast && m.list_id) return 'broadcast_' + m.list_id;
      }
      return 'inbox';
  };

  const fetchConversations = async (isBackground = false) => {
    if (!tenant.clientId) return
    if (!isBackground) setIsLoading(true)
    
    try {
      let query = supabase
        .from('conversations')
        .select('*, clients(*)')
        .eq('client_id', tenant.clientId)
        .or('archived.eq.false,archived.is.null')
        
      if (!tenant.isAdmin && tenant.session?.user?.id) {
         query = query.eq('assigned_to', tenant.session.user.id)
      }
      
      const { data, error } = await query.order('updated_at', { ascending: false })
      
      if (!error && data) {
        const mapped = data.map((conv) => {
          const displayName = conv.user_name || (conv.user_phone ? `Cl: ${conv.user_phone}` : 'Cliente Nuevo')

            let convTags = []
            if (conv.needs_human) convTags.push({ label: 'Atención Req.', color: 'var(--accent-red, #ef4444)' })
            
            if (conv.department) {
                const dept = conv.department.toUpperCase();
                let color = '#6b7280'; // gray
                if (dept === 'TRAZZOS') color = '#3b82f6'; // blue
                else if (dept === 'TREARQ') color = '#22c55e'; // green
                else if (dept === 'ASESOR') color = '#f97316'; // orange
                convTags.push({ label: dept, color: color });
            }

            if (conv.assigned_to) {
               convTags.push({ label: 'Asignado', color: '#8b5cf6' }) // purple
            } else if (conv.needs_human) {
               convTags.push({ label: 'Sin Asignar', color: '#6b7280' })
            }

            return {
              id: conv.id,
              name: displayName,
              preview: (() => {
                if (!conv.messages || conv.messages.length === 0) return 'Inició conversación...';
                const lastMsg = conv.messages[conv.messages.length - 1];
                let lastMsgText = lastMsg.content || lastMsg.text || 'Inició conversación...';
                if (lastMsgText.includes('[IMAGEN_BASE64_URL]:') || lastMsgText.includes('[SEND_IMAGE:')) {
                  return '📷 Foto';
                } else if (lastMsgText.includes('[SEND_VIDEO:')) {
                  return '🎥 Video';
                } else if (lastMsgText.includes('[Multimedia:')) {
                  return '🖼️ Multimedia';
                } else if (lastMsg.type === 'audio' || lastMsg.type === 'voice') {
                  return '🎙️ Audio';
                }
                return lastMsgText;
              })(),
              time: (() => {
                 if (!conv.updated_at) return '';
                 const safeDateStr = (typeof conv.updated_at === 'string' && conv.updated_at.includes('T') && !conv.updated_at.endsWith('Z')) 
                    ? conv.updated_at + 'Z' 
                    : conv.updated_at;
                 return new Date(safeDateStr).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true });
              })(),
              channel: conv.channel || conv.platform || conv.source || 'whatsapp', 
              unread: conv.messages && conv.messages.length > 0 && conv.messages[conv.messages.length - 1].role === 'user',
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff&bold=true`,
              bg: '#6366f1',
              tags: convTags,
              intent: 'consulta',
              botHandled: !conv.needs_human,
              phone: conv.user_phone,
              client: conv.clients,
              rawMessages: conv.messages || [],
              needs_human: conv.needs_human,
              assigned_to: conv.assigned_to,
              department: conv.department,
              archived: conv.archived
            }
          })
          setConversationsList(mapped)
        if (mapped.length > 0) {
          setSelectedConv(prev => {
             if (!prev) return mapped[0];
             const updatedCurrent = mapped.find(c => c.id === prev.id);
             return updatedCurrent || prev;
          });
        }
      }
    } catch (err) {
      console.error("Error fetching conversations:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTeamMembers = async () => {
    const { data } = await supabase
      .from('team_members')
      .select('user_id, full_name')
      .eq('client_id', tenant.clientId)
    if (data) setTeamMembers(data)
  }

  const assignAdvisor = async (conversationId, userId) => {
    const { error } = await supabase
      .from('conversations')
      .update({ assigned_to: userId })
      .eq('id', conversationId)
    
    // Also sync this assignment to the corresponding lead
    if (selectedConv?.user_phone) {
      await supabase
        .from('leads')
        .update({ assigned_to: userId })
        .eq('client_id', tenant.clientId)
        .eq('phone', selectedConv.user_phone)
    }
    
    if (error) {
      console.error("Assign Error:", error);
      alert("Error al asignar asesor: " + error.message);
    } else {
      fetchConversations(true)
      setSelectedConv(prev => ({ ...prev, assigned_to: userId }))
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() && !pendingFile) return
    if (!selectedConv) return

    // Meta 24-hour window validation
    if (selectedConv.channel === 'whatsapp' && !selectedConv.phone.startsWith('SIM_')) {
      const lastUserMsg = [...(selectedConv.rawMessages || [])].reverse().find(m => m.role === 'user');
      if (lastUserMsg) {
        const lastDate = new Date(lastUserMsg.timestamp || lastUserMsg.time || 0);
        const hoursPassed = (new Date() - lastDate) / (1000 * 60 * 60);
        if (hoursPassed > 24) {
          alert('⚠️ POLÍTICA DE WHATSAPP (META):\n\nHan pasado más de 24 horas desde el último mensaje de este cliente. Meta bloquea el envío de mensajes de texto libres fuera de esta ventana de 24 horas.\n\nPara contactarlo nuevamente, debes usar una Plantilla Aprobada (Template) o esperar a que el cliente escriba de nuevo.');
          return;
        }
      } else {
         // Si no hay mensajes del usuario, también aplica la regla de 24h (solo plantillas inician chat)
         alert('⚠️ POLÍTICA DE WHATSAPP (META):\n\nNo puedes iniciar una conversación con texto libre. Debes esperar a que el cliente te escriba o usar una Plantilla Aprobada (Template).');
         return;
      }
    }
    
    const isSim = selectedConv.phone.startsWith('SIM_')
    const messageRole = isSim ? 'user' : 'agent'
    const textMsg = newMessage

    const messageObj = {
      role: messageRole,
      content: textMsg,
      timestamp: new Date().toISOString()
    }

    const { error } = await supabase
      .from('conversations')
      .update({ 
        messages: [...selectedConv.rawMessages, messageObj],
        updated_at: new Date().toISOString(),
        needs_human: true // Al responder el asesor, mantener la IA apagada
      })
      .eq('id', selectedConv.id)

    if (!error) {
       setNewMessage('')
       
       if (isSim) {
         try {
           await fetch('/api/simulate', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
               conversationId: selectedConv.id,
               clientId: tenant.clientId || 'c90f532b-0b32-4614-9c21-bbf664213468'
             })
           });
         } catch (e) { console.error('Sim Error', e); }
       } else {
         // Add to outbox history
         await supabase.from('outbox').insert([{
           client_id: tenant.clientId,
           phone: selectedConv.phone,
           message: textMsg,
           user_id: session.user.id
         }])

         // Call Vercel API to actually send the WhatsApp message
         try {
           const res = await fetch('/api/send', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
               client_id: tenant.clientId,
               phone: selectedConv.phone,
               message: textMsg,
               type: 'text',
               channel: selectedConv.channel
             })
           });
           const apiData = await res.json();
           if (apiData.meta_message_id) {
               const updatedMsgs = [...selectedConv.rawMessages, messageObj];
               updatedMsgs[updatedMsgs.length - 1].sent_meta = [{ id: apiData.meta_message_id, type: 'text', content: textMsg }];
               await supabase.from('conversations').update({ messages: updatedMsgs }).eq('id', selectedConv.id);
           }
         } catch (apiErr) {
           console.error('Error sending message via API:', apiErr);
         }
       }
    }
  }

  const handleSendTemplate = async (e) => {
    e.preventDefault()
    if (!templateName.trim() || !selectedConv) return
    
    const textMsg = `[Plantilla Enviada: ${templateName}]`
    const messageObj = {
      role: 'agent',
      content: textMsg,
      timestamp: new Date().toISOString()
    }

    const { error } = await supabase
      .from('conversations')
      .update({ 
        messages: [...selectedConv.rawMessages, messageObj],
        updated_at: new Date().toISOString(),
        needs_human: true
      })
      .eq('id', selectedConv.id)

    if (!error) {
       setShowTemplateModal(false)
       try {
         const res = await fetch('/api/send', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             client_id: tenant.clientId,
             phone: selectedConv.phone,
             message: templateName.trim(),
             type: 'template',
             channel: selectedConv.channel
           })
         });
         const apiData = await res.json();
         if (apiData.meta_message_id) {
             const updatedMsgs = [...selectedConv.rawMessages, messageObj];
             updatedMsgs[updatedMsgs.length - 1].sent_meta = [{ id: apiData.meta_message_id, type: 'template', content: templateName }];
             await supabase.from('conversations').update({ messages: updatedMsgs }).eq('id', selectedConv.id);
             alert(`Plantilla "${templateName}" enviada con éxito. La ventana de 24 horas se reabrirá cuando el cliente responda.`);
         } else {
             alert(`Error al enviar plantilla: ${apiData.error || 'Desconocido'}`);
         }
       } catch (apiErr) {
         console.error('Error sending template:', apiErr);
         alert('Hubo un error de conexión al enviar la plantilla.');
       }
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach(track => track.stop())
        await uploadAudio(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.error("Microphone access denied:", err)
      alert("Para grabar audios, por favor permite el acceso al micrófono en tu navegador.")
    }
  }

  const stopRecording = (cancel = false) => {
    if (mediaRecorderRef.current && isRecording) {
      if (cancel) {
        mediaRecorderRef.current.onstop = () => {
          mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop())
        }
      }
      mediaRecorderRef.current.stop()
      clearInterval(recordingTimerRef.current)
      setIsRecording(false)
      setRecordingTime(0)
    }
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const uploadAudio = async (audioBlob) => {
    if (!selectedConv) return
    setIsLoading(true)
    try {
      const fileName = `voice_${Date.now()}.ogg`
      const { data, error } = await supabase.storage
        .from('whatsapp_media')
        .upload(fileName, audioBlob, { contentType: 'audio/ogg' })
        
      if (error) throw error

      const { data: publicUrlData } = supabase.storage
        .from('whatsapp_media')
        .getPublicUrl(fileName)

      const audioUrl = publicUrlData.publicUrl
      
      const messageObj = {
        role: 'agent',
        content: audioUrl,
        type: 'audio',
        timestamp: new Date().toISOString()
      }

      const { error: dbError } = await supabase
        .from('conversations')
        .update({ 
          messages: [...selectedConv.rawMessages, messageObj],
          updated_at: new Date().toISOString(),
          needs_human: true
        })
        .eq('id', selectedConv.id)

      if (!dbError) {
        // Enviar a la API de WhatsApp
        try {
          const apiRes = await fetch('/api/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: tenant.clientId,
              phone: selectedConv.phone,
              message: audioUrl,
              type: 'audio',
              channel: selectedConv.channel
            })
          });
          const apiData = await apiRes.json();
          if (apiData.meta_message_id) {
              const updatedMsgs = [...selectedConv.rawMessages, messageObj];
              updatedMsgs[updatedMsgs.length - 1].sent_meta = [{ id: apiData.meta_message_id, type: 'audio', content: audioUrl }];
              await supabase.from('conversations').update({ messages: updatedMsgs }).eq('id', selectedConv.id);
          }
        } catch (apiErr) {
          console.error('Error sending audio via API:', apiErr);
        }
        
        fetchConversations(true)
      } else {
        throw dbError
      }
    } catch (err) {
      console.error("Upload error:", err)
      alert("Error al subir el audio: " + err.message)
    } finally {
      setIsLoading(false)
    }
  }
  const handleFileUpload = async (eOrFile) => {
    let file;
    if (eOrFile?.target?.files) file = eOrFile.target.files[0];
    else if (eOrFile instanceof File) file = eOrFile;
    
    if (!file || !selectedConv) return
    setIsLoading(true)
    try {
      // Read file as base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });

      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64,
          fileName,
          contentType: file.type
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      const fileUrl = data.url;
      
      const getMediaType = (mimeType, fName) => {
        if (!mimeType) mimeType = '';
        const m = mimeType.toLowerCase();
        if (m.startsWith('image/')) return 'image';
        if (m.startsWith('video/')) return 'video';
        if (m.startsWith('audio/')) return 'audio';
        
        if (fName) {
          const ext = fName.split('.').pop().toLowerCase();
          if (['jpeg','jpg','gif','png','webp'].includes(ext)) return 'image';
          if (['mp4','webm','ogg','avi','mov'].includes(ext)) return 'video';
          if (['mp3','wav','oga','aac','m4a','amr'].includes(ext)) return 'audio';
        }
        return 'document';
      };
      const mediaType = getMediaType(file.type, file.name);

      const messageObj = {
        role: 'agent',
        content: fileUrl,
        type: mediaType,
        timestamp: new Date().toISOString()
      }

      const { error: dbError } = await supabase
        .from('conversations')
        .update({ 
          messages: [...selectedConv.rawMessages, messageObj],
          updated_at: new Date().toISOString(),
          needs_human: true
        })
        .eq('id', selectedConv.id)

      if (!dbError) {
        // Enviar a la API de WhatsApp
        try {
          const apiRes = await fetch('/api/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: tenant.clientId,
              phone: selectedConv.phone,
              message: fileUrl,
              type: mediaType,
              channel: selectedConv.channel
            })
          });
          const apiData = await apiRes.json();
          if (apiData.meta_message_id) {
              const updatedMsgs = [...selectedConv.rawMessages, messageObj];
              updatedMsgs[updatedMsgs.length - 1].sent_meta = [{ id: apiData.meta_message_id, type: mediaType, content: fileUrl }];
              await supabase.from('conversations').update({ messages: updatedMsgs }).eq('id', selectedConv.id);
          }
        } catch (apiErr) {
          console.error('Error sending file via API:', apiErr);
        }
        
        fetchConversations(true)
      } else {
        throw dbError
      }
    } catch (err) {
      console.error("Upload error:", err)
      alert("Error al subir el archivo: " + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteMessage = async (msgIndex) => {
    if (!selectedConv || !window.confirm("¿Seguro que deseas eliminar este mensaje del CRM? (No se borrará del WhatsApp del cliente)")) return;
    try {
      const updatedMessages = [...selectedConv.rawMessages];
      updatedMessages.splice(msgIndex, 1);
      
      const { error } = await supabase
        .from('conversations')
        .update({ messages: updatedMessages })
        .eq('id', selectedConv.id);
        
      if (!error) {
        setSelectedConv({...selectedConv, rawMessages: updatedMessages});
        fetchConversations(true);
      } else {
        alert("Error al eliminar mensaje: " + error.message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportChats = async () => {
    if (selectedChats.length === 0) return;
    
    const chatsToExport = conversationsList.filter(c => selectedChats.includes(c.id));
    
    let exportText = `=== EXPORTACIÓN DE CHATS (${new Date().toLocaleString()}) ===\n\n`;
    
    chatsToExport.forEach(chat => {
       exportText += `--- CHAT CON: ${chat.name} (${chat.phone}) ---\n`;
       exportText += `Plataforma: ${chat.channel} | Último mensaje: ${chat.time}\n\n`;
       if (chat.rawMessages) {
          chat.rawMessages.forEach(m => {
             const sender = m.role === 'user' ? 'Cliente' : 'Agente/IA';
             exportText += `[${sender}]: ${m.content || m.text || (m.media_url ? '[MULTIMEDIA]' : '')}\n`;
          });
       }
       exportText += `\n-------------------------------------------------\n\n`;
    });

    const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Exportacion_Chats_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setSelectedChats([]);
    alert(`Se exportaron ${chatsToExport.length} chat(s) exitosamente.`);
  };

  const handleMoveToRemarketing = async () => {
    if (selectedChats.length === 0) return;
    
    const chatsToMove = conversationsList.filter(c => selectedChats.includes(c.id));

    const inserts = chatsToMove.map(c => ({
       client_id: tenant.clientId,
       full_name: c.name,
       phone: c.phone,
       last_purchase_date: new Date().toISOString(),
       status: 'pending'
    }));

    const { error } = await supabase.from('remarketing_leads').insert(inserts);
    if (error) {
       alert("Error al mover a re-marketing: " + error.message);
    } else {
       alert(`${chatsToMove.length} chat(s) movidos exitosamente a Re-marketing.`);
       setSelectedChats([]);
    }
  };

  const handleEditMessage = async (msgIndex, currentText) => {
    if (!selectedConv) return;
    const newText = window.prompt("Edita el texto del mensaje:", currentText);
    if (newText === null || newText === currentText) return; // Cancelled or no change

    try {
      const updatedMessages = [...selectedConv.rawMessages];
      updatedMessages[msgIndex] = { ...updatedMessages[msgIndex], content: newText, text: newText };
      
      const { error } = await supabase
        .from('conversations')
        .update({ messages: updatedMessages })
        .eq('id', selectedConv.id);
        
      if (!error) {
        setSelectedConv({...selectedConv, rawMessages: updatedMessages});
        fetchConversations(true);
      } else {
        alert("Error al editar mensaje: " + error.message);
      }
    } catch (e) {
      console.error(e);
    }
  };


  return (
    <div className="inbox-container">
      <style>{`
        .inbox-layout {
          display: grid;
          grid-template-columns: ${showRightPanel ? '250px 330px 1fr 340px' : '250px 330px 1fr'};
          height: calc(100vh - 64px);
          overflow: hidden;
          background: transparent;
        }

        .inbox-sidebar {
          background: rgba(var(--overlay-rgb), 0.02);
          backdrop-filter: blur(20px);
          border-right: 1px solid var(--glass-border);
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .chat-area {
          background: rgba(var(--overlay-rgb), 0.01);
          border-right: 1px solid var(--glass-border);
          display: flex;
          flex-direction: column;
          height: 100%;
          min-width: 0;
          overflow: hidden;
        }

        .contact-panel {
          background: rgba(var(--overlay-rgb), 0.01);
          height: 100%;
          overflow-y: auto;
          padding: 20px;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1280px) {
          .inbox-layout {
            grid-template-columns: 280px 1fr 300px;
          }
        }

        @media (max-width: 1024px) {
          .inbox-layout {
            grid-template-columns: 300px 1fr;
          }
          .contact-panel {
            display: none; /* Hide info panel on tablets */
          }
        }

        @media (max-width: 768px) {
          .inbox-sidebar { width: 100%; }
          .chat-area { width: 100%; }
          .contact-panel { width: 100%; padding: 20px; }
        }

        .conversation-item {
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .conversation-item:hover {
          background: rgba(var(--overlay-rgb), 0.05);
        }
        .conversation-item.active {
          background: rgba(99, 102, 241, 0.15);
          border-left: 3px solid var(--primary-500);
        }
        
        .chat-msg-bubble {
          max-width: 80%;
          padding: 12px 16px;
          margin-bottom: 4px;
          line-height: 1.5;
          font-size: 0.9rem;
        }
        
        .msg-client {
          background: rgba(var(--overlay-rgb), 0.05);
          border: 1px solid var(--glass-border);
          border-radius: 4px 16px 16px 16px;
          align-self: flex-start;
        }
        
        .msg-agent {
          background: var(--primary-600);
          border-radius: 16px 4px 16px 16px;
          align-self: flex-end;
          box-shadow: 0 4px 12px -4px rgba(99, 102, 241, 0.4);
        }
      `}</style>

      <div className="inbox-layout" style={{ gridTemplateColumns: showRightPanel ? '240px 320px 1fr 340px' : '240px 320px 1fr' }}>

          
          {/* Left Sidebar (Folders) */}
          <div className="inbox-sidebar folders-panel" style={{ width: '250px', padding: '24px 16px', background: 'rgba(var(--overlay-rgb), 0.03)', borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column' }}>
             <h2 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 800, opacity: 0.5, marginBottom: '20px', paddingLeft: '8px', color: 'var(--text-primary)' }}>General</h2>
             
             <div 
               style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '14px', cursor: 'pointer', marginBottom: '8px', transition: 'all 0.2s', background: activeFolder === 'inbox' ? 'var(--primary-color)' : 'transparent', color: activeFolder === 'inbox' ? '#fff' : 'var(--text-primary)' }}
               onClick={() => setActiveFolder('inbox')}
               onMouseEnter={(e) => { if(activeFolder !== 'inbox') e.currentTarget.style.background = 'rgba(var(--overlay-rgb), 0.05)' }}
               onMouseLeave={(e) => { if(activeFolder !== 'inbox') e.currentTarget.style.background = 'transparent' }}
             >
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <MessageSquare size={18} opacity={activeFolder === 'inbox' ? 1 : 0.7} />
                 <span style={{ fontWeight: activeFolder === 'inbox' ? 600 : 500, fontSize: '0.95rem' }}>Entrada</span>
               </div>
               <span style={{ fontSize: '0.75rem', fontWeight: 700, background: activeFolder === 'inbox' ? 'rgba(255,255,255,0.25)' : 'var(--primary-700)', color: activeFolder === 'inbox' ? '#fff' : 'var(--primary-color)', padding: '2px 8px', borderRadius: '12px' }}>
                 {conversationsList.filter(c => getConversationFolder(c) === 'inbox' && !c.archived).length}
               </span>
             </div>

             <div 
               style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '14px', cursor: 'pointer', marginBottom: '8px', transition: 'all 0.2s', background: activeFolder === 'assigned' ? 'var(--primary-color)' : 'transparent', color: activeFolder === 'assigned' ? '#fff' : 'var(--text-primary)' }}
               onClick={() => setActiveFolder('assigned')}
               onMouseEnter={(e) => { if(activeFolder !== 'assigned') e.currentTarget.style.background = 'rgba(var(--overlay-rgb), 0.05)' }}
               onMouseLeave={(e) => { if(activeFolder !== 'assigned') e.currentTarget.style.background = 'transparent' }}
             >
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <UserCheck size={18} opacity={activeFolder === 'assigned' ? 1 : 0.7} />
                 <span style={{ fontWeight: activeFolder === 'assigned' ? 600 : 500, fontSize: '0.95rem' }}>Asignadas</span>
               </div>
               <span style={{ fontSize: '0.75rem', fontWeight: 700, background: activeFolder === 'assigned' ? 'rgba(255,255,255,0.25)' : 'rgba(var(--overlay-rgb), 0.1)', color: activeFolder === 'assigned' ? '#fff' : 'var(--text-primary)', padding: '2px 8px', borderRadius: '12px' }}>
                 {conversationsList.filter(c => c.assigned_to === tenant.session?.user?.id && !c.archived).length}
               </span>
             </div>

             <h2 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 800, opacity: 0.5, marginTop: '32px', marginBottom: '16px', paddingLeft: '8px', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setIsListsExpanded(!isListsExpanded)}>
                Difusiones
                <ChevronDown size={16} style={{ transform: isListsExpanded ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
             </h2>
             
             {isListsExpanded && (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', maxHeight: '300px', paddingRight: '4px' }}>
                 {broadcastLists.map(list => {
                   const fId = 'broadcast_' + list.id;
                   const isActive = activeFolder === fId;
                   const count = conversationsList.filter(c => getConversationFolder(c) === fId).length;
                   return (
                     <div 
                       key={list.id}
                       style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', background: isActive ? 'rgba(var(--primary-rgb), 0.15)' : 'transparent', color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)' }}
                       onClick={() => setActiveFolder(fId)}
                       onMouseEnter={(e) => { if(!isActive) e.currentTarget.style.background = 'rgba(var(--overlay-rgb), 0.05)' }}
                       onMouseLeave={(e) => { if(!isActive) e.currentTarget.style.background = 'transparent' }}
                     >
                       <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                         <Megaphone size={16} opacity={isActive ? 1 : 0.6} />
                         <span style={{ fontSize: '0.85rem', fontWeight: isActive ? 600 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{list.name}</span>
                       </div>
                       {count > 0 && <span style={{ fontSize: '0.7rem', fontWeight: 700, background: isActive ? 'var(--primary-color)' : 'rgba(var(--overlay-rgb), 0.1)', color: isActive ? '#fff' : 'inherit', padding: '2px 6px', borderRadius: '10px' }}>{count}</span>}
                     </div>
                   )
                 })}
                 {broadcastLists.length === 0 && <div style={{ fontSize: '0.8rem', opacity: 0.5, padding: '8px', textAlign: 'center' }}>No hay listas</div>}
               </div>
             )}
          </div>

          {/* Sidebar */}
        <div className={`inbox-sidebar inbox-panel-container ${mobileView !== 'list' ? 'mobile-hidden' : ''}`}>
          <div className="inbox-sidebar-header" style={{ padding: '20px' }}>
             <div className="flex justify-between items-center mb-4">
               <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Inbox</h2>
             </div>
             <div className="search-bar" style={{ padding: '8px 12px' }}>
               <Search size={16} />
               <input 
                  type="text" 
                  placeholder="Buscar..." 
                  style={{ fontSize: '0.85rem' }} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
               />
             </div>
             <div style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto', paddingBottom: 4 }}>
                {['all', 'whatsapp', 'instagram', 'messenger', 'archived'].map(tab => (
                   <button 
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{ 
                         background: activeTab === tab ? 'var(--primary-600)' : 'rgba(var(--overlay-rgb), 0.05)',
                         border: 'none', borderRadius: 12, padding: '4px 10px', fontSize: '0.7rem',
                         color: activeTab === tab ? 'white' : 'var(--text-secondary)', cursor: 'pointer',
                         textTransform: 'capitalize', whiteSpace: 'nowrap'
                      }}
                   >
                      {tab === 'all' ? 'Todos' : tab === 'archived' ? 'Archivados' : tab}
                   </button>
                ))}
             </div>
              
              {selectedChats.length > 0 && (
                 <div style={{ marginTop: 12, padding: '8px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-400)', textAlign: 'center' }}>
                       {selectedChats.length} chat(s) seleccionados
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                       <button className="btn btn-secondary btn-sm" style={{ flex: 1, padding: '4px 8px', fontSize: '0.75rem' }} onClick={handleExportChats}>
                          <Download size={14} style={{ marginRight: 4 }} /> Exportar
                       </button>
                       <button className="btn btn-primary btn-sm" style={{ flex: 1, padding: '4px 8px', fontSize: '0.75rem' }} onClick={handleMoveToRemarketing}>
                          <Megaphone size={14} style={{ marginRight: 4 }} /> Re-marketing
                       </button>
                    </div>
                 </div>
              )}
             <button 
               className="btn btn-primary btn-sm" 
               style={{ 
                 width: '100%', 
                 marginTop: 12, 
                 background: isSelectMode ? 'rgba(var(--overlay-rgb), 0.1)' : 'var(--primary-600)',
                 color: isSelectMode ? 'var(--text-secondary)' : 'white',
                 fontWeight: 700,
                 border: isSelectMode ? '1px solid var(--glass-border)' : 'none'
               }}
               onClick={() => {
                 setIsSelectMode(!isSelectMode);
                 if (isSelectMode) setSelectedChats([]); // clear selection when canceling
               }}
             >
               {isSelectMode ? <Close size={14} /> : <CheckSquare size={14} />} {isSelectMode ? 'Cancelar selección' : 'Seleccionar chats'}
             </button>
          </div>
          
          <div className="conversation-list" style={{ padding: '0 12px 12px', flex: 1, overflowY: 'auto' }}>
            {isLoading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                 <div className="spinner" style={{ margin: '0 auto 12px' }} />
                 <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Cargando...</p>
              </div>
            ) : conversationsList
                .filter(c => activeTab === 'archived' ? c.archived === true : (c.archived !== true && (activeTab === 'all' || c.channel === activeTab)))
                .filter(c => {
                   if (!searchQuery) return true;
                   const q = searchQuery.toLowerCase();
                   if (c.name && c.name.toLowerCase().includes(q)) return true;
                   if (c.phone && c.phone.includes(q)) return true;
                   if (c.preview && c.preview.toLowerCase().includes(q)) return true;
                   if (c.rawMessages && c.rawMessages.some(m => (m.content || m.text || '').toLowerCase().includes(q))) return true;
                   return false;
                })
                .map(c => (
              <div 
                key={c.id} 
                className={`conversation-item ${selectedConv?.id === c.id ? 'active' : ''}`}
                onClick={() => { setSelectedConv(c); setMobileView('chat'); }}
                style={{ padding: '12px', borderRadius: 12, marginBottom: 4, display: 'flex', alignItems: 'center' }}
              >
                 {isSelectMode && (
                   <div 
                     style={{ 
                       marginRight: 10, 
                       display: 'flex', 
                       alignItems: 'center', 
                       justifyContent: 'center',
                       width: 20, 
                       height: 20, 
                       borderRadius: '50%',
                       border: `2px solid ${selectedChats.includes(c.id) ? 'var(--primary-400)' : 'var(--glass-border)'}`,
                       background: selectedChats.includes(c.id) ? 'var(--primary-400)' : 'transparent',
                       cursor: 'pointer',
                       flexShrink: 0,
                       transition: 'all 0.2s ease'
                     }}
                     onClick={(e) => {
                        e.stopPropagation();
                        if (selectedChats.includes(c.id)) setSelectedChats(selectedChats.filter(id => id !== c.id));
                        else setSelectedChats([...selectedChats, c.id]);
                     }}
                   >
                     {selectedChats.includes(c.id) && <Check size={12} color="white" strokeWidth={3} />}
                   </div>
                 )}
                 <div className="avatar sm" style={{ background: c.bg, position: 'relative', flexShrink: 0, overflow: 'hidden' }}>
                    {c.avatar?.startsWith('http') ? <img src={c.avatar} style={{width:'100%', height:'100%', objectFit:'cover'}} alt="avatar" /> : c.avatar}
                    {c.assigned_to && (
                       <div style={{ position: 'absolute', bottom: -2, right: -2, background: 'var(--primary-600)', width: 14, height: 14, borderRadius: '50%', border: '1px solid var(--bg-secondary)', fontSize: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: "var(--text-primary)" }}>
                          {teamMembers.find(m => m.user_id === c.assigned_to)?.full_name?.substring(0, 2).toUpperCase()}
                       </div>
                    )}
                 </div>
                 <div className="conv-content" style={{ marginLeft: 12, minWidth: 0, flex: 1 }}>
                    <div className="flex justify-between items-center">
                       <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                          {c.unread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 8px rgba(59, 130, 246, 0.8)' }} />}
                       </div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: c.unread ? '#3b82f6' : 'var(--text-tertiary)', fontWeight: c.unread ? 700 : 400, flexShrink: 0 }}>
                         {c.channel === 'instagram' ? <Instagram size={12} /> : c.channel === 'facebook' ? <Facebook size={12} /> : <MessageCircle size={12} />}
                         <span>{c.time}</span>
                       </div>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.preview}</p>
                    {c.tags && c.tags.length > 0 && (
                      <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
                         {c.tags.map((t, i) => {
                            const isString = typeof t === 'string';
                            const label = isString ? t : t.label;
                            const color = isString ? '#f59e0b' : (t.color || '#f59e0b');
                            
                            return (
                              <span key={i} className="badge" style={{ fontSize: '0.6rem', backgroundColor: `${color}20`, color: color, borderColor: `${color}40`, border: '1px solid' }}>
                                 {label === 'Asignado' ? `Asignado a: ${teamMembers.find(m => m.user_id === c.assigned_to)?.full_name || 'Asesor'}` : label}
                              </span>
                            );
                         })}
                      </div>
                    )}
                  </div>
               </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`chat-area inbox-panel-container ${mobileView !== 'chat' ? 'mobile-hidden' : ''}`}>
          {selectedConv ? (
            <>
              <div className="chat-header" style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center' }}>
                 <button 
                   className="mr-3 p-2 rounded-full mobile-only"
                   onClick={() => { setSelectedConv(null); setMobileView('list'); }}
                   style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                 >
                   <ChevronRight size={24} style={{ transform: 'rotate(180deg)' }} />
                 </button>
                 <div className="avatar md" style={{ background: selectedConv.bg, width: 36, height: 36, flexShrink: 0, overflow: 'hidden' }}>
                    {selectedConv.avatar?.startsWith('http') ? <img src={selectedConv.avatar} style={{width:'100%', height:'100%', objectFit:'cover'}} alt="avatar" /> : selectedConv.avatar}
                 </div>
                 <div style={{ marginLeft: 12, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedConv.name}</span>
                      <CheckCircle2 size={14} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
                    </div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4, textTransform: 'capitalize' }}>
                      {selectedConv.channel === 'instagram' ? <Instagram size={10} /> : selectedConv.channel === 'facebook' ? <Facebook size={10} /> : <MessageCircle size={10} />}
                      {selectedConv.channel} | Cliente
                    </p>
                 </div>
                  <div className="ml-auto flex items-center gap-3">
                     <div className="hidden sm:flex" style={{ alignItems: 'center' }}>
                         <select 
                             className="badge-select"
                             value={selectedConv.assigned_to || ''} 
                             onChange={async (e) => {
                                 const val = e.target.value || null;
                                 assignAdvisor(selectedConv.id, val);
                             }}
                             style={{ 
                                 background: 'rgba(var(--overlay-rgb), 0.05)', 
                                 border: '1px solid var(--glass-border)',
                                 color: "var(--text-secondary)",
                                 borderRadius: 8,
                                 fontSize: '0.75rem',
                                 padding: '4px 8px',
                                 fontWeight: 600,
                                 marginRight: '8px'
                             }}
                         >
                             <option value="" style={{ background: '#111' }}>Asignar Asesor...</option>
                             {teamMembers.map(m => (
                                 <option key={m.user_id} value={m.user_id} style={{ background: '#111' }}>{m.full_name}</option>
                             ))}
                         </select>
                     </div>
                     <div className="hidden sm:flex" style={{ alignItems: 'center', gap: 8, padding: '4px 12px', background: 'rgba(var(--overlay-rgb), 0.03)', borderRadius: 100, border: '1px solid var(--glass-border)' }}>
                        <Bot size={14} style={{ color: botActive ? 'var(--accent-emerald)' : 'var(--text-tertiary)' }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>AI</span>
                        <div className={`toggle-switch small ${botActive ? 'active' : ''}`} onClick={async () => {
                          const newState = !botActive;
                          setBotActive(newState);
                          if (selectedConv) {
                            selectedConv.needs_human = !newState;
                            const { error } = await supabase.from('conversations').update({ needs_human: !newState }).eq('id', selectedConv.id);
                            if (error) console.error("Error updating AI status", error);
                          }
                        }} />
                     </div>
                     <div className="flex gap-1">
                        <button className="btn btn-secondary btn-sm mobile-only" onClick={() => setMobileView('info')}><User size={14} /></button>
                        <a href={`tel:${selectedConv?.phone}`} className="btn btn-secondary btn-sm"><Phone size={14} /></a>
                        <button 
                           className="btn btn-secondary btn-sm"
                           title={selectedConv?.archived ? "Desarchivar" : "Archivar"}
                           onClick={async () => {
                              const newArchivedState = !selectedConv.archived;
                              const { error } = await supabase.from('conversations').update({ archived: newArchivedState }).eq('id', selectedConv.id);
                              if (!error) {
                                  setSelectedConv({...selectedConv, archived: newArchivedState});
                                  fetchConversations(true);
                              }
                           }}
                        >
                           <Archive size={14} style={{ color: selectedConv?.archived ? 'var(--accent-amber)' : 'inherit' }} />
                        </button>
                        {tenant.isAdmin && (
                          <button 
                             className="btn btn-secondary btn-sm"
                             title="Eliminar Chat Completo"
                             style={{ color: '#ef4444', borderColor: '#ef444420', background: '#ef444410' }}
                             onClick={() => {
                                setChatToDelete(selectedConv);
                                setShowDeleteModal(true);
                             }}
                          >
                             <Trash2 size={14} />
                          </button>
                        )}
                     </div>
                  </div>
              </div>

              <div className="chat-messages" style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {messages.map(m => (
                    <div key={m.id} className={`chat-msg-bubble ${m.sender === 'client' ? 'msg-client' : 'msg-agent'}`}>
                        {m.type === 'image' || (m.text && m.text.startsWith('http') && !m.text.includes(' ') && m.text.match(/\.(jpeg|jpg|gif|png|webp)/i)) ? (
                          <div>
                            <img src={m.media_url || m.text} alt="Shared" style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 4 }} />
                            {m.media_url && m.text && m.text !== m.media_url && m.text !== '📷 Imagen recibida' && (
                              <p style={{ margin: '4px 0 0 0', fontStyle: 'italic', fontSize: '0.8rem' }}>{m.text}</p>
                            )}
                          </div>
                        ) : m.type === 'audio' || m.type === 'voice' ? (
                          <div>
                            {m.media_url && <VoiceNotePlayer src={m.media_url} sender={m.sender} durationText="Audio" avatar={m.sender === 'client' ? selectedConv?.avatar : null} />}
                            <p style={{ margin: 0, wordBreak: 'break-word', fontStyle: 'italic', opacity: 0.8, fontSize: '0.8rem' }}>{m.text?.startsWith('http') ? '' : m.text?.replace(/^\[Nota de Voz del Cliente\]:\s*/, '')}</p>
                          </div>
                        ) : m.type === 'video' || (m.text && m.text.startsWith('http') && !m.text.includes(' ') && m.text.match(/\.(mp4|webm|ogg)/i)) ? (
                          <div>
                            <video controls src={m.media_url || m.text} style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 4 }} />
                            {m.text && m.text !== m.media_url && m.text.replace(/\[Video recibido:.*?\]/gi, '').trim() && (
                              <p style={{ margin: '4px 0 0 0', fontStyle: 'italic', fontSize: '0.8rem' }}>
                                {m.text.replace(/\[Video recibido:.*?\]/gi, '').trim()}
                              </p>
                            )}
                          </div>
                        ) : m.type === 'document' ? (
                          <a href={m.media_url || m.text} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Ver Documento</a>
                        ) : (
                          <div>
                            {(() => {
                              // Extract all image URLs
                              const imgMatches = [];
                              const imgRegex = /\[SEND_IMAGE:\s*(https?:\/\/[^\]]+)\]/gi;
                              let match;
                              while ((match = imgRegex.exec(m.text || '')) !== null) {
                                imgMatches.push(match[1]);
                              }

                              // Extract all video URLs
                              const vidMatches = [];
                              const vidRegex = /\[SEND_VIDEO:\s*(https?:\/\/[^\]]+)\]/gi;
                              let vMatch;
                              while ((vMatch = vidRegex.exec(m.text || '')) !== null) {
                                vidMatches.push(vMatch[1]);
                              }

                              const cleanMsgText = m.text
                                ?.replace(/\[SEND_IMAGE:\s*(https?:\/\/[^\]]+)\]/gi, '')
                                ?.replace(/\[SEND_VIDEO:\s*(https?:\/\/[^\]]+)\]/gi, '')
                                ?.trim();
                              
                              return (
                                <>
                                  {cleanMsgText && <p style={{ margin: 0, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{cleanMsgText}</p>}
                                  {imgMatches.map((url, idx) => (
                                    <img key={idx} src={url} alt="Shared" style={{ maxWidth: '100%', borderRadius: 8, marginTop: 8, display: 'block' }} />
                                  ))}
                                  {vidMatches.map((url, idx) => (
                                    <video key={idx} controls src={url} style={{ maxWidth: '100%', borderRadius: 8, marginTop: 8, display: 'block' }} />
                                  ))}
                                </>
                              );
                            })()}
                          </div>
                        )}
                        <div style={{ fontSize: '0.6rem', opacity: 0.6, marginTop: 4, textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
                          {m.sender === 'agent' && (
                            <>
                              <span title="Editar en CRM" style={{ cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => handleEditMessage(messages.indexOf(m), m.text || m.content || '')}>✏️</span>
                              {tenant.isAdmin && (
                                <span title="Eliminar del CRM" style={{ cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => handleDeleteMessage(messages.indexOf(m))}>🗑️</span>
                              )}
                            </>
                          )}
                          {m.time}
                        </div>
                    </div>
                  ))}
                 <div ref={messagesEndRef} />
              </div>

              <div className="chat-input-area" style={{ padding: '12px 0', background: 'rgba(0,0,0,0.2)', width: '100%' }}>
                  <form onSubmit={handleSendMessage} style={{ background: 'rgba(var(--overlay-rgb), 0.03)', border: '1px solid var(--glass-border)', borderRadius: '0', padding: '4px 16px', display: 'flex', alignItems: 'center', width: '100%' }}>
                     {isRecording ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '8px' }}>
                           <div className="pulse-red" style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                           <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>Grabando... {formatTime(recordingTime)}</span>
                        </div>
                     ) : (
                        <input 
                          type="text" placeholder="Escribe un mensaje o pega una imagen (Ctrl+V)..." style={{ flex: 1, padding: '8px', background: 'transparent', border: 'none', color: "var(--text-primary)", outline: 'none', fontSize: '0.9rem' }} 
                          value={newMessage} onChange={e => setNewMessage(e.target.value)}
                          onPaste={(e) => {
                            const items = e.clipboardData?.items;
                            if (items) {
                              for (let i = 0; i < items.length; i++) {
                                if (items[i].type.indexOf('image') !== -1) {
                                  e.preventDefault();
                                  const file = items[i].getAsFile();
                                  if (file) handleFileUpload(file);
                                  break;
                                }
                              }
                            }
                          }}
                        />
                     )}
                     <div className="flex gap-1">
                        {!isRecording ? (
                          <>
                            {selectedConv?.channel === 'whatsapp' && !selectedConv?.phone?.startsWith('SIM_') && (
                               <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowTemplateModal(true)} title="Enviar Plantilla (Template)"><FileText size={18} /></button>
                            )}
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current.click()}><Paperclip size={18} /></button>
                            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} accept="image/*,video/*,application/pdf" />
                            <button type="submit" className="btn btn-primary btn-sm" disabled={!newMessage.trim()}><Send size={16} /></button>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={startRecording}><Mic size={18} /></button>
                          </>
                        ) : (
                          <>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => stopRecording(true)}><Trash2 size={18} /></button>
                            <button type="button" className="btn btn-primary btn-sm" onClick={() => stopRecording(false)} style={{ background: '#ef4444' }}>Enviar</button>
                          </>
                        )}
                     </div>
                  </form>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'rgba(var(--overlay-rgb), 0.03)', padding: 24, borderRadius: '50%' }}><MessageSquare size={48} opacity={0.2} /></div>
              <p>Selecciona un chat para comenzar</p>
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className={`contact-panel inbox-panel-container ${mobileView !== 'info' ? 'mobile-hidden' : ''}`}>
           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
             <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Panel</h3>
             <button className="btn btn-ghost btn-sm mobile-only" onClick={() => setMobileView('chat')} style={{ padding: 4 }}>
               <Close size={20} />
             </button>
           </div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
             {['Contact', 'Deal Info', 'Timeline'].map(t => (
               <div 
                 key={t} 
                 onClick={() => setActiveInfoTab(t)}
                 style={{ 
                     padding: '10px 14px', 
                     borderRadius: 10, 
                     background: activeInfoTab === t ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                     color: activeInfoTab === t ? 'var(--primary-400)' : 'var(--text-secondary)',
                     fontWeight: 600,
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'space-between',
                     cursor: 'pointer',
                     fontSize: '0.85rem'
                 }}
               >
                  {t}
                  {activeInfoTab === t && <ChevronRight size={12} />}
               </div>
             ))}
           </div>

           <div style={{ padding: 16, background: 'rgba(var(--overlay-rgb), 0.02)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
              {activeInfoTab === 'Contact' && (
                <div className="animate-slideUp">
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: 8 }}>Contacto</h4>
                  <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                     <div className="flex items-center gap-3">
                        <Phone size={14} className="text-primary-400" />
                        <span style={{ fontSize: '0.85rem' }}>{selectedConv?.phone || 'N/A'}</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <Mail size={14} className="text-primary-400" />
                        <span style={{ fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedConv?.client?.email || 'N/A'}</span>
                     </div>
                  </div>
                </div>
              )}
              {activeInfoTab === 'Deal Info' && (
                <div className="animate-slideUp">
                   <h4 style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: 8 }}>Resumen de Venta</h4>
                   {dealInfo ? (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                       <div style={{ padding: '12px', background: 'var(--primary-700)', borderRadius: 8, border: '1px solid var(--primary-600)' }}>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Producto y Cantidad</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{dealInfo.producto}</div>
                       </div>
                       <div style={{ padding: '12px', background: 'var(--primary-700)', borderRadius: 8, border: '1px solid var(--primary-600)' }}>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Cliente</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{dealInfo.nombre}</div>
                       </div>
                       <div style={{ padding: '12px', background: 'var(--primary-700)', borderRadius: 8, border: '1px solid var(--primary-600)' }}>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Ubicación</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{dealInfo.ubicacion}</div>
                       </div>
                       <div style={{ padding: '12px', background: 'var(--primary-700)', borderRadius: 8, border: '1px solid var(--primary-600)' }}>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Teléfono</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{dealInfo.telefono}</div>
                       </div>
                       <div style={{ padding: '12px', background: 'var(--primary-700)', borderRadius: 8, border: '1px solid var(--primary-600)' }}>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Fecha de Inicio / Entrega</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{dealInfo.fecha}</div>
                       </div>
                     </div>
                   ) : (
                     <div style={{ padding: '16px', background: 'rgba(var(--overlay-rgb), 0.05)', borderRadius: 8, textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Aún no se han recopilado los datos del cliente.</div>
                     </div>
                   )}
                </div>
              )}
              {activeInfoTab === 'Timeline' && (
                <div className="animate-slideUp">
                   <h4 style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: 8 }}>Historial</h4>
                   <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>• Conversación hoy</div>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* Simulation Modal */}
      {showSimModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(10px)' }}>
           <div className="card animate-scaleIn" style={{ width: '100%', maxWidth: 420, padding: 0, overflow: 'hidden' }}>
              <div className="card-header" style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div className="flex items-center gap-3">
                   <Bot size={20} className="text-primary-400" />
                   <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>Probar Agente IA</h3>
                 </div>
                 <button className="btn btn-ghost btn-sm" onClick={() => setShowSimModal(false)}><Close size={20} /></button>
              </div>
              <div style={{ padding: '20px' }}>
                 <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: 16 }}>
                   Simula un mensaje de cliente para ver cómo responde Cami.
                 </p>
                 <form onSubmit={handleSimulateChat}>
                   <textarea 
                     className="form-input" 
                     rows={3} 
                     placeholder="Escribe tu mensaje aquí..."
                     value={simMessage}
                     onChange={e => setSimMessage(e.target.value)}
                     required
                     autoFocus
                   />
                   <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setShowSimModal(false)}>Cancelar</button>
                      <button type="submit" className="btn btn-primary" disabled={isSimulating}>
                         {isSimulating ? '...' : 'Enviar'}
                      </button>
                   </div>
                 </form>
              </div>
           </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(10px)' }}>
           <div className="card animate-scaleIn" style={{ width: '100%', maxWidth: 420, padding: 0, overflow: 'hidden' }}>
              <div className="card-header" style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div className="flex items-center gap-3">
                   <Trash2 size={20} style={{ color: 'var(--accent-rose)' }} />
                   <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>Eliminar Chat</h3>
                 </div>
                 <button className="btn btn-ghost btn-sm" onClick={() => setShowDeleteModal(false)}><Close size={20} /></button>
              </div>
              <div style={{ padding: '20px' }}>
                 <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: 16 }}>
                   ¿Estás seguro de que quieres eliminar todo el historial de este chat? Esta acción no se puede deshacer.
                 </p>
                 <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
                    <button type="button" className="btn btn-primary" style={{ background: 'var(--accent-rose)', color: 'white' }} onClick={async () => {
                       const { error } = await supabase.from('conversations').update({ archived: true }).eq('id', chatToDelete.id);
                       if (!error) {
                           setSelectedConv(null);
                           fetchConversations(true);
                       } else {
                           alert('Error al eliminar el chat: ' + error.message);
                       }
                       setShowDeleteModal(false);
                    }}>
                       Sí, Eliminar
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(10px)' }}>
           <div className="card animate-scaleIn" style={{ width: '100%', maxWidth: 420, padding: 0, overflow: 'hidden' }}>
              <div className="card-header" style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div className="flex items-center gap-3">
                   <FileText size={20} className="text-primary-400" />
                   <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>Enviar Plantilla</h3>
                 </div>
                 <button className="btn btn-ghost btn-sm" onClick={() => setShowTemplateModal(false)}><Close size={20} /></button>
              </div>
              <form onSubmit={handleSendTemplate} style={{ padding: '20px' }}>
                 <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: 16 }}>
                   Ingresa el nombre interno de la plantilla aprobada en Meta para enviarla a este cliente y reactivar el chat.
                 </p>
                 <div className="form-group" style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Nombre de la Plantilla</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="ej: hello_world, reactivacion_ventas_v1"
                      value={templateName}
                      onChange={e => setTemplateName(e.target.value)}
                      required
                    />
                 </div>
                 <div className="flex gap-2 justify-end">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowTemplateModal(false)}>Cancelar</button>
                    <button type="submit" className="btn btn-primary">Enviar Plantilla</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  )
}

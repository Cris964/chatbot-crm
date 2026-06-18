import { useState, useRef, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Search, Filter, MoreVertical, Send, Paperclip, Smile,
  Phone, Video, Star, Tag, AlertTriangle, Bot, UserCheck,
  Mail, MapPin, Calendar, ShoppingBag, Clock, ChevronDown, CheckCheck, MessageSquare,
  Sparkles, Check, X as Close, User, Globe, History, CheckCircle2, ChevronRight,
  Mic, Square, Trash2, UserPlus, Facebook, Instagram, MessageCircle
} from 'lucide-react'
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
  const tenant = useTenant()
  const [conversationsList, setConversationsList] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [selectedConv, setSelectedConv] = useState(null)
  const [mobileView, setMobileView] = useState('list') // 'list' | 'chat' | 'info'
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [botActive, setBotActive] = useState(true)
  const [showAI, setShowAI] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [teamMembers, setTeamMembers] = useState([])
  const [activeInfoTab, setActiveInfoTab] = useState('Contact')
  const [showSimModal, setShowSimModal] = useState(false)
  const [simMessage, setSimMessage] = useState('')
  const [isSimulating, setIsSimulating] = useState(false)
  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingTimerRef = useRef(null)

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
        await fetchConversations()
        
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

    fetchConversations()
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
        fetchConversations()
      })
      .subscribe()

    return () => {
      if (convSub) {
        supabase.removeChannel(convSub)
      }
    }
  }, [tenant.clientId, tenant.isLoading])

  useEffect(() => {
    if (selectedConv) {
      setBotActive(selectedConv.needs_human === false || selectedConv.needs_human == null);
      setMessages((selectedConv.rawMessages || []).map((m, i) => {
        let ts = m.timestamp || m.created_at || selectedConv.updated_at || Date.now();
        let dateObj = (typeof ts === 'string' && /^\d{10}$/.test(ts)) ? new Date(parseInt(ts) * 1000) : ((typeof ts === 'number' && ts < 20000000000) ? new Date(ts * 1000) : new Date(ts));
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
            setSelectedConv(prev => ({ ...prev, ...updatedConv, rawMessages: updatedConv.messages }))
            
            setMessages(updatedConv.messages.map((m, i) => {
              let ts = m.timestamp || m.created_at || updatedConv.updated_at || Date.now();
              let dateObj = (typeof ts === 'string' && /^\d{10}$/.test(ts)) ? new Date(parseInt(ts) * 1000) : ((typeof ts === 'number' && ts < 20000000000) ? new Date(ts * 1000) : new Date(ts));
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
            setTimeout(scrollToBottom, 100)
          }
        })
        .subscribe()

      return () => {
        if (convUpdateSub) {
          supabase.removeChannel(convUpdateSub)
        }
      }
    }
  }, [selectedConv])

  const fetchConversations = async () => {
    if (!tenant.clientId) return
    setIsLoading(true)
    
    try {
      let query = supabase
        .from('conversations')
        .select('*, clients(*)')
        .eq('client_id', tenant.clientId)
        
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
              time: conv.updated_at ? new Date(conv.updated_at).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '',
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
              department: conv.department
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
    
    if (!error) {
      fetchConversations()
      setSelectedConv(prev => ({ ...prev, assigned_to: userId }))
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConv) return
    
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
           await fetch('/api/send', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
               client_id: tenant.clientId,
               phone: selectedConv.phone,
               message: textMsg,
               type: 'text'
             })
           });
         } catch (apiErr) {
           console.error('Error sending message via API:', apiErr);
         }
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
      const fileName = `voice_${Date.now()}.webm`
      const { data, error } = await supabase.storage
        .from('whatsapp_media')
        .upload(fileName, audioBlob, { contentType: 'audio/webm' })
        
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
          await fetch('/api/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: tenant.clientId,
              phone: selectedConv.phone,
              message: audioUrl,
              type: 'audio'
            })
          });
        } catch (apiErr) {
          console.error('Error sending audio via API:', apiErr);
        }
        
        fetchConversations()
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
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || !selectedConv) return
    setIsLoading(true)
    try {
      const fileName = `${Date.now()}_${file.name}`
      const { data, error } = await supabase.storage
        .from('whatsapp_media')
        .upload(fileName, file)
      
      if (error) throw error

      const { data: publicUrlData } = supabase.storage
        .from('whatsapp_media')
        .getPublicUrl(fileName)

      const fileUrl = publicUrlData.publicUrl
      
      const messageObj = {
        role: 'agent',
        content: fileUrl,
        type: file.type.startsWith('image/') ? 'image' : 'file',
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
          await fetch('/api/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: tenant.clientId,
              phone: selectedConv.phone,
              message: fileUrl,
              type: file.type.startsWith('image/') ? 'image' : 'document'
            })
          });
        } catch (apiErr) {
          console.error('Error sending file via API:', apiErr);
        }
        
        fetchConversations()
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

  return (
    <div className="inbox-container">
      <style>{`
        .inbox-layout {
          display: grid;
          grid-template-columns: 320px 1fr 340px;
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

      <div className="inbox-layout">
        {/* Sidebar */}
        <div className={`inbox-sidebar inbox-panel-container ${mobileView !== 'list' ? 'mobile-hidden' : ''}`}>
          <div className="inbox-sidebar-header" style={{ padding: '20px' }}>
             <div className="flex justify-between items-center mb-4">
               <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Inbox</h2>
             </div>
             <div className="search-bar" style={{ padding: '8px 12px' }}>
               <Search size={16} />
               <input type="text" placeholder="Buscar..." style={{ fontSize: '0.85rem' }} />
             </div>
             <div style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto', paddingBottom: 4 }}>
                {['all', 'whatsapp', 'instagram', 'messenger'].map(tab => (
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
                      {tab === 'all' ? 'Todos' : tab}
                   </button>
                ))}
             </div>
             <button 
               className="btn btn-primary btn-sm" 
               style={{ 
                 width: '100%', 
                 marginTop: 12, 
                 background: 'linear-gradient(135deg, var(--primary-600), var(--primary-400))',
                 fontWeight: 700
               }}
               onClick={() => setShowSimModal(true)}
             >
               <Sparkles size={14} /> Probar Agente IA
             </button>
          </div>
          
          <div className="conversation-list" style={{ padding: '0 12px 12px', flex: 1, overflowY: 'auto' }}>
            {isLoading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                 <div className="spinner" style={{ margin: '0 auto 12px' }} />
                 <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Cargando...</p>
              </div>
            ) : conversationsList.filter(c => activeTab === 'all' || c.channel === activeTab).map(c => (
              <div 
                key={c.id} 
                className={`conversation-item ${selectedConv?.id === c.id ? 'active' : ''}`}
                onClick={() => { setSelectedConv(c); setMobileView('chat'); }}
                style={{ padding: '12px', borderRadius: 12, marginBottom: 4, display: 'flex', alignItems: 'center' }}
              >
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
                        ) : m.type === 'audio' || m.type === 'voice' || m.media_url ? (
                          <div>
                            {m.media_url && <VoiceNotePlayer src={m.media_url} sender={m.sender} durationText="Audio" avatar={m.sender === 'client' ? selectedConv?.avatar : null} />}
                            <p style={{ margin: 0, wordBreak: 'break-word', fontStyle: 'italic', opacity: 0.8, fontSize: '0.8rem' }}>{m.text?.startsWith('http') ? '' : m.text?.replace(/^\[Nota de Voz del Cliente\]:\s*/, '')}</p>
                          </div>
                        ) : m.type === 'video' || (m.text && m.text.startsWith('http') && !m.text.includes(' ') && m.text.match(/\.(mp4|webm|ogg)/i)) ? (
                          <video controls src={m.media_url || m.text} style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 4 }} />
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
                        <div style={{ fontSize: '0.6rem', opacity: 0.6, marginTop: 4, textAlign: 'right' }}>
                          {m.time}
                        </div>
                    </div>
                  ))}
                 <div ref={messagesEndRef} />
              </div>

              <div className="chat-input-area" style={{ padding: '12px 20px', background: 'rgba(0,0,0,0.2)' }}>
                  <form onSubmit={handleSendMessage} style={{ background: 'rgba(var(--overlay-rgb), 0.03)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '4px 12px', display: 'flex', alignItems: 'center' }}>
                     {isRecording ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '8px' }}>
                           <div className="pulse-red" style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                           <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>Grabando... {formatTime(recordingTime)}</span>
                        </div>
                     ) : (
                        <input 
                          type="text" placeholder="Escribe un mensaje..." style={{ flex: 1, padding: '8px', background: 'transparent', border: 'none', color: "var(--text-primary)", outline: 'none', fontSize: '0.9rem' }} 
                          value={newMessage} onChange={e => setNewMessage(e.target.value)}
                        />
                     )}
                     <div className="flex gap-1">
                        {!isRecording ? (
                          <>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current.click()}><Paperclip size={18} /></button>
                            <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} accept="image/*,audio/*" />
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
                   <h4 style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: 8 }}>Ventas</h4>
                   <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 8 }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--accent-emerald)' }}>ESTIMADO</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>$250k</div>
                   </div>
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
    </div>
  )
}

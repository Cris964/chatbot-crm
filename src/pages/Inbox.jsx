import { useState, useRef, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Search, Filter, MoreVertical, Send, Paperclip, Smile,
  Phone, Video, Star, Tag, AlertTriangle, Bot, UserCheck,
  Mail, MapPin, Calendar, ShoppingBag, Clock, ChevronDown, CheckCheck, MessageSquare,
  Sparkles, Check, X as Close, User, Globe, History, CheckCircle2, ChevronRight
} from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Inbox() {
  const { session } = useOutletContext()
  const [conversationsList, setConversationsList] = useState([])
  const [selectedConv, setSelectedConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [botActive, setBotActive] = useState(true)
  const [showAI, setShowAI] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, selectedConv])

  useEffect(() => {
    if (!session?.user?.id) return

    fetchConversations()

    // Realtime listener for new conversations or updates
    const convSub = supabase
      .channel('public:conversations')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'conversations'
      }, () => {
        fetchConversations()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(convSub)
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (selectedConv) {
      // Initialize messages from the conversation object
      setMessages((selectedConv.rawMessages || []).map((m, i) => ({
        id: i,
        sender: m.role === 'user' ? 'client' : (m.role === 'assistant' ? 'bot' : 'agent'),
        text: m.content || m.text,
        time: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (selectedConv.updated_at ? new Date(selectedConv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')
      })))

      // Realtime listener for updates to this specific conversation
      const convUpdateSub = supabase
        .channel(`public:conversations:${selectedConv.id}`)
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'conversations', 
          filter: `id=eq.${selectedConv.id}` 
        }, (payload) => {
          const updatedConv = payload.new
          if (updatedConv.messages) {
            setMessages(updatedConv.messages.map((m, i) => ({
              id: i,
              sender: m.role === 'user' ? 'client' : (m.role === 'assistant' ? 'bot' : 'agent'),
              text: m.content || m.text,
              time: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (updatedConv.updated_at ? new Date(updatedConv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')
            })))
          }
        })
        .subscribe()

      return () => {
        supabase.removeChannel(convUpdateSub)
      }
    }
  }, [selectedConv])

  const fetchConversations = async () => {
    if (!session?.user?.id) return
    setIsLoading(true)
    
    // Get clients linked to this user for multitenancy
    const { data: userClients } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', session.user.id)
    
    const clientIds = userClients?.map(c => c.id) || []
    
    const { data, error } = await supabase
      .from('conversations')
      .select('*, clients(*)')
      .in('client_id', clientIds)
      .order('updated_at', { ascending: false })
    
    if (!error && data) {
      const mapped = data.map(conv => {
        const displayName = conv.user_name || (conv.user_phone ? `Cl: ${conv.user_phone}` : 'Cliente Nuevo')

        return {
          id: conv.id,
          name: displayName,
          preview: (conv.messages && conv.messages.length > 0) ? (conv.messages[conv.messages.length - 1].content || conv.messages[conv.messages.length - 1].text || 'Inició conversación...') : 'Inició conversación...',
          time: conv.updated_at ? new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          channel: conv.channel || (i % 3 === 0 ? 'instagram' : i % 2 === 0 ? 'facebook' : 'whatsapp'), // Fallback for variety in demo if needed, but using real channel logic
          unread: false,
          avatar: displayName.substring(0, 2).toUpperCase(),
          bg: '#6366f1',
          tags: conv.needs_human ? ['Atención Req.'] : [],
          intent: 'consulta',
          botHandled: !conv.needs_human,
          phone: conv.user_phone,
          client: conv.clients,
          rawMessages: conv.messages || [],
          needs_human: conv.needs_human
        }
      })
      setConversationsList(mapped)
      if (mapped.length > 0 && !selectedConv) {
        setSelectedConv(mapped[0])
      }
    }
    setIsLoading(false)
  }

  const [filterChannel, setFilterChannel] = useState('All')
  const filteredConversations = conversationsList.filter(c => 
    filterChannel === 'All' || c.channel?.toLowerCase() === filterChannel.toLowerCase()
  )

  const [activeInfoTab, setActiveInfoTab] = useState('Contact')
  const fileInputRef = useRef(null)

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || !selectedConv) return

    // Simulate upload/sending logic
    const fileType = file.type.startsWith('image/') ? 'image' : (file.type.startsWith('audio/') ? 'audio' : 'file')
    const fileName = `${Date.now()}_${file.name}`
    
    // In a real app: await supabase.storage.from('media').upload(fileName, file)
    // For now, we simulate the message addition
    const fakeUrl = URL.createObjectURL(file)
    
    const messageObj = {
      role: 'agent',
      content: fakeUrl,
      type: fileType,
      timestamp: new Date().toISOString()
    }

    const { error } = await supabase
      .from('conversations')
      .update({ 
        messages: [...selectedConv.rawMessages, messageObj],
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedConv.id)

    if (!error) fetchConversations()
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConv) return
    
    const messageObj = {
      role: 'agent',
      content: newMessage,
      timestamp: new Date().toISOString()
    }

    const { error } = await supabase
      .from('conversations')
      .update({ 
        messages: [...selectedConv.rawMessages, messageObj],
        updated_at: new Date().toISOString(),
        needs_human: false // Assume agent handling solves need for human intervention temporarily
      })
      .eq('id', selectedConv.id)

    if (!error) {
       setNewMessage('')
       // Add to outbox if needed by your backend system
       await supabase.from('outbox').insert([{
         client_id: selectedConv.client?.id,
         phone: selectedConv.phone,
         text: newMessage,
         user_id: session.user.id
       }])
    }
  }

  const toggleBot = async () => {
    if (!selectedConv) return
    const newState = !botActive
    setBotActive(newState)
    
    await supabase
      .from('conversations')
      .update({ needs_human: !newState })
      .eq('id', selectedConv.id)
  }

  return (
    <div className="inbox-layout" style={{ background: 'transparent', height: 'calc(100vh - var(--header-height))' }}>
      {/* List */}
      <div className="inbox-sidebar" style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)' }}>
        <div className="inbox-sidebar-header" style={{ padding: '24px' }}>
           <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 16 }}>CRM Inbox</h2>
           <div className="inbox-search">
             <Search size={18} />
             <input type="text" placeholder="Search chats..." />
           </div>
        </div>
        
        <div style={{ display: 'flex', gap: 12, padding: '0 24px 16px', borderBottom: '1px solid var(--glass-border)', overflowX: 'auto' }} className="no-scrollbar">
           {['All', 'WhatsApp', 'Instagram', 'Facebook', 'TikTok'].map(t => (
             <button 
                key={t} 
                className={`tab-btn-mini ${filterChannel === t ? 'active' : ''}`}
                onClick={() => setFilterChannel(t)}
                style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    color: filterChannel === t ? 'var(--primary-400)' : 'var(--text-tertiary)',
                    padding: '4px 12px',
                    borderRadius: 20,
                    whiteSpace: 'nowrap',
                    background: filterChannel === t ? 'rgba(99, 102, 241, 0.1)' : 'transparent'
                }}
             >
                {t}
             </button>
           ))}
        </div>

        <div className="conversation-list" style={{ padding: 12 }}>
          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
               <div className="spinner" style={{ margin: '0 auto 12px' }} />
               <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>No conversations for this channel.</div>
          ) : filteredConversations.map(c => (
            <div 
              key={c.id} 
              className={`conversation-item ${selectedConv?.id === c.id ? 'active' : ''}`}
              onClick={() => setSelectedConv(c)}
              style={{ padding: '16px', borderRadius: 16, marginBottom: 4 }}
            >
               <div className="avatar lg" style={{ background: c.bg, position: 'relative' }}>
                  {c.avatar}
                  <div style={{ position: 'absolute', bottom: -2, right: -2, background: '#25d366', width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--bg-secondary)' }} />
               </div>
               <div className="conv-content" style={{ marginLeft: 16 }}>
                  <div className="flex justify-between items-center">
                     <span style={{ fontWeight: 700 }}>{c.name}</span>
                     <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{c.time}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{c.preview}</p>
                  <div className="flex gap-2 mt-2">
                      {c.tags.map(t => <span key={t} className="badge emerald" style={{ fontSize: 10, padding: '1px 6px' }}>{t}</span>)}
                      {c.channel && <span className="badge amber" style={{ fontSize: 10, padding: '1px 6px' }}>{c.channel}</span>}
                   </div>
                </div>
             </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-area" style={{ background: 'rgba(255,255,255,0.01)', borderRight: '1px solid var(--glass-border)' }}>
        {selectedConv && (
          <>
            <div className="chat-header" style={{ padding: '20px 32px' }}>
               <div className="avatar md" style={{ background: selectedConv.bg }}>{selectedConv.avatar}</div>
               <div style={{ marginLeft: 16 }}>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {selectedConv.name} <CheckCircle2 size={16} style={{ color: 'var(--accent-emerald)' }} />
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Sales Lead | Open | <span style={{ color: 'var(--accent-emerald)' }}>Verified WA</span></p>
               </div>
                <div className="ml-auto flex items-center gap-6">
                   <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 100, border: '1px solid var(--glass-border)' }}>
                      <div className="flex items-center gap-2">
                         <Bot size={16} style={{ color: botActive ? 'var(--accent-emerald)' : 'var(--text-tertiary)' }} />
                         <span style={{ fontSize: '0.8rem', fontWeight: 600, color: botActive ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                            {botActive ? 'Chatbot Activo' : 'Modo Manual'}
                         </span>
                      </div>
                      <div 
                        className={`toggle-switch ${botActive ? 'active' : ''}`} 
                        onClick={() => setBotActive(!botActive)}
                      />
                   </div>
                   <div style={{ width: 1, height: 24, background: 'var(--glass-border)' }} />
                    <div className="flex gap-2">
                       <a href={`tel:${selectedConv?.phone}`} className="btn btn-secondary btn-sm"><Phone size={16} /> Call</a>
                       <a href={`mailto:${selectedConv?.client?.email}`} className="btn btn-secondary btn-sm"><Mail size={16} /> Email</a>
                    </div>
                </div>
            </div>

            <div className="chat-messages" style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
                {messages.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: m.sender === 'client' ? 'flex-start' : 'flex-end', marginBottom: 24 }}>
                     <div style={{ 
                       maxWidth: '70%', 
                       padding: '16px 20px', 
                       borderRadius: m.sender === 'client' ? '0 20px 20px 20px' : '20px 0 20px 20px',
                       background: m.sender === 'client' ? 'rgba(255,255,255,0.05)' : 'var(--primary-600)',
                       border: m.sender === 'client' ? '1px solid var(--glass-border)' : 'none',
                       boxShadow: m.sender === 'agent' ? '0 10px 20px -10px rgba(99, 102, 241, 0.4)' : 'none'
                     }}>
                        {m.type === 'image' ? (
                          <img src={m.text} alt="Shared" style={{ maxWidth: '100%', borderRadius: 12, marginBottom: 8 }} />
                        ) : m.type === 'audio' ? (
                          <audio controls src={m.text} style={{ width: '100%', height: 40, filter: m.sender === 'agent' ? 'invert(1)' : 'none' }} />
                        ) : (
                          <p style={{ fontSize: '0.95rem', color: '#fff', whiteSpace: 'pre-line' }}>{m.text}</p>
                        )}
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: 8, textAlign: 'right' }}>
                          {m.sender === 'client' ? 'Client' : 'Agent'} ({m.time})
                        </div>
                     </div>
                  </div>
                ))}
               <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area" style={{ padding: '24px 32px', borderTop: 'none' }}>
               {showAI && !selectedConv?.needs_human && (
                 <div className="ai-suggestion-panel animate-slideUp">
                   <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="ai-icon-wrapper">
                         <Sparkles size={16} />
                      </div>
                      <div>
                         <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Suggestion</div>
                         <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Schedule a demo call?</span>
                      </div>
                   </div>
                   <div className="flex gap-2">
                      <button className="btn btn-primary btn-sm" style={{ background: 'var(--accent-emerald)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}>Accept</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setShowAI(false)}>Decline</button>
                   </div>
                 </div>
               )}
                <form 
                  onSubmit={handleSendMessage}
                  style={{ 
                    background: 'rgba(255,255,255,0.03)', 
                    border: '1px solid var(--glass-border)',
                    borderRadius: '16px',
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                   <input 
                    type="text" placeholder="Type a message..." style={{ flex: 1, padding: '12px' }} 
                    value={newMessage} onChange={e => setNewMessage(e.target.value)}
                   />
                   <div className="flex gap-2">
                     <button type="button" className="btn btn-ghost" onClick={() => fileInputRef.current.click()}><Paperclip size={20} /></button>
                     <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} accept="image/*,audio/*" />
                     <button type="button" className="btn btn-ghost"><Smile size={20} /></button>
                     <button type="submit" className="btn btn-primary" style={{ padding: '8px 20px' }}>Send</button>
                   </div>
                </form>
            </div>
          </>
        )}
      </div>

       {/* Profile Column */}
       <div className="contact-panel" style={{ background: 'transparent' }}>
          <div style={{ padding: '32px' }}>
             <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 24 }}>Information Panel</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Contact', 'Deal Info', 'Company', 'Timeline'].map(t => (
                  <div 
                    key={t} 
                    onClick={() => setActiveInfoTab(t)}
                    style={{ 
                        padding: '12px 16px', 
                        borderRadius: 12, 
                        background: activeInfoTab === t ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                        color: activeInfoTab === t ? 'var(--primary-400)' : 'var(--text-secondary)',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                    }}
                  >
                     {t}
                     {activeInfoTab === t && <ChevronRight size={14} />}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 24, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid var(--glass-border)' }}>
                {activeInfoTab === 'Contact' && (
                  <div className="animate-slideUp">
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: 12 }}>Detalles de Contacto</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Información básica del cliente sincronizada desde Supabase.</p>
                  </div>
                )}
                {activeInfoTab === 'Deal Info' && (
                  <div className="animate-slideUp">
                     <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: 12 }}>Información del Trato</h4>
                     <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: 8 }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>VALOR ESTIMADO</div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>$250,000</div>
                     </div>
                  </div>
                )}
                {activeInfoTab === 'Timeline' && (
                  <div className="animate-slideUp">
                     <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: 12 }}>Historial</h4>
                     <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>• Conversación iniciada hoy</div>
                  </div>
                )}
              </div>

             <div style={{ marginTop: 40 }}>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>Quick Info</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                   <div className="flex items-center gap-3">
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 8 }}><Phone size={16} /></div>
                      <div>
                         <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Phone</div>
                         <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{selectedConv?.phone || 'N/A'}</div>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 8 }}><Mail size={16} /></div>
                      <div>
                         <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Email</div>
                         <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{selectedConv?.client?.email || 'N/A'}</div>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 8 }}><Tag size={16} /></div>
                      <div>
                         <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Channel</div>
                         <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{selectedConv?.channel || 'whatsapp'}</div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  )
}



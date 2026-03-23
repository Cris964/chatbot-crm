import { useState, useRef, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Search, Filter, MoreVertical, Send, Paperclip, Smile,
  Phone, Video, Star, Tag, AlertTriangle, Bot, UserCheck,
  Mail, MapPin, Calendar, ShoppingBag, Clock, ChevronDown, CheckCheck, MessageSquare
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const channels = ['Todos', 'WhatsApp', 'Instagram', 'Messenger', 'Email']

function ChannelIcon({ channel }) {
  const icons = {
    whatsapp: '💬',
    instagram: '📷',
    messenger: '💭',
    email: '📧',
  }
  return <span>{icons[channel?.toLowerCase()] || '💬'}</span>
}

export default function Inbox() {
  const { session } = useOutletContext()
  const [conversationsList, setConversationsList] = useState([])
  const [selectedConv, setSelectedConv] = useState(null)
  const [activeChannel, setActiveChannel] = useState('Todos')
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
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
        table: 'conversations',
        filter: `user_id=eq.${session.user.id}`
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
        time: selectedConv.updated_at ? new Date(selectedConv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
      })))

      // Realtime listener for updates to this conversation (which contains the JSONB messages)
      const convUpdateSub = supabase
        .channel(`public:conversations:${selectedConv.id}`)
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'conversations', 
          filter: `id=eq.${selectedConv.id}` 
        }, (payload) => {
          console.log('Conversation updated:', payload.new)
          const updatedConv = payload.new
          if (updatedConv.messages) {
            setMessages(updatedConv.messages.map((m, i) => ({
              id: i,
              sender: m.role === 'user' ? 'client' : (m.role === 'assistant' ? 'bot' : 'agent'),
              text: m.content || m.text,
              time: updatedConv.updated_at ? new Date(updatedConv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
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
    console.log('Fetching conversations for user:', session.user.id)
    // Two-step fetch for maximum reliability
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
    
    if (!error && data && data.length > 0) {
      const mapped = data.map(conv => {
        const displayName = conv.user_name || (conv.user_phone ? `Cl: ${conv.user_phone}` : 'Cliente Nuevo')

        return {
          id: conv.id,
          name: displayName,
          preview: conv.last_message || 'Inició conversación...',
          time: conv.updated_at ? new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          channel: conv.channel || 'whatsapp',
          unread: false,
          avatar: displayName.substring(0, 2).toUpperCase(),
          bg: '#6366f1',
          tags: [],
          intent: 'consulta',
          botHandled: !conv.needs_human,
          phone: conv.user_phone,
          client: conv.clients,
          rawMessages: conv.messages || [],
          needs_human: conv.needs_human
        }
      })
      setConversationsList(mapped)
      
      // Temporary diagnostic for outbox table
      const { data: outSamples } = await supabase.from('outbox').select('*').limit(1)
      if (outSamples && outSamples.length > 0) {
        console.log('SCHEMA DIAGNOSTIC - Outbox Columns:', Object.keys(outSamples[0]))
      }

      if (mapped.length > 0 && !selectedConv) {
        setSelectedConv(mapped[0])
      }
    }
    setIsLoading(false)
  }

  const handleSendMessage = async (e) => {
    e?.preventDefault()
    if (!newMessage.trim() || !selectedConv) return
    
    // Optimistic UI update
    const newMsg = {
      id: Date.now(),
      sender: 'agent',
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    
    setMessages([...messages, newMsg])
    const sentText = newMessage
    setNewMessage('')

    // Insert into Supabase Outbox for real delivery
    // phone_number_id MUST be the business ID (1074951269024593)
    // SelectedConv.phone is the recipient (customer)
    await supabase.from('outbox').insert([
      {
        phone_number_id: selectedConv.client?.phone_number_id || '1074951269024593',
        message: sentText,
        status: 'pending', 
        is_bot: false,
        user_id: session.user.id,
        phone: selectedConv.phone 
      }
    ])
    
    // Update conversation last message and set to human mode (needs_human = true)
    await supabase.from('conversations').update({
      last_message: sentText,
      updated_at: new Date().toISOString(),
      needs_human: true 
    }).eq('id', selectedConv.id)
    
    // Refresh conversation list to show new last message
    fetchConversations()
  }

  const filtered = activeChannel === 'Todos'
    ? conversationsList
    : conversationsList.filter(c => c.channel?.toLowerCase() === activeChannel.toLowerCase())

  if (isLoading && conversationsList.length === 0) {
    return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyItems: 'center', width: '100%', padding: '2rem' }}>Cargando conversaciones...</div>
  }

  return (
    <div className="inbox-layout">
      {/* Left Panel - Conversations List */}
      <div className="inbox-sidebar">
        <div className="inbox-sidebar-header">
          <div className="flex items-center justify-between">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Inbox</h2>
            <div className="flex gap-2">
              <button className="btn btn-ghost btn-sm"><Filter size={16} /></button>
            </div>
          </div>
          <div className="inbox-search">
            <Search size={16} />
            <input type="text" placeholder="Buscar conversaciones..." />
          </div>
        </div>

        <div className="inbox-tabs">
          {channels.map(ch => (
            <button
              key={ch}
              className={`inbox-tab ${activeChannel === ch ? 'active' : ''}`}
              onClick={() => setActiveChannel(ch)}
            >
              {ch}
            </button>
          ))}
        </div>

        <div className="conversation-list">
          {filtered.map(conv => (
            <div
              key={conv.id}
              className={`conversation-item ${selectedConv?.id === conv.id ? 'active' : ''} ${conv.unread ? 'unread' : ''}`}
              onClick={() => setSelectedConv(conv)}
            >
              <div className="conv-avatar" style={{ background: conv.bg }}>
                {conv.avatar}
                <div className={`channel-icon ${conv.channel}`}>
                  <ChannelIcon channel={conv.channel} />
                </div>
              </div>
              <div className="conv-content">
                <div className="conv-header">
                  <span className="conv-name">{conv.name}</span>
                  <span className="conv-time">{conv.time}</span>
                </div>
                <p className="conv-preview">{conv.preview}</p>
                <div className="conv-tags">
                  {conv.tags.map((tag, i) => (
                    <span key={i} className={`conv-tag badge ${tag.color}`}>{tag.label}</span>
                  ))}
                  {conv.botHandled && <span className="conv-tag badge neutral">🤖 Bot</span>}
                  {!conv.botHandled && <span className="conv-tag badge rose">👤 Humano</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Center Panel - Chat */}
      <div className="chat-area">
        {selectedConv ? (
          <>
            <div className="chat-header">
              <div className="conv-avatar" style={{ background: selectedConv.bg, width: 36, height: 36, fontSize: '0.85rem' }}>
                {selectedConv.avatar}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedConv.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{selectedConv.isAdminRecord ? 'Lead de Prueba' : (selectedConv.client?.email || 'Sin correo')}</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  {selectedConv.channel === 'whatsapp' ? 'WhatsApp Business' :
                   selectedConv.channel === 'instagram' ? 'Instagram DM' :
                   selectedConv.channel === 'messenger' ? 'Facebook Messenger' : 'Email'}
                  {' '} • En línea
                </span>
              </div>
              <div className="ml-auto flex gap-3 items-center">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 12, padding: '4px 12px', background: 'var(--bg-tertiary)', borderRadius: 20, border: '1px solid var(--border-default)' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: selectedConv.botHandled ? 'var(--accent-violet)' : 'var(--text-tertiary)' }}>
                    {selectedConv.botHandled ? 'BOT ACTIVO' : 'BOT DESACTIVADO'}
                  </span>
                    <button 
                      onClick={async () => {
                        const newNeedsHuman = !selectedConv.needs_human
                        
                        const { error } = await supabase
                          .from('conversations')
                          .update({ needs_human: newNeedsHuman })
                          .eq('id', selectedConv.id)
                        
                        if (!error) {
                          setSelectedConv({...selectedConv, needs_human: newNeedsHuman, botHandled: !newNeedsHuman})
                          setConversationsList(prev => prev.map(c => (c.id === selectedConv.id ? {...c, needs_human: newNeedsHuman, botHandled: !newNeedsHuman} : c)))
                        } else {
                          console.error('Update error:', error)
                          alert('Error al actualizar bot: ' + error.message)
                        }
                      }}
                    style={{
                      width: 32,
                      height: 18,
                      borderRadius: 10,
                      background: selectedConv.botHandled ? 'var(--accent-violet)' : 'var(--bg-active)',
                      border: 'none',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: 'white',
                      position: 'absolute',
                      top: 2,
                      left: selectedConv.botHandled ? 16 : 2,
                      transition: 'all 0.2s'
                    }} />
                  </button>
                </div>
                {!selectedConv.botHandled && (
                  <span className="badge rose" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertTriangle size={12} /> Requiere atención
                  </span>
                )}
                <button className="btn btn-ghost btn-sm"><Phone size={16} /></button>
                <button className="btn btn-ghost btn-sm"><Video size={16} /></button>
                <button className="btn btn-ghost btn-sm"><Star size={16} /></button>
                <button className="btn btn-ghost btn-sm"><MoreVertical size={16} /></button>
              </div>
            </div>

            <div className="chat-messages" style={{ overflowY: 'auto', flex: 1 }}>
              {messages.map(msg => (
                <div key={msg.id}>
                  {msg.sender === 'bot' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: '0.72rem', color: 'var(--accent-violet)' }}>
                      <Bot size={12} /> Chatbot IA
                    </div>
                  )}
                  {msg.sender === 'agent' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: '0.72rem', color: 'var(--accent-emerald)' }}>
                      <UserCheck size={12} /> Ana Rodríguez (Agente)
                    </div>
                  )}
                  <div className={`message-bubble ${msg.sender === 'client' ? 'incoming' : msg.sender === 'bot' ? 'bot' : 'outgoing'}`}>
                    <p style={{ whiteSpace: 'pre-line' }}>{msg.text}</p>
                    <div className="message-time">{msg.time}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleSendMessage}>
              <button type="button" className="btn btn-ghost"><Paperclip size={18} /></button>
              <input 
                type="text" 
                placeholder="Escribe un mensaje..." 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="button" className="btn btn-ghost"><Smile size={18} /></button>
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 14px' }}><Send size={18} /></button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-active)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={32} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ color: 'var(--text-main)', marginBottom: 4 }}>No hay conversaciones seleccionadas</h3>
              <p style={{ fontSize: '0.9rem' }}>Selecciona un chat de la lista o espera nuevos mensajes.</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Contact Info */}
      {selectedConv && (
        <div className="contact-panel">
          <div className="contact-panel-header">
            <div className="avatar xl" style={{ background: selectedConv.bg }}>
              {selectedConv.avatar}
            </div>
            <h3>{selectedConv.name}</h3>
            <p>Lead • {selectedConv.phone || 'Sin télefono'}</p>
          </div>

          <div className="contact-section">
            <div className="contact-section-title">Información de Contacto</div>
            <div className="contact-detail">
              <Mail size={16} /> {selectedConv.client?.email || 'N/A'}
            </div>
            <div className="contact-detail">
              <Phone size={16} /> {selectedConv.phone || 'N/A'}
            </div>
            <div className="contact-detail">
              <MapPin size={16} /> No registrada
            </div>
          </div>

          <div className="contact-section">
            <div className="contact-section-title">Etiquetas</div>
            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
              <span className="badge emerald">WhatsApp</span>
            </div>
          </div>

          <div className="contact-section">
            <div className="contact-section-title">Inteligencia IA</div>
            <div className="card" style={{ padding: 14, background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--primary-300)', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Bot size={14} /> Resumen Histórico
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                El chatbot ha manejado esta conversación. El cliente interactuó a través del canal {selectedConv.channel}.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

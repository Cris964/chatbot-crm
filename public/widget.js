(function() {
  // 1. Get configuration
  const scriptTag = document.currentScript || document.querySelector('script[src*="widget.js"]');
  const clientId = scriptTag.getAttribute('data-client-id');
  if (!clientId) {
    console.error('NexusCRM Widget: Missing data-client-id attribute on script tag.');
    return;
  }

  // 2. Initialize Session
  let sessionId = localStorage.getItem('nexuscrm_session_id');
  if (!sessionId) {
    sessionId = 'web_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('nexuscrm_session_id', sessionId);
  }

  const API_URL = 'https://nexuscrmia.vercel.app/api/webchat';

  // 3. Inject CSS
  const style = document.createElement('style');
  style.innerHTML = `
    #nexus-chat-widget {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    #nexus-chat-bubble {
      width: 60px;
      height: 60px;
      background-color: #2563eb;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease;
    }
    #nexus-chat-bubble:hover {
      transform: scale(1.05);
    }
    #nexus-chat-bubble svg {
      width: 30px;
      height: 30px;
      fill: white;
    }
    #nexus-chat-window {
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 350px;
      height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 5px 25px rgba(0,0,0,0.2);
      display: none;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid #e5e7eb;
    }
    #nexus-chat-window.nexus-open {
      display: flex;
      animation: nexusSlideUp 0.3s ease;
    }
    @keyframes nexusSlideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    #nexus-chat-header {
      background: #2563eb;
      color: white;
      padding: 16px;
      font-weight: bold;
      font-size: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    #nexus-chat-close {
      cursor: pointer;
      font-size: 20px;
      line-height: 1;
    }
    #nexus-chat-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      background: #f9fafb;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .nexus-message {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.4;
      word-wrap: break-word;
    }
    .nexus-message.user {
      background: #2563eb;
      color: white;
      align-self: flex-end;
      border-bottom-right-radius: 2px;
    }
    .nexus-message.agent {
      background: white;
      color: #1f2937;
      align-self: flex-start;
      border-bottom-left-radius: 2px;
      border: 1px solid #e5e7eb;
    }
    .nexus-message img {
      max-width: 100%;
      border-radius: 8px;
      margin-top: 4px;
    }
    #nexus-chat-input-area {
      padding: 12px;
      background: white;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 8px;
    }
    #nexus-chat-input {
      flex: 1;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 20px;
      outline: none;
      font-size: 14px;
    }
    #nexus-chat-input:focus {
      border-color: #2563eb;
    }
    #nexus-chat-send {
      background: #2563eb;
      color: white;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #nexus-chat-send svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }
    .nexus-typing {
      display: flex;
      gap: 4px;
      padding: 12px 14px;
      align-self: flex-start;
      background: white;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }
    .nexus-dot {
      width: 6px;
      height: 6px;
      background: #9ca3af;
      border-radius: 50%;
      animation: nexusTyping 1.4s infinite ease-in-out both;
    }
    .nexus-dot:nth-child(1) { animation-delay: -0.32s; }
    .nexus-dot:nth-child(2) { animation-delay: -0.16s; }
    @keyframes nexusTyping {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
    
    @media (max-width: 480px) {
      #nexus-chat-window {
        width: 100vw;
        height: 100vh;
        bottom: 0;
        right: 0;
        border-radius: 0;
        position: fixed;
      }
      #nexus-chat-bubble {
        bottom: 16px;
        right: 16px;
      }
    }
  `;
  document.head.appendChild(style);

  // 4. Inject HTML
  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'nexus-chat-widget';
  widgetContainer.innerHTML = `
    <div id="nexus-chat-window">
      <div id="nexus-chat-header">
        <span>Asesor Virtual</span>
        <div id="nexus-chat-close">&times;</div>
      </div>
      <div id="nexus-chat-messages">
        <div class="nexus-message agent">¡Hola! Soy el asistente virtual. ¿En qué te puedo ayudar hoy?</div>
      </div>
      <div id="nexus-chat-input-area">
        <input type="text" id="nexus-chat-input" placeholder="Escribe un mensaje..." autocomplete="off" />
        <button id="nexus-chat-send">
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>
    <div id="nexus-chat-bubble">
      <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
    </div>
  `;
  document.body.appendChild(widgetContainer);

  // 5. Logic
  const bubble = document.getElementById('nexus-chat-bubble');
  const windowEl = document.getElementById('nexus-chat-window');
  const closeBtn = document.getElementById('nexus-chat-close');
  const input = document.getElementById('nexus-chat-input');
  const sendBtn = document.getElementById('nexus-chat-send');
  const messagesEl = document.getElementById('nexus-chat-messages');

  bubble.addEventListener('click', () => {
    windowEl.classList.add('nexus-open');
    bubble.style.display = 'none';
  });

  closeBtn.addEventListener('click', () => {
    windowEl.classList.remove('nexus-open');
    bubble.style.display = 'flex';
  });

  const appendMessage = (role, text, type = 'text') => {
    const msgEl = document.createElement('div');
    msgEl.className = `nexus-message ${role}`;
    if (type === 'text') {
      msgEl.innerText = text;
    } else if (type === 'image') {
      msgEl.innerHTML = `<img src="${text}" alt="Imagen enviada" />`;
    } else if (type === 'video') {
      msgEl.innerHTML = `<video src="${text}" controls style="max-width:100%; border-radius:8px;"></video>`;
    }
    messagesEl.appendChild(msgEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  };

  const showTyping = () => {
    const typingEl = document.createElement('div');
    typingEl.className = 'nexus-typing';
    typingEl.id = 'nexus-typing-indicator';
    typingEl.innerHTML = '<div class="nexus-dot"></div><div class="nexus-dot"></div><div class="nexus-dot"></div>';
    messagesEl.appendChild(typingEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  };

  const removeTyping = () => {
    const typingEl = document.getElementById('nexus-typing-indicator');
    if (typingEl) typingEl.remove();
  };

  const sendMessage = async () => {
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    appendMessage('user', text);
    showTyping();

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: clientId,
          sessionId: sessionId,
          message: text
        })
      });

      removeTyping();

      if (!response.ok) {
        appendMessage('agent', 'Lo siento, hubo un problema al procesar tu mensaje. Intenta de nuevo.');
        return;
      }

      const data = await response.json();
      if (data.messages && data.messages.length > 0) {
        data.messages.forEach(msg => {
          appendMessage('agent', msg.content, msg.type);
        });
      }
    } catch (err) {
      console.error(err);
      removeTyping();
      appendMessage('agent', 'Error de conexión. Revisa tu internet.');
    }
  };

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

})();

(function () {
  // ── Config ────────────────────────────────────────────────────────────────
  const script = document.currentScript ||
    document.querySelector('script[data-page-id]');

  const PAGE_ID  = script?.getAttribute('data-page-id')  || window.AUTOMORAI_PAGE_ID  || '';
  const BUSINESS = script?.getAttribute('data-business') || window.AUTOMORAI_BUSINESS || 'আমাদের সাথে কথা বলুন';
  const COLOR    = script?.getAttribute('data-color')    || window.AUTOMORAI_COLOR    || '#7c5cff';
  const API      = 'https://n8n2.kingpurefood.com/webhook/automorai/website-chat';

  if (!PAGE_ID) { console.warn('Automorai Widget: data-page-id missing'); return; }
  if (document.getElementById('am-widget')) return; // prevent duplicate

  // ── Session ID ────────────────────────────────────────────────────────────
  let sessionId = sessionStorage.getItem('am_sid');
  if (!sessionId) {
    sessionId = 'web_' + Math.random().toString(36).slice(2, 11) + '_' + Date.now();
    sessionStorage.setItem('am_sid', sessionId);
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #am-widget * { box-sizing: border-box; font-family: sans-serif; }
    #am-bubble {
      position: fixed; bottom: 24px; right: 24px; z-index: 99999;
      width: 56px; height: 56px; border-radius: 50%;
      background: ${COLOR}; color: #fff; border: none;
      font-size: 26px; cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.25);
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s;
    }
    #am-bubble:hover { transform: scale(1.1); }
    #am-box {
      position: fixed; bottom: 92px; right: 24px; z-index: 99998;
      width: 340px; max-width: calc(100vw - 32px);
      background: #fff; border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
      display: none; flex-direction: column; overflow: hidden;
    }
    #am-box.open { display: flex; }
    #am-header {
      background: ${COLOR}; color: #fff;
      padding: 14px 16px; font-weight: 700; font-size: 0.95rem;
      display: flex; justify-content: space-between; align-items: center;
    }
    #am-close {
      background: none; border: none; color: #fff;
      font-size: 20px; cursor: pointer; line-height: 1;
    }
    #am-messages {
      flex: 1; padding: 14px; overflow-y: auto;
      max-height: 320px; min-height: 160px;
      display: flex; flex-direction: column; gap: 8px;
      background: #f7f7fa;
    }
    .am-msg {
      max-width: 80%; padding: 9px 13px; border-radius: 14px;
      font-size: 0.88rem; line-height: 1.5; word-break: break-word;
    }
    .am-msg.user {
      align-self: flex-end;
      background: ${COLOR}; color: #fff;
      border-bottom-right-radius: 4px;
    }
    .am-msg.bot {
      align-self: flex-start;
      background: #fff; color: #222;
      border: 1px solid #e5e5e5;
      border-bottom-left-radius: 4px;
    }
    .am-msg.typing { color: #aaa; font-style: italic; }
    #am-footer {
      padding: 10px 12px;
      border-top: 1px solid #eee;
      display: flex; gap: 8px; background: #fff;
    }
    #am-input {
      flex: 1; padding: 9px 12px; border-radius: 10px;
      border: 1px solid #ddd; font-size: 0.88rem; outline: none;
    }
    #am-input:focus { border-color: ${COLOR}; }
    #am-send {
      padding: 9px 14px; background: ${COLOR}; color: #fff;
      border: none; border-radius: 10px; cursor: pointer;
      font-weight: 700; font-size: 0.88rem;
    }
    #am-send:disabled { opacity: 0.5; cursor: not-allowed; }
    #am-powered {
      text-align: center; font-size: 0.7rem; color: #bbb;
      padding: 4px 0 8px; background: #fff;
    }
    #am-powered a { color: #7c5cff; text-decoration: none; }
  `;
  document.head.appendChild(style);

  // ── HTML ──────────────────────────────────────────────────────────────────
  const widget = document.createElement('div');
  widget.id = 'am-widget';
  widget.innerHTML = `
    <button id="am-bubble" title="Chat with us">💬</button>
    <div id="am-box">
      <div id="am-header">
        <span>${BUSINESS}</span>
        <button id="am-close">✕</button>
      </div>
      <div id="am-messages">
        <div class="am-msg bot">👋 হ্যালো! আমি কীভাবে সাহায্য করতে পারি?</div>
      </div>
      <div id="am-footer">
        <input id="am-input" type="text" placeholder="Message লিখুন..." />
        <button id="am-send">Send</button>
      </div>
      <div id="am-powered">Powered by <a href="https://automorai.com" target="_blank">Automorai</a></div>
    </div>
  `;
  document.body.appendChild(widget);

  // ── Elements ──────────────────────────────────────────────────────────────
  const bubble   = document.getElementById('am-bubble');
  const box      = document.getElementById('am-box');
  const closeBtn = document.getElementById('am-close');
  const messages = document.getElementById('am-messages');
  const input    = document.getElementById('am-input');
  const sendBtn  = document.getElementById('am-send');

  bubble.addEventListener('click', () => {
    box.classList.toggle('open');
    if (box.classList.contains('open')) input.focus();
  });
  closeBtn.addEventListener('click', () => box.classList.remove('open'));

  // ── Text helpers ──────────────────────────────────────────────────────────
  function cleanText(text) {
    return text
      .replace(/#SEND_IMAGE:[^\n#]*/gi, '')
      .replace(/#ORDER_CONFIRMED/gi, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .trim();
  }

  function addMsg(text, role) {
    if (role === 'bot') text = cleanText(text);
    const div = document.createElement('div');
    div.className = `am-msg ${role}`;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    div.innerHTML = text.replace(urlRegex, '<a href="$1" target="_blank" style="color:#7c5cff;text-decoration:underline;word-break:break-all;">$1</a>');
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  }

  // ── Send ──────────────────────────────────────────────────────────────────
  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    sendBtn.disabled = true;
    addMsg(text, 'user');
    const typing = addMsg('typing...', 'bot typing');
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_id:     PAGE_ID,
          sender_id:   sessionId,
          sender_name: 'Website Visitor',
          message:     text
        })
      });
      const data = await res.json();
      typing.remove();
      addMsg(data.reply || 'দুঃখিত, উত্তর দিতে পারছি না।', 'bot');
    } catch {
      typing.remove();
      addMsg('❌ Connection error. Please try again.', 'bot');
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

})();

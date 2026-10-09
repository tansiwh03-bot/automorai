(function () {
  'use strict';

  var SUPABASE_URL = 'https://wwettpkioulkofohfdxl.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_ul461fEnojpr4GxdJv-P8Q_hySiflQt';
  var MESSAGES_TABLE_URL = SUPABASE_URL + '/rest/v1/messages';

  var scriptTag = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var SITE_ID = scriptTag.getAttribute('data-site-id') || '';
  var BRAND_COLOR = scriptTag.getAttribute('data-color') || '#7c5cff';

  if (!SITE_ID) { console.warn('Automorai Chat: data-site-id missing'); return; }

  var style = document.createElement('style');
  style.textContent = [
    '.amc-btn{position:fixed;bottom:24px;right:24px;width:62px;height:62px;border-radius:50%;background:' + BRAND_COLOR + ';color:#fff;display:flex;align-items:center;justify-content:center;font-size:28px;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,0.25);z-index:99998;transition:transform .2s ease;border:none;}',
    '.amc-btn:hover{transform:scale(1.08);}',
    '.amc-panel{position:fixed;bottom:98px;right:24px;width:330px;max-width:92vw;background:#fff;border-radius:18px;box-shadow:0 14px 40px rgba(0,0,0,0.22);padding:22px;z-index:99999;font-family:Inter,Arial,sans-serif;display:none;}',
    '.amc-panel.open{display:block;}',
    '.amc-title{font-weight:800;font-size:1.05rem;margin:0 0 4px;color:#1a1a1a;}',
    '.amc-sub{font-size:0.82rem;color:#777;margin:0 0 16px;}',
    '.amc-field{width:100%;padding:12px 14px;margin-bottom:10px;border:1.5px solid #e4e4e7;border-radius:10px;font-size:0.9rem;box-sizing:border-box;font-family:inherit;outline:none;transition:border-color .15s;}',
    '.amc-field:focus{border-color:' + BRAND_COLOR + ';}',
    'textarea.amc-field{resize:none;min-height:70px;}',
    '.amc-send{width:100%;padding:13px;border:none;border-radius:10px;background:' + BRAND_COLOR + ';color:#fff;font-weight:700;font-size:0.95rem;cursor:pointer;}',
    '.amc-send:disabled{opacity:0.6;cursor:default;}',
    '.amc-status{margin-top:10px;font-size:0.82rem;text-align:center;}',
    '.amc-status.ok{color:#16a34a;}',
    '.amc-status.err{color:#dc2626;}',
    '.amc-close{position:absolute;top:14px;right:16px;background:none;border:none;font-size:1.1rem;color:#999;cursor:pointer;}'
  ].join('');
  document.head.appendChild(style);

  var btn = document.createElement('button');
  btn.className = 'amc-btn';
  btn.innerHTML = '💬';
  btn.setAttribute('aria-label', 'মেসেজ করুন');
  document.body.appendChild(btn);

  var panel = document.createElement('div');
  panel.className = 'amc-panel';
  panel.style.position = 'fixed';
  panel.innerHTML =
    '<button class="amc-close">✕</button>' +
    '<div class="amc-title">আমাদের মেসেজ করুন</div>' +
    '<div class="amc-sub">আপনার প্রশ্ন বা অর্ডার সম্পর্কে জানান, আমরা দ্রুত যোগাযোগ করব।</div>' +
    '<input class="amc-field" id="amc-name" placeholder="আপনার নাম">' +
    '<input class="amc-field" id="amc-phone" placeholder="ফোন নম্বর" type="tel">' +
    '<textarea class="amc-field" id="amc-msg" placeholder="আপনার মেসেজ লিখুন..."></textarea>' +
    '<button class="amc-send" id="amc-send">মেসেজ পাঠান</button>' +
    '<div class="amc-status" id="amc-status"></div>';
  document.body.appendChild(panel);

  function togglePanel() {
    panel.classList.toggle('open');
  }
  btn.addEventListener('click', togglePanel);
  panel.querySelector('.amc-close').addEventListener('click', togglePanel);

  panel.querySelector('#amc-send').addEventListener('click', function () {
    var nameEl = panel.querySelector('#amc-name');
    var phoneEl = panel.querySelector('#amc-phone');
    var msgEl = panel.querySelector('#amc-msg');
    var statusEl = panel.querySelector('#amc-status');
    var sendBtn = panel.querySelector('#amc-send');

    var name = nameEl.value.trim();
    var phone = phoneEl.value.trim();
    var message = msgEl.value.trim();

    statusEl.textContent = '';
    statusEl.className = 'amc-status';

    if (!name || !phone || !message) {
      statusEl.textContent = 'সব ঘর পূরণ করুন';
      statusEl.className = 'amc-status err';
      return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = 'পাঠানো হচ্ছে...';

    fetch(MESSAGES_TABLE_URL, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        site_id: SITE_ID,
        customer_name: name,
        customer_phone: phone,
        message: message
      })
    }).then(function (res) {
      if (!res.ok) { throw new Error('failed'); }
      statusEl.textContent = '✅ পাঠানো হয়েছে, শীঘ্রই যোগাযোগ করা হবে!';
      statusEl.className = 'amc-status ok';
      nameEl.value = '';
      phoneEl.value = '';
      msgEl.value = '';
    }).catch(function () {
      statusEl.textContent = 'পাঠাতে সমস্যা হয়েছে, আবার চেষ্টা করুন';
      statusEl.className = 'amc-status err';
    }).finally(function () {
      sendBtn.disabled = false;
      sendBtn.textContent = 'মেসেজ পাঠান';
    });
  });
})();

(function () {
  'use strict';

  var SUPABASE_URL = 'https://wwettpkioulkofohfdxl.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_ul461fEnojpr4GxdJv-P8Q_hySiflQt';
  var ORDERS_API = 'https://n8n2.kingpurefood.com/webhook/automorai/orders';

  var scriptTag = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var SITE_ID = scriptTag.getAttribute('data-site-id') || '';
  var WHATSAPP = scriptTag.getAttribute('data-whatsapp') || '';
  var BKASH = scriptTag.getAttribute('data-bkash') || '';
  var NAGAD = scriptTag.getAttribute('data-nagad') || '';
  var BRAND_COLOR = scriptTag.getAttribute('data-color') || '#7c5cff';

  if (!SITE_ID) { console.warn('Automorai Shop: data-site-id missing'); return; }

  var state = { products: [], filtered: [], activeCategory: 'all' };

  // ───────── Styles ─────────
  var style = document.createElement('style');
  style.textContent = [
    '.amr-wrap{max-width:1200px;margin:0 auto;padding:40px 20px;font-family:inherit;}',
    '.amr-shop-head{text-align:center;margin-bottom:28px;}',
    '.amr-shop-head h2{font-size:1.8rem;font-weight:800;margin:0 0 6px;color:#1a1a1a;}',
    '.amr-shop-head p{color:#777;font-size:0.9rem;margin:0;}',
    '.amr-cat-row{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-bottom:30px;}',
    '.amr-cat-chip{padding:9px 20px;border-radius:30px;border:1.5px solid #e4e4e7;background:#fff;cursor:pointer;font-size:0.85rem;font-weight:600;color:#444;transition:all .15s;}',
    '.amr-cat-chip.sel{border-color:' + BRAND_COLOR + ';background:' + BRAND_COLOR + ';color:#fff;}',
    '.amr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:22px;}',
    '.amr-card{background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 14px rgba(0,0,0,0.08);cursor:pointer;transition:transform .25s ease,box-shadow .25s ease;position:relative;}',
    '.amr-card:hover{transform:translateY(-6px);box-shadow:0 12px 28px rgba(0,0,0,0.15);}',
    '.amr-img-wrap{position:relative;width:100%;padding-top:100%;overflow:hidden;background:#f2f2f2;}',
    '.amr-img-wrap img{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;transition:transform .4s ease;}',
    '.amr-card:hover .amr-img-wrap img{transform:scale(1.08);}',
    '.amr-card-body{padding:14px 16px 18px;}',
    '.amr-card-title{font-weight:700;font-size:0.95rem;margin:0 0 6px;color:#1a1a1a;}',
    '.amr-price-row{display:flex;align-items:baseline;gap:8px;}',
    '.amr-card-price{font-weight:800;font-size:1.05rem;color:' + BRAND_COLOR + ';}',
    '.amr-card-price-orig{font-size:0.85rem;color:#999;text-decoration:line-through;}',
    '.amr-badge{display:inline-block;background:#ff4d4d;color:#fff;font-size:0.7rem;font-weight:700;padding:3px 8px;border-radius:20px;position:absolute;top:10px;left:10px;z-index:2;}',
    '.amr-badge-sale{background:#16a34a;}',
    '.amr-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9998;display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;pointer-events:none;transition:opacity .2s;}',
    '.amr-overlay.open{opacity:1;pointer-events:auto;}',
    '.amr-modal{background:#fff;border-radius:16px;max-width:860px;width:100%;max-height:92vh;overflow-y:auto;display:grid;grid-template-columns:1fr 1fr;position:relative;}',
    '@media(max-width:680px){.amr-modal{grid-template-columns:1fr;}}',
    '.amr-modal-close{position:absolute;top:12px;right:12px;width:34px;height:34px;border-radius:50%;background:#fff;border:1px solid #eee;cursor:pointer;font-size:1.1rem;z-index:3;display:flex;align-items:center;justify-content:center;}',
    '.amr-modal-img{width:100%;height:100%;min-height:280px;object-fit:cover;background:#f2f2f2;}',
    '.amr-modal-body{padding:28px;}',
    '.amr-modal-title{font-size:1.3rem;font-weight:800;margin:0 0 6px;color:#1a1a1a;}',
    '.amr-modal-price{font-size:1.3rem;font-weight:800;color:' + BRAND_COLOR + ';margin-bottom:12px;}',
    '.amr-modal-desc{color:#666;font-size:0.9rem;line-height:1.6;margin-bottom:16px;}',
    '.amr-label{font-size:0.82rem;font-weight:700;color:#333;margin:14px 0 8px;display:block;}',
    '.amr-opt-row{display:flex;flex-wrap:wrap;gap:8px;}',
    '.amr-opt{padding:7px 14px;border-radius:8px;border:1.5px solid #ddd;background:#fff;cursor:pointer;font-size:0.85rem;font-weight:600;color:#444;transition:all .15s;}',
    '.amr-opt.sel{border-color:' + BRAND_COLOR + ';background:' + BRAND_COLOR + '18;color:' + BRAND_COLOR + ';}',
    '.amr-qty{display:flex;align-items:center;gap:12px;}',
    '.amr-qty button{width:34px;height:34px;border-radius:8px;border:1.5px solid #ddd;background:#fff;font-size:1.1rem;cursor:pointer;}',
    '.amr-qty span{font-weight:700;font-size:1rem;min-width:20px;text-align:center;}',
    '.amr-buy-btn{width:100%;margin-top:22px;padding:15px;border:none;border-radius:10px;background:' + BRAND_COLOR + ';color:#fff;font-size:1rem;font-weight:700;cursor:pointer;}',
    '.amr-form input,.amr-form textarea,.amr-form select{width:100%;padding:11px 13px;border:1.5px solid #ddd;border-radius:9px;font-size:0.9rem;margin-bottom:12px;box-sizing:border-box;font-family:inherit;}',
    '.amr-pay-row{display:flex;gap:8px;margin-bottom:12px;}',
    '.amr-pay-opt{flex:1;padding:12px 8px;border:1.5px solid #ddd;border-radius:9px;text-align:center;cursor:pointer;font-size:0.82rem;font-weight:700;color:#555;}',
    '.amr-pay-opt.sel{border-color:' + BRAND_COLOR + ';background:' + BRAND_COLOR + '18;color:' + BRAND_COLOR + ';}',
    '.amr-pay-note{background:#fff8e6;border:1px solid #ffe3a3;border-radius:8px;padding:10px 12px;font-size:0.8rem;color:#8a6500;margin-bottom:12px;}',
    '.amr-success{text-align:center;padding:30px 10px;}',
    '.amr-success h3{color:#1a1a1a;margin:14px 0 6px;}',
    '.amr-empty{text-align:center;padding:60px 20px;color:#999;}',
    '.amr-added-bar{position:fixed;top:16px;left:50%;transform:translateX(-50%) translateY(-120%);background:#1a1a1a;color:#fff;padding:14px 22px;border-radius:10px;font-size:0.9rem;display:flex;align-items:center;gap:14px;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,0.25);transition:transform .25s ease;}',
    '.amr-added-bar.show{transform:translateX(-50%) translateY(0);}',
    '.amr-added-bar a{color:' + BRAND_COLOR + ';font-weight:700;text-decoration:underline;cursor:pointer;}'
  ].join('');
  document.head.appendChild(style);

  // ───────── Mount point ─────────
  function getMount() {
    var el = document.getElementById('products');
    if (!el) {
      el = document.createElement('div');
      el.id = 'products';
      document.body.appendChild(el);
    }
    return el;
  }

  function getCategories() {
    var set = {};
    state.products.forEach(function (p) { if (p.category) set[p.category] = true; });
    return Object.keys(set);
  }

  function applyFilter() {
    state.filtered = state.activeCategory === 'all'
      ? state.products
      : state.products.filter(function (p) { return p.category === state.activeCategory; });
  }

  function renderGrid() {
    applyFilter();
    var mount = getMount();
    mount.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.className = 'amr-wrap';

    var head = document.createElement('div');
    head.className = 'amr-shop-head';
    head.innerHTML = '<h2>আমাদের প্রোডাক্টস</h2><p>সেরা মানের পণ্য, সেরা দামে</p>';
    wrap.appendChild(head);

    var categories = getCategories();
    if (categories.length > 0) {
      var catRow = document.createElement('div');
      catRow.className = 'amr-cat-row';
      var chips = ['all'].concat(categories);
      chips.forEach(function (c) {
        var chip = document.createElement('div');
        chip.className = 'amr-cat-chip' + (state.activeCategory === c ? ' sel' : '');
        chip.textContent = c === 'all' ? 'সব' : c;
        chip.onclick = function () { state.activeCategory = c; renderGrid(); };
        catRow.appendChild(chip);
      });
      wrap.appendChild(catRow);
    }

    if (state.filtered.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'amr-empty';
      empty.textContent = 'কোনো প্রোডাক্ট পাওয়া যায়নি।';
      wrap.appendChild(empty);
      mount.appendChild(wrap);
      return;
    }

    var grid = document.createElement('div');
    grid.className = 'amr-grid';

    state.filtered.forEach(function (p) {
      var card = document.createElement('div');
      card.className = 'amr-card';
      var img = (p.images && p.images[0]) || '';
      var outOfStock = (p.stock || 0) <= 0;
      var onSale = p.original_price && Number(p.original_price) > Number(p.price);
      var discountPct = onSale ? Math.round(100 - (Number(p.price) / Number(p.original_price)) * 100) : 0;

      var badge = '';
      if (outOfStock) badge = '<span class="amr-badge">Stock Out</span>';
      else if (onSale) badge = '<span class="amr-badge amr-badge-sale">-' + discountPct + '%</span>';

      card.innerHTML =
        '<div class="amr-img-wrap">' + badge +
          '<img src="' + img + '" alt="' + escapeHtml(p.title) + '" loading="lazy">' +
        '</div>' +
        '<div class="amr-card-body">' +
          '<p class="amr-card-title">' + escapeHtml(p.title) + '</p>' +
          '<div class="amr-price-row">' +
            '<p class="amr-card-price">৳' + p.price + '</p>' +
            (onSale ? '<p class="amr-card-price-orig">৳' + p.original_price + '</p>' : '') +
          '</div>' +
        '</div>';
      card.addEventListener('click', function () { openModal(p); });
      grid.appendChild(card);
    });

    wrap.appendChild(grid);
    mount.appendChild(wrap);
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ───────── Modal ─────────
  var overlay = document.createElement('div');
  overlay.className = 'amr-overlay';
  document.body.appendChild(overlay);

  function closeModal() {
    overlay.classList.remove('open');
    setTimeout(function () { overlay.innerHTML = ''; }, 200);
  }

  function openModal(p) {
    var selected = { size: (p.sizes && p.sizes[0]) || '', color: (p.colors && p.colors[0]) || '', qty: 1 };
    var img = (p.images && p.images[0]) || '';

    overlay.innerHTML =
      '<div class="amr-modal">' +
        '<button class="amr-modal-close" id="amrClose">✕</button>' +
        '<img class="amr-modal-img" src="' + img + '" alt="">' +
        '<div class="amr-modal-body" id="amrModalBody"></div>' +
      '</div>';

    renderModalBody();
    overlay.classList.add('open');
    document.getElementById('amrClose').onclick = closeModal;
    overlay.onclick = function (e) { if (e.target === overlay) closeModal(); };

    function renderModalBody() {
      var body = document.getElementById('amrModalBody');
      var onSale = p.original_price && Number(p.original_price) > Number(p.price);
      var html =
        '<p class="amr-modal-title">' + escapeHtml(p.title) + '</p>' +
        '<p class="amr-modal-price">৳' + (p.price * selected.qty) +
          (onSale ? ' <span style="font-size:0.9rem;color:#999;text-decoration:line-through;font-weight:600;">৳' + (p.original_price * selected.qty) + '</span>' : '') +
        '</p>' +
        (p.description ? '<p class="amr-modal-desc">' + escapeHtml(p.description) + '</p>' : '');

      if (p.sizes && p.sizes.length) {
        html += '<label class="amr-label">সাইজ বেছে নিন</label><div class="amr-opt-row" id="amrSizes">' +
          p.sizes.map(function (s) { return '<div class="amr-opt' + (s === selected.size ? ' sel' : '') + '" data-size="' + escapeHtml(s) + '">' + escapeHtml(s) + '</div>'; }).join('') + '</div>';
      }
      if (p.colors && p.colors.length) {
        html += '<label class="amr-label">কালার বেছে নিন</label><div class="amr-opt-row" id="amrColors">' +
          p.colors.map(function (c) { return '<div class="amr-opt' + (c === selected.color ? ' sel' : '') + '" data-color="' + escapeHtml(c) + '">' + escapeHtml(c) + '</div>'; }).join('') + '</div>';
      }
      html += '<label class="amr-label">পরিমাণ</label><div class="amr-qty"><button id="amrQtyMinus">−</button><span id="amrQtyVal">' + selected.qty + '</span><button id="amrQtyPlus">+</button></div>';
      html += '<button class="amr-buy-btn" id="amrBuyBtn">অর্ডার করুন</button>';
      body.innerHTML = html;

      var sizesEl = document.getElementById('amrSizes');
      if (sizesEl) sizesEl.querySelectorAll('.amr-opt').forEach(function (el) {
        el.onclick = function () { selected.size = el.getAttribute('data-size'); renderModalBody(); };
      });
      var colorsEl = document.getElementById('amrColors');
      if (colorsEl) colorsEl.querySelectorAll('.amr-opt').forEach(function (el) {
        el.onclick = function () { selected.color = el.getAttribute('data-color'); renderModalBody(); };
      });
      document.getElementById('amrQtyMinus').onclick = function () { if (selected.qty > 1) selected.qty--; renderModalBody(); };
      document.getElementById('amrQtyPlus').onclick = function () { selected.qty++; renderModalBody(); };
      document.getElementById('amrBuyBtn').onclick = function () { openCheckout(p, selected); };
    }
  }

  // ───────── Checkout ─────────
  function openCheckout(p, selected) {
    var pay = { method: 'cod' };
    var modal = overlay.querySelector('.amr-modal');
    var body = overlay.querySelector('.amr-modal-body');

    function renderCheckout() {
      var payNumber = pay.method === 'bkash' ? BKASH : pay.method === 'nagad' ? NAGAD : '';
      body.innerHTML =
        '<p class="amr-modal-title">Checkout</p>' +
        '<p class="amr-modal-price">' + escapeHtml(p.title) + ' × ' + selected.qty + ' = ৳' + (p.price * selected.qty) + '</p>' +
        '<form class="amr-form" id="amrCheckoutForm">' +
          '<label class="amr-label">নাম *</label><input required id="amrName" placeholder="আপনার নাম">' +
          '<label class="amr-label">ফোন নম্বর *</label><input required id="amrPhone" placeholder="01XXXXXXXXX">' +
          '<label class="amr-label">ঠিকানা *</label><textarea required id="amrAddress" rows="2" placeholder="সম্পূর্ণ ঠিকানা লিখুন"></textarea>' +
          '<label class="amr-label">পেমেন্ট পদ্ধতি</label>' +
          '<div class="amr-pay-row">' +
            '<div class="amr-pay-opt' + (pay.method === 'cod' ? ' sel' : '') + '" data-pay="cod">🚚 ক্যাশ অন ডেলিভারি</div>' +
            (BKASH ? '<div class="amr-pay-opt' + (pay.method === 'bkash' ? ' sel' : '') + '" data-pay="bkash">📱 বিকাশ</div>' : '') +
            (NAGAD ? '<div class="amr-pay-opt' + (pay.method === 'nagad' ? ' sel' : '') + '" data-pay="nagad">💵 নগদ</div>' : '') +
          '</div>' +
          (payNumber ? '<div class="amr-pay-note">এই নম্বরে Send Money করুন: <b>' + payNumber + '</b>, তারপর নিচে Transaction ID দিন।</div><label class="amr-label">Transaction ID *</label><input required id="amrTxId" placeholder="TrxID">' : '') +
          '<button type="submit" class="amr-buy-btn">অর্ডার কনফার্ম করুন</button>' +
        '</form>';

      body.querySelectorAll('.amr-pay-opt').forEach(function (el) {
        el.onclick = function () { pay.method = el.getAttribute('data-pay'); renderCheckout(); };
      });

      document.getElementById('amrCheckoutForm').onsubmit = function (e) {
        e.preventDefault();
        var payload = {
          site_id: SITE_ID,
          product_title: p.title,
          product_price: p.price,
          selected_size: selected.size || '',
          selected_color: selected.color || '',
          quantity: selected.qty,
          customer_name: document.getElementById('amrName').value,
          customer_phone: document.getElementById('amrPhone').value,
          customer_address: document.getElementById('amrAddress').value,
          payment_method: pay.method,
          transaction_id: pay.method !== 'cod' ? (document.getElementById('amrTxId') ? document.getElementById('amrTxId').value : '') : '',
          business_whatsapp: WHATSAPP
        };
        var btn = body.querySelector('button[type="submit"]');
        btn.disabled = true; btn.textContent = 'অর্ডার হচ্ছে...';
        fetch(ORDERS_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            body.innerHTML = '<div class="amr-success"><div style="font-size:3rem;">✅</div><h3>অর্ডার সফল হয়েছে!</h3><p style="color:#666;font-size:0.9rem;">শীঘ্রই আমরা আপনার সাথে যোগাযোগ করব।</p><button class="amr-buy-btn" id="amrCloseSuccess">বন্ধ করুন</button></div>';
            document.getElementById('amrCloseSuccess').onclick = closeModal;
          })
          .catch(function () {
            btn.disabled = false; btn.textContent = 'অর্ডার কনফার্ম করুন';
            alert('দুঃখিত, সমস্যা হয়েছে। আবার চেষ্টা করুন।');
          });
      };
    }
    renderCheckout();
  }

  // ───────── Init ─────────
  // Note: the floating "Message Us" button is now handled site-wide by automorai-chat.js
  // (injected on every site, service or ecommerce), so this script no longer duplicates it.
  function init() {
    fetch(SUPABASE_URL + '/rest/v1/products?site_id=eq.' + encodeURIComponent(SITE_ID) + '&is_active=eq.true&order=created_at.desc', {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY }
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        state.products = Array.isArray(data) ? data : [];
        renderGrid();
      })
      .catch(function (e) { console.error('Automorai Shop load error:', e); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

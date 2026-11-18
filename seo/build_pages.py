#!/usr/bin/env python3
"""Static SEO landing pages for automorai.com (2026-11-17).
Writes public/<slug>.html (served before the SPA rewrite; vercel.json cleanUrls makes /<slug> work) + public/sitemap.xml.
Every claim must stay true to what Automorai really does (see /root/automorai/CLAUDE.md). Prices: 990 (coming soon) / 2,490 / 4,990.
Run:  python3 seo/build_pages.py   then commit + push (Vercel deploys).
"""
import json, html, os, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, 'public')
SITE = 'https://automorai.com'
WA = 'https://wa.me/8801615763484?text=' + 'Automorai%20%E0%A6%B8%E0%A6%AE%E0%A7%8D%E0%A6%AA%E0%A6%B0%E0%A7%8D%E0%A6%95%E0%A7%87%20%E0%A6%9C%E0%A6%BE%E0%A6%A8%E0%A6%A4%E0%A7%87%20%E0%A6%9A%E0%A6%BE%E0%A6%87'
DEMO = 'https://arisha-fashion-world-723365.tansiwh03.workers.dev/'
e = html.escape

COMMON_SHOP = ['পণ্যের তালিকা, ক্যাটাগরি আর সার্চ', 'প্রতিটা পণ্যের নিজের পাতা — ছবি, দাম, ছাড়, সাইজ ও রঙ',
               'কার্ট, ক্যাশ অন ডেলিভারি, bKash/Nagad (Transaction ID সহ)', 'ঢাকা ও ঢাকার বাইরের ডেলিভারি চার্জ নিজে যোগ হয়',
               'দোকানেই AI চ্যাট — ক্রেতার প্রশ্নের উত্তর দেয়, পণ্যের ছবি দেখায়', 'নতুন অর্ডার এলে আপনার WhatsApp-এ খবর',
               'কার্টে রেখে চলে যাওয়া ক্রেতাকে মনে করানো', 'বাংলা / English — ক্রেতা নিজে বদলাতে পারে']

PAGES = [
  dict(slug='facebook-auto-reply', kw='Facebook Auto Reply',
       title='Facebook অটো রিপ্লাই বাংলায় — কমেন্ট ও Messenger-এ AI উত্তর | Automorai',
       h1='Facebook পেজে অটো রিপ্লাই — বাংলায়, ৩ সেকেন্ডে',
       desc='Facebook পেজের কমেন্ট আর Messenger-এ AI নিজে উত্তর দেয় — দাম, স্টক, ডেলিভারি। বাংলা, English, Banglish বোঝে। খারাপ কমেন্ট সরিয়ে দেয়। বাংলাদেশের দোকানদারদের জন্য।',
       lead='"দাম কত?", "আছে?", "inbox plz" — দিনে শত বার একই উত্তর আর টাইপ করতে হবে না। Automorai-র AI আপনার পেজের কমেন্ট আর Messenger-এ নিজে উত্তর দেয়, রাত ২টায়ও।',
       pts=['কমেন্টে স্বয়ংক্রিয় উত্তর', 'Messenger-এ AI উত্তর — আপনার পণ্যের তালিকা দেখে', 'বাংলা, English আর Banglish বোঝে', 'Messenger-এ পণ্যের ছবিও পাঠায়', 'গালাগালি বা খারাপ কমেন্ট নিজে সরিয়ে দেয়', 'দরদাম করলে আপনাকে জানায়'],
       img='shop-products.jpg',
       faq=[('AI কি আমার পণ্যের দাম জানবে?', 'হ্যাঁ। আপনার দোকানের পণ্যের তালিকা থেকে দাম আর স্টক দেখে উত্তর দেয়। তালিকায় না থাকলে বানিয়ে বলে না।'),
            ('Facebook পেজ যুক্ত করতে কতক্ষণ লাগে?', 'Dashboard থেকে "Connect Facebook Page" চাপলেই কয়েক মিনিটে হয়ে যায়।'),
            ('Facebook-এর নিজের অটো রিপ্লাই থেকে পার্থক্য কী?', 'Automorai শুধু উত্তর দেয় না — আপনার অনলাইন দোকান, অর্ডার, WhatsApp আর সব মেসেজ এক জায়গায় চালায়।')]),
  dict(slug='whatsapp-auto-reply', kw='WhatsApp Auto Reply',
       title='WhatsApp অটো রিপ্লাই — WhatsApp Business-এ AI দিয়ে বিক্রি | Automorai',
       h1='WhatsApp-এ AI — ক্রেতার প্রশ্নের উত্তর আর অর্ডার',
       desc='দোকানের WhatsApp নম্বরে ক্রেতা লিখলে AI বাংলায় উত্তর দেয় — দাম, স্টক, পণ্যের ছবি, অর্ডার। ছবি আর ভয়েস মেসেজ বোঝে। বাংলাদেশের দোকানদারদের জন্য।',
       lead='ক্রেতা WhatsApp-এ পণ্যের ছবি পাঠাল বা ভয়েসে জিজ্ঞেস করল — AI বুঝে দাম বলে, পণ্যের ছবি পাঠায়, নাম-মোবাইল-ঠিকানা নিয়ে অর্ডার নেয়।',
       pts=['ক্রেতার ছবি দেখে পণ্য চেনে', 'ভয়েস মেসেজ বোঝে', 'পণ্যের ছবি পাঠায়', 'নাম, মোবাইল, ঠিকানা নিয়ে অর্ডার নেয়', 'দরদাম বেশি হলে আপনাকে জানায়', 'সব কথা এক Inbox-এ'],
       img='shop-buy.jpg',
       faq=[('আমার নিজের WhatsApp নম্বরেই চলবে?', 'হ্যাঁ, দোকানের নম্বরে। Meta-র যাচাইয়ের জন্য সাধারণত ১-২ দিন লাগে। এটা "ব্যবসা" প্যাকেজে আছে।'),
            ('মাসে কতগুলো উত্তর দেবে?', '"ব্যবসা" প্যাকেজে মাসে ৫,০০০ AI উত্তর পর্যন্ত।'),
            ('অর্ডারের খবর কোথায় পাব?', 'নতুন অর্ডার এলে আপনার WhatsApp-এ সাথে সাথে খবর যায়, আর Dashboard-এর Orders-এ জমা থাকে।')]),
  dict(slug='online-shop-website', kw='Online Shop Website',
       title='অনলাইন দোকানের ওয়েবসাইট তৈরি — কয়েক মিনিটে, কোড ছাড়া | Automorai',
       h1='নিজের অনলাইন দোকানের ওয়েবসাইট — কয়েক মিনিটে',
       desc='বাংলাদেশে ই-কমার্স ওয়েবসাইট তৈরি — পণ্য, কার্ট, ক্যাশ অন ডেলিভারি, bKash/Nagad, ডেলিভারি চার্জ, AI চ্যাট। কোড জানতে হয় না। মাসে ২,৪৯০ টাকা।',
       lead='দোকানের নাম আর ধরন দিন — ক্যাটাগরি, স্লাইডার, চেকআউট আর AI চ্যাট সহ সাজানো দোকান তৈরি। তারপর Dashboard থেকে নিজের পণ্য দিন, লিংক Facebook-এ শেয়ার করুন।',
       pts=COMMON_SHOP, img='shop-desktop.jpg',
       faq=[('ওয়েবসাইট বানাতে কি টাকা লাগে?', 'account খোলা আর দোকানের প্রিভিউ বানানো বিনামূল্যে। দোকান লাইভ করতে "ব্যবসা" প্যাকেজ — মাসে ২,৪৯০ টাকা।'),
            ('ডোমেইন বা হোস্টিং কিনতে হবে?', 'না। দোকান আমাদের সার্ভারে চলে, আলাদা হোস্টিং লাগে না।'),
            ('পেমেন্ট কীভাবে নেব?', 'ক্যাশ অন ডেলিভারি, আর bKash/Nagad/ব্যাংক — ক্রেতা টাকা পাঠিয়ে Transaction ID দেয়, আপনি দেখে নিশ্চিত করেন।')]),
  dict(slug='f-commerce', kw='F-commerce',
       title='F-commerce ব্যবসার জন্য সব এক জায়গায় — Facebook পেজ থেকে অনলাইন দোকান | Automorai',
       h1='Facebook পেজের ব্যবসা (F-commerce) — এখন আরও সহজ',
       desc='Facebook পেজে বিক্রি করেন? কমেন্ট-ইনবক্সের উত্তর AI দেবে, নিজের অনলাইন দোকান আর অর্ডারের তালিকা — সব এক জায়গায়। বাংলাদেশের F-commerce উদ্যোক্তাদের জন্য।',
       lead='কমেন্টে "দাম কত", ইনবক্সে "আছে?", WhatsApp-এ অর্ডার, খাতায় হিসাব — সব আলাদা জায়গায়। Automorai সব এক জায়গায় আনে।',
       pts=['কমেন্ট আর Messenger-এ AI উত্তর', 'নিজের অনলাইন দোকান — লিংক পোস্টে দিন', 'সব মেসেজ এক Inbox-এ', 'সব অর্ডার এক তালিকায় — Pending থেকে Delivered', 'Facebook Pixel বসানো — বিজ্ঞাপনে আবার ক্রেতা আনুন', 'bKash/Nagad-এ মাসিক টাকা, ডলার কার্ড লাগে না'],
       img='shop-products.jpg',
       faq=[('আমি তো শুধু Facebook-এ বিক্রি করি, ওয়েবসাইট লাগবে কেন?', 'পোস্টে দোকানের লিংক দিলে ক্রেতা নিজেই সব পণ্য আর দাম দেখে অর্ডার করে — বারবার "দাম কত" উত্তর দিতে হয় না।'),
            ('Pixel কী কাজে লাগে?', 'কে দোকান দেখে চলে গেল, Facebook জানবে — তাদেরকেই আবার বিজ্ঞাপন দেখানো যায়। "ব্যবসা" প্যাকেজে আমরা বসিয়ে দিই।')]),
]
NICHES = [('fashion', 'ফ্যাশন ও পোশাক', 'পাঞ্জাবি, শাড়ি, থ্রি-পিস, শার্ট — সাইজ আর রঙ সহ'),
          ('kids-wear', 'শিশুদের পোশাক', 'ফ্রক, বেবি সেট, শিশুদের জামা — সাইজ সহ'),
          ('cosmetics', 'কসমেটিক্স ও বিউটি', 'মেকআপ, স্কিন কেয়ার, পারফিউম'),
          ('food', 'খাবার ও গ্রোসারি', 'মাছ, মাংস, ঘি, মধু, অর্গানিক খাবার'),
          ('electronics', 'ইলেকট্রনিক্স ও গ্যাজেট', 'মোবাইল এক্সেসরিজ, গ্যাজেট, ছোট ইলেকট্রনিক্স'),
          ('jewelry', 'গয়না', 'অলংকার, ইমিটেশন জুয়েলারি, ঘড়ি'),
          ('home-decor', 'ঘর সাজানো ও আসবাব', 'ঘর সাজানোর জিনিস, আসবাবপত্র, কিচেন'),
          ('general-store', 'জেনারেল স্টোর', 'যেকোনো ধরনের পণ্য — এক দোকানে')]
for slug, bn, ex in NICHES:
    PAGES.append(dict(slug=f'{slug}-online-shop', kw=f'{bn} অনলাইন দোকান',
        title=f'{bn}-এর অনলাইন দোকান তৈরি — ওয়েবসাইট + AI উত্তর | Automorai',
        h1=f'{bn}-এর জন্য নিজের অনলাইন দোকান',
        desc=f'{bn}-এর ব্যবসার জন্য অনলাইন দোকানের ওয়েবসাইট — {ex}। কার্ট, ক্যাশ অন ডেলিভারি, bKash/Nagad, Facebook ও WhatsApp-এ বাংলায় AI উত্তর।',
        lead=f'{ex} — আপনার পণ্য সুন্দর করে সাজানো দোকানে। ক্রেতা নিজে দেখে অর্ডার করে, প্রশ্ন করলে AI উত্তর দেয়।',
        pts=COMMON_SHOP[:6], img='shop-products.jpg',
        faq=[(f'{bn}-এর জন্য আলাদা ডিজাইন আছে?', f'দোকান বানানোর সময় ধরন বেছে নিলে সেই অনুযায়ী ক্যাটাগরি আর সাজানো শুরুর পণ্য আসে — পরে নিজের পণ্য দিয়ে বদলে নেবেন।'),
             ('সাইজ আর রঙ দেওয়া যায়?', 'হ্যাঁ, প্রতিটা পণ্যে সাইজ আর রঙ দেওয়া যায় — ক্রেতা বেছে নিয়ে কার্টে যোগ করে।')]))

STYLE = """:root{--teal:#0f766e;--ink:#0f172a;--muted:#475569;--line:#e2e8f0}*{box-sizing:border-box}body{margin:0;font-family:'Hind Siliguri','Inter',system-ui,sans-serif;color:var(--ink);background:#fff;line-height:1.65}a{color:inherit;text-decoration:none}img{max-width:100%;display:block}
.w{max-width:1080px;margin:0 auto;padding:0 18px}.nav{position:sticky;top:0;background:rgba(255,255,255,.92);backdrop-filter:blur(8px);border-bottom:1px solid #f1f5f9;z-index:5}.nav .w{display:flex;justify-content:space-between;align-items:center;height:60px}
.logo{font-weight:700;font-size:1.3rem}.logo span{color:#14b8a6}.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:999px;font-weight:600;padding:12px 22px;white-space:nowrap;transition:transform .2s}.btn:hover{transform:translateY(-2px)}
.bt{background:var(--teal);color:#fff}.bw{border:2px solid #16a34a;color:#15803d}.bs{padding:8px 16px;font-size:.95rem}
.hero{background:linear-gradient(180deg,#f0fdfa,#fff);padding:46px 0 40px}.hero .w{display:grid;gap:34px;align-items:center}@media(min-width:900px){.hero .w{grid-template-columns:1.1fr .9fr}}
.crumb{font-size:.85rem;color:var(--muted)}.crumb a{color:var(--teal)}h1{font-size:clamp(1.9rem,4.6vw,2.9rem);line-height:1.2;margin:10px 0 14px}.lead{font-size:1.12rem;color:var(--muted);margin:0 0 24px}.ctas{display:flex;flex-wrap:wrap;gap:10px}
.shot{border-radius:22px;overflow:hidden;box-shadow:0 30px 60px -30px rgba(15,23,42,.45);border:1px solid var(--line)}.sec{padding:46px 0}.alt{background:#f8fafc;border-top:1px solid #f1f5f9;border-bottom:1px solid #f1f5f9}
h2{font-size:clamp(1.4rem,3.4vw,2rem);margin:0 0 18px}.pts{list-style:none;padding:0;margin:0;display:grid;gap:12px}@media(min-width:760px){.pts{grid-template-columns:1fr 1fr}}
.pts li{display:flex;gap:10px;background:#fff;border:1px solid var(--line);border-radius:14px;padding:12px 14px}.pts li:before{content:"✓";color:#fff;background:var(--teal);border-radius:50%;width:22px;height:22px;flex:none;display:grid;place-items:center;font-size:.8rem;margin-top:2px}
.price{display:grid;gap:14px}@media(min-width:760px){.price{grid-template-columns:repeat(3,1fr)}}.pc{border:1px solid var(--line);border-radius:18px;padding:20px;background:#fff}.pc.pop{border:2px solid var(--teal)}.pc b{font-size:1.9rem;display:block}.pc small{color:var(--muted)}.soon{color:#92400e;font-size:.85rem;font-weight:600}
details{border-bottom:1px solid var(--line);padding:4px 0}summary{cursor:pointer;font-weight:600;padding:12px 0;font-size:1.05rem}details p{margin:0 0 14px;color:var(--muted)}
.chips{display:flex;flex-wrap:wrap;gap:8px}.chips a{border:1px solid var(--line);border-radius:999px;padding:7px 14px;font-size:.95rem}.chips a:hover{border-color:var(--teal);color:var(--teal)}
.cta{background:linear-gradient(135deg,#0f766e,#059669);color:#fff;border-radius:24px;padding:34px 22px;text-align:center}.cta h2{color:#fff}.cta .btn{background:#fff;color:var(--teal)}
footer{background:#020617;color:#94a3b8;padding:34px 0;margin-top:40px;font-size:.92rem}footer a{color:#cbd5e1}footer .w{display:flex;flex-wrap:wrap;gap:18px;justify-content:space-between}"""

def page(p, others):
    url = f'{SITE}/{p["slug"]}'
    ld = {'@context': 'https://schema.org', '@graph': [
        {'@type': 'WebPage', 'name': p['title'], 'url': url, 'inLanguage': 'bn', 'description': p['desc'],
         'isPartOf': {'@type': 'WebSite', 'name': 'Automorai', 'url': SITE + '/'}},
        {'@type': 'BreadcrumbList', 'itemListElement': [{'@type': 'ListItem', 'position': 1, 'name': 'Automorai', 'item': SITE + '/'},
                                                         {'@type': 'ListItem', 'position': 2, 'name': p['h1'], 'item': url}]},
        {'@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in p['faq']]}]}
    pts = ''.join(f'<li>{e(x)}</li>' for x in p['pts'])
    faq = ''.join(f'<details><summary>{e(q)}</summary><p>{e(a)}</p></details>' for q, a in p['faq'])
    links = ''.join(f'<a href="/{o["slug"]}">{e(o["kw"])}</a>' for o in others if o['slug'] != p['slug'])
    return f"""<!doctype html>
<html lang="bn"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(p['title'])}</title><meta name="description" content="{e(p['desc'])}"><link rel="canonical" href="{url}"><meta name="robots" content="index, follow">
<meta property="og:title" content="{e(p['title'])}"><meta property="og:description" content="{e(p['desc'])}"><meta property="og:url" content="{url}"><meta property="og:type" content="website"><meta property="og:locale" content="bn_BD"><meta property="og:image" content="{SITE}/showcase/{p['img']}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" href="/favicon-48.png" type="image/png" sizes="48x48"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><meta name="theme-color" content="#0f766e">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<style>{STYLE}</style><script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script></head><body>
<header class="nav"><div class="w"><a class="logo" href="/">Automorai<span>.</span></a><a class="btn bt bs" href="/signup">বিনামূল্যে শুরু</a></div></header>
<main>
<section class="hero"><div class="w"><div><div class="crumb"><a href="/">Automorai</a> › {e(p['kw'])}</div><h1>{e(p['h1'])}</h1><p class="lead">{e(p['lead'])}</p>
<div class="ctas"><a class="btn bt" href="/signup">বিনামূল্যে দোকান বানান</a><a class="btn bw" href="{WA}" target="_blank" rel="noopener noreferrer">WhatsApp-এ কথা বলুন</a></div></div>
<a class="shot" href="{DEMO}" target="_blank" rel="noopener" title="নমুনা দোকান দেখুন"><img src="/showcase/{p['img']}" alt="Automorai দিয়ে বানানো নমুনা অনলাইন দোকান" loading="eager"></a></div></section>
<section class="sec"><div class="w"><h2>যা যা পাবেন</h2><ul class="pts">{pts}</ul></div></section>
<section class="sec alt"><div class="w"><h2>দাম — মাসিক, যেকোনো সময় বন্ধ</h2><div class="price">
<div class="pc"><span class="soon">শিগগিরই আসছে</span><h3>শুরু</h3><b>৳৯৯০</b><small>ছোট ওয়েবসাইট, Messenger-এ AI, "WhatsApp-এ অর্ডার" বাটন</small></div>
<div class="pc pop"><h3>ব্যবসা</h3><b>৳২,৪৯০</b><small>পুরো অনলাইন দোকান, WhatsApp ও Messenger-এ AI (মাসে ৫,০০০ উত্তর), সব মেসেজ এক জায়গায়, Pixel ও Analytics আমরা বসাই</small></div>
<div class="pc"><h3>বড়</h3><b>৳৪,৯৯০</b><small>সব কিছু + একাধিক Facebook পেজ, WooCommerce, দ্রুত সাপোর্ট</small></div></div>
<p style="color:#475569;margin-top:14px">bKash বা Nagad-এ পেমেন্ট — ডলার কার্ড লাগে না। <a href="{DEMO}" target="_blank" rel="noopener" style="color:#0f766e;font-weight:600">নমুনা দোকান দেখুন ↗</a></p></div></section>
<section class="sec"><div class="w"><h2>সাধারণ প্রশ্ন</h2>{faq}</div></section>
<section class="sec"><div class="w"><div class="cta"><h2>আজই নিজের অনলাইন দোকান খুলুন</h2><p>account খোলা বিনামূল্যে। প্রশ্ন থাকলে WhatsApp-এ লিখুন।</p><a class="btn" href="/signup">বিনামূল্যে শুরু করুন</a></div></div></section>
<section class="sec" style="padding-top:0"><div class="w"><h2>আরও দেখুন</h2><div class="chips"><a href="/">Automorai হোম</a>{links}</div></div></section>
</main>
<footer><div class="w"><div><b style="color:#fff">Automorai.</b> — আপনি ঘুমান, ব্যবসা চলুক।</div><div>WhatsApp <a href="{WA}">01615-763484</a> · <a href="mailto:info@automorai.com">info@automorai.com</a> · <a href="/privacy">Privacy</a></div><div>© ২০২৬ Automorai · ঢাকা, বাংলাদেশ</div></div></footer>
</body></html>"""

def main():
    for p in PAGES:
        with open(os.path.join(PUB, p['slug'] + '.html'), 'w') as f: f.write(page(p, PAGES))
    today = datetime.date.today().isoformat()
    urls = [('', '1.0')] + [(p['slug'], '0.8') for p in PAGES]
    with open(os.path.join(PUB, 'sitemap.xml'), 'w') as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        for u, pr in urls: f.write(f'  <url><loc>{SITE}/{u}</loc><lastmod>{today}</lastmod><priority>{pr}</priority></url>\n')
        f.write('</urlset>\n')
    vp = os.path.join(ROOT, 'vercel.json'); v = json.load(open(vp)); v.pop('cleanUrls', None)   # cleanUrls breaks the SPA rewrite (2026-11-17 outage)
    v['rewrites'] = [{'source': f'/{p["slug"]}', 'destination': f'/{p["slug"]}.html'} for p in PAGES] + [{'source': '/(.*)', 'destination': '/index.html'}]
    json.dump(v, open(vp, 'w'), indent=2)
    print(len(PAGES), 'pages')

if __name__ == '__main__': main()

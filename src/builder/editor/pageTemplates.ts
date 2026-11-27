// Starter pages (Add page) and design templates (Templates). Both only build the same JSON the editor already edits,
// so everything they create can be changed afterwards, and undo works.
import { newId, type PageDoc, type Section, type SiteTheme, type FontKey, SCHEMA_VERSION } from '../schema';

const T = (en: string, bn: string) => ({ en, bn });
const sec = (type: Section['type'], props: Record<string, unknown>, blocks?: Section['blocks']): Section =>
  ({ id: newId(type.slice(0, 6)), type, props, ...(blocks ? { blocks } : {}) });

const footerOf = (theme: SiteTheme) => (theme.globals.after.find(s => s.type === 'footer')?.props || {}) as Record<string, unknown>;
const clone = <X,>(x: X): X => JSON.parse(JSON.stringify(x));

export interface PageKind { key: string; label: string; icon: string; slug: string; title: string; menu: { en: string; bn: string };
  make: (theme: SiteTheme, home: PageDoc | null) => PageDoc }

export const PAGE_KINDS: PageKind[] = [
  { key: 'about', label: 'About us', icon: 'ℹ️', slug: 'about-us', title: 'About us', menu: T('About us', 'আমাদের সম্পর্কে'),
    make: (theme, home) => {
      const f = footerOf(theme);
      const why = home?.sections.find(s => s.type === 'why_us');
      const oldAbout = home?.sections.find(s => s.type === 'about');
      return { schema: SCHEMA_VERSION, sections: [
        sec('page_title', { title: T('About us', 'আমাদের সম্পর্কে'), sub: T(`The story behind ${f.businessName || 'our shop'}`, `${f.businessName || 'আমাদের দোকান'}-এর গল্প`), img: '' }),
        oldAbout ? { ...clone(oldAbout), id: newId('about') }
          : sec('about', { eyebrow: T('Our story', 'আমাদের গল্প'), title: 'Who we are', body: String(f.desc || 'Tell your customers who you are, what you sell and why they can trust you.'), img: '' }),
        ...(why ? [{ ...clone(why), id: newId('why'), blocks: (why.blocks || []).map(b => ({ ...clone(b), id: newId('why') })) }] : []),
      ] };
    } },
  { key: 'contact', label: 'Contact', icon: '📇', slug: 'contact', title: 'Contact', menu: T('Contact', 'যোগাযোগ'),
    make: (theme) => {
      const f = footerOf(theme);
      return { schema: SCHEMA_VERSION, sections: [
        sec('page_title', { title: T('Contact us', 'যোগাযোগ করুন'), sub: T('We usually reply within a few minutes.', 'আমরা সাধারণত কয়েক মিনিটের মধ্যে উত্তর দিই।'), img: '' }),
        sec('contact_info', { heading: '', intro: '', phone: '', whatsapp: String(f.whatsapp || ''), email: '', address: '',
          hours: T('Every day, 10am – 10pm', 'প্রতিদিন, সকাল ১০টা – রাত ১০টা'), mapLink: '' }),
      ] };
    } },
  { key: 'faq', label: 'FAQ', icon: '❓', slug: 'faq', title: 'FAQ', menu: T('FAQ', 'প্রশ্নোত্তর'),
    make: () => ({ schema: SCHEMA_VERSION, sections: [
      sec('page_title', { title: T('Questions & answers', 'সাধারণ প্রশ্ন'), sub: '', img: '' }),
      sec('faq', { heading: '' }, [
        ['How do I order?', 'কীভাবে অর্ডার করব?', 'Open a product, press Order or Add to Cart, fill in your name, phone and address, and confirm.', 'পণ্য খুলে Order বা Add to Cart চাপুন, নাম, ফোন ও ঠিকানা দিয়ে নিশ্চিত করুন।'],
        ['How long does delivery take?', 'ডেলিভারি পেতে কত দিন লাগে?', 'Inside Dhaka usually 1–2 days, outside Dhaka 2–4 days.', 'ঢাকার ভিতরে সাধারণত ১–২ দিন, ঢাকার বাইরে ২–৪ দিন।'],
        ['How can I pay?', 'কীভাবে টাকা দেব?', 'Cash on delivery, bKash, Nagad or bank transfer.', 'ক্যাশ অন ডেলিভারি, বিকাশ, নগদ বা ব্যাংক ট্রান্সফার।'],
        ['Can I return a product?', 'পণ্য ফেরত দেওয়া যাবে?', 'Contact us on WhatsApp within the return period with your order details.', 'ফেরতের সময়ের মধ্যে অর্ডারের তথ্যসহ WhatsApp-এ যোগাযোগ করুন।'],
      ].map(([qe, qb, ae, ab]) => ({ id: newId('q'), type: 'faq_item', props: { q: T(qe, qb), a: T(ae, ab) } }))),
    ] }) },
  { key: 'privacy', label: 'Privacy policy', icon: '🔒', slug: 'privacy-policy', title: 'Privacy policy', menu: T('Privacy policy', 'গোপনীয়তা নীতি'),
    make: (theme) => {
      const name = String(footerOf(theme).businessName || 'our shop');
      return { schema: SCHEMA_VERSION, sections: [
        sec('page_title', { title: T('Privacy policy', 'গোপনীয়তা নীতি'), sub: T('Please read and edit this to match how your shop works.', 'আপনার দোকানের নিয়ম অনুযায়ী লেখাটি পড়ে ঠিক করে নিন।'), img: '' }),
        sec('rich_text', { eyebrow: '', heading: '', body: T(
          `${name} collects only the information needed to deliver your order: your name, phone number, delivery address and, if you give it, your email.\n\nWe use this information to confirm and deliver your order and to contact you about it. We share it only with the courier that delivers your parcel.\n\nWe do not sell your information. Payments by bKash, Nagad or bank transfer are made directly by you; we only keep the transaction ID you send us.\n\nTo see, change or delete your information, contact us on WhatsApp.`,
          `${name} শুধু অর্ডার পৌঁছে দেওয়ার জন্য প্রয়োজনীয় তথ্য নেয়: আপনার নাম, ফোন নম্বর, ডেলিভারির ঠিকানা এবং আপনি দিলে ইমেইল।\n\nএই তথ্য দিয়ে আমরা অর্ডার নিশ্চিত করি, পৌঁছে দিই এবং অর্ডার নিয়ে আপনার সাথে যোগাযোগ করি। শুধু পার্সেল পৌঁছে দেওয়া কুরিয়ারের সাথে তথ্য শেয়ার করা হয়।\n\nআমরা আপনার তথ্য বিক্রি করি না। বিকাশ, নগদ বা ব্যাংকে টাকা আপনি নিজে পাঠান; আমরা শুধু আপনার দেওয়া ট্রানজেকশন আইডি রাখি।\n\nআপনার তথ্য দেখতে, বদলাতে বা মুছতে WhatsApp-এ যোগাযোগ করুন।`) }),
      ] };
    } },
  { key: 'shop', label: 'Shop (all products)', icon: '🛍️', slug: 'shop', title: 'Shop', menu: T('Shop', 'শপ'),
    make: (_theme, home) => {
      const cats = home?.sections.find(s => s.type === 'categories');
      const grid = home?.sections.find(s => s.type === 'product_grid');
      return { schema: SCHEMA_VERSION, sections: [
        sec('page_title', { title: T('All products', 'সব পণ্য'), sub: '', img: '' }),
        ...(cats ? [{ ...clone(cats), id: newId('cats'), blocks: (cats.blocks || []).map(b => ({ ...clone(b), id: newId('cat') })) }] : []),
        grid ? { ...clone(grid), id: newId('products') }
          : sec('product_grid', { anchor: 'products', eyebrow: '', heading: T('All products', 'সব পণ্য'), sub: '', source: 'all' }),
      ] };
    } },
  { key: 'blank', label: 'Blank page', icon: '📄', slug: 'page', title: 'New page', menu: T('New page', 'নতুন পাতা'),
    make: () => ({ schema: SCHEMA_VERSION, sections: [
      sec('page_title', { title: T('New page', 'নতুন পাতা'), sub: '', img: '' }),
      sec('rich_text', { eyebrow: '', heading: '', body: T('Write your text here.', 'এখানে আপনার লেখা লিখুন।') }),
    ] }) },
];

// ── Design templates ─────────────────────────────────────────────────────────
// A template changes the LOOK (colors, font, corners, background tone, banner / category / product layout).
// The shop's own content (photos, texts, products, categories, menu, contact) is kept exactly.
export interface Template {
  key: string; name: string; for: string; swatch: string[];
  accent: string; font: FontKey; radius?: SiteTheme['radius']; tone?: SiteTheme['tone'];
  hero?: string; cats?: string; grid?: string;
}
export const TEMPLATES: Template[] = [
  { key: 'classic', name: 'Classic', for: 'Your original design', swatch: ['#e91e8c', '#f7f6f3'], accent: '', font: 'poppins-hind' },
  { key: 'fashion', name: 'Fashion — Elegant', for: 'Clothing, shoes, bags', swatch: ['#1c1c1c', '#fbf5ef'],
    accent: '#1c1c1c', font: 'playfair-hind', radius: 'sharp', tone: 'warm', hero: '', cats: '', grid: 'grid3' },
  { key: 'grocery', name: 'Grocery — Fresh', for: 'Food, grocery, daily needs', swatch: ['#16a34a', '#f3f6fa'],
    accent: '#16a34a', font: 'inter-hind', radius: 'round', tone: 'cool', hero: 'split', cats: 'circles', grid: '' },
  { key: 'electronics', name: 'Electronics — Tech', for: 'Gadgets, phones, accessories', swatch: ['#2563eb', '#f5f5f5'],
    accent: '#2563eb', font: 'montserrat-hind', radius: 'default', tone: 'neutral', hero: 'compact', cats: '', grid: '' },
  { key: 'cosmetics', name: 'Cosmetics — Soft Beauty', for: 'Beauty, skin care, perfume', swatch: ['#db2777', '#fbf5ef'],
    accent: '#db2777', font: 'playfair-hind', radius: 'round', tone: 'warm', hero: 'split', cats: 'circles', grid: 'grid3' },
];

/** Apply a template to the whole site design (all pages share the theme; layouts change on the given pages). */
export function applyTemplate(t: Template, theme: SiteTheme, pages: PageDoc[]): { theme: SiteTheme; pages: PageDoc[] } {
  // remember the shop's own color the first time, so "Classic" can bring it back
  const baseAccent = theme.baseAccent || theme.accent;
  const nextTheme: SiteTheme = { ...theme, baseAccent, template: t.key, font: t.font, accent: t.accent || baseAccent };
  if (t.radius && t.radius !== 'default') nextTheme.radius = t.radius; else delete nextTheme.radius;
  if (t.tone && t.tone !== 'default') nextTheme.tone = t.tone; else delete nextTheme.tone;
  const setV = (s: Section, v?: string): Section => {
    const props = { ...s.props }; if (v) props.variant = v; else delete props.variant; return { ...s, props };
  };
  const nextPages = pages.map(p => ({ ...p, sections: p.sections.map(s =>
    s.type === 'hero_slider' ? setV(s, t.hero) : s.type === 'categories' ? setV(s, t.cats) : s.type === 'product_grid' ? setV(s, t.grid) : s) }));
  return { theme: nextTheme, pages: nextPages };
}

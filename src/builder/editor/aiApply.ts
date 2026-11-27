// AI Website Generator, client side: turns the server-checked "content plan" from AI into the builder design.
// The AI never writes HTML or sections directly — only short texts, a template choice and image keywords. This code
// decides the structure, so the result is always a valid design the editor can change and undo.
import { newId, type PageDoc, type Section, type SiteTheme, type Txt, SCHEMA_VERSION } from '../schema';
import { TEMPLATES, applyTemplate } from './pageTemplates';

type BT = { en: string; bn: string };
export interface AiPlan {
  template: string;
  notice: BT;
  slides: { tag: BT; title: BT; desc: BT; cta: BT; image?: string }[];
  categories: BT[];
  products: { heading: BT; sub: BT };
  why: { heading: BT; cards: { title: BT; desc: BT }[] };
  about: { title: BT; body: BT; image?: string };
  faq: { q: BT; a: BT }[];
  hours: BT;
  footer: BT;
}

const clone = <X,>(x: X): X => JSON.parse(JSON.stringify(x));
const T = (en: string, bn: string): BT => ({ en, bn });

/** Home page + theme from the plan. Keeps: header/menu, logo, shop name, products, the shop's own categories
 *  (when it has products in them), reviews, contact numbers. */
export function applyPlanToHome(plan: AiPlan, theme: SiteTheme, home: PageDoc, opts: { look: boolean; keepCategories: boolean }):
  { theme: SiteTheme; page: PageDoc } {
  let th = clone(theme);
  let page = clone(home);
  if (opts.look) {
    const t = TEMPLATES.find(x => x.key === plan.template);
    if (t) { const out = applyTemplate(t, th, [page]); th = out.theme; page = out.pages[0]; }
  }
  th.globals.before = th.globals.before.map(s => (s.type === 'notice_bar' && plan.notice.en ? { ...s, props: { ...s.props, text: plan.notice } } : s));
  th.globals.after = th.globals.after.map(s => (s.type === 'footer' && plan.footer.en ? { ...s, props: { ...s.props, desc: plan.footer } } : s));

  const sections = page.sections.map((s): Section => {
    if (s.type === 'hero_slider') {
      const old = s.blocks || [];
      return { ...s, blocks: plan.slides.map((sl, i) => ({
        id: old[i]?.id || newId('slide'), type: 'slide',
        props: { img: sl.image || (old[i]?.props.img as string) || (old[0]?.props.img as string) || '', tag: sl.tag, title: sl.title, desc: sl.desc,
          cta: sl.cta, ctaLink: '#products', trustLine: i === 0 ? ((old[0]?.props.trustLine as Txt) || '') : '' } })) };
    }
    if (s.type === 'categories' && !opts.keepCategories && plan.categories.length) {
      const first = s.blocks?.[0];
      return { ...s, blocks: [
        first || { id: newId('cat'), type: 'category', props: { label: T('All', 'সব'), match: [], all: true, image: '', autoImage: true } },
        ...plan.categories.map(c => ({ id: newId('cat'), type: 'category', props: { label: c, match: [c.en, c.bn], image: '', autoImage: true } })),
      ] };
    }
    if (s.type === 'product_grid') return { ...s, props: { ...s.props, heading: plan.products.heading, sub: plan.products.sub } };
    if (s.type === 'why_us') return { ...s, props: { ...s.props, heading: plan.why.heading },
      blocks: plan.why.cards.map((c, i) => ({ id: s.blocks?.[i]?.id || newId('why'), type: 'why_card',
        props: { num: (s.blocks?.[i]?.props.num as Txt) || T(String(i + 1).padStart(2, '0'), String(i + 1).padStart(2, '0')), title: c.title, desc: c.desc } })) };
    if (s.type === 'about') return { ...s, props: { ...s.props, title: plan.about.title, body: plan.about.body, img: plan.about.image || s.props.img } };
    return s;
  });
  // an About block on the home page when the shop had none
  if (!sections.some(s => s.type === 'about') && plan.about.body.en) {
    const at = sections.findIndex(s => s.type === 'why_us');
    sections.splice(at >= 0 ? at + 1 : sections.length, 0, { id: newId('about'), type: 'about',
      props: { eyebrow: T('Our story', 'আমাদের গল্প'), title: plan.about.title, body: plan.about.body, img: plan.about.image || '' } });
  }
  return { theme: th, page: { ...page, schema: SCHEMA_VERSION, sections } };
}

/** Content for the extra pages the AI can fill (used instead of the generic starter text). */
export function aiPageDoc(kind: string, plan: AiPlan, whatsapp: string): PageDoc | null {
  const sec = (type: Section['type'], props: Record<string, unknown>, blocks?: Section['blocks']): Section => ({ id: newId(type.slice(0, 6)), type, props, ...(blocks ? { blocks } : {}) });
  if (kind === 'about') return { schema: SCHEMA_VERSION, sections: [
    sec('page_title', { title: T('About us', 'আমাদের সম্পর্কে'), sub: '', img: '' }),
    sec('about', { eyebrow: T('Our story', 'আমাদের গল্প'), title: plan.about.title, body: plan.about.body, img: plan.about.image || '' }),
    sec('why_us', { anchor: 'about', eyebrow: T('Why us', 'কেন আমরা'), heading: plan.why.heading },
      plan.why.cards.map((c, i) => ({ id: newId('why'), type: 'why_card', props: { num: T(String(i + 1).padStart(2, '0'), String(i + 1).padStart(2, '0')), title: c.title, desc: c.desc } }))),
  ] };
  if (kind === 'faq' && plan.faq.length) return { schema: SCHEMA_VERSION, sections: [
    sec('page_title', { title: T('Questions & answers', 'সাধারণ প্রশ্ন'), sub: '', img: '' }),
    sec('faq', { heading: '' }, plan.faq.map(f => ({ id: newId('q'), type: 'faq_item', props: { q: f.q, a: f.a } }))),
  ] };
  if (kind === 'contact') return { schema: SCHEMA_VERSION, sections: [
    sec('page_title', { title: T('Contact us', 'যোগাযোগ করুন'), sub: T('We usually reply within a few minutes.', 'আমরা সাধারণত কয়েক মিনিটের মধ্যে উত্তর দিই।'), img: '' }),
    sec('contact_info', { heading: '', intro: '', phone: '', whatsapp, email: '', address: '', hours: plan.hours.en ? plan.hours : T('Every day, 10am – 10pm', 'প্রতিদিন, সকাল ১০টা – রাত ১০টা'), mapLink: '' }),
  ] };
  return null;
}

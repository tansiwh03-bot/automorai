// What the Simple editor shows for each section type. Purely declarative: the same list will drive the Advanced editor's
// properties panel later. Field keys are the section/block `props` keys the renderer reads.
import { LEGACY_I18N } from '../legacyStrings';
import { newId, type Block, type Section, type SectionType, type Txt } from '../schema';

export type FieldKind =
  | 'txt'        // bilingual text (EN + বাংলা), follows the shop's language switch
  | 'txtarea'    // bilingual, several lines
  | 'text'       // one text, shown as written in both languages
  | 'textarea'
  | 'image'      // upload or paste an https link
  | 'link'       // #products, #about, https://…
  | 'toggle'
  | 'number'
  | 'tags'       // comma separated list
  | 'select';

export interface Field { key: string; label: string; kind: FieldKind; help?: string; min?: number; max?: number; scale?: number;
  options?: { v: string; l: string }[] }

export interface BlockSpec {
  label: string;            // "Slide", "Category"…
  fields: Field[];
  make: () => Block;
  min: number; max: number;
  title: (b: Block) => string;
}

export interface SectionSpec {
  label: string;
  icon: string;
  fields: Field[];
  blocks?: BlockSpec;
  /** can the owner add this to a page (and how many at most) */
  addable?: { max: number; make: () => Section };
  global?: boolean;          // header/footer/etc: on every page, cannot be removed or moved
}

const L = (k: string): Txt => (LEGACY_I18N[k] ? { ...LEGACY_I18N[k] } : '');
const plain = (t: unknown): string => (t == null ? '' : typeof t === 'string' ? t : String((t as { en?: string }).en || ''));

export const SPECS: Record<SectionType, SectionSpec> = {
  notice_bar: { label: 'Notice bar', icon: '📢', global: true, fields: [
    { key: 'text', label: 'Notice text', kind: 'text', help: 'The thin line at the very top. Leave empty to show nothing.' },
  ] },
  header: { label: 'Header & menu', icon: '🧭', global: true, fields: [
    { key: 'businessName', label: 'Shop name', kind: 'text' },
    { key: 'logoImg', label: 'Logo image', kind: 'image', help: 'Optional. Without a logo the shop name is shown.' },
    { key: 'showSearch', label: 'Show search', kind: 'toggle' },
    { key: 'showLangSwitch', label: 'Show EN / বাং switch', kind: 'toggle' },
    { key: 'showCart', label: 'Show cart', kind: 'toggle' },
    { key: 'productsMegaMenu', label: 'Products menu shows categories', kind: 'toggle' },
  ] },
  hero_slider: {
    label: 'Banner slider', icon: '🖼️',
    fields: [{ key: 'variant', label: 'Layout', kind: 'select', options: [{ v: '', l: 'Full-width photo (original)' }, { v: 'split', l: 'Text left, photo right' }, { v: 'compact', l: 'Short banner' }] },
      { key: 'intervalMs', label: 'Seconds per slide', kind: 'number', min: 2, max: 15, scale: 1000, help: 'How long each slide stays.' }],
    blocks: {
      label: 'Slide', min: 1, max: 6, title: b => plain(b.props.title) || 'Slide',
      fields: [
        { key: 'img', label: 'Banner image', kind: 'image', help: 'Wide photo, at least 1600 × 700.' },
        { key: 'tag', label: 'Small label', kind: 'text' },
        { key: 'title', label: 'Title', kind: 'text' },
        { key: 'desc', label: 'Description', kind: 'textarea' },
        { key: 'cta', label: 'Button text', kind: 'txt' },
        { key: 'ctaLink', label: 'Button link', kind: 'link' },
        { key: 'trustLine', label: 'Small line under the button', kind: 'txt' },
      ],
      make: () => ({ id: newId('slide'), type: 'slide', props: { img: '', tag: '', title: 'New slide', desc: '', cta: L('heroCta1'), ctaLink: '#products', trustLine: '' } }),
    },
    addable: { max: 1, make: () => ({ id: newId('hero'), type: 'hero_slider', props: { intervalMs: 4000 }, blocks: [
      { id: newId('slide'), type: 'slide', props: { img: '', tag: '', title: 'Welcome to our shop', desc: '', cta: L('heroCta1'), ctaLink: '#products', trustLine: '' } }] }) },
  },
  categories: {
    label: 'Categories', icon: '🗂️',
    fields: [{ key: 'title', label: 'Heading', kind: 'txt' },
      { key: 'variant', label: 'Layout', kind: 'select', options: [{ v: '', l: 'Square tiles (original)' }, { v: 'circles', l: 'Round pictures' }] }],
    blocks: {
      label: 'Category', min: 1, max: 12, title: b => plain(b.props.label) || 'Category',
      fields: [
        { key: 'label', label: 'Name', kind: 'txt' },
        { key: 'match', label: 'Matches product category', kind: 'tags', help: 'Products whose category is one of these names show under this tile. Separate with commas.' },
        { key: 'autoImage', label: 'Use the first product photo', kind: 'toggle' },
        { key: 'image', label: 'Tile image', kind: 'image', help: 'Used when there is no product photo.' },
      ],
      make: () => ({ id: newId('cat'), type: 'category', props: { label: 'New category', match: ['New category'], image: '', autoImage: true } }),
    },
    addable: { max: 1, make: () => ({ id: newId('cats'), type: 'categories', props: { title: L('catTitle') }, blocks: [
      { id: newId('cat'), type: 'category', props: { label: { en: 'All', bn: 'সব' }, match: [], all: true, image: '', autoImage: true } }] }) },
  },
  product_grid: {
    label: 'Products', icon: '🛍️',
    fields: [
      { key: 'eyebrow', label: 'Small label', kind: 'txt' },
      { key: 'heading', label: 'Heading', kind: 'txt' },
      { key: 'sub', label: 'Sub-heading', kind: 'txt' },
      { key: 'variant', label: 'Layout', kind: 'select', options: [{ v: '', l: 'Auto columns (original)' }, { v: 'grid3', l: '3 big columns' }] },
    ],
    addable: { max: 1, make: () => ({ id: newId('products'), type: 'product_grid', props: { anchor: 'products', eyebrow: L('prodEyebrow'), heading: L('prodHeading'), sub: L('prodSub'), source: 'all' } }) },
  },
  why_us: {
    label: 'Why choose us', icon: '⭐',
    fields: [{ key: 'eyebrow', label: 'Small label', kind: 'txt' }, { key: 'heading', label: 'Heading', kind: 'txt' }],
    blocks: {
      label: 'Card', min: 1, max: 8, title: b => plain(b.props.title) || 'Card',
      fields: [{ key: 'num', label: 'Big number / icon', kind: 'txt' }, { key: 'title', label: 'Title', kind: 'txt' }, { key: 'desc', label: 'Text', kind: 'txt' }],
      make: () => ({ id: newId('why'), type: 'why_card', props: { num: '✓', title: 'New point', desc: '' } }),
    },
    addable: { max: 3, make: () => ({ id: newId('why'), type: 'why_us', props: { anchor: 'about', eyebrow: L('whyEyebrow'), heading: L('whyHeading') },
      blocks: [1, 2, 3, 4].map(n => ({ id: newId('why'), type: 'why_card', props: { num: L(`whyNum${n}`), title: L(`why${n}Title`), desc: L(`why${n}Desc`) } })) }) },
  },
  testimonials: {
    label: 'Customer reviews', icon: '💬',
    fields: [{ key: 'eyebrow', label: 'Small label', kind: 'txt' }, { key: 'heading', label: 'Heading', kind: 'txt' }],
    blocks: {
      label: 'Review', min: 1, max: 12, title: b => plain(b.props.name) || 'Review',
      fields: [{ key: 'text', label: 'Review', kind: 'textarea' }, { key: 'name', label: 'Customer name', kind: 'text' },
        { key: 'rating', label: 'Stars (1–5)', kind: 'number', min: 1, max: 5 }],
      make: () => ({ id: newId('t'), type: 'testimonial', props: { text: 'Great quality and fast delivery!', name: 'Customer', rating: 5 } }),
    },
    addable: { max: 3, make: () => ({ id: newId('testi'), type: 'testimonials', props: { eyebrow: L('testiEyebrow'), heading: L('testiHeading') },
      blocks: [{ id: newId('t'), type: 'testimonial', props: { text: 'Great quality and fast delivery!', name: 'Customer', rating: 5 } }] }) },
  },
  about: {
    label: 'About us', icon: 'ℹ️',
    fields: [{ key: 'eyebrow', label: 'Small label', kind: 'txt' }, { key: 'title', label: 'Title', kind: 'text' },
      { key: 'body', label: 'Text', kind: 'textarea' }, { key: 'img', label: 'Image', kind: 'image' }],
    addable: { max: 3, make: () => ({ id: newId('about'), type: 'about', props: { eyebrow: L('aboutEyebrow'), title: 'About us', body: 'Tell your customers about your shop.', img: '' } }) },
  },
  footer: { label: 'Footer', icon: '🔻', global: true, fields: [
    { key: 'businessName', label: 'Shop name', kind: 'text' },
    { key: 'logoImg', label: 'Logo image', kind: 'image' },
    { key: 'desc', label: 'About text', kind: 'textarea' },
    { key: 'whatsapp', label: 'WhatsApp number', kind: 'text', help: 'With country code, e.g. 8801XXXXXXXXX' },
    { key: 'showTrackOrder', label: 'Show "Track order" link', kind: 'toggle' },
  ] },
  page_title: {
    label: 'Page title', icon: '🏷️',
    fields: [{ key: 'title', label: 'Title', kind: 'txt' }, { key: 'sub', label: 'Short line under the title', kind: 'txt' },
      { key: 'img', label: 'Background image (optional)', kind: 'image' }],
    addable: { max: 1, make: () => ({ id: newId('ptitle'), type: 'page_title', props: { title: { en: 'Page title', bn: 'পাতার শিরোনাম' }, sub: '', img: '' } }) },
  },
  rich_text: {
    label: 'Text', icon: '📝',
    fields: [{ key: 'eyebrow', label: 'Small label', kind: 'txt' }, { key: 'heading', label: 'Heading', kind: 'txt' },
      { key: 'body', label: 'Text', kind: 'txtarea', help: 'Leave an empty line between paragraphs.' }],
    addable: { max: 6, make: () => ({ id: newId('text'), type: 'rich_text', props: { eyebrow: '', heading: { en: 'Heading', bn: 'শিরোনাম' }, body: { en: 'Write your text here.', bn: 'এখানে আপনার লেখা লিখুন।' } } }) },
  },
  contact_info: {
    label: 'Contact details', icon: '📇',
    fields: [{ key: 'heading', label: 'Heading', kind: 'txt' }, { key: 'intro', label: 'Short text', kind: 'txt' },
      { key: 'phone', label: 'Phone', kind: 'text' }, { key: 'whatsapp', label: 'WhatsApp number', kind: 'text', help: 'With country code, e.g. 8801XXXXXXXXX' },
      { key: 'email', label: 'Email', kind: 'text' }, { key: 'address', label: 'Address', kind: 'txtarea' }, { key: 'hours', label: 'Opening hours', kind: 'txt' },
      { key: 'mapLink', label: 'Google Maps link (optional)', kind: 'text' }],
    addable: { max: 2, make: () => ({ id: newId('contact'), type: 'contact_info', props: { heading: { en: 'Get in touch', bn: 'যোগাযোগ করুন' }, intro: '', phone: '', whatsapp: '', email: '', address: '', hours: '', mapLink: '' } }) },
  },
  faq: {
    label: 'Questions & answers', icon: '❓',
    fields: [{ key: 'heading', label: 'Heading', kind: 'txt' }],
    blocks: {
      label: 'Question', min: 1, max: 20, title: b => plain(b.props.q) || 'Question',
      fields: [{ key: 'q', label: 'Question', kind: 'txt' }, { key: 'a', label: 'Answer', kind: 'txtarea' }],
      make: () => ({ id: newId('q'), type: 'faq_item', props: { q: { en: 'New question?', bn: 'নতুন প্রশ্ন?' }, a: '' } }),
    },
    addable: { max: 2, make: () => ({ id: newId('faq'), type: 'faq', props: { heading: { en: 'Frequently asked questions', bn: 'সাধারণ প্রশ্ন' } },
      blocks: [{ id: newId('q'), type: 'faq_item', props: { q: { en: 'How long does delivery take?', bn: 'ডেলিভারি পেতে কত দিন লাগে?' }, a: { en: 'Inside Dhaka 1–2 days, outside Dhaka 2–4 days.', bn: 'ঢাকার ভিতরে ১–২ দিন, ঢাকার বাইরে ২–৪ দিন।' } } }] }) },
  },
  chat_bubble: { label: 'Chat & WhatsApp buttons', icon: '💭', global: true, fields: [
    { key: 'enabled', label: 'Show shop chat button', kind: 'toggle' },
    { key: 'whatsappFloat', label: 'Floating WhatsApp number', kind: 'text', help: 'Empty = no WhatsApp button.' },
  ] },
};

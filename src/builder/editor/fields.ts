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
  | 'select'
  | 'products'   // choose products from the shop
  | 'datetime';  // date + time (Bangladesh time)

export interface Field { key: string; label: string; kind: FieldKind; help?: string; min?: number; max?: number; scale?: number;
  options?: { v: string; l: string }[] }

export interface BlockKind { type: string; label: string; icon: string; fields: Field[]; make: () => Block }
export interface BlockSpec {
  label: string;            // "Slide", "Category"…
  fields: Field[];
  /** several kinds of blocks in one section (column section): fields + "add" menu per kind */
  kinds?: BlockKind[];
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
const T = (en: string, bn: string) => ({ en, bn });
const ALIGN: Field = { key: 'align', label: 'Align', kind: 'select', options: [{ v: '', l: 'Left' }, { v: 'center', l: 'Center' }, { v: 'right', l: 'Right' }] };
const el = (type: string, props: Record<string, unknown>): Block => ({ id: newId('el'), type, props: { col: 0, ...props } });
export const EL: Record<string, () => Block> = {
  el_heading: () => el('el_heading', { text: T('Your heading', 'আপনার শিরোনাম'), size: 'm' }),
  el_text: () => el('el_text', { text: T('Write your text here.', 'এখানে আপনার লেখা লিখুন।') }),
  el_image: () => el('el_image', { img: '', alt: '', link: '' }),
  el_video: () => el('el_video', { url: '' }),
  el_button: () => el('el_button', { label: T('Shop now', 'এখনই কিনুন'), link: '#products' }),
  el_spacer: () => el('el_spacer', { height: 24 }),
};
const plain = (t: unknown): string => (t == null ? '' : typeof t === 'string' ? t : String((t as { en?: string }).en || ''));

export const SPECS: Record<SectionType, SectionSpec> = {
  notice_bar: { label: 'Notice bar', icon: '📢', global: true, fields: [
    { key: 'text', label: 'Notice text', kind: 'txt', help: 'The thin line at the very top. Leave empty to show nothing.' },
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
        { key: 'tag', label: 'Small label', kind: 'txt' },
        { key: 'title', label: 'Title', kind: 'txt' },
        { key: 'desc', label: 'Description', kind: 'txtarea' },
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
    fields: [{ key: 'eyebrow', label: 'Small label', kind: 'txt' }, { key: 'title', label: 'Title', kind: 'txt' },
      { key: 'body', label: 'Text', kind: 'txtarea' }, { key: 'img', label: 'Image', kind: 'image' }],
    addable: { max: 3, make: () => ({ id: newId('about'), type: 'about', props: { eyebrow: L('aboutEyebrow'), title: 'About us', body: 'Tell your customers about your shop.', img: '' } }) },
  },
  footer: { label: 'Footer', icon: '🔻', global: true, fields: [
    { key: 'businessName', label: 'Shop name', kind: 'text' },
    { key: 'logoImg', label: 'Logo image', kind: 'image' },
    { key: 'desc', label: 'About text', kind: 'txtarea' },
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
  columns: {
    label: 'Columns', icon: '▥',
    fields: [{ key: 'columns', label: 'Columns', kind: 'select', options: [{ v: '1', l: '1 column' }, { v: '2', l: '2 columns' }, { v: '3', l: '3 columns' }] },
      { key: 'mobileColumns', label: 'On mobile', kind: 'select', options: [{ v: '1', l: 'Stack (1 column)' }, { v: '2', l: 'Keep 2 columns' }] },
      { key: 'vAlign', label: 'Line up', kind: 'select', options: [{ v: '', l: 'Top' }, { v: 'center', l: 'Middle' }] }],
    blocks: {
      label: 'Element', min: 0, max: 24, title: b => ({ el_heading: 'Heading', el_text: 'Text', el_image: 'Image', el_video: 'Video', el_button: 'Button', el_spacer: 'Space' } as Record<string, string>)[b.type] + (plain(b.props.text) || plain(b.props.label) ? ': ' + (plain(b.props.text) || plain(b.props.label)).slice(0, 24) : ''),
      fields: [],
      make: () => EL.el_text(),
      kinds: [
        { type: 'el_heading', label: 'Heading', icon: '🔠', make: () => EL.el_heading(), fields: [{ key: 'text', label: 'Heading', kind: 'txt' },
          { key: 'size', label: 'Size', kind: 'select', options: [{ v: 'm', l: 'Medium' }, { v: 'l', l: 'Large' }, { v: 's', l: 'Small' }] }, ALIGN] },
        { type: 'el_text', label: 'Text', icon: '📝', make: () => EL.el_text(), fields: [{ key: 'text', label: 'Text', kind: 'txtarea', help: 'Leave an empty line between paragraphs.' }, ALIGN] },
        { type: 'el_image', label: 'Image', icon: '🖼️', make: () => EL.el_image(), fields: [{ key: 'img', label: 'Image', kind: 'image' },
          { key: 'alt', label: 'Image description (for Google & blind visitors)', kind: 'txt' }, { key: 'link', label: 'Link when clicked (optional)', kind: 'link' },
          { key: 'round', label: 'Round picture', kind: 'toggle' }] },
        { type: 'el_video', label: 'Video', icon: '▶️', make: () => EL.el_video(), fields: [{ key: 'url', label: 'YouTube or Vimeo link', kind: 'text', help: 'Paste the address of the video, e.g. https://youtu.be/…' }] },
        { type: 'el_button', label: 'Button', icon: '🔘', make: () => EL.el_button(), fields: [{ key: 'label', label: 'Button text', kind: 'txt' }, { key: 'link', label: 'Opens', kind: 'link' },
          { key: 'style', label: 'Style', kind: 'select', options: [{ v: '', l: 'Filled' }, { v: 'outline', l: 'Outline' }] }, ALIGN] },
        { type: 'el_spacer', label: 'Space', icon: '↕️', make: () => EL.el_spacer(), fields: [{ key: 'height', label: 'Height (px)', kind: 'number', min: 4, max: 200 }] },
      ],
    },
    addable: { max: 20, make: () => ({ id: newId('cols'), type: 'columns', props: { columns: '1' }, blocks: [EL.el_text()] }) },
  },
  banner: {
    label: 'Hero banner', icon: '🏞️',
    fields: [{ key: 'img', label: 'Background image', kind: 'image' }, { key: 'title', label: 'Title', kind: 'txt' }, { key: 'text', label: 'Text', kind: 'txtarea' },
      { key: 'cta', label: 'Button text', kind: 'txt' }, { key: 'link', label: 'Button opens', kind: 'link' },
      { key: 'align', label: 'Text position', kind: 'select', options: [{ v: '', l: 'Left' }, { v: 'center', l: 'Center' }] },
      { key: 'height', label: 'Height', kind: 'select', options: [{ v: 'm', l: 'Medium' }, { v: 's', l: 'Small' }, { v: 'l', l: 'Large' }] },
      { key: 'dark', label: 'Darken the photo (0–80 %)', kind: 'number', min: 0, max: 80 }],
    addable: { max: 6, make: () => ({ id: newId('banner'), type: 'banner', props: { img: '', title: T('Big sale this week', 'এই সপ্তাহে বড় ছাড়'), text: T('Write a short line about your offer.', 'আপনার অফার নিয়ে ছোট একটি লাইন লিখুন।'),
      cta: T('Shop now', 'এখনই কিনুন'), link: '#products', align: '', height: 'm', dark: 40 } }) },
  },
  gallery: {
    label: 'Image gallery', icon: '🖼️',
    fields: [{ key: 'heading', label: 'Heading', kind: 'txt' }, { key: 'columns', label: 'Pictures per row', kind: 'select', options: [{ v: '3', l: '3' }, { v: '2', l: '2' }, { v: '4', l: '4' }] }],
    blocks: { label: 'Photo', min: 1, max: 24, title: b => plain(b.props.caption) || 'Photo',
      fields: [{ key: 'img', label: 'Photo', kind: 'image' }, { key: 'caption', label: 'Caption (optional)', kind: 'txt' }],
      make: () => ({ id: newId('ph'), type: 'photo', props: { img: '', caption: '' } }) },
    addable: { max: 6, make: () => ({ id: newId('gallery'), type: 'gallery', props: { heading: T('Gallery', 'গ্যালারি'), columns: '3' },
      blocks: [0, 1, 2].map(() => ({ id: newId('ph'), type: 'photo', props: { img: '', caption: '' } })) }) },
  },
  offers: {
    label: 'Offers', icon: '🏷️',
    fields: [{ key: 'heading', label: 'Heading', kind: 'txt' }],
    blocks: { label: 'Offer', min: 1, max: 9, title: b => plain(b.props.title) || 'Offer',
      fields: [{ key: 'img', label: 'Image', kind: 'image' }, { key: 'badge', label: 'Badge (e.g. 20% OFF)', kind: 'txt' }, { key: 'title', label: 'Title', kind: 'txt' },
        { key: 'text', label: 'Text', kind: 'txtarea' }, { key: 'cta', label: 'Button text', kind: 'txt' }, { key: 'link', label: 'Button opens', kind: 'link' }],
      make: () => ({ id: newId('of'), type: 'offer', props: { img: '', badge: T('Offer', 'অফার'), title: T('New offer', 'নতুন অফার'), text: '', cta: T('Shop now', 'এখনই কিনুন'), link: '#products' } }) },
    addable: { max: 4, make: () => ({ id: newId('offers'), type: 'offers', props: { heading: T('Special offers', 'বিশেষ অফার') },
      blocks: [0, 1].map(() => ({ id: newId('of'), type: 'offer', props: { img: '', badge: T('Offer', 'অফার'), title: T('New offer', 'নতুন অফার'), text: '', cta: T('Shop now', 'এখনই কিনুন'), link: '#products' } })) }) },
  },
  countdown: {
    label: 'Countdown timer', icon: '⏳',
    fields: [{ key: 'title', label: 'Title', kind: 'txt' }, { key: 'text', label: 'Text', kind: 'txt' },
      { key: 'ends', label: 'Ends at (Bangladesh time)', kind: 'datetime' }, { key: 'doneText', label: 'Text after it ends', kind: 'txt' },
      { key: 'cta', label: 'Button text (optional)', kind: 'txt' }, { key: 'link', label: 'Button opens', kind: 'link' }],
    addable: { max: 3, make: () => {
      const d = new Date(Date.now() + 3 * 86400000 + 6 * 3600000); const iso = d.toISOString().slice(0, 16);
      return { id: newId('cd'), type: 'countdown', props: { title: T('Offer ends soon', 'অফার শীঘ্রই শেষ'), text: '', ends: iso, doneText: T('This offer has ended.', 'এই অফার শেষ হয়েছে।'), cta: T('Shop now', 'এখনই কিনুন'), link: '#products' } };
    } },
  },
  featured_products: {
    label: 'Featured products', icon: '⭐',
    fields: [{ key: 'heading', label: 'Heading', kind: 'txt' }, { key: 'sub', label: 'Sub-heading', kind: 'txt' },
      { key: 'ids', label: 'Products to show (up to 12)', kind: 'products', help: 'Live prices and photos are always used.' }],
    addable: { max: 4, make: () => ({ id: newId('feat'), type: 'featured_products', props: { heading: T('Featured products', 'বাছাই করা পণ্য'), sub: '', ids: [] } }) },
  },
  delivery_info: {
    label: 'Delivery information', icon: '🚚',
    fields: [{ key: 'heading', label: 'Heading', kind: 'txt' }],
    blocks: { label: 'Item', min: 1, max: 8, title: b => plain(b.props.title) || 'Item',
      fields: [{ key: 'icon', label: 'Icon (emoji)', kind: 'text' }, { key: 'title', label: 'Title', kind: 'txt' }, { key: 'text', label: 'Text', kind: 'txtarea' }],
      make: () => ({ id: newId('di'), type: 'info', props: { icon: '📦', title: T('Title', 'শিরোনাম'), text: '' } }) },
    addable: { max: 2, make: () => ({ id: newId('deliv'), type: 'delivery_info', props: { heading: T('Delivery', 'ডেলিভারি') }, blocks: [
      { id: newId('di'), type: 'info', props: { icon: '🏙️', title: T('Inside Dhaka', 'ঢাকার ভিতরে'), text: T('Usually 1–2 days.', 'সাধারণত ১–২ দিন।') } },
      { id: newId('di'), type: 'info', props: { icon: '🚚', title: T('Outside Dhaka', 'ঢাকার বাইরে'), text: T('Usually 2–4 days.', 'সাধারণত ২–৪ দিন।') } },
      { id: newId('di'), type: 'info', props: { icon: '💵', title: T('Pay on delivery', 'হাতে পেয়ে টাকা'), text: T('Check the product, then pay.', 'পণ্য দেখে তারপর টাকা দিন।') } }] }) },
  },
  payment_info: {
    label: 'Payment information', icon: '💳',
    fields: [{ key: 'heading', label: 'Heading', kind: 'txt' }, { key: 'cod', label: 'Cash on delivery', kind: 'toggle' }, { key: 'bkash', label: 'bKash', kind: 'toggle' },
      { key: 'nagad', label: 'Nagad', kind: 'toggle' }, { key: 'bank', label: 'Bank transfer', kind: 'toggle' }, { key: 'note', label: 'Note', kind: 'txtarea' }],
    addable: { max: 2, make: () => ({ id: newId('pay'), type: 'payment_info', props: { heading: T('How to pay', 'কীভাবে টাকা দেবেন'), cod: true, bkash: true, nagad: true, bank: false, note: '' } }) },
  },
  whatsapp_cta: {
    label: 'WhatsApp contact', icon: '💬',
    fields: [{ key: 'heading', label: 'Heading', kind: 'txt' }, { key: 'text', label: 'Text', kind: 'txt' },
      { key: 'number', label: 'WhatsApp number', kind: 'text', help: 'With country code, e.g. 8801XXXXXXXXX' }, { key: 'button', label: 'Button text', kind: 'txt' }],
    addable: { max: 3, make: () => ({ id: newId('wa'), type: 'whatsapp_cta', props: { heading: T('Questions? Ask us on WhatsApp', 'প্রশ্ন আছে? WhatsApp-এ জিজ্ঞেস করুন'),
      text: T('We reply quickly.', 'আমরা দ্রুত উত্তর দিই।'), number: '', button: T('Chat on WhatsApp', 'WhatsApp-এ কথা বলুন') } }) },
  },
  chat_bubble: { label: 'Chat & WhatsApp buttons', icon: '💭', global: true, fields: [
    { key: 'enabled', label: 'Show shop chat button', kind: 'toggle' },
    { key: 'whatsappFloat', label: 'Floating WhatsApp number', kind: 'text', help: 'Empty = no WhatsApp button.' },
  ] },
};

// ── Block Library (the "Add section" menu): groups, simple names and what each block is for ──
export interface LibraryItem { key: string; group: string; label: string; icon: string; desc: string; type: SectionType; make: () => Section }
const colSec = (columns: number, blocks: Block[]): Section => ({ id: newId('cols'), type: 'columns', props: { columns: String(columns) }, blocks });
const one = (b: Block) => colSec(1, [b]);
const add = (type: SectionType) => () => SPECS[type].addable!.make();
export const LIBRARY: LibraryItem[] = [
  { key: 'heading', group: 'Text & media', label: 'Heading', icon: '🔠', desc: 'A big title', type: 'columns', make: () => one(EL.el_heading()) },
  { key: 'text', group: 'Text & media', label: 'Text', icon: '📝', desc: 'Paragraphs of text', type: 'columns', make: () => one(EL.el_text()) },
  { key: 'image', group: 'Text & media', label: 'Image', icon: '🖼️', desc: 'One picture', type: 'columns', make: () => one(EL.el_image()) },
  { key: 'video', group: 'Text & media', label: 'Video', icon: '▶️', desc: 'YouTube or Vimeo video', type: 'columns', make: () => one(EL.el_video()) },
  { key: 'button', group: 'Text & media', label: 'Button', icon: '🔘', desc: 'A button that opens a page or link', type: 'columns', make: () => one(EL.el_button()) },
  { key: 'cols2', group: 'Layouts', label: '2 columns', icon: '◫', desc: 'Picture next to text', type: 'columns',
    make: () => colSec(2, [{ ...EL.el_image(), props: { ...EL.el_image().props, col: 0 } }, { ...EL.el_heading(), props: { ...EL.el_heading().props, col: 1 } }, { ...EL.el_text(), props: { ...EL.el_text().props, col: 1 } }, { ...EL.el_button(), props: { ...EL.el_button().props, col: 1 } }]) },
  { key: 'cols3', group: 'Layouts', label: '3 columns', icon: '▥', desc: 'Three boxes side by side', type: 'columns',
    make: () => colSec(3, [0, 1, 2].flatMap(c => [{ ...EL.el_heading(), props: { ...EL.el_heading().props, col: c, size: 's' } }, { ...EL.el_text(), props: { ...EL.el_text().props, col: c } }])) },
  { key: 'banner', group: 'Sections', label: 'Hero banner', icon: '🏞️', desc: 'Big photo with a title and button', type: 'banner', make: add('banner') },
  { key: 'hero', group: 'Sections', label: 'Banner slider', icon: '🖼️', desc: 'Several photos that change', type: 'hero_slider', make: add('hero_slider') },
  { key: 'gallery', group: 'Sections', label: 'Image gallery', icon: '🗃️', desc: 'Grid of photos', type: 'gallery', make: add('gallery') },
  { key: 'offers', group: 'Sections', label: 'Offers', icon: '🏷️', desc: 'Offer cards with a badge', type: 'offers', make: add('offers') },
  { key: 'countdown', group: 'Sections', label: 'Countdown timer', icon: '⏳', desc: 'Time left for an offer', type: 'countdown', make: add('countdown') },
  { key: 'features', group: 'Sections', label: 'Features', icon: '⭐', desc: 'Why customers choose you', type: 'why_us', make: add('why_us') },
  { key: 'testimonials', group: 'Sections', label: 'Testimonials', icon: '💬', desc: 'Customer reviews', type: 'testimonials', make: add('testimonials') },
  { key: 'faq', group: 'Sections', label: 'FAQ', icon: '❓', desc: 'Questions and answers', type: 'faq', make: add('faq') },
  { key: 'about', group: 'Sections', label: 'About us', icon: 'ℹ️', desc: 'Picture with your story', type: 'about', make: add('about') },
  { key: 'pagetitle', group: 'Sections', label: 'Page title', icon: '🏷️', desc: 'Title band at the top of a page', type: 'page_title', make: add('page_title') },
  { key: 'products', group: 'Shop', label: 'Product grid', icon: '🛍️', desc: 'All your products (one per page)', type: 'product_grid', make: add('product_grid') },
  { key: 'categories', group: 'Shop', label: 'Product categories', icon: '🗂️', desc: 'Category tiles (one per page)', type: 'categories', make: add('categories') },
  { key: 'featured', group: 'Shop', label: 'Featured products', icon: '✨', desc: 'Products you choose', type: 'featured_products', make: add('featured_products') },
  { key: 'delivery', group: 'Information', label: 'Delivery information', icon: '🚚', desc: 'Delivery areas and times', type: 'delivery_info', make: add('delivery_info') },
  { key: 'payment', group: 'Information', label: 'Payment information', icon: '💳', desc: 'Ways to pay', type: 'payment_info', make: add('payment_info') },
  { key: 'whatsapp', group: 'Information', label: 'WhatsApp contact', icon: '💬', desc: 'Button to chat on WhatsApp', type: 'whatsapp_cta', make: add('whatsapp_cta') },
  { key: 'contact', group: 'Information', label: 'Contact details', icon: '📇', desc: 'Phone, email, address, hours', type: 'contact_info', make: add('contact_info') },
  { key: 'richtext', group: 'Information', label: 'Long text', icon: '📄', desc: 'Policy or long text', type: 'rich_text', make: add('rich_text') },
];

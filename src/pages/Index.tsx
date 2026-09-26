import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

const content = {
  en: {
    badge: "🚀 Website Chat + WhatsApp + Messenger — All in one place",
    hero: "AI Customer Service for Your Business",
    heroDesc: "Automorai handles your website, WhatsApp, and Facebook with AI — so your business runs even while you sleep.",
    getStarted: "Get Started Free",
    demo: "See Demo →",
    usedBy: "Used by businesses worldwide",
    aiActive: "AI always active",
    replyTime: "reply time",
    setupCost: "setup cost",
    whatWeDo: "What Automorai Does",
    whatWeDoDesc: "One platform — AI customer service across all channels",
    howItWorks: "How It Works",
    steps: [
      { step: "1", title: "Sign Up", desc: "Create a free account" },
      { step: "2", title: "Connect", desc: "Connect WhatsApp and Facebook" },
      { step: "3", title: "Add Widget", desc: "Paste script on your website" },
    ],
    pricingTitle: "Pricing",
    pricingDesc: "No hidden charges. Cancel anytime.",
    ctaTitle: "Get Started Today",
    ctaDesc: "No setup fee. No credit card. Ready in 5 minutes.",
    ctaBtn: "Get Started Free →",
    footer: "© 2026 Automorai. Built in Dhaka, Bangladesh.",
    features: [
      { icon: "💬", title: "Website Chat Widget", desc: "Add an AI chat bubble to your website — visitors can chat and get instant replies." },
      { icon: "📱", title: "WhatsApp Auto-Reply", desc: "AI instantly replies to WhatsApp messages — handles prices, stock, and orders." },
      { icon: "🤖", title: "Facebook Auto-Reply", desc: "AI replies to Facebook comments and Messenger 24/7. No manual work needed." },
      { icon: "🖼️", title: "Image & Voice Recognition", desc: "AI understands images and voice messages — identifies products and gives prices." },
      { icon: "📊", title: "Unified Inbox", desc: "See all conversations from WhatsApp, Messenger, Facebook, and Website in one place." },
      { icon: "🛒", title: "WooCommerce Integration", desc: "AI automatically knows your store's products, prices, and stock." },
    ],
    plans: [
      {
        name: "Starter",
        price: "৳999",
        period: "/month",
        desc: "For small businesses",
        features: ["Website Chat Widget", "1 Facebook Page", "Auto Comment Reply", "Basic Analytics", "Email Support"],
      },
      {
        name: "Pro",
        price: "৳2,499",
        period: "/month",
        desc: "For most businesses",
        features: ["All Starter features", "WhatsApp Auto-Reply", "Messenger Auto-Reply", "Image & Voice Recognition", "Unified Inbox", "Priority Support"],
        highlighted: true,
      },
      {
        name: "Business",
        price: "৳4,999",
        period: "/month",
        desc: "For large businesses",
        features: ["All Pro features", "WooCommerce Integration", "5 Facebook Pages", "Custom AI Training", "Dedicated Support", "Custom Workflow"],
      },
    ],
    startPlan: "Get Started",
  },
  bn: {
    badge: "🚀 Website Chat + WhatsApp + Messenger — সব এক জায়গায়",
    hero: "তোমার Business এর জন্য AI Customer Service",
    heroDesc: "Automorai তোমার website, WhatsApp, Facebook — সব জায়গায় AI দিয়ে customer দের সাথে কথা বলে। তুমি ঘুমালেও business চলে।",
    getStarted: "Free তে শুরু করো",
    demo: "Demo দেখো →",
    usedBy: "বাংলাদেশের ব্যবসায়ীরা ব্যবহার করছেন",
    aiActive: "AI সবসময় active",
    replyTime: "reply time",
    setupCost: "setup cost",
    whatWeDo: "Automorai কী করে?",
    whatWeDoDesc: "একটাই platform — সব channel এ AI customer service",
    howItWorks: "কীভাবে কাজ করে?",
    steps: [
      { step: "১", title: "Signup করো", desc: "Free তে account বানাও" },
      { step: "২", title: "Connect করো", desc: "WhatsApp ও Facebook connect করো" },
      { step: "৩", title: "Widget বসাও", desc: "Website এ script paste করো" },
    ],
    pricingTitle: "Pricing",
    pricingDesc: "কোনো hidden charge নাই। যেকোনো সময় cancel করো।",
    ctaTitle: "আজই শুরু করো",
    ctaDesc: "Setup fee নাই। Credit card লাগবে না। ৫ মিনিটে ready।",
    ctaBtn: "Free তে শুরু করো →",
    footer: "© 2026 Automorai. Built in Dhaka, Bangladesh.",
    features: [
      { icon: "💬", title: "Website Chat Widget", desc: "তোমার website এ AI chat bubble বসাও — visitor রা সরাসরি chat করতে পারবে, AI instantly reply করবে।" },
      { icon: "📱", title: "WhatsApp Auto-Reply", desc: "WhatsApp এ customer message করলে AI তাৎক্ষণিক reply করে। পণ্যের দাম, stock, order — সব handle করে।" },
      { icon: "🤖", title: "Facebook Auto-Reply", desc: "Facebook comment ও Messenger এ AI 24/7 reply করে। কোনো manual কাজ নাই।" },
      { icon: "🖼️", title: "Image & Voice Recognition", desc: "Customer ছবি বা voice message পাঠালে AI বুঝে reply করে — পণ্য identify করে দাম বলে।" },
      { icon: "📊", title: "Unified Inbox", desc: "WhatsApp, Messenger, Facebook, Website — সব conversation এক জায়গায় দেখো।" },
      { icon: "🛒", title: "WooCommerce Integration", desc: "তোমার WooCommerce store এর product, দাম, stock automatically AI জানে।" },
    ],
    plans: [
      {
        name: "Starter",
        price: "৳999",
        period: "/মাস",
        desc: "ছোট ব্যবসার জন্য",
        features: ["Website Chat Widget", "১টি Facebook Page", "Auto Comment Reply", "Basic Analytics", "Email Support"],
      },
      {
        name: "Pro",
        price: "৳2,499",
        period: "/মাস",
        desc: "বেশিরভাগ ব্যবসার জন্য",
        features: ["সব Starter features", "WhatsApp Auto-Reply", "Messenger Auto-Reply", "Image & Voice Recognition", "Unified Inbox", "Priority Support"],
        highlighted: true,
      },
      {
        name: "Business",
        price: "৳4,999",
        period: "/মাস",
        desc: "বড় ব্যবসার জন্য",
        features: ["সব Pro features", "WooCommerce Integration", "৫টি Facebook Pages", "Custom AI Training", "Dedicated Support", "Custom Workflow"],
      },
    ],
    startPlan: "শুরু করো",
  },
};

const Index = () => {
  const [lang, setLang] = useState<"en" | "bn">("bn");
  const t = content[lang];

  useEffect(() => {
    if (document.getElementById('am-widget')) return;
    (window as any).AUTOMORAI_PAGE_ID  = 'automorai_support';
    (window as any).AUTOMORAI_BUSINESS = 'Automorai Support';
    (window as any).AUTOMORAI_COLOR    = '#7c5cff';
    const s = document.createElement('script');
    s.src = 'https://automorai.com/automorai-widget.js';
    s.async = true;
    document.body.appendChild(s);
    return () => {
      if (document.body.contains(s)) document.body.removeChild(s);
      const w = document.getElementById('am-widget');
      if (w) w.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <span className="text-xl font-bold text-purple-400">Automorai</span>
        <div className="flex gap-3 items-center">
          {/* Language Toggle */}
          <div className="flex rounded-lg overflow-hidden border border-gray-700">
            <button
              onClick={() => setLang("bn")}
              className={`px-3 py-1.5 text-sm font-medium transition ${lang === "bn" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"}`}
            >
              বাং
            </button>
            <button
              onClick={() => setLang("en")}
              className={`px-3 py-1.5 text-sm font-medium transition ${lang === "en" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"}`}
            >
              EN
            </button>
          </div>
          <Link to="/login" className="px-4 py-2 rounded-md text-sm border border-gray-700 hover:border-purple-500 transition">
            Login
          </Link>
          <Link to="/signup" className="px-4 py-2 rounded-md text-sm bg-purple-600 hover:bg-purple-700 transition">
            Sign up
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center max-w-3xl mx-auto px-6 pt-16 pb-20">
        <div className="inline-block px-4 py-1 rounded-full border border-purple-500 text-purple-400 text-sm mb-6">
          {t.badge}
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">{t.hero}</h1>
        <p className="text-lg text-gray-400 mb-8">{t.heroDesc}</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link to="/signup" className="inline-block px-8 py-3 rounded-md bg-purple-600 hover:bg-purple-700 font-semibold transition">
            {t.getStarted}
          </Link>
          <a href="https://kingpurefood.com" target="_blank" rel="noopener noreferrer" className="inline-block px-8 py-3 rounded-md border border-gray-700 hover:border-purple-500 font-semibold transition">
            {t.demo}
          </a>
        </div>
      </section>

      {/* Social Proof */}
      <section className="max-w-3xl mx-auto px-6 pb-16 text-center">
        <p className="text-gray-500 text-sm mb-4">{t.usedBy}</p>
        <div className="flex gap-8 justify-center flex-wrap">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">24/7</div>
            <div className="text-gray-500 text-sm">{t.aiActive}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">&lt;3s</div>
            <div className="text-gray-500 text-sm">{t.replyTime}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">৳0</div>
            <div className="text-gray-500 text-sm">{t.setupCost}</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-center mb-4">{t.whatWeDo}</h2>
        <p className="text-center text-gray-400 mb-10">{t.whatWeDoDesc}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.features.map((f) => (
            <div key={f.title} className="p-6 rounded-xl border border-gray-800 bg-[#111118] hover:border-purple-500 transition">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-3xl mx-auto px-6 pb-20 text-center">
        <h2 className="text-2xl font-bold mb-10">{t.howItWorks}</h2>
        <div className="flex flex-col md:flex-row gap-6 justify-center">
          {t.steps.map((s) => (
            <div key={s.step} className="flex-1 p-6 rounded-xl border border-gray-800 bg-[#111118]">
              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-lg mx-auto mb-3">
                {s.step}
              </div>
              <h3 className="font-semibold mb-1">{s.title}</h3>
              <p className="text-gray-400 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-center mb-4">{t.pricingTitle}</h2>
        <p className="text-center text-gray-400 mb-10">{t.pricingDesc}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {t.plans.map((p) => (
            <div key={p.name} className={`p-6 rounded-xl border ${"highlighted" in p && p.highlighted ? "border-purple-500 bg-[#15121f]" : "border-gray-800 bg-[#111118]"}`}>
              {"highlighted" in p && p.highlighted && (
                <div className="text-xs text-purple-400 font-semibold mb-2 uppercase tracking-wide">⭐ Most Popular</div>
              )}
              <h3 className="font-semibold text-lg mb-1">{p.name}</h3>
              <p className="text-gray-500 text-sm mb-3">{p.desc}</p>
              <div className="mb-4">
                <span className="text-3xl font-bold">{p.price}</span>
                <span className="text-gray-400 text-sm">{p.period}</span>
              </div>
              <ul className="space-y-2 mb-6">
                {p.features.map((feat) => (
                  <li key={feat} className="text-sm text-gray-400 flex gap-2">
                    <span className="text-purple-400">✓</span> {feat}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className={`block text-center py-2 rounded-md text-sm font-medium transition ${"highlighted" in p && p.highlighted ? "bg-purple-600 hover:bg-purple-700" : "border border-gray-700 hover:border-purple-500"}`}>
                {t.startPlan} {p.name}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <div className="p-10 rounded-2xl border border-purple-500 bg-[#15121f]">
          <h2 className="text-2xl font-bold mb-4">{t.ctaTitle}</h2>
          <p className="text-gray-400 mb-6">{t.ctaDesc}</p>
          <Link to="/signup" className="inline-block px-8 py-3 rounded-md bg-purple-600 hover:bg-purple-700 font-semibold transition">
            {t.ctaBtn}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-gray-500 text-sm pb-10">
        {t.footer}
      </footer>
    </div>
  );
};

export default Index;

import { Link } from "react-router-dom";
import { useEffect } from "react";

const features = [
  {
    icon: "💬",
    title: "Website Chat Widget",
    desc: "তোমার website এ AI chat bubble বসাও — visitor রা সরাসরি chat করতে পারবে, AI instantly reply করবে।",
  },
  {
    icon: "📱",
    title: "WhatsApp Auto-Reply",
    desc: "WhatsApp এ customer message করলে AI তাৎক্ষণিক reply করে। পণ্যের দাম, stock, order — সব handle করে।",
  },
  {
    icon: "🤖",
    title: "Facebook Auto-Reply",
    desc: "Facebook comment ও Messenger এ AI 24/7 reply করে। কোনো manual কাজ নাই।",
  },
  {
    icon: "🖼️",
    title: "Image & Voice Recognition",
    desc: "Customer ছবি বা voice message পাঠালে AI বুঝে reply করে — পণ্য identify করে দাম বলে।",
  },
  {
    icon: "📊",
    title: "Unified Inbox",
    desc: "WhatsApp, Messenger, Facebook, Website — সব conversation এক জায়গায় দেখো।",
  },
  {
    icon: "🛒",
    title: "WooCommerce Integration",
    desc: "তোমার WooCommerce store এর product, দাম, stock automatically AI জানে।",
  },
];

const plans = [
  {
    name: "Starter",
    price: "৳999",
    period: "/মাস",
    desc: "ছোট ব্যবসার জন্য",
    features: [
      "Website Chat Widget",
      "১টি Facebook Page",
      "Auto Comment Reply",
      "Basic Analytics",
      "Email Support",
    ],
  },
  {
    name: "Pro",
    price: "৳2,499",
    period: "/মাস",
    desc: "বেশিরভাগ ব্যবসার জন্য",
    features: [
      "সব Starter features",
      "WhatsApp Auto-Reply",
      "Messenger Auto-Reply",
      "Image & Voice Recognition",
      "Unified Inbox",
      "Priority Support",
    ],
    highlighted: true,
  },
  {
    name: "Business",
    price: "৳4,999",
    period: "/মাস",
    desc: "বড় ব্যবসার জন্য",
    features: [
      "সব Pro features",
      "WooCommerce Integration",
      "৫টি Facebook Pages",
      "Custom AI Training",
      "Dedicated Support",
      "Custom Workflow",
    ],
  },
];

const Index = () => {
  useEffect(() => {
    const s = document.createElement('script');
    s.src = 'https://automorai.com/automorai-widget.js';
    s.setAttribute('data-page-id', 'automorai_support');
    s.setAttribute('data-business', 'Automorai Support');
    s.setAttribute('data-color', '#7c5cff');
    document.body.appendChild(s);
    return () => {
      if (document.body.contains(s)) document.body.removeChild(s);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <span className="text-xl font-bold text-purple-400">Automorai</span>
        <div className="flex gap-4">
          <Link
            to="/login"
            className="px-4 py-2 rounded-md text-sm border border-gray-700 hover:border-purple-500 transition"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 rounded-md text-sm bg-purple-600 hover:bg-purple-700 transition"
          >
            Sign up
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center max-w-3xl mx-auto px-6 pt-16 pb-20">
        <div className="inline-block px-4 py-1 rounded-full border border-purple-500 text-purple-400 text-sm mb-6">
          🚀 Website Chat + WhatsApp + Messenger — সব এক জায়গায়
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
          তোমার Business এর জন্য AI Customer Service
        </h1>
        <p className="text-lg text-gray-400 mb-8">
          Automorai তোমার website, WhatsApp, Facebook — সব জায়গায় AI দিয়ে
          customer দের সাথে কথা বলে। তুমি ঘুমালেও business চলে।
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            to="/signup"
            className="inline-block px-8 py-3 rounded-md bg-purple-600 hover:bg-purple-700 font-semibold transition"
          >
            Free তে শুরু করো
          </Link>
          <a
            href="https://kingpurefood.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-3 rounded-md border border-gray-700 hover:border-purple-500 font-semibold transition"
          >
            Demo দেখো →
          </a>
        </div>
      </section>

      {/* Social Proof */}
      <section className="max-w-3xl mx-auto px-6 pb-16 text-center">
        <p className="text-gray-500 text-sm mb-4">বাংলাদেশের ব্যবসায়ীরা ব্যবহার করছেন</p>
        <div className="flex gap-8 justify-center flex-wrap">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">২৪/৭</div>
            <div className="text-gray-500 text-sm">AI সবসময় active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">&lt;৩ সেকেন্ড</div>
            <div className="text-gray-500 text-sm">reply time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">৳০</div>
            <div className="text-gray-500 text-sm">setup cost</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-center mb-4">Automorai কী করে?</h2>
        <p className="text-center text-gray-400 mb-10">একটাই platform — সব channel এ AI customer service</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-xl border border-gray-800 bg-[#111118] hover:border-purple-500 transition"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-3xl mx-auto px-6 pb-20 text-center">
        <h2 className="text-2xl font-bold mb-10">কীভাবে কাজ করে?</h2>
        <div className="flex flex-col md:flex-row gap-6 justify-center">
          {[
            { step: "১", title: "Signup করো", desc: "Free তে account বানাও" },
            { step: "২", title: "Connect করো", desc: "WhatsApp ও Facebook connect করো" },
            { step: "৩", title: "Widget বসাও", desc: "Website এ script paste করো" },
          ].map((s) => (
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
        <h2 className="text-2xl font-bold text-center mb-4">Pricing</h2>
        <p className="text-center text-gray-400 mb-10">কোনো hidden charge নাই। যেকোনো সময় cancel করো।</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`p-6 rounded-xl border ${
                p.highlighted
                  ? "border-purple-500 bg-[#15121f]"
                  : "border-gray-800 bg-[#111118]"
              }`}
            >
              {p.highlighted && (
                <div className="text-xs text-purple-400 font-semibold mb-2 uppercase tracking-wide">
                  ⭐ Most Popular
                </div>
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
              <Link
                to="/signup"
                className={`block text-center py-2 rounded-md text-sm font-medium transition ${
                  p.highlighted
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "border border-gray-700 hover:border-purple-500"
                }`}
              >
                {p.name} শুরু করো
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <div className="p-10 rounded-2xl border border-purple-500 bg-[#15121f]">
          <h2 className="text-2xl font-bold mb-4">আজই শুরু করো</h2>
          <p className="text-gray-400 mb-6">
            Setup fee নাই। Credit card লাগবে না। ৫ মিনিটে ready।
          </p>
          <Link
            to="/signup"
            className="inline-block px-8 py-3 rounded-md bg-purple-600 hover:bg-purple-700 font-semibold transition"
          >
            Free তে শুরু করো →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-gray-500 text-sm pb-10">
        © 2026 Automorai. Built in Dhaka, Bangladesh.
      </footer>
    </div>
  );
};

export default Index;

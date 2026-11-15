import { useState } from "react";
import { Link } from "react-router-dom";

// Free trial of the Tender System (2026-11-15). Public page — no login.
// The form goes to the tender server's sign-up receiver (trial_bot.js) through
// https://n8n2.kingpurefood.com/tender-trial/signup ; the answer carries the
// personal Telegram link that starts the 7-day trial in the Demo bot.
const SIGNUP_URL = "https://n8n2.kingpurefood.com/tender-trial/signup";

type Fields = { name: string; company: string; mobile: string; email: string; district: string; work_type: string; website: string };
const EMPTY: Fields = { name: "", company: "", mobile: "", email: "", district: "", work_type: "", website: "" };

const LABEL_ERR: Record<string, string> = {
  name: "আপনার নাম ইংরেজিতে লিখুন",
  company: "কোম্পানির নাম ইংরেজিতে লিখুন",
  mobile: "সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)",
  email: "সঠিক email দিন",
  district: "জেলার নাম দিন",
  work_type: "কাজের ধরন বেছে নিন",
};

const TenderTrial = () => {
  const [f, setF] = useState<Fields>(EMPTY);
  const [bad, setBad] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [tgUrl, setTgUrl] = useState("");

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(""); setBad([]); setLoading(true);
    try {
      const r = await fetch(SIGNUP_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const j = await r.json().catch(() => ({}));
      if (j.ok && j.telegram_url) { setTgUrl(j.telegram_url); return; }
      if (j.ok) { setMsg("ধন্যবাদ!"); return; }
      if (j.error === "invalid") { setBad(j.fields || []); setMsg("লাল চিহ্নিত ঘরগুলো ঠিক করুন।"); return; }
      if (j.error === "already_used") { setMsg("এই মোবাইল নম্বরে আগেই free trial নেওয়া হয়েছে। কিনতে চাইলে আমাদের সাথে যোগাযোগ করুন।"); return; }
      if (j.error === "too_many") { setMsg("অনেকবার চেষ্টা হয়েছে, এক ঘণ্টা পরে আবার চেষ্টা করুন।"); return; }
      setMsg("একটা সমস্যা হয়েছে, একটু পরে আবার চেষ্টা করুন।");
    } catch {
      setMsg("সংযোগে সমস্যা — ইন্টারনেট দেখে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const input = (k: keyof Fields, label: string, ph: string, type = "text") => (
    <div className="space-y-1">
      <label htmlFor={k} className="text-sm text-gray-300">{label}</label>
      <input id={k} type={type} value={f[k]} onChange={set(k)} placeholder={ph} required
        className={`w-full rounded-md bg-[#12121a] border px-3 py-2.5 text-white placeholder-gray-600 outline-none focus:border-purple-500 ${bad.includes(k) ? "border-red-500" : "border-gray-700"}`} />
      {bad.includes(k) && <p className="text-xs text-red-400">{LABEL_ERR[k]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <nav className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <Link to="/" className="text-xl font-bold text-purple-400">Automorai</Link>
        <span className="text-sm text-gray-500">Tender System</span>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pb-16 grid gap-10 md:grid-cols-2 items-start">
        <section className="pt-4">
          <div className="inline-block px-4 py-1 rounded-full border border-purple-500 text-purple-400 text-sm mb-5">
            🏗️ eGP টেন্ডার ঠিকাদারদের জন্য
          </div>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">টেন্ডারের কাগজপত্র এখন মিনিটে, ঘণ্টায় না</h1>
          <p className="text-gray-400 mb-6">
            টেন্ডার ID দিলেই Bidder Authorization, ব্যাংকের LOC আবেদন, Pay Order আবেদন — আপনার কোম্পানির নামে তৈরি। eGP ফর্ম fill, Map, BOQ — সব Telegram থেকে।
          </p>
          <ul className="space-y-3 text-gray-300">
            <li>✅ ৭ দিন free — কোনো টাকা লাগবে না</li>
            <li>✅ আপনার নিজের ৩টা টেন্ডারে DEMO ডকুমেন্ট</li>
            <li>✅ কয়েক মিনিটেই ডকুমেন্ট আপনার Telegram-এ</li>
            <li>✅ eGP ফর্ম bot নিজে fill করে — Demo bot-এ ভিডিও দেখুন</li>
            <li>✅ কোনো eGP password লাগবে না</li>
          </ul>
          <p className="text-xs text-gray-500 mt-6">
            Trial-এর ডকুমেন্টে "DEMO" লেখা থাকে, জমা দেওয়া যায় না। কিনলে পরিষ্কার Word + PDF, নিজের প্যাড-সই-সিল সহ।
          </p>
        </section>

        <section className="rounded-xl border border-gray-800 bg-[#0f0f16] p-6">
          {tgUrl ? (
            <div className="text-center space-y-5 py-6">
              <div className="text-5xl">🎉</div>
              <h2 className="text-2xl font-bold">আপনার trial তৈরি!</h2>
              <p className="text-gray-400">নিচের বাটনে চাপ দিয়ে Telegram-এ যান, তারপর <b>Start</b> চাপুন।</p>
              <a href={tgUrl} target="_blank" rel="noopener noreferrer"
                className="inline-block w-full px-6 py-3.5 rounded-md bg-[#229ED9] hover:bg-[#1c8bc0] font-semibold transition">
                Telegram-এ যান →
              </a>
              <p className="text-xs text-gray-500">এই link শুধু আপনার জন্য — অন্য কাউকে দেবেন না।</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4" noValidate>
              <h2 className="text-xl font-semibold mb-1">Free trial শুরু করুন</h2>
              <p className="text-xs text-gray-500 mb-2">নাম আর কোম্পানির নাম ইংরেজিতে লিখুন — ডকুমেন্টে এভাবেই বসবে।</p>
              {input("name", "আপনার নাম", "Md. Rahim Uddin")}
              {input("company", "কোম্পানির নাম", "Rahim Enterprise")}
              {input("mobile", "মোবাইল নম্বর", "01XXXXXXXXX", "tel")}
              {input("email", "Email", "you@example.com", "email")}
              {input("district", "জেলা", "Dhaka")}
              <div className="space-y-1">
                <label htmlFor="work_type" className="text-sm text-gray-300">কাজের ধরন</label>
                <select id="work_type" value={f.work_type} onChange={set("work_type")} required
                  className={`w-full rounded-md bg-[#12121a] border px-3 py-2.5 text-white outline-none focus:border-purple-500 ${bad.includes("work_type") ? "border-red-500" : "border-gray-700"}`}>
                  <option value="">বেছে নিন</option>
                  <option value="goods">Goods (মালামাল সরবরাহ)</option>
                  <option value="works">Works (নির্মাণ কাজ)</option>
                  <option value="both">দুটোই</option>
                </select>
                {bad.includes("work_type") && <p className="text-xs text-red-400">{LABEL_ERR.work_type}</p>}
              </div>
              {/* honeypot: hidden from people, bots fill it */}
              <input type="text" name="website" value={f.website} onChange={set("website")} tabIndex={-1} autoComplete="off"
                className="hidden" aria-hidden="true" />
              {msg && <p className="text-sm text-amber-400">{msg}</p>}
              <button type="submit" disabled={loading}
                className="w-full px-6 py-3 rounded-md bg-purple-600 hover:bg-purple-700 disabled:opacity-60 font-semibold transition">
                {loading ? "পাঠানো হচ্ছে…" : "Free trial নিন →"}
              </button>
              <p className="text-xs text-gray-500">আপনার তথ্য শুধু trial আর যোগাযোগের জন্য। না কিনলে trial শেষের ৩০ দিন পর ডকুমেন্টের তথ্য মুছে ফেলা হয়।</p>
            </form>
          )}
        </section>
      </div>
    </div>
  );
};

export default TenderTrial;

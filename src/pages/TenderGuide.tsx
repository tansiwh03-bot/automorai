import { Link } from "react-router-dom";

// Tender System — "how it starts after buying" + terms & data safety (2026-11-16). Public page, no login.
// Every sentence here must stay true to what the system really does (tender_scraper/ARCHITECTURE.md).
// Prices come from tender_scraper/trial_config.json — change both together.

const Step = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
  <li className="flex gap-4">
    <span className="shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold">{n}</span>
    <div>
      <h3 className="font-semibold text-white mb-1">{title}</h3>
      <div className="text-gray-400 space-y-1">{children}</div>
    </div>
  </li>
);

const Rule = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section>
    <h3 className="font-semibold text-white mb-1">{title}</h3>
    <div className="text-gray-400 space-y-1">{children}</div>
  </section>
);

const TenderGuide = () => (
  <div className="min-h-screen bg-[#0a0a0f] text-white">
    <nav className="flex items-center justify-between px-6 py-5 max-w-3xl mx-auto">
      <Link to="/" className="text-xl font-bold text-purple-400">Automorai</Link>
      <Link to="/tender-trial" className="text-sm text-gray-400 hover:text-white">৭ দিন free দেখুন →</Link>
    </nav>

    <div className="max-w-3xl mx-auto px-6 pb-20 space-y-14">
      <header className="pt-4">
        <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-3">Tender System — কেনা, চালু করা আর শর্ত</h1>
        <p className="text-gray-400">কেনার পর কীভাবে আপনার কোম্পানির জন্য সিস্টেম চালু হবে, আর আপনার তথ্য কীভাবে রাখা হয় — সব এক পাতায়।</p>
      </header>

      <section>
        <h2 className="text-2xl font-bold mb-2">দাম</h2>
        <div className="rounded-xl border border-gray-800 bg-[#0f0f16] p-5 text-gray-300 space-y-1">
          <p>Installation (একবার): <b className="text-white">২০,০০০ টাকা</b> — free trial চলার মধ্যে কিনলে <b className="text-white">১৫,০০০ টাকা</b></p>
          <p>মাসিক: <b className="text-white">৫,০০০ টাকা</b></p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6">কেনার পর চালু করার ধাপ</h2>
        <ol className="space-y-7">
          <Step n={1} title="Automorai-তে account খুলে package কিনুন">
            <p>automorai.com-এ Sign up করুন, তারপর Tender package কিনুন। টাকা পৌঁছালে আমরা নিশ্চিত করব।</p>
          </Step>
          <Step n={2} title="নিজের একটা Telegram bot খুলুন (২ মিনিট, ফ্রি)">
            <p>Telegram-এ <b className="text-white">@BotFather</b> খুঁজে খুলুন → <b className="text-white">/newbot</b> লিখুন।</p>
            <p>bot-এর একটা নাম দিন (যেমন: Rahim Tender), তারপর একটা username দিন যার শেষে <b className="text-white">bot</b> থাকবে (যেমন: rahim_tender_bot)।</p>
            <p>BotFather একটা লম্বা <b className="text-white">token</b> দেবে — এটা কপি করে রাখুন, অন্য কাউকে দেবেন না।</p>
            <p className="text-xs text-gray-500">কেন নিজের bot: আপনার সব ডকুমেন্ট আর কথা শুধু আপনার bot-এ থাকে, অন্য কোনো কোম্পানির সাথে মেশে না।</p>
          </Step>
          <Step n={3} title="নিজের Telegram ID জেনে নিন">
            <p>Telegram-এ <b className="text-white">@userinfobot</b> খুলে Start চাপুন — যে সংখ্যাটা দেখাবে (Id), সেটাই আপনার Telegram ID।</p>
          </Step>
          <Step n={4} title="Dashboard-এ Tender connect করুন">
            <p>Automorai Dashboard → <b className="text-white">Connect Tender</b> — কোম্পানির নাম, মালিকের নাম, ঠিকানা, bot token আর Telegram ID দিয়ে পাঠান।</p>
          </Step>
          <Step n={5} title="আমরা ফোনে বসে বাকিটা সেট করে দিই">
            <p>আমাদের লোক আপনাকে ফোন করে একসাথে এগুলো বসিয়ে দেবে: আপনার প্যাড, সই আর সিল; ব্যাংকের নাম, শাখা, account নম্বর; আর eGP login।</p>
            <p>সব ঠিক হলে একটা টেন্ডার দিয়ে পরীক্ষা করে দেখানো হয় — তারপর থেকে আপনি নিজের bot-এ টেন্ডার ID দিলেই কাজ শুরু।</p>
          </Step>
        </ol>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6">শর্ত ও আপনার তথ্যের নিরাপত্তা</h2>
        <div className="space-y-6">
          <Rule title="Final Submit সবসময় আপনি নিজে করবেন">
            <p>সিস্টেম eGP-তে ফর্ম পূরণ করে শুধু Save করে। Final Submit সিস্টেম কখনো করে না — জমা দেওয়ার আগে সব দেখে নেওয়া আর Submit করা আপনার কাজ।</p>
          </Rule>
          <Rule title="জমার আগে নিজে দেখে নিন">
            <p>টাকার অংক না মিললে সিস্টেম নিজেই থামিয়ে আপনাকে জানায়, তবু প্রতিটা ডকুমেন্ট আর ফর্ম Submit-এর আগে নিজে মিলিয়ে নেবেন। জমা দেওয়া টেন্ডারের দায়িত্ব টেন্ডারদাতার।</p>
          </Rule>
          <Rule title="আপনার তথ্য কোথায় থাকে">
            <p>আপনার কোম্পানির তথ্য, প্যাড-সই-সিল, ব্যাংকের তথ্য আর eGP login Automorai-র নিজের server-এ, তালাবদ্ধ ফাইলে থাকে। প্রতিটা কোম্পানির তথ্য আলাদা — এক কোম্পানির ডকুমেন্ট অন্য কোম্পানির bot-এ যায় না।</p>
            <p>আপনার তথ্য আমরা কারো কাছে বিক্রি বা শেয়ার করি না।</p>
          </Rule>
          <Rule title="AI-এর ব্যবহার">
            <p>টেন্ডারের কাগজ পড়তে আর bot-এ আপনার লেখা বুঝতে AI সেবা ব্যবহার হয়। তাই bot-এর chat-এ password বা গোপন তথ্য লিখবেন না — eGP login সেটআপের সময় আমাদের লোক সরাসরি বসিয়ে দেয়।</p>
          </Rule>
          <Rule title="Free trial">
            <p>Trial-এ eGP password লাগে না। Trial-এর ডকুমেন্টে "DEMO" ছাপ থাকে, জমা দেওয়া যায় না।</p>
            <p>না কিনলে trial শেষের ৩০ দিন পর আপনার ডকুমেন্ট আর ঠিকানা-ব্যাংকের তথ্য মুছে ফেলা হয় (৫ দিন আগে bot জানিয়ে দেয়)। নাম, মোবাইল আর email যোগাযোগের জন্য রাখা হয়।</p>
          </Rule>
          <Rule title="বন্ধ করতে চাইলে">
            <p>মাসিক টাকা না দিলে পরের মাস থেকে সেবা বন্ধ হয়। চাইলে আপনার সব তথ্য আর ফাইল মুছে দেওয়া হবে — আমাদের জানালেই হবে।</p>
          </Rule>
          <Rule title="যোগাযোগ">
            <p>যেকোনো প্রশ্নে: <a href="mailto:tansiwh03@gmail.com" className="text-purple-400 hover:underline">tansiwh03@gmail.com</a></p>
          </Rule>
        </div>
        <p className="text-xs text-gray-600 mt-8">সর্বশেষ হালনাগাদ: ১৬ নভেম্বর ২০২৬</p>
      </section>
    </div>
  </div>
);

export default TenderGuide;

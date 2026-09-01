import { Link } from "react-router-dom";

const features = [
  {
    title: "Auto Comment Reply",
    desc: "Your Facebook Page comments get instant, AI-powered replies — 24/7, no manual work needed.",
  },
  {
    title: "Messenger Auto-Reply",
    desc: "Customer messages are answered automatically with smart, context-aware responses.",
  },
  {
    title: "Abandoned Cart Recovery",
    desc: "Automatically follow up with customers who leave items in their cart, recovering lost sales.",
  },
  {
    title: "Order Confirmation",
    desc: "Every order gets an instant, automated confirmation message to your customer.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "৳2,500",
    period: "/month",
    features: ["1 Facebook Page", "Auto Comment Reply", "Basic Analytics", "Email Support"],
  },
  {
    name: "Growth",
    price: "৳5,000",
    period: "/month",
    features: [
      "3 Facebook Pages",
      "Auto Comment Reply",
      "Messenger Auto-Reply",
      "Abandoned Cart Recovery",
      "Priority Support",
    ],
    highlighted: true,
  },
  {
    name: "Pro",
    price: "৳9,500",
    period: "/month",
    features: [
      "10 Facebook Pages",
      "All Growth features",
      "Order Confirmation Automation",
      "Custom Workflow Requests",
      "Dedicated Support",
    ],
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <span className="text-xl font-bold">Automorai</span>
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
        <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
          Done-For-You E-commerce Automation for Your Facebook Page
        </h1>
        <p className="text-lg text-gray-400 mb-8">
          Automorai connects to your Facebook Page and automatically replies to
          comments and messages, recovers abandoned carts, and confirms orders —
          so you never miss a customer.
        </p>
        <Link
          to="/signup"
          className="inline-block px-8 py-3 rounded-md bg-purple-600 hover:bg-purple-700 font-semibold transition"
        >
          Get Started Free
        </Link>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-center mb-10">What Automorai Does</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-xl border border-gray-800 bg-[#111118]"
            >
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-center mb-10">Pricing</h2>
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
              <h3 className="font-semibold text-lg mb-1">{p.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold">{p.price}</span>
                <span className="text-gray-400 text-sm">{p.period}</span>
              </div>
              <ul className="space-y-2 mb-6">
                {p.features.map((feat) => (
                  <li key={feat} className="text-sm text-gray-400">
                    ✓ {feat}
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
                Choose {p.name}
              </Link>
            </div>
          ))}
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

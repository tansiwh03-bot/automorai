import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

// Automorai homepage — v2 2026-11-17 (user: website builder is the main benefit; show how fast a shop is made, how it looks,
// products, chat reply, orders; Shopify-like animation). Every claim must stay true to what the system really does:
//  - shop screenshots in /public/showcase are a real Automorai-built demo shop (Arisha Fashion World)
//  - Sales Report tab (2026-11-18, src/components/SalesReport.tsx) is real: daily sales graph, vs-previous %, best sellers,
//    status/payment/area split, from the shop's real website orders. The numbers in the "growth" section here are an EXAMPLE.
//  - Starter (990) is NOT built yet → "coming soon". Prices match BuyPackage.tsx + the WhatsApp AI prompt (n8n).

const WA_NUMBER = "8801615763484";
const waLink = (text: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
const DEMO_SHOP = "https://arisha-fashion-world-723365.tansiwh03.workers.dev/";

type Plan = { key: string; name: string; price: string; desc: string; features: string[]; cta: string; href: string; external?: boolean; popular?: boolean; soon?: boolean };

const content = {
  bn: {
    nav: { login: "লগইন", signup: "শুরু করুন" },
    badge: "বাংলাদেশের দোকানদারদের জন্য",
    hero1: "কয়েক মিনিটে",
    hero2: "নিজের অনলাইন দোকান",
    hero3: "সাথে AI, যে ২৪ ঘণ্টা ক্রেতার উত্তর দেয়",
    heroDesc: "দোকানের নাম আর ধরন দিন — পণ্য, কার্ট, ক্যাশ অন ডেলিভারি, bKash/Nagad সহ সাজানো দোকান তৈরি। কোড জানতে হয় না।",
    ctaMain: "বিনামূল্যে দোকান বানান",
    ctaDemo: "নমুনা দোকান দেখুন",
    ctaWa: "WhatsApp-এ কথা বলুন",
    sample: "নমুনা দোকান",
    toastOrder: "নতুন অর্ডার · ৳৪৫০", toastOrderSub: "Party Frock · ক্যাশ অন ডেলিভারি",
    toastAi: "AI উত্তর দিয়েছে", toastAiSub: "৩ সেকেন্ডে, বাংলায়",
    niches: ["ফ্যাশন ও পোশাক", "শিশুদের পোশাক", "কসমেটিক্স", "খাবার", "ইলেকট্রনিক্স", "গয়না", "ঘর সাজানো", "ফার্মেসি", "খেলাধুলা", "জেনারেল স্টোর"],
    nicheTitle: "যেকোনো ধরনের দোকানের জন্য",
    buildTitle: "দোকান তৈরি হয় এভাবে",
    buildDesc: "চারটা ধাপ — বাকি সব Automorai সাজিয়ে দেয়।",
    buildSteps: [
      { t: "নাম আর ধরন দিন", d: "দোকানের নাম, কোন ধরনের পণ্য, আর WhatsApp নম্বর।" },
      { t: "Automorai সাজিয়ে দেয়", d: "ক্যাটাগরি, স্লাইডার, ডেলিভারি চার্জ, পেমেন্ট — সব তৈরি।" },
      { t: "নিজের পণ্য দিন", d: "ছবি, দাম, সাইজ আর রঙ — Dashboard থেকে যোগ করুন।" },
      { t: "লিংক শেয়ার করুন", d: "Facebook পোস্টে দোকানের লিংক — ক্রেতা নিজেই অর্ডার করবে।" },
    ],
    builder: { name: "দোকানের নাম", type: "দোকানের ধরন", typed: "Arisha Fashion World", chip: "শিশুদের পোশাক", making: "দোকান তৈরি হচ্ছে…", parts: ["ক্যাটাগরি", "স্লাইডার", "চেকআউট", "AI চ্যাট"], addProduct: "পণ্য যোগ করুন", pName: "Party Frock", pPrice: "৳৪৫০", live: "আপনার দোকান লাইভ!", share: "Facebook-এ শেয়ার করুন" },
    showTitle: "ক্রেতা যা দেখবে",
    showDesc: "মোবাইলে সুন্দর, দ্রুত — ক্রেতা কয়েক ক্লিকেই অর্ডার করে।",
    tabs: [
      { k: "products", t: "পণ্যের তালিকা", d: "সব পণ্য ছবি, দাম আর ছাড় সহ। ক্যাটাগরি অনুযায়ী সাজানো, খোঁজার সুবিধা আছে।", pts: ["ক্যাটাগরি ও সার্চ", "আগের দাম কেটে ছাড় দেখায়", "বাংলা/English বদলানো যায়"] },
      { k: "page", t: "পণ্যের পাতা", d: "প্রতিটা পণ্যের নিজের পাতা — বড় ছবি, দাম, পরিমাণ, সাইজ ও রঙ।", pts: ["কয়েকটা ছবি, বড় করে দেখা যায়", "Add to Cart আর Buy Now", "\"আপনার পছন্দ হতে পারে\" — আরও পণ্য"] },
      { k: "checkout", t: "সহজ চেকআউট", d: "শুধু নাম, মোবাইল আর ঠিকানা। ঢাকা-ঢাকার বাইরে ডেলিভারি চার্জ নিজে যোগ হয়।", pts: ["ক্যাশ অন ডেলিভারি", "bKash, Nagad, ব্যাংক", "ভুল মোবাইল নম্বর ধরে ফেলে"] },
      { k: "chat", t: "দোকানে AI চ্যাট", d: "ক্রেতা প্রশ্ন করলে AI উত্তর দেয়, পণ্যের ছবি দেখায় — চ্যাটের ভেতর থেকেই কার্টে যোগ করা যায়।", pts: ["বাংলা, English, Banglish", "পণ্যের ছবি ও দাম দেখায়", "চ্যাট থেকেই অর্ডার"] },
      { k: "orders", t: "অর্ডার ও হিসাব", d: "সব অর্ডার এক তালিকায়, অবস্থা বদলান এক ক্লিকে। নতুন অর্ডারে WhatsApp-এ খবর।", pts: ["Pending → Confirmed → Shipped → Delivered", "অর্ডারের খবর WhatsApp-এ", "Facebook Pixel ও Google Analytics যুক্ত করা যায়"] },
    ],
    chatMock: { q: "বাচ্চার জন্য গোলাপি ফ্রক আছে?", a: "জি আছে! Party Frock, দাম ৪৫০ টাকা (২০% ছাড়)।", add: "Add to Cart", buy: "Buy Now" },
    checkoutMock: { title: "অর্ডার নিশ্চিত করুন", name: "নাম", phone: "মোবাইল", addr: "ঠিকানা", loc: ["ঢাকা", "ঢাকার বাইরে"], pay: ["ক্যাশ অন ডেলিভারি", "bKash", "Nagad"], total: "মোট", btn: "অর্ডার করুন" },
    ordersMock: { title: "Orders", rows: [["Party Frock", "৳৪৫০", "Delivered"], ["Cotton Dress", "৳৬৫০", "Shipped"], ["T-Shirt Set", "৳৮৫০", "Confirmed"], ["Shorts Set", "৳১,২০০", "Pending"]], notify: "নতুন অর্ডার এসেছে — WhatsApp" },
    example: "উদাহরণ",
    growth: {
      tag: "নতুন · Sales Report",
      title: "বিক্রি বাড়ছে কিনা, এক নজরে দেখুন",
      desc: "আপনার দোকানের আসল অর্ডার থেকে Dashboard নিজেই হিসাব করে দেখায় — কত বিক্রি হলো, কোন পণ্য চলছে, আগের চেয়ে বাড়ল না কমল। খাতা-কলম লাগে না।",
      pts: ["প্রতিদিনের বিক্রির গ্রাফ — ৭, ৩০ বা ৯০ দিনের", "আগের সময়ের চেয়ে বিক্রি কত % বাড়ল বা কমল", "কোন পণ্য সবচেয়ে বেশি বিক্রি হয়", "কত অর্ডার ডেলিভারি হলো, কত বাতিল", "Facebook Pixel ও Google Analytics — কত মানুষ দোকানে এল"],
      kpi: [["বিক্রি", "৳৫৪,২০০", "▲ ১৮%"], ["অর্ডার", "৬০", "▲ ১২%"], ["গড় অর্ডার", "৳৯০৩", "▲ ৫%"]],
      chart: "প্রতিদিনের বিক্রি · শেষ ৩০ দিন", top: "সবচেয়ে বেশি বিক্রি", topRows: [["Party Frock", "৳১৫,৩০০"], ["Shorts Set", "৳১২,০০০"], ["Cotton Dress", "৳৯,১০০"]],
    },
    replyTitle: "ক্রেতার প্রশ্নের উত্তর দেয় AI",
    replyDesc: "Messenger আর WhatsApp-এ \"দাম কত?\", \"আছে?\", \"ডেলিভারি কত?\" — AI উত্তর দেয় বাংলায়, ৩ সেকেন্ডে। রাত ২টায়ও। ছবি আর ভয়েস মেসেজও বোঝে।",
    replyPts: ["Messenger ও WhatsApp", "Facebook কমেন্টের উত্তর", "সব মেসেজ এক Inbox-এ", "দরদাম করলে আপনাকে জানায়"],
    mock: { shop: "আপনার দোকান", online: "এখন অনলাইনে", q1: "ভাই কালো পাঞ্জাবিটার দাম কত? M সাইজ আছে?", a1: "জি, কালো পাঞ্জাবি M সাইজ স্টকে আছে। দাম ১,২৫০ টাকা, ঢাকায় ডেলিভারি ৬০ টাকা।", q2: "ক্যাশ অন ডেলিভারি হবে?", a2: "জি, ক্যাশ অন ডেলিভারি আছে। bKash-এও দিতে পারেন।", time: "রাত ২:১৪" },
    auto: {
      tag: "নতুন · বিক্রির পরের কাজও automatic",
      title: "অর্ডার আসার পরের ঝামেলাও Automorai সামলায়",
      desc: "Facebook-এ বিক্রি করুন বা নিজের WooCommerce সাইটে — অর্ডার যাচাই, courier, আর ক্রেতাকে মনে করিয়ে দেওয়া, সব এক Dashboard থেকে।",
      cards: [
        { i: "🛍️", t: "WooCommerce দোকান যুক্ত করুন", d: "আপনার WooCommerce সাইটের প্রতিটা অর্ডার নিজে থেকেই Automorai-তে চলে আসে। সাইট বদলাতে হয় না, শুধু একটা key দিন।" },
        { i: "🛡️", t: "ভুয়া অর্ডার আগেই ধরুন", d: "প্রতিটা অর্ডারের পাশে ক্রেতার নম্বরের courier ইতিহাস — আগে কতগুলো পার্সেল নিয়েছে, কতগুলো ফেরত দিয়েছে।" },
        { i: "🚚", t: "এক ক্লিকে Steadfast বুকিং", d: "অর্ডার থেকে সরাসরি Steadfast-এ পার্সেল বুক, tracking code সহ। আলাদা করে ঠিকানা কপি করতে হয় না।" },
        { i: "🛒", t: "কার্ট ছেড়ে গেলে মনে করিয়ে দেয়", d: "ক্রেতা অর্ডার শেষ না করলে তাকে email-এ মনে করিয়ে দেয় (বড় প্যাকেজে WhatsApp-এও), আর আপনাকে জানায়।" },
        { i: "🔔", t: "অর্ডারের খবর সাথে সাথে", d: "নতুন অর্ডার, দরদাম বা কার্ট ছাড়লে — আপনার WhatsApp আর email-এ খবর যায়।" },
        { i: "📈", t: "Facebook Pixel, GA4, GTM", d: "শুধু ID বসান — পণ্য দেখা, Add to Cart, Checkout আর Purchase নিজে থেকেই যায়। বিজ্ঞাপন আরও ভালো কাজ করে।" },
      ],
      cta: "বিনামূল্যে শুরু করুন",
    },
    priceTitle: "সহজ দাম, লুকানো খরচ নেই",
    priceDesc: "মাসিক — যেকোনো সময় বন্ধ করতে পারবেন।",
    perMonth: "/মাস", popular: "সবচেয়ে জনপ্রিয়", soon: "শিগগিরই আসছে",
    plans: [
      { key: "starter", name: "শুরু", price: "৳৯৯০", desc: "ছোট দোকানের জন্য", features: ["ছোট website — পণ্য ও দাম", "Messenger-এ AI উত্তর", "\"WhatsApp-এ অর্ডার\" বাটন", "Pixel নিজে বসানোর সুবিধা"], cta: "শিগগিরই আসছে", href: "", soon: true },
      { key: "business", name: "ব্যবসা", price: "৳২,৪৯০", desc: "যারা নিয়মিত অনলাইনে বিক্রি করেন", features: ["পুরো অনলাইন দোকান (কার্ট, COD, bKash/Nagad)", "WhatsApp ও Messenger-এ AI উত্তর", "মাসে ৫,০০০ AI উত্তর পর্যন্ত", "বিক্রির গ্রাফ ও Sales Report", "সব মেসেজ এক জায়গায়", "Steadfast বুকিং ও ভুয়া অর্ডার যাচাই", "কার্ট ছাড়লে ক্রেতাকে email", "Pixel, GA4 ও GTM"], cta: "শুরু করুন", href: "/signup", popular: true },
      { key: "big", name: "বড়", price: "৳৪,৯৯০", desc: "একাধিক পেজ বা বড় দোকান", features: ["ব্যবসা প্যাকেজের সব কিছু", "একাধিক Facebook পেজ", "WooCommerce দোকান যুক্ত করা", "কার্ট ছাড়লে ক্রেতাকে WhatsApp", "দ্রুত, অগ্রাধিকার সাপোর্ট"], cta: "WhatsApp-এ যোগাযোগ", href: waLink("আমি Automorai-র বড় প্যাকেজ (৪,৯৯০) সম্পর্কে জানতে চাই"), external: true },
    ] as Plan[],
    tender: {
      tag: "eGP টেন্ডার ঠিকাদারদের জন্য", title: "Tender System",
      desc: "টেন্ডারের কাগজ বানানো থেকে প্রতিদিনের নতুন টেন্ডার খোঁজা — ঘণ্টার কাজ মিনিটে।",
      points: ["আপনার প্যাডে bidder letter, ব্যাংকের আবেদন, পে-অর্ডারের চিঠি", "eGP-র ফর্ম পূরণ ও Save — Final Submit সবসময় আপনি নিজে করেন", "প্রতিদিন সকালে আপনার অফিস ও কাজের নতুন টেন্ডার (LTM সহ), Security সহ — Telegram বা WhatsApp-এ"],
      price: "Installation ৳২০,০০০ (প্রথম মাস সহ) · তারপর মাসে ৳৫,০০০ · free trial চলাকালীন কিনলে installation ৳১৫,০০০",
      trial: "৭ দিন ফ্রি দেখুন", guide: "কীভাবে চালু হয় ও শর্ত",
    },
    faqTitle: "সাধারণ প্রশ্ন",
    faqs: [
      { q: "দোকান বানাতে কি কোড বা ডিজাইন জানতে হবে?", a: "না। দোকানের নাম আর ধরন দিলেই দোকান সাজানো অবস্থায় তৈরি হয়। পরে Dashboard থেকে পণ্য, ছবি, দাম, ডেলিভারি চার্জ আর পেমেন্টের নম্বর বসাবেন।" },
      { q: "আমার আগে থেকেই WooCommerce সাইট আছে, কাজে লাগবে?", a: "হ্যাঁ। Dashboard-এর Integrations থেকে আপনার WooCommerce দোকান যুক্ত করুন — প্রতিটা নতুন অর্ডার Automorai-তে চলে আসবে, সাথে ভুয়া অর্ডার যাচাই, Steadfast বুকিং আর WhatsApp/email খবর। সাইট বদলাতে হয় না।" },
      { q: "AI কি বাংলা বোঝে?", a: "হ্যাঁ। বাংলা, English আর Banglish (\"bhai dam koto\") — ক্রেতা যে ভাষায় লেখে সেই ভাষায় উত্তর দেয়। ভয়েস মেসেজ আর ছবিও বোঝে।" },
      { q: "পেমেন্ট কীভাবে করব?", a: "bKash বা Nagad-এ — Dashboard-এর \"Buy Package\" পাতা থেকে। ডলার কার্ড লাগে না।" },
      { q: "আমার পেজ ও তথ্য কি নিরাপদ?", a: "আপনার Facebook পেজের চাবি (token) তালাবদ্ধ (encrypted) অবস্থায় রাখা হয়। এক দোকানের তথ্য অন্য দোকান দেখতে পারে না। আপনার তথ্য আমরা কারো কাছে বিক্রি করি না।" },
      { q: "বন্ধ করতে চাইলে?", a: "মাসিক প্যাকেজ — পরের মাসের টাকা না দিলেই বন্ধ। কোনো চুক্তি বা জরিমানা নেই।" },
    ],
    finalTitle: "আজই আপনার অনলাইন দোকান খুলুন",
    finalDesc: "account খোলা বিনামূল্যে। প্রশ্ন থাকলে WhatsApp-এ লিখুন।",
    footer: { tag: "আপনি ঘুমান, ব্যবসা চলুক।", desc: "বাংলাদেশের দোকানদারদের জন্য অনলাইন দোকান আর AI উত্তর — Facebook, Messenger, WhatsApp এক জায়গায়।", product: "সেবা", company: "Automorai", contact: "যোগাযোগ", shop: "অনলাইন দোকান", ai: "AI উত্তর", pricing: "দাম", demo: "নমুনা দোকান", login: "লগইন", signup: "বিনামূল্যে শুরু", privacy: "Privacy Policy", pay: "পেমেন্ট", waCta: "WhatsApp-এ লিখুন", tm: "eGP টেন্ডার ঠিকাদার?", tmLink: "Tender Master BD দেখুন →", copy: "© ২০২৬ Automorai · ঢাকা, বাংলাদেশ" },
  },
  en: {
    nav: { login: "Log in", signup: "Get started" },
    badge: "Built for Bangladeshi sellers",
    hero1: "Your own online shop",
    hero2: "in a few minutes",
    hero3: "with an AI that answers buyers 24 hours",
    heroDesc: "Give your shop's name and type — get a ready shop with products, cart, cash on delivery and bKash/Nagad. No coding.",
    ctaMain: "Build your shop free",
    ctaDemo: "See a sample shop",
    ctaWa: "Talk on WhatsApp",
    sample: "Sample shop",
    toastOrder: "New order · ৳450", toastOrderSub: "Party Frock · Cash on delivery",
    toastAi: "AI replied", toastAiSub: "in 3 seconds, in Bangla",
    niches: ["Fashion & clothing", "Kids wear", "Cosmetics", "Food", "Electronics", "Jewelry", "Home decor", "Pharmacy", "Sports", "General store"],
    nicheTitle: "For every kind of shop",
    buildTitle: "How your shop is made",
    buildDesc: "Four steps — Automorai sets up the rest.",
    buildSteps: [
      { t: "Name and type", d: "Your shop's name, what you sell and your WhatsApp number." },
      { t: "Automorai sets it up", d: "Categories, slider, delivery charge, payment — all ready." },
      { t: "Add your products", d: "Photos, prices, sizes and colours — from the Dashboard." },
      { t: "Share the link", d: "Post your shop link on Facebook — buyers order by themselves." },
    ],
    builder: { name: "Shop name", type: "Shop type", typed: "Arisha Fashion World", chip: "Kids wear", making: "Building your shop…", parts: ["Categories", "Slider", "Checkout", "AI chat"], addProduct: "Add product", pName: "Party Frock", pPrice: "৳450", live: "Your shop is live!", share: "Share on Facebook" },
    showTitle: "What your buyers see",
    showDesc: "Beautiful and fast on mobile — buyers order in a few taps.",
    tabs: [
      { k: "products", t: "Product list", d: "All products with photo, price and discount. Arranged by category, with search.", pts: ["Categories & search", "Shows old price struck out", "Bangla / English switch"] },
      { k: "page", t: "Product page", d: "Every product has its own page — big photos, price, quantity, size and colour.", pts: ["Several photos, zoom", "Add to Cart and Buy Now", "\"You may also like\" products"] },
      { k: "checkout", t: "Easy checkout", d: "Only name, mobile and address. Dhaka / outside Dhaka delivery charge added by itself.", pts: ["Cash on delivery", "bKash, Nagad, bank", "Catches wrong mobile numbers"] },
      { k: "chat", t: "AI chat in the shop", d: "The AI answers buyers and shows product photos — they can add to cart right inside the chat.", pts: ["Bangla, English, Banglish", "Shows product photo & price", "Order from the chat"] },
      { k: "orders", t: "Orders", d: "All orders in one list, change status in one click. WhatsApp alert for every new order.", pts: ["Pending → Confirmed → Shipped → Delivered", "Order alerts on WhatsApp", "Connect Facebook Pixel & Google Analytics"] },
    ],
    chatMock: { q: "Do you have a pink frock for a baby?", a: "Yes! Party Frock, 450 BDT (20% off).", add: "Add to Cart", buy: "Buy Now" },
    checkoutMock: { title: "Confirm order", name: "Name", phone: "Mobile", addr: "Address", loc: ["Dhaka", "Outside Dhaka"], pay: ["Cash on delivery", "bKash", "Nagad"], total: "Total", btn: "Place order" },
    ordersMock: { title: "Orders", rows: [["Party Frock", "৳450", "Delivered"], ["Cotton Dress", "৳650", "Shipped"], ["T-Shirt Set", "৳850", "Confirmed"], ["Shorts Set", "৳1,200", "Pending"]], notify: "New order — WhatsApp" },
    example: "Example",
    growth: {
      tag: "New · Sales Report",
      title: "See at a glance if your sales are growing",
      desc: "The Dashboard works it out from your shop's real orders — how much you sold, which products sell, and whether you're up or down. No notebook needed.",
      pts: ["Daily sales graph — 7, 30 or 90 days", "How many % sales went up or down vs before", "Which products sell the most", "How many orders were delivered or cancelled", "Facebook Pixel & Google Analytics — how many people visited"],
      kpi: [["Sales", "৳54,200", "▲ 18%"], ["Orders", "60", "▲ 12%"], ["Avg. order", "৳903", "▲ 5%"]],
      chart: "Daily sales · last 30 days", top: "Best sellers", topRows: [["Party Frock", "৳15,300"], ["Shorts Set", "৳12,000"], ["Cotton Dress", "৳9,100"]],
    },
    replyTitle: "AI answers your buyers",
    replyDesc: "On Messenger and WhatsApp — \"price?\", \"in stock?\", \"delivery?\" — the AI answers in Bangla within 3 seconds, even at 2 AM. It understands photos and voice messages too.",
    replyPts: ["Messenger & WhatsApp", "Replies to Facebook comments", "All messages in one inbox", "Tells you when a buyer bargains"],
    mock: { shop: "Your shop", online: "Online now", q1: "How much is the black panjabi? Size M?", a1: "Yes, the black panjabi in M is in stock. 1,250 BDT, delivery in Dhaka 60 BDT.", q2: "Cash on delivery?", a2: "Yes, cash on delivery is available. bKash works too.", time: "2:14 AM" },
    auto: {
      tag: "New · the work after the sale is automatic too",
      title: "Automorai also handles what happens after an order",
      desc: "Sell on Facebook or on your own WooCommerce site — order checks, courier booking and buyer reminders, all from one Dashboard.",
      cards: [
        { i: "🛍️", t: "Connect your WooCommerce store", d: "Every order on your WooCommerce site comes into Automorai by itself. No need to change your site — just add a key." },
        { i: "🛡️", t: "Catch fake orders early", d: "Next to each order: the buyer number's courier history — how many parcels they took and how many they returned." },
        { i: "🚚", t: "1-click Steadfast booking", d: "Book the parcel on Steadfast straight from the order, with tracking code. No copying addresses." },
        { i: "🛒", t: "Abandoned cart reminders", d: "If a buyer doesn't finish, they get an email reminder (WhatsApp too on the Big plan) — and you get notified." },
        { i: "🔔", t: "Instant order alerts", d: "New order, price haggling or an abandoned cart — alerts go to your WhatsApp and email." },
        { i: "📈", t: "Facebook Pixel, GA4, GTM", d: "Just paste the ID — product views, add to cart, checkout and purchase are sent automatically. Your ads work better." },
      ],
      cta: "Start free",
    },
    priceTitle: "Simple pricing, no hidden costs",
    priceDesc: "Monthly — stop any time.",
    perMonth: "/month", popular: "Most popular", soon: "Coming soon",
    plans: [
      { key: "starter", name: "Starter", price: "৳990", desc: "For small shops", features: ["Small website — products & prices", "AI replies on Messenger", "\"Order on WhatsApp\" button", "Add your own Pixel"], cta: "Coming soon", href: "", soon: true },
      { key: "business", name: "Business", price: "৳2,490", desc: "For shops selling online every day", features: ["Full online shop (cart, COD, bKash/Nagad)", "AI replies on WhatsApp & Messenger", "Up to 5,000 AI replies a month", "Sales graph & Sales Report", "All messages in one place", "Steadfast booking & fake-order check", "Abandoned cart emails to buyers", "Pixel, GA4 & GTM"], cta: "Get started", href: "/signup", popular: true },
      { key: "big", name: "Big", price: "৳4,990", desc: "Several pages or a bigger shop", features: ["Everything in Business", "Several Facebook pages", "WooCommerce store connection", "Abandoned cart WhatsApp to buyers", "Fast priority support"], cta: "Contact on WhatsApp", href: waLink("I want to know about Automorai's Big package (4,990)"), external: true },
    ] as Plan[],
    tender: {
      tag: "For eGP tender contractors", title: "Tender System",
      desc: "From tender documents to finding new tenders every day — hours of work in minutes.",
      points: ["Bidder letter, bank applications, pay order letter — on your own pad", "Fills and saves eGP forms — the final Submit is always yours", "Every morning: new tenders of your offices and work types (LTM too), with security money — on Telegram or WhatsApp"],
      price: "Installation ৳20,000 (first month included) · then ৳5,000/month · ৳15,000 installation if you buy during the free trial",
      trial: "Try 7 days free", guide: "Setup steps & terms",
    },
    faqTitle: "Questions",
    faqs: [
      { q: "Do I need to know coding or design?", a: "No. Give your shop's name and type and a ready shop is made. Then add products, photos, prices, delivery charge and payment numbers from the Dashboard." },
      { q: "I already have a WooCommerce site. Can I use it?", a: "Yes. Connect your WooCommerce store from Dashboard → Integrations — every new order comes into Automorai with a fake-order check, Steadfast booking and WhatsApp/email alerts. No need to change your site." },
      { q: "Does the AI understand Bangla?", a: "Yes. Bangla, English and Banglish (\"bhai dam koto\") — it replies in the buyer's language. It understands voice messages and photos too." },
      { q: "How do I pay?", a: "bKash or Nagad, from the Dashboard's \"Buy Package\" page. No dollar card needed." },
      { q: "Are my page and data safe?", a: "Your Facebook page key (token) is stored encrypted. One shop can never see another shop's data. We never sell your data." },
      { q: "How do I stop?", a: "It's monthly — just don't pay the next month. No contract, no penalty." },
    ],
    finalTitle: "Open your online shop today",
    finalDesc: "Creating an account is free. Questions? Message us on WhatsApp.",
    footer: { tag: "You sleep, your business runs.", desc: "Online shop and AI replies for Bangladeshi sellers — Facebook, Messenger and WhatsApp in one place.", product: "Product", company: "Automorai", contact: "Contact", shop: "Online shop", ai: "AI replies", pricing: "Pricing", demo: "Sample shop", login: "Log in", signup: "Start free", privacy: "Privacy Policy", pay: "Payments", waCta: "Message on WhatsApp", tm: "eGP tender contractor?", tmLink: "See Tender Master BD →", copy: "© 2026 Automorai · Dhaka, Bangladesh" },
  },
};

const Check = ({ c = "text-teal-600" }: { c?: string }) => (
  <svg viewBox="0 0 20 20" className={`w-5 h-5 shrink-0 ${c}`} fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z" clipRule="evenodd" />
  </svg>
);
const WaIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3a.4.4 0 0 0 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.2c-.1-.1-.3-.2-.5-.3Z" />
  </svg>
);

// fade/slide in when scrolled into view (Shopify-style). Respects prefers-reduced-motion (CSS below).
function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.am-in)"));
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("am-in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("am-in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  });
}

const Phone = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-[2.2rem] bg-slate-900 p-2.5 shadow-2xl ${className}`}>
    <div className="rounded-[1.8rem] overflow-hidden bg-white relative aspect-[390/780]">{children}</div>
  </div>
);

// animated builder demo: cycles through the 4 steps
const BuilderDemo = ({ step, b }: { step: number; b: typeof content.bn.builder }) => {
  const [typed, setTyped] = useState("");
  const [pct, setPct] = useState(0);
  useEffect(() => {
    if (step !== 0) { setTyped(b.typed); return; }
    setTyped("");
    let i = 0;
    const id = setInterval(() => { i++; setTyped(b.typed.slice(0, i)); if (i >= b.typed.length) clearInterval(id); }, 70);
    return () => clearInterval(id);
  }, [step, b.typed]);
  useEffect(() => {
    if (step !== 1) { setPct(step > 1 ? 100 : 0); return; }
    setPct(0);
    let p = 0;
    const id = setInterval(() => { p = Math.min(100, p + 4); setPct(p); if (p >= 100) clearInterval(id); }, 90);
    return () => clearInterval(id);
  }, [step]);
  return (
    <div className="relative rounded-3xl bg-white border border-slate-300 shadow-2xl shadow-slate-900/10 p-5 sm:p-6 min-h-[290px] sm:min-h-[330px] overflow-hidden">
      <div className="flex gap-1.5 mb-5"><span className="w-3 h-3 rounded-full bg-red-300" /><span className="w-3 h-3 rounded-full bg-amber-300" /><span className="w-3 h-3 rounded-full bg-green-300" /></div>
      {step === 0 && (
        <div className="am-pop space-y-4">
          <div><div className="text-sm text-slate-500 mb-1">{b.name}</div>
            <div className="rounded-xl border-2 border-teal-600 px-4 py-3 text-lg font-semibold text-slate-900">{typed}<span className="am-caret">|</span></div></div>
          <div><div className="text-sm text-slate-500 mb-2">{b.type}</div>
            <div className="flex flex-wrap gap-2">{["👗", "👶", "💄", "🌿"].map((e, i) => <span key={e} className={`px-3 py-2 rounded-full border text-sm ${i === 1 ? "bg-teal-700 text-white border-teal-700" : "border-slate-200 text-slate-600"}`}>{e} {i === 1 ? b.chip : ""}</span>)}</div></div>
        </div>
      )}
      {step === 1 && (
        <div className="am-pop">
          <div className="font-semibold text-slate-900 mb-3">{b.making}</div>
          <div className="h-3 rounded-full bg-slate-100 overflow-hidden mb-5"><div className="h-full bg-teal-600 transition-all duration-100" style={{ width: `${pct}%` }} /></div>
          <div className="grid grid-cols-2 gap-3">{b.parts.map((x, i) => (
            <div key={x} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all duration-300 ${pct > (i + 1) * 22 ? "border-teal-200 bg-teal-50 text-teal-800" : "border-slate-200 text-slate-400"}`}>
              <Check c={pct > (i + 1) * 22 ? "text-teal-600" : "text-slate-300"} />{x}</div>))}</div>
        </div>
      )}
      {step === 2 && (
        <div className="am-pop flex gap-4 items-start">
          <img src="/showcase/product-frock.jpg" alt="" className="w-28 h-28 object-cover rounded-2xl" />
          <div className="flex-1 space-y-2">
            <div className="text-sm text-slate-500">{b.addProduct}</div>
            <div className="rounded-lg border border-slate-200 px-3 py-2 font-semibold">{b.pName}</div>
            <div className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-teal-700">{b.pPrice}</div>
            <div className="flex gap-1.5">{["S", "M", "L"].map((s) => <span key={s} className="w-9 h-9 rounded-lg border border-slate-300 flex items-center justify-center text-sm">{s}</span>)}{["bg-pink-300", "bg-sky-300", "bg-amber-200"].map((c) => <span key={c} className={`w-9 h-9 rounded-full ${c}`} />)}</div>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="am-pop text-center pt-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-teal-600 text-white flex items-center justify-center mb-4 am-pulse"><Check c="text-white w-9 h-9" /></div>
          <div className="text-2xl font-bold text-slate-900 mb-2">{b.live}</div>
          <div className="text-sm text-slate-500 mb-5 break-all">arisha-fashion-world.….workers.dev</div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#1877f2] text-white px-5 py-2.5 font-semibold">f &nbsp;{b.share}</span>
        </div>
      )}
    </div>
  );
};

const Index = () => {
  const [lang, setLang] = useState<"en" | "bn">("bn");
  const [open, setOpen] = useState<number | null>(0);
  const [bStep, setBStep] = useState(0);
  const [tab, setTab] = useState(0);
  const tabAuto = useRef(true);
  const t = content[lang];
  useReveal();

  useEffect(() => { const id = setInterval(() => setBStep((s) => (s + 1) % 4), 3600); return () => clearInterval(id); }, []);
  useEffect(() => { const id = setInterval(() => { if (tabAuto.current) setTab((s) => (s + 1) % 5); }, 5000); return () => clearInterval(id); }, []);

  useEffect(() => {
    if (document.getElementById('am-widget')) return;
    (window as any).AUTOMORAI_PAGE_ID  = 'automorai_support';
    (window as any).AUTOMORAI_BUSINESS = 'Automorai Support';
    (window as any).AUTOMORAI_COLOR    = '#0f766e';
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

  const font = { fontFamily: "'Hind Siliguri', 'Inter', system-ui, sans-serif" };
  const cur = t.tabs[tab];

  const screen = (k: string) => {
    if (k === "products") return <img src="/showcase/shop-products.jpg" alt="" className="w-full h-full object-cover object-top" />;
    if (k === "page") return <img src="/showcase/shop-buy.jpg" alt="" className="w-full h-full object-cover object-top" />;
    if (k === "checkout") return (
      <div className="h-full bg-slate-50 text-slate-800 p-4 text-[13px] space-y-2.5">
        <div className="font-bold text-base text-slate-900">{t.checkoutMock.title}</div>
        <div className="flex gap-3 items-center bg-white rounded-xl p-2.5 border border-slate-100"><img src="/showcase/product-frock.jpg" alt="" className="w-12 h-12 rounded-lg object-cover" /><div><div className="font-semibold">Party Frock</div><div className="text-pink-600 font-bold">৳450</div></div></div>
        {[t.checkoutMock.name, t.checkoutMock.phone, t.checkoutMock.addr].map((x) => <div key={x} className="bg-white rounded-lg border border-slate-200 px-3 py-2 text-slate-400">{x}</div>)}
        <div className="grid grid-cols-2 gap-2">{t.checkoutMock.loc.map((x, i) => <div key={x} className={`rounded-lg px-2 py-2 text-center border ${i === 0 ? "border-pink-500 bg-pink-50 text-pink-700 font-semibold" : "border-slate-200 bg-white"}`}>{x}</div>)}</div>
        <div className="space-y-1.5">{t.checkoutMock.pay.map((x, i) => <div key={x} className={`rounded-lg px-3 py-2 border flex items-center gap-2 ${i === 0 ? "border-pink-500 bg-pink-50" : "border-slate-200 bg-white"}`}><span className={`w-3.5 h-3.5 rounded-full border-2 ${i === 0 ? "border-pink-600 bg-pink-600" : "border-slate-300"}`} />{x}</div>)}</div>
        <div className="flex justify-between font-bold text-slate-900 pt-1"><span>{t.checkoutMock.total}</span><span>৳510</span></div>
        <div className="rounded-full bg-pink-600 text-white text-center py-2.5 font-semibold">{t.checkoutMock.btn}</div>
      </div>
    );
    if (k === "chat") return (
      <div className="h-full bg-slate-50 text-slate-800 flex flex-col text-[13px]">
        <div className="bg-pink-600 text-white px-4 py-3 font-semibold">Arisha Fashion World · AI</div>
        <div className="p-3 space-y-3 flex-1">
          <div className="ml-auto max-w-[80%] bg-pink-600 text-white rounded-2xl rounded-tr-sm px-3 py-2">{t.chatMock.q}</div>
          <div className="max-w-[88%] bg-white rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm border border-slate-100">
            {t.chatMock.a}
            <img src="/showcase/product-frock.jpg" alt="" className="mt-2 w-full h-32 object-cover rounded-xl" />
            <div className="flex gap-1.5 mt-2">{["S", "M", "L"].map((s, i) => <span key={s} className={`px-2.5 py-1 rounded-full border text-xs ${i === 1 ? "border-pink-500 text-pink-600" : "border-slate-200"}`}>{s}</span>)}</div>
            <div className="grid grid-cols-2 gap-1.5 mt-2"><span className="rounded-full border border-slate-900 text-center py-1.5 text-xs font-semibold">{t.chatMock.add}</span><span className="rounded-full bg-pink-600 text-white text-center py-1.5 text-xs font-semibold">{t.chatMock.buy}</span></div>
          </div>
        </div>
      </div>
    );
    return (
      <div className="h-full bg-[#0b0d12] text-white p-4 text-[13px]">
        <div className="font-bold text-base mb-3">{t.ordersMock.title}</div>
        <div className="space-y-2">{t.ordersMock.rows.map(([n, p, s]) => (
          <div key={n} className="rounded-xl bg-white/5 border border-white/10 p-3 flex justify-between items-center">
            <div><div className="font-semibold">{n}</div><div className="text-slate-400">{p}</div></div>
            <span className={`text-xs rounded-full px-2.5 py-1 ${s === "Delivered" ? "bg-green-500/20 text-green-300" : s === "Shipped" ? "bg-sky-500/20 text-sky-300" : s === "Confirmed" ? "bg-violet-500/20 text-violet-300" : "bg-amber-500/20 text-amber-300"}`}>{s}</span>
          </div>))}</div>
        <div className="mt-4 rounded-xl bg-green-600 p-3 flex items-center gap-2 am-slide"><WaIcon className="w-5 h-5" />{t.ordersMock.notify}</div>
      </div>
    );
  };

  return (
    <div id="top" className="min-h-screen bg-white text-slate-800 antialiased overflow-x-hidden" style={font}>
      <style>{`
        #top h1,#top h2,#top h3{font-family:'Anek Bangla','Hind Siliguri',system-ui,sans-serif;font-weight:800;letter-spacing:-.015em}
        .am-glow{background:radial-gradient(60% 50% at 85% 10%,rgba(16,185,129,.28),transparent 70%),radial-gradient(50% 40% at 0% 90%,rgba(45,212,191,.16),transparent 70%),#07110e}
        [data-reveal]{opacity:0;transform:translateY(28px);transition:opacity .7s ease,transform .7s cubic-bezier(.2,.7,.2,1)}
        [data-reveal].am-in{opacity:1;transform:none}
        [data-reveal][data-d="1"]{transition-delay:.1s}[data-reveal][data-d="2"]{transition-delay:.2s}[data-reveal][data-d="3"]{transition-delay:.3s}
        @keyframes amFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        .am-float{animation:amFloat 6s ease-in-out infinite}.am-float2{animation:amFloat 7s ease-in-out -2s infinite}
        @keyframes amToast{0%{opacity:0;transform:translateY(14px) scale(.96)}8%,42%{opacity:1;transform:none}50%,100%{opacity:0;transform:translateY(-8px)}}
        .am-toast{animation:amToast 8s ease-in-out infinite}.am-toast2{animation:amToast 8s ease-in-out 4s infinite;opacity:0}
        @keyframes amMarquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        .am-marquee{animation:amMarquee 30s linear infinite}
        @keyframes amPop{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .am-pop{animation:amPop .45s ease both}
        @keyframes amCaret{50%{opacity:0}}.am-caret{animation:amCaret 1s step-end infinite;color:#0f766e;font-weight:400}
        @keyframes amPulse{0%{box-shadow:0 0 0 0 rgba(13,148,136,.45)}100%{box-shadow:0 0 0 22px rgba(13,148,136,0)}}.am-pulse{animation:amPulse 1.6s ease-out infinite}
        @keyframes amSlide{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}.am-slide{animation:amSlide .6s .5s ease both}
        .am-fade{animation:amPop .5s ease both}
        .am-draw{stroke-dasharray:1;stroke-dashoffset:1}.am-in .am-draw{animation:amDraw 2.2s ease-out .3s forwards}@keyframes amDraw{to{stroke-dashoffset:0}}
        .am-area{opacity:0;transition:opacity 1s ease 1.4s}.am-in .am-area{opacity:1}
        .am-lift{transition:transform .25s ease,box-shadow .25s ease}.am-lift:hover{transform:translateY(-4px);box-shadow:0 14px 30px -12px rgba(15,23,42,.25)}
        @media (prefers-reduced-motion: reduce){[data-reveal]{opacity:1;transform:none;transition:none}.am-float,.am-float2,.am-marquee,.am-toast,.am-toast2,.am-pulse,.am-caret{animation:none}.am-draw{stroke-dashoffset:0;animation:none}.am-area{opacity:1}.am-toast2{opacity:1}}
      `}</style>

      {/* Nav */}
      <header className="sticky top-0 z-30 bg-[#07110e]/90 backdrop-blur border-b border-white/10">
        <nav className="max-w-6xl mx-auto flex items-center justify-between gap-2 px-4 sm:px-6 py-3">
          <Link to="/" className="text-[1.4rem] sm:text-2xl font-extrabold tracking-tight text-white whitespace-nowrap">Automorai<span className="text-emerald-400">.</span></Link>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="flex rounded-full border border-white/20 p-0.5 text-xs sm:text-sm">
              <button onClick={() => setLang("bn")} className={`px-2.5 py-1 rounded-full transition ${lang === "bn" ? "bg-white text-slate-900 font-semibold" : "text-slate-300"}`}>বাং</button>
              <button onClick={() => setLang("en")} className={`px-2.5 py-1 rounded-full transition ${lang === "en" ? "bg-white text-slate-900 font-semibold" : "text-slate-300"}`}>EN</button>
            </div>
            <Link to="/login" className="px-1.5 sm:px-3 py-2 text-[15px] font-medium text-slate-200 hover:text-white whitespace-nowrap">{t.nav.login}</Link>
            <Link to="/signup" className="px-3.5 sm:px-5 py-2 rounded-full text-[15px] font-bold bg-emerald-400 text-[#07110e] hover:bg-emerald-300 transition whitespace-nowrap">{t.nav.signup}</Link>
          </div>
        </nav>
      </header>

      {/* Hero — dark, high-contrast (user 2026-11-18: "too light, make it feel heavy/premium like Shopify") */}
      <section className="relative am-glow text-white overflow-hidden">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-20 pb-14 sm:pb-20 grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          <div data-reveal>
            <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-emerald-300 bg-emerald-400/10 border border-emerald-400/30 rounded-full px-3.5 py-1.5 mb-6"><span className="w-2 h-2 rounded-full bg-emerald-400 am-pulse" />{t.badge}</span>
            <h1 className="text-[2.6rem] leading-[1.12] sm:text-[3.8rem] sm:leading-[1.05] text-white mb-4">
              {t.hero1}<br /><span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">{t.hero2}</span>
            </h1>
            <p className="text-[1.3rem] sm:text-2xl font-semibold text-white mb-4">{t.hero3}</p>
            <p className="text-[1.15rem] sm:text-xl text-slate-300 mb-8 max-w-xl leading-relaxed">{t.heroDesc}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/signup" className="text-center px-8 py-4 rounded-full bg-emerald-400 text-[#07110e] font-bold text-[1.2rem] hover:bg-emerald-300 transition shadow-xl shadow-emerald-500/25">{t.ctaMain} →</Link>
              <a href={DEMO_SHOP} target="_blank" rel="noopener noreferrer" className="text-center px-8 py-4 rounded-full border-2 border-white/25 text-white font-bold text-[1.2rem] hover:border-white hover:bg-white/5 transition">{t.ctaDemo} ↗</a>
            </div>
            <a href={waLink(lang === "bn" ? "Automorai সম্পর্কে জানতে চাই" : "I want to know about Automorai")} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-[1.05rem] text-green-400 font-semibold hover:underline"><WaIcon />{t.ctaWa}</a>
          </div>

          {/* devices — phone: one big phone (a tiny desktop screenshot was unreadable on mobile) */}
          <div className="sm:hidden relative flex justify-center pt-2 pb-6" data-reveal data-d="1">
            <span className="absolute left-0 top-0 z-10 text-sm font-semibold bg-white text-slate-700 rounded-full px-3 py-1 shadow">{t.sample}</span>
            <div className="w-[72%] max-w-[270px] am-float2"><Phone className="ring-1 ring-white/15 shadow-emerald-900/50"><img src="/showcase/shop-product-page.jpg" alt={t.sample} className="w-full h-full object-cover object-top" /></Phone></div>
            <div className="absolute right-0 bottom-16 am-toast">
              <div className="flex items-center gap-3 bg-white text-slate-900 rounded-2xl shadow-2xl px-4 py-3"><span className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-lg">🛍️</span><div><div className="font-bold text-[15px]">{t.toastOrder}</div><div className="text-[13px] text-slate-600">{t.toastOrderSub}</div></div></div>
            </div>
            <div className="absolute left-0 bottom-28 am-toast2">
              <div className="flex items-center gap-3 bg-white text-slate-900 rounded-2xl shadow-2xl px-4 py-3"><span className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-lg">💬</span><div><div className="font-bold text-[15px]">{t.toastAi}</div><div className="text-[13px] text-slate-600">{t.toastAiSub}</div></div></div>
            </div>
          </div>
          <div className="hidden sm:block relative h-[470px]" data-reveal data-d="1">
            <div className="absolute right-0 top-4 w-[92%] am-float">
              <div className="rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
                <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 border-b border-slate-200"><span className="w-2.5 h-2.5 rounded-full bg-red-300" /><span className="w-2.5 h-2.5 rounded-full bg-amber-300" /><span className="w-2.5 h-2.5 rounded-full bg-green-300" /><span className="ml-3 flex-1 text-[11px] text-slate-400 bg-white rounded px-2 py-0.5 truncate">arisha-fashion-world.workers.dev</span></div>
                <img src="/showcase/shop-desktop.jpg" alt={t.sample} className="w-full block" />
              </div>
            </div>
            <div className="absolute left-0 bottom-0 w-[38%] max-w-[190px] am-float2"><Phone><img src="/showcase/shop-product-page.jpg" alt="" className="w-full h-full object-cover object-top" /></Phone></div>
            <div className="absolute right-2 bottom-14 sm:bottom-20 am-toast">
              <div className="flex items-center gap-3 bg-white rounded-2xl shadow-xl border border-slate-100 px-4 py-3"><span className="w-9 h-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center">🛍️</span><div><div className="font-semibold text-slate-900 text-sm">{t.toastOrder}</div><div className="text-xs text-slate-500">{t.toastOrderSub}</div></div></div>
            </div>
            <div className="absolute right-2 bottom-14 sm:bottom-20 am-toast2">
              <div className="flex items-center gap-3 bg-white rounded-2xl shadow-xl border border-slate-100 px-4 py-3"><span className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center">💬</span><div><div className="font-semibold text-slate-900 text-sm">{t.toastAi}</div><div className="text-xs text-slate-500">{t.toastAiSub}</div></div></div>
            </div>
            <span className="absolute left-2 top-0 text-xs font-medium bg-white border border-slate-200 text-slate-500 rounded-full px-2.5 py-1 shadow-sm">{t.sample}</span>
          </div>
        </div>
      </section>

      {/* Niches marquee */}
      <section className="border-b border-slate-200 bg-[#f3f7f5] py-6 overflow-hidden">
        <div className="text-center text-[15px] font-semibold text-slate-700 mb-4">{t.nicheTitle}</div>
        <div className="flex w-max am-marquee gap-3">
          {[...t.niches, ...t.niches].map((n, i) => <span key={i} className="whitespace-nowrap rounded-full bg-white border border-slate-300 px-5 py-2.5 text-[1.05rem] font-semibold text-slate-800 shadow-sm">{n}</span>)}
        </div>
      </section>

      {/* Builder */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-10 sm:mb-14" data-reveal>
          <h2 className="text-[2.2rem] leading-tight sm:text-5xl text-slate-950 mb-3">{t.buildTitle}</h2>
          <p className="text-[1.15rem] sm:text-xl text-slate-700">{t.buildDesc}</p>
        </div>
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <ol className="space-y-3" data-reveal>
            {t.buildSteps.map((s, i) => (
              <li key={s.t}>
                <button onClick={() => setBStep(i)} className={`w-full text-left flex gap-4 rounded-2xl p-4 sm:p-5 transition border-2 ${bStep === i ? "bg-emerald-50 border-emerald-500 shadow-md" : "border-transparent hover:bg-slate-50"}`}>
                  <span className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-lg font-bold transition ${bStep === i ? "bg-[#07110e] text-emerald-300" : "bg-slate-200 text-slate-700"}`}>{lang === "bn" ? "১২৩৪"[i] : i + 1}</span>
                  <span><span className="block font-bold text-[1.25rem] text-slate-950">{s.t}</span><span className="block text-[1.05rem] text-slate-700">{s.d}</span>
                    {bStep === i && <span className="block mt-2 h-1 rounded-full bg-teal-200 overflow-hidden"><span key={`${i}-${bStep}`} className="block h-full bg-teal-600" style={{ animation: "amBar 3.6s linear both" }} /></span>}
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <div data-reveal data-d="1"><BuilderDemo step={bStep} b={t.builder} /><p className="text-center text-xs text-slate-400 mt-3">{t.example}</p></div>
        </div>
        <style>{`@keyframes amBar{from{width:0}to{width:100%}}`}</style>
      </section>

      {/* Showcase tabs */}
      <section className="am-glow text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center mb-8 sm:mb-10" data-reveal>
            <h2 className="text-[2.2rem] leading-tight sm:text-5xl mb-3">{t.showTitle}</h2>
            <p className="text-[1.15rem] sm:text-xl text-slate-300">{t.showDesc}</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-8 sm:mb-10 -mx-4 px-4 justify-start md:justify-center" data-reveal>
            {t.tabs.map((x, i) => (
              <button key={x.k} onClick={() => { tabAuto.current = false; setTab(i); }}
                className={`whitespace-nowrap rounded-full px-5 py-2.5 text-[1.05rem] font-semibold transition ${tab === i ? "bg-emerald-400 text-[#07110e]" : "bg-white/10 text-slate-200 hover:bg-white/20"}`}>{x.t}</button>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div key={`txt-${tab}-${lang}`} className="am-fade order-2 md:order-1">
              <h3 className="text-[1.9rem] sm:text-4xl mb-3">{cur.t}</h3>
              <p className="text-[1.15rem] sm:text-xl text-slate-300 mb-6 leading-relaxed">{cur.d}</p>
              <ul className="space-y-3">{cur.pts.map((p) => <li key={p} className="flex gap-3 text-[1.1rem] text-white"><Check c="text-emerald-400" />{p}</li>)}</ul>
              {(cur.k === "products" || cur.k === "page") && <a href={DEMO_SHOP} target="_blank" rel="noopener noreferrer" className="inline-block mt-7 rounded-full bg-white text-slate-950 px-7 py-3.5 text-[1.05rem] font-bold hover:bg-emerald-50 transition">{t.ctaDemo} ↗</a>}
              {(cur.k === "checkout" || cur.k === "chat" || cur.k === "orders") && <p className="mt-6 text-sm text-slate-400">{t.example}</p>}
            </div>
            <div className="order-1 md:order-2 flex justify-center">
              <div className="w-[280px] sm:w-[300px]"><Phone className="ring-1 ring-white/15"><div key={`scr-${tab}-${lang}`} className="am-fade h-full">{screen(cur.k)}</div></Phone></div>
            </div>
          </div>
        </div>
      </section>

      {/* Growth / Sales Report — the feature is real (Dashboard → Sales Report); numbers below are a labelled example */}
      <section className="bg-[#f3f7f5] border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div data-reveal>
            <span className="inline-block text-[15px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 rounded-full px-3.5 py-1 mb-5">{t.growth.tag}</span>
            <h2 className="text-[2.2rem] leading-tight sm:text-5xl text-slate-950 mb-4">{t.growth.title}</h2>
            <p className="text-[1.15rem] sm:text-xl text-slate-700 mb-6 leading-relaxed">{t.growth.desc}</p>
            <ul className="space-y-3">{t.growth.pts.map((p) => <li key={p} className="flex gap-3 text-[1.1rem] font-semibold text-slate-900"><Check c="text-emerald-600" />{p}</li>)}</ul>
          </div>
          <div data-reveal data-d="1">
            <div className="rounded-3xl bg-[#07110e] text-white p-4 sm:p-6 shadow-2xl shadow-slate-900/30 ring-1 ring-emerald-400/20">
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
                {t.growth.kpi.map(([k, v, c]) => (
                  <div key={k} className="rounded-2xl bg-white/5 border border-white/10 p-3">
                    <div className="text-[13px] text-slate-400">{k}</div>
                    <div className="text-[1.25rem] sm:text-2xl font-extrabold leading-tight">{v}</div>
                    <div className="text-[13px] font-bold text-emerald-400">{c}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-3 sm:p-4 mb-4">
                <div className="text-[14px] text-slate-300 mb-2">{t.growth.chart}</div>
                <svg viewBox="0 0 300 110" className="w-full h-auto" aria-hidden="true">
                  <defs><linearGradient id="amG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#34d399" stopOpacity=".45" /><stop offset="100%" stopColor="#34d399" stopOpacity="0" /></linearGradient></defs>
                  {[25, 55, 85].map((y) => <line key={y} x1="0" x2="300" y1={y} y2={y} stroke="rgba(255,255,255,.08)" />)}
                  <path className="am-area" d="M0,92 C20,88 30,80 45,82 S70,70 85,72 S110,78 125,64 S150,50 165,56 S190,44 205,40 S230,46 245,30 S272,18 292,12 L292,110 L0,110 Z" fill="url(#amG)" />
                  <path className="am-draw" d="M0,92 C20,88 30,80 45,82 S70,70 85,72 S110,78 125,64 S150,50 165,56 S190,44 205,40 S230,46 245,30 S272,18 292,12" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" pathLength={1} />
                  <circle cx="292" cy="12" r="4" fill="#34d399" className="am-pulse" />
                </svg>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-3 sm:p-4">
                <div className="text-[14px] text-slate-300 mb-2">{t.growth.top}</div>
                {t.growth.topRows.map(([n, v], i) => (
                  <div key={n} className="mb-2 last:mb-0">
                    <div className="flex justify-between text-[15px] mb-1"><span>{n}</span><span className="font-bold">{v}</span></div>
                    <div className="h-1.5 rounded bg-white/10"><div className="h-full rounded bg-emerald-400" style={{ width: `${[100, 78, 60][i]}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-center text-sm text-slate-500 mt-3">{t.example}</p>
          </div>
        </div>
      </section>

      {/* AI reply */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid lg:grid-cols-2 gap-12 items-center">
        <div data-reveal>
          <h2 className="text-[2.2rem] leading-tight sm:text-5xl text-slate-950 mb-4">{t.replyTitle}</h2>
          <p className="text-[1.15rem] sm:text-xl text-slate-700 mb-6 leading-relaxed">{t.replyDesc}</p>
          <div className="grid sm:grid-cols-2 gap-3">{t.replyPts.map((p) => <div key={p} className="flex gap-2.5 rounded-xl bg-white border border-slate-300 shadow-sm px-4 py-3.5 text-[1.05rem] font-semibold text-slate-900"><Check c="text-emerald-600" />{p}</div>)}</div>
        </div>
        <div className="flex justify-center" data-reveal data-d="1">
          <div className="w-full max-w-[330px] rounded-[2.2rem] bg-slate-900 p-3 shadow-2xl">
            <div className="rounded-[1.7rem] bg-[#efeae2] overflow-hidden">
              <div className="bg-teal-800 text-white px-4 py-3 flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold">A</div><div className="leading-tight"><div className="font-semibold text-sm">{t.mock.shop}</div><div className="text-xs text-teal-100">{t.mock.online}</div></div></div>
              <div className="px-3 py-4 space-y-3 text-[0.92rem] min-h-[330px]">
                {[[t.mock.q1, 0], [t.mock.a1, 1], [t.mock.q2, 0], [t.mock.a2, 1]].map(([m, ai], i) => (
                  <div key={i} data-reveal data-d={String(i)} className={ai ? "max-w-[88%] bg-white rounded-xl rounded-tl-sm px-3 py-2 shadow-sm" : "ml-auto max-w-[85%] bg-[#d9fdd3] rounded-xl rounded-tr-sm px-3 py-2 shadow-sm"}>{m}<div className="text-[10px] text-slate-500 text-right mt-1">{t.mock.time}</div></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* After-the-sale automation — every card is a live feature (Woo connect, courier phone-check, Steadfast booking,
          abandoned-cart email/WA, owner alerts, Pixel/GA4/GTM) as of 2026-11-21 */}
      <section className="bg-[#0b1530] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-3xl mb-10" data-reveal>
            <span className="inline-block text-[15px] font-bold text-sky-200 bg-sky-500/15 border border-sky-400/30 rounded-full px-3.5 py-1 mb-5">{t.auto.tag}</span>
            <h2 className="text-[2.2rem] leading-tight sm:text-5xl mb-4">{t.auto.title}</h2>
            <p className="text-[1.15rem] sm:text-xl text-slate-300 leading-relaxed">{t.auto.desc}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {t.auto.cards.map((c, i) => (
              <div key={c.t} data-reveal data-d={String(i % 3)} className="rounded-2xl bg-white/[0.06] border border-white/10 p-5">
                <div className="text-3xl mb-3">{c.i}</div>
                <div className="font-bold text-[1.15rem] mb-1.5">{c.t}</div>
                <div className="text-slate-300 text-[1rem] leading-relaxed">{c.d}</div>
              </div>
            ))}
          </div>
          <div className="mt-10" data-reveal>
            <Link to="/signup" className="inline-block bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-lg rounded-xl px-6 py-3.5">{t.auto.cta}</Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-[#f3f7f5] border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center mb-12" data-reveal>
            <h2 className="text-[2.2rem] leading-tight sm:text-5xl text-slate-950 mb-3">{t.priceTitle}</h2>
            <p className="text-[1.15rem] text-slate-700">{t.priceDesc}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {t.plans.map((p, i) => (
              <div key={p.key} data-reveal data-d={String(i)} className={`am-lift relative flex flex-col rounded-3xl p-6 sm:p-7 ${p.popular ? "bg-[#07110e] text-white shadow-2xl shadow-emerald-900/30 ring-2 ring-emerald-400" : "bg-white border border-slate-300 shadow-sm"}`}>
                {p.popular && <span className="absolute -top-3.5 left-6 text-sm font-bold bg-emerald-400 text-[#07110e] rounded-full px-3.5 py-1">{t.popular}</span>}
                {p.soon && <span className="absolute -top-3.5 left-6 text-sm font-bold bg-amber-200 text-amber-900 rounded-full px-3.5 py-1">{t.soon}</span>}
                <h3 className={`text-[1.6rem] ${p.popular ? "text-white" : "text-slate-950"}`}>{p.name}</h3>
                <p className={`text-[1.02rem] mb-4 ${p.popular ? "text-slate-300" : "text-slate-600"}`}>{p.desc}</p>
                <div className="mb-6"><span className={`text-5xl font-extrabold ${p.popular ? "text-white" : "text-slate-950"}`}>{p.price}</span><span className={`text-lg ${p.popular ? "text-slate-300" : "text-slate-600"}`}>{t.perMonth}</span></div>
                <ul className="space-y-3 mb-7 flex-1">{p.features.map((f) => <li key={f} className={`flex gap-2.5 text-[1.05rem] ${p.popular ? "text-white" : "text-slate-800"}`}><Check c={p.popular ? "text-emerald-400" : "text-emerald-600"} />{f}</li>)}</ul>
                {p.soon ? <span className="block text-center py-3.5 rounded-full bg-slate-100 text-slate-500 text-[1.05rem] font-bold cursor-not-allowed">{p.cta}</span>
                  : p.external ? <a href={p.href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3.5 rounded-full border-2 border-green-600 text-green-700 text-[1.05rem] font-bold hover:bg-green-50 transition"><WaIcon />{p.cta}</a>
                  : <Link to={p.href} className={`block text-center py-3.5 rounded-full text-[1.05rem] font-bold transition ${p.popular ? "bg-emerald-400 text-[#07110e] hover:bg-emerald-300" : "bg-[#07110e] text-white hover:bg-slate-800"}`}>{p.cta} →</Link>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tender — its own brand now (tendermasterbd.com): one slim link only (user 2026-11-17) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <a href="https://tendermasterbd.com" target="_blank" rel="noopener" data-reveal
           className="am-lift flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl bg-slate-900 text-white px-6 py-5">
          <span><span className="font-semibold text-amber-300">{t.footer.tm}</span> <span className="text-slate-300">{lang === "bn" ? "টেন্ডারের কাগজ মিনিটে, প্রতিদিনের নতুন টেন্ডার — আমাদের আলাদা সেবা।" : "Tender documents in minutes and daily new tenders — our separate service."}</span></span>
          <span className="whitespace-nowrap font-semibold text-amber-300">{t.footer.tmLink}</span>
        </a>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
        <h2 className="text-[2.2rem] leading-tight sm:text-5xl text-slate-950 text-center mb-8" data-reveal>{t.faqTitle}</h2>
        <div className="divide-y divide-slate-300 border-y border-slate-300" data-reveal>
          {t.faqs.map((f, i) => (
            <div key={f.q}>
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex justify-between items-center gap-4 py-5 text-left font-bold text-slate-950 text-[1.2rem]">
                {f.q}<span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xl leading-none transition ${open === i ? "rotate-45 bg-[#07110e] text-emerald-300" : "bg-slate-200 text-slate-800"}`}>+</span>
              </button>
              {open === i && <p className="pb-5 text-[1.08rem] leading-relaxed text-slate-700 am-pop">{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div data-reveal className="relative overflow-hidden rounded-3xl am-glow text-white text-center px-6 py-14 sm:py-20 ring-1 ring-emerald-400/30">
          <h2 className="relative text-[2.2rem] leading-tight sm:text-5xl mb-4">{t.finalTitle}</h2>
          <p className="relative text-[1.15rem] text-slate-300 mb-8">{t.finalDesc}</p>
          <div className="relative flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup" className="px-8 py-4 rounded-full bg-emerald-400 text-[#07110e] font-bold text-[1.2rem] hover:bg-emerald-300 transition shadow-xl shadow-emerald-500/25">{t.ctaMain} →</Link>
            <a href={waLink(lang === "bn" ? "Automorai সম্পর্কে জানতে চাই" : "I want to know about Automorai")} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-green-600 text-white font-bold text-[1.2rem] hover:bg-green-500 transition"><WaIcon />{t.ctaWa}</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#07110e] text-slate-300 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-8">
          <div className="grid gap-10 grid-cols-2 lg:grid-cols-12">
            <div className="col-span-2 lg:col-span-4">
              <div className="text-2xl font-bold text-white">Automorai<span className="text-teal-400">.</span></div>
              <p className="mt-1 text-teal-300 font-medium">{t.footer.tag}</p>
              <p className="mt-3 text-base text-slate-300 max-w-sm">{t.footer.desc}</p>
              <a href={waLink(lang === "bn" ? "Automorai সম্পর্কে জানতে চাই" : "I want to know about Automorai")} target="_blank" rel="noopener noreferrer"
                 className="mt-5 inline-flex items-center gap-2 rounded-full bg-green-600 px-5 py-2.5 font-semibold text-white hover:bg-green-500 transition"><WaIcon />{t.footer.waCta}</a>
            </div>
            <div className="lg:col-span-2">
              <div className="font-semibold text-white mb-3">{t.footer.product}</div>
              <ul className="space-y-2.5 text-base">
                <li><a href="#top" className="hover:text-white">{t.footer.shop}</a></li>
                <li><a href="#pricing" className="hover:text-white">{t.footer.pricing}</a></li>
                <li><a href={DEMO_SHOP} target="_blank" rel="noopener noreferrer" className="hover:text-white">{t.footer.demo} ↗</a></li>
              </ul>
            </div>
            <div className="lg:col-span-2">
              <div className="font-semibold text-white mb-3">{t.footer.company}</div>
              <ul className="space-y-2.5 text-base">
                <li><Link to="/signup" className="hover:text-white">{t.footer.signup}</Link></li>
                <li><Link to="/login" className="hover:text-white">{t.footer.login}</Link></li>
                <li><Link to="/privacy" className="hover:text-white">{t.footer.privacy}</Link></li>
              </ul>
            </div>
            <div className="col-span-2 lg:col-span-4">
              <div className="font-semibold text-white mb-3">{t.footer.contact}</div>
              <ul className="space-y-2.5 text-base">
                <li><a href={waLink("Hi Automorai")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-white"><WaIcon className="w-4 h-4" /> 01615-763484</a></li>
                <li><a href="mailto:info@automorai.com" className="hover:text-white">info@automorai.com</a></li>
              </ul>
              <div className="font-semibold text-white mt-6 mb-3">{t.footer.pay}</div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-md bg-[#e2136e] text-white px-3 py-1.5">bKash</span>
                <span className="rounded-md bg-[#f6921e] text-white px-3 py-1.5">Nagad</span>
                <span className="rounded-md bg-slate-800 text-slate-200 px-3 py-1.5">{lang === "bn" ? "ক্যাশ অন ডেলিভারি" : "Cash on delivery"}</span>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row gap-3 justify-between text-xs text-slate-500">
            <span>{t.footer.copy}</span>
            <a href="https://tendermasterbd.com" target="_blank" rel="noopener" className="hover:text-slate-300">{t.footer.tm} {t.footer.tmLink}</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

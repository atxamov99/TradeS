import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  CheckCircle, 
  Cpu, 
  Layers, 
  BarChart3, 
  ShoppingBag, 
  Sparkles, 
  Activity, 
  Globe, 
  ChevronDown,
  User,
  Shield,
  Zap,
  Smartphone
} from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../store/authStore';

const translations = {
  uz: {
    tag: "🚀 Savdo va POS tizimida yangi davr",
    heroTitle: "Savdoni osonlashtiring, biznesingizni o'stiring",
    heroSubtitle: "Sotuvlar, ombor qoldig'i, mijozlar tahlili va Gemini AI yordamchisi — barchasi bitta zamonaviy platformada.",
    btnStart: "Bepul boshlash",
    btnDemo: "Tizimga kirish",
    dashboard: "Kabinetga o'tish",
    features: "Imkoniyatlar",
    stats: "Statistika",
    faq: "Ko'p so'raladigan savollar",
    feature1Title: "Offline-First POS",
    feature1Desc: "Internet o'chib qolganda ham savdoni to'xtatmang. Tizim avtomatik ravishda ma'lumotlarni sinxronizatsiya qiladi.",
    feature2Title: "AI Savdo Yordamchisi",
    feature2Desc: "Gemini AI orqali savdolaringizni tahlil qiling, kelgusi tendensiyalarni oldindan bilib oling va tavsiyalar oling.",
    feature3Title: "Ombor Nazorati",
    feature3Desc: "Mahsulotlar partiyasi, qolgan tovarlar va tan narxlarni hisoblash tizimini to'liq nazorat qiling.",
    feature4Title: "Kengaytirilgan Tahlil",
    feature4Desc: "Vizual grafiklar va hisobotlar yordamida har bir sotuv, foyda va zarar ko'rsatkichlarini kuzatib boring.",
    stat1: "Faol foydalanuvchilar",
    stat2: "Amalga oshirilgan sotuvlar",
    stat3: "Tizim ishlash kafolati",
    faq1Q: "Tizimdan foydalanish bepulmi?",
    faq1A: "Ha, ro'yxatdan o'tish mutlaqo bepul. Boshlang'ich funksiyalardan bemalol foydalanishingiz mumkin.",
    faq2Q: "Internet o'chib qolsa tizim ishlaydimi?",
    faq2A: "Albatta! POS moduli to'liq offline ishlaydi va internet ulanganda ma'lumotlar serverga sinxronlanadi.",
    faq3Q: "Ma'lumotlar xavfsizligi qanday ta'minlanadi?",
    faq3A: "Barcha ma'lumotlar zamonaviy SSL protokollari va xavfsiz PostgreSQL bazasida shifrlangan holda saqlanadi.",
    ctaTitle: "Biznesingizni bugundan boshlab raqamlashtiring",
    ctaSubtitle: "Bir necha soniya ichida ro'yxatdan o'ting va savdolaringizni nazorat qilishni boshlang.",
    copyright: "Barcha huquqlar himoyalangan."
  },
  ru: {
    tag: "🚀 Новая эра продаж и POS-систем",
    heroTitle: "Упрощайте продажи, развивайте бизнес",
    heroSubtitle: "Продажи, складской учет, аналитика клиентов и помощник Gemini AI — всё на одной современной платформе.",
    btnStart: "Начать бесплатно",
    btnDemo: "Войти в систему",
    dashboard: "В личный кабинет",
    features: "Возможности",
    stats: "Статистика",
    faq: "Частые вопросы",
    feature1Title: "Offline-First POS",
    feature1Desc: "Не останавливайте продажи при сбое интернета. Система автоматически синхронизирует данные при подключении.",
    feature2Title: "ИИ-помощник продаж",
    feature2Desc: "Анализируйте продажи с помощью Gemini AI, прогнозируйте будущие тенденции и получайте ценные советы.",
    feature3Title: "Контроль склада",
    feature3Desc: "Полный контроль над партиями товаров, остатками на складе и расчетом себестоимости.",
    feature4Title: "Глубокая аналитика",
    feature4Desc: "Отслеживайте продажи, прибыль и убытки с помощью удобных визуальных графиков и отчетов.",
    stat1: "Активных пользователей",
    stat2: "Совершенных продаж",
    stat3: "Гарантия аптайма",
    faq1Q: "Система бесплатна для использования?",
    faq1A: "Да, регистрация абсолютно бесплатна. Вы можете свободно использовать базовый функционал платформы.",
    faq2Q: "Будет ли система работать без интернета?",
    faq2A: "Конечно! Модуль POS полностью поддерживает оффлайн-режим, отправляя данные на сервер при появлении сети.",
    faq3Q: "Как обеспечивается безопасность данных?",
    faq3A: "Все данные передаются через шифрованные каналы SSL и безопасно хранятся в базе данных PostgreSQL.",
    ctaTitle: "Оцифруйте свой бизнес уже сегодня",
    ctaSubtitle: "Зарегистрируйтесь за несколько секунд и начните контролировать свои продажи.",
    copyright: "Все права защищены."
  },
  en: {
    tag: "🚀 A New Era in Sales and POS Systems",
    heroTitle: "Simplify Sales, Grow Your Business",
    heroSubtitle: "Sales, inventory tracking, customer analytics, and Gemini AI assistant — all on one modern platform.",
    btnStart: "Start for Free",
    btnDemo: "Login",
    dashboard: "Go to Dashboard",
    features: "Features",
    stats: "Statistics",
    faq: "FAQ",
    feature1Title: "Offline-First POS",
    feature1Desc: "Keep selling even when the internet goes down. The system automatically syncs data once reconnected.",
    feature2Title: "AI Sales Assistant",
    feature2Desc: "Analyze sales using Gemini AI, predict upcoming trends, and receive smart business recommendations.",
    feature3Title: "Inventory Control",
    feature3Desc: "Fully manage inventory batches, stock levels, and cost price calculations with ease.",
    feature4Title: "Advanced Analytics",
    feature4Desc: "Monitor sales, profits, and losses using visual charts and detailed reports.",
    stat1: "Active users",
    stat2: "Completed sales",
    stat3: "System uptime guarantee",
    faq1Q: "Is it free to use?",
    faq1A: "Yes, registration is completely free. You can use all core features without any charge.",
    faq2Q: "Does it work without internet?",
    faq2A: "Absolutely! The POS module works fully offline and syncs data to the server when connection is restored.",
    faq3Q: "How is data security ensured?",
    faq3A: "All your data is encrypted in transit via SSL and securely stored in our PostgreSQL database.",
    ctaTitle: "Digitize your business starting today",
    ctaSubtitle: "Register in just a few seconds and take control of your sales.",
    copyright: "All rights reserved."
  }
};

export default function Landing() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [langOpen, setLangOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  const currentLang = i18n.language || 'uz';
  const t = (key) => translations[currentLang]?.[key] || translations['uz']?.[key] || key;

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    setLangOpen(false);
  };

  const faqs = [
    { q: t('faq1Q'), a: t('faq1A') },
    { q: t('faq2Q'), a: t('faq2A') },
    { q: t('faq3Q'), a: t('faq3A') }
  ];

  return (
    <div className="min-h-screen bg-[#0E150F] text-slate-100 font-sans selection:bg-[#2ECC71] selection:text-slate-950 overflow-x-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[20%] w-[40%] h-[60%] rounded-full bg-[#2ECC71]/10 blur-[120px]" />
        <div className="absolute top-[5%] right-[20%] w-[35%] h-[50%] rounded-full bg-[#1ABC9C]/10 blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#0E150F]/80 border-b border-[#2ECC71]/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2ECC71] to-[#1ABC9C] flex items-center justify-center shadow-lg shadow-[#2ECC71]/20">
              <ShoppingBag className="w-5 h-5 text-slate-950" />
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              TradeS
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">{t('features')}</a>
            <a href="#stats" className="hover:text-white transition-colors">{t('stats')}</a>
            <a href="#faq" className="hover:text-white transition-colors">{t('faq')}</a>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="relative">
              <button 
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-950/40 hover:border-[#2ECC71]/30 bg-[#0E150F]/50 text-xs font-semibold text-slate-300 hover:text-white transition-all"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="uppercase">{currentLang}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </button>

              {langOpen && (
                <div className="absolute right-0 mt-2 w-28 rounded-xl border border-emerald-950/40 bg-[#0E150F] shadow-xl overflow-hidden py-1 z-50">
                  {['uz', 'ru', 'en'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleLanguageChange(lang)}
                      className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-[#1ABC9C]/10 text-slate-400 hover:text-white transition-all uppercase"
                    >
                      {lang === 'uz' ? 'O‘zbekcha' : lang === 'ru' ? 'Русский' : 'English'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auth CTA */}
            {accessToken ? (
              <Link 
                to="/dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#2ECC71] to-[#1ABC9C] hover:from-[#2ecc71]/95 hover:to-[#1abc9c]/95 text-slate-950 shadow-lg shadow-[#2ECC71]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {t('dashboard')}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  to="/login"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all"
                >
                  {t('btnDemo')}
                </Link>
                <Link 
                  to="/register"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2ECC71] hover:bg-[#2ecc71]/90 text-slate-950 shadow-md shadow-[#2ECC71]/10 transition-all hover:scale-[1.02]"
                >
                  {t('btnStart')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#2ECC71]/30 bg-[#2ECC71]/5 text-xs font-bold text-[#2ECC71] mb-6"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {t('tag')}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 max-w-4xl mx-auto leading-[1.15]"
        >
          {t('heroTitle').split(',')[0]}, <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#2ECC71] via-[#1ABC9C] to-[#3498DB]">
            {t('heroTitle').split(',')[1] || ''}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          {t('heroSubtitle')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-20"
        >
          {accessToken ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-bold bg-gradient-to-r from-[#2ECC71] to-[#1ABC9C] hover:from-[#2ecc71]/90 hover:to-[#1abc9c]/90 text-slate-950 shadow-xl shadow-[#2ECC71]/25 transition-all hover:scale-[1.03]"
            >
              {t('dashboard')}
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-bold bg-[#2ECC71] hover:bg-[#2ecc71]/90 text-slate-950 shadow-xl shadow-[#2ECC71]/20 transition-all hover:scale-[1.03]"
              >
                {t('btnStart')}
                <ArrowRight className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold border border-emerald-950/40 hover:border-[#2ECC71]/20 bg-[#0E150F]/40 text-slate-300 hover:text-white transition-all"
              >
                {t('btnDemo')}
              </button>
            </>
          )}
        </motion.div>

        {/* Floating Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative max-w-5xl mx-auto rounded-2xl border border-[#2ECC71]/10 bg-[#1ABC9C]/5 p-4 shadow-2xl backdrop-blur-sm"
        >
          <div className="absolute inset-0 bg-[#2ECC71]/5 rounded-2xl blur-xl -z-10" />
          <div className="rounded-xl border border-[#2ECC71]/10 bg-[#0E150F] overflow-hidden shadow-2xl">
            {/* Mock header */}
            <div className="h-12 border-b border-[#2ECC71]/10 bg-[#0E150F] px-4 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/25" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/25" />
                <span className="w-3 h-3 rounded-full bg-green-500/25" />
                <span className="ml-4 font-semibold text-slate-400">savdo-pos-dashboard.app</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-full bg-[#2ECC71]/10 text-[#2ECC71] font-bold flex items-center gap-1">
                  <Activity className="w-3 h-3 animate-pulse" /> Live
                </span>
              </div>
            </div>

            {/* Mock dashboard content */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
              {/* Analytics Summary */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-[#2ECC71]/10 bg-[#1ABC9C]/5">
                    <div className="text-slate-500 text-xs font-semibold mb-1">Bugungi Savdolar</div>
                    <div className="text-xl font-bold text-white">4,850,000 UZS</div>
                    <div className="text-[10px] text-[#2ECC71] mt-2 flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5" /> +12.5% kechagiga nisbatan
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-[#2ECC71]/10 bg-[#1ABC9C]/5">
                    <div className="text-slate-500 text-xs font-semibold mb-1">Mijozlar Soni</div>
                    <div className="text-xl font-bold text-white">128 ta</div>
                    <div className="text-[10px] text-[#2ECC71] mt-2 flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5" /> +8.3% yangi mijozlar
                    </div>
                  </div>
                </div>

                {/* Mock Chart representation */}
                <div className="p-4 rounded-xl border border-[#2ECC71]/10 bg-[#1ABC9C]/5 h-48 flex flex-col justify-between">
                  <div className="text-slate-400 text-xs font-bold">Haftalik Savdo Grafigi</div>
                  <div className="flex items-end justify-between h-28 px-4 pb-2">
                    {[40, 65, 50, 85, 60, 95, 75].map((height, i) => (
                      <div key={i} className="w-[10%] bg-[#2ECC71]/20 hover:bg-[#2ECC71]/40 rounded-t transition-all relative group" style={{ height: `${height}%` }}>
                        <div className="absolute inset-x-0 bottom-0 bg-[#2ECC71] rounded-t" style={{ height: '25%' }} />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-semibold px-2">
                    <span>Dush</span><span>Sesh</span><span>Chor</span><span>Pay</span><span>Jum</span><span>Shan</span><span>Yak</span>
                  </div>
                </div>
              </div>

              {/* Sidebar Quick sales */}
              <div className="p-4 rounded-xl border border-[#2ECC71]/10 bg-[#1ABC9C]/5 space-y-4">
                <div className="text-slate-400 text-xs font-bold flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#2ECC71]" /> AI Sotuv Tahlili
                </div>
                <div className="p-3 rounded-lg bg-[#2ECC71]/5 border border-[#2ECC71]/10 text-xs text-[#2ECC71]/90 leading-relaxed">
                  "Ushbu haftada oziq-ovqat toifalari sotuvi 15% ga oshdi. AI tavsiyasi: Sut mahsulotlari buyurtmalarini ko'paytiring."
                </div>
                <div className="space-y-2.5">
                  <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Oxirgi Sotuvlar</div>
                  {[
                    { label: "Neksiya Shina", price: "450,000 UZS", time: "10 min oldin" },
                    { label: "Coca-Cola 1.5L", price: "12,000 UZS", time: "15 min oldin" },
                    { label: "Kungaboqar yog'i", price: "24,000 UZS", time: "22 min oldin" }
                  ].map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-900/50 last:border-0">
                      <div>
                        <div className="font-semibold text-slate-300">{item.label}</div>
                        <div className="text-[10px] text-slate-500">{item.time}</div>
                      </div>
                      <span className="font-bold text-white">{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 border-t border-[#2ECC71]/10 bg-[#0E150F] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Biznesingizni to'liq raqamlashtirish uchun hamma narsa tayyor
            </h2>
            <p className="text-slate-400 text-lg">
              Kichik do'konlardan tortib yirik savdo tarmoqlarigacha to'g'ri keluvchi moslashuvchan funksiyalar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl border border-[#2ECC71]/10 hover:border-[#2ECC71]/20 bg-[#1ABC9C]/5 hover:bg-[#1ABC9C]/10 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#2ECC71]/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Smartphone className="w-6 h-6 text-[#2ECC71]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{t('feature1Title')}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{t('feature1Desc')}</p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl border border-[#2ECC71]/10 hover:border-[#2ECC71]/20 bg-[#1ABC9C]/5 hover:bg-[#1ABC9C]/10 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#1ABC9C]/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-[#1ABC9C]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{t('feature2Title')}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{t('feature2Desc')}</p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl border border-[#2ECC71]/10 hover:border-[#2ECC71]/20 bg-[#1ABC9C]/5 hover:bg-[#1ABC9C]/10 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#3498DB]/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6 text-[#3498DB]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{t('feature3Title')}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{t('feature3Desc')}</p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl border border-[#2ECC71]/10 hover:border-[#2ECC71]/20 bg-[#1ABC9C]/5 hover:bg-[#1ABC9C]/10 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#2ECC71]/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-[#2ECC71]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{t('feature4Title')}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{t('feature4Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 bg-[#0E150F] border-t border-[#2ECC71]/10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="text-4xl sm:text-5xl font-extrabold text-white mb-2">10k+</div>
              <div className="text-slate-400 text-sm font-semibold uppercase tracking-wider">{t('stat1')}</div>
            </div>
            <div className="p-6">
              <div className="text-4xl sm:text-5xl font-extrabold text-[#1ABC9C] mb-2">1M+</div>
              <div className="text-slate-400 text-sm font-semibold uppercase tracking-wider">{t('stat2')}</div>
            </div>
            <div className="p-6">
              <div className="text-4xl sm:text-5xl font-extrabold text-[#2ECC71] mb-2">99.9%</div>
              <div className="text-slate-400 text-sm font-semibold uppercase tracking-wider">{t('stat3')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 border-t border-[#2ECC71]/10 bg-[#0E150F]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white text-center mb-12">{t('faq')}</h2>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="rounded-2xl border border-[#2ECC71]/10 bg-[#1ABC9C]/5 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="w-full px-6 py-5 text-left font-bold text-white flex justify-between items-center hover:bg-[#1ABC9C]/10 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${activeFaq === index ? 'rotate-180' : ''}`} />
                </button>
                
                {activeFaq === index && (
                  <div className="px-6 pb-5 text-slate-400 text-sm leading-relaxed border-t border-[#2ECC71]/10 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 border-t border-[#2ECC71]/10 bg-gradient-to-b from-[#0E150F] to-[#121B14] relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            {t('ctaTitle')}
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
            {t('ctaSubtitle')}
          </p>
          <div>
            {accessToken ? (
              <Link 
                to="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold bg-gradient-to-r from-[#2ECC71] to-[#1ABC9C] hover:from-[#2ecc71]/90 hover:to-[#1abc9c]/90 text-slate-950 shadow-xl shadow-[#2ECC71]/20 transition-all hover:scale-[1.02]"
              >
                {t('dashboard')}
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <Link 
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold bg-[#2ECC71] hover:bg-[#2ecc71]/90 text-slate-950 shadow-xl shadow-[#2ECC71]/20 transition-all hover:scale-[1.02]"
              >
                {t('btnStart')}
                <ArrowRight className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-[#2ECC71]/10 bg-[#0E150F] text-slate-500 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#2ECC71] flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5 text-slate-950" />
            </div>
            <span className="font-bold text-slate-400">TradeS</span>
          </div>
          <div>
            &copy; {new Date().getFullYear()} TradeS. {t('copyright')}
          </div>
        </div>
      </footer>
    </div>
  );
}

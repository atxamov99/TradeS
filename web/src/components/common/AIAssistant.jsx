import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, X, Send, Sparkles, ShoppingBag, TrendingUp, DollarSign, List, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import * as productsApi from '../../api/products.api';
import * as aiApi from '../../api/ai.api';
import useThemeStore from '../../store/themeStore';

const SUGGESTIONS = (t) => [
    { id: 'cheap', text: t('cheap_products'), icon: <DollarSign size={14} /> },
    { id: 'best', text: t('best_products'), icon: <TrendingUp size={14} /> },
    { id: 'advice', text: t('ai_advice_profit'), icon: <TrendingUp size={14} /> },
    { id: 'categories', text: t('categories'), icon: <List size={14} /> },
];

export default function AIAssistant() {
    const { t, i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: t('ai_welcome'), sender: 'ai' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);
    const { theme } = useThemeStore();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async (text = input) => {
        if (!text.trim()) return;

        const userMsg = { id: Date.now(), text, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await aiApi.askAI(text, i18n.language);
            const aiText = response.data.data;
            setMessages(prev => [...prev, { id: Date.now() + 1, text: aiText, sender: 'ai' }]);
        } catch (error) {
            console.error("AI Error:", error);
            setMessages(prev => [...prev, { id: Date.now() + 1, text: t('ai_unknown'), sender: 'ai' }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="fixed md:bottom-6 bottom-[88px] right-6 z-[60] w-14 h-14 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-lg overflow-hidden group"
            >
                <div className="absolute inset-0 bg-white/10 scale-0 group-hover:scale-100 transition-transform duration-500 rounded-full" />
                {isOpen ? <X size={26} /> : <MessageCircle size={26} />}
            </motion.button>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 100, x: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 100, x: 50 }}
                        className="fixed bottom-24 right-6 z-[60] w-[350px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-8rem)] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-5 bg-primary-600 text-white flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                <Sparkles size={20} className="text-white fill-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg leading-tight">TradeS AI</h3>
                                <div className="flex items-center gap-1.5 opacity-80 decoration-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    <span className="text-[10px] uppercase font-bold tracking-wider">Online</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-xl hover:bg-white/10 transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-slate-50/50 dark:bg-slate-900/50"
                        >
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] p-3.5 rounded-2xl text-sm shadow-sm ${msg.sender === 'user'
                                            ? 'bg-primary-600 text-white rounded-tr-none'
                                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none whitespace-pre-line'
                                            }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3.5 rounded-2xl rounded-tl-none flex gap-1.5 shadow-sm">
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Suggestions */}
                        <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar border-t border-slate-50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50">
                            {SUGGESTIONS(t).map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => handleSend(s.text)}
                                    className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                                >
                                    {s.icon}
                                    {s.text}
                                </button>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="flex items-center gap-2"
                            >
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={t('ai_send_placeholder')}
                                    className="flex-1 h-11 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-white transition"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    className="w-11 h-11 rounded-xl bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 disabled:opacity-50 transition"
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </>
    );
}

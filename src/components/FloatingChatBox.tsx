"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IoClose, IoSend } from "react-icons/io5";
import { Hand, Ticket, Trophy, Calendar, CreditCard, Headset, Mail, MessageCircle, Banknote, User } from "lucide-react";

type Message = {
  id: number;
  text?: React.ReactNode;
  isBot: boolean;
  options?: string[];
  component?: React.ReactNode;
};

function getOptionIcon(opt: string) {
  if (opt === "My Ticket") return <Ticket className="w-4 h-4" />;
  if (opt === "Check Result") return <Trophy className="w-4 h-4" />;
  if (opt === "Draw Information") return <Calendar className="w-4 h-4" />;
  if (opt === "Payment Help") return <CreditCard className="w-4 h-4" />;
  if (opt === "Contact Support") return <Headset className="w-4 h-4" />;
  if (opt === "Email Support") return <Mail className="w-4 h-4" />;
  if (opt === "WhatsApp Support") return <MessageCircle className="w-4 h-4" />;
  if (opt === "Create Support Request") return <Ticket className="w-4 h-4" />;
  return null;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    text: (
      <span className="flex items-center gap-1.5">
        <Hand className="w-4 h-4 text-amber-500" /> Hi! How can we help you?
      </span>
    ),
    isBot: true,
    options: [
      "My Ticket",
      "Check Result",
      "Draw Information",
      "Payment Help",
      "Contact Support",
    ],
  },
];

export function FloatingChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);
  const [chatContext, setChatContext] = useState<"idle" | "awaiting_result_lottery" | "awaiting_draw_lottery">("idle");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleRestart = () => {
    setMessages([{ ...INITIAL_MESSAGES[0], id: Date.now() }]);
    setChatContext("idle");
    setShowConfirmPopup(false);
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isTyping]);

  const addBotMessage = (msg: Omit<Message, 'id' | 'isBot'>, delay = 600) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { ...msg, id: Date.now(), isBot: true }]);
      setIsTyping(false);
    }, delay);
  };

  const addUserMessage = (text: string) => {
    setMessages((prev) => [...prev, { id: Date.now(), text, isBot: false }]);
  };

  const handleOptionClick = async (option: string) => {
    addUserMessage(option);

    if (option === "My Ticket") {
      setIsTyping(true);
      try {
        const authRes = await fetch("/api/auth/me");
        if (!authRes.ok) {
          addBotMessage({ text: "You need to be logged in to view your tickets. Please login to your account to continue." }, 0);
          return;
        }
        const authData = await authRes.json();
        if (!authData.user) {
          addBotMessage({ text: "You need to be logged in to view your tickets. Please login to your account to continue." }, 0);
          return;
        }

        const ticketRes = await fetch("/api/tickets");
        if (ticketRes.ok) {
          const data = await ticketRes.json();
          if (data.tickets && data.tickets.length > 0) {
            const ticketList = (
              <div className="flex flex-col gap-2 mt-2 w-full">
                {data.tickets.slice(0, 5).map((t: any, i: number) => (
                  <div key={i} className="bg-white dark:bg-gray-900 p-2.5 rounded-lg text-xs border border-gray-200 dark:border-gray-700">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{t.drawName}</p>
                    <p className="text-gray-600 dark:text-gray-400 mt-0.5">Ticket: <span className="font-medium text-gray-900 dark:text-gray-200">{t.ticketNumber}</span></p>
                    <div className="flex justify-between items-center mt-1.5">
                      <p className="text-gray-500">{t.drawTime}</p>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
                        t.status === 'booked' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
                {data.tickets.length > 5 && <p className="text-xs text-center text-gray-500 mt-1">+{data.tickets.length - 5} more in your account</p>}
              </div>
            );
            addBotMessage({ text: "Here are your recent tickets:", component: ticketList }, 0);
          } else {
            addBotMessage({ text: "You haven't purchased any tickets yet." }, 0);
          }
        } else {
          addBotMessage({ text: "Sorry, we couldn't fetch your tickets right now." }, 0);
        }
      } catch {
        addBotMessage({ text: "Something went wrong while fetching your tickets." }, 0);
      }
      setIsTyping(false);
      return;
    }

    if (option === "Check Result") {
      setChatContext("awaiting_result_lottery");
      addBotMessage({
        text: "Select Lottery:",
        options: ["Subhlaxmi55", "Subhlaxmi15", "Subhlaxmi12", "Subhlaxmi5", "Dhan Laxmi Bumper"]
      });
      return;
    }

    if (option === "Draw Information") {
      setChatContext("awaiting_draw_lottery");
      addBotMessage({
        text: "Select Lottery for Draw Information:",
        options: ["Subhlaxmi55", "Subhlaxmi15", "Subhlaxmi12", "Subhlaxmi5", "Dhan Laxmi Bumper"]
      });
      return;
    }

    const isLotteryName = ["Subhlaxmi55", "Subhlaxmi15", "Subhlaxmi12", "Subhlaxmi5", "Dhan Laxmi Bumper"].includes(option);

    if (chatContext === "awaiting_result_lottery" && isLotteryName) {
      setChatContext("idle");
      setIsTyping(true);
      try {
        const res = await fetch("/api/results");
        if (res.ok) {
          const data = await res.json();
          const latestResult = data.results.find((r: any) => r.drawName && r.drawName.toLowerCase().includes(option.toLowerCase()));
          if (latestResult) {
            const resultUI = (
              <div className="bg-white dark:bg-gray-900 p-3 rounded-lg mt-2 text-sm border border-gray-200 dark:border-gray-700 shadow-sm w-full">
                <p className="font-bold text-amber-600 dark:text-amber-400 mb-2 border-b border-gray-100 dark:border-gray-800 pb-1">{latestResult.drawName}</p>
                <div className="space-y-2 text-gray-700 dark:text-gray-300">
                  <p className="flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-500 flex-shrink-0" /> <span className="font-semibold">Winning Ticket:</span> {latestResult.winningTicket}</p>
                  <p className="flex items-center gap-2"><Banknote className="w-4 h-4 text-green-500 flex-shrink-0" /> <span className="font-semibold">Prize:</span> {latestResult.prize}</p>
                  {latestResult.winnerName && <p className="flex items-center gap-2"><User className="w-4 h-4 text-blue-500 flex-shrink-0" /> <span className="font-semibold">Winner:</span> {latestResult.winnerName}</p>}
                </div>
                <p className="text-[10px] text-gray-400 mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">Declared: {new Date(latestResult.declaredAt).toLocaleString("en-IN")}</p>
              </div>
            );
            addBotMessage({ text: `Here is the latest result for ${option}:`, component: resultUI }, 0);
          } else {
            addBotMessage({ text: `No recent results found for ${option}.` }, 0);
          }
        }
      } catch {
        addBotMessage({ text: "Failed to fetch results. Please try again later." }, 0);
      }
      setIsTyping(false);
      return;
    }

    if (chatContext === "awaiting_draw_lottery" && isLotteryName) {
      setChatContext("idle");
      setIsTyping(true);
      try {
        const res = await fetch("/api/draws");
        if (res.ok) {
          const data = await res.json();
          const draw = data.draws.find((d: any) => d.name && d.name.toLowerCase().includes(option.toLowerCase()));
          if (draw) {
            const drawUI = (
              <div className="bg-white dark:bg-gray-900 p-3 rounded-lg mt-2 text-sm border border-gray-200 dark:border-gray-700 shadow-sm w-full">
                <p className="font-bold text-amber-600 dark:text-amber-400 mb-2 border-b border-gray-100 dark:border-gray-800 pb-1">{draw.name}</p>
                <div className="grid grid-cols-2 gap-y-2 gap-x-1 text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Ticket Price:</span> <span className="font-medium text-gray-900 dark:text-gray-100">₹{draw.pricePerTicket}</span>
                  <span className="text-gray-500 dark:text-gray-400">Draw Date:</span> <span className="font-medium text-gray-900 dark:text-gray-100">{new Date(draw.drawDate).toLocaleDateString("en-IN")}</span>
                  <span className="text-gray-500 dark:text-gray-400">Draw Time:</span> <span className="font-medium text-gray-900 dark:text-gray-100">{draw.drawTime}</span>
                  <span className="text-gray-500 dark:text-gray-400">First Prize:</span> <span className="font-medium text-gray-900 dark:text-gray-100">{draw.prizeAmount || "N/A"}</span>
                  <span className="text-gray-500 dark:text-gray-400">Total Tickets:</span> <span className="font-medium text-gray-900 dark:text-gray-100">{draw.totalTickets || "0"}</span>
                </div>
              </div>
            );
            addBotMessage({ text: `Here is the draw information for ${option}:`, component: drawUI }, 0);
          } else {
            addBotMessage({ text: `No active draw found right now for ${option}.` }, 0);
          }
        }
      } catch {
        addBotMessage({ text: "Failed to fetch draw information. Please try again later." }, 0);
      }
      setIsTyping(false);
      return;
    }

    if (option === "Payment Help") {
      addBotMessage({ 
        text: "For any payment related issues, please contact our support team. We usually resolve payment issues within 24 hours.",
        options: ["Contact Support"]
      });
      return;
    }

    if (option === "Contact Support") {
      addBotMessage({
        text: "Need more help?",
        options: [
          "Email Support",
          "WhatsApp Support",
          "Create Support Request"
        ]
      });
      return;
    }

    if (option === "Email Support") {
      addBotMessage({ text: "You can reach us at support@subhlaxmi.in" });
      return;
    }

    if (option === "WhatsApp Support") {
      addBotMessage({ text: "You can reach us on WhatsApp at +12236673706. Easy to WhatsApp voice call." });
      return;
    }

    if (option === "Create Support Request") {
      addBotMessage({ text: "Please visit our Contact Us page to create a support ticket." });
      return;
    }

    // Default fallback
    setChatContext("idle");
    addBotMessage({ 
      text: "Thanks for reaching out! Please select an option from the menu:",
      options: [
        "My Ticket",
        "Check Result",
        "Draw Information",
        "Payment Help",
        "Contact Support",
      ]
    });
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    addUserMessage(message);
    setMessage("");
    setChatContext("idle");

    addBotMessage({ 
      text: "Thanks for your message. Currently, I am a bot with limited options. Please select one of the following to proceed:",
      options: [
        "My Ticket",
        "Check Result",
        "Draw Information",
        "Payment Help",
        "Contact Support",
      ]
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative mb-4 w-[340px] sm:w-[400px] overflow-hidden rounded-2xl border border-white/20 bg-white/70 backdrop-blur-xl shadow-2xl dark:border-gray-800/50 dark:bg-gray-950/70"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-amber-600 to-amber-500 px-4 py-3 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 p-1">
                  <img src="/chaticon.png" alt="Chat Support" className="h-full w-full object-contain" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Subhlaxmi Assistant</h3>
                  <p className="text-[10px] text-white/80 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> Online
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1.5 transition-colors hover:bg-white/20"
                aria-label="Close chat"
              >
                <IoClose className="h-5 w-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="h-[360px] overflow-y-auto p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
              <div className="flex flex-col gap-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isBot ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                        msg.isBot
                          ? "rounded-tl-none bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700"
                          : "rounded-tr-none bg-amber-600 text-white"
                      }`}
                    >
                      {msg.text && (
                        typeof msg.text === "string" ? (
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        ) : (
                          <div className="leading-relaxed">{msg.text}</div>
                        )
                      )}
                      {msg.component}
                      {msg.options && (
                        <div className="mt-3 flex flex-col gap-1.5">
                          {msg.options.map((opt, i) => {
                            const Icon = getOptionIcon(opt);
                            return (
                              <button
                                key={i}
                                onClick={() => handleOptionClick(opt)}
                                className="flex items-center gap-2 text-left bg-gray-50 dark:bg-gray-900/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-medium py-1.5 px-3 rounded-lg border border-amber-100 dark:border-amber-900/30 transition-colors text-[13px] hover:border-amber-300 dark:hover:border-amber-500/50"
                              >
                                {Icon && <span className="opacity-80">{Icon}</span>}
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl rounded-tl-none bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-4 py-3 shadow-sm flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200/50 p-3 dark:border-gray-800/50 bg-white/50 dark:bg-gray-900/50">
              <form onSubmit={handleSend} className="relative flex items-center">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full rounded-full border border-gray-300 bg-white px-4 py-2.5 pr-12 text-sm text-gray-900 placeholder-gray-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:border-amber-500 dark:focus:ring-amber-500"
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-amber-600 text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                  aria-label="Send message"
                >
                  <IoSend className="h-4 w-4 ml-0.5" />
                </button>
              </form>
              <div className="mt-2 flex justify-center">
                <button
                  onClick={() => setShowConfirmPopup(true)}
                  className="text-[11px] text-gray-500 hover:text-amber-500 hover:underline transition-colors dark:text-gray-400 dark:hover:text-amber-400"
                >
                  Restart Conversation
                </button>
              </div>
            </div>

            {/* Popup Overlay inside chatbox */}
            <AnimatePresence>
              {showConfirmPopup && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-gray-950/80"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 10 }}
                    className="w-[85%] rounded-2xl bg-white p-5 text-center shadow-2xl border border-gray-200 dark:border-gray-800 dark:bg-gray-900"
                  >
                    <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                      Start fresh?
                    </h4>
                    <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
                      Do you want to start a new conversation and delete old chat?
                    </p>
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => setShowConfirmPopup(false)}
                        className="rounded-full bg-gray-100 px-4 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        No
                      </button>
                      <button
                        onClick={handleRestart}
                        className="rounded-full bg-amber-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700"
                      >
                        Yes
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-xl ring-2 ring-amber-500/20 transition-all hover:scale-105 hover:shadow-2xl dark:bg-gray-800"
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: 8,
            ease: "linear",
          }}
          className="h-10 w-10 overflow-hidden rounded-full"
        >
          <img
            src="/chaticon.png"
            alt="Chat"
            className="h-full w-full object-contain"
          />
        </motion.div>
      </motion.button>
    </div>
  );
}

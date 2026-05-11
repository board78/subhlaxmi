export type Language = "en" | "hi";

export type Stat = {
  label: string;
  value: number;
  suffix: string;
};

export type MarketingTicket = {
  name: string;
  prize: string;
  time: string;
};

export type Category = {
  title: string;
  subtitle: string;
};

export type ResultRow = {
  name: string;
};

export type Testimonial = {
  name: string;
  location: string;
  quote: string;
  tag: string;
};

export type CopyPack = {
  navItems: string[];
  badge: string;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  primaryCta: string;
  secondaryCta: string;
  signIn: string;
  register: string;
  popularTitle: string;
  categoriesTitle: string;
  liveResultsTitle: string;
  countdownTitle: string;
  nextDrawAt: string;
  footerTitle: string;
  footerDescription: string;
  footerButton: string;
  buyTicket: string;
  testimonialTitle: string;
  testimonialLabel: string;
  testimonialHelper: string;
  statsTitle: string;
  testimonials: Testimonial[];
  hrs: string;
  mins: string;
  secs: string;
  menu: string[];
  stats: Stat[];
  tickets: MarketingTicket[];
  categories: Category[];
  resultRows: ResultRow[];
};

export const siteCopy: Record<Language, CopyPack> = {
  en: {
    navItems: ["Home", "Jackpots", "Results", "Rewards"],
    badge: "",
    heroTitle: "Subhlaxmi",
    heroSubtitle: "Kuber Ka Khajana. Dhan Varsha. Clean digital lottery experience.",
    heroDescription:
      "Book lottery tickets, check live draw timings, and explore premium jackpot games in one clean and easy experience.",
    primaryCta: "Play Now",
    secondaryCta: "Check Live Results",
    signIn: "Sign In",
    register: "Register",
    popularTitle: "Popular Draws Today",
    categoriesTitle: "Explore Categories",
    liveResultsTitle: "Live Result Board",
    countdownTitle: "Next Mega Draw",
    nextDrawAt: "Next draw at",
    footerTitle: "Fast UPI checkout and live lottery results",
    footerDescription:
      "Pay with UPI in seconds and follow draws, tickets, and results in one clear place.",
    footerButton: "Create Account",
    buyTicket: "Buy Ticket",
    testimonialTitle: "Real wins, real stories",
    testimonialLabel: "Trusted players",
    testimonialHelper: "Fresh stories from verified ticket buyers across India.",
    statsTitle: "Platform pulse",
    testimonials: [
      {
        name: "Priya",
        location: "Kochi",
        quote:
          "Booking was smooth and the draw timing felt clear. I love how the winner artwork builds trust before I tap buy.",
        tag: "Verified",
      },
      {
        name: "Rahul",
        location: "Lucknow",
        quote:
          "The layout feels calm and readable. Small fonts on mobile still look crisp, and the countdown keeps me excited.",
        tag: "5★ rated",
      },
      {
        name: "Sneha",
        location: "Surat",
        quote:
          "The testimonial section feels festive without being loud. It is the kind of polish I expect from a premium app.",
        tag: "Happy buyer",
      },
    ],
    hrs: "Hrs",
    mins: "Min",
    secs: "Sec",
    menu: ["Home", "My Tickets", "Live Results", "Jackpots", "Rewards", "Support"],
    stats: [
      { label: "Active Players", value: 128000, suffix: "+" },
      { label: "Crorepati Winners", value: 4486, suffix: "+" },
      { label: "Tickets Today", value: 326000, suffix: "+" },
    ],
    tickets: [
      { name: "Kuber Ratna", prize: "INR 25 Cr", time: "Tonight 9:00 PM" },
      { name: "Shri Samridhi", prize: "INR 12 Cr", time: "Today 7:30 PM" },
      { name: "Riddhi Siddhi", prize: "INR 8 Cr", time: "Today 8:15 PM" },
      { name: "Dhan Laxmi Special", prize: "INR 5 Cr", time: "Tomorrow 1:00 PM" },
      { name: "Jai Mata Di Draw", prize: "INR 1.2 Cr", time: "Tomorrow 4:30 PM" },
      { name: "Vaibhav Laxmi", prize: "INR 2.75 Cr", time: "Friday 8:45 PM" },
      { name: "Sone Ki Baarish", prize: "INR 4.5 Cr", time: "Sunday 9:30 PM" },
    ],
    categories: [
      { title: "Bumper Draws", subtitle: "High prize pools" },
      { title: "Daily Results", subtitle: "Fast updates" },
      { title: "Quick Pick", subtitle: "Smart numbers" },
      { title: "Lucky Bundles", subtitle: "Combo tickets" },
      { title: "Refer & Earn", subtitle: "Bonus rewards" },
    ],
    resultRows: [
      { name: "Kuber Ratna" },
      { name: "Shri Samridhi" },
      { name: "Riddhi Siddhi" },
      { name: "Dhan Laxmi Special" },
    ],
  },
  hi: {
    navItems: ["होम", "जैकपॉट", "रिजल्ट", "रिवॉर्ड्स"],
    badge: "",
    heroTitle: "Subhlaxmi",
    heroSubtitle: "कुबेर का खजाना। धन वर्षा। साफ और आधुनिक डिजिटल लॉटरी अनुभव।",
    heroDescription:
      "एक ही जगह पर लॉटरी टिकट बुक करें, लाइव ड्रॉ टाइमिंग देखें और प्रीमियम जैकपॉट गेम्स एक्सप्लोर करें।",
    primaryCta: "अभी खेलें",
    secondaryCta: "लाइव रिजल्ट देखें",
    signIn: "साइन इन",
    register: "रजिस्टर",
    popularTitle: "आज के लोकप्रिय ड्रॉ",
    categoriesTitle: "कैटेगरी एक्सप्लोर करें",
    liveResultsTitle: "लाइव रिजल्ट बोर्ड",
    countdownTitle: "अगला मेगा ड्रॉ",
    nextDrawAt: "अगला ड्रॉ",
    footerTitle: "तेज UPI चेकआउट और लाइव लॉटरी रिजल्ट",
    footerDescription:
      "UPI से सेकंड्स में पेमेंट करें और ड्रॉ, टिकट, रिजल्ट सब एक ही जगह साफ़ तरीके से देखें।",
    footerButton: "अकाउंट बनाएं",
    buyTicket: "टिकट खरीदें",
    testimonialTitle: "असली जीत, असली कहानियां",
    testimonialLabel: "भरोसेमंद खिलाड़ी",
    testimonialHelper: "भारत भर के वेरिफाइड खरीदारों की ताज़ा प्रतिक्रियाएं।",
    statsTitle: "लाइव आंकड़े",
    testimonials: [
      {
        name: "प्रिया",
        location: "कोच्चि",
        quote:
          "बुकिंग आसान थी और ड्रॉ टाइम साफ दिखा। विनर आर्ट देखकर भरोसा बनता है।",
        tag: "वेरिफाइड",
      },
      {
        name: "राहुल",
        location: "लखनऊ",
        quote:
          "लेआउट शांत और पढ़ने में आसान है। मोबाइल पर छोटे फॉन्ट भी साफ दिखते हैं।",
        tag: "5★",
      },
      {
        name: "स्नेहा",
        location: "सूरत",
        quote:
          "टेस्टिमोनियल सेक्शन उत्सव जैसा लगता है। ज़्यादा शोर के बिना प्रीमियम फील।",
        tag: "खुश खरीदार",
      },
    ],
    hrs: "घंटे",
    mins: "मिनट",
    secs: "सेकंड",
    menu: ["होम", "मेरे टिकट", "लाइव रिजल्ट", "जैकपॉट", "रिवॉर्ड्स", "सपोर्ट"],
    stats: [
      { label: "सक्रिय खिलाड़ी", value: 128000, suffix: "+" },
      { label: "करोड़पति विजेता", value: 4486, suffix: "+" },
      { label: "आज के टिकट", value: 326000, suffix: "+" },
    ],
    tickets: [
      { name: "कुबेर रत्न", prize: "INR 25 Cr", time: "आज रात 9:00 बजे" },
      { name: "श्री समृद्धि", prize: "INR 12 Cr", time: "आज 7:30 बजे" },
      { name: "रिद्धि सिद्धि", prize: "INR 8 Cr", time: "आज 8:15 बजे" },
      { name: "धन लक्ष्मी स्पेशल", prize: "INR 5 Cr", time: "कल 1:00 बजे" },
      { name: "जय माता दी ड्रॉ", prize: "INR 1.2 Cr", time: "कल 4:30 बजे" },
      { name: "वैभव लक्ष्मी", prize: "INR 2.75 Cr", time: "शुक्रवार 8:45 बजे" },
      { name: "सोने की बारिश", prize: "INR 4.5 Cr", time: "रविवार 9:30 बजे" },
    ],
    categories: [
      { title: "बंपर ड्रॉ", subtitle: "बड़े प्राइज पूल" },
      { title: "डेली रिजल्ट", subtitle: "तेज अपडेट" },
      { title: "क्विक पिक", subtitle: "स्मार्ट नंबर" },
      { title: "लकी बंडल", subtitle: "कॉम्बो टिकट" },
      { title: "रेफर एंड अर्न", subtitle: "बोनस रिवॉर्ड" },
    ],
    resultRows: [
      { name: "कुबेर रत्न" },
      { name: "श्री समृद्धि" },
      { name: "रिद्धि सिद्धि" },
      { name: "धन लक्ष्मी स्पेशल" },
    ],
  },
};

/** A menu subcategory. Its items are listed directly under the category. */
export type ChecklistItemGroup = {
  name: string;
  items: readonly string[];
};

export type ChecklistCategory = {
  slug: string;
  name: string;
  /** Salads, raita, breakfast and live counters are ordered separately, never by package. */
  outsidePackage?: boolean;
  /** When set, the package always pre-fills this many rows, not the Bronze/Silver/Gold count. */
  itemsPerPackage?: number;
  /** Items of a category that has no subcategories. */
  items?: readonly string[];
  /** Subcategories, used only to label the item list. */
  groups?: readonly ChecklistItemGroup[];
};

export type MenuPackage = {
  slug: string;
  name: string;
  /** Rows pre-filled per category when the package is picked. */
  itemsPerCategory: number;
};

export const BANQUET_MENU_PACKAGES: readonly MenuPackage[] = [
  { slug: "bronze", name: "Bronze", itemsPerCategory: 1 },
  { slug: "silver", name: "Silver", itemsPerCategory: 2 },
  { slug: "gold", name: "Gold", itemsPerCategory: 3 },
  { slug: "custom", name: "Custom", itemsPerCategory: 0 },
] as const;

export function menuPackageBySlug(slug: string): MenuPackage | undefined {
  return BANQUET_MENU_PACKAGES.find((menuPackage) => menuPackage.slug === slug);
}

/** Categories a package pre-fills, in checklist order. */
export function packagedCategories(): readonly ChecklistCategory[] {
  return BANQUET_CHECKLIST_CATEGORIES.filter((category) => !category.outsidePackage);
}

/** Rows a package pre-fills for one category. */
export function packageRowCount(
  category: ChecklistCategory,
  itemsPerCategory: number,
): number {
  return category.itemsPerPackage ?? itemsPerCategory;
}

/** Item groups of a category; flat categories return a single unlabelled group. */
export function checklistItemGroups(
  category: ChecklistCategory,
): readonly ChecklistItemGroup[] {
  return category.groups ?? [{ name: "", items: category.items ?? [] }];
}

export type StaffRole = {
  slug: string;
  name: string;
};

export const BANQUET_STAFF_ROLES: readonly StaffRole[] = [
  { slug: "waiters", name: "Waiters" },
  { slug: "housekeeping", name: "Bai / Housekeeping staff" },
  { slug: "ghati", name: "Ghati workers" },
] as const;

export type PaymentOption = {
  slug: string;
  name: string;
};

export const BANQUET_PAYMENT_PARTICULARS: readonly PaymentOption[] = [
  { slug: "total", name: "Total bill" },
  { slug: "advance", name: "Advance received" },
  { slug: "extra", name: "Extra charges" },
  { slug: "balance", name: "Balance due" },
] as const;

export const BANQUET_PAYMENT_MODES: readonly PaymentOption[] = [
  { slug: "cash", name: "Cash" },
  { slug: "upi", name: "UPI" },
  { slug: "card", name: "Card" },
  { slug: "bank-transfer", name: "Bank transfer" },
  { slug: "cheque", name: "Cheque" },
] as const;

export function paymentOptionName(
  options: readonly PaymentOption[],
  slug: string,
): string {
  return options.find((option) => option.slug === slug)?.name ?? "";
}

export type EventTimeSlot = {
  slug: string;
  name: string;
};

export const BANQUET_EVENT_TIMES: readonly EventTimeSlot[] = [
  { slug: "morning", name: "Morning 08:00 AM – 02:00 PM" },
  { slug: "evening", name: "Evening 04:00 PM – 10:00 PM" },
  { slug: "full-day", name: "Full Day 10:00 AM – 10:00 PM" },
] as const;

export function eventTimeBySlug(slug: string): EventTimeSlot | undefined {
  return BANQUET_EVENT_TIMES.find((slot) => slot.slug === slug);
}

export const BANQUET_CHECKLIST_CATEGORIES: readonly ChecklistCategory[] = [
  {
    slug: "welcome-drink",
    name: "Welcome Drink",
    groups: [
      {
        name: "Basic",
        items: [
          "Assorted Soft Drinks (असोर्टेड सॉफ्ट ड्रिंक्स)",
          "Masala Chaas (मसाला छाछ)",
          "Fresh Lime Juice (फ्रेश लाइम जूस)",
          "Jal Jeera (जलजीरा)",
          "Litchi Squash (लीची स्क्वैश)",
          "Kiwi Squash (कीवी स्क्वैश)",
          "Rose Sharbat (रोज़ शर्बत)",
          "Ice Tea (आइस टी)",
          "Keri Panna (केरी पन्ना)",
          "Summer Cool (समर कूल)",
          "Minty Kacchi Keri (मिन्टी कच्ची केरी)",
          "Kala Khatta (काला खट्टा)",
          "Kokam Sharbat (कोकम शर्बत)",
          "Lemon Ginger Mojito (लेमन जिंजर मोजिटो)",
          "Lemon Litchi Fizz (लेमन लीची फिज़)",
          "Blue Lagoon (ब्लू लगून)",
        ],
      },
      {
        name: "Fresh Fruit Juice",
        items: [
          "Mosambi (मोसंबी)",
          "Pineapple (पाइनएप्पल)",
          "Watermelon (वॉटरमेलन)",
          "Orange (Seasonal) (ऑरेंज सीजनल)",
          "Peru Pineapple (पेरू पाइनएप्पल)",
          "Orange Pineapple Ginger (ऑरेंज पाइनएप्पल जिंजर)",
          "Special Cocktail Juice (स्पेशल कॉकटेल जूस)",
          "Special Boomerang (Pineapple, Orange & Peru) (स्पेशल बूमरैंग (पाइनएप्पल, ऑरेंज और पेरू))",
          "Special Tulsidhar (Pineapple, Chikku & Tulsi) (स्पेशल तुलसीधार (पाइनएप्पल, चिक्कू और तुलसी))",
          "Special Golden Punch (Pineapple & Orange) (स्पेशल गोल्डन पंच (पाइनएप्पल और ऑरेंज))",
          "Special Raja Rani (Pineapple & Rose Syrup) (स्पेशल राजा रानी (पाइनएप्पल और रोज़ सिरप))",
        ],
      },
      {
        name: "Mocktails (+₹20 Extra)",
        items: [
          "Special Fruit Punch (स्पेशल फ्रूट पंच)",
          "Special Virgin Pina Colada (स्पेशल वर्जिन पीना कोलाडा)",
          "Special Anar Peru Punch (स्पेशल अनार पेरू पंच)",
          "Special Thandai (स्पेशल ठंडाई)",
          "Special Mango Smoothie (स्पेशल मैंगो स्मूदी)",
          "Special Peach Muskmelon (स्पेशल पीच मस्क्मेलन)",
          "Special Strawberry Colada (स्पेशल स्ट्रॉबेरी कोलाडा)",
        ],
      },
    ],
  },
  {
    slug: "salads",
    name: "Salads",
    outsidePackage: true,
    items: [
      "Green Salad (ग्रीन सलाद)",
      "Chana Chaat Salad (चना चाट सलाद)",
      "Corn Chaat (कॉर्न चाट)",
      "Beetroot Salad (बीटरूट सलाद)",
      "Russian Salad (रशियन सलाद)",
    ],
  },
  {
    slug: "starter",
    name: "Starter",
    groups: [
      {
        name: "Veg Starter",
        items: [
          "Papad Pudina Roll (पापड़ पुदीना रोल)",
          "Veg Spring Roll (वेज स्प्रिंग रोल)",
          "Hara Bhara Kabab (हरा भरा कबाब)",
          "Veg Manchurian Dry (वेज मंचूरियन ड्राई)",
          "Special Veg Potli (स्पेशल वेज पोटली)",
          "Veg Gold Coin (वेज गोल्ड कॉइन)",
          "Cheese Corn Ball (चीज़ कॉर्न बॉल)",
          "Cheese Chilly Toast (चीज़ चिली टोस्ट)",
          "Veg Timmili Kabab (वेज टिम्मिली कबाब)",
          "Corn Karari Tikki (कॉर्न करारी टिक्की)",
          "Kung Pao Potato (कुंग पाओ पोटैटो)",
          "Veg Crispy (वेज क्रिस्पी)",
          "Veg Finger Schezwan (वेज फिंगर शेजवान)",
          "American Roll (अमेरिकन रोल)",
          "Cheese Palak Roll (चीज़ पालक रोल)",
          "Cigar Roll (सिगार रोल)",
          "Salsa Shots (साल्सा शॉट्स)",
        ],
      },
      {
        name: "Paneer Starter",
        items: [
          "Paneer Salt-N-Pepper (पनीर सॉल्ट-एन-पेपर)",
          "Paneer Chilli Dry (पनीर चिली ड्राई)",
          "Paneer Lifafa (पनीर लिफाफा)",
          "Papad Paneer Roll (पापड़ पनीर रोल)",
          "Chupurstum Kabab (चुपुरस्तुम कबाब)",
          "Special Paneer Pahadi Tikka (स्पेशल पनीर पहाड़ी टिक्का)",
          "Special Paneer Kalimari (स्पेशल पनीर कालीमारी)",
          "Special Maladi Paneer Tikka Dry (स्पेशल मलादी पनीर टिक्का ड्राई)",
          "Paneer Gold Coin (पनीर गोल्ड कॉइन)",
        ],
      },
    ],
  },
  {
    slug: "main-course",
    name: "Main Course",
    groups: [
      {
        name: "Veg Main Course",
        items: [
          "Bhindi Fry Masala (भिंडी फ्राई मसाला)",
          "Kurkuri Bhindi (कुरकुरी भिंडी)",
          "Veg Makhanwala (वेज मक्खनवाला)",
          "Veg Hangama (वेज हंगामा)",
          "Chana Masala (चना मसाला)",
          "Navratan Kurma (नवरत्न कुरमा)",
          "Veg Kurma (वेज कुरमा)",
          "Veg Kofta (वेज कोफ्ता)",
          "Veg Tawa Mehfil (वेज तवा महफिल)",
          "Veg Amritsari (वेज अमृतसरी)",
          "Veg Diwani Handi (वेज दीवानी हांडी)",
          "Veg Handi (वेज हांडी)",
          "Veg Kolhapuri (वेज कोल्हापुरी)",
          "Veg Pahadi (वेज पहाड़ी)",
          "Veg Hyderabadi (Green) (वेज हैदराबादी ग्रीन)",
          "Punjabi Saag (पंजाबी साग)",
          "Mix Vegetables (मिक्स वेजिटेबल्स)",
          "Veg Kadai (वेज कढ़ाई)",
          "Dum Aloo Punjabi (दम आलू पंजाबी)",
          "Veg Bhuna Masala (वेज भुना मसाला)",
          "Aloo Matar (आलू मटर)",
          "Aloo Flower / Gobi (आलू फ्लावर / गोभी)",
          "Methi Matar Malai (मेथी मटर मलाई)",
        ],
      },
      {
        name: "Paneer Main Course",
        items: [
          "Paneer Bhuna Masala (पनीर भुना मसाला)",
          "Paneer Handi (पनीर हांडी)",
          "Paneer Tikka Masala (पनीर टिक्का मसाला)",
          "Dhabe Wala Paneer (ढाबे वाला पनीर)",
          "Palak Paneer (Green) (पालक पनीर ग्रीन)",
          "Paneer Lababdar (पनीर लबाबदार)",
          "Paneer Butter Masala (पनीर बटर मसाला)",
          "Paneer Kadai (पनीर कढ़ाई)",
          "Achari Paneer (अचारी पनीर)",
          "Lasuni Corn Palak Paneer (लसुनी कॉर्न पालक पनीर)",
        ],
      },
      {
        name: "Kathiawadi Items",
        items: [
          "Dhokli Nu Shaak (ढोकली नु शाक)",
          "Kathiawadi Undhiyu (काठियावाड़ी उंधियू)",
          "Khichu (खीचू)",
          "Dal Dhokli (दाल ढोकली)",
          "Sev Tomato Nu Sak (सेव टमॅटो नु शाक)",
          "Bharela Bhinda Nu Shaak (भरेला भिंडा नु शाक)",
          "Green Gujrat (ग्रीन गुजरात)",
          "Ringan Batete Nu Shaak (रिंगण बटाटे नु शाक)",
          "Gatte Ki Sabzi (गट्टे की सब्ज़ी)",
        ],
      },
      {
        name: "Rajasthani Mogar",
        items: [
          "Dal Bati Churma (दाल बाटी चूरमा)",
          "Rajasthani Kadhi (राजस्थानी कढ़ी)",
          "Vadi Ki Sabzi (वड़ी की सब्ज़ी)",
          "Rajasthani Bhindi (राजस्थानी भिंडी)",
          "Gatte Ka Pulav (गट्टे का पुलाव)",
          "Hara Kanda Sabzi (हरा कांदा सब्ज़ी)",
        ],
      },
    ],
  },
  {
    slug: "breakfast",
    name: "Breakfast",
    outsidePackage: true,
    items: [
      "Upma (उपमा)",
      "Sheera (शीरा)",
      "Poha (पोहा)",
      "Khichadi (खिचड़ी)",
      "Idli (इडली)",
      "Medu Vada (मेदू वड़ा)",
      "Chutney (चटनी)",
      "Sambhar (सांभर)",
      "Chai (चाय)",
      "Coffee (कॉफी)",
      "Batata Vada (बटाटा वड़ा)",
      "Sabudana Vada (साबूदाना वड़ा)",
      "Sevaiya Upma (सेवइयां उपमा)",
    ],
  },
  {
    slug: "indian-breads",
    name: "Indian Breads",
    items: [
      "Poori (पूरी)",
      "Fulka (फुलका)",
      "Roti (Live) (रोटी लाइव)",
      "Naan (Live) (नान लाइव)",
      "Kulcha (Live) (कुलचा लाइव)",
      "Paratha (Live) (पराठा लाइव)",
      "Missi Roti (Live) (मिस्सी रोटी लाइव)",
      "Stuff Kulcha (Live) (स्टफ कुलचा लाइव)",
    ],
  },
  {
    slug: "raita",
    name: "Raita",
    outsidePackage: true,
    items: [
      "Boondi Raita (बूंदी रायता)",
      "Pineapple Raita (पाइनएप्पल रायता)",
      "Vegetable Raita (वेजिटेबल रायता)",
      "Corn Salad (कॉर्न सलाद)",
      "Chana Salad (चना सलाद)",
    ],
  },
  {
    slug: "rice",
    name: "Rice",
    itemsPerPackage: 1,
    items: [
      "Steam Rice (स्टीम राइस)",
      "Jeera Rice (जीरा राइस)",
      "Peas Pulav (पीज़ पुलाव)",
      "Tava Pulav (तवा पुलाव)",
      "Veg Biryani (वेज बिरयानी)",
      "Gujarati Khichdi (गुजराती खिचड़ी)",
    ],
  },
  {
    slug: "dal",
    name: "Dal",
    itemsPerPackage: 1,
    items: [
      "Dal Fry (दाल फ्राई)",
      "Dal Tadka (दाल तड़का)",
      "Dal Makhani (दाल मखनी)",
      "Gujarati Kadhi (Sweet/Spicy) (गुजराती कढ़ी मीठी/तीखी)",
      "Gujarati Dal (Sweet/Spicy) (गुजराती दाल मीठी/तीखी)",
      "Punjabi Pakodi Kadhi (पंजाबी पकौड़ी कढ़ी)",
    ],
  },
  {
    slug: "farsan",
    name: "Farsan",
    items: [
      "Mini Samosa (मिनी समोसा)",
      "Moong Dal Bhajia (मूंग दाल भजिया)",
      "Dal Wada (दाल वड़ा)",
      "Veg Pakoda (वेज पकौड़ा)",
      "Veg Cutlet (वेज कटलेट)",
      "Vagari Idli (वघारी इडली)",
      "Masala Idli (मसाला इडली)",
      "Idli Podi (इडली पोडी)",
      "Khandvi (खांडवी)",
      "Patra (पात्रा)",
      "Dhokla (ढोकला)",
      "Sandwich Dhokla (सैंडविच ढोकला)",
      "Tiranga Dhokla (तिरंगा ढोकला)",
      "White Dhokla (व्हाइट ढोकला)",
      "Khaman (खमन)",
      "Dahiwada (दहीवड़ा)",
      "Batata Wada (बटाटा वड़ा)",
      "Mutter Pattis / Karanji (मटर पट्टिस / करांजी)",
      "Corn Pattis (कॉर्न पट्टिस)",
      "Kothmir Wadi (कोथमीर वडी)",
    ],
  },
  {
    slug: "sweets",
    name: "Sweets / Ice Cream",
    itemsPerPackage: 1,
    groups: [
      {
        name: "Sweets",
        items: [
          "Gulab Jamun (गुलाब जामुन)",
          "Special Badam Moongdal Halwa (स्पेशल बादाम मूंगदाल हलवा)",
          "Special Moongdal Halwa (स्पेशल मूंगदाल हलवा)",
          "Fruit Salad (फ्रूट सलाद)",
          "Gajar Halwa (Seasonal) (गाजर हलवा सीजनल)",
          "Dudhi Halwa (दूधी हलवा)",
          "Special Jalebi with Rabdi (स्पेशल जलेबी विद रबड़ी)",
          "Jalebi (जलेबी)",
          "Special Kesar Phirni (स्पेशल केसर फिरनी)",
          "Shrikhand / Amrakhand (श्रीखंड / आम्रखंड)",
          "Aam Ras (Seasonal) (आम रस सीजनल)",
          "Basundi (All Type) (बासुंदी ऑल टाइप)",
          "Rasgulla (रसगुल्ला)",
          "Kala Jamun (काला जामुन)",
          "Special Malai Sandwich (स्पेशल मलाई सैंडविच)",
          "Special Ras Malai (स्पेशल रस मलाई)",
          "Special Chum Chum (स्पेशल चम चम)",
          "Special Strawberry Cream (स्पेशल स्ट्रॉबेरी क्रीम)",
          "Special Chocolate Mousse (स्पेशल चॉकलेट मूस)",
          "Special Shahi Tukda (स्पेशल शाही टुकड़ा)",
          "Mohanthal (मोहनथाल)",
        ],
      },
      {
        name: "Special Ice Cream (+₹25 Extra Charge)",
        items: [
          "Black Current (ब्लैक करंट)",
          "Chocolate Chips (चॉकलेट चिप्स)",
          "Guava (अमरूद)",
          "Anjeer Badam (अंजीर बादाम)",
          "Almond (बादाम)",
          "Raj Bhog (राज भोग)",
          "Kesar Pista (केसर पिस्ता)",
          "Pan (पान)",
          "Rose Gulkand (रोज़ गुलकंद)",
          "Kulfi Faluda (कुल्फी फालूदा)",
        ],
      },
      {
        name: "Ice Cream",
        items: [
          "Vanilla (वनीला)",
          "Strawberry (स्ट्रॉबेरी)",
          "Butter Scotch (बटर स्कॉच)",
          "Chocolate (चॉकलेट)",
          "Vanilla with Choco Sauce (वनीला विद चोको सॉस)",
          "Malai Kulfi (मलाई कुल्फी)",
          "Kulfi Sticky (कुल्फी स्टिकी)",
        ],
      },
    ],
  },
  {
    slug: "chaat-counter",
    name: "Chaat Counter",
    outsidePackage: true,
    items: [
      "Sev Puri (सेव पूरी)",
      "Pani Puri (पानी पूरी)",
      "Dahi Puri (दही पूरी)",
      "Papdi Chaat (पापड़ी चाट)",
      "Bhel (भेल)",
    ],
  },
  {
    slug: "pasta-counter",
    name: "Pasta Counter",
    outsidePackage: true,
    items: [
      "Red Sauce Pasta (रेड सॉस पास्ता)",
      "White Sauce Pasta (व्हाइट सॉस पास्ता)",
      "Pesto Sauce Pasta (पेस्टो सॉस पास्ता)",
    ],
  },
  {
    slug: "pizza",
    name: "Pizza",
    outsidePackage: true,
    items: [
      "Margherita (मार्गेरिटा)",
      "Veg Farmyard Pizza (वेज फार्मयार्ड पिज़्ज़ा)",
      "Paneer Tikka Pizza (पनीर टिक्का पिज़्ज़ा)",
      "Al Fungi Pizza (अल फंगी पिज़्ज़ा)",
    ],
  },
  {
    slug: "south-indian-counter",
    name: "South Indian Counter",
    outsidePackage: true,
    items: ["Assorted Dosa / Uttapam (असोर्टेड डोसा / उत्तपम)"],
  },
  {
    slug: "chinese-oriental-counter",
    name: "Chinese / Oriental Counter",
    outsidePackage: true,
    items: [
      "Veg Fried Rice (वेज फ्राइड राइस)",
      "Basil Rice (बेसिल राइस)",
      "Veg Combination Rice (वेज कॉम्बिनेशन राइस)",
      "Veg Schezwan Fried Rice (वेज शेजवान फ्राइड राइस)",
      "Veg Burnt Garlic Rice (वेज बर्न्ट गार्लिक राइस)",
      "Veg Hakka Noodles (वेज हक्का नूडल्स)",
      "Veg Chilly Garlic Sauce (वेज चिली गार्लिक सॉस)",
      "Veg Human Sauce (वेज हुनान सॉस)",
      "Veg Manchurian Gravy (वेज मंचूरियन ग्रेवी)",
      "Veg in Black Pepper Sauce (वेज इन ब्लैक पेपर सॉस)",
      "Veg Thai Curry (Red/Green) (वेज थाई करी रेड/ग्रीन)",
    ],
  },
  {
    slug: "additional-counters",
    name: "Additional Counters",
    outsidePackage: true,
    items: [
      "Pav Bhaji Counter (पाव भाजी काउंटर)",
      "Fruit Counter (फ्रूट काउंटर)",
      "Chole Bhature (छोले भटूरे)",
      "Delhi Chaat (दिल्ली चाट)",
      "Soup (सूप)",
    ],
  },
] as const;

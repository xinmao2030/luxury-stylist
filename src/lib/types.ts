export interface UserProfile {
  // 基础信息
  name: string;
  age: number;
  gender: "male" | "female" | "non-binary";
  nationality: string;
  city: string;

  // 身体数据
  height: number; // cm
  weight: number; // kg
  bodyType: "slim" | "athletic" | "average" | "curvy" | "plus";
  skinTone: "fair" | "light" | "medium" | "olive" | "tan" | "dark";
  hairColor: string;
  hairType: "straight" | "wavy" | "curly" | "coily";
  faceShape: "oval" | "round" | "square" | "heart" | "oblong" | "diamond";

  // 职业与身份
  occupation: string;
  industry: string;
  socialRole: string; // e.g. "企业高管", "创意总监", "社交名媛"

  // 消费能力
  budgetTier: "entry" | "mid" | "high" | "ultra";
  monthlyBudget: number; // USD
  currency: "USD" | "CNY" | "EUR" | "GBP" | "JPY" | "HKD";

  // 风格偏好
  stylePreferences: string[];
  favorBrands: string[];
  avoidBrands: string[];
  colorPreferences: string[];
  occasions: string[];

  // 性格与生活方式
  personality: string[];
  lifestyle: string[];

  // 特殊需求
  specialNeeds: string;

  // 衣橱已有单品
  existingItems: string[];
}

export interface StyleRecommendation {
  category: string;
  items: RecommendedItem[];
  stylingTips: string;
}

export interface RecommendedItem {
  brand: string;
  collection: string;
  itemName: string;
  price: string;
  priceUSD: number;
  color: string;
  size: string;
  reason: string;
  imageDescription: string;
  purchaseChannel: string;
  searchQuery?: string;
}

export interface FullStylingPlan {
  profileSummary: string;
  bodyAnalysis: string;
  colorAnalysis: string;
  styleDirection: string;
  recommendations: {
    hair: StyleRecommendation;
    makeup: StyleRecommendation;
    tops: StyleRecommendation;
    bottoms: StyleRecommendation;
    dresses: StyleRecommendation;
    outerwear: StyleRecommendation;
    bags: StyleRecommendation;
    shoes: StyleRecommendation;
    accessories: StyleRecommendation;
    fragrance: StyleRecommendation;
    watches: StyleRecommendation;
  };
  totalBudgetEstimate: string;
  seasonalNotes: string;
}

export const STYLE_OPTIONS = [
  "经典优雅", "现代简约", "街头潮流", "波西米亚", "商务精英",
  "法式慵懒", "意式风情", "日系极简", "韩系甜美", "英伦绅士",
  "运动休闲", "暗黑哥特", "复古怀旧", "自然清新", "华丽戏剧"
];

export const OCCASION_OPTIONS = [
  "日常通勤", "商务会议", "社交晚宴", "约会", "休闲周末",
  "度假旅行", "红毯/典礼", "户外运动", "艺术展览", "家族聚会"
];

export const PERSONALITY_OPTIONS = [
  "内敛沉稳", "外向活泼", "理性分析", "感性浪漫", "冒险进取",
  "温和亲切", "独立自主", "追求完美", "随性自在", "注重细节"
];

export const LIFESTYLE_OPTIONS = [
  "频繁商务出差", "社交活跃", "居家为主", "热爱运动",
  "艺术文化爱好", "夜生活丰富", "户外探险", "科技极客"
];

export const BUDGET_TIERS = {
  entry: { label: "入门奢侈 (月预算 $2,000-5,000)", range: [2000, 5000] },
  mid: { label: "中端奢侈 (月预算 $5,000-15,000)", range: [5000, 15000] },
  high: { label: "高端奢侈 (月预算 $15,000-50,000)", range: [15000, 50000] },
  ultra: { label: "顶级定制 (月预算 $50,000+)", range: [50000, 999999] },
};

export const BRAND_DATABASE = {
  fashion: [
    "Chanel", "Dior", "Louis Vuitton", "Gucci", "Prada", "Hermès",
    "Valentino", "Balenciaga", "Saint Laurent", "Bottega Veneta",
    "Burberry", "Givenchy", "Fendi", "Loewe", "Celine",
    "Tom Ford", "Alexander McQueen", "Versace", "Dolce & Gabbana",
    "Brunello Cucinelli", "Loro Piana", "Max Mara", "Moncler",
    "Zegna", "Brioni", "Kiton", "Berluti"
  ],
  bags: [
    "Hermès", "Chanel", "Louis Vuitton", "Dior", "Goyard",
    "Bottega Veneta", "Loewe", "Celine", "Fendi", "Prada",
    "Valextra", "Delvaux", "Moynat"
  ],
  shoes: [
    "Christian Louboutin", "Manolo Blahnik", "Jimmy Choo",
    "Roger Vivier", "Aquazzura", "Amina Muaddi", "Gianvito Rossi",
    "Berluti", "John Lobb", "Edward Green", "Santoni"
  ],
  watches: [
    "Patek Philippe", "Audemars Piguet", "Rolex", "Cartier",
    "Vacheron Constantin", "Jaeger-LeCoultre", "IWC", "Omega",
    "A. Lange & Söhne", "Breguet", "Richard Mille"
  ],
  jewelry: [
    "Cartier", "Van Cleef & Arpels", "Tiffany & Co.", "Bvlgari",
    "Harry Winston", "Graff", "Boucheron", "Piaget", "Chopard"
  ],
  fragrance: [
    "Tom Ford", "Maison Francis Kurkdjian", "Creed", "Byredo",
    "Le Labo", "Diptyque", "Jo Malone", "Frederic Malle",
    "Amouage", "Clive Christian", "Roja Parfums", "Xerjoff"
  ]
};

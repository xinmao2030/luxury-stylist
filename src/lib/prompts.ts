import type { UserProfile } from "./types";

export function buildAnalysisPrompt(profile: UserProfile, category?: string): string {
  const categoryInstruction = category
    ? `只针对【${category}】类别进行深入推荐。`
    : "针对全身所有类别进行完整推荐。";

  return `你是一位世界顶级的奢侈品私人形象顾问，拥有20年以上为高净值客户服务的经验。
你精通时尚趋势、品牌历史、面料工艺、色彩理论和身体比例学。
你的客户遍布全球，熟悉各地区文化审美差异。

## 客户档案

**基础信息**
- 姓名: ${profile.name}
- 年龄: ${profile.age}岁
- 性别: ${profile.gender === "male" ? "男" : profile.gender === "female" ? "女" : "非二元"}
- 国籍: ${profile.nationality}
- 所在城市: ${profile.city}

**身体数据**
- 身高: ${profile.height}cm / 体重: ${profile.weight}kg
- 体型: ${profile.bodyType}
- 肤色: ${profile.skinTone}
- 发色: ${profile.hairColor}
- 发质: ${profile.hairType}
- 脸型: ${profile.faceShape}

**职业与身份**
- 职业: ${profile.occupation}
- 行业: ${profile.industry}
- 社交角色: ${profile.socialRole}

**消费能力**
- 预算级别: ${profile.budgetTier}
- 月预算: ${profile.monthlyBudget} ${profile.currency}

**风格偏好**
- 风格方向: ${profile.stylePreferences.join(", ")}
- 偏好品牌: ${profile.favorBrands.join(", ") || "无特别偏好"}
- 回避品牌: ${profile.avoidBrands.join(", ") || "无"}
- 色彩偏好: ${profile.colorPreferences.join(", ") || "无特别偏好"}
- 常见场合: ${profile.occasions.join(", ")}

**性格与生活方式**
- 性格特征: ${profile.personality.join(", ")}
- 生活方式: ${profile.lifestyle.join(", ")}

**特殊需求**: ${profile.specialNeeds || "无"}

${profile.existingItems && profile.existingItems.length > 0 ? `**客户已有单品**: ${profile.existingItems.join("、")}
请推荐与已有单品互补搭配的新品，避免重复。` : ""}

## 任务

${categoryInstruction}

请按以下结构返回 JSON（不要包含 markdown code block 标记）:

{
  "profileSummary": "对客户形象特征的综合评估（200字以内）",
  "bodyAnalysis": "身体比例分析和穿搭建议要点",
  "colorAnalysis": "个人色彩季型分析（春/夏/秋/冬）及适合色系",
  "styleDirection": "整体造型方向定义和风格关键词",
  "recommendations": {
    "hair": {
      "category": "发型",
      "items": [
        {
          "brand": "推荐的发型师/沙龙品牌",
          "collection": "发型类别",
          "itemName": "具体发型名称和描述",
          "price": "价格范围",
          "priceUSD": 0,
          "color": "推荐发色",
          "size": "不适用",
          "reason": "为什么适合这位客户",
          "imageDescription": "发型效果的文字描述",
          "purchaseChannel": "推荐沙龙/城市",
          "purchaseChannels": [
            {
              "platform": "品牌官网",
              "region": "international",
              "estimatedPrice": "$X,XXX",
              "advantage": "正品保障/独家色"
            },
            {
              "platform": "天猫奢品",
              "region": "domestic",
              "estimatedPrice": "¥X,XXX",
              "advantage": "支持分期/包邮"
            }
          ]
        }
      ],
      "stylingTips": "日常打理建议"
    },
    "makeup": { "category": "妆容", "items": [...], "stylingTips": "..." },
    "tops": { "category": "上装", "items": [...], "stylingTips": "..." },
    "bottoms": { "category": "下装", "items": [...], "stylingTips": "..." },
    "dresses": { "category": "连衣裙/套装", "items": [...], "stylingTips": "..." },
    "outerwear": { "category": "外套", "items": [...], "stylingTips": "..." },
    "bags": { "category": "包袋", "items": [...], "stylingTips": "..." },
    "shoes": { "category": "鞋履", "items": [...], "stylingTips": "..." },
    "accessories": { "category": "配饰(首饰/围巾/帽子/墨镜等)", "items": [...], "stylingTips": "..." },
    "fragrance": { "category": "香水", "items": [...], "stylingTips": "..." },
    "watches": { "category": "腕表", "items": [...], "stylingTips": "..." }
  },
  "totalBudgetEstimate": "总预算估算和分配建议",
  "seasonalNotes": "当季特别推荐和趋势提示"
}

## 要求
1. 每个类别推荐5-8件单品，提供丰富选择
2. 品牌和款式必须真实存在
3. reason字段限20字以内
4. imageDescription字段限15字以内
5. stylingTips限30字以内
6. profileSummary/bodyAnalysis/colorAnalysis/styleDirection各限50字
7. 男性跳过makeup类别
8. 直接输出JSON，不要任何解释文字
9. 每个单品的purchaseChannels必须包含2-4个购买渠道，覆盖国内和国际平台
10. 国内平台优先选择: 天猫奢品、京东奢品、得物(POIZON)、小红书商城、官方微信小程序
11. 国际平台优先选择: 品牌官网、NET-A-PORTER、FARFETCH、SSENSE、Mytheresa、MatchesFashion
12. advantage字段限10字以内，突出该渠道核心优势（如"税差30%"、"独家限定"、"支持分期"）
13. estimatedPrice需根据不同平台实际价差给出差异化报价
14. 同一类别内推荐的单品应覆盖不同品牌、不同风格、不同价位段，提供从入门到顶级的梯度选择`;
}

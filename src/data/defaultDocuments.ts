/**
 * Pre-loaded Showcase Documents for OmniMark
 */

export interface DocumentItem {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

export const DEFAULT_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-bidi-guide',
    title: 'دليل محرر ماركداون ثنائي الاتجاه (BiDi Guide)',
    updatedAt: Date.now(),
    content: `# مرحباً بك في OmniMark: محرر ماركداون الذكي

مرحباً بك في المحرر المتقدم المصمم خصيصاً لدعم **الكتابة متعددة اللغات** وتحديد الاتجاه التلقائي (**Auto Direction**) لكل فقرة وعنوان وقائمة على حدة!

> [!NOTE]
> هذا المحرر يدعم خوارزمية الاتجاه التلقائي (**Auto Direction BiDi Algorithm**). يمكنك كتابة العربية والإنجليزية في نفس المستند أو داخل نفس الفقرة بدون أي تداخل أو تشوه في علامات الترقيم!

---

## 🌟 ميزات الاتجاه التلقائي (Auto Direction)

يقوم المحرر تلقائياً بفحص الحرف الأول الفعلي بعد رموز الماركداون (مثل \`#\` و \`-\` و \`>\`) لتحديد ما إذا كانت الفقرة باللغة العربية (RTL) أم باللغة الإنجليزية (LTR):

1. **كتابة فقرات عربية وفارسية متصلة** تتجه تلقائياً من اليمين إلى اليسار مع محاذاة لليمين بخط **وزیرمتن (Vazirmatn)** القياسي.
2. **كتابة فقرات إنجليزية** تتجه تلقائياً من اليسار إلى اليمين.
3. **عزل الأكواد البرمجية والرياضيات**: يتم عرض الأكواد دائماً بنمط LTR حتى لو كانت داخل فقرة عربية أو فارسية!

### نمونه متن فارسی با فونت استاندارد وزیرمتن (Vazirmatn):
این ویرایشگر پیشرفته با استفاده از قلم زیبای **وزیرمتن**، متون فارسی شامل حروف ویژه مانند «گ، چ، پ، ژ، ک، ی» را با بالاترین کیفیت تایپوگرافی نمایش می‌دهد.

### مثال على دمج اللغات في جملة واحدة:
يمكنك كتابة: استخدم الدالة \`console.log("مرحباً")\` لطباعة الرسائل في لغة TypeScript بكل سهولة.

---

## 💡 تنبيهات وصناديق الملاحظات (Callouts)

> [!TIP]
> يمكنك الضغط على **Ctrl + Shift + X** للتبديل الفوري بين اتجاه الكتابة من اليمين أو اليسار للفقرة المحددة.

> [!WARNING]
> احرص على استخدام علامات الترقيم العربية مثل الفاصلة المنقوطة (؛) وعلامة الاستفهام (؟) للحصول على أفضل تجربة قراءة.

---

## 📋 قوائم المهام التفاعلية (Task Lists)

جرب النقر على مربعات الاختيار في المعاينة مباشرة:
- [x] تفعيل خوارزمية الاتجاه التلقائي (Auto Direction)
- [x] دعم الجداول وعلامات الماركداون الكاملة
- [ ] تجربة وضع التركيز (Focus Mode) للكتابة الهادئة
- [ ] تصدير المستند كملف HTML مستقل أو PDF

---

## 📊 جدول المقارنة (Feature Matrix)

| الميزة | المحررات العادية | محرر OmniMark Premium |
| :--- | :---: | :---: |
| الاتجاه التلقائي (Auto BiDi) | ❌ غير متوفر | ✅ مدعوم بالكامل لكل فقرة |
| عزل الكود البرمجي | ⚠️ يحدث تشويه | ✅ عزل تام بنمط LTR |
| وضع الآلة الكاتبة (Typewriter) | 💰 مدفوع | ✅ مجاني بالكامل لك |
| التصدير إلى PDF و HTML | 💰 اشتراك شهري | ✅ مدمج ومجاني |

---

## 📐 المعادلات الرياضية (LaTeX Math)

يمكنك كتابة معادلات مضمنة مثل $E = mc^2$ أو معادلات كاملة:

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

---

## 📊 رسم بياني تفاعلي (Mermaid Diagram)

\`\`\`mermaid
graph TD;
  A[نص المستخدم / Input] --> B{فحص الاتجاه};
  B -->|فارسی یا عربی| C[قلم وزیرمتن + RTL];
  B -->|English / Latin| D[Inter Sans + LTR];
  C --> E[معاينة فورية متوافقة];
  D --> E;
\`\`\`

---

## 🔗 روابط الملاحظات المتشابكة (Wiki Links)
يمكنك ربط المستندات ببعضها مثل [[Product Engineering Specification]] أو الانتقال إلى [[ملاحظات وأفكار أدبية (Literary Journal)|المجلة الأدبية]] بنقرة واحدة!

الوسوم المستخدمة في هذا الدليل: #guide #vazirmatn #bidi #persian

---

## 💻 مثال على كود برمجي (Code Highlight)

\`\`\`typescript
// كود برمجي للتأكد من اتجاه النص
function isArabic(text: string): boolean {
  const arabicPattern = /[\\u0600-\\u06FF]/;
  return arabicPattern.test(text);
}

console.log("اتجاه النص سليم ومحمي!");
\`\`\`
`,
  },
  {
    id: 'doc-product-spec',
    title: 'Product Engineering Specification',
    updatedAt: Date.now() - 3600000,
    content: `# OmniMark Core Engine Specification

This document details the high-performance text parsing, layout architecture, and bidirectional typesetting engines.

## 1. System Architecture Overview

The editor architecture operates across three synchronized threads:
- **Lexical Tokenizer**: Splits lines and normalizes markdown AST.
- **BiDi Heuristic Engine**: Inspects Unicode code points to detect paragraph script (Arabic, Hebrew, Persian vs Latin/CJK).
- **Synchronized Viewport**: Smoothly aligns the editing caret with the live reading preview.

> [!IMPORTANT]
> All code blocks, inline math expressions, and URL fragments must preserve strict LTR orientation to avoid reversing punctuation and operators.

### Technical Metrics
- **Keystroke Latency**: < 4ms
- **Memory Footprint**: < 18MB
- **BiDi Resolution**: 100% compliant with Unicode UAX #9

## 2. Implementation Checklist
- [x] First-strong directional character scanner
- [x] Markdown syntax prefix stripping
- [x] Live word and reading time metrics
- [x] Customizable typography themes
- [ ] Offline local draft storage
`,
  },
  {
    id: 'doc-notes-creative',
    title: 'ملاحظات وأفكار أدبية (Literary Journal)',
    updatedAt: Date.now() - 7200000,
    content: `# ومضات أدبية وتأملات

«الكتابة هي الصوت الداخلي الذي يجد طريقه إلى النور حين تسكن كل الأصوات.»

## فصول في الفكر والبيان

1. **بلاغة الإيجاز**: كيف تعبر بأقل عدد من الكلمات عن أعمق المعاني.
2. **جماليات الخط والطباعة**: أثر اختيار الخطوط مثل خط *الأميري* و*الوزير* في إراحة عين القارئ.
3. **تعدد اللغات**: جمال الانتقال السلس بين لغة الضاد ولغات العالم.

> قال المتنبي:
> «أَعَزُّ مَكانٍ في الدُنى سَرجُ سابِحٍ ... وَخَيرُ جَليسٍ في الزَمانِ كِتابُ»

### ملاحظة ختامية:
الكتابة الواضحة ثمرة تفكير منسق، وOmniMark يمنحك الفضاء الهادئ لتدوين أفكارك.
`,
  },
];

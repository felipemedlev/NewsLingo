import importedNews from "@/data/news.json";
export type LearningLevel = "easy" | "intermediate";
export type Sentence = { id: string; he: string; en: string };
export type Story = {
  source?: { publisher: string; url: string; publishedAt: string; importedAt: string; adapted: boolean };
  slug: string;
  category: string;
  minutes: number;
  date: string;
  titleHe: string;
  titleEn: string;
  standfirst: string;
  sentences: Record<LearningLevel, Sentence[]>;
  vocabulary: { he: string; en: string }[];
  questions: { prompt: string; answer: string }[];
};

// Original invented examples: these describe no real announcement or current event.
const SAMPLE_STORIES: Story[] = [
  {
    slug: "city-bus-plan", category: "חברה", minutes: 3,
    date: "Saturday, September 26", titleHe: "עיר אחת בודקת דרך חדשה להגיע לעבודה", titleEn: "A new way to get to work",
    standfirst: "סיפור תרגול מקורי · לא דיווח חדשותי אמיתי",
    sentences: {
      easy: [
        { id: "s1", he: "העיר בודקת תוכנית חדשה לתחבורה ציבורית.", en: "The city is testing a new public transport plan." },
        { id: "s2", he: "התוכנית מוסיפה אוטובוסים בשעות הבוקר.", en: "The plan adds buses in the morning." },
        { id: "s3", he: "העירייה רוצה לעזור לתושבים להגיע לעבודה בזמן.", en: "The municipality wants to help residents get to work on time." },
        { id: "s4", he: "הנוסעים יוכלו לספר מה עובד ומה קשה.", en: "Passengers will be able to say what works and what is difficult." },
        { id: "s5", he: "אחרי חודשיים, העיר תבדוק את התוצאות.", en: "After two months, the city will review the results." },
      ],
      intermediate: [
        { id: "s1", he: "עיריית נחל־אור בוחנת תוכנית תחבורה חדשה שנועדה להקל על הנסיעה לעבודה.", en: "The municipality of Nahal Or is testing a new transport plan intended to make commuting easier." },
        { id: "s2", he: "במסגרת הניסוי יתווספו קווים בשעות העומס, בעיקר בשכונות המרוחקות ממרכז העיר.", en: "As part of the trial, routes will be added during rush hour, mainly in neighborhoods far from the city center." },
        { id: "s3", he: "בעירייה אומרים שהשינויים ייבחנו בשיתוף נוסעים ומפעילי תחבורה.", en: "The municipality says it will review the changes with passengers and transport operators." },
        { id: "s4", he: "התושבים יוכלו לדווח באינטרנט על זמני המתנה, עומס ונוחות הנסיעה.", en: "Residents will be able to report online about wait times, crowding, and comfort." },
        { id: "s5", he: "בתום חודשיים יפורסמו ממצאי הניסוי, ולפיהם תישקל הרחבתו.", en: "The trial's findings will be published after two months, and any expansion will be considered in light of them." },
      ],
    },
    vocabulary: [{ he: "תחבורה", en: "transportation" }, { he: "תושבים", en: "residents" }, { he: "תוכנית", en: "plan" }, { he: "עירייה", en: "municipality" }],
    questions: [{ prompt: "How long will the trial last?", answer: "Two months." }, { prompt: "What can residents report?", answer: "Wait times, crowding, and comfort." }],
  },
  {
    slug: "neighbourhood-garden", category: "סביבה", minutes: 2,
    date: "Saturday, September 26", titleHe: "גינה קהילתית קטנה פותחת דלת לשכנים", titleEn: "A garden brings neighbours together",
    standfirst: "סיפור תרגול מקורי · לא דיווח חדשותי אמיתי",
    sentences: {
      easy: [
        { id: "s1", he: "תושבים בשכונה פתחו גינה קהילתית.", en: "Residents in the neighbourhood opened a community garden." },
        { id: "s2", he: "הם שתלו עשבי תיבול ופרחים.", en: "They planted herbs and flowers." },
        { id: "s3", he: "ילדים עוזרים להשקות את הצמחים.", en: "Children help water the plants." },
        { id: "s4", he: "השכנים נפגשים בגינה בכל יום שישי.", en: "Neighbours meet in the garden every Friday." },
      ],
      intermediate: [
        { id: "s1", he: "קבוצה של תושבים הפכה מגרש קטן לגינה קהילתית פתוחה לכל מי שגר בשכונה.", en: "A group of residents turned a small lot into a community garden open to everyone in the neighbourhood." },
        { id: "s2", he: "במקום צמחו ירקות, עשבי תיבול ופרחים, והתושבים מחלקים ביניהם את עבודת הטיפול.", en: "Vegetables, herbs, and flowers are growing there, and residents share the work of caring for them." },
        { id: "s3", he: "מארגני הגינה מקווים שהמפגשים השבועיים יחזקו את הקשרים בין שכנים ותיקים לחדשים.", en: "The garden's organisers hope the weekly meet-ups will strengthen ties between longtime and new neighbours." },
        { id: "s4", he: "כעת הם בודקים כיצד לשמור על המקום נגיש גם בשעות הערב.", en: "They are now looking at ways to keep the space accessible in the evenings too." },
      ],
    },
    vocabulary: [{ he: "קהילתית", en: "community (feminine)" }, { he: "לטפל", en: "to care for" }, { he: "שכנים", en: "neighbours" }],
    questions: [{ prompt: "What grows in the garden?", answer: "Vegetables, herbs, and flowers." }, { prompt: "What do organisers hope to strengthen?", answer: "Connections between neighbours." }],
  },
  {
    slug: "library-evenings", category: "תרבות", minutes: 3,
    date: "Saturday, September 26", titleHe: "הספרייה השכונתית תישאר פתוחה גם בערב", titleEn: "A neighbourhood library tries later hours",
    standfirst: "סיפור תרגול מקורי · לא דיווח חדשותי אמיתי",
    sentences: {
      easy: [
        { id: "s1", he: "הספרייה בשכונה תישאר פתוחה עד הערב.", en: "The neighbourhood library will stay open until the evening." },
        { id: "s2", he: "היא תנסה את השעות החדשות במשך חודש.", en: "It will try the new hours for one month." },
        { id: "s3", he: "מבקרים יוכלו לקרוא, ללמוד ולשאול ספרים.", en: "Visitors will be able to read, study, and borrow books." },
        { id: "s4", he: "הספרייה מבקשת מהמבקרים לתת משוב.", en: "The library is asking visitors to give feedback." },
      ],
      intermediate: [
        { id: "s1", he: "הספרייה העירונית בשכונת שקד תאריך את שעות הפעילות שלה במסגרת ניסוי שיימשך חודש.", en: "The municipal library in Shaked neighbourhood will extend its opening hours as part of a month-long trial." },
        { id: "s2", he: "המטרה היא לאפשר למי שעובדים במהלך היום להשתמש בחלל לקריאה וללימוד גם אחרי העבודה.", en: "The aim is to let people who work during the day use the space for reading and study after work." },
        { id: "s3", he: "מלבד השאלת ספרים, הספרייה תציע שולחנות עבודה ואזור שקט.", en: "Alongside book lending, the library will offer study tables and a quiet area." },
        { id: "s4", he: "בתום תקופת הניסיון תאסוף ההנהלה משוב ותחליט אם להמשיך במתכונת החדשה.", en: "At the end of the trial, the management will gather feedback and decide whether to continue the new schedule." },
      ],
    },
    vocabulary: [{ he: "להאריך", en: "to extend" }, { he: "שעות פעילות", en: "opening hours" }, { he: "משוב", en: "feedback" }],
    questions: [{ prompt: "How long is the trial?", answer: "One month." }, { prompt: "What will the library offer besides books?", answer: "Study tables and a quiet area." }],
  },
  {
    slug: "school-food", category: "חינוך", minutes: 2,
    date: "Saturday, September 26", titleHe: "מטבח בית־ספרי מזמין את התלמידים לתכנן תפריט", titleEn: "Students help plan a school menu",
    standfirst: "סיפור תרגול מקורי · לא דיווח חדשותי אמיתי",
    sentences: {
      easy: [
        { id: "s1", he: "תלמידים בבית ספר חדש מתכננים ארוחות.", en: "Students at a new school are planning meals." },
        { id: "s2", he: "הם בוחרים ירקות ומאכלים מהבית.", en: "They choose vegetables and foods from home." },
        { id: "s3", he: "הטבחים יכינו כמה מההצעות.", en: "The cooks will prepare some of the suggestions." },
      ],
      intermediate: [
        { id: "s1", he: "תלמידים בבית הספר עמל נחל משתתפים בבניית תפריט חדש לחדר האוכל.", en: "Students at Amal Nahal school are taking part in creating a new cafeteria menu." },
        { id: "s2", he: "הם מציעים מתכונים משפחתיים ובוחרים יחד מנות שיתאימו לטעמים שונים.", en: "They suggest family recipes and choose dishes together that suit different tastes." },
        { id: "s3", he: "צוות המטבח יכין שלוש הצעות, והתלמידים יוכלו לחוות את דעתם לאחר הארוחה.", en: "The kitchen team will prepare three suggestions, and students will be able to share their thoughts after the meal." },
      ],
    },
    vocabulary: [{ he: "תפריט", en: "menu" }, { he: "להציע", en: "to suggest" }, { he: "מתכונים", en: "recipes" }],
    questions: [{ prompt: "Who will prepare the suggestions?", answer: "The school kitchen team." }, { prompt: "How many suggestions will they prepare?", answer: "Three." }],
  },
  {
    slug: "walking-route", category: "חיים בעיר", minutes: 2,
    date: "Saturday, September 26", titleHe: "שביל הליכה חדש מחבר בין שתי שכונות", titleEn: "A walking path joins two neighbourhoods",
    standfirst: "סיפור תרגול מקורי · לא דיווח חדשותי אמיתי",
    sentences: {
      easy: [
        { id: "s1", he: "שביל חדש מחבר שתי שכונות בעיר.", en: "A new path connects two neighbourhoods in the city." },
        { id: "s2", he: "השביל עובר ליד עצים וגן שעשועים.", en: "The path passes by trees and a playground." },
        { id: "s3", he: "אנשים יכולים ללכת בו בבוקר ובערב.", en: "People can walk on it in the morning and evening." },
      ],
      intermediate: [
        { id: "s1", he: "שביל הולכי רגל חדש נפתח בין שתי שכונות שהגישה ביניהן דרשה עד כה הליכה לצד כביש ראשי.", en: "A new pedestrian path has opened between two neighbourhoods where the route previously required walking beside a main road." },
        { id: "s2", he: "לאורך השביל הוצבו ספסלים והוא עובר לצד גינות ציבוריות ובית ספר.", en: "Benches have been placed along the path, which passes public gardens and a school." },
        { id: "s3", he: "תושבים שביקרו במקום סיפרו כי כעת קל יותר לעבור ברגל בין האזורים.", en: "Residents who visited the path said it is now easier to travel on foot between the areas." },
      ],
    },
    vocabulary: [{ he: "שביל", en: "path" }, { he: "גישה", en: "access" }, { he: "לאורך", en: "along" }],
    questions: [{ prompt: "What did the route require before?", answer: "Walking next to a main road." }, { prompt: "What was added along the path?", answer: "Benches." }],
  },
];

export const STORIES: Story[] = [...importedNews as Story[], ...SAMPLE_STORIES];
export const NEWS_STORIES = STORIES.filter(story => story.source);
export const EDITION_STORIES = NEWS_STORIES.length ? NEWS_STORIES.slice(0, 5) : SAMPLE_STORIES;

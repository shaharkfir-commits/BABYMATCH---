// Seed data for the BABYMATCH babysitter marketplace demo.
// Course project — יובל סבג ונועם אלוני.
// Loaded into localStorage on first run; "איפוס דמו" wipes and reseeds.

window.BABYMATCH = {
  appName: 'BABYMATCH',
  tagline: 'אפליקציה למציאת בייביסיטר להורים לפי סינון',
  authors: ['יובל סבג', 'נועם אלוני'],
  pillars: [
    { icon: '🛡️', label: 'ביטחון',     text: 'פרופילים מאומתים ודירוגים שקופים מהורים אחרים.' },
    { icon: '⚡',  label: 'זמינות',     text: 'יומן זמינות בזמן אמת לכל בייביסיטר.' },
    { icon: '🔎', label: 'חיפוש חכם',  text: 'סינון לפי יום, שעה, גיל, ניסיון ותעריף.' },
    { icon: '💜', label: 'אחריות',     text: 'מערכת אישור/דחייה ברורה ומחויבות לשני הצדדים.' },
  ],

  mvp: {
    intro:
      'הגרסה הראשונה מתמקדת אך ורק בלולאת ההתאמה הליבתית — חיפוש, פרופיל, יומן, הזמנה ודירוג. ' +
      'זהו הצומת הקריטי: אם הוא לא יעבוד, אין משמעות לפיצ׳רים מתקדמים אחרים.',
    features: [
      { label: 'חיפוש וסינון חכם',          text: 'סינון לפי יום, שעה, גיל, ניסיון ותעריף — פותר את הקושי המרכזי שעלה במחקר: ״אין זמן לחפש״.' },
      { label: 'פרופילים עם דירוגי הורים',  text: 'ביקורות בכוכבים בונות אמון — הממצא המשמעותי ביותר מהסקר.' },
      { label: 'יומן זמינות בזמן אמת',      text: 'הבייביסיטר מסמנת זמינות, ההורה רואה רק את מה שאכן זמין — סוף לטלפונים ללא מענה.' },
      { label: 'הזמנה עם אישור/דחייה',      text: 'מאמת את ההיגיון העסקי לפני שמשקיעים בצ׳אט, תשלומים או הסכמים.' },
      { label: 'ביקורות אחרי הגיג',         text: 'סוגר את לולאת האמון — הורים בונים מוניטין לטובת ההורים הבאים.' },
    ],
    reason:
      'בחרנו דווקא בפיצ׳רים אלה כי הם המינימום הנדרש כדי לאמת את ההשערה המסוכנת ביותר בפרויקט: ' +
      '״האם הורים יסכימו לסמוך על פרופיל + ביקורות + זמינות מספיק בכדי לשלוח בקשה לבייביסיטר שאינם מכירים?״. ' +
      'יכולות נוספות (צ׳אט פנימי, תשלום באפליקציה, איתור GPS, ביטוח, בדיקת רקע פלילי) הוסרו מה-MVP בכוונה — ' +
      'כולן יקרות לפיתוח, כולן תלויות בכך שלולאת הליבה תוכיח את עצמה תחילה, וכולן ניתנות להוספה הדרגתית אחרי האימות הראשוני.',
  },

  designStyle: {
    intro:
      'סגנון רך, נגיש וידידותי — מותאם לקהל יעד מעורב: הורים עסוקים בני 30+ ובייביסיטרים בני 14–24. ' +
      'כל בחירת עיצוב נגזרת ישירות מהממצאים במחקר ומהאופי של שני הצדדים בלולאת השוק.',
    choices: [
      { label: 'פלטה סגולה רכה',           text: 'סגול משדר אמון ויצירתיות גם יחד — לא קר וקורפורטיבי כמו כחול, ולא ילדותי כמו ורוד. אמון הוא הגורם הקריטי לבחירת בייביסיטר.' },
      { label: 'כרטיסים מעוגלים וצללים',  text: 'מפחיתים תחושה ״עסקית״ — האפליקציה מרגישה קהילה, לא שוק קר.' },
      { label: 'אזורי לחיצה גדולים (44px+)', text: 'הורה עם תינוק ביד צריך להצליח במכה אחת. נגישות = פחות ביטולים, יותר הזמנות.' },
      { label: 'מובייל-פירסט במסגרת טלפון', text: '100% מקהל היעד הם משתמשי מובייל. בדסקטופ — האפליקציה במסגרת טלפון כדי להדגיש את הצורה הזו במצגת.' },
      { label: 'טיפוגרפיה Heebo',           text: 'פונט Google מותאם עברית, קריאות גבוהה במידות קטנות, תמיכה מצוינת ב-RTL.' },
      { label: 'ניווט תחתון + CTAs דביקים', text: 'דפוסים מוכרים מ-WhatsApp, Wolt, Bit — מוריד את עקומת הלמידה לאפס.' },
      { label: 'ניסוח ניטרלי מגדרית',       text: 'כל הקריאות לפעולה בצורת שם פעולה (״שמירה״, ״שליחת בקשה״) — מתאים לבייביסיטרים מכל המגדרים ולהורים מכל המגדרים.' },
    ],
  },
};

window.BABYMATCH_CONST = {
  DAYS: [
    { id: 'sun', label: 'א׳', full: 'ראשון' },
    { id: 'mon', label: 'ב׳', full: 'שני' },
    { id: 'tue', label: 'ג׳', full: 'שלישי' },
    { id: 'wed', label: 'ד׳', full: 'רביעי' },
    { id: 'thu', label: 'ה׳', full: 'חמישי' },
    { id: 'fri', label: 'ו׳', full: 'שישי' },
    { id: 'sat', label: 'ש׳', full: 'שבת' },
  ],
  BLOCKS: [
    { id: 'morning',   label: 'בוקר',   range: '08:00–12:00', start: 8,  end: 12 },
    { id: 'noon',      label: 'צהריים', range: '12:00–15:00', start: 12, end: 15 },
    { id: 'afternoon', label: 'אחה״צ',  range: '15:00–18:00', start: 15, end: 18 },
    { id: 'evening',   label: 'ערב',    range: '18:00–22:00', start: 18, end: 22 },
    { id: 'night',     label: 'לילה',   range: '22:00–24:00', start: 22, end: 24 },
  ],
};

window.SEED = {
  currentUser: {
    role: 'parent',
    parentId: 'p_orital',
    sitterId: 's_maya',
  },

  parents: [
    {
      id: 'p_orital',
      name: 'אוריטל לוי',
      neighborhood: 'רמת השרון',
      childrenAges: [4, 7],
      notes: 'אמא לשניים, עובדת בהייטק. צריכה בייביסיטר אמינה לערבים ולשישי בבוקר.',
      color: '#6C5CE7',
    },
    {
      id: 'p_dana',
      name: 'דנה ברק',
      neighborhood: 'הרצליה',
      childrenAges: [2],
      notes: '',
      color: '#F59E0B',
    },
    {
      id: 'p_noa',
      name: 'נועה פרידמן',
      neighborhood: 'תל אביב',
      childrenAges: [5, 9],
      notes: '',
      color: '#10B981',
    },
  ],

  babysitters: [
    {
      id: 's_maya',
      name: 'מאיה כהן',
      age: 17,
      color: '#FF8FA3',
      experienceYears: 2,
      hourlyRate: 45,
      neighborhood: 'רמת השרון',
      bio: 'תלמידת י״א, אוהבת ילדים ומשחקים יצירתיים. ניסיון עם גילאי 3–10.',
      availability: {
        sun: ['evening'],
        mon: ['evening', 'night'],
        tue: ['evening'],
        wed: [],
        thu: ['evening', 'night'],
        fri: ['morning', 'noon'],
        sat: ['noon', 'afternoon', 'evening'],
      },
      reviews: [
        { parentName: 'נועה פרידמן', rating: 5, text: 'מאיה פשוט מהממת! הילדים שלי ביקשו שתחזור שוב.', date: '2026-04-12' },
        { parentName: 'דנה ברק',     rating: 5, text: 'אמינה, אחראית, ובאה תמיד בזמן.',                date: '2026-03-28' },
        { parentName: 'מיכל אבני',   rating: 4, text: 'יחס חם לילדים, ממליצה בחום.',                   date: '2026-02-17' },
      ],
    },
    {
      id: 's_shira',
      name: 'שירה לביא',
      age: 19,
      color: '#8B5CF6',
      experienceYears: 4,
      hourlyRate: 60,
      neighborhood: 'רמת השרון',
      bio: 'סטודנטית לחינוך, מדריכה בתנועת נוער. אוהבת לקרוא סיפורים ולהפעיל יצירה.',
      availability: {
        sun: ['afternoon', 'evening'],
        mon: ['afternoon', 'evening'],
        tue: [],
        wed: ['afternoon', 'evening', 'night'],
        thu: ['evening', 'night'],
        fri: ['morning'],
        sat: ['evening'],
      },
      reviews: [
        { parentName: 'אוריטל לוי',   rating: 5, text: 'שירה מקצועית ברמות. הילדים אהבו את היצירות שעשו יחד.', date: '2026-05-02' },
        { parentName: 'נועה פרידמן',  rating: 5, text: 'הגיעה מוכנה עם פעילויות, פשוט תענוג.',                   date: '2026-04-19' },
        { parentName: 'דנה ברק',      rating: 4, text: 'בייביסיטר מעולה, רק קצת יקרה.',                            date: '2026-03-08' },
        { parentName: 'תמר אלון',     rating: 5, text: 'ממש בייביסיטר חלום!',                                       date: '2026-01-30' },
      ],
    },
    {
      id: 's_tal',
      name: 'טל אברהמי',
      age: 22,
      color: '#0EA5E9',
      experienceYears: 6,
      hourlyRate: 70,
      neighborhood: 'הרצליה',
      bio: 'סטודנט לפסיכולוגיה. מתמחה בילדים עם צרכים מיוחדים, סבלני וגמיש.',
      availability: {
        sun: ['morning', 'noon', 'afternoon'],
        mon: ['morning', 'noon', 'afternoon'],
        tue: ['evening', 'night'],
        wed: ['evening', 'night'],
        thu: ['evening'],
        fri: [],
        sat: ['afternoon', 'evening'],
      },
      reviews: [
        { parentName: 'דנה ברק',      rating: 5, text: 'טל יודע להתמודד עם כל סיטואציה. סומכת עליו במאה אחוז.', date: '2026-05-14' },
        { parentName: 'אוריטל לוי',   rating: 5, text: 'מקצועי ורגוע, ענק עם ילדים.',                              date: '2026-04-06' },
        { parentName: 'נועה פרידמן',  rating: 4, text: 'הילדים נהנו, מומלץ.',                                       date: '2026-02-22' },
      ],
    },
    {
      id: 's_yael',
      name: 'יעל מזרחי',
      age: 16,
      color: '#F97316',
      experienceYears: 1,
      hourlyRate: 35,
      neighborhood: 'רמת השרון',
      bio: 'תלמידת י׳, מתחילה בעולם הבייביסיטר. אחות גדולה לשלושה אחים קטנים.',
      availability: {
        sun: ['evening'],
        mon: [],
        tue: ['afternoon', 'evening'],
        wed: ['evening'],
        thu: ['afternoon'],
        fri: ['morning', 'noon'],
        sat: ['noon', 'afternoon'],
      },
      reviews: [
        { parentName: 'אוריטל לוי',   rating: 4, text: 'נחמדה מאוד והילדים אהבו אותה.', date: '2026-05-10' },
        { parentName: 'מיכל אבני',    rating: 4, text: 'התחלה טובה, ממליצה לתת לה צ׳אנס.', date: '2026-04-25' },
      ],
    },
    {
      id: 's_noam',
      name: 'נועם הראל',
      age: 24,
      color: '#10B981',
      experienceYears: 8,
      hourlyRate: 85,
      neighborhood: 'תל אביב',
      bio: 'מורה לחינוך מיוחד. מנוסה עם תינוקות ופעוטות. עזרת ראשונה בתוקף.',
      availability: {
        sun: ['morning', 'noon'],
        mon: ['morning', 'noon'],
        tue: ['evening'],
        wed: ['evening', 'night'],
        thu: ['evening', 'night'],
        fri: ['morning'],
        sat: ['noon', 'afternoon', 'evening'],
      },
      reviews: [
        { parentName: 'נועה פרידמן',  rating: 5, text: 'נועם פשוט הציל אותנו בלילה אחד עם תינוקת חולה. תודה!', date: '2026-05-21' },
        { parentName: 'דנה ברק',      rating: 5, text: 'יקרה אבל שווה כל שקל. ניסיון אמיתי ניכר.',                date: '2026-04-30' },
        { parentName: 'אוריטל לוי',   rating: 5, text: 'מקצועי ברמה אחרת.',                                         date: '2026-03-14' },
        { parentName: 'תמר אלון',     rating: 5, text: 'סומכת עליו בעיניים עצומות.',                                date: '2026-02-02' },
      ],
    },
    {
      id: 's_roni',
      name: 'רוני שמש',
      age: 18,
      color: '#EC4899',
      experienceYears: 3,
      hourlyRate: 50,
      neighborhood: 'הרצליה',
      bio: 'אחרי צבא קצר, אוהבת ספורט ושעות בחוץ עם הילדים. רישיון נהיגה.',
      availability: {
        sun: ['afternoon', 'evening'],
        mon: ['afternoon', 'evening'],
        tue: ['afternoon', 'evening'],
        wed: [],
        thu: ['afternoon', 'evening'],
        fri: ['morning', 'noon'],
        sat: [],
      },
      reviews: [
        { parentName: 'דנה ברק',      rating: 4, text: 'לקחה את הילד לפארק, חזר עייף ומאושר.', date: '2026-05-05' },
        { parentName: 'אוריטל לוי',   rating: 5, text: 'אנרגיה צעירה ויחס נהדר.',                date: '2026-04-15' },
        { parentName: 'נועה פרידמן',  rating: 4, text: 'אמינה ונעימה.',                          date: '2026-03-22' },
      ],
    },
  ],

  // Built dynamically so dates are always relative to "today" when the demo runs.
  requestsBuilder: function () {
    const today = new Date();
    const addDays = (n) => {
      const d = new Date(today);
      d.setDate(d.getDate() + n);
      return d.toISOString().slice(0, 10);
    };
    return [
      { id: 'r1', parentId: 'p_dana',   sitterId: 's_maya', dateISO: addDays(2),  blockId: 'evening', status: 'pending',  note: 'ילד בן 2, הולך לישון ב-20:00.', createdAt: addDays(-1) },
      { id: 'r2', parentId: 'p_noa',    sitterId: 's_maya', dateISO: addDays(5),  blockId: 'evening', status: 'pending',  note: '',                                createdAt: addDays(-2) },
      { id: 'r3', parentId: 'p_orital', sitterId: 's_shira',dateISO: addDays(-7), blockId: 'evening', status: 'accepted', note: '',                                createdAt: addDays(-14) },
      { id: 'r4', parentId: 'p_orital', sitterId: 's_noam', dateISO: addDays(-3), blockId: 'evening', status: 'accepted', note: '',                                createdAt: addDays(-10) },
      { id: 'r5', parentId: 'p_orital', sitterId: 's_tal',  dateISO: addDays(3),  blockId: 'evening', status: 'pending',  note: 'ערב יום הולדת לחבר.',              createdAt: addDays(0)  },
    ];
  },
};

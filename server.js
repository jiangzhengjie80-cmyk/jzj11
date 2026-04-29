const http = require("node:http");
const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 4194);
const DATA_DIR = path.join(ROOT, "data");
const POSTER_DIR = path.join(ROOT, "assets", "posters");
const COLLECTION_FILE = path.join(DATA_DIR, "collection.json");
const USER_AGENT = "CinemaShelfLocal/1.0 (personal local movie collection)";
const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const WIKIDATA_SPARQL = "https://query.wikidata.org/sparql";
const IMDB_SUGGESTION_ROOT = "https://v2.sg.media-imdb.com/suggestion";
const CINEMETA_ROOT = "https://v3-cinemeta.strem.io";
const DOUBAN_SUGGEST = "https://movie.douban.com/j/subject_suggest";
const JSON_CACHE_TTL = 1000 * 60 * 60 * 12;
const SHORT_CACHE_TTL = 1000 * 60 * 10;
const FAST_TIMEOUT_MS = 4500;
const SPARQL_TIMEOUT_MS = 5500;
const memoryCache = new Map();
const inflightRequests = new Map();

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const DIRECTOR_COLORS = {
  "王家卫": "#bd3830",
  "Wong Kar-Wai": "#bd3830",
  "Wong Kar Wai": "#bd3830",
  "昆汀·塔伦蒂诺": "#c0862d",
  "Quentin Tarantino": "#c0862d",
  "斯坦利·库布里克": "#2b5f9c",
  "Stanley Kubrick": "#2b5f9c",
};

const DIRECTOR_ALIASES = {
  "王家卫": "Wong Kar Wai",
  "王家衛": "Wong Kar Wai",
  "昆丁": "Quentin Tarantino",
  "昆汀": "Quentin Tarantino",
  "昆汀·塔伦蒂诺": "Quentin Tarantino",
  "昆汀塔伦蒂诺": "Quentin Tarantino",
  "库布里克": "Stanley Kubrick",
  "庫布里克": "Stanley Kubrick",
  "斯坦利·库布里克": "Stanley Kubrick",
  "斯坦利库布里克": "Stanley Kubrick",
};

const DIRECTOR_ZH_NAMES = {
  "Wong Kar Wai": "王家卫",
  "Wong Kar-Wai": "王家卫",
  "Quentin Tarantino": "昆汀·塔伦蒂诺",
  "Stanley Kubrick": "斯坦利·库布里克",
  "Christopher Nolan": "克里斯托弗·诺兰",
  "Martin Scorsese": "马丁·斯科塞斯",
  "Hayao Miyazaki": "宫崎骏",
  "Bong Joon Ho": "奉俊昊",
  "Bong Joon-ho": "奉俊昊",
  "Denis Villeneuve": "丹尼斯·维伦纽瓦",
  "David Fincher": "大卫·芬奇",
  "Francis Ford Coppola": "弗朗西斯·福特·科波拉",
  "Ridley Scott": "雷德利·斯科特",
  "Steven Spielberg": "史蒂文·斯皮尔伯格",
  "James Cameron": "詹姆斯·卡梅隆",
  "Ang Lee": "李安",
  "Zhang Yimou": "张艺谋",
  "Chen Kaige": "陈凯歌",
  "Jia Zhangke": "贾樟柯",
  "Hirokazu Koreeda": "是枝裕和",
  "Akira Kurosawa": "黑泽明",
  "Park Chan-wook": "朴赞郁",
  "Lee Chang-dong": "李沧东",
  "Yorgos Lanthimos": "欧格斯·兰斯莫斯",
  "Pedro Almodóvar": "佩德罗·阿莫多瓦",
  "Alfonso Cuarón": "阿方索·卡隆",
  "Guillermo del Toro": "吉尔莫·德尔·托罗",
  "Claire Denis": "克莱尔·德尼",
  "Jane Campion": "简·坎皮恩",
  "Greta Gerwig": "格蕾塔·葛韦格",
  "Sofia Coppola": "索菲亚·科波拉",
  "Hou Hsiao-hsien": "侯孝贤",
  "Edward Yang": "杨德昌",
  "Tsai Ming-liang": "蔡明亮",
  "Leos Carax": "莱奥·卡拉克斯",
  "Michel Gondry": "米歇尔·贡德里",
  "Michael Henry Wilson": "迈克尔·亨利·威尔逊",
  "Jae-eun Jeong": "郑在恩",
  "Park Jin-Pyo": "朴珍杓",
  "Fruit Chan": "陈果",
  "Takashi Miike": "三池崇史",
  "David Lynch": "大卫·林奇",
  "Paul Thomas Anderson": "保罗·托马斯·安德森",
  "Alfred Hitchcock": "阿尔弗雷德·希区柯克",
  "Frank Darabont": "弗兰克·德拉邦特",
  "Robert Zemeckis": "罗伯特·泽米吉斯",
  "Peter Jackson": "彼得·杰克逊",
  "Luc Besson": "吕克·贝松",
  "Jonathan Demme": "乔纳森·戴米",
  "Roberto Benigni": "罗伯托·贝尼尼",
  "Lana Wachowski": "拉娜·沃卓斯基",
  "Lilly Wachowski": "莉莉·沃卓斯基",
  "Andrew Stanton": "安德鲁·斯坦顿",
  "Rajkumar Hirani": "拉库马·希拉尼",
  "Oliver Hirschbiegel": "奥利弗·希施比格尔",
  "Roger Allers": "罗杰·阿勒斯",
  "Rob Minkoff": "罗伯·明可夫",
  "Richard Kelly": "理查德·凯利",
};

const COUNTRY_ZH = {
  Austria: "奥地利",
  Australia: "澳大利亚",
  Belgium: "比利时",
  Canada: "加拿大",
  China: "中国",
  Denmark: "丹麦",
  France: "法国",
  Germany: "德国",
  HongKong: "中国香港",
  "Hong Kong": "中国香港",
  India: "印度",
  Ireland: "爱尔兰",
  Italy: "意大利",
  Japan: "日本",
  Mexico: "墨西哥",
  Netherlands: "荷兰",
  Norway: "挪威",
  Poland: "波兰",
  "South Korea": "韩国",
  Spain: "西班牙",
  Sweden: "瑞典",
  Taiwan: "中国台湾",
  UK: "英国",
  "United Kingdom": "英国",
  USA: "美国",
  "United States": "美国",
};

const KNOWN_MOVIE_TITLES_BY_IMDB = {
  tt0096461: "旺角卡门",
  tt0101258: "阿飞正传",
  tt0109424: "重庆森林",
  tt0109688: "东邪西毒",
  tt0112913: "堕落天使",
  tt0118845: "春光乍泄",
  tt0118694: "花样年华",
  tt0765120: "蓝莓之夜",
  tt1462900: "一代宗师",
  tt0103644: "异形3",
  tt0110912: "低俗小说",
  tt0114369: "七宗罪",
  tt0119174: "心理游戏",
  tt0137523: "搏击俱乐部",
  tt0258000: "战栗空间",
  tt0443706: "十二宫",
  tt0421715: "本杰明·巴顿奇事",
  tt1285016: "社交网络",
  tt1568346: "龙纹身的女孩",
  tt2267998: "消失的爱人",
  tt10618286: "曼克",
  tt1136617: "杀手",
  tt0105236: "落水狗",
  tt1028528: "金刚不坏",
  tt0119396: "危险关系",
  tt0266697: "杀死比尔1",
  tt0378194: "杀死比尔2",
  tt0361748: "无耻混蛋",
  tt1853728: "被解救的姜戈",
  tt3460252: "八恶人",
  tt7131622: "好莱坞往事",
  tt0062622: "2001太空漫游",
  tt0066921: "发条橙",
  tt0081505: "闪灵",
  tt0093058: "全金属外壳",
  tt0120663: "大开眼戒",
  tt0269743: "绑架门口狗",
  tt0353969: "杀人回忆",
  tt0468492: "汉江怪物",
  tt0976060: "东京！",
  tt1216496: "母亲",
  tt1706620: "雪国列车",
  tt3967856: "玉子",
  tt6751668: "寄生虫",
  tt12299608: "米奇17",
  tt3413658: "纽约市：熔点",
  tt0045758: "恐惧与欲望",
  tt0048254: "杀手之吻",
  tt0049406: "杀手",
  tt0050825: "光荣之路",
  tt0054331: "斯巴达克斯",
  tt0056193: "洛丽塔",
  tt0057012: "奇爱博士",
  tt0072684: "巴里·林登",
  tt0061402: "大剃须",
  tt0063803: "谁在敲我的门",
  tt0070379: "穷街陋巷",
  tt0071680: "意大利裔美国人",
  tt0076451: "纽约，纽约",
  tt0077157: "美国男孩：史蒂文·普林斯侧写",
  tt0077838: "最后的华尔兹",
  tt0081398: "愤怒的公牛",
  tt0099685: "好家伙",
  tt0106226: "纯真年代",
  tt0112120: "马丁·斯科塞斯的美国电影之旅",
  tt0112641: "赌城风云",
  tt0173772: "我的意大利电影之旅",
  tt9577852: "滚雷巡演：鲍勃·迪伦传奇",
  tt35891507: "未定名夏威夷黑帮片",
  tt0156248: "八月三十二日，在地球上",
  tt0220627: "迷情漩涡",
  tt1194238: "理工学院",
  tt1255953: "焦土之城",
  tt1392214: "囚徒",
  tt2316411: "宿敌",
  tt3397884: "边境杀手",
  tt2543164: "降临",
  tt1856101: "银翼杀手2049",
  tt1160419: "沙丘",
  tt15239678: "沙丘2",
  tt0134933: "与拉玛相会",
  tt31378509: "沙丘3",
  tt0079833: "鲁邦三世：卡里奥斯特罗城",
  tt0087544: "风之谷",
  tt0462699: "未来少年柯南：巨大机毒蛾号的复活",
  tt0092067: "天空之城",
  tt0096283: "龙猫",
  tt0097814: "魔女宅急便",
  tt0104652: "红猪",
  tt0119698: "幽灵公主",
  tt0245429: "千与千寻",
  tt0347149: "哈尔的移动城堡",
  tt0876563: "崖上的波妞",
  tt2013293: "起风了",
  tt8055182: "你想活出怎样的人生",
  tt6587046: "你想活出怎样的人生",
  tt36348878: "未定名宫崎骏电影",
  tt0471369: "三人组",
  tt0260991: "共同警备区",
  tt0310775: "我要复仇",
  tt0364569: "老男孩",
  tt0391539: "假如你是我",
  tt0420251: "三更2",
  tt0451094: "亲切的金子",
  tt0497137: "机器人之恋",
  tt0762073: "蝙蝠",
  tt1682180: "斯托克",
  tt4016934: "小姐",
  tt12477480: "分手的决心",
  tt1527793: "别无选择",
  tt0074486: "橡皮头",
  tt0080678: "象人",
  tt0087182: "沙丘",
  tt0090756: "蓝丝绒",
  tt0100935: "我心狂野",
  tt0105665: "双峰：与火同行",
  tt0116922: "妖夜慌踪",
  tt1619856: "穆赫兰道",
  tt0166924: "穆赫兰道",
  tt0357173: "大卫·林奇短片集",
  tt0306714: "黑暗房间",
  tt0460829: "内陆帝国",
  tt1230552: "更多发生的事情",
  tt2061818: "三段短片",
  tt14198084: "大卫·林奇6部短片",
  tt11644096: "杰克做了什么？",
  tt0126838: "绿鱼",
  tt0247613: "薄荷糖",
  tt0320193: "绿洲",
  tt0817225: "密阳",
  tt1287878: "诗",
  tt7282468: "燃烧",
  tt0119256: "赌城纵横",
  tt0118749: "不羁夜",
  tt0175880: "木兰花",
  tt0272338: "私恋失调",
  tt0469494: "血色将至",
  tt1560747: "大师",
  tt1791528: "性本恶",
  tt5776858: "魅影缝匠",
  tt11271038: "甘草披萨",
  tt30144839: "一战再战",
  tt0212712: "2046",
  tt0018328: "房客",
  tt0018756: "农夫的妻子",
  tt0019702: "敲诈",
  tt0021165: "谋杀",
  tt0022395: "奇怪富翁",
  tt0023285: "十七号",
  tt0032976: "蝴蝶梦",
  tt0038109: "爱德华大夫",
  tt0038787: "美人计",
  tt0040746: "夺魂索",
  tt0045897: "忏情记",
  tt0047396: "后窗",
  tt0046912: "电话谋杀案",
  tt0048728: "捉贼记",
  tt0052357: "迷魂记",
  tt0053125: "西北偏北",
  tt0054215: "惊魂记",
  tt0056869: "群鸟",
  tt0058329: "艳贼",
  tt0068611: "狂凶记",
  tt0111161: "肖申克的救赎",
  tt0068646: "教父",
  tt0109830: "阿甘正传",
  tt0133093: "黑客帝国",
  tt0120737: "指环王：护戒使者",
  tt0108052: "辛德勒的名单",
  tt0154506: "追随",
  tt0411302: "蚁蛉",
  tt0372784: "蝙蝠侠：侠影之谜",
  tt0468569: "蝙蝠侠：黑暗骑士",
  tt1345836: "蝙蝠侠：黑暗骑士崛起",
  tt5013056: "敦刻尔克",
  tt15398776: "奥本海默",
  tt33764258: "奥德赛",
  tt1375666: "盗梦空间",
  tt0816692: "星际穿越",
  tt0120815: "拯救大兵瑞恩",
  tt0167260: "指环王：王者归来",
  tt0110413: "这个杀手不太冷",
  tt0102926: "沉默的羔羊",
  tt0120689: "绿色奇迹",
  tt0118799: "美丽人生",
  tt0209144: "记忆碎片",
  tt0088763: "回到未来",
  tt0110357: "狮子王",
  tt0246578: "死亡幻觉",
  tt0338013: "暖暖内含光",
  tt0407887: "无间道风云",
  tt0482571: "致命魔术",
  tt1187043: "三傻大闹宝莱坞",
  tt0910970: "机器人总动员",
  tt0457430: "潘神的迷宫",
  tt0363163: "帝国的毁灭",
};

const SPOTLIGHT_MOVIE_POOL = [
  "tt0111161",
  "tt0068646",
  "tt0109830",
  "tt0133093",
  "tt0120737",
  "tt0108052",
  "tt1375666",
  "tt0816692",
  "tt0120815",
  "tt0167260",
  "tt0110413",
  "tt0102926",
  "tt0120689",
  "tt0118799",
  "tt0209144",
  "tt0088763",
  "tt0110357",
  "tt0246578",
  "tt0338013",
  "tt0407887",
  "tt0482571",
  "tt1187043",
  "tt0910970",
  "tt0457430",
  "tt0363163",
];

const KNOWN_DIRECTOR_AVATARS = {
  "王家卫": "https://m.media-amazon.com/images/M/MV5BMTY4MTQyMjI4NV5BMl5BanBnXkFtZTcwNDk2MzQ2MQ@@._V1_.jpg",
  "昆汀·塔伦蒂诺": "https://m.media-amazon.com/images/M/MV5BMTgyMjI3ODA3Nl5BMl5BanBnXkFtZTcwNzY2MDYxOQ@@._V1_.jpg",
  "斯坦利·库布里克": "https://m.media-amazon.com/images/M/MV5BMDZlOGFiZmYtZDRmZi00M2RkLTg1MDgtYjUwYjJiYmNiZjhmXkEyXkFqcGc@._V1_.jpg",
  "大卫·芬奇": "https://m.media-amazon.com/images/M/MV5BMTc1NDkwMTQ2MF5BMl5BanBnXkFtZTcwMzY0ODkyMg@@._V1_.jpg",
  "奉俊昊": "https://m.media-amazon.com/images/M/MV5BYmZhZTY3ZGEtOTA1ZC00ODcwLTg2ZjMtODViNzIwNzAxMDVmXkEyXkFqcGc@._V1_.jpg",
  "莱奥·卡拉克斯": "https://m.media-amazon.com/images/M/MV5BMTQ5MDM3NDIxOF5BMl5BanBnXkFtZTcwOTEyNzA4Nw@@._V1_.jpg",
  "米歇尔·贡德里": "https://m.media-amazon.com/images/M/MV5BMjEwNDg3MDA1MF5BMl5BanBnXkFtZTcwMDAxMzc1MQ@@._V1_.jpg",
  "马丁·斯科塞斯": "https://m.media-amazon.com/images/M/MV5BMTcyNDA4Nzk3N15BMl5BanBnXkFtZTcwNDYzMjMxMw@@._V1_.jpg",
  "丹尼斯·维伦纽瓦": "https://m.media-amazon.com/images/M/MV5BMzU2MDk5MDI2MF5BMl5BanBnXkFtZTcwNDkwMjMzNA@@._V1_.jpg",
  "宫崎骏": "https://m.media-amazon.com/images/M/MV5BMjcyNjk2OTkwNF5BMl5BanBnXkFtZTcwOTk0MTQ3Mg@@._V1_.jpg",
  "朴赞郁": "https://m.media-amazon.com/images/M/MV5BMTgyODk3MTU5OV5BMl5BanBnXkFtZTcwMTc3NjcyMQ@@._V1_.jpg",
  "陈果": "https://m.media-amazon.com/images/M/MV5BMzA2ZmQ5MmYtYzRlNC00OTMxLWIxOGEtZTE2ZjY0NjdlZDEyXkEyXkFqcGc@._V1_.jpg",
  "三池崇史": "https://m.media-amazon.com/images/M/MV5BMjI0NTI3NTg1OF5BMl5BanBnXkFtZTcwODU4NDE0NA@@._V1_.jpg",
  "大卫·林奇": "https://m.media-amazon.com/images/M/MV5BMTQ1MTY2MTY2Nl5BMl5BanBnXkFtZTcwMDg1ODYwNA@@._V1_.jpg",
  "李沧东": "https://m.media-amazon.com/images/M/MV5BMTc5NjIwOTc0MV5BMl5BanBnXkFtZTcwMzQ2Mzc3NA@@._V1_.jpg",
  "保罗·托马斯·安德森": "https://m.media-amazon.com/images/M/MV5BMTQwNjc5NjY2NV5BMl5BanBnXkFtZTcwNDIxMzg1MQ@@._V1_.jpg",
  "阿尔弗雷德·希区柯克": "https://m.media-amazon.com/images/M/MV5BMjNjZDM0NGUtZmE0Yy00MTI3LThkNTYtODVlZTUzM2M4Yjk5XkEyXkFqcGc@._V1_.jpg",
};

const DIRECTOR_POOL = [
  { label: "王家卫", searchName: "Wong Kar Wai", description: "香港作者电影与都市爱情", accent: "#bd3830" },
  { label: "张艺谋", searchName: "Zhang Yimou", description: "色彩、历史与民间史诗", accent: "#8f3f35" },
  { label: "陈凯歌", searchName: "Chen Kaige", description: "时代记忆与戏剧张力", accent: "#695f3b" },
  { label: "贾樟柯", searchName: "Jia Zhangke", description: "现实切片与时代流动", accent: "#19735f" },
  { label: "李安", searchName: "Ang Lee", description: "东西方情感与类型跨越", accent: "#2f7f8f" },
  { label: "侯孝贤", searchName: "Hou Hsiao-hsien", description: "长镜头、记忆与历史", accent: "#5c668f" },
  { label: "杨德昌", searchName: "Edward Yang", description: "都市生活与现代焦虑", accent: "#2b5f9c" },
  { label: "蔡明亮", searchName: "Tsai Ming-liang", description: "孤独、空间与凝视", accent: "#4f5b4d" },
  { label: "黑泽明", searchName: "Akira Kurosawa", description: "武士叙事与人性史诗", accent: "#2b5f9c" },
  { label: "宫崎骏", searchName: "Hayao Miyazaki", description: "飞行、自然与温柔冒险", accent: "#2f7f8f" },
  { label: "是枝裕和", searchName: "Hirokazu Koreeda", description: "家庭关系与温柔现实", accent: "#19735f" },
  { label: "奉俊昊", searchName: "Bong Joon-ho", description: "阶层寓言与类型混合", accent: "#695f3b" },
  { label: "朴赞郁", searchName: "Park Chan-wook", description: "复仇美学与精密影像", accent: "#8f3f35" },
  { label: "李沧东", searchName: "Lee Chang-dong", description: "文学性、创痛与社会现实", accent: "#c0862d" },
  { label: "克里斯托弗·诺兰", searchName: "Christopher Nolan", description: "时间谜题与大银幕奇观", accent: "#19735f" },
  { label: "马丁·斯科塞斯", searchName: "Martin Scorsese", description: "犯罪、信仰与纽约街头", accent: "#8f3f35" },
  { label: "史蒂文·斯皮尔伯格", searchName: "Steven Spielberg", description: "冒险、童心与工业叙事", accent: "#2b5f9c" },
  { label: "雷德利·斯科特", searchName: "Ridley Scott", description: "科幻视觉与史诗质感", accent: "#5c668f" },
  { label: "詹姆斯·卡梅隆", searchName: "James Cameron", description: "技术革新与动作奇观", accent: "#2f7f8f" },
  { label: "大卫·芬奇", searchName: "David Fincher", description: "冷峻悬疑与精准控制", accent: "#4f5b4d" },
  { label: "丹尼斯·维伦纽瓦", searchName: "Denis Villeneuve", description: "沉浸科幻与宏大孤独", accent: "#5c668f" },
  { label: "佩德罗·阿莫多瓦", searchName: "Pedro Almodóvar", description: "欲望、色彩与女性命运", accent: "#bd3830" },
  { label: "阿方索·卡隆", searchName: "Alfonso Cuarón", description: "长镜调度与类型革新", accent: "#2b5f9c" },
  { label: "吉尔莫·德尔·托罗", searchName: "Guillermo del Toro", description: "怪奇童话与暗黑浪漫", accent: "#695f3b" },
  { label: "欧格斯·兰斯莫斯", searchName: "Yorgos Lanthimos", description: "荒诞秩序与冷幽默", accent: "#4f5b4d" },
  { label: "克莱尔·德尼", searchName: "Claire Denis", description: "身体、欲望与殖民记忆", accent: "#8f3f35" },
  { label: "简·坎皮恩", searchName: "Jane Campion", description: "女性经验与心理深处", accent: "#2f7f8f" },
  { label: "格蕾塔·葛韦格", searchName: "Greta Gerwig", description: "成长叙事与当代女性书写", accent: "#c0862d" },
  { label: "索菲亚·科波拉", searchName: "Sofia Coppola", description: "青春、疏离与精致情绪", accent: "#5c668f" },
];

const GENRE_ZH = {
  Action: "动作",
  Adventure: "冒险",
  Animation: "动画",
  Biography: "传记",
  Comedy: "喜剧",
  Crime: "犯罪",
  Documentary: "纪录片",
  Drama: "剧情",
  Family: "家庭",
  Fantasy: "奇幻",
  History: "历史",
  Horror: "恐怖",
  Music: "音乐",
  Musical: "歌舞",
  Mystery: "悬疑",
  Romance: "爱情",
  "Sci-Fi": "科幻",
  ScienceFiction: "科幻",
  Short: "短片",
  Sport: "运动",
  Thriller: "惊悚",
  War: "战争",
  Western: "西部",
};

const SEED_MOVIES = [
  seedMovie("as-tears-go-by", "旺角卡门", "As Tears Go By", 1988, "王家卫", ["犯罪", "爱情"], "tt0096461"),
  seedMovie("days-of-being-wild", "阿飞正传", "Days of Being Wild", 1990, "王家卫", ["剧情", "爱情"], "tt0101258"),
  seedMovie("chungking-express", "重庆森林", "Chungking Express", 1994, "王家卫", ["爱情", "都市"], "tt0109424"),
  seedMovie("ashes-of-time", "东邪西毒", "Ashes of Time", 1994, "王家卫", ["武侠", "剧情"], "tt0109688"),
  seedMovie("fallen-angels", "堕落天使", "Fallen Angels", 1995, "王家卫", ["犯罪", "爱情"], "tt0112913"),
  seedMovie("happy-together", "春光乍泄", "Happy Together", 1997, "王家卫", ["剧情", "爱情"], "tt0118845"),
  seedMovie("in-the-mood-for-love", "花样年华", "In the Mood for Love", 2000, "王家卫", ["爱情", "剧情"], "tt0118694"),
  seedMovie("2046", "2046", "2046", 2004, "王家卫", ["爱情", "科幻"], "tt0212712"),
  seedMovie("my-blueberry-nights", "蓝莓之夜", "My Blueberry Nights", 2007, "王家卫", ["爱情", "公路"], "tt0765120"),
  seedMovie("the-grandmaster", "一代宗师", "The Grandmaster", 2013, "王家卫", ["武侠", "传记"], "tt1462900"),
  seedMovie("reservoir-dogs", "落水狗", "Reservoir Dogs", 1992, "昆汀·塔伦蒂诺", ["犯罪", "惊悚"], "tt0105236"),
  seedMovie("pulp-fiction", "低俗小说", "Pulp Fiction", 1994, "昆汀·塔伦蒂诺", ["犯罪", "黑色幽默"], "tt0110912"),
  seedMovie("jackie-brown", "危险关系", "Jackie Brown", 1997, "昆汀·塔伦蒂诺", ["犯罪", "剧情"], "tt0119396"),
  seedMovie("kill-bill-vol-1", "杀死比尔1", "Kill Bill: Vol. 1", 2003, "昆汀·塔伦蒂诺", ["动作", "复仇"], "tt0266697"),
  seedMovie("kill-bill-vol-2", "杀死比尔2", "Kill Bill: Vol. 2", 2004, "昆汀·塔伦蒂诺", ["动作", "复仇"], "tt0378194"),
  seedMovie("death-proof", "金刚不坏", "Death Proof", 2007, "昆汀·塔伦蒂诺", ["惊悚", "剥削片"], "tt1028528"),
  seedMovie("inglourious-basterds", "无耻混蛋", "Inglourious Basterds", 2009, "昆汀·塔伦蒂诺", ["战争", "黑色幽默"], "tt0361748"),
  seedMovie("django-unchained", "被解救的姜戈", "Django Unchained", 2012, "昆汀·塔伦蒂诺", ["西部", "动作"], "tt1853728"),
  seedMovie("the-hateful-eight", "八恶人", "The Hateful Eight", 2015, "昆汀·塔伦蒂诺", ["西部", "悬疑"], "tt3460252"),
  seedMovie("once-upon-a-time-in-hollywood", "好莱坞往事", "Once Upon a Time in Hollywood", 2019, "昆汀·塔伦蒂诺", ["剧情", "喜剧"], "tt7131622"),
  seedMovie("fear-and-desire", "恐惧与欲望", "Fear and Desire", 1953, "斯坦利·库布里克", ["战争", "剧情"], "tt0045758"),
  seedMovie("killers-kiss", "杀手之吻", "Killer's Kiss", 1955, "斯坦利·库布里克", ["黑色电影", "犯罪"], "tt0048254"),
  seedMovie("the-killing", "杀手", "The Killing", 1956, "斯坦利·库布里克", ["犯罪", "黑色电影"], "tt0049406"),
  seedMovie("paths-of-glory", "光荣之路", "Paths of Glory", 1957, "斯坦利·库布里克", ["战争", "剧情"], "tt0050825"),
  seedMovie("spartacus", "斯巴达克斯", "Spartacus", 1960, "斯坦利·库布里克", ["史诗", "传记"], "tt0054331"),
  seedMovie("lolita", "洛丽塔", "Lolita", 1962, "斯坦利·库布里克", ["剧情", "黑色幽默"], "tt0056193"),
  seedMovie("dr-strangelove", "奇爱博士", "Dr. Strangelove", 1964, "斯坦利·库布里克", ["讽刺", "战争"], "tt0057012"),
  seedMovie("2001-a-space-odyssey", "2001太空漫游", "2001: A Space Odyssey", 1968, "斯坦利·库布里克", ["科幻", "冒险"], "tt0062622"),
  seedMovie("a-clockwork-orange", "发条橙", "A Clockwork Orange", 1971, "斯坦利·库布里克", ["科幻", "犯罪"], "tt0066921"),
  seedMovie("barry-lyndon", "巴里·林登", "Barry Lyndon", 1975, "斯坦利·库布里克", ["历史", "剧情"], "tt0072684"),
  seedMovie("the-shining", "闪灵", "The Shining", 1980, "斯坦利·库布里克", ["恐怖", "心理"], "tt0081505"),
  seedMovie("full-metal-jacket", "全金属外壳", "Full Metal Jacket", 1987, "斯坦利·库布里克", ["战争", "剧情"], "tt0093058"),
  seedMovie("eyes-wide-shut", "大开眼戒", "Eyes Wide Shut", 1999, "斯坦利·库布里克", ["悬疑", "剧情"], "tt0120663"),
];

function seedMovie(id, title, originalTitle, year, directorName, genres, imdbId) {
  return {
    id,
    title,
    originalTitle,
    year,
    releaseDate: year ? `${year}-01-01` : "",
    directors: [{ id: slugify(directorName), name: directorName, color: DIRECTOR_COLORS[directorName] || "#2b5f9c" }],
    genres,
    countries: [],
    languages: [],
    runtimeMinutes: null,
    imdbId,
    wikidataId: "",
    description: "",
    watched: false,
    posterPath: "",
    posterSourceUrl: "",
    source: { type: "seed", name: "内置初始收藏" },
    external: { imdb: `https://www.imdb.com/title/${imdbId}/` },
    addedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function slugify(value) {
  const slug = String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `item-${Date.now()}`;
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...CORS_HEADERS,
  });
  response.end(JSON.stringify(payload));
}

function sendError(response, status, message) {
  sendJson(response, status, { error: message });
}

async function readBody(request) {
  let body = "";

  for await (const chunk of request) {
    body += chunk;
    if (body.length > 1_000_000) {
      throw new Error("请求体过大");
    }
  }

  return body ? JSON.parse(body) : {};
}

async function ensureStorage() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(POSTER_DIR, { recursive: true });

  if (!fsSync.existsSync(COLLECTION_FILE)) {
    await writeCollection(SEED_MOVIES);
  }
}

async function readCollection() {
  await ensureStorage();
  const raw = await fs.readFile(COLLECTION_FILE, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed.movies) ? parsed.movies : [];
}

async function writeCollection(movies) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(COLLECTION_FILE, `${JSON.stringify({ movies }, null, 2)}\n`, "utf8");
}

function sanitizeQid(value) {
  const qid = String(value || "").trim().toUpperCase();
  if (!/^Q\d+$/.test(qid)) {
    throw new Error("无效的外部资料编号");
  }
  return qid;
}

function bindingValue(binding, key) {
  return binding?.[key]?.value || "";
}

function extractQid(entityUrl) {
  return String(entityUrl || "").split("/").pop() || "";
}

function splitJoined(value) {
  return [...new Set(String(value || "").split("|").map((item) => item.trim()).filter(Boolean))];
}

function parseYear(value) {
  const match = String(value || "").match(/^(-?\d{1,4})/);
  return match ? Number(match[1]) : null;
}

function normalizeHttps(value) {
  if (!value) return "";
  return String(value).replace(/^http:\/\//, "https://");
}

function normalizePersonQuery(value) {
  const query = String(value || "").trim();
  return DIRECTOR_ALIASES[query] || query;
}

function normalizeName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[-_.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function zhDirectorName(name) {
  return DIRECTOR_ZH_NAMES[name] || name;
}

function zhGenres(genres = []) {
  return [...new Set(genres.map((genre) => GENRE_ZH[genre] || genre).filter(Boolean))];
}

function zhCountries(countries = []) {
  return [...new Set(countries.map((country) => COUNTRY_ZH[country] || country).filter(Boolean))];
}

function zhMovieTitle(title, imdbId = "") {
  const knownTitle = KNOWN_MOVIE_TITLES_BY_IMDB[imdbId];
  if (knownTitle) return knownTitle;
  
  const cleanTitle = String(title || "").trim();
  if (!cleanTitle) {
    return imdbId ? `电影 ${imdbId.replace(/^tt/, "")}` : "未命名电影";
  }
  
  if (hasCjk(cleanTitle)) {
    return cleanTitle;
  }
  
  if (/^tt\d+$/.test(cleanTitle)) {
    return `电影 ${cleanTitle.replace(/^tt/, "")}`;
  }
  
  if (/^[\d\s:：.-]+$/.test(cleanTitle)) {
    return imdbId ? `电影 ${imdbId.replace(/^tt/, "")}` : cleanTitle || "未命名电影";
  }
  
  return imdbId ? `电影 ${imdbId.replace(/^tt/, "")}` : "未命名电影";
}

function directorColor(name) {
  return DIRECTOR_COLORS[name] || DIRECTOR_COLORS[zhDirectorName(name)] || "#2b5f9c";
}

function knownDirectorAvatar(name) {
  return KNOWN_DIRECTOR_AVATARS[name] || KNOWN_DIRECTOR_AVATARS[zhDirectorName(name)] || "";
}

function wikimediaImageUrl(value, width = 360) {
  const source = normalizeHttps(value);
  if (!source) return "";

  try {
    const url = new URL(source);
    if (url.hostname.includes("wikimedia.org") || url.hostname.includes("wikipedia.org")) {
      url.searchParams.set("width", String(width));
      return url.toString();
    }
  } catch {
    return "";
  }

  return source;
}

function hasCjk(value) {
  return /[\u3400-\u9fff]/.test(String(value || ""));
}

function normalizeMovieTitle(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\u3400-\u9fff]+/g, "")
    .trim();
}

function cloneJson(data) {
  return data == null ? data : JSON.parse(JSON.stringify(data));
}

function cacheBodyKey(body) {
  if (!body) return "";
  if (typeof body === "string") return body;
  if (body instanceof URLSearchParams) return body.toString();
  if (Buffer.isBuffer(body)) return body.toString("utf8");
  return String(body);
}

function requestCacheKey(url, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  return `${method}:${url}:${cacheBodyKey(options.body)}`;
}

function getCachedValue(key) {
  const cached = memoryCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return cloneJson(cached.value);
}

function setCachedValue(key, value, ttl = JSON_CACHE_TTL) {
  if (!ttl) return;
  memoryCache.set(key, {
    value: cloneJson(value),
    expiresAt: Date.now() + ttl,
  });
}

async function withInflight(key, task) {
  if (inflightRequests.has(key)) {
    return cloneJson(await inflightRequests.get(key));
  }

  const promise = task().finally(() => inflightRequests.delete(key));
  inflightRequests.set(key, promise);
  return cloneJson(await promise);
}

async function fetchJsonWithRetry(url, options = {}, maxRetries = 1) {
  const { cacheTtl, retries, timeoutMs, ...fetchOptions } = options;
  let lastError;
  
  for (let retry = 0; retry <= maxRetries; retry++) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          Accept: "application/json",
          "User-Agent": USER_AGENT,
          ...(fetchOptions.headers || {}),
        },
        signal: fetchOptions.signal || AbortSignal.timeout(timeoutMs || (retry === 0 ? FAST_TIMEOUT_MS : 8000)),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`外部接口请求失败：${response.status} ${text.slice(0, 120)}`);
      }

      return response.json();
    } catch (error) {
      lastError = error;
      if (retry < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 350 * Math.pow(2, retry)));
      }
    }
  }

  throw lastError;
}

async function fetchJson(url, options = {}) {
  const key = requestCacheKey(url, options);
  const ttl = options.cacheTtl ?? JSON_CACHE_TTL;
  const cached = getCachedValue(key);
  if (cached) return cached;

  return withInflight(key, async () => {
    const data = await fetchJsonWithRetry(url, options, options.retries ?? 1);
    setCachedValue(key, data, ttl);
    return data;
  });
}

async function fetchSparql(query, options = {}) {
  const body = new URLSearchParams({ query, format: "json" });

  return fetchJson(WIKIDATA_SPARQL, {
    method: "POST",
    timeoutMs: options.timeoutMs || SPARQL_TIMEOUT_MS,
    retries: options.retries ?? 0,
    cacheTtl: options.cacheTtl ?? JSON_CACHE_TTL,
    headers: {
      Accept: "application/sparql-results+json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
}

async function searchWikidataDirectors(query) {
  const languages = /[a-z]/i.test(query) ? ["en", "zh"] : ["zh", "en"];
  const candidates = new Map();

  const searches = await Promise.allSettled(languages.map((language) => {
    const params = new URLSearchParams({
      action: "wbsearchentities",
      format: "json",
      language,
      uselang: language,
      type: "item",
      limit: "12",
      search: query,
    });

    return fetchJson(`${WIKIDATA_API}?${params.toString()}`, {
      timeoutMs: 2500,
      retries: 0,
      cacheTtl: JSON_CACHE_TTL,
    });
  }));

  for (const result of searches) {
    if (result.status !== "fulfilled") continue;

    for (const item of result.value.search || []) {
      if (!candidates.has(item.id)) {
        candidates.set(item.id, {
          id: item.id,
          label: item.label || item.id,
          description: item.description || "",
          url: item.concepturi || `https://www.wikidata.org/wiki/${item.id}`,
        });
      }
    }
  }

  if (!candidates.size) {
    throw new Error("外部导演搜索暂时不可用");
  }

  return enrichDirectorResultsWithProfiles([...candidates.values()].slice(0, 10));
}

async function getDirectorProfilesByQids(qids) {
  const safeQids = [...new Set(qids.map((qid) => String(qid || "").toUpperCase()).filter((qid) => /^Q\d+$/.test(qid)))].slice(0, 30);
  if (!safeQids.length) return new Map();

  const data = await fetchSparql(`
    SELECT ?person ?personLabel (SAMPLE(?imageValue) AS ?image)
    WHERE {
      VALUES ?person { ${safeQids.map((qid) => `wd:${qid}`).join(" ")} }
      OPTIONAL { ?person wdt:P18 ?imageValue. }
      SERVICE wikibase:label {
        bd:serviceParam wikibase:language "zh-hans,zh-cn,zh,en".
        ?person rdfs:label ?personLabel.
      }
    }
    GROUP BY ?person ?personLabel
  `, { timeoutMs: 3500 });

  const profiles = new Map();
  for (const row of data.results?.bindings || []) {
    const qid = extractQid(bindingValue(row, "person"));
    profiles.set(qid, {
      id: qid,
      label: bindingValue(row, "personLabel") || qid,
      avatarUrl: wikimediaImageUrl(bindingValue(row, "image")),
    });
  }

  return profiles;
}

async function enrichDirectorResultsWithProfiles(items) {
  const profiles = await getDirectorProfilesByQids(items.map((item) => item.id)).catch(() => new Map());

  return items.map((item) => {
    const profile = profiles.get(item.id);
    const label = profile?.label || zhDirectorName(item.label || item.searchName || item.id);
    return {
      ...item,
      label,
      searchName: item.searchName || item.label || label,
      avatarUrl: profile?.avatarUrl || item.avatarUrl || "",
      accent: item.accent || directorColor(label),
      description: item.description || "电影导演",
    };
  });
}

async function searchImdbPeople(query) {
  const normalizedQuery = normalizePersonQuery(query);
  const first = normalizedQuery[0]?.toLowerCase();
  if (!first || !/[a-z0-9]/.test(first)) {
    return [];
  }

  const url = `${IMDB_SUGGESTION_ROOT}/${first}/${encodeURIComponent(normalizedQuery)}.json`;
  const data = await fetchJson(url, { timeoutMs: 2500, retries: 0, cacheTtl: JSON_CACHE_TTL });

  return (data.d || [])
    .filter((item) => String(item.id || "").startsWith("nm"))
    .slice(0, 8)
    .map((item) => ({
      id: `imdb:${item.id}`,
      provider: "cinemeta",
      searchName: item.l || normalizedQuery,
      label: zhDirectorName(item.l || normalizedQuery),
      description: "外部人物资料",
      url: `https://www.imdb.com/name/${item.id}/`,
      avatarUrl: normalizeHttps(item.i?.imageUrl || ""),
    }));
}

async function searchDirectors(query) {
  const normalizedQuery = normalizePersonQuery(query);
  const results = new Map();

  try {
    for (const item of await searchWikidataDirectors(normalizedQuery)) {
      results.set(item.id, { ...item, provider: "wikidata", searchName: item.label });
    }
  } catch (error) {
    results.set(`cinemeta:${encodeURIComponent(normalizedQuery)}`, {
      id: `cinemeta:${encodeURIComponent(normalizedQuery)}`,
      provider: "cinemeta",
      searchName: normalizedQuery,
      label: normalizedQuery,
      description: "外部资料库暂时不可用，改用备用电影库搜索作品",
      url: "",
    });
  }

  try {
    for (const item of await searchImdbPeople(query)) {
      if (!results.has(item.id)) results.set(item.id, item);
    }
  } catch (error) {
    if (!results.size) {
      results.set(`cinemeta:${encodeURIComponent(normalizedQuery)}`, {
        id: `cinemeta:${encodeURIComponent(normalizedQuery)}`,
        provider: "cinemeta",
        searchName: normalizedQuery,
        label: normalizedQuery,
        description: "按这个关键词从外部电影库搜索作品",
        url: "",
      });
    }
  }

  if (![...results.values()].some((item) => normalizeName(item.searchName || item.label) === normalizeName(normalizedQuery))) {
    results.set(`cinemeta:${encodeURIComponent(normalizedQuery)}`, {
      id: `cinemeta:${encodeURIComponent(normalizedQuery)}`,
      provider: "cinemeta",
      searchName: normalizedQuery,
      label: normalizedQuery,
      description: "按这个关键词从外部电影库搜索作品",
      url: "",
    });
  }

  return [...results.values()].slice(0, 10);
}

function shuffleItems(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

function localDirectorEntry(entry) {
  const label = zhDirectorName(entry.label || entry.searchName || "电影导演");
  return {
    id: `cinemeta:${encodeURIComponent(entry.searchName || label)}`,
    provider: "cinemeta",
    label,
    searchName: entry.searchName || label,
    description: entry.description || "电影导演",
    accent: entry.accent || directorColor(label),
    avatarUrl: knownDirectorAvatar(label),
  };
}

async function resolveDirectorEntry(entry) {
  try {
    const [match] = await searchWikidataDirectors(entry.searchName || entry.label);
    if (match?.id) {
      return {
        ...entry,
        ...match,
        label: zhDirectorName(entry.label || match.label),
        searchName: entry.searchName || match.searchName || match.label,
        description: entry.description || match.description || "电影导演",
        accent: entry.accent || match.accent || directorColor(entry.label || match.label),
      };
    }
  } catch {
    // 外部搜索失败时保留本地候选，不影响页面可用性。
  }

  try {
    const [person] = await searchImdbPeople(entry.searchName || entry.label);
    if (person) {
      return {
        ...entry,
        ...person,
        label: entry.label || person.label,
        searchName: entry.searchName || person.searchName,
        description: entry.description || person.description || "外部人物资料",
        accent: entry.accent || directorColor(entry.label || person.label),
        avatarUrl: person.avatarUrl || "",
      };
    }
  } catch {
    // IMDb 人物建议不可用时继续使用本地候选。
  }

  return {
    id: `cinemeta:${encodeURIComponent(entry.searchName || entry.label)}`,
    provider: "cinemeta",
    label: entry.label,
    searchName: entry.searchName || entry.label,
    description: entry.description,
    accent: entry.accent || directorColor(entry.label),
    avatarUrl: "",
  };
}

async function getRandomDirectors() {
  const selected = shuffleItems(DIRECTOR_POOL).slice(0, 10);
  return selected.map(localDirectorEntry);
}

async function getRandomExternalMovie() {
  const ids = shuffleItems(SPOTLIGHT_MOVIE_POOL);

  for (let index = 0; index < ids.length; index += 5) {
    const batch = ids.slice(index, index + 5);
    try {
      return await Promise.any(batch.map((imdbId) => getInternetMoviePreviewByImdb(imdbId)));
    } catch {
      // 当前批次网络不可用时尝试下一组。
    }
  }

  return fallbackMoviePreviewByImdb(ids[0]);
}

function fallbackMoviePreviewByImdb(imdbId) {
  return {
    addId: `imdb:${imdbId}`,
    imdbId,
    wikidataId: "",
    title: zhMovieTitle("", imdbId),
    year: null,
    releaseDate: "",
    imageUrl: "",
    genres: [],
    directors: [],
    countries: [],
    source: { type: "internet-cache", name: "外部电影库缓存" },
  };
}

async function getRandomExternalMovieSlowFallback(seenImdbIds = new Set()) {
  const directors = shuffleItems(DIRECTOR_POOL);

  for (const director of directors.slice(0, 8)) {
    try {
      const films = await getCinemetaDirectorFilms(director.searchName || director.label);
      const candidates = films.filter((film) => getFilmSourceId(film) && 
        !String(film.title || "").startsWith("电影资料 ") && 
        !String(film.title || "").startsWith("电影 ") &&
        !seenImdbIds.has(film.imdbId));
      
      if (!candidates.length) continue;

      const movie = shuffleItems(candidates)[0];
      seenImdbIds.add(movie.imdbId);
      return {
        ...movie,
        source: { type: "internet", name: "外部电影库" },
      };
    } catch (error) {
      console.warn(`获取导演电影失败 (${director.label}): ${error.message}`);
    }
  }

  for (const imdbId of shuffleItems(SPOTLIGHT_MOVIE_POOL).slice(0, 20)) {
    if (seenImdbIds.has(imdbId)) continue;
    try {
      const movie = await getInternetMoviePreviewByImdb(imdbId);
      if (movie?.title) {
        return movie;
      }
    } catch {
      // 最后尝试，放宽条件
    }
  }

  throw new Error("暂时没有从外部电影库拿到随机电影");
}

async function getInternetMoviePreviewByImdb(imdbId) {
  const data = await fetchJson(`${CINEMETA_ROOT}/meta/movie/${imdbId}.json`, {
    timeoutMs: 3000,
    retries: 0,
    cacheTtl: JSON_CACHE_TTL,
  });
  const meta = data.meta;
  if (!meta) {
    throw new Error("没有找到外部电影资料");
  }

  return {
    addId: `imdb:${imdbId}`,
    imdbId,
    wikidataId: "",
    title: zhMovieTitle(meta.name || "", imdbId),
    year: parseYear(meta.year || meta.releaseInfo || meta.released),
    releaseDate: String(meta.released || "").slice(0, 10),
    imageUrl: normalizeHttps(meta.poster || ""),
    genres: zhGenres(meta.genre || meta.genres || []),
    directors: (meta.director || []).map(zhDirectorName),
    countries: zhCountries(Array.isArray(meta.country) ? meta.country : String(meta.country || "").split(",").map((item) => item.trim()).filter(Boolean)),
    source: { type: "internet", name: "外部电影库" },
  };
}

function getFilmSourceId(film) {
  return film.addId || film.wikidataId || (film.imdbId ? `imdb:${film.imdbId}` : "");
}

async function getDirectorFilms(qidValue) {
  const qid = sanitizeQid(qidValue);
  const query = `
    SELECT ?film ?filmLabel (MIN(?releaseDateValue) AS ?releaseDate)
      (SAMPLE(?imdbValue) AS ?imdbId)
      (SAMPLE(?imageValue) AS ?image)
      (GROUP_CONCAT(DISTINCT ?genreLabel; separator="|") AS ?genres)
    WHERE {
      ?film wdt:P57 wd:${qid}.
      ?film wdt:P31/wdt:P279* wd:Q11424.
      OPTIONAL { ?film wdt:P577 ?releaseDateValue. }
      OPTIONAL { ?film wdt:P345 ?imdbValue. }
      OPTIONAL { ?film wdt:P18 ?imageValue. }
      OPTIONAL { ?film wdt:P136 ?genre. }
      SERVICE wikibase:label {
        bd:serviceParam wikibase:language "zh-hans,zh-cn,zh,en".
        ?film rdfs:label ?filmLabel.
        ?genre rdfs:label ?genreLabel.
      }
    }
    GROUP BY ?film ?filmLabel
    ORDER BY ?releaseDate ?filmLabel
    LIMIT 200
  `;

  const data = await fetchSparql(query, { timeoutMs: 4500 });

  return (data.results?.bindings || []).map((row) => ({
    addId: extractQid(bindingValue(row, "film")),
    wikidataId: extractQid(bindingValue(row, "film")),
    title: zhMovieTitle(bindingValue(row, "filmLabel") || extractQid(bindingValue(row, "film")), bindingValue(row, "imdbId")),
    year: parseYear(bindingValue(row, "releaseDate")),
    releaseDate: bindingValue(row, "releaseDate").slice(0, 10),
    imdbId: bindingValue(row, "imdbId"),
    imageUrl: normalizeHttps(bindingValue(row, "image")),
    genres: zhGenres(splitJoined(bindingValue(row, "genres")).slice(0, 4)),
    }));
}

function parseDirectorPacks(value) {
  const directors = [];
  const seen = new Set();

  for (const pack of splitJoined(value)) {
    const [rawName, rawImage] = pack.split("^^");
    const name = zhDirectorName(rawName || "");
    if (!name || seen.has(name)) continue;

    seen.add(name);
    directors.push({
      id: slugify(name),
      name,
      color: directorColor(name),
      avatarUrl: wikimediaImageUrl(rawImage || "") || knownDirectorAvatar(name),
    });
  }

  return directors;
}

async function getWikidataMovieSummariesByImdb(imdbIds, options = {}) {
  const safeIds = [...new Set(imdbIds.map((id) => String(id || "").replace(/^imdb:/i, "")).filter((id) => /^tt\d+$/i.test(id)))]
    .slice(0, 80);
  const summaries = new Map();
  if (!safeIds.length) return summaries;

  for (let index = 0; index < safeIds.length; index += 30) {
    const batch = safeIds.slice(index, index + 30);
    const data = await fetchSparql(`
      SELECT ?film ?filmLabel ?imdbId
        (MIN(?releaseDateValue) AS ?releaseDate)
        (SAMPLE(?imageValue) AS ?image)
        (GROUP_CONCAT(DISTINCT ?directorPack; separator="|") AS ?directors)
        (GROUP_CONCAT(DISTINCT ?genreLabel; separator="|") AS ?genres)
        (GROUP_CONCAT(DISTINCT ?countryLabel; separator="|") AS ?countries)
      WHERE {
        VALUES ?imdbId { ${batch.map((id) => `"${id}"`).join(" ")} }
        ?film wdt:P345 ?imdbId.
        ?film wdt:P31/wdt:P279* wd:Q11424.
        OPTIONAL { ?film wdt:P577 ?releaseDateValue. }
        OPTIONAL { ?film wdt:P18 ?imageValue. }
        OPTIONAL { ?film wdt:P136 ?genre. }
        OPTIONAL { ?film wdt:P495 ?country. }
        OPTIONAL {
          ?film wdt:P57 ?director.
          OPTIONAL { ?director wdt:P18 ?directorImage. }
        }
        SERVICE wikibase:label {
          bd:serviceParam wikibase:language "zh-hans,zh-cn,zh,en".
          ?film rdfs:label ?filmLabel.
          ?director rdfs:label ?directorLabel.
          ?genre rdfs:label ?genreLabel.
          ?country rdfs:label ?countryLabel.
        }
        BIND(CONCAT(COALESCE(STR(?directorLabel), ""), "^^", COALESCE(STR(?directorImage), "")) AS ?directorPack)
      }
      GROUP BY ?film ?filmLabel ?imdbId
    `, { timeoutMs: options.timeoutMs || 4500 });

    for (const row of data.results?.bindings || []) {
      const imdbId = bindingValue(row, "imdbId");
      const qid = extractQid(bindingValue(row, "film"));
      summaries.set(imdbId, {
        addId: qid,
        wikidataId: qid,
        imdbId,
        title: zhMovieTitle(bindingValue(row, "filmLabel"), imdbId),
        year: parseYear(bindingValue(row, "releaseDate")),
        releaseDate: bindingValue(row, "releaseDate").slice(0, 10),
        imageUrl: normalizeHttps(bindingValue(row, "image")),
        directors: parseDirectorPacks(bindingValue(row, "directors")),
        genres: zhGenres(splitJoined(bindingValue(row, "genres")).slice(0, 4)),
        countries: zhCountries(splitJoined(bindingValue(row, "countries")).slice(0, 4)),
      });
    }
  }

  return summaries;
}

async function getWikidataMovieIdByImdb(imdbId) {
  const summaries = await getWikidataMovieSummariesByImdb([imdbId], { timeoutMs: 3000 });
  return summaries.get(imdbId)?.wikidataId || "";
}

function parseRuntimeMinutes(value) {
  const match = String(value || "").match(/\d+/);
  return match ? Number(match[0]) : null;
}

function directorMatches(meta, directorName) {
  const target = normalizeName(directorName);
  return (meta.director || []).some((name) => {
    const normalized = normalizeName(name);
    return normalized === target || normalized.includes(target) || target.includes(normalized);
  });
}

function mapCinemetaFilm(meta) {
  const imdbId = meta.imdb_id || meta.id || "";
  return {
    addId: imdbId ? `imdb:${imdbId}` : "",
    imdbId,
    wikidataId: "",
    title: zhMovieTitle(meta.name || "", imdbId),
    year: parseYear(meta.year || meta.releaseInfo || meta.released),
    releaseDate: String(meta.released || "").slice(0, 10),
    imageUrl: normalizeHttps(meta.poster || ""),
    genres: zhGenres(meta.genre || meta.genres || []),
    directors: (meta.director || []).map(zhDirectorName),
  };
}

async function localizeFilmResults(films, options = {}) {
  const locallyNamed = films.map((film) => ({
    ...film,
    title: zhMovieTitle(film.title, film.imdbId),
    genres: zhGenres(film.genres || []),
    directors: (film.directors || []).map(zhDirectorName),
    countries: zhCountries(film.countries || []),
  }));

  if (options.useNetwork === false) {
    return locallyNamed;
  }

  const summaries = await getWikidataMovieSummariesByImdb(
    locallyNamed.map((film) => film.imdbId),
    { timeoutMs: options.timeoutMs || 3000 },
  ).catch(() => new Map());

  return locallyNamed.map((film) => {
    const summary = summaries.get(film.imdbId);
    if (!summary) return film;

    return {
      ...film,
      addId: summary.wikidataId || film.addId,
      wikidataId: summary.wikidataId || film.wikidataId,
      title: summary.title || film.title,
      year: summary.year || film.year,
      releaseDate: summary.releaseDate || film.releaseDate,
      imageUrl: summary.imageUrl || film.imageUrl,
      genres: summary.genres.length ? summary.genres : film.genres,
      directors: summary.directors.length ? summary.directors.map((director) => director.name) : film.directors,
    };
  });
}

async function hydrateCinemetaMovie(meta) {
  if (Array.isArray(meta.director) && meta.director.length && (meta.genre || meta.genres)) {
    return meta;
  }

  const imdbId = meta.imdb_id || meta.id;
  if (!imdbId) return meta;

  try {
    const data = await fetchJson(`${CINEMETA_ROOT}/meta/movie/${imdbId}.json`, {
      timeoutMs: 2500,
      retries: 0,
      cacheTtl: JSON_CACHE_TTL,
    });
    return { ...meta, ...(data.meta || {}) };
  } catch {
    return meta;
  }
}

async function hydrateCinemetaMovies(movies) {
  const hydrated = [];

  for (let index = 0; index < movies.length; index += 6) {
    const batch = movies.slice(index, index + 6);
    hydrated.push(...(await Promise.all(batch.map(hydrateCinemetaMovie))));
  }

  return hydrated;
}

async function getCinemetaDirectorFilms(directorName) {
  const query = normalizePersonQuery(directorName);
  const cacheKey = `director-films:${normalizeName(query)}`;
  const cached = getCachedValue(cacheKey);
  if (cached) return cached;

  const url = `${CINEMETA_ROOT}/catalog/movie/top/search=${encodeURIComponent(query)}.json`;
  const data = await fetchJson(url, { timeoutMs: 3500, retries: 0, cacheTtl: JSON_CACHE_TTL });
  const movies = (data.metas || [])
    .filter((meta) => meta.type === "movie" && (meta.imdb_id || meta.id))
    .slice(0, 80);
  const directed = movies.filter((meta) => Array.isArray(meta.director) && meta.director.length && directorMatches(meta, query));
  const chosen = directed.length ? directed : movies;
  const seen = new Set();

  const mapped = chosen
    .map(mapCinemetaFilm)
    .filter((film) => {
      if (!film.imdbId || seen.has(film.imdbId)) return false;
      seen.add(film.imdbId);
      return true;
    })
    .slice(0, 80)
    .sort((a, b) => (a.year || 9999) - (b.year || 9999));

  const localized = await localizeFilmResults(mapped, { timeoutMs: 2500 }).catch(() => mapped);
  setCachedValue(cacheKey, localized, SHORT_CACHE_TTL);
  return localized;
}

async function getCinemetaMovieDetails(imdbIdValue) {
  const imdbId = String(imdbIdValue || "").replace(/^imdb:/, "");
  if (!/^tt\d+$/.test(imdbId)) {
    throw new Error("无效的外部电影编号");
  }

  const wikidataId = await getWikidataMovieIdByImdb(imdbId).catch(() => "");
  if (wikidataId) {
    return getMovieDetails(wikidataId);
  }

  const data = await fetchJson(`${CINEMETA_ROOT}/meta/movie/${imdbId}.json`, {
    timeoutMs: 4500,
    retries: 0,
    cacheTtl: JSON_CACHE_TTL,
  });
  const meta = data.meta;
  if (!meta) {
    throw new Error("没有找到这部电影的外部资料");
  }

  const title = zhMovieTitle(meta.name || "", imdbId);
  const directors = (meta.director || []).map((name) => ({
    id: slugify(zhDirectorName(name)),
    name: zhDirectorName(name),
    color: directorColor(name),
    avatarUrl: knownDirectorAvatar(name),
  }));

  return {
    id: `imdb-${imdbId}`,
    title,
    originalTitle: hasCjk(meta.name) ? meta.name : "",
    year: parseYear(meta.year || meta.releaseInfo || meta.released),
    releaseDate: String(meta.released || "").slice(0, 10),
    directors,
    genres: zhGenres(meta.genre || meta.genres || []),
    countries: zhCountries(Array.isArray(meta.country) ? meta.country : String(meta.country || "").split(",").map((item) => item.trim()).filter(Boolean)),
    languages: [],
    runtimeMinutes: parseRuntimeMinutes(meta.runtime),
    imdbId,
    wikidataId: "",
    imageUrl: normalizeHttps(meta.poster || ""),
    description: hasCjk(meta.description) ? meta.description : "",
    watched: false,
    posterPath: "",
    posterSourceUrl: "",
    source: { type: "cinemeta", name: "外部电影库" },
    external: {
      imdb: `https://www.imdb.com/title/${imdbId}/`,
      stremio: meta.slug ? `https://www.strem.io/s/${meta.slug}` : "",
    },
    addedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function getEntityText(qid) {
  const params = new URLSearchParams({
    action: "wbgetentities",
    format: "json",
    ids: qid,
    props: "labels|descriptions",
    languages: "zh-hans|zh-cn|zh|en",
  });
  const data = await fetchJson(`${WIKIDATA_API}?${params.toString()}`, {
    timeoutMs: 3500,
    retries: 0,
    cacheTtl: JSON_CACHE_TTL,
  });
  const entity = data.entities?.[qid] || {};
  const labels = entity.labels || {};
  const descriptions = entity.descriptions || {};

  return {
    label: labels["zh-hans"]?.value || labels["zh-cn"]?.value || labels.zh?.value || labels.en?.value || qid,
    originalLabel: labels.en?.value || labels["zh-hans"]?.value || labels.zh?.value || qid,
    description:
      descriptions["zh-hans"]?.value ||
      descriptions["zh-cn"]?.value ||
      descriptions.zh?.value ||
      descriptions.en?.value ||
      "",
  };
}

async function getMovieDetails(qidValue) {
  const qid = sanitizeQid(qidValue);
  const [entityText, sparqlData] = await Promise.all([
    getEntityText(qid),
    fetchSparql(`
      SELECT ?film ?filmLabel
        (MIN(?releaseDateValue) AS ?releaseDate)
        (SAMPLE(?imdbValue) AS ?imdbId)
        (SAMPLE(?imageValue) AS ?image)
        (SAMPLE(?runtimeValue) AS ?runtime)
        (SAMPLE(?articleValue) AS ?article)
        (GROUP_CONCAT(DISTINCT ?directorPack; separator="|") AS ?directors)
        (GROUP_CONCAT(DISTINCT ?genreLabel; separator="|") AS ?genres)
        (GROUP_CONCAT(DISTINCT ?countryLabel; separator="|") AS ?countries)
        (GROUP_CONCAT(DISTINCT ?languageLabel; separator="|") AS ?languages)
      WHERE {
        VALUES ?film { wd:${qid} }
        ?film wdt:P31/wdt:P279* wd:Q11424.
        OPTIONAL {
          ?film wdt:P57 ?director.
          OPTIONAL { ?director wdt:P18 ?directorImage. }
        }
        OPTIONAL { ?film wdt:P577 ?releaseDateValue. }
        OPTIONAL { ?film wdt:P345 ?imdbValue. }
        OPTIONAL { ?film wdt:P18 ?imageValue. }
        OPTIONAL { ?film wdt:P2047 ?runtimeValue. }
        OPTIONAL { ?film wdt:P136 ?genre. }
        OPTIONAL { ?film wdt:P495 ?country. }
        OPTIONAL { ?film wdt:P364 ?language. }
        OPTIONAL {
          ?articleValue <http://schema.org/about> ?film;
            <http://schema.org/isPartOf> <https://en.wikipedia.org/>.
        }
        SERVICE wikibase:label {
          bd:serviceParam wikibase:language "zh-hans,zh-cn,zh,en".
          ?film rdfs:label ?filmLabel.
          ?director rdfs:label ?directorLabel.
          ?genre rdfs:label ?genreLabel.
          ?country rdfs:label ?countryLabel.
          ?language rdfs:label ?languageLabel.
        }
        BIND(CONCAT(COALESCE(STR(?directorLabel), ""), "^^", COALESCE(STR(?directorImage), "")) AS ?directorPack)
      }
      GROUP BY ?film ?filmLabel
      LIMIT 1
    `),
  ]);

  const row = sparqlData.results?.bindings?.[0];
  if (!row) {
    throw new Error("没有找到这部电影的可保存资料");
  }

  const imdbId = bindingValue(row, "imdbId");
  const rawTitle = entityText.label || bindingValue(row, "filmLabel") || qid;
  const title = zhMovieTitle(rawTitle, imdbId);
  const originalTitle = hasCjk(entityText.originalLabel) ? entityText.originalLabel : "";
  const releaseDate = bindingValue(row, "releaseDate").slice(0, 10);
  const directors = parseDirectorPacks(bindingValue(row, "directors"));

  return {
    id: `wd-${qid.toLowerCase()}`,
    title,
    originalTitle,
    year: parseYear(releaseDate),
    releaseDate,
    directors,
    genres: zhGenres(splitJoined(bindingValue(row, "genres"))),
    countries: zhCountries(splitJoined(bindingValue(row, "countries"))),
    languages: splitJoined(bindingValue(row, "languages")),
    runtimeMinutes: Number(bindingValue(row, "runtime")) || null,
    imdbId,
    wikidataId: qid,
    imageUrl: normalizeHttps(bindingValue(row, "image")),
    description: hasCjk(entityText.description) ? entityText.description : "",
    watched: false,
    posterPath: "",
    posterSourceUrl: "",
    source: { type: "wikidata", name: "维基数据" },
    external: {
      wikidata: `https://www.wikidata.org/wiki/${qid}`,
      wikipedia: bindingValue(row, "article"),
      imdb: imdbId ? `https://www.imdb.com/title/${imdbId}/` : "",
    },
    addedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function isAllowedImageHost(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return (
      url.protocol === "https:" &&
      (host === "m.media-amazon.com" ||
        host.endsWith(".media-amazon.com") ||
        host === "commons.wikimedia.org" ||
        host.endsWith(".wikimedia.org") ||
        host.endsWith(".wikipedia.org") ||
        host === "images.metahub.space" ||
        host.endsWith(".metahub.space"))
    );
  } catch {
    return false;
  }
}

async function getImdbPosterUrl(imdbId) {
  if (!imdbId) return "";
  const url = `${IMDB_SUGGESTION_ROOT}/${imdbId[0].toLowerCase()}/${imdbId}.json`;
  const data = await fetchJson(url, { timeoutMs: 3000, retries: 0, cacheTtl: JSON_CACHE_TTL });
  const exact = (data.d || []).find((item) => item.id === imdbId);
  return normalizeHttps(exact?.i?.imageUrl || data.d?.[0]?.i?.imageUrl || "");
}

function extensionFromContentType(contentType, fallbackUrl) {
  if (contentType.includes("image/png")) return "png";
  if (contentType.includes("image/webp")) return "webp";
  if (contentType.includes("image/jpeg") || contentType.includes("image/jpg")) return "jpg";

  try {
    const ext = path.extname(new URL(fallbackUrl).pathname).replace(".", "").toLowerCase();
    return ["jpg", "jpeg", "png", "webp"].includes(ext) ? (ext === "jpeg" ? "jpg" : ext) : "jpg";
  } catch {
    return "jpg";
  }
}

async function posterFileExists(movie) {
  if (!movie.posterPath) return false;
  const absolutePath = path.join(ROOT, movie.posterPath.replace(/^\//, ""));
  const relative = path.relative(POSTER_DIR, absolutePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return false;
  return fsSync.existsSync(absolutePath);
}

async function downloadImageToPoster(url, movieId) {
  if (!isAllowedImageHost(url)) {
    throw new Error("图片来源不在允许列表中");
  }

  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`图片下载失败：${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    throw new Error("外部资源不是图片");
  }

  const extension = extensionFromContentType(contentType, url);
  const fileName = `${slugify(movieId)}.${extension}`;
  const filePath = path.join(POSTER_DIR, fileName);
  const arrayBuffer = await response.arrayBuffer();

  await fs.writeFile(filePath, Buffer.from(arrayBuffer));
  return `/assets/posters/${fileName}`;
}

async function downloadPosterForMovie(movie) {
  if (await posterFileExists(movie)) {
    return false;
  }

  const sources = [];
  try {
    const imdbPoster = await getImdbPosterUrl(movie.imdbId);
    if (imdbPoster) sources.push(imdbPoster);
  } catch (error) {
    movie.posterError = `外部封面：${error.message}`;
  }

  if (movie.imageUrl) {
    sources.push(movie.imageUrl);
  }

  for (const source of sources) {
    const safeSource = normalizeHttps(source);
    if (!isAllowedImageHost(safeSource)) continue;

    try {
      movie.posterPath = await downloadImageToPoster(safeSource, movie.id);
      movie.posterSourceUrl = safeSource;
      movie.posterSavedAt = new Date().toISOString();
      delete movie.posterError;
      return true;
    } catch (error) {
      movie.posterError = error.message;
    }
  }

  movie.updatedAt = new Date().toISOString();
  return false;
}

function movieNeedsChineseMetadata(movie) {
  if (movie.imdbId && (!hasCjk(movie.title) || /[A-Za-z]/.test(String(movie.title || "")) || String(movie.title || "").startsWith("电影资料 "))) return true;
  if (movie.originalTitle && !hasCjk(movie.originalTitle)) return true;
  if ((movie.directors || []).some((director) => !hasCjk(director.name) || !director.avatarUrl)) return true;
  if ((movie.genres || []).some((genre) => GENRE_ZH[genre])) return true;
  if ((movie.countries || []).some((country) => COUNTRY_ZH[country])) return true;
  if (movie.description && !hasCjk(movie.description)) return true;
  return false;
}

function mergeChineseSummary(movie, summary) {
  if (!summary) {
    return {
      ...movie,
      title: zhMovieTitle(movie.title, movie.imdbId),
      originalTitle: hasCjk(movie.originalTitle) ? movie.originalTitle : "",
      directors: (movie.directors || []).map((director) => {
        const name = zhDirectorName(director.name);
        return {
          ...director,
          id: director.id || slugify(name),
          name,
          color: director.color || directorColor(name),
          avatarUrl: director.avatarUrl || knownDirectorAvatar(name),
        };
      }),
      genres: zhGenres(movie.genres || []),
      countries: zhCountries(movie.countries || []),
      description: hasCjk(movie.description) ? movie.description : "",
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    ...movie,
    title: summary.title || movie.title,
    originalTitle: hasCjk(movie.originalTitle) ? movie.originalTitle : "",
    year: summary.year || movie.year,
    releaseDate: summary.releaseDate || movie.releaseDate,
    wikidataId: summary.wikidataId || movie.wikidataId,
    imageUrl: summary.imageUrl || movie.imageUrl,
    directors: summary.directors.length
      ? summary.directors.map((director) => ({
          ...director,
          avatarUrl: director.avatarUrl || knownDirectorAvatar(director.name),
        }))
      : (movie.directors || []).map((director) => {
          const name = zhDirectorName(director.name);
          return {
            ...director,
            id: director.id || slugify(name),
            name,
            color: director.color || directorColor(name),
            avatarUrl: director.avatarUrl || knownDirectorAvatar(name),
          };
        }),
    genres: summary.genres.length ? summary.genres : zhGenres(movie.genres || []),
    countries: summary.countries.length ? summary.countries : zhCountries(movie.countries || []),
    description: hasCjk(movie.description) ? movie.description : "",
    updatedAt: new Date().toISOString(),
  };
}

async function localizeCollectionMovies(movies) {
  const targets = movies.filter(movieNeedsChineseMetadata);
  if (!targets.length) return { movies, changed: false };

  let summaries;
  try {
    summaries = await getWikidataMovieSummariesByImdb(targets.map((movie) => movie.imdbId), { timeoutMs: 3500 });
  } catch {
    summaries = new Map();
  }

  let changed = false;

  const localized = movies.map((movie) => {
    if (!movieNeedsChineseMetadata(movie)) return movie;

    const next = mergeChineseSummary(movie, summaries.get(movie.imdbId));
    changed = changed || JSON.stringify(next) !== JSON.stringify(movie);
    return next;
  });

  return { movies: localized, changed };
}

function localizeCollectionMoviesLocally(movies) {
  let changed = false;
  const localized = movies.map((movie) => {
    if (!movieNeedsChineseMetadata(movie)) return movie;

    const next = mergeChineseSummary(movie, null);
    changed = changed || JSON.stringify(next) !== JSON.stringify(movie);
    return next;
  });

  return { movies: localized, changed };
}

async function readLocalizedCollection() {
  const collection = await readCollection();
  const localized = localizeCollectionMoviesLocally(collection);

  if (localized.changed) {
    await writeCollection(localized.movies);
  }

  return localized.movies;
}

async function addMovieToCollection(wikidataId) {
  const collection = await readCollection();
  const sourceId = String(wikidataId || "").trim();
  const movie =
    sourceId.startsWith("imdb:") || /^tt\d+$/.test(sourceId)
      ? await getCinemetaMovieDetails(sourceId)
      : await getMovieDetails(sourceId);

  await downloadPosterForMovie(movie).catch((error) => {
    movie.posterError = error.message;
  });

  const existingIndex = collection.findIndex(
    (item) =>
      (movie.wikidataId && item.wikidataId === movie.wikidataId) ||
      (movie.imdbId && item.imdbId && item.imdbId === movie.imdbId),
  );

  if (existingIndex >= 0) {
    const existing = collection[existingIndex];
    collection[existingIndex] = {
      ...existing,
      ...movie,
      id: existing.id,
      title: existing.title || movie.title,
      originalTitle: existing.originalTitle || movie.originalTitle,
      watched: existing.watched,
      addedAt: existing.addedAt,
      posterPath: movie.posterPath || existing.posterPath,
      posterSourceUrl: movie.posterSourceUrl || existing.posterSourceUrl,
      updatedAt: new Date().toISOString(),
    };
  } else {
    collection.push(movie);
  }

  await writeCollection(collection);
  return collection;
}

function sourceIdAlreadyInCollection(sourceId, collection) {
  const normalized = String(sourceId || "").trim();
  if (!normalized) return true;

  if (normalized.startsWith("imdb:") || /^tt\d+$/i.test(normalized)) {
    const imdbId = normalized.replace(/^imdb:/i, "");
    return collection.some((movie) => movie.imdbId === imdbId);
  }

  if (/^Q\d+$/i.test(normalized)) {
    return collection.some((movie) => movie.wikidataId?.toUpperCase() === normalized.toUpperCase());
  }

  return false;
}

async function addMoviesToCollection(sourceIds) {
  const uniqueIds = [...new Set((Array.isArray(sourceIds) ? sourceIds : []).map((item) => String(item || "").trim()).filter(Boolean))].slice(0, 80);
  let collection = await readCollection();
  let added = 0;
  let skipped = 0;
  const errors = [];

  for (const sourceId of uniqueIds) {
    if (sourceIdAlreadyInCollection(sourceId, collection)) {
      skipped += 1;
      continue;
    }

    try {
      collection = await addMovieToCollection(sourceId);
      added += 1;
    } catch (error) {
      errors.push({ sourceId, error: error.message || "添加失败" });
    }
  }

  return { movies: collection, added, skipped, errors };
}

async function enrichMissingPosters() {
  const collection = await readCollection();
  let downloaded = 0;

  for (let index = 0; index < collection.length; index += 4) {
    const batch = collection.slice(index, index + 4);
    await Promise.all(
      batch.map(async (movie) => {
        try {
          const changed = await downloadPosterForMovie(movie);
          if (changed) downloaded += 1;
          movie.updatedAt = new Date().toISOString();
        } catch (error) {
          movie.posterError = error.message;
        }
      }),
    );
  }

  await writeCollection(collection);
  return { movies: collection, downloaded };
}

async function updateMovie(id, updates) {
  const collection = await readCollection();
  const movie = collection.find((item) => item.id === id);
  if (!movie) {
    throw new Error("没有找到这部电影");
  }

  if (typeof updates.watched === "boolean") {
    movie.watched = updates.watched;
  }
  movie.updatedAt = new Date().toISOString();
  await writeCollection(collection);
  return collection;
}

async function removeMovie(id) {
  const collection = await readCollection();
  const index = collection.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error("没有找到这部电影");
  }

  collection.splice(index, 1);
  await writeCollection(collection);
  return collection;
}

async function handleApi(request, response, url) {
  if (request.method === "GET" && url.pathname === "/api/collection") {
    return sendJson(response, 200, { movies: await readLocalizedCollection() });
  }

  if (request.method === "GET" && url.pathname === "/api/directors/random") {
    return sendJson(response, 200, { results: await getRandomDirectors() });
  }

  if (request.method === "GET" && url.pathname === "/api/movies/random") {
    return sendJson(response, 200, { movie: await getRandomExternalMovie() });
  }

  if (request.method === "GET" && url.pathname === "/api/search/directors") {
    const query = url.searchParams.get("q") || "";
    if (!query.trim()) {
      return sendJson(response, 200, { results: [] });
    }
    return sendJson(response, 200, { results: await searchDirectors(query.trim()) });
  }

  const filmsMatch = url.pathname.match(/^\/api\/directors\/([^/]+)\/films$/i);
  if (request.method === "GET" && filmsMatch) {
    const directorId = decodeURIComponent(filmsMatch[1]);
    
    if (/^Q\d+$/i.test(directorId)) {
      try {
        const results = await getDirectorFilms(directorId);
        if (results.length > 0) {
          return sendJson(response, 200, { results });
        }
      } catch (error) {
        console.warn(`主资料库获取导演电影失败: ${error.message}`);
      }
      
      try {
        const directorInfo = await getEntityText(directorId);
        const directorName = directorInfo.label || "";
        const fallbackResults = await getCinemetaDirectorFilms(directorName);
        if (fallbackResults.length > 0) {
          return sendJson(response, 200, { results: fallbackResults, source: "cinemeta-fallback" });
        }
      } catch (error) {
        console.warn(`备用数据源获取导演电影失败: ${error.message}`);
      }
      
      return sendJson(response, 200, { results: [], message: "暂时无法获取该导演的电影信息" });
    }

    const directorName =
      url.searchParams.get("name") ||
      (directorId.startsWith("cinemeta:") ? decodeURIComponent(directorId.slice("cinemeta:".length)) : "");

    try {
      const results = await getCinemetaDirectorFilms(directorName);
      return sendJson(response, 200, { results });
    } catch (error) {
      console.warn(`备用电影库获取导演电影失败: ${error.message}`);
      return sendJson(response, 200, { results: [], message: "暂时无法获取该导演的电影信息" });
    }
  }

  if (request.method === "POST" && url.pathname === "/api/collection/add") {
    const body = await readBody(request);
    return sendJson(response, 200, { movies: await addMovieToCollection(body.sourceId || body.wikidataId) });
  }

  if (request.method === "POST" && url.pathname === "/api/collection/add-batch") {
    const body = await readBody(request);
    return sendJson(response, 200, await addMoviesToCollection(body.sourceIds));
  }

  if (request.method === "POST" && url.pathname === "/api/collection/enrich-posters") {
    return sendJson(response, 200, await enrichMissingPosters());
  }

  const collectionMatch = url.pathname.match(/^\/api\/collection\/([^/]+)$/);
  if (request.method === "PATCH" && collectionMatch) {
    const body = await readBody(request);
    return sendJson(response, 200, { movies: await updateMovie(decodeURIComponent(collectionMatch[1]), body) });
  }

  if (request.method === "DELETE" && collectionMatch) {
    return sendJson(response, 200, { movies: await removeMovie(decodeURIComponent(collectionMatch[1])) });
  }

  if (request.method === "GET" && url.pathname.startsWith("/api/video/search")) {
    const movieName = url.searchParams.get("name");
    return sendJson(response, 200, await searchVideoUrl(movieName));
  }

  return sendError(response, 404, "没有这个接口");
}

async function searchVideoUrl(movieName) {
  if (!movieName) {
    return { error: "请提供电影名称" };
  }

  const searchUrl = `https://www.renren.pro/search?wd=${encodeURIComponent(movieName)}`;
  return { url: searchUrl, title: movieName };
}

async function serveStatic(request, response, url) {
  const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.join(ROOT, pathname.replace(/^\/+/, ""));
  const relative = path.relative(ROOT, filePath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    response.writeHead(403);
    response.end("无权访问");
    return;
  }

  try {
    const file = await fs.readFile(filePath);
    const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    const isAsset = pathname.startsWith("/assets/");
    response.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": isAsset ? "public, max-age=31536000, immutable" : "no-cache",
    });
    response.end(file);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("没有找到文件");
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  try {
    if (request.method === "OPTIONS") {
      response.writeHead(204, CORS_HEADERS);
      response.end();
      return;
    }

    if (url.pathname.startsWith("/api/")) {
      await handleApi(request, response, url);
    } else {
      await serveStatic(request, response, url);
    }
  } catch (error) {
    sendError(response, 500, error.message || "服务器错误");
  }
});

ensureStorage()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`StreamTale 已启动：http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

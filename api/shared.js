const http = require("node:http");
const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const POSTER_DIR = path.join(ROOT, "assets", "posters");
const COLLECTION_FILE = path.join(DATA_DIR, "collection.json");
const USER_AGENT = "CinemaShelfLocal/1.0 (personal local movie collection)";
const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const WIKIDATA_SPARQL = "https://query.wikidata.org/sparql";
const IMDB_SUGGESTION_ROOT = "https://v2.sg.media-imdb.com/suggestion";
const CINEMETA_ROOT = "https://v3-cinemeta.strem.io";
const JSON_CACHE_TTL = 1000 * 60 * 60 * 12;
const SHORT_CACHE_TTL = 1000 * 60 * 10;
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
  tt0018758: "农夫的妻子",
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
  "马丁·斯科塞斯": "https://m.media-amazon.com/images/M/MV5BMTcyNDA4Nzk3Nl5BMl5BanBnXkFtZTcwNDYzMjMxMw@@._V1_.jpg",
  "丹尼斯·维伦纽瓦": "https://m.media-amazon.com/images/M/MV5BMzU2MDk5MDI2MF5BMl5BanBnXkFtZTcwNDkwMjMzNA@@._V1_.jpg",
  "宫崎骏": "https://m.media-amazon.com/images/M/MV5BMjcyNjk2OTkwNF5BMl5BanBnXkFtZTcwOTk0MTQ3Mg@@._V1_.jpg",
  "朴赞郁": "https://m.media-amazon.com/images/M/MV5BMTgyODk3MTU5OV5BMl5BanBnXkFtZTcwMTc3NjcyMQ@@._V1_.jpg",
  "陈果": "https://m.media-amazon.com/images/M/MV5BMzA2ZmQ5MmYtYzRlNC00OTMxLWIxOGEtZTE2ZjY0NjdlZDE2XkEyXkFqcGc@._V1_.jpg",
  "三池崇史": "https://m.media-amazon.com/images/M/MV5BMjI0NTI3NTg1OF5BMl5BanBnXkFtZTcwODU4NDE0NA@@._V1_.jpg",
  "大卫·林奇": "https://m.media-amazon.com/images/M/MV5BMTQ1MTY2MTY2Nl5BMl5BanBnXkFtZTcwMDg1ODYwNA@@._V1_.jpg",
  "李沧东": "https://m.media-amazon.com/images/M/MV5BMTc5NjIwOTc0MV5BMl5BanBnXkFtZTcwMzQ2Mzc3NA@@._V1_.jpg",
  "保罗·托马斯·安德森": "https://m.media-amazon.com/images/M/MV5BMTQwNjc5NjY2NV5BMl5BanBnXkFtZTcwNDIxMzg1MQ@@._V1_.jpg",
  "阿尔弗雷德·希区柯克": "https://m.media-amazon.com/images/M/MV5BMjNjZDM0NGUtZmE4Yy00MTI3LThkNTYtODVlZTUzM2M4Yjk5XkEyXkFqcGc@._V1_.jpg",
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

async function ensureStorage() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(POSTER_DIR, { recursive: true });

    if (!fsSync.existsSync(COLLECTION_FILE)) {
      await writeCollection(SEED_MOVIES);
    }
  } catch (error) {
    console.warn("Storage initialization failed:", error);
  }
}

async function readCollection() {
  try {
    await ensureStorage();
    const raw = await fs.readFile(COLLECTION_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.movies) ? parsed.movies : [];
  } catch (error) {
    console.warn("Read collection failed:", error);
    return SEED_MOVIES;
  }
}

async function writeCollection(movies) {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(COLLECTION_FILE, `${JSON.stringify({ movies }, null, 2)}\n`, "utf8");
  } catch (error) {
    console.warn("Write collection failed:", error);
  }
}

function hasCjk(value) {
  return /[\u3400-\u9fff]/.test(String(value || ""));
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

function zhDirectorName(name) {
  return DIRECTOR_ZH_NAMES[name] || name;
}

function zhGenres(genres = []) {
  return [...new Set(genres.map((genre) => GENRE_ZH[genre] || genre).filter(Boolean))];
}

function zhCountries(countries = []) {
  return [...new Set(countries.map((country) => COUNTRY_ZH[country] || country).filter(Boolean))];
}

function directorColor(name) {
  return DIRECTOR_COLORS[name] || DIRECTOR_COLORS[zhDirectorName(name)] || "#2b5f9c";
}

function knownDirectorAvatar(name) {
  return KNOWN_DIRECTOR_AVATARS[name] || KNOWN_DIRECTOR_AVATARS[zhDirectorName(name)] || "";
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

function shuffleItems(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

async function getRandomDirectors() {
  const selected = shuffleItems(DIRECTOR_POOL).slice(0, 10);
  return selected.map(localDirectorEntry);
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

async function getRandomExternalMovie() {
  const ids = shuffleItems(SPOTLIGHT_MOVIE_POOL);

  for (let index = 0; index < ids.length; index += 5) {
    const batch = ids.slice(index, index + 5);
    try {
      return await Promise.any(batch.map(fallbackMoviePreviewByImdb));
    } catch {
      continue;
    }
  }

  return fallbackMoviePreviewByImdb(ids[0]);
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

async function searchDirectors(query) {
  const normalizedQuery = normalizePersonQuery(query);
  const results = new Map();

  const localResults = DIRECTOR_POOL
    .filter(d => normalizeName(d.label).includes(normalizeName(normalizedQuery)) || 
                  normalizeName(d.searchName).includes(normalizeName(normalizedQuery)))
    .map(localDirectorEntry);

  for (const item of localResults) {
    results.set(item.id, item);
  }

  if (![...results.values()].some((item) => normalizeName(item.searchName || item.label) === normalizeName(normalizedQuery))) {
    results.set(`cinemeta:${encodeURIComponent(normalizedQuery)}`, {
      id: `cinemeta:${encodeURIComponent(normalizedQuery)}`,
      provider: "cinemeta",
      searchName: normalizedQuery,
      label: normalizedQuery,
      description: "按这个关键词从外部电影库搜索作品",
      url: "",
      accent: directorColor(normalizedQuery),
      avatarUrl: knownDirectorAvatar(normalizedQuery),
    });
  }

  return [...results.values()].slice(0, 10);
}

async function searchVideoUrl(movieName) {
  if (!movieName) {
    return { error: "请提供电影名称" };
  }

  const searchUrl = `https://www.renren.pro/search?wd=${encodeURIComponent(movieName)}`;
  return { url: searchUrl, title: movieName };
}

async function readLocalizedCollection() {
  try {
    const collection = await readCollection();
    const localized = localizeCollectionMoviesLocally(collection);

    if (localized.changed) {
      await writeCollection(localized.movies);
    }

    return localized.movies;
  } catch (error) {
    console.warn("Localized collection failed:", error);
    return SEED_MOVIES;
  }
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

module.exports = {
  MIME_TYPES,
  CORS_HEADERS,
  ROOT,
  POSTER_DIR,
  ensureStorage,
  readCollection,
  writeCollection,
  getRandomDirectors,
  getRandomExternalMovie,
  searchDirectors,
  searchVideoUrl,
  readLocalizedCollection,
  hasCjk,
  zhMovieTitle,
  zhDirectorName,
  zhGenres,
  zhCountries,
  directorColor,
  knownDirectorAvatar,
  slugify,
  shuffleItems,
};

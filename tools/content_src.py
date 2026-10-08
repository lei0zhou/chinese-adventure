# -*- coding: utf-8 -*-
"""Source content for the Panda Passport Mandarin app.

All content is original and scripted (no AI at runtime). Simplified characters,
pinyin with tone marks, English. tools/build.py validates it (pypinyin cross-check,
token parsing, unit references) and writes data/content.js.

Formats
  words:   "hanzi|pinyin|english|emoji"
  tokens:  space-separated "hanzi/pinyin" pairs; use "_" for a space inside pinyin
           (e.g. 小明/Xiǎo_Míng). Punctuation tokens are bare (。！？，、：“”).
Tone conventions: neutral tones unmarked (xièxie, bàba); 一 and 不 written with their
spoken tone change in words and sentences (yìqǐ, bú kèqi, yí ge), as in most
children's textbooks. Third-tone sandhi (nǐ hǎo -> ní hǎo) is NOT written.
"""

UNITS = [
 dict(id="greet", en="Hello!", zh="你好", py="nǐ hǎo", emoji="👋", color="#ff6b6b",
  city=dict(hz="北京", py="Běijīng", en="Beijing", lat=39.90, lon=116.40,
   fact="Beijing is the capital of China. The Great Wall (长城 Chángchéng) and the Forbidden City (故宫 Gùgōng) are here."),
  words="""
你|nǐ|you|👉
我|wǒ|I, me|🙋
他|tā|he, him|👦
她|tā|she, her|👧
我们|wǒmen|we, us|👫
你好|nǐ hǎo|hello|👋
再见|zàijiàn|goodbye|🚶
谢谢|xièxie|thank you|🙏
不客气|bú kèqi|you're welcome|😊
对不起|duìbuqǐ|sorry|😔
没关系|méi guānxi|it's OK; never mind|👌
请|qǐng|please; to invite|🤲
叫|jiào|to be called; to call|📣
名字|míngzi|name|🏷️
是|shì|to be (am, is, are)|✅
朋友|péngyou|friend|🤝
什么|shénme|what|❓
吗|ma|(turns a sentence into a yes/no question)|❔
不|bù|not; no|🚫
"""),
 dict(id="numbers", en="Numbers & Time", zh="数字和时间", py="shùzì hé shíjiān", emoji="🔢", color="#ffa94d",
  city=dict(hz="西安", py="Xī'ān", en="Xi'an", lat=34.34, lon=108.94,
   fact="Near Xi'an, farmers digging a well in 1974 found the Terracotta Army: thousands of life-size clay soldiers. Try counting them!"),
  words="""
零|líng|zero|0️⃣
一|yī|one|1️⃣
二|èr|two|2️⃣
三|sān|three|3️⃣
四|sì|four|4️⃣
五|wǔ|five|5️⃣
六|liù|six|6️⃣
七|qī|seven|7️⃣
八|bā|eight|8️⃣
九|jiǔ|nine|9️⃣
十|shí|ten|🔟
百|bǎi|hundred|💯
两|liǎng|two (of something)|✌️
几|jǐ|how many (small numbers)|🔢
岁|suì|years old|🎂
点|diǎn|o'clock|🕗
现在|xiànzài|now|⏱️
今天|jīntiān|today|📅
明天|míngtiān|tomorrow|⏭️
昨天|zuótiān|yesterday|⏮️
星期|xīngqī|week|🗓️
月|yuè|month; moon|🌙
年|nián|year|🎆
"""),
 dict(id="family", en="Family", zh="家人", py="jiārén", emoji="👨‍👩‍👧‍👦", color="#f783ac",
  city=dict(hz="拉萨", py="Lāsà", en="Lhasa", lat=29.65, lon=91.13,
   fact="Lhasa is about 3,650 meters above sea level, one of the highest cities in the world. The Potala Palace sits on a hill above the city."),
  words="""
家|jiā|home; family|🏠
爸爸|bàba|dad|👨
妈妈|māma|mom|👩
哥哥|gēge|older brother|🧑
姐姐|jiějie|older sister|👩‍🦰
弟弟|dìdi|younger brother|👶
妹妹|mèimei|younger sister|👧
爷爷|yéye|grandpa (dad's dad)|👴
奶奶|nǎinai|grandma (dad's mom)|👵
外公|wàigōng|grandpa (mom's dad)|🧓
外婆|wàipó|grandma (mom's mom)|👵
儿子|érzi|son|👦
女儿|nǚ'ér|daughter|👧
有|yǒu|to have; there is|🤲
没有|méiyǒu|to not have; there isn't|🙅
爱|ài|to love|❤️
和|hé|and; with|➕
的|de|('s: shows who owns something)|🔗
口|kǒu|mouth; (counter for family members)|👄
"""),
 dict(id="food", en="Food & Drinks", zh="吃的和喝的", py="chī de hé hē de", emoji="🥟", color="#fcc419",
  city=dict(hz="广州", py="Guǎngzhōu", en="Guangzhou", lat=23.13, lon=113.26,
   fact="Guangzhou is famous for Cantonese food. Families go out for 早茶 (zǎochá, morning tea) and share little baskets of dim sum."),
  words="""
吃|chī|to eat|😋
喝|hē|to drink|🥤
米饭|mǐfàn|cooked rice|🍚
面条|miàntiáo|noodles|🍜
饺子|jiǎozi|dumplings|🥟
包子|bāozi|steamed bun|🫓
鸡蛋|jīdàn|egg|🥚
水|shuǐ|water|💧
茶|chá|tea|🍵
牛奶|niúnǎi|milk|🥛
苹果|píngguǒ|apple|🍎
香蕉|xiāngjiāo|banana|🍌
菜|cài|dish (of food); vegetable|🥬
杯|bēi|cup; glass (of)|☕
碗|wǎn|bowl (of)|🥣
好吃|hǎochī|tasty, delicious|🤤
饿|è|hungry|😩
渴|kě|thirsty|🫗
要|yào|to want; would like|🛎️
"""),
 dict(id="animals", en="Animals", zh="动物", py="dòngwù", emoji="🐼", color="#69db7c",
  city=dict(hz="成都", py="Chéngdū", en="Chengdu", lat=30.57, lon=104.07,
   fact="Chengdu is the home of the giant panda research base, where you can watch pandas eat bamboo. Most wild pandas live in Sichuan."),
  words="""
动物|dòngwù|animal|🐾
猫|māo|cat|🐱
狗|gǒu|dog|🐶
鱼|yú|fish|🐟
鸟|niǎo|bird|🐦
熊猫|xióngmāo|panda|🐼
老虎|lǎohǔ|tiger|🐯
马|mǎ|horse|🐴
牛|niú|cow; ox|🐮
羊|yáng|sheep; goat|🐑
猪|zhū|pig|🐷
兔子|tùzi|rabbit|🐰
猴子|hóuzi|monkey|🐵
大象|dàxiàng|elephant|🐘
龙|lóng|dragon|🐉
只|zhī|(counter for animals)|☝️
可爱|kě'ài|cute|🥰
"""),
 dict(id="colors", en="Colors", zh="颜色", py="yánsè", emoji="🌈", color="#4dabf7",
  city=dict(hz="桂林", py="Guìlín", en="Guilin", lat=25.27, lon=110.29,
   fact="Guilin has green rivers and tall, rounded limestone hills. The Li River (漓江 Lí Jiāng) scenery is printed on the 20-yuan bill."),
  words="""
颜色|yánsè|color|🌈
红色|hóngsè|red|🟥
黄色|huángsè|yellow|🟨
蓝色|lánsè|blue|🟦
绿色|lǜsè|green|🟩
白色|báisè|white|⬜
黑色|hēisè|black|⬛
粉色|fěnsè|pink|🩷
紫色|zǐsè|purple|🟪
橙色|chéngsè|orange (color)|🟧
大|dà|big|🏔️
小|xiǎo|small|🐜
多|duō|many; much|📚
少|shǎo|few; little|🤏
喜欢|xǐhuan|to like|👍
最|zuì|most|🏆
"""),
 dict(id="school", en="School", zh="学校", py="xuéxiào", emoji="🏫", color="#9775fa",
  city=dict(hz="南京", py="Nánjīng", en="Nanjing", lat=32.06, lon=118.80,
   fact="Nanjing means \"southern capital\" (南 nán = south, 京 jīng = capital). It was China's capital several times in history."),
  words="""
学校|xuéxiào|school|🏫
老师|lǎoshī|teacher|🧑‍🏫
学生|xuésheng|student|🧑‍🎓
同学|tóngxué|classmate|👭
书|shū|book|📕
笔|bǐ|pen|🖊️
本子|běnzi|notebook|📓
书包|shūbāo|school bag|🎒
上课|shàngkè|to have class; class starts|🔔
下课|xiàkè|class is over|🏃
学习|xuéxí|to study, learn|📖
写|xiě|to write|✍️
读|dú|to read (aloud)|🗣️
说|shuō|to speak; to say|💬
中文|Zhōngwén|Chinese (language)|🀄
汉字|Hànzì|Chinese character|🖌️
问题|wèntí|question; problem|🙋
懂|dǒng|to understand|💡
"""),
 dict(id="body", en="Body & Health", zh="身体", py="shēntǐ", emoji="🖐️", color="#20c997",
  city=dict(hz="杭州", py="Hángzhōu", en="Hangzhou", lat=30.27, lon=120.16,
   fact="Hangzhou is famous for beautiful West Lake (西湖 Xīhú). In the morning, people do tai chi by the lake to keep their bodies healthy."),
  words="""
身体|shēntǐ|body|🧍
头|tóu|head|👤
眼睛|yǎnjing|eye(s)|👀
耳朵|ěrduo|ear(s)|👂
鼻子|bízi|nose|👃
嘴|zuǐ|mouth|👄
牙|yá|tooth|🦷
手|shǒu|hand|✋
脚|jiǎo|foot|🦶
肚子|dùzi|belly, tummy|🥁
疼|téng|to hurt; sore|🤕
生病|shēngbìng|to get sick|🤒
医生|yīshēng|doctor|🧑‍⚕️
睡觉|shuìjiào|to sleep|😴
洗手|xǐ shǒu|to wash hands|🧼
"""),
 dict(id="weather", en="Weather & Seasons", zh="天气", py="tiānqì", emoji="⛄", color="#74c0fc",
  city=dict(hz="哈尔滨", py="Hā'ěrbīn", en="Harbin", lat=45.80, lon=126.53,
   fact="Harbin winters are freezing, often below -20 °C. Every winter the Ice and Snow Festival builds giant glowing castles out of ice."),
  words="""
天气|tiānqì|weather|🌦️
太阳|tàiyáng|sun|☀️
云|yún|cloud|☁️
风|fēng|wind|💨
下雨|xià yǔ|to rain|🌧️
下雪|xià xuě|to snow|🌨️
晴天|qíngtiān|sunny day|🌞
冷|lěng|cold|🥶
热|rè|hot|🥵
很|hěn|very|‼️
春天|chūntiān|spring|🌸
夏天|xiàtiān|summer|🏖️
秋天|qiūtiān|autumn, fall|🍂
冬天|dōngtiān|winter|⛄
雨伞|yǔsǎn|umbrella|☂️
"""),
 dict(id="places", en="Places & Directions", zh="地方和方向", py="dìfang hé fāngxiàng", emoji="🧭", color="#ff8787",
  city=dict(hz="香港", py="Xiānggǎng", en="Hong Kong", lat=22.32, lon=114.17,
   fact="Hong Kong means \"fragrant harbor\". It has more skyscrapers than almost any city on Earth, so you need good directions!"),
  words="""
在|zài|at, in; to be (somewhere)|📍
哪儿|nǎr|where|🧭
这儿|zhèr|here|👇
那儿|nàr|there|👉
去|qù|to go|🚌
来|lái|to come|🔙
走|zǒu|to walk; to go|🚶
左边|zuǒbian|left side|⬅️
右边|yòubian|right side|➡️
前面|qiánmian|in front|⬆️
后面|hòumian|behind|⬇️
远|yuǎn|far|🔭
近|jìn|near, close|📏
商店|shāngdiàn|shop, store|🏪
医院|yīyuàn|hospital|🏥
公园|gōngyuán|park|🌳
饭馆|fànguǎn|restaurant|🍽️
中国|Zhōngguó|China|🏯
"""),
 dict(id="hobbies", en="Hobbies & Sports", zh="爱好", py="àihào", emoji="⚽", color="#38d9a9",
  city=dict(hz="青岛", py="Qīngdǎo", en="Qingdao", lat=36.07, lon=120.38,
   fact="Qingdao is a seaside city with beaches and red-roofed houses. The sailing races of the 2008 Beijing Olympics were held here."),
  words="""
玩|wán|to play; have fun|🪁
唱歌|chàng gē|to sing|🎤
跳舞|tiào wǔ|to dance|💃
画画|huà huà|to draw, paint|🎨
看书|kàn shū|to read (books)|📚
看电视|kàn diànshì|to watch TV|📺
电脑|diànnǎo|computer|💻
踢足球|tī zúqiú|to play soccer|⚽
打篮球|dǎ lánqiú|to play basketball|🏀
游泳|yóuyǒng|to swim|🏊
跑步|pǎobù|to run, jog|🏃
弹钢琴|tán gāngqín|to play the piano|🎹
下棋|xià qí|to play chess|♟️
演戏|yǎnxì|to act (in a play)|🎭
会|huì|can, know how to|💪
一起|yìqǐ|together|🫂
"""),
 dict(id="feelings", en="Feelings", zh="心情", py="xīnqíng", emoji="😄", color="#e599f7",
  city=dict(hz="上海", py="Shànghǎi", en="Shanghai", lat=31.23, lon=121.47,
   fact="Shanghai is one of the biggest cities in the world. The Shanghai Tower, 632 meters tall, is the tallest building in China."),
  words="""
高兴|gāoxìng|happy, glad|😀
开心|kāixīn|happy, cheerful|😄
难过|nánguò|sad|😢
生气|shēngqì|angry|😠
害怕|hàipà|scared|😱
累|lèi|tired|🥱
忙|máng|busy|⏰
无聊|wúliáo|bored|😑
担心|dānxīn|to worry|😟
想|xiǎng|to want to; to miss; to think|💭
觉得|juéde|to feel; to think|🤔
怎么样|zěnmeyàng|how is it? how about...?|🤷
太好了|tài hǎo le|great! wonderful!|🎉
没事|méishì|it's nothing; I'm OK|🙆
笑|xiào|to laugh; to smile|😂
哭|kū|to cry|😭
"""),
]

# Order of the journey (a loop around China starting in Beijing).
UNIT_ORDER = ["greet", "numbers", "animals", "family", "colors", "food", "places", "body", "feelings", "school", "hobbies", "weather"]

# Sentence builder: (unit, tokens, english[, [other accepted word orders]]). Final punctuation is shown, not dragged.
SENTENCES = [
 ("greet", "我/wǒ 叫/jiào 小明/Xiǎo_Míng 。", "My name is Xiaoming."),
 ("greet", "你/nǐ 叫/jiào 什么/shénme 名字/míngzi ？", "What is your name?"),
 ("greet", "他/tā 是/shì 我/wǒ 的/de 朋友/péngyou 。", "He is my friend.", ["我的朋友是他"]),
 ("greet", "你/nǐ 是/shì 老师/lǎoshī 吗/ma ？", "Are you a teacher?"),
 ("numbers", "我/wǒ 今年/jīnnián 十/shí 岁/suì 。", "I am ten years old this year."),
 ("numbers", "现在/xiànzài 几/jǐ 点/diǎn ？", "What time is it now?"),
 ("numbers", "今天/jīntiān 是/shì 星期五/xīngqīwǔ 。", "Today is Friday."),
 ("numbers", "我/wǒ 有/yǒu 两/liǎng 本/běn 书/shū 。", "I have two books."),
 ("family", "我/wǒ 家/jiā 有/yǒu 四/sì 口/kǒu 人/rén 。", "There are four people in my family."),
 ("family", "我/wǒ 有/yǒu 一个/yí_ge 妹妹/mèimei 。", "I have a younger sister."),
 ("family", "我/wǒ 爱/ài 爸爸/bàba 和/hé 妈妈/māma 。", "I love Dad and Mom.", ["我爱妈妈和爸爸"]),
 ("food", "我/wǒ 想/xiǎng 吃/chī 饺子/jiǎozi 。", "I would like to eat dumplings."),
 ("food", "你/nǐ 要/yào 喝/hē 什么/shénme ？", "What would you like to drink?"),
 ("food", "这个/zhège 包子/bāozi 很/hěn 好吃/hǎochī 。", "This steamed bun is very tasty."),
 ("food", "我/wǒ 要/yào 一/yì 杯/bēi 牛奶/niúnǎi 。", "I'd like a glass of milk."),
 ("animals", "熊猫/xióngmāo 很/hěn 可爱/kě'ài 。", "Pandas are very cute."),
 ("animals", "我/wǒ 家/jiā 有/yǒu 一/yì 只/zhī 猫/māo 。", "My family has a cat."),
 ("animals", "你/nǐ 喜欢/xǐhuan 狗/gǒu 吗/ma ？", "Do you like dogs?"),
 ("colors", "我/wǒ 最/zuì 喜欢/xǐhuan 蓝色/lánsè 。", "I like blue the most."),
 ("colors", "你/nǐ 喜欢/xǐhuan 什么/shénme 颜色/yánsè ？", "What color do you like?"),
 ("colors", "这个/zhège 苹果/píngguǒ 是/shì 红色/hóngsè 的/de 。", "This apple is red."),
 ("school", "我/wǒ 是/shì 学生/xuésheng 。", "I am a student."),
 ("school", "我们/wǒmen 一起/yìqǐ 学习/xuéxí 中文/Zhōngwén 。", "We study Chinese together."),
 ("school", "我/wǒ 有/yǒu 一个/yí_ge 问题/wèntí 。", "I have a question."),
 ("school", "我/wǒ 不/bù 懂/dǒng 。", "I don't understand."),
 ("body", "我/wǒ 头/tóu 疼/téng 。", "I have a headache. (My head hurts.)"),
 ("body", "吃饭/chī_fàn 以前/yǐqián 要/yào 洗手/xǐ_shǒu 。", "Wash your hands before you eat."),
 ("body", "我/wǒ 要/yào 去/qù 看/kàn 医生/yīshēng 。", "I need to go see a doctor."),
 ("weather", "今天/jīntiān 天气/tiānqì 很/hěn 好/hǎo 。", "The weather is very nice today."),
 ("weather", "外面/wàimian 在/zài 下雨/xià_yǔ 。", "It is raining outside."),
 ("weather", "冬天/dōngtiān 很/hěn 冷/lěng 。", "Winter is very cold."),
 ("weather", "明天/míngtiān 会/huì 下雪/xià_xuě 吗/ma ？", "Will it snow tomorrow?"),
 ("places", "洗手间/xǐshǒujiān 在/zài 哪儿/nǎr ？", "Where is the restroom?"),
 ("places", "公园/gōngyuán 在/zài 学校/xuéxiào 后面/hòumian 。", "The park is behind the school."),
 ("places", "商店/shāngdiàn 在/zài 左边/zuǒbian 。", "The shop is on the left."),
 ("places", "我/wǒ 想/xiǎng 去/qù 中国/Zhōngguó 。", "I want to go to China."),
 ("hobbies", "我/wǒ 会/huì 弹/tán 钢琴/gāngqín 。", "I can play the piano."),
 ("hobbies", "我们/wǒmen 一起/yìqǐ 去/qù 踢/tī 足球/zúqiú 吧/ba ！", "Let's go play soccer together!"),
 ("hobbies", "你/nǐ 会/huì 下棋/xià_qí 吗/ma ？", "Can you play chess?"),
 ("hobbies", "我/wǒ 喜欢/xǐhuan 演戏/yǎnxì 。", "I like acting."),
 ("feelings", "我/wǒ 今天/jīntiān 很/hěn 高兴/gāoxìng 。", "I am very happy today.", ["今天我很高兴"]),
 ("feelings", "你/nǐ 怎么/zěnme 了/le ？", "What's wrong? (What happened to you?)"),
 ("feelings", "别/bié 害怕/hàipà 。", "Don't be scared."),
 ("feelings", "我/wǒ 觉得/juéde 有点儿/yǒudiǎnr 累/lèi 。", "I feel a little tired."),
]

# Graded readers: one per unit. Questions: (question, [correct, wrong, wrong]).
READINGS = [
 dict(unit="greet", title="新朋友", py="xīn péngyou", en="A New Friend",
  text="你好/nǐ_hǎo ！ 我/wǒ 叫/jiào 小明/Xiǎo_Míng 。 我/wǒ 是/shì 学生/xuésheng 。 我/wǒ 的/de 朋友/péngyou 叫/jiào 大卫/Dàwèi 。 大卫/Dàwèi 是/shì 美国人/Měiguó_rén 。 他/tā 会/huì 说/shuō 一点儿/yìdiǎnr 中文/Zhōngwén 。 我们/wǒmen 是/shì 好/hǎo 朋友/péngyou 。",
  trans="Hello! My name is Xiaoming. I am a student. My friend is called David. David is American. He can speak a little Chinese. We are good friends.",
  qs=[("What is the friend's name?", ["大卫 David", "小明 Xiaoming", "老师 the teacher"]),
      ("Where is David from?", ["America", "China", "England"]),
      ("How much Chinese can David speak?", ["A little", "A lot", "None at all"])]),
 dict(unit="numbers", title="我的生日", py="wǒ de shēngrì", en="My Birthday",
  text="今天/jīntiān 是/shì 五月/wǔyuè 八号/bā_hào ， 是/shì 我/wǒ 的/de 生日/shēngrì 。 我/wǒ 今年/jīnnián 十/shí 岁/suì 了/le 。 我/wǒ 妹妹/mèimei 七/qī 岁/suì 。 妈妈/māma 买/mǎi 了/le 一个/yí_ge 大/dà 蛋糕/dàngāo 。 我们/wǒmen 晚上/wǎnshang 七/qī 点/diǎn 吃/chī 蛋糕/dàngāo 。",
  trans="Today is May 8th. It's my birthday. I am ten years old this year. My younger sister is seven. Mom bought a big cake. We eat the cake at seven o'clock in the evening.",
  qs=[("When is the birthday?", ["May 8", "August 5", "July 10"]),
      ("How old is the younger sister?", ["7", "10", "8"]),
      ("When do they eat the cake?", ["7 o'clock in the evening", "8 o'clock in the morning", "10 o'clock at night"])]),
 dict(unit="family", title="我的家", py="wǒ de jiā", en="My Family",
  text="我/wǒ 家/jiā 有/yǒu 四/sì 口/kǒu 人/rén ： 爸爸/bàba 、 妈妈/māma 、 哥哥/gēge 和/hé 我/wǒ 。 爸爸/bàba 是/shì 医生/yīshēng ， 妈妈/māma 是/shì 老师/lǎoshī 。 哥哥/gēge 十二/shí'èr 岁/suì ， 他/tā 很/hěn 喜欢/xǐhuan 打/dǎ 篮球/lánqiú 。 爷爷/yéye 和/hé 奶奶/nǎinai 住/zhù 在/zài 北京/Běijīng 。 我/wǒ 爱/ài 我/wǒ 的/de 家/jiā ！",
  trans="There are four people in my family: Dad, Mom, my older brother and me. Dad is a doctor and Mom is a teacher. My older brother is twelve, and he really likes playing basketball. Grandpa and Grandma live in Beijing. I love my family!",
  qs=[("How many people are in the family?", ["4", "5", "6"]),
      ("What is Mom's job?", ["Teacher", "Doctor", "Student"]),
      ("Where do Grandpa and Grandma live?", ["Beijing", "Shanghai", "America"])]),
 dict(unit="food", title="在饭馆", py="zài fànguǎn", en="At the Restaurant",
  text="中午/zhōngwǔ 我们/wǒmen 去/qù 饭馆/fànguǎn 吃饭/chī_fàn 。 我/wǒ 很/hěn 饿/è 。 我/wǒ 要/yào 一/yì 碗/wǎn 面条/miàntiáo ， 妹妹/mèimei 要/yào 饺子/jiǎozi 。 爸爸/bàba 喝/hē 茶/chá ， 我/wǒ 喝/hē 水/shuǐ 。 面条/miàntiáo 很/hěn 好吃/hǎochī ！",
  trans="At noon we go to a restaurant to eat. I am very hungry. I order a bowl of noodles, and my younger sister orders dumplings. Dad drinks tea and I drink water. The noodles are delicious!",
  qs=[("What does the writer order?", ["A bowl of noodles", "Dumplings", "Rice"]),
      ("What does Dad drink?", ["Tea", "Water", "Milk"]),
      ("When do they go to the restaurant?", ["At noon", "In the morning", "At night"])]),
 dict(unit="animals", title="熊猫", py="xióngmāo", en="Pandas",
  text="熊猫/xióngmāo 是/shì 黑色/hēisè 和/hé 白色/báisè 的/de 。 很多/hěn_duō 熊猫/xióngmāo 住/zhù 在/zài 四川/Sìchuān 。 熊猫/xióngmāo 喜欢/xǐhuan 吃/chī 竹子/zhúzi 。 熊猫/xióngmāo 也/yě 很/hěn 喜欢/xǐhuan 睡觉/shuìjiào 。 大家/dàjiā 都/dōu 觉得/juéde 熊猫/xióngmāo 很/hěn 可爱/kě'ài 。",
  trans="Pandas are black and white. Many pandas live in Sichuan. Pandas like to eat bamboo. Pandas also really like to sleep. Everyone thinks pandas are very cute.",
  qs=[("What colors are pandas?", ["Black and white", "Red and yellow", "Brown and white"]),
      ("What do pandas like to eat?", ["Bamboo", "Fish", "Apples"]),
      ("Where do many pandas live?", ["Sichuan", "Beijing", "Harbin"])]),
 dict(unit="colors", title="彩虹", py="cǎihóng", en="The Rainbow",
  text="下雨/xià_yǔ 以后/yǐhòu ， 天上/tiānshàng 有/yǒu 一/yì 条/tiáo 彩虹/cǎihóng 。 彩虹/cǎihóng 有/yǒu 七/qī 种/zhǒng 颜色/yánsè ： 红/hóng 、 橙/chéng 、 黄/huáng 、 绿/lǜ 、 青/qīng 、 蓝/lán 、 紫/zǐ 。 我/wǒ 最/zuì 喜欢/xǐhuan 绿色/lǜsè 。 妹妹/mèimei 最/zuì 喜欢/xǐhuan 紫色/zǐsè 。 你/nǐ 呢/ne ？",
  trans="After it rains, there is a rainbow in the sky. A rainbow has seven colors: red, orange, yellow, green, cyan, blue and purple. I like green the most. My younger sister likes purple the most. What about you?",
  qs=[("When is there a rainbow?", ["After it rains", "At night", "When it snows"]),
      ("How many colors does the rainbow have?", ["7", "5", "10"]),
      ("What is the younger sister's favorite color?", ["Purple", "Green", "Red"])]),
 dict(unit="school", title="我的学校", py="wǒ de xuéxiào", en="My School",
  text="我/wǒ 的/de 学校/xuéxiào 很/hěn 大/dà 。 我们/wǒmen 早上/zǎoshang 八/bā 点/diǎn 上课/shàngkè 。 我/wǒ 最/zuì 喜欢/xǐhuan 中文/Zhōngwén 课/kè 。 王/Wáng 老师/lǎoshī 很/hěn 好/hǎo ， 她/tā 教/jiāo 我们/wǒmen 写/xiě 汉字/Hànzì 。 下课/xiàkè 以后/yǐhòu ， 我/wǒ 和/hé 同学/tóngxué 一起/yìqǐ 玩/wán 。",
  trans="My school is very big. Our classes start at eight in the morning. My favorite class is Chinese. Teacher Wang is very nice; she teaches us to write Chinese characters. After class, I play with my classmates.",
  qs=[("What time do classes start?", ["8 in the morning", "7 in the morning", "9 in the morning"]),
      ("What does Teacher Wang teach them?", ["To write Chinese characters", "To sing songs", "To swim"]),
      ("What does the writer do after class?", ["Plays with classmates", "Goes to sleep", "Watches TV"])]),
 dict(unit="body", title="我生病了", py="wǒ shēngbìng le", en="I'm Sick",
  text="今天/jīntiān 早上/zǎoshang 我/wǒ 头/tóu 疼/téng ， 肚子/dùzi 也/yě 疼/téng 。 妈妈/māma 说/shuō ： “ 你/nǐ 生病/shēngbìng 了/le 。 ” 我们/wǒmen 去/qù 医院/yīyuàn 看/kàn 医生/yīshēng 。 医生/yīshēng 说/shuō ： “ 多/duō 喝/hē 水/shuǐ ， 多/duō 睡觉/shuìjiào 。 ” 下午/xiàwǔ 我/wǒ 睡/shuì 了/le 三/sān 个/ge 小时/xiǎoshí 。",
  trans="This morning my head hurt, and my tummy hurt too. Mom said, \"You're sick.\" We went to the hospital to see a doctor. The doctor said, \"Drink lots of water and get lots of sleep.\" In the afternoon I slept for three hours.",
  qs=[("What hurt?", ["Head and tummy", "Feet and hands", "Eyes and ears"]),
      ("What did the doctor say?", ["Drink lots of water and sleep a lot", "Eat lots of candy", "Go play outside"]),
      ("How long did the writer sleep in the afternoon?", ["3 hours", "1 hour", "10 hours"])]),
 dict(unit="weather", title="哈尔滨的冬天", py="Hā'ěrbīn de dōngtiān", en="Winter in Harbin",
  text="哈尔滨/Hā'ěrbīn 的/de 冬天/dōngtiān 非常/fēicháng 冷/lěng ， 常常/chángcháng 下雪/xià_xuě 。 每/měi 年/nián 冬天/dōngtiān ， 哈尔滨/Hā'ěrbīn 都/dōu 有/yǒu 冰雪节/Bīngxuě_Jié 。 很多/hěn_duō 人/rén 去/qù 看/kàn 冰/bīng 做/zuò 的/de 房子/fángzi 。 你/nǐ 要/yào 穿/chuān 很/hěn 多/duō 衣服/yīfu ！",
  trans="Winter in Harbin is extremely cold, and it often snows. Every winter, Harbin has an Ice and Snow Festival. Lots of people go to see houses made of ice. You need to wear lots of clothes!",
  qs=[("What is winter in Harbin like?", ["Extremely cold", "Very hot", "Rainy and warm"]),
      ("What can people see at the festival?", ["Houses made of ice", "Pandas", "A beach"]),
      ("What should you do when you visit?", ["Wear lots of clothes", "Bring an umbrella", "Go swimming"])]),
 dict(unit="places", title="去公园", py="qù gōngyuán", en="Going to the Park",
  text="我/wǒ 家/jiā 离/lí 公园/gōngyuán 很/hěn 近/jìn 。 从/cóng 我/wǒ 家/jiā 一直/yìzhí 走/zǒu ， 商店/shāngdiàn 在/zài 左边/zuǒbian ， 医院/yīyuàn 在/zài 右边/yòubian 。 公园/gōngyuán 就/jiù 在/zài 医院/yīyuàn 后面/hòumian 。 我/wǒ 常常/chángcháng 和/hé 小/xiǎo 狗/gǒu 一起/yìqǐ 去/qù 公园/gōngyuán 。",
  trans="My home is very close to the park. If you walk straight from my home, the shop is on the left and the hospital is on the right. The park is right behind the hospital. I often go to the park with my little dog.",
  qs=[("Is the park far from home?", ["No, it's very close", "Yes, it's very far", "It's in another city"]),
      ("Where is the shop?", ["On the left", "On the right", "Behind the hospital"]),
      ("Where is the park?", ["Behind the hospital", "In front of the school", "Next to the shop"])]),
 dict(unit="hobbies", title="我的周末", py="wǒ de zhōumò", en="My Weekend",
  text="周末/zhōumò 我/wǒ 很/hěn 忙/máng ！ 星期六/xīngqīliù 上午/shàngwǔ 我/wǒ 学/xué 弹/tán 钢琴/gāngqín ， 下午/xiàwǔ 我/wǒ 去/qù 踢/tī 足球/zúqiú 。 星期天/xīngqītiān 我/wǒ 和/hé 朋友/péngyou 一起/yìqǐ 演戏/yǎnxì 。 我/wǒ 演/yǎn 一/yì 只/zhī 老虎/lǎohǔ ， 大家/dàjiā 都/dōu 笑/xiào 了/le 。",
  trans="I'm very busy on the weekend! On Saturday morning I learn piano, and in the afternoon I go play soccer. On Sunday my friends and I put on a play together. I play a tiger, and everyone laughs.",
  qs=[("What does the writer do on Saturday morning?", ["Learns piano", "Plays soccer", "Swims"]),
      ("What does the writer do on Sunday?", ["Acts in a play with friends", "Goes to school", "Draws pictures"]),
      ("What animal does the writer play?", ["A tiger", "A panda", "A dragon"])]),
 dict(unit="feelings", title="第一次上台", py="dì yī cì shàngtái", en="My First Time on Stage",
  text="今天/jīntiān 我/wǒ 第一/dì_yī 次/cì 上台/shàngtái 演戏/yǎnxì 。 上台/shàngtái 以前/yǐqián ， 我/wǒ 有点儿/yǒudiǎnr 害怕/hàipà 。 妈妈/māma 说/shuō ： “ 别/bié 担心/dānxīn ， 你/nǐ 可以/kěyǐ 的/de ！ ” 演/yǎn 完/wán 以后/yǐhòu ， 大家/dàjiā 都/dōu 给/gěi 我/wǒ 鼓掌/gǔzhǎng 。 我/wǒ 非常/fēicháng 开心/kāixīn ！",
  trans="Today I acted on stage for the first time. Before going on stage, I was a little scared. Mom said, \"Don't worry, you can do it!\" After the show, everyone clapped for me. I was super happy!",
  qs=[("How did the writer feel before going on stage?", ["A little scared", "Angry", "Bored"]),
      ("What did Mom say?", ["Don't worry, you can do it!", "Let's go home.", "You're sick."]),
      ("How did the writer feel at the end?", ["Super happy", "Sad", "Tired"])]),
]

# Role-play scenes. Lines: (speaker "A"/"B", tokens, english, acting tip)
DIALOGUES = [
 dict(id="friend", unit="greet", title="新朋友", py="xīn péngyou", en="Making a New Friend", emoji="🤝",
  roles={"A": "You (new kid)", "B": "Anna (classmate)"}, setting="First day at a new school. You spot someone friendly on the playground.",
  lines=[
   ("A", "你好/nǐ_hǎo ！ 你/nǐ 叫/jiào 什么/shénme 名字/míngzi ？", "Hi! What's your name?", "Wave and smile big."),
   ("B", "我/wǒ 叫/jiào 安娜/Ānnà 。 你/nǐ 呢/ne ？", "My name is Anna. And you?", "A little shy at first."),
   ("A", "我/wǒ 叫/jiào 小龙/Xiǎolóng 。 你/nǐ 几/jǐ 岁/suì ？", "I'm Xiaolong. How old are you?", "Point to yourself on 我."),
   ("B", "我/wǒ 九/jiǔ 岁/suì 。 你/nǐ 呢/ne ？", "I'm nine. How about you?", "Hold up nine fingers."),
   ("A", "我/wǒ 十/shí 岁/suì 。 我们/wǒmen 做/zuò 朋友/péngyou 吧/ba ！", "I'm ten. Let's be friends!", "Hold out your hand for a handshake."),
   ("B", "好/hǎo 啊/a ！", "Sure!", "Shake hands, super happy."),
  ]),
 dict(id="restaurant", unit="food", title="在饭馆", py="zài fànguǎn", en="Ordering at a Restaurant", emoji="🍜",
  roles={"A": "Waiter", "B": "You (hungry customer)"}, setting="A busy noodle restaurant. You are VERY hungry.",
  lines=[
   ("A", "你好/nǐ_hǎo ！ 你/nǐ 想/xiǎng 吃/chī 什么/shénme ？", "Hello! What would you like to eat?", "Hold a pretend notepad."),
   ("B", "我/wǒ 要/yào 一/yì 碗/wǎn 面条/miàntiáo 和/hé 十/shí 个/ge 饺子/jiǎozi 。", "I'd like a bowl of noodles and ten dumplings.", "Rub your tummy. So hungry!"),
   ("A", "好的/hǎo_de 。 你/nǐ 要/yào 喝/hē 什么/shénme ？", "OK. What would you like to drink?", "Pretend to write it down."),
   ("B", "我/wǒ 要/yào 一/yì 杯/bēi 茶/chá ， 谢谢/xièxie 。", "A cup of tea, please. Thank you.", "Polite and calm."),
   ("A", "还/hái 要/yào 别的/biéde 吗/ma ？", "Anything else?", "Lean in, eyebrows up."),
   ("B", "不要/bú_yào 了/le 。 一共/yígòng 多少/duōshao 钱/qián ？", "No, that's all. How much is it altogether?", "Shake your head, then reach for your wallet."),
   ("A", "一共/yígòng 五十/wǔshí 块/kuài 。", "Fifty yuan altogether.", "Show five fingers, then ten."),
   ("B", "给/gěi 你/nǐ 。", "Here you go.", "Hand over pretend money."),
  ]),
 dict(id="directions", unit="places", title="问路", py="wèn lù", en="Asking for Directions", emoji="🧭",
  roles={"A": "You (lost tourist)", "B": "Friendly grandpa"}, setting="You are lost in a big city and want to find the park.",
  lines=[
   ("A", "请问/qǐngwèn ， 公园/gōngyuán 在/zài 哪儿/nǎr ？", "Excuse me, where is the park?", "Look around, a bit lost."),
   ("B", "一直/yìzhí 走/zǒu ， 然后/ránhòu 往/wǎng 右/yòu 拐/guǎi 。", "Go straight, then turn right.", "Point straight ahead, then to the right."),
   ("A", "远/yuǎn 不/bu 远/yuǎn ？", "Is it far?", "Look worried about walking."),
   ("B", "不/bù 远/yuǎn ， 很/hěn 近/jìn 。 走/zǒu 五/wǔ 分钟/fēnzhōng 就/jiù 到/dào 了/le 。", "Not far, it's close. Walk five minutes and you're there.", "Slow, kind grandpa voice."),
   ("A", "谢谢/xièxie 您/nín ！", "Thank you! (polite)", "Small bow. 您 is the polite 'you'."),
   ("B", "不客气/bú_kèqi ！", "You're welcome!", "Wave goodbye."),
  ]),
 dict(id="doctor", unit="body", title="看医生", py="kàn yīshēng", en="At the Doctor", emoji="🩺",
  roles={"A": "Doctor", "B": "You (patient)"}, setting="You wake up feeling awful and go to see the doctor.",
  lines=[
   ("A", "你/nǐ 哪儿/nǎr 不/bù 舒服/shūfu ？", "What's wrong? (Where don't you feel well?)", "Calm doctor voice."),
   ("B", "我/wǒ 头/tóu 疼/téng ， 还/hái 有/yǒu 一点儿/yìdiǎnr 发烧/fāshāo 。", "I have a headache, and a little fever too.", "Hold your head. Sound tired."),
   ("A", "张开/zhāngkāi 嘴/zuǐ ， 说/shuō “ 啊/ā ” 。", "Open your mouth and say \"ah\".", "Hold up a pretend flashlight."),
   ("B", "啊/ā ！", "Ahh!", "Open wide. Be dramatic!"),
   ("A", "没事/méishì ， 你/nǐ 感冒/gǎnmào 了/le 。 多/duō 喝/hē 水/shuǐ ， 多/duō 休息/xiūxi 。", "Nothing serious. You have a cold. Drink lots of water and rest a lot.", "Pat the patient's shoulder."),
   ("B", "谢谢/xièxie 医生/yīshēng ！", "Thank you, doctor!", "Feeling better already."),
  ]),
 dict(id="market", unit="food", title="买水果", py="mǎi shuǐguǒ", en="Bargaining at the Fruit Market", emoji="🍎",
  roles={"A": "Fruit seller", "B": "You (smart shopper)"}, setting="An outdoor market. The apples look great, but are they too expensive?",
  lines=[
   ("A", "你好/nǐ_hǎo ！ 要/yào 买/mǎi 什么/shénme ？", "Hello! What would you like to buy?", "Loud, cheerful market voice."),
   ("B", "苹果/píngguǒ 多少/duōshao 钱/qián 一/yì 斤/jīn ？", "How much for a jin of apples? (1 jin = half a kilo)", "Pick up a pretend apple."),
   ("A", "八/bā 块/kuài 钱/qián 一/yì 斤/jīn 。", "Eight yuan a jin.", "Proud of your apples."),
   ("B", "太/tài 贵/guì 了/le ！ 便宜/piányi 一点儿/yìdiǎnr 吧/ba 。", "Too expensive! Make it a bit cheaper, please.", "Big shocked face!"),
   ("A", "好/hǎo 吧/ba ， 七/qī 块/kuài 。", "Oh, all right. Seven.", "Sigh dramatically."),
   ("B", "我/wǒ 要/yào 两/liǎng 斤/jīn 。", "I'll take two jin.", "Hold up two fingers, grinning."),
   ("A", "一共/yígòng 十四/shísì 块/kuài 。", "Fourteen yuan altogether.", "Hand over a pretend bag."),
   ("B", "给/gěi 你/nǐ ， 谢谢/xièxie ！", "Here you go. Thanks!", "Pay and wave."),
  ]),
 dict(id="zoo", unit="animals", title="在动物园", py="zài dòngwùyuán", en="At the Zoo", emoji="🐼",
  roles={"A": "You (visitor)", "B": "Zookeeper"}, setting="You finally made it to the panda house!",
  lines=[
   ("A", "请问/qǐngwèn ， 熊猫/xióngmāo 在/zài 哪儿/nǎr ？", "Excuse me, where are the pandas?", "Bouncing with excitement."),
   ("B", "熊猫/xióngmāo 在/zài 左边/zuǒbian ， 老虎/lǎohǔ 在/zài 右边/yòubian 。", "The pandas are on the left, the tigers are on the right.", "Point left, then right."),
   ("A", "熊猫/xióngmāo 在/zài 做/zuò 什么/shénme ？", "What is the panda doing?", "Tiptoe and peek."),
   ("B", "它/tā 在/zài 吃/chī 竹子/zhúzi 。", "It's eating bamboo.", "Pretend to munch bamboo like a panda."),
   ("A", "它/tā 太/tài 可爱/kě'ài 了/le ！ 我/wǒ 可以/kěyǐ 拍照/pāizhào 吗/ma ？", "It's so cute! Can I take a picture?", "Hands on cheeks, then hold up a pretend camera."),
   ("B", "可以/kěyǐ ， 但是/dànshì 不要/bú_yào 大声/dàshēng 说话/shuōhuà 。", "Yes, but don't talk loudly.", "Whisper, finger on lips."),
   ("A", "好的/hǎo_de ， 谢谢/xièxie ！", "OK, thanks!", "Whisper back."),
  ]),
 dict(id="birthday", unit="numbers", title="生日快乐", py="shēngrì kuàilè", en="Birthday Party", emoji="🎂",
  roles={"A": "You (guest)", "B": "Birthday kid"}, setting="Your friend's birthday party. You brought a present!",
  lines=[
   ("A", "生日/shēngrì 快乐/kuàilè ！ 这/zhè 是/shì 给/gěi 你/nǐ 的/de 礼物/lǐwù 。", "Happy birthday! This present is for you.", "Hold out a pretend present with both hands."),
   ("B", "谢谢/xièxie ！ 是/shì 什么/shénme ？", "Thanks! What is it?", "Shake the box, curious."),
   ("A", "你/nǐ 打开/dǎkāi 看看/kànkan 。", "Open it and see.", "Mysterious smile."),
   ("B", "哇/wā ， 是/shì 一/yì 本/běn 书/shū ！ 我/wǒ 很/hěn 喜欢/xǐhuan 。", "Wow, it's a book! I really like it.", "Huge surprise!"),
   ("A", "你/nǐ 今年/jīnnián 几/jǐ 岁/suì 了/le ？", "How old are you this year?", "Friendly and curious."),
   ("B", "我/wǒ 十/shí 岁/suì 了/le ！ 我们/wǒmen 吃/chī 蛋糕/dàngāo 吧/ba ！", "I'm ten! Let's eat cake!", "Jump and cheer."),
  ]),
]

# Classic tone set shown in the Tone Trainer intro (all four tones on "ma").
TONE_DEMO = [("妈", "mā", "mom"), ("麻", "má", "hemp; numb"), ("马", "mǎ", "horse"), ("骂", "mà", "to scold")]

# English glosses for words in sentences/readings/dialogues that are not unit vocabulary
# (shown when a word is tapped). Pinyin comes from the token itself.
GLOSS = {
 "小明": "Xiaoming (a name)", "大卫": "David (a name)", "安娜": "Anna (a name)", "小龙": "Xiaolong (a name; \"little dragon\")",
 "王": "Wang (a family name)", "今年": "this year", "星期五": "Friday", "星期六": "Saturday", "星期天": "Sunday",
 "本": "(counter for books)", "人": "person, people", "一个": "one; a (一 + counter 个)", "个": "(general counter word)",
 "这个": "this (one)", "这": "this", "吃饭": "to eat a meal", "以前": "before", "以后": "after", "看": "to look; to see; to watch",
 "好": "good; well", "外面": "outside", "洗手间": "restroom, bathroom", "弹": "to play (piano, guitar...)",
 "钢琴": "piano", "踢": "to kick", "足球": "soccer ball; soccer", "吧": "(let's...; suggestion word)",
 "怎么": "how; why", "了": "(shows a change or something finished)", "别": "don't", "有点儿": "a little, a bit",
 "美国人": "American (person)", "一点儿": "a little", "五月": "May", "八号": "the 8th (day of the month)",
 "生日": "birthday", "买": "to buy", "蛋糕": "cake", "晚上": "evening, night", "十二": "twelve", "十四": "fourteen",
 "五十": "fifty", "打": "to hit; to play (ball games)", "篮球": "basketball", "住": "to live (somewhere)",
 "北京": "Beijing", "中午": "noon", "很多": "a lot of, many", "四川": "Sichuan (a province)", "竹子": "bamboo",
 "也": "also, too", "大家": "everyone", "都": "all; both", "天上": "in the sky", "条": "(counter for long thin things)",
 "彩虹": "rainbow", "种": "kind, type", "红": "red", "橙": "orange", "黄": "yellow", "绿": "green",
 "青": "cyan, blue-green", "蓝": "blue", "紫": "purple", "呢": "(and you? / what about...?)",
 "早上": "morning", "课": "class, lesson", "教": "to teach", "下午": "afternoon", "上午": "morning (before noon)",
 "睡": "to sleep", "小时": "hour", "哈尔滨": "Harbin", "非常": "very, extremely", "常常": "often",
 "每": "every, each", "冰雪节": "Ice and Snow Festival", "冰": "ice", "做": "to do; to make",
 "房子": "house", "穿": "to wear; to put on", "衣服": "clothes", "离": "away from (distance)", "从": "from",
 "一直": "straight ahead; all along", "就": "just; right (then)", "周末": "weekend", "学": "to learn",
 "演": "to act, perform; to play (a role)", "第一": "first", "次": "time (occurrence)", "上台": "to go on stage",
 "可以": "can, may", "完": "to finish", "给": "to give; for", "鼓掌": "to clap, applaud",
 "啊": "ah! (sound word)", "好的": "OK, sure", "还": "also; still", "别的": "other, else",
 "不要": "don't want; don't", "一共": "altogether, in total", "多少": "how many, how much", "钱": "money",
 "块": "yuan (money, spoken)", "请问": "excuse me, may I ask", "然后": "then, after that", "往": "toward",
 "右": "right", "拐": "to turn", "分钟": "minute", "到": "to arrive", "您": "you (polite)",
 "舒服": "comfortable; feeling well", "发烧": "to have a fever", "张开": "to open (wide)",
 "感冒": "to catch a cold; a cold", "休息": "to rest", "斤": "jin (half a kilogram)", "太": "too; so",
 "贵": "expensive", "便宜": "cheap", "它": "it", "拍照": "to take a photo", "但是": "but",
 "大声": "loudly", "说话": "to talk, speak", "快乐": "happy", "礼物": "present, gift", "打开": "to open",
 "看看": "to take a look", "哇": "wow!",
}

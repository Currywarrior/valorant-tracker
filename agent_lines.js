// 每位特工的台詞資料（5 種音效類型）
// zh 欄位為英文原台詞的繁體中文翻譯
const AGENT_LINES = {
  'Jett': [
    { file: 'JettPick.mp3',          zh: '好，出發吧。' },
    { file: 'JettMatchStart1.mp3',   zh: '你以為能跟上我？算了，誰騙得了誰，你跟不上的。' },
    { file: 'JettBarrierDown1.mp3',  zh: '繼續！' },
    { file: 'JettAce1.mp3',          zh: '哈！你們那些表情真該看看！' },
    { file: 'JettKill1.mp3',         zh: '掰！' },
  ],
  'Viper': [
    { file: 'ViperPick.mp3',          zh: '沒有人能永遠憋住呼吸。' },
    { file: 'ViperMatchStart1.mp3',   zh: '只有五個人？真可惜，我帶夠毒害五十個人的量。你不能說我沒準備好。' },
    { file: 'ViperBarrierDown1.mp3',  zh: '我們會讓他們付出代價。' },
    { file: 'ViperAce1.mp3',          zh: '你們想要個反派？我就給你們一個反派！' },
    { file: 'ViperKill1.mp3',         zh: '結束了。' },
  ],
  'Reyna': [
    { file: 'ReynaPick.mp3',          zh: '他們根本不知道我有多冷血。' },
    { file: 'ReynaMatchStart1.mp3',   zh: '這地方以前是什麼無所謂。現在，它只是另一片墓地。' },
    { file: 'ReynaBarrierDown1.mp3',  zh: '擊潰他們。' },
    { file: 'ReynaAce1.mp3',          zh: '在我面前臣服！' },
    { file: 'ReynaKill1.mp3',         zh: '噓。' },
  ],
  'Sage': [
    { file: 'SagePick.mp3',          zh: '我既是盾，也是劍。' },
    { file: 'SageMatchStart1.mp3',   zh: '我的使命是我的禮物。不要害怕接受它。' },
    { file: 'SageBarrierDown1.mp3',  zh: '為我們扭轉局勢。' },
    { file: 'SageAce1.mp3',          zh: '什麼事都要我親自來嗎？' },
    { file: 'SageKill1.mp3',         zh: '你打得很好。' },
  ],
  'Sova': [
    { file: 'SovaPick.mp3',          zh: '無論他們逃到哪裡，我都會找到他們。' },
    { file: 'SovaMatchStart1.mp3',   zh: '這把弓獵過人也獵過猛獸。我發現兩者之間沒什麼差別。' },
    { file: 'SovaBarrierDown1.mp3',  zh: '守護我們的家園。' },
    { file: 'SovaAce1.mp3',          zh: '沒有人剩下了嗎？' },
    { file: 'SovaKill1.mp3',         zh: '擊落。' },
  ],
  'KAYO': [
    { file: 'KAYOPick.mp3',          zh: '來幹吧。' },
    { file: 'KAYOMatchStart1.mp3',   zh: '計畫是先讓機器人上？聰明的選擇。' },
    { file: 'KAYOBarrierDown1.mp3',  zh: '放馬來。' },
    { file: 'KAYOAce1.mp3',          zh: '滾出我的殺戮區！' },
    { file: 'KAYOKill1.mp3',         zh: '擊殺確認。' },
  ],
  'Astra': [
    { file: 'AstraPick.mp3',          zh: '我在更高的維度，兄弟，字面意義上的！' },
    { file: 'AstraMatchStart1.mp3',   zh: '我的計畫聽起來不理性，只是因為你看不到我所看到的！' },
    { file: 'AstraBarrierDown1.mp3',  zh: '幹掉那傢伙。換新能量，走起！' },
    { file: 'AstraAce1.mp3',          zh: '槍口前方永遠是黑暗的。' },
    { file: 'AstraKill1.mp3',         zh: '下輩子好運！' },
  ],
  'Breach': [
    { file: 'BreachPick.mp3',          zh: '擋在我前面試試看，我不怕。' },
    { file: 'BreachMatchStart1.mp3',   zh: '槍口對著我？不就是普通的週二嘛。' },
    { file: 'BreachBarrierDown1.mp3',  zh: '衝！' },
    { file: 'BreachAce1.mp3',          zh: '我在超速運轉！' },
    { file: 'BreachKill1.mp3',         zh: '死了。' },
  ],
  'Brimstone': [
    { file: 'BrimstonePick.mp3',          zh: '他們說我是條老狗？哼，我來讓他們見識見識我還有多少招。' },
    { file: 'BrimstoneMatchStart1.mp3',   zh: '沒有人能死在我前面！我們全部都要回家。' },
    { file: 'BrimstoneBarrierDown1.mp3',  zh: '他們真有膽！' },
    { file: 'BrimstoneAce1.mp3',          zh: '給我滾出這片草坪！' },
    { file: 'BrimstoneKill1.mp3',         zh: '解決掉了。' },
  ],
  'Cypher': [
    { file: 'CypherPick.mp3',          zh: '沒有什麼能從我眼前逃過。什麼都不行。' },
    { file: 'CypherMatchStart1.mp3',   zh: '他們很害怕。就算沒有攝影機，我也能看出來。' },
    { file: 'CypherBarrierDown1.mp3',  zh: '他們無處可藏。' },
    { file: 'CypherAce1.mp3',          zh: '你死了，但我什麼感覺都沒有。連一絲刺激感都沒有。' },
    { file: 'CypherKill1.mp3',         zh: '不是針對你個人。' },
  ],
  'Killjoy': [
    { file: 'KilljoyPick.mp3',          zh: '放輕鬆。我已經把什麼都想好了。' },
    { file: 'KilljoyMatchStart1.mp3',   zh: '這個戰場上所有東西都是我做的。對，包括可能殺死我們的那些東西。什麼？你想要我道歉？' },
    { file: 'KilljoyBarrierDown1.mp3',  zh: '冷靜一下，我們夠強的，我們能贏！' },
    { file: 'KilljoyAce1.mp3',          zh: '儘管繼續！再叫我一次技術支援看看！' },
    { file: 'KilljoyKill1.mp3',         zh: '好。' },
  ],
  'Omen': [
    { file: 'OmenPick.mp3',          zh: '我是起點，也是終點。' },
    { file: 'OmenMatchStart1.mp3',   zh: '既然我必須活在這場噩夢裡，我的敵人最好也來陪我。' },
    { file: 'OmenBarrierDown1.mp3',  zh: '我必須撐住。' },
    { file: 'OmenAce1.mp3',          zh: '一群無用的死傢伙。' },
    { file: 'OmenKill1.mp3',         zh: '去死。' },
  ],
  'Phoenix': [
    { file: 'PhoenixPick.mp3',          zh: '坐好看著，這事我來。' },
    { file: 'PhoenixMatchStart1.mp3',   zh: '別擔心，他們說我是天才。不是我說的！不是我說的，寶貝！' },
    { file: 'PhoenixBarrierDown1.mp3',  zh: '保持火力！' },
    { file: 'PhoenixAce1.mp3',          zh: '還想再惹我？哦等等，你沒機會了！' },
    { file: 'PhoenixKill1.mp3',         zh: '殺！' },
  ],
  'Raze': [
    { file: 'RazePick.mp3',          zh: '耶，我來了！' },
    { file: 'RazeMatchStart1.mp3',   zh: '終於回到戰場了！走吧，我有好多新玩具想試試！' },
    { file: 'RazeBarrierDown1.mp3',  zh: '他們傷不了我們分毫！' },
    { file: 'RazeAce1.mp3',          zh: '這叫做附帶損傷！哈！' },
    { file: 'RazeKill1.mp3',         zh: '哈！幹掉一個！' },
  ],
  'Skye': [
    { file: 'SkyePick.mp3',          zh: '好嘞！戰場在哪？' },
    { file: 'SkyeMatchStart1.mp3',   zh: '大家記住，如果我們活下來，今晚在休息室上木工課。靈活的雙手，靈活的腦袋。' },
    { file: 'SkyeBarrierDown1.mp3',  zh: '我們不是對手——走吧！' },
    { file: 'SkyeAce1.mp3',          zh: '我感覺到了。我可以變得更強！' },
    { file: 'SkyeKill1.mp3',         zh: '結束了。' },
  ],
  'Yoru': [
    { file: 'YoruPick.mp3',          zh: '誰都可以打，誰都行。' },
    { file: 'YoruMatchStart1.mp3',   zh: '是要一槍爆頭，還是從背後捅刀？待會再說。' },
    { file: 'YoruBarrierDown1.mp3',  zh: '他們還想要更多？行啊。' },
    { file: 'YoruAce1.mp3',          zh: '再派五個來，我們可以重來！' },
    { file: 'YoruKill1.mp3',         zh: '還有誰？' },
  ],
  'Chamber': [
    { file: 'ChamberPick.mp3',          zh: '你眼光真好，我的朋友。' },
    { file: 'ChamberMatchStart1.mp3',   zh: '不用擔心，有我在這就很簡單。就像早安一樣簡單。' },
    { file: 'ChamberBarrierDown1.mp3',  zh: '盯住目標。' },
    { file: 'ChamberAce1.mp3',          zh: '哦，謝謝，謝謝，你們太客氣了。' },
    { file: 'ChamberKill1.mp3',         zh: '太慢了！' },
  ],
  'Neon': [
    { file: 'NeonPick.mp3',          zh: '讓開，不然電你。' },
    { file: 'NeonMatchStart1.mp3',   zh: '這種秘密行動，我還挺喜歡的。別搞砸它。' },
    { file: 'NeonBarrierDown1.mp3',  zh: '把他們趕出去，我不接待訪客。' },
    { file: 'NeonAce1.mp3',          zh: '你讓我動了真心。大錯特錯。' },
    { file: 'NeonKill1.mp3',         zh: '退後！' },
  ],
  'Fade': [
    { file: 'FadePick.mp3',          zh: '每個人都害怕某些東西。' },
    { file: 'FadeMatchStart1.mp3',   zh: '我付出了沉重的代價才能與夢魘溝通。不要浪費它。' },
    { file: 'FadeBarrierDown1.mp3',  zh: '把他們推回去！' },
    { file: 'FadeAce1.mp3',          zh: '別擔心，所有事都是我做的！' },
    { file: 'FadeKill1.mp3',         zh: '去睡吧！' },
  ],
  'Harbor': [
    { file: 'HarborPick.mp3',          zh: '我們一起把他們壓垮。' },
    { file: 'HarborMatchStart1.mp3',   zh: '裝備充足、休息充分、吃飽喝足。再好的開局不過如此！' },
    { file: 'HarborBarrierDown1.mp3',  zh: '現在，扭轉局面！' },
    { file: 'HarborAce1.mp3',          zh: '歷史會把他們遺忘！' },
    { file: 'HarborKill1.mp3',         zh: '哈。' },
  ],
  'Gekko': [
    { file: 'GekkoPick.mp3',          zh: '注意了老兄，我的夥伴們來了。' },
    { file: 'GekkoMatchStart1.mp3',   zh: '那麼，計畫是什麼？你們想怎麼打都行，我配合。' },
    { file: 'GekkoBarrierDown1.mp3',  zh: '讓他們好看。' },
    { file: 'GekkoAce1.mp3',          zh: '你們就應該待在家！' },
    { file: 'GekkoKill1.mp3',         zh: '收拾掉了。' },
  ],
  'Deadlock': [
    { file: 'DeadlockPick.mp3',          zh: '死，不是選項。' },
    { file: 'DeadlockMatchStart1.mp3',   zh: '奈米線已就緒，來吧各位。' },
    { file: 'DeadlockBarrierDown1.mp3',  zh: '這次不留情。' },
    { file: 'DeadlockAce1.mp3',          zh: '霜巨人都殺不了我，他們有什麼機會？' },
    { file: 'DeadlockKill1.mp3',         zh: '又少一個。' },
  ],
  'Iso': [
    { file: 'IsoPick.mp3',          zh: '訓練夠多了，是時候了。' },
    { file: 'IsoMatchStart1.mp3',   zh: '好，我們來贏這局。' },
    { file: 'IsoBarrierDown1.mp3',  zh: '這次會不一樣。' },
    { file: 'IsoAce1.mp3',          zh: '結束了！接受現實吧。' },
    { file: 'IsoKill1.mp3',         zh: '敵人倒下。' },
  ],
  'Clove': [
    { file: 'ClovePick.mp3',          zh: '我有的是時間。' },
    { file: 'CloveMatchStart1.mp3',   zh: '我到底有沒有在老？還是搞不清楚這個長生不死是怎麼運作的。' },
    { file: 'CloveBarrierDown1.mp3',  zh: '啊糟了，我那顆寵物石頭掉了。' },
    { file: 'CloveAce1.mp3',          zh: '我肚子還不舒服呢，居然做到了！' },
    { file: 'CloveKill1.mp3',         zh: '哈！' },
  ],
  'Vyse': [
    { file: 'VysePick.mp3',          zh: '所有路都終結於我。' },
    { file: 'VyseMatchStart1.mp3',   zh: '戰鬥只是一場有待解決的衝突。專注在解法上，然後執行。' },
    { file: 'VyseBarrierDown1.mp3',  zh: '再來！' },
    { file: 'VyseAce1.mp3',          zh: '我有眼光，我有手段。' },
    { file: 'VyseKill1.mp3',         zh: '不足為道。' },
  ],
  'Tejo': [
    { file: 'TejoPick.mp3',          zh: '新式武器，同樣的戰爭。' },
    { file: 'TejoMatchStart1.mp3',   zh: '運輸機、砲兵、標準作業程序。這就是我所謂的退休生活。' },
    { file: 'TejoBarrierDown1.mp3',  zh: '不擇手段。' },
    { file: 'TejoAce1.mp3',          zh: '別惹老兵。' },
    { file: 'TejoKill1.mp3',         zh: '再見。' },
  ],
  'Waylay': [
    { file: 'WaylayPick.mp3',          zh: '我不是在嘗試，我是在做到。' },
    { file: 'WaylayMatchStart1.mp3',   zh: '又是美好的一天！我愛這份工作。' },
    { file: 'WaylayBarrierDown1.mp3',  zh: '再接再厲。' },
    { file: 'WaylayAce1.mp3',          zh: '你們其他人看清楚了嗎？需要我再示範一次嗎？' },
    { file: 'WaylayKill1.mp3',         zh: '下一位！' },
  ],
  'Miks': [
    { file: 'MiksPick.mp3',          zh: '來鬧一鬧吧！' },
    { file: 'MiksMatchStart1.mp3',   zh: 'Da da，今天 MVP 全都在這了！對，你可以去告訴別人是我說的。' },
    { file: 'MiksBarrierDown1.mp3',  zh: 'Ajmo ekipa，表演時間到了！' },
    { file: 'MiksAce1.mp3',          zh: '不許看輕我的隊伍！' },
    { file: 'MiksKill1.mp3',         zh: 'Ajmo！' },
  ],
  'Veto': [
    { file: 'VetoPick.mp3',          zh: '讓他們一無所得。' },
    { file: 'VetoMatchStart1.mp3',   zh: 'Alors mes amis，說說看，今天要跳進什麼麻煩？' },
    { file: 'VetoBarrierDown1.mp3',  zh: '準備好了，就這樣上。' },
    { file: 'VetoAce1.mp3',          zh: '為地球著想，去練靶場吧。' },
    { file: 'VetoKill1.mp3',         zh: '微不足道。' },
  ],
};

// 所有非 Pick 音效的 CDN 音訊 URL（Pick URL 已存放於 server.js）
const AGENT_AUDIO_URLS = {
  // Jett
  'JettMatchStart1.mp3':   'https://static.wikia.nocookie.net/valorant/images/f/f5/JettMatchStart1.mp3/revision/latest?cb=20210615195915',
  'JettBarrierDown1.mp3':  'https://static.wikia.nocookie.net/valorant/images/e/e2/JettBarrierDown1.mp3/revision/latest?cb=20210615195829',
  'JettAce1.mp3':          'https://static.wikia.nocookie.net/valorant/images/b/b1/JettAce1.mp3/revision/latest?cb=20210615195129',
  'JettKill1.mp3':         'https://static.wikia.nocookie.net/valorant/images/0/0c/JettKill1.mp3/revision/latest?cb=20210615195906',

  // Viper
  'ViperMatchStart1.mp3':   'https://static.wikia.nocookie.net/valorant/images/4/46/ViperMatchStart1.mp3/revision/latest?cb=20210616194727',
  'ViperBarrierDown1.mp3':  'https://static.wikia.nocookie.net/valorant/images/e/ea/ViperBarrierDown1.mp3/revision/latest?cb=20210616194023',
  'ViperAce1.mp3':          'https://static.wikia.nocookie.net/valorant/images/6/6c/ViperAce1.mp3/revision/latest?cb=20210616194009',
  'ViperKill1.mp3':         'https://static.wikia.nocookie.net/valorant/images/b/b0/ViperKill1.mp3/revision/latest?cb=20210616194104',

  // Reyna
  'ReynaMatchStart1.mp3':   'https://static.wikia.nocookie.net/valorant/images/6/65/ReynaMatchStart1.mp3/revision/latest?cb=20210617145145',
  'ReynaBarrierDown1.mp3':  'https://static.wikia.nocookie.net/valorant/images/0/00/ReynaBarrierDown1.mp3/revision/latest?cb=20210617145038',
  'ReynaAce1.mp3':          'https://static.wikia.nocookie.net/valorant/images/2/28/ReynaAce1.mp3/revision/latest?cb=20210617145029',
  'ReynaKill1.mp3':         'https://static.wikia.nocookie.net/valorant/images/c/ce/ReynaKill1.mp3/revision/latest?cb=20210617145114',

  // Sage
  'SageMatchStart1.mp3':   'https://static.wikia.nocookie.net/valorant/images/5/57/SageMatchStart1.mp3/revision/latest?cb=20210618212806',
  'SageBarrierDown1.mp3':  'https://static.wikia.nocookie.net/valorant/images/c/c0/SageBarrierDown1.mp3/revision/latest?cb=20210618212726',
  'SageAce1.mp3':          'https://static.wikia.nocookie.net/valorant/images/e/ea/SageAce1.mp3/revision/latest?cb=20210618212718',
  'SageKill1.mp3':         'https://static.wikia.nocookie.net/valorant/images/5/5c/SageKill1.mp3/revision/latest?cb=20210618212757',

  // Sova
  'SovaMatchStart1.mp3':   'https://static.wikia.nocookie.net/valorant/images/f/ff/SovaMatchStart1.mp3/revision/latest?cb=20210619155931',
  'SovaBarrierDown1.mp3':  'https://static.wikia.nocookie.net/valorant/images/0/05/SovaBarrierDown1.mp3/revision/latest?cb=20210619155841',
  'SovaAce1.mp3':          'https://static.wikia.nocookie.net/valorant/images/6/63/SovaAce1.mp3/revision/latest?cb=20210619155829',
  'SovaKill1.mp3':         'https://static.wikia.nocookie.net/valorant/images/0/0a/SovaKill1.mp3/revision/latest?cb=20210619155921',

  // KAYO
  'KAYOMatchStart1.mp3':   'https://static.wikia.nocookie.net/valorant/images/1/1a/KAYOMatchStart1.mp3/revision/latest?cb=20210623103042',
  'KAYOBarrierDown1.mp3':  'https://static.wikia.nocookie.net/valorant/images/3/3c/KAYOBarrierDown1.mp3/revision/latest?cb=20210623102939',
  'KAYOAce1.mp3':          'https://static.wikia.nocookie.net/valorant/images/b/b7/KAYOAce1.mp3/revision/latest?cb=20210623102925',
  'KAYOKill1.mp3':         'https://static.wikia.nocookie.net/valorant/images/0/00/KAYOKill1.mp3/revision/latest?cb=20210623103031',

  // Astra
  'AstraMatchStart1.mp3':   'https://static.wikia.nocookie.net/valorant/images/8/88/AstraMatchStart1.mp3/revision/latest?cb=20210624210446',
  'AstraBarrierDown1.mp3':  'https://static.wikia.nocookie.net/valorant/images/c/cd/AstraBarrierDown1.mp3/revision/latest?cb=20210624210251',
  'AstraAce1.mp3':          'https://static.wikia.nocookie.net/valorant/images/5/5f/AstraAce1.mp3/revision/latest?cb=20210624210109',
  'AstraKill1.mp3':         'https://static.wikia.nocookie.net/valorant/images/6/6f/AstraKill1.mp3/revision/latest?cb=20210624210210',

  // Breach
  'BreachMatchStart1.mp3':   'https://static.wikia.nocookie.net/valorant/images/7/7f/BreachMatchStart1.mp3/revision/latest?cb=20210628121125',
  'BreachBarrierDown1.mp3':  'https://static.wikia.nocookie.net/valorant/images/3/3f/BreachBarrierDown1.mp3/revision/latest?cb=20210628120820',
  'BreachAce1.mp3':          'https://static.wikia.nocookie.net/valorant/images/6/6b/BreachAce1.mp3/revision/latest?cb=20210628120806',
  'BreachKill1.mp3':         'https://static.wikia.nocookie.net/valorant/images/c/cc/BreachKill1.mp3/revision/latest?cb=20210628120904',

  // Brimstone
  'BrimstoneMatchStart1.mp3':   'https://static.wikia.nocookie.net/valorant/images/3/3d/BrimstoneMatchStart1.mp3/revision/latest?cb=20210628202023',
  'BrimstoneBarrierDown1.mp3':  'https://static.wikia.nocookie.net/valorant/images/5/5d/BrimstoneBarrierDown1.mp3/revision/latest?cb=20210628201933',
  'BrimstoneAce1.mp3':          'https://static.wikia.nocookie.net/valorant/images/c/c7/BrimstoneAce1.mp3/revision/latest?cb=20210628201922',
  'BrimstoneKill1.mp3':         'https://static.wikia.nocookie.net/valorant/images/5/5f/BrimstoneKill1.mp3/revision/latest?cb=20210628202013',

  // Cypher
  'CypherMatchStart1.mp3':   'https://static.wikia.nocookie.net/valorant/images/3/34/CypherMatchStart1.mp3/revision/latest?cb=20210630194034',
  'CypherBarrierDown1.mp3':  'https://static.wikia.nocookie.net/valorant/images/2/21/CypherBarrierDown1.mp3/revision/latest?cb=20210630193946',
  'CypherAce1.mp3':          'https://static.wikia.nocookie.net/valorant/images/a/ac/CypherAce1.mp3/revision/latest?cb=20210630193936',
  'CypherKill1.mp3':         'https://static.wikia.nocookie.net/valorant/images/4/44/CypherKill1.mp3/revision/latest?cb=20210630194024',

  // Killjoy
  'KilljoyMatchStart1.mp3':   'https://static.wikia.nocookie.net/valorant/images/0/0a/KilljoyMatchStart1.mp3/revision/latest?cb=20210630213854',
  'KilljoyBarrierDown1.mp3':  'https://static.wikia.nocookie.net/valorant/images/7/7d/KilljoyBarrierDown1.mp3/revision/latest?cb=20210630212113',
  'KilljoyAce1.mp3':          'https://static.wikia.nocookie.net/valorant/images/a/af/KilljoyAce1.mp3/revision/latest?cb=20210630220858',
  'KilljoyKill1.mp3':         'https://static.wikia.nocookie.net/valorant/images/1/14/KilljoyKill1.mp3/revision/latest?cb=20210630212132',

  // Omen
  'OmenMatchStart1.mp3':   'https://static.wikia.nocookie.net/valorant/images/f/f2/OmenMatchStart1.mp3/revision/latest?cb=20210701133621',
  'OmenBarrierDown1.mp3':  'https://static.wikia.nocookie.net/valorant/images/4/48/OmenBarrierDown1.mp3/revision/latest?cb=20210701133537',
  'OmenAce1.mp3':          'https://static.wikia.nocookie.net/valorant/images/7/7a/OmenAce1.mp3/revision/latest?cb=20210701133522',
  'OmenKill1.mp3':         'https://static.wikia.nocookie.net/valorant/images/2/27/OmenKill1.mp3/revision/latest?cb=20210701133607',

  // Phoenix
  'PhoenixMatchStart1.mp3':   'https://static.wikia.nocookie.net/valorant/images/3/31/PhoenixMatchStart1.mp3/revision/latest?cb=20210701172243',
  'PhoenixBarrierDown1.mp3':  'https://static.wikia.nocookie.net/valorant/images/b/b9/PhoenixBarrierDown1.mp3/revision/latest?cb=20210701172101',
  'PhoenixAce1.mp3':          'https://static.wikia.nocookie.net/valorant/images/0/0c/PhoenixAce1.mp3/revision/latest?cb=20210701172036',
  'PhoenixKill1.mp3':         'https://static.wikia.nocookie.net/valorant/images/8/83/PhoenixKill1.mp3/revision/latest?cb=20210701172152',

  // Raze
  'RazeMatchStart1.mp3':   'https://static.wikia.nocookie.net/valorant/images/5/5d/RazeMatchStart1.mp3/revision/latest?cb=20210701204240',
  'RazeBarrierDown1.mp3':  'https://static.wikia.nocookie.net/valorant/images/2/29/RazeBarrierDown1.mp3/revision/latest?cb=20210701204157',
  'RazeAce1.mp3':          'https://static.wikia.nocookie.net/valorant/images/e/e9/RazeAce1.mp3/revision/latest?cb=20210701204147',
  'RazeKill1.mp3':         'https://static.wikia.nocookie.net/valorant/images/2/21/RazeKill1.mp3/revision/latest?cb=20210701204233',

  // Skye
  'SkyeMatchStart1.mp3':   'https://static.wikia.nocookie.net/valorant/images/7/7d/SkyeMatchStart1.mp3/revision/latest?cb=20210702113947',
  'SkyeBarrierDown1.mp3':  'https://static.wikia.nocookie.net/valorant/images/d/d6/SkyeBarrierDown1.mp3/revision/latest?cb=20210702113856',
  'SkyeAce1.mp3':          'https://static.wikia.nocookie.net/valorant/images/2/2e/SkyeAce1.mp3/revision/latest?cb=20210702113846',
  'SkyeKill1.mp3':         'https://static.wikia.nocookie.net/valorant/images/1/13/SkyeKill1.mp3/revision/latest?cb=20210702113935',

  // Yoru
  'YoruMatchStart1.mp3':   'https://static.wikia.nocookie.net/valorant/images/5/57/YoruMatchStart1.mp3/revision/latest?cb=20210702142546',
  'YoruBarrierDown1.mp3':  'https://static.wikia.nocookie.net/valorant/images/1/10/YoruBarrierDown1.mp3/revision/latest?cb=20210702142322',
  'YoruAce1.mp3':          'https://static.wikia.nocookie.net/valorant/images/2/2a/YoruAce1.mp3/revision/latest?cb=20210702142117',
  'YoruKill1.mp3':         'https://static.wikia.nocookie.net/valorant/images/4/48/YoruKill1.mp3/revision/latest?cb=20210702142231',

  // Chamber
  'ChamberMatchStart1.mp3':   'https://static.wikia.nocookie.net/valorant/images/a/af/ChamberMatchStart1.mp3/revision/latest?cb=20211118114433',
  'ChamberBarrierDown1.mp3':  'https://static.wikia.nocookie.net/valorant/images/2/28/ChamberBarrierDown1.mp3/revision/latest?cb=20211118114403',
  'ChamberAce1.mp3':          'https://static.wikia.nocookie.net/valorant/images/f/f5/ChamberAce1.mp3/revision/latest?cb=20211118114357',
  'ChamberKill1.mp3':         'https://static.wikia.nocookie.net/valorant/images/b/b8/ChamberKill1.mp3/revision/latest?cb=20211118114427',

  // Neon
  'NeonMatchStart1.mp3':   'https://static.wikia.nocookie.net/valorant/images/e/ed/NeonMatchStart1.mp3/revision/latest?cb=20220114012819',
  'NeonBarrierDown1.mp3':  'https://static.wikia.nocookie.net/valorant/images/2/22/NeonBarrierDown1.mp3/revision/latest?cb=20220114012741',
  'NeonAce1.mp3':          'https://static.wikia.nocookie.net/valorant/images/9/9f/NeonAce1.mp3/revision/latest?cb=20220114012734',
  'NeonKill1.mp3':         'https://static.wikia.nocookie.net/valorant/images/f/f6/NeonKill1.mp3/revision/latest?cb=20220114012813',

  // Fade
  'FadeMatchStart1.mp3':   'https://static.wikia.nocookie.net/valorant/images/5/57/FadeMatchStart1.mp3/revision/latest?cb=20220428162821',
  'FadeBarrierDown1.mp3':  'https://static.wikia.nocookie.net/valorant/images/b/b6/FadeBarrierDown1.mp3/revision/latest?cb=20220428162701',
  'FadeAce1.mp3':          'https://static.wikia.nocookie.net/valorant/images/2/25/FadeAce1.mp3/revision/latest?cb=20220428162656',
  'FadeKill1.mp3':         'https://static.wikia.nocookie.net/valorant/images/5/55/FadeKill1.mp3/revision/latest?cb=20220428162815',

  // Harbor
  'HarborMatchStart1.mp3':   'https://static.wikia.nocookie.net/valorant/images/8/81/HarborMatchStart1.mp3/revision/latest?cb=20221028112545',
  'HarborBarrierDown1.mp3':  'https://static.wikia.nocookie.net/valorant/images/b/b5/HarborBarrierDown1.mp3/revision/latest?cb=20221028112404',
  'HarborAce1.mp3':          'https://static.wikia.nocookie.net/valorant/images/1/15/HarborAce1.mp3/revision/latest?cb=20221028112555',
  'HarborKill1.mp3':         'https://static.wikia.nocookie.net/valorant/images/b/b7/HarborKill1.mp3/revision/latest?cb=20221028112539',

  // Gekko
  'GekkoMatchStart1.mp3':   'https://static.wikia.nocookie.net/valorant/images/8/8b/GekkoMatchStart1.mp3/revision/latest?cb=20230319220739',
  'GekkoBarrierDown1.mp3':  'https://static.wikia.nocookie.net/valorant/images/3/32/GekkoBarrierDown1.mp3/revision/latest?cb=20230319210219',
  'GekkoAce1.mp3':          'https://static.wikia.nocookie.net/valorant/images/3/3d/GekkoAce1.mp3/revision/latest?cb=20230319220739',
  'GekkoKill1.mp3':         'https://static.wikia.nocookie.net/valorant/images/6/6b/GekkoKill1.mp3/revision/latest?cb=20230319220734',

  // Deadlock
  'DeadlockMatchStart1.mp3':   'https://static.wikia.nocookie.net/valorant/images/8/82/DeadlockMatchStart1.mp3/revision/latest?cb=20230702125712',
  'DeadlockBarrierDown1.mp3':  'https://static.wikia.nocookie.net/valorant/images/c/cb/DeadlockBarrierDown1.mp3/revision/latest?cb=20230702125521',
  'DeadlockAce1.mp3':          'https://static.wikia.nocookie.net/valorant/images/e/e6/DeadlockAce1.mp3/revision/latest?cb=20230702125453',
  'DeadlockKill1.mp3':         'https://static.wikia.nocookie.net/valorant/images/2/2a/DeadlockKill1.mp3/revision/latest?cb=20230702125616',

  // Iso
  'IsoMatchStart1.mp3':   'https://static.wikia.nocookie.net/valorant/images/2/2f/IsoMatchStart1.mp3/revision/latest?cb=20231104173034',
  'IsoBarrierDown1.mp3':  'https://static.wikia.nocookie.net/valorant/images/0/05/IsoBarrierDown1.mp3/revision/latest?cb=20231104173540',
  'IsoAce1.mp3':          'https://static.wikia.nocookie.net/valorant/images/9/9c/IsoAce1.mp3/revision/latest?cb=20231104172940',
  'IsoKill1.mp3':         'https://static.wikia.nocookie.net/valorant/images/1/1f/IsoKill1.mp3/revision/latest?cb=20231104172955',

  // Clove
  'CloveMatchStart1.mp3':   'https://static.wikia.nocookie.net/valorant/images/2/29/CloveMatchStart1.mp3/revision/latest?cb=20240331055624',
  'CloveBarrierDown1.mp3':  'https://static.wikia.nocookie.net/valorant/images/a/a4/CloveBarrierDown1.mp3/revision/latest?cb=20240331055635',
  'CloveAce1.mp3':          'https://static.wikia.nocookie.net/valorant/images/0/0d/CloveAce1.mp3/revision/latest?cb=20240331093020',
  'CloveKill1.mp3':         'https://static.wikia.nocookie.net/valorant/images/8/89/CloveKill1.mp3/revision/latest?cb=20240331093040',

  // Vyse
  'VyseMatchStart1.mp3':   'https://static.wikia.nocookie.net/valorant/images/f/fa/VyseMatchStart1.mp3/revision/latest?cb=20240828091942',
  'VyseBarrierDown1.mp3':  'https://static.wikia.nocookie.net/valorant/images/2/2f/VyseBarrierDown1.mp3/revision/latest?cb=20240828091800',
  'VyseAce1.mp3':          'https://static.wikia.nocookie.net/valorant/images/d/d6/VyseAce1.mp3/revision/latest?cb=20240828094426',
  'VyseKill1.mp3':         'https://static.wikia.nocookie.net/valorant/images/7/7b/VyseKill1.mp3/revision/latest?cb=20240828093512',

  // Tejo
  'TejoMatchStart1.mp3':   'https://static.wikia.nocookie.net/valorant/images/1/1b/TejoMatchStart1.mp3/revision/latest?cb=20250115120033',
  'TejoBarrierDown1.mp3':  'https://static.wikia.nocookie.net/valorant/images/b/b0/TejoBarrierDown1.mp3/revision/latest?cb=20250115113846',
  'TejoAce1.mp3':          'https://static.wikia.nocookie.net/valorant/images/e/e4/TejoAce1.mp3/revision/latest?cb=20250115113831',
  'TejoKill1.mp3':         'https://static.wikia.nocookie.net/valorant/images/6/69/TejoKill1.mp3/revision/latest?cb=20250115114850',

  // Waylay
  'WaylayMatchStart1.mp3':   'https://static.wikia.nocookie.net/valorant/images/8/88/WaylayMatchStart1.mp3/revision/latest?cb=20250309110912',
  'WaylayBarrierDown1.mp3':  'https://static.wikia.nocookie.net/valorant/images/0/0d/WaylayBarrierDown1.mp3/revision/latest?cb=20250309105257',
  'WaylayAce1.mp3':          'https://static.wikia.nocookie.net/valorant/images/c/c4/WaylayAce1.mp3/revision/latest?cb=20250309105211',
  'WaylayKill1.mp3':         'https://static.wikia.nocookie.net/valorant/images/2/2a/WaylayKill1.mp3/revision/latest?cb=20250309110145',

  // 大招語音（UltAllyCast）
  'JettUltAllyCast.mp3':      'https://static.wikia.nocookie.net/valorant/images/8/83/JettUltAllyCast.mp3/revision/latest?cb=20210615195947',
  'ViperUltAllyCast.mp3':     'https://static.wikia.nocookie.net/valorant/images/2/27/ViperUltAllyCast.mp3/revision/latest?cb=20210616194843',
  'ReynaUltAllyCast.mp3':     'https://static.wikia.nocookie.net/valorant/images/9/9f/ReynaUltAllyCast.mp3/revision/latest?cb=20210617145158',
  'SageUltAllyCast.mp3':      'https://static.wikia.nocookie.net/valorant/images/a/a8/SageUltAllyCast.mp3/revision/latest?cb=20210618215051',
  'SovaUltAllyCast.mp3':      'https://static.wikia.nocookie.net/valorant/images/d/d8/SovaUltAllyCast.mp3/revision/latest?cb=20210619160016',
  'KAYOUltAllyCast.mp3':      'https://static.wikia.nocookie.net/valorant/images/8/8e/KAYOUltAllyCast.mp3/revision/latest?cb=20210623103125',
  'AstraUltAllyCast.mp3':     'https://static.wikia.nocookie.net/valorant/images/0/04/AstraUltAllyCast.mp3/revision/latest?cb=20210624210308',
  'BreachUltAllyCast.mp3':    'https://static.wikia.nocookie.net/valorant/images/3/31/BreachUltAllyCast.mp3/revision/latest?cb=20210628120956',
  'BrimstoneUltAllyCast.mp3': 'https://static.wikia.nocookie.net/valorant/images/a/a6/BrimstoneUltAllyCast.mp3/revision/latest?cb=20210628202101',
  'CypherUltAllyCast.mp3':    'https://static.wikia.nocookie.net/valorant/images/0/0a/CypherUltAllyCast.mp3/revision/latest?cb=20210630194116',
  'KilljoyUltAllyCast.mp3':   'https://static.wikia.nocookie.net/valorant/images/c/c6/KilljoyUltAllyCast.mp3/revision/latest?cb=20210630212223',
  'OmenUltAllyCast.mp3':      'https://static.wikia.nocookie.net/valorant/images/3/3a/OmenUltAllyCast.mp3/revision/latest?cb=20210701133701',
  'PhoenixUltAllyCast.mp3':   'https://static.wikia.nocookie.net/valorant/images/1/1e/PhoenixUltAllyCast.mp3/revision/latest?cb=20210701172203',
  'RazeUltAllyCast.mp3':      'https://static.wikia.nocookie.net/valorant/images/0/04/RazeUltAllyCast.mp3/revision/latest?cb=20210701204314',
  'SkyeUltAllyCast.mp3':      'https://static.wikia.nocookie.net/valorant/images/f/f4/SkyeUltAllyCast.mp3/revision/latest?cb=20210702114023',
  'YoruUltAllyCast.mp3':      'https://static.wikia.nocookie.net/valorant/images/5/50/YoruUltAllyCast.mp3/revision/latest?cb=20210702142314',
  'ChamberUltAllyCast.mp3':   'https://static.wikia.nocookie.net/valorant/images/b/b3/ChamberUltAllyCast.mp3/revision/latest?cb=20211118114500',
  'NeonUltAllyCast.mp3':      'https://static.wikia.nocookie.net/valorant/images/1/18/NeonUltAllyCast.mp3/revision/latest?cb=20220114012848',
  'FadeUltAllyCast.mp3':      'https://static.wikia.nocookie.net/valorant/images/d/d6/FadeUltAllyCast.mp3/revision/latest?cb=20220428162926',
  'HarborUltAllyCast.mp3':    'https://static.wikia.nocookie.net/valorant/images/3/32/HarborUltAllyCast.mp3/revision/latest?cb=20221028112403',
  'GekkoUltAllyCast.mp3':     'https://static.wikia.nocookie.net/valorant/images/0/07/GekkoUltAllyCast.mp3/revision/latest?cb=20230318151907',
  'DeadlockUltAllyCast.mp3':  'https://static.wikia.nocookie.net/valorant/images/8/8c/DeadlockUltAllyCast.mp3/revision/latest?cb=20230702125712',
  'IsoUltAllyCast.mp3':       'https://static.wikia.nocookie.net/valorant/images/8/88/IsoUltAllyCast.mp3/revision/latest?cb=20231104173027',
  'CloveUltAllyCast.mp3':     'https://static.wikia.nocookie.net/valorant/images/b/b3/CloveUltAllyCast.mp3/revision/latest?cb=20240331045725',
  'VyseUltAllyCast.mp3':      'https://static.wikia.nocookie.net/valorant/images/d/db/VyseUltAllyCast.mp3/revision/latest?cb=20240828085516',
  'TejoUltAllyCast.mp3':      'https://static.wikia.nocookie.net/valorant/images/a/a8/TejoUltAllyCast.mp3/revision/latest?cb=20250115121628',
  'WaylayUltAllyCast.mp3':    'https://static.wikia.nocookie.net/valorant/images/1/14/WaylayUltAllyCast.mp3/revision/latest?cb=20250304232129',

  // Miks
  'MiksMatchStart1.mp3':     'https://static.wikia.nocookie.net/valorant/images/a/ad/MiksMatchStart1.mp3/revision/latest?cb=20260321010249',
  'MiksBarrierDown1.mp3':    'https://static.wikia.nocookie.net/valorant/images/a/a9/MiksBarrierDown1.mp3/revision/latest?cb=20260321010210',
  'MiksAce1.mp3':            'https://static.wikia.nocookie.net/valorant/images/f/f7/MiksAce1.mp3/revision/latest?cb=20260321010110',
  'MiksKill1.mp3':           'https://static.wikia.nocookie.net/valorant/images/7/72/MiksKill1.mp3/revision/latest?cb=20260321010131',
  'MiksUltAllyCast.mp3':     'https://static.wikia.nocookie.net/valorant/images/8/88/MiksUltAllyCast.mp3/revision/latest?cb=20260321010252',

  // Veto
  'VetoMatchStart1.mp3':     'https://static.wikia.nocookie.net/valorant/images/b/b8/VetoMatchStart1.mp3/revision/latest?cb=20251012160833',
  'VetoBarrierDown1.mp3':    'https://static.wikia.nocookie.net/valorant/images/f/f7/VetoBarrierDown1.mp3/revision/latest?cb=20251012161824',
  'VetoAce1.mp3':            'https://static.wikia.nocookie.net/valorant/images/9/9d/VetoAce1.mp3/revision/latest?cb=20251012163407',
  'VetoKill1.mp3':           'https://static.wikia.nocookie.net/valorant/images/6/68/VetoKill1.mp3/revision/latest?cb=20251012162407',
  'UltVetoUltAllyCast.mp3':  'https://static.wikia.nocookie.net/valorant/images/5/5b/UltVetoUltAllyCast.mp3/revision/latest?cb=20251013105956',
};

module.exports = { AGENT_LINES, AGENT_AUDIO_URLS };

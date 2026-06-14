'use strict';

// ═══════════════════════════════════════════
// 1. 準心游標
// ═══════════════════════════════════════════
function initCrosshair() {
  // 準心外觀由 CSS cursor 渲染（OS 層級，無延遲）
  // DOM 元素只在點擊時出現，播放擴散動畫
  const el = document.createElement('div');
  el.id = 'val-crosshair';
  el.innerHTML = `
    <div class="ch-line ch-top"></div>
    <div class="ch-line ch-bottom"></div>
    <div class="ch-line ch-left"></div>
    <div class="ch-line ch-right"></div>
    <div class="ch-dot"></div>
  `;
  document.body.appendChild(el);

  // 只記錄座標，不移動 DOM 元素
  let mx = 0, my = 0;
  document.addEventListener('pointermove', e => {
    mx = e.clientX; my = e.clientY;
  }, { passive: true });

  // 點擊時把 DOM 元素移到游標位置，重啟動畫（動畫結束後自動淡出）
  document.addEventListener('mousedown', () => {
    el.style.transform = `translate3d(${mx}px,${my}px,0)`;
    el.classList.remove('ch-fire');
    void el.offsetWidth;   // 強制 reflow，讓 animation 從頭播
    el.classList.add('ch-fire');
  });
}

// ═══════════════════════════════════════════
// 2. developerName → 英文顯示名稱 對照表
//    因為 API language=zh-TW 時 displayName 是中文，
//    但 VOICE_LINES 和 Henrik API 都用英文名，
//    所以用 developerName（永遠是英文）來橋接。
// ═══════════════════════════════════════════
const _DEV_TO_EN = {
  'Aggrobot':     'Gekko',
  'BountyHunter': 'Fade',
  'Breach':       'Breach',
  'Cable':        'Deadlock',
  'Cashew':       'Tejo',
  'Clay':         'Raze',
  'Deadeye':      'Chamber',
  'Grenadier':    'KAY/O',
  'Guide':        'Skye',
  'Gumshoe':      'Cypher',
  'Hunter':       'Sova',
  'Iris':         'Miks',
  'Killjoy':      'Killjoy',
  'Mage':         'Harbor',
  'Nox':          'Vyse',
  'Pandemic':     'Viper',
  'Phoenix':      'Phoenix',
  'Pine':         'Veto',
  'Rift':         'Astra',
  'Sarge':        'Brimstone',
  'Sequoia':      'Iso',
  'Smonk':        'Clove',
  'Sprinter':     'Neon',
  'Stealth':      'Yoru',
  'Terra':        'Waylay',
  'Thorne':       'Sage',
  'Vampire':      'Reyna',
  'Wraith':       'Omen',
  'Wushu':        'Jett',
};

// ═══════════════════════════════════════════
// 3. 台詞 + 音效對照表（每條台詞搭配對應音檔）
//    key = 英文顯示名稱（與 Henrik API 的 character 欄位一致）
//    file = wiki CDN 的音檔名（server /api/audio/:file 代理）
//    zh   = 該音檔對應的中文字幕（翻自官方英文台詞）
// ═══════════════════════════════════════════
window.AGENT_LINES = {
  'Jett': [
    { file: 'JettPick.mp3',          zh: '好，出發吧。' },
    { file: 'JettMatchStart1.mp3',   zh: '你以為能跟上我？算了，誰騙得了誰，你跟不上的。' },
    { file: 'JettBarrierDown1.mp3',  zh: '繼續！' },
    { file: 'JettAce1.mp3',          zh: '哈！你們那些表情真該看看！' },
    { file: 'JettKill1.mp3',         zh: '掰！' },
  ],
  'Viper': [
    { file: 'ViperPick.mp3',          zh: '沒有人能永遠憋住呼吸。' },
    { file: 'ViperMatchStart1.mp3',   zh: '只有五個人？真可惜，我帶夠毒害五十個人的量。' },
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
  'KAY/O': [
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
    { file: 'BrimstonePick.mp3',          zh: '他們說我是條老狗？我來讓他們見識見識我還有多少招。' },
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
    { file: 'KilljoyMatchStart1.mp3',   zh: '這個戰場上所有東西都是我做的。對，包括可能殺死我們的那些東西。' },
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
    { file: 'PhoenixMatchStart1.mp3',   zh: '別擔心，他們說我是天才。不是我說的，寶貝！' },
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

// ═══════════════════════════════════════════
// 4. 大招資料（ult name、主題色、語音檔、中文台詞）
// ═══════════════════════════════════════════
const AGENT_ULT_INFO = {
  'Jett':      { name: 'BLADESTORM',        color: '#7DD3FC', file: 'JettUltAllyCast.mp3',      zh: '看好了！',             anim: 'slash' },
  'Viper':     { name: "VIPER'S PIT",       color: '#4ade80', file: 'ViperUltAllyCast.mp3',     zh: '別擋我的路！',         anim: 'void'  },
  'Reyna':     { name: 'EMPRESS',           color: '#c084fc', file: 'ReynaUltAllyCast.mp3',     zh: '他們會俯首稱臣！',     anim: 'aura'  },
  'Sage':      { name: 'RESURRECTION',      color: '#6ee7b7', file: 'SageUltAllyCast.mp3',      zh: '你的責任還沒結束！',   anim: 'aura'  },
  'Sova':      { name: "HUNTER'S FURY",     color: '#60a5fa', file: 'SovaUltAllyCast.mp3',      zh: '我是獵人！',           anim: 'slash' },
  'KAY/O':     { name: 'NULL/cmd',          color: '#94a3b8', file: 'KAYOUltAllyCast.mp3',      zh: '沒人能離開！',         anim: 'pulse' },
  'Astra':     { name: 'COSMIC DIVIDE',     color: '#a78bfa', file: 'AstraUltAllyCast.mp3',     zh: '世界分裂！',           anim: 'pulse' },
  'Breach':    { name: 'ROLLING THUNDER',   color: '#fb923c', file: 'BreachUltAllyCast.mp3',    zh: '衝了！',               anim: 'pulse' },
  'Brimstone': { name: 'ORBITAL STRIKE',    color: '#f87171', file: 'BrimstoneUltAllyCast.mp3', zh: '打開天空！',           anim: 'slash' },
  'Cypher':    { name: 'NEURAL THEFT',      color: '#fbbf24', file: 'CypherUltAllyCast.mp3',    zh: '你們都藏在哪？',       anim: 'void'  },
  'Killjoy':   { name: 'LOCKDOWN',          color: '#fbbf24', file: 'KilljoyUltAllyCast.mp3',   zh: '啟動！',               anim: 'pulse' },
  'Omen':      { name: 'FROM THE SHADOWS',  color: '#818cf8', file: 'OmenUltAllyCast.mp3',      zh: '看他們逃跑！',         anim: 'void'  },
  'Phoenix':   { name: 'RUN IT BACK',       color: '#f59e0b', file: 'PhoenixUltAllyCast.mp3',   zh: '來，走！',             anim: 'aura'  },
  'Raze':      { name: 'SHOWSTOPPER',       color: '#fb923c', file: 'RazeUltAllyCast.mp3',      zh: '派對開始了！',         anim: 'slash' },
  'Skye':      { name: 'SEEKERS',           color: '#34d399', file: 'SkyeUltAllyCast.mp3',      zh: '找出他們！',           anim: 'aura'  },
  'Yoru':      { name: 'DIMENSIONAL DRIFT', color: '#818cf8', file: 'YoruUltAllyCast.mp3',      zh: '我來處理。',           anim: 'void'  },
  'Chamber':   { name: 'TOUR DE FORCE',     color: '#d4af37', file: 'ChamberUltAllyCast.mp3',   zh: '他們死定了。',         anim: 'slash' },
  'Neon':      { name: 'OVERDRIVE',         color: '#22d3ee', file: 'NeonUltAllyCast.mp3',      zh: '走吧！',               anim: 'surge' },
  'Fade':      { name: 'NIGHTFALL',         color: '#7c3aed', file: 'FadeUltAllyCast.mp3',      zh: '面對你的恐懼！',       anim: 'void'  },
  'Harbor':    { name: 'RECKONING',         color: '#38bdf8', file: 'HarborUltAllyCast.mp3',    zh: '扭轉局勢！',           anim: 'pulse' },
  'Gekko':     { name: 'THRASH',            color: '#84cc16', file: 'GekkoUltAllyCast.mp3',     zh: '全交給你了，小傢伙！', anim: 'aura'  },
  'Deadlock':  { name: 'ANNIHILATION',      color: '#e2e8f0', file: 'DeadlockUltAllyCast.mp3',  zh: '把他們拖入墳墓！',     anim: 'pulse' },
  'Iso':       { name: 'KILL CONTRACT',     color: '#f59e0b', file: 'IsoUltAllyCast.mp3',       zh: '沒有干擾！',           anim: 'surge' },
  'Clove':     { name: 'NOT DEAD YET',      color: '#d946ef', file: 'CloveUltAllyCast.mp3',     zh: '我又回來了！',         anim: 'aura'  },
  'Vyse':      { name: 'ARC ROSE',          color: '#2dd4bf', file: 'VyseUltAllyCast.mp3',      zh: '帶我去武器庫！',       anim: 'pulse' },
  'Tejo':      { name: 'ARMAGEDDON',        color: '#ef4444', file: 'TejoUltAllyCast.mp3',      zh: '就到此為止！',         anim: 'slash' },
  'Waylay':    { name: 'BLINDSIDE',         color: '#fb923c', file: 'WaylayUltAllyCast.mp3',    zh: '排好隊，我衝了！',     anim: 'slash' },
  'Miks':      { name: 'BASSQUAKE',        color: '#818cf8', file: 'MiksUltAllyCast.mp3',       zh: '就在這，就是現在！',   anim: 'pulse' },
  'Veto':      { name: 'EVOLUTION',        color: '#f59e0b', file: 'UltVetoUltAllyCast.mp3',    zh: '全部化為塵埃！',       anim: 'pulse' },
};

// ═══════════════════════════════════════════
// 5. 語音播放（透過 server proxy /api/audio/:file 取得真實遊戲音檔）
// ═══════════════════════════════════════════
let _currentAudio = null;

// 主要 API：傳入 wiki 音檔名稱（例如 'JettKill1.mp3'）
window._playAgentAudioFile = function (fileName) {
  if (_currentAudio) { _currentAudio.pause(); _currentAudio = null; }
  const audio = new Audio(`/api/audio/${encodeURIComponent(fileName)}`);
  audio.volume = 0.45;
  audio.play().catch(() => {});
  _currentAudio = audio;
};

// 向後相容：傳英文顯示名稱 → 隨機選一條台詞播放
window._playAgentAudio = function (englishName) {
  const lines = window.AGENT_LINES[englishName];
  if (!lines?.length) return;
  const entry = lines[Math.floor(Math.random() * lines.length)];
  window._playAgentAudioFile(entry.file);
};


// ═══════════════════════════════════════════
// 5. Agent Peek（從螢幕邊緣探出）
// ═══════════════════════════════════════════
let _peekAgents   = [];
let _peekCurrent  = null;
let _peekMouseFn  = null;
let _uuidToEnName = {};  // uuid → 英文 displayName，用來對應 AGENT_LINES / AGENT_ULT_INFO / _UA

window.initAgentPeek = async function () {
  try {
    // 同時抓 zh-TW（UI 顯示用）和 en-US（語音/大招 key 對應用）
    const [zhRes, enRes] = await Promise.all([
      fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true&language=zh-TW'),
      fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true&language=en-US'),
    ]);
    const [zhData, enData] = await Promise.all([zhRes.json(), enRes.json()]);
    _peekAgents = (zhData.data || []).filter(a => a.isPlayableCharacter);
    for (const a of (enData.data || [])) {
      if (a.isPlayableCharacter) _uuidToEnName[a.uuid] = a.displayName;
    }
  } catch { return; }
  if (!_peekAgents.length) return;

  const agent = _peekAgents[Math.floor(Math.random() * _peekAgents.length)];
  _buildPeek(agent);
};

function _buildPeek(agent) {
  document.getElementById('agent-peek')?.remove();
  if (_peekMouseFn) document.removeEventListener('mousemove', _peekMouseFn);

  _peekCurrent = agent;

  const wrap = document.createElement('div');
  wrap.id = 'agent-peek';
  const roleImg = agent.role?.displayIcon
    ? `<img src="${agent.role.displayIcon}" class="peek-role-icon" alt="">`
    : '';

  wrap.innerHTML = `
    <div class="peek-zone" id="peekZone">
      <div class="peek-head" id="peekHead">
        <img src="${agent.bustPortrait || agent.fullPortrait}"
             class="peek-img" draggable="false" alt="${agent.displayName}">
      </div>
      <div class="peek-bubble" id="peekBubble"></div>
    </div>
    <div class="peek-bar">
      <div class="peek-bar-role">${roleImg}</div>
      <span class="peek-bar-name">${agent.displayName}</span>
      <button class="peek-ult-btn" id="peekUlt" title="施放大招 [X]">X</button>
      <button class="peek-bar-btn" id="peekSwitch" title="更換英雄">&#9881;</button>
    </div>
  `;
  document.body.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('peek-in'));

  // 點擊 → 說話 + 彈跳（user-initiated，播 TTS）
  wrap.querySelector('#peekZone').addEventListener('click', () => {
    _peekSpeak(agent, true);
    _peekBounce();
  });

  // 滑鼠追蹤 → 頭部微傾
  _peekMouseFn = e => {
    const head = document.getElementById('peekHead');
    if (!head) return;
    const rc = head.getBoundingClientRect();
    const dx = (e.clientX - (rc.left + rc.width  / 2)) / window.innerWidth;
    const dy = (e.clientY - (rc.top  + rc.height / 2)) / window.innerHeight;
    const rx = Math.max(-7, Math.min(7,  -dy * 10));
    const ry = Math.max(-11,Math.min(11,  dx * 13));
    head.style.transform = `perspective(500px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  };
  document.addEventListener('mousemove', _peekMouseFn, { passive: true });

  // 更換英雄
  wrap.querySelector('#peekSwitch').addEventListener('click', e => {
    e.stopPropagation();
    _showPeekSelector();
  });

  // 大招按鈕
  wrap.querySelector('#peekUlt').addEventListener('click', e => {
    e.stopPropagation();
    _triggerUlt(agent);
  });
}

function _peekSpeak(agent, withVoice) {
  const el = document.getElementById('peekBubble');
  if (!el) return;
  const englishName = _uuidToEnName[agent.uuid] || _DEV_TO_EN[agent.developerName] || agent.developerName;
  const lines = window.AGENT_LINES[englishName];
  if (!lines?.length) { el.textContent = ''; return; }
  const entry = lines[Math.floor(Math.random() * lines.length)];

  el.textContent = entry.zh;
  el.classList.remove('bubble-on');
  void el.offsetWidth;
  el.classList.add('bubble-on');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('bubble-on'), 3400);

  if (withVoice) {
    window._playAgentAudioFile(entry.file);
    const wrap = document.getElementById('agent-peek');
    if (wrap) {
      wrap.classList.add('peek-speaking');
      setTimeout(() => wrap.classList.remove('peek-speaking'), 3000);
    }
  }
}

function _peekBounce() {
  const head = document.getElementById('peekHead');
  if (!head) return;
  head.classList.add('peek-bounce');
  setTimeout(() => head.classList.remove('peek-bounce'), 520);
}

// 英雄選擇器
function _showPeekSelector() {
  document.getElementById('peek-sel')?.remove();

  // 從 API 資料抓角色清單（保持順序）
  const roles = [];
  const seenRoles = new Set();
  for (const a of _peekAgents) {
    const r = a.role?.displayName;
    if (r && !seenRoles.has(r)) { roles.push({ name: r, icon: a.role.displayIcon }); seenRoles.add(r); }
  }

  const modal = document.createElement('div');
  modal.id = 'peek-sel';
  modal.innerHTML = `
    <div class="psel-bg"></div>
    <div class="psel-panel">
      <div class="psel-hdr">
        <span class="psel-title">選擇英雄</span>
        <button class="psel-close-btn" id="pselClose">✕</button>
      </div>
      <div class="psel-roles" id="pselRoles">
        <button class="psel-role-btn psel-role-on" data-role="">全部</button>
        ${roles.map(r => `
          <button class="psel-role-btn" data-role="${r.name}">
            ${r.icon ? `<img src="${r.icon}" class="psel-role-icon" alt="">` : ''}
            ${r.name}
          </button>`).join('')}
      </div>
      <div class="psel-grid" id="pselGrid">
        ${_peekAgents.map((a, i) => {
          const portrait = a.bustPortrait || a.fullPortraitV2 || a.fullPortrait || a.displayIcon || '';
          const delay = Math.min(i * 0.022, 0.36).toFixed(3);
          return `
            <button class="psel-btn${a.uuid === _peekCurrent?.uuid ? ' psel-on' : ''}"
                    data-uuid="${a.uuid}" data-role="${a.role?.displayName || ''}"
                    style="--i:${delay}s" title="${a.displayName}">
              <div class="psel-portrait" style="background-image:url('${portrait}')"></div>
              <span class="psel-name">${a.displayName}</span>
            </button>`;
        }).join('')}
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('psel-in'));

  const close = () => {
    modal.classList.remove('psel-in');
    setTimeout(() => modal.remove(), 280);
  };
  modal.querySelector('#pselClose').addEventListener('click', close);
  modal.querySelector('.psel-bg').addEventListener('click', close);

  // 角色篩選
  modal.querySelector('#pselRoles').addEventListener('click', e => {
    const btn = e.target.closest('.psel-role-btn');
    if (!btn) return;
    modal.querySelectorAll('.psel-role-btn').forEach(b => b.classList.remove('psel-role-on'));
    btn.classList.add('psel-role-on');
    const role = btn.dataset.role;
    modal.querySelectorAll('.psel-btn[data-uuid]').forEach(b => {
      b.style.display = !role || b.dataset.role === role ? '' : 'none';
    });
  });

  modal.querySelectorAll('.psel-btn[data-uuid]').forEach(btn => {
    btn.addEventListener('click', () => {
      const a = _peekAgents.find(x => x.uuid === btn.dataset.uuid);
      if (a) { _buildPeek(a); }
      close();
    });
  });
}

// ═══════════════════════════════════════════
// 7. 大招動畫觸發
// ═══════════════════════════════════════════

// 用固定種子產生閃電折線，避免每次 random 不同
function _genBolt(x, seed) {
  let s = seed >>> 0;
  function rnd() { s = Math.imul(s, 1664525) + 1013904223 >>> 0; return s / 4294967296; }
  let pts = `${x},0`, cy = 0;
  while (cy < 100) {
    cy += 7 + Math.floor(rnd() * 12);
    const cx = Math.min(Math.max(x + (rnd() > 0.5 ? 1 : -1) * (3 + rnd() * 9), 1), 99);
    pts += ` ${cx.toFixed(1)},${Math.min(cy, 100)}`;
  }
  return pts;
}

function _svgBolts(xs, seeds, cls = 'ua-bolt') {
  const lines = xs.map((x, i) =>
    `<polyline points="${_genBolt(x, seeds[i])}" class="${cls}" style="--d:${(i*0.1).toFixed(2)}s"/>`
  ).join('');
  return `<svg class="ua-svg-bolts" viewBox="0 0 100 100" preserveAspectRatio="none">${lines}</svg>`;
}

const _UA = {
  // Jett：8 方向刀刃從中心射出
  'Jett': () => {
    const angles = [0,45,90,135,180,225,270,315];
    return '<div class="ua-jett">' +
      angles.map((a,i) => `<div class="ua-jett-blade" style="--a:${a}deg;--d:${(i*0.04).toFixed(2)}s"></div>`).join('') +
      '</div>';
  },
  // Viper：毒霧從四角蔓延
  'Viper': () =>
    '<div class="ua-viper">' +
    [1,2,3,4].map(i => `<div class="ua-viper-fog ua-viper-fog-${i}"></div>`).join('') +
    '</div>',
  // Reyna：6 個靈魂球從底部升起收斂
  'Reyna': () => {
    const xs = [20,35,50,65,80,50];
    return '<div class="ua-reyna">' +
      xs.map((x,i) => `<div class="ua-reyna-soul" style="--x:${x}%;--d:${(i*0.12).toFixed(2)}s"></div>`).join('') +
      '<div class="ua-reyna-crown"></div></div>';
  },
  // Sage：治癒光球從中央底部升起＋8條光芒
  'Sage': () => {
    const rays = [0,22,45,67,90,112,135,157].map((a,i) =>
      `<div class="ua-sage-ray" style="--a:${a}deg;--d:${(i*0.05).toFixed(2)}s"></div>`
    ).join('');
    return `<div class="ua-sage"><div class="ua-sage-orb"></div>${rays}</div>`;
  },
  // Sova：3 道能量箭從左掃過
  'Sova': () =>
    '<div class="ua-sova">' +
    [[30,0],[50,0.18],[70,0.36]].map(([y,d]) =>
      `<div class="ua-sova-beam" style="--y:${y}%;--d:${d}s"></div>`
    ).join('') +
    '</div>',
  // KAY/O：EMP 六邊形擴散環
  'KAY/O': () =>
    '<div class="ua-kayo">' +
    [0,0.22,0.44,0.66].map((d,i) =>
      `<div class="ua-kayo-emp" style="--d:${d}s;--s:${0.5+i*0.5}"></div>`
    ).join('') +
    '<div class="ua-kayo-flicker"></div></div>',
  // Astra：宇宙分割線橫斷全螢幕
  'Astra': () =>
    '<div class="ua-astra"><div class="ua-astra-divide"></div>' +
    [[8,12],[92,22],[15,60],[80,70],[50,38],[30,82]].map(([x,y],i) =>
      `<div class="ua-astra-star" style="left:${x}%;top:${y}%;--d:${(i*0.07).toFixed(2)}s"></div>`
    ).join('') +
    '</div>',
  // Breach：地裂從螢幕底部中央炸開
  'Breach': () =>
    '<div class="ua-breach">' +
    [[-40,0],[-15,0.08],[0,0.04],[15,0.08],[40,0]].map(([a,d]) =>
      `<div class="ua-breach-crack" style="--a:${a}deg;--d:${d}s"></div>`
    ).join('') +
    '<div class="ua-breach-shockwave"></div></div>',
  // Brimstone：紅色軌道打擊雷射從上方落下
  'Brimstone': () =>
    '<div class="ua-brim"><div class="ua-brim-laser"></div><div class="ua-brim-crater"></div></div>',
  // Cypher：資料線路從中心爆射如電路板
  'Cypher': () => {
    const wires = [[-90,0],[-60,0.06],[-30,0.12],[0,0.08],[30,0.14],[60,0.06],[90,0]].map(([a,d]) =>
      `<div class="ua-cypher-wire" style="--a:${a}deg;--d:${d}s"></div>`
    ).join('');
    return `<div class="ua-cypher">${wires}<div class="ua-cypher-scan"></div></div>`;
  },
  // Killjoy：黃色科技裝置展開＋鎖定波環
  'Killjoy': () =>
    '<div class="ua-kj"><div class="ua-kj-device"></div>' +
    [0,0.28,0.56].map(d => `<div class="ua-kj-ring" style="--d:${d}s"></div>`).join('') +
    '</div>',
  // Omen：黑暗幽靈斜飛過螢幕
  'Omen': () =>
    '<div class="ua-omen">' +
    [[-20,0.0],[-35,0.18],[-5,0.32]].map(([x,d]) =>
      `<div class="ua-omen-shadow" style="--x:${x}%;--d:${d}s"></div>`
    ).join('') +
    '</div>',
  // Phoenix：火焰柱從中央底部升起
  'Phoenix': () =>
    '<div class="ua-phoenix">' +
    [0,0.12,0.24].map(d => `<div class="ua-phoenix-flame" style="--d:${d}s"></div>`).join('') +
    '<div class="ua-phoenix-burst"></div></div>',
  // Raze：火箭飛過＋爆炸
  'Raze': () =>
    '<div class="ua-raze"><div class="ua-raze-rocket"></div><div class="ua-raze-trail"></div><div class="ua-raze-boom"></div></div>',
  // Skye：3 隻黃金探尋者向外飛散
  'Skye': () =>
    '<div class="ua-skye">' +
    [[-30,0],[0,0.14],[30,0.28]].map(([a,d]) =>
      `<div class="ua-skye-seeker" style="--a:${a}deg;--d:${d}s"></div>`
    ).join('') +
    '</div>',
  // Yoru：次元裂縫垂直撕裂，藍紫光芒外洩
  'Yoru': () =>
    '<div class="ua-yoru"><div class="ua-yoru-rift-l"></div><div class="ua-yoru-rift-r"></div><div class="ua-yoru-portal"></div></div>',
  // Chamber：金色狙擊準心從外向內聚焦
  'Chamber': () =>
    '<div class="ua-chamber">' +
    [0,0.2,0.4].map((d,i) => `<div class="ua-chamber-scope" style="--d:${d}s;--sz:${(3-i)*100}px"></div>`).join('') +
    '<div class="ua-chamber-cross"></div></div>',
  // Neon：3 道電弧閃電柱從上方打下
  'Neon': () => _svgBolts([20,50,80],[11,22,33],'ua-bolt-neon'),
  // Fade：黑暗觸手從四邊向中央蔓延
  'Fade': () =>
    '<div class="ua-fade">' +
    ['t','b','l','r'].map((side,i) =>
      `<div class="ua-fade-tendril ua-fade-${side}" style="--d:${(i*0.08).toFixed(2)}s"></div>`
    ).join('') +
    '</div>',
  // Harbor：4 道海浪漣漪從中心依序擴散
  'Harbor': () =>
    '<div class="ua-harbor">' +
    [0,0.28,0.56,0.84].map(d => `<div class="ua-harbor-ripple" style="--d:${d}s"></div>`).join('') +
    '</div>',
  // Gekko：綠色能量爆破＋同心環
  'Gekko': () =>
    '<div class="ua-gekko"><div class="ua-gekko-core"></div>' +
    [0,0.2,0.4].map(d => `<div class="ua-gekko-ring" style="--d:${d}s"></div>`).join('') +
    '</div>',
  // Deadlock：奈米線從四角向中心射入
  'Deadlock': () =>
    '<div class="ua-deadlock">' +
    ['tl','tr','bl','br'].map((pos,i) =>
      `<div class="ua-deadlock-wire ua-deadlock-${pos}" style="--d:${(i*0.07).toFixed(2)}s"></div>`
    ).join('') +
    '</div>',
  // Iso：異次元球體＋電弧
  'Iso': () =>
    '<div class="ua-iso"><div class="ua-iso-sphere"></div>' +
    _svgBolts([30,50,70],[7,17,29],'ua-bolt-iso') +
    '</div>',
  // Clove：粉紫煙霧靈氣升騰
  'Clove': () =>
    '<div class="ua-clove">' +
    [[20,0],[35,0.1],[50,0.05],[65,0.15],[80,0.08]].map(([x,d]) =>
      `<div class="ua-clove-wisp" style="--x:${x}%;--d:${d}s"></div>`
    ).join('') +
    '</div>',
  // Vyse：青金屬尖刺從底部插出
  'Vyse': () =>
    '<div class="ua-vyse">' +
    [[15,0],[30,0.1],[50,0.04],[70,0.1],[85,0]].map(([x,d]) =>
      `<div class="ua-vyse-spike" style="--x:${x}%;--d:${d}s"></div>`
    ).join('') +
    '</div>',
  // Tejo：3 枚飛彈從上方俯衝＋地面爆炸
  'Tejo': () =>
    '<div class="ua-tejo">' +
    [[25,0],[50,0.14],[75,0.28]].map(([x,d]) =>
      `<div class="ua-tejo-missile" style="--x:${x}%;--d:${d}s"></div>` +
      `<div class="ua-tejo-boom" style="--x:${x}%;--d:${(d+0.6).toFixed(2)}s"></div>`
    ).join('') +
    '</div>',
  // Waylay：白橙光束從中心扇形展開
  'Waylay': () =>
    '<div class="ua-waylay">' +
    [[-60,0],[-30,0.06],[0,0.12],[30,0.06],[60,0]].map(([a,d]) =>
      `<div class="ua-waylay-beam" style="--a:${a}deg;--d:${d}s"></div>`
    ).join('') +
    '</div>',
  // Miks：水平橢圓音波從中心向外擴散（Bassquake）
  'Miks': () =>
    '<div class="ua-miks">' +
    [0, 0.18, 0.36, 0.54, 0.72].map(d =>
      `<div class="ua-miks-wave" style="--d:${d}s"></div>`
    ).join('') +
    '</div>',
  // Veto：戰術方框從中心旋轉擴張（Evolution）
  'Veto': () =>
    '<div class="ua-veto">' +
    [0, 0.22, 0.44].map((d, i) =>
      `<div class="ua-veto-square" style="--d:${d}s;--rot:${i * 12}deg"></div>`
    ).join('') +
    '<div class="ua-veto-core"></div></div>',
};

function _buildUltAnimHTML(agentName) {
  return (_UA[agentName] || (() => [0,0.22,0.44].map(d =>
    `<div class="ult-pulse-ring" style="animation-delay:${d}s"></div>`
  ).join('')))();
}

function _triggerUlt(agent) {
  const englishName = _uuidToEnName[agent.uuid] || _DEV_TO_EN[agent.developerName] || agent.developerName;
  const ult = AGENT_ULT_INFO[englishName];
  if (ult?.file) window._playAgentAudioFile(ult.file);

  // 全畫面閃光
  const flash = document.createElement('div');
  flash.className = 'ult-flash-burst';
  flash.style.background = ult?.color || '#FF4655';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 320);

  _buildUltOverlay(agent);
}

function _buildUltOverlay(agent) {
  document.getElementById('ult-overlay')?.remove();

  const englishName = _uuidToEnName[agent.uuid] || _DEV_TO_EN[agent.developerName] || agent.developerName;
  const ult = AGENT_ULT_INFO[englishName] || { name: 'ULTIMATE', color: '#FF4655', zh: '' };
  const col = ult.color;
  const portraitUrl = agent.fullPortraitV2 || agent.fullPortrait || '';

  // 逐字母
  const letters = ult.name.split('').map((ch, i) => {
    const del = (0.30 + i * 0.048).toFixed(3);
    return `<span class="ult-letter" style="animation-delay:${del}s">${ch === ' ' ? '&nbsp;&nbsp;' : ch}</span>`;
  }).join('');

  const ol = document.createElement('div');
  ol.id = 'ult-overlay';
  ol.className = 'ult-overlay';
  ol.style.setProperty('--ult-color', col);

  ol.innerHTML = `
    ${_buildUltAnimHTML(englishName)}
    <div class="ult-hex-grid"></div>
    <div class="ult-scanline"></div>
    <div class="ult-color-bg" style="background:radial-gradient(ellipse 60% 50% at 50% 100%,${col}88,transparent 70%)"></div>
    ${portraitUrl ? `<div class="ult-portrait-wrap"><img class="ult-portrait-img" src="${portraitUrl}" alt="" style="filter:drop-shadow(0 0 40px ${col}99) drop-shadow(0 0 12px ${col})"></div>` : ''}
    <div class="ult-ring"></div>
    <div class="ult-ring ult-ring-2"></div>
    <div class="ult-corner ult-corner-tl"></div>
    <div class="ult-corner ult-corner-tr"></div>
    <div class="ult-corner ult-corner-bl"></div>
    <div class="ult-corner ult-corner-br"></div>
    <div class="ult-text-bottom">
      <span class="ult-type-label">ULTIMATE ABILITY</span>
      <div class="ult-name-wrap">${letters}</div>
      ${ult.zh ? `<span class="ult-quote">"${ult.zh}"</span>` : ''}
    </div>
  `;

  document.body.appendChild(ol);

  // 衝擊震動（延遲一點讓 overlay 先渲染）
  setTimeout(() => {
    ol.classList.add('ult-shake');
    setTimeout(() => ol.classList.remove('ult-shake'), 420);
  }, 120);


  const TOTAL = 3400;
  // 2.6s 後加淡出 class，讓字母和立繪一起消退
  setTimeout(() => ol.classList.add('ult-fading'), TOTAL - 800);
  setTimeout(() => ol.remove(), TOTAL);

  // 點擊提前關閉
  ol.addEventListener('click', () => {
    ol.classList.add('ult-fading');
    setTimeout(() => {
      ol.style.transition = 'opacity 0.18s';
      ol.style.opacity = '0';
      setTimeout(() => ol.remove(), 200);
    }, 180);
  });
}


// ── Kill Feed ──────────────────────────────────────────────────────────────
const _KF_NAMES = [
  'phantom#na1', 'GhostAim#0001', 'RiftWalker#ap2', 'valorKing#eu3',
  'SilverShot#kr1', 'peekmaster#br0', 'vortexGG#ap9', 'duelzone#na7',
  'neonLight#eu5', 'RadiantAce#0420', 'smokescreen#apac', 'lurker#007',
  'flashpoint#sea', 'strikezone#sa2', 'edgerunner#jp1', 'zephyr#hk3',
];

let _kfWeapons     = [];
let _kfScheduleId  = null;

window.initKillFeed = async function () {
  try {
    const r = await fetch('https://valorant-api.com/v1/weapons');
    const d = await r.json();
    _kfWeapons = (d.data || [])
      .filter(w => w.displayIcon && w.category !== 'EEquippableCategory::Melee')
      .map(w => ({ name: w.displayName, icon: w.displayIcon }));
  } catch { return; }

  const burst = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < burst; i++) setTimeout(_kfAdd, 800 + i * 650);
  _kfNext();
};

function _kfNext() {
  _kfScheduleId = setTimeout(() => { _kfAdd(); _kfNext(); }, 6000 + Math.random() * 8000);
}

function _kfAdd() {
  const feed = document.getElementById('killfeed');
  if (!feed || !_peekAgents.length || !_kfWeapons.length) return;

  const pName = document.getElementById('profileName')?.textContent?.trim() || '';
  const pTag  = document.getElementById('profileTag')?.textContent?.trim()  || '';
  const pFull = pName ? `${pName}${pTag}` : '';

  const roll   = Math.random();
  const fakePick = () => _KF_NAMES[Math.floor(Math.random() * _KF_NAMES.length)];
  const fakeDiff = (x) => { let n; do { n = fakePick(); } while (n === x); return n; };

  let killerName, victimName, killerIsPlayer = false, victimIsPlayer = false;
  if (pFull && roll < 0.35) {
    killerName = pFull; killerIsPlayer = true; victimName = fakePick();
  } else if (pFull && roll < 0.55) {
    victimName = pFull; victimIsPlayer = true; killerName = fakePick();
  } else {
    killerName = fakePick(); victimName = fakeDiff(killerName);
  }

  const ka = _peekAgents[Math.floor(Math.random() * _peekAgents.length)];
  const va = _peekAgents[Math.floor(Math.random() * _peekAgents.length)];
  const wp = _kfWeapons[Math.floor(Math.random() * _kfWeapons.length)];

  const entry = document.createElement('div');
  entry.className = 'kf-entry';
  entry.innerHTML =
    `<img class="kf-a" src="${ka.displayIconSmall || ka.displayIcon}" alt="">` +
    `<span class="kf-n${killerIsPlayer ? ' kf-you' : ''}">${killerName}</span>` +
    `<img class="kf-w" src="${wp.icon}" alt="${wp.name}">` +
    `<img class="kf-a" src="${va.displayIconSmall || va.displayIcon}" alt="">` +
    `<span class="kf-n${victimIsPlayer ? ' kf-dead' : ''}">${victimName}</span>`;

  const existing = feed.querySelectorAll('.kf-entry');
  if (existing.length >= 6) existing[0].remove();

  feed.appendChild(entry);
  requestAnimationFrame(() => requestAnimationFrame(() => entry.classList.add('kf-show')));

  setTimeout(() => {
    entry.classList.add('kf-out');
    setTimeout(() => entry.remove(), 480);
  }, 5500);
}

// 頁面載入就啟動準心
document.addEventListener('DOMContentLoaded', initCrosshair);

// 鍵盤快捷鍵：X 鍵觸發大招（輸入框內不觸發）
document.addEventListener('keydown', e => {
  if ((e.key === 'x' || e.key === 'X') && _peekCurrent && !e.target.matches('input, textarea')) {
    _triggerUlt(_peekCurrent);
  }
});

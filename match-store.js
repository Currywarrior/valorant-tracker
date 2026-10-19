// 對戰摘要：把 Henrik 一整場（約 900KB，大多是擊殺座標）壓成分析要用的 1~2KB，
// 有設 MONGODB_URI 就存進 MongoDB Atlas 累積，沒設就只回傳摘要、不存。
const { MongoClient } = require('mongodb');

let db = null;
if (process.env.MONGODB_URI) {
  const client = new MongoClient(process.env.MONGODB_URI);
  client.connect()
    .then(async () => {
      db = client.db('val_tracker');
      await db.collection('match_summaries').createIndex({ puuid: 1, startedAt: -1 });
      console.log('[MatchStore] MongoDB 已連線');
    })
    .catch(err => console.error('[MatchStore] MongoDB 連線失敗:', err.message));
}

// 一場對戰 → 某位玩家的摘要；找不到該玩家或是死鬥就回 null
function summarize(match, puuid) {
  const mode = match.metadata?.mode || '';
  if (mode.toLowerCase() === 'deathmatch') return null;
  const me = (match.players?.all_players || []).find(p => p.puuid === puuid);
  if (!me) return null;

  const myTeam = (me.team || 'blue').toLowerCase();
  const teams = match.teams || {};
  const isDraw = !teams.blue?.has_won && !teams.red?.has_won;
  const won = teams[myTeam]?.has_won;
  const { kills = 0, deaths = 0, assists = 0, score = 0,
          headshots = 0, bodyshots = 0, legshots = 0 } = me.stats || {};

  let firstKills = 0, firstDeaths = 0;
  const multi = { 2: 0, 3: 0, 4: 0, 5: 0 };
  const sides = { atk: { rounds: 0, wins: 0 }, def: { rounds: 0, wins: 0 } };
  const killsByRound = {};
  (match.kills || []).forEach(k => (killsByRound[k.round] ||= []).push(k));
  const hasSides = ['competitive', 'unrated', 'premier'].includes(mode.toLowerCase());
  (match.rounds || []).forEach((r, i) => {
    const rk = killsByRound[i] || [];
    if (rk.length) {
      const first = rk.reduce((a, b) => b.kill_time_in_round < a.kill_time_in_round ? b : a);
      if (first.killer_puuid === puuid) firstKills++;
      if (first.victim_puuid === puuid) firstDeaths++;
    }
    const myKills = rk.filter(k => k.killer_puuid === puuid).length;
    if (myKills >= 2) multi[Math.min(myKills, 5)]++;
    // 紅隊上半場（前 12 回合）進攻、下半場換邊；延長賽每回合換邊，不算
    if (hasSides && i < 24) {
      const side = (i < 12) === (myTeam === 'red') ? 'atk' : 'def';
      sides[side].rounds++;
      if (r.winning_team?.toLowerCase() === myTeam) sides[side].wins++;
    }
  });

  // 武器擊殺（沒有武器名稱的是技能、大招等）；用陣列存，武器名當 key 在 Mongo 裡不保險
  const weapons = {};
  (match.kills || []).forEach(k => {
    if (k.killer_puuid !== puuid) return;
    const name = k.damage_weapon_name || '技能／其他';
    const w = weapons[name] || (weapons[name] = { name, kills: 0, icon: k.damage_weapon_assets?.killfeed_icon || '' });
    w.kills++;
  });

  return {
    _id: `${match.metadata.matchid}|${puuid}`,
    matchId: match.metadata.matchid,
    puuid,
    startedAt: match.metadata.game_start || 0,
    mode,
    map: match.metadata.map || 'Unknown',
    agent: me.character || 'Unknown',
    agentIcon: me.assets?.agent?.small || '',
    agentBust: me.assets?.agent?.bust || me.assets?.agent?.full || '',
    result: isDraw ? 'draw' : (won ? 'win' : 'loss'),
    kills, deaths, assists, score, headshots, bodyshots, legshots,
    rounds: (teams.blue?.rounds_won || 0) + (teams.red?.rounds_won || 0),
    damage: me.damage_made || 0,
    firstKills, firstDeaths, multi, sides,
    weapons: Object.values(weapons),
    // 同一個 party_id 的隊友；空陣列 = 單排（舊紀錄沒有這個欄位，統計時要跳過）
    partyMates: (match.players?.all_players || [])
      .filter(p => p.party_id && p.party_id === me.party_id && p.puuid !== puuid)
      .map(p => ({ puuid: p.puuid, name: p.name, tag: p.tag, card: p.player_card || '' })),
  };
}

// Henrik mmr-history 一筆 → 存檔格式
function normalizeRR(e, puuid) {
  return {
    _id: `${e.match_id}|${puuid}`,
    matchId: e.match_id,
    puuid,
    date: e.date_raw,
    tier: e.currenttier,
    tierName: e.currenttierpatched,
    tierIcon: e.images?.small || '',
    rr: e.ranking_in_tier,
    change: e.mmr_change_to_last_game,
    elo: e.elo,
    map: e.map?.name || '',
  };
}

async function saveRR(entries) {
  if (!db || !entries.length) return;
  await db.collection('rr_history').bulkWrite(entries.map(e => ({
    replaceOne: { filter: { _id: e._id }, replacement: e, upsert: true }
  })));
}

async function loadRR(puuid) {
  if (!db) return [];
  return db.collection('rr_history').find({ puuid }).sort({ date: 1 }).toArray();
}

// 存摘要並記下玩家（定時抓取要知道幫誰抓）；沒接資料庫就略過
async function saveSummaries(summaries, player) {
  if (!db) return;
  if (summaries.length) {
    await db.collection('match_summaries').bulkWrite(summaries.map(s => ({
      replaceOne: { filter: { _id: s._id }, replacement: s, upsert: true }
    })));
  }
  if (player) {
    await db.collection('players').updateOne(
      { _id: player.puuid },
      { $set: { name: player.name, tag: player.tag, shard: player.shard, updatedAt: new Date() } },
      { upsert: true }
    );
  }
}

async function loadSummaries(puuid) {
  if (!db) return [];
  return db.collection('match_summaries').find({ puuid }).sort({ startedAt: -1 }).toArray();
}

async function listPlayers() {
  if (!db) return [];
  return db.collection('players').find().toArray();
}

module.exports = { summarize, saveSummaries, loadSummaries, listPlayers, normalizeRR, saveRR, loadRR, isEnabled: () => !!db };

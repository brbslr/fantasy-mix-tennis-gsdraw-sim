// simulate-mixed-doubles.js
// Interactive CLI: pick any tournament from quarterfinalists.json, then draft
// one male + one female QF player as your fantasy mixed doubles team.
// The remaining 7 men + 7 women are randomly paired into 7 more teams.
// An 8-team bracket is simulated based on each team's average rank (lower
// rank number = stronger), with a probability cap so the best team doesn't
// win overwhelmingly often.
//
// Unlimited simulations - just run the script again to pick a new
// tournament/team.
//
// Run with: node simulate-mixed-doubles.js

const fs = require("fs");
const readline = require("readline");

const DATA_FILE = "./quarterfinalists.json";

// A player with a missing rank (a handful of real unranked wildcard/comeback
// entries exist in the dataset, e.g. Clijsters 2009, Henin 2010) is treated
// as this rank for strength calculations - "weak but not impossible," rather
// than crashing or being auto-excluded.
const UNRANKED_FALLBACK = 250;

const rlInterface = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise((resolve) => {
    rlInterface.question(question, (answer) => resolve(answer.trim()));
  });
}

// Fisher-Yates shuffle - returns a new array in random order.
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Effective rank for strength calculations - falls back to a fixed value
// for the rare real "unranked" QF player instead of producing NaN.
function effectiveRank(player) {
  return typeof player.rank === "number" && !isNaN(player.rank) ? player.rank : UNRANKED_FALLBACK;
}

// ---- Tournament picker ----
async function pickTournament(tournaments) {
  let filtered = tournaments;

  const filterInput = await ask(
    `There are ${tournaments.length} tournaments available.\n` +
    `Type part of a name or year to filter (e.g. "wimbledon" or "2015"), or press Enter to see all:\n> `
  );

  if (filterInput) {
    const needle = filterInput.toLowerCase();
    filtered = tournaments.filter(
      (t) => t.tournament.toLowerCase().includes(needle) || t.key.toLowerCase().includes(needle)
    );
    if (filtered.length === 0) {
      console.log(`No tournaments matched "${filterInput}". Showing all instead.\n`);
      filtered = tournaments;
    }
  }

  console.log("");
  filtered.forEach((t, i) => console.log(`  ${i + 1}. ${t.tournament}`));

  const choice = await ask(`\nPick a tournament (1-${filtered.length}):\n> `);
  const idx = parseInt(choice, 10) - 1;

  if (isNaN(idx) || idx < 0 || idx >= filtered.length) {
    console.log("Invalid choice, try again.\n");
    return pickTournament(tournaments); // re-prompt from the full list
  }

  return filtered[idx];
}

// ---- Player picker ----
async function pickPlayer(players, label) {
  console.log(`\n${label}:`);
  players.forEach((p, i) => {
    const rankLabel = typeof p.rank === "number" && !isNaN(p.rank) ? `rank ${p.rank}` : "unranked";
    console.log(`  ${i + 1}. ${p.name} (${rankLabel})`);
  });

  const choice = await ask(`Pick one (1-${players.length}):\n> `);
  const idx = parseInt(choice, 10) - 1;

  if (isNaN(idx) || idx < 0 || idx >= players.length) {
    console.log("Invalid choice, try again.");
    return pickPlayer(players, label);
  }

  return players[idx];
}

// Builds all 8 mixed-doubles teams: the user's drafted team, plus 7 randomly
// paired teams made from everyone else in the tournament's QF pool.
function buildTeams(tournament, userMale, userFemale) {
  const remainingMen = tournament.men.filter((p) => p.name !== userMale.name);
  const remainingWomen = tournament.women.filter((p) => p.name !== userFemale.name);

  const shuffledMen = shuffle(remainingMen);
  const shuffledWomen = shuffle(remainingWomen);

  const teams = [{ players: [userMale, userFemale], isUserTeam: true }];

  for (let i = 0; i < shuffledMen.length; i++) {
    teams.push({
      players: [shuffledMen[i], shuffledWomen[i]],
      isUserTeam: false
    });
  }

  return teams.map((t) => ({
    ...t,
    names: t.players.map((p) => p.name),
    avgRank: (effectiveRank(t.players[0]) + effectiveRank(t.players[1])) / 2
  }));
}

// Strength ratios alone would let the strongest possible team (both players
// ranked #1) win almost every single match. To keep every match genuinely
// winnable, the raw probability is capped to [MIN_PROB, MAX_PROB] - so even
// the best team in the tournament only has an 85% chance in any one match.
const MIN_PROB = 0.15;
const MAX_PROB = 0.85;

function winProbability(teamA, teamB) {
  const strengthA = 1 / teamA.avgRank;
  const strengthB = 1 / teamB.avgRank;
  const rawP = strengthA / (strengthA + strengthB);
  return Math.min(MAX_PROB, Math.max(MIN_PROB, rawP));
}

function playMatch(teamA, teamB) {
  const pA = winProbability(teamA, teamB);
  const winner = Math.random() < pA ? teamA : teamB;
  console.log(
    `  ${teamA.names.join("/")} (avg rank ${teamA.avgRank}) vs ` +
    `${teamB.names.join("/")} (avg rank ${teamB.avgRank}) -> ${winner.names.join("/")}`
  );
  return winner;
}

function simulateBracket(teams) {
  let round = shuffle(teams);
  let roundNum = 1;

  while (round.length > 1) {
    console.log(`\nRound ${roundNum}:`);
    const nextRound = [];
    for (let i = 0; i < round.length; i += 2) {
      nextRound.push(playMatch(round[i], round[i + 1]));
    }
    round = nextRound;
    roundNum++;
  }

  return round[0];
}

// ---- Main ----
async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

  const tournament = await pickTournament(data.tournaments);
  console.log(`\nSelected: ${tournament.tournament}`);

  const userMale = await pickPlayer(tournament.men, "Pick your male player");
  const userFemale = await pickPlayer(tournament.women, "Pick your female player");

  console.log(`\nSimulating: ${tournament.tournament} - Fantasy Mixed Doubles`);
  console.log(`Your team: ${userMale.name} / ${userFemale.name}\n`);

  const teams = buildTeams(tournament, userMale, userFemale);
  const champion = simulateBracket(teams);
  const userWon = champion.isUserTeam;

  console.log(`\n=== CHAMPIONS: ${champion.names.join(" / ")} ===`);
  console.log(userWon ? "Your team won! \ud83c\udfc6" : "Your team did not win this time.");
  rlInterface.close();
}

main();

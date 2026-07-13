// simulate-mixed-doubles.js
// Loads quarterfinalists.json (built by generate-dataset.js) and simulates
// a fantasy mixed-doubles bracket for ONE hardcoded tournament.
//
// User "drafts" one male + one female QF player from that tournament as
// their team. The remaining 7 men + 7 women are randomly paired into 7
// more teams. An 8-team bracket is simulated based on each team's average
// rank (lower rank number = stronger), with dampening so the best team
// doesn't win overwhelmingly often.
//
// Unlimited simulations - just run the script again for a new result.
//
// Run with: node simulate-mixed-doubles.js

const fs = require("fs");

const DATA_FILE = "./quarterfinalists.json";

// ---- HARDCODED SELECTION (V0 - no UI yet, edit these to "play") ----
// TOURNAMENT_KEY must match a "key" value inside quarterfinalists.json,
// e.g. "wimbledon_2026", "ausopen_2005", "usopen_1999".
const TOURNAMENT_KEY = "ausopen_2005";

const USER_PICK = {
  male: "Roger Federer",
  female: "Lindsay Davenport"
};
// ---------------------------------------------------------------------

// Fisher-Yates shuffle - returns a new array in random order.
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Finds the requested tournament inside the dataset by its key.
function findTournament(data, key) {
  const tournament = data.tournaments.find((t) => t.key === key);
  if (!tournament) {
    const available = data.tournaments.map((t) => t.key).join(", ") || "(none found)";
    throw new Error(
      `Tournament "${key}" not found in quarterfinalists.json.\nAvailable keys: ${available}`
    );
  }
  return tournament;
}

// Builds all 8 mixed-doubles teams: the user's drafted team, plus 7 randomly
// paired teams made from everyone else in the tournament's QF pool.
function buildTeams(tournament, userPick) {
  const remainingMen = tournament.men.filter((p) => p.name !== userPick.male);
  const remainingWomen = tournament.women.filter((p) => p.name !== userPick.female);

  if (remainingMen.length !== 7 || remainingWomen.length !== 7) {
    throw new Error(
      `Expected 8 men + 8 women with your picks removed leaving 7 each - ` +
      `check that USER_PICK names exactly match names in quarterfinalists.json ` +
      `for "${tournament.tournament}".`
    );
  }

  const shuffledMen = shuffle(remainingMen);
  const shuffledWomen = shuffle(remainingWomen);

  const userMale = tournament.men.find((p) => p.name === userPick.male);
  const userFemale = tournament.women.find((p) => p.name === userPick.female);

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
    avgRank: (t.players[0].rank + t.players[1].rank) / 2
  }));
}

// Strength is inverse of average rank - lower rank number = higher strength.
// Strength ratios (rather than raw rank difference) dampen blowout
// probabilities, so the best team wins more often but not always.
// Strength ratios alone still let the strongest possible team (both players
// ranked #1) win almost every single match, since no opponent can have a
// better rank to counterbalance it. To keep every match genuinely winnable,
// the raw probability is capped to a [MIN_PROB, MAX_PROB] range - so even
// the best team in the tournament only has an 85% chance in any one match,
// leaving real upset odds every round instead of a near-guaranteed run.
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
const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
const tournament = findTournament(data, TOURNAMENT_KEY);

console.log(`Simulating: ${tournament.tournament} - Fantasy Mixed Doubles\n`);
console.log(`Your team: ${USER_PICK.male} / ${USER_PICK.female}\n`);

const teams = buildTeams(tournament, USER_PICK);
const champion = simulateBracket(teams);
const userWon = champion.isUserTeam;

console.log(`\n=== CHAMPIONS: ${champion.names.join(" / ")} ===`);
console.log(userWon ? "Your team won! \ud83c\udfc6" : "Your team did not win this time.");

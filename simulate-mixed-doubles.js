// simulate-mixed-doubles.js
// V0: hardcoded to Wimbledon 2026 quarterfinalists.
// User "drafts" one male + one female QF player as their mixed doubles team.
// The remaining 7 men + 7 women are randomly paired into 7 more teams.
// An 8-team bracket is simulated based on each team's average rank
// (lower rank number = stronger), with dampening so the best team
// doesn't win overwhelmingly often.
//
// Unlimited simulations - just run the script again for a new result.
// (Daily-limit mechanic has been removed; see README "Desired Direction"
// for why, and for the plan to let the user choose from any of the last
// ~147 Grand Slam tournaments, 1990 Australian Open through 2026 Wimbledon.)
//
// Run with: node simulate-mixed-doubles.js

// Node's built-in file system module - lets us read the quarterfinalist data from disk.
const fs = require("fs");

// Path to the quarterfinalist player pool (read-only data for this run).
const DATA_FILE = "./quarterfinalists.json";

// ---- HARDCODED USER PICK (V0 - no UI yet, edit these two names to "play") ----
// In a real app this would come from user input (a form/click); for V0 you just
// edit these two strings directly in the code to change who you're drafting.
const USER_PICK = {
  male: "Jannik Sinner",
  female: "Coco Gauff"
};
// -------------------------------------------------------------------------

// Returns a new array with the same elements as `array`, but in random order.
// Uses the Fisher-Yates shuffle algorithm (standard, unbiased way to shuffle).
function shuffle(array) {
  const arr = [...array]; // copy the array so we don't mutate the original
  // Walk backward through the array...
  for (let i = arr.length - 1; i > 0; i--) {
    // ...pick a random earlier (or same) index...
    const j = Math.floor(Math.random() * (i + 1));
    // ...and swap the current element with that random one.
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Builds all 8 mixed-doubles teams: the user's drafted team, plus 7 randomly
// paired teams made from everyone else in the quarterfinalist pool.
function buildTeams(data, userPick) {
  // Every male QF player except the one the user picked.
  const remainingMen = data.men.filter((p) => p.name !== userPick.male);
  // Every female QF player except the one the user picked.
  const remainingWomen = data.women.filter((p) => p.name !== userPick.female);

  // Randomize the order of the remaining players before pairing them up,
  // so who ends up on a team together is different every run.
  const shuffledMen = shuffle(remainingMen);
  const shuffledWomen = shuffle(remainingWomen);

  // Look up the full player objects (with rank) for the user's two picks.
  const userMale = data.men.find((p) => p.name === userPick.male);
  const userFemale = data.women.find((p) => p.name === userPick.female);

  // Start the teams list with the user's own team, flagged with isUserTeam: true
  // so we can later check whether the user won.
  const teams = [
    { players: [userMale, userFemale], isUserTeam: true }
  ];

  // Pair up the shuffled remaining men and women one-to-one into 7 more teams.
  // (shuffledMen and shuffledWomen are both length 7, since one of each was removed above.)
  for (let i = 0; i < shuffledMen.length; i++) {
    teams.push({
      players: [shuffledMen[i], shuffledWomen[i]],
      isUserTeam: false
    });
  }

  // Add two convenience fields to every team before returning:
  // - names: just the two players' names, for easy printing
  // - avgRank: the team's average rank, used to compute win probability later
  return teams.map((t) => ({
    ...t, // keep existing fields (players, isUserTeam)
    names: t.players.map((p) => p.name),
    avgRank: (t.players[0].rank + t.players[1].rank) / 2
  }));
}

// Strength is inverse of average rank - lower rank number = higher strength.
// Using strength ratios (rather than raw rank difference) naturally dampens
// blowout probabilities, so the best team wins more often but not always.
function winProbability(teamA, teamB) {
  // Example: rank 4 -> strength 0.25. Rank 40 -> strength 0.025.
  // A 10x rank gap only becomes a 10x strength gap, not an unbeatable one,
  // once it's turned into a probability below.
  const strengthA = 1 / teamA.avgRank;
  const strengthB = 1 / teamB.avgRank;
  // Converts the two strengths into a probability between 0 and 1 that team A wins.
  return strengthA / (strengthA + strengthB);
}

// Simulates a single match between two teams and returns the winner.
function playMatch(teamA, teamB) {
  const pA = winProbability(teamA, teamB);
  // Math.random() gives a random decimal between 0 and 1.
  // If it lands below team A's win probability, A wins; otherwise B wins.
  const winner = Math.random() < pA ? teamA : teamB;
  console.log(
    `  ${teamA.names.join("/")} (avg rank ${teamA.avgRank}) vs ` +
    `${teamB.names.join("/")} (avg rank ${teamB.avgRank}) -> ${winner.names.join("/")}`
  );
  return winner;
}

// Runs a full single-elimination bracket across all 8 teams until one champion remains.
function simulateBracket(teams) {
  let round = shuffle(teams); // randomize bracket order so matchups differ each run
  let roundNum = 1;

  // Keep simulating rounds until only one team is left standing.
  while (round.length > 1) {
    console.log(`\nRound ${roundNum}:`);
    const nextRound = [];
    // Step through the current round two teams at a time (i, i+1 = one match).
    for (let i = 0; i < round.length; i += 2) {
      nextRound.push(playMatch(round[i], round[i + 1]));
    }
    round = nextRound; // winners become next round's field
    roundNum++;
  }

  // Only one team left - that's the champion.
  return round[0];
}

// ---- Main ----
const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
console.log(`Simulating: ${data.tournament} - Fantasy Mixed Doubles\n`);
console.log(`Your team: ${USER_PICK.male} / ${USER_PICK.female}\n`);

// Build all 8 teams (user's pick + 7 random pairings), then simulate the bracket.
const teams = buildTeams(data, USER_PICK);
const champion = simulateBracket(teams);
// Check whether the winning team happens to be the user's own team.
const userWon = champion.isUserTeam;

console.log(`\n=== CHAMPIONS: ${champion.names.join(" / ")} ===`);
console.log(userWon ? "Your team won! 🏆" : "Your team did not win this time.");

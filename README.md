# Fantasy GS Mix Tennis Sim

Fantasy Grand Slam mixed-doubles tennis simulation and prediction
game, drafting from the men's and women's singles quarterfinalists of the corresponding grandslam tournament, built on real historical Grand Slam data.

## Current status: user pick with terminal prompt GS Mixed Doubles Fantasy Simulator (1990-2026)

The user drafts one male + one female QF player as their fantasy mixed
doubles team by typing to the terminal prompt; the remaining 14 players are randomly paired into 7 more teams;
an 8-team bracket is simulated based on team strength (average rank of the
two players). The user can simulate as many times as they want

### Files (current version)

- `quarterfinalists.json` data of the quareterfinalists with stats to help determine team strength
- `simulate-mixed-doubles.js` — the engine:
  - you can run with node simulate-mixed-doubles.js and follow the prompts to simulate
  - Every run is a fresh, independent simulation — just run the script again
    for a new result. The terminal will show you the main stat used for the simulation. It is very hard to pick the winning team all the time. Pick a team and see the result.

### Tournament selection

- The user can pick **whichever Grand Slam tournament they want** to
  simulate, from the last four decades: every Australian Open, French Open,
  Wimbledon, and US Open from **1990 Australian Open through 2026
  Wimbledon**. 

### How the team-drafting works

- The user picks one male and one female player who made the **quarterfinal**
  of their chosen tournament, forming their fantasy mixed doubles team
- The remaining quarterfinalists are randomly paired into the rest of the
  bracket.

### Scoring and balance

- To output a winner the simulation uses the team's player's avg serve pts won % throughout their career to determine their strength. The winner decided with the formula (your team's strength ÷ combined strength of both teams) and a random number generator between 0-1 where if the result lands below your team's  strength you win otherwise the opponent wins. There is also a clamp to  [15%, 85%] so no team is ever a near-certain win or loss. 

## Previous versions
0. only wimbledon 2026 simulation executable from the terminal with hardcoded picks
1. simulation executable from the terminal with all of the grandslams from 1990 aus open to 2026 wimbledon with a picker.
2. Changed the formula to take the player's serve pts won% throughout their career instead of their rank

## Final step

*. web mobile website accessible for everyone.


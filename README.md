# Fantasy GS Mix Tennis Sim

Fantasy Grand Slam mixed-doubles tennis simulation and prediction
game, drafting from the men's and women's singles quarterfinalists of the corresponding grandslam tournament, built on real historical Grand Slam data.

## Current status: V1 — GS Mixed Doubles Fantasy Simulator (2000-2017 & 2026)

The current version is hardcoded to the quarterfinalists from the grandslams in the year 2000-2017 & 2026.
The user drafts one male + one female QF player as their fantasy mixed
doubles team; the remaining 14 players are randomly paired into 7 more teams;
an 8-team bracket is simulated based on team strength (average rank of the
two players). **The user can simulate as many times as they want** - there
is no daily limit.

### Files (current version)

- `quarterfinalists.json` — the real Wimbledon 2026 QF fields for men's and
  women's singles (8 players each), with rank derived from tournament
  seeding. A couple of unseeded players have estimated ranks,
  flagged `"_estimated": true`.
- `simulate-mixed-doubles.js` — the engine:
  - The user's picked tournament and team is currently hardcoded at the top of the file
    (`USER_PICK` & `TOURNAMENT_KEY`) — edit until a
    real picker UI exists.
  - The remaining 7 men + 7 women are randomly shuffled and paired into 7
    opponent teams.
  - Team strength uses **inverse average rank** (`1 / avgRank`) , and win
    probability is a ratio of strengths but for the user picking both the #1 seeded players there's a cap so that they do not always win. This dampens the gap between strong
    and weak teams on purpose, so the best team wins more often but not
    automatically — upsets are meant to happen.
  - Every run is a fresh, independent simulation — just run the script again
    for a new result.

### Run it

```bash
node simulate-mixed-doubles.js
```

Run it several times in a row to get a feel for how often the strongest
team actually wins vs. how often an upset happens — that balance is the
main thing worth tuning as this evolves.

## Desired Direction (Long-Term Vision)

The finalized long-term concept: a fantasy mixed-doubles prediction game
built entirely on **real historical Grand Slam data** involving the last 147 grandslam
tournaments from 1990 ao to 2026 wimbledon.

### Tournament selection

- The user can pick **whichever Grand Slam tournament they want** to
  simulate, from the last four decades: every Australian Open, French Open,
  Wimbledon, and US Open from **1990 Australian Open through 2026
  Wimbledon**. 

### How the team-drafting works

- The user picks one male and one female player who made the **quarterfinal**
  of their chosen tournament, forming their fantasy mixed doubles team — the
  same mechanic proven in the current V0, just generalized across all 147
  tournaments instead of hardcoded to Wimbledon 2026.
- The remaining quarterfinalists are randomly paired into the rest of the
  bracket.

### Scoring and balance

- Each team's strength is the **average of the two players' rankings at the
  time of that specific tournament** (not an era-wide average) — pulled from
  historical weekly rankings data (e.g. Jeff Sackmann's public datasets).
- The simulation is deliberately balanced so the best-ranked team is
  **more likely, but not guaranteed**, to win — same dampened
  strength-ratio approach as the current V0's `1 / avgRank` model.

## Previous versions
0. only wimbledon 2026 simulation

## Next steps

1. Adding the rest of the tournaments finishing the hardcoded simulation
2. Build a tournament picker so the user can choose which of the ~147
   tournaments to simulate
3. Replace the hardcoded `USER_PICK` with an actual UI (web page/mobile)
   where the user picks their team.


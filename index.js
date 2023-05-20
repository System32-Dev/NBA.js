import { League } from "./src/league.js";

const nba = new League();

nba.simulateRegularSeason();
nba.simulatePlayoffs();

console.log(nba.playOffs);
console.log(nba.awards);

while (true) {}
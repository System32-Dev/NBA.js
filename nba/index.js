import { Game } from './game.js';
import { Team } from "./team.js";
import { Player } from "./player.js";
import roster from './roster.js';

function getNBATeam(name = "") {
    let players = roster.filter(p => p.team.toLowerCase() == name.toLowerCase()).map(p => new Player(p));

    return new Team({
        name: name,
        players: players
    });
}

function getNBAPlayer(name = "") {
    return new Player(roster.find(player => player.name.toLowerCase() == name.toLowerCase()));
}

export {
    Game,
    getNBATeam,
    getNBAPlayer,
    Player,
    Team,
    roster
}
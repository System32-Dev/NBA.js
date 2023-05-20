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

class RunGame {
    home = Team;
    away = Team;

    log = [];
    score = {
        home: 0,
        away: 0
    };
    stats = {
        home: {},
        away: {}
    }
    #clock = 0;
    #rng = (max, min, round) => (round?(x)=>x:Math.floor)(Math.random() * (max - min) + min);
    #bng(min, max, bias, influence) {
        var rnd = Math.random() * (max - min) + min,
            mix = Math.random() * influence;
        return rnd * (1 - mix) + bias * mix;
    }
    #shotType = ft => ft >= 24 ? "3 Pointer" : ft >= 16 ? "Mid Range" : "Layup";
    #shotWorth = ft => ft >= 24 ? 3 : 2;
    
    #simPlay = (team = new Team) => {
        let handler = team.data.starters[Math.floor(Math.random() * 5)];
        let defender = (this.home == team ? this.away : this.home).data.starters.find(p=>p.vitals.position==handler.vitals.position);
        let floor = this.home == team ? "away" : "home";
        let from = this.home == team ? "home" : "away";
        // Play Type (Drive, Shot or Pass)
        let drive = handler.attributes.finishing[1];
        let shot = Math.floor((handler.attributes.shooting[0] + handler.attributes.shooting[1]) / 2);
        let pass = handler.attributes.playmaking[0];
        let ft = 0, type = undefined, ability = 0, passedFrom, dunkType = "basic", contact = 0;
        
        if (handler.attributes.other[3] - this.#rng(30, -30) <= 50)
            type = "Pass";
        else
            ft = Math.floor(Math.random() * 34);

        type = type || this.#shotType(ft);
        
        if (type == "Pass") {
            let passedTo = team.data.starters[Math.floor(Math.random() * 5)];
            while (passedTo == handler) passedTo = team.data.starters[Math.floor(Math.random() * 5)];
            passedFrom = handler;
            handler = passedTo;
            while (typeof passedTo == undefined) passedTo = team.data.starters[Math.floor(Math.random() * 5)];
            handler = passedTo;

            drive = handler.attributes.finishing[1];
            shot = Math.floor((handler.attributes.shooting[0] + handler.attributes.shooting[1]) / 2);
            pass = handler.attributes.playmaking[0];

            ft = Math.floor(Math.random() * 38);

            type = this.#shotType(ft);

            let steal = defender.attributes.defense[2] - this.#bng(handler.attributes.playmaking[0], 40, 0, 0);
            
            if (steal <= -80) {
                this.stats[floor][defender.vitals.name].steals++;
                this.stats[from][passedFrom.vitals.name].turnovers++;
                return this.log.push({
                    action: "Steal",
                    time: this.#clock,
                    from: passedFrom,
                    by: defender
                })
            } else {
                this.log.push({
                    action: "Pass",
                    time: this.#clock,
                    by: passedFrom
                })
            }
        }

        ability = handler.attributes[
            type == "Layup" ? "finishing" : "shooting"
        ][type == "Layup" || "3 Pointer" ? 1 : 0];

        let contest = defender.attributes.defense[3] + this.#rng(10, -20);
        let chance = (ability - ft + (handler.vitals.height - defender.vitals.height)) + this.#rng(contest, 0 - contest);
        if (type == "Layup" && contest <= 40) {
            type = "Dunk";
            ability = handler.attributes.finishing[2];
            chance = (ability - ft) + this.#rng(contest, 0 - contest);
            let consistency = defender.attributes.other[2];
            contact = (chance - consistency) + this.#rng(contest, 0 - contest);
            
            if (chance >= 80 && contact >= 18) dunkType = "contact";
        }

        let made = false;

        if (type == "3 Pointer" ? chance >= 50 : chance >= 65) {
            this.score[from] += this.#shotWorth(ft);
            this.stats[from][handler.vitals.name].points += this.#shotWorth(ft);

            if (type == "3 Pointer") this.stats[from][handler.vitals.name].tpm++;
            
            if (passedFrom) {
                this.stats[from][passedFrom.vitals.name].assists++;

                this.log.push({
                    action: "Assist",
                    time: this.#clock,
                    by: passedFrom
                })
            }

            made = true;
        } else if (this.#rng(30, -30) + defender.attributes.defense[3] + (handler.vitals.height - defender.vitals.height) <= 20) {
            this.stats[floor][defender.vitals.name].blocks++;
            
            this.log.push({
                action: "Block",
                time: this.#clock,
                by: defender
            })
        } else {
            let rebounder = (this.home == team ? this.away : this.home).data.starters.sort((a,b)=>b.vitals.height-a.vitals.height)[Math.floor(this.#bng(0, 5, 0, 1))];

            this.stats[floor][rebounder.vitals.name].rebounds++;

            if (this.#rng(20, 10) >= 10)
                this.log.push({
                    action: "Rebound",
                    time: this.#clock,
                    by: rebounder
                })
        }

        if (type == "3 Pointer") this.stats[from][handler.vitals.name].tpa++;

        this.stats[from][handler.vitals.name].attempted++;

        if (type == "Dunk")
            this.log.push({
                action: "Dunk",
                type: dunkType,
                made: made,
                by: handler,
                on: defender,
                time: this.#clock,
                contact: 99 - (contact < 0 ? contact * -2 : contact)
            })
        else this.log.push({
            action: "Shot",
            type: type,
            made: made,
            time: this.#clock,
            by: handler
        })

        if (made) this.stats[from][handler.vitals.name].made++;
    }

    #simQuarter = () => {
        // pace
        let plays = this.#rng(50, 40);

        this.#clock = 700;
        let i = 0;
        for (let _ of new Array(plays).fill(0)) {
            let team = i == 0 ? this.home : this.away;
            this.#simPlay(team);
            this.#clock -= this.#rng(20.1, 24, true);
            i = i == 0 ? 1 : 0;
        }
    }

    constructor(_home, _away) {
        this.home = _home;
        this.away = _away;

        for (let team of ['home','away']) {
            for (let player of this[team].data.starters) {
                this.stats[team][player.vitals.name] =  {
                    "points": 0,
                    "attempted": 0,
                    "assists": 0,
                    "blocks": 0,
                    "rebounds": 0,
                    "tpm": 0,
                    "tpa": 0,
                    "made": 0,
                    "steals": 0,
                    "turnovers": 0
                }
            }
        }
        for (let _ of new Array(4).fill(0)) {
            let p = this.score;
            this.#simQuarter();
        }

        while (this.score.home == this.score.away) this.#simQuarter();

        this.#clock = 0.0;
    }

    get winner() {
        return this.score.home > this.score.away ? this.home : this.away;
    }
}

export function Game(home, away) {
    if (typeof home == "string") home = getNBATeam(home);
    if (typeof away == "string") away = getNBATeam(away);

    return new RunGame(home, away);
}
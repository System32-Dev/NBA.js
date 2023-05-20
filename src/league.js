import { Game, getNBATeam, roster } from "../nba/index.js";
import { teamRotations } from "../nba/team.js";

let confrences = [
    [
        "Dallas Mavericks",
        "Denver Nuggets",
        "Golden State Warriors",
        "Houston Rockets",
        "Los Angeles Clippers",
        "Los Angeles Lakers",
        "Memphis Grizzlies",
        "Minnesota Timberwolves",
        "New Orleans Pelicans",
        "Oklahoma City Thunder",
        "Phoenix Suns",
        "Portland Trail Blazers",
        "Sacramento Kings",
        "San Antonio Spurs",
        "Utah Jazz"
    ],
        
    [
        "Atlanta Hawks",
        "Boston Celtics",
        "Brooklyn Nets",
        "Charlotte Hornets",
        "Chicago Bulls",
        "Cleveland Cavaliers",
        "Detroit Pistons",
        "Indiana Pacers",
        "Miami Heat",
        "Milwaukee Bucks",
        "New York Knicks",
        "Orlando Magic",
        "Philadelphia 76ers",
        "Toronto Raptors",
        "Washington Wizards"
    ]
]

export class League {
    #roster = roster;
    #shuffleArray = array => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }

    #generateSchedule = (teams = this.teams.map(t=>t.data.name)) => {
        let s = [];
        let schedule = [];
    
        for (let team of teams) {
            for (let i = 0; i < 84; i++)
                s.push(team);
        }
    
        let matchups = Object.keys(s).sort(() => Math.random() - 0.5).map(n => s[parseInt(n)]);
        
        let home = null;
        let i = 0;
        matchups.forEach(team => {
            if (i % 2 == 0) home = team;
            else {
                schedule.push({
                    home: home,
                    away: team,
                })
            }
            i++;
        });
    
        return this.#shuffleArray(schedule);
    }
    stats = {};
    schedule = [];
    games = [];

    get standings() {
        let standings = [];
        for (let team of this.teams)
            standings.push({
                name: team.data.name,
                won: this.games.filter(game=>game.winner.data.name==team.data.name)
            })
        return standings.sort((a,b)=>b.won.length-a.won.length);
    }

    constructor(__roster = roster) {
        this.#roster = __roster;
        this.teams = confrences[0].concat(confrences[1]).map(team => getNBATeam(team));
        this.schedule = this.#generateSchedule();

        for (let player of this.#roster) {
            this.stats[player.name] = {
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

    simulateGame(home, away) {
        if (home && away) {
            if (typeof home == "string" && !confrences[0].concat(confrences[1]).includes(home)) throw new Error("Invalid Team Name");
            if (typeof away == "string" && !confrences[0].concat(confrences[1]).includes(away)) throw new Error("Invalid Team Name");

            return new Game(home, away);
        } else {
            let game = new Game(this.schedule[this.games.length].home, this.schedule[this.games.length].away);
            this.games.push(game);
            for (let boxScore of [game.stats.home, game.stats.away]) {
                for (let player of Object.keys(boxScore)) {
                    for (let stat of Object.keys(this.stats[player])) this.stats[player][stat] += boxScore[player][stat];
                }
            }
            return game;
        }
    }

    get awards() {
        let starters = Object.keys(this.stats).filter(p=>Object.values(teamRotations).flat().map(x=>x.vitals.name).includes(p));

        return {
            MVP: starters.map(player=>this.getPlayer(player)).sort((a, b) => {
                let value = x =>
                    (x.ppg + (x.apg * 1.5) + (x.bpg * 2) + (x.spg * 2) + (x.rpg * 0.8)) - x.tpg;
                
                return value(b) - value(a);
            })[Math.floor(Math.random() * 3)],
            DOPY: starters.map(player=>this.getPlayer(player)).sort((a, b) => {
                let value = x =>
                    (x.bpg * 10) + (x.spg * 5) + x.rpg - x.tpg;
                
                return value(b) - value(a);
            })[Math.floor(Math.random() * 3)],
        }
    }

    simulateRegularSeason() {
        for (let i = 0; i < this.schedule.length; i++) this.simulateGame();
    }

    getPlayer(name = "") {
        try {
        let played = this.games.filter(g=>g.home.data.name==this.#roster.find(p=>p.name==name).team||g.away.data.name==this.#roster.find(p=>p.name==name).team).length;
        let stats = this.stats[name];
        return {
            name: name,
            played: played,

            ppg: parseFloat((stats.points / played).toFixed(1)),
            apg: parseFloat((stats.assists / played).toFixed(1)),
            bpg: parseFloat((stats.blocks / played).toFixed(1)),
            tpg: parseFloat((stats.turnovers / played).toFixed(1)),
            rpg: parseFloat((stats.rebounds / played).toFixed(1)),
            spg: parseFloat((stats.steals / played).toFixed(1)),
            
            fgp: parseFloat((stats.made / stats.attempted).toFixed(1)),
            tpp: parseFloat((stats.tpm / stats.tpa).toFixed(1))
        }
    } catch {
        console.log(name)
        return {
            name: name,
            played: 82,

            ppg: 0,
            apg: 0,
            bpg: 0,
            tpg: 0,
            rpg: 0,
            spg: 0,
            
            fgp: 0,
            tpp: 0
        }
    }
    }

    getSeed(confrence = 0, seed = 0) {
        if (typeof confrence == "string") confrence = confrence.toLowerCase() == "west" ? 0 : confrence.toLowerCase() == "east" ? 1 : undefined
        let confTeams = this.standings.filter(team=>confrences[confrence].includes(team.name)).map(t=>t.name);
        return confTeams.map(t=>this.standings.find(x=>x.name==t)).sort((a,b)=>b.won.length-a.won.length)[seed];
    }

    getConfrence(confrence = 0) {
        return confrences[confrence];
    }

    simulatePlayoffs(finalists) {
        let stats = {};
        let playedGames = {};
        let log = [];

        const simRound = (team1, team2) => {
            let score = [0,0];
            let games = [];
            
            while (score[0] != 4 && score[1] != 4) {
                let game = new Game(team1, team2);
                for (let boxScore of [game.stats.home, game.stats.away]) {
                    for (let player of Object.keys(boxScore)) {
                        if (!stats[player]) {
                            stats[player] = {
                                "points": 0,
                                "attempted": 0,
                                "assists": 0,
                                "blocks": 0,
                                "rebounds": 0,
                                "tpm": 0,
                                "tpa": 0,
                                "made": 0,
                                "steals": 0,
                                "turnovers": 0,
                                "played": 0,
                            }
                        }
                        if (!playedGames[player]) playedGames[player] = 0;

                        for (let stat of Object.keys(stats[player])) stats[player][stat] += boxScore[player][stat];

                        playedGames[player]++;
                    }
                }
                games.push(game);
                score[game.winner.data.name==team1?0:1]++;
            }

            return {
                score: score,
                games: games,
                get winner() {
                    return score[0] > score[1] ? team1 : team2;
                },
                get loser() {
                    return score[0] > score[1] ? team2 : team1;
                }
            }
        }

        let standings =  finalists || {
            "west": [],
            "east": []
        };

        let semis = {
            "west": [],
            "east": []
        };

        if (!finalists) {
            for (let conf of Object.keys(standings)) {
                for (let seed in new Array(8).fill(""))
                    if (this.getSeed(conf, seed)) standings[conf].push(this.getSeed(conf, seed).name);

                standings[conf] = this.#shuffleArray(standings[conf]);
            }

            for (let conf of Object.keys(standings)) {
                let home;
                for (let i in new Array(standings[conf].length).fill("")) {
                    if (i % 2 == 0) home = standings[conf][i];
                    else {
                        let round = simRound(home, standings[conf][i]);
                        log.push(round);
                        semis[conf].push(round.winner);
                    }
                }
            }
        } else {
            for (let conf of Object.keys(standings)) {
                for (let matchup of standings[conf]) {
                    let round = simRound(matchup[0], matchup[1]);
                    log.push(round);
                    semis[conf].push(round.winner);
                }
            }
        }

        let confFinals = {
            "west": [],
            "east": []
        };

        for (let conf of Object.keys(semis)) {
            let home;
            for (let i in new Array(semis[conf].length).fill("")) {
                if (i % 2 == 0) home = semis[conf][i];
                else {
                    let round = simRound(home, semis[conf][i]);
                    log.push(round);
                    confFinals[conf].push(round.winner);
                }
            }
        }

        let finals = {
            "west": [],
            "east": []
        }

        for (let conf of Object.keys(confFinals)) {
            let home;
            for (let i in new Array(confFinals[conf].length).fill("")) {
                if (i % 2 == 0) home = confFinals[conf][i];
                else {
                    let round = simRound(home, confFinals[conf][i]);
                    log.push(round);
                    finals[conf].push(round.winner);
                }
            }
        }

        finals = simRound(finals.west[0], finals.east[0]);
        log.push(finals);

        let r = {
            rounds: log,

            winner: finals.winner,
            loser: finals.loser,
            finalsMVP: (()=>{
                let starters = getNBATeam(finals.winner).data.starters;

                return starters.map(player => {
                    let stat = stats[player.vitals.name];
                    let played = playedGames[player.vitals.name];
                    return {
                        name: player.vitals.name,
                        player: player,
                        played: played,
            
                        ppg: parseFloat((stat.points / played).toFixed(1)),
                        apg: parseFloat((stat.assists / played).toFixed(1)),
                        bpg: parseFloat((stat.blocks / played).toFixed(1)),
                        tpg: parseFloat((stat.turnovers / played).toFixed(1)),
                        rpg: parseFloat((stat.rebounds / played).toFixed(1)),
                        spg: parseFloat((stat.steals / played).toFixed(1)),
            
                        fgp: parseFloat((stat.made / stat.attempted).toFixed(1)),
                        tpp: parseFloat((stat.tpm / stat.tpa).toFixed(1))
                    };
                }).sort((a, b) => {
                    let value = x =>
                        ((x.ppg * 2) + (x.apg * 1.5) + x.bpg + x.spg + (x.rpg * 0.8)) - x.tpg;
                    
                    return value(b) - value(a);
                })[0]
            })()
        };
        this.playOffs = r;
        return r;
    }
}
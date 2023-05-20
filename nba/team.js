import { Player } from "./player.js";
import roster from "./roster.js";

let __playerClass = Player;

// via http://www.espn.com/nba/depth
const rotations = `Atlanta Hawks:T. Young	D. Murray	D. Hunter	J. Collins	C. Capela
Boston Celtics:M. Smart	J. Brown	J. Brown	J. Tatum	R. Williams III
Brooklyn Nets:S. Dinwiddie	M. Bridges	C. Johnson	D. Finney-Smith	N. Claxton
Charlotte Hornets:T. Rozier	K. Oubre Jr.	G. Hayward	P. Washington	M. Williams
Chicago Bulls:P. Beverley	A. Caruso	Z. LaVine	D. DeRozan	N. Vucevic
Cleveland Cavaliers:D. Garland	D. Mitchell	I. Okoro	E. Mobley	J. Allen
Dallas Mavericks:L. Doncic	K. Irving	T. Hardaway Jr.	R. Bullock	D. Powell
Denver Nuggets:J. Murray	K. Caldwell-Pope	M. Porter Jr.	A. Gordon	N. Jokic
Detroit Pistons:K. Hayes	J. Ivey	B. Bogdanovic	M. Bagley III	J. Wiseman
Golden State Warriors:S. Curry	K. Thompson	A. Wiggins	D. Green	K. Looney
Houston Rockets:K. Porter Jr.	J. Green	K. Martin Jr.	J. Smith Jr.	A. Sengun
Indiana Pacers:T. Haliburton	A. Nembhard	B. Hield	A. Nesmith	M. Turner
Los Angeles Clippers:R. Westbrook	P. George	K. Leonard	N. Batum	I. Zubac
Los Angeles Lakers:D. Russell	A. Reaves	L. James	J. Vanderbilt	A. Davis
Memphis Grizzlies:J. Morant	D. Bane	D. Brooks	J. Jackson Jr.	X. Tillman
Miami Heat:G. Vincent	M. Strus	J. Butler	K. Love	B. Adebayo
Milwaukee Bucks:J. Holiday	G. Allen	K. Middleton	G. Antetokounmpo	B. Lopez
Minnesota Timberwolves:M. Conley	A. Edwards	J. McDaniels	K. Towns	R. Gobert
New Orleans Pelicans:C. McCollum	T. Murphy III	B. Ingram	H. Jones	J. Valanciunas
New York Knicks:J. Brunson	Q. Grimes	R. Barrett	J. Randle	M. Robinson
Oklahoma City Thunder:S. Gilgeous-Alexander	J. Giddey	L. Dort	J. Williams	J. Williams
Orlando Magic:M. Fultz	G. Harris	F. Wagner	P. Banchero	W. Carter Jr.
Philadelphia 76ers:J. Harden	T. Maxey	T. Harris	P. Tucker	J. Embiid
Phoenix Suns:C. Paul	D. Booker	J. Okogie	K. Durant	D. Ayton
Portland Trail Blazers:A. Simons	S. Sharpe	M. Thybulle	J. Grant	J. Nurkic
Sacramento Kings:D. Fox	K. Huerter	H. Barnes	K. Murray	D. Sabonis
San Antonio Spurs:T. Jones	D. Vassell	K. Johnson	J. Sochan	Z. Collins
Toronto Raptors:F. VanVleet	O. Anunoby	S. Barnes	P. Siakam	J. Poeltl
Utah Jazz:C. Sexton	J. Clarkson	L. Markkanen	K. Olynyk	W. Kessler
Washington Wizards:M. Morris	B. Beal	K. Kuzma	K. Porzingis	D. Gafford`;

let teamRotations = {};

for (let team of rotations.split(/\n/g)) {
    let name = team.split(":")[0];
    let temp = team.split(":")[1];

    let players = [
        temp.split("	")[0],
        temp.split("	")[1],
        temp.split("	")[2],
        temp.split("	")[3],
        temp.split("	")[4],
    ]

    teamRotations[name] = [];

    for (let player of players) {
        let p = roster.find(kp=>{
            if (kp.team != name) return false;
            if (kp.name.split(" ")[1] == player.split(" ")[1].trim())
                return true;
        });

        teamRotations[name].push(new Player(p));
    }
}

export {
    teamRotations
}

export class Team {
    #defaults = {
        name: "Team",
        players: []
    }
    #raw = this.#defaults;

    constructor(d = this.#defaults) {
        this.#raw = d;

        if (rotations.split(/\n/g).map(x=>x.split(":")[0]).includes(this.#raw.name)) {
            let name = this.#raw.name;
            let starters = teamRotations[this.#raw.name].map(player => {
                return new Proxy(player, {
                    get(target, prop, handler) {
                        if (prop == "vitals") {
                            return {
                                name: target[prop].name,
                                position: teamRotations[name].indexOf(player) + 1,
                                team: target[prop].team,
                                overall: target[prop].overallAttribute,
                                height: parseFloat(target[prop].height)
                            }

                        } else return Reflect.get(...arguments);
                    },

                    set(target, prop, value) {
                        return Reflect.set(...arguments);
                    }
                })
            });
            this.data = {
                name: this.#raw.name,
                starters: starters
            }
        } else {
            let starters = [];

            for (let player of this.#raw.players.sort((x, y) => x.vitals.overallAttribute - y.vitals.overallAttribute).sort((x, y) => x.vitals.position - y.vitals.position)) {
                let pos = player.vitals.position || [1,2,3,4,5].find(p=>p!=starters.map(p=>p.position));

                if (starters.length == 5) break;

                if (!starters.find(p=>p.pos==player.vitals.position)) {
                    starters.push({
                        name: player.vitals.name,
                        pos: pos
                    })
                } else if (pos == 6) {
                    if (!starters.find(p=>p.pos==1)) {
                        starters.push({
                            name: player.vitals.name,
                            pos: 1
                        });
                    } else if (!starters.find(p=>p.pos==2)) {
                        starters.push({
                            name: player.vitals.name,
                            pos: 2
                        });
                    }
                } else if (pos == 7) {
                    if (!starters.find(p=>p.pos==3)) {
                        starters.push({
                            name: player.vitals.name,
                            pos: 3
                        });
                    } else if (!starters.find(p=>p.pos==4)) {
                        starters.push({
                            name: player.vitals.name,
                            pos: 4
                        });
                    } else if (!starters.find(p=>p.pos==5)) {
                        starters.push({
                            name: player.vitals.name,
                            pos: 5
                        });
                    }
                }
            }

            // Backup Positions
            const classifyHeight = h => {
                let heights = {
                    1: 6.3, 
                    2: 6.6,
                    3: 3.8, 
                    4: 6.10, 
                    5: 7
                }

                return Object.values(heights)
                    .sort((a, b) => Math.abs(a - h) - Math.abs(b - h));
            }
            let _s = [];
            for (let item of starters) {
                const isDuplicate = _s.find((obj) => obj.pos === item.pos);
                if (!isDuplicate) _s.push(item);
            }

            for (let dupe of starters.filter(p=>!_s.includes(p))) {
                let i = starters.indexOf(dupe);

                let p = classifyHeight((this.#raw.players.find(y=>y.vitals.name==dupe.name)).vitals.height)[0];
                let heights = {
                    1: 6.3, 
                    2: 6.6,
                    3: 3.8, 
                    4: 6.10, 
                    5: 7
                }
                starters[i].pos = Object.keys(heights)[Object.values(heights).indexOf(p)];
            }

            this.data = {
                name: this.#raw.name,
                starters: [
                    starters.find(p => p.pos == 1),
                    starters.find(p => p.pos == 2),
                    starters.find(p => p.pos == 3),
                    starters.find(p => p.pos == 4),
                    starters.find(p => p.pos == 5),
                ].map(p => this.#raw.players.find(y=>y.vitals.name==(p||{name:""}).name))
            }
        }
    }
}
export class Player {
    __json = {};

    get #ovr() {
        let ovr = 0;

        Object.values(this.attributes.finishing).forEach(x=>ovr+=x);
        Object.values(this.attributes.shooting).forEach(x=>ovr+=x);
        Object.values(this.attributes.playmaking).forEach(x=>ovr+=x);
        Object.values(this.attributes.defense).forEach(x=>ovr+=x);

        return Math.round(ovr / (Object.values(this.attributes.finishing).length + Object.values(this.attributes.shooting).length + Object.values(this.attributes.playmaking).length + Object.values(this.attributes.defense).length));
    }

    constructor(data) {
        this.__json = data;

        this.vitals = {
            name: this.__json.name,
            position: this.__json.position,
            team: this.__json.team,
            overall: this.__json.overallAttribute || this.#ovr,
            height: parseFloat(this.__json.height)
        }

        this.attributes ={
            finishing: [
                // Close-Shot
                this.__json.closeShot,
                // Driving Layup
                this.__json.layup,
                // Driving Dunk
                this.__json.drivingDunk,
                // Standing Dunk
                this.__json.standingDunk,
                // Post-Control
                this.__json.postControl,
            ],
            shooting: [
                // Mid-Range
                this.__json.midRangeShot,
                // 3-Point
                this.__json.threePointShot,
                // Free Throw
                this.__json.freeThrow,
            ],
            playmaking: [
                // Pass Accuracy
                this.__json.passAccuracy,
                // Ball Handle
                this.__json.ballHandle,
                // Ball Speed
                this.__json.speedWithBall,
            ],
            defense: [
                // Interior
                this.__json.interiorDefense,
                // Perimeter
                this.__json.perimeterDefense,
                // Steal
                this.__json.steal,
                // Block
                this.__json.block,
                // O-Reb
                this.__json.offensiveRebound,
                // D-Reb
                this.__json.defensiveRebound,
            ],
            physicals: [
                // Speed
                this.__json.speed,
                // Acceleration
                this.__json.acceleration,
                // Strength
                this.__json.strength,
                // Vertical
                this.__json.vertical,
                // Stamina
                this.__json.stamina
            ],
            other: [
                // Off-Cons
                this.__json.offensiveConsistency,
                this.__json.defensiveConsistency,
                this.__json.helpDefenseIQ,
                this.__json.passVision
            ]
        };
    }
}
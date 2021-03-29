import Settings from "./Settings.js";
import constants from "./constants.js";
import SadnessChan from "./SadnessChan.js";


interface UserRollStats {
    dieType: string,
    rolls: Array<Number>;
    numberOfRolls: Number; 
    average: Number; 
    highest: Number;
    percentages: Array<Number>;
}

class RollStats {

	private static _instance: RollStats;

    private constructor() {
    }

    static getInstance() {
        if (!RollStats._instance)
        RollStats._instance = new RollStats();
        return RollStats._instance;
    }

    resetCompleteStats() {
        game.users.forEach(user => {
            this._setRollHistory(user, {});
        });
    }

    resetSessionStats() {
        game.users.forEach(user => {
            let rollHistory = this._getRollHistory(user) ?? {};
            if (rollHistory["session"] != null) {
                rollHistory["session"] = {};
                this._setRollHistory(user, rollHistory);
            }
        });
    }

    resetViaSadness() {
        let sadnessRollHistory = SadnessChan.getRollHistory();

        game.users.forEach(user => {
            let rollHistory = {};
            let userRolls = SadnessChan.getUserRollHistory(sadnessRollHistory, user);
            if (userRolls != null && userRolls.length) {
                let [dummy, ...rolls] = userRolls;
                let dieType = this._getDieType(rolls.length);
                if (dieType != null) {
                    let diceMap = rollHistory["all-time"] = rollHistory["session"] = {};
                    diceMap[dieType] = rolls;
                }
            }
            this._setRollHistory(user, rollHistory);
        });
    }

    getUserData(user, dieType) : { allTime: UserRollStats; session: UserRollStats } {
        const rollHistory = this._getRollHistory(user);
        if (rollHistory == null) return null;

        const allTimeMap = rollHistory["all-time"] ?? {};
        const sessionMap = rollHistory["session"] ?? {};
        const size = this._getDieSize(dieType);
        const emptyArray = this._getZeroArray(size);

        return {
            allTime: this._createUserRollStats(allTimeMap[dieType] ?? emptyArray, dieType),
            session: this._createUserRollStats(sessionMap[dieType] ?? emptyArray, dieType),
        };
    }

    addRolls(user, size, rolls) {
        let dieType = this._getDieType(size);
        if (dieType == null) return;

        let rollHistory = this._getRollHistory(user) ?? {};
        const allTimeMap = rollHistory["all-time"] ?? {};
        const sessionMap = rollHistory["session"] ?? {};

        allTimeMap[dieType] = allTimeMap[dieType] ?? this._getZeroArray(size);
        sessionMap[dieType] = sessionMap[dieType] ?? this._getZeroArray(size);

        for (let i = 0; i < rolls.length; i++) {
            allTimeMap[dieType][rolls[i] - 1] = allTimeMap[dieType][rolls[i] - 1] + 1;
            sessionMap[dieType][rolls[i] - 1] = sessionMap[dieType][rolls[i] - 1] + 1;
        }

        rollHistory["all-time"] = allTimeMap;
        rollHistory["session"] = sessionMap;

        this._setRollHistory(user, rollHistory);

    }    

    private _createUserRollStats(rolls: Array<number>, dieType) : UserRollStats {
        const calcStats = this._getCalcStats(rolls);
        return {
            dieType: dieType,
            rolls: rolls,
            numberOfRolls: calcStats.numberOfRolls,
            average: calcStats.average,
            highest: calcStats.highest,
            percentages: calcStats.percentages
        };
    }

    private _getCalcStats(rolls: Array<number>): { numberOfRolls: number; average: number; highest: number; percentages: Array<Number> } {
        let rollsTotal = 0;
        let numberOfRolls = 0;
        let highest = 0;
        for (let i = 0; i < rolls.length; i++) {
            rollsTotal += (i + 1) * rolls[i];
            numberOfRolls += rolls[i];
            highest = Math.max(rolls[i], highest);
        }
        let average = this._roundUp(rollsTotal / numberOfRolls) || 0;
        let percentages = this._getZeroArray(rolls.length);
        for (let i = 0; i < rolls.length; i++) {
            let percentage = numberOfRolls != 0 ? this._roundUp((rolls[i] / numberOfRolls) * 100) : 0;
            percentages[i] = percentage;
        }
        return {
            numberOfRolls: numberOfRolls,
            average: average,
            highest: highest,
            percentages: percentages
        };
    }

    private _roundUp(nr: number): number {
        return Math.round((nr + Number.EPSILON) * 10) / 10;
    }

    private _getRollHistory(user) : any {
        const rollHistory = Settings.getSetting(Settings.SETTING_KEYS.ROLL_HISTORY);
        return rollHistory[user.id];
    }

    private _setRollHistory(user, userRollHistory) {
        let rollHistory = Settings.getSetting(Settings.SETTING_KEYS.ROLL_HISTORY);
        rollHistory[user.id] = userRollHistory;
        Settings.setSetting(Settings.SETTING_KEYS.ROLL_HISTORY, rollHistory);
    }

    private _getDieType(size) : string {
        let dieType = `d${size}`;
        return constants.dieTypes.includes(dieType) ? dieType : null;
    }

    private _getDieSize(dieType) : Number {
        var match = dieType.match(/d(\d+)/i);
        return match != null ? match[1] : 0;
    }

    private _getZeroArray(length: Number) {
        const zeroArray = new Array();
        for (let i = 0; i < length; i++)
            zeroArray.push(0);
        return zeroArray;
    }

}

export default RollStats.getInstance();
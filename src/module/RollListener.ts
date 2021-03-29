import constants from "./constants.js";
import RollStats from "./RollStats.js";
import Settings from "./Settings.js";

enum ChartType {
    Session = 1,
    AllTime = 2
  }

class RollListener {

	private static _instance: RollListener;

    private constructor() {
    }

    static getInstance() {
        if (!RollListener._instance)
        RollListener._instance = new RollListener();
        return RollListener._instance;
    }

    async handleCreateChatMessage(chatMessage) {
        const userId = chatMessage?.user?.id;
        if (!(userId && game.user.hasRole(4)))
            return;
        const user = game.users.find(x => x.id == userId);
        this._extractRoll(chatMessage?._roll, chatMessage, user);
    }    

    private _extractRoll(roll, chatMessage, user) {
        if (roll) {
            return this._extractSimpleRoll(roll, user);
        }
        if (game.data.version > '0.6.5') {
            const extractedURIEmbedded = this._extractUnparsedRollsFromEmbedded(chatMessage?.data?.content);
            if (extractedURIEmbedded && extractedURIEmbedded.length > 0) {
                return this._parseEmbeddedRolls(extractedURIEmbedded, user);
            }
        }
        if (this._isBR5eInstalled() && chatMessage?.data?.content) {
            const extractedStringsFromBR5e = this._extractUnparsedRollsFromBR5e(chatMessage?.data?.content);
            if (extractedStringsFromBR5e && extractedStringsFromBR5e.length > 0) {
                return this._extractBR5eRolls(extractedStringsFromBR5e, user);
            }
        }
    }

    /* Simple rolls */

    private _extractSimpleRoll(roll, user) {
        const dice = roll.dice && roll.dice.length !== 0 ? roll.dice : roll._dice;
        if (!(dice?.length > 0))
            return;
        dice.forEach(die => {
            const results = die.results || die.rolls;
            const rolls = results.map(roll => roll.result || roll.roll);
            RollStats.addRolls(user, die.faces, rolls);
        });
    }

    /* Embedded rolls */

    private _extractUnparsedRollsFromEmbedded(message) {
        if (!message) return null;
        const regexRoll = /roll=\"(.*?)\"/g;
        return [...message.matchAll(regexRoll)];
    }

    private _parseEmbeddedRolls(matches, user) {
        if (!(matches && matches.length > 0)) return;
        matches.forEach(element => {
            try {
                const parsedEmbedded = JSON.parse(decodeURIComponent(element[1]));
                const dice = this._extractEmbeddedDice(parsedEmbedded, user);
                dice.forEach(die => {
                    RollStats.addRolls(user, die.faces, die.rolls);
                });
            }
            catch (error) {
            }
        });
    }

    private _extractEmbeddedDice(messageJSON, user) {
        const terms = messageJSON.terms;
        if (!terms) return [];
        let result = [];
        return terms.forEach(term => {
            if (term?.faces != null) {
                result.push({
                    faces: term.faces,
                    rolls: term.results.map(element => element.result)
                });
            }
        });
        return result;
    }

    /* Better rolls 5e */

    private _isBR5eInstalled() {
        return !!game.modules.get('betterrolls5e');
    }

    private _extractUnparsedRollsFromBR5e(message) {
        const rollsRegExp = new RegExp(`<li.*roll die d(\\d+).*>([0-9]+)<\/li>`, 'g');
        return [...message.matchAll(rollsRegExp)];
    }

    private _extractBR5eRolls(rolls, user) {
        if (!(rolls?.length > 0)) return [];
        let dice = rolls.filter(x => (x[1] && x[2]))
            .reduce((rv, x) => {
                let die = rv[x[1]] ?? { 
                    faces: parseInt(x[1]),
                    rolls: []
                };
                die.rolls.push(parseInt(x[2]));
                rv[x[1]] = die;
                return rv;
            }, {});

        Object.values(dice).forEach(v => {
            RollStats.addRolls(user, v["faces"], v["rolls"]);
        });
    }

}

export default RollListener.getInstance();



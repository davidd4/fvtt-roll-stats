import Settings from "./Settings";

class SadnessChan {

	public readonly SETTING_KEYS = {
		COUNTER: 'counter',
	};


	private static _instance: SadnessChan;

    private constructor() {
    }

    static getInstance() {
        if (!SadnessChan._instance)
        SadnessChan._instance = new SadnessChan();
        return SadnessChan._instance;
    }

    getRollHistory() {
        var setting = Settings.getSadnessSetting(this.SETTING_KEYS.COUNTER);
        try {
            return JSON.parse(setting);
        }
        catch (error) {
            return {};
        }
    }

    getUserRollHistory(rollHistory, user) : Array<Number> {
        let userData = rollHistory[user.id];
        return userData?.rolls;
    }

}

export default SadnessChan.getInstance();
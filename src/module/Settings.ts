import constants from "./constants.js";

class Settings {

	public readonly SETTING_KEYS = {
		STATS_CMD: 'statsCommand',
        ROLL_HISTORY: 'rollHistory',
	};
	public readonly SETTING_DEFAULTS = {
		STATS_CMD: `!rollstats`,
	};
	public readonly SETTINGS = [
		{
            key: "statsCommand",
            data: {
                name: "Stats command:",
                hint: "Chat command",
                type: String,
                default: "!rollstats",
                scope: "world",
                config: true,
                restricted: true,
            }
        },
        {
            key: "rollHistory",
            data: {
                type: Object,
                default: {},
                scope: "world",
                config: false,
                restricted: false,
            },
        }
	];

	private static _instance: Settings;

    private constructor() {
    }

    public static getInstance(): Settings {
        if (!Settings._instance) Settings._instance = new Settings();
        return Settings._instance;
    }

	public registerSettings(): void {
		this.SETTINGS.forEach((setting) => {
            this._registerSetting(setting.key, setting.data);
        });
	}
	_registerSetting(key, data) {
        game.settings.register(constants.moduleName, key, data);
    }

    public getSadnessSetting(key: string): any {
        return this._getSetting(constants.sadnessModuleName, key);
    }
	public getSetting(key: string): any {
        return this._getSetting(constants.moduleName, key);
    }
    public setSetting(key: string, value: any) {
        this._setSetting(constants.moduleName, key, value);
    }
	
    _getSetting(module: string, key: string): any {
        return game.settings.get(module, key);
    }
    _setSetting(module: string, key: string, value: any) {
        game.settings.set(module, key, value);
    }

}

export default Settings.getInstance();
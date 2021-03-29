import constants from "./constants.js";
import RollStats from "./RollStats.js";
import Settings from "./Settings.js";

enum ChartType {
    Session = 1,
    AllTime = 2
  }

class ChatBot {

	private static _instance: ChatBot;

    private readonly ERROR_MESSAGES = {
        NOT_ENOUGH_PERMISSIONS: 'Sorry but this command is only for the GM.',
        INVALID_ARGUMENTS: 'Unknown command.',
        NO_DATA: 'No rolls yet.',
    };
    private readonly INFO_MESSAGES = {
        COMPLETE_RESET: 'Complete roll hsitory have been removed.',
        SESSION_RESET: 'Session roll history have been removed.',
        SADNESS_RESET: 'Sadness Chan roll history has been taken over.',
    };

    private constructor() {
    }

    static getInstance() {
        if (!ChatBot._instance)
        ChatBot._instance = new ChatBot();
        return ChatBot._instance;
    }

    handleChatMessage(chatlog, messageText, chatData) : Boolean {
        const user = chatData?.user;
        const command = this.getChatCommand();
        if (!(command && user && messageText && messageText.startsWith(command)))
            return true;
        this._executeCommand(ChatBot._removeCommand(messageText, command), chatData);
        return false;
    }

    private getChatCommand() {
        return Settings.getSetting(Settings.SETTING_KEYS.STATS_CMD);
    }

    private _executeCommand(args, chatData) {
        const resetCommand = 'reset';
        const allCommand = 'all';
        const helpCommand = 'help';
        if (args == "") {
            return this._outputRollStats(chatData);
        }
        else if (args.startsWith(allCommand)) {
            return this._outputAllRollStats(chatData);
        }
        else if (args.startsWith(resetCommand)) {
            return this._executeReset(ChatBot._removeCommand(args, resetCommand), chatData);
        }
        else if (args.startsWith(helpCommand)) {
            return this._outputHelp(chatData);
        }
        else {
            this._createChatMessage(this.ERROR_MESSAGES.INVALID_ARGUMENTS, chatData);
        }
    }

    private _executeReset(args, chatData) {
        if (!game.user.hasRole(4)) {
            this._createChatMessage(this.ERROR_MESSAGES.NOT_ENOUGH_PERMISSIONS, chatData);
            return;
        }
        switch (args) {
            case "complete":
                this._createResetDialog({ 
                    title: `Remove complete roll history?`,
                    content: `<p>Are you sure you want to remove the complete rool history?</p>`
                }).then(() => {
                    RollStats.resetCompleteStats();
                    this._createChatMessage(this.INFO_MESSAGES.COMPLETE_RESET, chatData);
                }).catch(e => {
                    console.log(e);
                });
                break;
            case "session":
                this._createResetDialog({ 
                    title: `Remove session roll history?`,
                    content: `<p>Are you sure you want to remove roll history of the session?</p>`
                }).then(() => {
                    RollStats.resetSessionStats();
                    this._createChatMessage(this.INFO_MESSAGES.SESSION_RESET, chatData);
                }).catch(e => {
                    console.log(e);
                });;
                break;
            case "sadness":
                this._createResetDialog({ 
                    title: `Take over Sadness Chan roll history?`,
                    content: `<p>Are you sure you want to take over roll history from Sadness Chan module?</p>`
                }).then(() => {
                    RollStats.resetViaSadness();
                    this._createChatMessage(this.INFO_MESSAGES.SADNESS_RESET, chatData);
                }).catch(e => {
                    console.log(e);
                });;
                break;
            default:
                this._createChatMessage(this.ERROR_MESSAGES.INVALID_ARGUMENTS, chatData);
                break;
        }
    }

    private _createResetDialog(dialogData) : Promise<void> {
        return new Promise((resolve, reject) => {
            setTimeout(() =>
                new Dialog({
                    title: dialogData.title,
                    content: dialogData.content,
                    buttons: {
                        yes: {
                            icon: '<i class="fa fa-check"></i>',
                            label: 'Yes',
                            callback: () => {
                                resolve();
                            },
                        },
                        cancel: {
                            icon: '<i class="fas fa-times"></i>',
                            label: 'Cancel',
                            callback: () => {
                                reject();
                            }
                        },
                    },
                    default: 'cancel',
                }).render(true), 
                100);
        });
    };

    private _outputRollStats(chatData) {
        const dieType = "d20"; // default die type

        const userData = RollStats.getUserData(game.user, dieType);
        if (userData == null) {
            this._createChatMessage(this.ERROR_MESSAGES.NO_DATA, chatData);
            return;
        }

        let content = this._createUserDataContent(game.user, userData);
        this._createStatsChatMessage(content, chatData);
    }

    private _outputAllRollStats(chatData) {
        if (!game.user.hasRole(4)) {
            this._createChatMessage(this.ERROR_MESSAGES.NOT_ENOUGH_PERMISSIONS, chatData);
            return;
        }

        const dieType = "d20"; // default die type

        let content = ``;
        game.users.filter(user => user.active).forEach(user => {
            const userData = RollStats.getUserData(user, dieType);
            if (userData != null) {
                content += this._createUserDataContent(user, userData);
            }
        });
        this._createStatsChatMessage(content, chatData);
    }

    private _outputHelp(chatData) {
        const command = this.getChatCommand();
        let content = `
            <p><b>${command}</b> - Display roll statistics.</p>
            <p><b>${command} all</b> - Display roll statistics for every user.</p>
            <p><b>${command} reset complete</b> - Reset complete roll history (session and all-time)</p>
            <p><b>${command} reset session</b> - Reset session roll history.</p>
            <p><b>${command} reset sadness</b> - Reset complete roll history and take over the sadness roll history as the all-time history.</p>
        `;
        this._createChatMessage(content, chatData);
    }

    private _createUserDataContent(user, userData) {
        const chatMessageClass = `${constants.moduleName}-stats`;
        const chartClass = `${chatMessageClass}-chart`;
        const summaryClass = `${chatMessageClass}-summary`;
        const summaryAttribsClass = `${summaryClass}-attrs`;

        const title = "Session";

        let content = `<h2 class="${chatMessageClass}-username" data-id="${user.id}">${user.name}</h2>`;

        content += this._createUserRollStatsContent(user, userData.session, ChartType.Session);
        content += this._createUserRollStatsContent(user, userData.allTime, ChartType.AllTime);

        return content;
    }

    private _createUserRollStatsContent(user, userRollStats, chartType: ChartType) {
        const chatMessageClass = `${constants.moduleName}-stats`;
        const chartClass = `${chatMessageClass}-chart`;
        const summaryClass = `${chatMessageClass}-summary`;
        const summaryAttribsClass = `${summaryClass}-attrs`;
        const chartTypeRel = chartType == ChartType.Session ? "session" : "all-time";

        let content =`
            <div>
                <b>${ChatBot._getChartTitle(chartType)}</b>
                <div class=${summaryAttribsClass}>
                    <span>Roll count: ${userRollStats.numberOfRolls}</span>
                    <span>Average: ${userRollStats.average}</span>
                </div>
            </div>`;

        const rolls = userRollStats.rolls;
        content += `<ul class="${chartClass}" data-rel="${ChartType[ChartType[chartType]]}">`;
        for (let i = 0; i < rolls.length; i++) {
            content += `<li style="--data-set:${rolls[i]}/${userRollStats.highest};" data-value="${rolls[i]}" data-label="${i + 1}" title="${i + 1}: ${rolls[i]} (${userRollStats.percentages[i]}%)"></li>`;
        }
        content += `</ul>`;

        return content;
    }

    private _createStatsChatMessage(content, chatData) {
        const chatMessageClass = `${constants.moduleName}-stats`;
        const messageContent = `
            <div class="${chatMessageClass}">
                ${content}
            </div>
        `;
        this._createChatMessage(messageContent, chatData);
    }

    private _createChatMessage(content, chatData) {
        chatData.content = content;
        ChatMessage.create(chatData);
    }

    static _caseInsensitiveReplace(line, word, replaceWith) {
        var regex = new RegExp('(' + word + ')', 'gi');
        return line.replace(regex, replaceWith);
    }

    static _removeCommand(messageText, command) {
        messageText = ChatBot._caseInsensitiveReplace(messageText, command, "");

        return messageText.trim();
    }

    private static _getChartTitle(chartType : ChartType) : string {
        switch (chartType) {
            case ChartType.Session:
                return "Session";
            case ChartType.AllTime:
                return "All-time";
        }
    }

}

export default ChatBot.getInstance();
/**
 * This is your TypeScript entry file for Foundry VTT.
 * Register custom settings, sheets, and constants using the Foundry API.
 * Change this heading to be more descriptive to your module, or remove it.
 * Author: [your name]
 * Content License: [copyright and-or license] If using an existing system
 * 					you may want to put a (link to a) license or copyright
 * 					notice here (e.g. the OGL).
 * Software License: [your license] Put your desired license here, which
 * 					 determines how others may use and modify your module
 */

// Import TypeScript modules
import ChatBot from './module/ChatBot.js';
import RollListener from './module/RollListener.js';
import Settings from './module/Settings.js';
import Templates from './module/Templates.js';

/* ------------------------------------ */
/* Initialize module					*/
/* ------------------------------------ */
Hooks.once('init', async function() {
	console.log('roll-stats | Initializing roll-stats');

	// Assign custom classes and constants here
	
	// Register custom module settings
	Settings.registerSettings();
	
	// Preload Handlebars templates
	await Templates.preloadTemplates();

	// Register custom sheets (if any)

});

/* ------------------------------------ */
/* Setup module							*/
/* ------------------------------------ */
// Hooks.once('setup', function() {
// 	// Do anything after initialization but before
// 	// ready
// });

/* ------------------------------------ */
/* When ready							*/
/* ------------------------------------ */
Hooks.once('ready', function() {
	// Do anything once the module is ready

	Hooks.on("chatMessage", ChatBot.handleChatMessage.bind(ChatBot));

	Hooks.on('createChatMessage', RollListener.handleCreateChatMessage.bind(RollListener));
});

// Add any additional hooks if necessary

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { config } from 'dotenv';

import { __dirname, getExportsFromModule } from './utils/filesystem.js';

// Configure dotenv
config({ quiet: true });

const clientOptions = {
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent
	],
	allowedMentions: {
		parse: ['users', 'roles', 'everyone']
	}
};

// Create a new client instance
const client = new Client(clientOptions);

// Initialize commands
client.commands = new Collection();
const foldersPath = join(__dirname, 'commands');
const commandFolders = readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = join(foldersPath, folder);
	const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js') && !file.startsWith('_'));
	for (const file of commandFiles) {
		const filePath = join(commandsPath, file);
		const command = await getExportsFromModule(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// Initialize events
const eventsPath = join(__dirname, 'events');
const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = join(eventsPath, file);
	const event = await getExportsFromModule(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// Initialize message handlers
client.messageHandlers = new Collection();

const handlersPath = join(__dirname, 'handlers/message');
const handlerFiles = readdirSync(handlersPath).filter(file => file.endsWith('.js'));

for (const file of handlerFiles) {
	const filePath = join(handlersPath, file);
	const handler = await getExportsFromModule(filePath);
	client.messageHandlers.set(handler.name, handler);
}

// Log in to Discord with your client's token
const token = process.env.DISCORD_BOT_TOKEN;
client.login(token);

const name = 'greet';

async function execute(message) {
    if (message.author.bot) return;

    if (message.content.toLowerCase().includes('meow')) {
        await message.channel.send(`${message.author}, meow!`);
    }
}

export { name, execute };


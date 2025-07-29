// load the .env file
require('dotenv').config();
// import telegraf
const {Telegraf} = require('telegraf');
// create bot
const bot = new Telegraf(process.env.BOT_TOKEN);
// a handler for /start command
bot.start(async(ctx)=>{
    await ctx.reply('Send me a message')
})
// handler for text message
bot.on('text',async(ctx) => {
    const userInput = ctx.message.text;
    await ctx.reply(`You Just Saied: ${userInput}`)
})
// launch the bot
bot.launch();
console.log('The Bot is Running...')
// stop handling
process.once('SIGINT',() => bot.stop('SIGING'));
process.once('SIGTERM',() => bot.stop('SIGTERM'));
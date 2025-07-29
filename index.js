// load the .env file
require('dotenv').config();
// import telegraf
const {Telegraf} = require('telegraf');

// INITIALIZE HUGGING_FACE CLIENT

let hf;

async function initializeHf() {
    const {InferenceClient} = await import('@huggingface/inference');
    hf = new InferenceClient(process.env.Hugging_face_Token);
    console.log('Hugging Face Client Initialized...')
}

initializeHf();

// create bot
const bot = new Telegraf(process.env.BOT_TOKEN);
// a handler for /start command
bot.start(async(ctx)=>{
    await ctx.reply('Send me a message')
})
// handler for text message
bot.on('text',async(ctx) => {
    const userInput = ctx.message.text;
    try {
        // show typing indicator to the user
        await ctx.telegram.sendChatAction(ctx.chat.id,'typing');
        // call Hugging Face conversational API
        const response = await hf.conversational({
            model: 'microsoft/DialoGPT-small',
            inputs: {
                text: userInput,
            },
        });
        // send the AI's generated text 
        ctx.reply(response.generated_text);
    } catch (error) {
        console.error('AI error: ',error);
        ctx.reply('Sorry, ai is fucked at the moment, do the thinking yourself...')
    }
})
// launch the bot
bot.launch();
console.log('The Bot is Running...')
// stop handling
process.once('SIGINT',() => bot.stop('SIGING'));
process.once('SIGTERM',() => bot.stop('SIGTERM'));
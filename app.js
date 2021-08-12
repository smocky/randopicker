
require('dotenv').config();
const { App } = require('@slack/bolt');

// Initializes your app in socket mode with your app token and signing secret
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true, // add this
    appToken: process.env.SLACK_APP_TOKEN // add this
});

// Command to kick this off
app.command('/rando', async ({ ack, command, client }) => {
    try {
        await ack();

        // Get all the users in the workspace - to get rid of bot users below!
        const usersResult = await client.users.list();

        // Get the members of the channel
        const membersResult = await client.conversations.members({
            channel: command.channel_id
        });
        // Filter out the person who called the command and any bots/apps
        let members = membersResult.members.filter(user => user != command.user_id && usersResult.members.find(userEntry => userEntry.id === user && !userEntry.is_bot && !userEntry.is_app_user));
        // Select a user at random (may include bots)
        const randomUser = members[Math.floor(Math.random() * members.length)];
        // Send a message to the channel with the selected user mentioned
        client.chat.postMessage({
            channel: command.channel_id,
            text: "Congrats <@" + randomUser + "> :tada: !!"
        })
    } catch (error) {
        console.error(error);
    }
});

(async () => {
    // Start your app
    await app.start(process.env.PORT || 3000);

    console.log('⚡️ Bolt app is running!');
})();
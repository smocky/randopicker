
require('dotenv').config();
const { App, WorkflowStep } = require('@slack/bolt');

// Initializes your app in socket mode with your app token and signing secret
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true, // add this
    appToken: process.env.SLACK_APP_TOKEN // add this
});

// Create a new WorkflowStep instance
const ws = new WorkflowStep('get_random_member', {
    edit: async ({ ack, step, configure }) => {
        await ack();

        const blocks = [
            {
                type: "input",
                block_id: "channel",
                element: {
                    type: "conversations_select",
                    action_id: "channel",
                    placeholder: {
                        type: "plain_text",
                        text: "Select the channel"
                    }
                },
                label: {
                    type: "plain_text",
                    text: "Channel"
                }
            }
        ];
        await configure({ blocks });

    },
    save: async ({ ack, step, view, update }) => {
        await ack();
        const { values } = view.state;
        const channel = values.channel.channel;
        const inputs = {
            channel: { value: channel.selected_conversation }
        };
        const outputs = [
            {
                type: 'user',
                name: 'randoUser',
                label: 'Random User',
            }
        ]
        await update({ inputs, outputs });
    },
    execute: async ({ body, step, complete, fail }) => {
        const { inputs } = step;

        const result = await app.client.conversations.members({
            channel: inputs.channel.value
        });
        const randomUser = result.members[Math.floor(Math.random() * result.members.length)];

        const outputs = {
            randoUser: randomUser,
        };

        // if everything was successful
        await complete({ outputs });

        // if something went wrong
        // fail({ error: { message: "Just testing step failure!" } });
    },
});

app.step(ws);

// Shortcut to kick this off
app.command('/rando', async ({ ack, command, client }) => {
    try {
        await ack();
        const result = await client.conversations.members({
            channel: command.channel_id
        });
        const randomUser = result.members[Math.floor(Math.random() * result.members.length)];
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
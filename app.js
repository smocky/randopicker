
require('dotenv').config();
const { App, WorkflowStep } = require('@slack/bolt');

// Initializes your app in socket mode with your app token and signing secret
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
 //   signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true, // add this
    appToken: process.env.SLACK_APP_TOKEN // add this
});

// Function to get a random user from a channel, excluding apps, bots, and the specified user
const getRandomUser = async ({ channel, userToExclude }) => {
    // Get all the users in the workspace - to get rid of bot users below!
    const usersResult = await app.client.users.list();

    // Get the members of the channel
    const membersResult = await app.client.conversations.members({
        channel: channel
    });
    // Filter out  any bots/apps
    let members = membersResult.members.filter(user => user != userToExclude && usersResult.members.find(userEntry => userEntry.id === user && !userEntry.is_bot && !userEntry.is_app_user));
    // Select a user at random (may include bots)
    const randomUser = members[Math.floor(Math.random() * members.length)];
    return randomUser;
}


// Command to kick this off
app.command('/rando', async ({ ack, command, client }) => {
    try {
        await ack();

        // Get the user
        const randomUser = await getRandomUser({
            channel: command.channel_id,
            userToExclude: command.user_id
        });

        // Send a message to the channel with the selected user mentioned
        client.chat.postMessage({
            channel: command.channel_id,
            text: "Congrats <@" + randomUser + "> :tada: !!"
        })
    } catch (error) {
        console.error(error);
    }
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
            }, {
                type: "input",
                block_id: "user",
                element: {
                    type: "users_select",
                    action_id: "user",
                    placeholder: {
                        type: "plain_text",
                        text: "Select the User who called"
                    }
                },
                label: {
                    type: "plain_text",
                    text: "User"
                }
            }
        ];
        await configure({ blocks });

    },
    save: async ({ ack, step, view, update }) => {
        await ack();
        const { values } = view.state;
        const channel = values.channel.channel;
        const user = values.user.user;
        const inputs = {
            channel: { value: channel.selected_conversation },
            user: { value: user.selected_user }
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
    execute: async ({ step, complete, fail }) => {
        const { inputs } = step;

        // Get the user
        const randomUser = await getRandomUser({
            channel: inputs.channel.value,
            userToExclude: inputs.user.value
        });

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

(async () => {
    // Start your app
    await app.start(process.env.PORT || 3000);

    console.log('⚡️ Bolt app is running!');
})();
import { WebSocket } from 'ws';

function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

// returns ms
function bpmToDelta(bpm) {
    console.log("expected bpm:", bpm);
    return (60000 / bpm) / 4;
}

// all in ms
function createClickArray(start, end, delta) {
    let out = [];
    for (let i = start; i <= end; i += delta) {
        out.push(i);
    }
    return out;
}

// username
var username = makeid(10);
var songs = [];
var songNumber = 0;

const DOMAIN = "https://stream-vs.web.osugaming.lol";

const wsurl = new URL(DOMAIN);
const ws = new WebSocket(wsurl);

ws.addEventListener('open', () => {
    console.log("WebSocket connection established.");

    // send login request
    ws.send(JSON.stringify({
        type:"login",
        data: username,
    }));
});

ws.addEventListener('close', () => {
    console.log("WebSocket connection closed.");
});

ws.addEventListener('error', (e) => {
    console.log("Encountered an error:", JSON.parse(e.data));
});

ws.addEventListener('message', (m) => {
    let res = JSON.parse(m.data);
    switch (res.type) {
        case "login":
            // login successful
            // ask for challenge with challenge details
            console.log("Logged in as", username);
            ws.send(JSON.stringify({ type: "challenge" }));
            break;
        case "join":
            // joined game
            console.log("Join game, starting soon.");
            // send start request
            ws.send(JSON.stringify({ type: "start" }));
            break;
        case "game":
            // game started
            console.log("Game state received.");
            songs = res.data.songs;
            let start = res.data.start;
            let end = start + res.data.songs[songNumber].duration * 1000;
            let clicks = createClickArray(start, end, bpmToDelta(songs[songNumber].bpm));
            ws.send(JSON.stringify({
                type: "results",
                data: {
                    clicks: clicks,
                    start: start,
                    end: end,
                },
            }));
            songNumber++;
            break;
        case "results":
            console.log("BPM:", res.data.results[songNumber - 1][1].bpm,
                        "UT:", res.data.results[songNumber - 1][1].ut);
            break;
        case "message":
            // game end message
            console.log("Game end message:", res.data);
            break;
        default:
            console.log("undefined message:", res);
    }
});

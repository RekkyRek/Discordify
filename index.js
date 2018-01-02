const DiscordRPC = require('discord-rpc'),
	notifier = require('node-notifier'),
	nodeSpotifyWebhelper = require('node-spotify-webhelper'),
	config = require('./config.json');

let spotify;

const ClientId = config.clientId || "384286107036155904";
const imageKey = config.largeImageKey || "spotify_icon_large";
const imageText = config.largeImageText || undefined;

const http = require('http');

const server = http.createServer((req, res) => {
  res.end('ok');
});

http.get('http://127.0.0.1:21847', (resp) => {
  let data = '';

  // A chunk of data has been recieved.
  resp.on('data', (chunk) => { data += chunk; });

  // The whole response has been received. Print out the result.
  resp.on('end', () => {
    console.log('Already running. Exiting...');
    process.exit();
  });
}).on("error", (err) => {
	console.log('Not running. Continuing...');
	server.listen(21847);
	login();
});

DiscordRPC.register(config.clientId)

const rpc = new DiscordRPC.Client({
	transport: 'ipc'
});

var AutoLaunch = require('auto-launch');

var discordifyAutoLaunch = new AutoLaunch({
    name: 'Discordify',
    path: __filename,
});
 
discordifyAutoLaunch.enable();

discordifyAutoLaunch.isEnabled()
	.then(function(isEnabled){
		if(isEnabled){
			return;
		}
		discordifyAutoLaunch.enable();
	})
	.catch(function(err){
		console.error(err);
	});

const timeMode = config.time || 'overall';
var startTimestamp = new Date();
var songName = undefined;

async function updateActivity() {
	if (!rpc) return;
	if (startTimestamp && config.time === 'none') startTimestamp = undefined;

	spotify.getStatus(function(err, res) {
		if (err) {
			if(err.code == 'ECONNREFUSED') {
				console.error('could not connect to spotify, reconnecting...');
				spotify = new nodeSpotifyWebhelper.SpotifyWebHelper();
			}
			return;
		}
		
		try {
			console.log(res.track.track_resource.uri)
			if (res.track.track_resource && res.track.track_resource.name && res.track.track_resource.name != songName) {
				if (config.time === 'song-time') {
					startTimestamp = new Date(new Date() - (res.playing_position * 1000));
				}
				songName = res.track.track_resource.name;
				rpc.setActivity({
					details: `Playing ${res.track.track_resource.name}`,
					state: `By ${res.track.artist_resource.name}`,
					startTimestamp,
					largeImageKey: imageKey,
					largeImageText: imageText,
					instance: 1,
					partyId: '7b68',
					partySize: 1,
					partyMax: 100,
					joinSecret: res.track.track_resource.uri
				});
				console.log(`[${new Date().toLocaleTimeString()}] Updated Rich Presence - ${res.track.track_resource.name}`)
			}
		} catch(e) {
			console.error(e);
		}
	})
}

rpc.on('ready', () => {
	console.log(`Starting with clientId ${ClientId}`);
	updateActivity();
	setInterval(() => {
		updateActivity();
	}, 10e3);
});

function login() {
	console.log('Connecting to discord...')
	spotify = new nodeSpotifyWebhelper.SpotifyWebHelper();

	rpc.login(ClientId).catch(()=>{
		console.warn('Failed connecting to Discord. Retrying in 30s...');
		setTimeout(() => {
			login();
		}, 1000 * 30)
	});
}


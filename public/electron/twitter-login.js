const { BrowserWindow } = require('electron')
const NodeTwitterAPI = require('node-twitter-api')
const Twitter = require('twitter')

module.exports =  class TwitterOAuth {
    constructor(credentials) {
        this.credentials = credentials;
        this.authWindow = null;
    }

    authenticate(callback) {
        const self = this;

        const twitterAuth = new NodeTwitterAPI({
            callback: self.credentials.callbackURL || 'http://localhost',
            consumerKey: self.credentials.consumerKey,
            consumerSecret: self.credentials.consumerSecret
        });

        twitterAuth.getRequestToken((error, requestToken, requestTokenSecret) => {
            if (error) {
                return callback(new Error('Something went wrong while authenticating with Twitter: ' + error.data));
            }

            const url = twitterAuth.getAuthUrl(requestToken);

            self.authWindow = new BrowserWindow({
                width: 800,
                height: 600,
                autoHideMenuBar: true,
                webPreferences: {
                    nodeIntegration: false
                }
            });

            self.authWindow.webContents.on('will-navigate', (e, url) => {
                const matched = url.match(/\?oauth_token=([^&]*)&oauth_verifier=([^&]*)/);

                if (matched) {
                e.preventDefault();

                twitterAuth.getAccessToken(requestToken, requestTokenSecret, matched[2], (error, accessTokenKey, accessTokenSecret) => {
                    if (error) {
                    return callback(new Error('Something went wrong while authenticating with Twitter: ' + error.data));
                    }

                    let token = {
                        accessTokenKey: accessTokenKey,
                        accessTokenSecret: accessTokenSecret
                    };

                    const twit = new Twitter({
                        consumer_key: self.credentials.consumerKey,
                        consumer_secret: self.credentials.consumerSecret,
                        access_token_key: token.accessTokenKey,
                        access_token_secret: token.accessTokenSecret
                    });

                    twit.get('account/verify_credentials', {}, (error, data, response) => {
                    if (error) {
                        console.log(JSON.stringify(error));
                    }

                    token.id_str = data.id_str;

                    callback(null, token);

                    if (self.authWindow) {
                        self.authWindow.close()
                        self.authWindow = null
                    }
                    });
                });
                } else if (url.match(/\/account\/login_verification/)) {
                // Two-Factor Authentication
                } else if (url.match(/\/account\/login_challenge/)) {
                // Login Challenge
                } else if (url.match(/\/oauth\/authenticate/)) {
                // OAuth Verification Callback
                } else if (url.match(/\/oauth\/authorize/)) {
                // OAuth Authorization
                } else {
                e.preventDefault()

                callback(new Error('Something went wrong while authenticating with Twitter'));
                }
            });

            self.authWindow.loadURL(`${url}&force_login=true`);
        });
    }
}
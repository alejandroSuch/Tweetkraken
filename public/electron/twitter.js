const request = require('request')
const {BrowserWindow} = require('electron')
const OAuth = require('oauth');
const auth = require('./twitter-login');
const {api_key, api_secret, bearer_token} = require('./keys.js')

module.exports = class TwitterClient {

    constructor({token, tokenSecret}) {
        this.oauth = new OAuth.OAuth(
            'https://api.twitter.com/oauth/request_token',
            'https://api.twitter.com/oauth/access_token',
            api_key,
            api_secret,
            '1.0A',
            null,
            'HMAC-SHA1'
        );

        //Defaults to the App client token, just in case the user decides to go anonymous
        this.user_consumer_key = token;
        this.user_consumer_secret = tokenSecret;
        this.sessionActive = false;


        /*
            Fields that aren't needed for the demo are commented. 
            Remove the comments to include data in the future. 
            These are all valid fields for the Twitter v2 API
        */
        this.apiConfig = {
            'tweet.fields': [
                'attachments',
                'author_id',
                //'context_annotations',
                //'conversation_id',
                'created_at',
                'entities',
                'geo',
                //'id',
                'in_reply_to_user_id',
                'lang',
                //'non_public_metrics',
                //'organic_metrics',
                //'possibly_sensitive',
                //'promoted_metrics',
                'public_metrics',
                'referenced_tweets',
                //'reply_settings',
                //'source',
                'text',
                //'withheld'
            ].join(','),
            'expansions': [
                //'attachments.poll_ids',
                'attachments.media_keys',
                'author_id',
                'geo.place_id',
                'in_reply_to_user_id',
                'referenced_tweets.id',
                'entities.mentions.username',
                'referenced_tweets.id.author_id'
            ].join(','),
            'user.fields': [
                //'created_at',
                'description',
                //'entities',
                'id',
                //'location',
                'name',
                //'pinned_tweet_id',
                'profile_image_url',
                //'protected',
                //'public_metrics',
                //'url',
                'username',
                'verified',
                //'withheld',
            ].join(','),
            'media.fields': [
                'duration_ms',
                'height',
                'media_key',
                'preview_image_url',
                'public_metrics',
                'type',
                'url',
                'width'
            ].join(',')
        }

        this.headers = {
            'Authorization': 'Bearer ' + bearer_token
        }
    }

    parseToURLParams(json){
        return Object.keys(json).map(key => key + '=' + encodeURIComponent(json[key])).join('&')
    }
    
    fetchUserProfile(callback){
        this.oauth.get(
            'https://api.twitter.com/1.1/account/verify_credentials.json',
            this.user_consumer_key, //user token
            this.user_consumer_secret, //user secret            
            function (e, data, res){
                if (e) console.error(e);
                callback(data);  //Return user profile
            }
        );
    }
    
    fetchUserTimeline(callback){
        this.oauth.get(
            'https://api.twitter.com/1.1/statuses/home_timeline.json',
            this.user_consumer_key, //user token
            this.user_consumer_secret, //user secret            
            function (e, data, res){
                if (e) console.error(e);
                callback(data);  //Return user profile
            }
        );
    }

    /*
        Logs user in Twitter API using oauth. 
        Callback will be called once it's finished. 
        Optionally you can fetch the user profile with fethUserInfo
    */
    loginWithTwitter(callback, fetchUserInfo = false){
        try{
            if(this.sessionActive){
                if(fetchUserInfo) this.fetchUserProfile(callback)
                else callback({token: this.user_consumer_key, tokenSecret: this.user_consumer_secret});
            }else{
                const twitterAuthWindow = new auth({
                    callbackURL: 'https://localhost/user/authorized',
                    consumerKey:api_key,
                    consumerSecret:api_secret
                });
                twitterAuthWindow.authenticate((err, token) => {
                    if (err) {
                        console.log(err, err.stack);
                    }
                    // Store user keys in TwitterClient instance
                    this.user_consumer_key = token.accessTokenKey
                    this.user_consumer_secret = token.accessTokenSecret
                    this.sessionActive = true;
                    if(fetchUserInfo){ 
                        this.fetchUserProfile(callback);
                    }else{
                        callback(result); // Return tokens to the main call
                    }
                });
            }
        }catch(err){
            callback(err);
        }
    }

    searchTweets(query, max_results, next, callback) {
        if (query === '') return;
        
        const params = {
            ...this.apiConfig,
            query,
            max_results,
            ... next ? {next_token: next} : null
        }

        const options = {
            'method': 'GET',
            'url':  `https://api.twitter.com/2/tweets/search/recent?${this.parseToURLParams(params)}`,
            'headers': {
                ...this.headers
            }
        };
        request(options, function (error, response) {
            if (error) throw new Error(error);
            /* - Structure:
                {
                    data: {}, // Tweets
                    includes: {}, // Attachments: Users, quotes, pictures, referenced tweets
                    meta:{} //Tokens, indexation
                }
            */
            let res = JSON.parse(response.body);
            res.data.forEach( (tweet, i) => {
                res.data[i]['author'] = { // Expand the user inside the tweet object
                    ... res.includes.users.find( f => f.id === tweet.author_id)
                }
                if(tweet.referenced_tweets){
                    let ref = tweet.referenced_tweets;
                    ref.forEach( (retweet, j) => {
                        res.data[i].referenced_tweets[j] = {
                            ...retweet,
                            ...res.includes.tweets.find( f => f.id === retweet.id ) //Find included tweet and expand data
                        }
                    } )
                }
            });


            callback({
                data: res.data,
                meta: res.meta
            });
        });
    }

    extendParams(params) {
        return Object.assign({}, params, { tweet_mode: 'extended' });
    }

}
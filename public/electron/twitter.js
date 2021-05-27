const request = require('request')
const sync_request = require('request-promise')
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
                //'geo.place_id',
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
    
    /*
        This function is simplified in order to work for the demo.
        However, here's a hint of what it could evolve to in the future.
        @Improvements:
            - For a search such: 
                '@someone Charizard sucks, #teamBlue for the win' 
            The function should return:
                - A list of entities  {
                    users: ['someone'],
                    tags: ['teamBlue'],
                    queries: [
                        'charizard', 'sucks', 'for', 'the', 'win'
                    ]
                }
            Build a filtered search (get tweets from 'someone' inside the 'teamBlue' tag, including terms from the queries)
    */
    processSearch(query){
        //Get query by words
        let words = query.split(' ');
        // Retrieve first character of the first word, ignore the other words (See @Improvements).
        let symbol = words[0].charAt(0); 

        switch(symbol){
            case '#': 
                return ['hashtag', words[0].slice(1)]
            case '@': 
                return ['user', words[0].slice(1)]
            default: 
                return ['tweet', query] // Defaults to generic tweet search
        }
    }

    requestTweet(options, callback){
        request(options, function (error, response) {
            if (error) throw new Error(error);
            /* - Tweet Structure:
                {
                    data: {}, // Tweets
                    includes: {}, // Attachments: Users, quotes, pictures, referenced tweets
                    meta:{} //Tokens, indexation
                }
            */
            let res = { //Fill with defaults to prevent object[key] access errors
                data: [],
                meta: {
                    result_count: 0
                } ,
                ... JSON.parse(response.body) //Expand and overwrite with API call
            }
            if(res.meta.result_count < 1){
                callback({
                    data: [],
                    meta: res.meta
                });
                return;
            }
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

    fetchTweetSearch(query, max_results, next, callback) {
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
        this.requestTweet(options, callback);
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

    async fetchUserID(username){
        if (username === '') return;
        
        const params = {
            'user.fields': 'id', //this.apiConfig['user.fields']
        }
        
        const options = {
            'method': 'GET',
            'url':  `https://api.twitter.com/2/users/by/username/${encodeURIComponent(username)}?${this.parseToURLParams(params)}`,
            'headers': {
                ...this.headers
            }
        };
        let response = await sync_request(options);
        let content = JSON.parse(response);

        if(content.data && content.data.id){
            return content.data.id;
        }else{
            return false;
        }
    }

    async fetchUserSearch(username, max_results, next, callback, user_id = null){
        if (username === '') return;
        
        //Skip the id fetching if you already know where to look (ie. next page token)
        let id = user_id || await this.fetchUserID(username);

        if(!id){
            callback({
                data: [],
                meta: {result_count: 0}
            });
            return;
        }

        const params = {
            ...this.apiConfig,
            max_results,
            ... next ? {pagination_token: next} : null
        }
        
        const options = {
            'method': 'GET',
            'url':  `https://api.twitter.com/2/users/${encodeURIComponent(id)}/tweets?${this.parseToURLParams(params)}`,
            'headers': {
                ...this.headers
            }
        };
        this.requestTweet(options, data => {
            callback({
                ...data,
                userID: id
            })
        });
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

    searchTweets(query, max_results, next, callback, user_id = null) {
        if (query === '') return;
        
        // Analyze the type of search the user is doing
        let [searchType, searchQuery] = this.processSearch(query); // Returns Array(2) -> [type, query]

        switch(searchType){
            case 'user': 
                this.fetchUserSearch(searchQuery, max_results, next, callback, user_id)
                break;
            case 'hashtag': 
                // Same as tweet search, but we separate it for future use and differentiation in our app,
                // or in case the Twitter API changes and we need to fetch them differently
                this.fetchTweetSearch(searchQuery, max_results, next, callback)
                break;
            case 'tweet': default: // Call tweet search by default
                this.fetchTweetSearch(searchQuery, max_results, next, callback)
                break;
        }
    }

    extendParams(params) {
        return Object.assign({}, params, { tweet_mode: 'extended' });
    }

}
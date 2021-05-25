import React, {useEffect, useState}  from 'react'
import Searchbar from '../searchbar/searchbar';
import Tweet from '../tweet/tweet'
import './twitter-feed.css'

function TwitterFeed({userProfile}) {
    const [tweets, setTweets] = useState([]);
    const [nextPage, setNextPage] = useState(null);
    const [searchStr, setSearchStr] = useState(null);
    const [lastTweet, setLastTweet] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchError, setSearchError] = useState(null);

    useEffect(()=>{ //Set initial listener for tweets once.
        window.api.receive('tweet-response', data => {
            setNextPage(data.meta.next_token);
            setTweets(data.data);
            setIsLoading(false);
        })
        if(userProfile){
            window.api.send('get-timeline');
            window.api.receive('return-timeline', data => {
                setTweets(JSON.parse(data));
            });
        }
    },[]);

    useEffect(() => {   // Call tweet api for every search.
        if(!searchStr) return;
        setLastTweet(null);
        if(searchStr.length > 1) {
            window.api.send('tweet-search', searchStr);
            setIsLoading(true);
            setSearchError(null);
        }else{
            setSearchError('The search must have at least 2 characters');
        }
    },[searchStr]);

    useEffect(()=>{
        if(lastTweet){
            document.querySelector(`#tweet-${lastTweet}`).scrollIntoView({block:'center'});
        }
    }, [tweets]);

    const loadMore = () => {
        window.api.send('tweet-more', {str: searchStr, token: nextPage});
        setIsLoading(true);
        window.api.receive('tweet-more-results', data => {
            setNextPage(data.meta.next_token);
            setLastTweet(tweets[tweets.length - 1].id);
            setTweets(tweets.concat(data.data));
            setIsLoading(false);
        })
    }
    return (
        <div className="twitter-feed">
            <div className="header">
                <Searchbar {...{searchStr, setSearchStr, isLoading, searchError, userProfile}}/>
            </div>
            <div className="main-container">
                {tweets.length > 0 && 
                <>
                    {tweets.map( (t,i) => <Tweet tweet={t} key={t.id}/>)}
                    {nextPage && <button className="load-more" onClick={loadMore}>Load more</button>}
                </>
                }
                {tweets.length < 1 && 
                <div className="empty-feed">
                The feed is empty! Type something to begin searching.
                </div>}
            </div>
        </div>
    )
}

export default TwitterFeed

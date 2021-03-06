import React from 'react'
import moment from 'moment'
import './tweet.css'

import RetweetedStatus from './tweet'
import {ReactComponent as HeartIcon} from './source_icons_heart.svg'
import {ReactComponent as RTIcon} from './source_icons_repeat.svg'
import {ReactComponent as VerifiedIcon} from './source_icons_twitter-verified-badge.svg'

function Tweet({tweet: t, retweeted = false}) {
    const getProcessableTime = (time) => {
        let now = moment(new Date());
        let end = moment(new Date(time));
        let [w, d, h, m, s] = [now.diff(end, 'weeks'), now.diff(end, 'days'), now.diff(end, 'hours'), now.diff(end, 'minutes'), now.diff(end, 'seconds')]
        if(w < 1)
            if(d < 1)
                if(h < 1)
                    if(m < 1) return `${s}s`;
                    else return `${m}m`;
                else return `${h}h`;
            else return `${d}d`;
        else return `${w}w`;
    }

    function replaceBetween(original, startIdx, endIdx, replace) {
        return original.substring(0, startIdx) + replace + original.substring(endIdx);
    }

    function processedTweet(){
        let tmpStr = t.text;
        if(!t.entities) return t.text;
        else {
            let replacements = [];
            Object.keys(t.entities).forEach( (key, k) => {
                if(key !== 'annotations'){
                    t.entities[key].forEach( (item, i) => {
                        if(!item.indices && item.start !== undefined && item.end !== undefined){
                            t.entities[key][i] = {
                                ... item,
                                indices: [item.start, item.end] // Back-compatibility with Twitter API v1
                            }; 
                        }
                    })
                    replacements = [
                        ...replacements,
                        ...t.entities[key]
                    ]
                }
            })
            replacements
                .sort((a,b)=>a.indices[0] - b.indices[0])
                .reverse();
            let i = 0;
            let link = '';
            let r = null;
            while(replacements[i]){
                r = replacements[i];
                let [start, end] = r.indices;
                if(r.tag){ //Hashtag
                    link = `<a href="https://twitter.com/hashtag/${r.tag}" target="_window">#${r.tag}</a>`;
                }else if(r.url){ //Link
                    link = `<a href="${r.url}" target="_window">${r.display_url}</a>`;
                }else if(r.username){ //Hashtag
                    link = `<a href="https://twitter.com/${r.username}" target="_window">@${r.username}</a>`;
                }
                tmpStr = replaceBetween(tmpStr, start, end, link);
                i++;
            }
        }
        
        return <div dangerouslySetInnerHTML={{
            __html: tmpStr
        }}></div>;
    }

    let author = t.author ? t.author : (t.user ? t.user : null)
    let metrics = t.public_metrics ? t.public_metrics : {
        like_count: t.favorite_count,
        retweet_count: t.retweet_count
    }
    return (
        <div className={"tweet" + (retweeted ? ' retweeted': '')} key={t.id} id={'tweet-'+t.id}> 
            { (!retweeted && author) &&
                <div className="tweet-header">
                    <div className="profile-picture">
                        <img src={author.profile_image_url} alt="User avatar"/>
                    </div>
                    <div className="text-group">
                        <span className="user-name">{author.name}</span>
                        {author.verified && <VerifiedIcon className="icon verified" />}
                        <span className="alias">@{author.username}</span>
                        
                        <span className="created-at">&nbsp;??&nbsp;{getProcessableTime(t.created_at)}</span>
                    </div>
                </div>
            }
            <div className="tweet-body">
                {processedTweet()}
                {t.referenced_tweets && !retweeted ? 
                    t.referenced_tweets.map( (rt) => <div className="retweeted" key={rt.id}>
                        <RetweetedStatus tweet={rt} retweeted={true} />
                    </div> )
                    : null
                }
            </div>
            <div className="metrics">
                <span>{metrics.like_count} <HeartIcon className="icon"/></span>
                <span>{metrics.retweet_count} <RTIcon className="icon"/></span>
            </div>
        </div>
    )
}

export default Tweet

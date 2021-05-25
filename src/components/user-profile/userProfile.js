import React, { useEffect, useState } from 'react'
import moment from 'moment'
import './user-profile.css'
function UserProfile({userProfile : u}) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        // add when mounted
        document.addEventListener("mousedown", handleClick);  // return function to be called when unmounted
        return () => {
            document.removeEventListener("mousedown", handleClick);
        };
    }, []);
    const handleClick = function(evt){
        if(!evt.target.closest('.profile-sphere') && !document.querySelector('.profile-popup.hidden')){
            setVisible(false);
        }
    }
    const getJoinedDate = () => {
        let d = moment(new Date(u.created_at));
        return d.format('[Member since] MMMM Mo, YYYY')
    }
    const togglePopUp = () => {
        setVisible(!visible);
    }
    return (
        <div className="profile-sphere">
            <img src={u.profile_image_url_https} alt="User avatar" onClick={togglePopUp}/>
            <div className={`profile-popup ${visible?'':'hidden'}`} style={{
                '--bgColor': `#${u.profile_background_color}`,
                '--textColor': `#${u.profile_text_color}`
            }}>
                <div className="profile-bg">
                    <img src={u.profile_banner_url} alt="User banner"/>
                </div>
                <div className="profile-content">
                    <img className="profile-picture"  src={u.profile_image_url_https} alt="User avatar"/>
                    <span className="name">{u.name}</span>
                    <span className="screen-name">@{u.screen_name}</span>
                    <p className="desc">{u.description}</p>
                    <p className="created">{getJoinedDate()}</p>
                    <span className="underlined">{u.followers_count} Followers</span>
                    <span className="underlined">{u.friends_count} Following</span>
                </div>
            </div>
        </div>
    )
}

export default UserProfile

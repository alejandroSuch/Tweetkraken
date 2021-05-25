import React, { useEffect } from 'react'
import {ReactComponent as TwitterIcon} from './source_icons_twitter.svg'
import './login.css'

function Login ({setIsLoggedIn, setLoginBtnPressed, setUserProfile, setAppLoaded}) {

    useEffect(()=>{
        window.api.receive('user-checked', data => {
            if(data===true){ //If user is already logged in, load timeline
                handleLoginRequest();
            }
            setAppLoaded(true);
        });
        window.api.send('check-user');
    },[]);
    const handleLoginRequest = () => {
        setLoginBtnPressed(true)
        window.api.send('login-req');
        window.api.receive('login-response', data => {
            let res = JSON.parse(data);
            if(res.id){
                setIsLoggedIn(true);
                setUserProfile(res);
            }else{
                alert('There has been an error trying to log you in. For the sake of conciseness in this demo, more error handlings and user states handlers have been omitted. You can however expand this if you want to catch and validate such errors. Your profile will be anonymous now.')
                setIsLoggedIn(false);
                setUserProfile(null);
            }
        });
    }
    const goAnonymous = () => {
        setLoginBtnPressed(true)
        setIsLoggedIn(true)
        setUserProfile(null)
    }
    return (
        <div className="login-screen">
            <img src="./tweetkraken.png" className="app-logo" alt="Tweetkraken logo"/>
            <h1>TweetKraken</h1>
            <p>A simple Electron + React application to fetch Twitter data</p>
            <button onClick={handleLoginRequest}>Sign in with Twitter</button>
            <span>or</span>
            <span className="link" onClick={goAnonymous}>Continue as anonymous</span>
            <TwitterIcon className="icon"/>
        </div>
    )
}

export default Login

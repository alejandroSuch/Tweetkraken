import './App.css'
import React,{useState} from 'react';
import Login from './components/login/login';
import TwitterFeed from './components/twitter-feed/twitterFeed';
import UserProfile from './components/user-profile/userProfile';

function App() {
  const [loggedIn, setIsLoggedIn] = useState(false);
  const [loginBtnPressed, setLoginBtnPressed] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [appLoaded, setAppLoaded] = useState(false);
  return (
    <div className={`App ${!appLoaded ? 'hide-contents': ''}`}>
        {!loggedIn || !loginBtnPressed ?
          <Login {...{setIsLoggedIn, setLoginBtnPressed, setUserProfile, setAppLoaded}}/>
          :
          <TwitterFeed {...{userProfile}}/>
        }
        {userProfile && 
          <div className="user-profile">
            <UserProfile {...{userProfile}}/>
          </div>
        }
    </div>
  );
}

export default App;

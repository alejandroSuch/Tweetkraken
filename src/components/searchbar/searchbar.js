import React, {useEffect, useRef, useState} from 'react';
import useLocalStorage from '../../hooks/useLocalStorage';
import './searchbar.css';
import {ReactComponent as LoaderIcon} from './loader.svg'

function Searchbar({searchStr, setSearchStr, isLoading, searchError, userProfile}) {
    const [history, setHistory] = useLocalStorage('searchHistory',{});
    const [hasText, setHasText] = useState(false);
    const [userID, setUserID] = useState('anon');
    const searchBar = useRef(null);
    const inputSearch = useRef(null);

    useEffect(()=>{
        setHasText(searchStr && searchStr.length > 0);
    },[])

    useEffect(()=>{
        if(userProfile)
            setUserID(userProfile.id)
        else setUserID('anon')
    },[userProfile])

    useEffect(()=>{
        if(!history[userID]){
            let tmp = {...history};
            tmp[userID] = [];
            setHistory(tmp);
        }
    },[userID])

    const handleSearch = e =>  {
        let str = e.target.value;
        if(e.keyCode === 13){ //Enter key
            if(!history[userID].includes(str)){
                let tmp = {...history};
                tmp[userID] = [str, ...tmp[userID]]
                setHistory(tmp);
            }
            setSearchStr(str)
            removeFocus();
        }
        setHasText(str.length > 0);
    }

    const handleClickSuggestion = e => {
        let str = e.target.textContent;
        inputSearch.current.value = str;
        setHasText(true);
        setSearchStr(str);
        removeFocus();
    }

    const removeHistoryElement = e => {
        let val = e.target.parentNode.querySelector('.value').textContent;
        let tmp = {...history};
        tmp[userID] = tmp[userID].filter(e => e !== val)
        setHistory(tmp)
    }

    const resetInput = () => {
        inputSearch.current.value='';
        setHasText(false);
    }

    const removeFocus = () => {
        inputSearch.current.blur();
        searchBar.current.blur();
    }

    var historyElements = [];
    let i = 0;
    while(i<5 && history[userID] && history[userID][i]){
        historyElements.push(
            <div className="history-element" key={i} >
                <div className="value" onClick={handleClickSuggestion}>{history[userID][i]}</div>
                <div className="delete" onClick={removeHistoryElement}>x</div>
            </div>
        )  
        i++;              
    }

    return (
        <>
            <div ref={searchBar} className={"searchbar-wrapper" + (searchError ? ' error' : '')}>
                <input 
                    ref={inputSearch}
                    type="text" 
                    tabIndex="0" 
                    placeholder="Type something and press enter..." 
                    defaultValue={searchStr} 
                    onKeyDown={ handleSearch } 
                />
                <div className="indicators">
                    {hasText && <div className="reset" onClick={resetInput}>x</div>}
                    {isLoading && <div className="loading"><LoaderIcon /></div> }
                </div>
                {!!historyElements.length && <div className="history">
                    {historyElements}
                </div>}
            </div>
            {searchError && <div className="error-desc">{searchError}</div>}
        </>
    )
}

export default Searchbar

// Modules to control application life and create native browser window
const {app, BrowserWindow} = require('electron')
const url = require('url');
const path = require('path')
const { ipcMain } = require('electron')
const TwitterClient = require('./electron/twitter.js')
const isDev = require('electron-is-dev');

const twitter = new TwitterClient({token: null, tokenSecret: null});

function createWindow () {

  const mainWindow = new BrowserWindow({
    title: 'Electron App',
    height: 650,
    width: 1140,
    center: true,
    webPreferences: {
      nodeIntegration: true,
      preload: __dirname + '/electron/preload.js'
    },
  });

  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, '../build/index.html'),
    protocol: 'file',
    slashes: true
  });


  mainWindow.loadURL(startUrl)

  // Open the DevTools.
  if(isDev){
    mainWindow.webContents.openDevTools()
  }

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()
  
  app.on('activate', function () {
    // macOs behaviour: it re-creates a window in the app when 
    // there aren't any other windows open and the user clicks on the dock icon
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. 
// The user quits there explicitly with Cmd + Q
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.on('check-user', (event) => {
  event.reply('user-checked', twitter.sessionActive);
})

ipcMain.on('get-timeline', (event, arg) => {
  twitter.fetchUserTimeline(data => {
    event.reply('return-timeline', data)
  })
})

ipcMain.on('tweet-search', (event, arg) => {
  twitter.searchTweets(arg.toString(), 10, null, data => {
    event.reply('tweet-response', data)
  })
})

ipcMain.on('tweet-more', (event, {str, token, user_id = null}) => {
  twitter.searchTweets(str.toString(), 10, token, data => {
    event.reply('tweet-more-results', data)
  }, user_id)
})

ipcMain.on('login-req', (event) => {
  twitter.loginWithTwitter(data => {
    event.reply('login-response', data)
  }, true)
})
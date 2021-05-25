# Electweet

A simple Twitter feed built with Electron + React.

## Build

### Prerequisites
You will need npm in order to build the project locally. Install it [following their guide](https://www.npmjs.com/package/npm)
### Set up the project 
Simply run 
```bash
    npm install
```
### Development

Run 
```bash
    npm run dev
```
The script will run [concurrently](https://www.npmjs.com/package/concurrently) with [wait.on](https://www.npmjs.com/package/wait-on) to start both React and Electron in development mode.

### Build

Run this to generate the application in your local platform.
```bash
    npm run build
```
You can also run the following scripts for each platform:

- ``npm run build-electron-win`` : Build for Windows
- ``npm run build-electron-lin`` : Build for Linux
- ``npm run build-electron-mac`` : Build for MacOS
- ``npm run build-all`` : Build for all the platforms above

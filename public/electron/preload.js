const {
    contextBridge,
    ipcRenderer
} = require("electron");

// Expose protected methods that allow the renderer process to use the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    "api", {
        send: (channel, data) => {
            /*
            // whitelist channels if you want. ie:
            let validChannels = ["toMain"];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
            */
            ipcRenderer.send(channel, data);
        },
        receive: (channel, func) => {
            /*
            let validChannels = ["fromMain"];
            if (validChannels.includes(channel)) {
                // Deliberately strip event as it includes sender 
                ipcRenderer.on(channel, (event, ...args) => {
                    console.log({args, event, func})
                    func(...args)
                });
            }
            */
            ipcRenderer.on(channel, (event, ...args) => {
                func(...args)
            });
        }
    }
);
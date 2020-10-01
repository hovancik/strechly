const { remote, ipcRenderer, shell } = require('electron')

window.ElectronBridge = {
  // helloWorld () {
  //   console.log("Hello World")
  // },

  showContributorPreferences () {
    ipcRenderer.send('open-contributor-preferences')
    remote.getCurrentWindow().close()
  },

  setContributor () {
    ipcRenderer.send('set-contributor')
  },

  openExternal (link) {
    shell.openExternal(link)
  },

  stretchlyVersion () {
    return remote.app.getVersion()
  },

  async currentSettings () {
    return await ipcRenderer.invoke('current-settings')
  },

  restoreRemoteSettings (remoteSettings) {
    ipcRenderer.invoke('restore-remote-settings', remoteSettings)
  }
}

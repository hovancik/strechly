const {
  app, nativeTheme, BrowserWindow, Menu, ipcMain,
  shell, dialog, globalShortcut, Tray
} = require('electron')
const fs = require("fs");

const path = require('path')
const i18next = require('i18next')
const Backend = require('i18next-fs-backend')
const log = require('electron-log')
const Store = require('electron-store')

process.on('uncaughtException', (err, _) => {
  log.error(err)
  const dialogOpts = {
    type: 'error',
    title: 'Stretchly',
    message: 'An error occured while running Stretchly and it will now quit. To report the issue, click Report.',
    buttons: ['Report', 'OK']
  }
  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) {
      shell.openExternal('https://github.com/hovancik/stretchly/issues')
    }
    app.quit()
  })
})

nativeTheme.on('updated', function theThemeHasChanged () {
  appIcon.setImage(trayIconPath())
})

const Utils = require('./utils/utils')
const IdeasLoader = require('./utils/ideasLoader')
const BreaksPlanner = require('./breaksPlanner')
const AppIcon = require('./utils/appIcon')
const { UntilMorning } = require('./utils/untilMorning')
const Command = require('./utils/commands')

let microbreakIdeas
let breakIdeas
let breakPlanner
let appIcon = null
let appIcon2 = null;
let processWin = null
let microbreakWins = null
let breakWins = null
let preferencesWin = null
let welcomeWin = null
let contributorPreferencesWindow = null
let syncPreferencesWindow = null
let myStretchlyWindow = null
let settings
let pausedForSuspendOrLock = false
let nextIdea = null
let appIsQuitting = false
let updateChecker

require('@electron/remote/main').initialize()

app.setAppUserModelId('net.hovancik.stretchly')

global.shared = {
  isNewVersion: false,
  isContributor: false
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  console.log('Stretchly command instance: started\n')
  const args = process.argv.slice(app.isPackaged ? 1 : 2)
  const cmd = new Command(args, app.getVersion())
  cmd.runOrForward()
  app.quit()
}

app.on('ready', initialize)
app.on('second-instance', runCommand)
app.on('window-all-closed', () => {
  // do nothing, so app wont get closed
})
app.on('before-quit', () => {
  appIsQuitting = true
})

function initialize (isAppStart = true) {
  // TODO maybe we should not reinitialize but handle everything when we save new values for preferences
  log.info(`Stretchly: ${isAppStart ? '' : 're'}initializing...`)
  require('events').defaultMaxListeners = 200 // for watching Store changes
  if (!settings) {
    settings = new Store({ defaults: require('./utils/defaultSettings'), watch: true })
    log.info('Stretchly: loading preferences')
    Store.initRenderer()
    Object.entries(settings.store).forEach(([key, _]) => {
      settings.onDidChange(key, (newValue, oldValue) => {
        log.info(`Stretchly: setting '${key}' to '${newValue}' (was '${oldValue}')`)
      })
    })
  }
  if (!breakPlanner) {
    breakPlanner = new BreaksPlanner(settings)
    breakPlanner.nextBreak()
    breakPlanner.on('startMicrobreakNotification', () => { startMicrobreakNotification() })
    breakPlanner.on('startBreakNotification', () => { startBreakNotification() })
    breakPlanner.on('startMicrobreak', () => { startMicrobreak() })
    breakPlanner.on('finishMicrobreak', (shouldPlaySound) => { finishMicrobreak(shouldPlaySound) })
    breakPlanner.on('startBreak', () => { startBreak() })
    breakPlanner.on('finishBreak', (shouldPlaySound) => { finishBreak(shouldPlaySound) })
    breakPlanner.on('resumeBreaks', () => { resumeBreaks() })
    breakPlanner.on('updateToolTip', function () {
      updateTray()
    })
  } else {
    breakPlanner.clear()
    breakPlanner.appExclusionsManager.reinitialize(settings)
    breakPlanner.doNotDisturb(settings.get('monitorDnd'))
    breakPlanner.naturalBreaks(settings.get('naturalBreaks'))
    breakPlanner.nextBreak()
  }
  if (!appIcon) {
    if (process.platform === 'darwin') {
      app.dock.hide()
    }
    appIcon = new Tray(trayIconPath());
  }

  startI18next()
  setInterval(updateTray, 10000)
  startProcessWin()
  createWelcomeWindow()
  nativeTheme.themeSource = settings.get('themeSource')

  require('fs').readFile(path.join(app.getPath('userData'), 'stamp'), 'utf8', (err, data) => {
    if (err) {
      return
    }
    const { DateTime } = require('luxon')
    if (DateTime.fromISO(data).month === DateTime.now().month) {
      global.shared.isContributor = true
      log.info('Stretchly: Thanks for your contributions!')
      if (preferencesWin) {
        preferencesWin.send('enableContributorPreferences')
      }
      updateTray()
    }
  })
  startPowerMonitoring()
  if (preferencesWin) {
    preferencesWin.send('renderSettings', settingsToSend())
  }
  if (welcomeWin) {
    welcomeWin.send('renderSettings', settingsToSend())
  }
  if (contributorPreferencesWindow) {
    contributorPreferencesWindow.send('renderSettings', settingsToSend())
  }
  globalShortcut.unregisterAll()
  if (settings.get('resumeBreaksShortcut') !== '') {
    const resumeBreaksShortcut = globalShortcut.register(settings.get('resumeBreaksShortcut'), () => {
      resumeBreaks(false)
    })

    if (!resumeBreaksShortcut) {
      log.warn('Stretchly: resumeBreaksShortcut registration failed')
    } else {
      log.info(`Stretchly: resumeBreaksShortcut registration succesful (${settings.get('resumeBreaksShortcut')})`)
    }
  }
  if (settings.get('pauseBreaksShortcut') !== '') {
    const pauseBreaksShortcut = globalShortcut.register(settings.get('pauseBreaksShortcut'), () => {
      pauseBreaks(1)
    })

    if (!pauseBreaksShortcut) {
      log.warn('Stretchly: pauseBreaksShortcut registration failed')
    } else {
      log.info(`Stretchly: pauseBreaksShortcut registration succesful (${settings.get('pauseBreaksShortcut')})`)
    }
  }
}

function startI18next () {
  i18next
    .use(Backend)
    .init({
      lng: settings.get('language'),
      fallbackLng: 'en',
      debug: false,
      backend: {
        loadPath: path.join(__dirname, '/locales/{{lng}}.json'),
        jsonIndent: 2
      }
    }, function (err, t) {
      if (err) {
        console.log(err.stack)
      }
      if (appIcon) {
        updateTray()
      }
    })
}

i18next.on('languageChanged', function (lng) {
  if (appIcon) {
    updateTray()
  }
})

function onSuspendOrLock () {
  log.info('System: suspend or lock')
  if (!breakPlanner.isPaused) {
    if (settings.get('pauseForSuspendOrLock')) {
      pausedForSuspendOrLock = true
      pauseBreaks(1)
      updateTray()
    }
  }
}

function onResumeOrUnlock () {
  log.info('System: resume or unlock')
  if (pausedForSuspendOrLock) {
    pausedForSuspendOrLock = false
    resumeBreaks(false)
  } else {
    // corrrect the planner for the time spent in suspend
    breakPlanner.correctScheduler()
  }
  updateTray()
}

function startPowerMonitoring () {
  const electron = require('electron')
  electron.powerMonitor.on('suspend', onSuspendOrLock)
  electron.powerMonitor.on('lock-screen', onSuspendOrLock)
  electron.powerMonitor.on('resume', onResumeOrUnlock)
  electron.powerMonitor.on('unlock-screen', onResumeOrUnlock)
}

function numberOfDisplays () {
  const electron = require('electron')
  return electron.screen.getAllDisplays().length
}

function closeWindows (windowArray) {
  for (const window of windowArray) {
    window.hide()
    window.close()
  }
  return null
}

function displaysX (displayID = -1, width = 800, fullscreen = false) {
  const electron = require('electron')
  let theScreen

  if (!settings.get('allScreens')) {
    if (settings.get('screen') === 'primary') {
      theScreen = electron.screen.getPrimaryDisplay()
    } else if (settings.get('screen') === 'cursor') {
      theScreen = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint())
    } else {
      displayID = parseInt(settings.get('screen'))
    }
  }

  if (displayID === -1) {
    theScreen = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint())
  } else if (displayID >= numberOfDisplays() || displayID < 0) {
    log.warn(`Stretchly: invalid displayID ${displayID} to displaysX`)
    theScreen = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint())
  } else {
    const screens = electron.screen.getAllDisplays()
    theScreen = screens[displayID]
  }
  const bounds = theScreen.bounds
  if (fullscreen) {
    return Math.ceil(bounds.x)
  } else {
    return Math.ceil(bounds.x + ((bounds.width - width) / 2))
  }
}

function displaysY (displayID = -1, height = 600, fullscreen = false) {
  const electron = require('electron')
  let theScreen

  if (!settings.get('allScreens')) {
    if (settings.get('screen') === 'primary') {
      theScreen = electron.screen.getPrimaryDisplay()
    } else if (settings.get('screen') === 'cursor') {
      theScreen = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint())
    } else {
      displayID = parseInt(settings.get('screen'))
    }
  }

  if (displayID === -1) {
    theScreen = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint())
  } else if (displayID >= numberOfDisplays() || displayID < 0) {
    log.warn(`Stretchly: invalid displayID ${displayID} to displaysY`)
    theScreen = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint())
  } else {
    const screens = electron.screen.getAllDisplays()
    theScreen = screens[displayID]
  }
  const bounds = theScreen.bounds
  if (fullscreen) {
    return Math.ceil(bounds.y)
  } else {
    return Math.ceil(bounds.y + ((bounds.height - height) / 2))
  }
}

function displaysWidth (displayID = -1) {
  const electron = require('electron')
  let theScreen

  if (!settings.get('allScreens')) {
    if (settings.get('screen') === 'primary') {
      theScreen = electron.screen.getPrimaryDisplay()
    } else if (settings.get('screen') === 'cursor') {
      theScreen = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint())
    } else {
      displayID = parseInt(settings.get('screen'))
    }
  }

  if (displayID === -1) {
    theScreen = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint())
  } else if (displayID >= numberOfDisplays() || displayID < 0) {
    log.warn(`Stretchly: invalid displayID ${displayID} to displaysWidth`)
    theScreen = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint())
  } else {
    const screens = electron.screen.getAllDisplays()
    theScreen = screens[displayID]
  }
  const bounds = theScreen.bounds
  return Math.ceil(bounds.width)
}

function displaysHeight (displayID = -1) {
  const electron = require('electron')
  let theScreen

  if (!settings.get('allScreens')) {
    if (settings.get('screen') === 'primary') {
      theScreen = electron.screen.getPrimaryDisplay()
    } else if (settings.get('screen') === 'cursor') {
      theScreen = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint())
    } else {
      displayID = parseInt(settings.get('screen'))
    }
  }

  if (displayID === -1) {
    theScreen = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint())
  } else if (displayID >= numberOfDisplays() || displayID < 0) {
    log.warn(`Stretchly: invalid displayID ${displayID} to displaysHeight`)
    theScreen = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint())
  } else {
    const screens = electron.screen.getAllDisplays()
    theScreen = screens[displayID]
  }
  const bounds = theScreen.bounds
  return Math.ceil(bounds.height)
}

function trayIconPath () {
  const params = {
    paused:
      breakPlanner.isPaused ||
      breakPlanner.dndManager.isOnDnd ||
      breakPlanner.naturalBreaksManager.isSchedulerCleared ||
      breakPlanner.appExclusionsManager.isSchedulerCleared,
    monochrome: settings.get("useMonochromeTrayIcon"),
    inverted: settings.get("useMonochromeInvertedTrayIcon"),
    darkMode: nativeTheme.shouldUseDarkColors,
    platform: process.platform,
    remainingModeString: settings.get("breakIconType"),
    remainingTimeString: Utils.minutesRemaining(
      breakPlanner.scheduler.timeLeft
    ),
    totalLongBreak: (settings.get("breakInterval") + 1) * 10,
  };
  const trayIconFileName = new AppIcon(params).trayIconFileName;
  let pathToTryIcon=path.join(__dirname, '/images/app-icons/', trayIconFileName)
  return pathToTryIcon;
}

function windowIconPath () {
  const params = {
    paused: false,
    monochrome: settings.get("useMonochromeTrayIcon"),
    inverted: settings.get("useMonochromeInvertedTrayIcon"),
    darkMode: nativeTheme.shouldUseDarkColors,
    platform: process.platform,
    remainingModeString: settings.get("breakIconType"),
    remainingTimeString: "60",
    totalLongBreak: (settings.get("breakInterval") + 1) * 10,
  };
  const windowIconFileName = new AppIcon(params).windowIconFileName
  return path.join(__dirname, '/images/app-icons', windowIconFileName)
}

function startProcessWin () {
  if (processWin) {
    planVersionCheck()
    return
  }
  const modalPath = path.join('file://', __dirname, '/process.html')
  processWin = new BrowserWindow({
    show: false,
    backgroundThrottling: false,
    webPreferences: {
      preload: path.join(__dirname, './process.js'),
      enableRemoteModule: true
    }
  })
  processWin.loadURL(modalPath)
  processWin.once('ready-to-show', () => {
    planVersionCheck()
  })
}

function createWelcomeWindow (isAppStart = true) {
  if (settings.get('isFirstRun') && isAppStart) {
    const modalPath = path.join('file://', __dirname, '/welcome.html')
    welcomeWin = new BrowserWindow({
      x: displaysX(-1, 1000),
      y: displaysY(-1, 770),
      width: 1000,
      height: 770,
      autoHideMenuBar: true,
      icon: windowIconPath(),
      backgroundColor: 'EDEDED',
      webPreferences: {
        preload: path.join(__dirname, './welcome.js'),
        enableRemoteModule: true
      }
    })
    welcomeWin.loadURL(modalPath)
    if (welcomeWin) {
      welcomeWin.on('closed', () => {
        welcomeWin = null
      })
    }
    setTimeout(() => {
      welcomeWin.center()
    }, 0)
  }
}

function createContributorSettingsWindow () {
  if (contributorPreferencesWindow) {
    contributorPreferencesWindow.show()
    return
  }
  const modalPath = path.join('file://', __dirname, '/contributor-preferences.html')
  contributorPreferencesWindow = new BrowserWindow({
    x: displaysX(-1, 735),
    y: displaysY(),
    width: 735,
    autoHideMenuBar: true,
    icon: windowIconPath(),
    backgroundColor: 'EDEDED',
    webPreferences: {
      preload: path.join(__dirname, './contributor-preferences.js'),
      enableRemoteModule: true
    }
  })
  contributorPreferencesWindow.loadURL(modalPath)
  if (contributorPreferencesWindow) {
    contributorPreferencesWindow.on('closed', () => {
      contributorPreferencesWindow = null
    })
  }
  setTimeout(() => {
    contributorPreferencesWindow.center()
  }, 0)
}

function createSyncPreferencesWindow () {
  if (syncPreferencesWindow) {
    syncPreferencesWindow.show()
    return
  }

  const syncPreferencesUrl = 'https://my.stretchly.net/app/v1/sync'
  syncPreferencesWindow = new BrowserWindow({
    autoHideMenuBar: true,
    width: 1000,
    height: 700,
    icon: windowIconPath(),
    x: displaysX(),
    y: displaysY(),
    backgroundColor: 'whitesmoke',
    webPreferences: {
      preload: path.resolve(__dirname, './electron-bridge.js'),
      enableRemoteModule: true
    }
  })
  syncPreferencesWindow.loadURL(syncPreferencesUrl)
  if (syncPreferencesWindow) {
    syncPreferencesWindow.on('closed', () => {
      syncPreferencesWindow = null
    })
  }

  setTimeout(() => {
    syncPreferencesWindow.center()
  }, 0)
}

function planVersionCheck (seconds = 1) {
  if (updateChecker) {
    clearInterval(updateChecker)
    updateChecker = null
  }
  updateChecker = setTimeout(checkVersion, seconds * 1000)
}

function checkVersion () {
  if (settings.get('checkNewVersion')) {
    processWin.webContents.send('checkVersion', {
      oldVersion: `v${app.getVersion()}`,
      notify: settings.get('notifyNewVersion'),
      silent: settings.get('silentNotifications')
    })
    planVersionCheck(3600 * 48)
  }
}

function startMicrobreakNotification () {
  showNotification(i18next.t('main.microbreakIn', { seconds: settings.get('microbreakNotificationInterval') / 1000 }))
  log.info('Stretchly: showing Mini Break notification')
  breakPlanner.nextBreakAfterNotification()
  updateTray()
}

function startBreakNotification () {
  showNotification(i18next.t('main.breakIn', { seconds: settings.get('breakNotificationInterval') / 1000 }))
  log.info('Stretchly: showing Long Break notification')
  breakPlanner.nextBreakAfterNotification()
  updateTray()
}

function startMicrobreak () {
  if (!microbreakIdeas) {
    loadIdeas()
  }
  // don't start another break if break running
  if (microbreakWins) {
    log.warn('Stretchly: Mini Break already running, not starting Mini Break')
    return
  }

  const startTime = Date.now()
  const breakDuration = settings.get('microbreakDuration')
  const strictMode = settings.get('microbreakStrictMode')
  const postponesLimit = settings.get('microbreakPostponesLimit')
  const postponableDurationPercent = settings.get('microbreakPostponableDurationPercent')
  const postponable = settings.get('microbreakPostpone') &&
    breakPlanner.postponesNumber < postponesLimit && postponesLimit > 0
  const showBreaksAsRegularWindows = settings.get('showBreaksAsRegularWindows')

  if (!strictMode || postponable) {
    if (settings.get('endBreakShortcut') !== '') {
      globalShortcut.register(settings.get('endBreakShortcut'), () => {
        const passedPercent = (Date.now() - startTime) / breakDuration * 100
        if (Utils.canPostpone(postponable, passedPercent, postponableDurationPercent)) {
          postponeMicrobreak()
        } else if (Utils.canSkip(strictMode, postponable, passedPercent, postponableDurationPercent)) {
          finishMicrobreak(false)
        }
      })
    }
  }

  const modalPath = path.join('file://', __dirname, '/microbreak.html')
  microbreakWins = []

  const idea = nextIdea || (settings.get('ideas') ? microbreakIdeas.randomElement : [''])
  nextIdea = null

  if (settings.get('microbreakStartSoundPlaying') && !settings.get('silentNotifications')) {
    processWin.webContents.send('playSound', settings.get('audio'), settings.get('volume'))
  }

  for (let localDisplayId = 0; localDisplayId < numberOfDisplays(); localDisplayId++) {
    const windowOptions = {
      width: Number.parseInt(displaysWidth(localDisplayId) * settings.get('breakWindowWidth')),
      height: Number.parseInt(displaysHeight(localDisplayId) * settings.get('breakWindowHeight')),
      autoHideMenuBar: true,
      icon: windowIconPath(),
      resizable: false,
      frame: showBreaksAsRegularWindows,
      show: false,
      backgroundThrottling: false,
      transparent: settings.get('transparentMode'),
      backgroundColor: calculateBackgroundColor(),
      skipTaskbar: !showBreaksAsRegularWindows,
      focusable: showBreaksAsRegularWindows,
      alwaysOnTop: !showBreaksAsRegularWindows,
      title: 'Stretchly',
      webPreferences: {
        preload: path.join(__dirname, './microbreak.js'),
        enableRemoteModule: true
      }
    }

    if (settings.get('fullscreen') && process.platform !== 'darwin') {
      windowOptions.width = displaysWidth(localDisplayId)
      windowOptions.height = displaysHeight(localDisplayId)
      windowOptions.x = displaysX(localDisplayId, 0, true)
      windowOptions.y = displaysY(localDisplayId, 0, true)
    } else if (!(settings.get('fullscreen') && process.platform === 'win32')) {
      windowOptions.x = displaysX(localDisplayId, windowOptions.width, false)
      windowOptions.y = displaysY(localDisplayId, windowOptions.height, false)
    }

    let microbreakWinLocal = new BrowserWindow(windowOptions)
    // seems to help with multiple-displays problems
    microbreakWinLocal.setSize(windowOptions.width, windowOptions.height)
    ipcMain.on('send-microbreak-data', (event) => {
      event.sender.send('microbreakIdea', idea)
      event.sender.send('progress', startTime,
        breakDuration, strictMode, postponable, postponableDurationPercent)
    })
    // microbreakWinLocal.webContents.openDevTools()
    microbreakWinLocal.once('ready-to-show', () => {
      if (showBreaksAsRegularWindows) {
        microbreakWinLocal.show()
      } else {
        microbreakWinLocal.showInactive()
      }

      log.info(`Stretchly: showing window ${localDisplayId + 1} of ${numberOfDisplays()}`)
      if (process.platform === 'darwin') {
        if (showBreaksAsRegularWindows) {
          microbreakWinLocal.setFullScreen(settings.get('fullscreen'))
        } else {
          microbreakWinLocal.setKiosk(settings.get('fullscreen'))
        }
      }
      if (localDisplayId === 0) {
        breakPlanner.emit('microbreakStarted', true)
        log.info('Stretchly: starting Mini Break')
      }
      if (!settings.get('fullscreen') && process.platform !== 'darwin') {
        setTimeout(() => {
          microbreakWinLocal.center()
        }, 0)
      }
    })

    microbreakWinLocal.loadURL(modalPath)
    microbreakWinLocal.setVisibleOnAllWorkspaces(true)
    microbreakWinLocal.setAlwaysOnTop(!showBreaksAsRegularWindows, 'pop-up-menu')
    if (microbreakWinLocal) {
      microbreakWinLocal.on('close', (e) => {
        if (settings.get('showBreaksAsRegularWindows')) {
          if (!appIsQuitting && !microbreakWinLocal.fullScreen) {
            e.preventDefault()
          }
        }
      })
      microbreakWinLocal.on('closed', () => {
        microbreakWinLocal = null
      })
    }
    microbreakWins.push(microbreakWinLocal)

    if (!settings.get('allScreens')) {
      if (numberOfDisplays() > 1) {
        log.info('Stretchly: not showing on more Monitors as it is disabled.')
      }
      break
    }
  }
  if (process.platform === 'darwin') {
    app.dock.hide()
  }
  updateTray()
  setTimeout(() => {
    ipcMain.removeAllListeners('send-microbreak-data')
  }, 2000)
}

function startBreak () {
  if (!breakIdeas) {
    loadIdeas()
  }
  if (breakWins) {
    log.warn('Stretchly: Long Break already running, not starting Long Break')
    return
  }

  const startTime = Date.now()
  const breakDuration = settings.get('breakDuration')
  const strictMode = settings.get('breakStrictMode')
  const postponesLimit = settings.get('breakPostponesLimit')
  const postponableDurationPercent = settings.get('breakPostponableDurationPercent')
  const postponable = settings.get('breakPostpone') &&
    breakPlanner.postponesNumber < postponesLimit && postponesLimit > 0
  const showBreaksAsRegularWindows = settings.get('showBreaksAsRegularWindows')

  if (!strictMode || postponable) {
    if (settings.get('endBreakShortcut') !== '') {
      globalShortcut.register(settings.get('endBreakShortcut'), () => {
        const passedPercent = (Date.now() - startTime) / breakDuration * 100
        if (Utils.canPostpone(postponable, passedPercent, postponableDurationPercent)) {
          postponeBreak()
        } else if (Utils.canSkip(strictMode, postponable, passedPercent, postponableDurationPercent)) {
          finishBreak(false)
        }
      })
    }
  }

  const modalPath = path.join('file://', __dirname, '/break.html')
  breakWins = []

  const defaultNextIdea = settings.get('ideas') ? breakIdeas.randomElement : ['', '']
  const idea = nextIdea ? (nextIdea.map((val, index) => val || defaultNextIdea[index])) : defaultNextIdea
  nextIdea = null

  if (settings.get('breakStartSoundPlaying') && !settings.get('silentNotifications')) {
    processWin.webContents.send('playSound', settings.get('audio'), settings.get('volume'))
  }

  for (let localDisplayId = 0; localDisplayId < numberOfDisplays(); localDisplayId++) {
    const windowOptions = {
      width: Number.parseInt(displaysWidth(localDisplayId) * settings.get('breakWindowWidth')),
      height: Number.parseInt(displaysHeight(localDisplayId) * settings.get('breakWindowHeight')),
      autoHideMenuBar: true,
      icon: windowIconPath(),
      resizable: false,
      frame: showBreaksAsRegularWindows,
      show: false,
      backgroundThrottling: false,
      transparent: settings.get('transparentMode'),
      backgroundColor: calculateBackgroundColor(),
      skipTaskbar: !showBreaksAsRegularWindows,
      focusable: showBreaksAsRegularWindows,
      alwaysOnTop: !showBreaksAsRegularWindows,
      title: 'Stretchly',
      webPreferences: {
        preload: path.join(__dirname, './break.js'),
        enableRemoteModule: true
      }
    }

    if (settings.get('fullscreen') && process.platform !== 'darwin') {
      windowOptions.width = displaysWidth(localDisplayId)
      windowOptions.height = displaysHeight(localDisplayId)
      windowOptions.x = displaysX(localDisplayId, 0, true)
      windowOptions.y = displaysY(localDisplayId, 0, true)
    } else if (!(settings.get('fullscreen') && process.platform === 'win32')) {
      windowOptions.x = displaysX(localDisplayId, windowOptions.width, false)
      windowOptions.y = displaysY(localDisplayId, windowOptions.height, false)
    }

    let breakWinLocal = new BrowserWindow(windowOptions)
    // seems to help with multiple-displays problems
    breakWinLocal.setSize(windowOptions.width, windowOptions.height)
    ipcMain.on('send-break-data', (event) => {
      event.sender.send('breakIdea', idea)
      event.sender.send('progress', startTime,
        breakDuration, strictMode, postponable, postponableDurationPercent)
    })
    // breakWinLocal.webContents.openDevTools()
    breakWinLocal.once('ready-to-show', () => {
      if (showBreaksAsRegularWindows) {
        breakWinLocal.show()
      } else {
        breakWinLocal.showInactive()
      }

      log.info(`Stretchly: showing window ${localDisplayId + 1} of ${numberOfDisplays()}`)
      if (process.platform === 'darwin') {
        if (showBreaksAsRegularWindows) {
          breakWinLocal.setFullScreen(settings.get('fullscreen'))
        } else {
          breakWinLocal.setKiosk(settings.get('fullscreen'))
        }
      }
      if (localDisplayId === 0) {
        breakPlanner.emit('breakStarted', true)
        log.info('Stretchly: starting Long Break')
      }

      if (!settings.get('fullscreen') && process.platform !== 'darwin') {
        setTimeout(() => {
          breakWinLocal.center()
        }, 0)
      }
    })
    breakWinLocal.loadURL(modalPath)
    breakWinLocal.setVisibleOnAllWorkspaces(true)
    breakWinLocal.setAlwaysOnTop(!showBreaksAsRegularWindows, 'pop-up-menu')
    if (breakWinLocal) {
      breakWinLocal.on('close', (e) => {
        if (settings.get('showBreaksAsRegularWindows')) {
          if (!appIsQuitting && !breakWinLocal.fullScreen) {
            e.preventDefault()
          }
        }
      })
      breakWinLocal.on('closed', () => {
        breakWinLocal = null
      })
    }
    breakWins.push(breakWinLocal)

    if (!settings.get('allScreens')) {
      if (numberOfDisplays() > 1) {
        log.info('Stretchly: not showing on more Monitors as it is disabled.')
      }
      break
    }
  }
  if (process.platform === 'darwin') {
    app.dock.hide()
  }
  updateTray()
  setTimeout(() => {
    ipcMain.removeAllListeners('send-break-data')
  }, 2000)
}

function breakComplete (shouldPlaySound, windows) {
  if (globalShortcut.isRegistered(settings.get('endBreakShortcut'))) {
    globalShortcut.unregister(settings.get('endBreakShortcut'))
  }
  if (shouldPlaySound && !settings.get('silentNotifications')) {
    processWin.webContents.send('playSound', settings.get('audio'), settings.get('volume'))
  }
  if (process.platform === 'darwin') {
    // get focus on the last app
    Menu.sendActionToFirstResponder('hide:')
  }
  return closeWindows(windows)
}

function finishMicrobreak (shouldPlaySound = true) {
  microbreakWins = breakComplete(shouldPlaySound, microbreakWins)
  log.info('Stretchly: finishing Mini Break')
  breakPlanner.nextBreak()
  updateTray()
}

function finishBreak (shouldPlaySound = true) {
  breakWins = breakComplete(shouldPlaySound, breakWins)
  log.info('Stretchly: finishing Long Break')
  breakPlanner.nextBreak()
  updateTray()
}

function postponeMicrobreak (shouldPlaySound = false) {
  microbreakWins = breakComplete(shouldPlaySound, microbreakWins)
  breakPlanner.postponeCurrentBreak()
  log.info('Stretchly: postponing Mini Break')
  updateTray()
}

function postponeBreak (shouldPlaySound = false) {
  breakWins = breakComplete(shouldPlaySound, breakWins)
  breakPlanner.postponeCurrentBreak()
  log.info('Stretchly: postponing Long Break')
  updateTray()
}

function skipToMicrobreak () {
  if (microbreakWins) {
    microbreakWins = breakComplete(false, microbreakWins)
  }
  if (breakWins) {
    breakWins = breakComplete(false, breakWins)
  }
  breakPlanner.skipToMicrobreak()
  log.info('Stretchly: skipping to Mini Break')
  updateTray()
}

function skipToBreak () {
  if (microbreakWins) {
    microbreakWins = breakComplete(false, microbreakWins)
  }
  if (breakWins) {
    breakWins = breakComplete(false, breakWins)
  }
  breakPlanner.skipToBreak()
  log.info('Stretchly: skipping to Long Break')
  updateTray()
}

function resetBreaks () {
  if (microbreakWins) {
    microbreakWins = breakComplete(false, microbreakWins)
  }
  if (breakWins) {
    breakWins = breakComplete(false, breakWins)
  }
  breakPlanner.reset()
  log.info('Stretchly: reseting breaks')
  updateTray()
}

function calculateBackgroundColor () {
  const themeColor = settings.get('mainColor')
  const opacity = settings.get('opacity')
  return '#' + Math.round(opacity * 255).toString(16) + themeColor.substr(1)
}

function loadIdeas () {
  let breakIdeasData
  let microbreakIdeasData
  if (settings.get('useIdeasFromSettings')) {
    breakIdeasData = settings.get('breakIdeas')
    microbreakIdeasData = settings.get('microbreakIdeas')
  } else {
    breakIdeasData = require('./utils/defaultBreakIdeas')
    microbreakIdeasData = require('./utils/defaultMicrobreakIdeas')
  }
  breakIdeas = new IdeasLoader(breakIdeasData).ideas()
  microbreakIdeas = new IdeasLoader(microbreakIdeasData).ideas()
}

function pauseBreaks (milliseconds) {
  if (microbreakWins) {
    finishMicrobreak(false)
  }
  if (breakWins) {
    finishBreak(false)
  }
  breakPlanner.pause(milliseconds)
  log.info(`Stretchly: pausing breaks for ${milliseconds}`)
  updateTray()
}

function resumeBreaks (notify = true) {
  if (breakPlanner.dndManager.isOnDnd) {
    log.info('Stretchly: not resuming breaks because in Do Not Disturb')
  } else {
    breakPlanner.resume()
    log.info('Stretchly: resuming breaks')
    if (notify) {
      showNotification(i18next.t('main.resumingBreaks'))
    }
  }
  updateTray()
}

function createPreferencesWindow () {
  const electron = require('electron')
  if (preferencesWin) {
    preferencesWin.show()
    return
  }
  const modalPath = path.join('file://', __dirname, '/preferences.html')
  const maxHeight = electron.screen
    .getDisplayNearestPoint(electron.screen.getCursorScreenPoint())
    .workAreaSize.height * 0.9
  preferencesWin = new BrowserWindow({
    autoHideMenuBar: true,
    icon: windowIconPath(),
    width: 600,
    height: 530,
    maxHeight: Math.round(maxHeight),
    x: displaysX(-1, 600),
    y: displaysY(-1, 530),
    backgroundColor: '#EDEDED',
    webPreferences: {
      preload: path.join(__dirname, './preferences.js'),
      enableRemoteModule: true
    }
  })
  preferencesWin.loadURL(modalPath)
  preferencesWin.on('closed', () => {
    preferencesWin = null
  })
  setTimeout(() => {
    preferencesWin.center()
  }, 0)
}

async function updateTray () {
  updateToolTip();
  appIcon.setImage(trayIconPath());
  appIcon.setContextMenu(getTrayMenu());
}

function getTrayMenu () {
  const trayMenu = []

  if (global.shared.isNewVersion) {
    trayMenu.push({
      label: i18next.t('main.downloadLatestVersion'),
      click: function () {
        shell.openExternal('https://hovancik.net/stretchly/downloads')
      }
    }, {
      type: 'separator'
    })
  }

  const StatusMessages = require('./utils/statusMessages')
  const statusMessage = new StatusMessages({
    breakPlanner: breakPlanner,
    settings: settings
  }).trayMessage

  if (statusMessage !== '') {
    const messages = statusMessage.split('\n')
    for (const index in messages) {
      trayMenu.push({
        label: messages[index],
        enabled: false
      })
    }

    trayMenu.push({
      type: 'separator'
    })
  }

  if (!(breakPlanner.isPaused || breakPlanner.dndManager.isOnDnd || breakPlanner.appExclusionsManager.isSchedulerCleared)) {
    let submenu = []
    if (settings.get('microbreak')) {
      submenu = submenu.concat([{
        label: i18next.t('main.toMicrobreak'),
        click: skipToMicrobreak
      }])
    }
    if (settings.get('break')) {
      submenu = submenu.concat([{
        label: i18next.t('main.toBreak'),
        click: skipToBreak
      }])
    }
    if (settings.get('break') || settings.get('microbreak')) {
      trayMenu.push({
        label: i18next.t('main.skipToTheNext'),
        submenu: submenu
      })
    }
  }

  if (breakPlanner.isPaused) {
    trayMenu.push({
      label: i18next.t('main.resume'),
      click: function () {
        resumeBreaks(false)
        updateTray()
      }
    })
  } else if (!(breakPlanner.dndManager.isOnDnd || breakPlanner.appExclusionsManager.isSchedulerCleared)) {
    trayMenu.push({
      label: i18next.t('main.pause'),
      submenu: [
        {
          label: i18next.t('main.forHour'),
          click: function () {
            pauseBreaks(3600 * 1000)
          }
        }, {
          label: i18next.t('main.for2Hours'),
          click: function () {
            pauseBreaks(3600 * 2 * 1000)
          }
        }, {
          label: i18next.t('main.for5Hours'),
          click: function () {
            pauseBreaks(3600 * 5 * 1000)
          }
        }, {
          label: i18next.t('main.untilMorning'),
          click: function () {
            const untilMorning = new UntilMorning(settings).msToSunrise()
            pauseBreaks(untilMorning)
          }
        }, {
          type: 'separator'
        }, {
          label: i18next.t('main.indefinitely'),
          click: function () {
            pauseBreaks(1)
          }
        }
      ]
    })
  }

  if (breakPlanner.scheduler.reference === 'finishMicrobreak' && settings.get('microbreakStrictMode')) {
    // nothing
  } else if (breakPlanner.scheduler.reference === 'finishBreak' && settings.get('breakStrictMode')) {
    // nothing
  } else if (!(breakPlanner.dndManager.isOnDnd || breakPlanner.appExclusionsManager.isSchedulerCleared)) {
    trayMenu.push({
      label: i18next.t('main.resetBreaks'),
      click: resetBreaks
    })
  }

  trayMenu.push({
    type: 'separator'
  }, {
    label: i18next.t('main.preferences'),
    click: function () {
      createPreferencesWindow()
    }
  })

  if (global.shared.isContributor) {
    trayMenu.push({
      label: i18next.t('main.contributorPreferences'),
      click: function () {
        createContributorSettingsWindow()
      }
    }, {
      label: i18next.t('main.syncPreferences'),
      click: function () {
        createSyncPreferencesWindow()
      }
    })
  }

  trayMenu.push({
    type: 'separator'
  }, {
    label: i18next.t('main.quitStretchly'),
    role: 'quit',
    click: function () {
      app.quit()
    }
  })

  return Menu.buildFromTemplate(trayMenu)
}

function updateToolTip () {
  const StatusMessages = require('./utils/statusMessages')
  let trayMessage = i18next.t('main.toolTipHeader')
  const message = new StatusMessages({
    breakPlanner: breakPlanner,
    settings: settings
  }).trayMessage
  if (message !== '') {
    trayMessage += '\n\n' + message
  }
  appIcon.setToolTip(trayMessage)
}

function showNotification (text) {
  processWin.webContents.send('showNotification', {
    text: text,
    silent: settings.get('silentNotifications')
  })
}

function runCommand (event, argv, workingDirectory) {
  const args = argv.slice(app.isPackaged ? 1 : 2)
  const cmd = new Command(args, app.getVersion())

  // if this command is already executed by the second-instance, return early
  if (!cmd.checkInMain()) {
    log.info('Stretchly: command executed in second-instance, dropped in main instance')
    return
  }

  switch (cmd.command) {
    case 'reset':
      log.info('Stretchly: reseting breaks (requested by second instance)')
      resetBreaks()
      break

    case 'mini':
      log.info('Stretchly: skip to Mini Break (requested by second instance)')
      if (cmd.options.title) nextIdea = [cmd.options.title]
      if (!cmd.options.noskip) skipToMicrobreak()
      break

    case 'long':
      log.info('Stretchly: skip to Long Break (requested by second instance)')
      nextIdea = [cmd.options.title ? cmd.options.title : null, cmd.options.text ? cmd.options.text : null]
      if (!cmd.options.noskip) skipToBreak()
      break

    case 'resume':
      log.info('Stretchly: resume Breaks (requested by second instance)')
      if (breakPlanner.isPaused) resumeBreaks(false)
      break

    case 'toggle':
      log.info('Stretchly: toggle Breaks (requested by second instance)')
      if (breakPlanner.isPaused) resumeBreaks(false)
      else pauseBreaks(1)
      break

    case 'pause': {
      log.info('Stretchly: pause Breaks (requested by second instance)')
      const ms = cmd.durationToMs(settings)
      // -1 indicates an invalid value
      if (ms === -1) {
        log.error('Stretchly: error when parsing duration to ms because of unvalid value')
        return
      }
      pauseBreaks(ms)
      break
    }

    default:
      log.error(`Stretchly: Command ${cmd.command} is not supported`)
  }
}

ipcMain.on('postpone-microbreak', function (event, shouldPlaySound) {
  postponeMicrobreak()
})

ipcMain.on('postpone-break', function (event, shouldPlaySound) {
  postponeBreak()
})

ipcMain.on('finish-microbreak', function (event, shouldPlaySound) {
  finishMicrobreak(shouldPlaySound)
})

ipcMain.on('finish-break', function (event, shouldPlaySound) {
  finishBreak(shouldPlaySound)
})

ipcMain.on('save-setting', function (event, key, value) {
  if (key === 'naturalBreaks') {
    breakPlanner.naturalBreaks(value)
  }

  if (key === 'monitorDnd') {
    breakPlanner.doNotDisturb(value)
  }

  if (key === 'language') {
    i18next.changeLanguage(value)
  }

  if (key === 'themeSource') {
    nativeTheme.themeSource = value
  }

  if (key === 'openAtLogin') {
    app.setLoginItemSettings({ openAtLogin: value })
  } else {
    settings.set(key, value)
  }

  updateTray()
})

ipcMain.on('update-tray', function (event) {
  updateTray()
})

ipcMain.on('restore-defaults', (event) => {
  const dialogOpts = {
    type: 'question',
    title: i18next.t('main.restoreDefaults'),
    message: i18next.t('main.warning'),
    buttons: [i18next.t('main.continue'), i18next.t('main.cancel')]
  }
  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) {
      log.info('Stretchly: restoring default settings')
      settings.store = Object.assign(require('./utils/defaultSettings'), { isFirstRun: false })
      initialize(false)
      event.sender.send('renderSettings', settingsToSend())
    }
  })
})

ipcMain.on('send-settings', function (event) {
  event.sender.send('renderSettings', settingsToSend())
})

function settingsToSend () {
  const loginItemSettings = app.getLoginItemSettings()
  const openAtLogin = loginItemSettings.openAtLogin
  return Object.assign({}, settings.store, { openAtLogin: openAtLogin })
}

ipcMain.on('play-sound', function (event, sound) {
  processWin.webContents.send('playSound', sound, settings.get('volume'))
})

ipcMain.on('show-debug', function (event) {
  const reference = breakPlanner.scheduler.reference
  const timeleft = Utils.formatTimeRemaining(breakPlanner.scheduler.timeLeft)
  const breaknumber = breakPlanner.breakNumber
  const postponesnumber = breakPlanner.postponesNumber
  const doNotDisturb = breakPlanner.dndManager.isOnDnd
  const settingsFile = settings.path
  const logsFile = log.transports.file.getFile().path
  event.sender.send('debugInfo', reference, timeleft,
    breaknumber, postponesnumber, settingsFile, logsFile, doNotDisturb)
})

ipcMain.on('open-preferences', function (event) {
  createPreferencesWindow()
})

ipcMain.on('set-contributor', function (event) {
  const dir = app.getPath('userData')
  const contributorStampFile = `${dir}/stamp`
  const { DateTime } = require('luxon')
  require('fs').writeFile(contributorStampFile, DateTime.now().toString(), () => {})
  global.shared.isContributor = true
  log.info('Stretchly: Logged in. Thanks for your contributions!')
  if (preferencesWin) {
    preferencesWin.send('enableContributorPreferences')
  }
  updateTray()
})

ipcMain.on('open-contributor-preferences', function (event) {
  createContributorSettingsWindow()
})

ipcMain.on('open-contributor-auth', function (event, provider) {
  if (myStretchlyWindow) {
    myStretchlyWindow.show()
    return
  }
  const myStretchlyUrl = `https://my.stretchly.net/app/v1?provider=${provider}`
  myStretchlyWindow = new BrowserWindow({
    autoHideMenuBar: true,
    width: 1000,
    height: 700,
    icon: windowIconPath(),
    x: displaysX(),
    y: displaysY(),
    backgroundColor: 'whitesmoke',
    webPreferences: {
      preload: path.resolve(__dirname, './electron-bridge.js'),
      enableRemoteModule: true
    }
  })
  myStretchlyWindow.loadURL(myStretchlyUrl)
  if (myStretchlyWindow) {
    myStretchlyWindow.on('closed', () => {
      myStretchlyWindow = null
    })
  }
  setTimeout(() => {
    myStretchlyWindow.center()
  }, 0)
})

ipcMain.on('open-sync-preferences', function (event) {
  createSyncPreferencesWindow()
})

ipcMain.handle('current-settings', (event) => {
  return settings.store
})

ipcMain.handle('restore-remote-settings', (event, remoteSettings) => {
  log.info('Stretchly: restoring remote settings')
  settings.store = remoteSettings
  initialize(false)
})

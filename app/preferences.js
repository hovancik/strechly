const { remote, ipcRenderer, shell } = require('electron')
const HtmlTranslate = require('./utils/htmlTranslate')
const VersionChecker = require('./utils/versionChecker')
const { setSameWidths } = require('./utils/sameWidths')
const i18next = remote.require('i18next')

const bounds = remote.getCurrentWindow().getBounds()
const htmlTranslate = new HtmlTranslate(document)
const versionChecker = new VersionChecker()
let eventsAttached = false

window.onload = (event) => {
  ipcRenderer.send('send-settings')
  htmlTranslate.translate()
  setWindowHeight()
  setTimeout(() => { eventsAttached = true }, 500)
}

document.ondragover = event =>
  event.preventDefault()

document.ondrop = event =>
  event.preventDefault()

document.onkeydown = event => {
  if (event.key === 'd' && (event.ctrlKey || event.metaKey)) {
    ipcRenderer.send('show-debug')
  }
}

ipcRenderer.on('debugInfo', (event, reference, timeleft, breaknumber,
  postponesnumber, settingsfile, doNotDisturb) => {
  const debugInfo = document.querySelector('.debug > :first-child')
  if (debugInfo.style.display === 'block') {
    debugInfo.style.display = 'none'
  } else {
    debugInfo.style.display = 'block'
    document.querySelector('#reference').innerHTML = reference
    document.querySelector('#timeleft').innerHTML = timeleft
    document.querySelector('#breakNumber').innerHTML = breaknumber
    document.querySelector('#postponesNumber').innerHTML = postponesnumber
    document.querySelector('#settingsfile').innerHTML = settingsfile
    document.querySelector('#donotdisturb').innerHTML = doNotDisturb
    document.querySelector('#node').innerHTML = process.versions.node
    document.querySelector('#chrome').innerHTML = process.versions.chrome
    document.querySelector('#electron').innerHTML = process.versions.electron
  }
  setWindowHeight()
})

ipcRenderer.on('enableContributorPreferences', () => {
  showContributorPreferencesButton()
})

const showContributorPreferencesButton = () => {
  document.querySelector('.contributor').classList.remove('hidden')
  document.querySelectorAll('.become').forEach((item) => {
    item.classList.add('hidden')
  })
  document.querySelectorAll('.authenticate').forEach((item) => {
    item.classList.add('hidden')
  })
  setWindowHeight()
}

if (remote.getGlobal('shared').isContributor) {
  showContributorPreferencesButton()
}

document.querySelector('[name="contributorPreferences"]').onclick = (event) => {
  event.preventDefault()
  ipcRenderer.send('open-contributor-preferences')
}

// TODO refactor out?
const copyToClipBoard = (str) => {
  const el = document.createElement('textarea')
  el.value = str
  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
}

document.querySelector('.debug button').onclick = (event) => {
  event.preventDefault()
  const toCopy = document.querySelector('#to-copy')
  copyToClipBoard(toCopy.textContent)
  const copiedEl = document.createElement('span')
  copiedEl.innerHTML = ' copied!'
  event.target.parentNode.appendChild(copiedEl)
  setTimeout(() => copiedEl.remove(), 1275)
}

document.querySelectorAll('.navigation a').forEach(element => {
  element.onclick = event => {
    event.preventDefault()
    event.target.closest('.navigation').childNodes.forEach(link => {
      if (link.classList) {
        link.classList.remove('active')
      }
    })
    event.target.closest('a').classList.add('active')

    document.querySelectorAll('body > div').forEach(section => {
      const toBeDisplayed =
        document.querySelector(`.${event.target.closest('[data-section]').getAttribute('data-section')}`)
      if (section !== toBeDisplayed) {
        section.classList.add('hidden')
      }
      toBeDisplayed.classList.remove('hidden')
    })

    setSameWidths()
    setWindowHeight()
  }
})

ipcRenderer.on('renderSettings', (event, settings) => {
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    const isNegative = checkbox.classList.contains('negative')
    checkbox.checked = isNegative ? !settings[checkbox.value] : settings[checkbox.value]
    if (!eventsAttached) {
      checkbox.onchange = (event) =>
        ipcRenderer.send('save-setting', checkbox.value,
          isNegative ? !checkbox.checked : checkbox.checked)
    }
  })

  document.querySelectorAll('input[type="radio"]').forEach(radio => {
    let value
    switch (radio.value) {
      case 'true':
        value = true
        break
      case 'false':
        value = false
        break
      default:
        value = radio.value
    }
    radio.checked = settings[radio.name] === value
    if (!eventsAttached) {
      radio.onchange = (event) => {
        ipcRenderer.send('save-setting', radio.name, value)
      }
    }
  })

  document.querySelector('#language').value = settings.language
  if (!eventsAttached) {
    document.querySelector('#language').onchange = (event) => {
      ipcRenderer.send('save-setting', 'language', event.target.value)
      htmlTranslate.translate()
      setWindowHeight()
    }
  }

  document.querySelectorAll('input[type="range"]').forEach(range => {
    const divisor = range.dataset.divisor
    range.value = settings[range.name] / divisor
    range.closest('div').querySelector('output').innerHTML = range.value
    document.querySelector('#longBreakEvery').closest('div').querySelector('output').innerHTML = realBreakInterval()
    if (!eventsAttached) {
      range.onchange = event => {
        range.closest('div').querySelector('output').innerHTML = range.value
        document.querySelector('#longBreakEvery').closest('div').querySelector('output').innerHTML = realBreakInterval()
        ipcRenderer.send('save-setting', range.name, range.value * divisor)
      }
      range.oninput = event => {
        range.closest('div').querySelector('output').innerHTML = range.value
        document.querySelector('#longBreakEvery').closest('div').querySelector('output').innerHTML = realBreakInterval()
      }
    }
  })

  document.querySelectorAll('.sounds img').forEach(preview => {
    if (!eventsAttached) {
      preview.onclick = (event) =>
        ipcRenderer.send('play-sound', preview.closest('div').querySelector('input').value)
    }
  })

  htmlTranslate.translate()
  setWindowHeight()
})

document.querySelectorAll('.enabletype').forEach((element) => {
  element.onclick = (event) => {
    const enabletypeChecked = document.querySelectorAll('.enabletype:checked')
    if (enabletypeChecked.length === 0) {
      element.checked = true
      ipcRenderer.send('save-setting', element.value, element.checked)
      window.alert(i18next.t('settings.cantDisableBoth'))
    }
  }
})

document.querySelector('.settings > div > button').onclick = (event) => {
  ipcRenderer.send('restore-defaults')
}

document.querySelectorAll('.about a').forEach((item) => {
  item.onclick = (event) => {
    event.preventDefault()
    if (event.target.classList.contains('file')) {
      shell.openItem(event.target.innerHTML)
    } else {
      shell.openExternal(event.target.href)
    }
  }
})

document.querySelector('[name="becomePatron"]').onclick = () => {
  shell.openExternal('https://patreon.com/hovancik')
}

document.querySelector('[name="alreadyContributor"]').onclick = () => {
  document.querySelectorAll('.become').forEach((item) => {
    item.classList.add('hidden')
  })
  document.querySelectorAll('.authenticate').forEach((item) => {
    item.classList.remove('hidden')
  })
  setWindowHeight()
}

document.querySelectorAll('.authenticate a').forEach((button) => {
  button.onclick = (event) => {
    event.preventDefault()
    ipcRenderer.send('open-contributor-auth', button.dataset.provider)
  }
})

document.querySelector('.version').innerHTML = remote.app.getVersion()
versionChecker.latest()
  .then(version => {
    document.querySelector('.latestVersion').innerHTML = version.replace('v', '')
  })
  .catch(exception => {
    console.error(exception)
    document.querySelector('.latestVersion').innerHTML = 'N/A'
  })

function setWindowHeight () {
  const classes = document.querySelector('body').classList
  const height = document.querySelector('body').scrollHeight
  if (classes.contains('darwin')) {
    remote.getCurrentWindow().setSize(bounds.width, height + 22)
  } else if (classes.contains('win32')) {
    remote.getCurrentWindow().setSize(bounds.width, height + 40)
  }
  // linux is broken ;/
}

function realBreakInterval () {
  const microbreakInterval = document.querySelector('#miniBreakEvery').value * 1
  const breakInterval = document.querySelector('#longBreakEvery').value * 1
  return microbreakInterval * (breakInterval + 1)
}

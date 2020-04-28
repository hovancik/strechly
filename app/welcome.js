const { remote, ipcRenderer, shell } = require('electron')
const HtmlTranslate = require('./utils/htmlTranslate')
const { setSameWidths } = require('./utils/sameWidths')

const htmlTranslate = new HtmlTranslate(document)
let eventsAttached = false

window.onload = (event) => {
  ipcRenderer.send('send-settings')
  htmlTranslate.translate()
  setTimeout(() => { eventsAttached = true }, 500)
}

document.ondragover = event =>
  event.preventDefault()

document.ondrop = event =>
  event.preventDefault()

ipcRenderer.on('renderSettings', (event, settings) => {
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
        htmlTranslate.translate()
      }
    }
  })
  setSameWidths()
})

document.querySelectorAll('button').forEach(button => {
  if (!eventsAttached) {
    button.onclick = () => {
      ipcRenderer.send('save-setting', 'isFirstRun', false)
      switch (button.getAttribute('data-location')) {
        case 'tutorial':
          shell.openExternal('https://hovancik.net/stretchly/features')
          break
        case 'preferences':
          ipcRenderer.send('open-preferences')
          break
        default:
          break
      }
      remote.getCurrentWindow().close()
    }
  }
})

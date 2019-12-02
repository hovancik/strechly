const { ipcRenderer } = require('electron')
const HtmlTranslate = require('./utils/htmlTranslate')

document.addEventListener('DOMContentLoaded', event => {
  new HtmlTranslate(document).translate()
})
let eventsAttached = false
ipcRenderer.send('send-settings')

document.addEventListener('dragover', event => event.preventDefault())
document.addEventListener('drop', event => event.preventDefault())

ipcRenderer.on('renderSettings', (event, data) => {
  const colorElements = document.getElementsByClassName('color')
  for (var i = 0; i < colorElements.length; i++) {
    const element = colorElements[i]
    const color = element.dataset.color
    element.style.background = color
    if (!eventsAttached) {
      element.addEventListener('click', function (e) {
        ipcRenderer.send('save-setting', 'mainColor', color)
        document.body.style.background = color
      })
    }
    document.body.style.background = data.mainColor
  }

  const audioVolumeElement = document.querySelector('input')
  audioVolumeElement.value = data.volume * 100
  if (!eventsAttached) {
    audioVolumeElement.addEventListener('change', debounce((e) => {
      ipcRenderer.send('save-setting', 'volume', audioVolumeElement.value / 100)
    }, 500))
  }

  const audioElements = document.getElementsByClassName('audio')
  for (var y = 0; y < audioElements.length; y++) {
    const audioElement = audioElements[y]
    const audio = audioElement.dataset.audio
    if (audio === data.audio) {
      audioElement.style.background = '#777'
    } else {
      audioElement.style.background = '#e2e2e2'
    }
    if (!eventsAttached) {
      audioElement.addEventListener('click', function (e) {
        ipcRenderer.send('play-sound', audio)
        ipcRenderer.send('save-setting', 'audio', audio)
      })
    }
  }

  eventsAttached = true
})

document.getElementById('defaults').addEventListener('click', function (e) {
  ipcRenderer.send('set-default-settings', ['audio', 'mainColor', 'volume'])
})

const debounce = (fn, time) => {
  let timeout
  return function () {
    const functionCall = () => fn.apply(this, arguments)
    clearTimeout(timeout)
    timeout = setTimeout(functionCall, time)
  }
}

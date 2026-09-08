"use strict";

const homeBtn = document.getElementById('home')
if(homeBtn && typeof ICONS !== 'undefined' && typeof ICONS.home === 'string'){
  homeBtn.innerHTML = ICONS.home
  homeBtn.addEventListener('click', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', {key: 'r'}))
  })
}
const searchBtn = document.getElementById('search')
if(searchBtn && typeof ICONS !== 'undefined' && typeof ICONS.search === 'string'){
  searchBtn.innerHTML = ICONS.search
}
const orbitBtn = document.getElementById('orbits')
if(orbitBtn && typeof ICONS !== 'undefined' && typeof ICONS.orbit === 'string'){
  orbitBtn.innerHTML = ICONS.orbit
  orbitBtn.setAttribute('aria-pressed', 'true')
  orbitBtn.addEventListener('click', () => {
    const show = window.SHOW_ORBITS === false
    window.SHOW_ORBITS = show
    orbitBtn.setAttribute('aria-pressed', String(show))
    orbitBtn.classList.toggle('off', !show)
  })
}
window.ANIM_RUNNING = true
const githubBtn = document.getElementById('github')
if(githubBtn && typeof ICONS !== 'undefined' && typeof ICONS.github === 'string'){
  githubBtn.innerHTML = ICONS.github
  githubBtn.addEventListener('click', () => {
    window.open('https://github.com/Miroku-devel/sideralis', '_blank', 'noopener')
  })
}
const ipanelCloseBtn = document.getElementById('ipanel-close')
if(ipanelCloseBtn && typeof ICONS !== 'undefined' && typeof ICONS.chevronup === 'string'){
  ipanelCloseBtn.innerHTML = ICONS.chevronup
}
const fsBtn = document.getElementById('fullscreen')
if(fsBtn && typeof ICONS !== 'undefined' && typeof ICONS.fullscreen === 'string'){
  fsBtn.innerHTML = ICONS.fullscreen
  const fsActive = () => !!(document.fullscreenElement || document.webkitFullscreenElement)
  const renderFs = () => {
    const active = fsActive()
    fsBtn.setAttribute('aria-pressed', String(active))
    fsBtn.classList.toggle('off', active)
  }
  if(document.fullscreenEnabled === false && document.webkitFullscreenEnabled === false){
    fsBtn.disabled = true
  } else {
    fsBtn.addEventListener('click', () => {
      try{
        if(fsActive()){
          if(document.exitFullscreen) document.exitFullscreen()
          else if(document.webkitExitFullscreen) document.webkitExitFullscreen()
        } else {
          const el = document.documentElement
          if(el.requestFullscreen) el.requestFullscreen()
          else if(el.webkitRequestFullscreen) el.webkitRequestFullscreen()
        }
      }catch(e){}
    })
    document.addEventListener('fullscreenchange', renderFs)
    document.addEventListener('webkitfullscreenchange', renderFs)
  }
  renderFs()
}
const infoBtn = document.getElementById('info')
if(infoBtn && typeof ICONS !== 'undefined' && typeof ICONS.info === 'string'){
  infoBtn.innerHTML = ICONS.info
  infoBtn.disabled = true
  infoBtn.addEventListener('click', () => {
    if(typeof window.DSS_SEARCH_CLOSE === 'function') window.DSS_SEARCH_CLOSE()
    if(typeof window.DSS_INFO === 'function') window.DSS_INFO()
  })
}
const speedBtn = document.getElementById('speed')
if(speedBtn && typeof ICONS !== 'undefined' && typeof ICONS.fastforward === 'string'){
  if(typeof window.ANIM_FAST === 'undefined') window.ANIM_FAST = false
  speedBtn.innerHTML = ICONS.fastforward
  const renderSpeed = () => {
    const fast = window.ANIM_FAST === true
    speedBtn.setAttribute('aria-pressed', String(fast))
    speedBtn.classList.toggle('off', !fast)
  }
  renderSpeed()
  speedBtn.addEventListener('click', () => {
    const fast = window.ANIM_FAST !== true
    window.ANIM_FAST = fast
    renderSpeed()
  })
}

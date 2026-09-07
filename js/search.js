"use strict";

const searchButton = document.getElementById('search')
const spanelEl = document.getElementById('spanel')
const spanelClose = document.getElementById('spanel-close')
const spInput = document.getElementById('search-input')
const spResults = document.getElementById('search-results')
const spanelFootEl = document.getElementById('spanel-foot')
if(searchButton && spanelEl && spInput && spResults){
  if(spanelClose && typeof ICONS !== 'undefined' && typeof ICONS.chevronup === 'string'){
    spanelClose.innerHTML = ICONS.chevronup
  }
  function closeSearch(){
    spanelEl.classList.remove('open')
    spanelEl.setAttribute('aria-hidden', 'true')
  }
  function openSearch(){
    if(typeof window.DSS_INFO_CLOSE === 'function') window.DSS_INFO_CLOSE()
    else {
      const ip = document.getElementById('ipanel')
      if(ip) ip.classList.remove('open')
    }
    spInput.value = ''
    spResults.innerHTML = ''
    spanelEl.setAttribute('aria-hidden', 'false')
    spanelEl.classList.add('open')
    setTimeout(() => spInput.focus(), 60)
  }
  window.DSS_SEARCH_OPEN = openSearch
  window.DSS_SEARCH_CLOSE = closeSearch
  function doSearch(){
    const q = spInput.value.toLowerCase().trim()
    spResults.innerHTML = ''
    if(!q) return
    const all = (typeof window.DSS_BODIES === 'object' && window.DSS_BODIES) ? window.DSS_BODIES : []
    const best = []
    for(let i = 0; i < all.length; i++){
      if(best.length >= 12) break
      const b = all[i]
      const name = String(b.englishName || b.name || b.id || '')
      const id = String(b.id || '')
      if(name.toLowerCase().indexOf(q) !== -1 || id.toLowerCase().indexOf(q) !== -1){
        best.push({i: i, name: name})
      }
    }
    for(let k = 0; k < best.length; k++){
      const m = best[k]
      const div = document.createElement('div')
      div.className = 'search-result-item'
      div.textContent = m.name
      div.addEventListener('click', () => {
        if(typeof window.DSS_ANIMATE === 'function') window.DSS_ANIMATE(m.i)
        closeSearch()
      })
      spResults.appendChild(div)
    }
  }
  searchButton.addEventListener('click', () => {
    if(spanelEl.classList.contains('open')) closeSearch()
    else openSearch()
  })
  spInput.addEventListener('input', doSearch)
  spInput.addEventListener('keydown', (e) => {
    if(e.key === 'Escape'){ e.stopPropagation(); closeSearch(); spInput.blur() }
  })
  if(spanelClose) spanelClose.addEventListener('click', () => { closeSearch(); spInput.blur() })
  if(spanelFootEl) spanelFootEl.addEventListener('click', () => { closeSearch(); spInput.blur() })
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && spanelEl.classList.contains('open')) closeSearch()
  })
}
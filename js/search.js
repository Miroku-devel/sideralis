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
  function normDesSig(s){ return String(s).toLowerCase().replace(/[^a-z0-9]/g, '').replace(/^gj/, 'gl') }
  function desParen(des, nm, qn, bay, spaced){
    if(!des) des = []
    const nl = String(nm).toLowerCase()
    for(let d = 0; d < des.length; d++){
      const c = String(des[d])
      const cn = normDesSig(c)
      if(cn !== '' && qn.indexOf(cn) !== -1 && c.toLowerCase() !== nl) return ' (' + c + ')'
    }
    if(bay && bay.b){
      const full = normDesSig(bay.b + (bay.c || ''))
      const bare = normDesSig(bay.b)
      if((full !== '' && qn.indexOf(full) !== -1) || (bare !== '' && qn.indexOf(bare) !== -1)){
        const runs = qn.match(/\d+/g) || []
        if(bay.b.indexOf('-') !== -1 && bay.f && runs.indexOf(bay.f) !== -1){
          const pp = bay.b.split('-')
          const base = pp[0]
          const bnum = pp[1]
          const txt = spaced ? (bay.f + base + ' ' + bnum + (bay.c || '')) : (bay.f + base + bnum + (bay.c || ''))
          if(txt.toLowerCase() !== nl) return ' (' + txt + ')'
        } else {
          const bp = bay.b.replace(/-/g, '')
          const txt = spaced
            ? (((bay.f && runs.indexOf(bay.f) !== -1) ? bay.f + bp : bp) + (bay.c ? ' ' + bay.c : ''))
            : (((bay.f && runs.indexOf(bay.f) !== -1) ? bay.f : '') + bp + (bay.c || ''))
          if(txt.toLowerCase() !== nl) return ' (' + txt + ')'
        }
      }
    }
    if(bay && !bay.b && bay.f && bay.c){
      const runs = qn.match(/\d+/g) || []
      const cf = normDesSig(bay.c)
      if(runs.indexOf(bay.f) !== -1 && cf !== '' && qn.indexOf(cf) !== -1){
        const txt = spaced ? bay.f + ' ' + bay.c : bay.f + bay.c
        if(txt.toLowerCase() !== nl) return ' (' + txt + ')'
      }
    }
    return ''
  }
  function doSearch(){
    const q = spInput.value.toLowerCase().trim()
    spResults.innerHTML = ''
    if(!q) return
    const all = []
    const bods = (typeof window.DSS_BODIES === 'object' && window.DSS_BODIES) ? window.DSS_BODIES : []
    for(let i = 0; i < bods.length; i++){
      const b = bods[i]
      const name = String(b.englishName || b.name || b.id || '')
      all.push({i: i, name: name, k: (name + ' ' + String(b.id || '')).toLowerCase()})
    }
    const stars = (typeof window.DSS_STARS === 'object' && window.DSS_STARS) ? window.DSS_STARS : []
    for(let s = 0; s < stars.length; s++){
      const st = stars[s]
      all.push({i: st.i, name: st.name, k: st.key ? st.key : st.name.toLowerCase(), des: st.des, bay: st.bay})
    }
    const best = []
    const toks = q.match(/[a-z]+|\d+/g) || []
    const qn = q.replace(/[^a-z0-9]/g, '').replace(/^gj/, 'gl')
    const cands = []
    for(let i = 0; i < all.length; i++){
      const kk = all[i].k
      let ok = toks.length > 0
      for(let t = 0; t < toks.length; t++){ if(kk.indexOf(toks[t]) === -1){ ok = false; break } }
      if(ok) cands.push(all[i])
      if(cands.length >= 50) break
    }
    const byBay = {}
    for(let i = 0; i < cands.length; i++){
      const bb = cands[i].bay
      if(bb && (bb.b || bb.f)){
        const bk = normDesSig((bb.f || '') + (bb.b || '') + (bb.c || ''))
        if(!byBay[bk]) byBay[bk] = []
        byBay[bk].push(i)
      }
    }
    const skip = {}
    for(const bk in byBay){
      const arr = byBay[bk]
      if(arr.length > 1){
        arr.sort((a,b)=>a-b)
        const keep = arr[Math.floor(arr.length/2)]
        for(let j = 0; j < arr.length; j++) if(arr[j] !== keep) skip[arr[j]] = 1
      }
    }
    for(let i = 0; i < cands.length; i++){
      if(skip[i]) continue
      best.push(cands[i])
      if(best.length >= 12) break
    }
    const hm = q.match(/^(?:hip\s*)?(\d{1,7})$/)
    if(hm && typeof window.DSS_BY_HIP === 'function'){
      const found = window.DSS_BY_HIP(parseInt(hm[1], 10))
      if(found && best.every(function(m){ return m.i !== found.i })){ best.unshift(found); if(best.length > 12) best.length = 12 }
    }
    const hdh = q.match(/^hd\s*(\d{1,7})$/)
    if(hdh && typeof window.DSS_BY_HD === 'function'){
      const found = window.DSS_BY_HD(parseInt(hdh[1], 10))
      if(found && best.every(function(m){ return m.i !== found.i })){ best.unshift(found); if(best.length > 12) best.length = 12 }
    }
    const hrh = q.match(/^hr\s*(\d{1,5})$/)
    if(hrh && typeof window.DSS_BY_HR === 'function'){
      const found = window.DSS_BY_HR(parseInt(hrh[1], 10))
      if(found && best.every(function(m){ return m.i !== found.i })){ best.unshift(found); if(best.length > 12) best.length = 12 }
    }
    const fcm = q.match(/^(\d{1,3})\s*([a-z]{3})$/)
    if(fcm && typeof window.DSS_BY_FLAM === 'function'){
      const flam = fcm[1], conCap = fcm[2].charAt(0).toUpperCase() + fcm[2].slice(1).toLowerCase()
      let found = window.DSS_BY_FLAM(flam, conCap)
      if(!found) found = window.DSS_BY_FLAM(flam, fcm[2].toUpperCase())
      if(!found) found = window.DSS_BY_FLAM(flam, fcm[2].toLowerCase())
      if(found && best.every(function(m){ return m.i !== found.i })){ best.unshift(found); if(best.length > 12) best.length = 12 }
    }
    if(typeof window.DSS_BY_BAYER === 'function'){
      const found = window.DSS_BY_BAYER(qn)
      if(found && best.every(function(m){ return m.i !== found.i })){ best.unshift(found); if(best.length > 12) best.length = 12 }
    }
    for(let k = 0; k < best.length; k++){
      const m = best[k]
      const div = document.createElement('div')
      div.className = 'search-result-item'
      div.textContent = m.name + desParen(m.des, m.name, qn, m.bay, /\s/.test(q))
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
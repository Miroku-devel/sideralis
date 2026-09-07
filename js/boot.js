(async () => {
  "use strict";
  
  const bar = document.getElementById('bootbar')
  const boot = document.getElementById('boot')
  const set = (f) => { bar.style.width = (f * 100).toFixed(1) + '%' }
  function showGlError () {
    const wrap = document.createElement('div')
    wrap.className = 'gl-error-wrap'
    wrap.style.cssText = 'position:fixed;inset:0;z-index:99999;'
    wrap.innerHTML =
      '<div class="gl-error-box">' +
        '<h2 class="gl-error-title">WebGL 2 required</h2>' +
        '<p class="gl-error-hint">Try a modern browser like Firefox, Chrome or Safari.</p>' +
      '</div>'
    document.body.appendChild(wrap)
    if (boot) boot.remove()
  }
  const canvas = document.getElementById('c')
  if (!canvas || !canvas.getContext('webgl2')) {
    showGlError()
    return
  }
  function execJS (code) {
    const s = document.createElement('script')
    s.textContent = code
    document.body.appendChild(s)
  }
  function loadSrc (src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script')
      s.src = src
      s.onload = res
      s.onerror = () => rej(new Error('load ' + src))
      document.body.appendChild(s)
    })
  }
  function loadJSList (list, f0, f1) {
    if (window.location.protocol === 'file:') {
      set(f0)
      let chain = Promise.resolve()
      list.forEach((src, idx) => {
        chain = chain.then(() => loadSrc(src)).then(() => {
          set(f0 + (f1 - f0) * (idx + 1) / list.length)
        })
      })
      return chain
    }
    const items = list.map(src => ({ src: src, loaded: 0, total: 0, done: false, text: '' }))
    const upd = () => {
      let L = 0, T = 0
      for (let i = 0; i < items.length; i++) {
        const it = items[i]
        if (it.total > 0) { L += Math.min(it.loaded, it.total); T += it.total }
        else if (it.done) { L += it.loaded; T += it.loaded }
      }
      if (T > 0) set(f0 + (f1 - f0) * L / T)
    }
    return Promise.all(items.map(it => new Promise((res, rej) => {
      const xhr = new XMLHttpRequest()
      xhr.open('GET', it.src, true)
      xhr.responseType = 'text'
      xhr.onprogress = e => {
        it.loaded = e.loaded
        if (e.lengthComputable) it.total = e.total
        upd()
      }
      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 0) {
          it.loaded = xhr.responseText.length
          it.done = true
          if (!it.total) it.total = it.loaded
          it.text = xhr.responseText
          upd()
          res()
        } else rej(new Error('load ' + it.src))
      }
      xhr.onerror = () => rej(new Error('load ' + it.src))
      xhr.send()
    }))).then(() => {
      for (let i = 0; i < items.length; i++) execJS(items[i].text)
    })
  }
  async function b64ToBytes (b64, f0, f1) {
    const total = Math.floor(b64.length * 3 / 4)
    const out = new Uint8Array(total)
    let o = 0
    const CH = 524288
    for (let i = 0; i < b64.length; i += CH) {
      const part = atob(b64.slice(i, i + CH))
      for (let j = 0; j < part.length; j++) out[o++] = part.charCodeAt(j)
      set(f0 + (f1 - f0) * Math.min(o, total) / total)
      await new Promise(r => setTimeout(r, 0))
    }
    return out.subarray(0, o)
  }
  async function decompressBr (comp) {
    try {
      return new Uint8Array(await new Response(
        new Blob([comp]).stream().pipeThrough(new DecompressionStream('br'))
      ).arrayBuffer())
    } catch (e) {
      await loadSrc('js/brotli.js')
      return BrotliDecode(new Int8Array(comp.buffer, comp.byteOffset, comp.length))
    }
  }
  async function loadBr (b64, f0, f1, f2) {
    const comp = await b64ToBytes(b64, f0, f1)
    set(f1 + 0.02)
    const dec = await decompressBr(comp)
    set(f2)
    execJS(new TextDecoder().decode(dec))
  }
  try {
    set(0.02)
    await new Promise(r => setTimeout(r, 30))
    await loadBr(DATA_BR, 0.05, 0.12, 0.16)
    await loadBr(TEXTURES_BR, 0.2, 0.62, 0.8)
    set(0.84)
    await loadSrc('js/icons.js')
    await loadJSList([
      'js/audio.js',
      'js/shaders.js',
      'js/atmosphere.js',
      'js/app.js',
      'js/ui.js',
      'js/search.js',
      'js/sfx.js'
    ], 0.84, 0.98)
    set(0.98)
    requestAnimationFrame(() => {
      set(1)
      boot.classList.add('done')
      setTimeout(() => boot.remove(), 450)
    })
  } catch (e) {
    boot.classList.add('err')
    set(0)
  }
})()

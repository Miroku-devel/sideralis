(async () => {
  "use strict";
  const bar = document.getElementById('bootbar')
  const boot = document.getElementById('boot')
  let lastSet = 0
  const setRaw = (f) => { bar.style.width = (f * 100).toFixed(1) + '%' }
  const set = (f) => {
    f = Math.max(0, Math.min(1, f))
    if (f > lastSet) { lastSet = f; setRaw(f) }
  }
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
  function loadSrcCounted (src) {
    return new Promise((res, rej) => {
      let attempts = 0
      function tryLoad () {
        const s = document.createElement('script')
        s.src = src
        s.onload = res
        s.onerror = () => {
          s.remove()
          if (attempts < 1) { attempts++; tryLoad() }
          else rej(new Error('load ' + src))
        }
        document.body.appendChild(s)
      }
      tryLoad()
    })
  }
  function fetchTracked (url) {
    return new Promise((res, rej) => {
      let retries = 1
      function attempt () {
        const xhr = new XMLHttpRequest()
        xhr.open('GET', url, true)
        xhr.responseType = 'text'
        xhr.onprogress = e => {
          const cb = fetchTracked._cb
          if (typeof cb === 'function') cb(url, e.loaded, e.lengthComputable ? e.total : 0)
        }
        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 0) {
            const cb = fetchTracked._cb
            if (typeof cb === 'function') cb(url, xhr.responseText.length, xhr.responseText.length)
            res(xhr.responseText)
          } else if (retries > 0) { retries--; attempt() }
          else rej(new Error('load ' + url))
        }
        xhr.onerror = () => {
          if (retries > 0) { retries--; attempt() }
          else rej(new Error('load ' + url))
        }
        xhr.send()
      }
      attempt()
    })
  }
  async function loadListBytesReal (list, f0, f1) {
    if (window.location.protocol === 'file:') {
      set(f0)
      for (let idx = 0; idx < list.length; idx++) {
        await loadSrcCounted(list[idx])
        set(f0 + (f1 - f0) * (idx + 1) / list.length)
      }
      return null
    }
    const items = list.map(src => ({ src: src, loaded: 0, total: 0, done: false, text: '' }))
    const upd = () => {
      let L = 0, T = 0
      for (let i = 0; i < items.length; i++) {
        const it = items[i]
        if (it.total > 0) { L += Math.min(it.loaded, it.total); T += it.total }
        else if (it.done) { L += it.loaded; T += it.loaded }
      }
      if (T > 0) set(f0 + (f1 - f0) * 0.9 * L / T)
    }
    fetchTracked._cb = (url, loaded, total) => {
      for (let i = 0; i < items.length; i++) {
        if (items[i].src === url) {
          items[i].loaded = loaded
          if (total > 0) items[i].total = total
          break
        }
      }
      upd()
    }
    try {
      await Promise.all(items.map(it => new Promise((res, rej) => {
        let retries = 1
        function attempt () {
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
            } else if (retries > 0) { retries--; attempt() }
            else rej(new Error('load ' + it.src))
          }
          xhr.onerror = () => {
            if (retries > 0) { retries--; attempt() }
            else rej(new Error('load ' + it.src))
          }
          xhr.send()
        }
        attempt()
      })))
    } finally {
      fetchTracked._cb = null
    }
    const fExec = f0 + (f1 - f0) * 0.9
    for (let i = 0; i < items.length; i++) {
      execJS(items[i].text)
      set(fExec + (f1 - fExec) * (i + 1) / items.length)
    }
  }
  async function b64ToBytesReal (b64, f0, f1) {
    const total = Math.floor(b64.length * 3 / 4)
    const out = new Uint8Array(total)
    let o = 0
    const CH = 524288
    for (let i = 0; i < b64.length; i += CH) {
      const part = atob(b64.slice(i, i + CH))
      for (let j = 0; j < part.length; j++) out[o++] = part.charCodeAt(j)
      set(f0 + (f1 - f0) * Math.min(o, total) / Math.max(total, 1))
      await new Promise(r => setTimeout(r, 0))
    }
    return out.subarray(0, o)
  }
  async function decompressBrReal (comp) {
    if (typeof BrotliDecode === 'function') {
      return BrotliDecode(new Int8Array(comp.buffer, comp.byteOffset, comp.length))
    }
    let hasNative = false
    try { new DecompressionStream('br'); hasNative = true } catch (eN) { hasNative = false }
    if (hasNative) {
      return new Uint8Array(await new Response(
        new Blob([comp]).stream().pipeThrough(new DecompressionStream('br'))
      ).arrayBuffer())
    }
    if (window.location.protocol === 'file:') {
      await loadSrcCounted('js/brotli.js')
      return BrotliDecode(new Int8Array(comp.buffer, comp.byteOffset, comp.length))
    }
    const brotliText = await fetchTracked('js/brotli.js')
    execJS(brotliText)
    return BrotliDecode(new Int8Array(comp.buffer, comp.byteOffset, comp.length))
  }
  async function loadBrReal (b64, f0, f1) {
    const comp = await b64ToBytesReal(b64, f0, f1)
    const dec = await decompressBrReal(comp)
    execJS(new TextDecoder().decode(dec))
    set(f1)
  }
  try {
    set(0)
    if (window.location.protocol === 'file:') {
      await loadListBytesReal(['js/data.js', 'js/textures.js'], 0.0, 0.05)
    } else {
      await loadListBytesReal(['js/data.js', 'js/textures.js'], 0.0, 0.05)
    }
    await loadBrReal(DATA_BR, 0.05, 0.10)
    await loadBrReal(TEXTURES_BR, 0.10, 0.50)
    await loadListBytesReal([
      'js/icons.js',
      'js/audio.js',
      'js/shaders.js',
      'js/atmosphere.js',
      'js/input.js',
      'js/app.js',
      'js/ui.js',
      'js/search.js',
      'js/sfx.js',
      'js/rotate.js'
    ], 0.50, 0.85)
    let lastP = 0.85
    set(0.85)
    for (;;) {
      let ready = false
      let p = 0
      try {
        ready = window.__SIDERALIS_READY === true
        const rp = (typeof window.__SIDERALIS_PROGRESS === 'number' && isFinite(window.__SIDERALIS_PROGRESS)) ? window.__SIDERALIS_PROGRESS : 0
        p = Math.max(0, Math.min(1, rp))
      } catch (eR) {}
      const target = 0.85 + (0.99 - 0.85) * p
      if (target > lastP) {
        lastP = target
        set(lastP)
      }
      if (ready) break
      await new Promise(r => setTimeout(r, 100))
      await new Promise(r => requestAnimationFrame(r))
    }
    await new Promise(r => requestAnimationFrame(r))
    await new Promise(r => requestAnimationFrame(r))
    set(1)
    boot.classList.add('done')
    setTimeout(() => boot.remove(), 450)
  } catch (e) {
    boot.classList.add('err')
    setRaw(0)
  }
})()

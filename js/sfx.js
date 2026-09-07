(() => {
  "use strict";
  
  const SFX = {
    _ctx: null,
    _master: null,
    _bufs: {},
    _bufP: {},
    _src: {},
    _want: {},
    _endCb: {},
    _brOk: null,
    _brP: null,
    _inited: false,
    init(){
      if(SFX._inited) return
      SFX._inited = true
      const resume = () => { if(SFX._ctx && SFX._ctx.state === 'suspended') SFX._ctx.resume() }
      document.addEventListener('click', resume)
      document.addEventListener('touchstart', resume)
      document.addEventListener('keydown', resume)
    },
    _ensureCtx(){
      if(SFX._ctx) return true
      try{
        const AC = window.AudioContext || window.webkitAudioContext
        SFX._ctx = new AC()
        SFX._master = SFX._ctx.createGain()
        SFX._master.gain.value = 1
        SFX._master.connect(SFX._ctx.destination)
        return true
      }catch(e){
        SFX._ctx = null
        return false
      }
    },
    _b64ToBytes(b64){
      const bin = atob(b64)
      const out = new Uint8Array(bin.length)
      for(let i=0;i<bin.length;i++) out[i] = bin.charCodeAt(i)
      return out
    },
    _decompressBr(comp){
      if(SFX._brOk === null){
        try{ new DecompressionStream('br'); SFX._brOk = true }
        catch(e){ SFX._brOk = false }
      }
      if(SFX._brOk){
        const ds = new DecompressionStream('br')
        const w = ds.writable.getWriter()
        w.write(comp)
        w.close()
        return new Response(ds.readable).arrayBuffer().then(ab => new Uint8Array(ab))
      }
      if(!SFX._brP){
        SFX._brP = new Promise((res, rej) => {
          const s = document.createElement('script')
          s.src = 'js/brotli.js'
          s.onload = res
          s.onerror = rej
          document.body.appendChild(s)
        })
      }
      return SFX._brP.then(() => BrotliDecode(comp))
    },
    _decode(name){
      if(SFX._bufs[name]) return Promise.resolve(SFX._bufs[name])
      if(SFX._bufP[name]) return SFX._bufP[name]
      if(typeof AUDIO_BR === 'undefined' || !AUDIO_BR[name]) return Promise.resolve(null)
      SFX._bufP[name] = Promise.resolve()
        .then(() => SFX._b64ToBytes(AUDIO_BR[name]))
        .then(comp => SFX._decompressBr(comp))
        .then(raw => {
          const ab = raw.buffer.slice ? raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) : raw.buffer
          return new Promise(res => {
            try{
              const p = SFX._ctx.decodeAudioData(ab, b => res(b), () => res(null))
              if(p && typeof p.then === 'function') p.then(b => res(b), () => res(null))
            }catch(e){ res(null) }
          })
        })
        .then(buf => {
          if(buf) SFX._bufs[name] = buf
          return buf || null
        })
      return SFX._bufP[name]
    },
    isPlaying(name){
      return !!SFX._src[name]
    },
    play(name, onChange){
      if(!SFX._ensureCtx()) return false
      if(SFX._ctx.state === 'suspended') SFX._ctx.resume()
      SFX.stop(name)
      SFX._want[name] = true
      if(onChange) SFX._endCb[name] = onChange
      SFX._decode(name).then(buf => {
        if(!buf || !SFX._want[name]) return
        if(SFX._src[name]) return
        const source = SFX._ctx.createBufferSource()
        source.buffer = buf
        source.connect(SFX._master)
        source.onended = () => {
          if(SFX._src[name] === source) delete SFX._src[name]
          delete SFX._want[name]
          const cb = SFX._endCb[name]
          delete SFX._endCb[name]
          if(cb) cb(false)
        }
        SFX._src[name] = source
        source.start(0)
      })
      return true
    },
    stop(name){
      delete SFX._want[name]
      const s = SFX._src[name]
      if(s){
        delete SFX._src[name]
        try{ s.stop(0) }catch(e){}
        try{ s.disconnect() }catch(e){}
      }
      if(SFX._endCb[name]){
        const cb = SFX._endCb[name]
        delete SFX._endCb[name]
        if(cb) cb(false)
      }
    },
    stopAll(){
      for(const k in SFX._src) SFX.stop(k)
    },
    toggle(name, onChange){
      if(SFX.isPlaying(name)){
        SFX.stop(name)
        return false
      }
      SFX.play(name, onChange)
      return true
    }
  }
  SFX.init()
  window.SFX = SFX
})()

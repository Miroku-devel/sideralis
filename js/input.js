"use strict";

function initInput(api){
  window.addEventListener('resize', api.resize)
  let dragging = false
  let panning = false
  let zooming = false
  let lastX = 0
  let lastY = 0
  let downX = 0
  let downY = 0
  api.canvas.addEventListener('mousedown', e=>{
    if(e.button===0){ dragging=true; panning=false; zooming=false }
    else if(e.button===1){ dragging=false; panning=false; zooming=true }
    else if(e.button===2 || e.ctrlKey || e.shiftKey){ dragging=false; panning=true; zooming=false }
    lastX=e.clientX; lastY=e.clientY
    downX=e.clientX; downY=e.clientY
    api.animActive=false
    e.preventDefault()
  })
  api.canvas.addEventListener('contextmenu', e=> e.preventDefault())
  window.addEventListener('mouseup', ()=>{ dragging=false; panning=false; zooming=false })
  api.canvas.addEventListener('mousemove', e=>{
    const dx = e.clientX - lastX
    const dy = e.clientY - lastY
    lastX=e.clientX; lastY=e.clientY
    if(dragging){
      api.azimuth += dx * 0.004
      api.elevation += dy * 0.004
      const lim = Math.PI*0.499
      if(api.elevation > lim) api.elevation = lim
      if(api.elevation < -lim) api.elevation = -lim
      api.updateView()
    } else if(zooming){
      const f = Math.exp(dy * 0.008)
      api.distance *= f
      if(api.distance < api.minDist) api.distance = api.minDist
      if(api.distance > 15) api.distance = 15
      api.updateView()
    } else if(panning){
      const eye = [
        api.target[0] + api.distance * Math.cos(api.elevation) * Math.cos(api.azimuth),
        api.target[1] + api.distance * Math.cos(api.elevation) * Math.sin(api.azimuth),
        api.target[2] + api.distance * Math.sin(api.elevation)
      ]
      const fwd = api.normalize([api.target[0]-eye[0], api.target[1]-eye[1], api.target[2]-eye[2]])
      const upW = [0,0,1]
      const right = api.normalize(api.cross(fwd, upW, [0,0,0]))
      const upC = api.cross(right, fwd, [0,0,0])
      const s = api.distance * 0.0011
      api.target[0] += (-right[0]*dx + upC[0]*dy) * s
      api.target[1] += (-right[1]*dx + upC[1]*dy) * s
      api.target[2] += (-right[2]*dx + upC[2]*dy) * s
      api.updateView()
      if(api.focusedIdx >= 0){ api.focusedIdx = -1; api.refreshLabel() }
    }
  })
  api.canvas.addEventListener('wheel', e=>{
    e.preventDefault()
    api.animActive=false
    const factor = Math.exp(-e.deltaY * 0.0011)
    api.distance *= 1 / factor
    if(api.distance < api.minDist) api.distance = api.minDist
    if(api.distance > 15) api.distance = 15
    api.updateView()
  }, {passive:false})
  let pinchDist = 0
  let pinchStartDist = 0
  let lastAngle = 0
  let lastMidY = 0
  let touchSingleOrbit = false
  let tapActive = false
  let tapX = 0
  let tapY = 0
  let tapT = 0
  api.canvas.addEventListener('touchstart', e=>{
    api.animActive=false
    if(e.touches.length===1){ dragging=true; panning=false; lastX=e.touches[0].clientX; lastY=e.touches[0].clientY; touchSingleOrbit = api.focusedIdx >= 0; tapActive=true; tapX=e.touches[0].clientX; tapY=e.touches[0].clientY; tapT=performance.now() }
    else if(e.touches.length===2){
      dragging=false; panning=false
      tapActive=false
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      pinchDist = Math.hypot(dx,dy)
      pinchStartDist = api.distance
      lastAngle = Math.atan2(dy, dx)
      lastMidY = (e.touches[0].clientY + e.touches[1].clientY) * 0.5
    }
  }, {passive:false})
  api.canvas.addEventListener('touchmove', e=>{
    if(e.touches.length===1 && dragging){
      e.preventDefault()
      const dx = e.touches[0].clientX - lastX
      const dy = e.touches[0].clientY - lastY
      lastX=e.touches[0].clientX; lastY=e.touches[0].clientY
      if(tapActive && Math.hypot(e.touches[0].clientX - tapX, e.touches[0].clientY - tapY) > 10) tapActive=false
      if(touchSingleOrbit && api.focusedIdx >= 0){
        api.azimuth += dx * 0.0045
        api.elevation += dy * 0.0045
        const lim = Math.PI*0.499
        if(api.elevation > lim) api.elevation = lim
        if(api.elevation < -lim) api.elevation = -lim
        api.updateView()
      } else {
        const eye = [
          api.target[0] + api.distance * Math.cos(api.elevation) * Math.cos(api.azimuth),
          api.target[1] + api.distance * Math.cos(api.elevation) * Math.sin(api.azimuth),
          api.target[2] + api.distance * Math.sin(api.elevation)
        ]
        const fwd = api.normalize([api.target[0]-eye[0], api.target[1]-eye[1], api.target[2]-eye[2]])
        const upW = [0,0,1]
        const right = api.normalize(api.cross(fwd, upW, [0,0,0]))
        const upC = api.cross(right, fwd, [0,0,0])
        const s = api.distance * 0.00055
        api.target[0] += (-right[0]*dx + upC[0]*dy) * s
        api.target[1] += (-right[1]*dx + upC[1]*dy) * s
        api.target[2] += (-right[2]*dx + upC[2]*dy) * s
        api.updateView()
        if(api.focusedIdx >= 0){ api.focusedIdx = -1; api.refreshLabel() }
      }
    } else if(e.touches.length===2){
      e.preventDefault()
      tapActive=false
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const d = Math.hypot(dx,dy)
      let moved = false
      if(pinchDist>0){
        api.distance = pinchStartDist * pinchDist / d
        if(api.distance < api.minDist) api.distance = api.minDist
        if(api.distance > 15) api.distance = 15
        moved = true
      }
      const angle = Math.atan2(dy, dx)
      let da = angle - lastAngle
      if(da > Math.PI) da -= Math.PI*2
      if(da < -Math.PI) da += Math.PI*2
      if(da !== 0){
        api.azimuth += da
        lastAngle = angle
        moved = true
      }
      const midY = (e.touches[0].clientY + e.touches[1].clientY) * 0.5
      const dmy = midY - lastMidY
      if(dmy !== 0){
        api.elevation += dmy * 0.004
        lastMidY = midY
        const lim = Math.PI*0.499
        if(api.elevation > lim) api.elevation = lim
        if(api.elevation < -lim) api.elevation = -lim
        moved = true
      }
      if(moved) api.updateView()
    }
  }, {passive:false})
  function handleTouchTap(cx, cy){
    const rect = api.canvas.getBoundingClientRect()
    const mx = cx - rect.left
    const my = cy - rect.top
    const li = api.pickLabel(mx, my)
    if(li >= 0){ api.animateTo(li); return }
    const idx = api.pick(mx, my)
    if(idx >= 0) api.animateTo(idx)
    else if(api.focusedIdx >= 0){ api.focusedIdx = -1; api.refreshLabel() }
  }
  api.canvas.addEventListener('touchend', e=>{
    if(e.touches.length===0){
      dragging=false; pinchDist=0
      if(tapActive){
        tapActive=false
        const dt = performance.now() - tapT
        const t = e.changedTouches && e.changedTouches[0]
        if(t && dt < 500 && Math.hypot(t.clientX - tapX, t.clientY - tapY) <= 10) handleTouchTap(t.clientX, t.clientY)
      }
    }
    else if(e.touches.length===1){ dragging=true; panning=false; lastX=e.touches[0].clientX; lastY=e.touches[0].clientY; touchSingleOrbit = api.focusedIdx >= 0; tapActive=false }
  })
  api.canvas.addEventListener('touchcancel', e=>{
    if(e.touches.length===0){ dragging=false; pinchDist=0; tapActive=false }
    else if(e.touches.length===1){ dragging=true; panning=false; lastX=e.touches[0].clientX; lastY=e.touches[0].clientY; touchSingleOrbit = api.focusedIdx >= 0; tapActive=false }
  })
  api.canvas.addEventListener('mousemove', e=>{
    if(dragging || panning || zooming) return
    const rect = api.canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const li = api.pickLabel(mx, my)
    api.hovered = li >= 0 ? li : api.pick(mx, my)
    api.refreshLabel()
  })
  api.canvas.addEventListener('mouseleave', ()=>{ api.hovered=-1; api.refreshLabel() })
  api.canvas.addEventListener('click', e=>{
    const rect = api.canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const dx = Math.abs(mx - downX)
    const dy = Math.abs(my - downY)
    if(dx > 4 || dy > 4) return
    const li = api.pickLabel(mx, my)
    if(li >= 0){ api.animateTo(li); return }
    const idx = api.pick(mx, my)
    if(idx >= 0) api.animateTo(idx)
    else if(api.focusedIdx >= 0){ api.focusedIdx = -1; api.refreshLabel() }
  })
  window.addEventListener('keydown', e=>{
    const t = e.target
    if(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
    if(e.key==='a' || e.key==='A'){
      window.ATMO_ENABLED = window.ATMO_ENABLED === false
    }
    if(e.key==='r' || e.key==='R'){
      api.target=[0,0,0]; api.distance=5.76; api.azimuth=0.85; api.elevation=0.55; api.updateView()
      api.focusedIdx = -1; api.hovered = -1; api.refreshLabel()
    }
    if(e.key==='z' || e.key==='Z'){ api.wireS = !api.wireS }
    if(e.key==='x' || e.key==='X'){ window.SHOW_FPS = window.SHOW_FPS !== true }
  })
}

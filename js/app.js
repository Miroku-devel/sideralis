(() => {
  "use strict";
  
  const canvas = document.getElementById('c')
  const fpsEl = document.getElementById('fps')
  const selEl = document.getElementById('sel')
  const labelsCanvas = document.getElementById('labels')
  const lctx = labelsCanvas ? labelsCanvas.getContext('2d') : null
  const gl = canvas.getContext('webgl2')
  if (!gl) return
  function compile(t, s){
    const sh = gl.createShader(t)
    gl.shaderSource(sh, s)
    gl.compileShader(sh)
    if(!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return null
    return sh
  }
  const vs = compile(gl.VERTEX_SHADER, vsSource)
  const fs = compile(gl.FRAGMENT_SHADER, fsSource)
  const prog = gl.createProgram()
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if(!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
  const vsP = compile(gl.VERTEX_SHADER, vsPoint)
  const fsP = compile(gl.FRAGMENT_SHADER, fsPoint)
  const progP = gl.createProgram()
  gl.attachShader(progP, vsP)
  gl.attachShader(progP, fsP)
  gl.linkProgram(progP)
  if(!gl.getProgramParameter(progP, gl.LINK_STATUS)) return
  const vsL = compile(gl.VERTEX_SHADER, vsLine)
  const fsL = compile(gl.FRAGMENT_SHADER, fsLine)
  const progL = gl.createProgram()
  gl.attachShader(progL, vsL)
  gl.attachShader(progL, fsL)
  gl.linkProgram(progL)
  if(!gl.getProgramParameter(progL, gl.LINK_STATUS)) return
  const vsS = compile(gl.VERTEX_SHADER, vsSph)
  const fsS = compile(gl.FRAGMENT_SHADER, fsSph)
  const progS = gl.createProgram()
  gl.attachShader(progS, vsS)
  gl.attachShader(progS, fsS)
  gl.linkProgram(progS)
  if(!gl.getProgramParameter(progS, gl.LINK_STATUS)) return
  const fsStarSh = compile(gl.FRAGMENT_SHADER, fsStar)
  const progStar = gl.createProgram()
  let starProgOk = false
  if(vs && fsStarSh){
    gl.attachShader(progStar, vs)
    gl.attachShader(progStar, fsStarSh)
    gl.linkProgram(progStar)
    starProgOk = !!gl.getProgramParameter(progStar, gl.LINK_STATUS)
  }
  const vsFx = compile(gl.VERTEX_SHADER, vsFXAA)
  const fsFx = compile(gl.FRAGMENT_SHADER, fsFXAA)
  const progFx = gl.createProgram()
  let fxaaOk = false
  if(vsFx && fsFx){
    gl.attachShader(progFx, vsFx)
    gl.attachShader(progFx, fsFx)
    gl.linkProgram(progFx)
    fxaaOk = !!gl.getProgramParameter(progFx, gl.LINK_STATUS)
  }
  const locTexFx = gl.getUniformLocation(progFx, 'u_tex')
  const locRcpFx = gl.getUniformLocation(progFx, 'u_rcp')
  const vsRing = compile(gl.VERTEX_SHADER, vsRingSource)
  const fsRing = compile(gl.FRAGMENT_SHADER, fsRingSource)
  const progRing = gl.createProgram()
  let ringProgOk = false
  if(vsRing && fsRing){
    gl.attachShader(progRing, vsRing)
    gl.attachShader(progRing, fsRing)
    gl.linkProgram(progRing)
    ringProgOk = !!gl.getProgramParameter(progRing, gl.LINK_STATUS)
  }
  const vsImp = compile(gl.VERTEX_SHADER, vsImpostor)
  const fsImp = compile(gl.FRAGMENT_SHADER, fsImpostor)
  const progImp = gl.createProgram()
  let impProgOk = false
  if(vsImp && fsImp){
    gl.attachShader(progImp, vsImp)
    gl.attachShader(progImp, fsImp)
    gl.linkProgram(progImp)
    impProgOk = !!gl.getProgramParameter(progImp, gl.LINK_STATUS)
  }
  const locPos = gl.getAttribLocation(prog, 'a_pos')
  const locQuad = gl.getAttribLocation(prog, 'a_quad')
  const locRadius = gl.getAttribLocation(prog, 'a_radius')
  const locColor = gl.getAttribLocation(prog, 'a_color')
  const locView = gl.getUniformLocation(prog, 'u_view')
  const locProj = gl.getUniformLocation(prog, 'u_proj')
  const locStarMult = gl.getUniformLocation(prog, 'u_starMult')
  const locRes = gl.getUniformLocation(prog, 'u_resolution')
  const locMinPx = gl.getUniformLocation(prog, 'u_starMinPx')
  const locViewStar = gl.getUniformLocation(progStar, 'u_view')
  const locProjStar = gl.getUniformLocation(progStar, 'u_proj')
  const locTimeStar = gl.getUniformLocation(progStar, 'u_time')
  const locSpeedStar = gl.getUniformLocation(progStar, 'u_starSpeed')
  const locSunSpeedStar = gl.getUniformLocation(progStar, 'u_sunSpeed')
  const locSunFadeStar = gl.getUniformLocation(progStar, 'u_sunFade')
  const locStarMultStar = gl.getUniformLocation(progStar, 'u_starMult')
  const locResStar = gl.getUniformLocation(progStar, 'u_resolution')
  const locMinPxStar = gl.getUniformLocation(progStar, 'u_starMinPx')
  const locPosP = gl.getAttribLocation(progP, 'a_pos')
  const locColorP = gl.getAttribLocation(progP, 'a_color')
  const locRadiusP = gl.getAttribLocation(progP, 'a_radius')
  const locViewP = gl.getUniformLocation(progP, 'u_view')
  const locProjP = gl.getUniformLocation(progP, 'u_proj')
  const locResP = gl.getUniformLocation(progP, 'u_resolution')
  const locTimeP = gl.getUniformLocation(progP, 'u_time')
  const locSpeedP = gl.getUniformLocation(progP, 'u_starSpeed')
  const locStarMultP = gl.getUniformLocation(progP, 'u_starMult')
  const locPosL = gl.getAttribLocation(progL, 'a_pos')
  const locViewL = gl.getUniformLocation(progL, 'u_view')
  const locProjL = gl.getUniformLocation(progL, 'u_proj')
  const locColorL = gl.getUniformLocation(progL, 'u_color')
  const locPosS = gl.getAttribLocation(progS, 'a_pos')
  const locViewS = gl.getUniformLocation(progS, 'u_view')
  const locProjS = gl.getUniformLocation(progS, 'u_proj')
  const locCenterS = gl.getUniformLocation(progS, 'u_center')
  const locRadiusS = gl.getUniformLocation(progS, 'u_radius')
  const locColorS = gl.getUniformLocation(progS, 'u_color')
  const locSunS = gl.getUniformLocation(progS, 'u_sun')
  const locEmitS = gl.getUniformLocation(progS, 'u_emit')
  const locTexS = gl.getUniformLocation(progS, 'u_tex')
  const locUseTexS = gl.getUniformLocation(progS, 'u_useTex')
  const locDir0S = gl.getAttribLocation(progS, 'a_dir0')
  const locAngRing = gl.getAttribLocation(progRing, 'a_ang')
  const locFracRing = gl.getAttribLocation(progRing, 'a_frac')
  const locCenterRing = gl.getUniformLocation(progRing, 'u_center')
  const locE1Ring = gl.getUniformLocation(progRing, 'u_e1')
  const locE2Ring = gl.getUniformLocation(progRing, 'u_e2')
  const locRadiiRing = gl.getUniformLocation(progRing, 'u_radii')
  const locViewRing = gl.getUniformLocation(progRing, 'u_view')
  const locProjRing = gl.getUniformLocation(progRing, 'u_proj')
  const locTexRing = gl.getUniformLocation(progRing, 'u_tex')
  const locSunRing = gl.getUniformLocation(progRing, 'u_sun')
  const locNormRing = gl.getUniformLocation(progRing, 'u_norm')
  const locSradRing = gl.getUniformLocation(progRing, 'u_sradius')
  const locQuadImp = gl.getAttribLocation(progImp, 'a_quad')
  const locCenterImp = gl.getUniformLocation(progImp, 'u_center')
  const locRadiusImp = gl.getUniformLocation(progImp, 'u_radius')
  const locDistImp = gl.getUniformLocation(progImp, 'u_dist')
  const locViewImp = gl.getUniformLocation(progImp, 'u_view')
  const locProjImp = gl.getUniformLocation(progImp, 'u_proj')
  const locTexImp = gl.getUniformLocation(progImp, 'u_tex')
  const locBoostImp = gl.getUniformLocation(progImp, 'u_boost')
  const locCutoutImp = gl.getUniformLocation(progImp, 'u_cutout')
  const locWhiteImp = gl.getUniformLocation(progImp, 'u_white')
  const locTimeImp = gl.getUniformLocation(progImp, 'u_time')
  const locSpeedImp = gl.getUniformLocation(progImp, 'u_starSpeed')
  const locStarMixImp = gl.getUniformLocation(progImp, 'u_starMix')
  const locStarMultImp = gl.getUniformLocation(progImp, 'u_starMult')
  const locResImp = gl.getUniformLocation(progImp, 'u_resolution')
  const bodies = DATA.bodies
  const N = bodies.length
  const AU_KM = 149597870.7
  let maxDist = 0
  for(let i=0;i<N;i++){
    const b = bodies[i]
    let d = 0
    if(b.id !== 'sun' && !b.aroundPlanet){
      let aKm = null, eM = null
      if(typeof b.semimajorAxis_AU === 'number') aKm = b.semimajorAxis_AU * AU_KM
      else if(typeof b.semimajorAxis_km === 'number') aKm = b.semimajorAxis_km
      if(typeof b.eccentricity_precise === 'number') eM = b.eccentricity_precise
      else if(typeof b.eccentricity === 'number') eM = b.eccentricity
      if(aKm > 0 && eM >= 0 && eM < 1) d = aKm * (1 + eM)
      else if(typeof b.aphelion_km === 'number' && b.aphelion_km > 0) d = b.aphelion_km
      else if(typeof b.semimajorAxis_km === 'number' && typeof b.eccentricity === 'number'){
        d = b.semimajorAxis_km * (1 + b.eccentricity)
      } else {
        const x = b.x_km
        const y = b.y_km
        const z = b.z_km
        if(typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') continue
        d = Math.hypot(x, y, z)
      }
    } else {
      const x = b.x_km
      const y = b.y_km
      const z = b.z_km
      if(typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') continue
      d = Math.hypot(x, y, z)
    }
    if(d > maxDist) maxDist = d
  }
  const worldRadius = maxDist * 1.08
  const worldScale = 1.0 / worldRadius
  const posRaw = new Float64Array(N * 3)
  const posData = new Float32Array(N * 3)
  const radData = new Float32Array(N)
  const colData = new Float32Array(N * 3)
  function hashStr(s){
    let h = 0
    for(let i=0;i<s.length;i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
    return h
  }
  function hsv2rgb(h, s, v){
    let c = v * s
    let hp = h * 6
    let x = c * (1 - Math.abs(hp % 2 - 1))
    let r1 = 0, g1 = 0, b1 = 0
    if(hp >= 0 && hp < 1){ r1 = c; g1 = x; b1 = 0 }
    else if(hp < 2){ r1 = x; g1 = c; b1 = 0 }
    else if(hp < 3){ r1 = 0; g1 = c; b1 = x }
    else if(hp < 4){ r1 = 0; g1 = x; b1 = c }
    else if(hp < 5){ r1 = x; g1 = 0; b1 = c }
    else { r1 = c; g1 = 0; b1 = x }
    let m = v - c
    return [r1 + m, g1 + m, b1 + m]
  }
  function getColor(b){
    const id = b.id
    const rKm = b.meanRadius_km
    if(rKm === '' || rKm === undefined || rKm === null || !(parseFloat(rKm) > 0)) return [1.0, 1.0, 1.0]
    if(id === 'sun') return [1.0, 0.92, 0.2]
    if(id === 'mercury') return [0.72, 0.72, 0.74]
    if(id === 'venus') return [0.91, 0.85, 0.62]
    if(id === 'earth') return [0.07, 0.04, 0.56]
    if(id === 'mars') return [0.86, 0.35, 0.18]
    if(id === 'jupiter') return [0.83, 0.65, 0.45]
    if(id === 'saturn') return [0.91, 0.82, 0.55]
    if(id === 'uranus') return [0.55, 0.86, 0.93]
    if(id === 'neptune') return [0.22, 0.38, 0.92]
    if(id === 'pluto') return [0.76, 0.66, 0.58]
    if(id === 'moon') return [0.82, 0.82, 0.82]
    if(id === 'phobos') return [0.58, 0.45, 0.36]
    if(id === 'deimos') return [0.6, 0.5, 0.42]
    const ap = b.aroundPlanet
    if(ap === 'Jupiter') return [0.84, 0.8, 0.75]
    if(ap === 'Saturn') return [0.92, 0.86, 0.74]
    if(ap === 'Uranus') return [0.64, 0.84, 0.85]
    if(ap === 'Neptune') return [0.48, 0.58, 0.92]
    if(ap === 'Mars') return [0.74, 0.67, 0.64]
    if(ap === 'Earth') return [0.7, 0.7, 0.7]
    if(ap === 'Pluto') return [0.66, 0.62, 0.6]
    let h = hashStr(id)
    let hue = (h % 360) / 360
    return hsv2rgb(hue, 0.55, 0.85)
  }
  const ROCKY_TINTS = [
    [0.20, 0.19, 0.18], [0.62, 0.57, 0.48], [0.50, 0.50, 0.52],
    [0.68, 0.67, 0.65], [0.32, 0.32, 0.34], [0.45, 0.34, 0.29],
    [0.60, 0.42, 0.32], [0.55, 0.53, 0.50], [0.48, 0.39, 0.31],
    [0.78, 0.76, 0.72], [0.38, 0.28, 0.24], [0.58, 0.55, 0.49]
  ]
  function rockyTint(id){
    return ROCKY_TINTS[hashStr(id) % ROCKY_TINTS.length]
  }
  const WHITE3 = [1.0, 1.0, 1.0]
  const bodyColorCache = new Array(N).fill(null)
  function bodyColor(i){
    let c = bodyColorCache[i]
    if(!c){ c = getColor(bodies[i]); bodyColorCache[i] = c }
    return c
  }
  function bodyRadiusKm(b){
    let r = b.meanRadius_km
    if(r === '' || r === undefined || r === null) r = 1
    else r = parseFloat(r)
    if(!(r > 0)) r = 1
    if(b.id === 'sun') r = 696340
    return r
  }
  for(let i=0;i<N;i++){
    const b = bodies[i]
    let x = b.x_km
    let y = b.y_km
    let z = b.z_km
    if(typeof x !== 'number') x = 0
    if(typeof y !== 'number') y = 0
    if(typeof z !== 'number') z = 0
    posRaw[i*3] = x * worldScale
    posRaw[i*3+1] = y * worldScale
    posRaw[i*3+2] = z * worldScale
    let r = b.meanRadius_km
    if(r === '' || r === undefined || r === null) r = 1
    else r = parseFloat(r)
    if(!(r > 0)) r = 1
    if(b.id === 'sun') r = 696340
    radData[i] = r * worldScale
    const c = getColor(b)
    colData[i*3] = c[0]
    colData[i*3+1] = c[1]
    colData[i*3+2] = c[2]
  }
  const quadVerts = new Float32Array([-1,-1, 1,-1, -1,1, 1,1])
  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)
  const qbuf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, qbuf)
  gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(locQuad)
  gl.vertexAttribPointer(locQuad, 2, gl.FLOAT, false, 0, 0)
  gl.vertexAttribDivisor(locQuad, 0)
  const pbuf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, pbuf)
  gl.bufferData(gl.ARRAY_BUFFER, posData, gl.DYNAMIC_DRAW)
  gl.enableVertexAttribArray(locPos)
  gl.vertexAttribPointer(locPos, 3, gl.FLOAT, false, 0, 0)
  gl.vertexAttribDivisor(locPos, 1)
  const rbufQ = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, rbufQ)
  gl.bufferData(gl.ARRAY_BUFFER, radData, gl.DYNAMIC_DRAW)
  gl.enableVertexAttribArray(locRadius)
  gl.vertexAttribPointer(locRadius, 1, gl.FLOAT, false, 0, 0)
  gl.vertexAttribDivisor(locRadius, 1)
  const cbuf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, cbuf)
  gl.bufferData(gl.ARRAY_BUFFER, colData, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(locColor)
  gl.vertexAttribPointer(locColor, 3, gl.FLOAT, false, 0, 0)
  gl.vertexAttribDivisor(locColor, 1)
  gl.bindVertexArray(null)
  const vaoP = gl.createVertexArray()
  gl.bindVertexArray(vaoP)
  const pbufP = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, pbufP)
  gl.bufferData(gl.ARRAY_BUFFER, posData, gl.DYNAMIC_DRAW)
  gl.enableVertexAttribArray(locPosP)
  gl.vertexAttribPointer(locPosP, 3, gl.FLOAT, false, 0, 0)
  const cbufP = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, cbufP)
  gl.bufferData(gl.ARRAY_BUFFER, colData, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(locColorP)
  gl.vertexAttribPointer(locColorP, 3, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(locRadiusP)
  gl.bindBuffer(gl.ARRAY_BUFFER, rbufQ)
  gl.vertexAttribPointer(locRadiusP, 1, gl.FLOAT, false, 0, 0)
  gl.bindVertexArray(null)
  const radQuad = new Float32Array(N)
  const vaoImp = gl.createVertexArray()
  gl.bindVertexArray(vaoImp)
  const qbufImp = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, qbufImp)
  gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(locQuadImp)
  gl.vertexAttribPointer(locQuadImp, 2, gl.FLOAT, false, 0, 0)
  gl.bindVertexArray(null)
  const impTexSize = 256
  const impColorTex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, impColorTex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, impTexSize, impTexSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.bindTexture(gl.TEXTURE_2D, null)
  const impFbo = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, impFbo)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, impColorTex, 0)
  const impDepth = gl.createRenderbuffer()
  gl.bindRenderbuffer(gl.RENDERBUFFER, impDepth)
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, impTexSize, impTexSize)
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, impDepth)
  if(gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) impProgOk = false
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  const sceneTex = gl.createTexture()
  const sceneDepth = gl.createRenderbuffer()
  const sceneFbo = gl.createFramebuffer()
  let sceneTexW = 0
  let sceneTexH = 0
  let sceneFbOk = true
  function ensureSceneFB(){
    const w = canvas.width > 0 ? canvas.width : 2
    const h = canvas.height > 0 ? canvas.height : 2
    if(sceneTexW === w && sceneTexH === h) return
    sceneTexW = w
    sceneTexH = h
    gl.bindTexture(gl.TEXTURE_2D, sceneTex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.bindRenderbuffer(gl.RENDERBUFFER, sceneDepth)
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h)
    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFbo)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sceneTex, 0)
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, sceneDepth)
    if(gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE){
      sceneFbOk = false
      fxaaOk = false
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }
  const MU_SUN = 1.32712440018e11
  const orbitalParams = new Array(N).fill(null)
  const orbitMeta = []
  const linePos = []
  const axisBases = []
  const segs = 256
  const SEGMOON = 64
  for(let i=0;i<N;i++){
    const b = bodies[i]
    let cx = 0, cy = 0, cz = 0
    let rx = 0, ry = 0, rz = 0
    let vx = 0, vy = 0, vz = 0
    let rad = 0
    let isHeliocentric = false
    let useEllipse = false
    let a_scaled = 0
    let e_dataset = 0
    let ex = 0, ey = 0, ez = 0
    let bx = 0, by = 0, bz = 0
    let nx = 0, ny = 0, nz = 0
    let parentIdx = -1
    let ux = 0, uy = 0, uz = 0, tx = 0, ty = 0, tz = 0
    if(b.aroundPlanet){
      let parent = null
      for(let j=0;j<N;j++){
        const c = bodies[j]
        if(c.englishName === b.aroundPlanet || c.id === b.aroundPlanet.toLowerCase()){
          parent = c
          parentIdx = j
          break
        }
      }
      if(!parent) continue
      if(typeof parent.x_km !== 'number' || typeof b.x_km !== 'number') continue
      cx = parent.x_km * worldScale
      cy = parent.y_km * worldScale
      cz = parent.z_km * worldScale
      rx = (b.x_km - parent.x_km) * worldScale
      ry = (b.y_km - parent.y_km) * worldScale
      rz = (b.z_km - parent.z_km) * worldScale
      rad = Math.hypot(rx, ry, rz)
      if(!(rad > 0)) continue
      if(typeof b.vx_km_s === 'number' && typeof parent.vx_km_s === 'number'){
        vx = (b.vx_km_s - parent.vx_km_s)
        vy = (b.vy_km_s - parent.vy_km_s)
        vz = (b.vz_km_s - parent.vz_km_s)
      } else {
        vx = -ry
        vy = rx
        vz = 0
      }
    } else if(!b.aroundPlanet && b.id !== 'sun'){
      if(b.id === 'sun') continue
      isHeliocentric = true
      cx = 0; cy = 0; cz = 0
      if(typeof b.x_km !== 'number' || typeof b.vx_km_s !== 'number') continue
      const rxKm = b.x_km, ryKm = b.y_km, rzKm = b.z_km
      const vxKm = b.vx_km_s, vyKm = b.vy_km_s, vzKm = b.vz_km_s
      const rKm = Math.hypot(rxKm, ryKm, rzKm)
      const v2Km = vxKm * vxKm + vyKm * vyKm + vzKm * vzKm
      if(!(rKm > 0) || !(v2Km > 0)) continue
      const hxRaw = ryKm * vzKm - rzKm * vyKm
      const hyRaw = rzKm * vxKm - rxKm * vzKm
      const hzRaw = rxKm * vyKm - ryKm * vxKm
      const hRawL = Math.hypot(hxRaw, hyRaw, hzRaw)
      if(!(hRawL > 0)) continue
      nx = hxRaw / hRawL; ny = hyRaw / hRawL; nz = hzRaw / hRawL
      const invA = 2 / rKm - v2Km / MU_SUN
      if(!(invA > 0)) continue
      const aKmOsc = 1 / invA
      const rHatX = rxKm / rKm, rHatY = ryKm / rKm, rHatZ = rzKm / rKm
      const vxhX = vyKm * hzRaw - vzKm * hyRaw
      const vxhY = vzKm * hxRaw - vxKm * hzRaw
      const vxhZ = vxKm * hyRaw - vyKm * hxRaw
      let evX = vxhX / MU_SUN - rHatX
      let evY = vxhY / MU_SUN - rHatY
      let evZ = vxhZ / MU_SUN - rHatZ
      const eOsc = Math.hypot(evX, evY, evZ)
      if(eOsc >= 1) continue
      if(eOsc > 1e-9){ ex = evX / eOsc; ey = evY / eOsc; ez = evZ / eOsc }
      else { ex = rHatX; ey = rHatY; ez = rHatZ }
      bx = ny * ez - nz * ey
      by = nz * ex - nx * ez
      bz = nx * ey - ny * ex
      const bL = Math.hypot(bx, by, bz)
      if(!(bL > 1e-9)) continue
      bx /= bL; by /= bL; bz /= bL
      useEllipse = true
      a_scaled = aKmOsc * worldScale
      e_dataset = eOsc
    } else continue
    if(isHeliocentric && useEllipse){
      const rLenW = Math.hypot(b.x_km * worldScale, b.y_km * worldScale, b.z_km * worldScale)
      const rHatX0 = b.x_km * worldScale / rLenW
      const rHatY0 = b.y_km * worldScale / rLenW
      const rHatZ0 = b.z_km * worldScale / rLenW
      const nuP = Math.atan2(rHatX0 * bx + rHatY0 * by + rHatZ0 * bz, rHatX0 * ex + rHatY0 * ey + rHatZ0 * ez)
      orbitMeta.push(i)
      for(let s=0;s<segs;s++){
        const nu0 = nuP + s * Math.PI * 2 / segs
        const nu1 = nuP + (s+1) * Math.PI * 2 / segs
        const r0 = a_scaled * (1 - e_dataset*e_dataset) / (1 + e_dataset * Math.cos(nu0))
        const r1 = a_scaled * (1 - e_dataset*e_dataset) / (1 + e_dataset * Math.cos(nu1))
        const c0 = Math.cos(nu0), s0 = Math.sin(nu0)
        const c1 = Math.cos(nu1), s1 = Math.sin(nu1)
        const x0 = cx + ex * r0 * c0 + bx * r0 * s0
        const y0 = cy + ey * r0 * c0 + by * r0 * s0
        const z0 = cz + ez * r0 * c0 + bz * r0 * s0
        const x1 = cx + ex * r1 * c1 + bx * r1 * s1
        const y1 = cy + ey * r1 * c1 + by * r1 * s1
        const z1 = cz + ez * r1 * c1 + bz * r1 * s1
        linePos.push(x0, y0, z0)
        linePos.push(x1, y1, z1)
      }
      axisBases.push({body: b, ex, ey, ez, nx, ny, nz})
    } else {
      orbitMeta.push(i)
      if(isHeliocentric){
        ux = ex; uy = ey; uz = ez
        tx = bx; ty = by; tz = bz
      } else {
        let nxl = ry * vz - rz * vy
        let nyl = rz * vx - rx * vz
        let nzl = rx * vy - ry * vx
        let nll = Math.hypot(nxl, nyl, nzl)
        if(!(nll > 0)){ nxl=0; nyl=0; nzl=1; nll=1 } else { nxl/=nll; nyl/=nll; nzl/=nll }
        let txl = nyl * rz - nzl * ry
        let tyl = nzl * rx - nxl * rz
        let tzl = nxl * ry - nyl * rx
        let tll = Math.hypot(txl, tyl, tzl)
        if(!(tll>0)){ txl=-ry; tyl=rx; tzl=0; tll=Math.hypot(txl,tyl,tzl) }
        txl/=tll; tyl/=tll; tzl/=tll
        tx=txl; ty=tyl; tz=tzl
        ux = rx / rad; uy = ry / rad; uz = rz / rad
      }
      for(let s=0;s<SEGMOON;s++){
        const a0 = s * Math.PI * 2 / SEGMOON
        const a1 = (s+1) * Math.PI * 2 / SEGMOON
        const c0 = Math.cos(a0)
        const s0 = Math.sin(a0)
        const c1 = Math.cos(a1)
        const s1 = Math.sin(a1)
        const x0 = cx + ux * rad * c0 + tx * rad * s0
        const y0 = cy + uy * rad * c0 + ty * rad * s0
        const z0 = cz + uz * rad * c0 + tz * rad * s0
        const x1 = cx + ux * rad * c1 + tx * rad * s1
        const y1 = cy + uy * rad * c1 + ty * rad * s1
        const z1 = cz + uz * rad * c1 + tz * rad * s1
        linePos.push(x0, y0, z0)
        linePos.push(x1, y1, z1)
      }
    }
    if(isHeliocentric && useEllipse){
      const rLenW = Math.hypot(b.x_km * worldScale, b.y_km * worldScale, b.z_km * worldScale)
      const rHatX0 = b.x_km * worldScale / rLenW
      const rHatY0 = b.y_km * worldScale / rLenW
      const rHatZ0 = b.z_km * worldScale / rLenW
      const nuP = Math.atan2(rHatX0 * bx + rHatY0 * by + rHatZ0 * bz, rHatX0 * ex + rHatY0 * ey + rHatZ0 * ez)
      const aKm = a_scaled / worldScale
      const nMag = Math.sqrt(MU_SUN / (aKm * aKm * aKm))
      const E0 = 2 * Math.atan2(Math.sqrt(1 - e_dataset) * Math.sin(nuP / 2), Math.sqrt(1 + e_dataset) * Math.cos(nuP / 2))
      const m0 = E0 - e_dataset * Math.sin(E0)
      orbitalParams[i] = { type: 'planet', cx: 0, cy: 0, cz: 0, a: a_scaled, e: e_dataset, ex, ey, ez, bx, by, bz, m0, n: nMag, pi: i }
    } else if(!isHeliocentric && rad > 0){
      const rKm = rad / worldScale
      let moonN = 0
      if(rKm > 0 && typeof b.vx_km_s === 'number' && typeof parent.vx_km_s === 'number'){
        const hrx = b.x_km - parent.x_km
        const hry = b.y_km - parent.y_km
        const hrz = b.z_km - parent.z_km
        const hx = hry * vz - hrz * vy
        const hy = hrz * vx - hrx * vz
        const hz = hrx * vy - hry * vx
        moonN = Math.hypot(hx, hy, hz) / (rKm * rKm)
      }
      if(!(moonN > 0)) moonN = 2 * Math.PI / (14 * 86400)
      orbitalParams[i] = { type: 'moon', cx: cx, cy: cy, cz: cz, rad, ux, uy, uz, tx, ty, tz, m0: 0, n: moonN, pi: parentIdx }
    }
  }
  const lineRaw = new Float64Array(linePos.length)
  const lineData = new Float32Array(linePos.length)
  const lineOrigin = [0, 0, 0]
  const lineVao = gl.createVertexArray()
  gl.bindVertexArray(lineVao)
  const lbuf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, lbuf)
  gl.bufferData(gl.ARRAY_BUFFER, lineData, gl.DYNAMIC_DRAW)
  gl.enableVertexAttribArray(locPosL)
  gl.vertexAttribPointer(locPosL, 3, gl.FLOAT, false, 0, 0)
  gl.bindVertexArray(null)
  function solveKepler(M, ecc){
    let E = M
    for(let it=0;it<10;it++){
      const dE=(E - ecc*Math.sin(E) - M)/(1 - ecc*Math.cos(E))
      E -= dE
      if(Math.abs(dE)<1e-10) break
    }
    return E
  }
  function updateOrbitLines(){
    let off = 0
    for(let oi=0;oi<orbitMeta.length;oi++){
      const bi = orbitMeta[oi]
      const op = orbitalParams[bi]
      const isMoon = op && op.type === 'moon'
      const segCount = isMoon ? SEGMOON : segs
      if(op && op.type === 'planet'){
        const b = bodies[bi]
        const cx = 0, cy = 0, cz = 0
        const M0 = op.m0 + op.n * orbitalTime
        const E0 = solveKepler(M0, op.e)
        const nu = 2 * Math.atan2(Math.sqrt(1+op.e)*Math.sin(E0/2), Math.sqrt(1-op.e)*Math.cos(E0/2))
        const pe2 = 1 - op.e * op.e
        for(let s=0;s<segCount;s++){
          const nuA = nu + s * Math.PI * 2 / segCount
          const nuB = nu + (s+1) * Math.PI * 2 / segCount
          const cA = Math.cos(nuA), sA = Math.sin(nuA)
          const cB = Math.cos(nuB), sB = Math.sin(nuB)
          const rA = op.a * pe2 / (1 + op.e * cA)
          const rB = op.a * pe2 / (1 + op.e * cB)
          lineRaw[off]   = cx + op.ex*rA*cA + op.bx*rA*sA
          lineRaw[off+1] = cy + op.ey*rA*cA + op.by*rA*sA
          lineRaw[off+2] = cz + op.ez*rA*cA + op.bz*rA*sA
          lineRaw[off+3] = cx + op.ex*rB*cB + op.bx*rB*sB
          lineRaw[off+4] = cy + op.ey*rB*cB + op.by*rB*sB
          lineRaw[off+5] = cz + op.ez*rB*cB + op.bz*rB*sB
          off += 6
        }
      } else if(isMoon){
        const pi = op.pi
        const pcx = posRaw[pi*3], pcy = posRaw[pi*3+1], pcz = posRaw[pi*3+2]
        const angle = op.m0 + op.n * orbitalTime
        for(let s=0;s<segCount;s++){
          const aA = angle + s * Math.PI * 2 / segCount
          const aB = angle + (s+1) * Math.PI * 2 / segCount
          const cA = Math.cos(aA), sA = Math.sin(aA)
          const cB = Math.cos(aB), sB = Math.sin(aB)
          lineRaw[off]   = pcx + (op.ux*cA + op.tx*sA) * op.rad
          lineRaw[off+1] = pcy + (op.uy*cA + op.ty*sA) * op.rad
          lineRaw[off+2] = pcz + (op.uz*cA + op.tz*sA) * op.rad
          lineRaw[off+3] = pcx + (op.ux*cB + op.tx*sB) * op.rad
          lineRaw[off+4] = pcy + (op.uy*cB + op.ty*sB) * op.rad
          lineRaw[off+5] = pcz + (op.uz*cB + op.tz*sB) * op.rad
          off += 6
        }
      } else {
        off += segCount * 6
      }
    }
    for(let li=0;li<lineRaw.length;li+=3){
      lineData[li]   = lineRaw[li]   - lineOrigin[0]
      lineData[li+1] = lineRaw[li+1] - lineOrigin[1]
      lineData[li+2] = lineRaw[li+2] - lineOrigin[2]
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, lbuf)
    gl.bufferData(gl.ARRAY_BUFFER, lineData, gl.DYNAMIC_DRAW)
  }
  function refreshOrigin(){
    for(let pi=0;pi<posRaw.length;pi+=3){
      posData[pi]=posRaw[pi]-lineOrigin[0]
      posData[pi+1]=posRaw[pi+1]-lineOrigin[1]
      posData[pi+2]=posRaw[pi+2]-lineOrigin[2]
    }
    updateOrbitLines()
    for(let ai=0;ai<axisRaw.length;ai+=3){
      axisData[ai]=axisRaw[ai]-lineOrigin[0]
      axisData[ai+1]=axisRaw[ai+1]-lineOrigin[1]
      axisData[ai+2]=axisRaw[ai+2]-lineOrigin[2]
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, pbuf)
    gl.bufferData(gl.ARRAY_BUFFER, posData, gl.DYNAMIC_DRAW)
    gl.bindBuffer(gl.ARRAY_BUFFER, pbufP)
    gl.bufferData(gl.ARRAY_BUFFER, posData, gl.DYNAMIC_DRAW)
    gl.bindBuffer(gl.ARRAY_BUFFER, abuf)
    gl.bufferData(gl.ARRAY_BUFFER, axisData, gl.DYNAMIC_DRAW)
    gl.bindVertexArray(null)
  }
  const axisPos = []
  const axisMeta = []
  for(const ab of axisBases){
    const b = ab.body
    let tiltD = null
    if(typeof b.axialTilt_precise_deg === 'number') tiltD = b.axialTilt_precise_deg
    else if(typeof b.axialTilt_deg === 'number') tiltD = b.axialTilt_deg
    if(typeof tiltD !== 'number') continue
    if(typeof b.x_km !== 'number') continue
    const t = tiltD * Math.PI / 180
    const ct = Math.cos(t), st = Math.sin(t)
    let ax = ct * ab.nx + st * ab.ex
    let ay = ct * ab.ny + st * ab.ey
    let az = ct * ab.nz + st * ab.ez
    const al = Math.hypot(ax, ay, az)
    if(!(al > 0)) continue
    ax /= al; ay /= al; az /= al
    let rKm = b.meanRadius_km
    if(rKm === '' || rKm === undefined || rKm === null) rKm = 1
    else rKm = parseFloat(rKm)
    if(!(rKm > 0)) rKm = 1
    const rW = rKm * worldScale
    const halfW = rW * 4
    const px = b.x_km * worldScale, py = b.y_km * worldScale, pz = b.z_km * worldScale
    axisPos.push(px - ax * halfW, py - ay * halfW, pz - az * halfW)
    axisPos.push(px + ax * halfW, py + ay * halfW, pz + az * halfW)
    axisMeta.push({bodyIdx: bodies.indexOf(b), ax, ay, az, halfW})
  }
  const axisRaw = new Float64Array(axisPos)
  const axisData = new Float32Array(axisRaw.length)
  const axisVao = gl.createVertexArray()
  gl.bindVertexArray(axisVao)
  const abuf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, abuf)
  gl.bufferData(gl.ARRAY_BUFFER, axisData, gl.DYNAMIC_DRAW)
  gl.enableVertexAttribArray(locPosL)
  gl.vertexAttribPointer(locPosL, 3, gl.FLOAT, false, 0, 0)
  gl.bindVertexArray(null)
  let orbitalTime = 0
  const TIME_SCALE = 1.0
  const FAST_MULT = 200000
  const spinRate = new Float64Array(N)
  const spinLast = new Float64Array(N)
  for(let i=0;i<N;i++){
    const rh = bodies[i].sideralRotation_hours
    if(typeof rh === 'number' && isFinite(rh) && rh !== 0) spinRate[i] = 2 * Math.PI / (Math.abs(rh) * 3600)
    else if(bodies[i].id === 'sun') spinRate[i] = 2 * Math.PI / (609.12 * 3600)
    else spinRate[i] = 0
  }
  if(typeof window.ANIM_RUNNING === 'undefined') window.ANIM_RUNNING = true
  if(typeof window.ANIM_FAST === 'undefined') window.ANIM_FAST = false
  let lastFrameTime = performance.now()
      refreshOrigin()
  function updateOrbitalPositions(){
    const now = performance.now()
    const dtRaw = (now - lastFrameTime) / 1000
    lastFrameTime = now
    const dt = dtRaw > 0.05 ? 0.05 : (dtRaw < 0 ? 0 : dtRaw)
    const running = window.ANIM_RUNNING !== false
    const fast = window.ANIM_FAST === true
    const mult = fast ? (typeof window.ANIM_FAST_MULT === 'number' && window.ANIM_FAST_MULT > 0 ? window.ANIM_FAST_MULT : FAST_MULT) : 1
    if(running) orbitalTime += dt * TIME_SCALE * mult
    for(let i = 0; i < N; i++){
      const op = orbitalParams[i]
      if(!op) continue
      if(op.type === 'planet'){
        const M = op.m0 + op.n * orbitalTime
        let E = M
        for(let it = 0; it < 10; it++){
          const dE = (E - op.e * Math.sin(E) - M) / (1 - op.e * Math.cos(E))
          E -= dE
          if(Math.abs(dE) < 1e-10) break
        }
        const cE = Math.cos(E), sE = Math.sin(E)
        const xp = op.a * (cE - op.e)
        const yp = op.a * Math.sqrt(1 - op.e * op.e) * sE
        posRaw[i*3]   = op.ex * xp + op.bx * yp
        posRaw[i*3+1] = op.ey * xp + op.by * yp
        posRaw[i*3+2] = op.ez * xp + op.bz * yp
      } else if(op.type === 'moon'){
        const angle = op.m0 + op.n * orbitalTime
        const cA = Math.cos(angle), sA = Math.sin(angle)
        const dx = op.ux * cA + op.tx * sA
        const dy = op.uy * cA + op.ty * sA
        const dz = op.uz * cA + op.tz * sA
        const pi = op.pi
        posRaw[i*3]   = posRaw[pi*3]   + dx * op.rad
        posRaw[i*3+1] = posRaw[pi*3+1] + dy * op.rad
        posRaw[i*3+2] = posRaw[pi*3+2] + dz * op.rad
      }
    }
    for(let pi = 0; pi < posRaw.length; pi += 3){
      posData[pi]   = posRaw[pi]   - lineOrigin[0]
      posData[pi+1] = posRaw[pi+1] - lineOrigin[1]
      posData[pi+2] = posRaw[pi+2] - lineOrigin[2]
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, pbuf)
    gl.bufferData(gl.ARRAY_BUFFER, posData, gl.DYNAMIC_DRAW)
    gl.bindBuffer(gl.ARRAY_BUFFER, pbufP)
    gl.bufferData(gl.ARRAY_BUFFER, posData, gl.DYNAMIC_DRAW)
  }
  function updateAxisLines(){
    for(let ai=0;ai<axisMeta.length;ai++){
      const m = axisMeta[ai]
      const px = posRaw[m.bodyIdx*3], py = posRaw[m.bodyIdx*3+1], pz = posRaw[m.bodyIdx*3+2]
      axisRaw[ai*6]   = px - m.ax * m.halfW
      axisRaw[ai*6+1] = py - m.ay * m.halfW
      axisRaw[ai*6+2] = pz - m.az * m.halfW
      axisRaw[ai*6+3] = px + m.ax * m.halfW
      axisRaw[ai*6+4] = py + m.ay * m.halfW
      axisRaw[ai*6+5] = pz + m.az * m.halfW
      axisData[ai*6]   = axisRaw[ai*6]   - lineOrigin[0]
      axisData[ai*6+1] = axisRaw[ai*6+1] - lineOrigin[1]
      axisData[ai*6+2] = axisRaw[ai*6+2] - lineOrigin[2]
      axisData[ai*6+3] = axisRaw[ai*6+3] - lineOrigin[0]
      axisData[ai*6+4] = axisRaw[ai*6+4] - lineOrigin[1]
      axisData[ai*6+5] = axisRaw[ai*6+5] - lineOrigin[2]
    }
    if(axisData.length > 0){
      gl.bindBuffer(gl.ARRAY_BUFFER, abuf)
      gl.bufferData(gl.ARRAY_BUFFER, axisData, gl.DYNAMIC_DRAW)
    }
  }
  updateOrbitalPositions()
  const SPH_SEGS = 16
  const sphBaseGrid = []
  for(let cf=0;cf<6;cf++){
    const grid = []
    for(let siy=0;siy<=SPH_SEGS;siy++){
      const svv = siy / SPH_SEGS * 2 - 1
      for(let six=0;six<=SPH_SEGS;six++){
        const suu = six / SPH_SEGS * 2 - 1
        let sqx = 0, sqy = 0, sqz = 0
        if(cf===0){ sqx=1; sqy=suu; sqz=svv }
        else if(cf===1){ sqx=-1; sqy=suu; sqz=svv }
        else if(cf===2){ sqx=suu; sqy=1; sqz=svv }
        else if(cf===3){ sqx=suu; sqy=-1; sqz=svv }
        else if(cf===4){ sqx=suu; sqy=svv; sqz=1 }
        else { sqx=suu; sqy=svv; sqz=-1 }
        const sql = Math.hypot(sqx, sqy, sqz)
        grid.push(sqx/sql, sqy/sql, sqz/sql)
      }
    }
    sphBaseGrid.push(grid)
  }
  function planetBasis(pax, pay, paz, prx, pry, prz, out){
    const d = prx*pax+pry*pay+prz*paz
    let ux = prx-pax*d, uy = pry-pay*d, uz = prz-paz*d
    const ul = Math.hypot(ux, uy, uz) || 1
    ux/=ul; uy/=ul; uz/=ul
    out[0]=ux; out[1]=uy; out[2]=uz
    out[3]=pax; out[4]=pay; out[5]=paz
    out[6]=uy*paz-uz*pay; out[7]=uz*pax-ux*paz; out[8]=ux*pay-uy*pax
  }
  const PLANET_NV = 6 * (SPH_SEGS + 1) * (SPH_SEGS + 1)
  function planetIndexArray(){
    const iArr = []
    const gstride = SPH_SEGS + 1
    for(let cf=0;cf<6;cf++){
      const sbase = cf * gstride * gstride
      for(let siy=0;siy<SPH_SEGS;siy++){
        for(let six=0;six<SPH_SEGS;six++){
          const vA = sbase + siy*gstride+six
          const vB = vA+1
          const vC = vA+gstride
          const vD = vC+1
          iArr.push(vA,vC,vB, vB,vC,vD)
        }
      }
    }
    return iArr
  }
  function planetDirArray(){
    const dArr = []
    for(let cf=0;cf<6;cf++){
      const grid = sphBaseGrid[cf]
      for(let k=0;k<grid.length;k+=3){
        dArr.push(grid[k], grid[k+1], grid[k+2])
      }
    }
    return dArr
  }
  function planetPosFill(pBuf, b){
    let o = 0
    const ux=b[0], uy=b[1], uz=b[2], px=b[3], py=b[4], pz=b[5], vx=b[6], vy=b[7], vz=b[8]
    for(let cf=0;cf<6;cf++){
      const grid = sphBaseGrid[cf]
      for(let k=0;k<grid.length;k+=3){
        const ex = grid[k], ey = grid[k+1], ez = grid[k+2]
        pBuf[o++]=ux*ex+px*ey+vx*ez; pBuf[o++]=uy*ex+py*ey+vy*ez; pBuf[o++]=uz*ex+pz*ey+vz*ez
      }
    }
  }
  function buildPlanetVAO(pax, pay, paz, prx, pry, prz){
    const b = new Float64Array(9)
    planetBasis(pax, pay, paz, prx, pry, prz, b)
    const pBuf = new Float32Array(PLANET_NV * 3)
    planetPosFill(pBuf, b)
    const dBuf = new Float32Array(planetDirArray())
    const iBuf = new Uint32Array(planetIndexArray())
    const vao = gl.createVertexArray()
    gl.bindVertexArray(vao)
    const pb = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, pb)
    gl.bufferData(gl.ARRAY_BUFFER, pBuf, gl.DYNAMIC_DRAW)
    gl.enableVertexAttribArray(locPosS)
    gl.vertexAttribPointer(locPosS, 3, gl.FLOAT, false, 0, 0)
    const db = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, db)
    gl.bufferData(gl.ARRAY_BUFFER, dBuf, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(locDir0S)
    gl.vertexAttribPointer(locDir0S, 3, gl.FLOAT, false, 0, 0)
    const ib = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, iBuf, gl.STATIC_DRAW)
    gl.bindVertexArray(null)
    const frame = new Float32Array([b[0], b[3], b[6], b[1], b[4], b[7], b[2], b[5], b[8]])
    return {vao: vao, count: iBuf.length, frame: frame, pb: pb, pBuf: pBuf, kind: 0}
  }
  function planetVAOUpdate(e, pax, pay, paz, prx, pry, prz){
    const b = new Float64Array(9)
    planetBasis(pax, pay, paz, prx, pry, prz, b)
    planetPosFill(e.pBuf, b)
    gl.bindBuffer(gl.ARRAY_BUFFER, e.pb)
    gl.bufferData(gl.ARRAY_BUFFER, e.pBuf, gl.DYNAMIC_DRAW)
    e.frame[0]=b[0]; e.frame[1]=b[3]; e.frame[2]=b[6]
    e.frame[3]=b[1]; e.frame[4]=b[4]; e.frame[5]=b[7]
    e.frame[6]=b[2]; e.frame[7]=b[5]; e.frame[8]=b[8]
  }
  const PROC_AST = new Set(['phobos','deimos','proteus','nereid','hyperion','phoebe','larissa','janus','himalia','amalthea','galatea','despina','epimetheus','thebe','prometheus','pandora','thalassa','naiad','metis','hydra','helene','nix','atlas','pan','adrastea','kerberos','styx'])
  const SUN_AXIS = [0.122353, -0.031038, 0.992001]
  function procRand(seed){
    let s = seed >>> 0
    return function(){
      s |= 0; s = s + 0x6D2B79F5 | 0
      let t = Math.imul(s ^ s >>> 15, 1 | s)
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
      return ((t ^ t >>> 14) >>> 0) / 4294967296
    }
  }
  function procHash3(ix, iy, iz, seed){
    let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(iz, 1442695041) ^ Math.imul(seed, 974634211)
    h = Math.imul(h ^ h >>> 13, 1274126177)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
  function procVNoise(x, y, z, seed){
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z)
    const xf = x - xi, yf = y - yi, zf = z - zi
    const sx = xf * xf * (3 - 2 * xf), sy = yf * yf * (3 - 2 * yf), sz = zf * zf * (3 - 2 * zf)
    const c000 = procHash3(xi, yi, zi, seed), c100 = procHash3(xi + 1, yi, zi, seed)
    const c010 = procHash3(xi, yi + 1, zi, seed), c110 = procHash3(xi + 1, yi + 1, zi, seed)
    const c001 = procHash3(xi, yi, zi + 1, seed), c101 = procHash3(xi + 1, yi, zi + 1, seed)
    const c011 = procHash3(xi, yi + 1, zi + 1, seed), c111 = procHash3(xi + 1, yi + 1, zi + 1, seed)
    const x00 = c000 + sx * (c100 - c000), x10 = c010 + sx * (c110 - c010)
    const x01 = c001 + sx * (c101 - c001), x11 = c011 + sx * (c111 - c011)
    const y0 = x00 + sy * (x10 - x00), y1 = x01 + sy * (x11 - x01)
    return y0 + sz * (y1 - y0)
  }
  function procFbm(x, y, z, seed){
    let a = 0.5, f = 1.0, s = 0.0, n = 0.0
    for(let o = 0; o < 4; o++){
      s += a * procVNoise(x * f, y * f, z * f, seed + o * 101)
      n += a
      a *= 0.5
      f *= 2.03
    }
    return s / n
  }
  function procStaticShape(seed, qArr){
    const rnd = procRand(seed || 1)
    const elong = 1.00 + rnd() * 0.33
    const mid = 0.85 + rnd() * 0.25
    const flat = 0.72 + rnd() * 0.28
    const axes = [elong, mid, flat]
    for(let si = axes.length - 1; si > 0; si--){
      const sj = Math.floor(rnd() * (si + 1))
      const st = axes[si]; axes[si] = axes[sj]; axes[sj] = st
    }
    const nCr = 3 + Math.floor(rnd() * 7)
    const crx = [], cry = [], crz = [], crr = [], crd = []
    for(let ci = 0; ci < nCr; ci++){
      let cx = rnd() * 2 - 1, cy = rnd() * 2 - 1, cz = rnd() * 2 - 1
      const cl = Math.hypot(cx, cy, cz) || 1
      crx.push(cx / cl); cry.push(cy / cl); crz.push(cz / cl)
      crr.push(0.15 + rnd() * 0.40); crd.push(0.05 + rnd() * 0.20)
    }
    const ox = rnd() * 10, oy = rnd() * 10, oz = rnd() * 10
    const sd = seed || 1
    let o = 0
    for(let cf=0;cf<6;cf++){
      const grid = sphBaseGrid[cf]
      for(let k=0;k<grid.length;k+=3){
        const ex = grid[k], ey = grid[k+1], ez = grid[k+2]
        let h = (procFbm(ex * 2.3 + ox, ey * 2.3 + oy, ez * 2.3 + oz, sd) - 0.5) * 0.30
        for(let ci = 0; ci < nCr; ci++){
          const cosang = ex * crx[ci] + ey * cry[ci] + ez * crz[ci]
          const cosrho = Math.cos(crr[ci])
          if(cosang > cosrho){
            const t = (cosang - cosrho) / (1 - cosrho)
            const bowl = t * t * (3 - 2 * t)
            h -= crd[ci] * bowl
            const rim = Math.exp(-Math.pow((1 - t) * 4.0, 2))
            h += crd[ci] * 0.35 * rim
          }
        }
        let r = 1 + h
        if(r < 0.72) r = 0.72
        else if(r > 1.35) r = 1.35
        qArr[o++]=ex * axes[0] * r; qArr[o++]=ey * axes[1] * r; qArr[o++]=ez * axes[2] * r
      }
    }
  }
  function procNormalsAccum(pBuf, idx, nxA){
    nxA.fill(0)
    for(let ti = 0; ti < idx.length; ti += 3){
      const a3 = idx[ti] * 3, b3 = idx[ti+1] * 3, c3 = idx[ti+2] * 3
      const abx = pBuf[b3]-pBuf[a3], aby = pBuf[b3+1]-pBuf[a3+1], abz = pBuf[b3+2]-pBuf[a3+2]
      const acx = pBuf[c3]-pBuf[a3], acy = pBuf[c3+1]-pBuf[a3+1], acz = pBuf[c3+2]-pBuf[a3+2]
      const fnx = aby*acz-abz*acy, fny = abz*acx-abx*acz, fnz = abx*acy-aby*acx
      nxA[a3]+=fnx; nxA[a3+1]+=fny; nxA[a3+2]+=fnz
      nxA[b3]+=fnx; nxA[b3+1]+=fny; nxA[b3+2]+=fnz
      nxA[c3]+=fnx; nxA[c3+1]+=fny; nxA[c3+2]+=fnz
    }
  }
  function procWeldGroups(pBuf, nv){
    const weld = new Map()
    for(let vi = 0; vi < nv; vi++){
      const key = Math.round(pBuf[vi*3]*1e4)+','+Math.round(pBuf[vi*3+1]*1e4)+','+Math.round(pBuf[vi*3+2]*1e4)
      let e = weld.get(key)
      if(!e){ e = []; weld.set(key, e) }
      e.push(vi)
    }
    const groups = []
    weld.forEach(function(ids){ groups.push(ids) })
    return groups
  }
  function procNormalsAverage(nxA, groups, nBuf){
    for(let gi = 0; gi < groups.length; gi++){
      const ids = groups[gi]
      let sx = 0, sy = 0, sz = 0
      for(let qi = 0; qi < ids.length; qi++){
        sx += nxA[ids[qi]*3]; sy += nxA[ids[qi]*3+1]; sz += nxA[ids[qi]*3+2]
      }
      const l = Math.hypot(sx, sy, sz) || 1
      const wx = sx / l, wy = sy / l, wz = sz / l
      for(let qi = 0; qi < ids.length; qi++){
        nBuf[ids[qi]*3] = wx; nBuf[ids[qi]*3+1] = wy; nBuf[ids[qi]*3+2] = wz
      }
    }
  }
  function procPosFill(pBuf, qArr, b){
    const ux=b[0], uy=b[1], uz=b[2], px=b[3], py=b[4], pz=b[5], vx=b[6], vy=b[7], vz=b[8]
    for(let o=0;o<qArr.length;o+=3){
      const qx = qArr[o], qy = qArr[o+1], qz = qArr[o+2]
      pBuf[o]=ux*qx+px*qy+vx*qz; pBuf[o+1]=uy*qx+py*qy+vy*qz; pBuf[o+2]=uz*qx+pz*qy+vz*qz
    }
  }
  function buildProceduralVAO(pax, pay, paz, prx, pry, prz, seed){
    const b = new Float64Array(9)
    planetBasis(pax, pay, paz, prx, pry, prz, b)
    const nv = PLANET_NV
    const qArr = new Float64Array(nv * 3)
    procStaticShape(seed, qArr)
    const pBuf = new Float32Array(nv * 3)
    procPosFill(pBuf, qArr, b)
    const dBuf = new Float32Array(planetDirArray())
    const idx = new Uint32Array(planetIndexArray())
    const nxA = new Float64Array(nv * 3)
    procNormalsAccum(pBuf, idx, nxA)
    const groups = procWeldGroups(pBuf, nv)
    const nBuf = new Float32Array(nv * 3)
    procNormalsAverage(nxA, groups, nBuf)
    const vao = gl.createVertexArray()
    gl.bindVertexArray(vao)
    const pb = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, pb)
    gl.bufferData(gl.ARRAY_BUFFER, pBuf, gl.DYNAMIC_DRAW)
    gl.enableVertexAttribArray(locPosS)
    gl.vertexAttribPointer(locPosS, 3, gl.FLOAT, false, 0, 0)
    const db = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, db)
    gl.bufferData(gl.ARRAY_BUFFER, dBuf, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(locDir0S)
    gl.vertexAttribPointer(locDir0S, 3, gl.FLOAT, false, 0, 0)
    const nb = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, nb)
    gl.bufferData(gl.ARRAY_BUFFER, nBuf, gl.DYNAMIC_DRAW)
    gl.enableVertexAttribArray(2)
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0)
    const ib = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW)
    gl.bindVertexArray(null)
    const frame = new Float32Array([b[0], b[3], b[6], b[1], b[4], b[7], b[2], b[5], b[8]])
    return {vao: vao, count: idx.length, frame: frame, pb: pb, nb: nb, pBuf: pBuf, nBuf: nBuf, nxA: nxA, qArr: qArr, idx: idx, groups: groups, kind: 1}
  }
  function procVAOUpdate(e, pax, pay, paz, prx, pry, prz){
    const b = new Float64Array(9)
    planetBasis(pax, pay, paz, prx, pry, prz, b)
    procPosFill(e.pBuf, e.qArr, b)
    gl.bindBuffer(gl.ARRAY_BUFFER, e.pb)
    gl.bufferData(gl.ARRAY_BUFFER, e.pBuf, gl.DYNAMIC_DRAW)
    procNormalsAccum(e.pBuf, e.idx, e.nxA)
    procNormalsAverage(e.nxA, e.groups, e.nBuf)
    gl.bindBuffer(gl.ARRAY_BUFFER, e.nb)
    gl.bufferData(gl.ARRAY_BUFFER, e.nBuf, gl.DYNAMIC_DRAW)
    e.frame[0]=b[0]; e.frame[1]=b[3]; e.frame[2]=b[6]
    e.frame[3]=b[1]; e.frame[4]=b[4]; e.frame[5]=b[7]
    e.frame[6]=b[2]; e.frame[7]=b[5]; e.frame[8]=b[8]
  }
  const meshPlanets = []
  for(let mpi=0;mpi<N;mpi++){
    const mpid = bodies[mpi].id
    if(mpid==='mercury'||mpid==='venus'||mpid==='earth'||mpid==='mars'||mpid==='jupiter'||mpid==='saturn'||mpid==='uranus'||mpid==='neptune'||mpid==='pluto'||mpid==='sun'||mpid==='moon'||mpid==='titan'||mpid==='charon'||mpid==='io'||mpid==='europa'||mpid==='ganymede'||mpid==='callisto'||mpid==='triton'||mpid==='dione'||mpid==='enceladus'||mpid==='iapetus'||mpid==='mimas'||mpid==='oberon'||mpid==='rhea'||mpid==='tethys'||mpid==='titania'||mpid==='ariel'||mpid==='miranda'||mpid==='umbriel'||PROC_AST.has(mpid)) meshPlanets.push(mpi)
  }
  const planetVAO = new Array(N).fill(null)
  const planetAxis = new Array(N).fill(null)
  const planetRef0 = new Array(N).fill(null)
  for(let pk=0;pk<meshPlanets.length;pk++){
    const pi = meshPlanets[pk]
    const pb = bodies[pi]
    let ax = 0, ay = 0, az = 1, rx = 1, ry = 0, rz = 0
    let abf = null
    for(let qb=0;qb<axisBases.length;qb++){ if(axisBases[qb].body === pb){ abf = axisBases[qb]; break } }
    let tD = null
    if(typeof pb.axialTilt_precise_deg === 'number') tD = pb.axialTilt_precise_deg
    else if(typeof pb.axialTilt_deg === 'number') tD = pb.axialTilt_deg
    if(abf && typeof tD === 'number'){
      const tt = tD * Math.PI / 180
      const ct = Math.cos(tt), st = Math.sin(tt)
      ax = ct * abf.nx + st * abf.ex
      ay = ct * abf.ny + st * abf.ey
      az = ct * abf.nz + st * abf.ez
      const al2 = Math.hypot(ax, ay, az) || 1
      ax/=al2; ay/=al2; az/=al2
      rx = abf.ex; ry = abf.ey; rz = abf.ez
    }
    if(pb.id === 'sun'){
      ax = SUN_AXIS[0]; ay = SUN_AXIS[1]; az = SUN_AXIS[2]
    }
    if(pb.aroundPlanet){
      for(let qb=0;qb<N;qb++){
        const cb = bodies[qb]
        if(cb.englishName === pb.aroundPlanet || cb.id === pb.aroundPlanet.toLowerCase()){
          const dx = posRaw[qb*3] - posRaw[pi*3]
          const dy = posRaw[qb*3+1] - posRaw[pi*3+1]
          const dz = posRaw[qb*3+2] - posRaw[pi*3+2]
          const dl = Math.hypot(dx, dy, dz)
          if(dl > 0){ rx = dx / dl; ry = dy / dl; rz = dz / dl }
          break
        }
      }
    }
    planetAxis[pi] = [ax, ay, az]
    planetRef0[pi] = [rx, ry, rz]
    if(PROC_AST.has(pb.id)) planetVAO[pi] = buildProceduralVAO(ax, ay, az, rx, ry, rz, hashStr(pb.id))
    else planetVAO[pi] = buildPlanetVAO(ax, ay, az, rx, ry, rz)
  }
  const meshTex = new Array(N).fill(null)
  const CUBE_FACES = [['px', gl.TEXTURE_CUBE_MAP_POSITIVE_X],
                     ['nx', gl.TEXTURE_CUBE_MAP_NEGATIVE_X],
                     ['py', gl.TEXTURE_CUBE_MAP_POSITIVE_Y],
                     ['ny', gl.TEXTURE_CUBE_MAP_NEGATIVE_Y],
                     ['pz', gl.TEXTURE_CUBE_MAP_POSITIVE_Z],
                     ['nz', gl.TEXTURE_CUBE_MAP_NEGATIVE_Z]]
  function loadMeshTexCubemap(mi, facesCur){
    const rec = {t: null, ok: false}
    meshTex[mi] = rec
    const pend = CUBE_FACES.length
    const imgs = new Array(pend)
    let loaded = 0
    for(let fk=0;fk<pend;fk++){
      const key = CUBE_FACES[fk][0]
      const img = new Image()
      imgs[fk] = img
      img.onload = function(){
        loaded++
        if(loaded === pend){
          const t = gl.createTexture()
          gl.bindTexture(gl.TEXTURE_CUBE_MAP, t)
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
          for(let qk=0;qk<pend;qk++){
            gl.texImage2D(CUBE_FACES[qk][1], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgs[qk])
          }
          gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
          gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
          gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
          gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
          gl.generateMipmap(gl.TEXTURE_CUBE_MAP)
          gl.bindTexture(gl.TEXTURE_CUBE_MAP, null)
          rec.t = t
          rec.ok = true
        }
      }
      img.src = facesCur[key]
    }
  }
  if(typeof TEXTURES !== 'undefined'){
    for(let tk=0;tk<meshPlanets.length;tk++){
      const tmi = meshPlanets[tk]
      if(PROC_AST.has(bodies[tmi].id)) continue
      let tkey = TEXTURES[bodies[tmi].id]
      if(tkey && typeof tkey === 'object') loadMeshTexCubemap(tmi, tkey)
    }
  }
  let saturnIdx = -1
  let moonIdx = -1
  let earthIdx = -1
  for(let ri=0;ri<N;ri++){
    if(bodies[ri].id==='saturn') saturnIdx=ri
    if(bodies[ri].id==='moon') moonIdx=ri
    if(bodies[ri].id==='earth') earthIdx=ri
  }
  const lockParent = new Array(N).fill(-1)
  for(let li=0;li<N;li++){
    const ap = bodies[li].aroundPlanet
    if(!ap) continue
    for(let qb=0;qb<N;qb++){
      const cb = bodies[qb]
      if(cb.englishName === ap || cb.id === ap.toLowerCase()){ lockParent[li] = qb; break }
    }
  }
  const lockDir = new Array(N).fill(null)
  for(let li=0;li<N;li++){
    if(li === moonIdx) continue
    if(lockParent[li] < 0) continue
    if(PROC_AST.has(bodies[li].id)) continue
    const op = orbitalParams[li]
    if(!op || op.type !== 'moon') continue
    const nx = op.uy * op.tz - op.uz * op.ty
    const ny = op.uz * op.tx - op.ux * op.tz
    const nz = op.ux * op.ty - op.uy * op.tx
    const nl = Math.hypot(nx, ny, nz)
    if(nl > 1e-12) planetAxis[li] = [nx / nl, ny / nl, nz / nl]
  }
  let ringAx = [0, 0, 1]
  if(saturnIdx >= 0 && planetAxis[saturnIdx]) ringAx = planetAxis[saturnIdx]
  const rAx = ringAx[0], rAy = ringAx[1], rAz = ringAx[2]
  let e1x = rAy, e1y = -rAx, e1z = 0
  let e1l = Math.hypot(e1x, e1y, e1z)
  if(!(e1l > 1e-6)){ e1x = 1; e1y = 0; e1z = 0; e1l = 1 }
  e1x /= e1l; e1y /= e1l; e1z /= e1l
  const ringE1 = [e1x, e1y, e1z]
  const ringE2 = [rAy * e1z - rAz * e1y, rAz * e1x - rAx * e1z, rAx * e1y - rAy * e1x]
  const ringRads = [74491 * worldScale, 136770 * worldScale]
  const RING_SEGS = 160
  const ringAng = new Float32Array(RING_SEGS * 6)
  const ringFrac = new Float32Array(RING_SEGS * 6)
  for(let sgi=0;sgi<RING_SEGS;sgi++){
    const rA0 = sgi / RING_SEGS * Math.PI * 2
    const rA1 = (sgi + 1) / RING_SEGS * Math.PI * 2
    const rO = sgi * 6
    ringAng[rO] = rA0; ringFrac[rO] = 0
    ringAng[rO+1] = rA1; ringFrac[rO+1] = 0
    ringAng[rO+2] = rA0; ringFrac[rO+2] = 1
    ringAng[rO+3] = rA1; ringFrac[rO+3] = 0
    ringAng[rO+4] = rA1; ringFrac[rO+4] = 1
    ringAng[rO+5] = rA0; ringFrac[rO+5] = 1
  }
  const ringCount = RING_SEGS * 6
  const ringVao = gl.createVertexArray()
  gl.bindVertexArray(ringVao)
  const ringAb = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, ringAb)
  gl.bufferData(gl.ARRAY_BUFFER, ringAng, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(locAngRing)
  gl.vertexAttribPointer(locAngRing, 1, gl.FLOAT, false, 0, 0)
  const ringFb = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, ringFb)
  gl.bufferData(gl.ARRAY_BUFFER, ringFrac, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(locFracRing)
  gl.vertexAttribPointer(locFracRing, 1, gl.FLOAT, false, 0, 0)
  gl.bindVertexArray(null)
  const ringTex = {t: null, ok: false}
  function loadRingTex(mkey){
    const img = new Image()
    img.onload = function(){
      const t = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, t)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.generateMipmap(gl.TEXTURE_2D)
      gl.bindTexture(gl.TEXTURE_2D, null)
      ringTex.t = t
      ringTex.ok = true
    }
    img.src = mkey
  }
  if(typeof TEXTURES !== 'undefined' && typeof TEXTURES.ring === 'string') loadRingTex(TEXTURES.ring)
  const kmPerWorld = worldRadius
  if(typeof window.PATMO !== 'undefined' && PATMO.setup) PATMO.setup(gl, compile, vsS, kmPerWorld, bodies)
  function perspective(out, fov, aspect, near, far){
    const f = 1.0 / Math.tan(fov * 0.5)
    out[0] = f / aspect; out[1]=0; out[2]=0; out[3]=0
    out[4]=0; out[5]=f; out[6]=0; out[7]=0
    out[8]=0; out[9]=0; out[10]=(far+near)/(near-far); out[11]=-1
    out[12]=0; out[13]=0; out[14]=(2*far*near)/(near-far); out[15]=0
    return out
  }
  function ortho(out, l, r, b, t, near, far){
    out[0]=2/(r-l); out[1]=0; out[2]=0; out[3]=0
    out[4]=0; out[5]=2/(t-b); out[6]=0; out[7]=0
    out[8]=0; out[9]=0; out[10]=-2/(far-near); out[11]=0
    out[12]=-(r+l)/(r-l); out[13]=-(t+b)/(t-b); out[14]=-(far+near)/(far-near); out[15]=1
    return out
  }
  function normalize(v){
    const l = Math.hypot(v[0], v[1], v[2])
    if(l>0){ v[0]/=l; v[1]/=l; v[2]/=l }
    return v
  }
  function cross(a,b,out){
    out[0]=a[1]*b[2]-a[2]*b[1]
    out[1]=a[2]*b[0]-a[0]*b[2]
    out[2]=a[0]*b[1]-a[1]*b[0]
    return out
  }
  function lookAt(out, eye, center, up){
    const fx = center[0]-eye[0]
    const fy = center[1]-eye[1]
    const fz = center[2]-eye[2]
    const f = normalize([fx,fy,fz])
    const sx = f[1]*up[2]-f[2]*up[1]
    const sy = f[2]*up[0]-f[0]*up[2]
    const sz = f[0]*up[1]-f[1]*up[0]
    const s = normalize([sx,sy,sz])
    const ux = s[1]*f[2]-s[2]*f[1]
    const uy = s[2]*f[0]-s[0]*f[2]
    const uz = s[0]*f[1]-s[1]*f[0]
    out[0]=s[0]; out[1]=ux; out[2]=-f[0]; out[3]=0
    out[4]=s[1]; out[5]=uy; out[6]=-f[1]; out[7]=0
    out[8]=s[2]; out[9]=uz; out[10]=-f[2]; out[11]=0
    out[12]=-(s[0]*eye[0]+s[1]*eye[1]+s[2]*eye[2])
    out[13]=-(ux*eye[0]+uy*eye[1]+uz*eye[2])
    out[14]= f[0]*eye[0]+f[1]*eye[1]+f[2]*eye[2]
    out[15]=1
    return out
  }
  const proj = new Float32Array(16)
  const view = new Float32Array(16)
  const viewL = new Float32Array(16)
  let target = [0,0,0]
  let distance = 5.76
  let azimuth = 0.85
  let elevation = 0.55
  let fov = 14 * Math.PI / 180
  function updateView(){
    const eye = [
      target[0] + distance * Math.cos(elevation) * Math.cos(azimuth),
      target[1] + distance * Math.cos(elevation) * Math.sin(azimuth),
      target[2] + distance * Math.sin(elevation)
    ]
    const up = [0,0,1]
    if(Math.abs(elevation) > 1.553) up[1]=1, up[2]=0
    lookAt(view, eye, target, up)
  }
  updateView()
  function resize(){
    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth * dpr
    const h = canvas.clientHeight * dpr
    if(canvas.width !== w || canvas.height !== h){
      canvas.width = w
      canvas.height = h
    }
    gl.viewport(0,0,canvas.width,canvas.height)
    const aspect = canvas.width / canvas.height
    perspective(proj, fov, aspect, Math.max(distance * 0.01, 1e-9), 50)
  }
  resize()
  let hovered = -1
  let sunIdx = -1
  for(let fi=0;fi<N;fi++){ if(bodies[fi].id==='sun'){ sunIdx=fi; break } }
  let focusedIdx = -1
  function bodyName(i){ const b=bodies[i]; return b.englishName || b.name || b.id }
  const LABEL_HIDE_KM = 50
  const SAT_CLOSE_FLOOR_KM = 1.2e-6 / worldScale
  const SAT_FAR_KM = 50000000
  const SAT_FAR_FULL_KM = 30000000
  let lastLabelKey = ''
  const labelWidthCache = new Map()
  function labelWidth(name){
    let w = labelWidthCache.get(name)
    if(w === undefined){ w = lctx.measureText(name).width; labelWidthCache.set(name, w) }
    return w
  }
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(() => { lastLabelKey = ''; labelWidthCache.clear() })
  let planetRing = false
  const satIdx = []
  for(let si=0;si<N;si++){ if(bodies[si].aroundPlanet) satIdx.push(si) }
  const MESH_R = 240
  const IMP_STAR_R0 = 4000
  const IMP_STAR_R1 = 6000
  const sunImpR = (typeof window.SUN_IMP_R === 'number' && window.SUN_IMP_R > 0) ? window.SUN_IMP_R : 24
  const sunStarRaw = (typeof window.SUN_STAR_R === 'number' && window.SUN_STAR_R > 0) ? window.SUN_STAR_R : 70
  const sunStarR = Math.max(sunStarRaw, sunImpR * 1.2)
  const PLANET_IDS = new Set(['sun','mercury','venus','earth','mars','jupiter','saturn','uranus','neptune','pluto'])
  const planetIdx = []
  for(let li=0;li<N;li++){ if(PLANET_IDS.has(bodies[li].id)) planetIdx.push(li) }
  const labelHit = []
  function projectLabel(i, w, h){
    const x = posData[i*3]
    const y = posData[i*3+1]
    const z = posData[i*3+2]
    const vx = viewL[0]*x + viewL[4]*y + viewL[8]*z + viewL[12]
    const vy = viewL[1]*x + viewL[5]*y + viewL[9]*z + viewL[13]
    const vz = viewL[2]*x + viewL[6]*y + viewL[10]*z + viewL[14]
    if(vz > -Math.max(distance * 1e-6, 1e-12)) return null
    const cx = proj[0]*vx + proj[4]*vy + proj[8]*vz + proj[12]
    const cy = proj[1]*vx + proj[5]*vy + proj[9]*vz + proj[13]
    const cw = proj[3]*vx + proj[7]*vy + proj[11]*vz + proj[15]
    if(!(cw > 0)) return null
    const ndcx = cx / cw
    const ndcy = cy / cw
    if(ndcx < -1.15 || ndcx > 1.15 || ndcy < -1.15 || ndcy > 1.15) return null
    return {x: (ndcx * 0.5 + 0.5) * w, y: (1.0 - (ndcy * 0.5 + 0.5)) * h, dist: Math.hypot(vx, vy, vz)}
  }
  function pickLabel(mx, my){
    for(let k=0;k<labelHit.length;k++){
      const r = labelHit[k]
      if(mx >= r.x0 && mx <= r.x1 && my >= r.y0 && my <= r.y1) return r.idx
    }
    return -1
  }
  function drawPlanetLabels(){
    if(!lctx) return
    const w = canvas.width
    const h = canvas.height
    if(w === 0 || h === 0) return
    if(window.SHOW_ORBITS === false){
      lctx.clearRect(0, 0, w, h)
      lastLabelKey = ''
      labelHit.length = 0
      return
    }
    if(labelsCanvas.width !== w || labelsCanvas.height !== h){
      labelsCanvas.width = w
      labelsCanvas.height = h
    }
    const labelKey = azimuth + ',' + elevation + ',' + distance + ',' + target[0] + ',' + target[1] + ',' + target[2] + ',' + w + ',' + h + ',' + orbitalTime
    if(labelKey === lastLabelKey) return
    lastLabelKey = labelKey
    lctx.clearRect(0, 0, w, h)
    const dpr = window.devicePixelRatio || 1
    const f = proj[5]
    const pItems = []
    const sItems = []
    for(let k=0;k<planetIdx.length;k++){
      const i = planetIdx[k]
      const pj = projectLabel(i, w, h)
      if(!pj) continue
      const fadeR = radData[i]
      const distKm = pj.dist / worldScale
      const cKm = Math.max(LABEL_HIDE_KM, 20 * fadeR / worldScale, SAT_CLOSE_FLOOR_KM)
      const fadeK = (distKm - cKm) / cKm
      if(!(fadeK > 0)) continue
      const alpha = fadeK >= 1 ? 1 : fadeK
      let pr = 0
      if(pj.dist > 0) pr = fadeR * f / pj.dist * h * 0.5
      if(!(pr >= 0)) pr = 0
      const maxPr = 60 * dpr
      if(pr > maxPr) pr = maxPr
      pItems.push({x: pj.x, y: pj.y - pr - 10 * dpr, name: bodyName(i), a: alpha, idx: i})
    }
    for(let k=0;k<satIdx.length;k++){
      const i = satIdx[k]
      const pj = projectLabel(i, w, h)
      if(!pj) continue
      const distKm = pj.dist / worldScale
      if(distKm > SAT_FAR_KM) continue
      const farK = (SAT_FAR_KM - distKm) / (SAT_FAR_KM - SAT_FAR_FULL_KM)
      if(!(farK > 0)) continue
      const farA = farK >= 1 ? 1 : farK
      const rs = radData[i]
      const cKm = Math.max(LABEL_HIDE_KM, 20 * rs / worldScale, SAT_CLOSE_FLOOR_KM)
      const ck = (distKm - cKm) / cKm
      if(!(ck > 0)) continue
      const closeA = ck >= 1 ? 1 : ck
      const alpha = closeA < farA ? closeA : farA
      let pr = 0
      if(pj.dist > 0) pr = rs * f / pj.dist * h * 0.5
      if(!(pr >= 0)) pr = 0
      if(pr > 60 * dpr) pr = 60 * dpr
      sItems.push({x: pj.x, y: pj.y - pr - 10 * dpr, name: bodyName(i), a: alpha, idx: i, dist: pj.dist})
    }
    let pring = false
    if(pItems.length > 1){
      let ccx = 0, ccy = 0
      for(let k=0;k<pItems.length;k++){ ccx += pItems[k].x; ccy += pItems[k].y }
      ccx /= pItems.length; ccy /= pItems.length
      let br = 0
      for(let k=0;k<pItems.length;k++){
        const dd = Math.hypot(pItems[k].x - ccx, pItems[k].y - ccy)
        if(dd > br) br = dd
      }
      if(!planetRing && br / dpr < 60) planetRing = true
      else if(planetRing && br / dpr > 90) planetRing = false
      pring = planetRing
      if(pring){
        const RR = 92 * dpr
        const GAP = 0.5
        for(let k=0;k<pItems.length;k++){
          const it = pItems[k]
          it.ox = it.x; it.oy = it.y
          it.ang = Math.atan2(it.y - ccy, it.x - ccx)
        }
        pItems.sort((a, b) => a.ang - b.ang)
        for(let pass=0;pass<3;pass++){
          for(let k=0;k<pItems.length;k++){
            const a = pItems[k]
            const b = pItems[(k+1) % pItems.length]
            let d = b.ang - a.ang
            while(d < 0) d += Math.PI * 2
            while(d >= Math.PI * 2) d -= Math.PI * 2
            if(d < GAP){
              const sh = (GAP - d) * 0.5
              a.ang -= sh; b.ang += sh
            }
          }
        }
        for(let k=0;k<pItems.length;k++){
          const it = pItems[k]
          it.x = ccx + Math.cos(it.ang) * RR
          it.y = ccy + Math.sin(it.ang) * RR
        }
      }
    }
    lctx.textAlign = 'center'
    lctx.textBaseline = 'bottom'
    const fs = 12 * dpr
    lctx.font = '600 ' + fs + 'px "Inter Tight"'
    lctx.lineWidth = 3 * dpr
    lctx.lineJoin = 'round'
    lctx.strokeStyle = 'rgba(0,0,0,0.85)'
    lctx.fillStyle = '#ffffff'
    const placed = []
    const cpad = 3 * dpr
    labelHit.length = 0
    function drawItem(it, tw){
      lctx.globalAlpha = it.a
      lctx.strokeText(it.name, it.x, it.y)
      lctx.fillText(it.name, it.x, it.y)
      if(it.idx >= 0){
        labelHit.push({
          x0: (it.x - tw * 0.5) / dpr - 4,
          x1: (it.x + tw * 0.5) / dpr + 4,
          y0: (it.y - fs) / dpr - 4,
          y1: it.y / dpr + 4,
          idx: it.idx
        })
      }
    }
    for(let k=0;k<pItems.length;k++){
      const it = pItems[k]
      const tw = labelWidth(it.name)
      if(it.ox !== undefined){
        lctx.globalAlpha = it.a * 0.4
        lctx.lineWidth = Math.max(1, dpr * 0.75)
        lctx.strokeStyle = '#9ab'
        lctx.beginPath()
        lctx.moveTo(it.ox, it.oy)
        lctx.lineTo(it.x, it.y - fs * 0.5)
        lctx.stroke()
      }
      placed.push([it.x - tw * 0.5 - cpad, it.y - fs - cpad, it.x + tw * 0.5 + cpad, it.y + cpad])
      drawItem(it, tw)
    }
    sItems.sort((a, b) => a.dist - b.dist)
    for(let k=0;k<sItems.length;k++){
      const it = sItems[k]
      const tw = labelWidth(it.name)
      const bx0 = it.x - tw * 0.5 - cpad
      const bx1 = it.x + tw * 0.5 + cpad
      const by0 = it.y - fs - cpad
      const by1 = it.y + cpad
      let ov = 0
      const ownArea = (bx1 - bx0) * (by1 - by0)
      if(ownArea > 0){
        for(let q=0;q<placed.length;q++){
          const r = placed[q]
          const ix0 = bx0 > r[0] ? bx0 : r[0]
          const ix1 = bx1 < r[2] ? bx1 : r[2]
          const iy0 = by0 > r[1] ? by0 : r[1]
          const iy1 = by1 < r[3] ? by1 : r[3]
          if(ix1 > ix0 && iy1 > iy0){
            const f = ((ix1 - ix0) * (iy1 - iy0)) / ownArea
            if(f > ov) ov = f
          }
        }
      }
      placed.push([bx0, by0, bx1, by1])
      const dimA = it.a * (1 - ov)
      if(dimA < 0.02) continue
      it.a = dimA
      drawItem(it, tw)
    }
    lctx.globalAlpha = 1
  }
  const infoBtn = document.getElementById('info')
  function refreshLabel(){
    if(!selEl) return
    if(hovered >= 0) selEl.textContent = bodyName(hovered)
    else if(focusedIdx >= 0) selEl.textContent = bodyName(focusedIdx)
    else selEl.textContent = ''
    const enabled = focusedIdx >= 0
    if(infoBtn) infoBtn.disabled = !enabled
  }
  refreshLabel()
  const ipanel = document.getElementById('ipanel')
  const ipanelBody = document.getElementById('ipanel-body')
  const ipanelTitle = document.getElementById('ipanel-title')
  const ipanelClose = document.getElementById('ipanel-close')
  const INFO_FIELDS = [
    ['id', 'ID'], ['code', 'Code'], ['bodyType', 'Body type'],
    ['aroundPlanet', 'Orbits around'], ['isPlanet', 'Planet'],
    ['meanRadius_km', 'Mean radius (km)'], ['equaRadius_km', 'Equatorial radius (km)'],
    ['polarRadius_km', 'Polar radius (km)'], ['density_gcm3', 'Density (g/cm³)'],
    ['gm_km3s2', 'GM (km³/s²)'], ['mass_kg', 'Mass (kg)'], ['vol_km3', 'Volume (km³)'],
    ['gravity_ms2', 'Gravity (m/s²)'], ['escape_ms', 'Escape velocity (m/s)'],
    ['sideralRotation_hours', 'Rotation period (h)'], ['sideralOrbit_days', 'Orbital period (days)'],
    ['semimajorAxis_km', 'Semi-major axis (km)'], ['semimajorAxis_AU', 'Semi-major axis (AU)'],
    ['perihelion_km', 'Perihelion (km)'], ['aphelion_km', 'Aphelion (km)'],
    ['eccentricity', 'Eccentricity'], ['eccentricity_precise', 'Eccentricity (precise)'],
    ['inclination_deg', 'Inclination (°)'], ['inclination_precise_deg', 'Inclination (° precise)'],
    ['axialTilt_deg', 'Axial tilt (°)'], ['avgTemp_K', 'Mean temperature (K)'],
    ['iau_number', 'IAU number'], ['provisional_designation', 'Provisional designation'],
    ['year_discovered', 'Discovered in'], ['discoverer', 'Discoverer'],
    ['reference', 'Reference'], ['coordinate_epoch', 'Coordinate epoch'],
    ['coordinate_center', 'Coordinate center'], ['coordinate_frame', 'Coordinate frame'],
    ['x_km', 'x (km)'], ['y_km', 'y (km)'], ['z_km', 'z (km)'],
    ['vx_km_s', 'vx (km/s)'], ['vy_km_s', 'vy (km/s)'], ['vz_km_s', 'vz (km/s)']
  ]
  function fmtVal(v){
    if(typeof v === 'number'){
      if(!isFinite(v)) return String(v)
      const av = Math.abs(v)
      if(av !== 0 && (av >= 1e15 || av < 1e-3)) return v.toExponential(6)
      return v.toLocaleString('en-US', {maximumFractionDigits: 8})
    }
    return String(v)
  }
  function closeInfoPanel(){
    if(window.SFX && typeof window.SFX.stopAll === 'function') window.SFX.stopAll()
    if(ipanel) ipanel.classList.remove('open')
  }
  window.DSS_INFO_CLOSE = closeInfoPanel
  if(ipanelClose) ipanelClose.addEventListener('click', closeInfoPanel)
  const ipanelFoot = document.getElementById('ipanel-foot')
  if(ipanelFoot) ipanelFoot.addEventListener('click', closeInfoPanel)
  window.DSS_INFO = function(){
    if(focusedIdx < 0 || !ipanel || !ipanelBody) return
    if(window.SFX && typeof window.SFX.stopAll === 'function') window.SFX.stopAll()
    const b = bodies[focusedIdx]
    if(ipanelTitle) ipanelTitle.textContent = bodyName(focusedIdx)
    const rows = []
    for(let fi=0;fi<INFO_FIELDS.length;fi++){
      const key = INFO_FIELDS[fi][0]
      const label = INFO_FIELDS[fi][1]
      const v = b[key]
      if(v === '' || v === null || v === undefined) continue
      rows.push('<div class="prow"><span class="pk">' + label + '</span><span class="pv">' + fmtVal(v) + '</span></div>')
    }
    if(typeof AUDIO_BR !== 'undefined' && AUDIO_BR && AUDIO_BR[b.id]){
      const alabel = (typeof AUDIO_LABEL !== 'undefined' && AUDIO_LABEL && typeof AUDIO_LABEL[b.id] === 'string') ? AUDIO_LABEL[b.id] : 'Sound'
      rows.push('<div class="prow arow"><span class="pk">' + alabel + '</span><span class="pv"><button id="abtn" class="abtn" type="button" aria-pressed="false" aria-label="Play sound"></button></span></div>')
    }
    ipanelBody.innerHTML = rows.join('')
    const abtn = document.getElementById('abtn')
    if(abtn){
      if(typeof ICONS !== 'undefined' && typeof ICONS.play === 'string') abtn.innerHTML = ICONS.play
      abtn.addEventListener('click', () => {
        if(window.SFX && typeof window.SFX.toggle === 'function'){
          const playing = window.SFX.toggle(b.id, nowPlaying => {
            abtn.setAttribute('aria-pressed', String(nowPlaying))
            abtn.classList.toggle('off', nowPlaying)
          })
          abtn.setAttribute('aria-pressed', String(playing))
          abtn.classList.toggle('off', playing)
        }
      })
    }
    ipanel.classList.add('open')
  }
  window.DSS_BODIES = bodies
  window.DSS_ANIMATE = animateTo
  let animT = 0
  let animStartTarget = [0,0,0]
  let animEndTarget = [0,0,0]
  let animStartDist = 5.76
  let animEndDist = 5.76
  let animActive = false
  let animStartTime = 0
  function pick(mx, my){
    const w = canvas.width
    const h = canvas.height
    const f = proj[5]
    let best = -1
    let bestD = 1e9
    for(let i=0;i<N;i++){
      const x = posData[i*3]
      const y = posData[i*3+1]
      const z = posData[i*3+2]
      const vx = viewL[0]*x + viewL[4]*y + viewL[8]*z + viewL[12]
      const vy = viewL[1]*x + viewL[5]*y + viewL[9]*z + viewL[13]
      const vz = viewL[2]*x + viewL[6]*y + viewL[10]*z + viewL[14]
      const vw = viewL[3]*x + viewL[7]*y + viewL[11]*z + viewL[15]
      if(vz > -Math.max(distance * 1e-6, 1e-12)) continue
      const cx = proj[0]*vx + proj[4]*vy + proj[8]*vz + proj[12]*vw
      const cy = proj[1]*vx + proj[5]*vy + proj[9]*vz + proj[13]*vw
      const cw = proj[3]*vx + proj[7]*vy + proj[11]*vz + proj[15]*vw
      if(cw === 0) continue
      const ndcx = cx / cw
      const ndcy = cy / cw
      const sx = (ndcx * 0.5 + 0.5) * w
      const sy = (1.0 - (ndcy * 0.5 + 0.5)) * h
      const dx = sx - mx * (w / canvas.clientWidth)
      const dy = sy - my * (h / canvas.clientHeight)
      const d2 = dx*dx + dy*dy
      const r = radData[i]
      const dist = Math.hypot(vx, vy, vz)
      let pr = 0
      if(dist > 0) pr = r * f / dist * h * 0.5
      let ps = r * h * 0.5 * 380.0 / dist
      if(ps < 1.5) ps = 1.5
      if(ps > 6) ps = 6
      let rad = pr
      if(pr < ps) rad = ps
      if(rad < 8) rad = 8
      if(d2 < rad*rad){
        const d = Math.hypot(ndcx, ndcy)
        if(d2 < bestD){ bestD = d2; best = i }
      }
    }
    return best
  }
  function animateTo(idx){
    const b = bodies[idx]
    const tx = posData[idx*3] + lineOrigin[0]
    const ty = posData[idx*3+1] + lineOrigin[1]
    const tz = posData[idx*3+2] + lineOrigin[2]
    const r = radData[idx]
    let nd = r * 14.4
    if(nd < 0.000001) nd = 0.000001
    if(nd > 5.76) nd = 5.76
    animStartTarget = [target[0], target[1], target[2]]
    animEndTarget = [tx, ty, tz]
    animStartDist = distance
    animEndDist = nd
    animActive = true
    animStartTime = performance.now()
    animT = 0
    focusedIdx = idx
    refreshLabel()
  }
  function updateAnim(){
    if(!animActive) return
    const now = performance.now()
    let k = (now - animStartTime) / 900
    if(k >= 1){ k = 1; animActive = false }
    const ease = 1 - Math.pow(1 - k, 3)
    target[0] = animStartTarget[0] + (animEndTarget[0] - animStartTarget[0]) * ease
    target[1] = animStartTarget[1] + (animEndTarget[1] - animStartTarget[1]) * ease
    target[2] = animStartTarget[2] + (animEndTarget[2] - animStartTarget[2]) * ease
    distance = animStartDist + (animEndDist - animStartDist) * ease
    updateView()
  }
  let lastFpsT = performance.now()
  let lastFpsUpdate = 0
  let fpsEMA = 60
  let wireS = false
  const capView = new Float32Array(16)
  const capProj = new Float32Array(16)
  const impTex = new Array(N).fill(null)
  const impCache = new Array(N).fill(null)
  function getImpTex(mi){
    if(impTex[mi]) return impTex[mi]
    const t = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, t)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, impTexSize, impTexSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.bindTexture(gl.TEXTURE_2D, null)
    impTex[mi] = t
    return t
  }
  const PROC_TEX_EDGE = 128
  const PROC_TEX_FW = 128
  const PROC_TEX_FH = 64
  function procFaceDir(f, u, v){
    if(f === 0) return [1.0, -v, -u]
    if(f === 1) return [-1.0, -v, u]
    if(f === 2) return [u, 1.0, v]
    if(f === 3) return [u, -1.0, -v]
    if(f === 4) return [u, -v, 1.0]
    return [-u, -v, -1.0]
  }
  function procFieldSample(field, fw, fh, us, vs){
    const uf = us * fw - 0.5
    const vf = vs * fh - 0.5
    const ui = Math.floor(uf)
    const vi = Math.floor(vf)
    const mu = uf - ui
    const nu = vf - vi
    const ui0 = ((ui % fw) + fw) % fw
    const ui1 = (ui0 + 1) % fw
    const vi0 = vi < 0 ? 0 : (vi > fh - 1 ? fh - 1 : vi)
    const vi1 = vi + 1 < 0 ? 0 : (vi + 1 > fh - 1 ? fh - 1 : vi + 1)
    const p00 = vi0 * fw + ui0
    const p01 = vi0 * fw + ui1
    const p10 = vi1 * fw + ui0
    const p11 = vi1 * fw + ui1
    return field[p00] * (1 - mu) * (1 - nu) + field[p01] * mu * (1 - nu) + field[p10] * (1 - mu) * nu + field[p11] * mu * nu
  }
  function genProcTexture(mi){
    const id = bodies[mi].id
    const seed = hashStr(id)
    const R = procRand((seed ^ 0x9e3779b9) >>> 0)
    const ox = R() * 10, oy = R() * 10, oz = R() * 10
    const nCr = 5 + Math.floor(R() * 4)
    const crx = [], cry = [], crz = [], crr = [], crw = []
    for(let ci = 0; ci < nCr; ci++){
      const cx = R() * 2 - 1, cy = R() * 2 - 1, cz = R() * 2 - 1
      const cl = Math.sqrt(cx * cx + cy * cy + cz * cz) || 1
      crx.push(cx / cl); cry.push(cy / cl); crz.push(cz / cl)
      crr.push(Math.cos(0.18 + R() * 0.30))
      crw.push(0.5 + R() * 0.5)
    }
    const gnx = [], gny = [], gnz = [], gof = [], gwd = []
    const nFam = Math.floor(R() * 3)
    for(let fam = 0; fam < nFam; fam++){
      let fx = R() * 2 - 1, fy = R() * 2 - 1, fz = R() * 2 - 1
      const fl = Math.sqrt(fx * fx + fy * fy + fz * fz) || 1
      fx /= fl; fy /= fl; fz /= fl
      const nG = 2 + Math.floor(R() * 3)
      const fBase = (R() - 0.5) * 0.2
      for(let gi = 0; gi < nG; gi++){
        gnx.push(fx); gny.push(fy); gnz.push(fz)
        gof.push(fBase + (gi - (nG - 1) / 2) * (0.025 + R() * 0.025))
        gwd.push(0.006 + R() * 0.012)
      }
    }
    const fw = PROC_TEX_FW, fh = PROC_TEX_FH
    const field = new Float32Array(fw * fh)
    for(let jy = 0; jy < fh; jy++){
      const bb = (0.5 - (jy + 0.5) / fh) * Math.PI
      const sy = Math.sin(bb), cy2 = Math.cos(bb)
      for(let ix = 0; ix < fw; ix++){
        const ll = (ix + 0.5) / fw * 2 * Math.PI - Math.PI
        const dx = cy2 * Math.cos(ll), dy = sy, dz = cy2 * Math.sin(ll)
        const fb = procFbm(dx * 2.2 + ox, dy * 2.2 + oy, dz * 2.2 + oz, seed)
        let a = 0.60 + (fb - 0.5) * 0.55
        if(fb > 0.60) a += (fb - 0.60) * 0.35
        else a -= (0.60 - fb) * 0.30
        for(let ci = 0; ci < nCr; ci++){
          const cosang = dx * crx[ci] + dy * cry[ci] + dz * crz[ci]
          if(cosang > crr[ci]){
            const t = (cosang - crr[ci]) / (1 - crr[ci])
            const bowl = t * t * (3 - 2 * t)
            a -= crw[ci] * 0.28 * bowl
            const rimD = (1 - t) * 3.5
            a += crw[ci] * 0.10 * Math.exp(-rimD * rimD)
          }
        }
        for(let gi = 0; gi < gnx.length; gi++){
          const gd = (dx * gnx[gi] + dy * gny[gi] + dz * gnz[gi]) - gof[gi]
          const gg = gd / gwd[gi]
          if(gg > -3 && gg < 3) a -= 0.10 * Math.exp(-gg * gg)
        }
        a += (procHash3(ix, jy, 7, seed) - 0.5) * 0.07
        field[jy * fw + ix] = a < 0.03 ? 0.03 : (a > 0.95 ? 0.95 : a)
      }
    }
    for(let jy = 0; jy < fh; jy++){
      for(let ix = 0; ix < fw; ix++){
        const c0 = jy * fw + ix
        const xp = field[jy * fw + ((ix + 1) % fw)]
        const xm = field[jy * fw + ((ix - 1 + fw) % fw)]
        const yp = field[(jy + 1 < fh ? jy + 1 : jy) * fw + ix]
        const ym = field[(jy - 1 >= 0 ? jy - 1 : jy) * fw + ix]
        const sl = Math.abs(xp - xm) + Math.abs(yp - ym)
        const dk = sl * 1.2 > 0.25 ? 0.25 : sl * 1.2
        field[c0] = field[c0] * (1 - dk)
      }
    }
    const edge = PROC_TEX_EDGE
    const faces = []
    for(let f = 0; f < 6; f++){
      const px = new Uint8Array(edge * edge * 4)
      for(let j = 0; j < edge; j++){
        const v = (j + 0.5) / edge * 2 - 1
        for(let i = 0; i < edge; i++){
          const u = (i + 0.5) / edge * 2 - 1
          const dd = procFaceDir(f, u, v)
          const dl = Math.sqrt(dd[0] * dd[0] + dd[1] * dd[1] + dd[2] * dd[2]) || 1
          const us = (Math.atan2(dd[2] / dl, dd[0] / dl) + Math.PI) / (2 * Math.PI)
          let sy2 = dd[1] / dl
          if(sy2 > 1) sy2 = 1
          else if(sy2 < -1) sy2 = -1
          const vs = 0.5 - Math.asin(sy2) / Math.PI
          let g = procFieldSample(field, fw, fh, us, vs)
          g = g < 0 ? 0 : (g > 1 ? 1 : g)
          const bv = Math.round(g * 255)
          const o = (j * edge + i) * 4
          px[o] = bv; px[o + 1] = bv; px[o + 2] = bv; px[o + 3] = 255
        }
      }
      faces.push(px)
    }
    const t = uploadCubeFaces(faces, edge)
    if(!t) return
    meshTex[mi] = {t: t, ok: true}
    impCache[mi] = null
  }
  function uploadCubeFaces(faces, edge){
    const t = gl.createTexture()
    if(!t) return null
    try{ while(gl.getError() !== gl.NO_ERROR){} }catch(eC){}
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, t)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    for(let f = 0; f < 6; f++){
      gl.texImage2D(CUBE_FACES[f][1], 0, gl.RGBA, edge, edge, 0, gl.RGBA, gl.UNSIGNED_BYTE, faces[f])
    }
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP)
    let texErr = gl.NO_ERROR
    try{ texErr = gl.getError() }catch(eG2){}
    if(texErr !== gl.NO_ERROR){
      try{ gl.deleteTexture(t) }catch(eD){}
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, null)
      return null
    }
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null)
    return t
  }
  const SUN_TEX_EDGE = 256
  const SUN_TEX_FW = 256
  const SUN_TEX_FH = 128
  function genSunTexture(mi){
    const seed = hashStr('sun')
    const fw = SUN_TEX_FW, fh = SUN_TEX_FH
    const fieldM = new Float32Array(fw * fh)
    const fieldQ = new Float32Array(fw * fh)
    for(let jy = 0; jy < fh; jy++){
      const bb = (0.5 - (jy + 0.5) / fh) * Math.PI
      const sy = Math.sin(bb), cy2 = Math.cos(bb)
      for(let ix = 0; ix < fw; ix++){
        const ll = (ix + 0.5) / fw * 2 * Math.PI - Math.PI
        const dx = cy2 * Math.cos(ll), dy = sy, dz = cy2 * Math.sin(ll)
        const qx = procFbm(dx * 3.0, dy * 3.0, dz * 3.0, seed)
        const qy = procFbm(dx * 3.0 + 5.2, dy * 3.0 + 1.3, dz * 3.0 + 2.8, seed)
        const qz = procFbm(dx * 3.0 + 1.7, dy * 3.0 + 9.2, dz * 3.0 + 4.3, seed)
        const m = procFbm(dx * 3.0 + qx * 0.9, dy * 3.0 + qy * 0.9, dz * 3.0 + qz * 0.9, seed)
        fieldM[jy * fw + ix] = m
        const qdx = qx - 0.5, qdy = qy - 0.5, qdz = qz - 0.5
        fieldQ[jy * fw + ix] = Math.sqrt(qdx * qdx + qdy * qdy + qdz * qdz)
      }
    }
    const edge = SUN_TEX_EDGE
    const faces = []
    for(let f = 0; f < 6; f++){
      const px = new Uint8Array(edge * edge * 4)
      for(let j = 0; j < edge; j++){
        const v = (j + 0.5) / edge * 2 - 1
        for(let i = 0; i < edge; i++){
          const u = (i + 0.5) / edge * 2 - 1
          const dd = procFaceDir(f, u, v)
          const dl = Math.sqrt(dd[0] * dd[0] + dd[1] * dd[1] + dd[2] * dd[2]) || 1
          const us = (Math.atan2(dd[2] / dl, dd[0] / dl) + Math.PI) / (2 * Math.PI)
          let sy2 = dd[1] / dl
          if(sy2 > 1) sy2 = 1
          else if(sy2 < -1) sy2 = -1
          const vs = 0.5 - Math.asin(sy2) / Math.PI
          const m = procFieldSample(fieldM, fw, fh, us, vs)
          const ql = procFieldSample(fieldQ, fw, fh, us, vs)
          const mm = m * m
          let cr = 1.0, cg = 0.30 + 0.63 * mm, cb = 0.72 * mm
          let rk = ql * 0.9
          rk = rk < 0 ? 0 : (rk > 1 ? 1 : rk)
          rk *= 0.65
          cr = cr + (0.82 - cr) * rk
          cg = cg + (0.07 - cg) * rk
          cb = cb + (0.0 - cb) * rk
          cr *= 1.35; cg *= 1.35; cb *= 1.35
          const o = (j * edge + i) * 4
          px[o] = Math.round(cr > 1 ? 255 : cr * 255)
          px[o + 1] = Math.round(cg > 1 ? 255 : cg * 255)
          px[o + 2] = Math.round(cb > 1 ? 255 : cb * 255)
          px[o + 3] = 255
        }
      }
      faces.push(px)
    }
    const t = uploadCubeFaces(faces, edge)
    if(!t) return
    meshTex[mi] = {t: t, ok: true}
    impCache[mi] = null
  }
  const procTexQueue = []
  for(let qi = 0; qi < meshPlanets.length; qi++){
    if(PROC_AST.has(bodies[meshPlanets[qi]].id)) procTexQueue.push(meshPlanets[qi])
  }
  if(sunIdx >= 0) procTexQueue.unshift(sunIdx)
  function captureImpostor(mi, mpx, mpy, mpz, mrr, irr, dirx, diry, dirz){
    const pv = planetVAO[mi]
    if(!pv) return false
    const t = getImpTex(mi)
    const capDist = irr * 10
    let upx = 0, upy = 0, upz = 1
    if(Math.abs(dirz) > 0.9){ upx = 0; upy = 1; upz = 0 }
    const capEye = [mpx - dirx * capDist, mpy - diry * capDist, mpz - dirz * capDist]
    lookAt(capView, capEye, [mpx, mpy, mpz], [upx, upy, upz])
    const m = irr * 1.02
    ortho(capProj, -m, m, -m, m, irr * 8, irr * 12)
    gl.bindFramebuffer(gl.FRAMEBUFFER, impFbo)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0)
    gl.viewport(0, 0, impTexSize, impTexSize)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LESS)
    gl.depthMask(true)
    gl.disable(gl.BLEND)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    const mc = bodyColor(mi)
    const mcw = PROC_AST.has(bodies[mi].id) ? rockyTint(bodies[mi].id) : WHITE3
    const mtx = meshTex[mi]
    let done = false
    if(typeof window.PATMO !== 'undefined' && PATMO.capture){
      done = PATMO.capture(mi, {mpx: mpx, mpy: mpy, mpz: mpz, mrr: mrr, cr: mc[0], cg: mc[1], cb: mc[2], texOk: true, tex: mtx ? mtx.t : null, vao: pv.vao, count: pv.count, frame: pv.frame, viewM: capView, projM: capProj, camW: capEye, sunW: [-lineOrigin[0], -lineOrigin[1], -lineOrigin[2]], expo: window.ATMO_EXPOSURE, wire: false});
    }
    if(!done && bodies[mi].id !== 'sun' && typeof window.PATMO !== 'undefined' && PATMO.rock){
      done = PATMO.rock({mpx: mpx, mpy: mpy, mpz: mpz, mrr: mrr, cr: mcw[0], cg: mcw[1], cb: mcw[2], texOk: true, tex: mtx ? mtx.t : null, vao: pv.vao, count: pv.count, viewM: capView, projM: capProj, camW: capEye, sunW: [-lineOrigin[0], -lineOrigin[1], -lineOrigin[2]], expo: window.ATMO_EXPOSURE, wire: false}, bodyRadiusKm(bodies[mi]));
    }
    if(!done){
      gl.useProgram(progS)
      gl.uniformMatrix4fv(locViewS, false, capView)
      gl.uniformMatrix4fv(locProjS, false, capProj)
      gl.uniform3f(locCenterS, mpx, mpy, mpz)
      gl.uniform1f(locRadiusS, mrr)
      gl.uniform3f(locSunS, -lineOrigin[0], -lineOrigin[1], -lineOrigin[2])
      gl.uniform3f(locColorS, mc[0], mc[1], mc[2])
      gl.uniform1f(locEmitS, bodies[mi].id === 'sun' ? 1 : 0)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, meshTex[mi] ? meshTex[mi].t : null)
      gl.uniform1i(locTexS, 0)
      gl.uniform1f(locUseTexS, meshTex[mi] && meshTex[mi].ok ? 1 : 0)
      gl.bindVertexArray(pv.vao)
      gl.drawElements(gl.TRIANGLES, pv.count, gl.UNSIGNED_INT, 0)
      gl.bindVertexArray(null)
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFbo)
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.bindTexture(gl.TEXTURE_2D, t)
    gl.generateMipmap(gl.TEXTURE_2D)
    return true
  }
  function drawImpostors(ex, ey, ez, onlyStars){
    if(!impProgOk) return
    gl.depthMask(true)
    gl.useProgram(progImp)
    gl.uniformMatrix4fv(locViewImp, false, viewL)
    gl.uniformMatrix4fv(locProjImp, false, proj)
    gl.uniform1i(locTexImp, 0)
    if(locStarMultImp){
      gl.uniform1f(locStarMultImp, (typeof window.STAR_SIZE_MULT === 'number' && window.STAR_SIZE_MULT > 0) ? window.STAR_SIZE_MULT : 6)
    }
    if(locResImp) gl.uniform2f(locResImp, canvas.width, canvas.height)
    if(locTimeImp) gl.uniform1f(locTimeImp, performance.now() * 0.001)
    if(locSpeedImp) gl.uniform1f(locSpeedImp, (typeof window.STAR_SPEED === 'number' && window.STAR_SPEED >= 0) ? window.STAR_SPEED : 0.05)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.bindVertexArray(vaoImp)
    const gBoost = (typeof window.IMPOSTOR_BOOST === 'number' && window.IMPOSTOR_BOOST > 0) ? window.IMPOSTOR_BOOST : 1.15
    const hPx = canvas.height || 1
    const projF = proj[5] || 1
    let budget = 6
    for(let k = 0; k < meshPlanets.length; k++){
      const mi = meshPlanets[k]
      const mrr = radData[mi]
      if(!(mrr > 0)) continue
      const procAst = PROC_AST.has(bodies[mi].id)
      const irr = procAst ? mrr * 1.85 : mrr
      const mtr = meshTex[mi]
      if(mi !== sunIdx && (!mtr || !mtr.ok)) continue
      const mpx = posData[mi*3]
      const mpy = posData[mi*3+1]
      const mpz = posData[mi*3+2]
      const ddx = mpx - ex
      const ddy = mpy - ey
      const ddz = mpz - ez
      const med = Math.hypot(ddx, ddy, ddz)
      if(mi === sunIdx ? !(med > mrr * sunImpR && med <= mrr * sunStarR * 1.2) : !(med > mrr * MESH_R)) continue
      let starMix = 0
      if(mi !== sunIdx && mrr > 0){
        let sm = (med - mrr * IMP_STAR_R0) / Math.max(mrr * (IMP_STAR_R1 - IMP_STAR_R0), 1e-12)
        sm = sm < 0 ? 0 : (sm > 1 ? 1 : sm)
        starMix = sm * sm * (3 - 2 * sm)
      }
      if(onlyStars ? starMix <= 0.001 : starMix > 0.001) continue
      const idl = Math.hypot(ddx, ddy, ddz) || 1
      const ndx = ddx / idl
      const ndy = ddy / idl
      const ndz = ddz / idl
      let lx = -lineOrigin[0] - mpx
      let ly = -lineOrigin[1] - mpy
      let lz = -lineOrigin[2] - mpz
      const ll = Math.hypot(lx, ly, lz) || 1
      lx /= ll; ly /= ll; lz /= ll
      const c = impCache[mi]
      if(!c ||
         c.dx * ndx + c.dy * ndy + c.dz * ndz < 0.99995 ||
         c.sp !== spinLast[mi] ||
         Math.hypot(c.lx - lx, c.ly - ly, c.lz - lz) > 0.02){
         if(!impCache[mi] || mi === focusedIdx || budget > 0){
          if(!captureImpostor(mi, mpx, mpy, mpz, mrr, irr, ndx, ndy, ndz)) continue
          budget--
          impCache[mi] = {dx: ndx, dy: ndy, dz: ndz, lx: lx, ly: ly, lz: lz, sp: spinLast[mi]}
          gl.useProgram(progImp)
        }
      }
      if(!impCache[mi]) continue
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      gl.enable(gl.DEPTH_TEST)
      gl.depthMask(true)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, impTex[mi])
      gl.uniform3f(locCenterImp, mpx, mpy, mpz)
      gl.uniform1f(locRadiusImp, irr)
      if(locStarMixImp) gl.uniform1f(locStarMixImp, starMix)
      if(locCutoutImp) gl.uniform1f(locCutoutImp, procAst ? 1 : 0)
      gl.uniform1f(locDistImp, med)
      if(mi === sunIdx && mrr > 0){
        let sh = (med - mrr * sunStarR * 0.5) / Math.max(mrr * sunStarR * 0.7, 1e-12)
        sh = sh < 0 ? 0 : (sh > 1 ? 1 : sh)
        sh = sh * sh * (3 - 2 * sh)
        gl.uniform1f(locRadiusImp, mrr * (1.0 - 0.98 * sh))
      }
      let impWhite = 0
      if(mi === sunIdx && mrr > 0){
        let wt = (med - mrr * sunStarR * 0.85) / Math.max(mrr * sunStarR * 0.15, 1e-12)
        wt = wt < 0 ? 0 : (wt > 1 ? 1 : wt)
        impWhite = wt * wt * (3 - 2 * wt)
      }
      if(locWhiteImp) gl.uniform1f(locWhiteImp, impWhite)
      if(locBoostImp){
        const prPx = med > 0 ? irr * projF / med * hPx * 0.5 : 0
        const fillComp = 1.0 + 0.28 * Math.max(0, Math.min(1, 1 - prPx / 8))
        gl.uniform1f(locBoostImp, gBoost * fillComp)
      }
      gl.bindVertexArray(vaoImp)
      if(starMix > 0.001){
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        gl.depthMask(false)
      } else {
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
        gl.depthMask(true)
      }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }
    gl.bindVertexArray(null)
    gl.bindTexture(gl.TEXTURE_2D, null)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.depthMask(true)
  }
  function frame(){
    updateOrbitalPositions()
    updateAxisLines()
    if(focusedIdx >= 0){
      const fx = posRaw[focusedIdx*3], fy = posRaw[focusedIdx*3+1], fz = posRaw[focusedIdx*3+2]
      if(animActive){
        animEndTarget[0] = fx; animEndTarget[1] = fy; animEndTarget[2] = fz
      } else {
        target[0] = fx; target[1] = fy; target[2] = fz
      }
    }
    updateAnim()
    updateOrbitLines()
    resize()
    const nowFps = performance.now()
    const dtFps = nowFps - lastFpsT
    lastFpsT = nowFps
    if(dtFps > 0) fpsEMA += (1000 / dtFps - fpsEMA) * 0.05
    if(fpsEl){
      const showFps = window.SHOW_FPS === true
      fpsEl.style.display = showFps ? 'block' : 'none'
      if(showFps && nowFps - lastFpsUpdate > 500){
        lastFpsUpdate = nowFps
        fpsEl.textContent = Math.round(fpsEMA) + ' fps'
      }
    }
    const eyeX = target[0] + distance * Math.cos(elevation) * Math.cos(azimuth)
    const eyeY = target[1] + distance * Math.cos(elevation) * Math.sin(azimuth)
    const eyeZ = target[2] + distance * Math.sin(elevation)
    const odx = target[0] - lineOrigin[0]
    const ody = target[1] - lineOrigin[1]
    const odz = target[2] - lineOrigin[2]
    const othr = Math.max(distance * 0.02, 1e-12)
    if(odx*odx + ody*ody + odz*odz > othr * othr){
      lineOrigin[0] = target[0]
      lineOrigin[1] = target[1]
      lineOrigin[2] = target[2]
  refreshOrigin()
    }
    const upLx = 0, upLy = Math.abs(elevation) > 1.553 ? 1 : 0, upLz = Math.abs(elevation) > 1.553 ? 0 : 1
    lookAt(viewL, [eyeX-lineOrigin[0], eyeY-lineOrigin[1], eyeZ-lineOrigin[2]], [target[0]-lineOrigin[0], target[1]-lineOrigin[1], target[2]-lineOrigin[2]], [upLx, upLy, upLz])
    const aex = eyeX - lineOrigin[0]
    const aey = eyeY - lineOrigin[1]
    const aez = eyeZ - lineOrigin[2]
    const sunSpeed = (typeof window.SUN_SPEED === 'number' && window.SUN_SPEED >= 0) ? window.SUN_SPEED : 0.05
    let sunFade = 0
    for(let i=0;i<N;i++) radQuad[i] = radData[i]
    for(let k=0;k<meshPlanets.length;k++){
      const mi = meshPlanets[k]
      const mtr = meshTex[mi]
      if(mtr && mtr.ok && planetVAO[mi]) radQuad[mi] = 0
    }
    if(sunIdx >= 0 && radData[sunIdx] > 0){
      const sdx = posData[sunIdx*3] - aex
      const sdy = posData[sunIdx*3+1] - aey
      const sdz = posData[sunIdx*3+2] - aez
      const smed = Math.hypot(sdx, sdy, sdz)
      const sEdge0 = radData[sunIdx] * sunStarR * 0.9
      const sEdge1 = radData[sunIdx] * sunStarR
      let sFade = (smed - sEdge0) / Math.max(sEdge1 - sEdge0, 1e-12)
      sFade = sFade < 0 ? 0 : (sFade > 1 ? 1 : sFade)
      sunFade = sFade * sFade * (3 - 2 * sFade)
      radQuad[sunIdx] = smed > sEdge0 ? radData[sunIdx] * 2 : 0
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, rbufQ)
    gl.bufferData(gl.ARRAY_BUFFER, radQuad, gl.DYNAMIC_DRAW)
    ensureSceneFB()
    if(sceneFbOk) gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFbo)
    gl.clearColor(0,0,0,1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.enable(gl.DEPTH_TEST)
    gl.depthMask(true)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    const starMult = (typeof window.STAR_SIZE_MULT === 'number' && window.STAR_SIZE_MULT > 0) ? window.STAR_SIZE_MULT : 6
    const starSpeed = (typeof window.STAR_SPEED === 'number' && window.STAR_SPEED >= 0) ? window.STAR_SPEED : 0.05
    gl.useProgram(prog)
    gl.uniformMatrix4fv(locView, false, viewL)
    gl.uniformMatrix4fv(locProj, false, proj)
    if(locStarMult) gl.uniform1f(locStarMult, starMult)
    if(locRes) gl.uniform2f(locRes, canvas.width, canvas.height)
    if(locMinPx) gl.uniform1f(locMinPx, (typeof window.SUN_STAR_PX === 'number' && window.SUN_STAR_PX > 0) ? window.SUN_STAR_PX : 10)
    gl.bindVertexArray(vao)
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, N)
    gl.bindVertexArray(null)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.disable(gl.DEPTH_TEST)
    gl.useProgram(progP)
    gl.uniformMatrix4fv(locViewP, false, viewL)
    gl.uniformMatrix4fv(locProjP, false, proj)
    gl.uniform2f(locResP, canvas.width, canvas.height)
    if(locTimeP) gl.uniform1f(locTimeP, performance.now() * 0.001)
    if(locSpeedP) gl.uniform1f(locSpeedP, starSpeed)
    if(locStarMultP) gl.uniform1f(locStarMultP, starMult)
    gl.bindVertexArray(vaoP)
    gl.drawArrays(gl.POINTS, 0, N)
    gl.bindVertexArray(null)
    gl.disable(gl.BLEND)
    gl.enable(gl.DEPTH_TEST)
    gl.useProgram(progS)
    gl.uniformMatrix4fv(locViewS, false, viewL)
    gl.uniformMatrix4fv(locProjS, false, proj)
    gl.uniform3f(locSunS, -lineOrigin[0], -lineOrigin[1], -lineOrigin[2])
    if(typeof window.PATMO !== 'undefined' && PATMO.begin) PATMO.begin()
    for(let mk=0;mk<meshPlanets.length;mk++){
      const mi = meshPlanets[mk]
      if(mi === moonIdx && earthIdx >= 0 && planetAxis[mi]){
        const ex = posRaw[earthIdx*3], ey = posRaw[earthIdx*3+1], ez = posRaw[earthIdx*3+2]
        const mx = posRaw[mi*3], my = posRaw[mi*3+1], mz = posRaw[mi*3+2]
        const fdx = ex - mx, fdy = ey - my, fdz = ez - mz
        const fdl = Math.hypot(fdx, fdy, fdz)
        if(fdl > 0){
          const ax = planetAxis[mi][0], ay = planetAxis[mi][1], az = planetAxis[mi][2]
          const fX = fdx/fdl, fY = fdy/fdl, fZ = fdz/fdl
          let rX = fY*az - fZ*ay, rY = fZ*ax - fX*az, rZ = fX*ay - fY*ax
          const rL = Math.hypot(rX, rY, rZ)
          if(rL > 1e-9){ rX/=rL; rY/=rL; rZ/=rL } else { rX=1; rY=0; rZ=0 }
          const rotA = 180 * Math.PI / 180
          const cR = Math.cos(rotA), sR = Math.sin(rotA)
          const dot = rX*ax + rY*ay + rZ*az
          const rrX = rX*cR + (ax*dot)*(1-cR) + (ay*rZ - az*rY)*sR
          const rrY = rY*cR + (ay*dot)*(1-cR) + (az*rX - ax*rZ)*sR
          const rrZ = rZ*cR + (az*dot)*(1-cR) + (ax*rY - ay*rX)*sR
          const meM = planetVAO[mi]
          if(meM) planetVAOUpdate(meM, ax, ay, az, rrX, rrY, rrZ)
          else planetVAO[mi] = buildPlanetVAO(ax, ay, az, rrX, rrY, rrZ)
        }
      }
      if(mi !== moonIdx && lockParent[mi] >= 0 && !PROC_AST.has(bodies[mi].id) && planetAxis[mi]){
        const qi = lockParent[mi]
        const qdx = posRaw[qi*3] - posRaw[mi*3], qdy = posRaw[qi*3+1] - posRaw[mi*3+1], qdz = posRaw[qi*3+2] - posRaw[mi*3+2]
        const qdl = Math.hypot(qdx, qdy, qdz)
        if(qdl > 0){
          const qX = qdx/qdl, qY = qdy/qdl, qZ = qdz/qdl
          const ld = lockDir[mi]
          if(!ld || ld[0]*qX + ld[1]*qY + ld[2]*qZ < 0.9999995){
            lockDir[mi] = [qX, qY, qZ]
            const lax = planetAxis[mi][0], lay = planetAxis[mi][1], laz = planetAxis[mi][2]
            const leM = planetVAO[mi]
            if(leM) planetVAOUpdate(leM, lax, lay, laz, qX, qY, qZ)
            else planetVAO[mi] = buildPlanetVAO(lax, lay, laz, qX, qY, qZ)
            spinLast[mi] = orbitalTime
          }
        }
      }
      const wSpin = spinRate[mi]
      if(wSpin !== 0 && planetAxis[mi] && planetRef0[mi]){
        const twoPi = 6.283185307179586
        let ang = (wSpin * orbitalTime) % twoPi
        let diff = Math.abs(ang - spinLast[mi])
        if(diff > Math.PI) diff = twoPi - diff
        if(diff > 0.002){
          const pax = planetAxis[mi][0], pay = planetAxis[mi][1], paz = planetAxis[mi][2]
          const r0 = planetRef0[mi]
          const cA = Math.cos(ang), sA = Math.sin(ang)
          const dot = r0[0]*pax + r0[1]*pay + r0[2]*paz
          const cx = pay*r0[2] - paz*r0[1]
          const cy = paz*r0[0] - pax*r0[2]
          const cz = pax*r0[1] - pay*r0[0]
          const rrX = r0[0]*cA + cx*sA + pax*dot*(1-cA)
          const rrY = r0[1]*cA + cy*sA + pay*dot*(1-cA)
          const rrZ = r0[2]*cA + cz*sA + paz*dot*(1-cA)
          const seM = planetVAO[mi]
          if(seM){
            if(seM.kind === 1) procVAOUpdate(seM, pax, pay, paz, rrX, rrY, rrZ)
            else planetVAOUpdate(seM, pax, pay, paz, rrX, rrY, rrZ)
          } else if(PROC_AST.has(bodies[mi].id)) planetVAO[mi] = buildProceduralVAO(pax, pay, paz, rrX, rrY, rrZ, hashStr(bodies[mi].id))
          else planetVAO[mi] = buildPlanetVAO(pax, pay, paz, rrX, rrY, rrZ)
          spinLast[mi] = ang
        }
      }
      const mpx = posData[mi*3]
      const mpy = posData[mi*3+1]
      const mpz = posData[mi*3+2]
      const mrr = radData[mi]
      if(!(mrr > 0)) continue
      const mdx = mpx - (eyeX - lineOrigin[0])
      const mdy = mpy - (eyeY - lineOrigin[1])
      const mdz = mpz - (eyeZ - lineOrigin[2])
      const med = Math.hypot(mdx, mdy, mdz)
      if(mi === sunIdx ? med > mrr * sunImpR : med > mrr * MESH_R) continue
      const pv = planetVAO[mi]
      if(!pv) continue
      let sh = 0
      if(typeof window.PATMO !== 'undefined' && PATMO.mesh){
        const mc0 = bodyColor(mi)
        const mt0 = meshTex[mi]
        sh = PATMO.mesh(mi, {mpx: mpx, mpy: mpy, mpz: mpz, mrr: mrr, cr: mc0[0], cg: mc0[1], cb: mc0[2], texOk: !!(mt0 && mt0.ok), tex: mt0 ? mt0.t : null, vao: pv.vao, count: pv.count, frame: pv.frame, viewM: viewL, projM: proj, sunW: [-lineOrigin[0], -lineOrigin[1], -lineOrigin[2]], camW: [aex, aey, aez], expo: window.ATMO_EXPOSURE, wire: wireS});
      }
      if(sh){
        gl.useProgram(progS)
        gl.uniformMatrix4fv(locViewS, false, viewL)
        gl.uniformMatrix4fv(locProjS, false, proj)
        gl.uniform3f(locSunS, -lineOrigin[0], -lineOrigin[1], -lineOrigin[2])
        continue
      }
      if(bodies[mi].id !== 'sun' && typeof window.PATMO !== 'undefined' && PATMO.rock){
        const mcR = bodyColor(mi)
        const mcRw = PROC_AST.has(bodies[mi].id) ? rockyTint(bodies[mi].id) : WHITE3
        const mtR = meshTex[mi]
        if(PATMO.rock({mpx: mpx, mpy: mpy, mpz: mpz, mrr: mrr, cr: mcRw[0], cg: mcRw[1], cb: mcRw[2], texOk: !!(mtR && mtR.ok), tex: mtR ? mtR.t : null, vao: pv.vao, count: pv.count, viewM: viewL, projM: proj, sunW: [-lineOrigin[0], -lineOrigin[1], -lineOrigin[2]], camW: [aex, aey, aez], expo: window.ATMO_EXPOSURE, wire: wireS}, bodyRadiusKm(bodies[mi]))){
          gl.useProgram(progS)
          gl.uniformMatrix4fv(locViewS, false, viewL)
          gl.uniformMatrix4fv(locProjS, false, proj)
          gl.uniform3f(locSunS, -lineOrigin[0], -lineOrigin[1], -lineOrigin[2])
          continue
        }
      }
      gl.bindVertexArray(pv.vao)
      gl.uniform3f(locCenterS, mpx, mpy, mpz)
      gl.uniform1f(locRadiusS, mrr)
      const mc = bodyColor(mi)
      gl.uniform3f(locColorS, mc[0], mc[1], mc[2])
      gl.uniform1f(locEmitS, bodies[mi].id==='sun' ? 1 : 0)
      const mtr = meshTex[mi]
      if(mtr && mtr.ok){
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, mtr.t)
        gl.uniform1i(locTexS, 0)
        gl.uniform1f(locUseTexS, 1)
      } else {
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null)
        gl.uniform1f(locUseTexS, 0)
      }
      gl.drawElements(wireS ? gl.LINES : gl.TRIANGLES, pv.count, gl.UNSIGNED_INT, 0)
    }
    gl.bindVertexArray(null)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    drawImpostors(aex, aey, aez, false)
    if(typeof window.PATMO !== 'undefined' && PATMO.shells){
      PATMO.shells({viewM: viewL, projM: proj, sunW: [-lineOrigin[0], -lineOrigin[1], -lineOrigin[2]], camW: [aex, aey, aez], expo: window.ATMO_EXPOSURE});
    }
    drawImpostors(aex, aey, aez, true)
    if(ringProgOk && ringTex.ok && saturnIdx >= 0){
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      gl.depthMask(false)
      gl.useProgram(progRing)
      gl.uniform3f(locCenterRing, posData[saturnIdx*3], posData[saturnIdx*3+1], posData[saturnIdx*3+2])
      gl.uniform3f(locE1Ring, ringE1[0], ringE1[1], ringE1[2])
      gl.uniform3f(locE2Ring, ringE2[0], ringE2[1], ringE2[2])
      gl.uniform2f(locRadiiRing, ringRads[0], ringRads[1])
      gl.uniformMatrix4fv(locViewRing, false, viewL)
      gl.uniformMatrix4fv(locProjRing, false, proj)
      gl.uniform3f(locSunRing, -lineOrigin[0], -lineOrigin[1], -lineOrigin[2])
      gl.uniform3f(locNormRing, ringAx[0], ringAx[1], ringAx[2])
      if(locSradRing) gl.uniform1f(locSradRing, radData[saturnIdx] || 0)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, ringTex.t)
      gl.uniform1i(locTexRing, 0)
      gl.bindVertexArray(ringVao)
      gl.drawArrays(gl.TRIANGLES, 0, ringCount)
      gl.bindVertexArray(null)
      gl.bindTexture(gl.TEXTURE_2D, null)
      gl.disable(gl.BLEND)
    }
    gl.enable(gl.DEPTH_TEST)
    gl.depthMask(false)
    gl.depthFunc(gl.LEQUAL)
    gl.useProgram(progL)
    gl.uniformMatrix4fv(locViewL, false, viewL)
    gl.uniformMatrix4fv(locProjL, false, proj)
    gl.uniform3f(locColorL, 0.18, 0.18, 0.22)
    if(window.SHOW_ORBITS !== false){
      gl.bindVertexArray(lineVao)
      gl.drawArrays(gl.LINES, 0, lineData.length / 3)
      gl.bindVertexArray(null)
      if(axisData.length > 0){
        gl.uniform3f(locColorL, 0.45, 0.75, 1.0)
        gl.bindVertexArray(axisVao)
        gl.drawArrays(gl.LINES, 0, axisData.length / 3)
        gl.bindVertexArray(null)
      }
    }
    gl.depthFunc(gl.LESS)
    gl.depthMask(true)
    if(starProgOk){
      gl.depthMask(false)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      gl.depthFunc(gl.LEQUAL)
      gl.useProgram(progStar)
      gl.uniformMatrix4fv(locViewStar, false, viewL)
      gl.uniformMatrix4fv(locProjStar, false, proj)
      if(locTimeStar) gl.uniform1f(locTimeStar, performance.now() * 0.001)
      if(locSpeedStar) gl.uniform1f(locSpeedStar, starSpeed)
      if(locSunSpeedStar) gl.uniform1f(locSunSpeedStar, sunSpeed)
      if(locSunFadeStar) gl.uniform1f(locSunFadeStar, sunFade)
      if(locStarMultStar) gl.uniform1f(locStarMultStar, starMult)
      if(locResStar) gl.uniform2f(locResStar, canvas.width, canvas.height)
      if(locMinPxStar) gl.uniform1f(locMinPxStar, (typeof window.SUN_STAR_PX === 'number' && window.SUN_STAR_PX > 0) ? window.SUN_STAR_PX : 10)
      gl.bindVertexArray(vao)
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, N)
      gl.bindVertexArray(null)
      gl.depthMask(true)
      gl.depthFunc(gl.LESS)
    }
    if(fxaaOk && sceneFbOk && window.FXAA_ENABLED !== false){
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.disable(gl.DEPTH_TEST)
      gl.depthMask(false)
      gl.disable(gl.BLEND)
      gl.useProgram(progFx)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, sceneTex)
      gl.uniform1i(locTexFx, 0)
      gl.uniform2f(locRcpFx, 1 / (canvas.width || 1), 1 / (canvas.height || 1))
      gl.bindVertexArray(null)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      gl.bindTexture(gl.TEXTURE_2D, null)
      gl.enable(gl.BLEND)
      gl.enable(gl.DEPTH_TEST)
      gl.depthMask(true)
    } else if(sceneFbOk){
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, sceneFbo)
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null)
      gl.blitFramebuffer(0, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height, gl.COLOR_BUFFER_BIT, gl.NEAREST)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    }
    if(procTexQueue.length > 0){
      const qmi = procTexQueue.shift()
      try{
        if(bodies[qmi].id === 'sun') genSunTexture(qmi)
        else genProcTexture(qmi)
      }catch(eG){}
    }
    drawPlanetLabels()
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
  const inputApi = {
    canvas: canvas,
    get target(){ return target },
    set target(v){ target = v },
    get distance(){ return distance },
    set distance(v){ distance = v },
    get azimuth(){ return azimuth },
    set azimuth(v){ azimuth = v },
    get elevation(){ return elevation },
    set elevation(v){ elevation = v },
    get focusedIdx(){ return focusedIdx },
    set focusedIdx(v){ focusedIdx = v },
    get hovered(){ return hovered },
    set hovered(v){ hovered = v },
    get animActive(){ return animActive },
    set animActive(v){ animActive = v },
    get minDist(){ return (focusedIdx >= 0 && radData[focusedIdx] > 0) ? Math.max(0.0000001, radData[focusedIdx] * 1.05) : 0.0000001 },
    get wireS(){ return wireS },
    set wireS(v){ wireS = v },
    sunIdx: sunIdx,
    updateView: updateView,
    resize: resize,
    normalize: normalize,
    cross: cross,
    pick: pick,
    pickLabel: pickLabel,
    animateTo: animateTo,
    refreshLabel: refreshLabel
  }
  initInput(inputApi)
})()

"use strict";

function makeAtmo(Rg, Rt, Hr, Hm, betaR, betaMext, betaMsca, betaOzone, mieG, sunIrradiance, exposure, opticalSamples) {
  const TRANSMITTANCE_W = 256;
  const TRANSMITTANCE_H = 64;
  const OPTICAL_SAMPLES = (typeof opticalSamples === 'number' && opticalSamples > 0) ? Math.floor(opticalSamples) : 256;
  function ozoneDensity(hKm) {
    if (hKm < 10.0 || hKm > 40.0) return 0.0;
    if (hKm < 25.0) return (hKm - 10.0) / 15.0;
    return (40.0 - hKm) / 15.0;
  }
  function distanceToTop(r, mu) {
    const disc = r * r * (mu * mu - 1.0) + Rt * Rt;
    return Math.max(-r * mu + Math.sqrt(Math.max(disc, 0.0)), 0.0);
  }
  function rayIntersectsGround(r, mu) {
    return mu < 0.0 && (r * r * (mu * mu - 1.0) + Rg * Rg) >= 0.0;
  }
  function getTransmittanceUV(r, mu) {
    const H = Math.sqrt(Rt * Rt - Rg * Rg);
    const rho = Math.sqrt(Math.max(r * r - Rg * Rg, 0.0));
    const d = distanceToTop(r, mu);
    const dMin = Rt - r;
    const dMax = rho + H;
    const u = (d - dMin) / Math.max(dMax - dMin, 1e-9);
    const v = rho / H;
    return [
      0.5 / TRANSMITTANCE_W + u * (1.0 - 1.0 / TRANSMITTANCE_W),
      0.5 / TRANSMITTANCE_H + v * (1.0 - 1.0 / TRANSMITTANCE_H)
    ];
  }
  function getRMuFromUV(u, v) {
    const H = Math.sqrt(Rt * Rt - Rg * Rg);
    const rho = H * v;
    const r = Math.sqrt(rho * rho + Rg * Rg);
    const dMin = Rt - r;
    const dMax = rho + H;
    const d = dMin + u * (dMax - dMin);
    let mu;
    if (d === 0.0) mu = 1.0;
    else mu = (H * H - rho * rho - d * d) / (2.0 * r * d);
    return [r, Math.max(-1.0, Math.min(1.0, mu))];
  }
  function opticalDepthToTop(r, mu) {
    const d = distanceToTop(r, mu);
    const N = OPTICAL_SAMPLES;
    const dx = d / N;
    let sumR = 0, sumM = 0, sumO = 0;
    for (let i = 0; i <= N; i++) {
      const di = i * dx;
      const ri = Math.sqrt(di * di + 2.0 * r * mu * di + r * r);
      const h = Math.max(ri - Rg, 0.0);
      const w = (i === 0 || i === N) ? 0.5 : 1.0;
      sumR += Math.exp(-h / Hr) * w;
      sumM += Math.exp(-h / Hm) * w;
      sumO += ozoneDensity(h) * w;
    }
    return [sumR * dx, sumM * dx, sumO * dx];
  }
  function computeTransmittanceToTop(r, mu) {
    const od = opticalDepthToTop(r, mu);
    return [
      Math.exp(-(betaR[0] * od[0] + betaMext[0] * od[1] + betaOzone[0] * od[2])),
      Math.exp(-(betaR[1] * od[0] + betaMext[1] * od[1] + betaOzone[1] * od[2])),
      Math.exp(-(betaR[2] * od[0] + betaMext[2] * od[1] + betaOzone[2] * od[2]))
    ];
  }
  function buildTransmittanceLUT() {
    const W = TRANSMITTANCE_W, H = TRANSMITTANCE_H;
    const out = new Uint8Array(W * H * 4);
    for (let y = 0; y < H; y++) {
      const vUnit = (y + 0.5) / H;
      const v = (vUnit - 0.5 / H) / (1.0 - 1.0 / H);
      for (let x = 0; x < W; x++) {
        const uUnit = (x + 0.5) / W;
        const u = (uUnit - 0.5 / W) / (1.0 - 1.0 / W);
        const rm = getRMuFromUV(
          Math.max(0, Math.min(1, u)), Math.max(0, Math.min(1, v)));
        const t = computeTransmittanceToTop(rm[0], rm[1]);
        const o = (y * W + x) * 4;
        out[o] = Math.max(0, Math.min(255, Math.round(t[0] * 255)));
        out[o + 1] = Math.max(0, Math.min(255, Math.round(t[1] * 255)));
        out[o + 2] = Math.max(0, Math.min(255, Math.round(t[2] * 255)));
        out[o + 3] = 255;
      }
    }
    return out;
  }
  function sampleLUTBilinear(lut, u, v) {
    const W = TRANSMITTANCE_W, H = TRANSMITTANCE_H;
    const x = Math.max(0, Math.min(W - 1.001, u * W - 0.5));
    const y = Math.max(0, Math.min(H - 1.001, v * H - 0.5));
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const fx = x - x0, fy = y - y0;
    const out = [0, 0, 0];
    for (let c = 0; c < 3; c++) {
      const a = lut[(y0 * W + x0) * 4 + c] / 255;
      const b = lut[(y0 * W + x0 + 1) * 4 + c] / 255;
      const cc = lut[((y0 + 1) * W + x0) * 4 + c] / 255;
      const d = lut[((y0 + 1) * W + x0 + 1) * 4 + c] / 255;
      out[c] = (a * (1 - fx) + b * fx) * (1 - fy) + (cc * (1 - fx) + d * fx) * fy;
    }
    return out;
  }
  function getTransmittanceToTopLUT(lut, r, mu) {
    if (rayIntersectsGround(r, mu)) return [0, 0, 0];
    const uv = getTransmittanceUV(
      Math.max(Rg, Math.min(Rt, r)), Math.max(-1, Math.min(1, mu)));
    return sampleLUTBilinear(lut, uv[0], uv[1]);
  }
  let _tex = null;
  let _lut = null;
  let _ready = false;
  function init(gl) {
    if (_ready) return api;
    _lut = buildTransmittanceLUT();
    _tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, _tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, TRANSMITTANCE_W, TRANSMITTANCE_H,
      0, gl.RGBA, gl.UNSIGNED_BYTE, _lut);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
    _ready = true;
    return api;
  }
  const api = {
    Rg, Rt, Hr, Hm, betaR, betaMsca, betaMext, betaOzone, mieG,
    sunIrradiance, exposure,
    TRANSMITTANCE_W, TRANSMITTANCE_H,
    ozoneDensity, distanceToTop, rayIntersectsGround,
    getTransmittanceUV, getRMuFromUV, opticalDepthToTop,
    computeTransmittanceToTop, buildTransmittanceLUT,
    sampleLUTBilinear, getTransmittanceToTopLUT,
    init,
    get ready() { return _ready; },
    get texture() { return _tex; },
    get lut() { return _lut; }
  };
  return api;
}
const SHr = 8.0;
const SHm = 1.2;
const SbMs = [3.996e-3, 3.996e-3, 3.996e-3];
const SbMe = [4.44e-3, 4.44e-3, 4.44e-3];
const SbO = [0.65e-3, 1.881e-3, 0.085e-3];
const Sg = 0.8;
function BP(Rg, Rt, bR, sun, sky, oz, hm, bMs, bMe, hr) {
  return { Rg: Rg, Rt: Rt, Hr: hr !== undefined ? hr : SHr, Hm: hm !== undefined ? hm : SHm, bR: bR, bMs: bMs || SbMs, bMe: bMe || SbMe, bO: [SbO[0] * oz, SbO[1] * oz, SbO[2] * oz], sun: sun, g: Sg, sky: sky };
}
const EARTH_ATMO = BP(6360.0, 6420.0, [5.8e-3, 13.5e-3, 33.1e-3], 20.0, [0.6, 1.0, 1.8], 1.0);
const VENUS_ATMO = BP(6051.8, 6151.8, [6.5e-3, 6.5e-3, 6.5e-3], 16.0, [1.9, 1.55, 1.05], 0.5);
const MARS_ATMO = BP(3389.5, 3489.0, [3.0e-3, 4.0e-3, 6.5e-3], 16.0, [0.9, 0.85, 0.8], 0.0, 1.2, [8.5e-3, 4.5e-3, 3.0e-3], [4.44e-3, 4.44e-3, 4.44e-3], 8.0);
const SATURN_ATMO = BP(58232.0, 60332.0, [6.5e-3, 5.8e-3, 3.9e-3], 16.0, [1.9, 1.55, 1.05], 0.0, 60.0);
const URANUS_ATMO = BP(25362.0, 26162.0, [3.5e-3, 5.8e-3, 7.6e-3], 14.0, [0.7, 1.1, 1.4], 0.0, 22.0);
const JUPITER_ATMO = BP(69911.0, 72111.0, [5.2e-3, 5.0e-3, 4.4e-3], 15.0, [1.6, 1.5, 1.2], 0.0, 30.0);
const NEPTUNE_ATMO = BP(24622.0, 25522.0, [3.3e-3, 5.4e-3, 8.2e-3], 14.0, [0.55, 1.05, 2.0], 0.0, 22.0);
const TITAN_ATMO = BP(2576.0, 2676.0, [9.0e-3, 4.5e-3, 2.0e-3], 16.0, [2.0, 1.2, 0.6], 0.0);
(() => {
  if(typeof window.ATMO_ENABLED === 'undefined') window.ATMO_ENABLED = true
  if(typeof window.ATMO_EXPOSURE !== 'number') window.ATMO_EXPOSURE = 1.0
  const UN = ['u_view', 'u_proj', 'u_center', 'u_radius', 'u_color', 'u_sun', 'u_emit', 'u_tex', 'u_useTex', 'u_transmittance', 'u_kmPerWorld', 'u_cameraWorld', 'u_sunWorld', 'u_exposure', 'u_atmoRg', 'u_atmoRt', 'u_atmoHr', 'u_atmoHm', 'u_atmoBetaR', 'u_atmoBetaMsca', 'u_atmoBetaMext', 'u_atmoBetaOzone', 'u_atmoSun', 'u_atmoG', 'u_atmoSky'];
  const UA = ['u_view', 'u_proj', 'u_center', 'u_radius', 'u_transmittance', 'u_kmPerWorld', 'u_cameraWorld', 'u_sunWorld', 'u_exposure'];
  const UC = ['u_view', 'u_proj', 'u_center', 'u_radius', 'u_sun', 'u_time', 'u_seed', 'u_cam', 'u_clouds'];
  const UCS = ['u_view', 'u_proj', 'u_center', 'u_radius', 'u_sun', 'u_clouds', 'u_time', 'u_seed', 'u_mult', 'u_frame'];
  const UCB = ['u_basis', 'u_cover', 'u_seedA', 'u_t'];
  const UR = ['u_view', 'u_proj', 'u_center', 'u_radius', 'u_color', 'u_sun', 'u_emit', 'u_tex', 'u_useTex'];
  const CF = { 1: EARTH_ATMO, 2: VENUS_ATMO, 3: MARS_ATMO, 4: SATURN_ATMO, 5: URANUS_ATMO, 6: JUPITER_ATMO, 7: NEPTUNE_ATMO, 8: TITAN_ATMO };
  const ID = { 1: 'earth', 2: 'venus', 3: 'mars', 4: 'saturn', 5: 'uranus', 6: 'jupiter', 7: 'neptune', 8: 'titan' };
  const KEYS = [1, 2, 3, 4, 5, 6, 7, 8];
  let sharedGround = null;
  let whiteTex = null;
  let G = null;
  let kmW = 1;
  let cloudProg = null;
  let cloudU = null;
  let cloudOk = false;
  let cloudTex = null;
  let cloudSeed = Math.random() * Math.PI * 2;
  let cloudShProg = null;
  let cloudShU = null;
  let rockProg = null;
  let rockU = null;
  let rockOk = false;
  const CLOUD_FACES = [
    [0, 0, -1, 0, -1, 0, 1, 0, 0],
    [0, 0, 1, 0, -1, 0, -1, 0, 0],
    [1, 0, 0, 0, 0, 1, 0, 1, 0],
    [1, 0, 0, 0, 0, -1, 0, -1, 0],
    [1, 0, 0, 0, -1, 0, 0, 0, 1],
    [-1, 0, 0, 0, -1, 0, 0, 0, -1]
  ];
  const CLOUD_TARGETS = [0x8515, 0x8516, 0x8517, 0x8518, 0x8519, 0x851A];
  let R = {};
  for (let _ri = 0; _ri < KEYS.length; _ri++) R[KEYS[_ri]] = { pend: null };
  function begin() {
    for (let _bi = 0; _bi < KEYS.length; _bi++) R[KEYS[_bi]].pend = null;
  }
  function allow() {
    return window.ATMO_ENABLED !== false;
  }
  function mkProg(compile, vsS, fsSrc) {
    const p = G.createProgram();
    const f = compile(G.FRAGMENT_SHADER, fsSrc);
    if (!vsS || !f) return { p: p, ok: false };
    G.attachShader(p, vsS);
    G.attachShader(p, f);
    G.linkProgram(p);
    return { p: p, ok: !!G.getProgramParameter(p, G.LINK_STATUS) };
  }
  function grab(p, names) {
    const o = {};
    for (let i = 0; i < names.length; i++) o[names[i]] = G.getUniformLocation(p, names[i]);
    return o;
  }
  function mkLut(P, samples) {
    const m = makeAtmo(P.Rg, P.Rt, P.Hr, P.Hm, P.bR, P.bMe, P.bMs, P.bO, P.g, [P.sun, P.sun, P.sun], 1.0, samples);
    m.init(G);
    return m;
  }
  function setup(gl, compile, vsS, kmPerWorld, bodies) {
    G = gl;
    kmW = kmPerWorld;
    const keys = KEYS;
    const rSU = mkProg(compile, vsS, atmoGroundFSU());
    sharedGround = { prog: rSU.p, ok: rSU.ok, u: null };
    try { if (rSU.ok) sharedGround.u = grab(rSU.p, UN); } catch (erU) { sharedGround.u = null; sharedGround.ok = false; }
    try {
      const rR = mkProg(compile, vsS, rockFS());
      rockProg = rR.p;
      rockOk = rR.ok;
      rockU = rR.ok ? grab(rR.p, UR) : null;
      if (!rockU) rockOk = false;
    } catch (erR) { rockProg = null; rockU = null; rockOk = false; }
    try {
      whiteTex = G.createTexture();
      G.bindTexture(G.TEXTURE_2D, whiteTex);
      G.texImage2D(G.TEXTURE_2D, 0, G.RGBA, 1, 1, 0, G.RGBA, G.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
      G.texParameteri(G.TEXTURE_2D, G.TEXTURE_MIN_FILTER, G.LINEAR);
      G.texParameteri(G.TEXTURE_2D, G.TEXTURE_MAG_FILTER, G.LINEAR);
      G.texParameteri(G.TEXTURE_2D, G.TEXTURE_WRAP_S, G.CLAMP_TO_EDGE);
      G.texParameteri(G.TEXTURE_2D, G.TEXTURE_WRAP_T, G.CLAMP_TO_EDGE);
      G.bindTexture(G.TEXTURE_2D, null);
    } catch (erW) { whiteTex = null; }
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const P = CF[k];
      const haloTransparent = k > 8;
      let rH = null;
      let hu = null;
      if (!haloTransparent) {
        rH = mkProg(compile, vsS, atmoShellFS(P, false));
        try { hu = grab(rH.p, UA); } catch (erH) { hu = null; }
      }
      const e = { P: P, ok: sharedGround.ok, sprog: rH ? rH.p : null, oks: rH ? rH.ok : false, hu: hu, tex: null, ready: false, idx: -1, pend: null, haloTransparent: haloTransparent };
      for (let b = 0; b < bodies.length; b++) if (bodies[b].id === ID[k]) e.idx = b;
      try {
        const needShell = !haloTransparent;
        if (e.ok && sharedGround.u && (!needShell || e.oks)) {
          const samples = haloTransparent ? 32 : 256;
          const m = mkLut(P, samples);
          e.tex = m.texture;
          e.ready = !!(e.tex && m.ready);
        }
      } catch (er) {
        e.tex = null;
        e.ready = false;
      }
      R[k] = e;
    }
    if (typeof window.CLOUD_ENABLED === 'undefined') window.CLOUD_ENABLED = true;
    if (typeof window.CLOUD_COVER !== 'number') window.CLOUD_COVER = 0.9;
    if (typeof window.CLOUD_MULT !== 'number') window.CLOUD_MULT = 1.015;
    try {
      const vsQ = compile(G.VERTEX_SHADER, vsQuadBake);
      const fsB = compile(G.FRAGMENT_SHADER, cloudBakeFS());
      const bakeProg = G.createProgram();
      let bakeOk = false;
      if (vsQ && fsB) {
        G.attachShader(bakeProg, vsQ);
        G.attachShader(bakeProg, fsB);
        G.linkProgram(bakeProg);
        bakeOk = !!G.getProgramParameter(bakeProg, G.LINK_STATUS);
      }
      const rC = mkProg(compile, vsS, cloudRenderFS());
      cloudProg = rC.p;
      cloudOk = rC.ok;
      cloudU = grab(rC.p, UC);
      const rSh = mkProg(compile, vsS, cloudShadowFS());
      cloudShProg = rSh.ok ? rSh.p : null;
      cloudShU = rSh.ok ? grab(rSh.p, UCS) : null;
      cloudSeed = Math.random() * Math.PI * 2;
      if (bakeOk && cloudOk) bakeClouds(bakeProg, cover0());
      else { cloudOk = false; cloudTex = null; }
    } catch (er) {
      cloudProg = null;
      cloudOk = false;
      cloudU = null;
      cloudTex = null;
      cloudShProg = null;
      cloudShU = null;
      try { window.CLOUD_STATUS = { baked: false, error: String(er && er.message || er) }; } catch (erC) {}
    }
  }
  function cloudInfo() {
    let st = null;
    try { st = window.CLOUD_STATUS || null; } catch (erS) { st = null; }
    return { ok: cloudOk, hasProg: !!cloudProg, hasTex: !!cloudTex, status: st };
  }
  function cover0() {
    return (typeof window.CLOUD_COVER === 'number') ? window.CLOUD_COVER : 0.9;
  }
  function bakeClouds(bakeProg, cover) {
    let coarse = false;
    try {
      if (typeof window.CLOUD_BAKE === 'number') coarse = false;
      else if (window.matchMedia && window.matchMedia('(pointer:coarse)').matches) coarse = true;
    } catch (er) {}
    const size = (typeof window.CLOUD_BAKE === 'number' && window.CLOUD_BAKE > 0) ? Math.floor(window.CLOUD_BAKE) : (coarse ? 128 : 256);
    const bu = {};
    const names = ['u_basis', 'u_cover', 'u_seedA', 'u_t'];
    for (let i = 0; i < names.length; i++) bu[names[i]] = G.getUniformLocation(bakeProg, names[i]);
    const tex = G.createTexture();
    G.activeTexture(G.TEXTURE0);
    G.bindTexture(G.TEXTURE_CUBE_MAP, tex);
    for (let f = 0; f < 6; f++) G.texImage2D(CLOUD_TARGETS[f], 0, G.RGBA, size, size, 0, G.RGBA, G.UNSIGNED_BYTE, null);
    G.texParameteri(G.TEXTURE_CUBE_MAP, G.TEXTURE_MIN_FILTER, G.LINEAR);
    G.texParameteri(G.TEXTURE_CUBE_MAP, G.TEXTURE_MAG_FILTER, G.LINEAR);
    G.texParameteri(G.TEXTURE_CUBE_MAP, G.TEXTURE_WRAP_S, G.CLAMP_TO_EDGE);
    G.texParameteri(G.TEXTURE_CUBE_MAP, G.TEXTURE_WRAP_T, G.CLAMP_TO_EDGE);
    try {
      if (G.TEXTURE_WRAP_R) G.texParameteri(G.TEXTURE_CUBE_MAP, G.TEXTURE_WRAP_R, G.CLAMP_TO_EDGE);
    } catch (erW) {}
    const fbo = G.createFramebuffer();
    const prevFbo = G.getParameter(G.FRAMEBUFFER_BINDING);
    const prevVp = G.getParameter(G.VIEWPORT);
    const wasDepth = G.isEnabled(G.DEPTH_TEST);
    const wasBlend = G.isEnabled(G.BLEND);
    G.disable(G.DEPTH_TEST);
    G.disable(G.BLEND);
    G.bindFramebuffer(G.FRAMEBUFFER, fbo);
    G.viewport(0, 0, size, size);
    const bakeVao = G.createVertexArray();
    G.bindVertexArray(bakeVao);
    G.useProgram(bakeProg);
    G.uniform1f(bu['u_cover'], cover);
    G.uniform1f(bu['u_seedA'], cloudSeed);
    const basis = new Float32Array(9);
    let tries = 0;
    let coverage = 0;
    let fboComplete = false;
    let px = null;
    try { px = new Uint8Array(size * size * 4); } catch (erM) { px = null; }
    while (tries < 3) {
      tries++;
      G.uniform1f(bu['u_t'], 1.7 + Math.random() * 20.0);
      fboComplete = true;
      for (let f = 0; f < 6; f++) {
        for (let i = 0; i < 9; i++) basis[i] = CLOUD_FACES[f][i];
        G.uniformMatrix3fv(bu['u_basis'], false, basis);
        G.framebufferTexture2D(G.FRAMEBUFFER, G.COLOR_ATTACHMENT0, CLOUD_TARGETS[f], tex, 0);
        let st = 0;
        try { st = G.checkFramebufferStatus(G.FRAMEBUFFER); } catch (erS) { st = 0; }
        if (st !== G.FRAMEBUFFER_COMPLETE) { fboComplete = false; break; }
        G.drawArrays(G.TRIANGLES, 0, 3);
      }
      if (!fboComplete || !px) { coverage = 0; continue; }
      try {
        G.framebufferTexture2D(G.FRAMEBUFFER, G.COLOR_ATTACHMENT0, CLOUD_TARGETS[0], tex, 0);
        G.readPixels(0, 0, size, size, G.RGBA, G.UNSIGNED_BYTE, px);
      } catch (erR) { coverage = 0; continue; }
      let hit = 0;
      const total = size * size;
      for (let o = 0; o < px.length; o += 4) if (px[o] > 26) hit++;
      coverage = total > 0 ? hit / total : 0;
      if (coverage > 0.02) break;
    }
    try { window.CLOUD_STATUS = { baked: fboComplete, tries: tries, coverage: coverage, size: size }; } catch (erC) {}
    G.activeTexture(G.TEXTURE0);
    G.bindTexture(G.TEXTURE_CUBE_MAP, tex);
    G.texParameteri(G.TEXTURE_CUBE_MAP, G.TEXTURE_MIN_FILTER, G.LINEAR_MIPMAP_LINEAR);
    try { G.generateMipmap(G.TEXTURE_CUBE_MAP); } catch (erG) {}
    G.bindTexture(G.TEXTURE_CUBE_MAP, null);
    G.bindFramebuffer(G.FRAMEBUFFER, prevFbo);
    G.viewport(prevVp[0], prevVp[1], prevVp[2], prevVp[3]);
    G.bindVertexArray(null);
    if (bakeVao) { try { G.deleteVertexArray(bakeVao); } catch (er2) {} }
    if (wasDepth) G.enable(G.DEPTH_TEST);
    if (wasBlend) G.enable(G.BLEND);
    G.deleteFramebuffer(fbo);
    cloudTex = tex;
  }
  function active(mi) {
    if (!allow()) return 0;
    const keys = KEYS;
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const e = R[k];
      if (e && mi === e.idx && e.ok && e.ready) return k;
    }
    return 0;
  }
  function isEarth(mi) {
    return active(mi) === 1;
  }
  function isVenus(mi) {
    return active(mi) === 2;
  }
  function isMars(mi) {
    return active(mi) === 3;
  }
  function isSaturn(mi) {
    return active(mi) === 4;
  }
  function isUranus(mi) {
    return active(mi) === 5;
  }
  function isJupiter(mi) {
    return active(mi) === 6;
  }
  function isNeptune(mi) {
    return active(mi) === 7;
  }
  function isTitan(mi) {
    return active(mi) === 8;
  }
  function drawSurfP(P, transTex, d) {
    if (!sharedGround || !sharedGround.ok || !sharedGround.u) return;
    const u = sharedGround.u;
    G.useProgram(sharedGround.prog);
    G.uniformMatrix4fv(u['u_view'], false, d.viewM);
    G.uniformMatrix4fv(u['u_proj'], false, d.projM);
    G.uniform3f(u['u_center'], d.mpx, d.mpy, d.mpz);
    G.uniform1f(u['u_radius'], d.mrr);
    G.uniform3f(u['u_color'], d.cr, d.cg, d.cb);
    G.uniform1f(u['u_emit'], 0);
    G.uniform3f(u['u_sun'], d.sunW[0], d.sunW[1], d.sunW[2]);
    G.uniform1f(u['u_atmoRg'], P.Rg);
    G.uniform1f(u['u_atmoRt'], P.Rt);
    G.uniform1f(u['u_atmoHr'], P.Hr);
    G.uniform1f(u['u_atmoHm'], P.Hm);
    G.uniform3f(u['u_atmoBetaR'], P.bR[0], P.bR[1], P.bR[2]);
    G.uniform3f(u['u_atmoBetaMsca'], P.bMs[0], P.bMs[1], P.bMs[2]);
    G.uniform3f(u['u_atmoBetaMext'], P.bMe[0], P.bMe[1], P.bMe[2]);
    G.uniform3f(u['u_atmoBetaOzone'], P.bO[0], P.bO[1], P.bO[2]);
    G.uniform3f(u['u_atmoSun'], P.sun, P.sun, P.sun);
    G.uniform1f(u['u_atmoG'], P.g);
    G.uniform3f(u['u_atmoSky'], P.sky[0], P.sky[1], P.sky[2]);
    G.activeTexture(G.TEXTURE0);
    if (d.texOk) {
      G.bindTexture(G.TEXTURE_CUBE_MAP, d.tex);
      G.uniform1i(u['u_tex'], 0);
      G.uniform1f(u['u_useTex'], 1);
    } else {
      G.bindTexture(G.TEXTURE_CUBE_MAP, null);
      G.uniform1f(u['u_useTex'], 0);
    }
    G.activeTexture(G.TEXTURE1);
    G.bindTexture(G.TEXTURE_2D, transTex);
    G.uniform1i(u['u_transmittance'], 1);
    G.uniform1f(u['u_kmPerWorld'], kmW);
    G.uniform3f(u['u_cameraWorld'], d.camW[0], d.camW[1], d.camW[2]);
    G.uniform3f(u['u_sunWorld'], d.sunW[0], d.sunW[1], d.sunW[2]);
    G.uniform1f(u['u_exposure'], d.expo);
    G.bindVertexArray(d.vao);
    G.drawElements(d.wire ? G.LINES : G.TRIANGLES, d.count, G.UNSIGNED_INT, 0);
    G.bindVertexArray(null);
    G.activeTexture(G.TEXTURE0);
  }
  function drawSurf(k, d) {
    const e = R[k];
    if (!e) return;
    drawSurfP(e.P, e.tex, d);
  }
  function rock(d, rKm) {
    if (!allow()) return false;
    if (!rockProg || !rockOk || !rockU) return false;
    const u = rockU;
    G.useProgram(rockProg);
    G.uniformMatrix4fv(u['u_view'], false, d.viewM);
    G.uniformMatrix4fv(u['u_proj'], false, d.projM);
    G.uniform3f(u['u_center'], d.mpx, d.mpy, d.mpz);
    G.uniform1f(u['u_radius'], d.mrr);
    G.uniform3f(u['u_color'], d.cr, d.cg, d.cb);
    G.uniform1f(u['u_emit'], 0);
    G.uniform3f(u['u_sun'], d.sunW[0], d.sunW[1], d.sunW[2]);
    G.activeTexture(G.TEXTURE0);
    if (d.texOk && d.tex) {
      G.bindTexture(G.TEXTURE_CUBE_MAP, d.tex);
      G.uniform1i(u['u_tex'], 0);
      G.uniform1f(u['u_useTex'], 1);
    } else {
      G.bindTexture(G.TEXTURE_CUBE_MAP, null);
      G.uniform1f(u['u_useTex'], 0);
    }
    G.bindVertexArray(d.vao);
    G.drawElements(d.wire ? G.LINES : G.TRIANGLES, d.count, G.UNSIGNED_INT, 0);
    G.bindVertexArray(null);
    G.bindTexture(G.TEXTURE_CUBE_MAP, null);
    G.activeTexture(G.TEXTURE0);
    return true;
  }
  function drawSh(k, d, vao, count, r) {
    const e = R[k];
    if (!e || !e.oks || e.haloTransparent) return;
    const u = e.hu;
    if (!u || !e.sprog) return;
    G.depthMask(false);
    G.disable(G.BLEND);
    G.useProgram(e.sprog);
    G.uniformMatrix4fv(u['u_view'], false, d.viewM);
    G.uniformMatrix4fv(u['u_proj'], false, d.projM);
    G.uniform3f(u['u_center'], d.mpx, d.mpy, d.mpz);
    G.uniform1f(u['u_radius'], r);
    G.activeTexture(G.TEXTURE0);
    G.bindTexture(G.TEXTURE_2D, e.tex);
    G.uniform1i(u['u_transmittance'], 0);
    G.uniform1f(u['u_kmPerWorld'], kmW);
    G.uniform3f(u['u_cameraWorld'], d.camW[0], d.camW[1], d.camW[2]);
    G.uniform3f(u['u_sunWorld'], d.sunW[0], d.sunW[1], d.sunW[2]);
    G.uniform1f(u['u_exposure'], d.expo);
    G.bindVertexArray(vao);
    G.drawElements(G.TRIANGLES, count, G.UNSIGNED_INT, 0);
    G.bindVertexArray(null);
    G.bindTexture(G.TEXTURE_2D, null);
    G.depthMask(true);
    G.activeTexture(G.TEXTURE0);
  }
  function shellR(k, mrr) {
    const P = CF[k];
    return mrr * P.Rt / P.Rg;
  }
  function drawCloud(d) {
    if (!cloudOk || !cloudProg || !cloudU || !cloudTex) return;
    if (window.CLOUD_ENABLED === false) return;
    if (d.wire) return;
    const u = cloudU;
    const mult = (typeof window.CLOUD_MULT === 'number' && window.CLOUD_MULT > 0) ? window.CLOUD_MULT : 1.015;
    G.enable(G.BLEND);
    G.blendFunc(G.SRC_ALPHA, G.ONE_MINUS_SRC_ALPHA);
    G.depthMask(false);
    G.useProgram(cloudProg);
    G.uniformMatrix4fv(u['u_view'], false, d.viewM);
    G.uniformMatrix4fv(u['u_proj'], false, d.projM);
    G.uniform3f(u['u_center'], d.mpx, d.mpy, d.mpz);
    G.uniform1f(u['u_radius'], d.mrr * mult);
    G.uniform3f(u['u_sun'], d.sunW[0], d.sunW[1], d.sunW[2]);
    G.uniform1f(u['u_time'], performance.now() / 1000);
    G.uniform1f(u['u_seed'], cloudSeed);
    G.uniform3f(u['u_cam'], d.camW[0], d.camW[1], d.camW[2]);
    G.activeTexture(G.TEXTURE0);
    G.bindTexture(G.TEXTURE_CUBE_MAP, cloudTex);
    G.uniform1i(u['u_clouds'], 0);
    G.bindVertexArray(d.vao);
    G.drawElements(G.TRIANGLES, d.count, G.UNSIGNED_INT, 0);
    G.bindVertexArray(null);
    G.bindTexture(G.TEXTURE_CUBE_MAP, null);
    G.depthMask(true);
    G.disable(G.BLEND);
  }
  function cloudFrameMat(d) {
    if (d && d.frame) return d.frame;
    return null;
  }
  function drawCloudShadow(d) {
    if (!cloudOk || !cloudShProg || !cloudShU || !cloudTex) return;
    if (window.CLOUD_ENABLED === false) return;
    if (d.wire) return;
    const u = cloudShU;
    const mult = (typeof window.CLOUD_MULT === 'number' && window.CLOUD_MULT > 0) ? window.CLOUD_MULT : 1.015;
    const fm = cloudFrameMat(d);
    if (!fm) return;
    G.enable(G.BLEND);
    G.blendFunc(G.ZERO, G.ONE_MINUS_SRC_COLOR);
    G.depthMask(false);
    G.depthFunc(G.LEQUAL);
    G.useProgram(cloudShProg);
    G.uniformMatrix4fv(u['u_view'], false, d.viewM);
    G.uniformMatrix4fv(u['u_proj'], false, d.projM);
    G.uniform3f(u['u_center'], d.mpx, d.mpy, d.mpz);
    G.uniform1f(u['u_radius'], d.mrr);
    G.uniform3f(u['u_sun'], d.sunW[0], d.sunW[1], d.sunW[2]);
    G.uniform1f(u['u_time'], performance.now() / 1000);
    G.uniform1f(u['u_seed'], cloudSeed);
    G.uniform1f(u['u_mult'], mult);
    G.uniformMatrix3fv(u['u_frame'], false, fm);
    G.activeTexture(G.TEXTURE0);
    G.bindTexture(G.TEXTURE_CUBE_MAP, cloudTex);
    G.uniform1i(u['u_clouds'], 0);
    G.bindVertexArray(d.vao);
    G.drawElements(G.TRIANGLES, d.count, G.UNSIGNED_INT, 0);
    G.bindVertexArray(null);
    G.bindTexture(G.TEXTURE_CUBE_MAP, null);
    G.activeTexture(G.TEXTURE0);
    G.depthFunc(G.LESS);
    G.depthMask(true);
    G.disable(G.BLEND);
  }
  function capture(mi, d) {
    const k = active(mi);
    if (!k) return false;
    drawSurf(k, d);
    if (k === 1) drawCloudShadow(d);
    drawSh(k, d, d.vao, d.count, shellR(k, d.mrr));
    if (k === 1) drawCloud({ mpx: d.mpx, mpy: d.mpy, mpz: d.mpz, mrr: d.mrr, vao: d.vao, count: d.count, wire: d.wire, viewM: d.viewM, projM: d.projM, sunW: d.sunW, camW: d.camW });
    return true;
  }
  function mesh(mi, d) {
    const k = active(mi);
    if (!k) return 0;
    drawSurf(k, d);
    if (k === 1) drawCloudShadow(d);
    if (!R[k].haloTransparent) R[k].pend = { x: d.mpx, y: d.mpy, z: d.mpz, r: shellR(k, d.mrr), vao: d.vao, count: d.count, mrr: d.mrr, wire: d.wire };
    return k;
  }
  function shells(d) {
    const keys = KEYS;
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const e = R[k];
      const sh = e.pend;
      if (sh && e.ready && e.oks && allow()) drawSh(k, { mpx: sh.x, mpy: sh.y, mpz: sh.z, viewM: d.viewM, projM: d.projM, sunW: d.sunW, camW: d.camW, expo: d.expo }, sh.vao, sh.count, sh.r);
    }
    const e1 = R[1];
    const sh1 = e1 && e1.pend;
    if (sh1 && e1.ready && allow()) drawCloud({ mpx: sh1.x, mpy: sh1.y, mpz: sh1.z, mrr: sh1.mrr, vao: sh1.vao, count: sh1.count, wire: sh1.wire, viewM: d.viewM, projM: d.projM, sunW: d.sunW, camW: d.camW });
  }
  window.PATMO = {
    setup: setup,
    begin: begin,
    capture: capture,
    mesh: mesh,
    shells: shells,
    isEarth: isEarth,
    isVenus: isVenus,
    isMars: isMars,
    isSaturn: isSaturn,
    isUranus: isUranus,
    isJupiter: isJupiter,
    isNeptune: isNeptune,
    isTitan: isTitan,
    rock: rock,
    cloudInfo: cloudInfo
  };
})();
if (typeof window !== "undefined") { window.makeAtmo = makeAtmo; }
if (typeof module !== "undefined" && module.exports) module.exports = makeAtmo;

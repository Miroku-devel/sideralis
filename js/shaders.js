const vsSource = `#version 300 es
in vec3 a_pos;
in vec2 a_quad;
in float a_radius;
in vec3 a_color;
uniform mat4 u_view;
uniform mat4 u_proj;
uniform float u_starMult;
uniform vec2 u_resolution;
uniform float u_starMinPx;
out vec3 v_color;
out vec2 v_quad;
void main(){
  vec4 viewPos = u_view * vec4(a_pos, 1.0);
  float r = a_radius;
  if(a_color.r > 0.99 && a_color.g > 0.99 && a_color.b > 0.99) r *= u_starMult;
  else if(a_color.r > 0.99 && a_color.g > 0.90 && a_color.g < 0.94 && a_color.b > 0.18 && a_color.b < 0.22){
    float depth = max(-viewPos.z, 1e-9);
    float pxPerWorld = u_proj[1][1] * 0.5 * u_resolution.y / depth;
    float pxSize = r * 2.0 * pxPerWorld;
    if(pxSize < u_starMinPx) r *= (u_starMinPx / max(pxSize, 1e-9));
  }
  viewPos.xy += a_quad * r;
  gl_Position = u_proj * viewPos;
  v_color = a_color;
  v_quad = a_quad;
}`
const fsSource = `#version 300 es
precision highp float;
in vec3 v_color;
in vec2 v_quad;
out vec4 outColor;
void main(){
  bool isWhite = v_color.r > 0.99 && v_color.g > 0.99 && v_color.b > 0.99;
  bool isSun = !isWhite && v_color.r > 0.99 && v_color.g > 0.90 && v_color.g < 0.94 && v_color.b > 0.18 && v_color.b < 0.22;
  if(isWhite || isSun) discard;
  float d = length(v_quad);
  if(d > 1.0) discard;
  float aa = fwidth(d);
  float alpha = 1.0 - smoothstep(1.0 - aa, 1.0, d);
  vec3 col = v_color * (0.9 + 0.1 * (1.0 - d));
  outColor = vec4(col, alpha);
}`
const fsStar = `#version 300 es
precision highp float;
in vec3 v_color;
in vec2 v_quad;
uniform float u_time;
uniform float u_starSpeed;
uniform float u_sunSpeed;
uniform float u_sunFade;
out vec4 outColor;
float cheap_star(vec2 uv, float anim)
{
    uv = abs(uv);
    vec2 pos = min(uv.xy/uv.yx, anim);
    float p = (2.0 - pos.x - pos.y);
    return (2.0+p*(p*p-1.5)) / max(uv.x+uv.y, 1e-4);
}
void main(){
  bool isWhite = v_color.r > 0.99 && v_color.g > 0.99 && v_color.b > 0.99;
  bool isSun = !isWhite && v_color.r > 0.99 && v_color.g > 0.90 && v_color.g < 0.94 && v_color.b > 0.18 && v_color.b < 0.22;
  if(!isWhite && !isSun) discard;
  float st = u_time * (isSun ? u_sunSpeed : u_starSpeed);
  float anim = sin(st * 12.0) * 0.02 + 1.0;
  float sc = 2.0 * (cos(st * 2.0) - 2.5);
  sc = -9.1 + (sc + 5.0) * 0.05;
  vec2 suv = v_quad * sc;
  float s = cheap_star(suv, anim);
  vec3 col = s * vec3(1.0);
  if(isSun) col *= (0.85 + 0.15 * sin(st * 6.0)) * u_sunFade;
  if(isWhite) col *= 0.85 + 0.15 * sin(st * 6.0);
  float lum = max(col.r, max(col.g, col.b));
  float d = length(v_quad);
  float fade = 1.0 - smoothstep(0.55, 1.0, d);
  float a = clamp(lum, 0.0, 1.0) * fade;
  if(a < 0.004) discard;
  outColor = vec4(col * fade, a);
}`
const vsPoint = `#version 300 es
in vec3 a_pos;
in vec3 a_color;
in float a_radius;
uniform mat4 u_view;
uniform mat4 u_proj;
uniform vec2 u_resolution;
uniform float u_starMult;
out vec3 v_color;
void main(){
  if(a_radius <= 0.0){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }
  vec4 viewPos = u_view * vec4(a_pos, 1.0);
  gl_Position = u_proj * viewPos;
  float dist = length(viewPos.xyz);
  float w = u_resolution.y;
  float r = a_radius;
  float sz = r * w * 0.5 * 5.15;
  if(a_color.r > 0.99 && a_color.g > 0.99 && a_color.b > 0.99) sz *= u_starMult;
  float s = clamp(sz / dist, 0.0, 6.0);
  gl_PointSize = s;
  v_color = a_color;
}`
const fsPoint = `#version 300 es
precision highp float;
in vec3 v_color;
uniform float u_time;
uniform float u_starSpeed;
out vec4 outColor;
float cheap_star(vec2 uv, float anim)
{
    uv = abs(uv);
    vec2 pos = min(uv.xy/uv.yx, anim);
    float p = (2.0 - pos.x - pos.y);
    return (2.0+p*(p*p-1.5)) / max(uv.x+uv.y, 1e-4);
}
void main(){
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  if(v_color.r > 0.99 && v_color.g > 0.99 && v_color.b > 0.99){
    float st = u_time * u_starSpeed;
    float anim = sin(st * 12.0) * 0.02 + 1.0;
    float sc = 2.0 * (cos(st * 2.0) - 2.5);
    sc = -9.1 + (sc + 5.0) * 0.05;
    vec2 suv = c * sc;
    float s = cheap_star(suv, anim);
    vec3 col = s * vec3(1.0);
    col *= 0.85 + 0.15 * sin(st * 6.0);
    float lum = max(col.r, max(col.g, col.b));
    float d = length(c);
    float fade = 1.0 - smoothstep(0.55, 1.0, d);
    float a = clamp(lum, 0.0, 1.0) * fade;
    if(a < 0.004) discard;
    outColor = vec4(col * fade, a);
    return;
  }
  float d = length(c);
  if(d > 1.0) discard;
  float aa = fwidth(d);
  float alpha = 1.0 - smoothstep(1.0 - aa, 1.0, d);
  bool isSun = v_color.r > 0.99 && v_color.g > 0.90 && v_color.g < 0.94 && v_color.b > 0.18 && v_color.b < 0.22;
  outColor = vec4(isSun ? vec3(1.0) : v_color, alpha);
}`
const vsLine = `#version 300 es
in vec3 a_pos;
uniform mat4 u_view;
uniform mat4 u_proj;
void main(){
  gl_Position = u_proj * u_view * vec4(a_pos, 1.0);
}`
const fsLine = `#version 300 es
precision highp float;
uniform vec3 u_color;
out vec4 outColor;
void main(){
  outColor = vec4(u_color, 0.28);
}`
const vsSph = `#version 300 es
layout(location = 0) in vec3 a_pos;
layout(location = 1) in vec3 a_dir0;
uniform vec3 u_center;
uniform float u_radius;
uniform mat4 u_view;
uniform mat4 u_proj;
out vec3 v_n;
out vec3 v_w;
out vec3 v_dir0;
void main(){
  vec3 w = u_center + a_pos * u_radius;
  v_w = w;
  v_n = a_pos;
  v_dir0 = a_dir0;
  gl_Position = u_proj * u_view * vec4(w, 1.0);
}`
const fsSph = `#version 300 es
precision highp float;
in vec3 v_n;
in vec3 v_w;
in vec3 v_dir0;
uniform vec3 u_color;
uniform vec3 u_sun;
uniform float u_emit;
uniform samplerCube u_tex;
uniform float u_useTex;
out vec4 outColor;
void main(){
  vec3 n = normalize(v_n);
  vec3 l = normalize(u_sun - v_w);
  float ndl = dot(n, l);
  float aa = fwidth(ndl);
  float d = smoothstep(0.08 - aa, 0.24 + aa, ndl);
  vec3 base = u_useTex > 0.5 ? texture(u_tex, v_dir0).rgb : u_color;
  vec3 shaded = base * d;
  vec3 col = mix(shaded, base, u_emit);
  outColor = vec4(col, 1.0);
}`
const vsImpostor = `#version 300 es
in vec2 a_quad;
uniform vec3 u_center;
uniform float u_radius;
uniform float u_dist;
uniform float u_starMix;
uniform float u_starMult;
uniform mat4 u_view;
uniform mat4 u_proj;
uniform vec2 u_resolution;
out vec2 v_quad;
void main(){
  vec4 viewPos = u_view * vec4(u_center, 1.0);
  float r = u_radius;
  float h = u_dist;
  float hs = r / sqrt(max(1.0 - (r / h) * (r / h), 1e-12));
  hs *= mix(1.0, u_starMult, u_starMix);
  float depth = max(-viewPos.z, 1e-9);
  float pxPerWorld = u_proj[1][1] * 0.5 * u_resolution.y / depth;
  float pxSize = hs * 2.0 * pxPerWorld;
  float minPx = 2.5 * u_starMix;
  if(pxSize < minPx) hs *= (minPx / max(pxSize, 1e-9));
  viewPos.xy += a_quad * hs;
  gl_Position = u_proj * viewPos;
  v_quad = a_quad;
}`
const fsImpostor = `#version 300 es
precision highp float;
in vec2 v_quad;
uniform sampler2D u_tex;
uniform float u_radius;
uniform float u_dist;
uniform float u_boost;
uniform float u_white;
uniform float u_cutout;
uniform float u_time;
uniform float u_starSpeed;
uniform float u_starMix;
out vec4 outColor;
float cheap_star(vec2 uv, float anim)
{
    uv = abs(uv);
    vec2 pos = min(uv.xy/uv.yx, anim);
    float p = (2.0 - pos.x - pos.y);
    return (2.0+p*(p*p-1.5)) / max(uv.x+uv.y, 1e-4);
}
void main(){
  vec2 p = v_quad * 0.5 + 0.5;
  float d = length(v_quad);
  float rr = sqrt(max(u_dist * u_dist - u_radius * u_radius, 0.0)) / u_dist;
  if(d > rr) discard;
  float aa = fwidth(d);
  float alpha = 1.0 - smoothstep(rr - aa, rr, d);
  vec4 t = texture(u_tex, p);
  vec3 iw = mix(t.rgb * u_boost, vec3(1.0), u_white);
  float ia = t.a * alpha;
  if(u_cutout > 0.5 && ia < 0.004) discard;
  float st = u_time * u_starSpeed;
  float anim = sin(st * 12.0) * 0.02 + 1.0;
  float sc = 2.0 * (cos(st * 2.0) - 2.5);
  sc = -9.1 + (sc + 5.0) * 0.05;
  float s = cheap_star(v_quad * sc, anim);
  vec3 scol = s * vec3(1.0);
  scol *= 0.85 + 0.15 * sin(st * 6.0);
  float slum = max(scol.r, max(scol.g, scol.b));
  float sFade = 1.0 - smoothstep(0.55, 1.0, d);
  float sa = clamp(slum, 0.0, 1.0) * sFade;
  vec3 sout = scol * sFade;
  vec3 outc = mix(iw, sout, u_starMix);
  float outa = mix(ia, sa, u_starMix);
  if(outa < 0.004 * u_starMix) discard;
  outColor = vec4(outc, outa);
}`
const vsRingSource = `#version 300 es
in float a_ang;
in float a_frac;
uniform vec3 u_center;
uniform vec3 u_e1;
uniform vec3 u_e2;
uniform vec2 u_radii;
uniform mat4 u_view;
uniform mat4 u_proj;
out vec2 v_uv;
out vec3 v_w;
void main(){
  float c = cos(a_ang);
  float s = sin(a_ang);
  float r = mix(u_radii.x, u_radii.y, a_frac);
  vec3 w = u_center + (u_e1 * c + u_e2 * s) * r;
  v_w = w;
  v_uv = vec2(a_frac, 0.5);
  gl_Position = u_proj * u_view * vec4(w, 1.0);
}`
const fsRingSource = `#version 300 es
precision highp float;
in vec2 v_uv;
in vec3 v_w;
uniform sampler2D u_tex;
uniform vec3 u_sun;
uniform vec3 u_norm;
uniform vec3 u_center;
uniform float u_sradius;
out vec4 outColor;
void main(){
  vec4 t = texture(u_tex, v_uv);
  vec3 l = normalize(u_sun - v_w);
  float d = abs(dot(normalize(u_norm), l));
  float shadow = 1.0;
  vec3 oc = v_w - u_center;
  float b = dot(oc, l);
  float disc = b * b - (dot(oc, oc) - u_sradius * u_sradius);
  if(disc > 0.0){
    float tEnter = -b - sqrt(disc);
    if(tEnter > 0.0){
      float rPerp = sqrt(max(dot(oc, oc) - b * b, 0.0));
      float pen = smoothstep(u_sradius, u_sradius * 0.92, rPerp);
      shadow = mix(1.0, 0.06, pen);
    }
  }
  vec3 col = t.rgb * (0.04 + 0.96 * d) * shadow;
  outColor = vec4(col, t.a);
}`
function atmoFloat(v) {
  const s = String(v);
  if (s.indexOf('.') < 0 && s.indexOf('e') < 0 && s.indexOf('E') < 0) return s + '.0';
  return s;
}
function atmoCommonFor(P) {
  return '\n' +
  'const float ATMO_Rg = ' + atmoFloat(P.Rg) + ';\n' +
  'const float ATMO_Rt = ' + atmoFloat(P.Rt) + ';\n' +
  'const float ATMO_Hr = ' + atmoFloat(P.Hr) + ';\n' +
  'const float ATMO_Hm = ' + atmoFloat(P.Hm) + ';\n' +
  'const vec3 ATMO_betaR = vec3(' + atmoFloat(P.bR[0]) + ', ' + atmoFloat(P.bR[1]) + ', ' + atmoFloat(P.bR[2]) + ');\n' +
  'const vec3 ATMO_betaMsca = vec3(' + atmoFloat(P.bMs[0]) + ', ' + atmoFloat(P.bMs[1]) + ', ' + atmoFloat(P.bMs[2]) + ');\n' +
  'const vec3 ATMO_betaMext = vec3(' + atmoFloat(P.bMe[0]) + ', ' + atmoFloat(P.bMe[1]) + ', ' + atmoFloat(P.bMe[2]) + ');\n' +
  'const vec3 ATMO_betaOzone = vec3(' + atmoFloat(P.bO[0]) + ', ' + atmoFloat(P.bO[1]) + ', ' + atmoFloat(P.bO[2]) + ');\n' +
  'const vec3 ATMO_SUN = vec3(' + atmoFloat(P.sun) + ', ' + atmoFloat(P.sun) + ', ' + atmoFloat(P.sun) + ');\n' +
  'const float ATMO_G = ' + atmoFloat(P.g) + ';\n' +
  'const float ATMO_PI = 3.14159265;\n' +
  'uniform sampler2D u_transmittance;\n' +
  'uniform float u_kmPerWorld;\n' +
  'uniform vec3 u_cameraWorld;\n' +
  'uniform vec3 u_sunWorld;\n' +
  'uniform vec3 u_center;\n' +
  'uniform float u_exposure;\n' +
  'float atmoOzone(float h){\n' +
  '  if(h < 10.0 || h > 40.0) return 0.0;\n' +
  '  if(h < 25.0) return (h - 10.0) / 15.0;\n' +
  '  return (40.0 - h) / 15.0;\n' +
  '}\n' +
  'float atmoDistToTop(float r, float mu){\n' +
  '  float disc = r * r * (mu * mu - 1.0) + ATMO_Rt * ATMO_Rt;\n' +
  '  return max(-r * mu + sqrt(max(disc, 0.0)), 0.0);\n' +
  '}\n' +
  'bool atmoRayGround(float r, float mu){\n' +
  '  return mu < 0.0 && (r * r * (mu * mu - 1.0) + ATMO_Rg * ATMO_Rg) >= 0.0;\n' +
  '}\n' +
  'vec3 atmoTransTop(float r, float mu){\n' +
  '  if(atmoRayGround(r, mu)) return vec3(0.0);\n' +
  '  float H = sqrt(ATMO_Rt * ATMO_Rt - ATMO_Rg * ATMO_Rg);\n' +
  '  float rho = sqrt(max(r * r - ATMO_Rg * ATMO_Rg, 0.0));\n' +
  '  float d = atmoDistToTop(r, mu);\n' +
  '  float dMin = ATMO_Rt - r;\n' +
  '  float dMax = rho + H;\n' +
  '  float u = (d - dMin) / max(dMax - dMin, 1e-6);\n' +
  '  float v = rho / max(H, 1e-6);\n' +
  '  u = 0.5 / 256.0 + clamp(u, 0.0, 1.0) * (1.0 - 1.0 / 256.0);\n' +
  '  v = 0.5 / 64.0 + clamp(v, 0.0, 1.0) * (1.0 - 1.0 / 64.0);\n' +
  '  return texture(u_transmittance, vec2(u, v)).rgb;\n' +
  '}\n' +
  'vec3 atmoTransTopSoft(float r, float mu){\n' +
  '  float rr = max(r, 1e-3);\n' +
  '  float q = clamp(ATMO_Rg / rr, 0.0, 1.0);\n' +
  '  float muH = -sqrt(max(1.0 - q * q, 0.0));\n' +
  '  float wN = -0.10;\n' +
  '  float wD = 1.0;\n' +
  '  if(mu < muH - wN) return vec3(0.0);\n' +
  '  if(mu > muH + wD) return atmoTransTop(r, mu);\n' +
  '  float f = (mu - (muH - wN)) / max(wN + wD, 1e-6);\n' +
  '  f = f * f * (3.0 - 2.0 * f);\n' +
  '  return atmoTransTop(r, muH + wD) * f;\n' +
  '}\n' +
  'float atmoPhaseR(float nu){\n' +
  '  return 3.0 / (16.0 * ATMO_PI) * (1.0 + nu * nu);\n' +
  '}\n' +
  'float atmoPhaseM(float nu){\n' +
  '  float g = ATMO_G;\n' +
  '  float k = 3.0 / (8.0 * ATMO_PI) * (1.0 - g * g) / (2.0 + g * g);\n' +
  '  return k * (1.0 + nu * nu) / pow(max(1.0 + g * g - 2.0 * g * nu, 1e-4), 1.5);\n' +
  '}\n' +
  'vec3 atmoTone(vec3 hdr){\n' +
  '  return pow(vec3(1.0) - exp(-max(hdr, vec3(0.0)) * u_exposure), vec3(1.0 / 2.2));\n' +
  '}\n' +
  'void atmoMarch(vec3 start, vec3 dir, float len, vec3 sunDir, out vec3 scatter, out vec3 trans){\n' +
  '  scatter = vec3(0.0);\n' +
  '  trans = vec3(1.0);\n' +
  '  if(len <= 0.0) return;\n' +
  '  float dt = len / 2.0;\n' +
  '  vec3 tView = vec3(1.0);\n' +
  '  vec3 sumR = vec3(0.0);\n' +
  '  vec3 sumM = vec3(0.0);\n' +
  '  for(int i = 0; i < 2; i++){\n' +
  '    float t = (float(i) + 0.5) * dt;\n' +
  '    vec3 pos = start + dir * t;\n' +
  '    float r = max(length(pos), 1e-4);\n' +
  '    float h = max(r - ATMO_Rg, 0.0);\n' +
  '    float dR = exp(-h / ATMO_Hr);\n' +
  '    float dM = exp(-h / ATMO_Hm);\n' +
  '    float muS = dot(pos, sunDir) / r;\n' +
  '    vec3 sunT = atmoTransTopSoft(r, muS);\n' +
  '    sumR += tView * sunT * (dR * dt);\n' +
  '    sumM += tView * sunT * (dM * dt);\n' +
  '    vec3 ext = ATMO_betaR * dR + ATMO_betaMext * dM + ATMO_betaOzone * atmoOzone(h);\n' +
  '    tView *= exp(-ext * dt);\n' +
  '  }\n' +
  '  trans = tView;\n' +
  '  float nu = dot(dir, sunDir);\n' +
  '  scatter = ATMO_SUN * (sumR * ATMO_betaR * atmoPhaseR(nu) + sumM * ATMO_betaMsca * atmoPhaseM(nu));\n' +
  '}\n';
}
function atmoCommonForU() {
  return '\n' +
  'uniform float u_atmoRg;\n' +
  'uniform float u_atmoRt;\n' +
  'uniform float u_atmoHr;\n' +
  'uniform float u_atmoHm;\n' +
  'uniform vec3 u_atmoBetaR;\n' +
  'uniform vec3 u_atmoBetaMsca;\n' +
  'uniform vec3 u_atmoBetaMext;\n' +
  'uniform vec3 u_atmoBetaOzone;\n' +
  'uniform vec3 u_atmoSun;\n' +
  'uniform float u_atmoG;\n' +
  'uniform vec3 u_atmoSky;\n' +
  'const float ATMO_PI = 3.14159265;\n' +
  'uniform sampler2D u_transmittance;\n' +
  'uniform float u_kmPerWorld;\n' +
  'uniform vec3 u_cameraWorld;\n' +
  'uniform vec3 u_sunWorld;\n' +
  'uniform vec3 u_center;\n' +
  'uniform float u_exposure;\n' +
  'float atmoOzone(float h){\n' +
  '  if(h < 10.0 || h > 40.0) return 0.0;\n' +
  '  if(h < 25.0) return (h - 10.0) / 15.0;\n' +
  '  return (40.0 - h) / 15.0;\n' +
  '}\n' +
  'float atmoDistToTop(float r, float mu){\n' +
  '  float disc = r * r * (mu * mu - 1.0) + u_atmoRt * u_atmoRt;\n' +
  '  return max(-r * mu + sqrt(max(disc, 0.0)), 0.0);\n' +
  '}\n' +
  'bool atmoRayGround(float r, float mu){\n' +
  '  return mu < 0.0 && (r * r * (mu * mu - 1.0) + u_atmoRg * u_atmoRg) >= 0.0;\n' +
  '}\n' +
  'vec3 atmoTransTop(float r, float mu){\n' +
  '  if(atmoRayGround(r, mu)) return vec3(0.0);\n' +
  '  float H = sqrt(u_atmoRt * u_atmoRt - u_atmoRg * u_atmoRg);\n' +
  '  float rho = sqrt(max(r * r - u_atmoRg * u_atmoRg, 0.0));\n' +
  '  float d = atmoDistToTop(r, mu);\n' +
  '  float dMin = u_atmoRt - r;\n' +
  '  float dMax = rho + H;\n' +
  '  float u = (d - dMin) / max(dMax - dMin, 1e-6);\n' +
  '  float v = rho / max(H, 1e-6);\n' +
  '  u = 0.5 / 256.0 + clamp(u, 0.0, 1.0) * (1.0 - 1.0 / 256.0);\n' +
  '  v = 0.5 / 64.0 + clamp(v, 0.0, 1.0) * (1.0 - 1.0 / 64.0);\n' +
  '  return texture(u_transmittance, vec2(u, v)).rgb;\n' +
  '}\n' +
  'vec3 atmoTransTopSoft(float r, float mu){\n' +
  '  float rr = max(r, 1e-3);\n' +
  '  float q = clamp(u_atmoRg / rr, 0.0, 1.0);\n' +
  '  float muH = -sqrt(max(1.0 - q * q, 0.0));\n' +
  '  float wN = -0.10;\n' +
  '  float wD = 1.0;\n' +
  '  if(mu < muH - wN) return vec3(0.0);\n' +
  '  if(mu > muH + wD) return atmoTransTop(r, mu);\n' +
  '  float f = (mu - (muH - wN)) / max(wN + wD, 1e-6);\n' +
  '  f = f * f * (3.0 - 2.0 * f);\n' +
  '  return atmoTransTop(r, muH + wD) * f;\n' +
  '}\n' +
  'float atmoPhaseR(float nu){\n' +
  '  return 3.0 / (16.0 * ATMO_PI) * (1.0 + nu * nu);\n' +
  '}\n' +
  'float atmoPhaseM(float nu){\n' +
  '  float g = u_atmoG;\n' +
  '  float k = 3.0 / (8.0 * ATMO_PI) * (1.0 - g * g) / (2.0 + g * g);\n' +
  '  return k * (1.0 + nu * nu) / pow(max(1.0 + g * g - 2.0 * g * nu, 1e-4), 1.5);\n' +
  '}\n' +
  'vec3 atmoTone(vec3 hdr){\n' +
  '  return pow(vec3(1.0) - exp(-max(hdr, vec3(0.0)) * u_exposure), vec3(1.0 / 2.2));\n' +
  '}\n' +
  'void atmoMarch(vec3 start, vec3 dir, float len, vec3 sunDir, out vec3 scatter, out vec3 trans){\n' +
  '  scatter = vec3(0.0);\n' +
  '  trans = vec3(1.0);\n' +
  '  if(len <= 0.0) return;\n' +
  '  float dt = len / 2.0;\n' +
  '  vec3 tView = vec3(1.0);\n' +
  '  vec3 sumR = vec3(0.0);\n' +
  '  vec3 sumM = vec3(0.0);\n' +
  '  for(int i = 0; i < 2; i++){\n' +
  '    float t = (float(i) + 0.5) * dt;\n' +
  '    vec3 pos = start + dir * t;\n' +
  '    float r = max(length(pos), 1e-4);\n' +
  '    float h = max(r - u_atmoRg, 0.0);\n' +
  '    float dR = exp(-h / u_atmoHr);\n' +
  '    float dM = exp(-h / u_atmoHm);\n' +
  '    float muS = dot(pos, sunDir) / r;\n' +
  '    vec3 sunT = atmoTransTopSoft(r, muS);\n' +
  '    sumR += tView * sunT * (dR * dt);\n' +
  '    sumM += tView * sunT * (dM * dt);\n' +
  '    vec3 ext = u_atmoBetaR * dR + u_atmoBetaMext * dM + u_atmoBetaOzone * atmoOzone(h);\n' +
  '    tView *= exp(-ext * dt);\n' +
  '  }\n' +
  '  trans = tView;\n' +
  '  float nu = dot(dir, sunDir);\n' +
  '  scatter = u_atmoSun * (sumR * u_atmoBetaR * atmoPhaseR(nu) + sumM * u_atmoBetaMsca * atmoPhaseM(nu));\n' +
  '}\n';
}
function atmoGroundFSU() {
  return '#version 300 es\n' +
  'precision highp float;\n' +
  'in vec3 v_n;\n' +
  'in vec3 v_w;\n' +
  'in vec3 v_dir0;\n' +
  'uniform vec3 u_color;\n' +
  'uniform vec3 u_sun;\n' +
  'uniform float u_emit;\n' +
  'uniform samplerCube u_tex;\n' +
  'uniform float u_useTex;\n' +
  atmoCommonForU() +
  'out vec4 outColor;\n' +
  'void main(){\n' +
  '  vec3 n = normalize(v_n);\n' +
  '  vec3 base = u_useTex > 0.5 ? texture(u_tex, v_dir0).rgb : u_color;\n' +
  '  if(u_emit > 0.5){ outColor = vec4(base, 1.0); return; }\n' +
  '  vec3 sunDir = normalize(u_sunWorld - u_center);\n' +
  '  vec3 camLocal = (u_cameraWorld - u_center) * u_kmPerWorld;\n' +
  '  float rCam = length(camLocal);\n' +
  '  if(rCam < u_atmoRg){\n' +
  '    vec3 l0 = normalize(u_sun - v_w);\n' +
  '    float ndotl = dot(n, l0);\n' +
  '    float d0t = smoothstep(-0.1, 0.5, ndotl);\n' +
  '    float d0 = d0t * d0t * d0t * (d0t * (d0t * 6.0 - 15.0) + 10.0);\n' +
  '    outColor = vec4(base * d0, 1.0);\n' +
  '    return;\n' +
  '  }\n' +
  '  vec3 fragLocal = n * u_atmoRg;\n' +
  '  vec3 viewLocal = fragLocal - camLocal;\n' +
  '  float viewLen = max(length(viewLocal), 1e-6);\n' +
  '  vec3 viewDir = viewLocal / viewLen;\n' +
  '  float muS = dot(n, sunDir);\n' +
  '  float penT = smoothstep(-0.1, 0.5, muS);\n' +
  '  float ndlS = penT * penT * penT * (penT * (penT * 6.0 - 15.0) + 10.0);\n' +
  '  vec3 sunT = atmoTransTopSoft(u_atmoRg, muS);\n' +
  '  vec3 skyIrr = u_atmoSky * ndlS;\n' +
  '  vec3 albedo = pow(max(base, vec3(0.0)), vec3(2.2));\n' +
  '  vec3 groundRad = albedo * (1.0 / ATMO_PI) * (u_atmoSun * sunT * ndlS + skyIrr);\n' +
  '  vec3 startLocal = camLocal;\n' +
  '  float segLen = viewLen;\n' +
  '  if(rCam > u_atmoRt){\n' +
  '    float b = dot(camLocal, viewDir);\n' +
  '    float c = dot(camLocal, camLocal) - u_atmoRt * u_atmoRt;\n' +
  '    float disc = b * b - c;\n' +
  '    if(disc < 0.0){ outColor = vec4(atmoTone(groundRad), 1.0); return; }\n' +
  '    float tEnter = max(-b - sqrt(max(disc, 0.0)), 0.0);\n' +
  '    startLocal = camLocal + viewDir * tEnter;\n' +
  '    segLen = max(viewLen - tEnter, 0.0);\n' +
  '  }\n' +
  '  vec3 scatter;\n' +
  '  vec3 tView;\n' +
  '  atmoMarch(startLocal, viewDir, segLen, sunDir, scatter, tView);\n' +
  '  outColor = vec4(atmoTone(groundRad * tView + scatter), 1.0);\n' +
  '}';
}
function atmoGroundFS(P, sky) {
  return '#version 300 es\n' +
  'precision highp float;\n' +
  'in vec3 v_n;\n' +
  'in vec3 v_w;\n' +
  'in vec3 v_dir0;\n' +
  'uniform vec3 u_color;\n' +
  'uniform vec3 u_sun;\n' +
  'uniform float u_emit;\n' +
  'uniform samplerCube u_tex;\n' +
  'uniform float u_useTex;\n' +
  atmoCommonFor(P) +
  'out vec4 outColor;\n' +
  'void main(){\n' +
  '  vec3 n = normalize(v_n);\n' +
  '  vec3 base = u_useTex > 0.5 ? texture(u_tex, v_dir0).rgb : u_color;\n' +
  '  if(u_emit > 0.5){ outColor = vec4(base, 1.0); return; }\n' +
  '  vec3 sunDir = normalize(u_sunWorld - u_center);\n' +
  '  vec3 camLocal = (u_cameraWorld - u_center) * u_kmPerWorld;\n' +
  '  float rCam = length(camLocal);\n' +
  '  if(rCam < ATMO_Rg){\n' +
  '    vec3 l0 = normalize(u_sun - v_w);\n' +
  '    float ndotl = dot(n, l0);\n' +
  '    float d0t = smoothstep(-0.1, 0.5, ndotl);\n' +
  '    float d0 = d0t * d0t * d0t * (d0t * (d0t * 6.0 - 15.0) + 10.0);\n' +
  '    outColor = vec4(base * d0, 1.0);\n' +
  '    return;\n' +
  '  }\n' +
  '  vec3 fragLocal = n * ATMO_Rg;\n' +
  '  vec3 viewLocal = fragLocal - camLocal;\n' +
  '  float viewLen = max(length(viewLocal), 1e-6);\n' +
  '  vec3 viewDir = viewLocal / viewLen;\n' +
  '  float muS = dot(n, sunDir);\n' +
  '  float penT = smoothstep(-0.1, 0.5, muS);\n' +
  '  float ndlS = penT * penT * penT * (penT * (penT * 6.0 - 15.0) + 10.0);\n' +
  '  vec3 sunT = atmoTransTopSoft(ATMO_Rg, muS);\n' +
  '  vec3 skyIrr = vec3(' + atmoFloat(sky[0]) + ', ' + atmoFloat(sky[1]) + ', ' + atmoFloat(sky[2]) + ') * ndlS;\n' +
  '  vec3 albedo = pow(max(base, vec3(0.0)), vec3(2.2));\n' +
  '  vec3 groundRad = albedo * (1.0 / ATMO_PI) * (ATMO_SUN * sunT * ndlS + skyIrr);\n' +
  '  vec3 startLocal = camLocal;\n' +
  '  float segLen = viewLen;\n' +
  '  if(rCam > ATMO_Rt){\n' +
  '    float b = dot(camLocal, viewDir);\n' +
  '    float c = dot(camLocal, camLocal) - ATMO_Rt * ATMO_Rt;\n' +
  '    float disc = b * b - c;\n' +
  '    if(disc < 0.0){ outColor = vec4(atmoTone(groundRad), 1.0); return; }\n' +
  '    float tEnter = max(-b - sqrt(max(disc, 0.0)), 0.0);\n' +
  '    startLocal = camLocal + viewDir * tEnter;\n' +
  '    segLen = max(viewLen - tEnter, 0.0);\n' +
  '  }\n' +
  '  vec3 scatter;\n' +
  '  vec3 tView;\n' +
  '  atmoMarch(startLocal, viewDir, segLen, sunDir, scatter, tView);\n' +
  '  outColor = vec4(atmoTone(groundRad * tView + scatter), 1.0);\n' +
  '}';
}
function atmoShellFS(P, transparent) {
  const tailOpaque = '  outColor = vec4(atmoTone(scatter), 1.0);\n' + '}';
  const tailTransparent = '  vec3 haloCol = atmoTone(scatter);\n' +
  '  float haloLum = dot(haloCol, vec3(0.299, 0.587, 0.114));\n' +
  '  float haloA = clamp(haloLum * 1.4, 0.0, 0.55);\n' +
  '  if (haloA < 0.004) discard;\n' +
  '  outColor = vec4(haloCol, haloA);\n' +
  '}';
  return '#version 300 es\n' +
  'precision highp float;\n' +
  'in vec3 v_n;\n' +
  'in vec3 v_w;\n' +
  'in vec3 v_dir0;\n' +
  atmoCommonFor(P) +
  'out vec4 outColor;\n' +
  'void main(){\n' +
  '  vec3 camLocal = (u_cameraWorld - u_center) * u_kmPerWorld;\n' +
  '  float rCam = length(camLocal);\n' +
  '  if(rCam < ATMO_Rg) discard;\n' +
  '  vec3 fragW = v_w;\n' +
  '  vec3 viewW = fragW - u_cameraWorld;\n' +
  '  float fragDist = max(length(viewW), 1e-9);\n' +
  '  vec3 viewDir = viewW / fragDist;\n' +
  '  float b = dot(camLocal, viewDir);\n' +
  '  float gR = ATMO_Rg * 0.998;\n' +
  '  float cG = dot(camLocal, camLocal) - gR * gR;\n' +
  '  float discG = b * b - cG;\n' +
  '  if(discG >= 0.0){\n' +
  '    float tHit = -b - sqrt(max(discG, 0.0));\n' +
  '    if(tHit > 0.0) discard;\n' +
  '  }\n' +
  '  vec3 startLocal;\n' +
  '  float segLen;\n' +
  '  float cT = dot(camLocal, camLocal) - ATMO_Rt * ATMO_Rt;\n' +
  '  float discT = b * b - cT;\n' +
  '  if(discT < 0.0) discard;\n' +
  '  float sT = sqrt(max(discT, 0.0));\n' +
  '  if(rCam > ATMO_Rt){\n' +
  '    float tEnter = max(-b - sT, 0.0);\n' +
  '    float tExit = max(-b + sT, 0.0);\n' +
  '    if(tExit <= tEnter) discard;\n' +
  '    startLocal = camLocal + viewDir * tEnter;\n' +
  '    segLen = tExit - tEnter;\n' +
  '  } else {\n' +
  '    float tExit = max(-b + sT, 0.0);\n' +
  '    if(tExit <= 0.0) discard;\n' +
  '    startLocal = camLocal;\n' +
  '    segLen = tExit;\n' +
  '  }\n' +
  '  vec3 sunDir = normalize(u_sunWorld - u_center);\n' +
  '  vec3 scatter;\n' +
  '  vec3 trans;\n' +
  '  atmoMarch(startLocal, viewDir, segLen, sunDir, scatter, trans);\n' +
  (transparent ? tailTransparent : tailOpaque);
}
function cloudFieldGLSL() {
  return 'float cloudHash(float n){ return fract(sin(n)*758.5453); }\n' +
  'float cloudNoise(in vec3 x){\n' +
  '  vec3 p = floor(x);\n' +
  '  vec3 f = fract(x);\n' +
  '  float n = p.x + p.y*57.0 + p.z*800.0;\n' +
  '  float res = mix(mix(mix(cloudHash(n+0.0), cloudHash(n+1.0),f.x), mix(cloudHash(n+57.0), cloudHash(n+58.0),f.x),f.y),\n' +
  '                  mix(mix(cloudHash(n+800.0), cloudHash(n+801.0),f.x), mix(cloudHash(n+857.0), cloudHash(n+858.0),f.x),f.y),f.z);\n' +
  '  return res;\n' +
  '}\n' +
  'float cloudFbm(vec3 p){\n' +
  '  float f = 0.0;\n' +
  '  f += 0.50000*cloudNoise(p); p = p*2.02;\n' +
  '  f -= 0.25000*cloudNoise(p); p = p*2.03;\n' +
  '  f += 0.12500*cloudNoise(p); p = p*3.01;\n' +
  '  f += 0.06250*cloudNoise(p); p = p*3.04;\n' +
  '  f += 0.03500*cloudNoise(p); p = p*4.01;\n' +
  '  f += 0.01250*cloudNoise(p); p = p*4.04;\n' +
  '  f -= 0.00125*cloudNoise(p);\n' +
  '  return f/0.984375;\n' +
  '}\n' +
  'float cloudD(vec3 p){\n' +
  '  p -= cloudFbm(vec3(p.x,p.y,0.0)*0.5)*1.25;\n' +
  '  float a = min((cloudFbm(p*3.0)*2.2-1.1), 0.0);\n' +
  '  return a*a;\n' +
  '}\n' +
  'float cloudsEarth(vec3 d, float t){\n' +
  '  vec3 flow = vec3(t*0.15, t*0.04, t*0.08);\n' +
  '  float ic = cloudD(d*0.25 + flow) / 0.6;\n' +
  '  if (ic < 0.05) return 0.0;\n' +
  '  float init = smoothstep(0.1, 1.0, ic);\n' +
  '  init = init * cloudD(d*0.75 + flow) * ic;\n' +
  '  init = init * (cloudD(d*1.35 + flow)*0.5 + 0.4) * init;\n' +
  '  return init;\n' +
  '}\n';
}
const vsQuadBake = '#version 300 es\n' +
'out vec2 v_uv;\n' +
'void main(){\n' +
'  vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);\n' +
'  v_uv = p * 0.5 + 0.5;\n' +
'  gl_Position = vec4(p, 0.0, 1.0);\n' +
'}';
function cloudBakeFS() {
  return '#version 300 es\n' +
  'precision highp float;\n' +
  'in vec2 v_uv;\n' +
  'uniform mat3 u_basis;\n' +
  'uniform float u_cover;\n' +
  'uniform float u_seedA;\n' +
  'uniform float u_t;\n' +
  'out vec4 outColor;\n' +
  cloudFieldGLSL() +
  'void main(){\n' +
  '  vec3 d = normalize(u_basis * vec3(v_uv * 2.0 - 1.0, 1.0));\n' +
  '  float ca = cos(u_seedA), sa = sin(u_seedA);\n' +
  '  d = vec3(ca*d.x + sa*d.z, d.y, -sa*d.x + ca*d.z);\n' +
  '  float thr = (1.0-u_cover);\n' +
  '  float c = cloudsEarth(d, u_t);\n' +
  '  float covA = smoothstep(thr, thr + 0.15, c);\n' +
  '  float shade = clamp(1.0 - exp(-max(c - thr, 0.0) * 3.0), 0.0, 1.0);\n' +
  '  outColor = vec4(covA, shade, 0.0, 1.0);\n' +
  '}';
}
function cloudRenderFS() {
  return '#version 300 es\n' +
  'precision highp float;\n' +
  'in vec3 v_n;\n' +
  'in vec3 v_w;\n' +
  'in vec3 v_dir0;\n' +
  'uniform vec3 u_sun;\n' +
  'uniform vec3 u_cam;\n' +
  'uniform float u_time;\n' +
  'uniform float u_seed;\n' +
  'uniform samplerCube u_clouds;\n' +
  'uniform float u_radius;\n' +
  'out vec4 outColor;\n' +
  'void main(){\n' +
  '  vec3 d = normalize(v_dir0);\n' +
  '  float ra = u_time*0.0015 + u_seed;\n' +
  '  float ca = cos(ra), sa = sin(ra);\n' +
  '  d = vec3(ca*d.x + sa*d.z, d.y, -sa*d.x + ca*d.z);\n' +
  '  vec4 tx = texture(u_clouds, d);\n' +
  '  if (tx.r < 0.004) discard;\n' +
  '  vec3 n = normalize(v_n);\n' +
  '  vec3 l = normalize(u_sun - v_w);\n' +
  '  vec3 vv = normalize(u_cam - v_w);\n' +
  '  if (dot(n, vv) <= 0.0) discard;\n' +
  '  float penT = smoothstep(-0.3, 0.5, dot(n, l));\n' +
  '  float day = penT*penT*penT*(penT*(penT*6.0-15.0)+10.0);\n' +
  '  if (day < 0.003) discard;\n' +
  '  vec3 col = mix(vec3(0.64, 0.68, 0.79), vec3(1.02, 1.0, 0.96), tx.g);\n' +
  '  col += vec3(0.08, 0.075, 0.07) * clamp(fwidth(tx.r) * 5.0, 0.0, 1.0);\n' +
  '  float warmBand = smoothstep(0.0, 0.10, day) * (1.0 - smoothstep(0.10, 0.45, day));\n' +
  '  col = mix(col, vec3(1.0, 0.55, 0.30), warmBand * 0.65);\n' +
  '  col *= (0.06 + 0.94*day);\n' +
  '  float limb = smoothstep(0.0, 0.3, dot(n, vv));\n' +
  '  float nearFade = smoothstep(0.0, u_radius * 0.08, length(u_cam - v_w));\n' +
  '  outColor = vec4(col, smoothstep(0.01, 0.18, day) * limb * tx.r * nearFade);\n' +
  '}';
}
function cloudShadowFS() {
  return '#version 300 es\n' +
  'precision highp float;\n' +
  'in vec3 v_n;\n' +
  'in vec3 v_w;\n' +
  'uniform vec3 u_center;\n' +
  'uniform float u_radius;\n' +
  'uniform vec3 u_sun;\n' +
  'uniform samplerCube u_clouds;\n' +
  'uniform float u_time;\n' +
  'uniform float u_seed;\n' +
  'uniform float u_mult;\n' +
  'uniform mat3 u_frame;\n' +
  'out vec4 outColor;\n' +
  'float cloudDay(float ndotl){\n' +
  '  float t = smoothstep(-0.10, 0.35, ndotl);\n' +
  '  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);\n' +
  '}\n' +
  'void main(){\n' +
  '  vec3 n = normalize(v_n);\n' +
  '  vec3 l = normalize(u_sun - v_w);\n' +
  '  float day = cloudDay(dot(n, l));\n' +
  '  if (day < 0.003) discard;\n' +
  '  vec3 P = v_w - u_center;\n' +
  '  float rC = u_radius * u_mult;\n' +
  '  float b = dot(P, l);\n' +
  '  float disc = b * b - (dot(P, P) - rC * rC);\n' +
  '  if (disc <= 0.0) discard;\n' +
  '  float sdt = sqrt(disc);\n' +
  '  float tIn = -b - sdt;\n' +
  '  float tOut = -b + sdt;\n' +
  '  float tF = tIn > 0.0 ? tIn : tOut;\n' +
  '  if (tF <= 0.0) discard;\n' +
  '  float ra = u_time * 0.0015 + u_seed;\n' +
  '  float ca = cos(ra);\n' +
  '  float sa = sin(ra);\n' +
  '  vec3 dF = u_frame * normalize(P + l * tF);\n' +
  '  dF = vec3(ca*dF.x + sa*dF.z, dF.y, -sa*dF.x + ca*dF.z);\n' +
  '  vec2 cv = texture(u_clouds, dF).rg;\n' +
  '  float dens = cv.x * (0.45 + 0.75 * cv.y);\n' +
  '  float a = smoothstep(0.0, 0.75, dens) * 0.55 * day;\n' +
  '  outColor = vec4(a, a, a, 1.0);\n' +
  '}';
}
function rockFS() {
  return '#version 300 es\n' +
  'precision highp float;\n' +
  'in vec3 v_n;\n' +
  'in vec3 v_w;\n' +
  'in vec3 v_dir0;\n' +
  'uniform vec3 u_color;\n' +
  'uniform vec3 u_sun;\n' +
  'uniform float u_emit;\n' +
  'uniform samplerCube u_tex;\n' +
  'uniform float u_useTex;\n' +
  'out vec4 outColor;\n' +
  'void main(){\n' +
  '  vec3 n = normalize(v_n);\n' +
  '  vec3 l = normalize(u_sun - v_w);\n' +
  '  float ndl = dot(n, l);\n' +
  '  float aa = fwidth(ndl);\n' +
'  float d = smoothstep(-0.05 - aa, 1.5 + aa, ndl);\n' +
'  vec3 base = u_useTex > 0.5 ? texture(u_tex, v_dir0).rgb * u_color : u_color;\n' +
  '  vec3 shaded = base * d;\n' +
  '  vec3 col = mix(shaded, base, u_emit);\n' +
  '  outColor = vec4(col, 1.0);\n' +
  '}';
}
const vsFXAA = `#version 300 es
out vec2 v_uv;
void main(){
  vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
  v_uv = p * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}`
const fsFXAA = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_rcp;
out vec4 outColor;
float fxLuma(vec3 rgb){
  return dot(rgb, vec3(0.299, 0.587, 0.114));
}
void main(){
  vec3 rgbM = texture(u_tex, v_uv).rgb;
  float lM = fxLuma(rgbM);
  float lN = fxLuma(textureOffset(u_tex, v_uv, ivec2(0, -1)).rgb);
  float lS = fxLuma(textureOffset(u_tex, v_uv, ivec2(0, 1)).rgb);
  float lW = fxLuma(textureOffset(u_tex, v_uv, ivec2(-1, 0)).rgb);
  float lE = fxLuma(textureOffset(u_tex, v_uv, ivec2(1, 0)).rgb);
  float lNW = fxLuma(texture(u_tex, v_uv + vec2(-1.0, -1.0) * u_rcp).rgb);
  float lNE = fxLuma(texture(u_tex, v_uv + vec2(1.0, -1.0) * u_rcp).rgb);
  float lSW = fxLuma(texture(u_tex, v_uv + vec2(-1.0, 1.0) * u_rcp).rgb);
  float lSE = fxLuma(texture(u_tex, v_uv + vec2(1.0, 1.0) * u_rcp).rgb);
  float rMax = max(lM, max(max(lN, lS), max(lW, lE)));
  float rMin = min(lM, min(min(lN, lS), min(lW, lE)));
  float rMaxNW = max(lNW, max(lNE, max(lSW, lSE)));
  float rMinNW = min(lNW, min(lNE, min(lSW, lSE)));
  rMax = max(rMax, rMaxNW);
  rMin = min(rMin, rMinNW);
  float range = rMax - rMin;
  if(range < max(0.0312, rMax * 0.125)){
    outColor = vec4(rgbM, 1.0);
    return;
  }
  vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), ((lNW + lSW) - (lNE + lSE)));
  float dirReduce = max((lNW + lNE + lSW + lSE) * (1.0 / 12.0), 1.0 / 128.0);
  float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
  dir = min(vec2(8.0, 8.0), max(vec2(-8.0, -8.0), dir * rcpDirMin)) * u_rcp;
  vec3 rgbA = 0.5 * (texture(u_tex, v_uv + dir * (1.0 / 3.0 - 0.5)).rgb + texture(u_tex, v_uv + dir * (2.0 / 3.0 - 0.5)).rgb);
  vec3 rgbB = rgbA * 0.5 + 0.25 * (texture(u_tex, v_uv + dir * -0.5).rgb + texture(u_tex, v_uv + dir * 0.5).rgb);
  float lB = fxLuma(rgbB);
  if(lB < rMin || lB > rMax){
    outColor = vec4(rgbA, 1.0);
  } else {
    outColor = vec4(rgbB, 1.0);
  }
}`

import { useEffect, useRef } from 'react'

const FLAME_HEIGHT = 58
const MAX_PIXEL_RATIO = 1.5
const FLARE_ATTACK = 0.18
const STILL_TIME = 12

const VERTEX_SOURCE = `
attribute vec2 aCorner;
void main() { gl_Position = vec4(aCorner, 0.0, 1.0); }
`

// The colors of `ramp` are the ink, crimson-600, and ember tokens of src/styles/tokens.css.
const FRAGMENT_SOURCE = `
precision mediump float;
uniform vec2 uSize;
uniform float uTime;
uniform float uHeat;
uniform float uFlame;

float hash(vec2 cell) {
  return fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 point) {
  vec2 cell = floor(point);
  vec2 local = fract(point);
  vec2 blend = local * local * (3.0 - 2.0 * local);

  return mix(
    mix(hash(cell), hash(cell + vec2(1.0, 0.0)), blend.x),
    mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0, 1.0)), blend.x),
    blend.y
  );
}

float fbm(vec2 point) {
  float total = 0.0;
  float gain = 0.5;

  for (int octave = 0; octave < 4; octave++) {
    total += gain * noise(point);
    point = point * 2.03 + vec2(11.3, 7.9);
    gain *= 0.5;
  }

  return total / 0.9375;
}

vec3 ramp(float heat) {
  vec3 ink = vec3(0.102, 0.086, 0.075);
  vec3 deep = vec3(0.494, 0.122, 0.129);
  vec3 red = vec3(0.851, 0.282, 0.110);
  vec3 orange = vec3(0.941, 0.471, 0.165);
  vec3 amber = vec3(1.0, 0.702, 0.278);
  vec3 pale = vec3(1.0, 0.945, 0.839);

  vec3 color = mix(ink, deep, smoothstep(0.0, 0.30, heat));
  color = mix(color, red, smoothstep(0.28, 0.52, heat));
  color = mix(color, orange, smoothstep(0.50, 0.70, heat));
  color = mix(color, amber, smoothstep(0.68, 0.86, heat));

  return mix(color, pale, smoothstep(0.86, 1.0, heat));
}

void main() {
  vec2 pixel = gl_FragCoord.xy;
  float flame = uFlame * (1.0 + 0.4 * uHeat);
  vec2 point = pixel / uFlame;

  vec2 drift = vec2(point.x * 0.9, point.y * 0.62 - uTime * 0.42);
  float warp = fbm(drift * 1.6 + vec2(0.0, -uTime * 0.21));
  float body = fbm(drift + warp * 0.75);

  float tongues = smoothstep(0.0, 0.75, body * 1.05 + 0.34 - pixel.y / flame);
  float glow = exp(-pixel.y / (uFlame * 2.4)) * (0.27 + 0.14 * uHeat);
  float heat = tongues * (0.42 + 0.26 * warp + 0.08 * uHeat) + glow;

  vec3 color = ramp(min(heat, 0.9 + 0.1 * warp));

  for (int index = 0; index < 14; index++) {
    float seed = float(index) + 1.0;
    float life = fract(uTime * (0.07 + 0.05 * hash(vec2(seed, 3.0))) + hash(vec2(seed, 9.0)));
    vec2 spark = vec2(
      hash(vec2(seed, 1.0)) * uSize.x + sin(life * 7.0 + seed) * uFlame * 0.22,
      life * uFlame * (2.6 + 1.4 * uHeat)
    );
    float core = smoothstep(uFlame * 0.035, 0.0, distance(pixel, spark));

    color += vec3(1.0, 0.72, 0.32) * core * (1.0 - life) * (1.0 - life) * (0.4 + 0.6 * uHeat);
  }

  gl_FragColor = vec4(color, 1.0);
}
`

interface CoalsProps {
  /** The count that the fire is for. The fire flares each time it goes up. */
  count: number
}

function compile(context: WebGLRenderingContext, type: number, source: string) {
  const shader = context.createShader(type)!

  context.shaderSource(shader, source)
  context.compileShader(shader)

  return shader
}

function link(context: WebGLRenderingContext) {
  const program = context.createProgram()

  context.attachShader(program, compile(context, context.VERTEX_SHADER, VERTEX_SOURCE))
  context.attachShader(program, compile(context, context.FRAGMENT_SHADER, FRAGMENT_SOURCE))
  context.linkProgram(program)

  if (!context.getProgramParameter(program, context.LINK_STATUS)) {
    return null
  }

  context.useProgram(program)
  context.bindBuffer(context.ARRAY_BUFFER, context.createBuffer())
  context.bufferData(
    context.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    context.STATIC_DRAW,
  )

  const corner = context.getAttribLocation(program, 'aCorner')

  context.enableVertexAttribArray(corner)
  context.vertexAttribPointer(corner, 2, context.FLOAT, false, 0, 0)

  return {
    size: context.getUniformLocation(program, 'uSize'),
    time: context.getUniformLocation(program, 'uTime'),
    heat: context.getUniformLocation(program, 'uHeat'),
    flame: context.getUniformLocation(program, 'uFlame'),
  }
}

function canDraw() {
  return (
    typeof WebGLRenderingContext === 'function' &&
    typeof ResizeObserver === 'function' &&
    typeof IntersectionObserver === 'function'
  )
}

/**
 * Draws the fire on the canvas while it is in view, and returns `flare` and `stop`, or `null` when the browser cannot draw it.
 */
function startCoals(canvas: HTMLCanvasElement) {
  const context = canDraw() ? canvas.getContext('webgl', { antialias: false, alpha: false }) : null
  const uniforms = context && link(context)

  if (!context || !uniforms) {
    return null
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let ratio = 1
  let visible = false
  let request = 0
  let flaredAt = Number.NEGATIVE_INFINITY

  const draw = (now: number) => {
    const sinceFlare = (now - flaredAt) / 1000
    const heat =
      sinceFlare < FLARE_ATTACK
        ? sinceFlare / FLARE_ATTACK
        : Math.exp(-(sinceFlare - FLARE_ATTACK) * 1.5)

    context.uniform2f(uniforms.size, canvas.width, canvas.height)
    context.uniform1f(uniforms.time, reducedMotion.matches ? STILL_TIME : now / 1000)
    context.uniform1f(uniforms.heat, reducedMotion.matches ? 0 : heat)
    context.uniform1f(uniforms.flame, FLAME_HEIGHT * ratio)
    context.drawArrays(context.TRIANGLES, 0, 3)
  }

  const loop = (now: number) => {
    draw(now)
    request =
      visible && !document.hidden && !reducedMotion.matches ? requestAnimationFrame(loop) : 0
  }

  const wake = () => {
    if (!request) {
      request = requestAnimationFrame(loop)
    }
  }

  const resizes = new ResizeObserver(() => {
    ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO)
    canvas.width = Math.round(canvas.clientWidth * ratio)
    canvas.height = Math.round(canvas.clientHeight * ratio)
    context.viewport(0, 0, canvas.width, canvas.height)
    wake()
  })

  const views = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    wake()
  })

  resizes.observe(canvas)
  views.observe(canvas)
  document.addEventListener('visibilitychange', wake)
  reducedMotion.addEventListener('change', wake)

  return {
    flare() {
      flaredAt = performance.now()
      wake()
    },
    stop() {
      cancelAnimationFrame(request)
      resizes.disconnect()
      views.disconnect()
      document.removeEventListener('visibilitychange', wake)
      reducedMotion.removeEventListener('change', wake)
    },
  }
}

/**
 * Calls `onRise` each time the count goes up from a known count.
 */
function useCountRise(count: number | undefined, onRise: () => void) {
  const previous = useRef(count)
  const latest = useRef(onRise)

  latest.current = onRise

  useEffect(() => {
    const from = previous.current

    previous.current = count

    if (from !== undefined && count !== undefined && count > from) {
      latest.current()
    }
  }, [count])
}

function Coals({ count }: CoalsProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const fire = useRef<ReturnType<typeof startCoals>>(null)

  useEffect(() => {
    const element = canvas.current!

    fire.current = startCoals(element)
    element.hidden = !fire.current

    return () => fire.current?.stop()
  }, [])

  useCountRise(count, () => fire.current?.flare())

  return <canvas ref={canvas} className="ui-coals" aria-hidden="true" />
}

export { Coals, useCountRise }

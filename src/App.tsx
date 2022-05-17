import styles from './App.module.css'
import { useRef } from 'react'
import { useEffect } from 'react';
import { useState } from 'react';

const range = (s, e = null): number[] =>
  e === null
    ? [...Array(s).keys()]
    : [...Array(e - s).keys()].map((i) => i + s);

const Canvas = ({ nurses }) => {
  const [width, height] = [400, 600]
  const bars = nurses + 1
  const [blockWidth, blockHeight] = [width / 2 / bars, height * 0.8]

  const strokeNursesRects = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = 'black'
    const offset = width / bars
    for (const n of range(bars)) {
      if (n === bars -1) {
        ctx.strokeStyle = "red"
      }
      ctx.strokeRect(offset * n, height * 0.1, blockWidth, blockHeight);
    }
  }
  const addRect = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = 'black';
    ctx.strokeRect(10, 10, 10, 10);
  }

  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, width, height)
      strokeNursesRects(ctx)
    }
  }, [canvasRef, nurses])
  
  return <canvas className={styles.canvas} ref={canvasRef} width={width} height={height}/>
}

const App = () => {
  const [values, setValues] = useState({
    nurses: 4,
    bookedSlots: [
      [{start: "07:00", end: "13:00"}]
    ],
    availability: {start: "07:00", end: "18:00"},
    error: null
  });
  const [jsonValues, setJsonValues] = useState(JSON.stringify(values, null, 2));

  useEffect(() => {
    try {
      setValues(JSON.parse(jsonValues))
    } catch (_e) {
      // @ts-ignore
      setValues({ error: "Cannot parse" })
    }
  }, [jsonValues])

  return (
    <div className={styles.app}>
      <div className={styles.left}>
        <div className={styles.leftInner}>
          <textarea className={styles.textarea} value={jsonValues} onChange={(e) => setJsonValues(e.target.value)}></textarea>
          <p>Parsed:</p>
          <pre className={styles.parsed}>{JSON.stringify(values, null, 2)}</pre>
        </div>
      </div>
      <div className={styles.right}>
        <p>Diagram</p>
        <Canvas nurses={(values && values["nurses"]) || 0} />
      </div>
    </div>
  );
}

export default App;

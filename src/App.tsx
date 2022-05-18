import styles from './App.module.css'
import initialData from './data.json'
import { useRef } from 'react'
import { useEffect } from 'react';
import { useState } from 'react';

const range = (s, e = null): number[] =>
  e === null
    ? [...Array(s).keys()]
    : [...Array(e - s).keys()].map((i) => i + s);

const timeToInt = (timeString: string) => {
  const [hourString, minString] = timeString.split(':')
  const [hours, mins] = [parseInt(hourString), parseInt(minString)]
  return mins + hours * 60
}

const Canvas = ({ nurses, availability, bookedSlots, outcome }) => {
  const [width, height] = [800, 600]
  const bars = nurses + 1
  const [barWidth, barHeight] = [width / 4 / bars * 3, height * 0.8]
  const availabilityInt = {
    start: availability ? timeToInt(availability.start) : 0,
    end: availability ? timeToInt(availability.end) : 1,
  }
  const availabilityRange = availabilityInt.end - availabilityInt.start

  const fillAvailabilityTimes = (ctx: CanvasRenderingContext2D) => {
    ctx.font = '15px sans-serif'
    ctx.fillStyle = 'black'
    ctx.fillText(availability.start, 0, height * 0.08)
    ctx.fillText(availability.end, 0, height * 0.94)
  }

  const fillOutcomeText = (ctx: CanvasRenderingContext2D) => {
    const offset = width / bars
    ctx.font = '15px sans-serif'
    ctx.fillStyle = 'red'
    ctx.fillText('Outcome', offset * (bars - 1), height * 0.08)
  }

  const strokeNursesRects = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = 'black'
    const offset = width / bars
    for (const n of range(bars)) {
      if (n === bars -1) {
        ctx.strokeStyle = "red"
      } else {
        ctx.font = '15px sans-serif'
        ctx.fillStyle = 'black'
        ctx.fillText(`N${n}`, offset * n + barWidth * 0.8, height * 0.08)
      }
      ctx.strokeRect(offset * n, height * 0.1, barWidth, barHeight);
    }
  }

  const addSlotBlock = (
    ctx: CanvasRenderingContext2D, 
    slot: {start: string, end: string},
    n,
    offset: number,
    barTop: number,
    extraText: string = '',
    color: string = 'dodgerblue',
    fontColor: string = 'white',
   ) => {
    const fontSize = 10
    const [intStart, intEnd] = [
      timeToInt(slot.start) - availabilityInt.start, 
      timeToInt(slot.end) - availabilityInt.start
    ]
    const [pxStart, pxEnd] = [
      intStart / availabilityRange * barHeight,
      intEnd / availabilityRange * barHeight,
    ]
    ctx.fillStyle = color
    ctx.fillRect(offset * n, barTop + pxStart, barWidth, pxEnd - pxStart);
    ctx.font = `${fontSize}px sans-serif`
    ctx.fillStyle = fontColor
    ctx.fillText(slot.start, offset * n + 2, barTop + pxStart + fontSize)
    extraText && ctx.fillText(extraText, offset * n + 2, barTop + pxStart + ((pxEnd - pxStart) / 2) + fontSize / 3)
    ctx.fillText(slot.end, offset * n + 2, barTop + pxStart + (pxEnd - pxStart) - fontSize / 3)
  }

  const addBookedSlots = (ctx: CanvasRenderingContext2D) => {
    const offset = width / bars
    const barTop = height * 0.1
    for (const n of range(bookedSlots.length)) {
      const currentNurseSlots = bookedSlots[n]
      for (const slot of currentNurseSlots) {
        if (slot && slot.start && slot.end) {
          addSlotBlock(ctx, slot, n, offset, barTop, 'Booked')
        }
      }
    }
  }

  const addOutcomeSlots = (ctx: CanvasRenderingContext2D) => {
    const offset = width / bars
    const barTop = height * 0.1
    for (const slot of outcome) {
      if (slot && slot.start && slot.end) {
        addSlotBlock(ctx, slot, bars - 1, offset, barTop, 'Free', 'palegreen', 'black')
      }
    }
    
  }

  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, width, height)
      bookedSlots && addBookedSlots(ctx)
      outcome && addOutcomeSlots(ctx)
      strokeNursesRects(ctx)
      availability && fillAvailabilityTimes(ctx)
      fillOutcomeText(ctx)
      
      
      
    }
  }, [canvasRef, nurses, availability, bookedSlots, outcome])
  
  return <canvas className={styles.canvas} ref={canvasRef} width={width} height={height}/>
}

const App = () => {
  const [values, setValues] = useState(initialData);
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
        <p>Booking Diagram</p>
        <Canvas 
          nurses={(values && values["bookedSlots"] ? values["bookedSlots"].length : 0)}
          availability={(values && values["availability"]) || null}
          bookedSlots={(values && values["bookedSlots"]) || null}
          outcome={(values && values["outcome"]) || null}
        />
      </div>
    </div>
  );
}

export default App;

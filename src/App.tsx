
import { useRef } from 'react'
import { useEffect } from 'react';
import { useState } from 'react';
import styles from './App.module.css'

import initialData from './data.json'
import { range, timeToInt, getFreeSlots } from './collisionAlgorithm';

const Canvas = ({ nurses, availability, bookedSlots, outcome }) => {
  const width = 1200
  const [height, setHeight] = useState(850)
  const bars = nurses + 1
  const barTop = height * 0.05
  const [barWidth, barHeight] = [width / 4 / bars * 3, height * 0.93]
  const availabilityInt = {
    start: availability ? timeToInt(availability.start) : 0,
    end: availability ? timeToInt(availability.end) : 1,
  }
  const availabilityRange = availabilityInt.end - availabilityInt.start

  const fillAvailabilityTimes = (ctx: CanvasRenderingContext2D) => {
    ctx.font = '8px sans-serif'
    ctx.fillStyle = 'black'
    ctx.fillText(availability.start, 0, barTop - 5)
    ctx.fillText(availability.end, 0, barTop + barHeight + 8)
  }

  const fillOutcomeText = (ctx: CanvasRenderingContext2D) => {
    const offset = width / bars
    ctx.font = '10px sans-serif'
    ctx.fillStyle = 'black'
    ctx.fillText('OUTCOME', offset * (bars - 1), barTop - 5)
  }

  const strokeNursesRects = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = 'black'
    const offset = width / bars
    for (const n of range(bars)) {
      if (n === bars -1) {
        ctx.strokeStyle = "mediumaquamarine"
      } else {
        ctx.font = '10px sans-serif'
        ctx.fillStyle = 'black'
        ctx.fillText(`N${n}`, offset * n + barWidth * 0.8, barTop - 5)
      }
      ctx.strokeRect(offset * n, barTop, barWidth, barHeight);
    }
  }

  const addSlotBlock = (
    ctx: CanvasRenderingContext2D, 
    slot: {start: string, end: string},
    n,
    offset: number,
    barTop: number,
    color: string,
    fontColor: string,
    extraText: string = '',
    strokeColor: string = ''
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
    if (strokeColor) {
      ctx.strokeStyle = strokeColor
      ctx.strokeRect(offset * n, barTop + pxStart, barWidth, pxEnd - pxStart)
    }
    ctx.font = `${fontSize}px sans-serif`
    ctx.fillStyle = fontColor
    ctx.fillText(slot.start, offset * n + 2, barTop + pxStart + fontSize)
    extraText && ctx.fillText(extraText, offset * n + 4 * fontSize, barTop + pxStart + ((pxEnd - pxStart) / 2) + fontSize / 3)
    ctx.fillText(slot.end, offset * n + 2, barTop + pxStart + (pxEnd - pxStart) - fontSize / 3)
  }

  const addBookedSlots = (ctx: CanvasRenderingContext2D) => {
    const offset = width / bars
    for (const n of range(bookedSlots.length)) {
      const currentNurseSlots = bookedSlots[n]
      for (const slot of currentNurseSlots) {
        if (slot && slot.start && slot.end) {
          addSlotBlock(ctx, slot, n, offset, barTop, 'dodgerblue', 'white', 'Booked', 'white')
        }
      }
    }
  }

  const fillOutcomeBg = (ctx: CanvasRenderingContext2D) => { 
    const offset = width / bars
    ctx.fillStyle = "dodgerblue"
    ctx.fillRect(offset * (bars - 1), barTop, barWidth, barHeight)
  }

  const addOutcomeSlots = (ctx: CanvasRenderingContext2D) => {
    const offset = width / bars
    for (const slot of outcome) {
      if (slot && slot.start && slot.end) {
        addSlotBlock(ctx, slot, bars - 1, offset, barTop, 'ivory', 'black', slot.resources, 'mediumaquamarine')
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
      fillOutcomeBg(ctx)
      outcome && addOutcomeSlots(ctx)
      strokeNursesRects(ctx)
      availability && fillAvailabilityTimes(ctx)
      fillOutcomeText(ctx)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef, nurses, availability, bookedSlots, outcome])

  useEffect(() => {
    if (outcome) {
      const slotSizes = outcome.map(slot => timeToInt(slot.end) - timeToInt(slot.start))
      const smallest = Math.min(...slotSizes)
      if (smallest < 30) {
        const multiplier = 30 / smallest
        setHeight(3000 / 6 * multiplier)
      } else {
        setHeight(850)
      }
    }
    
  }, [outcome])
  
  return <canvas className={styles.canvas} ref={canvasRef} width={width} height={height}/>
}

const App = () => {
  const [values, setValues] = useState(initialData);
  const [jsonValues, setJsonValues] = useState(JSON.stringify(values, null, 2));

  useEffect(() => {
    try {
      const values = JSON.parse(jsonValues)
      const computedOutcome = values["availability"] && values["bookedSlots"] 
        ? getFreeSlots(values["availability"], values["bookedSlots"])
        : null
      setValues({
        ...values,
        computedOutcome
      })
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
        <p>Booking Diagram{" " + values && values["onlyShow"] ? "(Given)" : "(Computed)" }</p>
        <Canvas 
          nurses={(values && values["bookedSlots"] ? values["bookedSlots"].length : 0)}
          availability={(values && values["availability"]) || null}
          bookedSlots={(values && values["bookedSlots"]) || null}
          outcome={
            (values && values["onlyShow"]) ?
              values["givenOutcome"] || null
            : values["computedOutcome"] || null
        }
        />
      </div>
    </div>
  );
}

export default App;

const range = (s, e = null): number[] =>
  e === null
    ? [...Array(s).keys()]
    : [...Array(e - s).keys()].map((i) => i + s);

const timeToInt = (timeString: string) => {
  const [hourString, minString] = timeString.split(':')
  const [hours, mins] = [parseInt(hourString), parseInt(minString)]
  return mins + hours * 60
}

const intToTime = (timeInt: number) => {
  return `${Math.floor(timeInt / 60)}:${timeInt % 60 < 10 ? "0" : ""}${timeInt % 60}`
}

interface Slot {
  start: string,
  end: string
}

interface IntSlot {
  start: number,
  end: number
}

interface ResourceSlot extends Slot {
  resources: number[]
}

interface ResourceIntSlot extends IntSlot {
  resources: number[]
}

const intSlotToSlot = (slot: IntSlot | ResourceIntSlot) => ({...slot, start: intToTime(slot.start), end: intToTime(slot.end)})
const slotToIntSlot = (slot: Slot | ResourceSlot) => ({...slot, start: timeToInt(slot.start), end: timeToInt(slot.end)})

// Based on AABB collision detection
const slotCollides = (slotA: IntSlot, slotB: IntSlot): boolean => {
  return slotA.start < slotB.end && slotA.end > slotB.start
}

const resourceSubtraction = (resources: number[], resource: number) => 
  resources.includes(resource) ? resources.filter(r => r !== resource) : [...resources, -resource]

const slotSubtract = (slotA: ResourceIntSlot, slotB: IntSlot, resource: number): ResourceIntSlot[] => {
  // A includes all B
  // .---.      .---. <- shorter A ends at B start
  // |   +---.  |---| <- shorter A_minus_resource starts and ends like B
  // | A | B |  |   |
  // |   +---'  |---| <- shorter A starts at B end
  // '---'      '---'
  if (slotA.start < slotB.start && slotA.end > slotB.end) {
    const shorterSlotATop = {
        ...slotA,
        end: slotB.start
      }
    const shorterSlotABottom = {
        ...slotA,
        start: slotB.end
      }
    const subtractedResources = resourceSubtraction(slotA.resources, resource)
    return subtractedResources.length > 0 ? [
      shorterSlotATop,
      {
        start: slotB.start,
        end: slotB.end,
        resources: subtractedResources
      },
      shorterSlotABottom,
    ]: [shorterSlotATop, shorterSlotABottom]
  }

  // B includes all A
  //     .---.
  // .---+   |  .---. <- shorter A_minus_resource starts and ends like A
  // | A | B |  |   |
  // '---+   |  '---'
  //     '---'
  if (slotA.start > slotB.start && slotA.end < slotB.end) {
    const subtractedResources = resourceSubtraction(slotA.resources, resource)
    return subtractedResources.length > 0 ? [
      {
        start: slotA.start,
        end: slotA.end,
        resources: subtractedResources
      },
    ]: []
  }

  // A start overlaps B end
  //     .---.       
  // .---+ B |   .---. <- shorter A_minus_resource ends at B end
  // | A |---'   |---|
  // '---'       '---' <- shorter A starts at B end
  if (slotA.start < slotB.end 
      && slotA.start > slotB.start
      && slotA.end > slotB.end
  ) {
    const shorterSlotA = {
        ...slotA,
        start: slotB.end
      }
    const subtractedResources = resourceSubtraction(slotA.resources, resource)
    return subtractedResources.length > 0 ? 
    [
      {
        ...slotA,
        end: slotB.end,
        resources: subtractedResources
      },
      shorterSlotA
    ] : [ shorterSlotA]
  }

  // A end overlaps B start
  // .---.       .---. <- shorter A ends at B start
  // | A +---.   |---| 
  // '---| B |   '---' <- shorter A_minus_resource starts at B start
  //     '---' 
  if (slotA.end > slotB.start
      && slotA.start < slotB.start
      && slotA.end < slotB.end
  ) {
    const shorterSlotA = {
        ...slotA,
        end: slotB.start
      }
    const subtractedResources = resourceSubtraction(slotA.resources, resource)
    return subtractedResources.length > 0 ? 
    [
      {
        ...slotA,
        start: slotB.start,
        resources: subtractedResources
      },
      shorterSlotA
    ] : [ shorterSlotA]
  }

  // No collision
  console.log("No collision detected")
  return [slotA]
}

enum TestSelection {
  A_INCLUDES_B,
  B_INCLUDES_A,
  A_START_OVERLAPS_B_END,
  B_START_OVERLAPS_A_END,
}
const currentTestSelection = TestSelection.B_INCLUDES_A

// @ts-ignore
if (currentTestSelection === TestSelection.A_INCLUDES_B) {
  const testSlotA = { start: "08:00", end: "17:00", resources: [0, 1]}
  const testSlotB = { start: "09:00", end: "11:00"}

  console.log("A includes B")
  // @ts-ignore
  const testSubtraction = slotSubtract(slotToIntSlot(testSlotA), slotToIntSlot(testSlotB), 1)
  console.log(testSubtraction)
  console.log(JSON.stringify({
    bookedSlots: [
      [
        testSlotA
      ],
      [
        testSlotB
      ]
    ],
    // @ts-ignore
    givenOutcome: testSubtraction.map( s => intSlotToSlot(s))
  }, null, 2))
// @ts-ignore
} else if (currentTestSelection === TestSelection.B_INCLUDES_A) {
  const testSlotA = { start: "09:00", end: "11:00", resources: [0, 1]}
  const testSlotB = { start: "08:00", end: "17:00"}

  console.log("B includes A")
  // @ts-ignore
  const testSubtraction = slotSubtract(slotToIntSlot(testSlotA), slotToIntSlot(testSlotB), 1)
  console.log(testSubtraction)
  console.log(JSON.stringify({
    bookedSlots: [
      [
        testSlotA
      ],
      [
        testSlotB
      ]
    ],
    // @ts-ignore
    givenOutcome: testSubtraction.map( s => intSlotToSlot(s))
  }, null, 2))
// @ts-ignore
} else if (currentTestSelection === TestSelection.A_START_OVERLAPS_B_END) {
  const testSlotA = { start: "08:30", end: "10:30", resources: [0, 1]}
  const testSlotB = { start: "08:00", end: "9:30"}

  console.log("A start overlaps B end")
  // @ts-ignore
  const testSubtraction = slotSubtract(slotToIntSlot(testSlotA), slotToIntSlot(testSlotB), 1)
  console.log(testSubtraction)
  console.log(JSON.stringify({
    bookedSlots: [
      [
        testSlotA
      ],
      [
        testSlotB
      ]
    ],
    // @ts-ignore
    givenOutcome: testSubtraction.map( s => intSlotToSlot(s))
  }, null, 2))
// @ts-ignore
} else if (currentTestSelection === TestSelection.B_START_OVERLAPS_A_END) {
  // Slot A start overlaps slotB end
  const testSlotA = { start: "08:30", end: "15:30", resources: [0, 1]}
  const testSlotB = { start: "11:00", end: "18:00"}

  console.log("B start overlaps A end")
  // @ts-ignore
  const testSubtraction = slotSubtract(slotToIntSlot(testSlotA), slotToIntSlot(testSlotB), 1)
  console.log(testSubtraction)
  console.log(JSON.stringify({
    bookedSlots: [
      [
        testSlotA
      ],
      [
        testSlotB
      ]
    ],
    // @ts-ignore
    givenOutcome: testSubtraction.map( s => intSlotToSlot(s))
  }, null, 2))
}




// No export
const _ = {}
export default _
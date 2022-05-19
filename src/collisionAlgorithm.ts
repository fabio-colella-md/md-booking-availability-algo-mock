export const range = (s, e = null): number[] =>
  e === null
    ? [...Array(s).keys()]
    : [...Array(e - s).keys()].map((i) => i + s);


export const timeToInt = (timeString: string) => {
  const [hourString, minString] = timeString.split(':')
  const [hours, mins] = [parseInt(hourString), parseInt(minString)]
  return mins + hours * 60
}

export const intToTime = (timeInt: number) => {
  return `${Math.floor(timeInt / 60)}:${timeInt % 60 < 10 ? "0" : ""}${timeInt % 60}`
}

export interface Slot {
  start: string,
  end: string
}

interface IntSlot {
  start: number,
  end: number
}

export interface ResourceSlot extends Slot {
  resources: number[]
}

interface ResourceIntSlot extends IntSlot {
  resources: number[]
}

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
  if (slotA.start <= slotB.start && slotA.end >= slotB.end) {
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
  if (slotA.start >= slotB.start && slotA.end <= slotB.end) {
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
  return [slotA]
}

const removeZeroTimeSlots = (slots: ResourceIntSlot[]) => slots.filter(s => s.end > s.start)

const findCollidingSlots = (slots: ResourceIntSlot[], testSlot: IntSlot) => slots.reduce((collisionObject, slot) => (
  slotCollides(slot, testSlot) ? {
    ...collisionObject,
    colliding: [...collisionObject.colliding, slot]
  } : {
    ...collisionObject,
    nonColliding: [...collisionObject.nonColliding, slot]
  }
), {colliding: [], nonColliding: []})

const getFreeIntSlots = (availability: IntSlot, bookings: IntSlot[][]): ResourceIntSlot[] => {
  const initialFreeSlots = [{
    ...availability,
    resources: range(bookings.length)
  }]
  let currentFreeSlots = initialFreeSlots
  
  for (const resource of range(bookings.length)) {
    const currentBookedSlots = bookings[resource]
    for (const bookedSlot of currentBookedSlots) {
      const {colliding, nonColliding} = findCollidingSlots(currentFreeSlots, bookedSlot)
      let subtractedSlots = []
      for (const collidingSlot of colliding) {
        subtractedSlots = [...subtractedSlots, ...slotSubtract(collidingSlot, bookedSlot, resource)]
      }
      currentFreeSlots = [...nonColliding, ...subtractedSlots]
    }
    currentFreeSlots = removeZeroTimeSlots(currentFreeSlots)
  }

  return currentFreeSlots
}

export const getFreeSlots = (availability: Slot, bookings: Slot[][]): ResourceSlot[] => {
  return getFreeIntSlots(
    // Convert time string into int
    {
      start: timeToInt(availability.start),
      end: timeToInt(availability.end)
    },
    bookings.map(nurseBookings => nurseBookings.map(slot => ({
      start: timeToInt(slot.start),
      end: timeToInt(slot.end),
    })))
    // Convert back time int into time string
  ).map(freeSlot => ({
    ...freeSlot,
    start: intToTime(freeSlot.start),
    end: intToTime(freeSlot.end),
  }))
}
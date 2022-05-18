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
  return `${Math.round(timeInt / 60)}:${timeInt % 60}`
}

export const getFreeSlots = (availability: {start: string, end: string}, bookings: {start: string, end: string}[][]): {start: string, end: string, nurses: number[]}[] => {
  const initialFreeSlot = [{
    ...availability,
    nurses: range(bookings.length)
  }]
  return initialFreeSlot
}
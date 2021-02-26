interface IPart {
  header: string
  buffer: Buffer
}

interface IProcess {
  name: string
  data: string
}

export const Parse = (
  multipartBodyBuffer: Buffer,
  boundary: string
): Record<string, string> => {
  const process = (part: IPart): IProcess => {
    const obj = (str: string) => {
      const k = str.split('=')
      const a = k[0].trim()
      const b = JSON.parse(k[1].trim())
      const o = {}
      Object.defineProperty(o, a, {
        value: b,
        writable: true,
        enumerable: true,
        configurable: true
      })
      return o
    }

    const header = part.header.split(';')
    const name = obj(header[1])
    Object.defineProperty(name, 'data', {
      value: Buffer.from(part.buffer).toString('utf-8'),
      writable: true,
      enumerable: true,
      configurable: true
    })
    return name as IProcess
  }

  let lastline = ''
  let header = ''
  let state = 0
  const allParts: IProcess[] = []
  let buffer = []

  for (let i = 0; i < multipartBodyBuffer.length; i++) {
    const oneByte = multipartBodyBuffer[i]
    const prevByte = i > 0 ? multipartBodyBuffer[i - 1] : null
    const newLineDetected = !!(oneByte === 0x0a && prevByte === 0x0d)
    const newLineChar = !!(oneByte === 0x0a || oneByte === 0x0d)

    if (!newLineChar) {
      lastline += String.fromCharCode(oneByte)
    }

    if (state === 0 && newLineDetected) {
      if ('--' + boundary === lastline) {
        state = 1
      }
      lastline = ''
    } else {
      if (state === 1 && newLineDetected) {
        header = lastline
        state = 2
        lastline = ''
      } else {
        if (state === 2 && newLineDetected) {
          buffer = []
          state = 3
          lastline = ''
        } else {
          if (state === 3) {
            if (lastline.length > boundary.length + 4) lastline = '' // mem save
            if ('--' + boundary === lastline) {
              const j = buffer.length - lastline.length
              const data = buffer.slice(0, j - 1)
              const p = { header: header, buffer: Buffer.from(data) }
              allParts.push(process(p))
              buffer = []
              lastline = ''
              state = 4
              header = ''
              // info='';
            } else {
              buffer.push(oneByte)
            }
            if (newLineDetected) lastline = ''
          } else {
            if (state === 4 && newLineDetected) {
              state = 1
            }
          }
        }
      }
    }
  }
  const newData = {}
  // const allNames = allParts.map(item => item.name)
  // const allDatas = allParts.map(item => item.data)
  allParts.map(item =>
    Object.defineProperty(newData, item.name, {
      value: item.data,
      writable: true,
      enumerable: true,
      configurable: true
    })
  )
  return newData
}

export const getBoundary = (header: string): string => {
  const items = header.split(';')
  if (items) {
    for (let i = 0; i < items.length; i++) {
      const item = String(items[i]).trim()
      if (item.indexOf('boundary') >= 0) {
        const k = item.split('=')
        return String(k[1]).trim()
      }
    }
  }
  return ''
}

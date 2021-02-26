import { NextApiRequest, NextApiResponse } from 'next'
import { Parse, getBoundary } from '../../libs/mailparser'

const inbound = (_req: NextApiRequest, res: NextApiResponse) => {
  const { method } = _req
  const header = _req.headers['content-type']
  // const header = 'multipart/form-data; boundary=xYzZY'

  try {
    if (method === 'POST') {
      if(header) {
        const boundary = getBoundary(header)
        console.log(boundary)
        const parser = Parse(Buffer.from(_req.body), boundary)

        console.log(parser)
        res.status(200).end()
      }

    } else {
      console.log(`Method ${method} Not Allowed`)
      res.setHeader('Allow', ['POST'])
      res.status(405).end(`Method ${method} Not Allowed`)
    }
  } catch (err) {
    res.status(500).json({ statusCode: 500, message: err.message })
  }
}

export default inbound

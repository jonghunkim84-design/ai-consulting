import OpenAI from 'openai'
import { IncomingForm } from 'formidable'
import fs from 'fs'
import path from 'path'

export const config = {
  api: { bodyParser: false }
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const form = new IncomingForm({
      keepExtensions: true,
      maxFileSize: 25 * 1024 * 1024,
    })

    const [, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err)
        else resolve([fields, files])
      })
    })

    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio
    if (!audioFile) {
      return res.status(400).json({ error: '파일이 없습니다' })
    }

    const filePath = audioFile.filepath || audioFile.path
    const ext = path.extname(audioFile.originalFilename || '.mp3') || '.mp3'
    const safeName = 'audio' + ext

    const fileStream = fs.createReadStream(filePath)
    fileStream.path = safeName

    const transcription = await openai.audio.transcriptions.create({
      file: fileStream,
      model: 'whisper-1',
      language: 'ko',
    })

    return res.status(200).json({ text: transcription.text })

  } catch (error) {
    console.error('Whisper 오류:', error)
    return res.status(500).json({ error: error.message })
  }
}

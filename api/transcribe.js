import OpenAI, { toFile } from 'openai'
import { IncomingForm } from 'formidable'
import fs from 'fs'
import path from 'path'

export const config = {
  api: { bodyParser: false }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // BOM(u+FEFF) 및 공백 제거
    const apiKey = (process.env.OPENAI_API_KEY || '').replace(/^﻿/, '').trim()
    console.log('STEP1 apiKey len:', apiKey.length, 'char0 code:', apiKey.charCodeAt(0))

    if (!apiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY가 설정되지 않았습니다' })
    }

    const openai = new OpenAI({ apiKey })

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
    console.log('STEP2 filePath:', filePath, 'safeName:', safeName)

    const file = await toFile(fs.createReadStream(filePath), safeName)
    console.log('STEP3 toFile ok')

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'ko',
    })

    console.log('STEP4 done, text len:', transcription.text?.length)
    return res.status(200).json({ text: transcription.text })

  } catch (error) {
    console.error('Whisper 오류:', error.message)
    return res.status(500).json({ error: error.message })
  }
}

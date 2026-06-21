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
    // Step 1: API 키 확인
    const apiKey = process.env.OPENAI_API_KEY || ''
    console.log('STEP1 apiKey len:', apiKey.length, 'charCodes[0..3]:', [...apiKey.slice(0,4)].map(c=>c.charCodeAt(0)))

    const openai = new OpenAI({ apiKey })

    // Step 2: 파일 파싱
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
    const origName = audioFile.originalFilename || 'audio.mp3'
    const ext = path.extname(origName) || '.mp3'
    const safeName = 'audio' + ext
    console.log('STEP2 filePath:', filePath, 'safeName:', safeName, 'size:', audioFile.size)

    // Step 3: toFile 변환
    const file = await toFile(fs.createReadStream(filePath), safeName)
    console.log('STEP3 toFile ok, name:', file.name)

    // Step 4: Whisper API 호출
    console.log('STEP4 calling Whisper...')
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'ko',
    })

    console.log('STEP4 done, text len:', transcription.text?.length)
    return res.status(200).json({ text: transcription.text })

  } catch (error) {
    console.error('Whisper 오류:', error.message, error.stack?.split('\n')[1])
    return res.status(500).json({ error: error.message })
  }
}

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

    const whisperRawText = transcription.text
    console.log('STEP4 whisper done, text len:', whisperRawText?.length)

    // Claude API로 질문 추출 + Q1~Q3 매칭
    const anthropicKey = (process.env.ANTHROPIC_API_KEY || '').trim()
    if (!anthropicKey) {
      console.log('STEP5 no ANTHROPIC_API_KEY, returning raw text')
      return res.status(200).json({ raw: whisperRawText, summary: whisperRawText, q1Match: null, q2Match: null, q3Match: null })
    }

    console.log('STEP5 calling Claude for question extraction')
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: '당신은 소상공인 인터뷰 전문 컨설턴트의 어시스턴트입니다.',
        messages: [{
          role: 'user',
          content: `아래는 인터뷰 현장 음성을 텍스트로 변환한 내용입니다.

[STT 원문]
${whisperRawText}

위 텍스트에서 인터뷰이(고객)의 답변 내용만 추출해 핵심 내용으로 정리하세요.

규칙:
- 인터뷰어(컨설턴트)의 질문 발화는 제외
- 고객이 한 말만 포함
- 추임새, 맞장구, 잡담, 의미 없는 반복은 제외
- 핵심 내용만 간결하게 정제 (원문 그대로가 아닌 요약·정리)
- 주제별로 단락을 나눠 출력 (빈 줄로 구분)
- 한국어로 출력

추가로, 정리한 고객 답변에서 아래 핵심 주제 3가지에 해당하는 내용을 찾아 JSON으로도 출력하세요.

핵심 주제 기준:
- Q1: "하루 일과" — 아침부터 마감까지 일과 흐름에 대한 고객 답변
- Q2: "시간이 제일 많이 걸리는 일, 실수가 잦은 일" — 업무 비효율/실수에 대한 고객 답변
- Q3: "자다가 걱정되는 일, 월말에 골치 아픈 일" — 걱정/스트레스/골치 아픈 업무에 대한 고객 답변

출력 형식: 고객 답변 요약 먼저 출력하고, 구분선 "---" 이후 JSON 블록 출력.
---
{"q1": "해당 주제 고객 답변 요약 또는 null", "q2": "...", "q3": "..."}

고객 답변 요약과 JSON 외에 다른 설명은 붙이지 마세요.`
        }]
      })
    })

    const claudeData = await claudeRes.json()
    const claudeText = claudeData.content?.[0]?.text || ''
    console.log('STEP6 Claude done, response len:', claudeText.length)

    const parts = claudeText.split('---')
    const questions = (parts[0] || '').trim()
    let q1Match = null, q2Match = null, q3Match = null

    if (parts[1]) {
      try {
        const jsonStr = parts[1].replace(/```json|```/g, '').trim()
        const parsed = JSON.parse(jsonStr)
        q1Match = parsed.q1 && parsed.q1 !== 'null' ? parsed.q1 : null
        q2Match = parsed.q2 && parsed.q2 !== 'null' ? parsed.q2 : null
        q3Match = parsed.q3 && parsed.q3 !== 'null' ? parsed.q3 : null
      } catch (e) {
        console.log('STEP6 JSON parse error:', e.message)
      }
    }

    return res.status(200).json({
      raw: whisperRawText,
      summary: questions || whisperRawText,
      q1Match,
      q2Match,
      q3Match,
    })

  } catch (error) {
    console.error('Whisper 오류:', error.message)
    return res.status(500).json({ error: error.message })
  }
}

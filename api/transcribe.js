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
        max_tokens: 1500,
        system: '당신은 AI 컨설팅 전문가입니다.\n인터뷰 녹취록에서 고객 답변을 추출하여 JSON으로만 출력하세요.\n컨설턴트 발언은 제외하고 고객 답변만 정리하세요.\n다른 텍스트, 설명, 마크다운 없이 JSON만 출력하세요.',
        messages: [{
          role: 'user',
          content: `아래는 인터뷰 녹취록 전문이다.\n컨설턴트 발언은 제외하고 고객 답변만 추출하여\n아래 3개 항목으로 분류해 JSON 형식으로만 응답하라.\n각 항목은 핵심 내용만 간결하게 bullet 형태로 정리하라.\n\n[녹취록]\n${whisperRawText}\n\n응답 JSON 형식:\n{"q1":"하루 일과 및 운영 흐름 관련 고객 답변 요약 (bullet 3~5개, 줄바꿈 구분)","q2":"시간이 많이 걸리거나 실수가 잦은 업무 관련 고객 답변 요약 (bullet 3~5개, 줄바꿈 구분)","q3":"걱정되는 일, 월말 골치 아픈 일 관련 고객 답변 요약 (bullet 3~5개, 줄바꿈 구분)"}\n\nbullet 형식 예시:\n"• 매일 아침 재고 수기 확인\\n• 직원 빠뜨리는 경우 많음\\n• 품절 발생 주 1~2회"`
        }]
      })
    })

    const claudeData = await claudeRes.json()
    const claudeText = claudeData.content?.[0]?.text || ''
    console.log('STEP6 Claude done, response len:', claudeText.length)

    let q1Match = null, q2Match = null, q3Match = null
    let summaryText = whisperRawText

    try {
      const clean = claudeText.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      q1Match = parsed.q1 && parsed.q1 !== 'null' ? parsed.q1 : null
      q2Match = parsed.q2 && parsed.q2 !== 'null' ? parsed.q2 : null
      q3Match = parsed.q3 && parsed.q3 !== 'null' ? parsed.q3 : null
      summaryText = [
        '[ Q1: 하루 일과 ]', q1Match || '(해당 내용 없음)',
        '',
        '[ Q2: 시간/실수 업무 ]', q2Match || '(해당 내용 없음)',
        '',
        '[ Q3: 걱정/골치 아픈 일 ]', q3Match || '(해당 내용 없음)',
      ].join('\n')
    } catch (e) {
      console.log('STEP6 JSON parse error:', e.message)
      summaryText = claudeText || whisperRawText
    }

    return res.status(200).json({
      raw: whisperRawText,
      summary: summaryText,
      q1Match,
      q2Match,
      q3Match,
    })

  } catch (error) {
    console.error('Whisper 오류:', error.message)
    return res.status(500).json({ error: error.message })
  }
}

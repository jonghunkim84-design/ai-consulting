export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { system, user, max_tokens = 1200, model, messages, temperature } = req.body
  const actualMessages = messages || [{ role: 'user', content: user }]
  const actualModel = model || 'claude-sonnet-4-6'

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: actualModel,
        max_tokens,
        system,
        messages: actualMessages,
        ...(temperature !== undefined && { temperature }),
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'API error' })
    }

    return res.status(200).json({ text: data.content?.[0]?.text || '' })
  } catch (error) {
    console.error('Claude proxy error:', error)
    return res.status(500).json({ error: error.message })
  }
}

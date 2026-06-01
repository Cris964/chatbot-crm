export default function handler(req, res) {
  res.status(200).json({
    hasOpenAiKey: !!process.env.OPENAI_API_KEY,
    openAiKeyLen: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
    hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY
  });
}

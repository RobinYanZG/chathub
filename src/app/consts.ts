import chatgptLogo from '~/assets/logos/chatgpt.svg'
import geminiLogo from '~/assets/logos/gemini.png'
import { BotId } from './bots'

export const CHATBOTS: Record<BotId, { name: string; avatar: string }> = {
  chatgpt: {
    name: 'ChatGPT',
    avatar: chatgptLogo,
  },
  gemini: {
    name: 'Gemini',
    avatar: geminiLogo,
  },
  deepseek: {
    name: 'DeepSeek',
    avatar: chatgptLogo,
  },
}

export const CHATGPT_HOME_URL = 'https://chat.openai.com'
export const CHATGPT_API_MODELS = ['gpt-3.5-turbo', 'gpt-4o-mini', 'gpt-4o', 'gpt-5.1'] as const
export const DEEPSEEK_API_MODELS = ['deepseek-chat', 'deepseek-reasoner'] as const
export const ALL_IN_ONE_PAGE_ID = 'all'

export const DEFAULT_CHATGPT_SYSTEM_MESSAGE =
  'You are ChatGPT, a large language model trained by OpenAI. Answer as concisely as possible. Knowledge cutoff: 2021-09-01. Current date: {current_date}'

export type Layout = 2 | 3 | 4 | 'imageInput' | 'twoVertical' | 'sixGrid' // twoVertical is deprecated

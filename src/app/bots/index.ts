import { ChatGPTBot } from './chatgpt'
import { DeepseekBot } from './deepseek'
import { GeminiBot } from './gemini-api'

export type BotId =
  | 'chatgpt'
  | 'gemini'
  | 'deepseek'

export function createBotInstance(botId: BotId) {
  switch (botId) {
    case 'chatgpt':
      return new ChatGPTBot()
    case 'gemini':
      return new GeminiBot()
    case 'deepseek':
      return new DeepseekBot()
  }
}

export type BotInstance = ReturnType<typeof createBotInstance>

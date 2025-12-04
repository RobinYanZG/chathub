import { DEEPSEEK_API_MODELS, DEFAULT_CHATGPT_SYSTEM_MESSAGE } from '~app/consts'
import { getUserConfig, UserConfig } from '~services/user-config'
import { ChatError, ErrorCode } from '~utils/errors'
import { AsyncAbstractBot } from '../abstract-bot'
import { AbstractChatGPTApiBot } from '../chatgpt-api'
import { ChatMessage } from '../chatgpt-api/types'

class DeepseekApiBot extends AbstractChatGPTApiBot {
  constructor(
    private config: Pick<UserConfig, 'deepseekApiKey' | 'deepseekApiModel' | 'deepseekApiHost'>,
  ) {
    super()
  }

  getSystemMessage() {
    return DEFAULT_CHATGPT_SYSTEM_MESSAGE
  }

  async fetchCompletionApi(messages: ChatMessage[], signal?: AbortSignal) {
    const { deepseekApiHost, deepseekApiKey, deepseekApiModel } = this.config
    const resp = await fetch(`${deepseekApiHost}/v1/chat/completions`, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: deepseekApiModel || DEEPSEEK_API_MODELS[0],
        messages,
        stream: true,
      }),
    })
    if (!resp.ok) {
      const error = await resp.text()
      if (error.includes('insufficient_quota')) {
        throw new ChatError('Insufficient DeepSeek API usage quota', ErrorCode.CHATGPT_INSUFFICIENT_QUOTA)
      }
    }
    return resp
  }

  get name() {
    return `DeepSeek (${this.config.deepseekApiModel || DEEPSEEK_API_MODELS[0]})`
  }
}

export class DeepseekBot extends AsyncAbstractBot {
  async initializeBot() {
    const { deepseekApiHost, deepseekApiKey, deepseekApiModel } = await getUserConfig()
    if (!deepseekApiKey) {
      throw new ChatError('DeepSeek API key not set', ErrorCode.API_KEY_NOT_SET)
    }
    return new DeepseekApiBot({ deepseekApiHost, deepseekApiKey, deepseekApiModel })
  }
}

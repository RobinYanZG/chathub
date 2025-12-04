import { defaults } from 'lodash-es'
import Browser from 'webextension-polyfill'
import { BotId } from '~app/bots'
import {
  ALL_IN_ONE_PAGE_ID,
  CHATBOTS,
  CHATGPT_API_MODELS,
  DEFAULT_CHATGPT_SYSTEM_MESSAGE,
  DEEPSEEK_API_MODELS,
} from '~app/consts'

export enum ChatGPTMode {
  Webapp = 'webapp',
  API = 'api',
}

export enum ChatGPTWebModel {
  'GPT-3.5' = 'gpt-3.5',
  'GPT-4' = 'gpt-4',
  'GPT-4o' = 'gpt-4o',
  'GPT-5.1' = 'gpt-5.1',
}

const userConfigWithDefaultValue = {
  openaiApiKey: '',
  openaiApiHost: 'https://api.openai.com',
  chatgptApiModel: CHATGPT_API_MODELS[0] as (typeof CHATGPT_API_MODELS)[number],
  chatgptApiTemperature: 1,
  chatgptApiSystemMessage: DEFAULT_CHATGPT_SYSTEM_MESSAGE,
  chatgptMode: ChatGPTMode.Webapp,
  chatgptWebappModelName: ChatGPTWebModel['GPT-3.5'],
  startupPage: ALL_IN_ONE_PAGE_ID,
  enabledBots: Object.keys(CHATBOTS).slice(0, 8) as BotId[],
  chatgptWebAccess: false,
  geminiApiKey: '',
  deepseekApiKey: '',
  deepseekApiHost: 'https://api.deepseek.com',
  deepseekApiModel: undefined as (typeof DEEPSEEK_API_MODELS)[number] | undefined,
}

export type UserConfig = typeof userConfigWithDefaultValue

export async function getUserConfig(): Promise<UserConfig> {
  const result = await Browser.storage.sync.get(Object.keys(userConfigWithDefaultValue))
  if (!result.chatgptMode && result.openaiApiKey) {
    result.chatgptMode = ChatGPTMode.API
  }
  if (result.chatgptWebappModelName === 'default') {
    result.chatgptWebappModelName = ChatGPTWebModel['GPT-3.5']
  } else if (result.chatgptWebappModelName === 'gpt-4-browsing') {
    result.chatgptWebappModelName = ChatGPTWebModel['GPT-4']
  } else if (result.chatgptWebappModelName === 'gpt-3.5-mobile') {
    result.chatgptWebappModelName = ChatGPTWebModel['GPT-3.5']
  } else if (result.chatgptWebappModelName === 'gpt-4-mobile') {
    result.chatgptWebappModelName = ChatGPTWebModel['GPT-4']
  }
  if (result.chatgptApiModel === 'gpt-3.5-turbo-16k') {
    result.chatgptApiModel = 'gpt-3.5-turbo'
  } else if (result.chatgptApiModel === 'gpt-4-32k') {
    result.chatgptApiModel = 'gpt-4'
  }
  return defaults(result, userConfigWithDefaultValue)
}

export async function updateUserConfig(updates: Partial<UserConfig>) {
  console.debug('update configs', updates)
  await Browser.storage.sync.set(updates)
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) {
      await Browser.storage.sync.remove(key)
    }
  }
}

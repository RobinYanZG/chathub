import { FC } from 'react'
import { DEEPSEEK_API_MODELS } from '~app/consts'
import { UserConfig } from '~services/user-config'
import { Input } from '../Input'
import Select from '../Select'

interface Props {
  userConfig: UserConfig
  updateConfigValue: (update: Partial<UserConfig>) => void
}

const DeepseekAPISettings: FC<Props> = ({ userConfig, updateConfigValue }) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <p className="font-medium text-sm">API Host</p>
        <Input
          placeholder="https://api.deepseek.com"
          value={userConfig.deepseekApiHost}
          onChange={(e) => updateConfigValue({ deepseekApiHost: e.currentTarget.value })}
        />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-medium text-sm">API Key</p>
        <Input
          placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          value={userConfig.deepseekApiKey}
          onChange={(e) => updateConfigValue({ deepseekApiKey: e.currentTarget.value })}
          type="password"
        />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-medium text-sm">Model</p>
        <Select
          options={DEEPSEEK_API_MODELS.map((m) => ({ name: m, value: m }))}
          value={userConfig.deepseekApiModel || DEEPSEEK_API_MODELS[0]}
          onChange={(v) => updateConfigValue({ deepseekApiModel: v as (typeof DEEPSEEK_API_MODELS)[number] })}
        />
      </div>
    </div>
  )
}

export default DeepseekAPISettings

import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { sample, uniqBy } from 'lodash-es'
import { FC, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cx } from '~/utils'
import Button from '~app/components/Button'
import ChatMessageInput from '~app/components/Chat/ChatMessageInput'
import LayoutSwitch from '~app/components/Chat/LayoutSwitch'
import { CHATBOTS, Layout } from '~app/consts'
import { useChat } from '~app/hooks/use-chat'
import { usePremium } from '~app/hooks/use-premium'
import { trackEvent } from '~app/plausible'
import { showPremiumModalAtom } from '~app/state'
import Toggle from '~app/components/Toggle'
import { BotId } from '../bots'
import ConversationPanel from '../components/Chat/ConversationPanel'
import { uuid } from '~utils'

const DEFAULT_BOTS: BotId[] = Object.keys(CHATBOTS).slice(0, 6) as BotId[]

const layoutAtom = atomWithStorage<Layout>('multiPanelLayout', 2, undefined, { getOnInit: true })
const twoPanelBotsAtom = atomWithStorage<BotId[]>('multiPanelBots:2', DEFAULT_BOTS.slice(0, 2))
const threePanelBotsAtom = atomWithStorage<BotId[]>('multiPanelBots:3', DEFAULT_BOTS.slice(0, 3))
const fourPanelBotsAtom = atomWithStorage<BotId[]>('multiPanelBots:4', DEFAULT_BOTS.slice(0, 4))
const sixPanelBotsAtom = atomWithStorage<BotId[]>('multiPanelBots:6', DEFAULT_BOTS.slice(0, 6))
const autoSummarizeAtom = atomWithStorage<boolean>('autoSummarize', false)

interface PendingSummaryState {
  roundId: string
  startCounts: Record<BotId, number>
  createdAt: number
}

const SUMMARY_TIMEOUT = 30_000

function generateSummaryPrompt(responses: { label: string; text: string }[]) {
  const content = responses
    .map(({ label, text }) => `[${label}]: ${text}`)
    .join('\n')

  return `[系统指令: You are a strict logic judge and aggregator.]
以下是针对同一个问题，不同 AI 模型给出的回答。请分析这些回答：
1. 识别它们的一致点。
2. 指出它们之间的矛盾点或事实错误（如果有）。
3. 综合给出一个最准确、最全面的最终结论。

---
${content}`
}

function replaceDeprecatedBots(bots: BotId[]): BotId[] {
  return bots.map((bot) => {
    if (CHATBOTS[bot]) {
      return bot
    }
    return sample(DEFAULT_BOTS)!
  })
}

const GeneralChatPanel: FC<{
  chats: ReturnType<typeof useChat>[]
  setBots?: ReturnType<typeof useSetAtom<typeof twoPanelBotsAtom>>
  supportImageInput?: boolean
}> = ({ chats, setBots, supportImageInput }) => {
  const { t } = useTranslation()
  const generating = useMemo(() => chats.some((c) => c.generating), [chats])
  const uniqueChats = useMemo(() => uniqBy(chats, (c) => c.botId), [chats])
  const [autoSummarize, setAutoSummarize] = useAtom(autoSummarizeAtom)
  const [pendingSummary, setPendingSummary] = useState<PendingSummaryState | undefined>(undefined)
  const [layout, setLayout] = useAtom(layoutAtom)

  const setPremiumModalOpen = useSetAtom(showPremiumModalAtom)
  const premiumState = usePremium()
  const disabled = useMemo(() => !premiumState.isLoading && !premiumState.activated, [premiumState])

  useEffect(() => {
    if (disabled && (chats.length > 2 || supportImageInput)) {
      setPremiumModalOpen('all-in-one-layout')
    }
  }, [chats.length, disabled, setPremiumModalOpen, supportImageInput])

  const sendSingleMessage = useCallback(
    (input: string, botId: BotId) => {
      const chat = chats.find((c) => c.botId === botId)
      chat?.sendMessage(input)
    },
    [chats],
  )

  const sendAllMessage = useCallback(
    (input: string, image?: File) => {
      if (disabled && chats.length > 2) {
        setPremiumModalOpen('all-in-one-layout')
        return
      }
      const startCounts = Object.fromEntries(uniqueChats.map((c) => [c.botId, c.messages.length])) as Record<BotId, number>
      if (autoSummarize) {
        setPendingSummary({ roundId: uuid(), startCounts, createdAt: Date.now() })
      } else {
        setPendingSummary(undefined)
      }
      uniqBy(chats, (c) => c.botId).forEach((c) => c.sendMessage(input, image))
      trackEvent('send_messages', { layout, disabled })
    },
    [autoSummarize, chats, disabled, layout, setPremiumModalOpen, uniqueChats],
  )

  const onSwitchBot = useCallback(
    (botId: BotId, index: number) => {
      if (!setBots) {
        return
      }
      trackEvent('switch_bot', { botId, panel: chats.length })
      setBots((bots) => {
        const newBots = [...bots]
        newBots[index] = botId
        return newBots
      })
    },
    [chats.length, setBots],
  )

  const onLayoutChange = useCallback(
    (v: Layout) => {
      trackEvent('switch_all_in_one_layout', { layout: v })
      setLayout(v)
    },
    [setLayout],
  )

  useEffect(() => {
    if (!autoSummarize || !pendingSummary) {
      return
    }

    const readyResponses = uniqueChats
      .map((chat) => {
        const startIndex = pendingSummary.startCounts[chat.botId] ?? chat.messages.length
        const latestBotMessage = [...chat.messages.slice(startIndex)].reverse().find((m) => m.author === chat.botId && m.text)
        return { chat, latestBotMessage }
      })
      .filter(({ latestBotMessage }) => latestBotMessage && !latestBotMessage.error)

    const allBotsDone = readyResponses.length === uniqueChats.length && uniqueChats.every((c) => !c.generating)
    const timedOut = Date.now() - pendingSummary.createdAt > SUMMARY_TIMEOUT

    if (!allBotsDone && !(timedOut && readyResponses.length)) {
      return
    }

    const prompt = generateSummaryPrompt(
      readyResponses.map(({ chat, latestBotMessage }) => ({
        label: CHATBOTS[chat.botId]?.name || chat.botId,
        text: latestBotMessage!.text,
      })),
    )

    const summarizer = uniqueChats[0]
    if (summarizer) {
      summarizer.sendMessage(prompt)
      trackEvent('auto_summarize', { bots: uniqueChats.length, timedOut: !allBotsDone })
    }

    setPendingSummary(undefined)
  }, [autoSummarize, pendingSummary, uniqueChats])

  return (
    <div className="flex flex-col overflow-hidden h-full">
      <div
        className={cx(
          'grid overflow-hidden grow auto-rows-fr',
          chats.length % 3 === 0 ? 'grid-cols-3' : 'grid-cols-2',
          chats.length > 3 ? 'gap-2 mb-2' : 'gap-3 mb-3',
        )}
      >
        {chats.map((chat, index) => (
          <ConversationPanel
            key={`${chat.botId}-${index}`}
            botId={chat.botId}
            bot={chat.bot}
            messages={chat.messages}
            onUserSendMessage={(input) => sendSingleMessage(input, chat.botId)}
            generating={chat.generating}
            stopGenerating={chat.stopGenerating}
            mode="compact"
            resetConversation={chat.resetConversation}
            onSwitchBot={setBots ? (botId) => onSwitchBot(botId, index) : undefined}
          />
        ))}
      </div>
      <div className="flex flex-row gap-3 items-center">
        <LayoutSwitch layout={layout} onChange={onLayoutChange} />
        <div className="flex items-center gap-2 text-sm text-primary-text">
          <span className="cursor-default select-none">Auto-Summarize</span>
          <Toggle enabled={autoSummarize} onChange={setAutoSummarize} />
        </div>
        <ChatMessageInput
          mode="full"
          className="rounded-2xl bg-primary-background px-4 py-2 grow"
          disabled={generating}
          onSubmit={sendAllMessage}
          actionButton={!generating && <Button text={t('Send')} color="primary" type="submit" />}
          autoFocus={true}
          supportImageInput={supportImageInput}
        />
      </div>
    </div>
  )
}

const TwoBotChatPanel = () => {
  const [bots, setBots] = useAtom(twoPanelBotsAtom)
  const multiPanelBotIds = useMemo(() => replaceDeprecatedBots(bots), [bots])
  const chat1 = useChat(multiPanelBotIds[0])
  const chat2 = useChat(multiPanelBotIds[1])
  const chats = useMemo(() => [chat1, chat2], [chat1, chat2])
  return <GeneralChatPanel chats={chats} setBots={setBots} />
}

const ThreeBotChatPanel = () => {
  const [bots, setBots] = useAtom(threePanelBotsAtom)
  const multiPanelBotIds = useMemo(() => replaceDeprecatedBots(bots), [bots])
  const chat1 = useChat(multiPanelBotIds[0])
  const chat2 = useChat(multiPanelBotIds[1])
  const chat3 = useChat(multiPanelBotIds[2])
  const chats = useMemo(() => [chat1, chat2, chat3], [chat1, chat2, chat3])
  return <GeneralChatPanel chats={chats} setBots={setBots} />
}

const FourBotChatPanel = () => {
  const [bots, setBots] = useAtom(fourPanelBotsAtom)
  const multiPanelBotIds = useMemo(() => replaceDeprecatedBots(bots), [bots])
  const chat1 = useChat(multiPanelBotIds[0])
  const chat2 = useChat(multiPanelBotIds[1])
  const chat3 = useChat(multiPanelBotIds[2])
  const chat4 = useChat(multiPanelBotIds[3])
  const chats = useMemo(() => [chat1, chat2, chat3, chat4], [chat1, chat2, chat3, chat4])
  return <GeneralChatPanel chats={chats} setBots={setBots} />
}

const SixBotChatPanel = () => {
  const [bots, setBots] = useAtom(sixPanelBotsAtom)
  const multiPanelBotIds = useMemo(() => replaceDeprecatedBots(bots), [bots])
  const chat1 = useChat(multiPanelBotIds[0])
  const chat2 = useChat(multiPanelBotIds[1])
  const chat3 = useChat(multiPanelBotIds[2])
  const chat4 = useChat(multiPanelBotIds[3])
  const chat5 = useChat(multiPanelBotIds[4])
  const chat6 = useChat(multiPanelBotIds[5])
  const chats = useMemo(() => [chat1, chat2, chat3, chat4, chat5, chat6], [chat1, chat2, chat3, chat4, chat5, chat6])
  return <GeneralChatPanel chats={chats} setBots={setBots} />
}

const ImageInputPanel = () => {
  const chat1 = useChat('chatgpt')
  const chat2 = useChat('bing')
  const chat3 = useChat('bard')
  const chats = useMemo(() => [chat1, chat2, chat3], [chat1, chat2, chat3])
  return <GeneralChatPanel chats={chats} supportImageInput={true} />
}

const MultiBotChatPanel: FC = () => {
  const layout = useAtomValue(layoutAtom)
  if (layout === 'sixGrid') {
    return <SixBotChatPanel />
  }
  if (layout === 4) {
    return <FourBotChatPanel />
  }
  if (layout === 3) {
    return <ThreeBotChatPanel />
  }
  if (layout === 'imageInput') {
    return <ImageInputPanel />
  }
  return <TwoBotChatPanel />
}

const MultiBotChatPanelPage: FC = () => {
  return (
    <Suspense>
      <MultiBotChatPanel />
    </Suspense>
  )
}

export default MultiBotChatPanelPage

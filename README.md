<p align="center">
    <img src="./src/assets/icon.png" width="150">
</p>

<h1 align="center">ChatHub</h1>

<div align="center">

### Install

<a href="https://chrome.google.com/webstore/detail/chathub-all-in-one-chatbo/iaakpnchhognanibcahlpcplchdfmgma?utm_source=github"><img src="https://user-images.githubusercontent.com/64502893/231991498-8df6dd63-727c-41d0-916f-c90c15127de3.png" width="200" alt="Get ChatHub for Chromium"></a>

</div>

## 📷 Screenshot

![Screenshot](screenshots/extension.png?raw=true)

## 🤝 Sponsors

<a href="https://getstream.io/chat/sdk/react/?utm_source=github&utm_medium=referral&utm_content=&utm_campaign=wong2">
  <img src="screenshots/stream-logo.jpg" width="200" />
</a>

## ✨ Features

- 🤖 Use different chatbots in one app, currently supporting ChatGPT, new Bing Chat, Google Bard, Claude, and open-source models including LLama2, Vicuna, ChatGLM etc
- 💬 Chat with multiple chatbots at the same time, making it easy to compare their answers
- 🚀 Support ChatGPT API and GPT-4 Browsing
- 🔍 Shortcut to quickly activate the app anywhere in the browser
- 🎨 Markdown and code highlight support
- 📚 Prompt Library for custom prompts and community prompts
- 💾 Conversation history saved locally
- 📥 Export and Import all your data
- 🔗 Share conversation to markdown
- 🌙 Dark mode
- 🌐 Web access

## 🤖 Supported Bots

- ChatGPT (via Webapp/API/Azure/Poe)
- Bing Chat
- Google Bard
- Claude 2 (via Webapp/API/Poe)
- LLaMA 2
- ChatGLM
- Pi by Inflection
- Vicuna
- WizardLM
- iFlytek Spark
- Tongyi Qianwen
- Baichuan
- ...

## 🔨 Build from Source

- Clone the source code
- `corepack enable`
- `yarn install`
- `yarn build`
- In Chrome/Edge go to the Extensions page (chrome://extensions or edge://extensions)
- Enable Developer Mode
- Drag the `dist` folder anywhere on the page to import it (do not delete the folder afterward)

## 🧪 Manually testing Auto-Summarize

1. Run `yarn build` (or `yarn dev` during development) and load the extension into Chrome/Edge as described above.
2. Open the **All-in-One** (multi-bot) panel and keep at least two bots active.
3. Toggle **Auto-Summarize** on the toolbar next to the layout switch.
4. Ask a question; wait for each bot to finish replying (or for the 30s timeout if one stalls).
5. Verify the first bot in the panel automatically posts a judge-style summary that merges and critiques the other bots’ answers.
6. Send another manual question with Auto-Summarize off to confirm normal single-round behavior still works.

# Teams-like Work Chat Theme for ChatGPT

ChatGPT Web版の見た目を、仕事用チャット風の落ち着いたUIに寄せるChrome拡張機能です。Teams-likeな縦ナビ、薄いグレーの背景、白いチャットカード、紫系アクセントを追加します。

この拡張機能は非公式です。Microsoft、Teams、OpenAI、ChatGPTの公式サービスではなく、各社との提携や承認を示すものではありません。

## 対象URL

- `https://chatgpt.com/*`
- `https://chat.openai.com/*`

## 導入方法

1. Chromeで `chrome://extensions` を開きます。
2. 右上の「Developer mode」をONにします。
3. 「Load unpacked」を押します。
4. このフォルダを選択します。
5. `chatgpt.com` または `chat.openai.com` を開きます。

## 使い方

- 拡張機能アイコンをクリックするとpopupが開きます。
- popupのスイッチでテーマのON/OFFを切り替えられます。
- ON/OFF状態は `chrome.storage.sync` に保存され、Chrome同期が有効なら環境間で共有されます。
- OFFにすると、追加した縦ナビとテーマ用CSSクラスを削除します。

## 実装メモ

- Manifest V3対応です。
- TypeScriptやビルド工程は不要です。
- content scriptがCSSリンクとJS処理を注入します。
- ChatGPTのSPA遷移やDOM更新に追従するため、`MutationObserver` とHistory APIフックを使っています。
- ChatGPT側のDOM変更に備えて、`data-message-author-role`、`data-testid`、`role`、`main`、`form` などのセレクタを併用しています。
- 768px以下の画面幅では、左側の縦ナビを非表示にします。

## 注意点

- Microsoft Teamsのロゴや公式アセットは使用していません。
- 拡張名や説明は「Teams-like」「work chat theme」という表現に留め、公式サービスと誤認される表現を避けています。
- ChatGPT Web版のDOM構造は変更される可能性があるため、将来のアップデートで表示が崩れる場合があります。
- この拡張機能は指定URL上でのみ動作します。

# ikide - 逝者如斯

`ikide` 是一個基於 React Native (Expo) 開發的極簡主義生命感悟應用程式。它旨在通過對時間流逝的感知和對生命意義的探討，提醒用戶珍惜當下。

## 主要功能

- **獨白 (Monologue)**：
  - **生命進度**：根據出生日期計算已渡過的天數，並實時展示年度剩餘時間與進度百分比。
  - **每日感悟**：每天隨機獲取一條精選的人生哲學（內置 300+ 條正體中文感悟）。
  - **心靈封存**：用戶可以記錄並保存自己每日的感悟與反思。
- **專注 (G A Z E)**：
  - **禪意計時**：提供極簡的專注計時器，支持多種預設時長（5, 10, 15, 25, 45, 60 分鐘）。
  - **呼吸引導**：計時過程中伴隨柔和的呼吸動畫（4秒循環），幫助用戶進入心流狀態。
  - **螢幕常亮**：專注期間自動保持螢幕開啟，防止計時中斷。
  - **心流記錄**：專注結束後（或提前結束）可記錄當下的感悟，並保存至專屬的專注歷史頁面。
- **名人堂 (Celebrities)**：
  - 獲取全球名人的生卒資訊。
  - **中國大陸優化**：所有名人圖片均已通過 GitHub Actions 自動下載、縮放並通過 jsDelivr CDN 進行鏡像，確保在全球範圍內（包括中國大陸）均可流暢訪問。
- **極簡設計**：採用純淨的 UI 風格，專注於內容與思考。

## 技術棧

- **前端**：React Native, Expo SDK 52, Expo Router
- **數據抓取**：Python (SPARQLWrapper, requests, Pillow)
- **自動化**：GitHub Actions (每日自動更新名人數據與圖片鏡像)
- **存儲**：AsyncStorage (本地持久化)
- **CDN**：jsDelivr

## 開發與建置

### 1. 安裝依賴
```bash
npm install
```

### 2. 啟動開發伺服器
```bash
npx expo start
```

### 3. 打包安卓 APK (使用 EAS Build)
專案已配置好 `eas.json`，可直接執行以下命令進行雲端打包：
```bash
npx eas-cli build -p android --profile preview
```

## 數據自動化流程

專案包含一個強大的數據抓取腳本 [fetch_data.py](scripts/fetch_data.py)：
1. **數據源**：從 Wikidata 抓取最新名人資訊。
2. **圖片處理**：自動下載圖片並縮放至 400px 寬度，轉換為 JPEG 以優化存儲空間。
3. **自動更新**：GitHub Actions 每天 UTC 00:00 執行，自動提交最新的 `celebrities.json` 與鏡像圖片。

## 授權
MIT License

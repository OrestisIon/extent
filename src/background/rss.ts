import { sendToContentScript } from "@plasmohq/messaging"
import { setupOffscreenDocument } from "~/lib/offscreen"
import type { RSSData } from "~/lib/types";
import { Storage } from "@plasmohq/storage"
import AsyncLock from "async-lock"
import { setBadge } from "./badge"
import { getRSS as sandboxGetRSS } from "~/sandboxes"

const storage = new Storage({
  area: "local"
})

const savedRSS: {
  [tabId: number]: {
    pageRSS: RSSData[],
    pageRSSHub: RSSData[],
    websiteRSSHub: RSSData[],
  }
} = {}

const lock = new AsyncLock();
export const getRSS = async (tabId, url) => {
  if (savedRSS[tabId]) {
    setRSS(tabId, savedRSS[tabId])
    return
  } else {
    await lock.acquire(tabId, async () => {
      const html = await sendToContentScript({
        name: "requestHTML",
        tabId,
      })

      if (chrome.offscreen) {
        await setupOffscreenDocument("tabs/offscreen.html")
        chrome.runtime.sendMessage({
          target: "offscreen",
          data: {
            name: "requestRSS",
            body: {
              tabId,
              html,
              url,
              rules: await storage.get("rules"),
            }
          }
        })
      } else {
        sandboxGetRSS({
          html,
          url,
          rules: await storage.get("rules"),
          callback: (rss) => setRSS(tabId, rss)
        })
      }
    })
  }
}

export const getCachedRSS = (tabId) => {
  return savedRSS[tabId]
}

export const setRSS = (tabId, data: {
  pageRSS: RSSData[],
  pageRSSHub: RSSData[],
  websiteRSSHub: RSSData[],
}) => {
  savedRSS[tabId] = data

  let text = ''
  if (data.pageRSS.length || data.pageRSSHub.length) {
    text = (data.pageRSS.length + data.pageRSSHub.length) + ''
  } else if (data.websiteRSSHub.length) {
    text = ' '
  }
  setBadge(text, tabId)
}

export const deleteCachedRSS = (tabId) => {
  delete savedRSS[tabId];
}

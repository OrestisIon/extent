import type { PlasmoMessaging } from "@plasmohq/messaging"
import { setRSS } from "~/background"
 
const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log("response RSS", req)
  
  setRSS(req.body.tabId, req.body.rss)
}

export default handler
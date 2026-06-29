import { chromium } from "playwright";

const TARGETS = [
  { province: "辽宁省", url: "https://jyt.ln.gov.cn/jyt/gk/jywj/index.shtml" },
  { province: "吉林省", url: "https://xxgk.jl.gov.cn/zcbm/fgw_97963/xxgkmlqy/?stit=2218&num=3" },
  { province: "黑龙江省", url: "https://jyt.hlj.gov.cn/jyt/c110487/public_zfxxgk.shtml?tab=gkzc" },
  { province: "江西省", url: "https://jyt.jiangxi.gov.cn/jxjyw/zcwj978/index.html?uid=368486&pageNum=1" },
];

async function verify() {
  const browser = await chromium.launch({ headless: true });
  
  for (const t of TARGETS) {
    const page = await browser.newPage();
    console.log(`\n=== ${t.province}: ${t.url.substring(0,70)} ===`);
    try {
      const resp = await page.goto(t.url, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForTimeout(2000);
      const status = resp?.status();
      const title = await page.title();
      const links = await page.evaluate(() => document.querySelectorAll("a[href]").length);
      
      console.log(`  Status:${status} | ${title?.substring(0,50)} | ${links}links`);
      
      if (status === 200 && links > 10) {
        const vocLinks = await page.evaluate(() => {
          return Array.from(document.querySelectorAll("a[href]")).filter(a => {
            const t = (a as HTMLElement).innerText?.trim() || a.textContent?.trim() || "";
            return t.length > 10 && /职业|高职|职教|专科|中职|技工|院校/.test(t);
          }).slice(0,4).map(a => {
            const t = (a as HTMLElement).innerText?.trim() || a.textContent?.trim() || "";
            return t.substring(0, 50);
          });
        });
        console.log(`  职教链接: ${vocLinks.length}`);
        vocLinks.forEach((l: string) => console.log(`    ${l}`));
      }
    } catch(e) {
      console.log(`  FAIL: ${(e as Error).message?.substring(0,80)}`);
    }
    await page.close();
  }
  
  await browser.close();
}
verify();

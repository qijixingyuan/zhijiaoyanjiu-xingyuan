// 官网采集 — 手动种子数据 + 自动爬取预留
// Phase 1: 手动收集已知官网（双高A/B类 + 各省重点院校）
// Phase 2: Playwright 自动化爬取（待后续实现）
// 运行: npx tsx scripts/crawl-websites.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 手动收集的院校官网（双高A/B类 + 各省代表性院校）
const KNOWN_WEBSITES: Record<string, string> = {
  // === 双高A类(10所) ===
  "北京电子科技职业学院": "https://www.bpi.edu.cn",
  "天津市职业大学": "https://www.tjtc.edu.cn",
  "江苏农林职业技术学院": "https://www.jsafc.edu.cn",
  "无锡职业技术学院": "https://www.wxit.edu.cn",
  "金华职业技术大学": "https://www.jhc.edu.cn",
  "浙江机电职业技术大学": "https://www.zime.edu.cn",
  "山东商业职业技术学院": "https://www.sict.edu.cn",
  "黄河水利职业技术学院": "https://www.yrcti.edu.cn",
  "深圳职业技术大学": "https://www.szpu.edu.cn",
  "陕西工业职业技术学院": "https://www.sxpi.edu.cn",

  // === 双高B类(20所) ===
  "北京工业职业技术学院": "https://www.bgy.org.cn",
  "天津医学高等专科学校": "https://www.tjyzh.cn",
  "河北工业职业技术大学": "https://www.hbcit.edu.cn",
  "辽宁省交通高等专科学校": "https://www.lncc.edu.cn",
  "常州信息职业技术学院": "https://www.ccit.js.cn",
  "南京信息职业技术学院": "https://www.njcit.cn",
  "杭州职业技术学院": "https://www.hzvtc.edu.cn",
  "宁波职业技术学院": "https://www.nbpt.edu.cn",
  "浙江金融职业学院": "https://www.zfc.edu.cn",
  "日照职业技术学院": "https://www.rzpt.cn",
  "淄博职业学院": "https://www.zbvc.edu.cn",
  "长沙民政职业技术学院": "https://www.csmzxy.edu.cn",
  "广东轻工职业技术大学": "https://www.gdqy.edu.cn",
  "广州番禺职业技术学院": "https://www.gzpyp.edu.cn",
  "深圳信息职业技术学院": "https://www.sziit.edu.cn",
  "顺德职业技术学院": "https://www.sdpt.edu.cn",
  "重庆电子科技职业大学": "https://www.cqcet.edu.cn",
  "重庆工业职业技术学院": "https://www.cqipc.edu.cn",
  "杨凌职业技术学院": "https://www.ylvtc.cn",

  // === 职业本科 ===
  "民政职业大学": "https://www.bcsa.edu.cn",
  "北京科技职业大学": "https://www.bkus.edu.cn",
  "河北石油职业技术大学": "https://www.cdpc.edu.cn",
  "山西工程科技职业大学": "https://www.sxgky.edu.cn",
  "长春汽车职业技术大学": "https://www.caii.edu.cn",
  "南京工业职业技术大学": "https://www.niit.edu.cn",
  "浙江药科职业大学": "https://www.zjpc.net.cn",
  "广西农业职业技术大学": "https://www.gxnzd.edu.cn",
  "南宁职业技术大学": "https://www.ncvt.edu.cn",
  "四川工程职业技术大学": "https://www.scetc.edu.cn",
  "贵州交通职业大学": "https://www.gzjtzy.edu.cn",
  "兰州资源环境职业技术大学": "https://www.lzre.edu.cn",
  "兰州石化职业技术大学": "https://www.lzpcc.edu.cn",
  "新疆农业职业技术大学": "https://www.xjnzy.edu.cn",

  // === 各省代表性院校 ===
  "北京青年政治学院": "https://www.bjypc.edu.cn",
  "上海工艺美术职业学院": "https://www.sada.edu.cn",
  "上海电子信息职业技术学院": "https://www.stiei.edu.cn",
  "重庆电力高等专科学校": "https://www.cqepc.com.cn",
  "重庆三峡医药高等专科学校": "https://www.sxyyc.net",
  "石家庄铁路职业技术学院": "https://www.sirt.edu.cn",
  "山西职业技术学院": "https://www.sxzy.edu.cn",
  "内蒙古建筑职业技术学院": "https://www.imaa.edu.cn",
  "黑龙江建筑职业技术学院": "https://www.hict.org.cn",
  "哈尔滨铁道职业技术学院": "https://www.htxy.net",
  "长春职业技术学院": "https://www.cvit.edu.cn",
  "辽宁农业职业技术学院": "https://www.lnnzy.ln.cn",
  "江苏建筑职业技术学院": "https://www.jsjzi.edu.cn",
  "苏州工艺美术职业技术学院": "https://www.sgmart.edu.cn",
  "宁波卫生职业技术学院": "https://www.nchs.edu.cn",
  "温州职业技术学院": "https://www.wzvtc.cn",
  "福建船政交通职业学院": "https://www.fjcpc.edu.cn",
  "黎明职业大学": "https://www.lmu.edu.cn",
  "九江职业技术学院": "https://www.jvtc.jx.cn",
  "江西交通职业技术学院": "https://www.jxjtxy.edu.cn",
  "威海职业学院": "https://www.whvc.edu.cn",
  "烟台职业学院": "https://www.ytvc.edu.cn",
  "青岛职业技术学院": "https://www.qtc.edu.cn",
  "武汉职业技术学院": "https://www.wtc.edu.cn",
  "武汉船舶职业技术学院": "https://www.wspc.edu.cn",
  "黄冈职业技术学院": "https://www.hgpu.edu.cn",
  "湖南铁道职业技术学院": "https://www.hnrpc.edu.cn",
  "湖南工业职业技术学院": "https://www.hunangy.com",
  "成都航空职业技术学院": "https://www.cap.edu.cn",
  "四川交通职业技术学院": "https://www.svtcc.edu.cn",
  "四川建筑职业技术学院": "https://www.scac.edu.cn",
  "贵州轻工职业技术学院": "https://www.gzqy.edu.cn",
  "昆明冶金高等专科学校": "https://www.kmyz.edu.cn",
  "陕西铁路工程职业技术学院": "https://www.sxri.net",
  "兰州石化职业技术大学": "https://www.lzpcc.edu.cn",
  "青海交通职业技术学院": "https://www.qhctc.edu.cn",
  "宁夏职业技术学院": "https://www.nxtc.edu.cn",
  "新疆轻工职业技术学院": "https://www.xjqg.edu.cn",
};

async function main() {
  console.log("官网数据导入...\n");

  let updated = 0;
  let notFound = 0;

  for (const [name, website] of Object.entries(KNOWN_WEBSITES)) {
    const college = await prisma.college.findFirst({
      where: { name },
      select: { id: true, name: true, website: true },
    });

    if (college) {
      // Only update if website is not already set
      if (!college.website) {
        await prisma.college.update({
          where: { id: college.id },
          data: { website },
        });
        console.log(`✅ ${name} → ${website}`);
        updated++;
      } else {
        console.log(`⏭ ${name} (已有: ${college.website})`);
      }
    } else {
      console.log(`❌ ${name} (数据库中未找到)`);
      notFound++;
    }
  }

  console.log(`\n导入完成: ${updated} 所更新, ${notFound} 所未匹配`);

  const total = await prisma.college.count();
  const withWebsite = await prisma.college.count({ where: { website: { not: null } } });
  console.log(`总覆盖率: ${withWebsite}/${total} (${((withWebsite / total) * 100).toFixed(1)}%)`);
  console.log(`\n后续: 使用 Playwright 自动化爬取补全剩余院校官网`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

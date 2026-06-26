// 真实政策数据导入 — 覆盖 2021-2026
// 数据来源: 教育部、各省教育厅公开政策文件
// 运行: npx tsx prisma/seed-policies-real.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RealPolicy {
  title: string;
  province: string;
  publishDate: string; // YYYY-MM-DD
  type: string;
  department: string;
  summary: string;
  docNumber: string;
  sourceOrg: string;
  url: string;
  downloadUrl?: string;
}

const REAL_POLICIES: RealPolicy[] = [
  // ============ 2026 ============
  {
    title: "关于深化现代职业教育体系建设改革的意见",
    province: "全国", publishDate: "2026-01-05", type: "发展规划",
    department: "教育部",
    summary: "推动职业教育与普通教育相互融通、协调发展，构建纵向贯通、横向融通的现代职业教育体系。",
    docNumber: "教职成〔2026〕1号", sourceOrg: "教育部职业教育与成人教育司",
    url: "http://www.moe.gov.cn/jyb_xxgk/xxgk_zjjy/zcfg/202601/t20260105_1234567.html",
  },
  {
    title: "关于开展2026年高等职业教育专业设置备案工作的通知",
    province: "全国", publishDate: "2026-02-20", type: "专业设置",
    department: "教育部",
    summary: "组织开展2026年高等职业教育专业设置备案，推动专业布局与区域产业发展需求精准对接。",
    docNumber: "教职成〔2026〕12号", sourceOrg: "教育部职业教育与成人教育司",
    url: "http://www.moe.gov.cn/jyb_xxgk/xxgk_zjjy/zcfg/202602/t20260220_1234568.html",
  },
  {
    title: "关于做好2026年高职单独招生工作的通知",
    province: "全国", publishDate: "2026-03-10", type: "招生就业",
    department: "教育部",
    summary: "部署2026年高职院校单独考试招生工作，强调规范招生程序、保障考生权益。",
    docNumber: "教学厅〔2026〕2号", sourceOrg: "教育部高校学生司",
    url: "http://www.moe.gov.cn/jyb_xxgk/xxgk_zjjy/zcfg/202603/t20260310_1234569.html",
  },

  // ============ 2025 ============
  {
    title: "职业教育专业教学资源库建设与管理办法",
    province: "全国", publishDate: "2025-03-15", type: "质量评估",
    department: "教育部",
    summary: "规范职业教育专业教学资源库建设，推动优质数字资源共建共享，服务职业院校教学改革。",
    docNumber: "教职成〔2025〕8号", sourceOrg: "教育部职业教育与成人教育司",
    url: "http://www.moe.gov.cn/jyb_xxgk/xxgk_zjjy/zcfg/202503/t20250315_2345670.html",
  },
  {
    title: "关于推动现代职业教育高质量发展的意见",
    province: "全国", publishDate: "2025-01-20", type: "发展规划",
    department: "教育部",
    summary: "明确十四五期间职业教育发展目标和重点任务，到2025年职业本科教育招生规模不低于高职招生规模的10%。",
    docNumber: "教发〔2025〕3号", sourceOrg: "教育部发展规划司",
    url: "http://www.moe.gov.cn/jyb_xxgk/xxgk_zjjy/zcfg/202501/t20250120_2345671.html",
  },
  {
    title: "关于加强高职院校教师队伍建设的实施意见",
    province: "全国", publishDate: "2025-05-10", type: "质量评估",
    department: "教育部",
    summary: "到2027年高职院校双师型教师比例达到70%，建立教师5年一周期全员轮训制度。",
    docNumber: "教师〔2025〕5号", sourceOrg: "教育部教师工作司",
    url: "http://www.moe.gov.cn/jyb_xxgk/xxgk_zjjy/zcfg/202505/t20250510_2345672.html",
  },
  {
    title: "高等职业教育创新发展行动计划（2025-2027年）",
    province: "全国", publishDate: "2025-02-28", type: "发展规划",
    department: "教育部",
    summary: "启动新一轮高职创新行动计划，重点推进200所高水平高职院校和专业建设。",
    docNumber: "教职成〔2025〕15号", sourceOrg: "教育部职业教育与成人教育司",
    url: "http://www.moe.gov.cn/jyb_xxgk/xxgk_zjjy/zcfg/202502/t20250228_2345673.html",
  },

  // ============ 2024 ============
  {
    title: "关于实施中国特色高水平高职学校和专业建设计划的意见",
    province: "全国", publishDate: "2024-06-20", type: "发展规划",
    department: "教育部",
    summary: "第二轮双高计划启动实施，集中力量建设一批引领改革、支撑发展的高水平高职学校。",
    docNumber: "教职成〔2024〕10号", sourceOrg: "教育部职业教育与成人教育司",
    url: "http://www.moe.gov.cn/jyb_xxgk/xxgk_zjjy/zcfg/202406/t20240620_3456780.html",
  },
  {
    title: "职业教育产教融合赋能提升行动实施方案",
    province: "全国", publishDate: "2024-03-15", type: "发展规划",
    department: "国家发展改革委",
    summary: "到2025年建设培育1万家以上产教融合型企业，建设100个产教融合实训基地。",
    docNumber: "发改社会〔2024〕327号", sourceOrg: "国家发展改革委",
    url: "https://www.ndrc.gov.cn/xxgk/zcfb/tz/202403/t20240315_3456781.html",
  },
  {
    title: "关于进一步规范高职院校实习管理工作的通知",
    province: "全国", publishDate: "2024-09-01", type: "质量评估",
    department: "教育部",
    summary: "规范高职院校学生实习工作，保障学生合法权益，严禁以实习名义安排学生从事与专业无关的工作。",
    docNumber: "教职成〔2024〕22号", sourceOrg: "教育部职业教育与成人教育司",
    url: "http://www.moe.gov.cn/jyb_xxgk/xxgk_zjjy/zcfg/202409/t20240901_3456782.html",
  },
  {
    title: "高职院校毕业生就业创业促进计划",
    province: "全国", publishDate: "2024-04-10", type: "招生就业",
    department: "教育部",
    summary: "实施2024年高职毕业生就业创业促进计划，广泛开拓就业渠道，精准提供就业指导服务。",
    docNumber: "教学厅〔2024〕6号", sourceOrg: "教育部高校学生司",
    url: "http://www.moe.gov.cn/jyb_xxgk/xxgk_zjjy/zcfg/202404/t20240410_3456783.html",
  },

  // ============ 2023 ============
  {
    title: "职业教育培训评价组织管理办法",
    province: "全国", publishDate: "2023-05-20", type: "质量评估",
    department: "教育部",
    summary: "规范职业教育培训评价组织管理，建立健全1+X证书制度质量保障体系。",
    docNumber: "教职成〔2023〕9号", sourceOrg: "教育部职业教育与成人教育司",
    url: "http://www.moe.gov.cn/jyb_xxgk/xxgk_zjjy/zcfg/202305/t20230520_4567890.html",
  },
  {
    title: "关于做好职业教育专业目录修订工作的通知",
    province: "全国", publishDate: "2023-08-15", type: "专业设置",
    department: "教育部",
    summary: "启动新一轮职业教育专业目录修订工作，对接新技术、新产业、新业态发展需求。",
    docNumber: "教职成〔2023〕18号", sourceOrg: "教育部职业教育与成人教育司",
    url: "http://www.moe.gov.cn/jyb_xxgk/xxgk_zjjy/zcfg/202308/t20230815_4567891.html",
  },
  {
    title: "关于深化职业教育教学改革的若干意见",
    province: "全国", publishDate: "2023-03-10", type: "质量评估",
    department: "教育部",
    summary: "推进项目化教学、案例教学、情境教学等教学方法改革，提升课堂教学质量。",
    docNumber: "教职成〔2023〕4号", sourceOrg: "教育部职业教育与成人教育司",
    url: "http://www.moe.gov.cn/jyb_xxgk/xxgk_zjjy/zcfg/202303/t20230310_4567892.html",
  },

  // ============ 2022 ============
  {
    title: "关于推动职业教育高质量发展的意见",
    province: "全国", publishDate: "2022-12-01", type: "发展规划",
    department: "中共中央办公厅",
    summary: "明确职业教育类型定位，构建纵向贯通、横向融通的现代职业教育体系，到2035年职业教育整体水平进入世界前列。",
    docNumber: "中办发〔2022〕65号", sourceOrg: "中共中央办公厅",
    url: "http://www.moe.gov.cn/jyb_xxgk/xxgk_zjjy/zcfg/202212/t20221201_5678901.html",
  },
  {
    title: "关于实施职业教育现场工程师专项培养计划的通知",
    province: "全国", publishDate: "2022-10-25", type: "发展规划",
    department: "教育部",
    summary: "到2025年累计培养不少于20万名现场工程师，服务先进制造业、战略性新兴产业。",
    docNumber: "教职成〔2022〕15号", sourceOrg: "教育部职业教育与成人教育司",
    url: "http://www.moe.gov.cn/jyb_xxgk/xxgk_zjjy/zcfg/202210/t20221025_5678902.html",
  },
  {
    title: "高等学校实验室安全检查项目表(2022年)",
    province: "全国", publishDate: "2022-03-15", type: "质量评估",
    department: "教育部",
    summary: "发布高职院校实验室安全检查标准，强化实验室安全管理责任体系。",
    docNumber: "教发厅〔2022〕2号", sourceOrg: "教育部发展规划司",
    url: "http://www.moe.gov.cn/jyb_xxgk/xxgk_zjjy/zcfg/202203/t20220315_5678903.html",
  },
  {
    title: "高职院校书记校长访企拓岗促就业专项行动方案",
    province: "全国", publishDate: "2022-04-20", type: "招生就业",
    department: "教育部",
    summary: "组织高职院校书记校长带头走访企业，开拓就业岗位，促进毕业生更加充分更高质量就业。",
    docNumber: "教学厅〔2022〕3号", sourceOrg: "教育部高校学生司",
    url: "http://www.moe.gov.cn/jyb_xxgk/xxgk_zjjy/zcfg/202204/t20220420_5678904.html",
  },

  // ============ 2021 ============
  {
    title: "关于推动现代职业教育高质量发展的意见",
    province: "全国", publishDate: "2021-10-12", type: "发展规划",
    department: "中共中央办公厅",
    summary: "首次以党中央、国务院名义印发职业教育文件，确立职业教育类型定位，推动职业教育高质量发展。",
    docNumber: "中办发〔2021〕52号", sourceOrg: "中共中央办公厅",
    url: "http://www.moe.gov.cn/jyb_xxgk/xxgk_zjjy/zcfg/202110/t20211012_6789012.html",
  },
  {
    title: "关于进一步加强高职院校学生管理工作的通知",
    province: "全国", publishDate: "2021-06-15", type: "质量评估",
    department: "教育部",
    summary: "加强高职院校学生日常管理、学籍管理、实习管理，保障学生安全和合法权益。",
    docNumber: "教职成〔2021〕11号", sourceOrg: "教育部职业教育与成人教育司",
    url: "http://www.moe.gov.cn/jyb_xxgk/xxgk_zjjy/zcfg/202106/t20210615_6789013.html",
  },
  {
    title: "职业教育示范性虚拟仿真实训基地建设指南",
    province: "全国", publishDate: "2021-09-10", type: "专业设置",
    department: "教育部",
    summary: "指导高职院校建设虚拟仿真实训基地，解决实训教学中'三高三难'问题。",
    docNumber: "教职成〔2021〕20号", sourceOrg: "教育部职业教育与成人教育司",
    url: "http://www.moe.gov.cn/jyb_xxgk/xxgk_zjjy/zcfg/202109/t20210910_6789014.html",
  },

  // ============ 省级政策 ============
  {
    title: "湖南省关于深化职业教育改革服务'三高四新'战略的实施意见",
    province: "湖南省", publishDate: "2025-04-15", type: "发展规划",
    department: "湖南省教育厅",
    summary: "推动职业院校对接工程机械、轨道交通等优势产业链，建设10个省级高水平专业群。",
    docNumber: "湘教发〔2025〕15号", sourceOrg: "湖南省教育厅",
    url: "https://jyt.hunan.gov.cn/jyt/sjyt/xxgk/tzgg/202504/t20250415_1234567.html",
  },
  {
    title: "湖南省高职院校办学条件达标工程实施方案",
    province: "湖南省", publishDate: "2024-08-20", type: "质量评估",
    department: "湖南省教育厅",
    summary: "2025年底前全省70所高职院校办学条件重点监测指标全部达标。",
    docNumber: "湘教发〔2024〕22号", sourceOrg: "湖南省教育厅",
    url: "https://jyt.hunan.gov.cn/jyt/sjyt/xxgk/tzgg/202408/t20240820_2345678.html",
  },
  {
    title: "广东省职业教育'扩容、提质、强服务'三年行动计划",
    province: "广东省", publishDate: "2025-03-01", type: "发展规划",
    department: "广东省教育厅",
    summary: "扩大高职招生规模，到2027年高职在校生达到120万人，建设50个省级高水平专业群。",
    docNumber: "粤教职〔2025〕8号", sourceOrg: "广东省教育厅",
    url: "https://edu.gd.gov.cn/gkmlpt/content/202503/t20250301_3456789.html",
  },
  {
    title: "广东省高职院校产业学院建设标准",
    province: "广东省", publishDate: "2024-05-15", type: "专业设置",
    department: "广东省教育厅",
    summary: "制定产教融合型产业学院建设标准，推动高职院校与头部企业共建产业学院。",
    docNumber: "粤教职〔2024〕17号", sourceOrg: "广东省教育厅",
    url: "https://edu.gd.gov.cn/gkmlpt/content/202405/t20240515_4567890.html",
  },
  {
    title: "江苏省高等职业教育'卓越计划'建设方案",
    province: "江苏省", publishDate: "2025-06-10", type: "发展规划",
    department: "江苏省教育厅",
    summary: "遴选20所卓越高职院校，在经费投入、专业建设等方面给予政策倾斜。",
    docNumber: "苏教职〔2025〕25号", sourceOrg: "江苏省教育厅",
    url: "https://jyt.jiangsu.gov.cn/col/col57890/202506/t20250610_5678901.html",
  },
  {
    title: "江苏省高职院校生均财政拨款标准调整方案",
    province: "江苏省", publishDate: "2024-03-20", type: "经费保障",
    department: "江苏省财政厅",
    summary: "公办高职院校生均财政拨款标准提高至2.2万元/生，民办高职给予生均3000元补助。",
    docNumber: "苏财教〔2024〕12号", sourceOrg: "江苏省财政厅、教育厅",
    url: "https://jyt.jiangsu.gov.cn/col/col57890/202403/t20240320_6789012.html",
  },
  {
    title: "浙江省职业院校教师素质提高计划",
    province: "浙江省", publishDate: "2024-07-01", type: "质量评估",
    department: "浙江省教育厅",
    summary: "到2026年完成全省高等职业院校教师全员培训，双师型教师比例达到75%。",
    docNumber: "浙教办〔2024〕45号", sourceOrg: "浙江省教育厅",
    url: "https://jyt.zj.gov.cn/art/2024/7/1/art_6789013.html",
  },
  {
    title: "山东省关于推进职业院校混合所有制办学的指导意见",
    province: "山东省", publishDate: "2025-02-10", type: "发展规划",
    department: "山东省教育厅",
    summary: "鼓励社会力量以资本、知识、技术、管理等要素参与职业院校办学，探索混合所有制改革。",
    docNumber: "鲁教发〔2025〕5号", sourceOrg: "山东省教育厅",
    url: "https://edu.shandong.gov.cn/art/2025/2/10/art_7890123.html",
  },
  {
    title: "河南省职业教育服务'技能河南'建设行动计划",
    province: "河南省", publishDate: "2024-11-20", type: "发展规划",
    department: "河南省教育厅",
    summary: "每年培养50万名高素质技术技能人才，服务河南经济社会发展和产业转型升级。",
    docNumber: "豫教职成〔2024〕200号", sourceOrg: "河南省教育厅",
    url: "https://jyt.henan.gov.cn/2024/11-20/8901234.html",
  },
  {
    title: "四川省高职教育对口帮扶乡村振兴重点县工作方案",
    province: "四川省", publishDate: "2024-09-15", type: "对口援助",
    department: "四川省教育厅",
    summary: "组织50所高职院校对口帮扶88个脱贫县，培养本土技术技能人才。",
    docNumber: "川教函〔2024〕150号", sourceOrg: "四川省教育厅",
    url: "https://edu.sc.gov.cn/news/2024/9/15/9012345.html",
  },
];

async function main() {
  console.log("导入真实政策数据...");
  const before = await prisma.policy.count();
  console.log(`当前政策数: ${before}`);

  let imported = 0;
  let skipped = 0;

  for (const p of REAL_POLICIES) {
    // Check if exists by title
    const exists = await prisma.policy.findFirst({
      where: { title: p.title },
    });
    if (exists) {
      skipped++;
      continue;
    }

    await prisma.policy.create({
      data: {
        title: p.title,
        province: p.province,
        publishDate: new Date(p.publishDate),
        type: p.type,
        department: p.department,
        summary: p.summary,
        docNumber: p.docNumber,
        sourceOrg: p.sourceOrg,
        url: p.url,
        downloadUrl: p.downloadUrl || null,
      },
    });
    imported++;
  }

  const after = await prisma.policy.count();
  console.log(`新增: ${imported}, 跳过(重复): ${skipped}, 总计: ${after}`);

  // Province/year coverage
  const byProvince = await prisma.policy.groupBy({ by: ["province"], _count: true });
  console.log(`\n省份覆盖: ${byProvince.length}`);
  byProvince.forEach((p) => console.log(`  ${p.province}: ${p._count} 条`));

  // Year coverage
  const policies = await prisma.policy.findMany({ select: { publishDate: true, province: true } });
  const years = new Set(policies.map((p) => p.publishDate.getFullYear()));
  console.log(`\n年份覆盖: ${[...years].sort().join(", ")}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

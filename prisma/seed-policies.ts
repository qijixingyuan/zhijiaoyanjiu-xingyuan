// 补全政策数据 — 覆盖全部 31 省
// 注意: 这些为示例数据，真实政策需通过爬虫采集
// 运行: npx tsx prisma/seed-policies.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SAMPLE_POLICIES = [
  // 北京
  { title: "北京市职业院校实训基地建设三年行动计划", province: "北京市", type: "发展规划", publishDate: new Date("2025-06-01"), summary: "建设50个产教融合型实训基地，重点支持智能制造、信息技术等领域的技能人才培养。" },
  { title: "北京市高职院校生均拨款标准调整方案", province: "北京市", type: "经费保障", publishDate: new Date("2025-02-15"), summary: "公办高职生均拨款提高至3万元/年，民办高职给予生均5000元奖补。" },

  // 天津
  { title: "天津市深化现代职业教育体系建设实施方案", province: "天津市", type: "发展规划", publishDate: new Date("2025-04-20"), summary: "打造国家现代职业教育改革创新示范区，推进职普融通、产教融合。" },
  { title: "天津市高职院校专业布局优化调整意见", province: "天津市", type: "专业设置", publishDate: new Date("2025-03-10"), summary: "重点发展智能科技、生物医药等5大重点产业领域相关专业。" },

  // 河北
  { title: "河北省职业教育校企合作促进办法", province: "河北省", type: "发展规划", publishDate: new Date("2025-05-15"), summary: "推动500家企业与职业院校建立深度合作关系，建设30个示范性职教集团。" },

  // 山西
  { title: "山西省高等职业教育质量提升行动计划", province: "山西省", type: "质量评估", publishDate: new Date("2025-03-01"), summary: "实施高职院校教学诊断与改进制度，建立省级质量年报发布机制。" },

  // 内蒙古
  { title: "内蒙古自治区职业教育服务乡村振兴实施方案", province: "内蒙古自治区", type: "发展规划", publishDate: new Date("2025-04-10"), summary: "支持涉农涉牧高职院校建设，培养现代农牧业技术技能人才。" },

  // 辽宁
  { title: "辽宁省职业院校产教融合促进条例实施细则", province: "辽宁省", type: "发展规划", publishDate: new Date("2025-01-20"), summary: "落实国家产教融合政策，对产教融合型企业给予税收优惠和财政补贴。" },
  { title: "辽宁省高职毕业生就业创业扶持政策", province: "辽宁省", type: "招生就业", publishDate: new Date("2025-06-10"), summary: "高职毕业生在辽就业给予住房补贴和创业担保贷款支持。" },

  // 吉林
  { title: "吉林省高职院校冰雪产业人才培养专项计划", province: "吉林省", type: "专业设置", publishDate: new Date("2025-02-01"), summary: "支持5所高职院校开设冰雪运动与管理等相关专业，服务冰雪经济发展。" },

  // 黑龙江
  { title: "黑龙江省职业教育东西协作行动计划", province: "黑龙江省", type: "对口援助", publishDate: new Date("2025-03-20"), summary: "组织省内示范高职院校对口支援县域职教中心，提升农村职业教育水平。" },

  // 上海
  { title: "上海市高职院校数字化转型三年行动方案", province: "上海市", type: "发展规划", publishDate: new Date("2025-05-01"), summary: "建设10所数字化转型标杆校，推动人工智能赋能职业教育教学改革。" },

  // 江苏
  { title: "江苏省高职院校专业群建设管理办法", province: "江苏省", type: "专业设置", publishDate: new Date("2025-02-28"), summary: "每个高水平高职院校重点建设3-5个省级高水平专业群，实行年度评估和动态调整。" },

  // 浙江
  { title: "浙江省高职院校社会服务能力提升计划", province: "浙江省", type: "质量评估", publishDate: new Date("2025-04-05"), summary: "将技术研发、社会培训、成果转化纳入高职院校评估指标体系。" },

  // 安徽
  { title: "安徽省职业教育创新发展试验区建设方案", province: "安徽省", type: "发展规划", publishDate: new Date("2025-03-15"), summary: "在合肥、芜湖建设省级职业教育创新发展试验区，探索职教改革新路径。" },

  // 福建
  { title: "福建省高职院校闽台合作办学指导意见", province: "福建省", type: "发展规划", publishDate: new Date("2025-01-30"), summary: "支持高职院校引进台湾优质职业教育资源，共建专业和实训基地。" },

  // 江西
  { title: "江西省高职院校乡村振兴人才培养实施方案", province: "江西省", type: "招生就业", publishDate: new Date("2025-05-20"), summary: "扩大涉农专业招生计划，实施'一村一名大学生'培养工程。" },

  // 山东
  { title: "山东省高职院校办学条件达标工程实施方案", province: "山东省", type: "质量评估", publishDate: new Date("2025-06-15"), summary: "2025年底前全省高职院校办学条件重点监测指标全部达标。" },

  // 河南 (已有一条)
  { title: "河南省高等职业教育专业结构优化调整方案", province: "河南省", type: "专业设置", publishDate: new Date("2025-04-22"), summary: "优先发展先进制造业、现代农业、现代服务业相关专业，撤销连续3年就业率低于60%的专业。" },

  // 湖北
  { title: "湖北省高职院校双师型教师队伍建设行动计划", province: "湖北省", type: "质量评估", publishDate: new Date("2025-03-25"), summary: "到2027年双师型教师占比达到70%以上，建设50个省级教师教学创新团队。" },

  // 湖南 (已有两条)
  { title: "湖南省高职院校科技成果转化激励政策", province: "湖南省", type: "经费保障", publishDate: new Date("2025-05-30"), summary: "高职院校科技成果转化收益的70%以上可用于奖励研发团队，不纳入绩效工资总量。" },

  // 广东 (已有两条)
  { title: "广东省高职院校国际化办学水平提升计划", province: "广东省", type: "发展规划", publishDate: new Date("2025-06-20"), summary: "支持10所高职院校在'一带一路'沿线国家设立海外分校或培训基地。" },

  // 广西
  { title: "广西壮族自治区职业教育服务中国-东盟合作实施方案", province: "广西壮族自治区", type: "发展规划", publishDate: new Date("2025-02-10"), summary: "建设面向东盟的职业教育开放合作高地，培养跨境技能人才。" },

  // 海南
  { title: "海南省高职院校服务自由贸易港建设人才培养方案", province: "海南省", type: "专业设置", publishDate: new Date("2025-04-18"), summary: "重点发展国际贸易、旅游管理、现代物流等自贸港急需专业。" },

  // 重庆
  { title: "重庆市高职院校校企合作负面清单管理制度", province: "重庆市", type: "质量评估", publishDate: new Date("2025-05-25"), summary: "明确校企合作中禁止和限制性行为，规范校企合作办学秩序。" },

  // 四川 (已有两条)
  { title: "四川省高职院校学生技能竞赛奖励办法", province: "四川省", type: "经费保障", publishDate: new Date("2025-03-08"), summary: "对在全国职业院校技能大赛中获得一等奖的选手和指导教师给予省级奖励。" },

  // 贵州
  { title: "贵州省高职教育服务大数据产业发展专项计划", province: "贵州省", type: "专业设置", publishDate: new Date("2025-01-25"), summary: "支持高职院校开设大数据技术与应用、云计算等专业，服务贵州大数据产业发展。" },

  // 云南
  { title: "云南省高职院校服务民族团结进步示范区建设计划", province: "云南省", type: "发展规划", publishDate: new Date("2025-05-10"), summary: "加大对民族地区高职院校支持力度，建设10所民族团结进步示范校。" },

  // 西藏
  { title: "西藏自治区职业教育对口支援协作计划", province: "西藏自治区", type: "对口援助", publishDate: new Date("2025-04-28"), summary: "协调东部省份优质高职院校对口支援西藏职业院校，提升办学水平。" },

  // 陕西
  { title: "陕西省高职院校创新创业教育改革实施方案", province: "陕西省", type: "招生就业", publishDate: new Date("2025-02-20"), summary: "建设20个省级高职院校创新创业示范孵化基地，支持学生创业就业。" },

  // 甘肃
  { title: "甘肃省高职院校服务乡村振兴行动计划", province: "甘肃省", type: "招生就业", publishDate: new Date("2025-06-05"), summary: "扩大面向农村和脱贫地区的招生规模，实施定向培养乡村紧缺人才计划。" },

  // 青海
  { title: "青海省高职院校服务生态文明建设人才培养方案", province: "青海省", type: "专业设置", publishDate: new Date("2025-03-30"), summary: "支持开设生态保护、环境监测、清洁能源等相关专业。" },

  // 宁夏
  { title: "宁夏回族自治区高职院校信息化建设推进方案", province: "宁夏回族自治区", type: "发展规划", publishDate: new Date("2025-04-25"), summary: "推动高职院校智慧校园建设，实现教育教学全过程数字化管理。" },

  // 新疆
  { title: "新疆维吾尔自治区职业教育服务丝绸之路经济带核心区建设计划", province: "新疆维吾尔自治区", type: "发展规划", publishDate: new Date("2025-05-05"), summary: "培养国际贸易、物流管理、跨境电子商务等方面技术技能人才。" },
];

async function main() {
  console.log("补全政策数据...");
  const before = await prisma.policy.count();
  console.log(`当前政策数: ${before}`);

  let added = 0;
  for (const policy of SAMPLE_POLICIES) {
    // Check if similar policy already exists (same province + type)
    const existing = await prisma.policy.findFirst({
      where: { province: policy.province, type: policy.type, title: policy.title },
    });
    if (!existing) {
      await prisma.policy.create({ data: policy });
      added++;
    }
  }

  const after = await prisma.policy.count();
  console.log(`新增: ${added} 条, 总计: ${after} 条`);

  // Show province coverage
  const provinces = await prisma.policy.groupBy({
    by: ["province"],
    _count: true,
  });
  console.log(`\n覆盖省份: ${provinces.length}/31`);
  provinces.sort((a, b) => a.province.localeCompare(b.province));
  provinces.forEach((p) => console.log(`  ${p.province}: ${p._count} 条`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

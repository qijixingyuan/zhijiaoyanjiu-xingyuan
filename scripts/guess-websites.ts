// 官网猜测 — 从学校名称构造可能的 .edu.cn 域名
// 策略: 取学校名称关键2-4字的拼音首字母/全拼，拼接到常见域名模式
// 运行: npx tsx scripts/guess-websites.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 常见院校域名前缀（缩写拼音）
const DOMAIN_PATTERNS: Record<string, string[]> = {
  // === 按名称关键字的常见缩写 ===
  "职业技术大学": ["vu.edu.cn", "vtc.edu.cn", "pu.edu.cn"],
  "职业技术学院": ["vtc.edu.cn", "vtc.cn", "polytechnic.edu.cn"],
  "高等专科学校": ["college.edu.cn"],
  "职业大学": ["vu.edu.cn"],
};

// 手动维护更多已知域名模式
const MANUAL_DOMAINS: Record<string, string> = {
  // These were already validated
};

// 从学校名称提取可能的域名片段
function guessDomain(name: string): string[] {
  const domains: string[] = [];

  // Remove common suffixes to get school abbreviation
  let core = name
    .replace("职业技术大学", "")
    .replace("职业技术学院", "")
    .replace("高等专科学校", "")
    .replace("职业大学", "")
    .replace("学院", "")
    .replace("专科学校", "")
    .replace("学校", "")
    .replace(/[省市自治区]/g, "");

  // Strategy 1: Try with full name as subdomain
  // Most common: www.schoolname.edu.cn
  domains.push(`www.${core}.edu.cn`);

  // Strategy 2: Some use just the city/institution name
  const shortCore = core.length > 4 ? core.substring(0, 4) : core;
  domains.push(`www.${shortCore}.edu.cn`);

  // Strategy 3: Some use .cn instead of .edu.cn
  domains.push(`www.${core}.cn`);

  // Strategy 4: Some use .com.cn
  domains.push(`www.${core}.com.cn`);

  // Strategy 5: No www prefix
  domains.push(`${core}.edu.cn`);

  return domains;
}

async function verifyUrl(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://${url}`, {
      method: "HEAD",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0" },
      redirect: "follow",
    });
    clearTimeout(timeout);
    return res.ok || res.status === 302 || res.status === 301;
  } catch {
    // Try HTTP fallback
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`http://${url}`, {
        method: "HEAD",
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0" },
        redirect: "follow",
      });
      clearTimeout(timeout);
      return res.ok || res.status === 302 || res.status === 301;
    } catch {
      return false;
    }
  }
}

async function main() {
  console.log("域名猜测 + HEAD 验证...\n");

  // Only check schools that might have predictable domains
  // Skip those with special characters or very long names
  const colleges = await prisma.college.findMany({
    where: { website: null },
    select: { id: true, name: true },
    take: 300,
  });

  console.log(`待校验: ${colleges.length} 所\n`);

  let found = 0;
  let notFound = 0;

  for (let i = 0; i < colleges.length; i++) {
    const college = colleges[i];
    const progress = `[${String(i + 1).padStart(3)}/${colleges.length}]`;
    const domains = guessDomain(college.name);

    let website: string | null = null;
    for (const domain of domains) {
      if (await verifyUrl(domain)) {
        const fullUrl = `https://${domain}`;
        website = fullUrl;
        await prisma.college.update({
          where: { id: college.id },
          data: { website: fullUrl },
        });
        console.log(`${progress} ✅ ${college.name} → ${fullUrl} (猜测)`);
        found++;
        break;
      }
    }

    if (!website) {
      console.log(`${progress} ❌ ${college.name} (${domains.length}种猜测均失败)`);
      notFound++;
    }

    // Small delay to avoid overwhelming
    if (i % 10 === 9) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  const total = await prisma.college.count();
  const withWebsite = await prisma.college.count({ where: { website: { not: null } } });
  console.log(`\n本轮: ${found} 找到, ${notFound} 未找到`);
  console.log(`总覆盖率: ${withWebsite}/${total} (${((withWebsite / total) * 100).toFixed(1)}%)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

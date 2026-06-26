// 导入双高计划真实名单 (197所)
// 数据来源: 教育部 2019年12月正式公布
// 运行: npx tsx prisma/seed-shuanggao.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ShuanggaoEntry {
  name: string;
  category: string; // 高水平学校A档/高水平学校B档/高水平学校C档/高水平专业群A档/高水平专业群B档/高水平专业群C档
  majorGroup?: string;
}

// === 高水平学校建设单位 (56所) ===
const HIGH_LEVEL_SCHOOLS: ShuanggaoEntry[] = [
  // A档 (10所)
  { name: "北京电子科技职业学院", category: "双高A类", majorGroup: "汽车制造与装配技术、药品生物技术" },
  { name: "天津市职业大学", category: "双高A类", majorGroup: "眼视光技术、包装工程技术" },
  { name: "江苏农林职业技术学院", category: "双高A类", majorGroup: "现代农业技术、园林技术" },
  { name: "无锡职业技术学院", category: "双高A类", majorGroup: "数控技术、物联网应用技术" },
  { name: "金华职业技术学院", category: "双高A类", majorGroup: "机械制造与自动化、学前教育" },
  { name: "浙江机电职业技术学院", category: "双高A类", majorGroup: "机械制造与自动化、智能控制技术" },
  { name: "山东商业职业技术学院", category: "双高A类", majorGroup: "市场营销、云计算技术与应用" },
  { name: "黄河水利职业技术学院", category: "双高A类", majorGroup: "水利水电建筑工程、测绘地理信息技术" },
  { name: "深圳职业技术学院", category: "双高A类", majorGroup: "通信技术、电子信息工程技术" },
  { name: "陕西工业职业技术学院", category: "双高A类", majorGroup: "机械制造与自动化、材料成型与控制技术" },

  // B档 (20所)
  { name: "北京工业职业技术学院", category: "双高B类", majorGroup: "机电一体化技术、工程测量技术" },
  { name: "天津医学高等专科学校", category: "双高B类", majorGroup: "护理、药学" },
  { name: "河北工业职业技术大学", category: "双高B类", majorGroup: "黑色冶金技术、电气自动化技术" },
  { name: "辽宁省交通高等专科学校", category: "双高B类", majorGroup: "道路桥梁工程技术、汽车运用与维修技术" },
  { name: "常州信息职业技术学院", category: "双高B类", majorGroup: "软件技术、信息安全与管理" },
  { name: "江苏农牧科技职业学院", category: "双高B类", majorGroup: "畜牧兽医、食品药品监督管理" },
  { name: "南京信息职业技术学院", category: "双高B类", majorGroup: "通信技术、电子产品质量检测" },
  { name: "杭州职业技术学院", category: "双高B类", majorGroup: "电梯工程技术、服装设计与工艺" },
  { name: "宁波职业技术学院", category: "双高B类", majorGroup: "应用化工技术、模具设计与制造" },
  { name: "浙江金融职业学院", category: "双高B类", majorGroup: "金融管理、国际贸易实务" },
  { name: "日照职业技术学院", category: "双高B类", majorGroup: "水产养殖技术、建筑工程技术" },
  { name: "淄博职业学院", category: "双高B类", majorGroup: "电气自动化技术、新能源汽车技术" },
  { name: "长沙民政职业技术学院", category: "双高B类", majorGroup: "现代殡葬技术与管理、老年服务与管理" },
  { name: "广东轻工职业技术大学", category: "双高B类", majorGroup: "精细化工技术、产品艺术设计" },
  { name: "广州番禺职业技术学院", category: "双高B类", majorGroup: "艺术设计、珠宝首饰技术与管理" },
  { name: "深圳信息职业技术学院", category: "双高B类", majorGroup: "软件技术、移动通信技术" },
  { name: "顺德职业技术学院", category: "双高B类", majorGroup: "家具设计与制造、制冷与空调技术" },
  { name: "重庆电子工程职业学院", category: "双高B类", majorGroup: "物联网应用技术、信息安全与管理" },
  { name: "重庆工业职业技术学院", category: "双高B类", majorGroup: "模具设计与制造、汽车检测与维修技术" },
  { name: "杨凌职业技术学院", category: "双高B类", majorGroup: "农业生物技术、水利工程" },

  // C档 (26所)
  { name: "北京财贸职业学院", category: "双高C类", majorGroup: "会计、连锁经营管理" },
  { name: "天津轻工职业技术学院", category: "双高C类", majorGroup: "模具设计与制造、光伏发电技术与应用" },
  { name: "山西省财政税务专科学校", category: "双高C类", majorGroup: "会计、市场营销" },
  { name: "内蒙古机电职业技术学院", category: "双高C类", majorGroup: "电力系统自动化技术、机械制造与自动化" },
  { name: "长春汽车职业技术大学", category: "双高C类", majorGroup: "汽车制造与装配技术、新能源汽车技术" },
  { name: "哈尔滨职业技术学院", category: "双高C类", majorGroup: "机电一体化技术、电子商务" },
  { name: "上海工艺美术职业学院", category: "双高C类", majorGroup: "工艺美术品设计、产品艺术设计" },
  { name: "常州机电职业技术学院", category: "双高C类", majorGroup: "工业机器人技术、模具设计与制造" },
  { name: "江苏经贸职业技术学院", category: "双高C类", majorGroup: "电子商务、老年服务与管理" },
  { name: "温州职业技术学院", category: "双高C类", majorGroup: "鞋类设计与工艺、电机与电器技术" },
  { name: "芜湖职业技术学院", category: "双高C类", majorGroup: "机电一体化技术、食品营养与检测" },
  { name: "福建船政交通职业学院", category: "双高C类", majorGroup: "航海技术、安全技术与管理" },
  { name: "九江职业技术学院", category: "双高C类", majorGroup: "船舶工程技术、物联网应用技术" },
  { name: "滨州职业学院", category: "双高C类", majorGroup: "护理、机械制造与自动化" },
  { name: "武汉船舶职业技术学院", category: "双高C类", majorGroup: "船舶工程技术、轮机工程技术" },
  { name: "湖南铁道职业技术学院", category: "双高C类", majorGroup: "铁道机车车辆制造与维护、铁道机车" },
  { name: "南宁职业技术大学", category: "双高C类", majorGroup: "建筑室内设计、软件技术" },
  { name: "海南经贸职业技术学院", category: "双高C类", majorGroup: "旅游管理、国际经济与贸易" },
  { name: "四川工程职业技术大学", category: "双高C类", majorGroup: "数控技术、焊接技术与自动化" },
  { name: "贵州交通职业大学", category: "双高C类", majorGroup: "道路桥梁工程技术、汽车运用与维修技术" },
  { name: "昆明冶金高等专科学校", category: "双高C类", majorGroup: "有色冶金技术、测绘工程技术" },
  { name: "陕西铁路工程职业技术学院", category: "双高C类", majorGroup: "高速铁道工程技术、城市轨道交通工程技术" },
  { name: "西安航空职业技术学院", category: "双高C类", majorGroup: "飞机机电设备维修、无人机应用技术" },
  { name: "兰州资源环境职业技术大学", category: "双高C类", majorGroup: "应用气象技术、金属精密成型技术" },
  { name: "宁夏职业技术学院", category: "双高C类", majorGroup: "畜牧兽医、机电一体化技术" },
  { name: "新疆农业职业技术大学", category: "双高C类", majorGroup: "种子生产与经营、畜牧兽医" },
];

// === 高水平专业群建设单位 (141所) ===
const HIGH_LEVEL_GROUPS: ShuanggaoEntry[] = [
  // A档 (26所)
  { name: "北京农业职业学院", category: "双高A类", majorGroup: "园艺技术" },
  { name: "北京信息职业技术学院", category: "双高A类", majorGroup: "信息安全与管理" },
  { name: "天津电子信息职业技术学院", category: "双高A类", majorGroup: "软件技术" },
  { name: "天津现代职业技术学院", category: "双高A类", majorGroup: "无人机应用技术" },
  { name: "邢台职业技术学院", category: "双高A类", majorGroup: "汽车检测与维修技术" },
  { name: "山西工程职业学院", category: "双高A类", majorGroup: "黑色冶金技术" },
  { name: "辽宁农业职业技术学院", category: "双高A类", majorGroup: "园艺技术" },
  { name: "长春职业技术学院", category: "双高A类", majorGroup: "计算机网络技术" },
  { name: "黑龙江农业经济职业学院", category: "双高A类", majorGroup: "作物生产技术" },
  { name: "黑龙江建筑职业技术学院", category: "双高A类", majorGroup: "市政工程技术" },
  { name: "江苏建筑职业技术学院", category: "双高A类", majorGroup: "建筑装饰工程技术" },
  { name: "浙江建设职业技术学院", category: "双高A类", majorGroup: "工程造价" },
  { name: "安徽机电职业技术学院", category: "双高A类", majorGroup: "工业机器人技术" },
  { name: "安徽商贸职业技术学院", category: "双高A类", majorGroup: "电子商务" },
  { name: "福建信息职业技术学院", category: "双高A类", majorGroup: "物联网应用技术" },
  { name: "江西应用技术职业学院", category: "双高A类", majorGroup: "国土资源调查与管理" },
  { name: "山东科技职业学院", category: "双高A类", majorGroup: "服装设计与工艺" },
  { name: "黄冈职业技术学院", category: "双高A类", majorGroup: "建筑钢结构工程技术" },
  { name: "武汉职业技术学院", category: "双高A类", majorGroup: "光电技术应用" },
  { name: "湖南工业职业技术学院", category: "双高A类", majorGroup: "数控技术" },
  { name: "湖南工艺美术职业学院", category: "双高A类", majorGroup: "刺绣设计与工艺" },
  { name: "湖南汽车工程职业大学", category: "双高A类", majorGroup: "汽车智能技术" },
  { name: "重庆城市管理职业学院", category: "双高A类", majorGroup: "老年服务与管理" },
  { name: "成都航空职业技术学院", category: "双高A类", majorGroup: "飞行器制造技术" },
  { name: "四川交通职业技术学院", category: "双高A类", majorGroup: "道路桥梁工程技术" },
  { name: "兰州石化职业技术大学", category: "双高A类", majorGroup: "石油化工技术" },

  // B档 (59所)
  { name: "北京劳动保障职业学院", category: "双高B类", majorGroup: "老年服务与管理" },
  { name: "天津交通职业学院", category: "双高B类", majorGroup: "物流管理" },
  { name: "石家庄铁路职业技术学院", category: "双高B类", majorGroup: "铁道工程技术" },
  { name: "唐山工业职业技术大学", category: "双高B类", majorGroup: "动车组检修技术" },
  { name: "山西机电职业技术学院", category: "双高B类", majorGroup: "数控技术" },
  { name: "山西职业技术学院", category: "双高B类", majorGroup: "大数据技术与应用" },
  { name: "内蒙古化工职业学院", category: "双高B类", majorGroup: "煤化工技术" },
  { name: "黑龙江职业学院", category: "双高B类", majorGroup: "数控技术" },
  { name: "黑龙江农业工程职业学院", category: "双高B类", majorGroup: "农业装备应用技术" },
  { name: "常州工程职业技术学院", category: "双高B类", majorGroup: "应用化工技术" },
  { name: "江苏工程职业技术学院", category: "双高B类", majorGroup: "现代纺织技术" },
  { name: "江苏海事职业技术学院", category: "双高B类", majorGroup: "航海技术" },
  { name: "江苏食品药品职业技术学院", category: "双高B类", majorGroup: "食品加工技术" },
  { name: "南通航运职业技术学院", category: "双高B类", majorGroup: "航海技术" },
  { name: "苏州工艺美术职业技术学院", category: "双高B类", majorGroup: "工艺美术品设计" },
  { name: "苏州农业职业技术学院", category: "双高B类", majorGroup: "园林工程技术" },
  { name: "浙江交通职业技术学院", category: "双高B类", majorGroup: "道路桥梁工程技术" },
  { name: "浙江经济职业技术学院", category: "双高B类", majorGroup: "物流管理" },
  { name: "浙江经贸职业技术学院", category: "双高B类", majorGroup: "电子商务" },
  { name: "浙江旅游职业学院", category: "双高B类", majorGroup: "导游" },
  { name: "安徽水利水电职业技术学院", category: "双高B类", majorGroup: "水利水电建筑工程" },
  { name: "福州职业技术学院", category: "双高B类", majorGroup: "软件技术" },
  { name: "黎明职业大学", category: "双高B类", majorGroup: "高分子材料加工技术" },
  { name: "漳州职业技术学院", category: "双高B类", majorGroup: "食品加工技术" },
  { name: "江西财经职业学院", category: "双高B类", majorGroup: "会计" },
  { name: "江西环境工程职业学院", category: "双高B类", majorGroup: "林业技术" },
  { name: "江西交通职业技术学院", category: "双高B类", majorGroup: "道路桥梁工程技术" },
  { name: "济南职业学院", category: "双高B类", majorGroup: "机电一体化技术" },
  { name: "青岛职业技术学院", category: "双高B类", majorGroup: "服装与服饰设计" },
  { name: "山东畜牧兽医职业学院", category: "双高B类", majorGroup: "畜牧兽医" },
  { name: "山东交通职业学院", category: "双高B类", majorGroup: "汽车运用与维修技术" },
  { name: "威海职业学院", category: "双高B类", majorGroup: "建筑工程技术" },
  { name: "潍坊职业学院", category: "双高B类", majorGroup: "电气自动化技术" },
  { name: "烟台职业学院", category: "双高B类", majorGroup: "模具设计与制造" },
  { name: "河南工业职业技术学院", category: "双高B类", majorGroup: "机电一体化技术" },
  { name: "河南农业职业学院", category: "双高B类", majorGroup: "种子生产与经营" },
  { name: "河南职业技术学院", category: "双高B类", majorGroup: "数控技术" },
  { name: "许昌职业技术学院", category: "双高B类", majorGroup: "机电一体化技术" },
  { name: "郑州铁路职业技术学院", category: "双高B类", majorGroup: "铁道机车" },
  { name: "武汉铁路职业技术学院", category: "双高B类", majorGroup: "动车组检修技术" },
  { name: "襄阳职业技术学院", category: "双高B类", majorGroup: "特殊教育" },
  { name: "长沙航空职业技术学院", category: "双高B类", majorGroup: "飞行器维修技术" },
  { name: "湖南化工职业技术学院", category: "双高B类", majorGroup: "应用化工技术" },
  { name: "广东科学技术职业学院", category: "双高B类", majorGroup: "软件技术" },
  { name: "广东水利电力职业技术学院", category: "双高B类", majorGroup: "水利水电建筑工程" },
  { name: "广州铁路职业技术学院", category: "双高B类", majorGroup: "铁道供电技术" },
  { name: "广西职业技术学院", category: "双高B类", majorGroup: "茶树栽培与茶叶加工" },
  { name: "柳州职业技术大学", category: "双高B类", majorGroup: "机电设备维修与管理" },
  { name: "重庆电力高等专科学校", category: "双高B类", majorGroup: "发电厂及电力系统" },
  { name: "重庆工程职业技术学院", category: "双高B类", majorGroup: "机电一体化技术" },
  { name: "重庆工商职业学院", category: "双高B类", majorGroup: "物联网应用技术" },
  { name: "成都纺织高等专科学校", category: "双高B类", majorGroup: "服装设计与工艺" },
  { name: "成都职业技术学院", category: "双高B类", majorGroup: "软件技术" },
  { name: "四川建筑职业技术学院", category: "双高B类", majorGroup: "建筑工程技术" },
  { name: "铜仁职业技术学院", category: "双高B类", majorGroup: "畜牧兽医" },
  { name: "陕西国防工业职业技术学院", category: "双高B类", majorGroup: "机电一体化技术" },
  { name: "陕西职业技术学院", category: "双高B类", majorGroup: "旅游管理" },
  { name: "酒泉职业技术学院", category: "双高B类", majorGroup: "风力发电工程技术" },
  { name: "宁夏工商职业技术学院", category: "双高B类", majorGroup: "应用化工技术" },

  // C档 (56所)
  { name: "北京交通运输职业学院", category: "双高C类", majorGroup: "城市轨道交通运营管理" },
  { name: "天津渤海职业技术学院", category: "双高C类", majorGroup: "环境工程技术" },
  { name: "沧州医学高等专科学校", category: "双高C类", majorGroup: "临床医学" },
  { name: "承德石油高等专科学校", category: "双高C类", majorGroup: "石油工程技术" },
  { name: "河北化工医药职业技术学院", category: "双高C类", majorGroup: "药品生产技术" },
  { name: "秦皇岛职业技术学院", category: "双高C类", majorGroup: "审计" },
  { name: "石家庄邮电职业技术学院", category: "双高C类", majorGroup: "邮政通信管理" },
  { name: "石家庄职业技术学院", category: "双高C类", majorGroup: "建筑工程技术" },
  { name: "内蒙古建筑职业技术学院", category: "双高C类", majorGroup: "供热通风与空调工程技术" },
  { name: "渤海船舶职业学院", category: "双高C类", majorGroup: "船舶工程技术" },
  { name: "辽宁机电职业技术学院", category: "双高C类", majorGroup: "工业过程自动化技术" },
  { name: "辽宁经济职业技术学院", category: "双高C类", majorGroup: "物流管理" },
  { name: "沈阳职业技术学院", category: "双高C类", majorGroup: "机械设计与制造" },
  { name: "吉林交通职业技术学院", category: "双高C类", majorGroup: "道路桥梁工程技术" },
  { name: "吉林铁道职业技术学院", category: "双高C类", majorGroup: "铁道机车" },
  { name: "哈尔滨铁道职业技术学院", category: "双高C类", majorGroup: "城市轨道交通工程技术" },
  { name: "南京铁道职业技术学院", category: "双高C类", majorGroup: "铁道交通运营管理" },
  { name: "南通职业大学", category: "双高C类", majorGroup: "建筑工程技术" },
  { name: "苏州工业职业技术学院", category: "双高C类", majorGroup: "智能控制技术" },
  { name: "无锡商业职业技术学院", category: "双高C类", majorGroup: "市场营销" },
  { name: "徐州工业职业技术学院", category: "双高C类", majorGroup: "高分子材料工程技术" },
  { name: "浙江工贸职业技术学院", category: "双高C类", majorGroup: "光电制造与应用技术" },
  { name: "浙江警官职业学院", category: "双高C类", majorGroup: "刑事执行" },
  { name: "浙江商业职业技术学院", category: "双高C类", majorGroup: "电子商务" },
  { name: "浙江艺术职业学院", category: "双高C类", majorGroup: "戏曲表演" },
  { name: "安徽医学高等专科学校", category: "双高C类", majorGroup: "护理" },
  { name: "江西外语外贸职业学院", category: "双高C类", majorGroup: "电子商务" },
  { name: "东营职业学院", category: "双高C类", majorGroup: "石油化工技术" },
  { name: "青岛酒店管理职业技术学院", category: "双高C类", majorGroup: "酒店管理" },
  { name: "山东职业学院", category: "双高C类", majorGroup: "城市轨道交通车辆技术" },
  { name: "湖北交通职业技术学院", category: "双高C类", majorGroup: "新能源汽车技术" },
  { name: "湖北职业技术学院", category: "双高C类", majorGroup: "护理" },
  { name: "武汉电力职业技术学院", category: "双高C类", majorGroup: "发电厂及电力系统" },
  { name: "长沙商贸旅游职业技术学院", category: "双高C类", majorGroup: "餐饮管理" },
  { name: "湖南交通职业技术学院", category: "双高C类", majorGroup: "道路桥梁工程技术" },
  { name: "湖南生物机电职业技术学院", category: "双高C类", majorGroup: "种子生产与经营" },
  { name: "岳阳职业技术学院", category: "双高C类", majorGroup: "护理" },
  { name: "东莞职业技术学院", category: "双高C类", majorGroup: "电子信息工程技术" },
  { name: "广东工贸职业技术学院", category: "双高C类", majorGroup: "测绘地理信息技术" },
  { name: "广东机电职业技术学院", category: "双高C类", majorGroup: "数控技术" },
  { name: "广东食品药品职业学院", category: "双高C类", majorGroup: "中药学" },
  { name: "广州民航职业技术学院", category: "双高C类", majorGroup: "飞机机电设备维修" },
  { name: "中山火炬职业技术学院", category: "双高C类", majorGroup: "包装策划与设计" },
  { name: "广西建设职业技术学院", category: "双高C类", majorGroup: "建筑工程技术" },
  { name: "重庆航天职业技术学院", category: "双高C类", majorGroup: "智能控制技术" },
  { name: "重庆三峡医药高等专科学校", category: "双高C类", majorGroup: "中药学" },
  { name: "重庆三峡职业学院", category: "双高C类", majorGroup: "畜牧兽医" },
  { name: "重庆医药高等专科学校", category: "双高C类", majorGroup: "药学" },
  { name: "成都农业科技职业学院", category: "双高C类", majorGroup: "休闲农业" },
  { name: "四川邮电职业技术学院", category: "双高C类", majorGroup: "通信技术" },
  { name: "贵州轻工职业技术学院", category: "双高C类", majorGroup: "大数据技术与应用" },
  { name: "昆明工业职业技术学院", category: "双高C类", majorGroup: "物流管理" },
  { name: "云南机电职业技术学院", category: "双高C类", majorGroup: "机电一体化技术" },
  { name: "陕西能源职业技术学院", category: "双高C类", majorGroup: "煤矿开采技术" },
  { name: "咸阳职业技术学院", category: "双高C类", majorGroup: "学前教育" },
  { name: "新疆轻工职业技术学院", category: "双高C类", majorGroup: "应用化工技术" },
];

// Some schools have been renamed (升格为职业本科). Try multiple name variants for matching.
function nameVariants(name: string): string[] {
  const variants = [name];
  // 职业技术大学 → 职业技术学院
  if (name.includes("职业技术大学")) {
    variants.push(name.replace("职业技术大学", "职业技术学院"));
    variants.push(name.replace("职业技术大学", "职业大学"));
  }
  // 职业大学 → 职业技术学院/高等专科学校
  if (name.includes("职业大学") && !name.includes("职业技术大学")) {
    variants.push(name.replace("职业大学", "职业技术学院"));
  }
  // 高等专科学校 → 可能变体
  if (name.includes("高等专科学校")) {
    variants.push(name.replace("高等专科学校", "职业技术学院"));
  }
  return variants;
}

async function main() {
  console.log("开始导入双高计划真实名单...\n");

  const allEntries = [...HIGH_LEVEL_SCHOOLS, ...HIGH_LEVEL_GROUPS];
  console.log(`总计 ${allEntries.length} 所双高院校`);

  // Clear existing seed honors (keep real ones)
  const before = await prisma.honor.count();
  console.log(`当前荣誉记录: ${before} 条`);

  let matched = 0;
  let unmatched = 0;
  const unmatchedList: string[] = [];

  for (const entry of allEntries) {
    const variants = nameVariants(entry.name);
    let college = null;

    for (const variant of variants) {
      college = await prisma.college.findFirst({
        where: { name: variant, level: "专科" },
      });
      if (college) break;

      // Try fuzzy: name contains the variant (for cases like "深圳职业技术大学" renamed from "深圳职业技术学院")
      college = await prisma.college.findFirst({
        where: {
          name: { contains: variant.replace("职业技术大学", "").replace("职业大学", "").replace("职业技术学院", "").replace("高等专科学校", "") },
          level: "专科",
        },
      });
      if (college) break;
    }

    if (college) {
      // Create honor record
      await prisma.honor.create({
        data: {
          collegeId: college.id,
          title: `中国特色高水平${entry.category.includes("双高A类") ? "高职学校" : "专业群"}建设单位 (${
            entry.category.includes("A类") ? "A档" : entry.category.includes("B类") ? "B档" : "C档"
          })`,
          category: entry.category,
          batch: "第一轮",
          year: 2019,
          source: "教育部 财政部《关于公布中国特色高水平高职学校和专业建设计划建设单位名单的通知》(教职成函〔2019〕14号)",
        },
      });
      matched++;
    } else {
      unmatched++;
      unmatchedList.push(entry.name);
    }
  }

  const after = await prisma.honor.count();
  console.log(`\n匹配成功: ${matched} 所`);
  console.log(`未匹配: ${unmatched} 所`);
  if (unmatchedList.length > 0) {
    console.log(`未匹配名单:\n  ${unmatchedList.join("\n  ")}`);
  }
  console.log(`\n荣誉记录: ${before} → ${after} (新增 ${after - before} 条)`);

  // Stats
  const shuanggaoCount = await prisma.college.count({
    where: { honors: { some: { category: { startsWith: "双高" } } } },
  });
  console.log(`\n双高院校数: ${shuanggaoCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

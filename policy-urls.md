# 政策爬虫源 URL 汇总

>最后更新: 2026-06-29 | 共 23 个可用源 + 1 个跳过 + 8 个待探索
>
## 国家级

|源名称|省份|URL|备注|
|:----|:----|:----|:----|
|教育部-职成司|全国|`https://www.moe.gov.cn/s78/A07/`|SPA，偶发超时|



## 省级教育厅（已验证可用）

### 初始批次（已验证 2026-06-26）

|源名称|省份|URL|翻页|备注|
|:----|:----|:----|:----|:----|
|湖南省教育厅|湖南省|`https://jyt.hunan.gov.cn/jyt/sjyt/xxgk/tzgg/`|index_N|document.write，提取不稳定|
|广东省教育厅|广东省|`https://edu.gd.gov.cn/zwgknew/jyzcfg/`|index_N|翻5页，产出最多|
|江苏省教育厅|江苏省|`https://jyt.jiangsu.gov.cn/col/col58320/index.html`|pageNum|翻4页|
|浙江省教育厅|浙江省|`https://jyt.zj.gov.cn/col/col1532983/index.html`|—|职业教育专栏|
|山东省教育厅|山东省|`http://edu.shandong.gov.cn/col/col11990/index.html`|pageNum|HTTP站点，domcontentloaded|
|河南省教育厅|河南省|`https://jyt.henan.gov.cn/xxgk/wjtz/`|—| |
|河北省教育厅|河北省|`http://www.hee.gov.cn/col/1410097726928/index.html`|—| |
|福建省教育厅|福建省|`https://jyt.fujian.gov.cn/xxgk/zywj/`|—|重要文件栏目|
|湖北省教育厅|湖北省|`https://jyt.hubei.gov.cn/zfxxgk/zc_GK2020/gfxwj_GK2020/ztfl/zyjy/`|—|专用职业教育页|



### 扩展批次（2026-06-29 第1批）

|源名称|省份|URL|备注|
|:----|:----|:----|:----|
|北京市教育委员会|北京市|`https://jw.beijing.gov.cn/tzgg/`| |
|天津市教育委员会|天津市|`https://jy.tj.gov.cn/ZWGK_52172/TZGG/`| |
|海南省教育厅|海南省|`https://edu.hainan.gov.cn/xxgk/tzgg/`| |
|贵州省教育厅|贵州省|`https://jyt.guizhou.gov.cn/zwgk/tzgg/`| |
|云南省教育厅|云南省|`https://jyt.yn.gov.cn/web/zwgk/tzgg/`| |
|安徽省教育厅|安徽省|`https://jyt.ah.gov.cn/xwzx/tzgg/`| |
|内蒙古自治区教育厅|内蒙古|`https://jyt.nmg.gov.cn/zwgk/tzgg_25132/`| |
|上海市教育委员会|上海市|`https://edu.sh.gov.cn/xxgk2_zdgz/`| |
|重庆市教育委员会|重庆市|`https://jw.cq.gov.cn/zwgk/zfxxgkml/zcwj/`| |



### 扩展批次（2026-06-29 第2批）

|源名称|省份|URL|备注|
|:----|:----|:----|:----|
|辽宁省教育厅|辽宁省|`https://jyt.ln.gov.cn/jyt/gk/jywj/index.shtml`| |
|吉林省教育厅|吉林省|`https://xxgk.jl.gov.cn/zcbm/fgw_97963/xxgkmlqy/`| |
|黑龙江省教育厅|黑龙江省|`https://jyt.hlj.gov.cn/jyt/c110481/public_list.shtml`|通知公告版块|
|江西省教育厅|江西省|`https://jyt.jiangxi.gov.cn/jxjyw/zcwj978/index.html`|政策文件|



## 已标记跳过

|源名称|省份|URL|跳过原因|
|:----|:----|:----|:----|
|四川省教育厅|四川省|`https://edu.sc.gov.cn/scedu/zcwjk/newzfwj.shtml`|JS 动态表格，需 XHR API 拦截|



## 待探索（8 省）

以下省份教育厅网站连接失败，需要找到正确的政策栏目 URL：

|省份|教育厅首页|政策栏目|备注|状态|
|:----|:----|:----|:----|:----|
|山西省|`jyt.shanxi.gov.cn`|[https://jyt.shanxi.gov.cn/xwzx/ggtz/](https://jyt.shanxi.gov.cn/xwzx/ggtz/)|||
|广西壮族自治区|`jyt.gxzf.gov.cn`|[http://jyt.gxzf.gov.cn/zfxxgk/zc/](http://jyt.gxzf.gov.cn/zfxxgk/zc/)|||
|陕西省|`jyt.shaanxi.gov.cn`|[https://jyt.shaanxi.gov.cn/gk/zc/gfxwj_20255/gfxwj_20254/](https://jyt.shaanxi.gov.cn/gk/zc/gfxwj_20255/gfxwj_20254/)|||
|甘肃省|`jyt.gansu.gov.cn`|[https://jyt.gansu.gov.cn/jyt/c110634/zwgklist.shtml](https://jyt.gansu.gov.cn/jyt/c110634/zwgklist.shtml)|||
|青海省|`jyt.qinghai.gov.cn`|[https://jyt.qinghai.gov.cn/gk/tzgg/](https://jyt.qinghai.gov.cn/gk/tzgg/)|||
|宁夏回族自治区|`jyt.nx.gov.cn`|[https://jyt.nx.gov.cn/xwdt/tzgg/](https://jyt.nx.gov.cn/xwdt/tzgg/)|||
|新疆维吾尔自治区|`jyt.xinjiang.gov.cn`|[https://jyt.xinjiang.gov.cn/edu/zxwj/list_xw.shtml](https://jyt.xinjiang.gov.cn/edu/zxwj/list_xw.shtml)|||
|西藏自治区|`edu.xizang.gov.cn`|[http://edu.xizang.gov.cn/6/index.html](http://edu.xizang.gov.cn/6/index.html)|文件通知栏目||




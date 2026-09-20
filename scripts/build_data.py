"""Build the explicitly approximate, bilingual Figure 2 snapshot. Python stdlib only."""
import json
from pathlib import Path

rows = [
('management','管理','Management',91,13,'组织协调、人员管理与决策仍需人类负责；文档和分析任务更易被辅助。','Coordination, people management and accountability remain human responsibilities; documents and analysis are easier to assist.'),
('business-finance','商业与金融','Business & finance',94,28,'信息处理、财务分析和报告撰写具有较高理论覆盖；合规与判断影响落地。','Information processing, financial analysis and reporting have high theoretical exposure; compliance and judgment shape adoption.'),
('computer-math','计算机与数学','Computer & math',94,33,'编程与分析是 Claude 的常见用途。此处采用研究正文明确给出的 94% 和 33%，而非图像近似读数。','Coding and analysis are common Claude uses. This category uses the 94% and 33% explicitly reported in the article rather than the approximate plotted values.'),
('architecture-engineering','建筑设计与工程','Architecture & engineering',85,5,'设计、计算和技术文档可获得辅助；现场验证、安全责任及专用软件限制全面应用。','Design, calculation and documentation can be assisted; site validation, safety responsibility and specialist software constrain adoption.'),
('life-social-sciences','生命与社会科学','Life & social sciences',77,11,'文献与数据分析具有潜力，但实验、实地调查和研究验证仍不可省略。','Literature and data analysis offer potential, while experiments, fieldwork and research validation remain essential.'),
('social-services','社区与社会服务','Social services',51,4,'记录和信息整理可以被辅助，面对面支持、信任关系与个案判断依赖人。','Record keeping and information organization can be assisted; in-person support, trust and case judgment depend on people.'),
('legal','法律','Legal',89,20,'研究与文书工作具有较高覆盖潜力，但不等于可以替代出庭、专业责任与法律判断。','Research and document work have high potential coverage; this does not replace courtroom representation, professional responsibility or legal judgment.'),
('education-library','教育与图书馆','Education & library',62,18,'备课和信息检索可以提效，但课堂管理、照护和教学关系不等同于文本任务。','Lesson preparation and information retrieval can be accelerated; classroom management, care and teaching relationships are not just text tasks.'),
('arts-media','艺术与媒体','Arts & media',84,19,'内容草拟、编辑和创意探索容易获得辅助；审美、原创方向与版权约束影响使用。','Drafting, editing and creative exploration can be assisted; taste, original direction and rights affect use.'),
('healthcare-practitioners','医疗专业人员','Healthcare practitioners',60,5,'医疗文档与知识检索具有潜力；临床照护、执业资格和安全验证限制实际应用。','Documentation and knowledge retrieval offer potential; clinical care, licensing and safety validation limit deployment.'),
('healthcare-support','医疗辅助','Healthcare support',28,2,'大量工作需要直接照护和现场协作，文本模型目前只能覆盖其中少量任务。','Much of the work involves direct care and on-site coordination; text models currently cover relatively few tasks.'),
('protective-service','公共安全与防护','Protective service',31,3,'报告和信息处理可被辅助，现场响应、执法责任和物理行动仍是核心。','Reporting and information processing can be assisted; physical response and public-safety accountability remain central.'),
('food-serving','餐饮服务','Food & serving',17,3,'备餐和服务以实体操作为主；本研究的低覆盖并不衡量机器人自动化。','Preparation and service center on physical work; low coverage here does not measure robotics automation.'),
('grounds-maintenance','清洁与场地维护','Grounds maintenance',4,2,'清洁、园艺与场地维护高度依赖物理操作，超出本研究文本模型的主要能力范围。','Cleaning, landscaping and maintenance depend on physical tasks outside the main scope of text models in this study.'),
('personal-care','个人照护与服务','Personal care',18,2,'面对面服务与实际照护占较大比重，排班或文书只是工作的一部分。','In-person service and hands-on care dominate; scheduling and paperwork are only part of the job.'),
('sales','销售','Sales',62,27,'沟通文案、产品信息和客户跟进可获辅助；谈判、信任与现场销售仍依赖具体情境。','Sales copy, product information and follow-ups can be assisted; negotiation, trust and in-person sales remain contextual.'),
('office-admin','办公室与行政','Office & admin',90,34,'文书、数据录入与信息流转具有较高覆盖。90% 理论值来自正文，观察值为读图近似值。','Documents, data entry and information routing have high coverage. The 90% theoretical value is reported in the text; observed coverage is digitized from the figure.'),
('agriculture','农林渔业','Agriculture',16,1,'种植、采收与设备操作以实体劳动为主；低覆盖不代表未来不受其他自动化影响。','Growing, harvesting and equipment operation are physical; low exposure does not rule out other forms of future automation.'),
('construction','建筑施工','Construction',17,1,'现场施工、材料处理和安全协调无法只靠文本模型完成。','On-site construction, material handling and safety coordination cannot be performed by text models alone.'),
('installation-repair','安装与维修','Installation & repair',18,2,'诊断资料可辅助判断，但安装和维修仍需要实体操作及现场经验。','Diagnostic information can support judgment, but installation and repair require physical work and on-site experience.'),
('production','生产制造','Production',19,1,'生产流程中的实体操作占比较高；本图并不是工业机器人替代率。','Physical operations make up much of production work; this chart is not an industrial-robot displacement estimate.'),
('transportation','运输与物流','Transportation',12,1,'驾驶、搬运与配送以物理任务为主，本研究不覆盖自动驾驶等全部技术路径。','Driving, handling and delivery are physical tasks; this study does not cover all technologies such as autonomous vehicles.'),
]
meta = {
 'title':'Labor market impacts of AI: A new measure and early evidence',
 'sourceUrl':'https://www.anthropic.com/research/labor-market-impacts',
 'publishedAt':'2026-03-05',
 'figureUrl':'https://cdn.sanity.io/images/4zrzovbb/website/c1952c81bca02a7c8cc05ef7801e67ca60831c55-4096x4096.png',
 'dataNote':{
  'zh':'研究快照，非实时预测。除正文明确报告的计算机与数学 94% / 33%、办公室与行政理论值 90% 外，其余数值均为 Figure 2 读图近似值（≈），四舍五入为整数，不是官方精确数据集。计算机与数学的图示与正文略有差异，本页以正文为准。分类基于美国职业，不代表中国或全球行业就业数据。',
  'en':'Research snapshot, not a live forecast. Except for the explicitly reported Computer & math 94% / 33% and Office & admin theoretical 90%, values are approximate Figure 2 readings (≈), rounded to whole percentages—not an official exact dataset. Computer & math differs slightly between the plot and text; this page prioritizes the text. Categories are US occupations, not Chinese or global industry employment data.'},
 'method':{
  'zh':'理论覆盖基于 Eloundou 等人的任务级 LLM 提效评分；观察覆盖结合 Claude 工作场景使用数据，对自动化用途赋予高于人机协作用途的权重。任务按时间占比汇总为职业，再按就业人数汇总为职业类别。观察覆盖仅反映研究样本，既不是全部 AI 使用率，也不是岗位消失概率。行业解释是本应用的编辑性说明，不是原报告逐字结论。',
  'en':'Theoretical coverage uses Eloundou et al.’s task-level LLM productivity ratings. Observed coverage combines work-related Claude usage, weighting automation more than augmentation. Tasks are time-weighted into occupations and employment-weighted into categories. Observed coverage reflects the study sample, not all AI use or a probability of job loss. Category explanations are editorial context, not verbatim research findings.'}
}
categories=[dict(id=i,zh=z,en=e,theoretical=t,observed=o,precision='reported' if i=='computer-math' else 'approximate',description={'zh':dz,'en':de},reportedMetrics=['theoretical','observed'] if i=='computer-math' else ['theoretical'] if i=='office-admin' else []) for i,z,e,t,o,dz,de in rows]
assert len(categories)==22 and len({c['id'] for c in categories})==22
assert all(0<=c['observed']<=c['theoretical']<=100 for c in categories)
p=Path(__file__).resolve().parents[1]/'data.json'
p.write_text(json.dumps({'meta':meta,'categories':categories},ensure_ascii=False,indent=2)+'\n')
print(f'Wrote {p}: {len(categories)} categories')

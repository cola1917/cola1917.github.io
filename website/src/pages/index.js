import React from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';

const heroStats = [
  { value: '3年+', label: '自动化测试与平台化经验' },
  { value: '0.85 → 2.1 FPS', label: 'BEV 引擎吞吐提升' },
  { value: 'v1 ~ v8', label: '规则版本与可追溯回放' },
  { value: 'Monash MSc', label: '数据科学硕士' },
];

const focusTags = [
  'Autonomous Driving',
  'Evaluation Systems',
  'Long-tail Mining',
  'Data Loop Closure',
  'Performance Tuning',
];

const quickFacts = [
  '北京',
  '数据闭环 / 评测算法',
  '自动驾驶感知',
  '自动化测试',
];

const featuredImpact = [
  { label: '评测到回流', value: '闭环' },
  { label: '场景挖掘', value: '自动化' },
  { label: '吞吐优化', value: '+144%' },
];

const principles = [
  {
    title: '数据闭环不是报表，而是流程',
    text: '我更关注评测结果如何反向影响采样、回放、仿真与数据回流，而不是只停留在一次性结论。',
  },
  {
    title: '长尾问题需要可复核',
    text: '场景挖掘必须能被回放、解释和复验，所以工具链里会同时保留指标、图片、动图和场景导出。',
  },
  {
    title: '工程化决定规模上限',
    text: '从共享内存到批量回放、从规则版本化到 CI 集成，我倾向把实验性方法做成稳定可扩展的系统。',
  },
];

const projects = [
  {
    id: '01',
    name: 'ad-eval-suite',
    summary: '面向自动驾驶的自动化感知评测与长尾挖掘套件，打通“指标计算 - 失败场景挖掘 - 回放可视化 - 仿真场景导出”的闭环。',
    tech: ['Python', 'nuScenes', '目标检测 / 多目标跟踪评测', 'OpenSCENARIO', 'esmini'],
    metrics: ['mAP / AP', 'MOTA / IDF1', 'Bad Case 回放'],
    note: '统一 YAML 策略配置、Bad Case 挖掘、nuScenes 地图叠加、xosc 导出与 headless smoke 验证串成一条链。',
    visualType: 'image',
    visualBadge: '图片占位',
    visualTitle: '评测回放封面',
    visualDescription: '可替换为回放截图 / 结果对比图',
    visualHint: '4:3 静态图',
  },
  {
    id: '02',
    name: '高性能环视感知 BEV 融合与可视化评测引擎',
    summary: '围绕 BEV 融合、性能优化和批量回放打造的工程引擎，让多传感器几何链路能稳定、可视化、可对标。',
    tech: ['BEV', 'Pre-computed LUT', 'Shared Memory', '多进程并行'],
    metrics: ['0.85 FPS', '2.1 FPS', '+144% 提升'],
    note: '用 LUT 预计算、Numba、Shared Memory 和 TurboJPEG 把 Python 的处理瓶颈拆开，支撑批量回放。',
    visualType: 'video',
    visualBadge: '视频占位',
    visualTitle: '30 秒 demo',
    visualDescription: '可替换为项目演示视频 / 录屏',
    visualHint: '16:10 视频框',
  },
  {
    id: '03',
    name: '自动驾驶触发式场景挖掘引擎 Trigger Engine',
    summary: '面向海量路测回传场景数据的规则触发挖掘引擎，把长尾风险场景抽象为可配置规则链。',
    tech: ['Python', 'TFRecord', 'Rule-based Trigger Mining', 'Docker', 'CSV / JSON Pipeline'],
    metrics: ['v1 ~ v8', '50 / 150 分片', 'PNG / GIF 输出'],
    note: '通过时序约束、场景级反误检过滤层与版本化规则覆盖机制，把高价值片段筛出来并可视化。',
    visualType: 'image',
    visualBadge: '图片占位',
    visualTitle: '触发结果面板',
    visualDescription: '可替换为事件统计 / 触发清单',
    visualHint: '静态图 / GIF',
  },
];

const experience = [
  {
    period: '2020.10 - 2023.06',
    company: '北京格上财富有限公司',
    title: '自动化测试工程师',
    points: [
      '独立搭建后端接口及场景级自动化回归框架，深度集成 Jenkins 实现 CI/CD 闭环流水线。',
      '将系统回归周期从 3 天压缩至 4 小时，保障高频迭代交付。',
      '自研“数据工厂”造数平台，实现测试场景化数据的一键生成与自动化校验，单场景造数效率提升 80%+。',
    ],
  },
  {
    period: '2019.07 - 2020.09',
    company: '北京华源格林技术有限公司',
    title: '测试工程师',
    points: [
      '负责复杂大数据测试环境的独立部署、资源调度管理，以及仿真数据中台的链路保障与功能验证。',
    ],
  },
];

const education = [
  {
    period: '2024.07 - 2026.11',
    school: '莫纳什大学',
    major: '数据科学硕士',
  },
  {
    period: '2015.09 - 2019.07',
    school: '中北大学',
    major: '无机非金属材料工程',
  },
];

const strengths = [
  '数据闭环',
  '评测算法',
  '自动驾驶感知',
  '长尾场景挖掘',
  '自动化测试',
  '工程化落地',
  '性能优化',
  'CI/CD',
];

function SectionTitle({ eyebrow, title, description }) {
  return (
    <div className="section-title">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {description ? <p className="section-description">{description}</p> : null}
    </div>
  );
}

function MediaFrame({ badge, title, description, hint, variant }) {
  return (
    <div className={`media-frame media-frame--${variant}`}>
      <div className="media-frame__glow" />
      <p className="media-frame__badge">{badge}</p>
      <h3>{title}</h3>
      <p className="media-frame__description">{description}</p>
      <span className="media-frame__hint">{hint}</span>
      {variant === 'video' ? <div className="media-frame__play">▶</div> : null}
    </div>
  );
}

function AvatarCard() {
  return (
    <div className="avatar-card">
      <div className="avatar-card__ring">
        <div className="avatar-card__inner">王</div>
      </div>
      <div className="avatar-card__copy">
        <p className="eyebrow">Profile</p>
        <h3>王江涛</h3>
        <p>把自动驾驶评测、长尾挖掘和数据闭环做成可持续迭代的系统。</p>
        <div className="avatar-card__facts">
          {quickFacts.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Layout title="王江涛 | 数据闭环 / 评测算法" description="王江涛的高端个人主页，面向面试展示。">
      <main className="resume-page premium-page">
        <section className="hero-shell">
          <div className="hero-copy">
            <p className="hero-kicker">Portfolio / Autonomous Driving Evaluation</p>
            <h1>王江涛</h1>
            <p className="hero-role">求职意向：数据闭环 / 评测算法 · Base：北京 · Monash University</p>
            <p className="hero-summary">
              我把自动驾驶评测、长尾场景挖掘、回放可视化和仿真联动看成同一条链路。
              目标不是做出一个一次性的结果页，而是做出一套能持续发现问题、复验问题、回流问题的闭环系统。
            </p>

            <div className="focus-tag-row">
              {focusTags.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>

            <div className="hero-pill-row">
              <span>数据闭环</span>
              <span>评测算法</span>
              <span>自动驾驶感知</span>
              <span>工程化落地</span>
            </div>

            <div className="hero-actions">
              <Link className="button button--primary button--lg" to="/#projects">
                查看项目案例
              </Link>
              <a className="button button--secondary button--lg" href="mailto:colawang1997@outlook.com">
                发送邮件
              </a>
              <Link className="button button--secondary button--lg" to="/resume">
                存档简历
              </Link>
            </div>

            <div className="hero-stats">
              {heroStats.map((item) => (
                <article className="stat-card" key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </article>
              ))}
            </div>

            <div className="featured-impact-strip">
              {featuredImpact.map((item) => (
                <article className="impact-chip" key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </article>
              ))}
            </div>
          </div>

          <aside className="hero-visual">
            <AvatarCard />
            <MediaFrame
              variant="image"
              badge="图片占位"
              title="个人形象 / 封面主视觉"
              description="这里后续可替换为个人照片、品牌封面或主视觉海报。"
              hint="4:5 人像 / 封面图"
            />
            <MediaFrame
              variant="video"
              badge="视频占位"
              title="30 秒自我介绍 / Demo"
              description="这里后续可替换为项目演示、作品集介绍或面试短视频。"
              hint="16:10 视频框"
            />
            <div className="hero-quote-card">
              <p>核心定位</p>
              <strong>把长尾问题转成可被自动发现、自动复核、自动回流的闭环系统。</strong>
            </div>
            <div className="hero-micro-card">
              <p className="eyebrow">Now</p>
              <span>正在把评测能力和工程链路继续产品化。</span>
            </div>
          </aside>
        </section>

        <section className="content-section" id="story">
          <SectionTitle
            eyebrow="Story"
            title="我做事的方式"
            description="我更像在搭一条系统链路：先定义问题，再让评测、可视化和回流变成一个持续运转的过程。"
          />
          <div className="principles-grid">
            {principles.map((item) => (
              <article className="principle-card" key={item.title}>
                <p className="principle-index">01</p>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
          <div className="insight-panel">
            <div>
              <p className="eyebrow">Current Focus</p>
              <h3>自动驾驶评测、长尾挖掘、数据中台与工程化效率</h3>
            </div>
            <p>
              我希望把“发现问题”这件事做得更系统：一端连接指标与规则，一端连接回放与仿真，中间用可视化、版本化和自动化把过程固定下来。
            </p>
          </div>
        </section>

        <section className="content-section" id="projects">
          <SectionTitle
            eyebrow="Projects"
            title="项目案例"
            description="每个项目都不是单独的展示点，而是围绕评测、挖掘、回放、导出和验证搭出的完整闭环。"
          />
          <div className="case-study-list">
            {projects.map((project, index) => (
              <article
                className={`case-study-card ${index % 2 === 1 ? 'case-study-card--reverse' : ''}`}
                key={project.id}
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <div className="case-study-copy">
                  <p className="case-study-index">{project.id}</p>
                  <h3>{project.name}</h3>
                  <p className="case-study-summary">{project.summary}</p>

                  <div className="tech-row">
                    {project.tech.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>

                  <div className="metric-grid">
                    {project.metrics.map((item) => (
                      <div className="metric-card" key={item}>
                        <strong>{item}</strong>
                      </div>
                    ))}
                  </div>

                  <p className="case-study-note">{project.note}</p>
                </div>

                <div className="case-study-visual">
                  <MediaFrame
                    variant={project.visualType}
                    badge={project.visualBadge}
                    title={project.visualTitle}
                    description={project.visualDescription}
                    hint={project.visualHint}
                  />
                  <p className="media-caption">项目链接先留空，后续可直接替换为 GitHub、视频或线上 Demo。</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section experience-layout" id="experience">
          <div>
            <SectionTitle
              eyebrow="Experience"
              title="工作经历"
              description="测试工程和自动化交付是底座，后来逐步往数据平台、场景挖掘和评测体系上延展。"
            />
            <div className="timeline-list">
              {experience.map((job) => (
                <article className="timeline-card" key={`${job.period}-${job.company}`}>
                  <p className="timeline-period">{job.period}</p>
                  <h3>{job.company}</h3>
                  <p className="job-title">{job.title}</p>
                  <ul>
                    {job.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>

          <aside className="side-rail">
            <SectionTitle
              eyebrow="Education"
              title="教育背景"
              description="数据科学训练结合工程实践，重点关注系统化分析和可落地的技术实现。"
            />
            <div className="education-grid">
              {education.map((item) => (
                <article className="education-card" key={`${item.period}-${item.school}`}>
                  <p className="timeline-period">{item.period}</p>
                  <h3>{item.school}</h3>
                  <p>{item.major}</p>
                </article>
              ))}
            </div>

            <div className="strength-cloud-card">
              <p className="eyebrow">Focus Tags</p>
              <div className="strength-cloud">
                {strengths.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>

            <div className="note-card">
              <h3>面试摘要</h3>
              <p>
                更擅长把模糊问题拆成可执行的工程链路：定义指标、沉淀规则、构建回放、联动仿真，再把结果回流到评测和数据体系中。
              </p>
            </div>
          </aside>
        </section>

        <section className="content-section contact-shell" id="contact">
          <div className="contact-copy">
            <p className="eyebrow">Contact</p>
            <h2>如果你在找一位能把评测和数据闭环落地的人</h2>
            <p>
              可以直接联系我。当前页面里所有图片和视频都先保留为占位，后续我可以继续补真实项目截图、个人照片和短视频。
            </p>
          </div>

          <div className="contact-grid">
            <article className="contact-card">
              <span>邮箱</span>
              <strong>colawang1997@outlook.com</strong>
            </article>
            <article className="contact-card">
              <span>Base</span>
              <strong>北京</strong>
            </article>
            <article className="contact-card">
              <span>简历存档</span>
              <strong>
                <Link to="/resume">打开 /resume</Link>
              </strong>
            </article>
          </div>
        </section>
      </main>
    </Layout>
  );
}

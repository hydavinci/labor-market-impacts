(() => {
  'use strict';

  const I18N = {
    zh: {
      skip: '跳到主要内容',
      brandTop: '劳动力市场',
      brandBottom: '影响观察站',
      sourceMini: '原始研究',
      eyebrow: 'THE FUTURE OF WORK · 职业影响观察',
      heroTitle: 'AI 正在改变，哪些工作？',
      heroLead: '把 Anthropic 对 22 个职业大类的 AI 任务覆盖与 Claude 实际使用信号放在同一张图里：理论可及性、观察到的使用，以及两者之间的落差。',
      scopeTask: '任务覆盖，不是岗位替代预测',
      scopeUS: '美国职业分类口径',
      scopeClaude: 'Claude 使用信号，不代表整个行业',
      readOriginal: '阅读 Anthropic 原文',
      downloadCsv: '下载 CSV',
      loading: '正在读取本地 data.json…',
      loadError: '数据暂时无法加载，请检查网络后刷新页面重试。',
      dataInvalid: 'data.json 结构不完整：需要 meta 与 categories 数组。',
      statCategories: '职业大类',
      statCategoriesHelp: '用于雷达图与排名',
      statAvgTheory: '类别平均理论覆盖',
      statAvgTheoryHelp: '22 类等权平均，非全体就业加权值',
      statAvgObserved: '类别平均观察覆盖',
      statAvgObservedHelp: '22 类等权平均，基于 Claude 使用样本',
      statGap: '平均落差',
      statGapHelp: '理论覆盖减去观察覆盖',
      exploreKicker: '交互探索',
      exploreTitle: '22 个职业领域，一张影响地图',
      legendTheory: '理论覆盖',
      legendObserved: '观察覆盖',
      radarKicker: '22 类职业雷达',
      radarTitle: '理论能力，与现实之间',
      radarHint: '点击编号或数据点探索职业；支持键盘选择。',
      selectedKicker: '当前选择',
      detailTheory: '理论覆盖',
      detailObserved: '观察覆盖',
      detailGap: '落差',
      detailPrecision: '数据精度',
      detailCaveat: '若数值来自论文图形近似读取，将以“≈”标记；请结合数据说明理解。',
      precisionApproximate: '近似读取',
      precisionReported: '报告值',
      rankingKicker: '可搜索排名',
      rankingTitle: '横向条形对比',
      searchLabel: '搜索职业',
      searchPlaceholder: '搜索中文或英文名称',
      sortObserved: '按观察覆盖',
      sortTheory: '按理论覆盖',
      sortGap: '按落差',
      emptyState: '没有匹配的职业大类。',
      methodKicker: '方法',
      methodTitle: '如何阅读这份图表',
      caveatKicker: '重要边界',
      caveatTitle: '这不是“失业预测”',
      caveatTask: '指标描述的是任务层面的可自动化/辅助潜力与实际使用信号，不等于岗位消失概率。',
      caveatClaude: '观察覆盖基于 Claude 工作场景使用样本及任务权重，不代表所有 AI 工具或整个行业的采用程度。',
      caveatUS: '职业类别采用美国职业分类/任务口径，跨国家或行业迁移时需要谨慎。',
      footerBuilt: '静态双语可视化；数据由本地',
      footerProvided: '提供。',
      footerSource: '原始研究：',
      approxPrefix: '≈',
      percent: '%',
      numberPrefix: '编号',
      gapLabel: '落差',
      theoryShort: '理论',
      observedShort: '观察',
      sourceUpdated: '研究发布',
      csvNoData: '暂无可下载数据',
      selectedAria: '已选择',
      axisAria: '选择职业类别',
      pointAria: '选择数据点',
      noDescription: '暂无描述。',
      defaultMethod: '本页读取本地 data.json，将每个职业大类的理论任务覆盖与 Claude 使用观察值标准化到 0–100，并用雷达图与排名条展示差异。',
      defaultDataNote: '部分数值可能来自 Anthropic 图形的近似读取，因此应用会以“≈”提示不确定性。'
    },
    en: {
      skip: 'Skip to main content',
      brandTop: 'Labor Market',
      brandBottom: 'Impact Observatory',
      sourceMini: 'Original research',
      eyebrow: 'THE FUTURE OF WORK · AN INDEPENDENT OBSERVATORY',
      heroTitle: 'The changing shape of work.',
      heroLead: 'This view places Anthropic’s AI task exposure across 22 occupational categories beside observed Claude usage: theoretical reach, observed adoption signals, and the gap between them.',
      scopeTask: 'Task coverage, not job-loss prediction',
      scopeUS: 'US occupational framing',
      scopeClaude: 'Claude usage signals, not the whole industry',
      readOriginal: 'Read Anthropic research',
      downloadCsv: 'Download CSV',
      loading: 'Loading local data.json…',
      loadError: 'Data is temporarily unavailable. Please check your connection and refresh to try again.',
      dataInvalid: 'data.json is incomplete: expected meta and a categories array.',
      statCategories: 'Occupational categories',
      statCategoriesHelp: 'Used in the radar and ranking',
      statAvgTheory: 'Mean theoretical coverage',
      statAvgTheoryHelp: 'Unweighted mean across 22 categories',
      statAvgObserved: 'Mean observed coverage',
      statAvgObservedHelp: 'Unweighted category mean · Claude sample',
      statGap: 'Average gap',
      statGapHelp: 'Theoretical exposure minus observed usage',
      exploreKicker: 'Interactive exploration',
      exploreTitle: '22 fields. One evolving landscape.',
      legendTheory: 'Theoretical exposure',
      legendObserved: 'Observed coverage',
      radarKicker: '22-category radar',
      radarTitle: 'Capability meets reality',
      radarHint: 'Select an axis or point to explore. Keyboard accessible.',
      selectedKicker: 'Current selection',
      detailTheory: 'Theoretical exposure',
      detailObserved: 'Observed coverage',
      detailGap: 'Gap',
      detailPrecision: 'Data precision',
      detailCaveat: 'Values approximated from article figures are marked with “≈”; read them together with the data note.',
      precisionApproximate: 'Approximate',
      precisionReported: 'Reported',
      rankingKicker: 'Searchable ranking',
      rankingTitle: 'Horizontal bar comparison',
      searchLabel: 'Search occupation',
      searchPlaceholder: 'Search Chinese or English name',
      sortObserved: 'Observed coverage',
      sortTheory: 'Theoretical exposure',
      sortGap: 'Gap',
      emptyState: 'No occupational category matches your search.',
      methodKicker: 'Method',
      methodTitle: 'How to read this chart',
      caveatKicker: 'Important boundaries',
      caveatTitle: 'This is not a “job-loss forecast”',
      caveatTask: 'The measures describe task-level automation/augmentation potential and actual usage signals; they are not probabilities of jobs disappearing.',
      caveatClaude: 'Observed coverage uses work-related Claude samples and task weights; it does not represent all AI tools or whole-industry adoption.',
      caveatUS: 'Occupational categories follow US occupation/task framing and should be transferred across countries or industries cautiously.',
      footerBuilt: 'Static bilingual visualization; data is provided by local',
      footerProvided: 'file.',
      footerSource: 'Original research:',
      approxPrefix: '≈',
      percent: '%',
      numberPrefix: 'No.',
      gapLabel: 'Gap',
      theoryShort: 'Theory',
      observedShort: 'Observed',
      sourceUpdated: 'Research published',
      csvNoData: 'No data available to download',
      selectedAria: 'Selected',
      axisAria: 'Select occupational category',
      pointAria: 'Select data point',
      noDescription: 'No description available.',
      defaultMethod: 'This page reads local data.json, normalizes theoretical task exposure and observed Claude usage to a 0–100 scale, and presents their differences through a radar chart and ranking bars.',
      defaultDataNote: 'Some values may be approximated from Anthropic figures, so the interface marks them with “≈” to signal uncertainty.'
    }
  };

  const state = {
    lang: getInitialLang(),
    data: null,
    selectedId: null,
    sortKey: 'observed',
    query: '',
    visibleSeries: { theoretical: true, observed: true },
    errorKey: null
  };

  const el = {
    html: document.documentElement,
    status: document.getElementById('loadStatus'),
    statsGrid: document.getElementById('statsGrid'),
    dashboard: document.getElementById('dashboard'),
    rankingSection: document.getElementById('rankingSection'),
    methodGrid: document.getElementById('methodGrid'),
    statCount: document.getElementById('statCount'),
    statTheory: document.getElementById('statTheory'),
    statObserved: document.getElementById('statObserved'),
    statGap: document.getElementById('statGap'),
    radar: document.getElementById('radarChart'),
    detailTitle: document.getElementById('detailTitle'),
    detailDescription: document.getElementById('detailDescription'),
    detailTheory: document.getElementById('detailTheoryValue'),
    detailObserved: document.getElementById('detailObservedValue'),
    detailGap: document.getElementById('detailGapValue'),
    detailPrecision: document.getElementById('detailPrecisionValue'),
    detailCaveat: document.getElementById('detailCaveat'),
    rankingList: document.getElementById('rankingList'),
    emptyState: document.getElementById('emptyState'),
    search: document.getElementById('categorySearch'),
    methodText: document.getElementById('methodText'),
    dataNote: document.getElementById('dataNote'),
    sourceMeta: document.getElementById('sourceMeta'),
    downloadCsv: document.getElementById('downloadCsv'),
    sourceLinks: [
      document.getElementById('navSourceLink'),
      document.getElementById('heroSourceLink'),
      document.getElementById('footerSourceLink')
    ]
  };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    applyLanguage();
    bindControls();
    loadData();
  }

  function bindControls() {
    document.getElementById('categoryPicker').addEventListener('change', e => selectCategory(e.target.value, false));
    document.querySelectorAll('.lang-button').forEach((button) => {
      button.addEventListener('click', () => setLanguage(button.dataset.lang));
    });

    document.querySelectorAll('.legend-toggle').forEach((button) => {
      button.addEventListener('click', () => {
        const series = button.dataset.series;
        const bothVisible = state.visibleSeries.theoretical && state.visibleSeries.observed;
        const oneVisible = Object.values(state.visibleSeries).filter(Boolean).length === 1;
        if (oneVisible && state.visibleSeries[series]) {
          state.visibleSeries = { theoretical: true, observed: true };
        } else if (bothVisible) {
          state.visibleSeries[series] = false;
        } else {
          state.visibleSeries[series] = !state.visibleSeries[series];
        }
        if (!state.visibleSeries.theoretical && !state.visibleSeries.observed) {
          state.visibleSeries[series] = true;
        }
        updateLegendButtons();
        renderRadar();
        renderRanking();
      });
    });

    document.querySelectorAll('.sort-button').forEach((button) => {
      button.addEventListener('click', () => {
        state.sortKey = button.dataset.sort;
        document.querySelectorAll('.sort-button').forEach((item) => {
          const active = item === button;
          item.classList.toggle('active', active);
          item.setAttribute('aria-pressed', String(active));
        });
        renderRanking();
      });
    });

    el.search.addEventListener('input', () => {
      state.query = el.search.value.trim().toLocaleLowerCase();
      renderRanking();
    });

    el.downloadCsv.addEventListener('click', downloadCsv);
  }

  async function loadData() {
    try {
      const response = await fetch('./data.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      validateData(data);
      state.data = normalizeData(data);
      state.selectedId = state.data.categories.find(c => c.id === 'computer-math')?.id || state.data.categories[0]?.id || null;
      showLoaded();
      renderAll();
    } catch (error) {
      console.error(error);
      showError(error && error.message === 'invalid-data' ? 'dataInvalid' : 'loadError');
    }
  }

  function validateData(data) {
    if (!data || typeof data !== 'object' || !data.meta || !Array.isArray(data.categories) || data.categories.length === 0 || data.categories.some(c => !c || !c.id || !Number.isFinite(c.theoretical) || !Number.isFinite(c.observed) || c.observed < 0 || c.theoretical > 100 || c.observed > c.theoretical)) {
      throw new Error('invalid-data');
    }
  }

  function normalizeData(data) {
    const categories = data.categories
      .filter(Boolean)
      .map((category, index) => ({
        id: String(category.id || `category-${index + 1}`),
        zh: String(category.zh || category.en || `职业 ${index + 1}`),
        en: String(category.en || category.zh || `Category ${index + 1}`),
        theoretical: clampNumber(category.theoretical),
        observed: clampNumber(category.observed),
        precision: category.precision === 'reported' ? 'reported' : 'approximate',
        reportedMetrics: category.reportedMetrics || [],
        description: {
          zh: category.description?.zh || category.description?.en || '',
          en: category.description?.en || category.description?.zh || ''
        },
        originalIndex: index
      }));

    return {
      meta: {
        title: data.meta.title || '',
        sourceUrl: data.meta.sourceUrl || 'https://www.anthropic.com/research/labor-market-impacts',
        publishedAt: data.meta.publishedAt || '',
        dataNote: {
          zh: data.meta.dataNote?.zh || data.meta.dataNote?.en || I18N.zh.defaultDataNote,
          en: data.meta.dataNote?.en || data.meta.dataNote?.zh || I18N.en.defaultDataNote
        },
        method: {
          zh: data.meta.method?.zh || data.meta.method?.en || I18N.zh.defaultMethod,
          en: data.meta.method?.en || data.meta.method?.zh || I18N.en.defaultMethod
        }
      },
      categories
    };
  }

  function clampNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.max(0, Math.min(100, number));
  }

  function showLoaded() {
    state.errorKey = null;
    el.status.className = 'status-panel success';
    el.status.innerHTML = '';
    el.statsGrid.hidden = false;
    el.dashboard.hidden = false;
    el.rankingSection.hidden = false;
    el.methodGrid.hidden = false;
    el.downloadCsv.disabled = false;
  }

  function showError(key) {
    state.errorKey = key;
    el.status.className = 'status-panel error';
    el.status.innerHTML = `<strong>${escapeHtml(t(key))}</strong>`;
    el.downloadCsv.disabled = true;
  }

  function renderAll() {
    applyLanguage();
    renderStats();
    renderDetail();
    renderRadar();
    renderRanking();
    renderMethod();
  }

  function renderStats() {
    const categories = state.data.categories;
    const count = categories.length;
    const avgTheory = average(categories.map((item) => item.theoretical));
    const avgObserved = average(categories.map((item) => item.observed));
    const avgGap = average(categories.map((item) => item.theoretical - item.observed));
    el.statCount.textContent = String(count);
    el.statTheory.textContent = formatPercent(avgTheory, hasApprox(categories));
    el.statObserved.textContent = formatPercent(avgObserved, hasApprox(categories));
    el.statGap.textContent = formatSignedPercent(avgGap, hasApprox(categories));
  }

  function renderMethod() {
    const meta = state.data.meta;
    el.methodText.textContent = meta.method[state.lang] || t('defaultMethod');
    el.dataNote.textContent = meta.dataNote[state.lang] || t('defaultDataNote');
    el.sourceMeta.textContent = meta.publishedAt ? `${t('sourceUpdated')}: ${formatDate(meta.publishedAt)}` : `${t('sourceUpdated')}: —`;
    el.sourceLinks.forEach((link) => {
      if (link) link.href = meta.sourceUrl;
    });
  }

  function renderDetail() {
    const item = getSelected() || state.data.categories[0];
    if (!item) return;
    const gap = item.theoretical - item.observed;
    el.detailTitle.textContent = localizedName(item);
    el.detailDescription.textContent = item.description[state.lang] || t('noDescription');
    el.detailTheory.textContent = formatPercent(item.theoretical, isApprox(item, 'theoretical'));
    el.detailObserved.textContent = formatPercent(item.observed, isApprox(item, 'observed'));
    el.detailGap.textContent = formatSignedPercent(gap, item.precision === 'approximate');
    el.detailPrecision.textContent = item.precision === 'reported' ? t('precisionReported') : t('precisionApproximate');
    el.detailCaveat.textContent = t('detailCaveat');
    const picker = document.getElementById('categoryPicker');
    picker.innerHTML = state.data.categories.map((c,i) => `<option value="${escapeHtml(c.id)}">${String(i+1).padStart(2,'0')} · ${escapeHtml(localizedName(c))}</option>`).join('');
    picker.value = item.id;
  }

  function renderRadar() {
    const categories = state.data.categories;
    const selected = getSelected();
    const size = 760;
    const center = size / 2;
    const maxRadius = 268;
    const labelRadius = 332;
    const gridSteps = [20, 40, 60, 80, 100];
    const svg = el.radar;
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const title = svgNode('title', { id: 'radarSvgTitle' }, t('radarTitle'));
    const desc = svgNode('desc', { id: 'radarSvgDesc' }, `${t('legendTheory')} / ${t('legendObserved')}`);
    svg.append(title, desc);

    const gridGroup = svgNode('g', { class: 'radar-grid' });
    gridSteps.forEach((step) => {
      const points = categories.map((_, index) => pointFor(index, categories.length, (step / 100) * maxRadius, center));
      gridGroup.appendChild(svgNode('polygon', {
        class: 'radar-grid-line',
        points: pointsToString(points)
      }));
    });

    categories.forEach((category, index) => {
      const end = pointFor(index, categories.length, maxRadius, center);
      const axis = svgNode('line', {
        class: 'radar-axis',
        x1: center,
        y1: center,
        x2: end.x,
        y2: end.y
      });
      gridGroup.appendChild(axis);
    });
    svg.appendChild(gridGroup);

    if (selected) {
      const selectedIndex = categories.findIndex((item) => item.id === selected.id);
      const end = pointFor(selectedIndex, categories.length, maxRadius + 8, center);
      svg.appendChild(svgNode('line', {
        class: 'radar-selected-line',
        x1: center,
        y1: center,
        x2: end.x,
        y2: end.y
      }));
    }

    const theoryPoints = categories.map((category, index) => pointFor(index, categories.length, (category.theoretical / 100) * maxRadius, center));
    const observedPoints = categories.map((category, index) => pointFor(index, categories.length, (category.observed / 100) * maxRadius, center));

    const theoryPolygon = svgNode('polygon', {
      class: `radar-polygon-theoretical ${state.visibleSeries.theoretical ? '' : 'radar-series-hidden'}`,
      points: pointsToString(theoryPoints)
    });
    const observedPolygon = svgNode('polygon', {
      class: `radar-polygon-observed ${state.visibleSeries.observed ? '' : 'radar-series-hidden'}`,
      points: pointsToString(observedPoints)
    });
    svg.append(theoryPolygon, observedPolygon);
    gridSteps.forEach(step => {
      const p = pointFor(19.25, categories.length, (step / 100) * maxRadius, center);
      svg.appendChild(svgNode('text', {x:p.x, y:p.y, class:'radar-scale','text-anchor':'middle'}, `${step}%`));
    });

    const pointGroup = svgNode('g', { class: 'radar-points' });
    categories.forEach((category, index) => {
      const theoryPoint = theoryPoints[index];
      const observedPoint = observedPoints[index];
      if (state.visibleSeries.theoretical) {
        pointGroup.appendChild(pointButton(category, theoryPoint, 'theoretical'));
      }
      if (state.visibleSeries.observed) {
        pointGroup.appendChild(pointButton(category, observedPoint, 'observed'));
      }
    });
    svg.appendChild(pointGroup);

    const labelGroup = svgNode('g', { class: 'radar-labels' });
    categories.forEach((category, index) => {
      const p = pointFor(index, categories.length, labelRadius, center);
      const isSelected = category.id === state.selectedId;
      const group = svgNode('g', {
        class: `radar-label-button${isSelected ? ' selected' : ''}`,
        tabindex: '0',
        role: 'button',
        'aria-label': `${t('axisAria')}: ${index + 1}. ${localizedName(category)}`,
        'data-id': category.id
      });
      const short = shortLabel(category);
      group.appendChild(svgNode('rect', {
        class: 'radar-label-bg',
        x: p.x - 24,
        y: p.y - 21,
        width: 48,
        height: 42,
        rx: 16,
        ry: 16
      }));
      group.appendChild(svgNode('text', {
        class: 'radar-label-text',
        x: p.x,
        y: p.y - 2,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle'
      }, String(index + 1)));
      group.appendChild(svgNode('text', {
        class: 'radar-short-label',
        x: p.x,
        y: p.y + 14,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle'
      }, short));
      addSelectionHandlers(group, category.id);
      labelGroup.appendChild(group);
    });
    svg.appendChild(labelGroup);
  }

  function pointButton(category, point, series) {
    const isSelected = category.id === state.selectedId;
    const group = svgNode('g', {
      class: `radar-point-button${isSelected ? ' selected' : ''}`,
      tabindex: '0',
      role: 'button',
      'aria-label': `${t('pointAria')}: ${localizedName(category)}, ${series === 'theoretical' ? t('legendTheory') : t('legendObserved')}`,
      'data-id': category.id
    });
    group.appendChild(svgNode('circle', {
      class: `radar-point-${series}`,
      cx: point.x,
      cy: point.y,
      r: isSelected ? 7 : 5
    }));
    addSelectionHandlers(group, category.id);
    return group;
  }

  function addSelectionHandlers(node, id) {
    node.addEventListener('click', () => selectCategory(id, true));
    node.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectCategory(id, true);
      }
    });
  }

  function renderRanking() {
    const items = filteredAndSorted();
    el.rankingList.innerHTML = '';
    el.emptyState.hidden = items.length !== 0;

    items.forEach((category, visibleIndex) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `ranking-item${category.id === state.selectedId ? ' selected' : ''}`;
      button.dataset.id = category.id;
      button.setAttribute('aria-label', `${localizedName(category)}. ${t('detailTheory')} ${formatPercent(category.theoretical, isApprox(category, 'theoretical'))}; ${t('detailObserved')} ${formatPercent(category.observed, isApprox(category, 'observed'))}`);
      button.innerHTML = rankingMarkup(category, visibleIndex + 1);
      button.addEventListener('click', () => selectCategory(category.id, false));
      el.rankingList.appendChild(button);
    });
  }

  function rankingMarkup(category, rank) {
    const approx = category.precision === 'approximate';
    const theory = formatPercent(category.theoretical, isApprox(category, 'theoretical'));
    const observed = formatPercent(category.observed, isApprox(category, 'observed'));
    const gap = formatSignedPercent(category.theoretical - category.observed, approx);
    const theoryWidth = state.visibleSeries.theoretical ? category.theoretical : 0;
    const observedWidth = state.visibleSeries.observed ? category.observed : 0;
    return `
      <div class="rank-row-top">
        <div class="rank-name"><span class="rank-id">${rank}.</span>${escapeHtml(localizedName(category))}</div>
        <div class="rank-values">${escapeHtml(t('gapLabel'))}: ${escapeHtml(gap)}</div>
      </div>
      <div class="rank-bars">
        <div class="rank-bar-line">
          <span>${escapeHtml(t('theoryShort'))}</span>
          <span class="bar-track"><span class="bar-fill blue" style="width:${theoryWidth}%"></span></span>
          <strong>${escapeHtml(theory)}</strong>
        </div>
        <div class="rank-bar-line">
          <span>${escapeHtml(t('observedShort'))}</span>
          <span class="bar-track"><span class="bar-fill coral" style="width:${observedWidth}%"></span></span>
          <strong>${escapeHtml(observed)}</strong>
        </div>
      </div>
    `;
  }

  function filteredAndSorted() {
    const query = state.query;
    const scoreFor = (item) => {
      if (state.sortKey === 'gap') return item.theoretical - item.observed;
      return item[state.sortKey] || 0;
    };
    return state.data.categories
      .filter((item) => {
        if (!query) return true;
        return [item.zh, item.en, item.id].some((value) => String(value).toLocaleLowerCase().includes(query));
      })
      .sort((a, b) => scoreFor(b) - scoreFor(a) || a.originalIndex - b.originalIndex);
  }

  function selectCategory(id, scrollToDetail) {
    if (state.selectedId === id) return;
    const previous = document.activeElement;
    const restoreClass = previous?.classList.contains('radar-label-button') ? 'radar-label-button' : previous?.classList.contains('radar-point-button') ? 'radar-point-button' : previous?.classList.contains('ranking-item') ? 'ranking-item' : null;
    state.selectedId = id;
    renderDetail();
    renderRadar();
    renderRanking();
    if (restoreClass) document.querySelector(`.${restoreClass}[data-id="${CSS.escape(id)}"]`)?.focus({preventScroll:true});
    if (scrollToDetail && window.matchMedia('(max-width: 980px)').matches) {
      document.querySelector('.detail-card')?.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  }

  function setLanguage(lang) {
    if (!I18N[lang] || state.lang === lang) return;
    state.lang = lang;
    try {
      localStorage.setItem('laborImpactLang', lang);
    } catch (_) {
      // Language still switches even when storage is unavailable.
    }
    applyLanguage();
    if (state.data) {
      renderStats();
      renderDetail();
      renderRadar();
      renderRanking();
      renderMethod();
    }
  }

  function applyLanguage() {
    el.html.lang = state.lang === 'zh' ? 'zh-Hans' : 'en';
    document.title = state.lang === 'zh' ? 'AI 劳动力市场影响观察站' : 'AI Labor Market Impact Observatory';
    document.querySelectorAll('[data-i18n]').forEach((node) => {
      const key = node.dataset.i18n;
      if (I18N[state.lang][key]) node.textContent = I18N[state.lang][key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
      const key = node.dataset.i18nPlaceholder;
      if (I18N[state.lang][key]) node.setAttribute('placeholder', I18N[state.lang][key]);
    });
    document.querySelectorAll('.lang-button').forEach((button) => {
      const active = button.dataset.lang === state.lang;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('active', active);
    });
    if (state.errorKey) {
      el.status.innerHTML = `<strong>${escapeHtml(t(state.errorKey))}</strong>`;
    }
    document.getElementById('pickerLabel').textContent = state.lang === 'zh' ? '选择职业领域' : 'Explore an occupational field';
    document.querySelector('.home-link').textContent = state.lang === 'zh' ? '← Gray Mammoth 项目集' : '← Gray Mammoth projects';
    const chart = document.getElementById('radarChart');
    chart.setAttribute('role', 'group');
    updateLegendButtons();
  }

  function updateLegendButtons() {
    document.querySelectorAll('.legend-toggle').forEach((button) => {
      const active = Boolean(state.visibleSeries[button.dataset.series]);
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('active', active);
    });
  }

  function downloadCsv() {
    if (!state.data?.categories?.length) {
      alert(t('csvNoData'));
      return;
    }
    const headers = ['id', 'zh', 'en', 'theoretical', 'observed', 'gap', 'precision', 'description_zh', 'description_en', 'reported_metrics', 'source_url', 'research_date', 'data_note'];
    const rows = state.data.categories.map((item) => [
      item.id,
      item.zh,
      item.en,
      round(item.theoretical),
      round(item.observed),
      round(item.theoretical - item.observed),
      item.precision,
      item.description.zh,
      item.description.en,
      item.reportedMetrics.join(';'),
      state.data.meta.sourceUrl,
      state.data.meta.publishedAt,
      state.data.meta.dataNote[state.lang]
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(csvCell).join(','))
      .join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-labor-market-impacts.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function csvCell(value) {
    let text = String(value ?? '');
    if (/^[=+@\-]/.test(text)) text = "'" + text;
    return `"${text.replace(/"/g, '""')}"`;
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat(state.lang === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    }).format(date);
  }

  function getInitialLang() {
    try {
      const saved = localStorage.getItem('laborImpactLang');
      if (saved === 'zh' || saved === 'en') return saved;
    } catch (_) {
      // Ignore storage errors in private or restricted contexts.
    }
    return 'zh';
  }

  function getSelected() {
    return state.data?.categories.find((item) => item.id === state.selectedId) || null;
  }

  function localizedName(item) {
    return state.lang === 'zh' ? item.zh : item.en;
  }

  function shortLabel(item) {
    const name = localizedName(item);
    if (state.lang === 'zh') return name.replace(/[、，,\/].*$/, '').slice(0, 4);
    return name.split(/[,&/]/)[0].trim().split(/\s+/).slice(0, 2).join(' ');
  }

  function isApprox(item, metric) {
    return item.precision !== 'reported' && !item.reportedMetrics.includes(metric);
  }

  function formatPercent(value, approx) {
    const prefix = approx ? t('approxPrefix') : '';
    return `${prefix}${round(value)}${t('percent')}`;
  }

  function formatSignedPercent(value, approx) {
    const prefix = approx ? t('approxPrefix') : '';
    return `${prefix}${round(value)}${state.lang === 'zh' ? ' 个百分点' : ' pp'}`;
  }

  function round(value) {
    const rounded = Math.round(Number(value) * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  }

  function average(values) {
    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length;
  }

  function hasApprox(categories) {
    return categories.some((item) => item.precision === 'approximate');
  }

  function pointFor(index, total, radius, center) {
    const angle = -Math.PI / 2 + (index / total) * Math.PI * 2;
    return {
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius
    };
  }

  function pointsToString(points) {
    return points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');
  }

  function svgNode(name, attrs = {}, text) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', name);
    Object.entries(attrs).forEach(([key, value]) => {
      if (value !== undefined && value !== null) node.setAttribute(key, String(value));
    });
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function t(key) {
    return I18N[state.lang][key] || I18N.zh[key] || key;
  }
})();

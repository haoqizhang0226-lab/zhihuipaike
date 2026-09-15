(() => {
  'use strict';

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const weekday = value => ['周日','周一','周二','周三','周四','周五','周六'][new Date(`${value}T00:00:00`).getDay()];
  let toastTimer;

  function showToast(message) {
    let toast = document.getElementById('formalToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'formalToast';
      toast.className = 'formal-toast';
      document.body.append(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  function collectLessons() {
    return Array.from(document.querySelectorAll('#step5 .preview-lesson-list .preview-list-row:not(.preview-list-head)')).map(row => {
      const cells = Array.from(row.children);
      return {
        date: cells[0]?.querySelector('strong')?.textContent.trim() || '',
        day: cells[0]?.querySelector('span')?.textContent.trim() || '',
        time: cells[1]?.textContent.trim() || '',
        course: cells[2]?.textContent.trim() || '',
        hours: cells[3]?.textContent.trim() || '',
        teacher: cells[4]?.textContent.trim() || '',
        mode: cells[5]?.textContent.trim() || '',
        campus: cells[6]?.textContent.trim() || ''
      };
    }).filter(item => item.date && item.time && item.course);
  }

  function createPage() {
    let page = document.getElementById('formalSchedulePage');
    if (page) return page;
    page = document.createElement('section');
    page.id = 'formalSchedulePage';
    page.className = 'formal-schedule-page';
    page.hidden = true;
    document.querySelector('.main')?.append(page);
    return page;
  }

  function renderCalendar(lessons) {
    const dates = [...new Set(lessons.map(item => item.date))].sort();
    const times = [...new Set(lessons.map(item => item.time))].sort();
    const lessonMap = new Map();
    lessons.forEach(item => {
      const key = `${item.date}|${item.time}`;
      if (!lessonMap.has(key)) lessonMap.set(key, []);
      lessonMap.get(key).push(item);
    });
    const heads = `<div class="formal-calendar-head formal-calendar-corner">时间 / 日期</div>${dates.map(date => `<div class="formal-calendar-head">${escapeHtml(date)}<span>${escapeHtml(weekday(date))}</span></div>`).join('')}`;
    const rows = times.map(time => `<div class="formal-time">${escapeHtml(time)}</div>${dates.map(date => {
      const items = lessonMap.get(`${date}|${time}`) || [];
      return `<div class="formal-calendar-cell">${items.map(item => `<article class="formal-lesson"><strong>${escapeHtml(item.course)}</strong><span>${escapeHtml(item.teacher)}</span><span>${escapeHtml(item.hours)}${item.campus && item.campus !== '—' ? ` · ${escapeHtml(item.campus)}` : ''}</span><em>${escapeHtml(item.mode || '线上')}</em></article>`).join('')}</div>`;
    }).join('')}`).join('');
    return `<div class="formal-calendar-grid" style="--formal-day-count:${Math.max(dates.length,1)}">${heads}${rows}</div>`;
  }

  function showFormalSchedule(lessons) {
    if (!lessons.length) {
      showToast('没有可生成的课节，请先完成预排课表');
      return;
    }
    const page = createPage();
    const teachers = [...new Set(lessons.map(item => item.teacher).filter(Boolean))];
    const courses = [...new Set(lessons.map(item => item.course).filter(Boolean))];
    const firstDate = lessons.map(item => item.date).sort()[0];
    const lastDate = lessons.map(item => item.date).sort().at(-1);
    const totalHours = lessons.reduce((sum,item) => sum + (Number.parseFloat(item.hours) || 0), 0);
    const orderName = courses.some(name => name.includes('雅思')) ? '雅思听说读写组合排课单' : '英联邦学科-ALEVEL-多课程组合排课单';
    page.innerHTML = `
      <div class="formal-toolbar"><div><button class="formal-back" id="formalBack">‹ 返回</button><strong>排课单</strong><button id="formalRefresh">↻ 更新排课数据</button></div><div><button id="formalStudentPreview">预览学生课表</button><button class="primary" id="formalFinish">结束排课单</button></div></div>
      <section class="formal-order-card"><strong class="formal-order-title">${escapeHtml(orderName)}</strong><div class="formal-order-facts"><span>学生姓名：<strong>黑盒授课反馈产品验收</strong></span><span>班级课时：<strong>${totalHours}</strong></span><span>未排课时：<strong>0</strong></span><span>排课课程：${courses.map(course => `<span class="formal-course-pill">${escapeHtml(course)}</span>`).join(' ')}</span></div></section>
      <section class="formal-workspace"><header class="formal-workspace-head"><h2>教师排课　▣</h2><div class="formal-legend"><span class="published">已发布</span><span>待发布</span><span>待变更</span><span>冲突</span></div></header><div class="formal-linked-teachers"><span>已关联教师：</span>${teachers.map(teacher => `<span class="formal-teacher-chip">${escapeHtml(teacher)} ×</span>`).join('')}</div><div class="formal-actions"><button>添加课程时间</button><button>冲突检测</button><button>冲突详情</button><button>查看排课要求</button><button>查找可用课次</button><button>清除空白课次</button></div><div class="formal-actions"><button>关闭批量操作</button><button>全选</button><button disabled>时间调整</button><button disabled>关联课程</button><button disabled>关联教师</button><button disabled>关联教室</button></div><div class="formal-calendar-card"><div class="formal-calendar-caption"><strong>已生成正式课节（${lessons.length}节）</strong><span>${escapeHtml(firstDate)} 至 ${escapeHtml(lastDate)} · 灰色模块为正式排课</span></div><div class="formal-calendar-scroll">${renderCalendar(lessons)}</div></div><section class="formal-bottom-panel"><h3>教师日程　▣</h3><div class="formal-bottom-filters"><label>日期<input value="${escapeHtml(firstDate)} 至 ${escapeHtml(lastDate)}" readonly></label><label>时段<input value="${escapeHtml(timesLabel(lessons))}" readonly></label><label>星期<select><option>请选择</option></select></label><button>查询</button></div></section></section>`;

    document.querySelectorAll('.drawer-page').forEach(drawer => drawer.classList.remove('active'));
    document.body.classList.remove('drawer-open','teacher-scheduling-open','v6-manual-teacher-open');
    const detail = document.getElementById('detailPage');
    if (detail) detail.style.display = 'none';
    page.hidden = false;
    window.scrollTo({top:0,behavior:'smooth'});
    bindPageActions(page, detail);
  }

  function timesLabel(lessons) {
    const values = [...new Set(lessons.map(item => item.time))];
    return values.length > 3 ? `${values.slice(0,3).join('；')} 等${values.length}个时段` : values.join('；');
  }

  function bindPageActions(page, detail) {
    page.querySelector('#formalBack')?.addEventListener('click', () => {
      page.hidden = true;
      if (detail) detail.style.display = '';
    });
    page.querySelector('#formalRefresh')?.addEventListener('click', () => showToast('排课数据已更新'));
    page.querySelector('#formalStudentPreview')?.addEventListener('click', () => showToast('学生课表已按正式课节生成'));
    page.querySelector('#formalFinish')?.addEventListener('click', event => {
      event.currentTarget.disabled = true;
      event.currentTarget.textContent = '排课单已结束';
      showToast('排课单已结束');
    });
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('#confirmSchedule, #caseConfirmSchedule, #launchConfirm');
    if (!button || button.dataset.formalSchedulePending) return;
    const lessons = collectLessons();
    button.dataset.formalSchedulePending = 'true';
    const delay = button.id === 'confirmSchedule' ? 1500 : button.id === 'caseConfirmSchedule' ? 760 : 360;
    setTimeout(() => {
      delete button.dataset.formalSchedulePending;
      showFormalSchedule(lessons);
    }, delay);
  }, true);
})();

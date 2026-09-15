(() => {
  'use strict';
  const step2 = document.getElementById('step2');
  const step4 = document.getElementById('step4');
  const step5 = document.getElementById('step5');
  if (!step2 || !step4 || !step5) return;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const weekdays = ['周日','周一','周二','周三','周四','周五','周六'];
  const courseData = [
    {id:'listening',name:'听力',title:'雅思 · 听力',hours:40,duration:2,mode:'线上',teacher:'李若宁（VA02108）',history:true,avatar:'李',requirements:[],alternatives:['林清（VA01872）','周言（VA02631）']},
    {id:'speaking',name:'口语',title:'雅思 · 口语',hours:60,duration:2,mode:'线上',teacher:'王语晴（VA01625）',history:true,avatar:'王',requirements:['全英文授课'],alternatives:['陈妍（VA01916）','沈知夏（VA02501）']},
    {id:'reading',name:'阅读',title:'雅思 · 阅读',hours:30,duration:2,mode:'线上',teacher:'周明远（VA02017）',history:false,avatar:'周',requirements:[],alternatives:['许文清（VA02203）','顾承（VA02721）']},
    {id:'writing',name:'写作',title:'雅思 · 写作',hours:40,duration:2,mode:'线上',teacher:'陈知书（VA01736）',history:false,avatar:'陈',requirements:['讲解细致'],alternatives:['宋然（VA02342）','陆书言（VA02816）']}
  ];
  const state = {
    lateWeekly:'不限制',lateDaily:'2',interleave:'相邻课节不得为同一科',early:'08:30—12:30',deadlineInclusive:false,preferenceScope:'全部四科',teacherPolicy:'',
    selectedCourse:'',lessons:[],ready:false
  };
  const globalRules = [
    {id:'g-sep',start:'2026-09-01',end:'2026-09-30',status:'可排',weekly:'3',daily:'1',multiCourse:'交叉排课',priority:'口语'},
    {id:'g-pause',start:'2026-10-01',end:'2026-10-07',status:'停排',weekly:'0',daily:'0',multiCourse:'不适用',priority:'不适用'},
    {id:'g-oct',start:'2026-10-08',end:'2026-11-15',status:'可排',weekly:'5',daily:'2',multiCourse:'交叉排课',priority:'口语'},
    {id:'g-late',start:'2026-11-16',end:'2026-12-30',status:'可排',weekly:'不限制',daily:'2',multiCourse:'交叉排课',priority:'口语'}
  ];
  const crossRule = {start:'2026-09-01',end:'2026-12-30',type:'交叉排课',scope:'全部四科',pattern:'相邻课节不得为同一科',priority:'口语截止日期优先'};
  let periodSequence=0;
  const nextPeriodId=()=>`period-${++periodSequence}`;
  const standardPeriods = () => [
    {id:nextPeriodId(),start:'2026-09-01',end:'2026-09-30',frequency:'可选',count:'1',cycle:'每周',timeType:'优先',days:'周一至周五',time:'08:30—12:30'},
    {id:nextPeriodId(),start:'2026-10-08',end:'2026-11-15',frequency:'可选',count:'2',cycle:'每周',timeType:'优先',days:'周三、周四',time:'10:30—12:30'},
    {id:nextPeriodId(),start:'2026-11-16',end:'2026-12-30',frequency:'不限制',count:'',cycle:'每周',timeType:'不限制',days:'不限星期',time:'不限时段'}
  ];
  const coursePeriods = {
    listening:standardPeriods(),
    speaking:[
      {id:nextPeriodId(),start:'2026-09-01',end:'2026-09-30',frequency:'固定',count:'1',cycle:'每周',timeType:'仅限',days:'周二',time:'10:30—12:30'},
      {id:nextPeriodId(),start:'2026-10-08',end:'2026-11-15',frequency:'不限制',count:'',cycle:'每周',timeType:'优先',days:'周三、周四',time:'10:30—12:30'},
      {id:nextPeriodId(),start:'2026-11-16',end:'2026-11-30',frequency:'不限制',count:'',cycle:'每周',timeType:'不限制',days:'不限星期',time:'不限时段'}
    ],
    reading:standardPeriods(),
    writing:standardPeriods()
  };
  courseData.forEach(course=>coursePeriods[course.id].forEach(period=>{
    period.status='可排';
  }));

  const panel = document.createElement('div');
  panel.className = 'case-panel-mask';
  panel.innerHTML = '<section class="case-panel" role="dialog" aria-modal="true" aria-labelledby="casePanelTitle"><header class="case-panel-head"><div><small id="casePanelMeta"></small><strong id="casePanelTitle"></strong></div><button class="case-panel-close" type="button" aria-label="关闭">×</button></header><div class="case-panel-body" id="casePanelBody"></div><footer class="case-panel-footer" id="casePanelFooter"></footer></section>';
  document.body.append(panel);
  const closePanel = () => panel.classList.remove('show');
  panel.querySelector('.case-panel-close').addEventListener('click', closePanel);
  panel.addEventListener('click', event => { if (event.target === panel) closePanel(); });
  const showPanel = (title, meta, body, footer) => {
    document.getElementById('casePanelTitle').textContent = title;
    document.getElementById('casePanelMeta').textContent = meta;
    document.getElementById('casePanelBody').innerHTML = body;
    document.getElementById('casePanelFooter').innerHTML = footer;
    panel.classList.add('show');
  };
  const closeButton = '<button type="button" data-case-close>取消</button>';
  const primary = (action,label) => `<button type="button" class="primary" data-case-action="${action}">${label}</button>`;
  const notify = message => {
    const toast = document.getElementById('successToast');
    if (!toast) return;
    toast.textContent = message; toast.classList.add('show');
    clearTimeout(notify.timer); notify.timer = setTimeout(() => toast.classList.remove('show'), 2400);
  };
  const setNamedField = (scope,label,value) => {
    const target=[...scope.querySelectorAll('.field')].find(field=>field.querySelector('label')?.textContent.trim()===label);
    const valueNode=target?.querySelector('strong');if(valueNode)valueNode.textContent=value;
  };
  const setDetailLine = (scope,label,value) => {
    const target=[...scope.querySelectorAll('.detail-lines .line')].find(line=>line.textContent.replace(/\s+/g,' ').trim().startsWith(label));
    const valueNode=target?.querySelector('strong');if(valueNode)valueNode.textContent=value;
  };
  function hydrateBaseScenario(){
    document.title='教务智慧排课 V6 · 雅思四科场景补充版';
    const detail=document.getElementById('detailPage');
    if(detail){
      setNamedField(detail,'班级名称','雅思听说读写组合排课-1v1');
      setNamedField(detail,'班级编号','IELTS-20260901-001');
      setNamedField(detail,'学生姓名','雅思组合排课测试学生');
      const body=detail.querySelector('.table-wrap table tbody');
      const rows=[
        ['IELTS','1v1','听力','雅思','综合','线上','—','40','林老师','—','已沟通','6.0','7.5','—'],
        ['IELTS','1v1','口语','雅思','综合','线上','—','60','陈老师','—','已沟通','6.0','7.5','—'],
        ['IELTS','1v1','阅读','雅思','综合','线上','—','30','—','—','已沟通','6.0','7.5','—'],
        ['IELTS','1v1','写作','雅思','综合','线上','—','40','—','—','已沟通','6.0','7.5','—']
      ];
      if(body)body.innerHTML=rows.map(row=>'<tr>'+row.map((cell,index)=>index===13?`<td><a class="link">${cell}</a></td>`:`<td>${cell}</td>`).join('')+'</tr>').join('');
      setDetailLine(detail,'开课日期','2026-09-01　结课日期：2026-12-30');
      setDetailLine(detail,'排课类型','新增排课');
      setDetailLine(detail,'时间要求','复杂组合排课');
      setDetailLine(detail,'学习进度','雅思听说读写同步提升');
      setDetailLine(detail,'考试日期','待确认');
      setDetailLine(detail,'教师风格','无特殊要求');
      setDetailLine(detail,'排课要求','9月每周最多3节、每天最多1节；每周固定1节口语且仅限周二10:30—12:30；10月1日—7日停排；10月8日—11月15日每周最多5节、每天最多2节，优先周三、周四10:30—12:30；四科交叉排课；口语12月1日前完成。');
    }
    const raw=document.getElementById('rawScheduleRequirement');
    if(raw)raw.textContent='上课日期为2026.09.01—2026.12.30。听力40课时、口语60课时、阅读30课时、写作40课时。2026.09.01—09.30每周最多3节、每天最多1节，每周必须排1节口语，口语仅限周二10:30—12:30，其他课程优先早课；2026.10.01—10.07停排；2026.10.08—11.15每周最多5节、每天最多2节，优先周三、周四10:30—12:30；四科必须交叉排课；口语在12月1日前必须完成。';
    const subjectList=document.querySelector('#step1 .subject-list.course-grid');
    if(subjectList)subjectList.innerHTML=courseData.map(course=>`<article class="subject"><div class="course-header"><div class="course-name-line"><strong>雅思-${esc(course.name)}-线上</strong><span class="course-meta-tag">${course.hours}课时</span><span class="course-meta-tag">1v1</span></div></div>${course.requirements.length?`<div class="teacher-row"><span class="teacher-label">老师要求</span><span class="teacher-tag">${course.requirements.map(esc).join('、')}</span></div>`:''}</article>`).join('');
    const comboOptions=document.getElementById('comboCourseOptions');
    if(comboOptions)comboOptions.innerHTML=courseData.map(course=>`<label class="check-item"><input type="checkbox" checked> ${esc(course.name)}</label>`).join('');
  }
  const missingCategories = () => [];
  const hasInvalidDuration = () => courseData.some(course => !course.duration || course.hours / course.duration !== Math.floor(course.hours / course.duration));
  const complete = () => !hasInvalidDuration() && globalRules.length>0 && courseData.every(course=>coursePeriods[course.id]?.length);
  const displayDate = value => value.replaceAll('-','.');
  const frequencyText = period => {
    if(period.frequency==='不限制')return '不限制';
    const map={固定:'固定',至少:'至少',最多:'最多',可选:'可排'};
    return `${period.cycle}${map[period.frequency]||period.frequency}${period.count}节`;
  };
  const timeText = period => period.timeType==='不限制'?'不限制':`${period.timeType} ${period.days} ${period.time}`;
  const periodSummary = period => `${displayDate(period.start)}—${displayDate(period.end)}：${period.status}，${period.status==='停排'?'其余字段不适用':`${frequencyText(period)}，${timeText(period)}`}`;
  const globalRuleText = item => item.status==='停排'?'停排':`周上限${item.weekly==='不限制'?'不限制':`最多${item.weekly}节`}、日上限最多${item.daily}节、${item.multiCourse}、${item.priority}`;
  const rule = (name,date,value,options={}) => `<div class="case-rule${options.pending?' pending':''}"><div class="case-rule-name">${name}</div><div class="case-rule-date">${date}</div><div class="case-rule-value">${value}${options.note?`<small>${options.note}</small>`:''}${options.pending?`<span class="case-pending">${options.pending}</span>`:''}</div>${options.action?`<button class="case-link" type="button" data-case-action="${options.action}"${options.id?` data-course="${options.id}"`:''}${options.ruleId?` data-rule="${options.ruleId}"`:''}>修改</button>`:'<span></span>'}</div>`;

  function courseRules(course) {
    if (course.id === 'speaking') return [
      rule('上课频次','2026.09.01—2026.09.30','<strong>每自然周固定 1 节</strong>'),
      rule('时段要求','2026.09.01—2026.09.30','<strong>仅限周二 10:30—12:30</strong>',''),
      state.preferenceScope==='仅口语'?rule('时段偏好','2026.10.08—2026.11.15','<strong>优先周三、周四 10:30—12:30</strong>'):'',
      rule('完成期限','整个口语任务',`<strong>2026.12.01 前必须完成</strong>${state.deadlineInclusive===null?'':`<small>${state.deadlineInclusive?'包含12月1日':'最晚上课日期为11月30日'}</small>`}`,{pending:state.deadlineInclusive===null?'是否包含12月1日待补充':'',action:'edit-course',id:course.id})
    ].join('');
    return rule('课程安排','2026.09.01—2026.12.30','<span class="case-inherit">按整体安排完成任务课时</span>',{note:'适用全局容量及四科交叉要求'});
  }
  function renderRequirementsLegacy() {
    state.ready = complete();
    const missing = missingCategories();
    step2.querySelector('.drawer-step-tag').textContent = 'AI理解的排课要求 · 场景补充版';
    step2.querySelector('.drawer-body').innerHTML = `<main class="case-page">
      <div class="case-order"><strong>雅思听说读写组合排课单</strong><i></i><span>4门课程</span><span>共170h</span><span>2026.09.01—2026.12.30</span><em class="case-demo">基于V6 · 复杂场景演示数据</em></div>
      ${missing.length?`<div class="case-alert"><span class="material-symbols-outlined">error_outline</span><div><strong>${missing.length}类信息需要补充</strong><p>缺失内容不会被自动解释为“不限制”，补齐后再匹配老师。</p></div><button class="case-link" type="button" data-case-action="supplement">补充示例信息</button></div>`:`<div class="case-alert case-ready"><span class="material-symbols-outlined">task_alt</span><div><strong>排课要求已补充完整</strong><p>全局、课程组和单科规则将共同参与老师匹配与整单试排。</p></div></div>`}
      <section class="case-section"><div class="case-section-head"><h2><span class="material-symbols-outlined">public</span>排课全局要求</h2><span>全部课程共享的日期和总容量</span></div><div class="case-card">
        ${rule('整体上课日期','全部课程','<strong>2026.09.01—2026.12.30</strong>')}
        ${rule('周/日容量','2026.09.01—2026.09.30','<strong>每自然周最多3节；每天最多1节</strong>')}
        ${rule('停排日期','2026.10.01—2026.10.07','<strong>全部课程停排</strong>')}
        ${rule('周/日容量','2026.10.08—2026.11.15','<strong>每自然周最多5节；每天最多2节</strong>')}
        ${state.preferenceScope==='仅口语'?'':rule('时段偏好','2026.10.08—2026.11.15','<strong>优先周三、周四 10:30—12:30</strong>',{pending:state.preferenceScope?'': '作用范围待补充',action:'edit-preference'})}
        ${rule('周/日容量','2026.11.16—2026.12.30',state.lateWeekly?`<strong>${state.lateWeekly==='不限制'?'每周不限制':`每自然周最多${state.lateWeekly}节`}；每天最多${state.lateDaily}节</strong>`:'<strong>待补充</strong>',{pending:state.lateWeekly?'':'缺少后半段全局容量',action:'edit-global'})}
        ${rule('学生可用时间','全部课程','<strong>无额外时段限制</strong>',{note:'仍按机构允许时间、学生已有日程、老师及资源空闲共同计算'})}
      </div></section>
      <section class="case-section"><div class="case-section-head"><h2><span class="material-symbols-outlined">account_tree</span>跨课程要求</h2><span>只展示课程之间的共同关系</span></div><div class="case-card">
        ${rule('课程交叉','全部四科',state.interleave?`<strong>${esc(state.interleave)}</strong>`:'<strong>四门课程必须交叉排课</strong>',{pending:state.interleave?'':'“交叉”的计算方式待补充',action:'edit-group'})}
        ${rule('时段偏好','听力、阅读、写作',state.early?`<strong>2026.09.01—09.30 优先 ${esc(state.early)}</strong>`:'<strong>2026.09.01—09.30 优先早课</strong>',{pending:state.early?'':'早课具体时间待补充',action:'edit-group'})}
        ${rule('老师连续性','每门课程',state.teacherPolicy?`<strong>${esc(state.teacherPolicy)}</strong>`:'<strong>一位老师完成该科全部课节</strong>',{pending:state.teacherPolicy?'':'需确认是否为机构默认策略',action:'edit-group'})}
      </div></section>
      <section class="case-section"><div class="case-section-head"><h2><span class="material-symbols-outlined">menu_book</span>各课程要求</h2><span>全局和课程组要求不在各科重复</span></div><div class="case-course-list">
        ${courseData.map((course,index)=>`<article class="case-course"><header class="case-course-head"><div class="case-course-title"><strong>${esc(course.title)}</strong><span class="case-fact">${course.hours}h</span><span class="case-fact ${course.duration?'':'pending-text'}">${course.duration?`每节${course.duration}h`:'每节课时长待补充'}</span><span class="case-fact mode">${course.mode}</span></div><button class="case-link" type="button" data-case-action="edit-course" data-course="${course.id}">修改</button></header>${courseRules(course)}<div class="case-teacher-line"><span>老师要求</span><div class="case-teacher-values">${course.requirements.length?course.requirements.map(item=>`<span>${esc(item)}</span>`).join(''):'<span>无特殊标签要求</span>'}<span class="${state.teacherPolicy?'':'pending-text'}">${state.teacherPolicy?'未指定老师':'连续授课规则待补充'}</span></div></div></article>`).join('')}
      </div></section>
    </main>`;
    step2.querySelector('.drawer-footer').innerHTML = `<span class="case-footer-note ${missing.length?'attention':''}">${missing.length?`${missing.length}类信息待补充`:'要求完整，可进入整单试排'}</span><button data-page="step1">补充信息并重新理解</button><button class="primary" id="caseMatchTeachers" ${state.ready?'':'disabled'}>匹配老师并预排</button>`;
    bindRequirementActions();
  }

  function renderRequirementsTwoLayerLegacy(){
    state.ready=complete();
    const totalHours=courseData.reduce((sum,course)=>sum+course.hours,0);
    step2.querySelector('.drawer-step-tag').textContent='AI理解的排课要求 · 结构化规则版';
    step2.querySelector('.drawer-body').innerHTML=`<main class="case-page">
      <div class="case-order"><strong>雅思听说读写组合排课单</strong><i></i><span>4门课程</span><span>共${totalHours}h</span><span>2026.09.01—2026.12.30</span></div>
      <section class="case-section"><div class="case-section-head"><h2><span class="material-symbols-outlined">public</span>全局要求</h2><button class="case-link" type="button" data-case-action="add-global-rule">＋ 添加日期范围</button></div><div class="case-card">
        ${globalRules.map(item=>rule(item.status==='停排'?'停排日期':'排课容量',`${displayDate(item.start)}—${displayDate(item.end)}`,item.status==='停排'?'<strong>全部课程停排</strong>':`<div class="case-structured-fields"><span><label>周排课上限</label><strong>${item.weekly==='不限制'?'不限制':`最多${item.weekly}节`}</strong></span><span><label>日排课上限</label><strong>最多${item.daily}节</strong></span></div>`,{action:'edit-global-rule',ruleId:item.id})).join('')}
        ${rule('跨课程要求',`${displayDate(crossRule.start)}—${displayDate(crossRule.end)}`,`<div class="case-structured-fields"><span><label>作用课程</label><strong>${esc(crossRule.scope)}</strong></span><span><label>排列方式</label><strong>${esc(crossRule.pattern)}</strong></span><span><label>优先规则</label><strong>${esc(crossRule.priority)}</strong></span></div>`,{action:'edit-cross-rule'})}
      </div></section>
      <section class="case-section"><div class="case-section-head"><h2><span class="material-symbols-outlined">menu_book</span>各课程要求</h2></div><div class="case-course-list">
        ${courseData.map(course=>`<article class="case-course"><header class="case-course-head"><div class="case-course-title"><strong>${esc(course.title)}</strong><span class="case-fact">总课时 ${course.hours}h</span><span class="case-fact">每节 ${course.duration}h</span><span class="case-fact mode">${course.mode}</span>${course.id==='speaking'?'<span class="case-fact">最晚 2026.11.30</span>':''}${course.requirements.length?`<span class="case-course-requirement">老师要求：${course.requirements.map(esc).join('、')}</span>`:''}</div><button class="case-link" type="button" data-case-action="edit-course" data-course="${course.id}">修改课程信息</button></header>
          ${coursePeriods[course.id].map(period=>rule('排课要求',`${displayDate(period.start)}—${displayDate(period.end)}`,`<div class="case-structured-fields"><span><label>上课频次</label><strong>${frequencyText(period)}</strong></span><span><label>时段要求</label><strong>${timeText(period)}</strong></span></div>`,{action:'edit-course-rule',id:course.id,ruleId:period.id})).join('')}
          <div class="case-course-actions"><button class="case-link" type="button" data-case-action="add-course-rule" data-course="${course.id}">＋ 添加排课要求</button></div>
        </article>`).join('')}
      </div></section>
    </main>`;
    step2.querySelector('.drawer-footer').innerHTML='<button data-page="step1">补充信息并重新理解</button><button class="primary" id="caseMatchTeachers">匹配老师并预排</button>';
    bindRequirementActions();
  }

  const segmentField=(label,value)=>`<div class="case-segment-field"><span>${label}</span><strong>${value}</strong></div>`;
  function renderRequirements(){
    state.ready=complete();
    step2.querySelector('.drawer-step-tag').textContent='AI理解的排课要求';
    step2.querySelector('.drawer-body').innerHTML=`<main class="case-page case-requirements-page">
      <section class="case-section"><div class="case-section-head"><h2><span class="material-symbols-outlined">public</span>全局要求</h2><button class="case-link" type="button" data-case-action="add-global-rule">＋ 添加全局要求</button></div><div class="case-segment-list">
        ${globalRules.map(item=>`<article class="case-segment"><header class="case-segment-head"><div><span>日期</span><strong>${displayDate(item.start)}—${displayDate(item.end)}</strong></div><button class="case-link" type="button" data-case-action="edit-global-rule" data-rule="${item.id}">修改</button></header><div class="case-segment-grid global">
          ${segmentField('排课状态',item.status)}
          ${segmentField('周排课上限',item.status==='停排'?'不适用':item.weekly==='不限制'?'不限制':`最多${item.weekly}节`)}
          ${segmentField('日排课上限',item.status==='停排'?'不适用':`最多${item.daily}节`)}
          ${segmentField('多课程排课方式',item.status==='停排'?'不适用':esc(item.multiCourse))}
          ${segmentField('优先排课科目',item.status==='停排'?'不适用':esc(item.priority))}
        </div></article>`).join('')}
      </div></section>
      <section class="case-section"><div class="case-section-head"><h2><span class="material-symbols-outlined">menu_book</span>各课程要求</h2></div><div class="case-course-list">
        ${courseData.map(course=>`<article class="case-course"><header class="case-course-head"><div class="case-course-title"><strong>${esc(course.title)}</strong><span class="case-fact">总课时 ${course.hours}h</span><span class="case-fact">每节 ${course.duration}h</span><span class="case-fact mode">${course.mode}</span>${course.id==='speaking'?'<span class="case-fact">最晚 2026.11.30</span>':''}</div><button class="case-link" type="button" data-case-action="edit-course" data-course="${course.id}">修改课程信息</button></header><div class="case-segment-list course">
          ${coursePeriods[course.id].map(period=>`<article class="case-segment compact"><header class="case-segment-head"><div><span>日期</span><strong>${displayDate(period.start)}—${displayDate(period.end)}</strong></div><button class="case-link" type="button" data-case-action="edit-course-rule" data-course="${course.id}" data-rule="${period.id}">修改</button></header><div class="case-segment-grid course">
            ${segmentField('排课状态',period.status)}
            ${segmentField('上课频次',period.status==='停排'?'不适用':frequencyText(period))}
            ${segmentField('时段要求',period.status==='停排'?'不适用':timeText(period))}
          </div></article>`).join('')}
        </div><div class="case-teacher-line case-single-teacher"><span>老师要求</span><div class="case-teacher-values"><span>${course.requirements[0]||'无特殊要求'}</span></div><button class="case-link" type="button" data-case-action="edit-teacher-requirement" data-course="${course.id}">修改</button></div><div class="case-course-actions"><button class="case-link" type="button" data-case-action="add-course-rule" data-course="${course.id}">＋ 添加排课要求</button></div></article>`).join('')}
      </div></section>
    </main>`;
    step2.querySelector('.drawer-footer').innerHTML='<button data-page="step1">补充信息并重新理解</button><button class="primary" id="caseMatchTeachers">匹配老师并预排</button>';
    bindRequirementActions();
  }

  function bindRequirementActions() {
    step2.querySelectorAll('[data-case-action]').forEach(button => button.addEventListener('click',()=>handleAction(button.dataset.caseAction,button.dataset.course,button.dataset.rule)));
    const match = document.getElementById('caseMatchTeachers');
    if (match) match.addEventListener('click', () => {
      if (!complete()) return;
      match.disabled = true; match.innerHTML = '<span class="button-spinner"></span>正在进行整单试排…';
      setTimeout(()=>{ renderTeachers(); openPageV2('step4'); match.disabled=false; match.textContent='匹配老师并预排'; },650);
    });
  }

  function handleAction(action,courseId,ruleId) {
    if(action==='edit-global-rule') return showGlobalRuleEditor(ruleId);
    if(action==='add-global-rule') return showGlobalRuleEditor();
    if(action==='edit-cross-rule') return showCrossRuleEditor();
    if(action==='edit-course-rule') return showCourseRuleEditor(courseId,ruleId);
    if(action==='add-course-rule') return showCourseRuleEditor(courseId);
    if(action==='edit-teacher-requirement') return showTeacherRequirementEditor(courseId);
    if(action==='supplement') return showSupplement();
    if(action==='edit-global') return showGlobalEditor();
    if(action==='edit-group') return showGroupEditor();
    if(action==='edit-course') return showCourseEditor(courseId);
    if(action==='edit-preference') return showPreferenceEditor();
  }
  const optionsHtml=(values,current)=>values.map(value=>`<option value="${esc(value)}" ${value===current?'selected':''}>${esc(value)}</option>`).join('');
  function showGlobalRuleEditor(ruleId){
    const current=globalRules.find(item=>item.id===ruleId);
    const item=current||{id:'',start:'2026-12-01',end:'2026-12-30',status:'可排',weekly:'不限制',daily:'1',multiCourse:'交叉排课',priority:'不设置优先科目'};
    showPanel(current?'修改全局要求':'添加全局要求','日期分段',`<div class="case-form-grid"><label class="case-form-field"><span>开始日期</span><input id="caseGlobalStart" type="date" value="${item.start}"></label><label class="case-form-field"><span>结束日期</span><input id="caseGlobalEnd" type="date" value="${item.end}"></label></div><label class="case-form-field"><span>排课状态</span><select id="caseGlobalStatus">${optionsHtml(['可排','停排'],item.status)}</select></label><div class="case-form-grid"><label class="case-form-field"><span>周排课上限</span><select id="caseGlobalWeekly">${optionsHtml(['不限制','1','2','3','4','5','6','7','8'],item.weekly==='0'?'不限制':item.weekly)}</select></label><label class="case-form-field"><span>日排课上限</span><select id="caseGlobalDaily">${optionsHtml(['1','2','3','4'],item.daily==='0'?'1':item.daily)}</select></label></div><label class="case-form-field"><span>多课程排课方式</span><select id="caseGlobalMulti">${optionsHtml(['交叉排课','优先排课','均衡排课','顺序轮换','不限制','不适用'],item.multiCourse)}</select></label><label class="case-form-field"><span>优先排课科目</span><select id="caseGlobalPriority">${optionsHtml(['听力','口语','阅读','写作','多科目','不设置优先科目','不适用'],item.priority)}</select></label>`,`<button type="button" data-case-close>取消</button>${current&&globalRules.length>1?`<button type="button" class="case-danger" data-case-action="delete-global-rule" data-rule="${item.id}">删除规则</button>`:''}<button type="button" class="primary" data-case-action="save-global-rule" data-rule="${item.id}">保存</button>`);
    const statusSelect=document.getElementById('caseGlobalStatus');
    const syncStatus=()=>['caseGlobalWeekly','caseGlobalDaily','caseGlobalMulti','caseGlobalPriority'].forEach(id=>{const control=document.getElementById(id);control.disabled=statusSelect.value==='停排';control.closest('.case-form-field')?.classList.toggle('disabled-field',control.disabled);});
    statusSelect.addEventListener('change',syncStatus);syncStatus();
  }
  function showCrossRuleEditor(){
    showPanel('修改跨课程要求','全局要求',`<div class="case-form-grid"><label class="case-form-field"><span>开始日期</span><input id="caseCrossStart" type="date" value="${crossRule.start}"></label><label class="case-form-field"><span>结束日期</span><input id="caseCrossEnd" type="date" value="${crossRule.end}"></label></div><label class="case-form-field"><span>作用课程</span><select id="caseCrossScope">${optionsHtml(['全部四科','听力、口语、阅读、写作','口语与其他课程'],crossRule.scope)}</select></label><label class="case-form-field"><span>排列方式</span><select id="caseCrossPattern">${optionsHtml(['相邻课节不得为同一科','每轮覆盖四科，轮内顺序可调整','听力→口语→阅读→写作严格轮换','不限制'],crossRule.pattern)}</select></label><label class="case-form-field"><span>优先规则</span><select id="caseCrossPriority">${optionsHtml(['口语截止日期优先','剩余课时多的课程优先','四科均匀分布','不设置优先级'],crossRule.priority)}</select></label>`,`<button type="button" data-case-close>取消</button><button type="button" class="primary" data-case-action="save-cross-rule">保存</button>`);
  }
  function showCourseRuleEditor(courseId,ruleId){
    const periods=coursePeriods[courseId],current=periods.find(item=>item.id===ruleId);
    const item=current||{id:'',start:'2026-12-01',end:'2026-12-30',status:'可排',frequency:'不限制',count:'1',cycle:'每周',timeType:'不限制',days:'不限星期',time:'不限时段'};
    const course=courseData.find(item=>item.id===courseId);
    showPanel(current?`修改${course.name}排课要求`:`添加${course.name}排课要求`,course.title,`<div class="case-form-grid"><label class="case-form-field"><span>开始日期</span><input id="casePeriodStart" type="date" value="${item.start}"></label><label class="case-form-field"><span>结束日期</span><input id="casePeriodEnd" type="date" value="${item.end}"></label></div><label class="case-form-field"><span>排课状态</span><select id="casePeriodStatus">${optionsHtml(['可排','停排'],item.status)}</select></label><div class="case-form-grid case-form-grid-three"><label class="case-form-field"><span>频次规则</span><select id="caseFrequency">${optionsHtml(['固定','至少','最多','可选','不限制'],item.frequency)}</select></label><label class="case-form-field"><span>统计周期</span><select id="caseCycle">${optionsHtml(['每周','每两周','阶段总量'],item.cycle)}</select></label><label class="case-form-field"><span>课节数</span><select id="caseCount">${optionsHtml(['1','2','3','4','5','6','7','8'],item.count||'1')}</select></label></div><div class="case-form-grid case-form-grid-three"><label class="case-form-field"><span>时段规则</span><select id="caseTimeType">${optionsHtml(['不限制','优先','仅限'],item.timeType)}</select></label><label class="case-form-field"><span>星期</span><select id="caseDays">${optionsHtml(['不限星期','周一至周五','周二','周三、周四','周一、周三、周五','周六、周日'],item.days)}</select></label><label class="case-form-field"><span>时段</span><select id="caseTime">${optionsHtml(['不限时段','08:30—10:30','10:30—12:30','08:30—12:30','14:00—16:00','18:30—20:30','19:00—21:00'],item.time)}</select></label></div>`,`<button type="button" data-case-close>取消</button>${current&&periods.length>1?`<button type="button" class="case-danger" data-case-action="delete-course-rule" data-course="${courseId}" data-rule="${item.id}">删除规则</button>`:''}<button type="button" class="primary" data-case-action="save-course-rule" data-course="${courseId}" data-rule="${item.id}">保存</button>`);
    const statusSelect=document.getElementById('casePeriodStatus'),frequencySelect=document.getElementById('caseFrequency'),timeSelect=document.getElementById('caseTimeType');
    const syncCourseFields=()=>{const stopped=statusSelect.value==='停排';['caseFrequency','caseCycle','caseCount','caseTimeType','caseDays','caseTime'].forEach(id=>{const control=document.getElementById(id);const disabled=stopped||(id==='caseCycle'||id==='caseCount')&&frequencySelect.value==='不限制'||(id==='caseDays'||id==='caseTime')&&timeSelect.value==='不限制';control.disabled=disabled;control.closest('.case-form-field')?.classList.toggle('disabled-field',disabled);});};
    statusSelect.addEventListener('change',syncCourseFields);frequencySelect.addEventListener('change',syncCourseFields);timeSelect.addEventListener('change',syncCourseFields);syncCourseFields();
  }
  function showTeacherRequirementEditor(courseId){
    const course=courseData.find(item=>item.id===courseId);if(!course)return;
    showPanel(`修改${course.name}老师要求`,course.title,`<label class="case-form-field"><span>老师要求</span><select id="caseSingleTeacherRequirement">${optionsHtml(['无特殊要求','全英文授课','讲解细致','女老师','性格温柔'],course.requirements[0]||'无特殊要求')}</select></label>`,`<button type="button" data-case-close>取消</button><button type="button" class="primary" data-case-action="save-teacher-requirement" data-course="${course.id}">保存</button>`);
  }
  function showSupplement(){
    showPanel('补充信息并重新理解','本场景的7类缺失信息',`<div class="case-form-note">以下内容是为了演示完整流程设置的补充信息，保存后生成新的要求状态，不代表从原文自动推断。</div><div class="case-supplement-list">
      <div class="case-supplement-item pending"><span>课长</span><strong>四科均为每节2小时</strong></div><div class="case-supplement-item pending"><span>后半段容量</span><strong>11.16—12.30每周不限制，每天最多2节</strong></div><div class="case-supplement-item pending"><span>交叉方式</span><strong>相邻课节不得为同一科；口语截止日期优先</strong></div><div class="case-supplement-item pending"><span>早课</span><strong>08:30—12:30</strong></div><div class="case-supplement-item pending"><span>截止日期</span><strong>12月1日前不包含当天，最晚上课日期11月30日</strong></div><div class="case-supplement-item pending"><span>阶段偏好</span><strong>10.08—11.15作用于全部四科</strong></div><div class="case-supplement-item pending"><span>老师连续性</span><strong>每科分别由一位老师完成全部课节</strong></div></div>`,`${closeButton}${primary('apply-supplement','采用以上演示补充')}`);
  }
  function showGlobalEditor(){showPanel('修改后半段全局容量','排课全局要求',`<label class="case-form-field"><span>生效日期</span><input value="2026.11.16—2026.12.30" disabled></label><label class="case-form-field"><span>每自然周总上限</span><select id="caseLateWeekly"><option value="">待补充</option><option value="不限制" ${state.lateWeekly==='不限制'?'selected':''}>不限制</option><option value="5" ${state.lateWeekly==='5'?'selected':''}>最多5节</option><option value="6" ${state.lateWeekly==='6'?'selected':''}>最多6节</option></select></label><label class="case-form-field"><span>每天总上限</span><select id="caseLateDaily"><option value="">待补充</option><option value="1">最多1节</option><option value="2" ${state.lateDaily==='2'?'selected':''}>最多2节</option><option value="3">最多3节</option></select></label><div class="case-form-note">该上限由四科共享，不会复制到每门课程。</div>`,`${closeButton}${primary('save-global','保存全局要求')}`)}
  function showGroupEditor(){showPanel('修改跨课程要求','课程组规则',`<label class="case-form-field"><span>四科交叉方式</span><select id="caseInterleave"><option value="">待补充</option><option ${state.interleave==='相邻课节不得为同一科；口语截止日期优先'?'selected':''}>相邻课节不得为同一科；口语截止日期优先</option><option>听力→口语→阅读→写作严格轮换</option><option>每轮覆盖四科，轮内顺序可调整</option></select></label><label class="case-form-field"><span>“早课”具体时间</span><div class="case-form-row"><input id="caseEarlyStart" type="time" value="${state.early?.split('—')[0]||'08:30'}"><span>至</span><input id="caseEarlyEnd" type="time" value="${state.early?.split('—')[1]||'12:30'}"></div></label><label class="case-form-field"><span>老师连续性</span><select id="caseTeacherPolicy"><option value="">待补充</option><option ${state.teacherPolicy?'selected':''}>每科分别由一位老师完成全部课节</option><option>允许同一课程由多位老师授课</option></select></label>`,`${closeButton}${primary('save-group','保存跨课程要求')}`)}
  function showPreferenceEditor(){showPanel('修改阶段时段偏好','排课全局要求',`<label class="case-form-field"><span>优先时段</span><input value="周三、周四 10:30—12:30" disabled></label><label class="case-form-field"><span>作用课程</span><select id="casePreferenceScope"><option value="">待补充</option><option value="全部四科" ${state.preferenceScope==='全部四科'?'selected':''}>全部四科</option><option value="仅口语">仅口语</option></select></label><div class="case-form-note">如果只适用于口语，保存后该要求会从全局区域移到口语课程下。</div>`,`${closeButton}${primary('save-preference','保存时段偏好')}`)}
  function showCourseEditor(courseId){const course=courseData.find(item=>item.id===courseId);if(!course)return;showPanel(`修改${course.name}课程信息`,course.title,`<label class="case-form-field"><span>总课时</span><select id="caseTotalHours">${optionsHtml(['20','30','40','50','60','70','80'],String(course.hours))}</select></label><label class="case-form-field"><span>每节课时长</span><select id="caseDuration">${optionsHtml(['0.25','0.5','0.75','1','1.5','2','2.5','3','4'],String(course.duration))}</select></label>${course.id==='speaking'?`<label class="case-form-field"><span>最晚完成日期</span><input id="caseDeadlineDate" type="date" value="2026-11-30"></label>`:''}`,`${closeButton}<button type="button" class="primary" data-case-action="save-course" data-course="${course.id}">保存课程信息</button>`)}

  panel.addEventListener('click', event => {
    if(event.target.closest('[data-case-close]')) return closePanel();
    const button=event.target.closest('[data-case-action]');if(!button)return;
    const action=button.dataset.caseAction;
    if(action==='save-global-rule'){
      const start=document.getElementById('caseGlobalStart').value,end=document.getElementById('caseGlobalEnd').value;
      if(!start||!end||start>end){notify('请选择有效的日期范围');return;}
      if(globalRules.some(item=>item.id!==button.dataset.rule&&start<=item.end&&end>=item.start)){notify('该日期范围与已有全局要求重叠');return;}
      const status=document.getElementById('caseGlobalStatus').value;
      const values={start,end,status,weekly:status==='停排'?'0':document.getElementById('caseGlobalWeekly').value,daily:status==='停排'?'0':document.getElementById('caseGlobalDaily').value,multiCourse:status==='停排'?'不适用':document.getElementById('caseGlobalMulti').value,priority:status==='停排'?'不适用':document.getElementById('caseGlobalPriority').value};
      const current=globalRules.find(item=>item.id===button.dataset.rule);
      if(current)Object.assign(current,values);else globalRules.push({id:`global-${Date.now()}`,...values});
      globalRules.sort((a,b)=>a.start.localeCompare(b.start));closePanel();renderRequirements();notify('全局日期规则已保存');return;
    }
    if(action==='delete-global-rule'){
      if(globalRules.length<=1){notify('至少保留一条全局规则');return;}
      const index=globalRules.findIndex(item=>item.id===button.dataset.rule);if(index>=0)globalRules.splice(index,1);
      closePanel();renderRequirements();notify('全局日期规则已删除');return;
    }
    if(action==='save-cross-rule'){
      const start=document.getElementById('caseCrossStart').value,end=document.getElementById('caseCrossEnd').value;
      if(!start||!end||start>end){notify('请选择有效的日期范围');return;}
      Object.assign(crossRule,{start,end,scope:document.getElementById('caseCrossScope').value,pattern:document.getElementById('caseCrossPattern').value,priority:document.getElementById('caseCrossPriority').value});
      state.interleave=crossRule.pattern;closePanel();renderRequirements();notify('跨课程要求已保存');return;
    }
    if(action==='save-course-rule'){
      const courseId=button.dataset.course,periods=coursePeriods[courseId];
      const start=document.getElementById('casePeriodStart').value,end=document.getElementById('casePeriodEnd').value;
      if(!start||!end||start>end){notify('请选择有效的日期范围');return;}
      if(periods.some(item=>item.id!==button.dataset.rule&&start<=item.end&&end>=item.start)){notify('该日期范围与本课程已有要求重叠');return;}
      const status=document.getElementById('casePeriodStatus').value,frequency=document.getElementById('caseFrequency').value,timeType=document.getElementById('caseTimeType').value;
      const values={start,end,status,frequency:status==='停排'?'不限制':frequency,count:status==='停排'||frequency==='不限制'?'':document.getElementById('caseCount').value,cycle:document.getElementById('caseCycle').value,timeType:status==='停排'?'不限制':timeType,days:status==='停排'||timeType==='不限制'?'不限星期':document.getElementById('caseDays').value,time:status==='停排'||timeType==='不限制'?'不限时段':document.getElementById('caseTime').value};
      const current=periods.find(item=>item.id===button.dataset.rule);
      if(current)Object.assign(current,values);else periods.push({id:nextPeriodId(),...values});
      periods.sort((a,b)=>a.start.localeCompare(b.start));closePanel();renderRequirements();notify('课程排课要求已保存');return;
    }
    if(action==='delete-course-rule'){
      const periods=coursePeriods[button.dataset.course];if(periods.length<=1){notify('每门课程至少保留一条排课要求');return;}
      const index=periods.findIndex(item=>item.id===button.dataset.rule);if(index>=0)periods.splice(index,1);
      closePanel();renderRequirements();notify('课程排课要求已删除');return;
    }
    if(action==='save-teacher-requirement'){
      const course=courseData.find(item=>item.id===button.dataset.course),value=document.getElementById('caseSingleTeacherRequirement').value;
      course.requirements=value==='无特殊要求'?[]:[value];closePanel();renderRequirements();notify(`${course.name}老师要求已更新`);return;
    }
    if(action==='apply-supplement'){
      courseData.forEach(course=>course.duration=2);Object.assign(state,{lateWeekly:'不限制',lateDaily:'2',interleave:'相邻课节不得为同一科；口语截止日期优先',early:'08:30—12:30',deadlineInclusive:false,preferenceScope:'全部四科',teacherPolicy:'每科分别由一位老师完成全部课节'});closePanel();renderRequirements();notify('演示补充信息已转为结构化要求');
    }
    if(action==='save-global'){state.lateWeekly=document.getElementById('caseLateWeekly').value||null;state.lateDaily=document.getElementById('caseLateDaily').value||null;closePanel();renderRequirements();notify('全局容量已更新');}
    if(action==='save-group'){state.interleave=document.getElementById('caseInterleave').value||null;const start=document.getElementById('caseEarlyStart').value,end=document.getElementById('caseEarlyEnd').value;state.early=start&&end?`${start}—${end}`:null;state.teacherPolicy=document.getElementById('caseTeacherPolicy').value||null;closePanel();renderRequirements();notify('跨课程要求已更新');}
    if(action==='save-preference'){state.preferenceScope=document.getElementById('casePreferenceScope').value||null;closePanel();renderRequirements();notify('阶段偏好范围已更新');}
    if(action==='save-course'){const course=courseData.find(item=>item.id===button.dataset.course);const hours=Number(document.getElementById('caseTotalHours').value),duration=Number(document.getElementById('caseDuration').value);if(!duration||hours/duration!==Math.floor(hours/duration)){notify('总课时必须能拆成完整课节');return;}course.hours=hours;course.duration=duration;if(course.id==='speaking'){const deadline=document.getElementById('caseDeadlineDate').value;const last=coursePeriods.speaking.at(-1);if(deadline&&last)last.end=deadline;}closePanel();renderRequirements();notify(`${course.name}课程信息已更新`);return;}
  });

  const teacherCoverage = course => `${Math.round(course.hours/course.duration)}/${Math.round(course.hours/course.duration)}节`;
  function renderTeachers(){
    step4.querySelector('.drawer-step-tag').textContent='确认授课老师 · 场景补充版';
    step4.querySelector('.drawer-body').innerHTML=`<main class="case-page case-teacher-page"><section class="case-teacher-list">${courseData.map(course=>`<article class="case-teacher-card" data-teacher-course="${course.id}"><header class="case-teacher-head"><div><strong>${esc(course.title)}</strong><span class="case-fact">${course.hours}h · ${Math.round(course.hours/course.duration)}节</span><span class="case-fact mode">${course.mode}</span></div><button class="case-link" data-case-teacher="${course.id}" type="button">更换老师</button></header><div class="case-teacher-body"><div class="case-person"><span class="case-avatar">${course.avatar}</span><div><b data-case-name>${esc(course.teacher)}${course.history?'<span class="case-history">历史授课老师</span>':''}</b><small>已按当前课程要求完成整单试排</small></div></div><div class="case-metrics"><span class="case-metric">可排<b>${teacherCoverage(course)}</b></span>${course.id==='speaking'?'<span class="case-metric">9月固定时段<b>5/5节</b></span><span class="case-metric">截止日前<b>30/30节</b></span>':'<span class="case-metric">整体课时<b>全部覆盖</b></span>'}</div><button type="button" class="case-link" data-case-teacher="${course.id}">添加老师</button></div><div class="case-time-line"><span>相关要求</span><span></span></div><div class="case-recompute"><span class="case-spin"></span><span>老师已变更，正在重新验证整张课表…</span></div></article>`).join('')}</section></main>`;
    const basisCards=step4.querySelectorAll('.case-basis-card');
    if(basisCards[0])basisCards[0].innerHTML=`<h3>当前全局容量</h3>${globalRules.map(item=>`<p><strong>${displayDate(item.start)}—${displayDate(item.end)}</strong> ${globalRuleText(item)}</p>`).join('')}`;
    if(basisCards[1])basisCards[1].innerHTML=`<h3>重点课程要求</h3><p><strong>口语在2026.11.30前完成</strong></p><p>${coursePeriods.speaking.map(periodSummary).join('；')}</p>`;
    step4.querySelectorAll('[data-teacher-course]').forEach(card=>{const courseId=card.dataset.teacherCourse,course=courseData.find(item=>item.id===courseId);const line=card.querySelector('.case-time-line span:last-child');if(line)line.textContent=`${coursePeriods[courseId].map(periodSummary).join('；')}；老师要求：${course.requirements[0]||'无特殊要求'}`;const small=card.querySelector('.case-person small');if(small)small.textContent='已按当前课程要求完成整单试排';});
    step4.querySelector('.drawer-footer').innerHTML='<button data-page="step2">返回排课要求</button><button class="primary" id="casePreviewSchedule">预览课表</button>';
    step4.querySelectorAll('[data-case-teacher]').forEach(button=>button.addEventListener('click',()=>showTeacherPicker(button.dataset.caseTeacher)));
    document.getElementById('casePreviewSchedule').addEventListener('click',()=>{const button=document.getElementById('casePreviewSchedule');button.disabled=true;button.innerHTML='<span class="button-spinner"></span>正在生成预排课表…';setTimeout(()=>{state.lessons=generateLessons();renderPreview();openPageV2('step5');button.disabled=false;button.textContent='预览课表';},600)});
  }
  function showTeacherPicker(courseId){const course=courseData.find(item=>item.id===courseId);const candidates=[course.teacher,...course.alternatives];showPanel(`更换${course.name}老师`,course.title,`<div class="case-form-note">候选结果已按当前全局容量、课程频次和时段要求进行整单试排。</div><div style="margin-top:16px">${candidates.map((name,index)=>`<div class="case-candidate ${name===course.teacher?'selected':''}"><span class="case-avatar">${name[0]}</span><div class="case-candidate-main"><strong>${esc(name)}</strong>${index===0&&course.history?'<span class="case-history">历史授课老师</span>':''}<p>可排 ${teacherCoverage(course)}；满足当前课程要求</p></div><button type="button" class="${name===course.teacher?'primary':''}" data-choose-teacher="${esc(name)}">${name===course.teacher?'已选择':'选择'}</button></div>`).join('')}</div>`,closeButton);
    panel.querySelectorAll('[data-choose-teacher]').forEach(button=>button.addEventListener('click',()=>{course.teacher=button.dataset.chooseTeacher;course.avatar=course.teacher[0];course.history=course.teacher===candidates[0]&&course.history;closePanel();renderTeachers();const card=step4.querySelector(`[data-teacher-course="${course.id}"]`),strip=card.querySelector('.case-recompute');strip.classList.add('show');setTimeout(()=>{strip.innerHTML='<span class="material-symbols-outlined" style="color:#1b9858">check_circle</span><span>整单重新验证完成，课程仍可全部覆盖。</span>';setTimeout(()=>strip.classList.remove('show'),1600)},650)}));
  }

  function dateRange(start,end){const values=[];for(let date=new Date(start+'T00:00:00Z'),finish=new Date(end+'T00:00:00Z');date<=finish;date.setUTCDate(date.getUTCDate()+1))values.push(new Date(date));return values;}
  const iso=date=>date.toISOString().slice(0,10);
  function generateLessons(){
    const remaining=Object.fromEntries(courseData.map(course=>[course.id,Math.round(course.hours/course.duration)]));
    const result=[];let otherCursor=0,last='';const others=['listening','reading','writing'];
    const takeOther=()=>{for(let tries=0;tries<others.length;tries++){const id=others[otherCursor++%others.length];if(remaining[id]>0&&id!==last)return id;}return others.find(id=>remaining[id]>0)||null};
    const addLesson=(date,time,forceSpeaking=false,preferSpeaking=false)=>{
      let id=null;if(forceSpeaking&&remaining.speaking>0)id='speaking';else if(preferSpeaking&&remaining.speaking>0&&last!=='speaking')id='speaking';else id=takeOther();if(!id&&remaining.speaking>0)id='speaking';if(!id)return;
      const course=courseData.find(item=>item.id===id);remaining[id]--;last=id;result.push({date:typeof date==='string'?date:iso(date),time,courseId:id,hours:course.duration,preferred:(date instanceof Date&&[3,4].includes(date.getUTCDay())&&time==='10:30—12:30')||(date instanceof Date&&date<'2026-10-01'&&id!=='speaking'&&time<'12:31')});
    };
    // 9月：每周二固定口语，周三和周五安排其他课程；每周3节、每天1节。
    for(const d of dateRange('2026-09-01','2026-09-30')){if(d.getUTCDay()===2)addLesson(d,'10:30—12:30',true);if(d.getUTCDay()===3)addLesson(d,'08:30—10:30');if(d.getUTCDay()===5)addLesson(d,'10:30—12:30');}
    // 10.08—11.15：每周最多5节，优先周三/周四10:30；口语期限优先且保持交叉。
    const weekCount={};for(const d of dateRange('2026-10-08','2026-11-15')){const monday=new Date(d);const delta=(d.getUTCDay()+6)%7;monday.setUTCDate(d.getUTCDate()-delta);const key=iso(monday);weekCount[key]=weekCount[key]||0;const slots=d.getUTCDay()===3?['10:30—12:30','14:00—16:00']:d.getUTCDay()===4?['10:30—12:30']:d.getUTCDay()===1||d.getUTCDay()===6?['09:00—11:00']:[];for(const time of slots){if(weekCount[key]>=5)break;addLesson(d,time,false,result.length%2===1);weekCount[key]++;}}
    // 11.16—11.30：每日最多2节，无周上限，优先完成口语并保持相邻课节不同科。
    for(const d of dateRange('2026-11-16','2026-11-30'))for(const time of ['10:30—12:30','14:00—16:00']){if(remaining.speaking>0)addLesson(d,time,false,last!=='speaking');else addLesson(d,time);}
    // 12月继续完成其他课程，每天最多2节。
    for(const d of dateRange('2026-12-01','2026-12-30'))for(const time of ['09:00—11:00','14:00—16:00'])if(Object.values(remaining).some(Boolean))addLesson(d,time);
    result.sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
    result.unmet=Object.assign({},remaining);
    return result;
  }
  function renderPreview(){
    step5.querySelector('.drawer-step-tag').textContent='确认预排课表 · 场景补充版';
    const totalHours=state.lessons.reduce((sum,item)=>sum+item.hours,0),lastSpeaking=state.lessons.filter(item=>item.courseId==='speaking').at(-1)?.date;
    const missingLessons=Object.values(state.lessons.unmet||{}).reduce((sum,value)=>sum+value,0);
    const expectedHours=courseData.reduce((sum,course)=>sum+course.hours,0);
    step5.querySelector('.drawer-body').innerHTML=`<section class="draft-version-panel"><div class="draft-version-head"><div class="draft-version-title"><strong>雅思四科整体预排结果</strong><span>基于当前结构化要求 · 未保存</span></div><button id="caseSaveVersion"><span class="material-symbols-outlined">save</span>保存为排课版本</button></div></section><div class="draft-summary"><div class="draft-metric"><span>已排课时</span><strong>${totalHours}/${expectedHours} 小时</strong></div><div class="draft-metric"><span>生成课节</span><strong>${state.lessons.length} 节</strong></div><div class="draft-metric"><span>口语完成日期</span><strong>${lastSpeaking}</strong></div><div class="draft-metric"><span>排课冲突校验</span><strong style="color:var(--green)">全部通过</strong></div></div><section class="policy-card preview-list-card"><div class="case-preview-toolbar"><div><h3>预排课节明细</h3><p>按全局容量、课程频次、时段要求和多课程规则生成</p></div><select class="case-preview-filter" id="casePreviewFilter"><option value="">全部课程</option>${courseData.map(course=>`<option value="${course.id}">${course.name}</option>`).join('')}</select></div><div class="preview-list-scroll"><div class="preview-lesson-list" id="caseScheduleBody" role="table"></div></div></section><details class="strategy-basis"><summary>查看本次排课依据</summary><div class="strategy-basis-content case-rule-basis"><span>全局要求</span><strong>${globalRules.map(item=>`${displayDate(item.start)}—${displayDate(item.end)} ${globalRuleText(item)}`).join('；')}</strong><span>口语要求</span><strong>${coursePeriods.speaking.map(periodSummary).join('；')}</strong></div></details>`;
    const conflictMetric=step5.querySelector('.draft-metric:last-child strong');
    if(conflictMetric){conflictMetric.textContent=missingLessons?`存在${missingLessons}节缺口`:'全部通过';conflictMetric.style.color=missingLessons?'#b26a00':'var(--green)';}
    step5.querySelector('.drawer-footer').innerHTML=`<button data-page="step4">返回授课老师</button><span class="case-footer-note">正式排课前需重新校验真实师生日程</span><button class="primary" id="caseConfirmSchedule" ${missingLessons?'disabled title="当前方案仍有课节缺口"':''}>确认生成正式排课</button>`;
    renderLessonRows('');
    document.getElementById('casePreviewFilter').addEventListener('change',event=>renderLessonRows(event.target.value));
    document.getElementById('caseSaveVersion').addEventListener('click',()=>notify('演示排课版本已保存到当前原型'));
    document.getElementById('caseConfirmSchedule').addEventListener('click',()=>{const button=document.getElementById('caseConfirmSchedule');button.disabled=true;button.textContent='正在校验最新日程…';setTimeout(()=>{button.textContent='已确认正式排课';const note=document.createElement('div');note.className='case-confirm-note';note.textContent=`演示校验通过：${state.lessons.length}节、${totalHours}小时；口语完成日期为${lastSpeaking}。未写入真实排课系统。`;step5.querySelector('.drawer-body').prepend(note);notify('演示正式排课方案已确认')},700)});
  }
  function renderLessonRows(filter){const body=document.getElementById('caseScheduleBody');const rows=state.lessons.filter(item=>!filter||item.courseId===filter);body.innerHTML='<div class="preview-list-row preview-list-head" role="row"><span>上课日期</span><span>时段</span><span>课程名称</span><span>课时</span><span>授课老师</span><span>授课模式</span><span>授课校区</span></div>'+rows.map(item=>{const course=courseData.find(value=>value.id===item.courseId),date=new Date(item.date+'T00:00:00Z');return `<article class="preview-list-row" data-preview-lesson role="row"><div class="preview-lesson-date"><strong>${item.date}</strong><span>${weekdays[date.getUTCDay()]}</span></div><div class="preview-lesson-time">${item.time}</div><div class="preview-lesson-course">${esc(course.title)}</div><div class="preview-lesson-hours">${item.hours}小时</div><div class="preview-lesson-teacher">${esc(course.teacher.replace(/（.+/,''))}</div><div><span class="preview-mode-tag online">线上</span></div><div class="preview-lesson-campus empty">—</div></article>`}).join('');}

  hydrateBaseScenario();
  renderRequirements();
})();

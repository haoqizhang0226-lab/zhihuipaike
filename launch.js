(() => {
  'use strict';

  const step1 = document.getElementById('step1');
  const step5 = document.getElementById('step5');
  const openButton = document.getElementById('openDrawer');
  if (!step1 || !step5 || !openButton) return;

  document.title = '教务智慧排课 · 正式版';

  const courses = [
    {id:'listening',name:'ALEVEL-物理-CAIE-线上',hours:40,duration:2,mode:'线上',campus:'',requirements:['风趣幽默','可全英文'],history:[{teacher:'李若宁（VA02108）',status:'历史'}],recommended:['李若宁（VA02108）','林清（VA01872）','周言（VA02631）']},
    {id:'speaking',name:'ALEVEL-化学-CAIE-线下',hours:60,duration:2,mode:'线下',campus:'鸿寿校区',requirements:['女老师','可全英文','热情活泼'],history:[{teacher:'王语晴（VA01625）',status:'当前'}],recommended:['王语晴（VA01625）','陈妍（VA01916）','沈知夏（VA02501）']},
    {id:'reading',name:'ALEVEL-数学-CAIE-线上',hours:30,duration:2,mode:'线上',campus:'',requirements:['男老师','疑难专家','循序善诱'],history:[],recommended:['周明远（VA02017）','许文清（VA02203）','顾承（VA02721）']},
    {id:'writing',name:'ALEVEL-生物-CAIE-线下',hours:40,duration:2,mode:'线下',campus:'鸿寿校区',requirements:['严格严肃','生动形象','温柔耐心'],history:[{teacher:'陈知书（VA01736）',status:'历史'}],recommended:['陈知书（VA01736）','宋然（VA02342）','陆书言（VA02816）']}
  ];
  courses.forEach(course => { course.requirement = course.requirements.join('、'); });
  const scheduleOrderRequirement = '9月每周最多3节、每天最多1节；每周固定1节化学且仅限周二10:30—12:30；10月1日—7日停排；10月8日—11月15日每周最多5节、每天最多2节，优先周三、周四10:30—12:30；四科交叉排课；化学12月1日前完成。';
  const selections = Object.fromEntries(courses.map(course => [course.id,{mode:'recommend',teacher:course.recommended[0]}]));
  const uploadedFiles = [];
  let lessons = [];
  let scheduleVersions = [];
  let activeScheduleVersion = 'plan-1';
  let loadingTimers = [];

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const teacherRequirementTags = course => course.requirements.map(item => `<em>${escapeHtml(item)}</em>`).join('');
  const selectedTeacherChip = courseId => {
    const selection = selections[courseId];
    if (!selection || selection.mode !== 'specified') return '';
    return `<span class="launch-selected-teacher-chip"><span>${escapeHtml(selection.teacher)}</span><button type="button" data-clear-selected-teacher="${courseId}" aria-label="删除已选老师">×</button></span>`;
  };
  const displayDate = value => value.replaceAll('-','.');
  const formatGeneratedAt = value => {
    const date = value instanceof Date ? value : new Date(value);
    const pad = number => String(number).padStart(2,'0');
    return `${date.getFullYear()}.${date.getMonth()+1}.${date.getDate()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };
  const toast = message => {
    const target = document.getElementById('successToast');
    if (!target) return;
    target.textContent = message;
    target.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => target.classList.remove('show'), 2200);
  };
  const openPage = id => {
    if (typeof openPageV2 === 'function') openPageV2(id);
    else {
      document.querySelectorAll('.drawer-page').forEach(page => page.classList.toggle('active',page.id===id));
      document.body.classList.add('drawer-open');
    }
  };
  const closeDrawer = () => {
    document.querySelectorAll('.drawer-page').forEach(page => page.classList.remove('active'));
    document.body.classList.remove('drawer-open');
  };

  function renderIntake() {
    step1.querySelector('.drawer-step-tag').textContent = '补充排课要求';
    step1.querySelector('.drawer-body').innerHTML = `<main class="launch-page launch-chat-page">
      <div class="launch-chat-thread">
        <div class="launch-chat-message launch-chat-ai">
          <span class="launch-chat-avatar" aria-hidden="true"><img src="ai-dialog-avatar.png" alt=""></span>
          <div class="launch-chat-bubble launch-chat-bubble-form launch-order-bubble">
            <strong>排课要求</strong>
            <p class="launch-order-requirement">${escapeHtml(scheduleOrderRequirement)}</p>
          </div>
        </div>
        <div class="launch-chat-message launch-chat-ai">
          <span class="launch-chat-avatar" aria-hidden="true"><img src="ai-dialog-avatar.png" alt=""></span>
          <div class="launch-chat-bubble launch-chat-bubble-form">
            <strong>请确认是否指定排课老师</strong>
            <section class="launch-chat-panel" aria-label="指定授课老师">
              <div class="launch-course-list">
                ${courses.map(course => `<article class="launch-course-card" data-launch-course="${course.id}">
                  <div class="launch-course-info"><strong>${course.name}</strong><span>${course.hours}课时</span><span>${course.mode}</span>${course.campus?`<span>${course.campus}</span>`:''}${teacherRequirementTags(course)}</div>
                  <div class="launch-course-teacher">
                    <div class="launch-history-line"><span>当前授课老师</span><div class="launch-history-tags">${course.history.some(item=>item.status==='当前')?course.history.filter(item=>item.status==='当前').map(item=>`<button type="button" class="${selections[course.id].mode==='specified'&&selections[course.id].teacher===item.teacher?'selected':''}" data-history-course="${course.id}" data-history-teacher="${escapeHtml(item.teacher)}">${escapeHtml(item.teacher)}</button>`).join(''):'<em>暂无</em>'}</div></div>
                    <div class="launch-history-line"><span>历史授课老师</span><div class="launch-history-tags">${course.history.some(item=>item.status==='历史')?course.history.filter(item=>item.status==='历史').map(item=>`<button type="button" class="${selections[course.id].mode==='specified'&&selections[course.id].teacher===item.teacher?'selected':''}" data-history-course="${course.id}" data-history-teacher="${escapeHtml(item.teacher)}">${escapeHtml(item.teacher)}</button>`).join(''):'<em>暂无</em>'}</div></div>
                    <div class="launch-specify-line">
                      <span class="launch-specify-label">指定排课老师</span>
                      <div class="launch-specify-control">
                        <label class="launch-teacher-search"><span class="material-symbols-outlined">search</span><input type="search" data-teacher-search="${course.id}" list="launch-teachers-${course.id}" value="" placeholder="输入老师姓名或工号"><datalist id="launch-teachers-${course.id}">${course.recommended.map(teacher=>`<option value="${escapeHtml(teacher)}"></option>`).join('')}</datalist></label>
                        <div class="launch-selected-teacher-slot" data-selected-teacher="${course.id}">${selectedTeacherChip(course.id)}</div>
                      </div>
                    </div>
                  </div>
                </article>`).join('')}
              </div>
            </section>
          </div>
        </div>
        <div class="launch-chat-message launch-chat-ai">
          <span class="launch-chat-avatar" aria-hidden="true"><img src="ai-dialog-avatar.png" alt=""></span>
          <div class="launch-chat-bubble launch-chat-bubble-form">
            <strong>补充排课要求</strong>
            <section class="launch-chat-composer" aria-label="补充排课要求">
              <textarea class="launch-textarea" id="launchSupplement" placeholder="可以输入文字、上传图片补充排课要求"></textarea>
              <label class="launch-upload" id="launchUploadZone">
                <input id="launchUpload" type="file" accept="image/*" multiple>
                <span class="material-symbols-outlined">add_photo_alternate</span>
                <strong>上传聊天截图</strong><small>支持 JPG、PNG、WEBP，可上传多张</small>
              </label>
              <div class="launch-upload-list" id="launchUploadList"></div>
            </section>
          </div>
        </div>
      </div>
    </main>`;
    step1.querySelector('.drawer-footer').innerHTML = '<button id="launchCancel">取消</button><button class="primary" id="launchGenerate"><span class="material-symbols-outlined">auto_awesome</span>AI分析并生成排课方案</button>';
    bindIntake();
  }

  function bindIntake() {
    step1.querySelectorAll('[data-teacher-search]').forEach(input => input.addEventListener('input',event => {
      const courseId = event.target.dataset.teacherSearch;
      const value = event.target.value.trim();
      const course = courses.find(item => item.id === courseId);
      const teacher = course.recommended.find(item => item === value);
      if (!teacher) return;
      selections[courseId] = {mode:'specified',teacher};
      event.target.value = '';
      const card = event.target.closest('[data-launch-course]');
      card.querySelectorAll('[data-history-teacher]').forEach(button => button.classList.toggle('selected',button.dataset.historyTeacher===teacher));
      renderSelectedTeacher(courseId);
    }));
    step1.querySelectorAll('[data-history-teacher]').forEach(button => button.addEventListener('click',event => {
      const courseId = event.currentTarget.dataset.historyCourse;
      const teacher = event.currentTarget.dataset.historyTeacher;
      const input = step1.querySelector(`[data-teacher-search="${courseId}"]`);
      selections[courseId] = {mode:'specified',teacher};
      input.value = '';
      event.currentTarget.closest('[data-launch-course]').querySelectorAll('[data-history-teacher]').forEach(item => item.classList.remove('selected'));
      event.currentTarget.classList.add('selected');
      renderSelectedTeacher(courseId);
    }));
    step1.querySelectorAll('[data-selected-teacher]').forEach(host => host.addEventListener('click',event => {
      const button = event.target.closest('[data-clear-selected-teacher]');
      if (!button) return;
      const courseId = button.dataset.clearSelectedTeacher;
      const course = courses.find(item => item.id === courseId);
      selections[courseId] = {mode:'recommend',teacher:course.recommended[0]};
      const card = button.closest('[data-launch-course]');
      card.querySelectorAll('[data-history-teacher]').forEach(item => item.classList.remove('selected'));
      renderSelectedTeacher(courseId);
      card.querySelector('[data-teacher-search]')?.focus();
    }));
    document.getElementById('launchUpload').addEventListener('change',event => addUploads([...event.target.files]));
    document.getElementById('launchUploadList').addEventListener('click',event => {
      const button = event.target.closest('[data-remove-upload]');
      if (!button) return;
      uploadedFiles.splice(Number(button.dataset.removeUpload),1);
      renderUploads();
    });
    document.getElementById('launchCancel').addEventListener('click',closeDrawer);
    document.getElementById('launchGenerate').addEventListener('click',startGeneration);
  }

  function renderSelectedTeacher(courseId) {
    const host = step1.querySelector(`[data-selected-teacher="${courseId}"]`);
    if (host) host.innerHTML = selectedTeacherChip(courseId);
  }

  function addUploads(files) {
    files.filter(file => file.type.startsWith('image/')).forEach(file => {
      const reader = new FileReader();
      reader.addEventListener('load',() => {
        uploadedFiles.push({name:file.name,url:reader.result});
        renderUploads();
      });
      reader.readAsDataURL(file);
    });
  }

  function renderUploads() {
    const host = document.getElementById('launchUploadList');
    if (!host) return;
    host.innerHTML = uploadedFiles.map((file,index) => `<div class="launch-upload-item"><img src="${file.url}" alt=""><span>${escapeHtml(file.name)}</span><button type="button" data-remove-upload="${index}" aria-label="删除截图">×</button></div>`).join('');
  }

  function startGeneration() {
    const incomplete = courses.find(course => selections[course.id].mode === 'specified' && !selections[course.id].teacher.trim());
    if (incomplete) {
      toast(`请搜索并选择${incomplete.name}授课老师`);
      step1.querySelector(`[data-teacher-search="${incomplete.id}"]`)?.focus();
      return;
    }
    const button = document.getElementById('launchGenerate');
    const overlay = document.getElementById('strategyLoadingOverlay');
    const title = overlay.querySelector('h3');
    const stage = overlay.querySelector('.ai-loading-stage');
    button.disabled = true;
    title.textContent = '正在生成排课方案';
    stage.textContent = 'AI正在理解整张排课单和补充信息';
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden','false');
    loadingTimers.forEach(clearTimeout);
    loadingTimers = [
      setTimeout(() => stage.textContent = '正在匹配老师并计算可排课节',650),
      setTimeout(() => stage.textContent = '正在进行多课程联合排课与冲突校验',1250),
      setTimeout(() => {
        courses.forEach(course => {
          if (selections[course.id].mode === 'recommend') selections[course.id].teacher = course.recommended[0];
        });
        const generatedLessons = generateSchedule();
        scheduleVersions = createScheduleVersions(generatedLessons);
        activeScheduleVersion = scheduleVersions[0].id;
        lessons = scheduleVersions[0].lessons;
        renderResult();
        overlay.classList.remove('show');
        overlay.setAttribute('aria-hidden','true');
        button.disabled = false;
        openPage('step5');
      },1900)
    ];
  }

  const dateRange = (start,end) => {
    const values=[];
    for(let date=new Date(start+'T00:00:00Z'),finish=new Date(end+'T00:00:00Z');date<=finish;date.setUTCDate(date.getUTCDate()+1)) values.push(new Date(date));
    return values;
  };
  const iso = date => date.toISOString().slice(0,10);
  function generateSchedule() {
    const remaining = Object.fromEntries(courses.map(course => [course.id,Math.round(course.hours/course.duration)]));
    const result=[];
    const others=['listening','reading','writing'];
    let cursor=0,last='';
    const nextOther=()=>{
      for(let i=0;i<others.length;i++){
        const id=others[cursor++%others.length];
        if(remaining[id]>0&&id!==last)return id;
      }
      return others.find(id=>remaining[id]>0)||null;
    };
    const add=(date,time,forceSpeaking=false,preferSpeaking=false)=>{
      let id=forceSpeaking&&remaining.speaking>0?'speaking':preferSpeaking&&remaining.speaking>0&&last!=='speaking'?'speaking':nextOther();
      if(!id&&remaining.speaking>0)id='speaking';
      if(!id)return;
      const course=courses.find(item=>item.id===id);
      remaining[id]--;last=id;
      result.push({date:typeof date==='string'?date:iso(date),time,courseId:id,hours:course.duration});
    };
    for(const date of dateRange('2026-09-01','2026-09-30')){
      if(date.getUTCDay()===2)add(date,'10:30—12:30',true);
      if(date.getUTCDay()===3)add(date,'08:30—10:30');
      if(date.getUTCDay()===5)add(date,'10:30—12:30');
    }
    const weekly={};
    for(const date of dateRange('2026-10-08','2026-11-15')){
      const monday=new Date(date),delta=(date.getUTCDay()+6)%7;monday.setUTCDate(date.getUTCDate()-delta);
      const key=iso(monday);weekly[key]=weekly[key]||0;
      const slots=date.getUTCDay()===3?['10:30—12:30','14:00—16:00']:date.getUTCDay()===4?['10:30—12:30']:date.getUTCDay()===1||date.getUTCDay()===6?['09:00—11:00']:[];
      for(const time of slots){if(weekly[key]>=5)break;add(date,time,false,result.length%2===1);weekly[key]++;}
    }
    for(const date of dateRange('2026-11-16','2026-11-30')) for(const time of ['10:30—12:30','14:00—16:00']) add(date,time,false,remaining.speaking>0&&last!=='speaking');
    for(const date of dateRange('2026-12-01','2026-12-30')) for(const time of ['09:00—11:00','14:00—16:00']) if(Object.values(remaining).some(Boolean)) add(date,time);
    return result.sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
  }

  const cloneTeacherSelections=source=>Object.fromEntries(courses.map(course=>[course.id,{...(source?.[course.id]||selections[course.id])}]));
  const cloneInterpretations=source=>({
    global:String(source?.global||''),
    courses:Object.fromEntries(courses.map(course=>[course.id,String(source?.courses?.[course.id]||'')]))
  });
  const createInterpretationSnapshot=(sourceGlobal=globalRequirements,sourceCourses=courseRequirements,sourceTeacherRequirements=Object.fromEntries(courses.map(course=>[course.id,course.requirements])))=>({
    global:globalAiSummary(sourceGlobal),
    courses:Object.fromEntries(courses.map(course=>[course.id,courseAiSummary(course,sourceCourses[course.id]||[],sourceTeacherRequirements[course.id]||[])]))
  });
  const snapshotRequirements=(interpretations)=>({
    global:globalRequirements.map(item=>[...item]),
    courses:Object.fromEntries(Object.entries(courseRequirements).map(([courseId,rules])=>[courseId,rules.map(item=>[...item])])),
    teacherRequirements:Object.fromEntries(courses.map(course=>[course.id,[...course.requirements]])),
    interpretations:cloneInterpretations(interpretations||createInterpretationSnapshot())
  });

  function createScheduleVersions(baseLessons) {
    return [{
      id:'plan-1',
      name:'方案1',
      generatedAt:formatGeneratedAt('2026-09-11T18:30:21'),
      lessons:baseLessons.map(item=>({...item})),
      teachers:cloneTeacherSelections(selections),
      requirements:snapshotRequirements()
    }];
  }

  const currentScheduleVersion = () => scheduleVersions.find(item=>item.id===activeScheduleVersion) || scheduleVersions[0];
  const lessonWarning = item => ({
    '2026-09-01|10:30—12:30':'教师排课超限',
    '2026-09-02|08:30—10:30':'新生待审批'
  })[`${item.date}|${item.time}`] || '';

  function renderResult() {
    const totalHours=lessons.reduce((sum,item)=>sum+item.hours,0);
    const expectedHours=courses.reduce((sum,course)=>sum+course.hours,0);
    const expectedLessons=courses.reduce((sum,course)=>sum+Math.round(course.hours/course.duration),0);
    const conflictCount=lessons.filter(item=>lessonWarning(item)).length;
    step5.querySelector('.drawer-step-tag').textContent='确认排课方案';
    const selectedVersion=currentScheduleVersion();
    step5.querySelector('.drawer-body').innerHTML=`<main class="launch-page launch-result-page">
      <section class="launch-result-summary compact">
        <div class="launch-result-metrics"><span><small>已排课时 / 应排总课时</small><b>${totalHours} / ${expectedHours}小时</b></span><span><small>已排课节 / 应排总课节</small><b>${lessons.length} / ${expectedLessons}节</b></span><span><small>冲突校验结果</small><b class="${conflictCount?'danger':'success'}">${conflictCount}项冲突</b></span><span class="launch-version-metric"><small>排课方案</small><div class="launch-version-picker" id="launchVersionPicker"><button type="button" id="launchVersionToggle" aria-haspopup="listbox" aria-expanded="false"><strong id="launchVersionName">${selectedVersion.name}</strong><em id="launchVersionTime">${selectedVersion.generatedAt}</em><i class="material-symbols-outlined">expand_more</i></button><div class="launch-version-options" role="listbox" aria-label="切换排课方案" hidden>${scheduleVersions.map(version=>`<button type="button" role="option" aria-selected="${version.id===activeScheduleVersion}" data-schedule-version="${version.id}"><strong>${version.name}</strong><small>${version.generatedAt}</small><i class="material-symbols-outlined">${version.id===activeScheduleVersion?'check':''}</i></button>`).join('')}</div></div></span></div>
      </section>
      <section class="policy-card preview-list-card launch-schedule-card">
        <div class="case-preview-toolbar"><div><h3>排课方案</h3></div><div class="launch-schedule-tools"><select class="case-preview-filter" id="launchCourseFilter"><option value="">全部课程</option>${courses.map(course=>`<option value="${course.id}">${course.name}</option>`).join('')}</select><button type="button" class="launch-export-button" id="launchExportSchedule"><span class="material-symbols-outlined">download</span>导出排课方案</button></div></div>
        <div class="launch-timetable-scroll"><div class="launch-timetable" id="launchScheduleList" role="table" aria-label="排课方案"></div></div>
      </section>
    </main>`;
    step5.querySelector('.drawer-footer').innerHTML='<button id="launchBackToInput">修改补充信息</button><button id="launchSaveVersion">保存为排课版本</button><button class="primary" id="launchConfirm">确认生成正式排课</button>';
    renderScheduleRows('');
    const versionPicker=document.getElementById('launchVersionPicker');
    const versionToggle=document.getElementById('launchVersionToggle');
    const versionOptions=versionPicker.querySelector('.launch-version-options');
    const setVersionMenuOpen=open=>{
      versionOptions.hidden=!open;
      versionToggle.setAttribute('aria-expanded',String(open));
      versionPicker.classList.toggle('open',open);
    };
    versionToggle.addEventListener('click',()=>setVersionMenuOpen(versionOptions.hidden));
    step5.querySelectorAll('[data-schedule-version]').forEach(button=>button.addEventListener('click',event=>{
      const version=scheduleVersions.find(item=>item.id===event.currentTarget.dataset.scheduleVersion);
      if(!version)return;
      activeScheduleVersion=version.id;
      lessons=version.lessons;
      step5.querySelectorAll('[data-schedule-version]').forEach(item=>{
        const active=item.dataset.scheduleVersion===version.id;
        item.setAttribute('aria-selected',String(active));
        item.querySelector('i').textContent=active?'check':'';
      });
      document.getElementById('launchVersionName').textContent=version.name;
      document.getElementById('launchVersionTime').textContent=version.generatedAt;
      setVersionMenuOpen(false);
      renderScheduleRows(document.getElementById('launchCourseFilter').value);
    }));
    document.getElementById('launchCourseFilter').addEventListener('change',event=>renderScheduleRows(event.target.value));
    document.getElementById('launchExportSchedule').addEventListener('click',exportSchedulePdf);
    step5.querySelector('.drawer-body').onclick=event=>{
      if(!versionPicker.contains(event.target))setVersionMenuOpen(false);
    };
    versionPicker.addEventListener('focusout',event=>{
      if(!versionPicker.contains(event.relatedTarget))setVersionMenuOpen(false);
    });
    document.getElementById('launchViewRequirements').addEventListener('click',showRequirementDetail);
    document.getElementById('launchBackToInput').addEventListener('click',()=>openPage('step1'));
    document.getElementById('launchSaveVersion').addEventListener('click',()=>toast(`${currentScheduleVersion().name}已保存为排课版本`));
    document.getElementById('launchConfirm').addEventListener('click',event=>{
      event.currentTarget.disabled=true;
      event.currentTarget.textContent='已生成正式排课';
      toast('正式排课已生成');
    });
  }

  function renderScheduleRows(filter) {
    const host=document.getElementById('launchScheduleList');
    const weekdays=['周日','周一','周二','周三','周四','周五','周六'];
    const rows=lessons.filter(item=>!filter||item.courseId===filter);
    const dates=[...new Set(rows.map(item=>item.date))].sort();
    const times=[...new Set(rows.map(item=>item.time))].sort();
    const lessonBySlot=new Map(rows.map(item=>[`${item.date}|${item.time}`,item]));
    const versionTeachers=currentScheduleVersion()?.teachers||selections;
    if (!rows.length) {
      host.style.removeProperty('grid-template-columns');
      host.innerHTML='<div class="launch-timetable-empty">当前筛选条件下暂无排课方案</div>';
      return;
    }
    host.style.gridTemplateColumns=`126px repeat(${dates.length}, 220px)`;
    const header=`<div class="launch-timetable-corner" role="columnheader"><span>日期</span><em>时间</em></div>${dates.map(value=>{const date=new Date(value+'T00:00:00Z');return `<div class="launch-timetable-date" role="columnheader"><strong>${value}</strong><span>${weekdays[date.getUTCDay()]}</span></div>`;}).join('')}`;
    const body=times.map(time=>`<div class="launch-timetable-time" role="rowheader">${escapeHtml(time.replace('—',' ~ '))}</div>${dates.map(date=>{
      const item=lessonBySlot.get(`${date}|${time}`);
      if (!item) return '<div class="launch-timetable-cell empty" role="cell"></div>';
      const course=courses.find(value=>value.id===item.courseId);
      const warning=lessonWarning(item);
      return `<article class="launch-timetable-cell occupied${warning?' conflict':''}" role="cell"><strong title="${escapeHtml(course.name)}">${escapeHtml(course.name)}</strong><span class="launch-timetable-teacher">${escapeHtml(versionTeachers[course.id].teacher)}</span><span class="launch-timetable-mode">${escapeHtml(course.mode)}</span>${warning?`<span class="launch-timetable-warning"><i class="material-symbols-outlined">error</i>${escapeHtml(warning)}</span>`:''}</article>`;
    }).join('')}`).join('');
    host.innerHTML=header+body;
  }

  function scheduleExportRows() {
    const weekdays=['周日','周一','周二','周三','周四','周五','周六'];
    const versionTeachers=currentScheduleVersion()?.teachers||selections;
    return lessons.map(item=>{
      const course=courses.find(value=>value.id===item.courseId);
      const date=new Date(item.date+'T00:00:00Z');
      return [item.date,weekdays[date.getUTCDay()],item.time,course.name,`${item.hours}小时`,versionTeachers[course.id].teacher,course.mode,course.campus||'—'];
    });
  }

  function exportScheduleExcel() {
    const headers=['上课日期','星期','时段','课程名称','课时','授课老师','授课模式','授课校区'];
    const rows=scheduleExportRows();
    const table=`<table border="1"><thead><tr>${headers.map(item=>`<th>${item}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(item=>`<td>${escapeHtml(item)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const workbook=`<!doctype html><html><head><meta charset="UTF-8"><style>table{border-collapse:collapse}th,td{padding:8px 12px;white-space:nowrap}th{background:#eef4fb}</style></head><body><h2>${currentScheduleVersion().name}</h2><p>生成时间：${currentScheduleVersion().generatedAt}</p>${table}</body></html>`;
    const blob=new Blob(['\ufeff',workbook],{type:'application/vnd.ms-excel;charset=utf-8'});
    const link=document.createElement('a');
    link.href=URL.createObjectURL(blob);
    link.download=`排课方案-${currentScheduleVersion().name}.xls`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(()=>URL.revokeObjectURL(link.href),0);
    toast('Excel排课方案已导出');
  }

  function exportSchedulePdf() {
    const previewWindow=window.open('schedule-export-preview.png','_blank');
    if(previewWindow)previewWindow.opener=null;
    const link=document.createElement('a');
    link.href='output/pdf/schedule-plan.pdf';
    link.download=`排课方案-${currentScheduleVersion().name}.pdf`;
    document.body.append(link);
    link.click();
    link.remove();
    toast(previewWindow?'PDF已下载，并已打开排课方案预览':'PDF已下载；请允许浏览器打开预览页面');
  }

  const globalRequirements = [
    ['2026.09.01—2026.09.30','可排','3','1','交叉排课'],
    ['2026.10.01—2026.10.07','停排','','','不限制'],
    ['2026.10.08—2026.11.15','可排','5','2','交叉排课'],
    ['2026.11.16—2026.12.30','可排','','2','交叉排课']
  ];
  const courseRequirements = {
    listening:[['2026.09.01—2026.09.30','可排','每周最多1节','优先工作日08:30—12:30'],['2026.10.08—2026.11.15','可排','每周最多2节','优先周三、周四10:30—12:30'],['2026.11.16—2026.12.30','可排','不限制','不限制']],
    speaking:[['2026.09.01—2026.09.30','可排','每周固定1节','固定周二10:30—12:30'],['2026.10.08—2026.11.15','可排','不限制','优先周三、周四10:30—12:30'],['2026.11.16—2026.11.30','可排','不限制','不限制']],
    reading:[['2026.09.01—2026.09.30','可排','每周最多1节','优先工作日08:30—12:30'],['2026.10.08—2026.11.15','可排','每周最多2节','优先周三、周四10:30—12:30'],['2026.11.16—2026.12.30','可排','不限制','不限制']],
    writing:[['2026.09.01—2026.09.30','可排','每周最多1节','优先工作日08:30—12:30'],['2026.10.08—2026.11.15','可排','每周最多2节','优先周三、周四10:30—12:30'],['2026.11.16—2026.12.30','可排','不限制','不限制']]
  };

  const requirementOptions = {
    status:['可排','停排'],
    distribution:['不限制','交叉排课','轮流排课'],
    frequencyPeriod:['周','2周','月'],
    frequencyMode:['不限制','固定','至少','最多'],
    timeMode:['不限制','优先','固定']
  };
  const requirementWeekdayOptions=['每天','工作日','周一','周二','周三','周四','周五','周六','周日'];
  const teacherRequirementOptions=['风趣幽默','可全英文','热情活泼','严格严肃','循序善诱','疑难专家','生动形象','温柔耐心','男老师','女老师'];
  let requirementDraft=null;
  let requirementEditing=false;

  const requirementSelectOptions=(values,selected)=>values.map(value=>`<option value="${escapeHtml(value)}"${value===selected?' selected':''}>${escapeHtml(value)}</option>`).join('');
  const splitRequirementRange=value=>String(value||'').split('—').map(part=>part.replaceAll('.','-'));
  const joinRequirementRange=(start,end)=>`${String(start||'').replaceAll('-','.')}—${String(end||'').replaceAll('-','.')}`;
  const createRequirementDraft=()=>{
    const version=currentScheduleVersion();
    const source=version?.requirements;
    const sourceGlobal=source?.global||globalRequirements;
    const sourceCourses=source?.courses||courseRequirements;
    const sourceTeacherRequirements=source?.teacherRequirements||Object.fromEntries(courses.map(course=>[course.id,course.requirements]));
    return {
      global:sourceGlobal.map(item=>[...item]),
      courses:Object.fromEntries(Object.entries(sourceCourses).map(([courseId,rules])=>[courseId,rules.map(item=>[...item])])),
      teacherRequirements:Object.fromEntries(courses.map(course=>[course.id,[...(sourceTeacherRequirements[course.id]||[])]])),
      teachers:cloneTeacherSelections(version?.teachers||selections),
      interpretations:cloneInterpretations(source?.interpretations||createInterpretationSnapshot(sourceGlobal,sourceCourses,sourceTeacherRequirements)),
      changed:false
    };
  };
  const requirementRangeField=(value,attributes,editable,label='日期')=>{const [start='',end='']=splitRequirementRange(value);const disabled=editable?'':' disabled';return `<label class="launch-structured-field launch-date-field"><span>${label}</span><div><input type="date" ${attributes} data-field="0" data-range-part="start" value="${escapeHtml(start)}"${disabled}><i>—</i><input type="date" ${attributes} data-field="0" data-range-part="end" value="${escapeHtml(end)}"${disabled}></div></label>`;};
  const requirementSelectField=(label,value,values,attributes,field,editable)=>`<label class="launch-structured-field launch-select-field"><span>${label}</span><select ${attributes} data-field="${field}" data-rule-dependent${editable?'':' disabled'}>${requirementSelectOptions(values,value)}</select></label>`;
  const requirementStatusField=(value,attributes,editable,name)=>`<fieldset class="launch-structured-field launch-status-field"><legend>排课状态</legend><div>${requirementOptions.status.map(option=>`<label><input type="radio" name="${name}" ${attributes} data-field="1" value="${option}"${value===option?' checked':''}${editable?'':' disabled'}><span>${option}</span></label>`).join('')}</div></fieldset>`;
  const requirementLimitField=(label,value,attributes,field,editable)=>`<label class="launch-structured-field launch-limit-field"><span>${label}</span><div><input type="number" min="0" step="1" inputmode="numeric" placeholder="不限制" ${attributes} data-field="${field}" data-rule-dependent value="${escapeHtml(value)}"${editable?'':' disabled'}><i>节</i></div></label>`;
  const parseFrequency=value=>{const text=String(value||'');if(text==='不限制'||text==='不适用')return {period:'周',mode:'不限制',count:''};const match=text.match(/^每(2周|周|月)(固定|至少|最多|可排)(\d+)节$/);return match?{period:match[1],mode:match[2]==='可排'?'最多':match[2],count:match[3]}:{period:'周',mode:'固定',count:'1'};};
  const formatFrequency=({period,mode,count})=>mode==='不限制'?'不限制':`每${period}${mode}${Math.max(0,Math.floor(Number(count)||0))}节`;
  const requirementFrequencyField=(value,courseId,index,editable)=>{const parsed=parseFrequency(value);const disabled=editable?'':' disabled';return `<fieldset class="launch-structured-field launch-frequency-field" data-frequency-control="${courseId}-${index}"><legend>上课频次</legend><div><span>每</span><select data-course-id="${courseId}" data-course-rule-index="${index}" data-frequency-part="period" data-rule-dependent${disabled}>${requirementSelectOptions(requirementOptions.frequencyPeriod,parsed.period)}</select><select data-course-id="${courseId}" data-course-rule-index="${index}" data-frequency-part="mode" data-rule-dependent${disabled}>${requirementSelectOptions(requirementOptions.frequencyMode,parsed.mode)}</select><input type="number" min="0" step="1" inputmode="numeric" data-course-id="${courseId}" data-course-rule-index="${index}" data-frequency-part="count" data-rule-dependent value="${escapeHtml(parsed.count)}"${parsed.mode==='不限制'?' hidden':''}${disabled}><span data-frequency-unit${parsed.mode==='不限制'?' hidden':''}>节</span></div></fieldset>`;};
  const parseTimeSlot=value=>{const text=String(value||'').trim();const match=text.match(/^(.*?)(\d{2}:\d{2})[—~-](\d{2}:\d{2})$/);return match?{scope:match[1].trim(),start:match[2],end:match[3]}:{scope:text,start:'10:30',end:'12:30'};};
  const parseTimeRule=value=>{const text=String(value||'').trim();if(text==='不限制'||text==='时段不限制'||text==='不适用')return {mode:'不限制',slots:[]};const mode=text.startsWith('优先')?'优先':text.startsWith('固定')||text.startsWith('仅限')?'固定':'不限制';if(mode==='不限制')return {mode,slots:[]};const body=text.replace(/^(优先|固定|仅限)/,'');const parsedSlots=body.split(/[；;]/).map(parseTimeSlot).filter(item=>item.start&&item.end);const slots=parsedSlots.flatMap(slot=>{const scopes=slot.scope.split('、').map(item=>item.trim()).filter(Boolean);return scopes.length>1&&scopes.every(scope=>requirementWeekdayOptions.includes(scope))?scopes.map(scope=>({...slot,scope})):[slot];});return {mode,slots:slots.length?slots:[{scope:'',start:'10:30',end:'12:30'}]};};
  const formatTimeRule=({mode,slots})=>mode==='不限制'?'不限制':`${mode}${(slots||[]).map(slot=>`${String(slot.scope||'').trim()}${slot.start||'10:30'}—${slot.end||'12:30'}`).join('；')}`;
  const requirementWeekdayOptionsHtml=selected=>`<option value=""${selected?'':' selected'}>选择星期</option>${requirementWeekdayOptions.map(value=>`<option value="${value}"${value===selected?' selected':''}>${value}</option>`).join('')}`;
  const timeSlotRow=(slot,courseId,index,slotIndex,editable,total)=>{const disabled=editable?'':' disabled';return `<div class="launch-time-slot-row" data-time-slot-index="${slotIndex}"><select aria-label="星期" data-course-id="${courseId}" data-course-rule-index="${index}" data-time-slot-part="scope" data-rule-dependent${disabled}>${requirementWeekdayOptionsHtml(slot.scope)}</select><input type="time" aria-label="开始时间" value="${escapeHtml(slot.start)}" data-course-id="${courseId}" data-course-rule-index="${index}" data-time-slot-part="start" data-rule-dependent${disabled}><i>—</i><input type="time" aria-label="结束时间" value="${escapeHtml(slot.end)}" data-course-id="${courseId}" data-course-rule-index="${index}" data-time-slot-part="end" data-rule-dependent${disabled}>${editable?`<button type="button" aria-label="删除时段" data-remove-time-slot="${courseId}-${index}" data-rule-dependent${total<=1?' disabled':''}>×</button>`:''}</div>`;};
  const requirementTimeField=(value,courseId,index,editable)=>{const parsed=parseTimeRule(value);const slots=parsed.slots.length?parsed.slots:[{scope:'',start:'10:30',end:'12:30'}];const disabled=editable?'':' disabled';return `<fieldset class="launch-structured-field launch-time-rule-field" data-time-control="${courseId}-${index}"><legend>时段要求</legend><div class="launch-time-rule-body"><div class="launch-time-rule-head"><select aria-label="时段要求类型" data-course-id="${courseId}" data-course-rule-index="${index}" data-time-part="mode" data-rule-dependent${disabled}>${requirementSelectOptions(requirementOptions.timeMode,parsed.mode)}</select></div><div class="launch-time-slot-editor"${parsed.mode==='不限制'?' hidden':''}><div class="launch-time-slot-list">${slots.map((slot,slotIndex)=>timeSlotRow(slot,courseId,index,slotIndex,editable,slots.length)).join('')}</div>${editable?`<button type="button" class="launch-add-time-slot" data-add-time-slot="${courseId}-${index}" data-rule-dependent><span aria-hidden="true">＋</span>添加时段</button>`:''}</div></div></fieldset>`;};
  const requirementTimeFieldState=(value,courseId,index,pageEditable,stopped)=>{const html=requirementTimeField(value,courseId,index,pageEditable);return stopped?html.replaceAll(' data-rule-dependent',' data-rule-dependent disabled'):html;};
  const limitSummary=(value,prefix)=>value===''||value===null||value===undefined?`${prefix}不限制`:`${prefix}最多${value}节`;
  const globalAiSummary=rows=>rows.map(row=>row[1]==='停排'?`${row[0]}停排`:`${row[0]}${limitSummary(row[2],'每周')}、${limitSummary(row[3],'每天')}，${row[4]}`).join('；')+'。';
  const courseAiSummary=(course,rules,tags)=>`${rules.map(rule=>rule[1]==='停排'?`${rule[0]}停排`:`${rule[0]}${rule[2]==='不限制'?'上课频次不限制':rule[2]}，${rule[3]==='不限制'?'时段不限制':rule[3]}`).join('；')}。`;

  function renderGlobalStructuredRules(rows,editable) {
    return rows.map((item,index)=>{const dependentEditable=editable&&item[1]!=='停排';return `<div class="launch-structured-rule global-rule${item[1]==='停排'?' is-stopped':''}">${requirementRangeField(item[0],`data-global-index="${index}"`,editable,`排课日期${index+1}`)}${requirementStatusField(item[1],`data-global-index="${index}"`,editable,`global-status-${index}`)}${requirementLimitField('周排课上限',item[2],`data-global-index="${index}"`,2,dependentEditable)}${requirementLimitField('日排课上限',item[3],`data-global-index="${index}"`,3,dependentEditable)}${requirementSelectField('多课程排课方式',item[4],requirementOptions.distribution,`data-global-index="${index}"`,4,dependentEditable)}</div>`;}).join('');
  }

  function renderCourseStructuredRules(course,rules,editable) {
    return rules.map((item,index)=>{const stopped=item[1]==='停排';const dependentEditable=editable&&!stopped;return `<div class="launch-structured-rule course-rule${stopped?' is-stopped':''}">${requirementRangeField(item[0],`data-course-id="${course.id}" data-course-rule-index="${index}"`,editable,`排课日期${index+1}`)}${requirementStatusField(item[1],`data-course-id="${course.id}" data-course-rule-index="${index}"`,editable,`course-status-${course.id}-${index}`)}${requirementFrequencyField(item[2],course.id,index,dependentEditable)}${requirementTimeFieldState(item[3],course.id,index,editable,stopped)}</div>`;}).join('');
  }

  const teacherSource=mode=>mode==='recommend'?'系统自动匹配':mode==='current'?'继续使用当前排课老师':'指定排课老师';
  const teacherRelation=(course,teacher)=>{const status=course.history.find(item=>item.teacher===teacher)?.status;return status==='当前'?'当前授课老师':status==='历史'?'历史授课老师':'';};
  const renderTeacherEditor=(course,selection)=>{const currentTeacher=currentScheduleVersion()?.teachers?.[course.id]?.teacher||selection.teacher||'';return `<div class="launch-teacher-editor" data-teacher-editor="${course.id}">
    <div class="launch-teacher-editor-label">修改排课老师</div>
    <div class="launch-teacher-choice" role="radiogroup" aria-label="${escapeHtml(course.name)}排课老师选择方式">
      <label><input type="radio" name="teacher-mode-${course.id}" value="current" data-teacher-mode-choice="${course.id}"${selection.mode==='current'?' checked':''}><span>继续使用当前老师排课</span></label>
      <label><input type="radio" name="teacher-mode-${course.id}" value="specified" data-teacher-mode-choice="${course.id}"${selection.mode==='specified'?' checked':''}><span>指定其他老师排课</span></label>
      <label><input type="radio" name="teacher-mode-${course.id}" value="recommend" data-teacher-mode-choice="${course.id}"${selection.mode==='recommend'?' checked':''}><span>系统自动匹配</span></label>
    </div>
    <div class="launch-specified-teacher-control" data-specified-teacher-control="${course.id}"${selection.mode==='specified'?'':' hidden'}>
      <label class="launch-teacher-name-input"><span class="material-symbols-outlined" aria-hidden="true">person_search</span><input type="text" data-teacher-name-input="${course.id}" value="${selection.mode==='specified'?escapeHtml(selection.teacher):''}" placeholder="输入老师姓名或工号" autocomplete="off"></label>
      <button type="button" data-query-teacher="${course.id}"><span class="material-symbols-outlined" aria-hidden="true">search</span>查询教师</button>
    </div>
  </div>`;};

  function renderTeacherRequirementSection(course,tags,editable) {
    if(!editable)return `<div class="launch-edit-tags launch-readonly-tags"><div>${tags.length?tags.map(value=>`<span>${escapeHtml(value)}</span>`).join(''):'<em>不限制</em>'}</div></div>`;
    return `<div class="launch-edit-tags"><div>${teacherRequirementOptions.map(value=>`<label><input type="checkbox" data-course-id="${course.id}" data-teacher-requirement="${escapeHtml(value)}"${tags.includes(value)?' checked':''}><span>${escapeHtml(value)}</span></label>`).join('')}</div></div>`;
  }

  function renderRequirementDetail(editable) {
    requirementEditing=editable;
    const supplement=document.getElementById('launchSupplement')?.value.trim();
    const body=document.getElementById('launchDetailBody');
    const title=document.getElementById('launchDetailTitle');
    const mode=document.getElementById('launchDetailMode');
    title.textContent=editable?'修改排课要求':'查看排课要求';
    mode.textContent=editable?'编辑中':'只读';
    mode.classList.toggle('editing',editable);
    detailMask.classList.toggle('editing',editable);
    body.innerHTML=`${supplement||uploadedFiles.length?`<section class="launch-detail-section"><h3>补充信息</h3>${supplement?`<p class="launch-supplement-copy">${escapeHtml(supplement)}</p>`:''}${uploadedFiles.length?`<div class="launch-material-count"><span class="material-symbols-outlined">image</span>已提交${uploadedFiles.length}张聊天截图</div>`:''}</section>`:''}<section class="launch-detail-section launch-requirement-panel"><h3>全局要求</h3><div class="launch-ai-interpretation"><span class="material-symbols-outlined" aria-hidden="true">auto_awesome</span><div><strong>排课要求解析</strong><p id="launchGlobalAiCopy">${escapeHtml(globalAiSummary(requirementDraft.global))}</p></div></div><div class="launch-structured-heading"><strong>排课要求</strong></div><div class="launch-structured-list">${renderGlobalStructuredRules(requirementDraft.global,editable)}</div></section><section class="launch-detail-section"><h3>各课程要求</h3><div class="launch-detail-course-list">${courses.map(course=>{const selectedData=requirementDraft.teachers[course.id];const selected=selectedData.teacher;const relationship=teacherRelation(course,selected);const lessonCount=Math.round(course.hours/course.duration);const rules=requirementDraft.courses[course.id];const tags=requirementDraft.teacherRequirements[course.id];return `<article class="launch-detail-course launch-requirement-course" data-detail-course="${course.id}"><header><div><strong>${course.name}</strong><span>${course.hours}课时 · 每节${course.duration}小时 · ${course.mode}${course.campus?` · ${course.campus}`:''}</span></div></header><section class="launch-course-subcard launch-course-schedule-card"><div class="launch-ai-interpretation course-ai"><span class="material-symbols-outlined" aria-hidden="true">auto_awesome</span><div><strong>排课要求解析</strong><p id="launchCourseAiCopy-${course.id}">${escapeHtml(courseAiSummary(course,rules,tags))}</p></div></div><div class="launch-structured-heading"><strong>排课要求</strong></div><div class="launch-structured-list">${renderCourseStructuredRules(course,rules,editable)}</div></section><section class="launch-course-subcard launch-course-teacher-card"><div class="launch-card-section-title"><strong>老师要求</strong>${renderTeacherRequirementSection(course,tags,editable)}</div><div class="launch-detail-teacher"><div class="launch-current-plan-heading"><strong class="launch-current-plan-label">当前排课老师</strong><span class="launch-teacher-source" data-detail-teacher-mode>${teacherSource(selectedData.mode)}</span></div><div class="launch-current-teacher"><div class="launch-teacher-name-line"><b data-detail-teacher-name>${escapeHtml(selected)}</b><span data-detail-teacher-relation${relationship?'':' hidden'}>${escapeHtml(relationship)}</span></div></div><div class="case-metrics"><span class="case-metric">可排<b>${lessonCount}/${lessonCount}节</b></span>${course.id==='speaking'?'<span class="case-metric">固定时段<b>5/5节</b></span><span class="case-metric">截止日前<b>30/30节</b></span>':'<span class="case-metric">课程课时<b>全部覆盖</b></span>'}</div></div>${editable?renderTeacherEditor(course,selectedData):''}</section></article>`}).join('')}</div></section>`;
    document.getElementById('launchGlobalAiCopy').textContent=requirementDraft.interpretations.global;
    courses.forEach(course=>{
      const aiCopy=document.getElementById(`launchCourseAiCopy-${course.id}`);
      if(aiCopy)aiCopy.textContent=requirementDraft.interpretations.courses[course.id];
      const card=detailMask.querySelector(`[data-detail-course="${course.id}"]`);
      const planTeacher=currentScheduleVersion()?.teachers?.[course.id]||requirementDraft.teachers[course.id];
      if(!card||!planTeacher)return;
      const teacherDetail=card.querySelector('.launch-detail-teacher');
      if(teacherDetail&&!teacherDetail.querySelector('.launch-current-plan-label'))teacherDetail.insertAdjacentHTML('afterbegin','<div class="launch-current-plan-heading"><strong class="launch-current-plan-label">当前排课老师</strong><span class="launch-teacher-source" data-detail-teacher-mode></span></div>');
      const teacher=planTeacher.teacher||'';
      const relationship=teacherRelation(course,teacher);
      card.querySelector('[data-detail-teacher-name]').textContent=teacher||'待指定老师';
      const relationNode=card.querySelector('[data-detail-teacher-relation]');
      relationNode.textContent=relationship;
      relationNode.hidden=!relationship;
      card.querySelector('[data-detail-teacher-mode]').textContent=teacherSource(planTeacher.mode);
    });
    const footer=detailMask.querySelector('.launch-detail-footer');
    footer.innerHTML=editable?'<span class="launch-detail-footer-note" id="launchDetailFooterNote">修改后将重新校验排课要求、老师和全部课节</span><button type="button" data-launch-cancel-edit>取消修改</button><button type="button" class="primary" data-launch-save-requirements>保存并重新生成排课方案</button>':'<span class="launch-detail-footer-note">当前为只读状态</span><button type="button" data-launch-detail-close>关闭</button><button type="button" class="primary secondary-primary" data-launch-edit-requirements>修改排课要求</button>';
  }

  const detailMask=document.createElement('div');
  detailMask.className='launch-detail-mask';
  detailMask.innerHTML='<section class="launch-detail-drawer" role="dialog" aria-modal="true" aria-labelledby="launchDetailTitle"><header><div class="launch-detail-title"><strong id="launchDetailTitle">查看排课要求</strong><span id="launchDetailMode">只读</span></div><button type="button" data-launch-detail-close aria-label="关闭">×</button></header><div class="launch-detail-body" id="launchDetailBody"></div><footer class="launch-detail-footer"></footer></section>';
  document.body.append(detailMask);

  let teacherSearchCourseId='';
  let teacherSearchSelectedTeacher='';
  const teacherSearchMask=document.createElement('div');
  teacherSearchMask.className='launch-teacher-search-page-mask';
  teacherSearchMask.innerHTML=`<section class="launch-teacher-search-page" role="dialog" aria-modal="true" aria-labelledby="launchTeacherSearchTitle">
    <header>
      <div><button type="button" class="launch-teacher-page-close" data-close-teacher-search aria-label="关闭">×</button><strong id="launchTeacherSearchTitle">查询教师</strong></div>
    </header>
    <main>
      <section class="launch-teacher-search-context" id="launchTeacherSearchContext"></section>
      <section class="launch-teacher-search-filter" aria-label="教师筛选条件">
        <div class="launch-teacher-filter-grid">
          <label><span>教师姓名</span><input id="launchTeacherSearchInput" type="search" placeholder="请输入教师姓名或工号" autocomplete="off"></label>
          <label><span>所属部门</span><select><option>请选择部门</option><option>国际课程部</option></select></label>
          <label><span>可排状态</span><select><option>选择可排状态</option><option>可完整排课</option></select></label>
          <label><span>岗位类型</span><select><option>选择岗位类型</option><option>全职教师</option><option>兼职教师</option></select></label>
          <label><span>授课模式</span><select><option>${courseModePlaceholder()}</option><option>线上</option><option>线下</option></select></label>
          <label><span>授课校区</span><select><option>选择授课校区</option><option>鸿寿校区</option><option>舜元校区</option></select></label>
          <label><span>教师级别</span><select><option>选择教师级别</option><option>金牌</option><option>高级</option></select></label>
          <label><span>试听课</span><select><option>请选择试听课</option><option>可以</option></select></label>
          <label><span>诊断课</span><select><option>请选择诊断课</option><option>可以</option></select></label>
          <label><span>自组班</span><select><option>请选择</option><option>可以</option></select></label>
          <label><span>学生水平</span><select><option>请选择学生水平</option><option>AS阶段</option></select></label>
          <label><span>教师性别</span><select><option>请选择教师性别</option><option>男老师</option><option>女老师</option></select></label>
          <label><span>教师风格</span><select><option>选择教师风格</option><option>风趣幽默</option><option>循序善诱</option><option>温柔耐心</option></select></label>
          <label><span>开课日期</span><input type="date" value="2026-09-01"></label>
          <label><span>结课日期</span><input type="date" value="2026-12-30"></label>
          <label><span>上课星期</span><select><option>请选择</option><option>周一至周日</option></select></label>
        </div>
        <div class="launch-teacher-filter-actions">
          <div class="launch-teacher-time-choice"><span>上课时间</span><label><input type="radio" name="teacher-time-mode" checked>标准</label><label><input type="radio" name="teacher-time-mode">自定义</label>${['08:20-10:20','10:30-12:30','13:30-15:30','16:00-18:00','18:30-20:30'].map(time=>`<label><input type="checkbox" checked>${time}</label>`).join('')}<label><input type="checkbox" checked>全选</label></div>
          <div class="launch-teacher-precision"><span>精准推荐</span><label><input type="radio" name="teacher-precision">是</label><label><input type="radio" name="teacher-precision" checked>否</label></div>
          <div class="launch-teacher-filter-buttons"><button type="button" data-teacher-reset>重置</button><button type="button" data-teacher-clear>清空筛选</button><button type="button" class="primary" data-run-teacher-search>匹配教师</button></div>
        </div>
      </section>
      <section class="launch-teacher-schedule-panel">
        <h3>教师日程</h3>
        <div class="launch-teacher-schedule-query"><label><span>日期</span><input type="date" value="2026-09-01"><i>至</i><input type="date" value="2026-09-30"></label><label><span>时段</span><input value="08:20-10:20;10:30-12:30;13:30-15:30;16:00-18:00;18:30-20:30"></label><label><span>星期</span><select><option>请选择</option></select></label><span class="launch-teacher-schedule-query-space"></span><button type="button" data-teacher-schedule-reset>重置</button><button type="button" class="primary" data-teacher-query-schedule>查询日程</button></div>
        <div class="launch-teacher-schedule-workspace">
          <aside><div><span class="material-symbols-outlined" aria-hidden="true">group</span><strong>匹配教师（<i id="launchTeacherCount">0</i>）</strong></div><p id="launchTeacherCourseName"></p><div id="launchTeacherCandidates"></div></aside>
          <div class="launch-teacher-calendar-area">
            <div class="launch-teacher-calendar-legend"><strong>图例：</strong><span><i class="leave"></i>老师休假</span><span><i class="busy"></i>老师有课</span><span><i class="free"></i>可排</span><span><i class="blocked"></i>不可排（未到排课时间）</span></div>
            <div class="launch-teacher-calendar-scroll"><div class="launch-teacher-calendar" id="launchTeacherSearchResults"></div></div>
          </div>
        </div>
      </section>
    </main>
    <footer><button type="button" data-close-teacher-search>关闭</button><button type="button" class="primary" data-confirm-teacher-search>确认</button></footer>
  </section>`;
  document.body.append(teacherSearchMask);

  const updateDraftTeacherCard=courseId=>{
    const selected=requirementDraft?.teachers[courseId];
    const course=courses.find(item=>item.id===courseId);
    const card=detailMask.querySelector(`[data-detail-course="${courseId}"]`);
    if(!selected||!course||!card)return;
    const teacher=selected.teacher.trim();
    const relationship=teacherRelation(course,teacher);
    card.querySelector('[data-detail-teacher-avatar]').textContent=teacher?teacher.replace(/（.+/,'').slice(0,1):'—';
    card.querySelector('[data-detail-teacher-name]').textContent=teacher||'待指定老师';
    const relationNode=card.querySelector('[data-detail-teacher-relation]');
    relationNode.textContent=relationship;
    relationNode.hidden=!relationship;
    card.querySelector('[data-detail-teacher-mode]').textContent=teacherSource(selected.mode);
  };

  const markTeacherDraftChanged=message=>{
    requirementDraft.changed=true;
    const note=document.getElementById('launchDetailFooterNote');
    if(note)note.textContent=message||'老师已调整，保存后将重新校验并生成新方案';
  };

  const setDraftTeacher=(courseId,mode,teacher,{syncEditor=true}={})=>{
    const course=courses.find(item=>item.id===courseId);
    if(!course||!requirementDraft)return;
    const currentTeacher=currentScheduleVersion()?.teachers?.[courseId]?.teacher||requirementDraft.teachers[courseId]?.teacher||'';
    const value=mode==='recommend'?course.recommended[0]:mode==='current'?currentTeacher:String(teacher||'').trim();
    requirementDraft.teachers[courseId]={mode,teacher:value};
    if(syncEditor){
      const editor=detailMask.querySelector(`[data-teacher-editor="${courseId}"]`);
      if(editor){
        const radio=editor.querySelector(`[data-teacher-mode-choice="${courseId}"][value="${mode}"]`);
        const input=editor.querySelector(`[data-teacher-name-input="${courseId}"]`);
        const control=editor.querySelector(`[data-specified-teacher-control="${courseId}"]`);
        if(radio)radio.checked=true;
        if(input)input.value=mode==='specified'?value:'';
        if(control)control.hidden=mode!=='specified';
      }
    }
    markTeacherDraftChanged();
  };

  function courseModePlaceholder(){return '选择授课模式';}

  const teacherScheduleDates=['2026-09-01','2026-09-02','2026-09-03','2026-09-04','2026-09-05','2026-09-06','2026-09-07','2026-09-08','2026-09-09','2026-09-10'];
  const teacherScheduleTimes=['08:20-10:20','10:30-12:30','13:30-15:30','16:00-18:00','18:30-20:30'];
  const teacherWeekdays=['周二','周三','周四','周五','周六','周日','周一','周二','周三','周四'];
  const teacherScheduleCell=(teacherIndex,dayIndex,timeIndex)=>{
    const code=(teacherIndex*2+dayIndex*3+timeIndex*5)%11;
    if(code===0||code===7)return '<span class="teacher-cell-status leave"><i>休</i>60min/公休</span>';
    if(code===3||code===8)return '<span class="teacher-cell-status free">可排</span>';
    if(code===5)return '<span class="teacher-cell-status blocked">未到排课时间</span>';
    const minutes=[90,100,50,-30,30][(dayIndex+timeIndex+teacherIndex)%5];
    return `<span class="teacher-cell-status busy">${minutes}min/${dayIndex%3===0?'线上/线下':'线上'}</span>`;
  };

  const renderTeacherSearchResults=(query='')=>{
    const course=courses.find(item=>item.id===teacherSearchCourseId);
    const results=document.getElementById('launchTeacherSearchResults');
    if(!course||!results)return;
    const keyword=query.trim().toLowerCase();
    const candidates=course.recommended.filter(teacher=>!keyword||teacher.toLowerCase().includes(keyword));
    const candidateHost=document.getElementById('launchTeacherCandidates');
    const count=document.getElementById('launchTeacherCount');
    count.textContent=String(candidates.length);
    if(!candidates.length){
      teacherSearchSelectedTeacher='';
      candidateHost.innerHTML='<div class="launch-teacher-search-empty">未查询到教师</div>';
      results.innerHTML='<div class="launch-teacher-search-empty">请调整筛选条件后重新匹配</div>';
      return;
    }
    if(!candidates.includes(teacherSearchSelectedTeacher))teacherSearchSelectedTeacher=candidates[0];
    const lessonCount=Math.round(course.hours/course.duration);
    candidateHost.innerHTML=candidates.map(teacher=>{const relationship=teacherRelation(course,teacher);return `<button type="button" class="${teacher===teacherSearchSelectedTeacher?'selected':''}" data-preview-teacher="${escapeHtml(teacher)}"><span>${escapeHtml(teacher)}</span>${relationship?`<em>${escapeHtml(relationship)}</em>`:''}</button>`;}).join('');
    const teacherIndex=Math.max(0,course.recommended.indexOf(teacherSearchSelectedTeacher));
    results.innerHTML=`<div class="teacher-calendar-head teacher-name-head">教师姓名</div><div class="teacher-calendar-head teacher-time-head">上课时段</div>${teacherScheduleDates.map((date,index)=>`<div class="teacher-calendar-head"><b>${date}</b><span>(${teacherWeekdays[index]})</span></div>`).join('')}<div class="teacher-calendar-profile"><span class="teacher-calendar-avatar">${escapeHtml(teacherSearchSelectedTeacher.replace(/（.+/,'').slice(0,1))}</span><b>${escapeHtml(teacherSearchSelectedTeacher)}</b><small>${Math.max(24,48-teacherIndex*6).toFixed(2)}H / ${Math.max(196,376-teacherIndex*62).toFixed(2)}%</small><em>排课需审批</em></div>${teacherScheduleTimes.map((time,timeIndex)=>`<div class="teacher-calendar-time">${time}</div>${teacherScheduleDates.map((date,dayIndex)=>`<div class="teacher-calendar-cell">${teacherScheduleCell(teacherIndex,dayIndex,timeIndex)}</div>`).join('')}`).join('')}`;
  };

  const openTeacherSearch=courseId=>{
    const course=courses.find(item=>item.id===courseId);
    if(!course||!requirementDraft)return;
    teacherSearchCourseId=courseId;
    teacherSearchSelectedTeacher=course.recommended.includes(requirementDraft.teachers[course.id].teacher)?requirementDraft.teachers[course.id].teacher:course.recommended[0];
    document.getElementById('launchTeacherSearchTitle').textContent=`雅思组合排课测试学生-${course.name}-1v1`;
    document.getElementById('launchTeacherSearchContext').innerHTML=`<span>学生姓名：<b>雅思组合排课测试学生</b></span><span>班级课时：<b>${course.hours}</b></span><span>未排课时：<b>${course.hours}</b></span><label>排课科目：<select><option>${escapeHtml(course.name)}</option></select></label><span>课程阶段：<b>AS</b></span><span>时间要求：<b>${(requirementDraft.courses[course.id]||[]).length}</b></span>`;
    document.getElementById('launchTeacherCourseName').textContent=course.name;
    const input=document.getElementById('launchTeacherSearchInput');
    input.value='';
    renderTeacherSearchResults();
    teacherSearchMask.classList.add('show');
    setTimeout(()=>input.focus(),80);
  };

  const closeTeacherSearch=()=>{
    teacherSearchMask.classList.remove('show');
    teacherSearchCourseId='';
  };

  const markRequirementDraftChanged=()=>{
    requirementDraft.changed=true;
    const note=document.getElementById('launchDetailFooterNote');
    if(note)note.textContent='排课要求已调整，保存后将重新校验并生成新方案';
  };
  const syncStoppedRuleState=(rule,stopped)=>{
    if(!rule)return;
    rule.classList.toggle('is-stopped',stopped);
    rule.querySelectorAll('[data-rule-dependent]').forEach(control=>{control.disabled=stopped;});
    if(!stopped&&rule.querySelector('[data-time-control]'))refreshTimeSlotButtons(rule.querySelector('[data-time-control]'));
  };
  const readTimeSlots=control=>[...control.querySelectorAll('[data-time-slot-index]')].map(row=>({
    scope:row.querySelector('[data-time-slot-part="scope"]')?.value.trim()||'',
    start:row.querySelector('[data-time-slot-part="start"]')?.value||'10:30',
    end:row.querySelector('[data-time-slot-part="end"]')?.value||'12:30'
  }));
  const refreshTimeSlotButtons=control=>{
    const buttons=control.querySelectorAll('[data-remove-time-slot]');
    buttons.forEach(button=>{button.disabled=buttons.length<=1;});
  };
  const syncTimeRuleDraft=control=>{
    const modeInput=control.querySelector('[data-time-part="mode"]');
    const courseId=modeInput.dataset.courseId;
    const index=Number(modeInput.dataset.courseRuleIndex);
    requirementDraft.courses[courseId][index][3]=formatTimeRule({mode:modeInput.value,slots:readTimeSlots(control)});
    markRequirementDraftChanged();
  };

  detailMask.addEventListener('click',event=>{
    const addTimeButton=event.target.closest('[data-add-time-slot]');
    if(addTimeButton){
      const control=addTimeButton.closest('[data-time-control]');
      const modeInput=control.querySelector('[data-time-part="mode"]');
      const courseId=modeInput.dataset.courseId;
      const index=Number(modeInput.dataset.courseRuleIndex);
      const list=control.querySelector('.launch-time-slot-list');
      const total=list.querySelectorAll('[data-time-slot-index]').length+1;
      list.insertAdjacentHTML('beforeend',timeSlotRow({scope:'',start:'14:00',end:'16:00'},courseId,index,total-1,true,total));
      refreshTimeSlotButtons(control);
      syncTimeRuleDraft(control);
      list.lastElementChild?.querySelector('[data-time-slot-part="scope"]')?.focus();
      return;
    }
    const removeTimeButton=event.target.closest('[data-remove-time-slot]');
    if(removeTimeButton){
      const control=removeTimeButton.closest('[data-time-control]');
      if(control.querySelectorAll('[data-time-slot-index]').length<=1)return;
      removeTimeButton.closest('[data-time-slot-index]').remove();
      refreshTimeSlotButtons(control);
      syncTimeRuleDraft(control);
      return;
    }
    const queryButton=event.target.closest('[data-query-teacher]');
    if(queryButton){
      openTeacherSearch(queryButton.dataset.queryTeacher);
      return;
    }
    if(event.target.closest('[data-launch-edit-requirements]')){
      requirementDraft=createRequirementDraft();
      renderRequirementDetail(true);
      return;
    }
    if(event.target.closest('[data-launch-cancel-edit]')){
      requirementDraft=createRequirementDraft();
      renderRequirementDetail(false);
      return;
    }
    if(event.target.closest('[data-launch-save-requirements]')){
      saveRequirementsAndRegenerate();
      return;
    }
    if(event.target===detailMask||event.target.closest('[data-launch-detail-close]'))detailMask.classList.remove('show');
  });
  detailMask.addEventListener('change',event=>{
    if(!requirementDraft||!requirementEditing)return;
    if(event.target.dataset.teacherModeChoice){
      const courseId=event.target.dataset.teacherModeChoice;
      const editor=event.target.closest('[data-teacher-editor]');
      const control=editor.querySelector(`[data-specified-teacher-control="${courseId}"]`);
      const input=editor.querySelector(`[data-teacher-name-input="${courseId}"]`);
      const mode=event.target.value;
      if(mode==='recommend')setDraftTeacher(courseId,'recommend','');
      else if(mode==='current')setDraftTeacher(courseId,'current','');
      else{
        control.hidden=false;
        const previous=requirementDraft.teachers[courseId];
        const current=previous.mode==='specified'?previous.teacher:'';
        input.value=current;
        setDraftTeacher(courseId,'specified',current,{syncEditor:false});
        setTimeout(()=>input.focus(),0);
      }
      return;
    }
    if(event.target.dataset.frequencyPart){
      const courseId=event.target.dataset.courseId;
      const index=Number(event.target.dataset.courseRuleIndex);
      const control=event.target.closest('[data-frequency-control]');
      const period=control.querySelector('[data-frequency-part="period"]').value;
      const mode=control.querySelector('[data-frequency-part="mode"]').value;
      const countInput=control.querySelector('[data-frequency-part="count"]');
      const unit=control.querySelector('[data-frequency-unit]');
      if(mode!=='不限制'&&!countInput.value)countInput.value='1';
      if(countInput.value!=='')countInput.value=String(Math.max(0,Math.floor(Number(countInput.value)||0)));
      countInput.hidden=mode==='不限制';
      unit.hidden=mode==='不限制';
      requirementDraft.courses[courseId][index][2]=formatFrequency({period,mode,count:countInput.value});
      requirementDraft.changed=true;
      document.getElementById('launchDetailFooterNote').textContent='排课要求已调整，保存后将重新校验并生成新方案';
      return;
    }
    if(event.target.dataset.timePart==='mode'){
      const control=event.target.closest('[data-time-control]');
      const editor=control.querySelector('.launch-time-slot-editor');
      editor.hidden=event.target.value==='不限制';
      syncTimeRuleDraft(control);
      return;
    }
    if(event.target.dataset.timeSlotPart){
      syncTimeRuleDraft(event.target.closest('[data-time-control]'));
      return;
    }
    const field=Number(event.target.dataset.field);
    const rangePart=event.target.dataset.rangePart;
    if(event.target.dataset.globalIndex!==undefined){
      const index=Number(event.target.dataset.globalIndex);
      if(rangePart){const [start,end]=splitRequirementRange(requirementDraft.global[index][0]);requirementDraft.global[index][0]=joinRequirementRange(rangePart==='start'?event.target.value:start,rangePart==='end'?event.target.value:end);}
      else if(field===2||field===3){
        const value=event.target.value;
        requirementDraft.global[index][field]=value===''?'':String(Math.max(0,Math.floor(Number(value)||0)));
        event.target.value=requirementDraft.global[index][field];
      }else requirementDraft.global[index][field]=event.target.value;
      if(field===1)syncStoppedRuleState(event.target.closest('.launch-structured-rule'),event.target.value==='停排');
    }
    if(event.target.dataset.courseId&&event.target.dataset.courseRuleIndex!==undefined){
      const courseId=event.target.dataset.courseId;
      const index=Number(event.target.dataset.courseRuleIndex);
      if(rangePart){const [start,end]=splitRequirementRange(requirementDraft.courses[courseId][index][0]);requirementDraft.courses[courseId][index][0]=joinRequirementRange(rangePart==='start'?event.target.value:start,rangePart==='end'?event.target.value:end);}
      else requirementDraft.courses[courseId][index][field]=event.target.value;
      if(field===1)syncStoppedRuleState(event.target.closest('.launch-structured-rule'),event.target.value==='停排');
    }
    if(event.target.dataset.teacherRequirement){
      const courseId=event.target.dataset.courseId;
      const value=event.target.dataset.teacherRequirement;
      const values=requirementDraft.teacherRequirements[courseId];
      if(event.target.checked&&!values.includes(value))values.push(value);
      if(!event.target.checked&&values.includes(value))values.splice(values.indexOf(value),1);
    }
    markRequirementDraftChanged();
  });
  detailMask.addEventListener('input',event=>{
    if(!requirementDraft||!requirementEditing)return;
    if(event.target.dataset.globalIndex!==undefined&&(event.target.dataset.field==='2'||event.target.dataset.field==='3')){
      const index=Number(event.target.dataset.globalIndex);
      const field=Number(event.target.dataset.field);
      let value=event.target.value;
      if(value!==''){
        value=String(Math.max(0,Math.floor(Number(value)||0)));
        event.target.value=value;
      }
      requirementDraft.global[index][field]=value;
      requirementDraft.changed=true;
      document.getElementById('launchDetailFooterNote').textContent='排课要求已调整，保存后将重新校验并生成新方案';
      return;
    }
    if(event.target.dataset.frequencyPart==='count'){
      const courseId=event.target.dataset.courseId;
      const index=Number(event.target.dataset.courseRuleIndex);
      const control=event.target.closest('[data-frequency-control]');
      const period=control.querySelector('[data-frequency-part="period"]').value;
      const mode=control.querySelector('[data-frequency-part="mode"]').value;
      let value=event.target.value;
      if(value!==''){
        value=String(Math.max(0,Math.floor(Number(value)||0)));
        event.target.value=value;
      }
      requirementDraft.courses[courseId][index][2]=formatFrequency({period,mode,count:value});
      requirementDraft.changed=true;
      document.getElementById('launchDetailFooterNote').textContent='排课要求已调整，保存后将重新校验并生成新方案';
      return;
    }
    if(event.target.dataset.timeSlotPart){
      syncTimeRuleDraft(event.target.closest('[data-time-control]'));
      return;
    }
    if(!event.target.dataset.teacherNameInput)return;
    const courseId=event.target.dataset.teacherNameInput;
    requirementDraft.teachers[courseId]={mode:'specified',teacher:event.target.value.trim()};
    markTeacherDraftChanged('指定老师已调整，保存后将重新校验并生成新方案');
  });

  teacherSearchMask.addEventListener('click',event=>{
    if(event.target.closest('[data-close-teacher-search]')){
      closeTeacherSearch();
      return;
    }
    const previewButton=event.target.closest('[data-preview-teacher]');
    if(previewButton){
      teacherSearchSelectedTeacher=previewButton.dataset.previewTeacher;
      renderTeacherSearchResults(document.getElementById('launchTeacherSearchInput').value);
      return;
    }
    if(event.target.closest('[data-confirm-teacher-search]')){
      if(!teacherSearchSelectedTeacher){toast('请先选择一位教师');return;}
      const teacher=teacherSearchSelectedTeacher;
      setDraftTeacher(teacherSearchCourseId,'specified',teacher);
      closeTeacherSearch();
      toast(`已指定${teacher}`);
      return;
    }
    if(event.target.closest('[data-run-teacher-search]')){
      renderTeacherSearchResults(document.getElementById('launchTeacherSearchInput').value);
      return;
    }
    if(event.target.closest('[data-teacher-reset]')){
      document.getElementById('launchTeacherSearchInput').value='';
      teacherSearchMask.querySelectorAll('select').forEach(select=>select.selectedIndex=0);
      teacherSearchMask.querySelectorAll('input[type="checkbox"]').forEach(input=>input.checked=true);
      renderTeacherSearchResults();
      toast('筛选条件已重置');
      return;
    }
    if(event.target.closest('[data-teacher-clear]')){
      document.getElementById('launchTeacherSearchInput').value='';
      teacherSearchMask.querySelectorAll('select').forEach(select=>select.selectedIndex=0);
      teacherSearchMask.querySelectorAll('input[type="checkbox"]').forEach(input=>input.checked=false);
      renderTeacherSearchResults();
      toast('筛选条件已清空');
      return;
    }
    if(event.target.closest('[data-teacher-schedule-reset]')){
      toast('日程查询条件已重置');
      return;
    }
    if(event.target.closest('[data-teacher-query-schedule]')){
      toast(`已更新${teacherSearchSelectedTeacher||'教师'}日程`);
    }
  });
  document.getElementById('launchTeacherSearchInput').addEventListener('keydown',event=>{
    if(event.key==='Enter'){
      event.preventDefault();
      renderTeacherSearchResults(event.target.value);
    }
  });
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    if(teacherSearchMask.classList.contains('show'))closeTeacherSearch();
    else if(detailMask.classList.contains('show'))detailMask.classList.remove('show');
  });

  function showRequirementDetail() {
    requirementDraft=createRequirementDraft();
    renderRequirementDetail(false);
    detailMask.classList.add('show');
  }

  function saveRequirementsAndRegenerate() {
    const missingTeacherCourse=courses.find(course=>{
      const teacher=requirementDraft?.teachers[course.id];
      return teacher?.mode==='specified'&&!teacher.teacher.trim();
    });
    if(missingTeacherCourse){
      toast(`请输入或查询选择${missingTeacherCourse.name}的授课老师`);
      detailMask.querySelector(`[data-teacher-name-input="${missingTeacherCourse.id}"]`)?.focus();
      return;
    }
    const previousVersion=currentScheduleVersion();
    globalRequirements.splice(0,globalRequirements.length,...requirementDraft.global.map(item=>[...item]));
    Object.keys(courseRequirements).forEach(courseId=>{courseRequirements[courseId]=requirementDraft.courses[courseId].map(item=>[...item]);});
    courses.forEach(course=>{
      course.requirements.splice(0,course.requirements.length,...requirementDraft.teacherRequirements[course.id]);
      course.requirement=course.requirements.join('、');
      selections[course.id]={...requirementDraft.teachers[course.id]};
      if(selections[course.id].mode==='recommend')selections[course.id].teacher=course.recommended[0];
    });
    detailMask.classList.remove('show');
    const overlay=document.getElementById('strategyLoadingOverlay');
    const title=overlay.querySelector('h3');
    const stage=overlay.querySelector('.ai-loading-stage');
    title.textContent='正在重新生成排课方案';
    stage.textContent='正在校验修改后的排课要求';
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden','false');
    loadingTimers.forEach(clearTimeout);
    loadingTimers=[
      setTimeout(()=>stage.textContent='正在重新校验授课老师与可排时间',650),
      setTimeout(()=>stage.textContent='正在进行多课程联合排课与冲突校验',1250),
      setTimeout(()=>{
        const generatedLessons=generateSchedule();
        if(previousVersion)previousVersion.savedBeforeRegeneration=true;
        const nextNumber=scheduleVersions.length+1;
        const newVersion={
          id:`plan-${nextNumber}`,
          name:`方案${nextNumber}`,
          generatedAt:formatGeneratedAt(new Date()),
          lessons:generatedLessons.map(item=>({...item})),
          teachers:cloneTeacherSelections(selections),
          requirements:snapshotRequirements(requirementDraft.interpretations)
        };
        scheduleVersions.push(newVersion);
        activeScheduleVersion=newVersion.id;
        lessons=newVersion.lessons;
        renderResult();
        overlay.classList.remove('show');
        overlay.setAttribute('aria-hidden','true');
        openPage('step5');
        toast(`${newVersion.name}已生成，${previousVersion?previousVersion.name:'原方案'}已保存为历史版本`);
      },1900)
    ];
  }

  openButton.addEventListener('click',event=>{
    event.preventDefault();
    event.stopImmediatePropagation();
    renderIntake();
    openPage('step1');
  },true);

  renderIntake();
})();

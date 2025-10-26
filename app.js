/* ===== Utilities ===== */
const dFmt = (d)=>new Date(d).toISOString().slice(0,10);
const today = ()=>dFmt(new Date());
const timeNow = ()=>new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
const parseHM = (t)=>{ if(!t||t==='--') return 0; const [h,m] = t.replace(/\s*[APMapm\.]*/,'').split(':').map(Number); return h + m/60; };
const qs = (s)=>document.querySelector(s);

/* ===== Seed Data (runs once) ===== */
(function seed(){
  if(!localStorage.getItem('users')){
    const users = [
      {name:'Admin',email:'admin@attendancehub.com',password:'admin123',role:'admin'},
      {name:'John Doe',email:'john@company.com',password:'12345',role:'employee'},
      {name:'Sarah Lee',email:'sarah@company.com',password:'12345',role:'employee'},
      {name:'Raj Kumar',email:'raj@company.com',password:'12345',role:'employee'},
      {name:'Priya Singh',email:'priya@company.com',password:'12345',role:'employee'},
      {name:'Daniel Smith',email:'daniel@company.com',password:'12345',role:'employee'},
    ];
    localStorage.setItem('users', JSON.stringify(users));
  }
  if(!localStorage.getItem('attendance')){
    // simple demo logs for last 3 days for some users
    const logs = [];
    const emails = ['john@company.com','sarah@company.com','raj@company.com','priya@company.com','daniel@company.com'];
    for(let i=1;i<=3;i++){
      const day = new Date(); day.setDate(day.getDate()-i);
      emails.forEach((e,idx)=>{
        if(idx%5===4) return; // one person absent
        logs.push({email:e,date:dFmt(day),name:e.split('@')[0],
                   checkIn:'09:1'+idx+' AM',checkOut:'05:2'+idx+' PM',totalHours:8+Math.round(Math.random()*10)/10});
      });
    }
    localStorage.setItem('attendance', JSON.stringify(logs));
  }
  if(!localStorage.getItem('leaves')){
    const leaves = [
      {email:'daniel@company.com',name:'Daniel Smith',reason:'Medical',date:today(),status:'Pending'},
      {email:'raj@company.com',name:'Raj Kumar',reason:'Personal',date:today(),status:'Pending'}
    ];
    localStorage.setItem('leaves', JSON.stringify(leaves));
  }
  if(!localStorage.getItem('theme')) localStorage.setItem('theme','light');
})();

/* ===== Theme ===== */
(function initTheme(){
  if(localStorage.getItem('theme')==='dark') document.body.classList.add('dark');
})();
function toggleTheme(){
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark':'light');
}

/* ===== Sidebar Toggle (mobile) ===== */
function toggleSide(){ const sb = document.getElementById('sidebar'); if(sb) sb.classList.toggle('open'); }

/* ===== Auth ===== */
function signup(){
  const name = qs('#signupName').value.trim();
  const email = qs('#signupEmail').value.trim();
  const password = qs('#signupPassword').value.trim();
  const errEl = qs('#signupError');
  if(!name||!email||!password){ errEl.textContent='Please fill all fields.'; return; }
  const users = JSON.parse(localStorage.getItem('users'));
  if(users.some(u=>u.email===email)){ errEl.textContent='Email already exists.'; return; }
  users.push({name,email,password,role:'employee'});
  localStorage.setItem('users', JSON.stringify(users));
  alert('Signup successful. Please login.');
  window.location.href='index.html';
}
function login(){
  const email = qs('#loginEmail').value.trim();
  const password = qs('#loginPassword').value.trim();
  const role = qs('#loginRole').value;
  const users = JSON.parse(localStorage.getItem('users'));
  const user = users.find(u=>u.email===email && u.password===password && u.role===role);
  if(!user){ qs('#loginError').textContent='Invalid credentials.'; return; }
  localStorage.setItem('currentUser', JSON.stringify(user));
  window.location.href = role==='admin' ? 'admin-dashboard.html' : 'employee-dashboard.html';
}
function logout(){ localStorage.removeItem('currentUser'); window.location.href='index.html'; }

/* ===== Navigation (section switching) ===== */
document.addEventListener('click', (e)=>{
  const a = e.target.closest('a[data-target]');
  if(!a) return;
  e.preventDefault();
  const target = a.getAttribute('data-target');
  const container = a.closest('.app')?.querySelector('.main');
  if(!container) return;
  // set active nav
  a.closest('.nav').querySelectorAll('a').forEach(x=>x.classList.remove('active'));
  a.classList.add('active');
  // show section
  container.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  const section = container.querySelector('#'+target);
  if(section) section.classList.add('active');
});

/* ===== Employee Dashboard Logic ===== */
function getUser(){ try{return JSON.parse(localStorage.getItem('currentUser'))}catch{return null} }
function getAttendance(){ return JSON.parse(localStorage.getItem('attendance'))||[] }
function setAttendance(arr){ localStorage.setItem('attendance', JSON.stringify(arr)) }
function getLeaves(){ return JSON.parse(localStorage.getItem('leaves'))||[] }
function setLeaves(arr){ localStorage.setItem('leaves', JSON.stringify(arr)) }

function initEmployee(){
  const user = getUser(); if(!user || user.role!=='employee'){ return; }
  // greeting
  const hello = qs('#helloUser'); if(hello) hello.textContent = `Welcome, ${user.name.split(' ')[0]}`;
  // render today state
  syncEmployeeUI();
  // fill tables
  renderEmpAttendance();
  renderEmpLeaves();
  // reminders
  smartReminders();
}
function smartReminders(){
  const now = new Date();
  const h = now.getHours();
  const logs = getAttendance();
  const user = getUser();
  const todayLog = logs.find(l=>l.email===user.email && l.date===today());
  if(h>=10 && !todayLog?.checkIn) alert('Reminder: You have not checked in yet (after 10:00 AM).');
  if(h>=20 && todayLog?.checkIn && !todayLog?.checkOut) alert('Reminder: Please check out (after 8:00 PM).');
}
function empCheckIn(){
  const user = getUser();
  const logs = getAttendance();
  let todayLog = logs.find(l=>l.email===user.email && l.date===today());
  if(todayLog && todayLog.checkIn){ alert('Already checked in today.'); return; }
  if(!todayLog){ todayLog = {email:user.email,name:user.name,date:today(),checkIn:'',checkOut:'',totalHours:0}; logs.push(todayLog); }
  todayLog.checkIn = timeNow();
  setAttendance(logs);
  syncEmployeeUI(); renderEmpAttendance();
}
function empCheckOut(){
  const user = getUser();
  const logs = getAttendance();
  let todayLog = logs.find(l=>l.email===user.email && l.date===today());
  if(!todayLog || !todayLog.checkIn){ alert('Please check in first.'); return; }
  if(todayLog.checkOut){ alert('Already checked out.'); return; }
  todayLog.checkOut = timeNow();
  // naive total hours (display only)
  todayLog.totalHours = Math.max(0,(parseHM(todayLog.checkOut)-parseHM(todayLog.checkIn))).toFixed(2);
  setAttendance(logs);
  syncEmployeeUI(); renderEmpAttendance();
}
function syncEmployeeUI(){
  const user = getUser(); if(!user) return;
  const logs = getAttendance();
  const log = logs.find(l=>l.email===user.email && l.date===today());
  qs('#todayStatus') && (qs('#todayStatus').textContent = log?.checkIn ? (log.checkOut?'Checked out':'Checked in') : 'Not checked in');
  qs('#checkInTime') && (qs('#checkInTime').textContent = log?.checkIn || '--:--');
  qs('#checkOutTime') && (qs('#checkOutTime').textContent = log?.checkOut || '--:--');
  // week hours (simple sum last 7 days)
  const since = new Date(); since.setDate(since.getDate()-6);
  const week = getAttendance().filter(l=>l.email===user.email && new Date(l.date)>=since);
  const hrs = week.reduce((s,l)=>s + (parseFloat(l.totalHours)||0), 0).toFixed(1);
  qs('#weekHours') && (qs('#weekHours').textContent = `${hrs} h`);
}
function renderEmpAttendance(){
  const user = getUser(); if(!user) return;
  const from = qs('#empFrom')?.value, to = qs('#empTo')?.value;
  const rows = getAttendance()
    .filter(l=>l.email===user.email)
    .filter(l=>!from || l.date>=from)
    .filter(l=>!to || l.date<=to)
    .sort((a,b)=>a.date<b.date?1:-1)
    .map(l=>`<tr><td>${l.date}</td><td>${l.checkIn||'--'}</td><td>${l.checkOut||'--'}</td><td>${l.totalHours||'--'}</td></tr>`).join('');
  const tbody = qs('#empAttendanceTbody'); if(tbody) tbody.innerHTML = rows || `<tr><td colspan="4">No records</td></tr>`;
}
function submitLeave(){
  const user = getUser(); if(!user) return;
  const reason = qs('#leaveReason').value.trim();
  const date = qs('#leaveDate').value;
  if(!reason || !date){ alert('Enter reason and date'); return; }
  const arr = getLeaves();
  arr.push({email:user.email,name:user.name,reason,date,status:'Pending'});
  setLeaves(arr);
  qs('#leaveReason').value=''; qs('#leaveDate').value='';
  renderEmpLeaves();
  alert('Leave request submitted.');
}
function renderEmpLeaves(){
  const user = getUser(); if(!user) return;
  const tbody = qs('#empLeavesTbody');
  if(!tbody) return;
  const rows = getLeaves().filter(l=>l.email===user.email)
    .sort((a,b)=>a.date<b.date?1:-1)
    .map(l=>`<tr><td>${l.date}</td><td>${l.reason}</td><td><span class="badge ${l.status==='Approved'?'green':l.status==='Rejected'?'red':'gray'}">${l.status}</span></td></tr>`).join('');
  tbody.innerHTML = rows || `<tr><td colspan="3">No leave requests</td></tr>`;
}
function saveProfile(){
  const user = getUser(); if(!user) return;
  const name = qs('#profName').value.trim() || user.name;
  const pass = qs('#profPassword').value.trim();
  const users = JSON.parse(localStorage.getItem('users'));
  const idx = users.findIndex(u=>u.email===user.email);
  users[idx].name = name; if(pass) users[idx].password = pass;
  localStorage.setItem('users', JSON.stringify(users));
  localStorage.setItem('currentUser', JSON.stringify(users[idx]));
  alert('Profile updated.');
}

/* ===== Admin Dashboard Logic ===== */
function initAdmin(){
  const user = getUser(); if(!user || user.role!=='admin'){ return; }
  renderEmployeeTable();
  renderAdminAttendance();
  renderAdminLeaves();
  renderKPIs();
}
function renderKPIs(){
  const logs = getAttendance();
  const todayLogs = logs.filter(l=>l.date===today() && l.checkIn);
  const presentCount = new Set(todayLogs.map(l=>l.email)).size;
  const avg = logs.length ? (logs.reduce((s,l)=>s+(parseFloat(l.totalHours)||0),0)/logs.filter(l=>l.totalHours).length||0).toFixed(1):0;
  const pending = getLeaves().filter(l=>l.status==='Pending').length;
  const users = JSON.parse(localStorage.getItem('users')).filter(u=>u.role==='employee').length;
  const compliance = users? Math.round((presentCount/users)*100):0;
  qs('#kpiPresent')&&(qs('#kpiPresent').textContent=presentCount);
  qs('#kpiAvg')&&(qs('#kpiAvg').textContent=`${avg} h`);
  qs('#kpiPending')&&(qs('#kpiPending').textContent=pending);
  qs('#kpiCompliance')&&(qs('#kpiCompliance').textContent=`${isNaN(compliance)?0:compliance}%`);
}
function renderEmployeeTable(){
  const q = (qs('#empSearch')?.value||'').toLowerCase();
  const users = JSON.parse(localStorage.getItem('users')).filter(u=>u.role!=='admin');
  const tbody = qs('#adminEmployeesTbody'); if(!tbody) return;
  const rows = users
    .filter(u=>u.name.toLowerCase().includes(q)||u.email.toLowerCase().includes(q))
    .map(u=>{
      const todayLog = getAttendance().find(l=>l.email===u.email && l.date===today());
      const badge = todayLog?.checkIn ? `<span class="badge green">Present</span>` : `<span class="badge gray">N/A</span>`;
      return `<tr><td>${u.name}</td><td>${u.email}</td><td>${u.role}</td><td>${badge}</td></tr>`;
    }).join('');
  tbody.innerHTML = rows || `<tr><td colspan="4">No employees found</td></tr>`;
}
function renderAdminAttendance(){
  const from = qs('#attFrom')?.value, to = qs('#attTo')?.value, email = (qs('#attByEmail')?.value||'').trim().toLowerCase();
  const tbody = qs('#adminAttendanceTbody'); if(!tbody) return;
  const users = JSON.parse(localStorage.getItem('users'));
  const rows = getAttendance()
    .filter(l=>!from || l.date>=from)
    .filter(l=>!to || l.date<=to)
    .filter(l=>!email || l.email.toLowerCase().includes(email))
    .sort((a,b)=>a.date<b.date?1:-1)
    .map(l=>{
      const name = users.find(u=>u.email===l.email)?.name || l.name || l.email;
      return `<tr><td>${l.date}</td><td>${l.email}</td><td>${name}</td><td>${l.checkIn||'--'}</td><td>${l.checkOut||'--'}</td><td>${l.totalHours||'--'}</td></tr>`;
    }).join('');
  tbody.innerHTML = rows || `<tr><td colspan="6">No attendance records</td></tr>`;
}
function renderAdminLeaves(){
  const tbody = qs('#adminLeavesTbody'); if(!tbody) return;
  const rows = getLeaves().sort((a,b)=>a.status>b.status?1:-1).map((l,i)=>{
    const cls = l.status==='Approved'?'green':l.status==='Rejected'?'red':'gray';
    const act = l.status==='Pending'
      ? `<button class="btn-sm btn-approve" onclick="approveLeave(${i})">Approve</button>
         <button class="btn-sm btn-reject" onclick="rejectLeave(${i})">Reject</button>`
      : `<span class="badge ${cls}">${l.status}</span>`;
    return `<tr><td>${l.name}</td><td>${l.email}</td><td>${l.reason}</td><td>${l.date}</td><td><span class="badge ${cls}">${l.status}</span></td><td>${act}</td></tr>`;
  }).join('');
  tbody.innerHTML = rows || `<tr><td colspan="6">No leave requests</td></tr>`;
}
function approveLeave(i){ const arr=getLeaves(); arr[i].status='Approved'; setLeaves(arr); renderAdminLeaves(); renderEmpLeaves(); }
function rejectLeave(i){ const arr=getLeaves(); arr[i].status='Rejected'; setLeaves(arr); renderAdminLeaves(); renderEmpLeaves(); }

/* ===== Export / Backup ===== */
function exportCSV(){
  const rows = [['Date','Email','Name','Check-In','Check-Out','TotalHours']];
  const users = JSON.parse(localStorage.getItem('users'));
  getAttendance().forEach(l=>{
    const name = users.find(u=>u.email===l.email)?.name || l.name || '';
    rows.push([l.date,l.email,name,l.checkIn||'',l.checkOut||'',l.totalHours||'']);
  });
  const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  downloadFile('attendance.csv', 'text/csv', csv);
}
function backupJSON(){
  const dump = {
    users: JSON.parse(localStorage.getItem('users')||'[]'),
    attendance: getAttendance(),
    leaves: getLeaves(),
    theme: localStorage.getItem('theme')||'light'
  };
  downloadFile('attendancehub-backup.json','application/json',JSON.stringify(dump,null,2));
}
function restoreJSON(evt){
  const file = evt.target.files[0]; if(!file) return;
  const rd = new FileReader();
  rd.onload = () => {
    try{
      const data = JSON.parse(rd.result);
      if(data.users) localStorage.setItem('users', JSON.stringify(data.users));
      if(data.attendance) setAttendance(data.attendance);
      if(data.leaves) setLeaves(data.leaves);
      if(data.theme) localStorage.setItem('theme', data.theme);
      alert('Restore complete.');
      // refresh admin views if open
      renderEmployeeTable(); renderAdminAttendance(); renderAdminLeaves(); renderKPIs(); renderEmpAttendance(); renderEmpLeaves(); syncEmployeeUI();
    }catch(e){ alert('Invalid JSON.'); }
  };
  rd.readAsText(file);
}
function downloadFile(filename, mime, content){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content],{type:mime}));
  a.download = filename; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 500);
}

/* ===== Page Boot ===== */
window.addEventListener('DOMContentLoaded', ()=>{
  const user = getUser();
  // protect routes (basic)
  if(location.pathname.endsWith('admin-dashboard.html') && (!user || user.role!=='admin')) location.replace('index.html');
  if(location.pathname.endsWith('employee-dashboard.html') && (!user || user.role!=='employee')) location.replace('index.html');

  // init per page
  if(location.pathname.endsWith('employee-dashboard.html')) initEmployee();
  if(location.pathname.endsWith('admin-dashboard.html')) initAdmin();

  // fill profile defaults
  if(qs('#profName')){ const u=getUser(); qs('#profName').value = u?.name||''; }
});

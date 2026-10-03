'use strict';
const eligible=user=>user?.status==='approved'&&(user.role==='admin'||user.role==='ambassador'||user.role==='member'&&!!user.cabinetPosition);
function taskInput(input,db,admin,fail,existing){
 const assignee=db.users.find(u=>u.id===input.assigneeId)||(input.assigneeId===admin.id?admin:null);
 if(!eligible(assignee))fail(400,'Assign work to an approved cabinet member, ambassador or administrator.');
 const title=String(input.title||'').trim().slice(0,150),description=String(input.description||'').trim().slice(0,5000);
 if(!title||!description)fail(400,'Add a task title and instructions.');
 if(!['daily','event','general'].includes(input.type))fail(400,'Choose a valid task type.');
 if(!['todo','in-progress','submitted','completed','rejected'].includes(input.status||'todo'))fail(400,'Choose a valid task status.');
 if(input.dueDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate)||!Number.isFinite(Date.parse(input.dueDate))))fail(400,'Choose a valid due date.');
 if(input.eventId&&!db.content.collections.events.some(e=>String(e.id)===String(input.eventId)))fail(400,'Choose an existing event.');
 if(input.aiWrittenReport===true&&!existing?.reportLink)fail(400,'Review a submitted PDF report before rejecting it as AI-written.');
 const reassigned=existing&&existing.assigneeId!==assignee.id;
 return {...existing,...(reassigned?{submission:'',evidenceLink:'',reportLink:'',aiWrittenReport:false,marks:null}:{}),title,description,assigneeId:assignee.id,assigneeName:assignee.name,type:input.type,dueDate:input.dueDate||'',eventId:input.eventId||'',status:reassigned?'todo':input.aiWrittenReport===true?'rejected':input.status||'todo',aiWrittenReport:!reassigned&&input.aiWrittenReport===true,marks:!reassigned&&input.aiWrittenReport===true?0:null,reviewNote:String(input.reviewNote||'').trim().slice(0,2000),updatedAt:new Date().toISOString()};
}
module.exports={eligible,taskInput};

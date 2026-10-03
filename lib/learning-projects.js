'use strict';
const STARTER='starter-project';
const REPORT_POLICY="Submit a PDF report in Google Drive for every task. In your own words, explain what you did, what you learned and the result. Your marks are based on both the task you performed and the report you submitted. AI-written reports receive zero marks, the task is rejected, and no certificate or award is issued.";
const defaults=[
 {id:STARTER,title:'Your first five lines of Python',summary:'Calculate one average. Explain it in a short report.',level:'Starter',duration:'20 minutes',guidelines:'Use these fictional study hours: 2, 3, 1, 4, 5.\n\nCreate a Python list, calculate its average, and print the result. You can use a notebook or a simple script.\n\nWrite a short report: state the question, show your result, and explain why five fictional days cannot represent every student. One page is enough.\n\nSubmit two links: your GitHub repository (or a Drive file containing your work) and your report PDF in Google Drive. Give the reviewer permission to view both links.',deliverables:'A script or notebook calculating the average; a short report PDF.',benefits:'',published:true},
 {id:'dataset-project',title:'Make a messy dataset useful',summary:'Clean a small dataset and explain your decisions.',level:'Beginner',duration:'2–3 hours',guidelines:'Choose a small fictional or openly licensed dataset. Record its source and permission. Identify missing values, duplicates and inconsistent units.\n\nBuild a reproducible cleaning notebook. Explain each change rather than silently removing rows. Compare one summary before and after cleaning.\n\nWrite a report covering your question, data source, cleaning decisions, result and limitations. Submit your GitHub project and a Drive report PDF.',deliverables:'Cleaning notebook, sample data, README and report PDF.',benefits:'Completion certificate after administrator approval; written feedback.',published:true},
 {id:'dashboard-project',title:'Build a dashboard with a story',summary:'Turn a dataset into three useful views.',level:'Intermediate',duration:'4–6 hours',guidelines:'Choose a question relevant to student life using fictional or openly licensed data. Define three views that answer different parts of it.\n\nBuild a small dashboard or reproducible notebook with readable labels and units. Document your data checks and include instructions to reproduce the output.\n\nWrite a report explaining the audience, question, design decisions, findings and limitations. Submit a GitHub project (or Drive deliverable) and a Drive report PDF.',deliverables:'Dashboard or notebook, data-source notes, README and report PDF.',benefits:'Completion certificate after administrator approval; portfolio feedback.',published:true},
 {id:'research-project',title:'Investigate a question with data',summary:'Design a small investigation and defend its conclusion.',level:'Intermediate',duration:'1 week',guidelines:'Agree on a focused question with your administrator. Use data you are permitted to analyse. Describe how it was collected and what it cannot represent.\n\nExplore the data, show at least two meaningful analyses, and test one alternative explanation. Make your work reproducible.\n\nWrite a report with your method, findings, limitations and references. Submit a GitHub project (or Drive deliverable) and a Drive report PDF.',deliverables:'Reproducible analysis, references, README and report PDF.',benefits:'Completion certificate after administrator approval; reviewed research practice.',published:true},
 {id:'prediction-project',title:'Build a model you can evaluate',summary:'Compare a prediction model with a simple baseline.',level:'Advanced',duration:'1 week',guidelines:'Use a suitable, permitted dataset. Separate training and test data before fitting a model. Define a simple baseline and an evaluation metric.\n\nTrain a model and compare its test results with the baseline. Check for leakage and explain errors. More complexity is not automatically better.\n\nWrite a report explaining the data, split, baseline, model, evaluation and limitations. Submit a GitHub project and a Drive report PDF.',deliverables:'Training notebook, reproducible evaluation, README and report PDF.',benefits:'Completion certificate after administrator approval; model-review feedback.',published:true}
];
const memberEligible=u=>u?.status==='approved'&&u.role==='member';
const assignmentFor=(db,user,id)=>(db.coursework||[]).find(a=>a.userId===user?.id&&a.projectId===String(id)&&a.access==='assigned');
const canOpen=(db,user,course)=>user?.role==='admin'&&user.status==='approved'||course?.id===STARTER||memberEligible(user)&&!!assignmentFor(db,user,course?.id);
function normalizeProjects(content){
 content.collections.learningProjects ||= structuredClone(defaults);
 if(content._assessmentPolicyVersion!==1){for(const project of content.collections.learningProjects)if(project)project.assessmentPolicy ||= REPORT_POLICY;content._assessmentPolicyVersion=1;}
 if(content._learningStudioVersion===1)return;
 content.portal ||= {};
 if(!content.portal.gameHeading||content.portal.gameHeading==='Can you spot the outlier?')content.portal.gameHeading='Train the signal. Beat the noise.';
 if(!content.portal.gameDescription||content.portal.gameDescription==='One point breaks the pattern. Choose it and discover why it matters.')content.portal.gameDescription='Build a classifier across three missions. Your real score comes from data you have not seen.';
 content.portal.learningHeading='Your project studio';
 content.pageHeaders ||= {};content.pageHeaders.start={...content.pageHeaders.start,title:'Start small. Build something.',desc:'One open project. A member pathway with personal assignments and feedback.'};
 for(const page of ['index','start'])for(const [id,props]of Object.entries(content.pages?.[page]||{}))if(id==='cms-index-link-7'||id==='cms-index-link-1'||id.endsWith('-start-navigation'))props.href='start.html';
 if(content.heroSection?.primaryCtaText==='Start learning')content.heroSection.primaryCtaLink='start.html';
 content._learningStudioVersion=1;
}
function validateProjects(content,fail){
 const courses=content.collections.learningProjects;
 if(!Array.isArray(courses)||!courses.some(c=>c?.id===STARTER))fail(400,'Keep the open starter project in the project studio.');
 for(const c of courses){if(!c||typeof c.id!=='string'||!/^[-\w]{1,80}$/.test(c.id)||typeof c.title!=='string'||!c.title.trim()||typeof c.guidelines!=='string'||!c.guidelines.trim()||typeof c.published!=='boolean')fail(400,'Every learning project needs a title, guidelines and a publication setting.');if(c.id===STARTER&&(c.published!==true||c.benefits))fail(400,'The starter project stays open and does not award certificates or member benefits.');}
}
function link(value,kind,fail){
 let url;try{url=new URL(String(value||'').trim());}catch{fail(400,kind==='report'?'Add a Google Drive report link.':'Add a GitHub project or Google Drive work link.');}
 const hosts=kind==='report'?['drive.google.com','docs.google.com']:['github.com','drive.google.com','docs.google.com'];
 if(url.protocol!=='https:'||!hosts.includes(url.hostname.toLowerCase())||url.username||url.password||url.port||url.pathname==='/')fail(400,kind==='report'?'Use an HTTPS Google Drive report link.':'Use an HTTPS GitHub repository or Google Drive work link.');
 return url.href.slice(0,2000);
}
function publicAssignment(a){const {sourceUrl,...certificate}=a.certificate||{};return {...a,certificate:a.certificate?{...certificate,downloadUrl:'/api/member/certificate?id='+encodeURIComponent(a.id)}:null};}
module.exports={STARTER,REPORT_POLICY,normalizeProjects,validateProjects,memberEligible,assignmentFor,canOpen,link,publicAssignment};

'use strict';
const defaults={
 reportPolicy:require('./learning-projects').REPORT_POLICY,
 studentTitle:'Learning dashboard',studentHeading:'What will you learn today?',studentDescription:'Your space to learn, build and connect with students across Pakistan.',
 memberTitle:'Society workspace',memberHeading:'Make your next contribution.',memberDescription:'Work with the society, share your ideas and follow opportunities.',
 ambassadorTitle:'Campus workspace',ambassadorHeading:'Bring your campus together.',ambassadorDescription:'Lead your campus. Share opportunities. Help your community grow.',
 studentLibraryEnabled:true,studentEventsEnabled:true,memberLibraryEnabled:true,memberEventsEnabled:true,memberContributionsEnabled:true,
 ambassadorLibraryEnabled:true,ambassadorEventsEnabled:true,ambassadorContributionsEnabled:true,ambassadorActivitiesEnabled:true,
 loginHeading:'Welcome back.',loginDescription:'Your people. Your projects. Your next possibility.',
 studentOverviewLabel:'My learning',memberOverviewLabel:'Member overview',ambassadorOverviewLabel:'Campus overview',
 studentLibraryHeading:'Pick up something new.',studentLibraryDescription:'A few places to begin.',
 studentApplicationHeading:'Ready to contribute?',studentApplicationDescription:'Apply for society membership or represent your campus.'
};
function adminLink(value){try{return /^\/(?:admin(?:\.html|\/|-login\.html)?|build(?:\.html|\/)?)$/i.test(new URL(String(value),'https://dss.local/').pathname);}catch{return false;}}
function normalizeContent(content){
 content.portal={...defaults,...content.portal};
 require('./student-experience').improveContent(content);
 require('./learning-projects').normalizeProjects(content);
 require('./application-config').normalizeApplications(content);
 if(content.collections?.navigation)content.collections.navigation=content.collections.navigation.filter(item=>!adminLink(item.link));
 return content;
}
module.exports={defaults,adminLink,normalizeContent};

'use strict';
const question = (id, label, type = 'text', required = true, extra = {}) => ({ id, label, type, required, ...extra });
const defaults = {
  membership: { enabled: false, questions: [
    question('university', 'University / institution'), question('interest', 'Your interests'),
    question('motivation', 'How would you like to contribute?', 'textarea', true, { minLength: 20 })
  ] },
  ambassador: { enabled: false, questions: [
    question('university', 'University / institution'), question('studentId', 'University student ID'),
    question('major', 'Degree programme'), question('phone', 'Mobile / WhatsApp number'),
    question('city', 'Campus city'), question('province', 'Province / region'), question('semester', 'Current semester'),
    question('cnic', 'CNIC / B-form number'), question('availability', 'Weekly commitment'),
    question('portfolio', 'LinkedIn / portfolio URL', 'text', false),
    question('experience', 'Leadership or volunteering experience', 'textarea', false),
    question('pitch', 'What would you organise in your first month?', 'textarea', true, { minLength: 30 }),
    question('consent', 'I confirm these details are accurate and consent to application review.', 'yesno', true, { mustBeYes: true })
  ] }
};
function normalizeApplications(content) {
  if(content.applications===undefined)content.applications={};
  if(!content.applications||typeof content.applications!=='object'||Array.isArray(content.applications))return;
  for (const type of Object.keys(defaults)) content.applications[type] = { ...structuredClone(defaults[type]), ...content.applications[type] };
}
function validateApplications(config, fail) {
  if (!config || typeof config!=='object' || Array.isArray(config) || Object.keys(config).some(k => !Object.hasOwn(defaults, k))) fail(400, 'Choose membership or ambassador applications.');
  for (const type of Object.keys(defaults)) {
    const form = config[type], ids = new Set();
    if (!form || typeof form.enabled !== 'boolean' || !Array.isArray(form.questions) || form.questions.length > 50) fail(400, 'Use on/off settings and up to 50 questions per application.');
    for (const q of form.questions) {
      if (!q || typeof q.id !== 'string' || !/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/.test(q.id) || ['constructor','prototype','__proto__'].includes(q.id) || ids.has(q.id)) fail(400, 'Every question needs a unique safe ID.');
      ids.add(q.id);
      if (typeof q.label !== 'string' || !q.label.trim() || q.label.length > 500 || !['text','textarea','yesno'].includes(q.type) || typeof q.required !== 'boolean') fail(400, 'Enter a question and choose text, long answer, or yes/no.');
      if (q.minLength !== undefined && (!Number.isInteger(q.minLength) || q.minLength < 0 || q.minLength > 5000)) fail(400, 'Minimum answer length must be between 0 and 5000.');
      if (q.mustBeYes !== undefined && (typeof q.mustBeYes !== 'boolean' || q.mustBeYes && q.type !== 'yesno')) fail(400, 'Require Yes only for a yes/no question.');
    }
  }
}
function applicationAnswers(config, input, fail) {
  if (!config.enabled) fail(403, 'Applications are currently closed.');
  const source = input.answers && typeof input.answers === 'object' && !Array.isArray(input.answers) ? input.answers : input;
  const answers = {}, profile = {};
  for (const q of config.questions) {
    let value = source[q.id];
    if (q.type === 'yesno') {
      if (value === 'yes') value = true;
      if (value === 'no') value = false;
      if (value !== true && value !== false) { if (q.required) fail(400, 'Answer: ' + q.label); value = null; }
      if (q.mustBeYes && value !== true) fail(400, 'Please confirm: ' + q.label);
    } else {
      if (value !== undefined && typeof value !== 'string') fail(400, 'Enter text for: ' + q.label);
      value = String(value ?? '').trim();
      if (value.length > 5000 || (q.required && !value) || (value && value.length < (q.minLength || 0))) fail(400, 'Complete: ' + q.label);
      if (value && q.id === 'portfolio' && !/^https?:\/\//i.test(value)) fail(400, 'Use a full website URL for your portfolio.');
    }
    answers[q.id] = { label: q.label, value };
    if (['university','studentId','major','phone','interest','motivation','city','province','semester','cnic','pitch','experience','availability','portfolio'].includes(q.id)) profile[q.id] = value;
  }
  return { answers, profile };
}
module.exports = { defaults, normalizeApplications, validateApplications, applicationAnswers };

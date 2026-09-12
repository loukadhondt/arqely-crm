import { test } from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'
import { readFileSync } from 'node:fs'
const code = ts.transpileModule(readFileSync(new URL('../src/lib/actionOverview.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const { buildActions } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'))
const now = new Date('2026-09-12T12:00:00')
const run = (tasks=[],deals=[],contacts=[],subs=[],locale='fr') => buildActions(tasks,deals,contacts,subs,locale,now)
test('Only pending tasks count, including undated tasks', () => {
  assert.deepEqual(run([{id:'a',title:'A',status:'todo',due_at:null},{id:'b',status:'done'}]).map(x=>x.id), ['task:a'])
})
test('A linked pending task prevents a missing-follow-up deal alert', () => {
  const deal={id:'d',title:'D',status:'open'}
  assert.equal(run([], [deal]).length,1)
  assert.equal(run([{id:'t',title:'T',status:'todo',deal_id:'d'}],[deal]).filter(x=>x.category==='deals').length,0)
  assert.equal(run([{id:'t',status:'done',deal_id:'d'}],[deal]).filter(x=>x.category==='deals').length,1)
  assert.equal(run([], [{...deal,status:'won'}]).length,0)
})
test('One contact alert combines reasons and excludes lost contacts', () => {
  const contact={id:'c',first_name:'Test',status:'lead',tags:['à-confirmer']}
  const actions=run([],[],[contact])
  assert.equal(actions.length,1);assert.match(actions[0].detail,/Coordonnées/);assert.match(actions[0].detail,/confirmer/)
  assert.equal(run([],[],[{...contact,status:'lost'}]).length,0)
})
test('Contact follow-up can be linked through its deal', () => {
  assert.equal(run([{id:'t',title:'T',status:'todo',deal_id:'d'}],[{id:'d',status:'open',contact_id:'c'}],[{id:'c',status:'prospect',email:'test@example.com'}]).filter(x=>x.category==='contacts').length,0)
})
test('Renewal alerts include overdue and paused but exclude distant and cancelled records', () => {
  const rows=[{id:'overdue',status:'active',renewal_date:'2026-09-01'},{id:'soon',status:'active',end_date:'2026-09-20'},{id:'later',status:'active',renewal_date:'2027-01-01'},{id:'paused',status:'paused'},{id:'cancelled',status:'cancelled',renewal_date:'2026-09-13'}]
  assert.deepEqual(run([],[],[],rows).map(x=>x.id),['project:overdue','project:soon','project:paused'])
})
test('English copy, responsible owner and linked task draft are preserved', () => {
  const [x]=run([],[{id:'d',title:'Deal',status:'open',owner_id:'owner',company_id:'company'}],[],[],'en')
  assert.equal(x.owner,'owner');assert.equal(x.draft.deal_id,'d');assert.match(x.detail,/Open deal/)
})

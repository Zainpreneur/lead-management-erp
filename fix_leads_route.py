p = 'src/app/api/leads/route.ts'
s = open(p).read()

# Fix duplicate imports
s = s.replace(
    "import { createTask } from '@/lib/server/tasks';\nimport { logAudit } from '@/lib/server/audit';\nimport { createTask } from '@/lib/server/tasks';\nimport { logAudit } from '@/lib/server/audit';\nimport { createTask } from '@/lib/server/tasks';\nimport { logAudit } from '@/lib/server/audit';",
    "import { createTask } from '@/lib/server/tasks';\nimport { logAudit } from '@/lib/server/audit';"
)

# Fix missing await
old = """    try {
      createTask({ title: `Follow up: ${lead.name}`, relatedType: 'lead', relatedReference: lead.reference, priority: 'medium' });
      logAudit('lead', lead.reference, 'created', `Lead ${lead.name} created`);
    } catch (e) { console.error(e); }"""
new = """    try {
      await createTask({ title: `Follow up: ${lead.name}`, relatedType: 'lead', relatedReference: lead.reference, priority: 'medium' });
      await logAudit('lead', lead.reference, 'created', `Lead ${lead.name} created`);
    } catch (e) { console.error(e); }"""
s = s.replace(old, new)

open(p, 'w').write(s)
print('done')
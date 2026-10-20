import { getPayload } from 'payload'
import config from '../src/payload.config'
import { cms } from '../src/cms.config'
import type { Page } from '../src/payload-types'

const payload = await getPayload({ config })
const richText = (text: string) => ({
  root: {
    type: 'root',
    version: 1,
    format: '' as const,
    indent: 0,
    direction: 'ltr' as const,
    children: [
      {
        type: 'paragraph',
        version: 1,
        format: '',
        indent: 0,
        direction: 'ltr',
        children: [
          { type: 'text', version: 1, text, format: 0, detail: 0, mode: 'normal', style: '' },
        ],
      },
    ],
  },
})

// Nested localized fields need stable row IDs across locales.
function preserveIDs(original: unknown, translation: unknown): unknown {
  if (Array.isArray(translation))
    return translation.map((item, i) =>
      preserveIDs(Array.isArray(original) ? original[i] : undefined, item),
    )
  if (translation && typeof translation === 'object') {
    const source = (original || {}) as Record<string, unknown>
    return Object.fromEntries([
      ...(source.id ? [['id', source.id]] : []),
      ...Object.entries(translation).map(([key, value]) => [key, preserveIDs(source[key], value)]),
    ])
  }
  return translation
}

async function seedPage(
  slug: string,
  en: { title: string; layout: Page['layout'] },
  ar: { title: string; layout: Page['layout'] },
) {
  const exists = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  if (exists.totalDocs) return
  const page = await payload.create({
    collection: 'pages',
    locale: 'en',
    data: { slug, ...en, _status: 'published' },
  })
  await payload.update({
    collection: 'pages',
    id: page.id,
    locale: 'ar',
    data: {
      ...ar,
      layout: preserveIDs(page.layout, ar.layout) as Page['layout'],
      _status: 'published',
    },
  })
}

try {
  // Fictional starter content only. No accounts, passwords or client assets are seeded.
  await seedPage(
    'home',
    {
      title: 'Home',
      layout: [
        {
          blockType: 'hero',
          eyebrow: 'A FOUNDATION FOR WHAT COMES NEXT',
          heading: 'Good things grow from common ground.',
          description:
            'A thoughtful starting point for your next website. Bring your story, your people, and your ideas. Make this space your own.',
          links: [
            { label: 'Discover our approach', href: '/about' },
            { label: 'Get in touch', href: '/contact' },
          ],
        },
        {
          blockType: 'featureGrid',
          heading: 'A little structure. A lot of possibility.',
          items: [
            {
              title: 'Your story, clearly told.',
              description:
                'Build pages from purposeful sections. Give every idea the space and structure it deserves.',
            },
            {
              title: 'Made for your audience.',
              description:
                'Share your content in English and Arabic, with a natural experience in both directions.',
            },
            {
              title: 'Room to keep growing.',
              description:
                'Start with the essentials. Add services, projects, companies, and people as your website evolves.',
            },
          ],
        },
        {
          blockType: 'callToAction',
          heading: 'Every great website starts with a conversation.',
          description: 'Tell your audience how to take the next step.',
          link: { label: 'Let’s talk', href: '/contact' },
        },
      ],
    },
    {
      title: 'الرئيسية',
      layout: [
        {
          blockType: 'hero',
          eyebrow: 'أساس لما يأتي بعد',
          heading: 'البدايات المشتركة تصنع فرصاً جديدة.',
          description:
            'نقطة انطلاق مدروسة لموقعك القادم. أضف قصتك وفريقك وأفكارك، واجعل هذه المساحة تعبّر عنك.',
          links: [
            { label: 'تعرّف على نهجنا', href: '/about' },
            { label: 'تواصل معنا', href: '/contact' },
          ],
        },
        {
          blockType: 'featureGrid',
          heading: 'هيكل واضح. وإمكانات واسعة.',
          items: [
            {
              title: 'قصتك بوضوح.',
              description: 'ابنِ صفحاتك من أقسام مرنة وامنح كل فكرة المساحة المناسبة.',
            },
            {
              title: 'مصمم لجمهورك.',
              description: 'شارك محتواك بالعربية والإنجليزية مع تجربة طبيعية في كلا الاتجاهين.',
            },
            {
              title: 'مساحة للنمو.',
              description:
                'ابدأ بالأساسيات وأضف الخدمات والمشاريع والشركات وفريق العمل مع تطور موقعك.',
            },
          ],
        },
        {
          blockType: 'callToAction',
          heading: 'كل موقع مميز يبدأ بحوار.',
          description: 'وضّح لجمهورك كيف يتخذ الخطوة التالية.',
          link: { label: 'لنتحدث', href: '/contact' },
        },
      ],
    },
  )
  await seedPage(
    'about',
    {
      title: 'About',
      layout: [
        {
          blockType: 'hero',
          eyebrow: 'OUR APPROACH',
          heading: 'Built on ideas. Shaped by people.',
          description:
            'This is your space to share what you believe, what you do, and why it matters.',
        },
        {
          blockType: 'richContent',
          content: richText(
            'Replace this example with your company’s story. The CMS keeps your content separate from the design, so your website can evolve without starting again.',
          ),
        },
      ],
    },
    {
      title: 'من نحن',
      layout: [
        {
          blockType: 'hero',
          eyebrow: 'نهجنا',
          heading: 'تبدأ بالأفكار. وتتطور بالناس.',
          description: 'هذه مساحتك لمشاركة رؤيتك وما تقدمه ولماذا يهم جمهورك.',
        },
        {
          blockType: 'richContent',
          content: richText(
            'استبدل هذا المثال بقصة شركتك. يفصل نظام الإدارة المحتوى عن التصميم، حتى يتطور موقعك دون الحاجة إلى البدء من جديد.',
          ),
        },
      ],
    },
  )
  await seedPage(
    'contact',
    {
      title: 'Contact',
      layout: [
        {
          blockType: 'hero',
          eyebrow: 'START A CONVERSATION',
          heading: 'Let’s make something meaningful.',
          description:
            'Add your real contact information in Site settings. This starter uses example details until you replace them.',
          links: [{ label: 'Email us', href: 'mailto:hello@example.com' }],
        },
      ],
    },
    {
      title: 'تواصل معنا',
      layout: [
        {
          blockType: 'hero',
          eyebrow: 'لنبدأ حواراً',
          heading: 'لنصنع شيئاً ذا قيمة.',
          description:
            'أضف بيانات الاتصال الفعلية في إعدادات الموقع. يستخدم هذا النموذج بيانات تجريبية إلى أن تستبدلها.',
          links: [{ label: 'راسلنا', href: 'mailto:hello@example.com' }],
        },
      ],
    },
  )
  const nav = await payload.findGlobal({ slug: 'navigation' })
  if (!nav.main?.length) {
    const saved = await payload.updateGlobal({
      slug: 'navigation',
      locale: 'en',
      data: {
        main: [
          { label: 'About', href: '/about' },
          { label: 'Insights', href: '/insights' },
          { label: 'Contact', href: '/contact' },
        ],
        footer: [
          { label: 'About', href: '/about' },
          { label: 'Contact', href: '/contact' },
        ],
      },
    })
    await payload.updateGlobal({
      slug: 'navigation',
      locale: 'ar',
      data: {
        main: preserveIDs(saved.main, [
          { label: 'من نحن', href: '/about' },
          { label: 'المقالات', href: '/insights' },
          { label: 'تواصل معنا', href: '/contact' },
        ]) as typeof saved.main,
        footer: preserveIDs(saved.footer, [
          { label: 'من نحن', href: '/about' },
          { label: 'تواصل معنا', href: '/contact' },
        ]) as typeof saved.footer,
      },
    })
  }
  const settings = await payload.findGlobal({ slug: 'site-settings' })
  if (!settings.tagline && settings.siteName === 'Common') {
    await payload.updateGlobal({
      slug: 'site-settings',
      locale: 'en',
      data: {
        siteName: 'Common',
        tagline: 'A shared foundation. A website of your own.',
        email: 'hello@example.com',
        defaultDescription: 'A bilingual website built on Common CMS.',
      },
    })
    await payload.updateGlobal({
      slug: 'site-settings',
      locale: 'ar',
      data: {
        siteName: 'كومِن',
        tagline: 'أساس مشترك. وموقع يعبّر عنك.',
        defaultDescription: 'موقع ثنائي اللغة مبني على نظام كومِن لإدارة المحتوى.',
      },
    })
  }
  for (const collection of ['services', 'projects', 'companies', 'team'] as const) {
    if (!cms.modules[collection]) continue
    const exists = await payload.find({
      collection,
      where: { slug: { equals: 'example' } },
      limit: 1,
    })
    if (!exists.totalDocs)
      await payload.create({
        collection,
        draft: true,
        data: {
          title: `Example ${collection === 'team' ? 'team member' : collection.slice(0, -1)}`,
          slug: 'example',
          summary: 'Replace this draft with your own content before publishing.',
          ...(collection === 'team' ? { position: 'Example role' } : {}),
          _status: 'draft',
        },
      })
  }
  console.log(
    'Starter content is ready. Existing entries were preserved. No user accounts were created.',
  )
} finally {
  await payload.destroy()
}

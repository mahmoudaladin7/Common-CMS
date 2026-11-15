import type { CollectionConfig } from 'payload'
import { contentAccess } from '@/access'
import { seoField, slugField, titleField } from '@/fields'

const permalink = slugField()
export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: {
    singular: { en: 'Blog post', ar: 'مقالة' },
    plural: { en: 'Blog posts', ar: 'المدونة' },
  },
  admin: {
    useAsTitle: 'title',
    group: { en: 'Content', ar: 'المحتوى' },
    defaultColumns: ['title', '_status', 'authorName', 'publishedAt'],
    description: {
      en: 'Changes save automatically as private drafts. Preview the post on your website, then publish when ready.',
      ar: 'تُحفظ التعديلات تلقائياً كمسودات خاصة. عاين المقالة على موقعك ثم انشرها عندما تكون جاهزة.',
    },
    components: {
      beforeList: ['/components/admin/WorkspaceGuides#BlogGuide'],
    },
    preview: (doc, { locale }) => `/preview?collection=posts&id=${doc.id}&locale=${locale}`,
    hideAPIURL: true,
  },
  access: contentAccess,
  versions: { drafts: { autosave: { interval: 1500 } }, maxPerDoc: 30 },
  fields: [
    {
      ...permalink,
      label: { en: 'URL address', ar: 'عنوان الرابط' },
      admin: {
        ...permalink.admin,
        description: {
          en: 'Generated from the title when first saved. Keep it unchanged after sharing the post.',
          ar: 'يُنشأ من العنوان عند الحفظ الأول. يُفضّل عدم تغييره بعد مشاركة المقالة.',
        },
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: { en: 'Write your story', ar: 'اكتب مقالتك' },
          fields: [
            { ...titleField, label: { en: 'Post title', ar: 'عنوان المقالة' } },
            {
              name: 'excerpt',
              label: { en: 'Short introduction', ar: 'مقدمة قصيرة' },
              type: 'textarea',
              localized: true,
              required: true,
              admin: {
                description: {
                  en: 'A short summary shown on the blog listing.',
                  ar: 'ملخص قصير يظهر في قائمة المقالات.',
                },
              },
            },
            {
              name: 'image',
              label: { en: 'Cover image', ar: 'صورة الغلاف' },
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: {
                  en: 'Choose or upload an image from this website’s media library.',
                  ar: 'اختر صورة أو ارفعها إلى مكتبة وسائط هذا الموقع.',
                },
              },
            },
            {
              name: 'content',
              label: { en: 'Your story', ar: 'نص المقالة' },
              type: 'richText',
              localized: true,
              required: true,
            },
          ],
        },
        {
          label: { en: 'Post details', ar: 'تفاصيل المقالة' },
          fields: [
            {
              name: 'category',
              label: { en: 'Category', ar: 'التصنيف' },
              type: 'text',
              localized: true,
            },
            {
              name: 'authorName',
              label: { en: 'Public author name', ar: 'اسم الكاتب الظاهر للزوار' },
              type: 'text',
              localized: true,
              admin: {
                description: {
                  en: 'Shown publicly. This does not expose the writer’s private account.',
                  ar: 'اسم يظهر للزوار دون كشف بيانات الحساب الخاصة.',
                },
              },
            },
            {
              name: 'publishedAt',
              label: { en: 'Publication date', ar: 'تاريخ النشر' },
              type: 'date',
              admin: {
                description: {
                  en: 'Set automatically on first publication. This field does not schedule publication.',
                  ar: 'يُحدد عند النشر الأول. هذا الحقل لا يقوم بجدولة النشر.',
                },
              },
            },
          ],
        },
        { label: { en: 'Search & sharing', ar: 'البحث والمشاركة' }, fields: [seoField] },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, originalDoc, req, operation }) => {
        if (operation === 'create' && !data.authorName && req.user?.name)
          data.authorName = req.user.name
        if (data._status === 'published' && !data.publishedAt)
          data.publishedAt = originalDoc?.publishedAt || new Date().toISOString()
        return data
      },
    ],
  },
}

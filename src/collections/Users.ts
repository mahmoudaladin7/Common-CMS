import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { adminField, adminOnly, adminOrSelf } from '@/access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'name',
    group: 'Workspace',
    defaultColumns: ['name', 'email', 'role', 'disabled'],
    description: {
      en: 'Create an account, assign websites and choose a role for each. Suspend access when someone leaves.',
      ar: 'أنشئ حساباً ثم حدد المواقع ودور المستخدم في كل موقع. أوقف الوصول عند مغادرة الموظف.',
    },
    components: { beforeList: ['/components/admin/WorkspaceGuides#AccountsGuide'] },
  },
  auth: {
    useSessions: true,
    tokenExpiration: 60 * 60 * 2,
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    cookies: { secure: process.env.NODE_ENV === 'production', sameSite: 'Lax' },
  },
  access: {
    admin: ({ req }) => Boolean(req.user && !req.user.disabled),
    create: adminOnly,
    read: adminOrSelf,
    update: adminOrSelf,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'tenants',
      type: 'array',
      saveToJWT: true,
      label: { en: 'Website access', ar: 'صلاحيات المواقع' },
      labels: {
        singular: { en: 'Website assignment', ar: 'صلاحية موقع' },
        plural: { en: 'Website assignments', ar: 'صلاحيات المواقع' },
      },
      access: { create: adminField, update: adminField },
      admin: {
        description: {
          en: 'Assign websites and a role for each. Editors can write and publish; viewers can only review. Only Super Admins can change these assignments.',
          ar: 'حدد المواقع ودور المستخدم في كل منها. المحرر يكتب وينشر والمشاهد يراجع فقط. مدير المنصة وحده يعدل هذه الصلاحيات.',
        },
      },
      fields: [
        {
          name: 'tenant',
          type: 'relationship',
          relationTo: 'websites',
          required: true,
          saveToJWT: true,
          label: { en: 'Website', ar: 'الموقع' },
        },
        {
          name: 'role',
          type: 'select',
          required: true,
          saveToJWT: true,
          defaultValue: 'viewer',
          label: { en: 'Permission', ar: 'الصلاحية' },
          options: [
            {
              label: {
                en: 'Website Admin — content, media and settings',
                ar: 'مدير الموقع — المحتوى والوسائط والإعدادات',
              },
              value: 'admin',
            },
            {
              label: { en: 'Editor — write and publish', ar: 'محرر — الكتابة والنشر' },
              value: 'editor',
            },
            {
              label: {
                en: 'Viewer — review and preview only',
                ar: 'مشاهد — المراجعة والمعاينة فقط',
              },
              value: 'viewer',
            },
          ],
        },
      ],
    },
    { name: 'name', type: 'text', required: true, label: { en: 'Full name', ar: 'الاسم الكامل' } },
    {
      name: 'disabled',
      type: 'checkbox',
      defaultValue: false,
      label: { en: 'Suspend account', ar: 'إيقاف الحساب' },
      access: { create: adminField, update: adminField },
      admin: {
        position: 'sidebar',
        description: {
          en: 'Stops new sign-ins and ends existing sessions. Clear to allow signing in again.',
          ar: 'يمنع تسجيل الدخول وينهي الجلسات الحالية. ألغِ التحديد للسماح بالدخول مجدداً.',
        },
      },
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'viewer',
      saveToJWT: true,
      label: 'Platform role',
      admin: {
        description: 'Website permissions come from the website memberships below.',
        condition: (_data, _siblingData, { user }) => Boolean(user),
      },
      access: { create: adminField, update: adminField },
      options: [
        { label: 'Super Admin', value: 'admin' },
        { label: 'Member (legacy editor)', value: 'editor' },
        { label: 'Member', value: 'viewer' },
      ],
    },
  ],
  hooks: {
    beforeLogin: [
      ({ user }) => {
        if (user.disabled)
          throw new APIError('Sign-in unavailable. Contact your administrator.', 401)
        return user
      },
    ],
    beforeChange: [
      async ({ operation, data, req, originalDoc }) => {
        // Payload's first-user registration bypasses collection create access.
        // Grant admin only while the database is empty, never from form input.
        if (operation === 'create') {
          const { totalDocs } = await req.payload.count({
            collection: 'users',
            req,
            overrideAccess: true,
          })
          if (totalDocs === 0) data.role = 'admin'
        }
        if (data.disabled === true) data.sessions = []
        if (Array.isArray(data.tenants)) {
          const ids = data.tenants.map((row: { tenant: number | { id: number } }) =>
            typeof row.tenant === 'object' ? row.tenant.id : row.tenant,
          )
          if (new Set(ids).size !== ids.length)
            throw new APIError('Assign each website only once.', 400)
        }
        if (
          operation === 'update' &&
          originalDoc.role === 'admin' &&
          !originalDoc.disabled &&
          ((data.role && data.role !== 'admin') || data.disabled === true)
        ) {
          const { totalDocs } = await req.payload.count({
            collection: 'users',
            where: { and: [{ role: { equals: 'admin' } }, { disabled: { not_equals: true } }] },
            req,
            overrideAccess: true,
          })
          if (totalDocs <= 1)
            throw new APIError('Keep at least one administrator in this workspace.', 400)
        }
        return data
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        const user = await req.payload.findByID({
          collection: 'users',
          id,
          req,
          overrideAccess: true,
        })
        if (user.role === 'admin' && !user.disabled) {
          const { totalDocs } = await req.payload.count({
            collection: 'users',
            where: { and: [{ role: { equals: 'admin' } }, { disabled: { not_equals: true } }] },
            req,
            overrideAccess: true,
          })
          if (totalDocs <= 1) throw new APIError('The last administrator cannot be deleted.', 400)
        }
      },
    ],
  },
}

# Editor guide

## First visit

Open `/admin`. On a fresh database, create the first administrator. Administrators
can then create editors and viewers under **Users**. Each person should have a
separate account.

| Role          | Can do                                                                              |
| ------------- | ----------------------------------------------------------------------------------- |
| Administrator | Manage content, delete entries, manage users and roles, update site settings        |
| Editor        | Create, edit and publish content; upload media; update navigation; edit own account |
| Viewer        | Read published content and drafts; preview; edit own account                        |

Only administrators can delete content or media. Editors and viewers cannot
change their role or inspect other users' accounts.

## Create a page

1. Open **Pages → Create new**.
2. Enter the internal page title and a unique slug. Use `home` for the homepage.
3. Add layout blocks and reorder them.
4. Choose English or Arabic and enter that language's text.
5. Save a draft and use **Preview** while signed in.
6. Publish when ready.

Page and article autosave protects work in progress. Saving a new draft does
not replace the currently published version. Use the versions interface to
review or restore earlier content. Publishing status is shared across locales.

## Images and files

Upload JPEG, PNG, WebP, AVIF or PDF files up to 10 MB. Add useful alternative text
in both languages. The library is public: only upload website assets, never
private files. Images receive thumbnail and large variants automatically.

Deleting a media asset can break pages that reference it. Check relationships
and replace uses before deleting.

## Navigation and settings

**Navigation** controls menu labels and addresses. Use `/about` for local pages;
the example website adds the current language prefix. Use a complete `https://`
address for an external website.

**Site settings** holds the public name, logo, contact details, social links and
SEO defaults. Menu and settings changes take effect immediately and keep a
version history.

## Optional content

Services, companies, projects and team members have their own structured forms.
Publish them to make them eligible for a content-collection block. A new entry
does not automatically create a menu item.

## Password recovery

Password reset email needs SMTP configuration by the site operator. Before email
is configured, a logged-in administrator can update another user's password.
Never reuse example credentials across installations.

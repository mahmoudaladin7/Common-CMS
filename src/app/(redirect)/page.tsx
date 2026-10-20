import { redirect } from 'next/navigation'
import { cms } from '@/cms.config'
export default function Page() {
  redirect(`/${cms.defaultLocale}`)
}

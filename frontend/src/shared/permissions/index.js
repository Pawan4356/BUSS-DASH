// UX only: hides actions an account's role can't perform. The API is what
// actually rejects the write (403 reason: 'insufficient-role').
import { useSelector } from 'react-redux'
import { selectAuth } from '../../app/authSlice'
import { canManageModule } from './rolesMap'

export { MODULE_MANAGER_ROLES, canManageModule } from './rolesMap'

export function useCanManage(flagKey) {
  const { account } = useSelector(selectAuth)
  return canManageModule(account?.role, flagKey)
}
